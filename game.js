"use strict";

const $ = (id) => document.getElementById(id);
const canvas = $("battleCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const HEROES = [
  { id: "liubei", name: "劉備", title: "昭烈仁君", avatar: "avatar-liubei", role: "步兵", color: "#e7e1c7", accent: "#4c9558", atk: 23, hp: 230, def: 12, speed: 24, range: 31, skill: "仁德劍陣", unlock: 0, rarity: 4 },
  { id: "guanyu", name: "關羽", title: "威震華夏", avatar: "avatar-guanyu", role: "騎兵", color: "#2b855b", accent: "#b6372c", atk: 34, hp: 265, def: 14, speed: 29, range: 35, skill: "青龍偃月", unlock: 0, rarity: 5 },
  { id: "zhangfei", name: "張飛", title: "萬人之敵", avatar: "avatar-zhangfei", role: "步兵", color: "#5f6770", accent: "#b54832", atk: 30, hp: 310, def: 18, speed: 22, range: 33, skill: "長坂怒吼", unlock: 0, rarity: 5 },
  { id: "zhaoyun", name: "趙雲", title: "常山龍膽", avatar: "avatar-zhaoyun", role: "騎兵", color: "#4e82ba", accent: "#d8e5e7", atk: 31, hp: 238, def: 13, speed: 33, range: 37, skill: "七進七出", unlock: 0, rarity: 5 },
  { id: "huangzhong", name: "黃忠", title: "百步穿楊", avatar: "avatar-huangzhong", role: "弓兵", color: "#8e7138", accent: "#d8bd62", atk: 35, hp: 190, def: 9, speed: 21, range: 142, skill: "烈弓連珠", unlock: 2, rarity: 4 },
  { id: "sunshang", name: "孫尚香", title: "梟姬", avatar: "avatar-sunshang", role: "弓兵", color: "#d05b72", accent: "#f0bd60", atk: 33, hp: 185, def: 9, speed: 24, range: 138, skill: "赤焰飛羽", unlock: 3, rarity: 4 },
  { id: "caocao", name: "曹操", title: "亂世雄主", avatar: "avatar-caocao", role: "謀士", color: "#4a4b6c", accent: "#8d55ad", atk: 38, hp: 205, def: 10, speed: 22, range: 126, skill: "魏武號令", unlock: 4, rarity: 5 },
  { id: "xiahoudun", name: "夏侯惇", title: "剛烈獨眼", avatar: "avatar-xiahoudun", role: "騎兵", color: "#315988", accent: "#aeb8c7", atk: 36, hp: 280, def: 16, speed: 30, range: 35, skill: "拔矢啖睛", unlock: 5, rarity: 4 },
  { id: "zhugeliang", name: "諸葛亮", title: "臥龍", avatar: "avatar-zhugeliang", role: "謀士", color: "#81a69d", accent: "#e6e0ce", atk: 42, hp: 195, def: 8, speed: 20, range: 154, skill: "八陣東風", unlock: 6, rarity: 5 },
  { id: "diaochan", name: "貂蟬", title: "閉月", avatar: "avatar-diaochan", role: "謀士", color: "#9b5fba", accent: "#e875ac", atk: 39, hp: 178, def: 8, speed: 25, range: 148, skill: "月下連環", unlock: 7, rarity: 5 },
  { id: "lubu", name: "呂布", title: "飛將", avatar: "avatar-lubu", role: "騎兵", color: "#9c2d31", accent: "#e1b34d", atk: 54, hp: 330, def: 17, speed: 35, range: 42, skill: "天下無雙", unlock: 9, rarity: 5 },
  { id: "locked", name: "神秘名將", title: "群雄未至", avatar: "avatar-locked", role: "未知", color: "#555", accent: "#777", atk: 1, hp: 1, def: 1, speed: 1, range: 1, skill: "未解鎖", unlock: 12, rarity: 5 }
];

const PAPER_DOLL_SLOTS = [
  { id: "weapon", label: "兵器", choices: [
    { id: "twin", name: "雌雄雙股劍", bonus: "武力 +5", stats: { atk: 5 }, className: "paper-weapon-twin" },
    { id: "guandao", name: "青龍偃月刀", bonus: "武力 +8", stats: { atk: 8 }, className: "paper-weapon-guandao" },
    { id: "serpent", name: "丈八蛇矛", bonus: "武力 +7", stats: { atk: 7 }, className: "paper-weapon-serpent" },
    { id: "lance", name: "龍膽亮銀槍", bonus: "速度 +4", stats: { speed: 4 }, className: "paper-weapon-lance" },
    { id: "bow", name: "落日神弓", bonus: "射程 +18", stats: { range: 18 }, className: "paper-weapon-bow" },
    { id: "fan", name: "羽扇綸巾", bonus: "謀略 +8", stats: { atk: 8 }, className: "paper-weapon-fan" },
    { id: "rings", name: "月刃雙環", bonus: "連擊 +4%", stats: { atk: 4 }, className: "paper-weapon-rings" },
    { id: "halberd", name: "方天畫戟", bonus: "武力 +12", stats: { atk: 12 }, className: "paper-weapon-halberd" }
  ]},
  { id: "armor", label: "戰甲", choices: [
    { id: "oath", name: "義軍戰袍", bonus: "兵力 +38", stats: { hp: 38 }, className: "paper-armor-oath" },
    { id: "iron", name: "玄鐵重鎧", bonus: "統率 +5", stats: { def: 5 }, className: "paper-armor-iron" },
    { id: "silk", name: "青絲羽衣", bonus: "速度 +3", stats: { speed: 3 }, className: "paper-armor-silk" },
    { id: "crimson", name: "赤焰戰鎧", bonus: "暴擊 +3%", stats: { atk: 2 }, className: "paper-armor-crimson" }
  ]},
  { id: "mount", label: "坐騎", choices: [
    { id: "foot", name: "步戰", bonus: "穩定", stats: {}, className: "paper-mount-foot" },
    { id: "grey", name: "青鬃戰馬", bonus: "移速 +3", stats: { speed: 3 }, className: "paper-mount-grey" },
    { id: "redhare", name: "赤兔寶馬", bonus: "移速 +8", stats: { speed: 8 }, className: "paper-mount-redhare" },
    { id: "jadelion", name: "玉獅踏雪", bonus: "兵力 +28", stats: { hp: 28 }, className: "paper-mount-jadelion" }
  ]},
  { id: "accessory", label: "信物", choices: [
    { id: "jade", name: "桃園玉佩", bonus: "回復 +2%", stats: { hp: 10 }, className: "paper-accessory-jade" },
    { id: "dragon", name: "青龍腰牌", bonus: "技能 +5%", stats: { atk: 5 }, className: "paper-accessory-dragon" },
    { id: "war", name: "虎紋護腕", bonus: "傷害 +4%", stats: { atk: 4 }, className: "paper-accessory-war" },
    { id: "feather", name: "臥龍羽令", bonus: "謀略 +6%", stats: { atk: 6 }, className: "paper-accessory-feather" }
  ]}
];

const PAPER_DOLL_DEFAULTS = {
  liubei: { weapon: "twin", armor: "oath", mount: "foot", accessory: "jade" },
  guanyu: { weapon: "guandao", armor: "oath", mount: "redhare", accessory: "dragon" },
  zhangfei: { weapon: "serpent", armor: "iron", mount: "foot", accessory: "war" },
  zhaoyun: { weapon: "lance", armor: "iron", mount: "grey", accessory: "jade" },
  huangzhong: { weapon: "bow", armor: "iron", mount: "foot", accessory: "war" },
  sunshang: { weapon: "bow", armor: "silk", mount: "grey", accessory: "jade" },
  caocao: { weapon: "twin", armor: "silk", mount: "grey", accessory: "dragon" },
  xiahoudun: { weapon: "guandao", armor: "iron", mount: "redhare", accessory: "war" },
  zhugeliang: { weapon: "fan", armor: "silk", mount: "foot", accessory: "feather" },
  diaochan: { weapon: "rings", armor: "silk", mount: "foot", accessory: "jade" },
  lubu: { weapon: "halberd", armor: "crimson", mount: "redhare", accessory: "war" },
  locked: { weapon: "twin", armor: "oath", mount: "foot", accessory: "jade" }
};

function createEquipmentDefaults() {
  return Object.fromEntries(HEROES.map((hero) => [hero.id, { ...(PAPER_DOLL_DEFAULTS[hero.id] || PAPER_DOLL_DEFAULTS.locked) }]));
}

const TACTICS = [
  { id: "snake", name: "長蛇陣", sigil: "鋒", desc: "全軍攻擊提高，騎兵衝鋒傷害額外增幅。", base: 0.08, cost: 70 },
  { id: "wall", name: "鐵壁陣", sigil: "守", desc: "全軍生命提高，步兵受到的傷害降低。", base: 0.10, cost: 80 },
  { id: "wind", name: "疾風令", sigil: "速", desc: "全軍移速與攻擊速度提高，弓兵先發制人。", base: 0.06, cost: 65 }
];

const CHAPTERS = [
  { name: "黃巾之亂", stage: "鉅鹿野外", boss: "黃巾渠帥", base: "#697258", path: "#9b8f6a" },
  { name: "桃園結義", stage: "涿郡桃林", boss: "黃巾力士", base: "#6d765d", path: "#a09370" },
  { name: "虎牢雄關", stage: "汜水關前", boss: "華雄", base: "#77705c", path: "#a18e69" },
  { name: "徐州烽火", stage: "下邳古道", boss: "曹軍虎衛", base: "#667066", path: "#968b72" },
  { name: "長坂追兵", stage: "長坂坡", boss: "夏侯追騎", base: "#73705e", path: "#a89a78" },
  { name: "赤壁鏖兵", stage: "烏林江岸", boss: "連環戰船", base: "#566c68", path: "#877f69" }
];

const SAVE_KEY = "taoyuan-qunying-v2";
const defaultSave = () => ({
  version: 2,
  gold: 860,
  food: 320,
  jade: 12,
  level: 1,
  exp: 0,
  stage: 1,
  heroLevels: Object.fromEntries(HEROES.map((hero) => [hero.id, 1])),
  formation: ["liubei", "guanyu", "zhangfei", "zhaoyun"],
  positions: { liubei: 7, guanyu: 3, zhangfei: 5, zhaoyun: 4 },
  tactics: { snake: 1, wall: 1, wind: 1 },
  equipment: createEquipmentDefaults(),
  mailClaimed: false,
  achievementClaimed: [],
  sound: true,
  effects: true,
  lastSeen: Date.now()
});

function loadSave() {
  const fresh = defaultSave();
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!stored || stored.version !== 2) return fresh;
    return {
      ...fresh,
      ...stored,
      heroLevels: { ...fresh.heroLevels, ...(stored.heroLevels || {}) },
      positions: { ...fresh.positions, ...(stored.positions || {}) },
      tactics: { ...fresh.tactics, ...(stored.tactics || {}) },
      equipment: Object.fromEntries(HEROES.map((hero) => [hero.id, { ...fresh.equipment[hero.id], ...((stored.equipment || {})[hero.id] || {}) }]))
    };
  } catch {
    return fresh;
  }
}

const save = loadSave();
const runtime = {
  allies: [],
  enemies: [],
  effects: [],
  numbers: [],
  projectiles: [],
  terrain: [],
  waveClears: 0,
  bossActive: false,
  spawning: false,
  auto: true,
  timeScale: 1,
  lastTime: performance.now(),
  elapsed: 0,
  shake: 0,
  hitStop: 0,
  flash: 0,
  flashColor: "#fff4cf",
  dialogueTimer: 0,
  panel: null,
  heroFilter: "all",
  selectedHero: null,
  pendingOffline: null,
  log: ["義軍於涿郡整軍出發。"],
  audio: null,
  renderDelta: 1 / 60
};

