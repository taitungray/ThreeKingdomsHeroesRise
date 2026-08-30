/* UI Modes: campaign map, stage sweep, Tower, Arena 5v5 and Dungeons */
"use strict";

const UI_TEXT = {
  daily: "日務",
  shop: "行商",
  arena: "演武場",
  claim: "領取",
  claimed: "已領",
  battle: "出征",
  continue: "繼續征戰",
  retry: "再戰本關",
  close: "回到軍府"
};

function startStage(stage, reason = "征戰", options = {}) {
  ensureCycleState();
  runtime.activeStage = Math.max(1, Number(stage) || 1);
  runtime.waveClears = 0;
  runtime.bossActive = false;
  runtime.spawning = false;
  runtime.enemies = [];
  runtime.projectiles = [];
  clearResourceDrops();
  resetAllies();
  if (!options.keepPanel) closePanel();
  spawnWave(false, true);
  updateHud();
  const config = stageDefinition(runtime.activeStage);
  addLog("進入「" + (config?.name || ("關卡 " + runtime.activeStage)) + "」· " + reason);
}

function renderCampaign() {
  const current = activeStageNumber();
  const stages = GAME_DATA.stages || [];
  const currentChapter = chapterForStage() || CHAPTERS[0] || { name: "征戰", stage: "戰場", boss: "敵將" };
  const chapterMark = (currentChapter.name || "征").slice(0, 1);
  const currentBoss = enemyGeneralById(stageDefinition(current)?.bossGeneral) || null;
  const cards = stages.map((stage) => {
    const passed = stage.id < save.stage;
    const isCurrent = stage.id === save.stage;
    const isBoss = stage.id % 5 === 0;
    const stageChapter = CHAPTERS[Math.min(CHAPTERS.length - 1, Math.floor((stage.id - 1) / STAGES_PER_CHAPTER))] || currentChapter;
    const stageChapterIndex = Math.min(CHAPTERS.length - 1, Math.floor((stage.id - 1) / STAGES_PER_CHAPTER));
    const general = stage.bossGeneral ? enemyGeneralById(stage.bossGeneral) : null;
    const bossName = general?.name || stageChapter.boss || "敵將";
    const stageLabel = stage.name || stageChapter.stage || ("關卡 " + stage.id);
    const stars = save.stageStars?.[stage.id] || (passed ? 3 : 0);
    const starHtml = Array.from({ length: 3 }, (_, index) => '<i class="stage-star' + (index < stars ? " earned" : "") + '"></i>').join("");
    return '<article class="stage-card ' + (isCurrent ? "current" : passed ? "cleared" : "locked") + ' ' + (isBoss ? "boss" : "") + '" data-stage="' + stage.id + '" data-chapter="' + stageChapterIndex + '">' +
      '<span class="stage-visual stage-visual-' + stageChapterIndex + '" aria-hidden="true"></span>' +
      '<div class="stage-info">' +
        '<h3>' + stageLabel + '</h3>' +
        '<p>' + (isBoss ? "守將 · " + bossName : (stageChapter.name || "征戰")) + '</p>' +
        '<div class="stage-stars">' + starHtml + '</div>' +
      '</div>' +
      '<div class="stage-actions">' +
        '<button class="seal-button panel-action" type="button" data-action="campaign-select" data-stage="' + stage.id + '"' + (stage.id > save.stage ? " disabled" : "") + '>' + (stage.id === current ? "征戰中" : passed ? "重戰" : "挑戰") + '</button>' +
        '<button class="stone-button panel-action" type="button" data-action="campaign-sweep" data-stage="' + stage.id + '"' + (!passed ? " disabled" : "") + '>掃蕩<br><small>1 體力</small></button>' +
      '</div>' +
    '</article>';
  }).join("");
  setPanel("征戰天下",
    '<section class="campaign-chapter-hero" data-chapter="' + Math.min(CHAPTERS.length - 1, Math.floor((current - 1) / STAGES_PER_CHAPTER)) + '">' +
      '<div class="campaign-chapter-badge" aria-hidden="true">' + chapterMark + '</div>' +
      '<div>' +
        '<span class="eyebrow">當前章節</span>' +
        '<h3>' + (currentChapter.name || "征戰") + '</h3>' +
        '<p>' + (currentChapter.stage || "戰場") + ' · 守將 ' + (currentChapter.boss || "敵將") + '</p>' +
      '</div>' +
      (currentBoss?.portrait ? '<span class="campaign-boss-portrait" style="background-image:url(\'' + currentBoss.portrait + '\')" aria-label="守將 ' + (currentBoss.name || currentChapter.boss || "敵將") + '"></span>' : '<span class="campaign-boss-portrait" aria-hidden="true"></span>') +
    '</section>' +
    '<div class="stage-list">' + cards + '</div>');
}

