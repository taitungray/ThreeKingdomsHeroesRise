/* Core: data, save state, shared helpers and terrain setup */
"use strict";

const $ = (id) => document.getElementById(id);
const canvas = $("battleCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const GAME_DATA = window.THREE_KINGDOMS_DATA || {};

const TROOP_CLASSES = {
  "步兵": { name: "步兵", icon: "🛡️", counter: "弓兵", counteredBy: "騎兵", color: "#6a9c78", desc: "前排堅盾，防高血厚，剋制弓兵 (+15%)，受騎兵衝擊剋制。" },
  "騎兵": { name: "騎兵", icon: "🐎", counter: "步兵", counteredBy: "弓兵", color: "#b94a34", desc: "突擊先鋒，高速高攻，剋制步兵 (+15%)，受弓兵齊射剋制。" },
  "弓兵": { name: "弓兵", icon: "🏹", counter: "騎兵", counteredBy: "步兵", color: "#d8a63e", desc: "遠程狙擊，超遠射程，剋制騎兵 (+15%)，受步兵近身剋制。" },
  "謀士": { name: "謀士", icon: "📜", counter: "全兵種", counteredBy: "近戰", color: "#7a6ba8", desc: "法術核心，奧義範圍控場，法術傷害 (+10%)，受近戰傷害 (+10%)。" }
};

const STAGE_WEATHER_MAP = {
  1: "clear", 2: "clear", 3: "sand", 4: "rain", 5: "sand", 6: "mist", 7: "fire", 8: "rain", 9: "clear", 10: "mist",
  11: "snow", 12: "rain", 13: "rain", 14: "fire", 15: "mist", 16: "sand", 17: "leaves", 18: "leaves", 19: "rain", 20: "gold"
};

function currentStageWeather(stageId = activeStageNumber()) {
  const chapterId = Math.min(20, Math.floor((stageId - 1) / 5) + 1);
  return STAGE_WEATHER_MAP[chapterId] || "clear";
}

function troopMasteryLevel(role) {
  ensureCycleState();
  return Math.max(0, Math.min(10, Number(save.troopMastery?.[role]) || 0));
}

function troopMasteryCost(role) {
  const lvl = troopMasteryLevel(role);
  if (lvl >= 10) return null;
  return { gold: 300 + lvl * 200, food: 150 + lvl * 120 };
}

function troopMasteryBonus(role) {
  const lvl = troopMasteryLevel(role);
  if (!lvl) return { atk: 0, hp: 0, def: 0, speed: 0, range: 0 };
  if (role === "步兵") return { hp: lvl * 0.03, def: lvl * 0.03, atk: 0, speed: 0, range: 0 };
  if (role === "騎兵") return { atk: lvl * 0.03, speed: lvl * 0.02, hp: 0, def: 0, range: 0 };
  if (role === "弓兵") return { atk: lvl * 0.03, range: lvl * 2.5, hp: 0, def: 0, speed: 0 };
  if (role === "謀士") return { atk: lvl * 0.035, hp: 0, def: 0, speed: 0, range: 0 };
  return { atk: 0, hp: 0, def: 0, speed: 0, range: 0 };
}

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
  liubei: { weapon: "twin", armor: "oath", mount: "hex-mark", accessory: "jade" },
  guanyu: { weapon: "guandao", armor: "oath", mount: "redhare", accessory: "dragon" },
  zhangfei: { weapon: "serpent", armor: "iron", mount: "blackhorse", accessory: "war" },
  zhaoyun: { weapon: "lance", armor: "iron", mount: "whitehorse", accessory: "jade" },
  huangzhong: { weapon: "bow", armor: "iron", mount: "grey", accessory: "war" },
  sunshang: { weapon: "bow", armor: "silk", mount: "whitehorse", accessory: "jade" },
  caocao: { weapon: "twin", armor: "silk", mount: "blackhorse", accessory: "dragon" },
  xiahoudun: { weapon: "guandao", armor: "iron", mount: "redhare", accessory: "war" },
  zhugeliang: { weapon: "fan", armor: "silk", mount: "jadelion", accessory: "feather" },
  diaochan: { weapon: "rings", armor: "silk", mount: "whitehorse", accessory: "jade" },
  lubu: { weapon: "halberd", armor: "crimson", mount: "redhare", accessory: "war" },
  locked: { weapon: "twin", armor: "oath", mount: "grey", accessory: "jade" }
};

const PAPER_DOLL_DEFAULTS = GAME_DATA.paperDollDefaults || PAPER_DOLL_DEFAULTS_FALLBACK;

function createEquipmentDefaults() {
  return Object.fromEntries(HEROES.map((hero) => [hero.id, { ...(PAPER_DOLL_DEFAULTS[hero.id] || PAPER_DOLL_DEFAULTS.locked) }]));
}

function createOwnedEquipment() {
  const owned = { weapon: [], armor: [], mount: [], accessory: [] };
  const add = (slotId, itemId) => {
    if (!itemId || owned[slotId].includes(itemId)) return;
    owned[slotId].push(itemId);
  };
  for (const loadout of Object.values(PAPER_DOLL_DEFAULTS)) {
    add("weapon", loadout.weapon);
    add("armor", loadout.armor);
    add("mount", loadout.mount);
    add("accessory", loadout.accessory);
  }
  add("weapon", "twin");
  add("armor", "oath");
  add("mount", "grey");
  add("accessory", "jade");
  return owned;
}

function isEquipmentOwned(slotId, itemId) {
  if (!save.ownedEquipment) save.ownedEquipment = createOwnedEquipment();
  return (save.ownedEquipment[slotId] || []).includes(itemId);
}

function grantEquipment(slotId, itemId) {
  if (!save.ownedEquipment) save.ownedEquipment = createOwnedEquipment();
  if (!save.ownedEquipment[slotId]) save.ownedEquipment[slotId] = [];
  if (itemId && !save.ownedEquipment[slotId].includes(itemId)) save.ownedEquipment[slotId].push(itemId);
}

function cycleOwnedEquipment(heroId, slot) {
  const owned = slot.choices.filter((choice) => isEquipmentOwned(slot.id, choice.id));
  const current = paperDollItem(heroId, slot.id);
  const pool = owned.length ? owned : (current ? [current] : slot.choices.slice(0, 1));
  const loadout = heroLoadout(heroId);
  const currentIndex = Math.max(0, pool.findIndex((choice) => choice.id === loadout[slot.id]));
  return pool[(currentIndex + 1) % pool.length];
}

function compareEquipmentBonus(current, next) {
  const keys = ["atk", "hp", "def", "speed", "range"];
  const labels = { atk: "武力", hp: "兵力", def: "統率", speed: "速度", range: "射程" };
  return keys.map((key) => {
    const delta = (next?.stats?.[key] || 0) - (current?.stats?.[key] || 0);
    if (!delta) return "";
    return labels[key] + (delta > 0 ? " +" : " ") + delta;
  }).filter(Boolean).join("　");
}

const TACTICS_FALLBACK = [
  { id: "snake", name: "長蛇陣", sigil: "鋒", desc: "全軍攻擊提高，騎兵衝鋒傷害額外增幅。", base: 0.08, cost: 70 },
  { id: "wall", name: "鐵壁陣", sigil: "守", desc: "全軍生命提高，步兵受到的傷害降低。", base: 0.10, cost: 80 },
  { id: "wind", name: "疾風令", sigil: "速", desc: "全軍移速與攻擊速度提高，弓兵先發制人。", base: 0.06, cost: 65 }
];

const TACTICS = GAME_DATA.tactics || TACTICS_FALLBACK;
const DAILY_TASKS = GAME_DATA.dailyTasks || [];
const WEEKLY_TASKS = GAME_DATA.weeklyTasks || [];
const CHECKIN_REWARDS = GAME_DATA.checkinRewards || [];
const SHOP_ITEMS = GAME_DATA.shopItems || [];
const ARENA_OPPONENTS = GAME_DATA.arenaOpponents || [];
const TUTORIAL_STEPS = GAME_DATA.tutorialSteps || [];
const STORY_BEATS = GAME_DATA.storyBeats || [];
const SKILL_SPECS = GAME_DATA.skillSpecs || {};
const FACTION_BY_HERO = GAME_DATA.factionByHero || {};
const FACTIONS = GAME_DATA.factions || {};
const BONDS = GAME_DATA.bonds || [];
const DAILY_DUNGEONS = GAME_DATA.dailyDungeons || [];
const TREASURES = GAME_DATA.treasures || [];
const TITLES = GAME_DATA.titles || [];
const TOWER_CONFIG = GAME_DATA.tower || { name: "Tower", basePower: 2700, powerStep: 260, stamina: 4 };
const AVATAR_FRAMES = GAME_DATA.avatarFrames || [];
const ANNOUNCEMENTS = GAME_DATA.announcements || [];
const LOCAL_EVENTS = GAME_DATA.localEvents || [];
const APP_VERSION = GAME_DATA.appVersion || "0.1.0-local";