function persist() {
  save.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function heroById(id) {
  return HEROES.find((hero) => hero.id === id);
}

function heroLoadout(heroId) {
  if (!save.equipment) save.equipment = createEquipmentDefaults();
  if (!save.equipment[heroId]) save.equipment[heroId] = { ...(PAPER_DOLL_DEFAULTS[heroId] || PAPER_DOLL_DEFAULTS.locked) };
  return save.equipment[heroId];
}

function paperDollItem(heroId, slotId) {
  const slot = PAPER_DOLL_SLOTS.find((item) => item.id === slotId);
  if (!slot) return null;
  const loadout = heroLoadout(heroId);
  return slot.choices.find((choice) => choice.id === loadout[slotId]) || slot.choices[0];
}

function paperDollClasses(heroId) {
  return PAPER_DOLL_SLOTS.map((slot) => paperDollItem(heroId, slot.id)?.className).filter(Boolean).join(" ");
}

function heroEquipmentStats(heroId) {
  return PAPER_DOLL_SLOTS.reduce((stats, slot) => {
    const item = paperDollItem(heroId, slot.id);
    for (const [key, value] of Object.entries(item?.stats || {})) stats[key] = (stats[key] || 0) + value;
    return stats;
  }, { atk: 0, hp: 0, def: 0, speed: 0, range: 0 });
}

function equipmentBonusLabel(heroId) {
  const stats = heroEquipmentStats(heroId);
  const labels = [];
  if (stats.atk) labels.push("武力 +" + stats.atk);
  if (stats.hp) labels.push("兵力 +" + stats.hp);
  if (stats.def) labels.push("統率 +" + stats.def);
  if (stats.speed) labels.push("速度 +" + stats.speed);
  if (stats.range) labels.push("射程 +" + stats.range);
  return labels.length ? labels.join("　") : "目前沒有額外數值加成";
}

function isUnlocked(hero) {
  return hero.unlock === 0 || save.stage > hero.unlock;
}

function formatNumber(value) {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 10000) return (value / 1000).toFixed(1) + "K";
  return Math.floor(value).toLocaleString("zh-TW");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function chance(value) {
  return Math.random() < value;
}

function chapterForStage() {
  return CHAPTERS[Math.min(CHAPTERS.length - 1, Math.floor((save.stage - 1) / 2))];
}

function addLog(message) {
  runtime.log.unshift(message);
  runtime.log = runtime.log.slice(0, 16);
}

function beep(frequency = 280, duration = 0.045, type = "square", gain = 0.025) {
  if (!save.sound) return;
  try {
    runtime.audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = runtime.audio.createOscillator();
    const volume = runtime.audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(gain, runtime.audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.0001, runtime.audio.currentTime + duration);
    oscillator.connect(volume).connect(runtime.audio.destination);
    oscillator.start();
    oscillator.stop(runtime.audio.currentTime + duration);
  } catch {
    // Audio is optional in restricted WebViews.
  }
}

function buildTerrain() {
  runtime.terrain.length = 0;
  let seed = save.stage * 92821 + 17;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 54; i += 1) {
    runtime.terrain.push({
      x: Math.floor(random() * 390),
      y: Math.floor(80 + random() * 535),
      size: 2 + Math.floor(random() * 8),
      type: random() > 0.72 ? "rock" : random() > 0.55 ? "grass" : "stain",
      tone: random()
    });
  }
}

function formationPoint(slot) {
  const columns = [105, 195, 285];
  const rows = [366, 420, 474];
  return { x: columns[slot % 3], y: rows[Math.floor(slot / 3)] };
}

function tacticBonus(id) {
  const tactic = TACTICS.find((item) => item.id === id);
  return tactic.base + (save.tactics[id] - 1) * 0.025;
}

function makeAlly(heroId, slot, index) {
  const hero = heroById(heroId);
  const level = save.heroLevels[heroId] || 1;
  const equipment = heroEquipmentStats(heroId);
  const position = formationPoint(slot);
  const hpBonus = tacticBonus("wall");
  const atkBonus = tacticBonus("snake");
  const speedBonus = tacticBonus("wind");
  const maxHp = Math.round((hero.hp + level * 23 + equipment.hp) * (1 + hpBonus));
  return {
    id: hero.id + "-" + index,
    hero,
    team: "ally",
    x: position.x,
    y: position.y,
    homeX: position.x,
    homeY: position.y,
    renderX: position.x,
    renderY: position.y,
    hp: maxHp,
    maxHp,
    atk: (hero.atk + level * 3.2 + equipment.atk) * (1 + atkBonus),
    def: hero.def + level * 0.8 + equipment.def,
    speed: (hero.speed + equipment.speed) * (1 + speedBonus),
    range: hero.range + equipment.range,
    cooldown: Math.random() * 0.5,
    attackCount: 0,
    hitFlash: 0,
    attackPose: 0,
    action: null,
    hitStun: 0,
    kickX: 0,
    kickY: 0,
    motionX: 0,
    motionY: 0,
    squashX: 0,
    squashY: 0,
    weaponSwing: 0,
    moving: 0,
    facing: -1,
    stepTimer: Math.random() * 0.2,
    deathTime: 0,
    deathSpin: 0,
    dead: false,
    scale: 1,
    role: hero.role
  };
}

function resetAllies() {
  runtime.allies = save.formation
    .filter((id) => isUnlocked(heroById(id)))
    .map((id, index) => makeAlly(id, save.positions[id] ?? (index + 3), index));
}

function makeEnemy(index, boss = false) {
  const stagePower = 1 + (save.stage - 1) * 0.16;
  const maxHp = Math.round((boss ? 680 : 95 + Math.random() * 45) * stagePower);
  const lanes = [78, 132, 190, 248, 309];
  const spawnX = lanes[index % lanes.length] + (Math.random() - 0.5) * 24;
  const spawnY = 184 + Math.floor(index / lanes.length) * 44 + Math.random() * 16;
  return {
    id: "enemy-" + Date.now() + "-" + index,
    team: "enemy",
    type: boss ? "boss" : chance(0.25) ? "archer" : chance(0.32) ? "brute" : "bandit",
    x: spawnX,
    y: spawnY,
    renderX: spawnX,
    renderY: spawnY,
    hp: maxHp,
    maxHp,
    atk: (boss ? 27 : 10 + Math.random() * 4) * stagePower,
    def: (boss ? 11 : 3.5) * stagePower,
    speed: boss ? 16 : 13 + Math.random() * 5,
    range: boss ? 42 : 27,
    cooldown: Math.random() * 0.8,
    attackCount: 0,
    hitFlash: 0,
    attackPose: 0,
    action: null,
    hitStun: 0,
    kickX: 0,
    kickY: 0,
    motionX: 0,
    motionY: 0,
    squashX: 0,
    squashY: 0,
    weaponSwing: 0,
    moving: 0,
    facing: 1,
    stepTimer: Math.random() * 0.2,
    deathTime: 0,
    deathSpin: 0,
    dead: false,
    scale: boss ? 1.48 : 0.9 + Math.random() * 0.14,
    color: boss ? "#6f2b26" : chance(0.5) ? "#8f3630" : "#565858",
    accent: boss ? "#d29f3a" : "#b34935",
    role: boss ? "步兵" : "賊軍"
  };
}

function spawnWave(boss = false) {
  runtime.spawning = false;
  runtime.bossActive = boss;
  runtime.enemies = [];
  if (runtime.allies.length === 0 || runtime.allies.every((unit) => unit.dead)) resetAllies();
  const count = boss ? 1 + Math.min(4, save.stage) : 4 + Math.min(7, save.stage + runtime.waveClears);
  for (let i = 0; i < count; i += 1) runtime.enemies.push(makeEnemy(i, boss && i === 0));
  if (boss) {
    const chapter = chapterForStage();
    $("bossName").textContent = chapter.boss;
    $("bossBanner").classList.remove("show");
    void $("bossBanner").offsetWidth;
    $("bossBanner").classList.add("show");
    showDialogue("關羽", "兄長，敵將已現身。關某請戰！", "avatar-guanyu");
    addLog("遭遇首領「" + chapter.boss + "」。");
    beep(95, 0.3, "sawtooth", 0.04);
  }
  updateHud();
}

function nearestTarget(unit, targets) {
  let best = null;
  let bestDistance = Infinity;
  for (const target of targets) {
    if (target.dead) continue;
    const distance = Math.hypot(target.x - unit.x, (target.y - unit.y) * 1.12);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = target;
    }
  }
  return { target: best, distance: bestDistance };
}

function addNumber(x, y, value, critical = false, heal = false) {
  runtime.numbers.push({
    x,
    y,
    value: (heal ? "+" : "") + Math.round(value),
    life: 0.72,
    maxLife: 0.72,
    color: heal ? "#88e899" : critical ? "#ffe16b" : "#fff1da",
    size: critical ? 17 : 12
  });
}

function addEffect(type, x, y, color = "#fff", options = {}) {
  if (!save.effects) return;
  if (runtime.effects.length > 140) runtime.effects.splice(0, runtime.effects.length - 120);
  runtime.effects.push({
    type,
    x,
    y,
    color,
    life: options.life || 0.38,
    maxLife: options.life || 0.38,
    radius: options.radius || 35,
    angle: options.angle || 0,
    scale: options.scale || 1,
    facing: options.facing || 1
  });
}

function fireProjectile(attacker, target, color) {
  runtime.projectiles.push({
    x: attacker.x,
    y: attacker.y - 20,
    target,
    speed: attacker.role === "謀士" ? 245 : 310,
    color,
    damage: Math.max(2, attacker.atk - target.def * 0.55),
    team: attacker.team,
    life: 1.4
  });
}

function applyDamage(attacker, target, multiplier = 1, criticalChance = 0.12) {
  if (!target || target.dead) return;
  const critical = chance(criticalChance);
  const variance = 0.88 + Math.random() * 0.22;
  const damage = Math.max(2, (attacker.atk * multiplier - target.def * 0.58) * variance * (critical ? 1.72 : 1));
  target.hp -= damage;
  target.hitFlash = critical ? 0.2 : 0.14;
  target.hitStun = critical ? 0.075 : 0.035;
  const sourceX = Number.isFinite(attacker.x) ? attacker.x : target.x;
  const sourceY = Number.isFinite(attacker.y) ? attacker.y : target.y + 1;
  const knockAngle = Math.atan2(target.y - sourceY, target.x - sourceX);
  const knockForce = critical ? 10 : multiplier > 1.25 ? 7 : 4;
  target.kickX = Math.cos(knockAngle) * knockForce;
  target.kickY = Math.sin(knockAngle) * knockForce;
  addNumber(target.x, target.y - 31, damage, critical);
  addEffect("spark", target.x, target.y - 13, critical ? "#ffe270" : "#f1d8bd", { radius: critical ? 25 : 14, life: 0.22 });
  addEffect("impact", target.x, target.y - 14, critical ? "#fff08b" : "#f7d8ad", { radius: critical ? 34 : 19, life: critical ? 0.3 : 0.18, angle: knockAngle });
  runtime.hitStop = Math.max(runtime.hitStop, critical ? 0.055 : multiplier > 1.25 ? 0.04 : 0.018);
  if (critical) {
    runtime.shake = Math.max(runtime.shake, 5);
    addEffect("shockwave", target.x, target.y - 10, "#ffd769", { radius: 42, life: 0.34 });
  }
  if (target.hp <= 0) killUnit(target, attacker);
}

function killUnit(target, attacker) {
  if (target.dead) return;
  target.dead = true;
  target.hp = 0;
  target.deathTime = target.type === "boss" ? 0.9 : 0.58;
  target.deathSpin = chance(0.5) ? -1 : 1;
  target.kickX *= 1.6;
  target.kickY -= 5;
  addEffect("burst", target.x, target.y - 12, target.team === "enemy" ? "#b94934" : "#75a7ca", { radius: 42, life: 0.55 });
  addEffect("dust", target.x, target.y + 2, "#b7a77d", { radius: target.type === "boss" ? 42 : 25, life: 0.55 });
  if (target.team === "enemy") {
    const gold = target.type === "boss" ? 105 + save.stage * 22 : 4 + save.stage;
    const food = target.type === "boss" ? 46 + save.stage * 8 : chance(0.35) ? 2 : 0;
    save.gold += gold;
    save.food += food;
    gainExp(target.type === "boss" ? 55 + save.stage * 6 : 5);
    if (target.type === "boss") {
      runtime.shake = 10;
      beep(135, 0.22, "square", 0.045);
    }
  } else if (attacker) {
    addLog(target.hero.name + "力竭，等待重新整軍。");
  }
}

