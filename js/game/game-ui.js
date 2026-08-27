/* UI: HUD, panels, roster, campaign and panel actions */
"use strict";

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
  setHudText("lordName", save.playerName || "\u7384\u5fb7");
  setHudText("lordLevel", "Lv." + save.level);
  setHudText("armyTitle", titleById(save.equippedTitle)?.name || "\u7fa9\u52c7\u8ecd");
  const needed = 90 + save.level * 35;
  setHudText("expText", Math.floor(save.exp) + "/" + needed);
  setHudStyle("expFill", "width", clamp((save.exp / needed) * 100, 0, 100) + "%");
  const chapter = chapterForStage();
  setHudText("chapterLabel", chapter.name);
  const stage = activeStageNumber();
  const stageConfig = stageDefinition(stage);
  const chapterStage = ((stage - 1) % STAGES_PER_CHAPTER) + 1;
  const chapterNumber = Math.floor((stage - 1) / STAGES_PER_CHAPTER) + 1;
  setHudText("stageLabel", chapterNumber + "-" + chapterStage);
  setHudText("stageName", stageConfig?.name || "關卡 " + stage);
  setHudText("stagePowerLabel", "推薦戰力 " + formatNumber(Math.round(2300 + (stage - 1) * 320)));
  if ($("enemyPreviewStage")) setHudText("enemyPreviewStage", stageConfig?.name || "關卡 " + stage);
  setHudText("waveLabel", runtime.bossActive ? "首領戰" : "第 " + (runtime.waveClears + 1) + " 波");
  const living = runtime.enemies.reduce((count, enemy) => count + (enemy.dead ? 0 : 1), 0);
  setHudText("enemyCount", "敵軍 " + living);
  setHudText("bossProgress", Math.min(runtime.waveClears, 3) + " / 3");
  const bossDisabled = runtime.waveClears < 3 || runtime.bossActive || runtime.spawning;
  setHudProperty("bossButton", "disabled", bossDisabled);
  setHudAttribute("bossButton", "aria-label", runtime.bossActive ? "首領戰進行中" : runtime.waveClears < 3 ? "完成三波後挑戰關卡首領" : runtime.spawning ? "首領正在準備" : "挑戰關卡首領");
  const auto = Boolean(runtime.auto);
  if (runtime.hudCache.auto !== auto) {
    runtime.hudCache.auto = auto;
    $("autoButton").classList.toggle("active", auto);
  }
  setHudText("autoButton", auto ? "自動" : "手動");
  setHudAttribute("autoButton", "aria-pressed", auto);
  setHudText("speedButton", "×" + runtime.timeScale);
  setHudAttribute("speedButton", "aria-valuetext", "戰鬥速度 ×" + runtime.timeScale);
  setHudProperty("mailDot", "hidden", Boolean(save.mailClaimed));
  const dailyReady = DAILY_TASKS.some((task) => (save.daily.progress[task.id] || 0) >= task.target && !save.daily.claimed.includes(task.id)) || (save.checkin.day < 7 && !save.checkin.claimed.includes(save.checkin.day + 1));
  setHudProperty("dailyDot", "hidden", !dailyReady);
  const eventReady = LOCAL_EVENTS.some((event) => eventProgress(event.id) >= event.target && !save.eventState.claimed.includes(event.id));
  setHudProperty("eventDot", "hidden", !eventReady);
}

function enemyPreviewAvatarHtml(general) {
  const avatar = general?.avatar || "avatar-locked";
  return '<span class="pixel-avatar ' + avatar + ' enemy-preview-avatar"><i></i><span class="portrait-eyes" aria-hidden="true"></span><span class="avatar-detail" aria-hidden="true"></span></span>';
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
    "<article class=\"enemy-preview-card" + (general.isBoss ? " boss" : "") + "\">" +
      enemyPreviewAvatarHtml(general) +
      "<div><strong>" + (general.name || "\u6575\u5c07") + "</strong><small>" + (general.title || general.role || "\u6575\u5c07") + "</small></div>" +
      (general.isBoss ? "<span class=\"general-badge\">BOSS</span>" : "") +
    "</article>"
  ).join("");
  const stageName = config?.name || "\u95dc\u5361 " + stage;
  const stageLabel = $("enemyPreviewStage");
  if (stageLabel) stageLabel.textContent = stageName;
  const phaseLabel = $("enemyPreviewLabel");
  if (phaseLabel) phaseLabel.textContent = bossWave ? "\u9996\u9818\u6575\u5c07" : "\u672c\u6ce2\u6575\u5c07";
  preview.dataset.wave = bossWave ? "boss" : String(currentWave);
  preview.dataset.general = selected?.id || "";
  preview.classList.add("show", "persistent");
  clearTimeout(runtime.enemyPreviewTimer);
  runtime.enemyPreviewTimer = null;
}
function showDialogue(name, text, avatarClass) {
  const portrait = $("dialoguePortrait");
  const portraitHero = HEROES.find((hero) => hero.avatar === avatarClass);
  const portraitKey = portraitHero?.portraitKey || portraitHero?.id;
  const portraitAsset = portraitHero?.portrait ? " portrait-asset portrait-asset-" + portraitKey : "";
  portrait.className = "pixel-avatar " + avatarClass + portraitAsset;
  portrait.innerHTML = '<i></i><span class="portrait-eyes" aria-hidden="true"></span><span class="avatar-detail" aria-hidden="true"></span>';
  $("dialogueName").textContent = name;
  $("dialogueText").textContent = text;
  $("dialogueBox").classList.add("show");
  runtime.dialogueTimer = 2.7;
}

let toastTimer = 0;
function toast(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").classList.add("show");
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 1900);
}

function avatarHtml(hero, large = false) {
  const loadoutClasses = hero.id ? " " + paperDollClasses(hero.id) : "";
  const frameClass = hero.id ? " avatar-frame-" + (save.equippedFrame || "plain") : "";
  const portraitKey = hero.portraitKey || hero.id;
  const portraitAssetClass = hero.portrait && !large ? " portrait-asset portrait-asset-" + portraitKey : "";
  const heroData = hero.id ? ' data-hero="' + hero.id + '"' : "";
  const paperLayer = hero.id ? '<b class="paper-layer" aria-hidden="true"></b><em class="mount-mark" aria-hidden="true"></em>' : "";
  const portraitStyle = hero.accent ? ' style="--portrait-tone:' + hero.color + ';--portrait-accent:' + hero.accent + (hero.portrait && !large ? ';background-image:url("' + hero.portrait + '")' : "") + '"' : (hero.portrait && !large ? ' style="background-image:url("' + hero.portrait + '")"' : "");
  return '<span class="pixel-avatar ' + hero.avatar + portraitAssetClass + loadoutClasses + frameClass + (large ? " large" : "") + '"' + heroData + portraitStyle + '><i></i><span class="portrait-eyes" aria-hidden="true"></span><span class="portrait-rune" aria-hidden="true"></span><span class="avatar-detail" aria-hidden="true"></span>' + paperLayer + '</span>';
}

function heroCardHtml(hero, action = "hero-detail") {
  const unlocked = isUnlocked(hero);
  const selected = save.formation.includes(hero.id);
  const progression = unlocked ? heroProgression(hero.id) : null;
  return '<button class="hero-card' + (unlocked ? "" : " locked") + (selected ? " selected" : "") + '" type="button" data-action="' + action + '" data-hero="' + hero.id + '">' +
    avatarHtml(unlocked ? hero : { avatar: "avatar-locked" }) +
    '<strong>' + (unlocked ? hero.name : "？？？") + '</strong>' +
    '<small>' + (unlocked ? hero.role + " · Lv." + save.heroLevels[hero.id] + " P" + Math.round((hero.atk * 7 + hero.hp + hero.def * 12) * (1 + save.heroLevels[hero.id] * .13)) : "第 " + hero.unlock + " 關解鎖") + '</small>' +
    '<b class="rarity">' + "◆".repeat(Math.min(3, Math.max(1, hero.rarity - 2))) + '</b>' +
    (unlocked ? '<span class="hero-stars">\u2605' + progression.stars + '/5</span>' : "") +
    (unlocked ? "" : '<span class="lock-label">尚未相遇</span>') +
    "</button>";
}

function closePanel() {
  $("panelBackdrop").hidden = true;
  runtime.panel = null;
  runtime.selectedHero = null;
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.toggle("selected", button.dataset.panel === "battle"));
}

function setPanel(title, html, canBack = false) {
  $("panelTitle").textContent = title;
  $("panelContent").innerHTML = html;
  $("panelBack").hidden = !canBack;
  $("panelContent").scrollTop = 0;
}

function renderHeroes(filter = runtime.heroFilter) {
  runtime.heroSort ||= save.heroSort || "power";
  runtime.heroFilter = filter;
  $("heroNotice").hidden = true;
  const powerOf = (hero) => {
    const equipment = heroEquipmentStats(hero.id);
    return Math.round((hero.atk + equipment.atk) * 7 + hero.hp + equipment.hp + (hero.def + equipment.def) * 12 + (save.heroLevels[hero.id] || 1) * 48);
  };
  const heroes = HEROES.filter((hero) => filter === "owned" ? isUnlocked(hero) : filter === "locked" ? !isUnlocked(hero) : true).sort((a, b) => {
    if (runtime.heroSort === "level") return (save.heroLevels[b.id] || 0) - (save.heroLevels[a.id] || 0);
    if (runtime.heroSort === "role") return String(a.role).localeCompare(String(b.role));
    return powerOf(b) - powerOf(a);
  });
  const tabs = '<div class="panel-tabs">' +
    '<button type="button" data-action="hero-filter" data-filter="all" class="' + (filter === "all" ? "active" : "") + '">全部</button>' +
    '<button type="button" data-action="hero-filter" data-filter="owned" class="' + (filter === "owned" ? "active" : "") + '">已擁有</button>' +
    '<button type="button" data-action="hero-filter" data-filter="locked" class="' + (filter === "locked" ? "active" : "") + '">未相遇</button>' +
    "</div>";
  const sortRow = '<div class="hero-sort-row"><span>\u6392\u5e8f</span><button type="button" data-action="hero-sort" data-sort="power" class="' + (runtime.heroSort === "power" ? "active" : "") + '">\u6230\u529b</button><button type="button" data-action="hero-sort" data-sort="level" class="' + (runtime.heroSort === "level" ? "active" : "") + '">\u7b49\u7d1a</button><button type="button" data-action="hero-sort" data-sort="role" class="' + (runtime.heroSort === "role" ? "active" : "") + '">\u5175\u7a2e</button></div>';
  setPanel("武將名冊", tabs + sortRow +
    '<p class="section-caption">不抽卡 · 依戰役結識名將</p>' +
    '<div class="hero-grid">' + heroes.map((hero) => heroCardHtml(hero)).join("") + "</div>" +
    '<p class="section-caption">軍中提示</p>' +
    '<div class="record-item">完成歷史關卡即可讓名將加入。升級只消耗征戰取得的銅錢，不需要抽取重複角色。</div>');
}

