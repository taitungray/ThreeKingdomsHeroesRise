/* UI Base: HUD, panel container, enemy preview, dialogues and action dispatcher */
"use strict";

let toastTimer = null;
function toast(message) {
  const element = $("toast");
  if (!element || !message) return;
  element.textContent = message;
  element.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 1800);
}

function setHudText(id, value) {
  const text = String(value);
  const key = "text:" + id;
  if (runtime.hudCache[key] === text) return;
  runtime.hudCache[key] = text;
  const element = $(id);
  if (element) element.textContent = text;
}

function setHudStyle(id, property, value) {
  const key = "style:" + property + ":" + id;
  if (runtime.hudCache[key] === value) return;
  runtime.hudCache[key] = value;
  const element = $(id);
  if (element) element.style[property] = value;
}

function setHudProperty(id, property, value) {
  const key = "property:" + property + ":" + id;
  if (runtime.hudCache[key] === value) return;
  runtime.hudCache[key] = value;
  const element = $(id);
  if (element) element[property] = value;
}

function setHudAttribute(id, attribute, value) {
  const text = String(value);
  const key = "attribute:" + attribute + ":" + id;
  if (runtime.hudCache[key] === text) return;
  runtime.hudCache[key] = text;
  const element = $(id);
  if (element) element.setAttribute(attribute, text);
}

function updateHud() {
  setHudText("goldValue", formatNumber(save.gold));
  setHudText("foodValue", formatNumber(save.food));
  setHudText("jadeValue", formatNumber(save.jade));
  setHudText("shardValue", formatNumber(save.shards));
  setHudText("lordName", save.playerName || "玄德");
  setHudText("lordLevel", "Lv." + save.level);
  setHudText("armyTitle", titleById(save.equippedTitle)?.name || "義勇軍");
  const needed = 90 + save.level * 35;
  setHudText("expText", Math.floor(save.exp) + "/" + needed);
  setHudStyle("expFill", "width", clamp((save.exp / needed) * 100, 0, 100) + "%");
  const stage = activeStageNumber();
  const stageConfig = stageDefinition(stage);
  const chapterStage = ((stage - 1) % STAGES_PER_CHAPTER) + 1;
  const chapterNumber = Math.floor((stage - 1) / STAGES_PER_CHAPTER) + 1;
  const stageTitle = stageConfig?.name || "關卡 " + stage;
  setHudText("stageCompactLabel", chapterNumber + "-" + chapterStage);
  if ($("enemyPreviewStage")) setHudText("enemyPreviewStage", stageTitle);
  const curChapter = CHAPTERS[Math.min(CHAPTERS.length - 1, Math.floor((save.stage - 1) / STAGES_PER_CHAPTER))];
  const targetStage = stageDefinition(save.stage);
  setHudText("questText", "目標：第 " + save.stage + " 關 · " + (targetStage?.name || curChapter?.name || "征戰"));
  const living = runtime.enemies.reduce((count, enemy) => count + (enemy.dead ? 0 : 1), 0);
  const waveText = runtime.bossActive ? "首領戰" : "第 " + (runtime.waveClears + 1) + " 波";
  setHudText("waveChip", waveText + " · 敵 " + living);
  setHudText("bossProgress", Math.min(runtime.waveClears, 3) + " / 3");
  const bossDisabled = runtime.waveClears < 3 || runtime.bossActive || runtime.spawning;
  setHudProperty("bossButton", "disabled", bossDisabled);
  setHudAttribute("bossButton", "aria-label", runtime.bossActive ? "首領戰進行中" : runtime.waveClears < 3 ? "完成三波後挑戰關卡首領" : runtime.spawning ? "首領正在準備" : "挑戰關卡首領");
  const bossReady = !bossDisabled;
  if (runtime.hudCache.bossReady !== bossReady) {
    runtime.hudCache.bossReady = bossReady;
    $("bossButton")?.classList.toggle("ready", bossReady);
  }
  setHudText("speedButton", "×" + runtime.playSpeed);
  setHudAttribute("speedButton", "aria-valuetext", "戰鬥速度 ×" + runtime.playSpeed);
  setHudProperty("mailDot", "hidden", Boolean(save.mailClaimed));
  const dailyReady = DAILY_TASKS.some((task) => (save.daily.progress[task.id] || 0) >= task.target && !save.daily.claimed.includes(task.id)) || (save.checkin.day < 7 && !save.checkin.claimed.includes(save.checkin.day + 1));
  setHudProperty("dailyDot", "hidden", !dailyReady);
  const eventReady = LOCAL_EVENTS.some((event) => eventProgress(event.id) >= event.target && !save.eventState.claimed.includes(event.id));
  setHudProperty("eventDot", "hidden", !eventReady);
  setHudProperty("railMoreDot", "hidden", !eventReady);
}