const FACTION_MILESTONES = {
  shu: [
    { count: 3, kind: "atk", value: 0.03, label: "全隊攻擊 +3%", jade: 20, name: "桃園初結" },
    { count: 6, kind: "atk", value: 0.06, label: "全隊攻擊 +6%", jade: 30, name: "蜀漢昭烈" },
    { count: 10, kind: "atk", value: 0.10, label: "全隊攻擊 +10%", jade: 50, name: "五虎齊聚" }
  ],
  wei: [
    { count: 3, kind: "def", value: 0.03, label: "全隊防禦 +3%", jade: 20, name: "魏武初興" },
    { count: 6, kind: "def", value: 0.06, label: "全隊防禦 +6%", jade: 30, name: "五子良將" },
    { count: 10, kind: "def", value: 0.10, label: "全隊防禦 +10%", jade: 50, name: "虎豹雄師" }
  ],
  wu: [
    { count: 3, kind: "speed", value: 0.03, label: "全隊攻速 +3%", jade: 20, name: "江東基業" },
    { count: 6, kind: "speed", value: 0.06, label: "全隊攻速 +6%", jade: 30, name: "水師大都督" },
    { count: 10, kind: "speed", value: 0.10, label: "全隊攻速 +10%", jade: 50, name: "赤壁驚濤" }
  ],
  qun: [
    { count: 3, kind: "crit", value: 0.03, label: "全隊暴擊 +3%", jade: 20, name: "群雄逐鹿" },
    { count: 6, kind: "crit", value: 0.06, label: "全隊暴擊 +6%", jade: 30, name: "天命無雙" },
    { count: 10, kind: "crit", value: 0.10, label: "全隊暴擊 +10%", jade: 50, name: "天下霸圖" }
  ]
};

