/* UI Panels: Lord, Shop, Daily/Tasks, Checkin, BattlePass, Events, Collection, Settings, Settlement & Offline */
"use strict";

function renderLord() {
  const power = currentArmyPower();
  const avatar = AVATAR_FRAMES.find((frame) => frame.id === save.equippedFrame)?.avatar || "avatar-liubei";
  setPanel("主公軍府",
    '<section class="detail-hero">' +
      '<span class="pixel-avatar ' + avatar + ' full"><i></i><span class="portrait-eyes" aria-hidden="true"></span><span class="avatar-detail" aria-hidden="true"></span></span>' +
      '<h3>' + (save.playerName || "劉玄德") + '</h3>' +
      '<span class="hero-role">' + (titleById(save.equippedTitle)?.name || "義勇軍主公") + '</span>' +
      '<p class="hero-power">軍勢 <strong>' + formatNumber(power) + '</strong></p>' +
      '<div class="stat-list"><span>主公等級 <b>' + save.level + '</b></span><span>歷史進度 <b>第 ' + save.stage + ' 關</b></span><span>名將數 <b>' + HEROES.filter(isUnlocked).length + '</b></span><span>陣容人數 <b>' + save.formation.length + '</b></span></div>' +
    '</section>' +
    '<p class="section-caption">軍府方針</p>' +
    '<div class="record-item">不設武將抽取。沿著歷史戰役結識角色，再透過等級、兵種位置、裝備精煉共鳴與戰法構築自己的隊伍。</div>');
}