function useHeroSkill(unit, target) {
  unit.attackCount = 0;
  runtime.shake = Math.max(runtime.shake, 6);
  runtime.flash = 0.13;
  runtime.flashColor = unit.hero.accent;
  const hero = unit.hero;
  addEffect("shockwave", unit.x, unit.y - 10, hero.accent, { radius: 74, life: 0.48 });
  addEffect("afterimage", unit.x - Math.cos(unit.action?.angle || 0) * 11, unit.y - Math.sin(unit.action?.angle || 0) * 11, hero.accent, { life: 0.3, scale: unit.scale, facing: unit.facing });
  addEffect("afterimage", unit.x - Math.cos(unit.action?.angle || 0) * 22, unit.y - Math.sin(unit.action?.angle || 0) * 22, hero.accent, { life: 0.22, scale: unit.scale * 0.92, facing: unit.facing });
  showDialogue(hero.name, hero.skill + "！", hero.avatar);
  if (hero.id === "liubei") {
    for (const ally of runtime.allies) {
      if (ally.dead) continue;
      const heal = ally.maxHp * 0.12;
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      addNumber(ally.x, ally.y - 35, heal, false, true);
      addEffect("ring", ally.x, ally.y, "#7be0a5", { radius: 28, life: 0.6 });
    }
  } else if (hero.role === "弓兵" || hero.role === "謀士") {
    const living = runtime.enemies.filter((enemy) => !enemy.dead).slice(0, 4);
    living.forEach((enemy, index) => {
      setTimeout(() => {
        if (!enemy.dead) {
          applyDamage(unit, enemy, 1.4, 0.25);
          addEffect("bolt", enemy.x, enemy.y, hero.accent, { radius: 45, life: 0.38 });
        }
      }, index * 80);
    });
  } else {
    const living = runtime.enemies.filter((enemy) => !enemy.dead && Math.hypot(enemy.x - unit.x, enemy.y - unit.y) < 150);
    const skillAngle = Math.atan2(target.y - unit.y, target.x - unit.x);
    addEffect("slash", unit.x, unit.y - 8, hero.accent, { radius: 72, life: 0.48, angle: skillAngle });
    if (hero.id === "guanyu") {
      addEffect("slash", unit.x, unit.y - 8, "#ffcf65", { radius: 58, life: 0.38, angle: skillAngle - 0.55 });
      addEffect("slash", unit.x, unit.y - 8, "#f05d3e", { radius: 86, life: 0.54, angle: skillAngle + 0.48 });
    } else if (hero.id === "zhangfei") {
      runtime.shake = Math.max(runtime.shake, 9);
      addEffect("shockwave", unit.x, unit.y, "#e9c05c", { radius: 105, life: 0.62 });
      for (const enemy of living) {
        const pushAngle = Math.atan2(enemy.y - unit.y, enemy.x - unit.x);
        enemy.kickX += Math.cos(pushAngle) * 13;
        enemy.kickY += Math.sin(pushAngle) * 13;
      }
    } else if (hero.id === "zhaoyun") {
      for (let i = 1; i <= 3; i += 1) {
        addEffect("afterimage", unit.x - Math.cos(skillAngle) * i * 14, unit.y - Math.sin(skillAngle) * i * 14, hero.accent, { life: 0.18 + i * 0.05, scale: unit.scale * (1 - i * 0.06), facing: unit.facing });
      }
    }
    (living.length ? living : [target]).forEach((enemy) => applyDamage(unit, enemy, hero.id === "guanyu" ? 2.05 : 1.7, 0.24));
  }
  beep(hero.role === "謀士" ? 540 : 170, 0.12, "sawtooth", 0.035);
}

function attack(unit, target) {
  unit.cooldown = (unit.role === "騎兵" ? 0.78 : unit.role === "弓兵" ? 1.05 : unit.role === "謀士" ? 1.22 : 0.92) / (unit.team === "ally" ? 1 + tacticBonus("wind") : 1);
  unit.attackCount += 1;
  const skill = unit.team === "ally" && unit.attackCount >= 5;
  const ranged = unit.team === "ally" && (unit.role === "弓兵" || unit.role === "謀士");
  const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
  unit.action = {
    target,
    skill,
    ranged,
    angle,
    elapsed: 0,
    impactAt: skill ? 0.2 : ranged ? 0.145 : 0.095,
    total: skill ? 0.52 : ranged ? 0.32 : 0.255,
    resolved: false
  };
  unit.facing = Math.cos(angle) < 0 ? -1 : 1;
  if (skill) {
    addEffect("charge", unit.x, unit.y - 13, unit.hero.accent, { radius: 38, life: 0.32 });
    beep(220, 0.075, "triangle", 0.022);
  }
}

function resolveAttack(unit, action) {
  let target = action.target;
  if (!target || target.dead) {
    const targetPool = unit.team === "ally" ? runtime.enemies : runtime.allies;
    target = nearestTarget(unit, targetPool).target;
  }
  if (!target) return;
  if (action.skill) {
    useHeroSkill(unit, target);
    return;
  }
  if (action.ranged) {
    fireProjectile(unit, target, unit.hero.accent);
    unit.motionX -= Math.cos(action.angle) * 4;
    unit.motionY -= Math.sin(action.angle) * 4;
  } else {
    applyDamage(unit, target, 1, unit.team === "ally" ? 0.13 : 0.05);
    addEffect("slash", target.x, target.y - 12, unit.team === "ally" ? unit.hero.accent : "#e0b38d", { radius: 27, life: 0.22, angle: action.angle });
    if (unit.team === "ally" && unit.hero.id === "liubei") {
      addEffect("slash", target.x, target.y - 12, "#dce8d8", { radius: 23, life: 0.2, angle: action.angle + Math.PI / 2 });
    } else if (unit.team === "ally" && unit.hero.id === "guanyu") {
      addEffect("slash", target.x, target.y - 13, "#d4b356", { radius: 38, life: 0.3, angle: action.angle - 0.35 });
    } else if (unit.team === "ally" && unit.hero.id === "zhangfei") {
      addEffect("shockwave", target.x, target.y, "#b84a35", { radius: 30, life: 0.25 });
      runtime.shake = Math.max(runtime.shake, 3.2);
    } else if (unit.team === "ally" && unit.hero.id === "zhaoyun") {
      addEffect("afterimage", unit.x - Math.cos(action.angle) * 13, unit.y - Math.sin(action.angle) * 13, "#75bceb", { life: 0.2, scale: unit.scale * 0.9, facing: unit.facing });
    }
    addEffect("dust", unit.x, unit.y + 2, "#a99b77", { radius: 16, life: 0.28 });
    if (unit.team === "ally") {
      addEffect("afterimage", unit.x - Math.cos(action.angle) * 8, unit.y - Math.sin(action.angle) * 8, unit.hero.accent, { life: 0.16, scale: unit.scale * 0.94, facing: unit.facing });
      beep(150 + Math.random() * 35, 0.04, "square", 0.014);
    }
  }
}

function updateAction(unit, delta) {
  const action = unit.action;
  if (!action) return false;
  action.elapsed += delta;
  const windup = clamp(action.elapsed / action.impactAt, 0, 1);
  const directionX = Math.cos(action.angle);
  const directionY = Math.sin(action.angle);

  if (action.elapsed < action.impactAt) {
    const anticipation = Math.sin(windup * Math.PI * 0.5);
    const pullback = action.skill ? 7 : 4;
    unit.motionX = -directionX * pullback * anticipation;
    unit.motionY = -directionY * pullback * anticipation;
    unit.squashX = -0.07 * anticipation;
    unit.squashY = 0.09 * anticipation;
    unit.weaponSwing = -0.75 * anticipation;
  } else {
    if (!action.resolved) {
      action.resolved = true;
      resolveAttack(unit, action);
    }
    const recovery = clamp((action.elapsed - action.impactAt) / (action.total - action.impactAt), 0, 1);
    const snap = Math.pow(1 - recovery, 2);
    const lunge = action.ranged ? -4 : action.skill ? 20 : 11;
    unit.motionX = directionX * lunge * snap;
    unit.motionY = directionY * lunge * snap;
    unit.squashX = 0.13 * snap;
    unit.squashY = -0.11 * snap;
    unit.weaponSwing = 1.9 * snap;
  }

  if (action.elapsed >= action.total) {
    unit.action = null;
    unit.motionX = 0;
    unit.motionY = 0;
    unit.squashX = 0;
    unit.squashY = 0;
    unit.weaponSwing = 0;
  }
  return true;
}

function updateUnit(unit, targets, delta) {
  if (unit.dead) return;
  unit.cooldown -= delta;
  unit.hitFlash = Math.max(0, unit.hitFlash - delta);
  unit.attackPose = Math.max(0, unit.attackPose - delta);
  unit.hitStun = Math.max(0, unit.hitStun - delta);
  const kickDecay = Math.exp(-delta * 15);
  unit.kickX *= kickDecay;
  unit.kickY *= kickDecay;
  unit.moving = 0;
  if (unit.hitStun > 0) return;
  if (updateAction(unit, delta)) return;
  const { target, distance } = nearestTarget(unit, targets);
  if (!target) return;
  unit.facing = target.x < unit.x ? -1 : 1;
  if (distance > unit.range) {
    const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
    const spacing = unit.team === "ally" ? 1 : 0.82;
    unit.x += Math.cos(angle) * unit.speed * spacing * delta;
    unit.y += Math.sin(angle) * unit.speed * spacing * delta;
    unit.moving = 1;
    unit.stepTimer -= delta;
    if (unit.stepTimer <= 0) {
      unit.stepTimer = 0.2 + Math.random() * 0.1;
      addEffect("dust", unit.x, unit.y + 2, "#978b6c", { radius: 9, life: 0.3 });
    }
    unit.x = clamp(unit.x, 35, 350);
    unit.y = clamp(unit.y, 112, 575);
  } else if (unit.cooldown <= 0) {
    attack(unit, target);
  }
}

function updateProjectiles(delta) {
  for (const projectile of runtime.projectiles) {
    projectile.life -= delta;
    if (projectile.life <= 0 || !projectile.target || projectile.target.dead) continue;
    const dx = projectile.target.x - projectile.x;
    const dy = projectile.target.y - 18 - projectile.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 12) {
      const fakeAttacker = { atk: projectile.damage, team: projectile.team, x: projectile.x, y: projectile.y };
      applyDamage(fakeAttacker, projectile.target, 1, 0.1);
      addEffect("impact", projectile.target.x, projectile.target.y - 16, projectile.color, { radius: 22, life: 0.2 });
      projectile.life = 0;
    } else {
      projectile.x += (dx / distance) * projectile.speed * delta;
      projectile.y += (dy / distance) * projectile.speed * delta;
    }
  }
  runtime.projectiles = runtime.projectiles.filter((item) => item.life > 0);
}

function updateEffects(delta) {
  for (const effect of runtime.effects) effect.life -= delta;
  for (const number of runtime.numbers) {
    number.life -= delta;
    number.y -= 24 * delta;
  }
  for (const unit of [...runtime.allies, ...runtime.enemies]) {
    if (unit.dead && unit.deathTime > 0) {
      unit.deathTime = Math.max(0, unit.deathTime - delta);
      unit.kickX *= Math.exp(-delta * 5);
      unit.kickY += 18 * delta;
    }
  }
  runtime.effects = runtime.effects.filter((item) => item.life > 0);
  runtime.numbers = runtime.numbers.filter((item) => item.life > 0);
  runtime.shake = Math.max(0, runtime.shake - delta * 18);
  runtime.flash = Math.max(0, runtime.flash - delta);
}