function paperDollHtml(hero) {
  const slots = PAPER_DOLL_SLOTS.map((slot) => {
    const item = paperDollItem(hero.id, slot.id);
    return '<button class="paper-slot paper-slot-' + slot.id + ' item-icon-' + item.id + '" type="button" data-action="paper-cycle" data-hero="' + hero.id + '" data-slot="' + slot.id + '" aria-label="更換' + slot.label + '">' +
      '<i class="slot-mark slot-mark-' + slot.id + '" aria-hidden="true"></i><span>' + slot.label + '</span><b>' + item.name + '</b><small>' + item.bonus + '</small><em>點擊輪換</em></button>';
  }).join("");
  return '<section class="paper-doll-panel">' +
    '<div class="paper-doll-heading"><div><span class="eyebrow">CUSTOM LOADOUT</span><h3>紙娃娃配置</h3></div><span class="paper-doll-hint">點裝備槽切換外觀</span></div>' +
    '<div class="paper-doll-board"><div class="paper-doll-stage">' + avatarHtml(hero, true) + '<span class="paper-doll-rune">' + hero.role + '</span></div><div class="paper-slot-grid">' + slots + '</div></div>' +
    '<p class="paper-doll-note">裝備會立刻套用到戰場、編隊與武將卡。<strong>當前加成：' + equipmentBonusLabel(hero.id) + '</strong></p>' +
    '</section>';
}

function renderHeroDetail(heroId) {
  const hero = heroById(heroId);
  if (!hero || !isUnlocked(hero)) {
    toast("推進至第 " + hero.unlock + " 關後結識");
    return;
  }
  runtime.selectedHero = heroId;
  const level = save.heroLevels[heroId];
  const equipment = heroEquipmentStats(heroId);
  const cost = 70 + level * 42;
  const inFormation = save.formation.includes(heroId);
  const refineLevel = Number(save.equipmentRefine?.[heroId] || 0);
  const refineCost = 1 + refineLevel * 2;
  const progression = heroProgression(heroId);
  const growth = heroGrowthMultiplier(heroId);
  const starCost = heroStarCost(heroId);
  const breakthroughCost = heroBreakthroughCost(heroId);
  const skillLevel = heroSkillLevel(heroId);
  const skillCost = heroSkillCost(heroId);
  const power = Math.round(((hero.atk + equipment.atk) * 7 + hero.hp + equipment.hp + (hero.def + equipment.def) * 12) * (1 + level * 0.13) * growth);
  setPanel("武將詳情",
    '<section class="detail-hero">' +
      avatarHtml(hero, true) +
      '<h3>' + hero.name + '</h3>' +
      '<span class="hero-role">' + hero.role + ' · ' + hero.title + '</span>' +
      '<p class="hero-power">戰力 <strong>' + formatNumber(power) + '</strong></p>' +
      '<p class="hero-progression">\u661f\u7d1a ' + progression.stars + ' / 5\u00b7\u7a81\u7834 ' + progression.breakthrough + ' / 3\u00b7\u540d\u5c07\u788e\u7247 ' + formatNumber(save.shards) + '</p>' +
      '<div class="stat-list">' +
        '<span>武力 <b>' + Math.round(hero.atk + level * 3.2 + equipment.atk) + '</b></span>' +
        '<span>兵力 <b>' + Math.round(hero.hp + level * 23 + equipment.hp) + '</b></span>' +
        '<span>統率 <b>' + Math.round(hero.def + level * .8 + equipment.def) + '</b></span>' +
        '<span>速度 <b>' + Math.round(hero.speed + equipment.speed) + '</b></span>' +
      '</div>' +
    '</section>' +
    '<p class="section-caption">戰法與被動</p>' +
    '<div class="hero-skill-card"><div><strong>\u6230\u6cd5 · ' + hero.skill + ' Lv.' + skillLevel + '</strong><span>\u51b7\u537b ' + Number(hero.skillCooldown || 5).toFixed(1) + ' \u79d2</span></div><p><b>\u6548\u679c</b> · ' + (HERO_SKILL_META[hero.id]?.effect || "\u6839\u64da\u5175\u7a2e\u767c\u63ee") + '</p><p><b>\u7bc4\u570d</b> · ' + (HERO_SKILL_META[hero.id]?.area || hero.role) + '</p><p><b>\u88ab\u52d5</b> · ' + (hero.passive || "\u5c1a\u672a\u8a18\u8f09") + '</p></div>' +    paperDollHtml(hero) +
    '<div class="action-row">' +
      '<button class="stone-button" type="button" data-action="formation-toggle" data-hero="' + heroId + '">' + (inFormation ? "撤下陣容" : "加入陣容") + '</button>' +
      '<button class="seal-button" type="button" data-action="hero-level" data-hero="' + heroId + '"' + (save.gold < cost ? " disabled" : "") + '>升至 Lv.' + (level + 1) + '<br><small>' + cost + ' 銅錢</small></button>' +
      '<button class="stone-button compact-button" type="button" data-action="equipment-refine" data-hero="' + heroId + '"' + (save.jade < refineCost ? " disabled" : "") + '>&#x7cbe;&#x7149; +' + refineLevel + '<br><small>' + refineCost + ' &#x7389;&#x74a7;</small></button>' +
      '<button class="stone-button compact-button" type="button" data-action="hero-star" data-hero="' + heroId + '"' + (!starCost || save.shards < starCost.shards || save.gold < starCost.gold ? " disabled" : "") + '>\u5347\u661f +' + (progression.stars + 1) + '<br><small>' + (starCost ? starCost.shards + " \u788e\u7247" : "\u5df2\u6eff\u661f") + '</small></button>' +
      '<button class="stone-button compact-button" type="button" data-action="hero-breakthrough" data-hero="' + heroId + '"' + (!breakthroughCost || save.shards < breakthroughCost.shards || save.jade < breakthroughCost.jade ? " disabled" : "") + '>\u7a81\u7834 +' + (progression.breakthrough + 1) + '<br><small>' + (breakthroughCost ? breakthroughCost.shards + " \u788e\u7247 + " + breakthroughCost.jade + " \u7389\u74a7" : "\u9700 3 \u661f") + '</small></button>' +
      '<button class="stone-button compact-button" type="button" data-action="hero-skill" data-hero="' + heroId + '"' + (!skillCost || save.gold < skillCost.gold || save.food < skillCost.food ? " disabled" : "") + '>戰法 +' + (skillLevel + 1) + '<br><small>' + (skillCost ? skillCost.gold + " 銅錢 + " + skillCost.food + " 糧草" : "已滿級") + '</small></button>' +
    '</div>',
    true
  );
}

function renderFormation() {
  const slots = Array.from({ length: 9 }, (_, slot) => {
    const heroId = save.formation.find((id) => save.positions[id] === slot);
    const hero = heroId ? heroById(heroId) : null;
    return '<button class="formation-slot' + (hero ? " filled" : "") + '" type="button" data-action="' + (hero ? "hero-detail" : "empty-slot") + '"' + (hero ? ' data-hero="' + hero.id + '"' : "") + '>' +
      (hero ? avatarHtml(hero) + "<b>" + hero.name + "</b>" : "") +
    "</button>";
  }).join("");
  const power = save.formation.reduce((sum, id) => {
    const hero = heroById(id);
    const equipment = heroEquipmentStats(id);
    return sum + Math.round(((hero.atk + equipment.atk) * 7 + hero.hp + equipment.hp) * (1 + save.heroLevels[id] * .13));
  }, 0);
  setPanel("出戰編隊",
    '<div class="formation-layout">' +
      '<div class="formation-board"><div class="slot-grid">' + slots + '</div></div>' +
      '<aside class="formation-summary">' +
        '<h3>義勇軍</h3>' +
        '<p>出戰 <strong>' + save.formation.length + ' / 5</strong></p>' +
        '<p>總戰力<br><strong>' + formatNumber(power) + '</strong></p>' +
        '<p>前排步騎承傷<br>後排弓謀輸出</p>' +
        '<button class="seal-button" type="button" data-action="formation-save">套用編隊</button>' +
      '</aside>' +
    '</div>' +
    '<p class="section-caption">點選武將加入或撤下</p>' +
    '<div class="hero-grid">' + HEROES.filter(isUnlocked).map((hero) => heroCardHtml(hero, "formation-toggle")).join("") + "</div>");
}