function enemyPreviewAvatarHtml(general) {
  const avatar = general?.avatar || "avatar-locked";
  const portraitClass = general?.portrait ? " portrait-asset" : "";
  const portraitStyle = general?.portrait ? " style=\"background-image:url('" + general.portrait + "')\"" : "";
  return '<span class="pixel-avatar ' + avatar + portraitClass + ' enemy-preview-avatar"' + portraitStyle + '><i></i><span class="portrait-eyes" aria-hidden="true"></span><span class="avatar-detail" aria-hidden="true"></span></span>';
}

function showEnemyPreview(stage = activeStageNumber(), wave = null) {
  const preview = $("enemyPreview");
  const list = $("enemyPreviewList");
  if (!preview || !list) return;
  const config = stageDefinition(stage);
  const generals = (config?.enemyGenerals || []).map(enemyGeneralById).filter(Boolean);
  const currentWave = Number.isFinite(wave) ? wave : runtime.bossActive ? 4 : runtime.waveClears + 1;
  const bossWave = runtime.bossActive || currentWave > 3;
  const selected = bossWave
    ? enemyGeneralById(config?.bossGeneral)
    : generals[Math.min(Math.max(currentWave - 1, 0), generals.length - 1)] || generals[0];
  const cards = selected ? [{ ...selected, isBoss: bossWave }] : [];
  list.classList.toggle("single", cards.length === 1);
  list.innerHTML = cards.map((general) =>
    '<article class="enemy-preview-card' + (general.isBoss ? " boss" : "") + '">' +
      enemyPreviewAvatarHtml(general) +
      '<div><strong>' + (general.isBoss ? "敵首領 · " : "敵將 · ") + general.name + '</strong><small id="enemyPreviewLabel">' + (general.isBoss ? (config?.bossTitle || "本關守將") : (config?.waveTitle || "先鋒部隊")) + '</small></div>' +
    '</article>'
  ).join("");
  preview.classList.add("show");
  preview.setAttribute("aria-hidden", "false");
  clearTimeout(runtime.enemyPreviewTimer);
  runtime.enemyPreviewTimer = setTimeout(hideEnemyPreview, 4200);
}

function hideEnemyPreview() {
  const preview = $("enemyPreview");
  if (!preview) return;
  preview.classList.remove("show");
  preview.setAttribute("aria-hidden", "true");
}

function showDialogue(speaker, text, avatar = "avatar-liubei") {
  const banner = $("bossBanner");
  if (banner && (banner.classList.contains("show") || banner.getAttribute("aria-hidden") === "false")) {
    return;
  }
  const preview = $("enemyPreview");
  if (preview && preview.classList.contains("show")) {
    hideEnemyPreview();
  }
  const avatarEl = $("dialoguePortrait") || $("dialogueAvatar");
  if (avatarEl) {
    avatarEl.className = "pixel-avatar " + avatar;
    const speakerHero = (typeof HEROES === "object" ? HEROES.find((h) => h.name === speaker || h.id === speaker || ("avatar-" + h.id) === avatar) : null) ||
                        (typeof ENEMY_GENERALS === "object" ? ENEMY_GENERALS.find((g) => g.name === speaker || g.id === speaker || ("avatar-" + g.id) === avatar) : null);
    if (speakerHero?.portrait) {
      avatarEl.style.backgroundImage = "url('" + speakerHero.portrait + "')";
      avatarEl.classList.add("portrait-asset");
    } else {
      avatarEl.style.backgroundImage = "";
      avatarEl.classList.remove("portrait-asset");
    }
  }
  const speakerEl = $("dialogueName") || $("dialogueSpeaker");
  if (speakerEl) speakerEl.textContent = speaker;
  const textEl = $("dialogueText");
  if (textEl) textEl.textContent = text;
  const box = $("dialogueBox");
  if (box) {
    box.classList.add("show");
    box.setAttribute("aria-hidden", "false");
  }
  runtime.dialogueTimer = 4.2;
}