const HERO_BIOGRAPHIES = {
  // 蜀漢
  liubei: { courtesy: "字玄德", origin: "幽州涿郡涿縣", summary: "漢景帝子中山靖王劉勝之後。以仁德待人，折而不撓，攜手關張桃園結義，三顧茅廬得諸葛亮，建立蜀漢基業，諡號昭烈皇帝。", deeds: "桃園結義 · 攜民渡江 · 建立蜀漢" },
  guanyu: { courtesy: "字雲長", origin: "司隸河東郡解縣", summary: "蜀漢五虎上將之首，威震華夏。忠勇絕倫，千里走單騎過五關斬六將。水淹七軍擒于禁斬龐德，後世尊為「武聖」。", deeds: "溫酒斬華雄 · 千里走單騎 · 水淹七軍" },
  zhangfei: { courtesy: "字翼德", origin: "幽州涿郡", summary: "勇冠三軍，萬人之敵。當陽橋頭一聲怒喝，水倒流橋斷，嚇退曹操大軍；智擒嚴顏，義釋老將，名揚天下。", deeds: "長坂橋斷喝 · 義釋嚴顏 · 大破張郃" },
  zhaoyun: { courtesy: "字子龍", origin: "冀州常山真定", summary: "常勝將軍，忠肝義膽。當陽長坂坡單騎救幼主阿斗，七進七出殺退曹軍；漢水之戰大擺空營計，被劉備讚為「一身都是膽」。", deeds: "長坂救主 · 截江奪阿斗 · 漢水破敵" },
  huangzhong: { courtesy: "字漢升", origin: "荊州南陽郡", summary: "五虎上將之一，老當益壯，百步穿楊。定軍山之戰身先士卒，陣斬曹魏名將夏侯淵，奠定漢中爭奪戰大勝。", deeds: "長沙會戰 · 定軍山斬夏侯淵" },
  machao: { courtesy: "字孟起", origin: "涼州扶風茂陵", summary: "名門之後，人稱「錦馬超」。驍勇善戰，潼關之戰曾逼得曹操割鬚棄袍；後歸劉備，威震西陲，列五虎上將。", deeds: "潼關大戰 · 逼降成都 · 威震涼州" },
  pangtong: { courtesy: "字士元", origin: "荊州襄陽", summary: "號「鳳雛」，與諸葛亮並稱天下奇才。赤壁之戰獻連環計立奇功；隨劉備入蜀進獻上中下三策，不幸落鳳坡中箭殉國。", deeds: "連環火攻計 · 輔佐進蜀 · 智略過人" },
  weiyan: { courtesy: "字文長", origin: "荊州義陽郡", summary: "蜀漢大將，勇猛善戰，深受劉備信任破格拔擢鎮守漢中近十年。北伐中多次任前鋒，提「子午谷奇謀」，勇冠三軍。", deeds: "鎮守漢中 · 子午奇謀 · 北伐前鋒" },
  jiangwei: { courtesy: "字伯約", origin: "涼州天水冀縣", summary: "諸葛亮親傳弟子，文武雙全。諸葛亮逝世後繼承北伐遺志，九伐中原，鞠躬盡瘁，為蜀漢最後之擎天柱石。", deeds: "九伐中原 · 沓中屯田 · 劍閣死守" },
  guanping: { courtesy: "字坦之", origin: "司隸河東解縣", summary: "關羽長子，勇烈過人。隨父鎮守荊州，征戰襄樊，屢立奇功，城陷身死，父子同赴大義，為後世敬仰。", deeds: "襄樊先鋒 · 忠烈相隨" },
  guanxing: { courtesy: "字安國", origin: "司隸河東解縣", summary: "關羽次子，深得諸葛亮器重。與張苞結為義兄弟，並稱蜀漢二代雙煞，多次隨諸葛亮北伐斬將立功。", deeds: "斬潘璋奪青龍刀 · 北伐立功" },
  fazheng: { courtesy: "字孝直", origin: "司隸右扶風郿縣", summary: "劉備最倚重之謀主，料事如神。策劃漢中之戰並斬夏侯淵，被曹操嘆曰「吾收奸雄略盡，獨不得正邪」。", deeds: "策定漢中 · 斬夏侯淵 · 蜀科創制" },

  // 曹魏
  caocao: { courtesy: "字孟德", origin: "豫州沛國譙縣", summary: "三國傑出政治家、軍事家與文學家。奉天子以令不臣，官渡之戰以弱勝強破袁紹，統一北方，奠定曹魏霸業基石。", deeds: "官渡之戰 · 統一北方 · 魏武霸業" },
  xiahoudun: { courtesy: "字元讓", origin: "豫州沛國譙縣", summary: "曹魏開國元勳，性格剛烈。征戰中左眼中箭，拔矢啖睛曰「父母精血不可棄也」，勇悍之氣威震敵軍。", deeds: "拔矢啖睛 · 鎮撫後方 · 宗室第一將" },
  dianwei: { courtesy: "字惡來", origin: "兗州陳留己吾", summary: "曹操麾下頭號力士猛將，勇力過人，使雙鐵戟八十斤。宛城之戰為掩護曹操撤退，力竭戰死，壯烈至極。", deeds: "古之惡來 · 宛城死戰護主" },
  xuhuang: { courtesy: "字公明", origin: "司隸河東楊縣", summary: "曹魏「五子良將」之一。治軍嚴謹有周亞夫之風，樊城之戰長驅直入擊破關羽，解襄樊之圍，立下不世功勳。", deeds: "解襄樊之圍 · 長驅直入 · 周亞夫之風" },
  zhangliao: { courtesy: "字文遠", origin: "并州雁門馬邑", summary: "五子良將之首。合肥之戰率八百壯士衝擊孫權十萬大軍，斬將搴旗，威震逍遙津，令「江東小兒不敢夜啼」。", deeds: "白狼山陣斬蹋頓 · 威震逍遙津" },
  zhanghe: { courtesy: "字儁乂", origin: "冀州河間鄚縣", summary: "五子良將之一，善於用兵巧變與排兵佈陣。街亭之戰大破馬謖，令諸葛亮初次北伐受挫，諸葛亮亦深忌之。", deeds: "街亭破馬謖 · 善列營陣 · 巧變料敵" },
  xunyu: { courtesy: "字文若", origin: "豫州潁川潁陰", summary: "曹操首席謀臣，被譽為「吾之子房」。居中持重數十年，策劃奉天子以令諸侯、官渡之策，有王佐之才。", deeds: "奉天子以令不臣 · 官渡奇謀 · 王佐之才" },
  guojia: { courtesy: "字奉孝", origin: "豫州潁川陽翟", summary: "曹操最倚重之奇謀鬼才，算無遺策。提出「十勝十敗論」，平定北方戰無不克，曹操嘆「唯奉孝為能知孤意」。", deeds: "十勝十敗論 · 平定烏桓 · 鬼謀神算" },
  yujin: { courtesy: "字文則", origin: "兗州泰山鉅平", summary: "五子良將之一，以法度嚴明著稱。歷經數百戰，深得曹操信賴，持節督諸軍，官渡之戰固守營寨立奇功。", deeds: "官渡堅守 · 嚴整法度 · 持節督軍" },
  lejin: { courtesy: "字文謙", origin: "兗州陽平衛國", summary: "五子良將之一，以每戰「先登陷陣」聞名天下。攻拔敵城無不身先士卒，驍勇無比，累功拜右將軍。", deeds: "每戰先登 · 拔城奪旗 · 勇猛絕倫" },
  caoren: { courtesy: "字子孝", origin: "豫州沛國譙縣", summary: "曹魏名將，善守第一。江陵之戰抵禦周瑜，樊城之戰受關羽水淹死守不降，被評為「曹魏之盾，勇冠諸將」。", deeds: "江陵拒周瑜 · 樊城死守抗關羽" },
  xiahouyuan: { courtesy: "字妙才", origin: "豫州沛國譙縣", summary: "曹魏名將，善於千里奔襲，有「虎步關右，三日五百，六日一千」之美譽，平定涼州諸羌，威震西陲。", deeds: "虎步關右 · 逐馬超破韓遂 · 神速出奇" },
  yuanshao: { courtesy: "字本初", origin: "豫州汝南汝陽", summary: "名門汝南袁氏「四世三公」之後。十八路反董卓諸侯盟主，擊滅公孫瓚統一河北四州，實力曾為天下諸侯之冠。", deeds: "討董盟主 · 統一河北 · 四世三公" },

  // 東吳
  sunshang: { courtesy: "名孫尚香", origin: "揚州吳郡富春", summary: "孫堅之女，孫策、孫權之妹。性格剛毅勇烈，喜弄弓矢，有乃兄之風，人稱「弓腰姬」，後與劉備結為連理。", deeds: "梟姬善射 · 截江護阿斗 · 巾幗英雄" },
  zhouyu: { courtesy: "字公瑾", origin: "揚州廬江舒縣", summary: "東吳大都督，文武韜略天下無雙。赤壁之戰指揮孫劉聯軍，以火攻大破曹操百萬之師，奠定三國鼎立天下大勢。", deeds: "赤壁鏖兵大破曹操 · 開拓江東" },
  lusu: { courtesy: "字子敬", origin: "臨淮東城", summary: "東吳戰略擘畫者。提出著名的「榻上策」倡議三分天下，促成孫劉聯盟共抗曹操，性格寬仁厚德，深謀遠慮。", deeds: "榻上三國策 · 促成孫劉聯盟 · 掌三江水師" },
  luxun: { courtesy: "字伯言", origin: "揚州吳郡吳縣", summary: "東吳名將，大器晚成。白衣渡江襲奪荊州，夷陵之戰火燒連營七百里大破劉備，石亭之戰破曹休，出將入相。", deeds: "白衣渡江取荊州 · 夷陵火燒連營" },
  ganning: { courtesy: "字興霸", origin: "益州巴郡臨江", summary: "東吳「江表之虎臣」。原為錦帆賊，後投孫權。濡須口之戰率百名敢死隊夜襲曹操大營，斬首數十級全身而退。", deeds: "百騎劫魏營 · 攻破皖城 · 錦帆虎將" },
  taishici: { courtesy: "字子義", origin: "青州東萊黃縣", summary: "三國神射猛將。北海單騎突圍求援，神亭嶺與孫策酣戰難分伯仲，後仕東吳，臨終嘆「當帶三尺劍立不世之功」。", deeds: "神亭酣戰孫策 · 北海單騎突圍 · 神箭無雙" },
  zhuran: { courtesy: "字義封", origin: "丹陽故鄣", summary: "東吳名將，膽略過人。夷陵之戰截斷蜀軍後路，江陵之戰率數千精卒抵禦曹魏六個月大軍圍攻，名震魏蜀。", deeds: "江陵抗魏大圍 · 夷陵斷後 · 江東重臣" },
  panzhang: { courtesy: "字文珪", origin: "東郡發干", summary: "東吳虎將，善設伏兵。臨沮伏擊俘獲關羽、關平父子，奪得青龍偃月刀，歷任偏將軍，作戰勇猛果決。", deeds: "臨沮擒關羽 · 濡須破魏 · 勇烈果決" },
  huanggai: { courtesy: "字公覆", origin: "零陵泉陵", summary: "東吳三朝元老老將。赤壁之戰與周瑜共行「苦肉計」，親率十艘火船詐降曹操，引發赤壁沖天烈焰，功冠諸將。", deeds: "苦肉計詐降 · 火燒赤壁戰船 · 歷事三世" },
  handang: { courtesy: "字義公", origin: "遼西令支", summary: "東吳老將，弓馬嫻熟，膂力過人。隨孫堅、孫策、孫權征戰數十年，夷陵之戰隨陸遜破蜀，戰功卓著。", deeds: "隨孫破虜征戰 · 夷陵破蜀 · 宿衛元老" },
  chengpu: { courtesy: "字德謀", origin: "右北平土垠", summary: "東吳資歷最深之元老，諸將皆尊稱「程公」。隨孫堅征討黃巾董卓，赤壁之戰任右都督與周瑜共破曹操。", deeds: "程公德望 · 赤壁右都督 · 輔佐三代" },
  daqiao: { courtesy: "人稱大喬", origin: "揚州廬江皖縣", summary: "橋公長女，孫策之妻。國色天香，聰慧賢淑，與妹小喬並稱「江東二喬」，沉魚落雁之貌載譽青史。", deeds: "江東國色 · 賢德輔政 · 琴心化刃" },
  xiaoqiao: { courtesy: "人稱小喬", origin: "揚州廬江皖縣", summary: "橋公次女，周瑜之妻。傾國傾城，知書達禮，與周郎結為曠世良緣，赤壁風雲中名動天下，傳唱千古。", deeds: "國色天香 · 英雄佳侶 · 銅雀名篇" },

  // 群雄
  zhugeliang: { courtesy: "字孔明", origin: "徐州琅琊陽都", summary: "號「臥龍」，三國最偉大政治家、軍事家。未出茅廬已知天下三分，草船借箭、借東風、七擒孟獲、六出祁山，千古名相。", deeds: "隆中對 · 赤壁借風 · 七擒孟獲 · 出師表" },
  diaochan: { courtesy: "閉月之容", origin: "三國名媛", summary: "中國古代四大美女之「閉月」。司徒王允養女，以天下大義為重施展「連環美人計」，巧妙離間董卓與呂布，除滅暴君。", deeds: "連環美人計 · 離間董呂 · 傾國定亂" },
  lubu: { courtesy: "字奉先", origin: "并州五原九原", summary: "三國第一猛將，人稱「飛將」、「人中呂布，馬中赤兔」。虎牢關大戰三英，轅門射戟止干戈，武勇天下無雙。", deeds: "虎牢關戰三英 · 轅門射戟 · 天下無雙" },
  simayi: { courtesy: "字仲達", origin: "司隸河內溫縣", summary: "三國傑出政治家、軍事統帥。隱忍堅毅，屢次抵禦諸葛亮北伐；高平陵之變掌控曹魏大權，奠定西晉代魏基礎。", deeds: "拒諸葛亮北伐 · 平定遼東 · 奠定晉基" },
  zhangbao: { courtesy: "地公將軍", origin: "冀州鉅鹿", summary: "黃巾起義三大領袖之一。精通符水妖法與雷火陣法，與兄張角、弟張梁掀起席捲東漢八州的黃巾起義巨浪。", deeds: "黃天義旗 · 呼風召雷 · 席捲八州" },
  zhangliang: { courtesy: "人公將軍", origin: "冀州鉅鹿", summary: "黃巾起義領袖之一。隨張角於河北起義，傳播太平道，聚眾數十萬對抗東漢官軍，勇戰至最後一刻。", deeds: "太平傳道 · 廣宗血戰 · 義軍先驅" },
  menghuo: { courtesy: "南中蠻王", origin: "益州建寧", summary: "南中少數民族首領，威服百蠻。諸葛亮南征時七次擒獲七次釋放，終感佩漢丞相仁德，真心歸服，永不再反。", deeds: "七擒七縱 · 永鎮南中 · 百蠻之主" },
  zhurong: { courtesy: "祝融夫人", origin: "南中蠻疆", summary: "南中蠻王孟獲之妻，相傳為火神祝融氏後裔。武藝高強，擅使飛刀神技，陣前曾連擒蜀將張嶷、馬忠，巾幗不讓鬚眉。", deeds: "飛刀神技 · 陣擒蜀將 · 南蠻火神" },
  madai: { courtesy: "字伯瞻", origin: "涼州扶風茂陵", summary: "馬超從弟，沉穩忠勇。隨兄征戰一生，南征北伐屢建奇功；諸葛亮臨終密授錦囊計，於陣前斬殺叛將魏延。", deeds: "奉密令斬魏延 · 轉戰涼州蜀中" },
  gongsunzan: { courtesy: "字伯珪", origin: "幽州遼西令支", summary: "東漢末年北方諸侯，組建名震塞外的精銳騎兵「白馬義從」，大破烏桓與黃巾，威震幽燕之地。", deeds: "白馬義從 · 威震塞外 · 幽燕稱雄" },
  zhenji: { courtesy: "文昭甄皇后", origin: "冀州中山無極", summary: "三國絕代佳人，曹丕之妻。姿容絕代，才思敏捷，曹植作千古名篇《洛神賦》以此為神思寄託，傳唱千載。", deeds: "洛神芳華 · 才貌絕倫 · 傾城名媛" },
  dongzhuo: { courtesy: "字仲穎", origin: "涼州隴西臨洮", summary: "東漢末年軍閥暴君。率西涼鐵騎入洛陽廢立皇帝、專斷朝政，引發十八路諸侯討董大戰，亂世由此開啟。", deeds: "西涼鐵騎入京 · 遷都長安 · 亂世禍首" },
  zhangjiao: { courtesy: "大賢良師", origin: "冀州鉅鹿", summary: "太平道創始人，黃巾起義天公將軍。創立「蒼天已死，黃天當立」口號，引發東漢末年最大規模農民起義。", deeds: "天公將軍 · 創立太平道 · 掀起三國亂世" },
  yanliang: { courtesy: "河北名將", origin: "冀州", summary: "袁紹麾下頭號猛將。勇力過人，官渡之戰任前鋒圍攻白馬，威名赫赫，白馬坡之戰名震中原。", deeds: "河北雙雄之首 · 勇冠三軍 · 白馬前鋒" },
  wenchou: { courtesy: "河北名將", origin: "冀州", summary: "袁紹麾下河北雙雄之一。身經百戰，驍勇善戰，延津之戰率鐵騎大戰曹軍，名震三國戰場。", deeds: "河北雙雄 · 延津鐵騎 · 威震河北" }
};

