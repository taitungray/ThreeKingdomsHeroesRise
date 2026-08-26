/* UI: HUD, panels, roster, campaign and panel actions */
"use strict";

function updateHud() {
  $("goldValue").textContent = formatNumber(save.gold);
  $("foodValue").textContent = formatNumber(save.food);
  $("jadeValue").textContent = formatNumber(save.jade);
  $("lordLevel").textContent = "Lv." + save.level;
  const needed = 90 + save.level * 35;
  $("expText").textContent = Math.floor(save.exp) + "/" + needed;
  $("expFill").style.width = clamp((save.exp / needed) * 100, 0, 100) + "%";
  const chapter = chapterForStage();
  $("chapterLabel").textContent = chapter.name;
  const stage = activeStageNumber();
  const stageConfig = stageDefinition(stage);
  const chapterStage = ((stage - 1) % STAGES_PER_CHAPTER) + 1;
  const chapterNumber = Math.floor((stage - 1) / STAGES_PER_CHAPTER) + 1;
  $("stageLabel").textContent = chapterNumber + "-" + chapterStage;
  $("stageName").textContent = stageConfig?.name || "\u95dc\u5361 " + stage;
  const previewStage = $("enemyPreviewStage");
  if (previewStage) previewStage.textContent = stageConfig?.name || "\u95dc\u5361 " + stage;
  $("waveLabel").textContent = runtime.bossActive ? "\u9996\u9818\u6230" : "\u7b2c " + (runtime.waveClears + 1) + " \u6ce2";
  const living = runtime.enemies.filter((enemy) => !enemy.dead).length;
  $("enemyCount").textContent = "\u6575\u8ecd " + living;
  $("bossProgress").textContent = Math.min(runtime.waveClears, 3) + " / 3";
  $("bossButton").disabled = runtime.waveClears < 3 || runtime.bossActive || runtime.spawning;
  $("bossButton").setAttribute("aria-label", runtime.bossActive ? "\u9996\u9818\u6230\u9032\u884c\u4e2d" : runtime.waveClears < 3 ? "\u5b8c\u6210\u4e09\u6ce2\u5f8c\u6311\u6230\u95dc\u5361\u9996\u9818" : runtime.spawning ? "\u9996\u9818\u6b63\u5728\u6e96\u5099" : "\u6311\u6230\u95dc\u5361\u9996\u9818");
  $("autoButton").classList.toggle("active", runtime.auto);
  $("autoButton").textContent = runtime.auto ? "\u81ea\u52d5" : "\u624b\u52d5";
  $("autoButton").setAttribute("aria-pressed", String(runtime.auto));
  $("speedButton").textContent = "\u00d7" + runtime.timeScale;
  $("speedButton").setAttribute("aria-valuetext", "\u6230\u9b25\u901f\u5ea6 \u00d7" + runtime.timeScale);
  $("mailDot").hidden = save.mailClaimed;
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
  portrait.className = "pixel-avatar " + avatarClass;
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
  const heroData = hero.id ? ' data-hero="' + hero.id + '"' : "";
  const paperLayer = hero.id ? '<b class="paper-layer" aria-hidden="true"></b><em class="mount-mark" aria-hidden="true"></em>' : "";
  const portraitStyle = hero.accent ? ' style="--portrait-tone:' + hero.color + ';--portrait-accent:' + hero.accent + '"' : "";
  return '<span class="pixel-avatar ' + hero.avatar + loadoutClasses + (large ? " large" : "") + '"' + heroData + portraitStyle + '><i></i><span class="portrait-eyes" aria-hidden="true"></span><span class="portrait-rune" aria-hidden="true"></span><span class="avatar-detail" aria-hidden="true"></span>' + paperLayer + '</span>';
}

