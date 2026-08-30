/* UI Panels: Lord, Shop, Daily/Tasks, Checkin, BattlePass, Events, Collection, Settings, Settlement & Offline */
"use strict";

function renderLord() {
  const power = currentArmyPower();
  const frame = avatarFrameById(save.equippedFrame) || AVATAR_FRAMES[0];
  const frameColor = frame?.color || "#c6a654";
  const lordHero = heroById("liubei");
  const portrait = lordHero?.portrait || "assets/characters/portrait-liubei-v1.webp";
  const needed = 90 + save.level * 35;
  const expPct = clamp((save.exp / needed) * 100, 0, 100);
  const titleName = titleById(save.equippedTitle)?.name || "義勇軍";
  const titles = TITLES.map((title) => {
    const unlocked = titleUnlocked(title);
    const equipped = save.equippedTitle === title.id;
    return '<button class="lord-pick' + (equipped ? " equipped" : "") + (unlocked ? "" : " locked") + '" type="button" data-action="title-equip" data-title="' + title.id + '"' + ((!unlocked || equipped) ? " disabled" : "") + '>' +
      '<strong>' + title.name + '</strong><small>' + (equipped ? "裝備中" : unlocked ? "可裝備" : title.desc) + '</small></button>';
  }).join("");
  const frames = AVATAR_FRAMES.map((item) => {
    const unlocked = avatarFrameUnlocked(item);
    const equipped = save.equippedFrame === item.id;
    return '<button class="lord-pick frame-pick' + (equipped ? " equipped" : "") + (unlocked ? "" : " locked") + '" type="button" data-action="frame-equip" data-frame="' + item.id + '"' + ((!unlocked || equipped) ? " disabled" : "") + '>' +
      '<i class="frame-swatch" style="--frame-color:' + (item.color || "#c6a654") + '" aria-hidden="true"></i>' +
      '<span><strong>' + item.name + '</strong><small>' + (equipped ? "裝備中" : unlocked ? "可裝備" : item.desc) + '</small></span></button>';
  }).join("");
  setPanel("主公軍府",
    '<section class="lord-office">' +
      '<div class="lord-identity" style="--frame-color:' + frameColor + '">' +
        '<span class="pixel-avatar avatar-liubei portrait-asset portrait-asset-liubei lord-portrait" style="background-image:url(\'' + portrait + '\');border-color:' + frameColor + '" aria-hidden="true"><i></i></span>' +
        '<div class="lord-identity-copy">' +
          '<h3>' + (save.playerName || "劉玄德") + '</h3>' +
          '<span class="lord-title-badge">' + titleName + '</span>' +
          '<p class="hero-power">軍勢 <strong>' + formatNumber(power) + '</strong></p>' +
          '<div class="lord-exp-block" aria-label="主公經驗">' +
            '<span>主公等級 <b>Lv.' + save.level + '</b></span>' +
            '<div class="progress-track lord-exp-track"><i style="width:' + expPct + '%"></i><small>' + Math.floor(save.exp) + ' / ' + needed + '</small></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<p class="section-caption lord-summary-caption">軍府摘要</p>' +
      '<div class="lord-progress-grid">' +
        '<div class="lord-stat-chip" role="group" aria-label="歷史進度"><span>歷史進度</span><b>第 ' + save.stage + ' 關</b></div>' +
        '<div class="lord-stat-chip" role="group" aria-label="已結識名將"><span>名將數</span><b>' + HEROES.filter(isUnlocked).length + '</b></div>' +
        '<div class="lord-stat-chip" role="group" aria-label="出戰陣容"><span>陣容</span><b>' + save.formation.length + ' 人</b></div>' +
      '</div>' +
      '<p class="section-caption">稱號</p>' +
      '<div class="lord-pick-list">' + titles + '</div>' +
      '<p class="section-caption">頭像框</p>' +
      '<div class="lord-pick-list">' + frames + '</div>' +
      '<p class="panel-footnote">沿歷史戰役結識名將，不設抽取。</p>' +
    '</section>');
}

