(function installTaoyuanAuth() {
  "use strict";

  const LEGACY_SAVE_KEY = "taoyuan-qunying-v2";
  const GUEST_STATE_KEY = "taoyuan-guest-profile-v2";
  const PENDING_MIGRATION_KEY = "taoyuan-cloud-migration-key";
  const state = {
    user: null,
    guest: readGuest(),
    configured: false,
    ready: false,
    listeners: new Set()
  };
  let resolveReady;
  const ready = new Promise((resolve) => { resolveReady = resolve; });

  function readGuest() {
    try {
      const guest = JSON.parse(localStorage.getItem(GUEST_STATE_KEY) || "null");
      if (guest && typeof guest.id === "string" && typeof guest.displayName === "string") return guest;
    } catch { /* fall through to no guest session */ }
    return null;
  }

  function saveGuest(guest) {
    state.guest = guest;
    if (guest) localStorage.setItem(GUEST_STATE_KEY, JSON.stringify(guest));
    else localStorage.removeItem(GUEST_STATE_KEY);
  }

  function firebaseConfig() {
    return window.TAOYUAN_FIREBASE_CONFIG || {};
  }

  function hasFirebaseConfig() {
    const config = firebaseConfig();
    return ["apiKey", "authDomain", "projectId", "messagingSenderId", "appId"]
      .every((key) => typeof config[key] === "string" && config[key].trim() && !config[key].includes("REPLACE_WITH"));
  }

  function activeUser() {
    if (state.user) {
      return {
        id: state.user.uid,
        uid: state.user.uid,
        username: state.user.displayName || state.user.email || "Google 玩家",
        displayName: state.user.displayName || "",
        email: state.user.email || "",
        photoURL: state.user.photoURL || "",
        provider: "google",
        guest: false
      };
    }
    return state.guest ? { ...state.guest, provider: "guest", guest: true } : null;
  }

  function getSaveKey() {
    if (state.user?.uid) return "taoyuan-cloud-save-" + state.user.uid;
    if (state.guest?.id) return "taoyuan-guest-save-" + state.guest.id;
    return LEGACY_SAVE_KEY;
  }

  function getMigrationSaveKey() {
    const pending = localStorage.getItem(PENDING_MIGRATION_KEY);
    if (pending && pending !== getSaveKey()) return pending;
    if (state.user) return localStorage.getItem(LEGACY_SAVE_KEY) ? LEGACY_SAVE_KEY : null;
    return null;
  }

  function setMigrationKey(key) {
    if (key && key !== getSaveKey()) localStorage.setItem(PENDING_MIGRATION_KEY, key);
  }

  function clearMigrationKey() {
    localStorage.removeItem(PENDING_MIGRATION_KEY);
  }

  function setMessage(message, type = "error") {
    const element = document.getElementById("authMessage");
    if (!element) return;
    element.textContent = message;
    element.className = "auth-message " + type;
  }

  function updateUI() {
    const screen = document.getElementById("authScreen");
    const googleButton = document.getElementById("googleLoginButton");
    const configNote = document.getElementById("authConfigNote");
    const closeButton = document.getElementById("authClose");
    const user = activeUser();
    if (screen) screen.hidden = Boolean(user);
    if (closeButton) closeButton.hidden = !user;
    if (googleButton) googleButton.disabled = !state.configured;
    if (configNote) {
      configNote.hidden = state.configured;
      configNote.textContent = "尚未設定 Firebase 專案；目前只能使用訪客本機存檔。";
    }
  }

  function notify() {
    updateUI();
    const user = activeUser();
    state.listeners.forEach((listener) => {
      try { listener(user); } catch (error) { console.error("Auth listener failed", error); }
    });
  }

  function isCancelled(error) {
    const code = String(error?.code || error?.errorCode || "").toLowerCase();
    return code === "auth/popup-closed-by-user"
      || code === "auth/cancelled-popup-request"
      || code === "auth/user-cancelled"
      || code.includes("cancel");
  }

  async function googleLogin() {
    if (!state.configured || !window.fbAuth || !window.firebase) {
      setMessage("Google 登入尚未設定，請先完成 Firebase 專案設定。", "error");
      return false;
    }
    window.TaoyuanGameState?.persist?.();
    setMigrationKey(getSaveKey());
    const nativePlugin = window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.NativeGoogleAuth;
    try {
      if (nativePlugin) {
        const result = await window.Capacitor.Plugins.NativeGoogleAuth.signIn();
        if (!result?.idToken) throw new Error("Google 沒有回傳登入憑證");
        const credential = window.firebase.auth.GoogleAuthProvider.credential(result.idToken);
        await window.fbAuth.signInWithCredential(credential);
      } else {
        const provider = new window.firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        try {
          await window.fbAuth.signInWithPopup(provider);
        } catch (error) {
          if (error?.code !== "auth/popup-blocked") throw error;
          await window.fbAuth.signInWithRedirect(provider);
          return true;
        }
      }
      setMessage("Google 登入成功，正在載入雲端軍府…", "success");
      window.location.reload();
      return true;
    } catch (error) {
      if (!isCancelled(error)) {
        console.error("Google 登入失敗", error);
        setMessage("Google 登入失敗：" + (error?.message || "請稍後再試"), "error");
      }
      return false;
    }
  }

  async function logout() {
    try {
      window.TaoyuanGameState?.persist?.();
      if (window.TaoyuanCloud?.uploadNow && state.user) await window.TaoyuanCloud.uploadNow();
      if (window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.NativeGoogleAuth) {
        try { await window.Capacitor.Plugins.NativeGoogleAuth.signOut(); } catch (error) { console.warn("Native Google 登出失敗", error); }
      }
      if (window.fbAuth) await window.fbAuth.signOut();
    } catch (error) {
      console.error("登出失敗", error);
      setMessage("登出失敗：" + (error?.message || "請稍後再試"), "error");
      return false;
    }
    saveGuest(null);
    localStorage.removeItem(PENDING_MIGRATION_KEY);
    window.location.reload();
    return true;
  }

  function guestLogin() {
    if (!state.guest) {
      const number = String(Date.now()).slice(-6);
      saveGuest({
        id: "guest-" + Date.now().toString(36),
        displayName: "訪客" + number,
        createdAt: Date.now()
      });
    }
    window.location.reload();
  }

  function open() {
    const screen = document.getElementById("authScreen");
    if (!screen) return;
    screen.hidden = false;
    document.getElementById("googleLoginButton")?.focus();
  }

  function close() {
    if (!activeUser()) return;
    const screen = document.getElementById("authScreen");
    if (screen) screen.hidden = true;
  }

  function render() {
    document.getElementById("googleLoginButton")?.addEventListener("click", googleLogin);
    document.getElementById("authGuest")?.addEventListener("click", guestLogin);
    document.getElementById("authClose")?.addEventListener("click", close);
    updateUI();
    if (!state.configured) setMessage("請使用 Google 登入以啟用雲端存檔，或先以訪客試玩。", "info");
  }

  function initializeFirebase() {
    if (!hasFirebaseConfig() || !window.firebase) {
      state.configured = false;
      state.ready = true;
      resolveReady(null);
      return;
    }
    try {
      if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig());
      window.fbAuth = window.firebase.auth();
      window.fbDb = window.firebase.firestore();
      state.configured = true;
      window.fbAuth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL).catch((error) => {
        console.warn("Firebase Auth persistence unavailable", error);
      });
      window.fbAuth.onAuthStateChanged((user) => {
        state.user = user || null;
        if (state.user) saveGuest(null);
        state.ready = true;
        notify();
        resolveReady(state.user);
      });
    } catch (error) {
      console.error("Firebase 初始化失敗", error);
      state.configured = false;
      state.ready = true;
      resolveReady(null);
    }
  }

  const api = {
    ready,
    getSaveKey,
    getMigrationSaveKey,
    clearMigrationKey,
    getActiveUser: activeUser,
    getFirebaseUser: () => state.user,
    isAuthenticated: () => Boolean(activeUser()),
    isCloudAuthenticated: () => Boolean(state.user),
    isConfigured: () => state.configured,
    getAccountCount: () => (state.user || state.guest ? 1 : 0),
    onStateChange: (listener) => {
      if (typeof listener !== "function") return () => {};
      state.listeners.add(listener);
      if (state.ready) queueMicrotask(() => listener(activeUser()));
      return () => state.listeners.delete(listener);
    },
    open,
    close,
    googleLogin,
    guestLogin,
    logout
  };
  window.TaoyuanAuth = Object.freeze(api);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
  else render();
  initializeFirebase();
}());