function renderTactics() {
  const tacticCards = TACTICS.map((tactic) => {
    const level = save.tactics[tactic.id];
    const cost = tactic.cost * level;
    return '<article class="tactic-card">' +
      '<div class="tactic-sigil"><span>' + tactic.sigil + '</span></div>' +
      '<h3>' + tactic.name + '</h3>' +
      '<span class="level-tag">Lv.' + level + '</span>' +
      '<p>' + tactic.desc + '<br>目前加成：' + Math.round(tacticBonus(tactic.id) * 100) + '%</p>' +
      '<button class="seal-button" type="button" data-action="tactic-level" data-tactic="' + tactic.id + '"' + (save.food < cost ? " disabled" : "") + '>強化 ' + cost + ' 糧</button>' +
    "</article>";
  }).join("");
  setPanel("兵法戰策",
    '<div class="panel-tabs"><button class="active" type="button">軍陣</button><span class="tab-note">ACTIVE ARMY PASSIVE</span></div>' +
    '<p class="section-caption">全隊永久生效</p>' +
    '<div class="tactic-list">' + tacticCards + "</div>");
}

function startStage(stage, reason = "") {
  const maxStage = GAME_DATA.stages?.length || CHAPTERS.length * STAGES_PER_CHAPTER;
  const target = clamp(Number(stage) || save.stage, 1, Math.max(save.stage, maxStage));
  if (target > save.stage) {
    toast("先完成前面的戰役才能進入此關");
    return;
  }
  runtime.activeStage = target;
  runtime.battleResult = null;
  clearScheduledGameTimers();
  recordStat("battles");
  window.TaoyuanPlatform?.track?.("stage_start", { stage: target });
  runtime.waveClears = 0;
  runtime.bossActive = false;
  runtime.spawning = false;
  runtime.enemies = [];
  runtime.projectiles = [];
  clearEffects();
  runtime.numbers = [];
  runtime.damageStats = {};
  buildTerrain();
  resetAllies();
  showEnemyPreview(target);
  spawnWave(false);
  updateHud();
  persist();
  closePanel();
  toast(reason || (target === save.stage ? "已進入目前關卡" : "開始重打第 " + target + " 關"));
}

function renderCampaign() {
  const items = CHAPTERS.map((chapter, index) => {
    const firstStage = index * STAGES_PER_CHAPTER + 1;
    const lastStage = firstStage + STAGES_PER_CHAPTER - 1;
    const firstStageConfig = stageDefinition(firstStage);
    const locked = save.stage < firstStage;
    const complete = save.stage > lastStage;
    const active = activeStageNumber() >= firstStage && activeStageNumber() <= lastStage;
    return '<button class="campaign-card' + (locked ? " locked" : active ? " active" : "") + '" type="button" data-number="' + String(index + 1).padStart(2, "0") + '" data-action="' + (locked ? "toast" : "campaign-select") + '" data-stage="' + firstStage + '" data-message="先完成前一章戰役">' +
      '<h3>' + chapter.name + '</h3>' +
      '<span class="campaign-stage-name">' + (firstStageConfig?.name || 'Stage ' + firstStage) + '</span>' +
      '<p>' + chapter.stage + ' · 首領：' + chapter.boss + '</p>' +
      '<span class="stage-stars">' + (complete ? "◆ ◆ ◆" : locked ? "◇ ◇ ◇" : "◆ ◇ ◇") + '</span>' +
    "</button>";
  }).join("");
  const sweepTarget = Math.max(1, save.stage - 1);
  const sweepHtml = save.stage > 1 ? '<div class="campaign-actions"><button class="stone-button wide-button" type="button" data-action="campaign-sweep" data-stage="' + sweepTarget + '">&#x6383;&#x8569;&#x7b2c; ' + sweepTarget + ' &#x95dc; &#x00b7; &#x6d88;&#x8017; 1 &#x9ad4;&#x529b;</button></div>' : '';
  setPanel("歷史戰役", sweepHtml +
    '<div class="campaign-route"><i></i><i></i><i></i><i></i><i></i><span>\u4e09\u570b\u884c\u8ecd\u8def\u7dda</span></div>' +
    '<p class="section-caption">沿三國史線推進</p>' +
    '<div class="campaign-list">' + items + "</div>");
}

function toggleFormation(heroId) {
  const hero = heroById(heroId);
  if (!isUnlocked(hero)) {
    toast("尚未在戰役中結識");
    return;
  }
  const index = save.formation.indexOf(heroId);
  if (index >= 0) {
    if (save.formation.length <= 1) {
      toast("至少要保留一名武將出戰");
      return;
    }
    save.formation.splice(index, 1);
  } else {
    if (save.formation.length >= 5) {
      toast("最多出戰五名武將");
      return;
    }
    save.formation.push(heroId);
    const used = new Set(save.formation.map((id) => save.positions[id]));
    save.positions[heroId] = [4, 3, 5, 7, 1, 6, 8, 0, 2].find((slot) => !used.has(slot)) ?? 4;
  }
  resetAllies();
  persist();
  beep(420, .05);
}

function renderProfile() {
  const power = runtime.allies.reduce((sum, unit) => sum + unit.maxHp + unit.atk * 8, 0);
  setPanel("主公軍府",
    '<section class="detail-hero">' +
      avatarHtml(heroById("liubei"), true) +
      '<h3>劉玄德</h3>' +
      '<span class="hero-role">義勇軍主公</span>' +
      '<p class="hero-power">軍勢 <strong>' + formatNumber(power) + '</strong></p>' +
      '<div class="stat-list"><span>主公等級 <b>' + save.level + '</b></span><span>歷史進度 <b>第 ' + save.stage + ' 關</b></span><span>名將數 <b>' + HEROES.filter(isUnlocked).length + '</b></span><span>陣容人數 <b>' + save.formation.length + '</b></span></div>' +
    '</section>' +
    '<p class="section-caption">軍府方針</p>' +
    '<div class="record-item">不設武將抽取。沿著歷史戰役結識角色，再透過等級、兵種位置與戰法構築自己的隊伍。</div>');
}


const HERO_SKILL_META = {
  liubei: { effect: "\u5168\u968a\u6cbb\u7642 12%", area: "\u5168\u968a" },
  guanyu: { effect: "2.05 \u500d\u9752\u9f8d\u65ac", area: "\u8fd1\u6230" },
  zhangfei: { effect: "1.7 \u500d\u9707\u5730\u50b7\u5bb3", area: "\u534a\u5f91 180" },
  zhaoyun: { effect: "\u9f8d\u81bd\u7a81\u9032\u9023\u523a", area: "\u76f4\u7dda" },
  huangzhong: { effect: "\u5ef6\u9072\u795e\u7bad 2.4 \u500d", area: "\u9060\u7a0b" },
  sunshang: { effect: "\u6247\u5f62\u7bad\u96e8", area: "\u9060\u7a0b\u7bc4\u570d" },
  caocao: { effect: "\u5168\u968a\u653b\u901f +16%", area: "\u5168\u968a" },
  xiahoudun: { effect: "\u7372\u5f97 25% \u6e1b\u50b7", area: "\u81ea\u8eab" },
  zhugeliang: { effect: "\u9023\u9396\u96f7\u64ca 25%", area: "\u6575\u65b9\u7bc4\u570d" },
  diaochan: { effect: "\u6a19\u8a18\u4e26\u9b45\u60d1\u6575\u4eba", area: "\u55ae\u9ad4" },
  lubu: { effect: "\u5168\u5c4f 2.4 \u500d\u50b7\u5bb3", area: "\u534a\u5f91 210" },
  locked: { effect: "\u5c1a\u672a\u89e3\u9396", area: "\u672a\u77e5" }
};
const UI_TEXT = {
  daily: "\u65e5\u52d9",
  shop: "\u884c\u5546",
  arena: "\u6f14\u6b66\u53f0",
  claim: "\u9818\u53d6",
  claimed: "\u5df2\u9818",
  battle: "\u51fa\u5f81",
  continue: "\u7e7c\u7e8c\u5f81\u6230",
  retry: "\u518d\u6230\u672c\u95dc",
  close: "\u56de\u5230\u8ecd\u5e9c"
};

function rewardHtml(reward = {}) {
  const labels = { gold: "\u9285\u9322", food: "\u7ce7\u8349", jade: "\u7389\u74a7", shards: "\u540d\u5c07\u788e\u7247", exp: "EXP" };
  const icons = { gold: "res-coin", food: "res-food", jade: "res-jade", shards: "res-shard", exp: "res-exp" };
  return Object.entries(reward).filter(([, value]) => value && value !== true).map(([key, value]) => '<span><i class="' + (icons[key] || "res-coin") + '"></i><b>' + formatNumber(value) + '</b> ' + (labels[key] || key) + '</span>').join("");
}

function currentArmyPower() {
  return save.formation.reduce((sum, id) => {
    const hero = heroById(id);
    if (!hero || !isUnlocked(hero)) return sum;
    const equipment = heroEquipmentStats(id);
    return sum + Math.round(((hero.atk + equipment.atk) * 7 + hero.hp + equipment.hp + (hero.def + equipment.def) * 12 + save.heroLevels[id] * 48) * heroGrowthMultiplier(id));
  }, 0);
}

function renderTask(task, state, weekly = false) {
  const progress = Math.min(task.target, state.progress[task.id] || 0);
  const claimed = state.claimed.includes(task.id);
  const complete = progress >= task.target;
  return '<article class="task-card ' + (complete ? "complete" : "") + '"><div class="task-icon">' + (weekly ? "W" : "D") + '</div><div class="task-copy"><strong>' + task.name + '</strong><small>' + task.desc + '</small><div class="progress-track"><i style="width:' + (progress / task.target * 100) + '%"></i></div><em>' + progress + ' / ' + task.target + '</em></div><button class="' + (complete && !claimed ? "seal-button" : "stone-button") + ' compact-button" type="button" data-action="daily-task-claim" data-task="' + task.id + '" data-weekly="' + weekly + '"' + (!complete || claimed ? " disabled" : "") + '>' + (claimed ? UI_TEXT.claimed : UI_TEXT.claim) + '</button></article>';
}