function setPanel(title, html) {
  $("panelTitle").textContent = title;
  $("panelContent").innerHTML = html;
  $("panelBackdrop").hidden = false;
  $("gamePanel").classList.add("open");
  $("gamePanel").setAttribute("aria-hidden", "false");
  updateHud();
}

function closePanel() {
  $("panelBackdrop").hidden = true;
  $("gamePanel").classList.remove("open");
  $("gamePanel").setAttribute("aria-hidden", "true");
  runtime.panel = null;
  runtime.formationPick = null;
  runtime.selectedHero = null;
  const drawer = $("rightRailDrawer");
  if (drawer) {
    drawer.hidden = true;
    $("railMoreButton")?.setAttribute("aria-expanded", "false");
  }
  beep(260, 0.04, "square", 0.02);
}

function toggleRailDrawer() {
  const drawer = $("rightRailDrawer");
  if (!drawer) return;
  const next = drawer.hidden;
  drawer.hidden = !next;
  $("railMoreButton")?.setAttribute("aria-expanded", String(next));
  beep(next ? 480 : 280, 0.04, "square", 0.02);
}

function openPanel(type) {
  runtime.panel = type;
  const drawer = $("rightRailDrawer");
  if (drawer) {
    drawer.hidden = true;
    $("railMoreButton")?.setAttribute("aria-expanded", "false");
  }
  if (type === "heroes") renderHeroes();
  else if (type === "formation") renderFormation();
  else if (type === "tactics") renderTactics();
  else if (type === "campaign") renderCampaign();
  else if (type === "daily") renderDaily();
  else if (type === "events") renderEvents();
  else if (type === "shop") renderShop();
  else if (type === "arena") renderArena();
  else if (type === "collection") renderCollection();
  else if (type === "tower") renderTower();
  else if (type === "dungeon") renderDungeons();
  else if (type === "trials") renderTrials();
  beep(330, 0.04, "square", 0.018);
}

function rewardHtml(reward = {}, compact = false) {
  const labels = { gold: "銅錢", food: "糧草", jade: "玉璧", shards: "名將碎片", exp: "經驗" };
  const icons = { gold: "res-coin", food: "res-food", jade: "res-jade", shards: "res-shard", exp: "res-exp" };
  return Object.entries(reward).filter(([, value]) => value && value !== true).map(([key, value]) => '<span class="reward-chip" title="' + (labels[key] || key) + '"><i class="' + (icons[key] || "res-coin") + '"></i><b>' + formatNumber(value) + '</b>' + (compact ? "" : " " + (labels[key] || key)) + '</span>').join("");
}

function damageStatsHtml(rows = []) {
  if (!rows.length) return "";
  const max = Math.max(1, ...rows.map((row) => row.value));
  return '<div class="settlement-stats-title">本場傷害統計</div><div class="settlement-stats-list">' +
    rows.map((row, idx) => '<span class="' + (idx === 0 ? 'mvp-row' : '') + '"><b>' + (idx === 0 ? '★ MVP ' : '') + row.name + '</b><i><em style="width:' + Math.round(row.value / max * 100) + '%"></em></i><small>' + formatNumber(row.value) + '</small></span>').join("") +
    '</div>';
}