const HERO_BATTLE_QUOTES = {
  // 蜀漢 (12名)
  liubei: [
    "仁義昭烈，匡扶漢室！",
    "得道多助，天下歸心！",
    "漢室宗親，誓不背盟！",
    "百姓何辜，吾當親冒矢石！",
    "雙股劍鳴，天下義勇齊心！"
  ],
  guanyu: [
    "關雲長在此，爾等插標賣首！",
    "青龍偃月，斬將奪旗！",
    "玉可碎而不可改其白，竹可焚而不可毀其節！",
    "匹夫受死，看吾春秋刀法！",
    "過五關斬六將，誰敢擋我關某去路！"
  ],
  zhangfei: [
    "燕人張翼德在此！誰敢與我決一死戰！",
    "長坂橋頭一聲吼，喝退曹操百萬兵！",
    "丈八蛇矛貫長空，踏碎敵陣！",
    "哇呀呀呀！吃俺老張一矛！",
    "陣前小兒，納命來吧！"
  ],
  zhaoyun: [
    "主公莫慌，常山趙子龍來也！",
    "單騎救主，龍膽破陣！",
    "長坂坡前血染袍，七進七出破重圍！",
    "銀槍若龍，無堅不摧！",
    "一身都是膽，死戰何所懼！"
  ],
  huangzhong: [
    "老夫雖老，寶弓猶未朽！",
    "百步穿楊，例無虛發！",
    "定軍山前斬夏侯，誰言廉頗老矣！",
    "落日神弓引滿月，一箭封喉！",
    "蒼髯皓首，猶能披甲吞江！"
  ],
  machao: [
    "西涼錦馬超在此，誓報血海深仇！",
    "白袍銀甲，踏破敵營！",
    "西涼鐵騎，踏平中原！",
    "虎將何懼，長槍染血！",
    "追得曹瞞割鬚棄袍，今日再斬敵酋！"
  ],
  pangtong: [
    "鳳雛展翼，火攻奇謀！",
    "智計百出，決勝帷幄！",
    "連環妙計，焚盡敵船！",
    "用兵如神，安能料吾之策！",
    "落鳳坡前志未酬，今日重整乾坤！"
  ],
  weiyan: [
    "反骨何妨，唯戰而已！",
    "陷陣衝鋒，萬軍難當！",
    "子午奇謀，直取長安！",
    "狂骨傲氣，斬破重圍！",
    "誰人能奈我魏文長何！"
  ],
  jiangwei: [
    "繼承丞相遺志，九伐中原！",
    "心存漢室，死戰不休！",
    "吾計若成，漢室可興！",
    "幼麟出山，兵法相傳！",
    "披肝瀝膽，忠魂不滅！"
  ],
  guanping: [
    "承父威名，刀鋒無畏！",
    "忠烈之嗣，誓斬敵酋！",
    "青龍輔佐，戰無不勝！",
    "隨父征戰，何懼生死！",
    "刀鋒所向，寸草不生！"
  ],
  guanxing: [
    "青龍繼武，斬敵先鋒！",
    "不辱父名，披荊斬棘！",
    "小將何懼，陣前立功！",
    "手起刀落，取爾首級！",
    "兄弟同心，其利斷金！"
  ],
  fazheng: [
    "料敵如神，漢中必克！",
    "奇謀助主，算無漏算！",
    "恩怨分明，決勝疆場！",
    "計出萬全，敵軍必敗！",
    "以正合，以奇勝！"
  ],

  // 曹魏 (13名)
  caocao: [
    "寧教我負天下人，休教天下人負我！",
    "唯才是舉，天下歸魏！",
    "周公吐哺，天下歸心！",
    "老驥伏櫪，志在千里！",
    "設使天下無有孤，不知當幾人稱帝、幾人稱王！"
  ],
  xiahoudun: [
    "父母精血，不可棄也！",
    "獨眼何懼，拔矢啖睛再戰！",
    "魏武先鋒，陷陣死鬥！",
    "開道破障，萬夫莫開！",
    "誰敢欺我魏將無人！"
  ],
  dianwei: [
    "古之惡來，雙戟護主！",
    "死守營門，一步不退！",
    "雙鐵戟下無生魂！",
    "主公先走，某來斷後！",
    "血戰宛城，誓死報恩！"
  ],
  xuhuang: [
    "治軍嚴整，有周亞夫之風！",
    "開山大斧，破陣先驅！",
    "解樊城之圍，威震華夏！",
    "令行禁止，堅如磐石！",
    "巨斧劈山，誰堪匹敵！"
  ],
  zhangliao: [
    "威震逍遙津，江東小兒不敢夜啼！",
    "奔襲千軍，直取中軍大旗！",
    "八百步騎踏破十萬江東軍！",
    "五子良將，遼為先鋒！",
    "遼來也！敵將受死！"
  ],
  zhanghe: [
    "用兵巧變，善列營陣！",
    "巧變之將，料敵機先！",
    "斷街亭要道，克敵制勝！",
    "行軍佈陣，變化無常！",
    "看破虛實，一擊必殺！"
  ],
  xunyu: [
    "王佐之才，定鼎中原！",
    "驅虎吞狼，漢室匡弼！",
    "運籌帷幄，迎奉天子！",
    "深謀遠慮，安內攘外！",
    "荀令留香，謀定天下！"
  ],
  guojia: [
    "算無遺策，主公速決！",
    "兵貴神速，破敵正當此時！",
    "十勝十敗，明斷大勢！",
    "郭奉孝在此，天下可定！",
    "天妒英才，智冠三國！"
  ],
  yujin: [
    "法度森嚴，治軍如鐵！",
    "毅重持節，嚴陣以待！",
    "軍法如山，違令者斬！",
    "列陣相持，堅如鐵壁！",
    "三十年從征，威名遠揚！"
  ],
  lejin: [
    "先登陷陣，每戰必前！",
    "驍勇果決，破敵奪旗！",
    "短小精悍，斬將立功！",
    "登城拔寨，何人可擋！",
    "勇冠三軍，萬軍先鋒！"
  ],
  caoren: [
    "鐵壁曹仁，堅不可摧！",
    "固若金湯，固守待變！",
    "守江陵禦周郎，守樊城退雲長！",
    "城在人在，誓與城共存亡！",
    "八門金鎖，萬劫不復！"
  ],
  xiahouyuan: [
    "虎步關右，三日五百，六日一千！",
    "神速出奇，直插敵後！",
    "兵貴神速，出其不意！",
    "奔襲千軍，箭無虛發！",
    "關右諸部，望風披靡！"
  ],
  yuanshao: [
    "四世三公，號令天下諸侯！",
    "河北盟主，揮師南下！",
    "百萬雄兵，席捲中原！",
    "逆賊董卓，天下共討！",
    "河北之廣，誰敢攖鋒！"
  ],

  // 東吳 (13名)
  sunshang: [
    "巾幗何曾讓鬚眉，吃我一箭！",
    "梟姬弓滿，烈焰焚敵！",
    "弓腰紅顏，百步穿楊！",
    "誰說女子不如男！",
    "箭如流星，破敵萬千！"
  ],
  zhouyu: [
    "談笑間，檣櫓灰飛煙滅！",
    "赤壁烈火，燃盡千艘戰船！",
    "羽扇綸巾，天下誰與爭雄！",
    "江東基業，由我周公瑾來守！",
    "曲有誤，周郎顧！戰陣有漏，一擊破之！"
  ],
  lusu: [
    "榻上之策，鼎足三分！",
    "大智若愚，寬仁宏量！",
    "借荊州以圖霸業！",
    "以和為貴，以謀破敵！",
    "胸懷天下，審時度勢！"
  ],
  luxun: [
    "火燒連營七百里！",
    "大器晚成，後生可畏！",
    "誘敵深入，一戰定乾坤！",
    "書生帶劍，亦能定國安邦！",
    "夷陵大捷，威名遠揚！"
  ],
  ganning: [
    "錦帆甘興霸，百騎劫魏營！",
    "鈴響之處，片甲不留！",
    "孟德有張遼，孤有甘興霸！",
    "雙戟橫掃，誰敢與我一戰！",
    "江表虎臣，衝鋒無敵！"
  ],
  taishici: [
    "大丈夫生於亂世，當帶三尺劍立不世之功！",
    "神射無雙，酣戰一場！",
    "北海解圍，單騎突陣！",
    "遇孫策神亭酣戰，平生快事！",
    "弓弦響處，敵酋落馬！"
  ],
  zhuran: [
    "江東名將，臨危受命！",
    "水戰陸攻，皆不在話下！",
    "固守江陵，敵軍莫進！",
    "膽略兼人，誓守江東！",
    "刀光劍影，臨危不亂！"
  ],
  panzhang: [
    "擒關羽奪青龍，戰功赫赫！",
    "誘敵深入，一網打盡！",
    "伏兵四起，插翅難逃！",
    "繳獲青龍刀，再斬敵將！",
    "戰陣埋伏，手到擒來！"
  ],
  huanggai: [
    "苦肉計成，火燒赤壁！",
    "老將披甲，赤膽忠心！",
    "三江口受鞭刑，終定江東！",
    "艨艟巨艦，烈火焚江！",
    "江東老卒，死戰不退！"
  ],
  handang: [
    "江東老將，歷事三世！",
    "矢石無避，衝鋒陷陣！",
    "弓馬嫻熟，斬將拔旗！",
    "隨孫破虜戰天下，何懼鼠輩！",
    "老驥伏櫪，再立新功！"
  ],
  chengpu: [
    "程公在此，誰敢放肆！",
    "三朝元老，穩坐中軍！",
    "鐵脊蛇矛，刺破敵膽！",
    "輔佐三代，功蓋江東！",
    "老將出馬，一個頂倆！"
  ],
  daqiao: [
    "願得一人心，白首不相離。",
    "琴音化刃，護我江東水土。",
    "國色流離，心向光明。",
    "柔情亦有破敵之刃。",
    "玉指輕撥，江浪平息。"
  ],
  xiaoqiao: [
    "東風不與周郎便，銅雀春深鎖二喬。",
    "輕舞飛揚，助夫破敵！",
    "江東二喬，誓守家國！",
    "風起洛陽，弦斷千軍！",
    "周郎伴側，此戰必勝！"
  ],

  // 群雄 (12名)
  zhugeliang: [
    "風起雲湧，借東風以定乾坤！",
    "運籌帷幄之中，決勝千里之外！",
    "鞠躬盡瘁，死而後已！",
    "草船借箭，神鬼莫測！",
    "七星燈明，八陣奇門圖乾坤！"
  ],
  diaochan: [
    "妾身願為將軍撫琴一曲。",
    "月下連環，紅顏亦能定乾坤。",
    "閉月羞花，傾倒天下英雄。",
    "輕歌曼舞，笑看群雄逐鹿。",
    "離間董呂，智取長安。"
  ],
  lubu: [
    "天下英雄，誰能擋我！",
    "神擋殺神，佛擋殺佛！方天畫戟！",
    "人中呂布，馬中赤兔！",
    "三英戰我一人，何足道哉！",
    "轅門射戟，百步穿楊！"
  ],
  simayi: [
    "天命在我，靜待時機！",
    "隱忍多年，今朝盡展宏圖！",
    "夫將兵者，不戰而屈人之兵！",
    "鷹視狼顧，誰主沉浮！",
    "諸葛孔明，且看天下歸誰！"
  ],
  zhangbao: [
    "地公將軍在此，雷霆化形！",
    "黃天當立，歲在甲子，天下大吉！",
    "符水召雷，破盡官軍！",
    "天公助我，風雷齊動！",
    "黃巾義旗，席捲天下！"
  ],
  zhangliang: [
    "人公將軍在此，符水度人！",
    "太平道法，無量神通！",
    "幻術迷眼，雷火焚城！",
    "天道昭昭，順之者昌！",
    "蒼天將傾，黃天立世！"
  ],
  menghuo: [
    "南中蠻王在此，七擒亦不服！",
    "萬獸咆哮，踏碎敵陣！",
    "藤甲重兵，刀槍不入！",
    "南荒各部，隨本王殺！",
    "誓保南中，寸土不讓！"
  ],
  zhurong: [
    "祝融火神在上，烈刃飛刀！",
    "南蠻巾幗，誰與爭鋒！",
    "飛刀連環，百步取命！",
    "烈焰焚身，燒盡漢軍！",
    "火神後裔，所向披靡！"
  ],
  madai: [
    "斬魏延受丞相遺命！",
    "西涼鐵騎，勇冠三軍！",
    "馬岱在此，敵將受死！",
    "追隨兄長，踏破中原！",
    "刀快馬疾，誰敢攖鋒！"
  ],
  gongsunzan: [
    "白馬義從在此，威震塞外！",
    "義之所至，生死相隨！蒼天可鑒，白馬為證！",
    "烏桓胡虜，望風而逃！",
    "白馬連營，鐵騎衝鋒！",
    "幽州鐵騎，無堅不摧！"
  ],
  zhenji: [
    "髣髴兮若輕雲之蔽月，飄颻兮若流風之回雪。",
    "洛神凌波，悲愴動人。",
    "玉容寂寞淚闌干，梨花一枝春帶雨。",
    "琴瑟無語，劍氣傷神。",
    "薄命紅顏，心隨漢土。"
  ],
  dongzhuo: [
    "順我者昌，逆我者亡！",
    "西涼鐵騎，踏平洛陽！",
    "天子在手，號令天下！",
    "誰敢違逆咱家，誅滅九族！",
    "酒池肉林，天下唯我獨尊！"
  ],
  zhangjiao: [
    "蒼天已死，黃天當立！",
    "歲在甲子，天下大吉！",
    "大賢良師在此，雷公助我！",
    "貧道以符水救萬民，天下歸心！",
    "九節杖起，萬雷齊鳴！"
  ],
  yanliang: [
    "河北名將顏良在此，誰敢搦戰！",
    "力拔山兮氣蓋世，刀斬敵首！",
    "袁盟主麾下第一猛將！",
    "匹夫看刀，一刀兩斷！",
    "白馬坡前，萬夫莫開！"
  ],
  wenchou: [
    "河北文醜在此，鐵騎所向披靡！",
    "橫槊長驅，誰與爭鋒！",
    "河北雙雄，今日必破中原！",
    "長槍奪魄，納命來吧！",
    "鐵騎踏處，敵陣皆碎！"
  ]
};

