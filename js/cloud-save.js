(function installTaoyuanCloudSave() {
  "use strict";

  const COLLECTION_NAME = "taoyuan_qunying_saves";
  const MAX_SAVE_BYTES = 900000;
  const LEGACY_SAVE_KEY = "taoyuan-qunying-v2";
  const state = {
    initialized: false,
    uid: null,
    user: null,
    syncTimer: 0,
    syncing: false,
    syncingUid: null,
    status: "offline",
    statusText: "尚未連線",
    lastSyncAt: 0
  };

  function authApi() {
    return window.TaoyuanAuth || null;
  }

  function gameApi() {
    return window.TaoyuanGameState || null;
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function clone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return null;
    }
  }

  function validSave(value) {
    if (!isObject(value)) return false;
    if (![2, 3].includes(Number(value.version))) return false;
    try {
      return JSON.stringify(value).length <= MAX_SAVE_BYTES;
    } catch {
      return false;
    }
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function safeJson(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return validSave(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function hasMeaningfulProgress(save) {
    if (!isObject(save)) return false;
    return number(save.stage, 1) > 1
      || number(save.maxStage, 1) > 1
      || number(save.stats?.wins) > 0
      || number(save.stats?.kills) > 0
      || number(save.gold, 860) !== 860
      || number(save.food, 320) !== 320
      || number(save.jade, 12) !== 12
      || (Array.isArray(save.achievementClaimed) && save.achievementClaimed.length > 0);
  }

  function maxMap(localMap = {}, cloudMap = {}) {
    const merged = { ...(isObject(localMap) ? localMap : {}) };
    Object.entries(isObject(cloudMap) ? cloudMap : {}).forEach(([key, value]) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        merged[key] = Math.max(number(merged[key]), value);
      } else if (merged[key] === undefined) {
        merged[key] = value;
      }
    });
    return merged;
  }

  function union(localValues, cloudValues) {
    return Array.from(new Set([
      ...(Array.isArray(localValues) ? localValues : []),
      ...(Array.isArray(cloudValues) ? cloudValues : [])
    ]));
  }

  // Consumable balances follow the newest snapshot; unlocks and records use
  // high-water merges so a second device does not erase permanent progress.
  function mergeSave(localSave, cloudSave) {
    const local = validSave(localSave) ? localSave : {};
    const cloud = validSave(cloudSave) ? cloudSave : {};
    const localUpdated = number(local.lastUpdatedAt);
    const cloudUpdated = number(cloud.lastUpdatedAt);
    const newest = cloudUpdated > localUpdated ? cloud : local;
    const older = newest === cloud ? local : cloud;
    const merged = { ...older, ...newest };

    ["stage", "maxStage", "level", "exp"].forEach((key) => {
      if (key === "exp") return;
      merged[key] = Math.max(number(local[key]), number(cloud[key]));
    });
    merged.stats = { ...(isObject(older.stats) ? older.stats : {}), ...(isObject(newest.stats) ? newest.stats : {}) };
    ["battles", "wins", "losses", "kills", "skills", "bosses", "highestCombo"].forEach((key) => {
      merged.stats[key] = Math.max(number(local.stats?.[key]), number(cloud.stats?.[key]));
    });
    merged.heroLevels = maxMap(local.heroLevels, cloud.heroLevels);
    merged.skillLevels = maxMap(local.skillLevels, cloud.skillLevels);
    merged.stageStars = maxMap(local.stageStars, cloud.stageStars);
    merged.shopPurchases = maxMap(local.shopPurchases, cloud.shopPurchases);
    merged.equipmentRefine = maxMap(local.equipmentRefine, cloud.equipmentRefine);
    merged.achievementClaimed = union(local.achievementClaimed, cloud.achievementClaimed);
    merged.mailClaimed = Boolean(local.mailClaimed || cloud.mailClaimed);
    merged.heroProgress = { ...(isObject(older.heroProgress) ? older.heroProgress : {}), ...(isObject(newest.heroProgress) ? newest.heroProgress : {}) };
    Object.keys({ ...(local.heroProgress || {}), ...(cloud.heroProgress || {}) }).forEach((heroId) => {
      const localHero = isObject(local.heroProgress?.[heroId]) ? local.heroProgress[heroId] : {};
      const cloudHero = isObject(cloud.heroProgress?.[heroId]) ? cloud.heroProgress[heroId] : {};
      merged.heroProgress[heroId] = {
        ...localHero,
        ...cloudHero,
        stars: Math.max(number(localHero.stars, 1), number(cloudHero.stars, 1)),
        breakthrough: Math.max(number(localHero.breakthrough), number(cloudHero.breakthrough)),
        shards: Math.max(number(localHero.shards), number(cloudHero.shards))
      };
    });
    ["arena", "tower", "battlePass"].forEach((key) => {
      merged[key] = { ...(isObject(older[key]) ? older[key] : {}), ...(isObject(newest[key]) ? newest[key] : {}) };
    });
    ["wins", "attempts"].forEach((key) => { merged.arena[key] = Math.max(number(local.arena?.[key]), number(cloud.arena?.[key])); });
    ["floor", "best"].forEach((key) => { merged.tower[key] = Math.max(number(local.tower?.[key]), number(cloud.tower?.[key])); });
    merged.battlePass.xp = Math.max(number(local.battlePass?.xp), number(cloud.battlePass?.xp));
    merged.battlePass.claimed = union(local.battlePass?.claimed, cloud.battlePass?.claimed);
    merged.lastUpdatedAt = Math.max(localUpdated, cloudUpdated);
    return merged;
  }

  function localSave() {
    const api = authApi();
    const key = api?.getSaveKey?.() || LEGACY_SAVE_KEY;
    const runtimeSave = gameApi()?.getSave?.();
    return validSave(runtimeSave) ? runtimeSave : safeJson(key);
  }

  function migrationSave() {
    const api = authApi();
    const key = api?.getMigrationSaveKey?.();
    if (!key || key === api?.getSaveKey?.()) return null;
    return safeJson(key);
  }

  function updateStatus(text, status = "offline") {
    state.statusText = text;
    state.status = status;
    const element = document.getElementById("cloudSaveStatus");
    if (element) {
      element.textContent = text;
      element.className = "cloud-save-status " + status;
    }
  }

  function userLabel(user = state.user) {
    return user?.displayName || user?.email || "Google 玩家";
  }

  function documentRef() {
    if (!state.uid || !window.fbDb) return null;
    return window.fbDb.collection(COLLECTION_NAME).doc(state.uid);
  }

  function serverTimestamp() {
    return window.firebase?.firestore?.FieldValue?.serverTimestamp?.() || null;
  }

  async function uploadToCloud(saveOverride = null) {
    const ref = documentRef();
    if (!ref || state.syncing) return false;
    const save = clone(saveOverride || localSave());
    if (!validSave(save)) {
      updateStatus("存檔格式無效", "error");
      return false;
    }
    state.syncing = true;
    updateStatus("同步中…", "syncing");
    try {
      const timestamp = Date.now();
      save.lastUpdatedAt = Math.max(number(save.lastUpdatedAt), timestamp);
      localStorage.setItem(authApi()?.getSaveKey?.() || LEGACY_SAVE_KEY, JSON.stringify(save));
      const payload = {
        schemaVersion: 1,
        save,
        updatedAt: serverTimestamp(),
        updatedAtClient: timestamp,
        profile: {
          displayName: userLabel(),
          email: state.user?.email || "",
          provider: "google"
        }
      };
      await ref.set(payload, { merge: true });
      state.lastSyncAt = timestamp;
      updateStatus("已同步雲端", "online");
      return true;
    } catch (error) {
      console.error("雲端存檔上傳失敗", error);
      updateStatus("雲端同步失敗", "error");
      return false;
    } finally {
      state.syncing = false;
    }
  }

  async function syncOnStartup() {
    if (!state.uid || state.syncingUid === state.uid) return;
    const syncUid = state.uid;
    state.syncingUid = syncUid;
    updateStatus("讀取雲端存檔…", "syncing");
    try {
      const ref = documentRef();
      if (!ref) return;
      const snapshot = await ref.get();
      if (state.uid !== syncUid) return;
      const data = snapshot.exists ? snapshot.data() : null;
      const cloud = validSave(data?.save) ? data.save : null;
      const local = localSave();
      const migrating = migrationSave();
      const localCandidate = migrating && !hasMeaningfulProgress(local)
        ? migrating
        : migrating ? mergeSave(local, migrating) : local;

      if (cloud) {
        const merged = mergeSave(localCandidate, cloud);
        const game = gameApi();
        if (game?.replaceSave) game.replaceSave(merged);
        localStorage.setItem(authApi()?.getSaveKey?.() || LEGACY_SAVE_KEY, JSON.stringify(merged));
        if (authApi()?.clearMigrationKey) authApi().clearMigrationKey();
        const cloudUpdated = Math.max(number(data.updatedAtClient), number(cloud.lastUpdatedAt));
        const localUpdated = number(localCandidate?.lastUpdatedAt);
        if (localUpdated > cloudUpdated || JSON.stringify(merged) !== JSON.stringify(cloud)) {
          await uploadToCloud(merged);
        } else {
          state.lastSyncAt = Date.now();
          updateStatus("已同步雲端", "online");
        }
} else {
        const game = gameApi();
        if (game?.replaceSave && localCandidate) game.replaceSave(localCandidate);
        localStorage.setItem(authApi()?.getSaveKey?.() || LEGACY_SAVE_KEY, JSON.stringify(localCandidate));
        await uploadToCloud(localCandidate);
        if (authApi()?.clearMigrationKey) authApi().clearMigrationKey();
      }
    } catch (error) {
      console.error("雲端存檔下載失敗", error);
      updateStatus("雲端讀取失敗，保留本機存檔", "error");
    } finally {
      if (state.syncingUid === syncUid) state.syncingUid = null;
    }
  }

  function queueUpload() {
    if (!state.uid) return;
    clearTimeout(state.syncTimer);
    state.syncTimer = setTimeout(() => uploadToCloud(), 1800);
  }

  function handleAuthState(user) {
    const uid = user?.uid || null;
    if (uid === state.uid && user) {
      state.user = user;
      return;
    }
    clearTimeout(state.syncTimer);
    state.syncTimer = 0;
    state.user = user || null;
    state.uid = uid;
    state.syncingUid = null;
    if (user) {
      updateStatus("準備雲端同步…", "syncing");
      syncOnStartup();
    } else {
      updateStatus("訪客本機存檔", "offline");
    }
  }

  function init() {
    if (state.initialized) return;
    state.initialized = true;
    if (!window.fbAuth || !window.fbDb) {
      updateStatus("尚未設定雲端服務", "offline");
      return;
    }
    handleAuthState(window.fbAuth.currentUser || null);
    window.fbAuth.onAuthStateChanged(handleAuthState);
  }

  const api = {
    init,
    queueUpload,
    uploadNow: () => uploadToCloud(),
    syncNow: () => syncOnStartup(),
    getStatusText: () => state.statusText,
    getStatus: () => state.status,
    isCloudReady: () => Boolean(state.uid),
    getLastSyncAt: () => state.lastSyncAt
  };
  window.TaoyuanCloud = Object.freeze(api);
  init();
}());