function taskCardHtml(task, weekly = false) {
  const state = weekly ? save.weekly : save.daily;
  const progress = Math.min(task.target, state.progress[task.id] || 0);
  const claimed = state.claimed.includes(task.id);
  const percent = Math.round(progress / task.target * 100);
  const tag = weekly ? "週" : "日";
  const taskName = task.name || task.title || "軍務";
  const stateLabel = claimed ? "已領取" : progress >= task.target ? "可領取" : "進行中";
  return '<article class="task-card ' + (weekly ? "weekly " : "") + (claimed ? "cleared" : "") + '">' +
    '<div class="task-badge ' + (weekly ? "task-badge-weekly" : "task-badge-daily") + '" aria-hidden="true">' + tag + '</div>' +
    '<div class="task-card-main">' +
      '<div class="task-card-head"><h3>' + taskName + '</h3><span class="task-state">' + stateLabel + '</span></div>' +
      '<div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="' + task.target + '" aria-valuenow="' + progress + '" aria-label="' + taskName + '進度"><i style="width:' + percent + '%"></i></div>' +
      '<div class="task-card-meta"><span class="task-progress">進度 ' + progress + ' / ' + task.target + '</span><span class="task-rewards" aria-label="獎勵">' + rewardHtml(task.reward, true) + '</span></div>' +
    '</div>' +
    '<button class="' + (claimed || progress < task.target ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="daily-task-claim" data-task="' + task.id + '"' + (weekly ? ' data-weekly="true"' : '') + (claimed || progress < task.target ? " disabled" : "") + ' aria-label="' + (claimed ? taskName + '已領取' : progress < task.target ? taskName + '尚未完成' : '領取' + taskName + '獎勵') + '">' + (claimed ? "已領" : "領取") + '</button>' +
  '</article>';
}

function renderDaily() {
  ensureCycleState();
  const tasks = DAILY_TASKS.map((task) => taskCardHtml(task, false)).join("");
  const weeklyTasks = WEEKLY_TASKS.map((task) => taskCardHtml(task, true)).join("");
  setPanel("日常軍務",
    '<p class="section-caption">今日軍務</p>' +
    '<div class="task-list">' + tasks + '</div>' +
    '<p class="section-caption">本週軍務</p>' +
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
  toast("已領取「" + (task.name || task.title || "軍務") + "」軍資");
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

function isShopClaimed(item) {
  if (!item) return true;
  if (!save.shopPurchases) save.shopPurchases = {};
  if (item.repeatable) return false;
  return (save.shopPurchases[item.id] || 0) > 0;
}

function achievementData() {
  const unlockedHeroes = HEROES.filter((hero) => isUnlocked(hero)).length;
  const kills = Number(save.stats?.kills) || 0;
  const arenaWins = Number(save.arena?.wins) || 0;
  const stage = Math.max(1, Number(save.stage) || 1);
  return ACHIEVEMENTS.map((item) => {
    let value = 0;
    if (item.type === "stage") value = stage;
    else if (item.type === "kills") value = kills;
    else if (item.type === "heroes") value = unlockedHeroes;
    else if (item.type === "arena") value = arenaWins;
    return { ...item, value };
  });
}

function renderShop() {
  ensureCycleState();
  const cards = SHOP_ITEMS.map((item) => {
    const claimed = isShopClaimed(item);
    const nativeLocked = Boolean(item.requiresNativePurchase && !window.TaoyuanIAP.isAvailable());
    const buttonText = nativeLocked ? "App 專屬" : claimed ? "已兌換" : "兌換";
    return '<article class="shop-card tone-' + item.tone + '" data-shop-item="' + item.id + '"><div class="shop-badge" aria-hidden="true">' + (item.tone === "legend" ? "秘" : "商") + '</div><div><h3>' + item.name + '</h3><p>' + item.desc + '</p><small>費用 ' + rewardHtml(item.cost, true) + ' · 獲得 ' + rewardHtml(item.reward, true) + '</small></div><button class="' + (claimed || nativeLocked ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="shop-buy" data-shop="' + item.id + '"' + (claimed || nativeLocked ? " disabled" : "") + '>' + buttonText + '</button></article>';
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
        save.shopPurchases[item.id] = (save.shopPurchases[item.id] || 0) + 1;
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
  save.shopPurchases[item.id] = (save.shopPurchases[item.id] || 0) + 1;
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
    '<button type="button" data-action="event-tab" data-tab="pass" class="' + (tab === "pass" ? "active" : "") + '">征戰敕令</button>' +
    '<button type="button" data-action="event-tab" data-tab="events" class="' + (tab === "events" ? "active" : "") + '">限時活動</button>' +
    '</div>';

  if (tab === "events") {
    const cards = LOCAL_EVENTS.map((event) => {
      const progress = Math.min(event.target, eventProgress(event.id));
      const claimed = save.eventState.claimed.includes(event.id);
      const percent = Math.round(progress / event.target * 100);
      return '<article class="mode-card event-card ' + (claimed ? "cleared" : "") + '"><div class="mode-icon">期</div><div><h3>' + event.name + '</h3><p>' + event.desc + '</p><div class="progress-track"><i style="width:' + percent + '%"></i></div><small>' + progress + ' / ' + event.target + '　' + rewardHtml(event.reward, true) + '</small></div><button class="' + (claimed || progress < event.target ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="event-claim" data-event="' + event.id + '"' + (claimed || progress < event.target ? " disabled" : "") + '>' + (claimed ? "已領" : "領取") + '</button></article>';
    }).join("");
    setPanel("限時活動", tabs + '<section class="mode-banner"><h3>桃園義勇週</h3><p>每週重置征戰任務，完成領取軍資。</p></section><div class="mode-list">' + cards + '</div>');
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

    return '<article class="mode-card pass-card' + (isMajor ? " legend-card" : "") + (claimed ? " cleared" : "") + '">' +
      '<div class="mode-icon">' + lvl + '</div>' +
      '<div class="pass-card-copy">' +
        '<h4>' + (isMajor ? "敕令大獎 · " : "") + "第 " + lvl + " 階</h4>" +
        '<small>' + rewardHtml(reward, true) + '</small>' +
      '</div>' +
      '<button class="' + (claimed ? "stone-button" : unlocked ? "seal-button" : "stone-button") + ' panel-action" type="button" data-action="battlepass-claim" data-level="' + lvl + '"' + (claimed || !unlocked ? " disabled" : "") + '>' +
        (claimed ? "已領取" : unlocked ? "可領取" : "未達成") +
      '</button>' +
    '</article>';
  }).join("");

  setPanel("征戰敕令", tabs +
    '<section class="mode-banner decree-banner">' +
      '<h3>敕令軍階 · Lv.' + currentLevel + '</h3>' +
      '<p>推關、擊敗首領或完成日常可累積敕令經驗，最高 30 階。</p>' +
      '<div class="mode-stats">' +
        '<span>總經驗 <b>' + currentXp + ' 點</b></span>' +
        '<span>當前進度 <b>' + (currentXp % 10) + ' / 10</b></span>' +
      '</div>' +
    '</section>' +
    '<div class="mode-list pass-list">' + passCards + '</div>');
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

function claimFactionMilestone(msKey) {
  const [factionId, countStr] = (msKey || "").split("-");
  const count = Number(countStr);
  const ms = (FACTION_MILESTONES[factionId] || []).find((item) => item.count === count);
  if (!ms) return;
  const ownedCount = (FACTION_BY_HERO[factionId] || []).filter((hid) => isUnlocked(heroById(hid))).length;
  if (ownedCount < ms.count) return toast("尚未結識足夠的勢力名將");
  save.collectionMilestones = save.collectionMilestones || {};
  if (save.collectionMilestones[msKey]) return toast("已領取過此共鳴加成");
  save.collectionMilestones[msKey] = true;
  awardResources({ jade: ms.jade });
  persist();
  updateHud();
  renderCollection();
  window.TaoyuanAudio?.sfx?.("reward");
  toast("成功啟動「" + ms.name + "」共鳴，全隊屬性已提升！");
}

function renderCollection() {
  const counts = Object.entries(FACTIONS).map(([id, faction]) => {
    const owned = (FACTION_BY_HERO[id] || []).filter((heroId) => isUnlocked(heroById(heroId))).length;
    const portraits = (FACTION_BY_HERO[id] || []).slice(0, 2).map((heroId) => heroById(heroId)).filter(Boolean).map((hero) => '<span class="collection-faction-portrait" style="background-image:url(\'' + hero.portrait + '\')" aria-hidden="true"></span>').join("");
    return '<div class="collection-faction faction-' + id + '">' + portraits + '<i style="--faction-color:' + faction.color + '"></i><strong>' + faction.name + '</strong><span>' + owned + ' 名</span><small>' + faction.desc + '</small></div>';
  }).join("");

  const milestonesHtml = Object.entries(FACTION_MILESTONES).map(([factionId, list]) => {
    const faction = FACTIONS[factionId];
    const ownedCount = (FACTION_BY_HERO[factionId] || []).filter((hid) => isUnlocked(heroById(hid))).length;
    const totalCount = (FACTION_BY_HERO[factionId] || []).length;
    const items = list.map((ms) => {
      const msKey = factionId + "-" + ms.count;
      const claimed = Boolean(save.collectionMilestones?.[msKey]);
      const reached = ownedCount >= ms.count;
      return '<div class="record-item collection-milestone ' + (claimed ? "claimed" : reached ? "ready" : "locked") + '">' +
        '<div><strong>' + ms.name + '</strong> (相遇 ' + ms.count + ' 人)：<span class="milestone-bonus">' + ms.label + '</span><br><small>獎勵：' + ms.jade + ' 玉璧</small></div>' +
        '<button class="' + (claimed ? 'stone-button' : reached ? 'seal-button' : 'stone-button') + ' compact-button" type="button" data-action="claim-faction-milestone" data-key="' + msKey + '"' + (claimed || !reached ? ' disabled' : '') + '>' +
          (claimed ? '已啟動' : reached ? '領取啟動' : ownedCount + '/' + ms.count) +
        '</button>' +
      '</div>';
    }).join("");
    return '<article class="collection-card faction-resonance"><div class="faction-resonance-head"><strong style="--faction-color:' + faction.color + ';">' + faction.name + ' 勢力共鳴</strong><span>已結識 ' + ownedCount + ' / ' + totalCount + ' 人</span></div>' + items + '</article>';
  }).join("");

  const bonds = BONDS.map((bond) => {
    const active = activeBonds().some((item) => item.id === bond.id);
    return '<article class="collection-card ' + (active ? "active" : "") + '"><div><strong>' + bond.name + '</strong><small>' + bond.desc + '</small></div><em>' + (active ? "已觸發" : "尚未集齊") + '</em></article>';
  }).join("");
  const treasures = TREASURES.map((treasure) => {
    const unlocked = campaignClears() >= treasure.unlock;
    const equipped = save.equippedTreasure === treasure.id;
    return '<article class="collection-card treasure-card ' + (unlocked ? "active" : "locked") + '"><div><strong>' + treasure.name + '</strong><small>' + treasure.desc + '</small></div><button class="' + (equipped || !unlocked ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="treasure-equip" data-treasure="' + treasure.id + '"' + ((!unlocked || equipped) ? " disabled" : "") + '>' + (equipped ? "已配裝" : unlocked ? "配裝" : "第 " + treasure.unlock + " 關") + '</button></article>';
  }).join("");
  setPanel("圖鑑與義結", '<p class="section-caption">陣營勢力收集共鳴</p><div class="collection-list collection-milestone-list">' + milestonesHtml + '</div><p class="section-caption">勢力簡介</p><div class="collection-factions">' + counts + '</div><p class="section-caption">緣分組合</p><div class="collection-list">' + bonds + '</div><p class="section-caption">寶物神器</p><div class="collection-list">' + treasures + '</div><p class="panel-footnote">稱號與頭像框統一在主公軍府管理，避免重複入口。</p>');
}

// 保留舊模組介面；頭像框清單已由主公軍府單一入口管理，不再由圖鑑呼叫。
function renderFrameSection() {
  return "";
}

function equipAvatarFrame(frameId) {
  const frame = avatarFrameById(frameId);
  if (!frame || !avatarFrameUnlocked(frame)) return toast("尚未解鎖此頭像框");
  save.equippedFrame = frame.id;
  persist();
  updateHud();
  if (runtime.panel === "profile") renderLord();
  else renderCollection();
  toast("頭像框已更換為「" + frame.name + "」");
}

function renderMail() {
  const claimed = Boolean(save.mailClaimed);
  setPanel("軍中文書",
    '<article class="announcement-card mail-announcement">' +
      '<span class="mail-seal" aria-hidden="true"></span>' +
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
    const rewards = rewardHtml(achievementReward(item), true);
    return '<article class="task-card task-card-plain ' + (claimed ? "cleared" : "") + '">' +
      '<span class="achievement-mark achievement-mark-' + item.id + '" aria-hidden="true"></span>' +
      '<div class="task-copy">' +
        '<h3>' + item.title + '</h3>' +
        '<p>' + item.desc + '</p>' +
        '<small>' + progressText + '</small>' +
        (rewards ? '<div class="reward-row">' + rewards + '</div>' : "") +
      '</div>' +
      '<button class="' + (claimed || !ready ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="achievement-claim" data-achievement="' + item.id + '"' + (claimed || !ready ? " disabled" : "") + '>' + (claimed ? "已領" : "領取") + '</button>' +
    '</article>';
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

  const soundRow = '<div class="setting-row setting-row-sound"><div><strong>音效</strong><small>戰鬥與操作音效</small></div><button class="' + (save.sound ? "seal-button" : "stone-button") + '" type="button" data-action="setting-toggle" data-setting="sound">' + (save.sound ? "開啟" : "關閉") + '</button></div>';
  const musicRow = '<div class="setting-row setting-row-music"><div><strong>音樂</strong><small>背景音樂</small></div><button class="' + (save.music ? "seal-button" : "stone-button") + '" type="button" data-action="setting-toggle" data-setting="music">' + (save.music ? "開啟" : "關閉") + '</button></div>';
  const effectsRow = '<div class="setting-row setting-row-effects"><div><strong>戰場特效</strong><small>技能與光影</small></div><button class="' + (save.effects ? "seal-button" : "stone-button") + '" type="button" data-action="setting-toggle" data-setting="effects">' + (save.effects ? "開啟" : "關閉") + '</button></div>';
  const qualityRow = '<div class="setting-row setting-row-quality"><div><strong>畫面品質</strong><small>' + (save.renderQuality === "low" ? "低功耗" : "高畫質") + '</small></div><button class="stone-button" type="button" data-action="quality-toggle">' + (save.renderQuality === "low" ? "低功耗" : "高畫質") + '</button></div>';
  const notifyRow = '<div class="setting-row setting-row-notify"><div><strong>推播通知</strong><small>體力滿溢與活動提醒</small></div><button class="' + (save.notifications ? "seal-button" : "stone-button") + '" type="button" data-action="notification-request">' + (save.notifications ? "已授權" : "開啟通知") + '</button></div>';
  const renameRow = '<div class="setting-row setting-row-rename"><div><strong>主公稱號</strong><small>' + (save.playerName || "玄德") + '</small></div><button class="stone-button" type="button" data-action="rename-player">更改名稱</button></div>';

  setPanel("系統設定",
    '<p class="section-caption">軍府帳號</p>' + accountHtml +
    '<p class="section-caption">音訊與顯示</p><div class="setting-group">' + soundRow + musicRow + effectsRow + qualityRow + notifyRow + renameRow + '</div>' +
    renderAnnouncementSection() +
    '<p class="section-caption">版本與支援</p><div class="setting-group">' +
      '<div class="setting-row setting-row-version"><div><strong>客戶端版本</strong><small>v' + APP_VERSION + '</small></div><button class="stone-button" type="button" data-action="version-check">檢查更新</button></div>' +
      '<div class="setting-row setting-row-purchase"><div><strong>購買恢復</strong><small>恢復 App 內購</small></div><button class="stone-button" type="button" data-action="restore-purchases">恢復購買</button></div>' +
      '<div class="setting-row setting-row-report"><div><strong>問題回報</strong><small>傳送反饋記錄</small></div><button class="stone-button" type="button" data-action="report-issue">回報問題</button></div>' +
      '<div class="setting-row setting-row-save"><div><strong>儲存進度</strong><small>手動同步存檔</small></div><button class="stone-button" type="button" data-action="save-now">立即儲存</button></div>' +
      '<div class="setting-row setting-row-danger"><div><strong>重置存檔</strong><small>清空全部資料</small></div><button class="stone-button" type="button" data-action="reset-save">重置進度</button></div>' +
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
  const modal = $("settlementModal");
  if (!modal || !result) {
    autoAdvanceAfterBattle(result);
    return;
  }
  hideEnemyPreview();
  const dialogue = $("dialogueBox");
  if (dialogue) {
    dialogue.classList.remove("show");
    dialogue.setAttribute("aria-hidden", "true");
  }
  const banner = $("bossBanner");
  if (banner) {
    banner.classList.remove("show");
    banner.setAttribute("aria-hidden", "true");
  }
  const win = result.type === "win";
  const modeLabel = result.mode === "arena" ? "演武" : result.mode === "tower" ? "問天樓" : result.mode === "dungeon" ? "特訓" : result.mode === "trial" ? "列傳" : "";
  $("settlementTitle").textContent = win ? (modeLabel ? modeLabel + "告捷" : "戰功告捷") : "整軍再戰";
  $("settlementSubtitle").textContent = win
    ? (result.progressed
      ? "第 " + result.stage + " 關首領已擊破"
      : (result.boss ? "擊敗「" + result.boss + "」" : "本場勝利"))
    : "全軍暫退，關卡進度不受影響";
  $("settlementLoot").innerHTML = rewardHtml(result.reward || {}) || '<span class="empty-loot">本次未掠得資源</span>';
  const stats = $("settlementStats");
  if (stats) stats.innerHTML = damageStatsHtml(result.damage || []);
  const unlock = $("settlementUnlock");
  if (unlock) {
    unlock.hidden = !result.newlyUnlocked;
    unlock.textContent = result.newlyUnlocked ? "名將加入：" + result.newlyUnlocked : "";
  }
  $("settlementPrimary").textContent = win ? UI_TEXT.continue : UI_TEXT.retry;
  $("settlementSecondary").textContent = win ? UI_TEXT.retry : UI_TEXT.close;
  $("settlementPrimary").dataset.settlementAction = win ? "continue" : "retry";
  $("settlementSecondary").dataset.settlementAction = win ? "retry" : "close";
  modal.hidden = false;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  window.TaoyuanAudio?.sfx?.(win ? "reward" : "cancel");
}

function closeSettlement(action) {
  const modal = $("settlementModal");
  if (modal) {
    modal.hidden = true;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }
  const result = runtime.battleResult;
  runtime.battleResult = null;
  runtime.spawning = false;
  runtime.enemies = [];
  runtime.projectiles = [];
  clearResourceDrops();
  runtime.waveClears = 0;
  runtime.bossActive = false;
  if (action === "close") {
    updateHud();
    if (result?.type === "lose") openPanel("campaign");
    return;
  }
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