function localDateKey(time = Date.now()) {
  const date = new Date(time);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function localWeekKey(time = Date.now()) {
  const date = new Date(time);
  const first = new Date(date.getFullYear(), 0, 1);
  return date.getFullYear() + "-W" + String(Math.ceil((((date - first) / 86400000) + first.getDay() + 1) / 7)).padStart(2, "0");
}

function localMonthKey(time = Date.now()) {
  const date = new Date(time);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function createDailyState(time = Date.now()) {
  return { date: localDateKey(time), progress: Object.fromEntries(DAILY_TASKS.map((task) => [task.id, 0])), claimed: [], adClaimed: false };
}

function createWeeklyState(time = Date.now()) {
  return { week: localWeekKey(time), progress: Object.fromEntries(WEEKLY_TASKS.map((task) => [task.id, 0])), claimed: [] };
}

function createCheckinState(time = Date.now()) {
  return { month: localMonthKey(time), day: 0, claimed: [] };
}


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

const SAVE_KEY = window.TaoyuanAuth?.getSaveKey?.() || "taoyuan-qunying-v2";
const EFFECT_POOL_SIZE = 160;

function createEffectRecord() {
  return { type: "", x: 0, y: 0, color: "#fff", life: 0, maxLife: 0, radius: 0, angle: 0, scale: 1, facing: 1 };
}

const defaultSave = () => ({
  version: 3,
  gold: 860,
  food: 320,
  jade: 12,
  shards: 24,
  level: 1,
  exp: 0,
  stage: 1,
  maxStage: 1,
  playerName: "\u7384\u5fb7",
  tutorialStep: 0,
  tutorialDone: false,
  heroLevels: Object.fromEntries(HEROES.map((hero) => [hero.id, 1])),
  formation: ["liubei", "guanyu", "zhangfei", "zhaoyun"],
  positions: { liubei: 7, guanyu: 3, zhangfei: 5, zhaoyun: 4 },
  tactics: { snake: 1, wall: 1, wind: 1 },
  equipment: createEquipmentDefaults(),
  ownedEquipment: createOwnedEquipment(),
  mailClaimed: false,
  achievementClaimed: [],
  daily: createDailyState(),
  weekly: createWeeklyState(),
  checkin: createCheckinState(),
  stageStars: {},
  stats: { battles: 0, wins: 0, losses: 0, kills: 0, skills: 0, bosses: 0, highestCombo: 0 },
  shopPurchases: {},
  adClaims: { offline: 0, daily: 0 },
  adFree: false,
  monthlyPassUntil: 0,
  arena: { wins: 0, attempts: 0, claimed: [], week: localWeekKey() },
  battlePass: { xp: 0, claimed: [] },
  sound: true,
  music: true,
  effects: true,
  notifications: false,
  lastSeen: Date.now(),
  heroSort: "power",
  renderQuality: "high",
  lastUpdatedAt: 0,
  stamina: { current: 20, max: 20, lastAt: Date.now() },
  tower: { floor: 0, best: 0 },
  dungeons: { date: localDateKey(), claimed: {} },
  equippedTitle: "volunteer",
  equippedTreasure: "peach-jade",
  equipmentRefine: Object.fromEntries(HEROES.map((hero) => [hero.id, 0])),
  heroProgress: Object.fromEntries(HEROES.map((hero) => [hero.id, { stars: 1, breakthrough: 0, shards: 0 }])),
  skillLevels: Object.fromEntries(HEROES.map((hero) => [hero.id, 1])),
  equippedFrame: "plain",
  collectionMilestones: {},
  troopMastery: { "步兵": 0, "騎兵": 0, "弓兵": 0, "謀士": 0 },
  eventState: { period: localWeekKey(), progress: Object.fromEntries(LOCAL_EVENTS.map((event) => [event.id, 0])), claimed: [] }
});

function loadSave() {
  const fresh = defaultSave();
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!stored || ![2, 3].includes(stored.version)) return fresh;
    return {
      ...fresh,
      ...stored,
      version: 3,
      maxStage: Math.max(stored.maxStage || 1, stored.stage || 1),
      daily: { ...fresh.daily, ...(stored.daily || {}), progress: { ...fresh.daily.progress, ...((stored.daily || {}).progress || {}) } },
      weekly: { ...fresh.weekly, ...(stored.weekly || {}), progress: { ...fresh.weekly.progress, ...((stored.weekly || {}).progress || {}) } },
      checkin: { ...fresh.checkin, ...(stored.checkin || {}) },
      stats: { ...fresh.stats, ...(stored.stats || {}) },
      adClaims: { ...fresh.adClaims, ...(stored.adClaims || {}) },
      monthlyPassUntil: stored.monthlyPassUntil || fresh.monthlyPassUntil,
      arena: { ...fresh.arena, ...(stored.arena || {}) },
      heroSort: stored.heroSort || fresh.heroSort,
      renderQuality: stored.renderQuality || fresh.renderQuality,
      battlePass: { ...fresh.battlePass, ...(stored.battlePass || {}) },
      stamina: { ...fresh.stamina, ...(stored.stamina || {}) },
      tower: { ...fresh.tower, ...(stored.tower || {}) },
      dungeons: { ...fresh.dungeons, ...(stored.dungeons || {}) },
      equipmentRefine: { ...fresh.equipmentRefine, ...(stored.equipmentRefine || {}) },
      heroProgress: Object.fromEntries(HEROES.map((hero) => [hero.id, { ...fresh.heroProgress[hero.id], ...((stored.heroProgress || {})[hero.id] || {}) }])),
      skillLevels: { ...fresh.skillLevels, ...(stored.skillLevels || {}) },
      shards: Math.max(0, Number(stored.shards) || fresh.shards),
      equippedFrame: stored.equippedFrame || fresh.equippedFrame,
      eventState: { ...fresh.eventState, ...(stored.eventState || {}), progress: { ...fresh.eventState.progress, ...((stored.eventState || {}).progress || {}) } },
      equippedTitle: stored.equippedTitle || fresh.equippedTitle,
      equippedTreasure: stored.equippedTreasure || fresh.equippedTreasure,
      ownedEquipment: {
        weapon: [...new Set([...(fresh.ownedEquipment.weapon || []), ...((stored.ownedEquipment || {}).weapon || [])])],
        armor: [...new Set([...(fresh.ownedEquipment.armor || []), ...((stored.ownedEquipment || {}).armor || [])])],
        mount: [...new Set([...(fresh.ownedEquipment.mount || []), ...((stored.ownedEquipment || {}).mount || [])])],
        accessory: [...new Set([...(fresh.ownedEquipment.accessory || []), ...((stored.ownedEquipment || {}).accessory || [])])]
      },
      heroLevels: { ...fresh.heroLevels, ...(stored.heroLevels || {}) },
      positions: { ...fresh.positions, ...(stored.positions || {}) },
      tactics: { ...fresh.tactics, ...(stored.tactics || {}) },
      equipment: Object.fromEntries(HEROES.map((hero) => {
        const base = fresh.equipment[hero.id] || {};
        const saved = (stored.equipment || {})[hero.id] || {};
        const mount = (saved.mount && saved.mount !== "foot") ? saved.mount : base.mount;
        return [hero.id, { ...base, ...saved, mount }];
      }))
    };
  } catch {
    return fresh;
  }
}