function renderDaily() {
  ensureCycleState();
  const checkinDay = Math.min(7, save.checkin.day + 1);
  const checkinClaimed = save.checkin.claimed.includes(checkinDay);
  const checkins = CHECKIN_REWARDS.map((reward, index) => '<div class="checkin-day ' + (index + 1 === checkinDay ? "today" : "") + ' ' + (save.checkin.claimed.includes(index + 1) ? "claimed" : "") + '"><b>' + (index + 1) + '</b><span>' + rewardHtml(reward) + '</span></div>').join("");
  const adDisabled = Boolean(save.daily.adClaimed || save.adFree);
  setPanel(UI_TEXT.daily, '<section class="daily-head"><div><span class="eyebrow">DAILY RATIONS</span><h3>\u4eca\u65e5\u8ecd\u52d9</h3><p>\u6bcf\u65e5 00:00 \u91cd\u7f6e\uff0c\u6bcf\u9031\u9031\u4e00\u66f4\u65b0</p><small class="pass-status">' + (save.monthlyPassUntil > Date.now() ? "PASS ACTIVE" : "") + '</small></div><button class="stone-button compact-button" type="button" data-action="ad-daily"' + (adDisabled ? " disabled" : "") + '>\u770b\u5ee3\u544a\u9818\u8ecd\u7ce7</button></section>' +
    '<p class="section-caption">\u65e5\u5e38\u4efb\u52d9</p><div class="task-list">' + DAILY_TASKS.map((task) => renderTask(task, save.daily)).join("") + '</div>' +
    '<p class="section-caption">\u9031\u5e38\u6311\u6230</p><div class="task-list">' + WEEKLY_TASKS.map((task) => renderTask(task, save.weekly, true)).join("") + '</div>' +
    '<p class="section-caption">\u4e03\u65e5\u7c3d\u5230 \u00b7 \u7b2c ' + checkinDay + ' \u5929</p><div class="checkin-grid">' + checkins + '</div><button class="seal-button wide-button" type="button" data-action="checkin-claim"' + (checkinClaimed || checkinDay > 7 ? " disabled" : "") + '>' + (checkinClaimed ? UI_TEXT.claimed : "\u9818\u53d6\u7b2c " + checkinDay + " \u5929\u8ecd\u8cc7") + '</button>');
}

function renderShop() {
  const cards = SHOP_ITEMS.map((item) => {
    const native = item.requiresNativePurchase;
    const cost = Object.entries(item.cost || {}).map(([key, value]) => (value ? '<span><i class="' + (key === "jade" ? "res-jade" : "res-coin") + '"></i>' + formatNumber(value) + '</span>' : "")).join("");
    const bought = Boolean(save.shopPurchases[item.id]);
    const label = native ? (window.TaoyuanIAP?.isAvailable?.() ? "\u958b\u5556\u8cfc\u8cb7" : "\u539f\u751f\u7248\u958b\u653e") : bought ? UI_TEXT.claimed : UI_TEXT.claim;
    return '<article class="shop-card rarity-' + item.tone + '"><div class="shop-icon">' + (item.tone === "legend" ? "\u2605" : "\u25c6") + '</div><div><h3>' + item.name + '</h3><p>' + item.desc + '</p><small>' + (native ? "\u9700\u5546\u5e97\u4ea4\u6613" : cost || "\u514d\u8cbb") + '</small></div><button class="' + (native || bought ? "stone-button" : "seal-button") + ' compact-button" type="button" data-action="shop-buy" data-shop="' + item.id + '"' + (bought ? " disabled" : "") + '>' + label + '</button></article>';
  }).join("");
  setPanel(UI_TEXT.shop, '<p class="section-caption">\u8ecd\u9700\u6240\u53d6\u5f97\uff0c\u4e0d\u8a2d\u865b\u5047\u6c38\u4e45\u8cb7\u8ce3\u3002</p><div class="shop-list">' + cards + '</div><p class="panel-footnote">\u539f\u751f\u5546\u5e97\u5546\u54c1\u672a\u914d\u7f6e\u6b63\u5f0f SKU \u6642\u6703\u81ea\u52d5\u4fdd\u6301\u505c\u7528\u3002</p>');
}

function renderArena() {
  const power = currentArmyPower();
  const cards = ARENA_OPPONENTS.map((opponent) => {
    const challenged = save.arena.claimed.includes(opponent.id);
    return '<article class="arena-card ' + (challenged ? "cleared" : "") + '"><div class="arena-badge">VS</div><div><h3>' + opponent.name + '</h3><p>\u8a55\u4f30\u6230\u529b <strong>' + formatNumber(opponent.power) + '</strong></p><small>\u6211\u65b9\u6230\u529b ' + formatNumber(power) + '</small></div><button class="' + (challenged ? "stone-button" : "seal-button") + ' compact-button" type="button" data-action="arena-challenge" data-opponent="' + opponent.id + '"' + (challenged ? " disabled" : "") + '>' + (challenged ? "\u5df2\u6311\u6230" : UI_TEXT.battle) + '</button></article>';
  }).join("");
  setPanel(UI_TEXT.arena, '<section class="arena-banner"><span class="eyebrow">LOCAL GHOST LADDER</span><h3>\u6f14\u6b66\u5e73\u53f0</h3><p>\u4e0d\u9023\u7dda\u4e5f\u53ef\u8207\u6b77\u53f2\u5f71\u5b50\u4ea4\u624b\uff0c\u6bcf\u9031\u91cd\u7f6e\u6311\u6230\u6b21\u6578\u3002</p></section><div class="arena-list">' + cards + '</div>');
}

function damageStatsHtml(rows = []) {
  if (!rows.length) return "";
  const max = Math.max(1, ...rows.map((row) => row.value));
  return '<div class="settlement-stats-title">本場傷害</div><div class="settlement-stats-list">' + rows.map((row) => '<span><b>' + row.name + '</b><i><em style="width:' + Math.round(row.value / max * 100) + '%"></em></i><small>' + formatNumber(row.value) + '</small></span>').join("") + '</div>';
}

function showSettlement(result) {
  const modal = $("settlementModal");
  if (!modal || !result) return;
  const win = result.type === "win";
  $("settlementTitle").textContent = win ? "\u6230\u529f\u544a\u6377" : "\u6574\u8ecd\u518d\u6230";
  $("settlementSubtitle").textContent = win ? (result.progressed ? "\u7b2c " + result.stage + " \u95dc\u9996\u9818\u5df2\u64ca\u7834" : "\u9996\u9818\u91cd\u6253\u6210\u529f") : "\u5168\u8ecd\u6682\u9000\uff0c\u95dc\u5361\u9032\u5ea6\u4e0d\u53d7\u5f71\u97ff";
  $("settlementLoot").innerHTML = rewardHtml(result.reward || {}) || '<span class="empty-loot">\u672c\u6b21\u672a\u7372\u5f97\u8cc7\u6e90</span>';
  const stats = $("settlementStats");
  if (stats) stats.innerHTML = damageStatsHtml(result.damage || []);
  const unlock = $("settlementUnlock");
  unlock.hidden = !result.newlyUnlocked;
  unlock.textContent = result.newlyUnlocked ? "\u540d\u5c07\u52a0\u5165\uff1a" + result.newlyUnlocked : "";
  $("settlementPrimary").textContent = win ? UI_TEXT.continue : UI_TEXT.retry;
  $("settlementSecondary").textContent = win ? UI_TEXT.retry : UI_TEXT.close;
  $("settlementPrimary").dataset.settlementAction = win ? "continue" : "retry";
  $("settlementSecondary").dataset.settlementAction = win ? "retry" : "close";
  modal.hidden = false;
}

function closeSettlement(action) {
  const result = runtime.battleResult;
  $("settlementModal").hidden = true;
  runtime.battleResult = null;
  runtime.spawning = false;
  runtime.enemies = [];
  runtime.projectiles = [];
  runtime.waveClears = 0;
  runtime.bossActive = false;
  if (action === "close") { updateHud(); if (result?.type === "lose") openPanel("campaign"); return; }
  const stage = action === "retry" ? (result?.stage || activeStageNumber()) : (runtime.nextStageAfterSettlement || save.stage);
  startStage(stage, action === "retry" ? "\u91cd\u65b0\u6574\u8ecd" : "\u65b0\u6230\u5834");
}

function showTutorial() {
  const layer = $("tutorialLayer");
  if (!layer || save.tutorialDone || !TUTORIAL_STEPS.length) return;
  const index = Math.min(save.tutorialStep || 0, TUTORIAL_STEPS.length - 1);
  const step = TUTORIAL_STEPS[index];
  $("tutorialTitle").textContent = step.title;
  $("tutorialBody").textContent = step.body;
  $("tutorialNext").textContent = step.action;
  $("tutorialProgressBar").style.width = ((index + 1) / TUTORIAL_STEPS.length * 100) + "%";
  $("tutorialNameWrap").hidden = step.id !== "welcome";
  $("tutorialName").value = save.playerName || "\u7384\u5fb7";
  layer.hidden = false;
  runtime.tutorialFocus = step.id;
}

function advanceTutorial() {
  if (save.tutorialStep === 0 && $("tutorialName").value.trim()) save.playerName = $("tutorialName").value.trim().slice(0, 10);
  save.tutorialStep = (save.tutorialStep || 0) + 1;
  if (save.tutorialStep >= TUTORIAL_STEPS.length) save.tutorialDone = true;
  persist();
  $("tutorialLayer").hidden = save.tutorialDone;
  if (!save.tutorialDone) showTutorial();
}

function claimTask(taskId, weekly) {
  const list = weekly ? WEEKLY_TASKS : DAILY_TASKS;
  const state = weekly ? save.weekly : save.daily;
  const task = list.find((item) => item.id === taskId);
  if (!task || state.claimed.includes(taskId) || (state.progress[taskId] || 0) < task.target) return;
  state.claimed.push(taskId);
  awardResources(task.reward);
  persist();
  updateHud();
  toast("\u4efb\u52d9\u734e\u52f5\u5df2\u9818\u53d6");
  renderDaily();
}