function sweepStage(stage = Math.max(1, save.stage - 1)) {
  if (stage >= save.stage) return toast("需先通關一次才能掃蕩");
  if (!spendStamina(1)) return toast("體力不足，等待回復");
  const config = stageDefinition(stage);
  const reward = { gold: Math.round((config?.goldBonus || 20 + stage * 3) * .9), food: Math.round((35 + stage * 5) * .9), exp: 12 + stage };
  awardResources(reward);
  recordStat("wins");
  recordTaskProgress("daily-battle", 3);
  save.battlePass.xp = (save.battlePass.xp || 0) + 1;
  persist();
  updateHud();
  renderCampaign();
  toast("掃蕩完成，獲得軍資");
}

function renderArena() {
  const power = currentArmyPower();
  const claimedCount = save.arena?.claimed?.length || 0;
  const cards = ARENA_OPPONENTS.map((opponent) => {
    const challenged = (save.arena?.claimed || []).includes(opponent.id);
    const portraits = (opponent.generals || []).map((id) => enemyGeneralById(id)).filter(Boolean).map((general) => avatarHtml(general, false)).join("");
    return '<article class="arena-card ' + (challenged ? "cleared" : "") + '"><div class="arena-badge">' + (opponent.tag || "戰") + '</div><div><h3>' + opponent.name + '</h3><p>評估戰力 <strong>' + formatNumber(opponent.power) + '</strong> · 敵陣 ' + (opponent.generals?.length || 3) + ' 將</p><div class="arena-portraits" aria-label="敵方武將">' + portraits + '</div><small>獎勵 ' + rewardHtml(opponent.reward, true) + '</small></div><button class="' + (challenged ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="arena-challenge" data-opponent="' + opponent.id + '"' + (challenged ? " disabled" : "") + '>' + (challenged ? "已挑戰" : "切磋") + '</button></article>';
  }).join("");
  setPanel("演武場", '<section class="arena-banner"><h3>演武擂台</h3><p>與名將幻影進行 5v5 正式對決，驗證陣容剋制與戰法策略。每週結算重置。</p><div class="mode-stats"><span>我方戰力 <b>' + formatNumber(power) + '</b></span><span>本週已勝 <b>' + claimedCount + ' / ' + ARENA_OPPONENTS.length + '</b></span></div></section><div class="arena-list">' + cards + '</div>');
}

function challengeArena(opponentId) {
  ensureCycleState();
  const opponent = ARENA_OPPONENTS.find((item) => item.id === opponentId);
  if (!opponent || (save.arena?.claimed || []).includes(opponent.id)) return;
  runtime.mode = "arena";
  runtime.arenaOpponent = opponent.id;
  runtime.bossActive = false;
  runtime.waveClears = 0;
  closePanel();
  resetAllies();
  spawnWave(true, true);
  addLog("前往演武場挑戰「" + opponent.name + "」。");
  toast("進入演武場·對決「" + opponent.name + "」");
}

function renderDungeons() {
  const stamina = staminaStatus();
  const cards = DAILY_DUNGEONS.map((dungeon) => {
    const claimed = Boolean(save.dungeons?.claimed?.[dungeon.id]);
    return '<article class="mode-card ' + (claimed ? "cleared" : "") + '" data-dungeon="' + dungeon.id + '"><div class="mode-icon">特</div><div><h3>' + dungeon.name + '</h3><p>' + dungeon.desc + '</p><small>建議戰力 ' + formatNumber(dungeon.power) + ' · ' + rewardHtml(dungeon.reward, true) + '</small></div><button class="' + (claimed ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="dungeon-challenge" data-dungeon="' + dungeon.id + '"' + (claimed || stamina.current < dungeon.cost ? " disabled" : "") + '>' + (claimed ? "已完成" : "挑戰") + '<br><small>' + dungeon.cost + ' 體力</small></button></article>';
  }).join("");
  setPanel("日常副本", '<section class="mode-banner"><span class="eyebrow">每日特訓 · 資源獲取</span><h3>日常副本</h3><p>挑戰特定主題部隊與首領，獲取大量銅錢、糧草、玉璧與鍛造碎片。每日 00:00 重置。</p><div class="mode-stats"><span>體力 <b>' + stamina.current + ' / ' + stamina.max + '</b></span><span>每 5 分鐘回復 <b>+1</b></span></div></section><div class="mode-list">' + cards + '</div>');
}

function challengeDungeon(dungeonId) {
  ensureCycleState();
  const dungeon = DAILY_DUNGEONS.find((item) => item.id === dungeonId);
  if (!dungeon || save.dungeons?.claimed?.[dungeon.id]) return;
  if (!spendStamina(dungeon.cost)) return toast("體力不足，等待回復");
  runtime.mode = "dungeon";
  runtime.dungeonId = dungeon.id;
  runtime.bossActive = false;
  runtime.waveClears = 0;
  closePanel();
  resetAllies();
  spawnWave(false, true);
  addLog("挑戰日常副本「" + dungeon.name + "」。");
  toast("出征「" + dungeon.name + "」！");
}

function renderTower() {
  const stamina = staminaStatus();
  const nextFloor = (save.tower?.floor || 0) + 1;
  const required = TOWER_CONFIG.basePower + (nextFloor - 1) * TOWER_CONFIG.powerStep;
  const cost = TOWER_CONFIG.stamina || 4;
  const power = currentArmyPower();
  setPanel(TOWER_CONFIG.name || "問天樓", '<section class="mode-banner tower-banner"><span class="eyebrow">無盡本機模式</span><h3>' + (TOWER_CONFIG.name || "問天樓") + '</h3><p>已通關 ' + (save.tower?.best || 0) + ' 層，下層建議戰力 ' + formatNumber(required) + '。</p><div class="mode-stats"><span>我方 <b>' + formatNumber(power) + '</b></span><span>體力 <b>' + stamina.current + ' / ' + stamina.max + '</b></span></div></section><button class="seal-button wide-button" type="button" data-action="tower-challenge"' + (stamina.current < cost ? " disabled" : "") + '>挑戰第 ' + nextFloor + ' 層 · 消耗 ' + cost + ' 體力</button><p class="panel-footnote">每層只計入最高進度，失敗可重新挑戰。</p>');
}

function challengeTower() {
  ensureCycleState();
  const nextFloor = (save.tower?.floor || 0) + 1;
  const cost = TOWER_CONFIG.stamina || 4;
  if (!spendStamina(cost)) return toast("體力不足，等待回復");
  runtime.mode = "tower";
  runtime.towerFloor = nextFloor;
  persist();
  startStage(Math.min(save.stage, GAME_DATA.stages?.length || save.stage), "問天樓第 " + nextFloor + " 層");
}

function renderTrials() {
  const stamina = staminaStatus();
  const clearedList = save.trials?.cleared || [];
  const trials = typeof HERO_FATE_TRIALS !== "undefined" ? HERO_FATE_TRIALS : (window.HERO_FATE_TRIALS || []);
  const power = currentArmyPower();

  const cards = trials.map((trial) => {
    const isCleared = clearedList.includes(trial.id);
    const hero = heroById(trial.heroId);
    return '<article class="trial-card ' + (isCleared ? "cleared" : "") + '">' +
      avatarHtml(hero, false) +
      '<div class="trial-card-copy"><span class="eyebrow">' + trial.chapter + '</span><h3>' + trial.name + '</h3><p>' + trial.desc + '</p><small>首通解鎖：' + trial.reward.frame.name + ' + ' + trial.reward.title.name + ' + 碎片×' + trial.reward.shards + '</small></div>' +
      '<button class="' + (isCleared ? "stone-button" : "seal-button") + ' panel-action" type="button" data-action="trial-challenge" data-trial="' + trial.id + '"' + (stamina.current < trial.cost ? " disabled" : "") + '>' + (isCleared ? "重戰" : "挑戰") + '<br><small>' + trial.cost + ' 體力</small></button>' +
    '</article>';
  }).join("");

  setPanel("名將列傳試煉",
    '<section class="mode-banner">' +
      '<span class="eyebrow">三國傳奇 · 宿命挑戰</span>' +
      '<h3>名將列傳試煉</h3>' +
      '<p>挑戰各陣營名將的經典傳奇戰役，首通解鎖專屬動態頭像框、稱號與大量名將碎片！</p>' +
      '<div class="mode-stats">' +
        '<span>我方戰力 <b>' + formatNumber(power) + '</b></span>' +
        '<span>已通關 <b>' + clearedList.length + ' / ' + trials.length + '</b></span>' +
        '<span>體力 <b>' + stamina.current + ' / ' + stamina.max + '</b></span>' +
      '</div>' +
    '</section>' +
    '<div class="mode-list" style="margin-top:10px;">' + cards + '</div>');
}

function challengeTrial(trialId) {
  ensureCycleState();
  const trials = typeof HERO_FATE_TRIALS !== "undefined" ? HERO_FATE_TRIALS : (window.HERO_FATE_TRIALS || []);
  const trial = trials.find((item) => item.id === trialId);
  if (!trial) return;
  if (!spendStamina(trial.cost || 3)) return toast("體力不足，等待回復");
  runtime.mode = "trial";
  runtime.trialId = trial.id;
  runtime.bossActive = false;
  runtime.waveClears = 0;
  closePanel();
  resetAllies();
  spawnWave(false, true);
  addLog("進入名將列傳試煉「" + trial.name + "」。");
  toast("出征「" + trial.name + "」！");
}