function waveCleared() {
  if (runtime.spawning || runtime.enemies.length === 0 || runtime.enemies.some((enemy) => !enemy.dead)) return;
  runtime.spawning = true;
  if (runtime.bossActive) {
    const previousStage = save.stage;
    const chapter = chapterForStage();
    save.stage += 1;
    save.jade += 2;
    save.gold += 140 + previousStage * 30;
    save.food += 55 + previousStage * 9;
    runtime.waveClears = 0;
    runtime.bossActive = false;
    addLog("擊破「" + chapter.boss + "」，推進至第 " + save.stage + " 關。");
    showDialogue("劉備", "眾將辛苦了，整軍後繼續前進。", "avatar-liubei");
    toast("首領擊破！獲得玉璧 ×2");
    const newlyUnlocked = HEROES.find((hero) => hero.unlock === previousStage);
    if (newlyUnlocked) {
      toast("名將來投：" + newlyUnlocked.name);
      $("heroNotice").textContent = "1";
      $("heroNotice").hidden = false;
    }
    buildTerrain();
    persist();
    setTimeout(() => {
      resetAllies();
      spawnWave(false);
    }, 1800);
  } else {
    runtime.waveClears += 1;
    save.gold += 14 + save.stage * 3;
    addLog("清剿第 " + runtime.waveClears + " 波敵軍。");
    if (runtime.waveClears >= 3) {
      updateHud();
      if (runtime.auto) {
        setTimeout(() => spawnWave(true), 1600);
      } else {
        runtime.spawning = false;
        toast("首領已出現，點擊「關卡首領」迎戰");
      }
    } else {
      setTimeout(() => spawnWave(false), 1050);
    }
  }
}

function partyDefeated() {
  if (runtime.spawning || runtime.allies.length === 0 || runtime.allies.some((ally) => !ally.dead)) return;
  runtime.spawning = true;
  runtime.enemies.length = 0;
  addLog("我軍暫退整備，未損失關卡進度。");
  toast("全軍暫退，3 秒後重新集結");
  showDialogue("張飛", "歇口氣，再跟他們打過！", "avatar-zhangfei");
  setTimeout(() => {
    resetAllies();
    spawnWave(runtime.bossActive);
  }, 2800);
}

function gainExp(amount) {
  save.exp += amount;
  let needed = 90 + save.level * 35;
  while (save.exp >= needed) {
    save.exp -= needed;
    save.level += 1;
    save.gold += 100;
    toast("主公升至 Lv." + save.level);
    needed = 90 + save.level * 35;
  }
}

function updateGame(rawDelta) {
  // A wider cap keeps auto-battle moving in throttled WebViews without allowing huge tab-resume jumps.
  const frameDelta = Math.min(0.1, rawDelta);
  runtime.renderDelta = frameDelta || 1 / 60;
  const delta = frameDelta * runtime.timeScale;
  runtime.elapsed += delta;
  if (runtime.hitStop > 0) {
    runtime.hitStop = Math.max(0, runtime.hitStop - frameDelta);
    updateEffects(frameDelta * 0.16);
    return;
  }
  if (runtime.auto && !runtime.spawning) {
    for (const ally of runtime.allies) updateUnit(ally, runtime.enemies, delta);
    for (const enemy of runtime.enemies) updateUnit(enemy, runtime.allies, delta);
  }
  updateProjectiles(delta);
  updateEffects(delta);
  waveCleared();
  partyDefeated();
  if (runtime.dialogueTimer > 0) {
    runtime.dialogueTimer -= delta;
    if (runtime.dialogueTimer <= 0) $("dialogueBox").classList.remove("show");
  }
}

function drawPixelRect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function drawBackground() {
  const chapter = chapterForStage();
  ctx.fillStyle = chapter.base;
  ctx.fillRect(0, 0, 390, 720);

  const gradient = ctx.createLinearGradient(0, 80, 390, 610);
  gradient.addColorStop(0, "#d9d3b51a");
  gradient.addColorStop(0.55, "#22291d00");
  gradient.addColorStop(1, "#1a1e1788");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 390, 720);

  ctx.save();
  ctx.globalAlpha = 0.52;
  ctx.strokeStyle = chapter.path;
  ctx.lineWidth = 112;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(185, 86);
  ctx.bezierCurveTo(255, 230, 118, 340, 210, 620);
  ctx.stroke();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = "#d5c699";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();

  for (const mark of runtime.terrain) {
    if (mark.type === "stain") {
      ctx.globalAlpha = 0.16 + mark.tone * 0.1;
      ctx.fillStyle = mark.tone > 0.5 ? "#314532" : "#b2aa7d";
      ctx.beginPath();
      ctx.ellipse(mark.x, mark.y, mark.size * 2.3, mark.size, mark.tone * 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (mark.type === "grass") {
      ctx.globalAlpha = 0.56;
      ctx.strokeStyle = mark.tone > 0.5 ? "#33492f" : "#455735";
      ctx.lineWidth = 2;
      for (let blade = 0; blade < 3; blade += 1) {
        ctx.beginPath();
        ctx.moveTo(mark.x + blade * 3, mark.y + mark.size);
        ctx.lineTo(mark.x + blade * 2 - 3, mark.y - mark.size);
        ctx.stroke();
      }
    } else {
      ctx.globalAlpha = 0.6;
      drawPixelRect(mark.x, mark.y, mark.size * 2, mark.size, mark.tone > 0.5 ? "#555748" : "#77735f");
      drawPixelRect(mark.x + 2, mark.y, mark.size, 2, "#aaa087");
    }
  }
  ctx.globalAlpha = 1;

  drawMapDecoration(26, 126, "tree");
  drawMapDecoration(352, 262, "tree");
  drawMapDecoration(31, 402, "rock");
  drawMapDecoration(354, 525, "flag");

  const vignette = ctx.createRadialGradient(195, 335, 120, 195, 335, 350);
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, "#12150f88");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 390, 720);
}

function drawMapDecoration(x, y, type) {
  if (type === "tree") {
    drawPixelRect(x - 3, y + 9, 7, 19, "#493b28");
    drawPixelRect(x - 17, y - 4, 34, 20, "#304a32");
    drawPixelRect(x - 10, y - 14, 25, 19, "#415e3b");
    drawPixelRect(x - 2, y - 21, 13, 14, "#597149");
  } else if (type === "rock") {
    drawPixelRect(x - 13, y, 28, 14, "#55564c");
    drawPixelRect(x - 8, y - 7, 19, 10, "#77766a");
    drawPixelRect(x - 4, y - 5, 9, 3, "#aaa38c");
  } else {
    drawPixelRect(x, y - 25, 3, 45, "#332719");
    ctx.fillStyle = "#8d302b";
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 23);
    ctx.lineTo(x + 26, y - 17);
    ctx.lineTo(x + 3, y - 6);
    ctx.fill();
  }
}

function drawHealthBar(unit, visualX = unit.x + unit.motionX + unit.kickX, visualY = unit.y + unit.motionY + unit.kickY) {
  if (unit.dead) return;
  const width = unit.type === "boss" ? 48 : unit.team === "ally" ? 36 : 28;
  const x = Math.round(visualX - width / 2);
  const y = Math.round(visualY - (unit.type === "boss" ? 54 : 40) * unit.scale);
  drawPixelRect(x - 1, y - 1, width + 2, 6, "#1a1714");
  drawPixelRect(x, y, width, 4, "#6d1d1b");
  drawPixelRect(x, y, Math.ceil(width * clamp(unit.hp / unit.maxHp, 0, 1)), 4, unit.team === "ally" ? "#55a960" : "#cf4534");
}

function drawWeapon(unit, color) {
  const heroId = unit.team === "ally" ? unit.hero.id : "enemy";
  const equippedWeapon = unit.team === "ally" ? heroLoadout(heroId).weapon : null;
  ctx.save();
  ctx.translate(7, -17);
  ctx.rotate(unit.weaponSwing);
  ctx.translate(-7, 17);
  ctx.strokeStyle = "#30291f";
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (heroId === "enemy") {
    ctx.moveTo(9, -11);
    ctx.lineTo(17, -26);
    ctx.stroke();
    drawPixelRect(14, -29, 6, 10, color);
  } else if (equippedWeapon === "twin") {
    ctx.moveTo(7, -10);
    ctx.lineTo(18, -34);
    ctx.moveTo(-7, -10);
    ctx.lineTo(-17, -32);
    ctx.stroke();
    drawPixelRect(15, -37, 5, 11, "#d9e1d7");
    drawPixelRect(-20, -35, 5, 11, "#d9e1d7");
    drawPixelRect(11, -24, 10, 3, "#4d8f55");
    drawPixelRect(-21, -23, 10, 3, "#4d8f55");
  } else if (equippedWeapon === "guandao") {
    ctx.lineWidth = 4;
    ctx.moveTo(7, -7);
    ctx.lineTo(22, -49);
    ctx.stroke();
    ctx.fillStyle = "#8db7a0";
    ctx.beginPath();
    ctx.moveTo(21, -51);
    ctx.quadraticCurveTo(34, -50, 31, -39);
    ctx.lineTo(22, -43);
    ctx.lineTo(17, -53);
    ctx.closePath();
    ctx.fill();
    drawPixelRect(18, -47, 5, 4, "#d3b75e");
  } else if (equippedWeapon === "serpent") {
    ctx.lineWidth = 4;
    ctx.moveTo(7, -7);
    ctx.lineTo(22, -46);
    ctx.stroke();
    ctx.strokeStyle = "#b74835";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(19, -40);
    ctx.lineTo(26, -44);
    ctx.lineTo(21, -48);
    ctx.stroke();
    ctx.fillStyle = "#d9ded8";
    ctx.beginPath();
    ctx.moveTo(22, -55);
    ctx.lineTo(27, -45);
    ctx.lineTo(19, -46);
    ctx.closePath();
    ctx.fill();
  } else if (equippedWeapon === "lance") {
    ctx.lineWidth = 3;
    ctx.moveTo(7, -7);
    ctx.lineTo(24, -49);
    ctx.stroke();
    ctx.strokeStyle = "#3181bd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(19, -42);
    ctx.lineTo(28, -39);
    ctx.moveTo(20, -44);
    ctx.lineTo(29, -45);
    ctx.stroke();
    ctx.fillStyle = "#eef3ec";
    ctx.beginPath();
    ctx.moveTo(25, -57);
    ctx.lineTo(29, -47);
    ctx.lineTo(21, -49);
    ctx.closePath();
    ctx.fill();
  } else if (equippedWeapon === "bow") {
    ctx.strokeStyle = "#684b26";
    ctx.lineWidth = 3;
    ctx.arc(13, -18, 11, -1.25, 1.25);
    ctx.moveTo(16, -28);
    ctx.lineTo(16, -8);
    ctx.stroke();
    drawPixelRect(15, -31, 3, 25, "#d3b85f");
  } else if (equippedWeapon === "fan" || equippedWeapon === "rings") {
    ctx.moveTo(9, -10);
    ctx.lineTo(14, -23);
    ctx.stroke();
    ctx.fillStyle = equippedWeapon === "rings" ? "#e97bad" : "#e7e3d1";
    ctx.beginPath();
    ctx.moveTo(13, -24);
    ctx.quadraticCurveTo(28, -34, 30, -18);
    ctx.lineTo(16, -13);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = equippedWeapon === "rings" ? "#7d3d75" : "#607e78";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(15, -22);
    ctx.lineTo(28, -20);
    ctx.moveTo(16, -21);
    ctx.lineTo(26, -27);
    ctx.stroke();
  } else if (equippedWeapon === "halberd") {
    ctx.lineWidth = 4;
    ctx.moveTo(7, -7);
    ctx.lineTo(23, -50);
    ctx.stroke();
    ctx.fillStyle = "#e5b443";
    ctx.beginPath();
    ctx.moveTo(24, -57);
    ctx.lineTo(29, -48);
    ctx.lineTo(24, -43);
    ctx.lineTo(18, -49);
    ctx.closePath();
    ctx.fill();
    drawPixelRect(23, -53, 13, 4, "#c83b32");
  } else if (heroId === "xiahoudun") {
    ctx.moveTo(8, -9);
    ctx.lineTo(20, -35);
    ctx.stroke();
    ctx.fillStyle = "#aebac7";
    ctx.beginPath();
    ctx.moveTo(17, -40);
    ctx.lineTo(27, -35);
    ctx.lineTo(19, -21);
    ctx.lineTo(15, -27);
    ctx.closePath();
    ctx.fill();
    drawPixelRect(12, -24, 12, 3, "#375a86");
  } else if (heroId === "caocao") {
    ctx.moveTo(8, -9);
    ctx.lineTo(20, -35);
    ctx.stroke();
    drawPixelRect(17, -39, 6, 17, "#d3d8df");
    drawPixelRect(12, -24, 13, 3, "#8c57a8");
  } else if (unit.role === "謀士") {
    ctx.moveTo(12, -8);
    ctx.lineTo(15, -31);
    ctx.stroke();
    drawPixelRect(14, -32, 6, 12, color);
  } else {
    ctx.moveTo(9, -10);
    ctx.lineTo(19, -30);
    ctx.stroke();
    drawPixelRect(14, -32, 6, 12, color);
  }
  ctx.restore();
}

