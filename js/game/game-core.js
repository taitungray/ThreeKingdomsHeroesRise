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

