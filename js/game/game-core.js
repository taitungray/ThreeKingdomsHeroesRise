/* Core: data, save state, shared helpers and terrain setup */
"use strict";

const $ = (id) => document.getElementById(id);
const canvas = $("battleCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const GAME_DATA = window.THREE_KINGDOMS_DATA || {};

const HEROES_FALLBACK = [
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

const HEROES = GAME_DATA.heroes || HEROES_FALLBACK;

const PAPER_DOLL_SLOTS_FALLBACK = [
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

const PAPER_DOLL_SLOTS = GAME_DATA.paperDollSlots || PAPER_DOLL_SLOTS_FALLBACK;

const PAPER_DOLL_DEFAULTS_FALLBACK = {
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

const PAPER_DOLL_DEFAULTS = GAME_DATA.paperDollDefaults || PAPER_DOLL_DEFAULTS_FALLBACK;

function createEquipmentDefaults() {
  return Object.fromEntries(HEROES.map((hero) => [hero.id, { ...(PAPER_DOLL_DEFAULTS[hero.id] || PAPER_DOLL_DEFAULTS.locked) }]));
}

const TACTICS_FALLBACK = [
  { id: "snake", name: "長蛇陣", sigil: "鋒", desc: "全軍攻擊提高，騎兵衝鋒傷害額外增幅。", base: 0.08, cost: 70 },
  { id: "wall", name: "鐵壁陣", sigil: "守", desc: "全軍生命提高，步兵受到的傷害降低。", base: 0.10, cost: 80 },
  { id: "wind", name: "疾風令", sigil: "速", desc: "全軍移速與攻擊速度提高，弓兵先發制人。", base: 0.06, cost: 65 }
];

const TACTICS = GAME_DATA.tactics || TACTICS_FALLBACK;

const CHAPTERS_FALLBACK = [
  { name: "黃巾之亂", stage: "鉅鹿野外", boss: "黃巾渠帥", base: "#697258", path: "#9b8f6a" },
  { name: "桃園結義", stage: "涿郡桃林", boss: "黃巾力士", base: "#6d765d", path: "#a09370" },
  { name: "虎牢雄關", stage: "汜水關前", boss: "華雄", base: "#77705c", path: "#a18e69" },
  { name: "徐州烽火", stage: "下邳古道", boss: "曹軍虎衛", base: "#667066", path: "#968b72" },
  { name: "長坂追兵", stage: "長坂坡", boss: "夏侯追騎", base: "#73705e", path: "#a89a78" },
  { name: "赤壁鏖兵", stage: "烏林江岸", boss: "連環戰船", base: "#566c68", path: "#877f69" }
];

const CHAPTERS = GAME_DATA.chapters || CHAPTERS_FALLBACK;
const STAGES_PER_CHAPTER = Math.max(1, Math.ceil((GAME_DATA.stages?.length || CHAPTERS.length * 2) / CHAPTERS.length));

const SAVE_KEY = "taoyuan-qunying-v2";
const defaultSave = () => ({
  version: 2,
  gold: 860,
  food: 320,
  jade: 12,
  level: 1,
  exp: 0,
  stage: 1,
  maxStage: 1,
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
      maxStage: Math.max(stored.maxStage || 1, stored.stage || 1),
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
  activeStage: save.stage,
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

function activeStageNumber() {
  return Math.max(1, runtime.activeStage || save.stage);
}

function stageDefinition(stage = activeStageNumber()) {
  return GAME_DATA.stages?.find((item) => item.id === stage) || null;
}

function chapterForStage() {
  return CHAPTERS[Math.min(CHAPTERS.length - 1, Math.floor((activeStageNumber() - 1) / STAGES_PER_CHAPTER))];
}

function formationBonus(slot) {
  const row = Math.floor(slot / 3);
  if (row === 0) return { hp: 0.1, def: 0.12, atk: 0, speed: -0.02, range: 0 };
  if (row === 1) return { hp: 0.02, def: 0.02, atk: 0.08, speed: 0.02, range: 0 };
  return { hp: -0.02, def: 0, atk: 0.02, speed: 0.08, range: 18 };
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