function drawMountOrFeet(unit, heroId, walkCycle, mountId = "") {
  const mounted = (unit.role === "騎兵" || unit.type === "boss") && mountId !== "foot";
  if (mounted) {
    const horse = mountId === "jadelion" || heroId === "zhaoyun" ? "#d9d9ce" : mountId === "redhare" || heroId === "lubu" ? "#6f342d" : heroId === "guanyu" ? "#715343" : unit.team === "ally" ? "#aaa99e" : "#5e5042";
    const horseLight = mountId === "jadelion" || heroId === "zhaoyun" ? "#f1eee1" : mountId === "redhare" || heroId === "lubu" ? "#9b4a36" : unit.team === "ally" ? "#c1b6a4" : "#756250";
    const gallop = unit.moving ? Math.round(walkCycle * 2) : 0;
    drawPixelRect(-18, -13, 35, 12, horse);
    drawPixelRect(11, -19, 13, 12, horseLight);
    drawPixelRect(17, -23, 7, 6, horseLight);
    drawPixelRect(-14 + gallop, -3, 5, 9, "#28241e");
    drawPixelRect(8 - gallop, -3, 5, 9, "#28241e");
    drawPixelRect(-20, -12, 5, 3, heroId === "lubu" ? "#c84535" : "#332a24");
    drawPixelRect(-8, -16, 17, 4, heroId === "lubu" ? "#d8ae45" : unit.team === "ally" ? "#6a744f" : "#4b352a");
  } else {
    const stride = unit.moving ? Math.round(walkCycle * (heroId === "zhangfei" ? 4 : 3)) : 0;
    const boot = heroId === "diaochan" || heroId === "sunshang" ? "#5b3047" : "#2a251e";
    drawPixelRect(-8 + stride, -10, 6, 10, boot);
    drawPixelRect(2 - stride, -10, 6, 10, boot);
  }
}

function drawHeroBack(heroId, accent, walkCycle, idleCycle) {
  const flutter = walkCycle * 3 + idleCycle;
  ctx.save();
  ctx.globalAlpha = 0.82;
  if (heroId === "liubei") {
    ctx.fillStyle = "#3f7f4d";
    ctx.beginPath();
    ctx.moveTo(-8, -27);
    ctx.lineTo(-15 - flutter, -19);
    ctx.lineTo(-11 - flutter, -5);
    ctx.lineTo(-5, -10);
    ctx.fill();
  } else if (heroId === "guanyu") {
    ctx.fillStyle = "#235f43";
    ctx.beginPath();
    ctx.moveTo(-8, -29);
    ctx.lineTo(-19 - flutter, -24);
    ctx.lineTo(-15 - flutter, -2);
    ctx.lineTo(-4, -7);
    ctx.fill();
  } else if (heroId === "zhangfei") {
    drawPixelRect(-16, -27, 8, 19, "#8d2f2a");
  } else if (heroId === "zhaoyun") {
    drawPixelRect(-14, -27, 8, 19, "#2f6fa9");
  } else if (heroId === "caocao") {
    ctx.fillStyle = "#332b50";
    ctx.beginPath();
    ctx.moveTo(-9, -29);
    ctx.lineTo(-18 - flutter, -22);
    ctx.lineTo(-14 - flutter, -3);
    ctx.lineTo(1, -9);
    ctx.fill();
  } else if (heroId === "lubu") {
    ctx.fillStyle = "#8c2028";
    ctx.beginPath();
    ctx.moveTo(-10, -30);
    ctx.lineTo(-20 - flutter, -23);
    ctx.lineTo(-16 - flutter, -1);
    ctx.lineTo(2, -8);
    ctx.fill();
  } else if (heroId === "sunshang" || heroId === "diaochan") {
    ctx.strokeStyle = heroId === "sunshang" ? "#e3a640" : "#e36aa5";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-5, -38);
    ctx.quadraticCurveTo(-21 - flutter, -31, -15 - flutter, -12);
    ctx.stroke();
  } else {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-9, -27);
    ctx.lineTo(-15 - flutter, -21);
    ctx.lineTo(-12 - flutter, -7);
    ctx.lineTo(-6, -11);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeroBody(heroId, body, accent) {
  if (heroId === "liubei") {
    drawPixelRect(-10, -28, 20, 21, "#e8e1c7");
    drawPixelRect(-13, -22, 5, 17, "#e8e1c7");
    drawPixelRect(8, -22, 5, 17, "#e8e1c7");
    drawPixelRect(-2, -28, 4, 17, "#4c9558");
    drawPixelRect(-9, -13, 18, 4, "#b58d3d");
  } else if (heroId === "guanyu") {
    drawPixelRect(-9, -30, 18, 23, "#24734f");
    drawPixelRect(-13, -24, 5, 17, "#319062");
    drawPixelRect(8, -24, 5, 17, "#319062");
    drawPixelRect(-9, -14, 18, 4, "#b6382e");
    drawPixelRect(-12, -29, 6, 5, "#d0a64e");
    drawPixelRect(6, -29, 6, 5, "#d0a64e");
  } else if (heroId === "zhangfei") {
    drawPixelRect(-13, -28, 26, 21, "#565e67");
    drawPixelRect(-17, -24, 6, 16, "#9f3c31");
    drawPixelRect(11, -24, 6, 16, "#9f3c31");
    drawPixelRect(-10, -25, 20, 5, "#858e91");
    drawPixelRect(-11, -13, 22, 5, "#a33c2d");
  } else if (heroId === "zhaoyun") {
    drawPixelRect(-9, -29, 18, 22, "#e1e3dc");
    drawPixelRect(-13, -24, 5, 17, "#bfc9ce");
    drawPixelRect(8, -24, 5, 17, "#bfc9ce");
    drawPixelRect(-7, -26, 14, 5, "#7d99aa");
    drawPixelRect(-10, -16, 20, 4, "#3277b2");
    drawPixelRect(-4, -21, 8, 8, "#4e82ba");
  } else if (heroId === "huangzhong") {
    drawPixelRect(-10, -28, 20, 21, "#856930");
    drawPixelRect(-13, -22, 5, 16, "#b29445");
    drawPixelRect(8, -22, 5, 16, "#b29445");
    drawPixelRect(-10, -16, 20, 4, "#d2b95e");
    drawPixelRect(-15, -27, 5, 17, "#5f4225");
  } else if (heroId === "sunshang") {
    drawPixelRect(-10, -28, 20, 19, "#cb536d");
    drawPixelRect(-13, -23, 5, 16, "#f0b55f");
    drawPixelRect(8, -23, 5, 16, "#f0b55f");
    ctx.fillStyle = "#d8667c";
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(10, -10);
    ctx.lineTo(14, -3);
    ctx.lineTo(-14, -3);
    ctx.fill();
  } else if (heroId === "caocao") {
    drawPixelRect(-11, -29, 22, 22, "#3b3d5c");
    drawPixelRect(-14, -24, 5, 17, "#6f4890");
    drawPixelRect(9, -24, 5, 17, "#6f4890");
    drawPixelRect(-8, -26, 16, 5, "#a98945");
    drawPixelRect(-11, -14, 22, 4, "#1f2031");
  } else if (heroId === "xiahoudun") {
    drawPixelRect(-12, -29, 24, 22, "#294e7d");
    drawPixelRect(-16, -25, 6, 18, "#687f9d");
    drawPixelRect(10, -25, 6, 18, "#687f9d");
    drawPixelRect(-10, -27, 20, 6, "#9aaabd");
    drawPixelRect(-12, -14, 24, 5, "#71362f");
  } else if (heroId === "zhugeliang") {
    drawPixelRect(-10, -29, 20, 24, "#d8d6c9");
    drawPixelRect(-13, -23, 5, 18, "#79a49b");
    drawPixelRect(8, -23, 5, 18, "#79a49b");
    drawPixelRect(-2, -28, 4, 20, "#76a198");
    drawPixelRect(-10, -11, 20, 4, "#536e69");
  } else if (heroId === "diaochan") {
    drawPixelRect(-9, -28, 18, 18, "#9859b5");
    drawPixelRect(-13, -23, 5, 17, "#e36ba8");
    drawPixelRect(8, -23, 5, 17, "#e36ba8");
    ctx.fillStyle = "#ad63be";
    ctx.beginPath();
    ctx.moveTo(-9, -12);
    ctx.lineTo(9, -12);
    ctx.lineTo(15, -3);
    ctx.lineTo(-15, -3);
    ctx.fill();
    drawPixelRect(-10, -16, 20, 3, "#e8bd5c");
  } else if (heroId === "lubu") {
    drawPixelRect(-12, -31, 24, 24, "#8f252c");
    drawPixelRect(-16, -26, 6, 19, "#d1a33c");
    drawPixelRect(10, -26, 6, 19, "#d1a33c");
    drawPixelRect(-9, -28, 18, 7, "#d8ad47");
    drawPixelRect(-12, -15, 24, 5, "#332529");
  } else {
    drawPixelRect(-10, -27, 20, 19, body);
    drawPixelRect(-13, -22, 5, 16, accent);
    drawPixelRect(8, -22, 5, 16, accent);
  }
}