function claimCheckin() {
  ensureCycleState();
  const day = Math.min(7, save.checkin.day + 1);
  if (save.checkin.claimed.includes(day) || day > CHECKIN_REWARDS.length) return;
  save.checkin.claimed.push(day);
  save.checkin.day = day;
  awardResources(CHECKIN_REWARDS[day - 1]);
  if (save.monthlyPassUntil > Date.now()) awardResources({ gold: 100, food: 50 });
  recordTaskProgress("daily-claim");
  persist();
  updateHud();
  toast("\u7c3d\u5230\u734e\u52f5\u5df2\u6536\u5165");
  renderDaily();
}

async function claimDailyAd() {
  if (save.daily.adClaimed || save.adFree) return;
  const accepted = await window.TaoyuanAds.showRewardedAd({ onReward: () => {} });
  if (!accepted) return toast("\u5ee3\u544a\u5c1a\u672a\u5b8c\u6210");
  save.daily.adClaimed = true;
  save.adClaims.daily = Date.now();
  awardResources({ gold: 180, food: 80 });
  persist();
  updateHud();
  toast("\u8ecd\u7ce7\u5df2\u9001\u9054");
  renderDaily();
}

async function buyShopItem(itemId) {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
  if (!item || save.shopPurchases[item.id]) return;
  if (item.requiresNativePurchase) {
    const result = await window.TaoyuanIAP.purchase(item.productId);
    if (!result.ok) return toast(result.reason === "native-required" ? "\u6b64\u5546\u54c1\u8acb\u65bc App \u5546\u5e97\u8cfc\u8cb7" : "\u5546\u5e97\u5c1a\u672a\u5b8c\u6210\u914d\u7f6e");
  } else {
    for (const [key, value] of Object.entries(item.cost || {})) if ((save[key] || 0) < value) return toast("\u8cc7\u6e90\u4e0d\u8db3");
    for (const [key, value] of Object.entries(item.cost || {})) save[key] -= value;
  }
  save.shopPurchases[item.id] = true;
  if (item.id === "monthly-pass") save.monthlyPassUntil = Date.now() + 30 * 86400000;
  if (item.reward.adFree) save.adFree = true;
  awardResources(item.reward);
  persist();
  updateHud();
  toast("\u8ecd\u9700\u5df2\u5165\u5eab");
  renderShop();
}

function challengeArena(opponentId) {
  ensureCycleState();
  const opponent = ARENA_OPPONENTS.find((item) => item.id === opponentId);
  if (!opponent || save.arena.claimed.includes(opponent.id)) return;
  save.arena.attempts += 1;
  save.arena.claimed.push(opponent.id);
  recordTaskProgress("daily-arena");
  const win = currentArmyPower() >= opponent.power;
  if (win) {
    save.arena.wins += 1;
    awardResources(opponent.reward);
    toast("\u6f14\u6b66\u52dd\u5229\uff0c\u7372\u5f97\u6230\u529f");
  } else {
    toast("\u4e0d\u654c\u5f37\u6575\uff0c\u4e0b\u9031\u518d\u4f86");
  }
  persist();
  updateHud();
  renderArena();
}

function renderSettings() {
  setPanel("\u8ecd\u52d9\u8a2d\u5b9a", '<div class="setting-list">' +
    '<button class="setting-item" type="button" data-action="setting-toggle" data-setting="sound"><span><strong>\u97f3\u6548</strong><br><small>\u653b\u64ca\u3001\u6280\u80fd\u8207\u6309\u9215\u56de\u9948</small></span><i class="toggle ' + (save.sound ? "on" : "") + '"></i></button>' +
    '<button class="setting-item" type="button" data-action="setting-toggle" data-setting="effects"><span><strong>\u6230\u9b25\u7279\u6548</strong><br><small>\u5200\u5149\u3001\u6cd5\u8853\u8207\u9023\u64ca\u8868\u73fe</small></span><i class="toggle ' + (save.effects ? "on" : "") + '"></i></button>' +
    '<button class="setting-item" type="button" data-action="setting-toggle" data-setting="vibration"><span><strong>\u89f8\u611f\u632f\u52d5</strong><br><small>\u50c5\u5728\u88dd\u7f6e\u652f\u63f4\u6642\u555f\u7528</small></span><i class="toggle ' + (save.vibration ? "on" : "") + '"></i></button>' +
    '<button class="setting-item" type="button" data-action="notification-request"><span><strong>\u8ecd\u60c5\u901a\u77e5</strong><br><small>\u76ee\u524d\u72c0\u614b\uff1a' + (save.notifications ? "\u5df2\u958b\u555f" : "\u672a\u958b\u555f") + '</small></span><b>\u8a2d\u5b9a</b></button>' +
    '<div class="setting-item"><span><strong>\u73a9\u5bb6\u540d\u7a31</strong><br><small>\u5c40\u90e8\u5b58\u6a94\uff0c\u4e0d\u4e0a\u50b3</small></span><button class="stone-button compact-button" type="button" data-action="rename-player">\u4fee\u6539</button></div>' +
    '<div class="setting-item"><span><strong>\u904b\u884c\u6a21\u5f0f</strong><br><small>\u80cc\u666f\u56de\u6536\u52d5\u756b\uff0c\u4fdd\u8b77\u4f4e\u968e\u88dd\u7f6e</small></span><b>H5 SAFE</b></div>' +
    '</div><button class="setting-item" type="button" data-action="quality-toggle"><span><strong>\u756b\u9762\u54c1\u8cea</strong><br><small>\u4f4e\u529f\u8017\u6a21\u5f0f\u6703\u6e1b\u5c11\u7279\u6548\u7e6a\u88fd</small></span><b>' + (save.renderQuality === "low" ? "LOW" : "HIGH") + '</b></button><p class="section-caption">\u5b58\u6a94\u8207 App</p><button class="stone-button" type="button" data-action="report-issue">\u554f\u984c\u56de\u5831</button> <button class="stone-button" type="button" data-action="save-now">\u7acb\u5373\u4fdd\u5b58</button> <button class="stone-button" type="button" data-action="restore-purchases">\u6062\u5fa9\u8cfc\u8cb7</button> <button class="seal-button" type="button" data-action="reset-save">\u91cd\u7f6e\u9032\u5ea6</button>');
  $("panelContent").insertAdjacentHTML("beforeend", '<p class="panel-footnote">BUILD ' + APP_VERSION + '</p><button class="stone-button wide-button" type="button" data-action="version-check">\\u6aa2\\u67e5\\u7248\\u672c</button>');
}

function renderMail() {
  const unlockedStory = STORY_BEATS.filter((beat) => save.maxStage >= beat.stage);
  setPanel("\u8ecd\u4ef6", '<div class="mail-card ' + (save.mailClaimed ? "claimed" : "") + '"><i></i><div><h3>\u7fa9\u52c7\u8ecd\u51fa\u5f81\u88dc\u7d66</h3><p>\u6dbc\u90e1\u767e\u59d3\u9001\u4f86\u9285\u9322 300\u3001\u7ce7\u8349 120</p></div><button class="seal-button" type="button" data-action="mail-claim"' + (save.mailClaimed ? " disabled" : "") + '>' + (save.mailClaimed ? UI_TEXT.claimed : UI_TEXT.claim) + '</button></div><p class="section-caption">\u6b77\u53f2\u5287\u60c5</p><div class="story-list">' + (unlockedStory.length ? unlockedStory.map((beat) => '<article class="story-card"><span class="story-stage">' + beat.stage + '</span><div><strong>' + beat.speaker + '</strong><p>' + beat.text + '</p></div></article>').join("") : '<div class="record-item">\u7e7c\u7e8c\u5f81\u6230\uff0c\u5373\u53ef\u89e3\u9396\u53f2\u8a69\u7247\u6bb5\u3002</div>') + '</div>');
  $("panelContent").insertAdjacentHTML("beforeend", renderAnnouncementSection());
}

function renderRank() {
  const power = currentArmyPower();
  setPanel("\u7fa4\u96c4\u6392\u884c", '<div class="arena-banner"><span class="eyebrow">LOCAL PROFILE</span><h3>\u672c\u6a5f\u8ecd\u5e9c</h3><p>\u76ee\u524d\u70ba\u96e2\u7dda\u7248\uff0c\u4e0d\u6703\u628a\u865b\u69cb\u540d\u6b21\u7576\u6210\u771f\u5be6\u6392\u540d\u3002</p></div><table class="rank-table"><thead><tr><th>\u8ecd\u5e9c</th><th>\u73a9\u5bb6</th><th>\u6230\u529b</th></tr></thead><tbody><tr class="you"><td>LOCAL</td><td>' + (save.playerName || "\u7384\u5fb7") + '</td><td>' + formatNumber(power) + '</td></tr></tbody></table><button class="seal-button wide-button" type="button" data-action="arena-open">\u524d\u5f80\u6f14\u6b66\u5e73\u53f0</button>');
}