const save = loadSave();
window.TaoyuanAudio?.configure?.({ sound: save.sound, music: save.music });

function refillStamina() {
  if (!save.stamina) save.stamina = { current: 20, max: 20, lastAt: Date.now() };
  const now = Date.now();
  const max = Math.max(1, Number(save.stamina.max) || 20);
  const current = clamp(Number(save.stamina.current) || 0, 0, max);
  const elapsed = Math.max(0, now - (Number(save.stamina.lastAt) || now));
  save.stamina.current = Math.min(max, current + Math.floor(elapsed / (5 * 60 * 1000)));
  save.stamina.max = max;
  save.stamina.lastAt = save.stamina.current >= max ? now : now - (elapsed % (5 * 60 * 1000));
  return save.stamina;
}

function staminaStatus() {
  return refillStamina();
}

function spendStamina(amount) {
  const stamina = refillStamina();
  const cost = Math.max(0, Number(amount) || 0);
  if (stamina.current < cost) return false;
  stamina.current -= cost;
  stamina.lastAt = Date.now();
  return true;
}

function factionOfHero(heroId) {
  for (const [factionId, heroIds] of Object.entries(FACTION_BY_HERO)) {
    if (heroIds.includes(heroId)) return factionId;
  }
  return "qun";
}

function activeBonds() {
  const ids = new Set(save.formation || []);
  return BONDS.filter((bond) => bond.heroes.every((heroId) => ids.has(heroId)));
}