function drawHeroHead(heroId, idleCycle) {
  const skin = heroId === "guanyu" ? "#b95e47" : heroId === "zhangfei" ? "#ae704e" : heroId === "lubu" ? "#c9825b" : "#d39a70";
  const faceWidth = heroId === "zhangfei" ? 20 : heroId === "guanyu" ? 17 : 16;
  drawPixelRect(-faceWidth / 2, -41, faceWidth, 15, skin);
  if (heroId === "liubei") {
    drawPixelRect(-11, -38, 3, 8, skin);
    drawPixelRect(8, -38, 3, 8, skin);
    drawPixelRect(-9, -44, 18, 7, "#342519");
    drawPixelRect(-5, -49, 10, 6, "#4f8c56");
    drawPixelRect(-2, -55, 4, 7, "#4f8c56");
    drawPixelRect(-5, -29, 4, 2, "#4a2a20");
    drawPixelRect(1, -29, 4, 2, "#4a2a20");
  } else if (heroId === "guanyu") {
    drawPixelRect(-10, -45, 20, 8, "#244f3d");
    drawPixelRect(-6, -49, 12, 5, "#2a694d");
    drawPixelRect(-7, -35, 5, 2, "#231813");
    drawPixelRect(2, -35, 5, 2, "#231813");
    ctx.fillStyle = "#2e1c17";
    ctx.beginPath();
    ctx.moveTo(-6, -29);
    ctx.lineTo(6, -29);
    ctx.lineTo(3 + idleCycle, -7);
    ctx.lineTo(-3 + idleCycle, -7);
    ctx.closePath();
    ctx.fill();
    drawPixelRect(-5, -26, 10, 3, "#1e1613");
  } else if (heroId === "zhangfei") {
    drawPixelRect(-11, -44, 22, 6, "#201811");
    drawPixelRect(-12, -47, 24, 4, "#a94434");
    drawPixelRect(-8, -36, 6, 3, "#1e1612");
    drawPixelRect(2, -36, 6, 3, "#1e1612");
    drawPixelRect(-10, -31, 20, 10, "#241a15");
    drawPixelRect(-7, -22, 14, 8, "#241a15");
    drawPixelRect(-13, -32, 5, 7, "#241a15");
    drawPixelRect(8, -32, 5, 7, "#241a15");
  } else if (heroId === "zhaoyun") {
    drawPixelRect(-10, -46, 20, 10, "#cfd4d2");
    drawPixelRect(-6, -49, 12, 5, "#edf0e8");
    drawPixelRect(-2, -57, 4, 9, "#347db8");
    drawPixelRect(1, -59 + idleCycle, 4, 6, "#59a1d1");
    drawPixelRect(-9, -43, 4, 11, "#7e98a7");
    drawPixelRect(5, -43, 4, 11, "#7e98a7");
  } else if (heroId === "huangzhong") {
    drawPixelRect(-9, -45, 18, 8, "#88713b");
    drawPixelRect(-6, -49, 12, 5, "#b99b4e");
    drawPixelRect(-7, -35, 5, 2, "#e4d2b5");
    drawPixelRect(2, -35, 5, 2, "#e4d2b5");
    ctx.fillStyle = "#ddd0b7";
    ctx.beginPath();
    ctx.moveTo(-6, -29);
    ctx.lineTo(6, -29);
    ctx.lineTo(2, -12);
    ctx.lineTo(-2, -12);
    ctx.fill();
  } else if (heroId === "sunshang") {
    drawPixelRect(-10, -45, 20, 9, "#4d2928");
    drawPixelRect(-12, -42, 5, 13, "#4d2928");
    drawPixelRect(7, -42, 5, 13, "#4d2928");
    drawPixelRect(-4, -50, 8, 6, "#d5536b");
    drawPixelRect(6, -49, 6, 6, "#f0b55f");
  } else if (heroId === "caocao") {
    drawPixelRect(-10, -45, 20, 8, "#25201d");
    drawPixelRect(-7, -51, 14, 7, "#68438a");
    drawPixelRect(-10, -50, 4, 5, "#b68c43");
    drawPixelRect(6, -50, 4, 5, "#b68c43");
    drawPixelRect(-6, -29, 12, 3, "#33231d");
  } else if (heroId === "xiahoudun") {
    drawPixelRect(-10, -46, 20, 9, "#385a83");
    drawPixelRect(-12, -44, 5, 11, "#7d91aa");
    drawPixelRect(7, -44, 5, 11, "#7d91aa");
    drawPixelRect(-7, -37, 7, 4, "#211c1a");
    drawPixelRect(-5, -34, 9, 2, "#211c1a");
  } else if (heroId === "zhugeliang") {
    drawPixelRect(-10, -44, 20, 7, "#30302d");
    drawPixelRect(-8, -54, 16, 11, "#d9d2c0");
    drawPixelRect(-12, -45, 24, 4, "#d9d2c0");
    drawPixelRect(-5, -29, 10, 2, "#40332c");
  } else if (heroId === "diaochan") {
    drawPixelRect(-10, -45, 20, 10, "#42223d");
    drawPixelRect(-13, -48, 7, 7, "#42223d");
    drawPixelRect(6, -48, 7, 7, "#42223d");
    drawPixelRect(-12, -50, 5, 4, "#e576ad");
    drawPixelRect(7, -50, 5, 4, "#e576ad");
    drawPixelRect(-2, -48, 4, 4, "#e5b954");
  } else if (heroId === "lubu") {
    drawPixelRect(-11, -47, 22, 11, "#85252a");
    drawPixelRect(-7, -51, 14, 6, "#d3a83e");
    ctx.strokeStyle = "#c93635";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4, -50);
    ctx.quadraticCurveTo(-16, -61, -21 - idleCycle * 2, -48);
    ctx.moveTo(4, -50);
    ctx.quadraticCurveTo(16, -61, 21 + idleCycle * 2, -48);
    ctx.stroke();
    drawPixelRect(-7, -35, 5, 2, "#251716");
    drawPixelRect(2, -35, 5, 2, "#251716");
  }
  drawPixelRect(-5, -36, 3, 2, "#211a16");
  drawPixelRect(3, -36, 3, 2, "#211a16");
}