function achievementData() {
  const heroCount = HEROES.filter(isUnlocked).length;
  const totalLevels = HEROES.filter(isUnlocked).reduce((sum, hero) => sum + (save.heroLevels[hero.id] || 0), 0);
  const value = {
    stage: save.maxStage - 1,
    heroes: heroCount,
    levels: totalLevels,
    bosses: save.stats.bosses || 0,
    kills: save.stats.kills || 0,
    combo: save.stats.highestCombo || 0,
    skills: save.stats.skills || 0,
    arena: save.arena.wins || 0
  };
  const label = { jade: "\u7389\u7487", gold: "\u9285\u9322", food: "\u7ce7\u8349" };
  const catalog = [
    ["stage3", "\u6843\u5712\u521d\u9673", "\u901a\u904e\u7b2c 3 \u95dc", "stage", 3, { jade: 3 }],
    ["stage10", "\u864e\u7262\u65a9\u5c07", "\u901a\u904e\u7b2c 10 \u95dc", "stage", 10, { gold: 700 }],
    ["stage25", "\u8d64\u58c1\u706b\u8a08", "\u901a\u904e\u7b2c 25 \u95dc", "stage", 25, { jade: 8 }],
    ["stage50", "\u5317\u4f10\u5343\u91cc", "\u901a\u904e\u7b2c 50 \u95dc", "stage", 50, { gold: 1800 }],
    ["stage100", "\u4e09\u5206\u5b9a\u5c40", "\u901a\u904e\u7b2c 100 \u95dc", "stage", 100, { jade: 20 }],
    ["heroes6", "\u7fa4\u82f1\u4f86\u6295", "\u7d50\u8b58 6 \u540d\u6b66\u5c07", "heroes", 6, { gold: 500 }],
    ["heroes12", "\u540d\u5c07\u6210\u884c", "\u7d50\u8b58 12 \u540d\u6b66\u5c07", "heroes", 12, { jade: 5 }],
    ["heroes20", "\u7fa4\u82f1\u540c\u671d", "\u7d50\u8b58 20 \u540d\u6b66\u5c07", "heroes", 20, { gold: 1200 }],
    ["heroes35", "\u6c5f\u5c71\u7d0d\u624d", "\u7d50\u8b58 35 \u540d\u6b66\u5c07", "heroes", 35, { jade: 12 }],
    ["heroes49", "\u7fa4\u82f1\u805a\u9802", "\u89e3\u9396 49 \u540d\u6b66\u5c07", "heroes", 49, { jade: 20 }],
    ["levels25", "\u52e4\u7df4\u5175\u99ac", "\u6b66\u5c07\u7e3d\u7b49\u7d1a 25", "levels", 25, { food: 300 }],
    ["levels80", "\u767e\u6230\u8001\u5c07", "\u6b66\u5c07\u7e3d\u7b49\u7d1a 80", "levels", 80, { gold: 1500 }],
    ["levels160", "\u540d\u5c07\u540c\u8f1d", "\u6b66\u5c07\u7e3d\u7b49\u7d1a 160", "levels", 160, { jade: 8 }],
    ["levels300", "\u56de\u5929\u4e4b\u529b", "\u6b66\u5c07\u7e3d\u7b49\u7d1a 300", "levels", 300, { jade: 15 }],
    ["bosses3", "\u7834\u95dc\u65ac\u5c07", "\u64ca\u6bba 3 \u540d\u9996\u9818", "bosses", 3, { jade: 5 }],
    ["bosses10", "\u9996\u9818\u514b\u661f", "\u64ca\u6bba 10 \u540d\u9996\u9818", "bosses", 10, { gold: 1600 }],
    ["bosses25", "\u5b9a\u4e2d\u539f", "\u64ca\u6bba 25 \u540d\u9996\u9818", "bosses", 25, { jade: 15 }],
    ["kills100", "\u767e\u6226\u7cbe\u5175", "\u64ca\u6bba 100 \u540d\u6575\u4eba", "kills", 100, { gold: 500 }],
    ["kills500", "\u842c\u592b\u4e4b\u52c7", "\u64ca\u6bba 500 \u540d\u6575\u4eba", "kills", 500, { jade: 8 }],
    ["combo20", "\u9023\u74b0\u5981\u6bba", "\u9054\u6210 20 \u9023\u64ca", "combo", 20, { gold: 800 }],
    ["combo50", "\u7121\u96d9\u9023\u65a9", "\u9054\u6210 50 \u9023\u64ca", "combo", 50, { jade: 10 }],
    ["skills25", "\u767e\u8853\u521d\u6210", "\u91cb\u653e 25 \u6b21\u6280\u80fd", "skills", 25, { food: 500 }],
    ["skills100", "\u6230\u6cd5\u5927\u5e2b", "\u91cb\u653e 100 \u6b21\u6280\u80fd", "skills", 100, { jade: 10 }],
    ["arena2", "\u6f14\u6b66\u65b0\u661f", "\u6f14\u6b66\u8d0f\u5f97 2 \u5834", "arena", 2, { food: 500 }],
    ["arena4", "\u6f14\u6b66\u7121\u6575", "\u6f14\u6b66\u8d0f\u5f97 4 \u5834", "arena", 4, { jade: 8 }]
  ];
  return catalog.map(([id, name, desc, key, target, reward]) => ({ id, name, desc, value: value[key], target, reward: Object.entries(reward).map(([type, amount]) => label[type] + " \u00d7" + amount).join("\u00b7"), ...reward }));
}


function renderRecord() {
  setPanel("\u6230\u5831",
    '<p class="section-caption">\u6700\u8fd1\u8ecd\u60c5</p><div class="record-list">' +
    runtime.log.map((message, index) => '<div class="record-item"><strong>' + (index === 0 ? "\u6700\u65b0" : "\u8ecd\u5831") + '</strong><br><small>' + message + "</small></div>").join("") +
    "</div>");
}

function campaignClears() {
  return Math.max(0, (save.maxStage || save.stage || 1) - 1);
}

function titleUnlocked(title) {
  if (title.type === "stage") return campaignClears() >= title.value;
  if (title.type === "heroes") return HEROES.filter(isUnlocked).length >= title.value;
  if (title.type === "arena") return (save.arena?.wins || 0) >= title.value;
  return false;
}

function renderCollection() {
  const counts = Object.entries(FACTIONS).map(([id, faction]) => {
    const owned = (FACTION_BY_HERO[id] || []).filter((heroId) => isUnlocked(heroById(heroId))).length;
    return '<div class="collection-faction"><i style="--faction-color:' + faction.color + '"></i><strong>' + faction.name + '</strong><span>' + owned + ' \u540d</span><small>' + faction.desc + '</small></div>';
  }).join("");
  const bonds = BONDS.map((bond) => {
    const active = activeBonds().some((item) => item.id === bond.id);
    return '<article class="collection-card ' + (active ? "active" : "") + '"><strong>' + bond.name + '</strong><small>' + bond.desc + '</small><em>' + (active ? "\u5df2\u89f8\u767c" : "\u5c1a\u672a\u96c6\u9f4a") + '</em></article>';
  }).join("");
  const titles = TITLES.map((title) => {
    const unlocked = titleUnlocked(title);
    const equipped = save.equippedTitle === title.id;
    return '<article class="collection-card title-card ' + (unlocked ? "active" : "locked") + '"><strong>' + title.name + '</strong><small>' + title.desc + '</small><button class="' + (equipped || !unlocked ? "stone-button" : "seal-button") + ' compact-button" type="button" data-action="title-equip" data-title="' + title.id + '"' + ((!unlocked || equipped) ? " disabled" : "") + '>' + (equipped ? "\u5df2\u88dd\u5099" : unlocked ? "\u88dd\u5099" : "\u672a\u89e3\u9396") + '</button></article>';
  }).join("");
  const treasures = TREASURES.map((treasure) => {
    const unlocked = campaignClears() >= treasure.unlock;
    const equipped = save.equippedTreasure === treasure.id;
    return '<article class="collection-card treasure-card ' + (unlocked ? "active" : "locked") + '"><strong>' + treasure.name + '</strong><small>' + treasure.desc + '</small><button class="' + (equipped || !unlocked ? "stone-button" : "seal-button") + ' compact-button" type="button" data-action="treasure-equip" data-treasure="' + treasure.id + '"' + ((!unlocked || equipped) ? " disabled" : "") + '>' + (equipped ? "\u5df2\u914d\u88c5" : unlocked ? "\u914d\u88c5" : "\u7b2c " + treasure.unlock + " \u95dc") + '</button></article>';
  }).join("");
  setPanel("\u5716\u9451\u8207\u7fa9\u7d50", '<p class="section-caption">\u9663\u71df\u52e2\u529b</p><div class="collection-factions">' + counts + '</div><p class="section-caption">\u7de3\u5206\u7d44\u5408</p><div class="collection-list">' + bonds + '</div><p class="section-caption">\u7a31\u865f</p><div class="collection-list">' + titles + '</div><p class="section-caption">\u5bf6\u7269\u795e\u5668</p><div class="collection-list">' + treasures + '</div>');
  $("panelContent").insertAdjacentHTML("beforeend", renderFrameSection());
}

function renderTower() {
  const stamina = staminaStatus();
  const nextFloor = (save.tower?.floor || 0) + 1;
  const required = TOWER_CONFIG.basePower + (nextFloor - 1) * TOWER_CONFIG.powerStep;
  const cost = TOWER_CONFIG.stamina || 4;
  const power = currentArmyPower();
  setPanel(TOWER_CONFIG.name || "\u554f\u5929\u6a13", '<section class="mode-banner"><span class="eyebrow">ENDLESS LOCAL MODE</span><h3>' + (TOWER_CONFIG.name || "\u554f\u5929\u6a13") + '</h3><p>\u5df2\u901a\u95dc ' + (save.tower?.best || 0) + ' \u5c64\uff0c\u4e0b\u5c64\u5efa\u8b70\u6230\u529b ' + formatNumber(required) + '\u3002</p><div class="mode-stats"><span>\u6211\u65b9 <b>' + formatNumber(power) + '</b></span><span>\u9ad4\u529b <b>' + stamina.current + ' / ' + stamina.max + '</b></span></div></section><button class="seal-button wide-button" type="button" data-action="tower-challenge"' + (stamina.current < cost ? " disabled" : "") + '>\u6311\u6230\u7b2c ' + nextFloor + ' \u5c64 \u00b7 \u6d88\u8017 ' + cost + ' \u9ad4\u529b</button><p class="panel-footnote">\u6bcf\u5c64\u53ea\u8a08\u5165\u6700\u9ad8\u9032\u5ea6\uff0c\u5931\u6557\u53ef\u91cd\u65b0\u6311\u6230\u3002</p>');
}