function treasureById(id) {
  return TREASURES.find((treasure) => treasure.id === id) || null;
}

function titleById(id) {
  return TITLES.find((title) => title.id === id) || TITLES[0] || null;
}

function avatarFrameById(id) {
  return AVATAR_FRAMES.find((frame) => frame.id === id) || null;
}

function avatarFrameUnlocked(frame) {
  return Boolean(frame) && save.maxStage > (Number(frame.unlockStage) || 0);
}

function heroProgression(heroId) {
  ensureCycleState();
  return save.heroProgress[heroId] || (save.heroProgress[heroId] = { stars: 1, breakthrough: 0, shards: 0 });
}

function heroGrowthMultiplier(heroId) {
  const progress = heroProgression(heroId);
  return 1 + Math.max(0, Number(progress.stars || 1) - 1) * 0.06 + Math.max(0, Number(progress.breakthrough || 0)) * 0.09;
}

function heroStarCost(heroId) {
  const progress = heroProgression(heroId);
  if (progress.stars >= 5) return null;
  return { shards: 8 + progress.stars * 4, gold: 180 + progress.stars * 80 };
}

function heroSkillLevel(heroId) {
  ensureCycleState();
  return Math.max(1, Math.min(5, Number(save.skillLevels?.[heroId]) || 1));
}

function heroSkillCost(heroId) {
  const level = heroSkillLevel(heroId);
  if (level >= 5) return null;
  return { gold: 140 + level * 100, food: 70 + level * 45 };
}

function heroBreakthroughCost(heroId) {
  const progress = heroProgression(heroId);
  if (progress.breakthrough >= 3 || progress.stars < 3) return null;
  return { shards: 10 + progress.breakthrough * 6, jade: 2 + progress.breakthrough * 2 };
}

function localEventPeriod(event, time = Date.now()) {
  return event?.period === "day" ? localDateKey(time) : localWeekKey(time);
}

function eventProgress(eventId) {
  ensureCycleState();
  return Math.max(0, Number(save.eventState.progress[eventId]) || 0);
}

function recordEventProgress(kind, amount = 1) {
  ensureCycleState();
  for (const event of LOCAL_EVENTS) {
    if (event.kind !== kind || save.eventState.claimed.includes(event.id)) continue;
    save.eventState.progress[event.id] = Math.min(event.target, eventProgress(event.id) + amount);
  }
}

function ensureCycleState() {
  const today = localDateKey();
  const week = localWeekKey();
  const month = localMonthKey();
  if (!save.daily || save.daily.date !== today) save.daily = createDailyState();
  if (!save.weekly || save.weekly.week !== week) save.weekly = createWeeklyState();
  if (!save.checkin || save.checkin.month !== month) save.checkin = createCheckinState();
  if (!save.arena || save.arena.week !== week) save.arena = { wins: 0, attempts: 0, claimed: [], week };
  refillStamina();
  if (!save.dungeons || save.dungeons.date !== today) save.dungeons = { date: today, claimed: {} };
  if (!save.tower) save.tower = { floor: 0, best: 0 };
  if (!save.ownedEquipment) save.ownedEquipment = createOwnedEquipment();
  if (!save.equipmentRefine) save.equipmentRefine = Object.fromEntries(HEROES.map((hero) => [hero.id, 0]));
  if (!save.equippedTitle || !titleById(save.equippedTitle)) save.equippedTitle = TITLES[0]?.id || "";
  if (!save.equippedTreasure || !treasureById(save.equippedTreasure)) save.equippedTreasure = TREASURES[0]?.id || "";
  if (!save.equippedFrame || !avatarFrameById(save.equippedFrame)) save.equippedFrame = AVATAR_FRAMES[0]?.id || "";
  if (!save.collectionMilestones) save.collectionMilestones = {};
  if (!save.heroProgress) save.heroProgress = Object.fromEntries(HEROES.map((hero) => [hero.id, { stars: 1, breakthrough: 0, shards: 0 }]));
  if (!save.skillLevels) save.skillLevels = Object.fromEntries(HEROES.map((hero) => [hero.id, 1]));
  if (!save.troopMastery) save.troopMastery = { "步兵": 0, "騎兵": 0, "弓兵": 0, "謀士": 0 };
  for (const hero of HEROES) {
    save.heroProgress[hero.id] = { stars: 1, breakthrough: 0, shards: 0, ...(save.heroProgress[hero.id] || {}) };
    save.skillLevels[hero.id] = Math.max(1, Math.min(5, Number(save.skillLevels?.[hero.id]) || 1));
  }
  const eventPeriod = localWeekKey();
  if (!save.eventState || save.eventState.period !== eventPeriod) save.eventState = { period: eventPeriod, progress: Object.fromEntries(LOCAL_EVENTS.map((event) => [event.id, 0])), claimed: [] };
  save.eventState.progress = { ...Object.fromEntries(LOCAL_EVENTS.map((event) => [event.id, 0])), ...(save.eventState.progress || {}) };
  save.daily.progress = { ...Object.fromEntries(DAILY_TASKS.map((task) => [task.id, 0])), ...(save.daily.progress || {}) };
  save.weekly.progress = { ...Object.fromEntries(WEEKLY_TASKS.map((task) => [task.id, 0])), ...(save.weekly.progress || {}) };
}

function recordTaskProgress(taskId, amount = 1) {
  ensureCycleState();
  if (save.daily.progress[taskId] !== undefined) save.daily.progress[taskId] += amount;
  if (save.weekly.progress[taskId] !== undefined) save.weekly.progress[taskId] += amount;
}

function recordStat(stat, amount = 1) {
  save.stats[stat] = (save.stats[stat] || 0) + amount;
  if (stat === "wins") recordEventProgress("wins", amount);
}

function awardResources(reward = {}) {
  for (const key of ["gold", "food", "jade", "shards"]) {
    if (reward[key]) save[key] = (save[key] || 0) + reward[key];
  }
  if (reward.exp) {
    if (typeof gainExp === "function") gainExp(reward.exp);
    else save.exp = (save.exp || 0) + reward.exp;
  }
}

function scheduleGameTimer(callback, delay) {
  const timer = setTimeout(() => {
    runtime.timers.delete(timer);
    try {
      callback();
    } catch (error) {
      console.error("Scheduled game timer failed", error);
      if (runtime.spawning && !runtime.battleResult) {
        runtime.spawning = false;
      }
    }
  }, delay);
  runtime.timers.add(timer);
  return timer;
}

function clearScheduledGameTimers() {
  for (const timer of runtime.timers) clearTimeout(timer);
  runtime.timers.clear();
}