function drawPixelLine(x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawArmorMicroDetails(armorId, idleCycle) {
  const shimmer = idleCycle > 0.25 ? 1 : 0;
  if (armorId === 'iron') {
    drawPixelRect(-11, -26, 3, 8, '#d7dedc');
    drawPixelRect(8, -26, 3, 8, '#d7dedc');
    drawPixelRect(-8, -23, 16, 2, '#73818a');
    drawPixelRect(-7, -18, 14, 2, '#9da9ad');
    drawPixelRect(-8, -14, 3, 2, '#e3e6dd');
    drawPixelRect(5, -14, 3, 2, '#e3e6dd');
    drawPixelLine(-8, -21, -5, -18, '#eff1e8');
    drawPixelLine(8, -21, 5, -18, '#eff1e8');
  } else if (armorId === 'silk') {
    drawPixelRect(-9, -24, 3, 10, '#d49abd');
    drawPixelRect(6, -24, 3, 10, '#d49abd');
    drawPixelRect(-7, -19, 14, 2, '#efc4dc');
    drawPixelRect(-8, -12, 16, 2, '#734f88');
    drawPixelLine(-7, -16, -2, -11, '#f5d6e8');
    drawPixelLine(7, -16, 2, -11, '#f5d6e8');
  } else if (armorId === 'crimson') {
    drawPixelRect(-12, -27, 4, 11, '#e0b34d');
    drawPixelRect(8, -27, 4, 11, '#e0b34d');
    drawPixelRect(-8, -25, 16, 3, '#be3b32');
    drawPixelRect(-7, -19, 14, 2, '#7c2028');
    drawPixelRect(-5, -15, 10, 2, '#e5b74b');
    drawPixelRect(-10, -25, 2, 3, shimmer ? '#fff0a2' : '#f0d478');
    drawPixelRect(8, -25, 2, 3, shimmer ? '#fff0a2' : '#f0d478');
  } else {
    drawPixelRect(-7, -24, 3, 11, '#e5d8ae');
    drawPixelRect(4, -24, 3, 11, '#e5d8ae');
    drawPixelRect(-8, -20, 16, 2, '#b18b42');
    drawPixelRect(-5, -15, 10, 2, '#d3b75e');
    drawPixelLine(-6, -27, -1, -23, '#fff3ce');
    drawPixelLine(6, -27, 1, -23, '#fff3ce');
  }
}

function drawHeroDetails(heroId, armorId, idleCycle, walkCycle) {
  const glint = idleCycle > 0.4 ? '#fff5c6' : '#eadba4';
  ctx.save();
  ctx.lineJoin = 'miter';

  if (heroId === 'liubei') {
    drawPixelRect(-8, -27, 3, 2, '#fff4da');
    drawPixelRect(5, -27, 3, 2, '#fff4da');
    drawPixelRect(-7, -24, 2, 11, '#c8b996');
    drawPixelRect(5, -24, 2, 11, '#c8b996');
    drawPixelRect(-3, -26, 6, 2, '#f8efda');
    drawPixelRect(-2, -23, 4, 3, '#4c9558');
    drawPixelRect(-7, -17, 14, 2, '#b58d3d');
    drawPixelRect(-2, -15, 4, 8, '#c6973f');
    drawPixelRect(-5, -40, 4, 1, '#4b2c20');
    drawPixelRect(2, -40, 4, 1, '#4b2c20');
    drawPixelRect(-1, -38, 2, 4, '#b67952');
    drawPixelRect(-3, -11, 2, 2, glint);
    drawPixelRect(2, -11, 2, 2, glint);
  } else if (heroId === 'guanyu') {
    drawPixelRect(-11, -28, 3, 5, '#d7b858');
    drawPixelRect(8, -28, 3, 5, '#d7b858');
    drawPixelRect(-8, -26, 16, 2, '#155339');
    for (const y of [-22, -18, -14]) {
      drawPixelRect(-7, y, 3, 2, '#74a878');
      drawPixelRect(4, y, 3, 2, '#74a878');
    }
    drawPixelRect(-2, -29, 4, 2, '#cf3b32');
    drawPixelRect(-8, -38, 5, 2, '#2e1c19');
    drawPixelRect(3, -38, 5, 2, '#2e1c19');
    drawPixelRect(-4, -27, 2, 9, '#633329');
    drawPixelRect(2, -27, 2, 9, '#633329');
    drawPixelRect(-3, -19, 2, 9, '#a05d47');
    drawPixelRect(1, -17, 2, 8, '#a05d47');
    drawPixelRect(-6, -10, 12, 2, '#241614');
  } else if (heroId === 'zhangfei') {
    drawPixelRect(-13, -27, 3, 4, '#aeb6b5');
    drawPixelRect(10, -27, 3, 4, '#aeb6b5');
    drawPixelRect(-9, -24, 18, 2, '#333a42');
    drawPixelRect(-9, -19, 18, 2, '#333a42');
    drawPixelRect(-8, -14, 16, 2, '#d04b34');
    drawPixelRect(-7, -11, 3, 2, '#efc66c');
    drawPixelRect(4, -11, 3, 2, '#efc66c');
    drawPixelRect(-8, -39, 5, 2, '#271b15');
    drawPixelRect(3, -39, 5, 2, '#271b15');
    drawPixelRect(-9, -43, 18, 1, '#e0a64c');
    drawPixelLine(-6, -31, -3, -27, '#5f4638');
    drawPixelLine(6, -31, 3, -27, '#5f4638');
    drawPixelRect(-4, -25, 2, 4, '#aeb5b6');
    drawPixelRect(2, -25, 2, 4, '#aeb5b6');
  } else if (heroId === 'zhaoyun') {
    drawPixelRect(-11, -28, 4, 3, '#f7f7ef');
    drawPixelRect(7, -28, 4, 3, '#f7f7ef');
    for (const y of [-24, -20, -16]) drawPixelRect(-7, y, 14, 1, '#9aaab2');
    drawPixelRect(-2, -25, 4, 11, '#4d84b8');
    drawPixelRect(-8, -36, 5, 1, '#56636c');
    drawPixelRect(3, -36, 5, 1, '#56636c');
    drawPixelRect(-7, -47, 3, 2, '#aab8bb');
    drawPixelRect(4, -47, 3, 2, '#aab8bb');
    drawPixelRect(-2, -58 + Math.round(idleCycle), 4, 2, glint);
    drawPixelRect(-5, -11, 3, 2, '#6ba4cc');
    drawPixelRect(2, -11, 3, 2, '#6ba4cc');
  } else if (heroId === 'huangzhong') {
    drawPixelRect(-11, -27, 3, 10, '#594027');
    drawPixelRect(8, -27, 3, 10, '#594027');
    drawPixelRect(-8, -22, 16, 2, '#d7bc60');
    drawPixelRect(-9, -17, 3, 3, '#d7bc60');
    drawPixelRect(6, -17, 3, 3, '#d7bc60');
    drawPixelRect(-8, -40, 4, 1, '#5b412a');
    drawPixelRect(4, -40, 4, 1, '#5b412a');
    drawPixelLine(-8, -43, -5, -38, '#f0ddbd');
    drawPixelLine(8, -43, 5, -38, '#f0ddbd');
    drawPixelRect(-14, -24, 3, 8, '#6b492a');
    drawPixelRect(-13, -18, 4, 2, glint);
  } else if (heroId === 'sunshang') {
    drawPixelRect(-8, -27, 3, 2, '#f6d79a');
    drawPixelRect(5, -27, 3, 2, '#f6d79a');
    drawPixelRect(-7, -22, 2, 10, '#f0b55f');
    drawPixelRect(5, -22, 2, 10, '#f0b55f');
    drawPixelRect(-9, -15, 18, 2, '#a13e5b');
    drawPixelRect(-4, -10, 3, 3, '#f8d9a1');
    drawPixelRect(1, -10, 3, 3, '#f8d9a1');
    drawPixelRect(-8, -39, 4, 2, '#2e1b1d');
    drawPixelRect(3, -39, 4, 2, '#2e1b1d');
    drawPixelRect(-12, -45, 2, 6, '#e5b050');
    drawPixelRect(10, -45, 2, 6, '#e5b050');
    drawPixelLine(-7, -19, -3, -15, '#ffdfab');
    drawPixelLine(7, -19, 3, -15, '#ffdfab');
  } else if (heroId === 'caocao') {
    drawPixelRect(-10, -28, 3, 6, '#8b78a7');
    drawPixelRect(7, -28, 3, 6, '#8b78a7');
    drawPixelRect(-7, -24, 14, 2, '#202235');
    drawPixelRect(-2, -24, 4, 10, '#8d55ad');
    drawPixelRect(-8, -18, 16, 2, '#b9914a');
    drawPixelRect(-7, -39, 4, 1, '#211a18');
    drawPixelRect(3, -39, 4, 1, '#211a18');
    drawPixelRect(-2, -49, 4, 3, '#e0c36d');
    drawPixelRect(-5, -12, 3, 2, glint);
    drawPixelRect(2, -12, 3, 2, glint);
  } else if (heroId === 'xiahoudun') {
    drawPixelRect(-13, -27, 4, 5, '#8fa7bf');
    drawPixelRect(9, -27, 4, 5, '#8fa7bf');
    drawPixelRect(-9, -21, 18, 2, '#1c3353');
    drawPixelRect(-7, -16, 14, 2, '#aab8c5');
    drawPixelRect(-8, -39, 7, 3, '#211d20');
    drawPixelRect(3, -39, 5, 1, '#211d20');
    drawPixelLine(4, -35, 8, -31, '#dc9e76');
    drawPixelRect(-9, -26, 2, 3, glint);
    drawPixelRect(8, -26, 2, 3, glint);
  } else if (heroId === 'zhugeliang') {
    drawPixelRect(-8, -27, 3, 11, '#8bb5ac');
    drawPixelRect(5, -27, 3, 11, '#8bb5ac');
    drawPixelRect(-7, -23, 14, 2, '#ece6d2');
    drawPixelRect(-2, -24, 4, 12, '#5b807a');
    drawPixelRect(-8, -16, 16, 2, '#536e69');
    drawPixelRect(-8, -39, 4, 1, '#2d2927');
    drawPixelRect(4, -39, 4, 1, '#2d2927');
    drawPixelLine(-7, -51, -3, -47, '#f6edda');
    drawPixelLine(7, -51, 3, -47, '#f6edda');
    drawPixelRect(-5, -12, 3, 2, glint);
    drawPixelRect(2, -12, 3, 2, glint);
  } else if (heroId === 'diaochan') {
    drawPixelRect(-8, -27, 3, 9, '#e36ba8');
    drawPixelRect(5, -27, 3, 9, '#e36ba8');
    drawPixelRect(-7, -20, 14, 2, '#e8bd5c');
    drawPixelRect(-4, -14, 8, 3, '#e875ac');
    drawPixelRect(-8, -39, 4, 2, '#3a1e36');
    drawPixelRect(3, -39, 4, 2, '#3a1e36');
    drawPixelRect(-12, -45, 2, 5, '#e6bd64');
    drawPixelRect(10, -45, 2, 5, '#e6bd64');
    drawPixelLine(-6, -24, -3, -19, '#f4b8d2');
    drawPixelLine(6, -24, 3, -19, '#f4b8d2');
  } else if (heroId === 'lubu') {
    drawPixelRect(-12, -28, 4, 8, '#e3b34d');
    drawPixelRect(8, -28, 4, 8, '#e3b34d');
    drawPixelRect(-8, -24, 16, 2, '#5d1c26');
    drawPixelRect(-6, -20, 12, 2, '#e3b34d');
    drawPixelRect(-9, -15, 18, 2, '#3b2025');
    drawPixelRect(-7, -39, 4, 2, '#3a1d1b');
    drawPixelRect(3, -39, 4, 2, '#3a1d1b');
    drawPixelRect(-2, -48, 4, 3, '#fff0b0');
    drawPixelLine(-9, -25, -5, -21, '#f7d45e');
    drawPixelLine(9, -25, 5, -21, '#f7d45e');
    drawPixelRect(-5, -12, 3, 2, glint);
    drawPixelRect(2, -12, 3, 2, glint);
  } else {
    drawPixelRect(-8, -23, 3, 10, '#d7cfb4');
    drawPixelRect(5, -23, 3, 10, '#d7cfb4');
    drawPixelRect(-7, -17, 14, 2, '#72674f');
    drawPixelRect(-7, -39, 4, 1, '#33291f');
    drawPixelRect(3, -39, 4, 1, '#33291f');
  }

  drawArmorMicroDetails(armorId, idleCycle);
  if (walkCycle !== 0) {
    drawPixelRect(-10, -5, 4, 2, '#221d18');
    drawPixelRect(6, -5, 4, 2, '#221d18');
  }
  ctx.restore();
}

function drawEnemyDetails(unit, idleCycle) {
  const metal = unit.type === 'boss' ? '#d7b255' : '#a8afb0';
  const shade = unit.type === 'boss' ? '#60201f' : '#3f3330';
  ctx.save();
  drawPixelRect(-9, -25, 18, 2, shade);
  drawPixelRect(-7, -20, 14, 2, metal);
  drawPixelRect(-8, -15, 16, 2, shade);
  drawPixelRect(-8, -40, 4, 2, '#2a201c');
  drawPixelRect(4, -40, 4, 2, '#2a201c');
  drawPixelRect(-2, -46 + Math.round(idleCycle), 4, 5, metal);
  drawPixelRect(-12, -26, 3, 6, metal);
  drawPixelRect(9, -26, 3, 6, metal);
  if (unit.type === 'archer') {
    drawPixelRect(-14, -23, 3, 13, '#624827');
    drawPixelLine(-13, -24, -13, -10, '#e2be69');
  } else if (unit.type === 'brute' || unit.type === 'boss') {
    drawPixelRect(-12, -33, 5, 3, metal);
    drawPixelRect(7, -33, 5, 3, metal);
    drawPixelRect(-5, -10, 10, 2, metal);
  }
  ctx.restore();
}

function drawArmorOverlay(armorId, idleCycle) {
  if (armorId === "iron") {
    drawPixelRect(-12, -27, 4, 10, "#d5d9d2");
    drawPixelRect(8, -27, 4, 10, "#d5d9d2");
    drawPixelRect(-7, -24, 14, 3, "#8c9aa0");
  } else if (armorId === "silk") {
    ctx.fillStyle = "#e0b2d2";
    ctx.beginPath();
    ctx.moveTo(-9, -9);
    ctx.lineTo(-14 - idleCycle * 2, -2);
    ctx.lineTo(0, -6);
    ctx.lineTo(14 + idleCycle * 2, -2);
    ctx.lineTo(9, -9);
    ctx.closePath();
    ctx.fill();
  } else if (armorId === "crimson") {
    drawPixelRect(-12, -27, 4, 13, "#e3b34d");
    drawPixelRect(8, -27, 4, 13, "#e3b34d");
    drawPixelRect(-7, -24, 14, 4, "#b53d32");
  }
}

function drawAccessory(heroId, accessoryId, idleCycle) {
  if (accessoryId === "jade") {
    drawPixelRect(-2, -20 + Math.round(idleCycle), 4, 4, "#86dfb2");
  } else if (accessoryId === "dragon") {
    drawPixelRect(5, -19 + Math.round(idleCycle), 5, 3, "#e4b84f");
  } else if (accessoryId === "war") {
    drawPixelRect(-10, -19, 4, 4, "#b63c30");
    drawPixelRect(6, -19, 4, 4, "#b63c30");
  } else if (accessoryId === "feather") {
    drawPixelRect(3, -24 + Math.round(idleCycle), 3, 8, "#e5e0ce");
  }
}

function drawEnemyBody(unit, body, accent, idleCycle) {
  drawPixelRect(-10, -27, 20, 19, body);
  drawPixelRect(-13, -22, 5, 16, accent);
  drawPixelRect(8, -22, 5, 16, accent);
  drawPixelRect(-8, -40, 16, 14, "#b97c58");
  drawPixelRect(-10, -43, 20, 7, accent);
  drawPixelRect(-6, -46, 12, 5, accent);
  drawPixelRect(-2 + Math.round(idleCycle), -51, 4, 8, accent);
  drawPixelRect(-5, -36, 3, 2, "#211a16");
  drawPixelRect(3, -36, 3, 2, "#211a16");
  if (unit.type === "brute" || unit.type === "boss") {
    drawPixelRect(-12, -48, 5, 11, "#d8bd72");
    drawPixelRect(7, -48, 5, 11, "#d8bd72");
  }
}

function drawUnit(unit) {
  if (unit.dead && unit.deathTime <= 0) return;
  const walkCycle = Math.sin(runtime.elapsed * 15 + unit.x * 0.08);
  const idleCycle = Math.sin(runtime.elapsed * 3.2 + unit.x * 0.03);
  const heroId = unit.team === "ally" ? unit.hero.id : "enemy";
  const loadout = unit.team === "ally" ? heroLoadout(heroId) : null;
  const moveBounce = heroId === "zhangfei" ? 2.9 : heroId === "zhaoyun" ? 1.35 : 2;
  const idleBounce = heroId === "guanyu" ? 0.35 : heroId === "zhangfei" ? 0.55 : 0.8;
  const bob = unit.moving ? -Math.abs(walkCycle) * moveBounce : idleCycle * idleBounce;
  const renderX = unit.x + unit.motionX + unit.kickX;
  const renderY = unit.y + unit.motionY + unit.kickY;
  const visualEase = 1 - Math.exp(-runtime.renderDelta * (unit.moving ? 18 : 22));
  if (!Number.isFinite(unit.renderX)) unit.renderX = renderX;
  if (!Number.isFinite(unit.renderY)) unit.renderY = renderY;
  unit.renderX += (renderX - unit.renderX) * visualEase;
  unit.renderY += (renderY - unit.renderY) * visualEase;
  const deathMax = unit.type === "boss" ? 0.9 : 0.58;
  const deathProgress = unit.dead ? 1 - unit.deathTime / deathMax : 0;
  ctx.save();
  ctx.translate(unit.renderX, unit.renderY + bob);

  ctx.globalAlpha = unit.dead ? 0.2 * (1 - deathProgress) : 0.36;
  ctx.fillStyle = "#10120e";
  ctx.beginPath();
  ctx.ellipse(0, 2, (unit.type === "boss" ? 24 : 16) * (1 + deathProgress * 0.35), unit.type === "boss" ? 8 : 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = unit.dead ? clamp(unit.deathTime / deathMax * 1.35, 0, 1) : 1;

  if (unit.dead) {
    ctx.translate(0, deathProgress * 10);
    ctx.rotate(unit.deathSpin * deathProgress * 1.18);
  }
  const deathSquash = unit.dead ? 1 - deathProgress * 0.32 : 1;
  ctx.scale(unit.scale * unit.facing * (1 + unit.squashX), unit.scale * deathSquash * (1 + unit.squashY));

  const body = unit.team === "ally" ? unit.hero.color : unit.color;
  const accent = unit.team === "ally" ? unit.hero.accent : unit.accent;
  drawMountOrFeet(unit, heroId, walkCycle, loadout?.mount);

  if (unit.team === "ally") {
    drawHeroBack(heroId, accent, unit.moving ? walkCycle : 0, idleCycle);
    drawHeroBody(heroId, body, accent);
    drawArmorOverlay(loadout?.armor, idleCycle);
    drawAccessory(heroId, loadout?.accessory, idleCycle);
    drawHeroHead(heroId, idleCycle);
    drawHeroDetails(heroId, loadout?.armor, idleCycle, unit.moving ? walkCycle : 0);
  } else {
    drawEnemyBody(unit, body, accent, idleCycle);
    drawEnemyDetails(unit, idleCycle);
  }
  if (unit.hitFlash > 0) {
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = Math.min(0.82, unit.hitFlash * 5);
    drawPixelRect(-10, -27, 20, 19, "#fff");
    drawPixelRect(-13, -22, 5, 16, "#fff");
    drawPixelRect(8, -22, 5, 16, "#fff");
    drawPixelRect(-8, -40, 16, 14, "#fff");
    drawPixelRect(-10, -43, 20, 7, "#fff");
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  drawWeapon(unit, accent);
  ctx.restore();
  if (!unit.dead) drawHealthBar(unit, unit.renderX, unit.renderY + bob);
}

function drawEffects() {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const effect of runtime.effects) {
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = Math.sin(progress * Math.PI);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = effect.color;
    ctx.fillStyle = effect.color;
    ctx.lineWidth = Math.max(2, 6 * (1 - progress));
    if (effect.type === "afterimage") {
      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.scale(effect.scale * effect.facing, effect.scale);
      ctx.globalAlpha = alpha * 0.28;
      ctx.fillStyle = effect.color;
      ctx.fillRect(-10, -27, 20, 20);
      ctx.fillRect(-8, -41, 16, 14);
      ctx.fillRect(-13, -22, 5, 15);
      ctx.fillRect(8, -22, 5, 15);
      ctx.restore();
    } else if (effect.type === "dust") {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha * 0.48;
      ctx.fillStyle = effect.color;
      for (let i = 0; i < 5; i += 1) {
        const offset = (i - 2) * effect.radius * 0.28;
        const rise = Math.abs(i - 2) * 2 + progress * 5;
        const size = Math.max(2, effect.radius * (0.22 - progress * 0.11));
        ctx.fillRect(effect.x + offset - size / 2, effect.y - rise - size / 2, size, size);
      }
      ctx.restore();
    } else if (effect.type === "impact") {
      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.rotate(effect.angle);
      for (let i = 0; i < 6; i += 1) {
        ctx.rotate(Math.PI / 3);
        ctx.fillRect(effect.radius * progress * 0.25, -2, effect.radius * (0.35 + progress * 0.4), Math.max(1, 4 * (1 - progress)));
      }
      ctx.restore();
    } else if (effect.type === "shockwave") {
      ctx.beginPath();
      ctx.ellipse(effect.x, effect.y, effect.radius * progress, effect.radius * progress * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.type === "charge") {
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (1 - progress * 0.45), 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 4; i += 1) {
        const angle = progress * 5 + i * Math.PI / 2;
        const orbit = effect.radius * (0.7 - progress * 0.35);
        ctx.fillRect(effect.x + Math.cos(angle) * orbit - 2, effect.y + Math.sin(angle) * orbit - 2, 4, 4);
      }
    } else if (effect.type === "slash") {
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (0.45 + progress * 0.7), effect.angle - 1.3, effect.angle + 1.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (0.25 + progress * 0.45), effect.angle - 1.1, effect.angle + 1.1);
      ctx.stroke();
    } else if (effect.type === "ring") {
      ctx.beginPath();
      ctx.ellipse(effect.x, effect.y, effect.radius * progress, effect.radius * progress * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.type === "bolt") {
      ctx.beginPath();
      ctx.moveTo(effect.x - 10, effect.y - 75 + progress * 40);
      ctx.lineTo(effect.x + 6, effect.y - 49);
      ctx.lineTo(effect.x - 4, effect.y - 27);
      ctx.lineTo(effect.x + 8, effect.y - 2);
      ctx.stroke();
    } else {
      const particles = effect.type === "burst" ? 12 : 6;
      for (let i = 0; i < particles; i += 1) {
        const angle = (Math.PI * 2 * i) / particles + effect.angle;
        const distance = effect.radius * progress;
        const size = Math.max(1, 5 * (1 - progress));
        ctx.fillRect(effect.x + Math.cos(angle) * distance - size / 2, effect.y + Math.sin(angle) * distance - size / 2, size, size);
      }
    }
  }
  for (const projectile of runtime.projectiles) {
    const dx = projectile.target && !projectile.target.dead ? projectile.target.x - projectile.x : 1;
    const dy = projectile.target && !projectile.target.dead ? projectile.target.y - projectile.y : 0;
    const angle = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = projectile.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-17, 0);
    ctx.lineTo(2, 0);
    ctx.stroke();
    ctx.fillStyle = projectile.color;
    ctx.fillRect(-4, -2, 11, 4);
    ctx.fillStyle = "#fff8d2";
    ctx.fillRect(0, -1, 7, 2);
    ctx.restore();
  }
  ctx.restore();

  for (const number of runtime.numbers) {
    ctx.globalAlpha = clamp(number.life / number.maxLife * 1.5, 0, 1);
    const numberProgress = 1 - number.life / number.maxLife;
    const popScale = numberProgress < 0.22 ? 0.65 + numberProgress / 0.22 * 0.55 : 1.2 - (numberProgress - 0.22) * 0.25;
    ctx.font = "bold " + Math.round(number.size * popScale) + "px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#25140d";
    ctx.strokeText(number.value, number.x, number.y);
    ctx.fillStyle = number.color;
    ctx.fillText(number.value, number.x, number.y);
  }
  ctx.globalAlpha = 1;
}

function drawBattleTitle() {
  const chapter = chapterForStage();
  ctx.save();
  ctx.globalAlpha = 0.17;
  ctx.translate(195, 326);
  ctx.rotate(-0.1);
  ctx.font = "bold 54px DFKai-SB, KaiTi, serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#151810";
  ctx.fillText(chapter.stage, 0, 0);
  ctx.restore();
}

function render() {
  ctx.save();
  if (runtime.shake > 0 && save.effects) {
    ctx.translate((Math.random() - 0.5) * runtime.shake, (Math.random() - 0.5) * runtime.shake);
  }
  drawBackground();
  drawBattleTitle();
  const units = [...runtime.allies, ...runtime.enemies].filter((unit) => !unit.dead || unit.deathTime > 0).sort((a, b) => a.y - b.y);
  for (const unit of units) drawUnit(unit);
  drawEffects();
  ctx.restore();
  if (runtime.flash > 0 && save.effects) {
    ctx.save();
    ctx.globalAlpha = clamp(runtime.flash * 2.8, 0, 0.22);
    ctx.fillStyle = runtime.flashColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function gameLoop(time) {
  const delta = (time - runtime.lastTime) / 1000;
  runtime.lastTime = time;
  updateGame(delta);
  render();
  requestAnimationFrame(gameLoop);
}

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
  $("stageLabel").textContent = Math.ceil(save.stage / 2) + "-" + (save.stage % 2 || 2);
  $("waveLabel").textContent = runtime.bossActive ? "首領戰" : "第 " + (runtime.waveClears + 1) + " 波";
  const living = runtime.enemies.filter((enemy) => !enemy.dead).length;
  $("enemyCount").textContent = "敵軍 " + living;
  $("bossProgress").textContent = Math.min(runtime.waveClears, 3) + " / 3";
  $("bossButton").disabled = runtime.waveClears < 3 || runtime.bossActive || runtime.spawning;
  $("bossButton").setAttribute("aria-label", runtime.bossActive ? "首領戰進行中" : runtime.waveClears < 3 ? "完成三波後挑戰關卡首領" : runtime.spawning ? "首領正在準備" : "挑戰關卡首領");
  $("autoButton").classList.toggle("active", runtime.auto);
  $("autoButton").textContent = runtime.auto ? "自動戰鬥" : "暫停戰鬥";
  $("autoButton").setAttribute("aria-pressed", String(runtime.auto));
  $("speedButton").textContent = "×" + runtime.timeScale;
  $("speedButton").setAttribute("aria-valuetext", "戰鬥速度 ×" + runtime.timeScale);
  $("mailDot").hidden = save.mailClaimed;
}

function showDialogue(name, text, avatarClass) {
  const portrait = $("dialoguePortrait");
  portrait.className = "pixel-avatar " + avatarClass;
  portrait.innerHTML = '<i></i><span class="avatar-detail" aria-hidden="true"></span>';
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
  return '<span class="pixel-avatar ' + hero.avatar + loadoutClasses + (large ? " large" : "") + '"' + heroData + '><i></i><span class="avatar-detail" aria-hidden="true"></span>' + paperLayer + '</span>';
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

function renderCampaign() {
  const items = CHAPTERS.map((chapter, index) => {
    const firstStage = index * 2 + 1;
    const locked = save.stage < firstStage;
    const complete = save.stage > firstStage + 1;
    return '<button class="campaign-card' + (locked ? " locked" : "") + '" type="button" data-number="' + String(index + 1).padStart(2, "0") + '" data-action="' + (locked ? "toast" : "campaign-select") + '" data-stage="' + firstStage + '" data-message="先完成前一章戰役">' +
      '<h3>' + chapter.name + '</h3>' +
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
    const chapter = CHAPTERS[Math.floor((stage - 1) / 2)];
    toast("已完成的章節可在正式版重複挑戰：" + chapter.name);
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

document.querySelectorAll("[data-panel]").forEach((button) => {
  button.addEventListener("click", () => openPanel(button.dataset.panel));
});

$("profileButton").addEventListener("click", () => openPanel("profile"));
$("panelClose").addEventListener("click", closePanel);
$("panelBackdrop").addEventListener("click", (event) => {
  if (event.target === $("panelBackdrop")) closePanel();
});
$("panelBack").addEventListener("click", () => {
  if (runtime.panel === "formation") renderFormation();
  else renderHeroes();
});
$("panelContent").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (button) handlePanelAction(button);
});

$("autoButton").addEventListener("click", () => {
  runtime.auto = !runtime.auto;
  if (runtime.auto && runtime.waveClears >= 3 && !runtime.bossActive && !runtime.spawning) spawnWave(true);
  updateHud();
  toast(runtime.auto ? "自動戰鬥已開啟" : "戰鬥已暫停");
});

$("speedButton").addEventListener("click", () => {
  runtime.timeScale = runtime.timeScale === 1 ? 2 : 1;
  updateHud();
  toast("戰鬥速度 ×" + runtime.timeScale);
});

$("bossButton").addEventListener("click", () => {
  if (runtime.waveClears >= 3 && !runtime.bossActive && !runtime.spawning) spawnWave(true);
});

$("claimOffline").addEventListener("click", () => {
  if (!runtime.pendingOffline) return;
  save.gold += runtime.pendingOffline.gold;
  save.food += runtime.pendingOffline.food;
  runtime.pendingOffline = null;
  $("offlineModal").hidden = true;
  persist();
  updateHud();
  toast("離線軍資已收入府庫");
  beep(720, .14, "triangle", .04);
});

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * canvas.width;
  const y = (event.clientY - rect.top) / rect.height * canvas.height;
  addEffect("ring", x, y, "#d9d29e", { radius: 24, life: .3 });
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) persist();
  else runtime.lastTime = performance.now();
});
window.addEventListener("beforeunload", persist);

const secondsAway = Math.max(0, (Date.now() - (save.lastSeen || Date.now())) / 1000);
buildTerrain();
resetAllies();
spawnWave(false);
updateHud();
showDialogue("張飛", "大哥，前方發現黃巾賊軍！", "avatar-zhangfei");
if (secondsAway >= 90) setTimeout(() => showOfflineReward(secondsAway), 500);
persist();
setInterval(updateHud, 350);
setInterval(persist, 5000);
requestAnimationFrame(gameLoop);