function heroCardHtml(hero, action = "hero-detail") {
  const unlocked = isUnlocked(hero);
  const selected = save.formation.includes(hero.id);
  return '<button class="hero-card' + (unlocked ? "" : " locked") + (selected ? " selected" : "") + '" type="button" data-action="' + action + '" data-hero="' + hero.id + '">' +
    avatarHtml(unlocked ? hero : { avatar: "avatar-locked" }) +
    '<strong>' + (unlocked ? hero.name : "？？？") + '</strong>' +
    '<small>' + (unlocked ? hero.role + " · Lv." + save.heroLevels[hero.id] : "第 " + hero.unlock + " 關解鎖") + '</small>' +
    '<b class="rarity">' + "◆".repeat(Math.min(3, Math.max(1, hero.rarity - 2))) + '</b>' +
    (unlocked ? "" : '<span class="lock-label">尚未相遇</span>') +
    "</button>";
}

function openPanel(type) {
  if (type === "battle") {
    closePanel();
    return;
  }
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
  beep(330, 0.04, "square", 0.018);
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
  runtime.heroFilter = filter;
  $("heroNotice").hidden = true;
  const heroes = HEROES.filter((hero) => filter === "owned" ? isUnlocked(hero) : filter === "locked" ? !isUnlocked(hero) : true);
  const tabs = '<div class="panel-tabs">' +
    '<button type="button" data-action="hero-filter" data-filter="all" class="' + (filter === "all" ? "active" : "") + '">全部</button>' +
    '<button type="button" data-action="hero-filter" data-filter="owned" class="' + (filter === "owned" ? "active" : "") + '">已擁有</button>' +
    '<button type="button" data-action="hero-filter" data-filter="locked" class="' + (filter === "locked" ? "active" : "") + '">未相遇</button>' +
    "</div>";
  setPanel("武將名冊", tabs +
    '<p class="section-caption">不抽卡 · 依戰役結識名將</p>' +
    '<div class="hero-grid">' + heroes.map((hero) => heroCardHtml(hero)).join("") + "</div>" +
    '<p class="section-caption">軍中提示</p>' +
    '<div class="record-item">完成歷史關卡即可讓名將加入。升級只消耗征戰取得的銅錢，不需要抽取重複角色。</div>');
}