function renderDungeons() {
  const stamina = staminaStatus();
  const cards = DAILY_DUNGEONS.map((dungeon) => {
    const claimed = Boolean(save.dungeons?.claimed?.[dungeon.id]);
    const winPower = currentArmyPower() >= dungeon.power;
    return '<article class="mode-card ' + (claimed ? "cleared" : "") + '"><div class="mode-icon">\u65e5</div><div><h3>' + dungeon.name + '</h3><p>' + dungeon.desc + '</p><small>\u5efa\u8b70\u6230\u529b ' + formatNumber(dungeon.power) + ' \u00b7 ' + rewardHtml(dungeon.reward) + '</small></div><button class="' + (claimed ? "stone-button" : "seal-button") + ' compact-button" type="button" data-action="dungeon-challenge" data-dungeon="' + dungeon.id + '"' + (claimed || stamina.current < dungeon.cost ? " disabled" : "") + '>' + (claimed ? "\u5df2\u5b8c\u6210" : winPower ? "\u6311\u6230" : "\u53ef\u8a66\u6230") + '<br><small>' + dungeon.cost + '\u9ad4\u529b</small></button></article>';
  }).join("");
  setPanel("\u65e5\u5e38\u526f\u672c", '<section class="mode-banner"><span class="eyebrow">DAILY DUNGEONS</span><h3>\u4eca\u65e5\u7279\u8a13</h3><p>\u6bcf 5 \u5206\u9418\u56de\u5fa9 1 \u9ede\u9ad4\u529b\uff0c\u6bcf\u65e5\u5404\u526f\u672c\u9650\u9818 1 \u6b21\u3002</p><div class="mode-stats"><span>\u9ad4\u529b <b>' + stamina.current + ' / ' + stamina.max + '</b></span><span>\u4e0b\u6b21\u56de\u5fa9 <b>\u81ea\u52d5</b></span></div></section><div class="mode-list">' + cards + '</div>');
}

function sweepStage(stage = Math.max(1, save.stage - 1)) {
  if (stage >= save.stage) return toast("\u9700\u5148\u901a\u95dc\u4e00\u6b21\u624d\u80fd\u6383\u8569");
  if (!spendStamina(1)) return toast("\u9ad4\u529b\u4e0d\u8db3\uff0c\u7b49\u5f85\u56de\u5fa9");
  const config = stageDefinition(stage);
  const reward = { gold: Math.round((config?.goldBonus || 20 + stage * 3) * .9), food: Math.round((35 + stage * 5) * .9), exp: 12 + stage };
  awardResources(reward);
  recordStat("wins");
  recordTaskProgress("daily-battle", 3);
  save.battlePass.xp = (save.battlePass.xp || 0) + 1;
  persist();
  updateHud();
  renderCampaign();
  toast("\u6383\u8569\u5b8c\u6210\uff0c\u7372\u5f97\u8ecd\u8cc7");
}

function challengeDungeon(dungeonId) {
  ensureCycleState();
  const dungeon = DAILY_DUNGEONS.find((item) => item.id === dungeonId);
  if (!dungeon || save.dungeons.claimed[dungeon.id]) return;
  if (!spendStamina(dungeon.cost)) return toast("\u9ad4\u529b\u4e0d\u8db3\uff0c\u7b49\u5f85\u56de\u5fa9");
  save.dungeons.claimed[dungeon.id] = true;
  const win = currentArmyPower() >= dungeon.power * .82;
  recordStat("battles");
  recordTaskProgress("daily-dungeon");
  if (win) {
    awardResources(dungeon.reward);
    recordStat("wins");
    toast(dungeon.name + "\u901a\u95dc\uff0c\u8ecd\u8cc7\u5165\u5eab");
  } else {
    recordStat("losses");
    toast(dungeon.name + "\u6574\u8ecd\u5931\u6557\uff0c\u660e\u65e5\u518d\u6230");
  }
  persist();
  updateHud();
  renderDungeons();
}

function challengeTower() {
  ensureCycleState();
  const nextFloor = (save.tower?.floor || 0) + 1;
  const cost = TOWER_CONFIG.stamina || 4;
  if (!spendStamina(cost)) return toast("\u9ad4\u529b\u4e0d\u8db3\uff0c\u7b49\u5f85\u56de\u5fa9");
  const required = TOWER_CONFIG.basePower + (nextFloor - 1) * TOWER_CONFIG.powerStep;
  const win = currentArmyPower() >= required * .84;
  recordStat("battles");
  if (win) {
    save.tower.floor = nextFloor;
    save.tower.best = Math.max(save.tower.best || 0, nextFloor);
    awardResources({ gold: 170 + nextFloor * 22, food: 55 + nextFloor * 8, jade: nextFloor % 5 === 0 ? 2 : 0, exp: 24 + nextFloor * 3 });
    recordStat("wins");
    toast("\u554f\u5929\u6a13\u7b2c " + nextFloor + " \u5c64\u901a\u95dc");
  } else {
    recordStat("losses");
    toast("\u554f\u5929\u6a13\u5c64\u6578\u4e0d\u8b8a\uff0c\u5148\u5f37\u5316\u9663\u5bb9");
  }
  persist();
  updateHud();
  renderTower();
}

function refineHeroEquipment(heroId) {
  const hero = heroById(heroId);
  if (!hero || !isUnlocked(hero)) return;
  const level = Number(save.equipmentRefine?.[heroId] || 0);
  const cost = 1 + level * 2;
  if (save.jade < cost) return toast("\u7389\u74a7\u4e0d\u8db3");
  save.jade -= cost;
  save.equipmentRefine[heroId] = level + 1;
  resetAllies();
  persist();
  updateHud();
  toast(hero.name + "\u88dd\u5099\u7cbe\u7149 +" + (level + 1));
  renderHeroDetail(heroId);
}

function renderFrameSection() {
  const frames = AVATAR_FRAMES.map((frame) => {
    const unlocked = avatarFrameUnlocked(frame);
    const equipped = save.equippedFrame === frame.id;
    return '<article class="collection-card frame-card ' + (unlocked ? "active" : "locked") + '"><strong>' + frame.name + '</strong><small>' + frame.desc + '</small><button class="' + (equipped || !unlocked ? "stone-button" : "seal-button") + ' compact-button" type="button" data-action="frame-equip" data-frame="' + frame.id + '"' + ((!unlocked || equipped) ? " disabled" : "") + '>' + (equipped ? "\u5df2\u88dd\u5099" : unlocked ? "\u88dd\u5099" : "\u7b2c " + frame.unlockStage + " \u95dc") + '</button></article>';
  }).join("");
  return '<p class="section-caption">\u982d\u50cf\u6846</p><div class="collection-list">' + frames + '</div>';
}

function renderAnnouncementSection() {
  const notices = ANNOUNCEMENTS.map((notice) => '<article class="announcement-card"><span class="story-stage">' + notice.tag + '</span><div><strong>' + notice.title + '</strong><small>' + notice.date + '</small><p>' + notice.body + '</p></div></article>').join("");
  return '<p class="section-caption">\u7cfb\u7d71\u516c\u544a</p><div class="announcement-list">' + notices + '</div>';
}

function renderEvents() {
  ensureCycleState();
  const cards = LOCAL_EVENTS.map((event) => {
    const progress = Math.min(event.target, eventProgress(event.id));
    const claimed = save.eventState.claimed.includes(event.id);
    const percent = Math.round(progress / event.target * 100);
    return '<article class="mode-card event-card ' + (claimed ? "cleared" : "") + '"><div class="mode-icon">\u671f</div><div><h3>' + event.name + '</h3><p>' + event.desc + '</p><div class="progress-track"><i style="width:' + percent + '%"></i></div><small>' + progress + ' / ' + event.target + '　' + rewardHtml(event.reward) + '</small></div><button class="' + (claimed || progress < event.target ? "stone-button" : "seal-button") + ' compact-button" type="button" data-action="event-claim" data-event="' + event.id + '"' + (claimed || progress < event.target ? " disabled" : "") + '>' + (claimed ? "\u5df2\u9818" : "\u9818\u53d6") + '</button></article>';
  }).join("");
  setPanel("\u9650\u6642\u6d3b\u52d5", '<section class="mode-banner"><span class="eyebrow">LIMITED LOCAL EVENT</span><h3>\u6843\u5712\u7fa9\u52c7\u9031</h3><p>\u6bcf\u9031\u66f4\u65b0\uff0c\u9032\u5ea6\u53ea\u4fdd\u7559\u65bc\u672c\u6a5f\u3002</p></section><div class="mode-list">' + cards + '</div>');
}

function upgradeHeroStar(heroId) {
  const hero = heroById(heroId);
  const progress = hero ? heroProgression(heroId) : null;
  const cost = hero ? heroStarCost(heroId) : null;
  if (!hero || !isUnlocked(hero) || !cost) return toast("\u540d\u5c07\u5df2\u6eff\u661f");
  if (save.shards < cost.shards || save.gold < cost.gold) return toast("\u788e\u7247\u6216\u9285\u9322\u4e0d\u8db3");
  save.shards -= cost.shards;
  save.gold -= cost.gold;
  progress.stars += 1;
  resetAllies();
  persist();
  updateHud();
  toast(hero.name + "\u5347\u661f\u81f3 " + progress.stars + " \u661f");
  renderHeroDetail(heroId);
}

function upgradeHeroSkill(heroId) {
  const hero = heroById(heroId);
  const cost = hero ? heroSkillCost(heroId) : null;
  if (!hero || !isUnlocked(hero) || !cost) return toast("戰法已滿級");
  if (save.gold < cost.gold || save.food < cost.food) return toast("銅錢或糧草不足");
  save.gold -= cost.gold;
  save.food -= cost.food;
  save.skillLevels[heroId] += 1;
  recordTaskProgress("daily-upgrade");
  resetAllies();
  persist();
  updateHud();
  toast(hero.name + "戰法升至 Lv." + save.skillLevels[heroId]);
  renderHeroDetail(heroId);
}