ensureCycleState();
const runtime = {
  allies: [],
  enemies: [],
  effects: [],
  effectPool: Array.from({ length: EFFECT_POOL_SIZE }, createEffectRecord),
  numbers: [],
  damageStats: {},
  projectiles: [],
  drops: [],
  terrain: [],
  waveClears: 0,
  bossActive: false,
  spawning: false,
  spawnWait: 0,
  auto: true,
  playSpeed: 1,
  timeScale: 1,
  lastTime: performance.now(),
  elapsed: 0,
  shake: 0,
  hitStop: 0,
  flash: 0,
  flashColor: "#fff4cf",
  dialogueTimer: 0,
  combo: 0,
  comboTimer: 0,
  battleResult: null,
  nextStageAfterSettlement: null,
  tutorialFocus: null,
  timers: new Set(),
  panel: null,
  hudCache: Object.create(null),
  hudTimerId: 0,
  persistTimerId: 0,
  rafId: 0,
  loopWatchId: 0,
  loopPulse: 0,
  backgrounded: false,
  heroFilter: "all",
  heroSort: save.heroSort || "power",
  selectedHero: null,
  formationPick: null,
  mode: "campaign",
  towerFloor: 0,
  pendingOffline: null,
  activeStage: save.stage,
  log: ["義軍於涿郡整軍出發。"],
  audio: null,
  ambientTimerId: 0,
  renderDelta: 1 / 60,
  enemyPreviewTimer: 0,
  waveTransition: null,
  entryUnits: false
};

function takeEffectRecord() {
  return runtime.effectPool.pop() || createEffectRecord();
}

function releaseEffectRecord(effect) {
  effect.type = "";
  effect.x = 0;
  effect.y = 0;
  effect.color = "#fff";
  effect.life = 0;
  effect.maxLife = 0;
  effect.radius = 0;
  effect.angle = 0;
  effect.scale = 1;
  effect.facing = 1;
  if (runtime.effectPool.length < EFFECT_POOL_SIZE) runtime.effectPool.push(effect);
}

function clearEffects() {
  while (runtime.effects.length) releaseEffectRecord(runtime.effects.pop());
}

function recycleExpiredEffects() {
  for (let index = runtime.effects.length - 1; index >= 0; index -= 1) {
    const effect = runtime.effects[index];
    if (effect.life > 0) continue;
    const last = runtime.effects.pop();
    if (last !== effect) runtime.effects[index] = last;
    releaseEffectRecord(effect);
  }
}

function persist() {
  save.lastSeen = Date.now();
  save.lastUpdatedAt = save.lastSeen;
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  window.TaoyuanCloud?.queueUpload?.(save);
}

function replaceSave(nextSave) {
  if (!nextSave || typeof nextSave !== "object" || Array.isArray(nextSave)) return false;
  const fresh = defaultSave();
  Object.keys(save).forEach((key) => delete save[key]);
  Object.assign(save, fresh, nextSave);
  window.TaoyuanAudio?.configure?.({ sound: save.sound, music: save.music });
  window.dispatchEvent(new CustomEvent("taoyuan-save-replaced"));
  return true;
}

window.TaoyuanGameState = Object.freeze({
  getSave: () => save,
  getSaveKey: () => SAVE_KEY,
  persist,
  replaceSave
});

function enemyGeneralById(id) {
  return (GAME_DATA.enemyGenerals || []).find((general) => general.id === id) || null;
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

function equipmentSynergyTier(heroId) {
  const refineLevel = Number(save.equipmentRefine?.[heroId] || 0);
  if (refineLevel >= 10) return { tier: 3, name: "天下無雙", bonus: 0.18, desc: "全套精煉 +10：全裝備屬性 +18%" };
  if (refineLevel >= 6) return { tier: 2, name: "神兵共鳴", bonus: 0.10, desc: "全套精煉 +6：全裝備屬性 +10%" };
  if (refineLevel >= 3) return { tier: 1, name: "初窺門徑", bonus: 0.05, desc: "全套精煉 +3：全裝備屬性 +5%" };
  return { tier: 0, name: "未共鳴", bonus: 0, desc: "精煉達 +3/+6/+10 啟動全套共鳴加成" };
}

const SIGNATURE_WEAPONS = {
  guanyu: { weaponId: "guandao", name: "真·青龍偃月", desc: "青龍刀魂：對 Boss 傷害額外 +15%，攻擊 +15", stats: { atk: 15 }, bossDmg: 0.15 },
  zhangfei: { weaponId: "serpent", name: "真·丈八蛇矛", desc: "丈八狂蛇：普攻造成重擊震盪，兵力 +60，防禦 +6", stats: { hp: 60, def: 6 }, knockback: 0.25 },
  zhaoyun: { weaponId: "lance", name: "真·龍膽亮銀", desc: "龍膽亮銀：突進攻速提高 18%，速度 +6，攻擊 +10", stats: { speed: 6, atk: 10 }, speedBonus: 0.18 },
  zhugeliang: { weaponId: "fan", name: "真·羽扇綸巾", desc: "臥龍東風：技能冷卻縮短 12%，謀略攻擊 +18", stats: { atk: 18 }, cdReduction: 0.12 },
  lubu: { weaponId: "halberd", name: "真·方天畫戟", desc: "天下無雙：暴擊率提高 15%，攻擊 +20", stats: { atk: 20 }, crit: 0.15 },
  liubei: { weaponId: "twin", name: "真·雌雄雙股", desc: "仁君雙劍：仁德治療效果提升 25%，全隊防禦 +5%", stats: { hp: 45, atk: 8 }, healBonus: 0.25 },
  huangzhong: { weaponId: "bow", name: "真·百步穿楊", desc: "落日神弓：射程 +25，超遠距離暴擊率 +15%", stats: { range: 25, atk: 12 }, crit: 0.15 },
  sunshang: { weaponId: "bow", name: "真·梟姬烈弓", desc: "梟姬赤弓：射程 +20，攻速 +10%，攻擊 +10", stats: { range: 20, atk: 10, speed: 5 }, speedBonus: 0.10 },
  caocao: { weaponId: "twin", name: "真·倚天魏武", desc: "魏武雙雄：全隊技能冷卻縮短 6%，攻擊 +12", stats: { atk: 12 }, teamCd: 0.06 },
  diaochan: { weaponId: "rings", name: "真·閉月雙環", desc: "閉月雙環：技能標記傷害提升至 25%，速度 +6", stats: { atk: 10, speed: 6 }, markDmg: 0.25 }
};

function heroSignatureResonance(heroId) {
  const config = SIGNATURE_WEAPONS[heroId];
  if (!config) return null;
  const equippedWeapon = save.equipment?.[heroId]?.weapon;
  const active = equippedWeapon === config.weaponId;
  return { ...config, active, equippedWeapon };
}

function heroEquipmentStats(heroId) {
  const stats = PAPER_DOLL_SLOTS.reduce((result, slot) => {
    const item = paperDollItem(heroId, slot.id);
    for (const [key, value] of Object.entries(item?.stats || {})) result[key] = (result[key] || 0) + value;
    return result;
  }, { atk: 0, hp: 0, def: 0, speed: 0, range: 0 });
  const refineLevel = Number(save.equipmentRefine?.[heroId] || 0);
  const synergy = equipmentSynergyTier(heroId);
  const totalMultiplier = (1 + refineLevel * 0.08) * (1 + synergy.bonus);
  if (refineLevel > 0 || synergy.bonus > 0) {
    for (const key of Object.keys(stats)) stats[key] = Math.round(stats[key] * totalMultiplier);
  }
  const signature = heroSignatureResonance(heroId);
  if (signature?.active && signature.stats) {
    for (const [key, value] of Object.entries(signature.stats)) {
      stats[key] = (stats[key] || 0) + value;
    }
  }
  return stats;
}

function equipmentBonusLabel(heroId) {
  const stats = heroEquipmentStats(heroId);
  const synergy = equipmentSynergyTier(heroId);
  const labels = [];
  if (stats.atk) labels.push("武力 +" + stats.atk);
  if (stats.hp) labels.push("兵力 +" + stats.hp);
  if (stats.def) labels.push("統率 +" + stats.def);
  if (stats.speed) labels.push("速度 +" + stats.speed);
  if (stats.range) labels.push("射程 +" + stats.range);
  const baseText = labels.length ? labels.join("　") : "目前沒有額外數值加成";
  return synergy.tier > 0 ? baseText + "　[" + synergy.name + " 共鳴生效]" : baseText;
}

function isUnlocked(hero) {
  return hero.unlock === 0 || save.stage > hero.unlock;
}

function formatNumber(value) {
  const amount = Math.round(Number(value) || 0);
  if (amount >= 1000000) return Math.round(amount / 1000000) + "M";
  return amount.toLocaleString("zh-TW");
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

function startAmbientAudio() {
  window.TaoyuanAudio?.startMusic?.();
}

function beep(frequency = 280, duration = 0.045, type = "square", gain = 0.025) {
  if (!save.sound) return;
  window.TaoyuanAudio?.tone?.(frequency, duration, type, gain, "sfx");
}