function paperDollHtml(hero) {
  const slots = PAPER_DOLL_SLOTS.map((slot) => {
    const item = paperDollItem(hero.id, slot.id);
    return '<button class="paper-slot paper-slot-' + slot.id + '" type="button" data-action="paper-cycle" data-hero="' + hero.id + '" data-slot="' + slot.id + '" aria-label="更換' + slot.label + '">' +
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
  const power = Math.round(((hero.atk + equipment.atk) * 7 + hero.hp + equipment.hp + (hero.def + equipment.def) * 12) * (1 + level * 0.13));
  const inFormation = save.formation.includes(heroId);
  setPanel("武將詳情",
    '<section class="detail-hero">' +
      avatarHtml(hero, true) +
      '<h3>' + hero.name + '</h3>' +
      '<span class="hero-role">' + hero.role + ' · ' + hero.title + '</span>' +
      '<p class="hero-power">戰力 <strong>' + formatNumber(power) + '</strong></p>' +
      '<div class="stat-list">' +
        '<span>武力 <b>' + Math.round(hero.atk + level * 3.2 + equipment.atk) + '</b></span>' +
        '<span>兵力 <b>' + Math.round(hero.hp + level * 23 + equipment.hp) + '</b></span>' +
        '<span>統率 <b>' + Math.round(hero.def + level * .8 + equipment.def) + '</b></span>' +
        '<span>速度 <b>' + Math.round(hero.speed + equipment.speed) + '</b></span>' +
      '</div>' +
    '</section>' +
    '<p class="section-caption">戰法 · ' + hero.skill + '</p>' +
    '<div class="record-item">每五次普通攻擊施放一次專屬戰法。兵種為<strong>' + hero.role + '</strong>，可從陣法與軍令獲得額外加成。</div>' +
    paperDollHtml(hero) +
    '<div class="action-row">' +
      '<button class="stone-button" type="button" data-action="formation-toggle" data-hero="' + heroId + '">' + (inFormation ? "撤下陣容" : "加入陣容") + '</button>' +
      '<button class="seal-button" type="button" data-action="hero-level" data-hero="' + heroId + '"' + (save.gold < cost ? " disabled" : "") + '>升至 Lv.' + (level + 1) + '<br><small>' + cost + ' 銅錢</small></button>' +
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
    '<div class="panel-tabs"><button class="active" type="button">軍陣</button><button type="button" data-action="toast" data-message="兵書功能將於第 5 關開放">兵書</button><button type="button" data-action="toast" data-message="軍師府尚在籌建">軍令</button></div>' +
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
  runtime.waveClears = 0;
  runtime.bossActive = false;
  runtime.spawning = false;
  runtime.enemies = [];
  runtime.projectiles = [];
  runtime.effects = [];
  runtime.numbers = [];
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
  setPanel("歷史戰役",
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

function renderSettings() {
  setPanel("軍務設定",
    '<div class="setting-list">' +
      '<button class="setting-item" type="button" data-action="setting-toggle" data-setting="sound"><span><strong>音效</strong><br><small>攻擊、技能與按鈕回饋</small></span><i class="toggle ' + (save.sound ? "on" : "") + '"></i></button>' +
      '<button class="setting-item" type="button" data-action="setting-toggle" data-setting="effects"><span><strong>戰鬥特效</strong><br><small>刀光、法術與震動畫面</small></span><i class="toggle ' + (save.effects ? "on" : "") + '"></i></button>' +
      '<div class="setting-item"><span><strong>遊戲版本</strong><br><small>Web Prototype 2.0</small></span><b>直式 H5</b></div>' +
    '</div>' +
    '<p class="section-caption">存檔</p>' +
    '<button class="stone-button" type="button" data-action="save-now">立即保存</button> ' +
    '<button class="seal-button" type="button" data-action="reset-save">重置進度</button>');
}

function renderMail() {
  setPanel("軍件",
    '<div class="mail-card ' + (save.mailClaimed ? "claimed" : "") + '">' +
      "<i></i><div><h3>義勇軍出征補給</h3><p>涿郡百姓送來銅錢 300、糧草 120</p></div>" +
      '<button class="seal-button" type="button" data-action="mail-claim"' + (save.mailClaimed ? " disabled" : "") + '>' + (save.mailClaimed ? "已領" : "領取") + "</button>" +
    "</div>" +
    '<div class="mail-card claimed"><i></i><div><h3>軍師府通告</h3><p>完成每章戰役可結識新的三國名將。</p></div><button class="stone-button" disabled>已讀</button></div>');
}

function renderRank() {
  const rows = [
    ["1", "北海義士", "58,420"],
    ["2", "江東小霸王", "47,860"],
    ["3", "臥龍新軍", "39,210"],
    ["12", "劉玄德（你）", formatNumber(runtime.allies.reduce((sum, unit) => sum + unit.maxHp + unit.atk * 8, 0))],
    ["13", "常山槍騎", "8,030"]
  ];
  setPanel("群雄排行",
    '<div class="panel-tabs"><button class="active">戰力榜</button><button data-action="toast" data-message="關卡榜即將開放">關卡榜</button></div>' +
    '<table class="rank-table"><thead><tr><th>名次</th><th>軍勢</th><th>戰力</th></tr></thead><tbody>' +
    rows.map((row) => '<tr class="' + (row[1].includes("你") ? "you" : "") + '"><td>' + row[0] + '</td><td>' + row[1] + '</td><td>' + row[2] + "</td></tr>").join("") +
    "</tbody></table>");
}

function achievementData() {
  const totalLevels = HEROES.filter(isUnlocked).reduce((sum, hero) => sum + save.heroLevels[hero.id], 0);
  return [
    { id: "stage3", name: "桃園初陣", desc: "通過第 3 關", value: save.stage, target: 4, reward: "玉璧 ×3", jade: 3 },
    { id: "heroes6", name: "群英來投", desc: "結識 6 名武將", value: HEROES.filter(isUnlocked).length, target: 6, reward: "銅錢 ×500", gold: 500 },
    { id: "levels25", name: "勤練兵馬", desc: "武將總等級達 25", value: totalLevels, target: 25, reward: "糧草 ×300", food: 300 }
  ];
}

function renderAchievements() {
  setPanel("成就",
    '<div class="achievement-list">' + achievementData().map((item) => {
      const complete = item.value >= item.target;
      const claimed = save.achievementClaimed.includes(item.id);
      return '<article class="achievement-item"><h3>' + item.name + '</h3><p>' + item.desc + ' · 獎勵 ' + item.reward + '</p>' +
        '<div class="progress-track"><i style="width:' + clamp(item.value / item.target * 100, 0, 100) + '%"></i></div>' +
        '<button class="' + (complete && !claimed ? "seal-button" : "stone-button") + '" type="button" data-action="achievement-claim" data-achievement="' + item.id + '"' + (!complete || claimed ? " disabled" : "") + '>' + (claimed ? "已領取" : item.value + " / " + item.target) + "</button></article>";
    }).join("") + "</div>");
}

function renderRecord() {
  setPanel("戰報",
    '<p class="section-caption">最近軍情</p><div class="record-list">' +
    runtime.log.map((message, index) => '<div class="record-item"><strong>' + (index === 0 ? "最新" : "軍報") + '</strong><br><small>' + message + "</small></div>").join("") +
    "</div>");
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
    toast(heroById(heroId).name + "更換「" + next.name + "」");
    renderHeroDetail(heroId);
  }
  else if (action === "hero-level") {
    const heroId = button.dataset.hero;
    const level = save.heroLevels[heroId];
    const cost = 70 + level * 42;
    if (save.gold < cost) return toast("銅錢不足");
    save.gold -= cost;
    save.heroLevels[heroId] += 1;
    resetAllies();
    persist();
    updateHud();
    beep(620, .09, "square", .03);
    toast(heroById(heroId).name + "升至 Lv." + save.heroLevels[heroId]);
    renderHeroDetail(heroId);
  } else if (action === "formation-toggle") {
    toggleFormation(button.dataset.hero);
    runtime.panel === "formation" ? renderFormation() : renderHeroDetail(button.dataset.hero);
  } else if (action === "formation-save") {
    resetAllies();
    persist();
    toast("編隊已套用");
  } else if (action === "empty-slot") {
    toast("從下方點選武將加入此陣");
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
    beep(510, .09);
    toast(tactic.name + "升至 Lv." + save.tactics[id]);
    renderTactics();
  } else if (action === "setting-toggle") {
    const setting = button.dataset.setting;
    save[setting] = !save[setting];
    persist();
    renderSettings();
  } else if (action === "mail-claim") {
    if (save.mailClaimed) return;
    save.mailClaimed = true;
    save.gold += 300;
    save.food += 120;
    persist();
    updateHud();
    toast("獲得銅錢 300、糧草 120");
    renderMail();
  } else if (action === "achievement-claim") {
    const achievement = achievementData().find((item) => item.id === button.dataset.achievement);
    if (!achievement || achievement.value < achievement.target || save.achievementClaimed.includes(achievement.id)) return;
    save.achievementClaimed.push(achievement.id);
    save.gold += achievement.gold || 0;
    save.food += achievement.food || 0;
    save.jade += achievement.jade || 0;
    persist();
    updateHud();
    toast("成就獎勵已領取");
    renderAchievements();
  } else if (action === "save-now") {
    persist();
    toast("軍務進度已保存");
  } else if (action === "reset-save") {
    if (window.confirm("確定重置所有關卡、武將與資源進度？")) {
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    }
  } else if (action === "campaign-select") {
    const stage = Number(button.dataset.stage);
    startStage(stage);
  } else if (action === "toast") {
    toast(button.dataset.message || "功能準備中");
  }
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
  $("offlineModal").hidden = false;
}