function taskCardHtml(task, weekly = false) {
  const state = weekly ? save.weekly : save.daily;
  const progress = Math.min(task.target, state.progress[task.id] || 0);
  const claimed = state.claimed.includes(task.id);
  const percent = Math.round(progress / task.target * 100);
  const tag = weekly ? "週" : "日";
  return '<article class="task-card ' + (claimed ? "cleared" : "") + '"><div class="task-badge">' + tag + '</div><div><h3>' + task.title + '</h3><div class="progress-track"><i style="width:' + percent + '%"></i></div><small>' + progress + ' / ' + task.target + '　' + rewardHtml(task.reward, true) + '</small></div><button class="' + (claimed || progress < task.target ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="daily-task-claim" data-task="' + task.id + '"' + (weekly ? ' data-weekly="true"' : '') + (claimed || progress < task.target ? " disabled" : "") + '>' + (claimed ? "已領" : "領取") + '</button></article>';
}

function renderDaily() {
  ensureCycleState();
  const tasks = DAILY_TASKS.map((task) => taskCardHtml(task, false)).join("");
  const weeklyTasks = WEEKLY_TASKS.map((task) => taskCardHtml(task, true)).join("");
  setPanel("日常軍務",
    '<section class="mode-banner"><span class="eyebrow">每日更新</span><h3>今日軍務</h3><p>每日 00:00 自動重置進度與獎勵。</p></section>' +
    '<div class="task-list">' + tasks + '</div>' +
    '<section class="mode-banner" style="margin-top:12px;"><span class="eyebrow">每週更新</span><h3>本週軍務目標</h3><p>每週一 00:00 自動重置。</p></section>' +
    '<div class="task-list">' + weeklyTasks + '</div>');
  $("panelContent").insertAdjacentHTML("beforeend", renderCheckinSection());
}

function renderCheckinSection() {
  const current = save.checkin.day;
  const items = CHECKIN_REWARDS.map((reward, index) => {
    const day = index + 1;
    const claimed = save.checkin.claimed.includes(day);
    const canClaim = day === current + 1 && !claimed;
    return '<article class="checkin-cell ' + (claimed ? "cleared" : canClaim ? "today" : "") + '"><span>第 ' + day + ' 天</span><b>' + rewardHtml(reward, true) + '</b><small>' + (claimed ? "已簽" : canClaim ? "今日" : "待領") + '</small></article>';
  }).join("");
  const canClaimToday = current < 7 && !save.checkin.claimed.includes(current + 1);
  return '<p class="section-caption">七日簽到</p><div class="checkin-grid">' + items + '</div><button class="seal-button wide-button" type="button" data-action="checkin-claim"' + (canClaimToday ? "" : " disabled") + '>' + (canClaimToday ? "領取今日簽到軍資" : "今日簽到已完成") + '</button>';
}

function claimTask(taskId, isWeekly = false) {
  ensureCycleState();
  const list = isWeekly ? WEEKLY_TASKS : DAILY_TASKS;
  const state = isWeekly ? save.weekly : save.daily;
  const task = list.find((item) => item.id === taskId);
  if (!task || state.claimed.includes(task.id) || (state.progress[task.id] || 0) < task.target) return;
  state.claimed.push(task.id);
  awardResources(task.reward);
  save.battlePass.xp = (save.battlePass.xp || 0) + (isWeekly ? 5 : 2);
  persist();
  updateHud();
  renderDaily();
  window.TaoyuanAudio?.sfx?.("reward");
  toast("已領取「" + task.title + "」軍資");
}

function claimCheckin() {
  ensureCycleState();
  const nextDay = save.checkin.day + 1;
  if (nextDay > 7 || save.checkin.claimed.includes(nextDay)) return toast("今日已完成簽到");
  save.checkin.day = nextDay;
  save.checkin.claimed.push(nextDay);
  save.checkin.date = localDateKey();
  const reward = CHECKIN_REWARDS[nextDay - 1];
  awardResources(reward);
  recordTaskProgress("daily-checkin");
  persist();
  updateHud();
  renderDaily();
  window.TaoyuanAudio?.sfx?.("reward");
  toast("第 " + nextDay + " 天簽到獎勵已入庫");
}

function claimDailyAd() {
  ensureCycleState();
  if (save.adClaims.daily >= 3) return toast("今日軍資已達領取上限");
  const grant = () => {
    save.adClaims.daily += 1;
    const reward = { gold: 260, food: 90, jade: 1 };
    awardResources(reward);
    recordTaskProgress("daily-ad");
    persist();
    updateHud();
    renderShop();
    window.TaoyuanAudio?.sfx?.("reward");
    toast("領取行商補給成功");
  };
  if (save.adFree) grant();
  else window.TaoyuanAds.showRewardedAd({ onReward: grant });
}

function renderShop() {
  ensureCycleState();
  const cards = SHOP_ITEMS.map((item) => {
    const claimed = isShopClaimed(item);
    const nativeLocked = Boolean(item.requiresNativePurchase && !window.TaoyuanIAP.isAvailable());
    const buttonText = nativeLocked ? "App 專屬" : claimed ? "已兌換" : "兌換";
    return '<article class="shop-card tone-' + item.tone + '"><div class="shop-badge">' + (item.tone === "legend" ? "秘" : "商") + '</div><div><h3>' + item.name + '</h3><p>' + item.desc + '</p><small>費用 ' + rewardHtml(item.cost, true) + ' · 獲得 ' + rewardHtml(item.reward, true) + '</small></div><button class="' + (claimed || nativeLocked ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="shop-buy" data-shop="' + item.id + '"' + (claimed || nativeLocked ? " disabled" : "") + '>' + buttonText + '</button></article>';
  }).join("");
  setPanel(UI_TEXT.shop, '<p class="section-caption">軍需所取得，不設虛假永久買賣。</p><div class="shop-list">' + cards + '</div><p class="panel-footnote">原生商店商品未配置正式 SKU 時會自動保持停用。</p>');
}

function buyShopItem(itemId) {
  ensureCycleState();
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
  if (!item || isShopClaimed(item)) return;
  if (item.requiresNativePurchase) {
    if (!window.TaoyuanIAP.isAvailable()) return toast("目前環境不支援此購買項目");
    window.TaoyuanIAP.purchase(item.productId).then((result) => {
      if (result.ok) {
        awardResources(item.reward);
        save.shopClaims[item.id] = (save.shopClaims[item.id] || 0) + 1;
        persist();
        updateHud();
        renderShop();
        toast("購買成功");
      } else {
        toast(result.message || "購買未完成");
      }
    });
    return;
  }
  for (const [res, amount] of Object.entries(item.cost || {})) {
    if ((save[res] || 0) < amount) return toast(res === "gold" ? "銅錢不足" : res === "jade" ? "玉璧不足" : "資源不足");
  }
  for (const [res, amount] of Object.entries(item.cost || {})) save[res] -= amount;
  awardResources(item.reward);
  save.shopClaims[item.id] = (save.shopClaims[item.id] || 0) + 1;
  recordTaskProgress("daily-shop");
  persist();
  updateHud();
  window.TaoyuanAudio?.sfx?.("reward");
  toast("兌換「" + item.name + "」成功");
  renderShop();
}

function battlePassLevelReward(lvl) {
  const isMajor = lvl % 5 === 0;
  if (isMajor) return { jade: Math.round(lvl * 1.5), shards: 5 + Math.floor(lvl / 5) * 2, gold: 500 + lvl * 100 };
  if (lvl % 2 === 0) return { jade: 2, shards: 2, gold: 200 + lvl * 20 };
  return { gold: 300 + lvl * 30, food: 150 + lvl * 15 };
}

function renderEvents(tab = runtime.eventTab || "pass") {
  runtime.eventTab = tab;
  ensureCycleState();

  const tabs = '<div class="panel-tabs">' +
    '<button type="button" data-action="event-tab" data-tab="pass" class="' + (tab === "pass" ? "active" : "") + '">征戰敕令 (戰令)</button>' +
    '<button type="button" data-action="event-tab" data-tab="events" class="' + (tab === "events" ? "active" : "") + '">限時活動</button>' +
    '</div>';

  if (tab === "events") {
    const cards = LOCAL_EVENTS.map((event) => {
      const progress = Math.min(event.target, eventProgress(event.id));
      const claimed = save.eventState.claimed.includes(event.id);
      const percent = Math.round(progress / event.target * 100);
      return '<article class="mode-card event-card ' + (claimed ? "cleared" : "") + '"><div class="mode-icon">期</div><div><h3>' + event.name + '</h3><p>' + event.desc + '</p><div class="progress-track"><i style="width:' + percent + '%"></i></div><small>' + progress + ' / ' + event.target + '　' + rewardHtml(event.reward, true) + '</small></div><button class="' + (claimed || progress < event.target ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="event-claim" data-event="' + event.id + '"' + (claimed || progress < event.target ? " disabled" : "") + '>' + (claimed ? "已領" : "領取") + '</button></article>';
    }).join("");
    setPanel("限時活動", tabs + '<section class="mode-banner"><span class="eyebrow">限時每週活動</span><h3>桃園義勇週</h3><p>每週重置征戰任務，完成領取豐厚軍資。</p></section><div class="mode-list">' + cards + '</div>');
    return;
  }

  const currentXp = save.battlePass?.xp || 0;
  const currentLevel = Math.min(30, Math.floor(currentXp / 10) + 1);
  const claimedList = save.battlePass?.claimed || [];

  const passCards = Array.from({ length: 30 }, (_, i) => {
    const lvl = i + 1;
    const unlocked = currentLevel >= lvl;
    const claimed = claimedList.includes(lvl);
    const reward = battlePassLevelReward(lvl);
    const isMajor = lvl % 5 === 0;

    return '<article class="mode-card' + (isMajor ? ' legend-card' : '') + (claimed ? ' cleared' : '') + '" style="padding:10px 12px;margin-bottom:8px;">' +
      '<div class="mode-icon" style="' + (isMajor ? 'background:linear-gradient(135deg,#c69234,#f0d376);color:#2b1900;' : '') + '">' + lvl + '</div>' +
      '<div style="flex:1;">' +
        '<h4 style="margin:0 0 2px 0;font-size:13px;">' + (isMajor ? '★ 敕令大獎 · ' : '') + '第 ' + lvl + ' 階</h4>' +
        '<small>' + rewardHtml(reward, true) + '</small>' +
      '</div>' +
      '<button class="' + (claimed ? 'stone-button' : unlocked ? 'seal-button' : 'stone-button') + ' panel-action" type="button" data-action="battlepass-claim" data-level="' + lvl + '"' + (claimed || !unlocked ? ' disabled' : '') + '>' +
        (claimed ? '已領取' : unlocked ? '可領取' : '未達成') +
      '</button>' +
    '</article>';
  }).join("");

  setPanel("征戰敕令", tabs +
    '<section class="mode-banner" style="background:linear-gradient(135deg,#231c26,#3b2533);border:1px solid #735165;">' +
      '<span class="eyebrow">長期征戰回饋</span>' +
      '<h3>敕令軍階 · Lv.' + currentLevel + '</h3>' +
      '<p>進行戰役推關、擊敗首領或完成日常任務可累積敕令經驗，最高 30 階大獎！</p>' +
      '<div class="mode-stats">' +
        '<span>總經驗 <b>' + currentXp + ' 點</b></span>' +
        '<span>當前進度 <b>' + (currentXp % 10) + ' / 10</b></span>' +
      '</div>' +
    '</section>' +
    '<div class="mode-list" style="max-height:420px;overflow-y:auto;padding-right:4px;">' + passCards + '</div>');
}

function claimLocalEvent(eventId) {
  ensureCycleState();
  const event = LOCAL_EVENTS.find((item) => item.id === eventId);
  if (!event || save.eventState.claimed.includes(event.id) || eventProgress(event.id) < event.target) return;
  save.eventState.claimed.push(event.id);
  awardResources(event.reward);
  save.battlePass.xp = (save.battlePass.xp || 0) + 4;
  persist();
  updateHud();
  renderEvents("events");
  window.TaoyuanAudio?.sfx?.("reward");
  toast("活動獎勵已領取");
}

function renderCollection() {
  const counts = Object.entries(FACTIONS).map(([id, faction]) => {
    const owned = (FACTION_BY_HERO[id] || []).filter((heroId) => isUnlocked(heroById(heroId))).length;
    return '<div class="collection-faction"><i style="--faction-color:' + faction.color + '"></i><strong>' + faction.name + '</strong><span>' + owned + ' 名</span><small>' + faction.desc + '</small></div>';
  }).join("");
  const bonds = BONDS.map((bond) => {
    const active = activeBonds().some((item) => item.id === bond.id);
    return '<article class="collection-card ' + (active ? "active" : "") + '"><strong>' + bond.name + '</strong><small>' + bond.desc + '</small><em>' + (active ? "已觸發" : "尚未集齊") + '</em></article>';
  }).join("");
  const titles = TITLES.map((title) => {
    const unlocked = titleUnlocked(title);
    const equipped = save.equippedTitle === title.id;
    return '<article class="collection-card title-card ' + (unlocked ? "active" : "locked") + '"><strong>' + title.name + '</strong><small>' + title.desc + '</small><button class="' + (equipped || !unlocked ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="title-equip" data-title="' + title.id + '"' + ((!unlocked || equipped) ? " disabled" : "") + '>' + (equipped ? "已裝備" : unlocked ? "裝備" : "未解鎖") + '</button></article>';
  }).join("");
  const treasures = TREASURES.map((treasure) => {
    const unlocked = campaignClears() >= treasure.unlock;
    const equipped = save.equippedTreasure === treasure.id;
    return '<article class="collection-card treasure-card ' + (unlocked ? "active" : "locked") + '"><strong>' + treasure.name + '</strong><small>' + treasure.desc + '</small><button class="' + (equipped || !unlocked ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="treasure-equip" data-treasure="' + treasure.id + '"' + ((!unlocked || equipped) ? " disabled" : "") + '>' + (equipped ? "已配裝" : unlocked ? "配裝" : "第 " + treasure.unlock + " 關") + '</button></article>';
  }).join("");
  setPanel("圖鑑與義結", '<p class="section-caption">陣營勢力</p><div class="collection-factions">' + counts + '</div><p class="section-caption">緣分組合</p><div class="collection-list">' + bonds + '</div><p class="section-caption">稱號</p><div class="collection-list">' + titles + '</div><p class="section-caption">寶物神器</p><div class="collection-list">' + treasures + '</div>');
  $("panelContent").insertAdjacentHTML("beforeend", renderFrameSection());
}

function renderFrameSection() {
  const frames = AVATAR_FRAMES.map((frame) => {
    const unlocked = avatarFrameUnlocked(frame);
    const equipped = save.equippedFrame === frame.id;
    return '<article class="collection-card frame-card ' + (unlocked ? "active" : "locked") + '"><div class="frame-card-preview"><span class="pixel-avatar ' + frame.avatar + '"><i></i></span></div><div><strong>' + frame.name + '</strong><small>' + frame.desc + '</small></div><button class="' + (equipped || !unlocked ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="frame-equip" data-frame="' + frame.id + '"' + ((!unlocked || equipped) ? " disabled" : "") + '>' + (equipped ? "已裝備" : unlocked ? "裝備" : "未解鎖") + '</button></article>';
  }).join("");
  return '<p class="section-caption">頭像與名框</p><div class="collection-list frame-list">' + frames + '</div>';
}

function equipAvatarFrame(frameId) {
  const frame = avatarFrameById(frameId);
  if (!frame || !avatarFrameUnlocked(frame)) return toast("尚未解鎖此頭像框");
  save.equippedFrame = frame.id;
  persist();
  updateHud();
  renderCollection();
  toast("頭像框已更換為「" + frame.name + "」");
}

function renderMail() {
  const claimed = Boolean(save.mailClaimed);
  setPanel("軍中文書",
    '<article class="announcement-card">' +
      '<span class="story-stage">主公親啟</span>' +
      '<div>' +
        '<strong>桃園初征軍令補給</strong>' +
        '<small>軍師校尉奉命起草</small>' +
        '<p>起義之初，軍資尤重。特撥銅錢 300、糧草 120 充實府庫，助主公討賊立功。</p>' +
      '</div>' +
    '</article>' +
    '<button class="seal-button wide-button" type="button" data-action="mail-claim"' + (claimed ? " disabled" : "") + '>' + (claimed ? "已領取軍資" : "領取文書所附軍資") + '</button>');
}

function renderAchievements() {
  const list = achievementData().map((item) => {
    const claimed = save.achievementClaimed.includes(item.id);
    const ready = item.value >= item.target && !claimed;
    const progressText = Math.min(item.value, item.target) + " / " + item.target;
    return '<article class="task-card ' + (claimed ? "cleared" : "") + '"><div><h3>' + item.title + '</h3><p>' + item.desc + '</p><small>' + progressText + ' · ' + rewardHtml(item, true) + '</small></div><button class="' + (claimed || !ready ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="achievement-claim" data-achievement="' + item.id + '"' + (claimed || !ready ? " disabled" : "") + '>' + (claimed ? "已領" : "領取") + '</button></article>';
  }).join("");
  setPanel("成就手冊", '<div class="task-list">' + list + '</div>');
}

function renderAnnouncementSection() {
  const notices = ANNOUNCEMENTS.map((notice) => '<article class="announcement-card"><span class="story-stage">' + notice.tag + '</span><div><strong>' + notice.title + '</strong><small>' + notice.date + '</small><p>' + notice.body + '</p></div></article>').join("");
  return '<p class="section-caption">系統公告</p><div class="announcement-list">' + notices + '</div>';
}

function accountDisplayName(user) {
  if (!user) return "未登入";
  const raw = user.username || user.displayName || user.email || (user.guest ? "訪客" : "玩家");
  return String(raw).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderSettings() {
  const account = window.TaoyuanAuth?.getUser?.();
  const accountHtml = account
    ? '<div class="setting-account-box"><span class="setting-account-name">' + accountDisplayName(account) + '</span><span class="setting-account-state">已登入</span><div class="setting-account-actions"><button class="stone-button compact-button" type="button" data-action="auth-switch">切換帳號</button><button class="stone-button compact-button" type="button" data-action="auth-logout">登出</button></div></div>'
    : '<div class="setting-account-box"><span class="setting-account-name">未登入</span><span class="setting-account-state">目前進度保留於本機</span><button class="seal-button compact-button" type="button" data-action="auth-switch">登入帳號</button></div>';

  const soundRow = '<div class="setting-row"><div><strong>音效</strong><small>戰鬥與操作音效</small></div><button class="' + (save.sound ? "seal-button" : "stone-button") + '" type="button" data-action="setting-toggle" data-setting="sound">' + (save.sound ? "開啟" : "關閉") + '</button></div>';
  const musicRow = '<div class="setting-row"><div><strong>音樂</strong><small>背景音樂</small></div><button class="' + (save.music ? "seal-button" : "stone-button") + '" type="button" data-action="setting-toggle" data-setting="music">' + (save.music ? "開啟" : "關閉") + '</button></div>';
  const effectsRow = '<div class="setting-row"><div><strong>戰場特效</strong><small>技能與光影</small></div><button class="' + (save.effects ? "seal-button" : "stone-button") + '" type="button" data-action="setting-toggle" data-setting="effects">' + (save.effects ? "開啟" : "關閉") + '</button></div>';
  const qualityRow = '<div class="setting-row"><div><strong>畫面品質</strong><small>' + (save.renderQuality === "low" ? "低功耗" : "高畫質") + '</small></div><button class="stone-button" type="button" data-action="quality-toggle">' + (save.renderQuality === "low" ? "低功耗" : "高畫質") + '</button></div>';
  const notifyRow = '<div class="setting-row"><div><strong>推播通知</strong><small>體力滿溢與活動提醒</small></div><button class="' + (save.notifications ? "seal-button" : "stone-button") + '" type="button" data-action="notification-request">' + (save.notifications ? "已授權" : "開啟通知") + '</button></div>';
  const renameRow = '<div class="setting-row"><div><strong>主公稱號</strong><small>' + (save.playerName || "玄德") + '</small></div><button class="stone-button" type="button" data-action="rename-player">更改名稱</button></div>';

  setPanel("系統設定",
    '<p class="section-caption">軍府帳號</p>' + accountHtml +
    '<p class="section-caption">音訊與顯示</p><div class="setting-group">' + soundRow + musicRow + effectsRow + qualityRow + notifyRow + renameRow + '</div>' +
    renderAnnouncementSection() +
    '<p class="section-caption">版本與支援</p><div class="setting-group">' +
      '<div class="setting-row"><div><strong>客戶端版本</strong><small>v' + APP_VERSION + '</small></div><button class="stone-button" type="button" data-action="version-check">檢查更新</button></div>' +
      '<div class="setting-row"><div><strong>購買恢復</strong><small>恢復 App 內購</small></div><button class="stone-button" type="button" data-action="restore-purchases">恢復購買</button></div>' +
      '<div class="setting-row"><div><strong>問題回報</strong><small>傳送反饋記錄</small></div><button class="stone-button" type="button" data-action="report-issue">回報問題</button></div>' +
      '<div class="setting-row"><div><strong>儲存進度</strong><small>手動同步存檔</small></div><button class="stone-button" type="button" data-action="save-now">立即儲存</button></div>' +
      '<div class="setting-row"><div><strong>重置存檔</strong><small>清空全部資料</small></div><button class="stone-button" type="button" data-action="reset-save" style="color:#e06050;">重置進度</button></div>' +
    '</div>');
}

function autoAdvanceAfterBattle(result) {
  if (!result) return;
  const win = result.type === "win";
  if (win) {
    if (result.newlyUnlocked) toast("名將來投：" + result.newlyUnlocked);
    else if (result.progressed) toast("推進至第 " + (runtime.nextStageAfterSettlement || save.stage) + " 關");
    else toast("首領重打成功");
  } else {
    toast("全軍暫退，重整再戰");
  }
  window.TaoyuanAudio?.sfx?.(win ? "reward" : "cancel");
  const nextStage = win
    ? (runtime.nextStageAfterSettlement || save.stage)
    : (result.stage || activeStageNumber());
  scheduleGameTimer(() => {
    runtime.battleResult = null;
    runtime.spawning = false;
    runtime.enemies = [];
    runtime.projectiles = [];
    clearResourceDrops();
    runtime.waveClears = 0;
    runtime.bossActive = false;
    startStage(nextStage, win ? "新戰場" : "重新整軍", { keepPanel: true });
  }, win ? 1500 : 1800);
}

function showSettlement(result) {
  autoAdvanceAfterBattle(result);
}

function closeSettlement(action) {
  const modal = $("settlementModal");
  modal.hidden = true;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  const result = runtime.battleResult;
  runtime.battleResult = null;
  runtime.spawning = false;
  runtime.enemies = [];
  runtime.projectiles = [];
  clearResourceDrops();
  runtime.waveClears = 0;
  runtime.bossActive = false;
  const nextStage = action === "continue"
    ? (runtime.nextStageAfterSettlement || save.stage)
    : (result?.stage || activeStageNumber());
  startStage(nextStage, action === "continue" ? "新戰場" : "重新整軍");
}

function showOfflineReward(seconds) {
  const capped = Math.min(seconds, 8 * 60 * 60);
  const gold = Math.floor(capped * (0.42 + save.stage * .025));
  const food = Math.floor(capped * (0.11 + save.stage * .008));
  const hours = Math.floor(capped / 3600);
  const minutes = Math.floor((capped % 3600) / 60);
  const shards = hours >= 1 ? Math.floor(hours * 1.5) : 0;
  const jade = hours >= 3 ? Math.floor(hours / 2) : 0;

  runtime.pendingOffline = { gold, food, shards, jade };
  $("offlineTime").textContent = "離線征戰 " + (hours ? hours + " 小時 " : "") + minutes + " 分鐘";
  $("offlineGold").textContent = formatNumber(gold);
  $("offlineFood").textContent = formatNumber(food);

  const shardsRow = $("offlineShardsRow");
  const jadeRow = $("offlineJadeRow");
  if (shardsRow) {
    shardsRow.hidden = shards <= 0;
    if (shards > 0) $("offlineShards").textContent = formatNumber(shards);
  }
  if (jadeRow) {
    jadeRow.hidden = jade <= 0;
    if (jade > 0) $("offlineJade").textContent = formatNumber(jade);
  }

  $("doubleOffline").disabled = false;
  $("offlineModal").hidden = false;
  window.TaoyuanAudio?.sfx?.("reward");
}