function handlePanelAction(button) {
  const action = button.dataset.action;
  if (!action) return;

  if (action === "hero-filter") renderHeroes(button.dataset.filter);
  else if (action === "hero-sort") {
    runtime.heroSort = button.dataset.sort;
    save.heroSort = runtime.heroSort;
    persist();
    renderHeroes();
  }
  else if (action === "hero-detail") renderHeroDetail(button.dataset.hero);
  else if (action === "hero-auto-equip") autoEquipHero(button.dataset.hero);
  else if (action === "paper-cycle") cycleHeroPaperDoll(button.dataset.hero, button.dataset.slot);
  else if (action === "equipment-refine") refineHeroEquipment(button.dataset.hero);
  else if (action === "hero-star") upgradeHeroStar(button.dataset.hero);
  else if (action === "hero-breakthrough") upgradeHeroBreakthrough(button.dataset.hero);
  else if (action === "hero-skill") upgradeHeroSkill(button.dataset.hero);
  else if (action === "hero-level") {
    const heroId = button.dataset.hero;
    const cost = 70 + save.heroLevels[heroId] * 42;
    if (save.gold < cost) return toast("銅錢不足");
    save.gold -= cost;
    save.heroLevels[heroId] += 1;
    recordTaskProgress("daily-upgrade");
    resetAllies();
    persist();
    updateHud();
    window.TaoyuanAudio?.sfx?.("confirm");
    toast(heroById(heroId).name + "升至 Lv." + save.heroLevels[heroId]);
    renderHeroDetail(heroId);
  } else if (action === "formation-toggle") {
    toggleFormation(button.dataset.hero);
    runtime.panel === "formation" ? renderFormation() : renderHeroDetail(button.dataset.hero);
  } else if (action === "formation-save") {
    resetAllies();
    persist();
    toast("編隊已套用");
  } else if (action === "formation-slot-swap") {
    swapFormationSlots(button.dataset.slot);
  } else if (action === "empty-slot") {
    toast("從下方點選武將加入此陣");
  } else if (action === "tactic-equip") {
    save.equippedTactic = button.dataset.tactic;
    resetAllies();
    persist();
    const tactic = TACTICS.find((item) => item.id === save.equippedTactic);
    toast("軍陣戰法已切換為「" + (tactic?.name || "戰法") + "」");
    renderTactics();
  } else if (action === "tactic-level") {
    const id = button.dataset.tactic;
    const tactic = TACTICS.find((item) => item.id === id);
    const cost = tactic.cost * save.tactics[id];
    if (save.food < cost) return toast("糧草不足");
    save.food -= cost;
    save.tactics[id] += 1;
    resetAllies();
    persist();
    updateHud();
    toast(tactic.name + "升至 Lv." + save.tactics[id]);
    renderTactics();
  } else if (action === "setting-toggle") {
    save[button.dataset.setting] = !save[button.dataset.setting];
    if (button.dataset.setting === "sound" || button.dataset.setting === "music") {
      window.TaoyuanAudio?.configure?.({ sound: save.sound, music: save.music });
    }
    persist();
    renderSettings();
  } else if (action === "auth-switch") {
    window.TaoyuanAuth?.open?.({ mode: "login" });
  } else if (action === "auth-logout") {
    persist();
    window.TaoyuanAuth?.logout?.();
  } else if (action === "notification-request") {
    window.TaoyuanPlatform.requestNotifications().then((permission) => {
      save.notifications = permission === "granted";
      persist();
      renderSettings();
      toast(save.notifications ? "通知已開啟" : "通知未授權");
    });
  } else if (action === "rename-player") {
    const name = window.prompt("請輸入主公名稱", save.playerName || "玄德");
    if (name?.trim()) {
      save.playerName = name.trim().slice(0, 10);
      persist();
      updateHud();
      renderSettings();
    }
  } else if (action === "mail-claim") {
    if (save.mailClaimed) return;
    save.mailClaimed = true;
    recordTaskProgress("daily-mail");
    awardResources({ gold: 300, food: 120 });
    persist();
    updateHud();
    toast("獲得銅錢 300、糧草 120");
    renderMail();
  } else if (action === "achievement-claim") {
    const achievement = achievementData().find((item) => item.id === button.dataset.achievement);
    if (!achievement || achievement.value < achievement.target || save.achievementClaimed.includes(achievement.id)) return;
    save.achievementClaimed.push(achievement.id);
    awardResources(achievement);
    persist();
    updateHud();
    toast("成就獎勵已領取");
    renderAchievements();
  } else if (action === "save-now") {
    persist();
    toast("軍務進度已保存");
  } else if (action === "restore-purchases") {
    window.TaoyuanIAP.restore().then((result) => toast(result.ok ? "購買已恢復" : "目前無可恢復的 App 購買"));
  } else if (action === "version-check") {
    toast("目前已是最新本地版本 " + APP_VERSION);
  } else if (action === "quality-toggle") {
    save.renderQuality = save.renderQuality === "low" ? "high" : "low";
    persist();
    renderSettings();
    toast(save.renderQuality === "low" ? "已切換低功耗模式" : "已切換高品質");
  } else if (action === "report-issue") {
    const report = window.prompt("請描述問題", "");
    if (report?.trim()) {
      window.TaoyuanPlatform.track("player_report", { report: report.trim().slice(0, 200) });
      toast("已記錄回報");
    }
  } else if (action === "reset-save") {
    if (window.confirm("確定重置所有關卡、武將與資源進度？")) {
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    }
  } else if (action === "campaign-select") startStage(Number(button.dataset.stage));
  else if (action === "campaign-sweep") sweepStage(Number(button.dataset.stage));
  else if (action === "daily-task-claim") claimTask(button.dataset.task, button.dataset.weekly === "true");
  else if (action === "checkin-claim") claimCheckin();
  else if (action === "ad-daily") claimDailyAd();
  else if (action === "shop-buy") buyShopItem(button.dataset.shop);
  else if (action === "arena-challenge") challengeArena(button.dataset.opponent);
  else if (action === "arena-open") renderArena();
  else if (action === "tower-challenge") challengeTower();
  else if (action === "dungeon-challenge") challengeDungeon(button.dataset.dungeon);
  else if (action === "trial-challenge") challengeTrial(button.dataset.trial);
  else if (action === "title-equip") {
    const title = titleById(button.dataset.title);
    if (title && titleUnlocked(title)) {
      save.equippedTitle = title.id;
      persist();
      updateHud();
      renderCollection();
      toast("稱號已裝備");
    }
  } else if (action === "treasure-equip") {
    const treasure = treasureById(button.dataset.treasure);
    if (treasure && campaignClears() >= treasure.unlock) {
      save.equippedTreasure = treasure.id;
      resetAllies();
      persist();
      updateHud();
      renderCollection();
      toast("寶物已配備");
    }
  } else if (action === "frame-equip") equipAvatarFrame(button.dataset.frame);
  else if (action === "claim-faction-milestone") claimFactionMilestone(button.dataset.key);
  else if (action === "troop-mastery-upgrade") upgradeTroopMastery(button.dataset.role);
  else if (action === "event-claim") claimLocalEvent(button.dataset.event);
  else if (action === "event-tab") renderEvents(button.dataset.tab);
  else if (action === "battlepass-claim") {
    const lvl = Number(button.dataset.level);
    const currentXp = save.battlePass?.xp || 0;
    const currentLevel = Math.min(30, Math.floor(currentXp / 10) + 1);
    save.battlePass ||= { xp: 0, claimed: [] };
    save.battlePass.claimed ||= [];
    if (lvl > currentLevel || save.battlePass.claimed.includes(lvl)) return;
    save.battlePass.claimed.push(lvl);
    const reward = battlePassLevelReward(lvl);
    awardResources(reward);
    persist();
    updateHud();
    toast("領取第 " + lvl + " 階敕令大獎！");
    renderEvents("pass");
  } else if (action === "toast") toast(button.dataset.message || "功能準備中");
}