function breakthroughHero(heroId) {
  const hero = heroById(heroId);
  const progress = hero ? heroProgression(heroId) : null;
  const cost = hero ? heroBreakthroughCost(heroId) : null;
  if (!hero || !isUnlocked(hero) || !cost) return toast("\u9700\u8981 3 \u661f\u624d\u80fd\u7a81\u7834");
  if (save.shards < cost.shards || save.jade < cost.jade) return toast("\u788e\u7247\u6216\u7389\u74a7\u4e0d\u8db3");
  save.shards -= cost.shards;
  save.jade -= cost.jade;
  progress.breakthrough += 1;
  resetAllies();
  persist();
  updateHud();
  toast(hero.name + "\u7a81\u7834 +" + progress.breakthrough);
  renderHeroDetail(heroId);
}

function equipAvatarFrame(frameId) {
  const frame = AVATAR_FRAMES.find((item) => item.id === frameId);
  if (!frame || !avatarFrameUnlocked(frame)) return;
  save.equippedFrame = frame.id;
  persist();
  renderCollection();
  toast("\u982d\u50cf\u6846\u5df2\u66f4\u63db");
}

function claimLocalEvent(eventId) {
  ensureCycleState();
  const event = LOCAL_EVENTS.find((item) => item.id === eventId);
  if (!event || save.eventState.claimed.includes(event.id) || eventProgress(event.id) < event.target) return;
  save.eventState.claimed.push(event.id);
  awardResources(event.reward);
  persist();
  updateHud();
  renderEvents();
  toast("\u9650\u6642\u6d3b\u52d5\u734e\u52f5\u5df2\u9818\u53d6");
}

function handlePanelAction(button) {
  const action = button.dataset.action;
  if (!action) return;
  if (action === "hero-filter") renderHeroes(button.dataset.filter);
  else if (action === "hero-detail") renderHeroDetail(button.dataset.hero);
  else if (action === "paper-cycle") {
    const heroId = button.dataset.hero;
    const slot = PAPER_DOLL_SLOTS.find((item) => item.id === button.dataset.slot);
    if (!slot || !heroById(heroId)) return;
    const loadout = heroLoadout(heroId);
    const currentIndex = Math.max(0, slot.choices.findIndex((choice) => choice.id === loadout[slot.id]));
    const next = slot.choices[(currentIndex + 1) % slot.choices.length];
    loadout[slot.id] = next.id;
    persist();
    beep(460, .07, "triangle", .025);
    toast(heroById(heroId).name + "\u66f4\u63db\u300c" + next.name + "\u300d");
    renderHeroDetail(heroId);
  } else if (action === "equipment-refine") refineHeroEquipment(button.dataset.hero);
  else if (action === "hero-star") upgradeHeroStar(button.dataset.hero);
  else if (action === "hero-breakthrough") breakthroughHero(button.dataset.hero);
  else if (action === "hero-skill") upgradeHeroSkill(button.dataset.hero);
  else if (action === "hero-level") {
    const heroId = button.dataset.hero;
    const level = save.heroLevels[heroId];
    const cost = 70 + level * 42;
    if (save.gold < cost) return toast("\u9285\u9322\u4e0d\u8db3");
    save.gold -= cost;
    save.heroLevels[heroId] += 1;
    recordTaskProgress("daily-upgrade");
    resetAllies();
    persist();
    updateHud();
    beep(620, .09, "square", .03);
    toast(heroById(heroId).name + "\u5347\u81f3 Lv." + save.heroLevels[heroId]);
    renderHeroDetail(heroId);
  } else if (action === "formation-toggle") {
    toggleFormation(button.dataset.hero);
    runtime.panel === "formation" ? renderFormation() : renderHeroDetail(button.dataset.hero);
  } else if (action === "formation-save") { resetAllies(); persist(); toast("\u7de8\u968a\u5df2\u5957\u7528");
  } else if (action === "empty-slot") toast("\u5f9e\u4e0b\u65b9\u9ede\u9078\u6b66\u5c07\u52a0\u5165\u6b64\u9663");
  else if (action === "tactic-level") {
    const id = button.dataset.tactic;
    const tactic = TACTICS.find((item) => item.id === id);
    const cost = tactic.cost * save.tactics[id];
    if (save.food < cost) return toast("\u7ce7\u8349\u4e0d\u8db3");
    save.food -= cost;
    save.tactics[id] += 1;
    resetAllies();
    persist();
    updateHud();
    toast(tactic.name + "\u5347\u81f3 Lv." + save.tactics[id]);
    renderTactics();
  } else if (action === "setting-toggle") { save[button.dataset.setting] = !save[button.dataset.setting]; persist(); renderSettings();
  } else if (action === "notification-request") { window.TaoyuanPlatform.requestNotifications().then((permission) => { save.notifications = permission === "granted"; persist(); renderSettings(); toast(save.notifications ? "\u901a\u77e5\u5df2\u958b\u555f" : "\u901a\u77e5\u672a\u6388\u6b0a"); });
  } else if (action === "rename-player") { const name = window.prompt("\u8acb\u8f38\u5165\u4e3b\u516c\u540d\u7a31", save.playerName || "\u7384\u5fb7"); if (name?.trim()) { save.playerName = name.trim().slice(0, 10); persist(); updateHud(); renderSettings(); }
  } else if (action === "mail-claim") { if (save.mailClaimed) return; save.mailClaimed = true; recordTaskProgress("daily-mail"); awardResources({ gold: 300, food: 120 }); persist(); updateHud(); toast("\u7372\u5f97\u9285\u9322 300\u3001\u7ce7\u8349 120"); renderMail();
  } else if (action === "achievement-claim") { const achievement = achievementData().find((item) => item.id === button.dataset.achievement); if (!achievement || achievement.value < achievement.target || save.achievementClaimed.includes(achievement.id)) return; save.achievementClaimed.push(achievement.id); awardResources(achievement); persist(); updateHud(); toast("\u6210\u5c31\u734e\u52f5\u5df2\u9818\u53d6"); renderAchievements();
  } else if (action === "save-now") { persist(); toast("\u8ecd\u52d9\u9032\u5ea6\u5df2\u4fdd\u5b58");
  } else if (action === "restore-purchases") { window.TaoyuanIAP.restore().then((result) => toast(result.ok ? "\u8cfc\u8cb7\u5df2\u6062\u5fa9" : "\u76ee\u524d\u7121\u53ef\u6062\u5fa9\u7684 App \u8cfc\u8cb7"));
  } else if (action === "version-check") { toast("目前已是最新本地版本 " + APP_VERSION);
  } else if (action === "quality-toggle") { save.renderQuality = save.renderQuality === "low" ? "high" : "low"; persist(); renderSettings(); toast(save.renderQuality === "low" ? "\u5df2\u5207\u63db\u4f4e\u529f\u8017\u6a21\u5f0f" : "\u5df2\u5207\u63db\u9ad8\u54c1\u8cea");
  } else if (action === "report-issue") { const report = window.prompt("\u8acb\u63cf\u8ff0\u554f\u984c", ""); if (report?.trim()) { window.TaoyuanPlatform.track("player_report", { report: report.trim().slice(0, 200) }); toast("\u5df2\u8a18\u9304\u56de\u5831"); }
  } else if (action === "reset-save") { if (window.confirm("\u78ba\u5b9a\u91cd\u7f6e\u6240\u6709\u95dc\u5361\u3001\u6b66\u5c07\u8207\u8cc7\u6e90\u9032\u5ea6\uff1f")) { localStorage.removeItem(SAVE_KEY); location.reload(); }
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
  else if (action === "title-equip") { const title = titleById(button.dataset.title); if (title && titleUnlocked(title)) { save.equippedTitle = title.id; persist(); updateHud(); renderCollection(); toast("\u7a31\u865f\u5df2\u88dd\u5099"); } }
  else if (action === "treasure-equip") { const treasure = treasureById(button.dataset.treasure); if (treasure && campaignClears() >= treasure.unlock) { save.equippedTreasure = treasure.id; resetAllies(); persist(); updateHud(); renderCollection(); toast("\u5bf6\u7269\u5df2\u914d\u5099"); } }
  else if (action === "frame-equip") equipAvatarFrame(button.dataset.frame);
  else if (action === "event-claim") claimLocalEvent(button.dataset.event);
  else if (action === "toast") toast(button.dataset.message || "\u529f\u80fd\u6e96\u5099\u4e2d");
}

function openPanel(type) {
  if (type === "battle") { closePanel(); return; }
  runtime.panel = type;
  $("panelBackdrop").hidden = false;
  $("panelBack").hidden = true;
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.toggle("selected", button.dataset.panel === type));
  if (type === "heroes") renderHeroes();
  else if (type === "formation") renderFormation();
  else if (type === "tactics") renderTactics();
  else if (type === "campaign") renderCampaign();
  else if (type === "settings") renderSettings();
  else if (type === "mail") renderMail();
  else if (type === "rank") renderRank();
  else if (type === "achievement") renderAchievements();
  else if (type === "record") renderRecord();
  else if (type === "profile") renderProfile();
  else if (type === "daily") renderDaily();
  else if (type === "events") renderEvents();
  else if (type === "shop") renderShop();
  else if (type === "arena") renderArena();
  else if (type === "collection") renderCollection();
  else if (type === "tower") renderTower();
  else if (type === "dungeon") renderDungeons();
  beep(330, 0.04, "square", 0.018);
}

function showOfflineReward(seconds) {
  const capped = Math.min(seconds, 8 * 60 * 60);
  const gold = Math.floor(capped * (0.42 + save.stage * .025));
  const food = Math.floor(capped * (0.11 + save.stage * .008));
  runtime.pendingOffline = { gold, food };
  const hours = Math.floor(capped / 3600);
  const minutes = Math.floor((capped % 3600) / 60);
  $("offlineTime").textContent = "離線 " + (hours ? hours + " 小時 " : "") + minutes + " 分鐘";
  $("offlineGold").textContent = formatNumber(gold);
  $("offlineFood").textContent = formatNumber(food);
  $("doubleOffline").disabled = false;
  $("offlineModal").hidden = false;
}