function showTutorial() {
  if (save.tutorialDone) {
    const layer = $("tutorialLayer");
    if (layer) layer.hidden = true;
    return;
  }
  const stepIndex = Math.min(save.tutorialStep || 0, (TUTORIAL_STEPS.length || 1) - 1);
  const step = TUTORIAL_STEPS[stepIndex];
  if (!step) {
    save.tutorialDone = true;
    persist();
    const layer = $("tutorialLayer");
    if (layer) layer.hidden = true;
    return;
  }
  const titleEl = $("tutorialTitle");
  const bodyEl = $("tutorialBody");
  const nextBtn = $("tutorialNext");
  const barEl = $("tutorialProgressBar");
  if (titleEl) titleEl.textContent = step.title;
  if (bodyEl) bodyEl.textContent = step.body;
  if (nextBtn) nextBtn.textContent = step.action || "繼續";
  if (barEl) barEl.style.width = ((stepIndex + 1) / Math.max(1, TUTORIAL_STEPS.length) * 100) + "%";
  const layer = $("tutorialLayer");
  if (layer) layer.hidden = false;
}

function advanceTutorial() {
  save.tutorialStep = (save.tutorialStep || 0) + 1;
  if (save.tutorialStep >= TUTORIAL_STEPS.length) {
    save.tutorialDone = true;
    const layer = $("tutorialLayer");
    if (layer) layer.hidden = true;
  } else {
    showTutorial();
  }
  persist();
}
