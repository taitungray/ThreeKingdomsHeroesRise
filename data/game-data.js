"use strict";

// Content is kept outside the runtime rules so new heroes, stages and rewards can
// be tuned without changing the canvas or UI code.
const ENEMY_GENERALS = [
  { id: "zhangjiao", name: "\u5f35\u89d2", title: "\u592a\u5e73\u9053\u4e3b", avatar: "avatar-zhugeliang", role: "\u5996\u8853", color: "#8c6a92", accent: "#e3c36b" },
  { id: "dongzhuo", name: "\u8463\u5353", title: "\u897f\u6dbc\u66b4\u541b", avatar: "avatar-lubu", role: "\u66b4\u541b", color: "#7b3b34", accent: "#e0a44e" },
  { id: "lvbu", name: "\u5442\u5e03", title: "\u5929\u4e0b\u7121\u96d9", avatar: "avatar-lubu", role: "\u98db\u5c07", color: "#9c2d31", accent: "#f0c65e" },
  { id: "yuanshao", name: "\u8881\u7d39", title: "\u6cb3\u5317\u76df\u4e3b", avatar: "avatar-caocao", role: "\u8ecd\u7565", color: "#75624f", accent: "#e5c887" },
  { id: "yanliang", name: "\u984f\u826f", title: "\u6cb3\u5317\u731b\u5c07", avatar: "avatar-zhangfei", role: "\u731b\u5c07", color: "#684d48", accent: "#d99355" },
  { id: "wenchou", name: "\u6587\u919c", title: "\u9435\u9a0e\u5148\u92d2", avatar: "avatar-xiahoudun", role: "\u9435\u9a0e", color: "#3e536e", accent: "#d9bd72" },
  { id: "taishici", name: "\u592a\u53f2\u6148", title: "\u6c5f\u6771\u795e\u5c04", avatar: "avatar-huangzhong", role: "\u795e\u5c04", color: "#466b69", accent: "#e4c975" },
  { id: "menghuo", name: "\u5b5f\u7372", title: "\u5357\u4e2d\u883b\u738b", avatar: "avatar-zhangfei", role: "\u883b\u738b", color: "#496956", accent: "#d89a54" },
  { id: "zhurong", name: "\u795d\u878d", title: "\u5357\u4e2d\u706b\u795e", avatar: "avatar-diaochan", role: "\u706b\u5203", color: "#a25347", accent: "#f1c263" },
  { id: "simayi", name: "\u53f8\u99ac\u61ff", title: "\u51a5\u754c\u8b00\u4e3b", avatar: "avatar-caocao", role: "\u9b3c\u8b00", color: "#42465b", accent: "#b497d8" }
];
const ENEMY_GENERAL_SETS = [
  ["zhangjiao", "yanliang", "taishici"], ["dongzhuo", "wenchou", "yuanshao"], ["yuanshao", "taishici", "simayi"],
  ["lvbu", "zhangjiao", "wenchou"], ["yanliang", "wenchou", "lvbu"], ["menghuo", "zhurong", "lvbu"],
  ["dongzhuo", "yuanshao", "zhangjiao"], ["taishici", "zhangjiao", "huangzhong"], ["wenchou", "lvbu", "dongzhuo"],
  ["zhurong", "menghuo", "taishici"]
];
const BOSS_GENERAL_IDS = ["zhangjiao", "dongzhuo", "lvbu", "yuanshao", "menghuo", "zhurong", "simayi"];
const STAGE_NAME_PREFIXES = [
  "\u6843\u5712\u521d\u9663", "\u9ec3\u5dfe\u4f0f\u5175", "\u6c5c\u6c34\u95dc\u524d", "\u864e\u7262\u93d6\u6230", "\u5f90\u5dde\u5b88\u57ce", "\u5b98\u6e21\u70fd\u7159", "\u9577\u5742\u7a81\u570d", "\u8d64\u58c1\u706b\u8a08", "\u834a\u5dde\u591c\u8972", "\u6f22\u4e2d\u722d\u92d2",
  "\u5937\u9675\u9918\u71fc", "\u897f\u5ddd\u5165\u8700", "\u528d\u95a3\u5929\u96aa", "\u5408\u80a5\u6025\u8972", "\u6fc1\u9808\u6c34\u5be8", "\u5b9a\u8ecd\u5c71\u53e3", "\u4e94\u4e08\u539f\u98a8", "\u5317\u4f10\u5148\u92d2", "\u8857\u4ead\u98a8\u96f2", "\u6d1b\u967d\u6c7a\u6230"
];
window.THREE_KINGDOMS_DATA = {
  enemyGenerals: ENEMY_GENERALS,
  heroes: [
    { id: "liubei", name: "劉備", title: "仁德昭烈", avatar: "avatar-liubei", portrait: "assets/characters/portrait-liubei-v1.webp", combatSprite: "assets/characters/combat-body-liubei-v1.webp", role: "步兵", color: "#e7e1c7", accent: "#4c9558", atk: 23, hp: 230, def: 12, speed: 24, range: 31, skill: "仁德回春", skillCooldown: 6, unlock: 0, rarity: 4, passive: "友軍受到治療時額外回復 4% 最大兵力" },
    { id: "guanyu", name: "關羽", title: "武聖雲長", avatar: "avatar-guanyu", portrait: "assets/characters/portrait-guanyu-v1.webp", combatSprite: "assets/characters/combat-body-guanyu-v1.webp", role: "騎兵", color: "#2b855b", accent: "#b6372c", atk: 34, hp: 265, def: 14, speed: 29, range: 35, skill: "青龍偃月", skillCooldown: 5.2, unlock: 0, rarity: 5, passive: "對 Boss 傷害提高 12%" },
    { id: "zhangfei", name: "張飛", title: "萬夫莫敵", avatar: "avatar-zhangfei", portrait: "assets/characters/portrait-zhangfei-v1.webp", combatSprite: "assets/characters/combat-body-zhangfei-v1.webp", role: "步兵", color: "#5f6770", accent: "#b54832", atk: 30, hp: 310, def: 18, speed: 22, range: 33, skill: "燕人怒吼", skillCooldown: 5.6, unlock: 0, rarity: 5, passive: "受到致命傷害時保留 1 兵力，每場一次" },
    { id: "zhaoyun", name: "趙雲", title: "常勝子龍", avatar: "avatar-zhaoyun", portrait: "assets/characters/portrait-zhaoyun-v1.webp", combatSprite: "assets/characters/combat-body-zhaoyun-v1.webp", role: "騎兵", color: "#4e82ba", accent: "#d8e5e7", atk: 31, hp: 238, def: 13, speed: 33, range: 37, skill: "七進七出", skillCooldown: 4.8, unlock: 0, rarity: 5, passive: "移動中攻擊速度提高 8%" },
    { id: "huangzhong", name: "黃忠", title: "老當益壯", avatar: "avatar-huangzhong", portrait: "assets/characters/portrait-huangzhong-v1.webp", combatSprite: "assets/characters/combat-body-huangzhong-v1.webp", role: "弓兵", color: "#8e7138", accent: "#d8bd62", atk: 35, hp: 190, def: 9, speed: 21, range: 142, skill: "百步穿楊", skillCooldown: 5.4, unlock: 2, rarity: 4, passive: "距離越遠，暴擊率最高提高 12%" },
    { id: "sunshang", name: "孫尚香", title: "弓腰姬", avatar: "avatar-sunshang", portrait: "assets/characters/portrait-sunshang-v1.webp", combatSprite: "assets/characters/combat-body-sunshang-v1.webp", role: "弓兵", color: "#d05b72", accent: "#f0bd60", atk: 33, hp: 185, def: 9, speed: 24, range: 138, skill: "流星連射", skillCooldown: 5, unlock: 3, rarity: 4, passive: "攻擊命中後有機率追加一支箭" },
    { id: "caocao", name: "曹操", title: "魏武霸業", avatar: "avatar-caocao", portrait: "assets/characters/portrait-caocao-v1.webp", combatSprite: "assets/characters/combat-body-caocao-v1.webp", role: "謀士", color: "#4a4b6c", accent: "#8d55ad", atk: 38, hp: 205, def: 10, speed: 22, range: 126, skill: "奸雄號令", skillCooldown: 6.2, unlock: 4, rarity: 5, passive: "全隊技能冷卻縮短 4%" },
    { id: "xiahoudun", name: "夏侯惇", title: "獨目虎將", avatar: "avatar-xiahoudun", portrait: "assets/characters/portrait-xiahoudun-v1.webp", combatSprite: "assets/characters/combat-body-xiahoudun-v1.webp", role: "騎兵", color: "#315988", accent: "#aeb8c7", atk: 36, hp: 280, def: 16, speed: 30, range: 35, skill: "拔矢啖睛", skillCooldown: 5.8, unlock: 5, rarity: 4, passive: "生命低於 40% 時防禦提高 20%" },
    { id: "zhugeliang", name: "諸葛亮", title: "臥龍先生", avatar: "avatar-zhugeliang", portrait: "assets/characters/portrait-zhugeliang-v1.webp", combatSprite: "assets/characters/combat-body-zhugeliang-v1.webp", role: "謀士", color: "#81a69d", accent: "#e6e0ce", atk: 42, hp: 195, def: 8, speed: 20, range: 154, skill: "八陣奇門", skillCooldown: 6.8, unlock: 6, rarity: 5, passive: "技能命中時使敵人攻速降低 10%" },
    { id: "diaochan", name: "貂蟬", title: "閉月之姿", avatar: "avatar-diaochan", portrait: "assets/characters/portrait-diaochan-v1.webp", combatSprite: "assets/characters/combat-body-diaochan-v1.webp", role: "謀士", color: "#9b5fba", accent: "#e875ac", atk: 39, hp: 178, def: 8, speed: 25, range: 148, skill: "傾城離間", skillCooldown: 5.9, unlock: 7, rarity: 5, passive: "對被技能標記的敵人傷害提高 15%" },
    { id: "lubu", name: "呂布", title: "天下無雙", avatar: "avatar-lubu", portrait: "assets/characters/portrait-lubu-v1.webp", combatSprite: "assets/characters/combat-body-lubu-v1.webp", role: "騎兵", color: "#9c2d31", accent: "#e1b34d", atk: 54, hp: 330, def: 17, speed: 35, range: 42, skill: "方天亂舞", skillCooldown: 7.2, unlock: 9, rarity: 5, passive: "單獨對 Boss 時攻擊提高 18%" },
    { id: "locked", name: "未識名將", title: "尚待結識", avatar: "avatar-locked", portrait: "assets/characters/portrait-locked-v1.webp", combatSprite: "assets/characters/combat-body-locked-v1.webp", role: "未知", color: "#555", accent: "#777", atk: 1, hp: 1, def: 1, speed: 1, range: 1, skill: "未知戰法", skillCooldown: 8, unlock: 12, rarity: 5, passive: "尚未解鎖" }
  ],
  paperDollSlots: [
    { id: "weapon", label: "武器", choices: [
      { id: "twin", name: "雙股劍", bonus: "攻擊 +5", stats: { atk: 5 }, className: "paper-weapon-twin" },
      { id: "guandao", name: "青龍偃月刀", bonus: "攻擊 +8", stats: { atk: 8 }, className: "paper-weapon-guandao" },
      { id: "serpent", name: "丈八蛇矛", bonus: "攻擊 +7", stats: { atk: 7 }, className: "paper-weapon-serpent" },
      { id: "lance", name: "龍膽槍", bonus: "速度 +4", stats: { speed: 4 }, className: "paper-weapon-lance" },
      { id: "bow", name: "穿雲弓", bonus: "射程 +18", stats: { range: 18 }, className: "paper-weapon-bow" },
      { id: "fan", name: "羽扇", bonus: "攻擊 +8", stats: { atk: 8 }, className: "paper-weapon-fan" },
      { id: "rings", name: "月刃環", bonus: "攻擊 +4", stats: { atk: 4 }, className: "paper-weapon-rings" },
      { id: "halberd", name: "方天畫戟", bonus: "攻擊 +12", stats: { atk: 12 }, className: "paper-weapon-halberd" }
    ]},
    { id: "armor", label: "護甲", choices: [
      { id: "oath", name: "桃園戰袍", bonus: "生命 +38", stats: { hp: 38 }, className: "paper-armor-oath" },
      { id: "iron", name: "玄鐵鎧", bonus: "防禦 +5", stats: { def: 5 }, className: "paper-armor-iron" },
      { id: "silk", name: "青絲道袍", bonus: "速度 +3", stats: { speed: 3 }, className: "paper-armor-silk" },
      { id: "crimson", name: "赤焰戰甲", bonus: "攻擊 +2", stats: { atk: 2 }, className: "paper-armor-crimson" }
    ]},
    { id: "mount", label: "坐騎", choices: [
      { id: "foot", name: "步戰", bonus: "無額外加成", stats: {}, className: "paper-mount-foot" },
      { id: "grey", name: "灰影馬", bonus: "速度 +3", stats: { speed: 3 }, className: "paper-mount-grey" },
      { id: "redhare", name: "赤兔馬", bonus: "速度 +8", stats: { speed: 8 }, className: "paper-mount-redhare" },
      { id: "jadelion", name: "玉獅子", bonus: "生命 +28", stats: { hp: 28 }, className: "paper-mount-jadelion" }
    ]},
    { id: "accessory", label: "飾品", choices: [
      { id: "jade", name: "青玉佩", bonus: "生命 +10", stats: { hp: 10 }, className: "paper-accessory-jade" },
      { id: "dragon", name: "龍紋符", bonus: "攻擊 +5", stats: { atk: 5 }, className: "paper-accessory-dragon" },
      { id: "war", name: "戰意佩", bonus: "攻擊 +4", stats: { atk: 4 }, className: "paper-accessory-war" },
      { id: "feather", name: "臥龍羽", bonus: "攻擊 +6", stats: { atk: 6 }, className: "paper-accessory-feather" }
    ]}
  ],
  paperDollDefaults: {
    liubei: { weapon: "twin", armor: "oath", mount: "foot", accessory: "jade" }, guanyu: { weapon: "guandao", armor: "oath", mount: "redhare", accessory: "dragon" }, zhangfei: { weapon: "serpent", armor: "iron", mount: "foot", accessory: "war" }, zhaoyun: { weapon: "lance", armor: "iron", mount: "grey", accessory: "jade" }, huangzhong: { weapon: "bow", armor: "iron", mount: "foot", accessory: "war" }, sunshang: { weapon: "bow", armor: "silk", mount: "grey", accessory: "jade" }, caocao: { weapon: "twin", armor: "silk", mount: "grey", accessory: "dragon" }, xiahoudun: { weapon: "guandao", armor: "iron", mount: "redhare", accessory: "war" }, zhugeliang: { weapon: "fan", armor: "silk", mount: "foot", accessory: "feather" }, diaochan: { weapon: "rings", armor: "silk", mount: "foot", accessory: "jade" }, lubu: { weapon: "halberd", armor: "crimson", mount: "redhare", accessory: "war" }, locked: { weapon: "twin", armor: "oath", mount: "foot", accessory: "jade" }
  },
  tactics: [
    { id: "snake", name: "鋒矢陣", sigil: "鋒", desc: "中排武將攻擊提高，適合快速突破。", base: 0.08, cost: 70 },
    { id: "wall", name: "魚鱗陣", sigil: "盾", desc: "前排武將生命與防禦提高，穩定承傷。", base: 0.1, cost: 80 },
    { id: "wind", name: "疾風令", sigil: "風", desc: "全隊攻速提高，讓技能更快轉好。", base: 0.06, cost: 65 }
  ],
  chapters: [
    { name: "黃巾之亂", stage: "鉅鹿野外", boss: "黃巾渠帥", base: "#697258", path: "#9b8f6a" },
    { name: "桃園結義", stage: "涿郡桃林", boss: "黃巾力士", base: "#6d765d", path: "#a09370" },
    { name: "虎牢雄關", stage: "汜水關前", boss: "華雄", base: "#77705c", path: "#a18e69" },
    { name: "徐州烽火", stage: "下邳古道", boss: "曹軍虎衛", base: "#667066", path: "#968b72" },
    { name: "長坂追兵", stage: "長坂坡", boss: "夏侯追騎", base: "#73705e", path: "#a89a78" },
    { name: "赤壁鏖兵", stage: "烏林江岸", boss: "連環戰船", base: "#566c68", path: "#877f69" },
    { name: "建安風雲", stage: "官渡平原", boss: "袁紹大軍", base: "#6d625c", path: "#a58a6d" },
    { name: "官渡決戰", stage: "烏巢糧道", boss: "顏良文醜", base: "#5f625d", path: "#92765e" },
    { name: "三顧茅廬", stage: "隆中山道", boss: "荊州名士", base: "#617767", path: "#a0a77f" },
    { name: "赤壁前夜", stage: "柴桑水寨", boss: "東吳水軍", base: "#526b73", path: "#7f9da0" },
    { name: "漢中爭鋒", stage: "定軍山口", boss: "夏侯淵軍", base: "#766a58", path: "#a7916e" },
{ name: "五丈原", stage: "祁山夜雨", boss: "司馬懿軍", base: "#4f5963", path: "#89959b" },
    { name: "南郡爭奪", stage: "江陵古渡", boss: "曹仁守軍", base: "#5d6d73", path: "#8ca7a2" },
    { name: "益州入蜀", stage: "葭萌關道", boss: "張魯軍", base: "#68715d", path: "#a0a875" },
    { name: "漢中夜襲", stage: "米倉山谷", boss: "魏延先鋒", base: "#5b6256", path: "#929b72" },
    { name: "夷陵烽火", stage: "猇亭江岸", boss: "陸遜火攻", base: "#765f57", path: "#b18467" },
    { name: "南中平定", stage: "雲南瘴林", boss: "孟獲藤甲", base: "#4d725e", path: "#78a078" },
    { name: "北伐出師", stage: "祁山糧道", boss: "姜維蜀軍", base: "#66758a", path: "#9aa9bc" },
    { name: "洛陽風雲", stage: "皇城夜雨", boss: "司馬昭軍", base: "#6e626f", path: "#a890a9" },
    { name: "天下歸晉", stage: "建業終章", boss: "三國終局", base: "#59636b", path: "#92a7ad" }
  ],
  stages: Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    chapter: Math.floor(index / 5),
    name: STAGE_NAME_PREFIXES[index % STAGE_NAME_PREFIXES.length] + " " + ((index % 5) + 1),
    enemyGenerals: ENEMY_GENERAL_SETS[index % ENEMY_GENERAL_SETS.length],
    bossGeneral: BOSS_GENERAL_IDS[index % BOSS_GENERAL_IDS.length],
    waveCount: 3,
    enemyCount: 4 + Math.min(7, Math.floor(index / 2) + 1),
    enemyPower: 1 + index * 0.08,
    bossHp: 680 + index * 92,
    bossAtk: 27 + index * 2.8,
    goldBonus: 14 + index * 3,
    foodBonus: index % 2 ? 2 : 1,
    enemyPool: index % 3 === 0 ? ["bandit", "archer", "brute"] : index % 3 === 1 ? ["archer", "brute", "cavalry"] : ["bandit", "cavalry", "strategist"]
  }))
};

const EXTRA_HERO_SPECS = [
  { id: "machao", name: "馬超", title: "西涼鐵騎", role: "騎兵", visual: "zhaoyun", unlock: 8, rarity: 5, atk: 45, hp: 250, def: 12, speed: 34, range: 42, skill: "鐵騎突陣", skillCooldown: 5.1, color: "#b6c6d6", accent: "#e5c15b", passive: "首次接近敵人時造成額外衝鋒傷害" },
  { id: "dianwei", name: "典韋", title: "古之惡來", role: "步兵", visual: "zhangfei", unlock: 11, rarity: 5, atk: 39, hp: 360, def: 20, speed: 19, range: 30, skill: "雙戟破陣", skillCooldown: 6.1, color: "#5e554e", accent: "#d19c44", passive: "生命低於 50% 時受到傷害降低 15%" },
  { id: "pangtong", name: "龐統", title: "鳳雛先生", role: "謀士", visual: "zhugeliang", unlock: 14, rarity: 5, atk: 44, hp: 188, def: 8, speed: 21, range: 150, skill: "連環天火", skillCooldown: 6.6, color: "#74605a", accent: "#ef8d4f", passive: "技能對燃燒敵人的傷害提高 18%" },
  { id: "zhouyu", name: "周瑜", title: "江東都督", role: "謀士", visual: "caocao", unlock: 17, rarity: 5, atk: 46, hp: 210, def: 9, speed: 23, range: 144, skill: "赤壁烈焰", skillCooldown: 6.4, color: "#9b4d4d", accent: "#f6a345", passive: "每第三次技能命中額外灼燒敵軍" },
  { id: "lusu", name: "魯肅", title: "安邦定國", role: "謀士", visual: "zhugeliang", unlock: 20, rarity: 4, atk: 31, hp: 260, def: 12, speed: 20, range: 132, skill: "聯盟號令", skillCooldown: 6.9, color: "#5c7f78", accent: "#a9dbb7", passive: "全隊生命上限提高 6%" },
  { id: "luxun", name: "陸遜", title: "火燒連營", role: "謀士", visual: "zhugeliang", unlock: 23, rarity: 5, atk: 48, hp: 190, def: 8, speed: 22, range: 150, skill: "火燒連營", skillCooldown: 6.2, color: "#4b7c6d", accent: "#f29c4e", passive: "敵人越多，技能範圍傷害越高" },
  { id: "xuhuang", name: "徐晃", title: "周亞夫之風", role: "步兵", visual: "liubei", unlock: 26, rarity: 4, atk: 37, hp: 330, def: 18, speed: 21, range: 32, skill: "大斧斷流", skillCooldown: 5.7, color: "#8b704a", accent: "#d7bd70", passive: "對滿血敵人造成額外 10% 傷害" },
  { id: "weiyan", name: "魏延", title: "嗜血狂骨", role: "步兵", visual: "zhangfei", unlock: 29, rarity: 4, atk: 43, hp: 295, def: 14, speed: 25, range: 34, skill: "狂骨連斬", skillCooldown: 5.3, color: "#674e60", accent: "#d25f6d", passive: "擊殺敵人後短暫提高攻速" },
  { id: "ganning", name: "甘寧", title: "錦帆游俠", role: "騎兵", visual: "guanyu", unlock: 32, rarity: 4, atk: 44, hp: 240, def: 11, speed: 38, range: 38, skill: "錦帆夜襲", skillCooldown: 4.9, color: "#3e6e71", accent: "#e4b24e", passive: "對遠程敵人傷害提高 14%" },
  { id: "taishici", name: "太史慈", title: "神亭酬義", role: "弓兵", visual: "huangzhong", unlock: 35, rarity: 5, atk: 47, hp: 220, def: 10, speed: 25, range: 148, skill: "神亭雙射", skillCooldown: 5.5, color: "#8a6342", accent: "#d8dfd0", passive: "連續命中同一目標時暴擊率提高" },
  { id: "zhangliao", name: "張遼", title: "威震逍遙津", role: "騎兵", visual: "guanyu", unlock: 38, rarity: 5, atk: 50, hp: 275, def: 15, speed: 32, range: 40, skill: "威震逍遙", skillCooldown: 5.8, color: "#475f80", accent: "#c8d7e8", passive: "敵軍數量越少，攻擊越高" },
  { id: "zhanghe", name: "張郃", title: "巧變無雙", role: "騎兵", visual: "zhaoyun", unlock: 41, rarity: 4, atk: 42, hp: 260, def: 13, speed: 35, range: 40, skill: "巧變奇襲", skillCooldown: 5.2, color: "#566d91", accent: "#c0a15d", passive: "後排敵人受到額外傷害" },
  { id: "jiangwei", name: "姜維", title: "幼麟承志", role: "謀士", visual: "zhugeliang", unlock: 44, rarity: 5, atk: 49, hp: 235, def: 11, speed: 24, range: 144, skill: "天水麒麟", skillCooldown: 6.5, color: "#6c8f9d", accent: "#e7d67b", passive: "技能命中後回復自身 8% 兵力" },
  { id: "simayi", name: "司馬懿", title: "冢虎深謀", role: "謀士", visual: "caocao", unlock: 47, rarity: 5, atk: 52, hp: 210, def: 10, speed: 21, range: 156, skill: "狼顧鬼謀", skillCooldown: 7.1, color: "#42465b", accent: "#a98bd1", passive: "敵人技能冷卻速度降低 8%" },
  { id: "yuanshao", name: "袁紹", title: "四世三公", role: "步兵", visual: "caocao", unlock: 50, rarity: 4, atk: 40, hp: 340, def: 17, speed: 18, range: 31, skill: "名門號令", skillCooldown: 6, color: "#8b6a5f", accent: "#e1bd75", passive: "上陣三名以上步兵時全隊防禦提高" },
  { id: "gongsunzan", name: "公孫瓚", title: "白馬將軍", role: "騎兵", visual: "zhaoyun", unlock: 53, rarity: 4, atk: 41, hp: 245, def: 11, speed: 39, range: 39, skill: "白馬義從", skillCooldown: 5.1, color: "#d2d8dc", accent: "#6a9ec5", passive: "開戰前 8 秒速度提高 20%" },
  { id: "xunyu", name: "荀彧", title: "王佐之才", role: "謀士", visual: "caocao", unlock: 56, rarity: 5, atk: 37, hp: 230, def: 12, speed: 22, range: 142, skill: "驅虎吞狼", skillCooldown: 6.7, color: "#7f9a88", accent: "#e9dca6", passive: "主公經驗收益提高 10%" },
  { id: "zhenji", name: "甄姬", title: "洛水凌波", role: "謀士", visual: "diaochan", unlock: 59, rarity: 5, atk: 45, hp: 205, def: 9, speed: 26, range: 146, skill: "洛神降臨", skillCooldown: 6.3, color: "#6e83a6", accent: "#bde4ef", passive: "技能命中後使全隊受到傷害降低 6%" },
{ id: "guojia", name: "郭嘉", title: "鬼才遺計", role: "謀士", visual: "caocao", unlock: 61, rarity: 5, atk: 53, hp: 188, def: 8, speed: 24, range: 158, skill: "遺計天妒", skillCooldown: 6.9, color: "#4d5e78", accent: "#c9a9e8", passive: "敵人低於 35% 生命時技能傷害提高 18%" },
  { id: "yujin", name: "于禁", title: "持軍嚴整", role: "步兵", visual: "xiahoudun", unlock: 63, rarity: 4, atk: 44, hp: 360, def: 20, speed: 19, range: 31, skill: "鐵壁軍陣", skillCooldown: 6.2, color: "#516275", accent: "#d7c08a", passive: "前排受到的傷害降低 9%" },
  { id: "lejin", name: "樂進", title: "先登驍果", role: "騎兵", visual: "guanyu", unlock: 65, rarity: 4, atk: 49, hp: 270, def: 14, speed: 34, range: 38, skill: "先登突襲", skillCooldown: 5.2, color: "#5e6981", accent: "#e0ae5f", passive: "開戰前 10 秒攻擊速度提高 12%" },
  { id: "caoren", name: "曹仁", title: "守城磐石", role: "步兵", visual: "zhangfei", unlock: 67, rarity: 5, atk: 42, hp: 390, def: 22, speed: 18, range: 30, skill: "不動之城", skillCooldown: 6.6, color: "#625c58", accent: "#c59b63", passive: "生命低於 50% 時防禦提高 18%" },
  { id: "xiahouyuan", name: "夏侯淵", title: "疾行神射", role: "弓兵", visual: "huangzhong", unlock: 69, rarity: 5, atk: 55, hp: 215, def: 10, speed: 30, range: 158, skill: "神速連射", skillCooldown: 5.1, color: "#806542", accent: "#e1d19a", passive: "遠程攻擊有 14% 機率追加一箭" },
  { id: "guanping", name: "關平", title: "青龍傳人", role: "騎兵", visual: "guanyu", unlock: 71, rarity: 4, atk: 48, hp: 295, def: 15, speed: 31, range: 37, skill: "青龍斬", skillCooldown: 5.5, color: "#3d8068", accent: "#e4c07b", passive: "與關羽同隊時攻擊提高 12%" },
  { id: "guanxing", name: "關興", title: "少武威名", role: "騎兵", visual: "zhaoyun", unlock: 73, rarity: 4, atk: 51, hp: 255, def: 13, speed: 36, range: 40, skill: "破陣追擊", skillCooldown: 5.4, color: "#477e9c", accent: "#e1c46c", passive: "擊敗敵人後立刻獲得 1 層疾行" },
  { id: "zhangbao", name: "張苞", title: "燕人虎嗣", role: "步兵", visual: "zhangfei", unlock: 75, rarity: 4, atk: 50, hp: 350, def: 18, speed: 22, range: 32, skill: "裂地震喝", skillCooldown: 5.8, color: "#6e554f", accent: "#dc8b4e", passive: "受到近戰攻擊時反彈 8% 傷害" },
  { id: "zhangliang", name: "張梁", title: "人公將軍", role: "謀士", visual: "zhugeliang", unlock: 77, rarity: 4, atk: 46, hp: 225, def: 10, speed: 22, range: 145, skill: "黃天咒", skillCooldown: 6.4, color: "#766b55", accent: "#e0c86e", passive: "對滿血敵人造成的傷害提高 15%" },
  { id: "huanggai", name: "黃蓋", title: "苦肉老將", role: "步兵", visual: "liubei", unlock: 79, rarity: 4, atk: 43, hp: 375, def: 19, speed: 18, range: 31, skill: "苦肉火計", skillCooldown: 6.1, color: "#756047", accent: "#d7654b", passive: "每損失 20% 生命，攻擊提高 5%" },
  { id: "handang", name: "韓當", title: "江東宿將", role: "弓兵", visual: "huangzhong", unlock: 81, rarity: 4, atk: 49, hp: 235, def: 11, speed: 24, range: 150, skill: "穿雲箭", skillCooldown: 5.7, color: "#496d7b", accent: "#d6c48d", passive: "對遠程敵人的傷害提高 16%" },
  { id: "chengpu", name: "程普", title: "德謀老臣", role: "步兵", visual: "liubei", unlock: 83, rarity: 4, atk: 41, hp: 370, def: 21, speed: 17, range: 30, skill: "德謀固陣", skillCooldown: 6.3, color: "#687060", accent: "#c5ad77", passive: "全隊最大生命提高 7%" },
  { id: "zhuran", name: "朱然", title: "火攻奇兵", role: "弓兵", visual: "caocao", unlock: 85, rarity: 4, atk: 52, hp: 220, def: 10, speed: 25, range: 154, skill: "火燒夷道", skillCooldown: 5.9, color: "#805647", accent: "#e18b4d", passive: "燃燒效果持續時間延長 2 秒" },
  { id: "panzhang", name: "潘璋", title: "臨敵果決", role: "騎兵", visual: "guanyu", unlock: 87, rarity: 4, atk: 50, hp: 280, def: 14, speed: 33, range: 38, skill: "斷水追魂", skillCooldown: 5.6, color: "#466b76", accent: "#d3bd68", passive: "對 Boss 的暴擊率提高 10%" },
  { id: "madai", name: "馬岱", title: "西涼鐵騎", role: "騎兵", visual: "zhaoyun", unlock: 89, rarity: 5, atk: 54, hp: 270, def: 13, speed: 39, range: 42, skill: "追斬千里", skillCooldown: 5.0, color: "#8395a8", accent: "#e8c36e", passive: "移動速度越高，攻擊最高提高 14%" },
  { id: "fazheng", name: "法正", title: "孝直奇謀", role: "謀士", visual: "zhugeliang", unlock: 91, rarity: 5, atk: 55, hp: 205, def: 9, speed: 22, range: 156, skill: "連環奇謀", skillCooldown: 6.7, color: "#657d84", accent: "#e4d094", passive: "技能命中後使 Boss 防禦降低 10%" },
  { id: "menghuo", name: "孟獲", title: "南蠻王", role: "步兵", visual: "zhangfei", unlock: 93, rarity: 5, atk: 53, hp: 430, def: 20, speed: 17, range: 30, skill: "蠻王震地", skillCooldown: 6.5, color: "#496956", accent: "#d89a54", passive: "受到控制效果時恢復 6% 最大生命" },
  { id: "zhurong", name: "祝融", title: "火神夫人", role: "弓兵", visual: "diaochan", unlock: 95, rarity: 5, atk: 58, hp: 230, def: 10, speed: 27, range: 154, skill: "飛刀焚天", skillCooldown: 5.5, color: "#a25347", accent: "#f1c263", passive: "暴擊時使目標燃燒 4 秒" },
  { id: "daqiao", name: "大喬", title: "國色流音", role: "謀士", visual: "diaochan", unlock: 97, rarity: 5, atk: 50, hp: 240, def: 10, speed: 24, range: 150, skill: "江月清歌", skillCooldown: 6.8, color: "#9a7190", accent: "#e9c9df", passive: "全隊技能冷卻速度提高 8%" },
  { id: "xiaoqiao", name: "小喬", title: "江東芳華", role: "謀士", visual: "diaochan", unlock: 99, rarity: 5, atk: 56, hp: 215, def: 9, speed: 28, range: 152, skill: "天香流火", skillCooldown: 6.0, color: "#a76283", accent: "#f4b6cb", passive: "與大喬同隊時技能傷害提高 16%" }
];

const baseHeroByVisual = (visual) => window.THREE_KINGDOMS_DATA.heroes.find((hero) => hero.id === visual) || window.THREE_KINGDOMS_DATA.heroes[0];
const extraHeroes = EXTRA_HERO_SPECS.map((spec) => {
  const template = baseHeroByVisual(spec.visual);
  return { ...template, ...spec, avatar: template.avatar, portrait: "assets/characters/portrait-" + spec.id + "-v1.webp", portraitKey: spec.id, combatSprite: "assets/characters/combat-body-" + spec.id + "-v1.webp" };
});
const lockedHeroIndex = window.THREE_KINGDOMS_DATA.heroes.findIndex((hero) => hero.id === "locked");
window.THREE_KINGDOMS_DATA.heroes.splice(lockedHeroIndex < 0 ? window.THREE_KINGDOMS_DATA.heroes.length : lockedHeroIndex, 0, ...extraHeroes);

const EXTRA_EQUIPMENT = {
  weapon: [
    { id: "fang", name: "虎魄刀", bonus: "攻擊 +10", stats: { atk: 10 }, className: "paper-weapon-fang" },
    { id: "crescent", name: "冷月鉤鐮", bonus: "攻擊 +11", stats: { atk: 11 }, className: "paper-weapon-crescent" },
    { id: "meteor", name: "流星錘", bonus: "生命 +24", stats: { hp: 24 }, className: "paper-weapon-meteor" },
    { id: "firebow", name: "燎原弓", bonus: "射程 +24", stats: { range: 24 }, className: "paper-weapon-firebow" },
    { id: "ironfan", name: "鐵羽扇", bonus: "防禦 +7", stats: { def: 7 }, className: "paper-weapon-ironfan" },
    { id: "tassel", name: "虎頭金槍", bonus: "速度 +6", stats: { speed: 6 }, className: "paper-weapon-tassel" },
    { id: "dragon-spear", name: "七探蛇盤槍", bonus: "攻擊 +13", stats: { atk: 13 }, className: "paper-weapon-dragon-spear" },
{ id: "jade-fan", name: "碧玉羽扇", bonus: "攻擊 +9", stats: { atk: 9 }, className: "paper-weapon-jade-fan" },
    { id: "frost-blade", name: "霜華劍", bonus: "攻擊 +14", stats: { atk: 14 }, className: "paper-weapon-frost-blade" },
    { id: "meteor-hammer", name: "流星錘", bonus: "生命 +38", stats: { hp: 38 }, className: "paper-weapon-meteor-hammer" },
    { id: "phoenix-fan", name: "鳳羽扇", bonus: "攻擊 +12", stats: { atk: 12 }, className: "paper-weapon-phoenix-fan" },
    { id: "chain-sickle", name: "鎖魂鐮", bonus: "速度 +8", stats: { speed: 8 }, className: "paper-weapon-chain-sickle" },
    { id: "skybow", name: "落日神弓", bonus: "射程 +30", stats: { range: 30 }, className: "paper-weapon-skybow" },
    { id: "black-iron", name: "玄鐵重刃", bonus: "防禦 +8", stats: { def: 8 }, className: "paper-weapon-black-iron" },
    { id: "imperial-sword", name: "天子劍", bonus: "攻擊 +15", stats: { atk: 15 }, className: "paper-weapon-imperial-sword" },
    { id: "qilin-staff", name: "麒麟杖", bonus: "攻擊 +11", stats: { atk: 11 }, className: "paper-weapon-qilin-staff" }
  ],
  armor: [
    { id: "mountain", name: "山文甲", bonus: "生命 +72", stats: { hp: 72 }, className: "paper-armor-mountain" },
    { id: "silver", name: "白銀獅子鎧", bonus: "防禦 +9", stats: { def: 9 }, className: "paper-armor-silver" },
    { id: "flame", name: "火鳳戰衣", bonus: "攻擊 +6", stats: { atk: 6 }, className: "paper-armor-flame" },
{ id: "scholar", name: "星紋長袍", bonus: "技能冷卻 -4%", stats: { speed: 5 }, className: "paper-armor-scholar" },
    { id: "azure-mail", name: "青龍鎧", bonus: "生命 +90", stats: { hp: 90 }, className: "paper-armor-azure-mail" },
    { id: "cloud-robe", name: "雲紋法袍", bonus: "速度 +7", stats: { speed: 7 }, className: "paper-armor-cloud-robe" },
    { id: "tiger-plate", name: "虎嘯重甲", bonus: "防禦 +11", stats: { def: 11 }, className: "paper-armor-tiger-plate" },
    { id: "vermilion-mail", name: "朱雀戰衣", bonus: "攻擊 +8", stats: { atk: 8 }, className: "paper-armor-vermilion-mail" },
    { id: "ghost-cloak", name: "幽影披風", bonus: "速度 +6", stats: { speed: 6 }, className: "paper-armor-ghost-cloak" },
    { id: "nine-dragon", name: "九龍皇鎧", bonus: "生命 +110", stats: { hp: 110 }, className: "paper-armor-nine-dragon" }
  ],
  mount: [
    { id: "whitehorse", name: "白馬", bonus: "速度 +5", stats: { speed: 5 }, className: "paper-mount-whitehorse" },
    { id: "blackhorse", name: "烏騅馬", bonus: "生命 +45", stats: { hp: 45 }, className: "paper-mount-blackhorse" },
    { id: "war-elephant", name: "戰象", bonus: "防禦 +8", stats: { def: 8 }, className: "paper-mount-war-elephant" },
{ id: "cloud-deer", name: "雲鹿", bonus: "射程 +14", stats: { range: 14 }, className: "paper-mount-cloud-deer" },
    { id: "hex-mark", name: "爪黃飛電", bonus: "速度 +10", stats: { speed: 10 }, className: "paper-mount-hex-mark" },
    { id: "thunder-horse", name: "雷霆戰馬", bonus: "速度 +12", stats: { speed: 12 }, className: "paper-mount-thunder-horse" },
    { id: "armored-rhino", name: "鐵甲兕", bonus: "生命 +70、防禦 +5", stats: { hp: 70, def: 5 }, className: "paper-mount-armored-rhino" },
    { id: "crimson-deer", name: "赤焰鹿", bonus: "生命 +50", stats: { hp: 50 }, className: "paper-mount-crimson-deer" },
    { id: "flying-horse", name: "天外飛駒", bonus: "射程 +20", stats: { range: 20 }, className: "paper-mount-flying-horse" },
    { id: "black-panther", name: "玄影豹", bonus: "速度 +9", stats: { speed: 9 }, className: "paper-mount-black-panther" }
  ],
  accessory: [
    { id: "phoenix", name: "鳳凰玉簪", bonus: "攻擊 +8", stats: { atk: 8 }, className: "paper-accessory-phoenix" },
    { id: "tiger-seal", name: "虎符", bonus: "生命 +35", stats: { hp: 35 }, className: "paper-accessory-tiger-seal" },
    { id: "star-map", name: "星河圖", bonus: "射程 +12", stats: { range: 12 }, className: "paper-accessory-star-map" },
{ id: "war-drum", name: "戰鼓令", bonus: "速度 +7", stats: { speed: 7 }, className: "paper-accessory-war-drum" },
    { id: "phoenix-jade", name: "鳳凰玉佩", bonus: "攻擊 +10", stats: { atk: 10 }, className: "paper-accessory-phoenix-jade" },
    { id: "strategist-seal", name: "軍師印", bonus: "射程 +18", stats: { range: 18 }, className: "paper-accessory-strategist-seal" },
    { id: "jade-pearl", name: "定魂珠", bonus: "生命 +50", stats: { hp: 50 }, className: "paper-accessory-jade-pearl" },
    { id: "tiger-charm", name: "虎符", bonus: "防禦 +6", stats: { def: 6 }, className: "paper-accessory-tiger-charm" },
    { id: "golden-feather", name: "金翎", bonus: "速度 +9", stats: { speed: 9 }, className: "paper-accessory-golden-feather" },
    { id: "imperial-edict", name: "天子詔", bonus: "攻擊 +7、生命 +20", stats: { atk: 7, hp: 20 }, className: "paper-accessory-imperial-edict" }
  ]
};window.THREE_KINGDOMS_DATA.mountVisuals = {
  foot: { species: "foot", tier: 0 },
  grey: { species: "horse", tier: 1, body: "#aaa99e", light: "#d1c8b8", mane: "#5a5148", hoof: "#28241e", armor: "#6a744f", vfx: "dust" },
  redhare: { species: "horse", tier: 3, body: "#6f342d", light: "#c15a42", mane: "#301c22", hoof: "#211b1b", armor: "#d8ae45", ornament: "#f0d47a", vfx: "ember" },
  jadelion: { species: "horse", tier: 3, body: "#d9d9ce", light: "#f1eee1", mane: "#8d9a92", hoof: "#4b4b45", armor: "#82a9a2", ornament: "#dff4dd", vfx: "snow" },
  whitehorse: { species: "horse", tier: 1, body: "#c9d0d0", light: "#eef0df", mane: "#8da1a5", hoof: "#3f4748", armor: "#738e9a", vfx: "dust" },
  blackhorse: { species: "horse", tier: 2, body: "#34383d", light: "#676d75", mane: "#151820", hoof: "#121318", armor: "#555f75", vfx: "shadow" },
  "war-elephant": { species: "elephant", tier: 3, body: "#4e5d56", light: "#8aa08d", mane: "#26352f", hoof: "#202923", armor: "#a68a58", ornament: "#e4c87b", vfx: "leaf" },
  "cloud-deer": { species: "deer", tier: 3, body: "#8e9f9e", light: "#c9e1d2", mane: "#e7f3e5", hoof: "#3b4a48", armor: "#789ca1", ornament: "#dff6ef", vfx: "mist" },
  "hex-mark": { species: "horse", tier: 2, body: "#b9b6a7", light: "#f0e7c5", mane: "#665a4d", hoof: "#3c302a", armor: "#b98542", ornament: "#f1d481", vfx: "dust" },
  "thunder-horse": { species: "horse", tier: 4, body: "#384d62", light: "#8db6d2", mane: "#18283d", hoof: "#172232", armor: "#527ba6", ornament: "#d9f4ff", vfx: "lightning" },
  "armored-rhino": { species: "rhino", tier: 4, body: "#59636b", light: "#aab6b4", mane: "#2e363a", hoof: "#20272b", armor: "#a07d57", ornament: "#e0bd76", vfx: "dust" },
  "crimson-deer": { species: "deer", tier: 2, body: "#874844", light: "#cc7d60", mane: "#4e2528", hoof: "#2b1d22", armor: "#9c5744", ornament: "#f0b56b", vfx: "ember" },
  "flying-horse": { species: "horse", tier: 4, body: "#7a91ae", light: "#dceaf4", mane: "#e9f5ff", hoof: "#35475d", armor: "#7894bc", ornament: "#f7fcff", vfx: "mist" },
  "black-panther": { species: "panther", tier: 4, body: "#252b39", light: "#59637d", mane: "#141622", hoof: "#171722", armor: "#4f5d8a", ornament: "#c7d2ff", vfx: "shadow" }
};
for (const slot of window.THREE_KINGDOMS_DATA.paperDollSlots) slot.choices.push(...(EXTRA_EQUIPMENT[slot.id] || []));
for (const [index, hero] of window.THREE_KINGDOMS_DATA.heroes.entries()) {
  if (!window.THREE_KINGDOMS_DATA.paperDollDefaults[hero.id]) {
    window.THREE_KINGDOMS_DATA.paperDollDefaults[hero.id] = {
      weapon: index % 2 ? "fang" : "twin",
      armor: index % 3 ? "silver" : "mountain",
      mount: index % 2 ? "whitehorse" : "blackhorse",
      accessory: index % 2 ? "war-drum" : "tiger-seal"
    };
  }
}


// Release-ready content contracts: combat, retention and platform fallbacks stay data-driven.
window.THREE_KINGDOMS_DATA.skillSpecs = {
  liubei: { tone: "heal", label: "\u4ec1\u5fb7\u56de\u5929", color: "#7be0a5" },
  guanyu: { tone: "slash", label: "\u9752\u9f8d\u65a9", color: "#d7b84f" },
  zhangfei: { tone: "stun", label: "\u9739\u9742\u6012\u5596", color: "#e9c05c" },
  zhaoyun: { tone: "dash", label: "\u9f8d\u9a30\u7a81\u9673", color: "#75bceb" },
  huangzhong: { tone: "sniper", label: "\u9ec3\u5fe0\u795e\u7bad", color: "#e7cb73" },
  sunshang: { tone: "volley", label: "\u68a8\u82b1\u7bad\u96e8", color: "#ef8ca2" },
  caocao: { tone: "rally", label: "\u9b4f\u6b66\u53f0", color: "#a98bd1" },
  xiahoudun: { tone: "guard", label: "\u7368\u773c\u9435\u885b", color: "#8db5d2" },
  zhugeliang: { tone: "thunder", label: "\u4e94\u96f7\u8fce\u5929", color: "#8ee4cf" },
  diaochan: { tone: "charm", label: "\u9589\u6708\u82b1\u843d", color: "#e875ac" },
  lubu: { tone: "meteor", label: "\u5929\u4e0b\u7121\u96d9", color: "#f06a4d" },
  locked: { tone: "locked", label: "\u672a\u77e5\u6230\u6cd5", color: "#777" }
};
window.THREE_KINGDOMS_DATA.tutorialSteps = [
  { id: "welcome", title: "\u6843\u5712\u96c6\u7d50", body: "\u4e09\u570b\u4e4b\u4e16\u98a8\u96f2\u518d\u8d77\uff0c\u8acb\u4e3b\u516c\u5e36\u9818\u4f17\u5c07\u91cd\u5efa\u6f22\u5ba4\u3002", action: "\u958b\u59cb\u5f81\u6230" },
  { id: "battle", title: "\u81ea\u52d5\u5f81\u6230", body: "\u5c07\u9810\u8a2d\u9663\u5bb9\u5e36\u5165\u6230\u5834\uff0c\u9ede\u64ca\u6230\u5834\u5373\u53ef\u5f9e\u7b2c\u4e00\u6ce2\u958b\u59cb\u7d2f\u7a4d\u6230\u529b\u3002", action: "\u77e5\u9053\u4e86" },
  { id: "skill", title: "\u6280\u80fd\u8207\u88ab\u52d5", body: "\u540d\u5c07\u6bcf\u5165\u6230 5 \u6b21\u653b\u64ca\u5f8c\u53ef\u91cb\u653e\u6280\u80fd\uff0c\u9663\u5bb9\u88ab\u52d5\u6703\u6539\u8b8a\u751f\u5b58\u8207\u8f38\u51fa\u3002", action: "\u7e7c\u7e8c" },
  { id: "boss", title: "\u9996\u9818\u6230", body: "\u6e05\u6389 3 \u6ce2\u6575\u8ecd\u5f8c\u8fce\u6230\u9996\u9818\uff0c\u52dd\u5229\u53ef\u63a8\u9032\u95dc\u5361\u4e26\u89e3\u9396\u66f4\u591a\u5c07\u9818\u3002", action: "\u51fa\u767c" }
];
window.THREE_KINGDOMS_DATA.dailyTasks = [
  { id: "daily-battle", name: "日常征戰", desc: "完成 3 波戰鬥", target: 3, reward: { gold: 180, food: 60 } },
  { id: "daily-skill", name: "日常施法", desc: "釋放 2 次技能", target: 2, reward: { jade: 1, food: 35 } },
  { id: "daily-upgrade", name: "日常整軍", desc: "升級 1 次將領", target: 1, reward: { gold: 260 } },
  { id: "daily-claim", name: "日日簽到", desc: "完成今日簽到", target: 1, reward: { food: 100 } },
  { id: "daily-mail", name: "關懷軍報", desc: "領取 1 封系統信件", target: 1, reward: { gold: 120 } },
  { id: "daily-arena", name: "\u6f14\u6b66\u4e00\u5834", desc: "\u5b8c\u6210 1 \u6b21\u6f14\u6b66", target: 1, reward: { jade: 1, food: 80 } },
  { id: "daily-dungeon", name: "\u65e5\u5e38\u526f\u672c", desc: "\u5b8c\u6210 1 \u6b21\u65e5\u5e38\u526f\u672c", target: 1, reward: { gold: 220, food: 100 } }
]
window.THREE_KINGDOMS_DATA.weeklyTasks = [
  { id: "weekly-boss", name: "\u9996\u9818\u8ffd\u8e64", desc: "\u64ca\u6bba 5 \u540d\u9996\u9818", target: 5, reward: { jade: 8, gold: 900 } },
  { id: "weekly-heroes", name: "\u7fa4\u82f1\u805a\u7fa9", desc: "\u89e3\u9396 3 \u540d\u540d\u5c07", target: 3, reward: { jade: 5, food: 500 } }
];
window.THREE_KINGDOMS_DATA.checkinRewards = [
  { gold: 120 }, { food: 180 }, { jade: 2 }, { gold: 260 }, { food: 360 }, { jade: 5 }, { gold: 700, jade: 8 }
];
window.THREE_KINGDOMS_DATA.shopItems = [
  { id: "jade-small", name: "玉璧小袋", desc: "獲得 玉璧 ×12", cost: { gold: 900 }, reward: { jade: 12 }, tone: "common" },
  { id: "war-rations", name: "行軍糧草", desc: "獲得 糧草 ×700", cost: { jade: 2 }, reward: { food: 700 }, tone: "rare" },
  { id: "hero-scroll", name: "名將訓練書", desc: "獲得 180 經驗", cost: { jade: 3 }, reward: { exp: 180 }, tone: "epic" },
  { id: "hero-shards", name: "\u540d\u5c07\u788e\u7247\u5323", desc: "\u7372\u5f97 \u540d\u5c07\u788e\u7247 \u00d718", cost: { jade: 2 }, reward: { shards: 18 }, tone: "epic" },
  { id: "starter-pack", name: "元戰備禮包", desc: "玉璧 ×60 + 金幣 ×1200", cost: { jade: 0 }, reward: { jade: 60, gold: 1200 }, tone: "legend", productId: "sku_starter_pack", requiresNativePurchase: true },
  { id: "monthly-pass", name: "月卡軍令", desc: "每日軍資加碼 30 天", cost: { jade: 0 }, reward: { jade: 20, gold: 900 }, tone: "legend", productId: "sku_monthly_pass", requiresNativePurchase: true },
  { id: "no-ads", name: "永久無廣告", desc: "移除獎勵廣告限制", cost: { jade: 0 }, reward: { adFree: true }, tone: "legend", productId: "sku_no_ads_permanent", requiresNativePurchase: true }
]
window.THREE_KINGDOMS_DATA.arenaOpponents = [
  { id: "ghost-1", name: "\u9ec3\u5dfe\u65b0\u8ecd", power: 1800, reward: { gold: 320, jade: 1 } },
  { id: "ghost-2", name: "\u897f\u6dbc\u9a0e\u5175", power: 2600, reward: { gold: 460, food: 120 } },
  { id: "ghost-3", name: "\u6c34\u8ecd\u90fd\u7763", power: 3400, reward: { gold: 620, jade: 2 } },
  { id: "ghost-4", name: "\u4e94\u6eaa\u86ee\u738b", power: 4300, reward: { food: 380, jade: 3 } }
];
window.THREE_KINGDOMS_DATA.storyBeats = [
  { id: "peach-garden", stage: 1, speaker: "\u5289\u5099", text: "\u4eca\u65e5\u7d50\u7fa9\uff0c\u4ed6\u65e5\u5171\u5b88\u5c71\u6cb3\u3002" },
  { id: "yellow-turban", stage: 4, speaker: "\u95dc\u7fbd", text: "\u9ec3\u5dfe\u96d6\u773e\uff0c\u95dc\u67d0\u4e00\u5200\u53ef\u65b7\u5176\u92d2\u3002" },
  { id: "hulao", stage: 9, speaker: "\u5442\u5e03", text: "\u5929\u4e0b\u82f1\u96c4\uff0c\u53ef\u6709\u4eba\u6562\u8207\u6211\u4e00\u6230\uff1f" },
  { id: "red-cliff", stage: 24, speaker: "\u8af8\u845b\u4eae", text: "\u6c5f\u6f6e\u5df2\u8d77\uff0c\u8acb\u4e3b\u516c\u501f\u98a8\u7834\u6575\u3002" }
];

// Local-first progression contracts. Online services can replace these adapters later without changing combat data.
window.THREE_KINGDOMS_DATA.factionByHero = {
  shu: ["liubei", "guanyu", "zhangfei", "zhaoyun", "huangzhong", "machao", "pangtong", "weiyan", "jiangwei", "guanping", "guanxing", "fazheng"],
  wei: ["caocao", "xiahoudun", "dianwei", "xuhuang", "zhangliao", "zhanghe", "xunyu", "guojia", "yujin", "lejin", "caoren", "xiahouyuan", "yuanshao"],
  wu: ["sunshang", "zhouyu", "lusu", "luxun", "ganning", "taishici", "zhuran", "panzhang", "huanggai", "handang", "chengpu", "daqiao", "xiaoqiao"],
  qun: ["zhugeliang", "diaochan", "lubu", "simayi", "zhangbao", "zhangliang", "menghuo", "zhurong", "madai", "gongsunzan", "zhenji"]
};
window.THREE_KINGDOMS_DATA.factions = {
  shu: { name: "\u8700\u6f22", color: "#4c9558", desc: "\u4ec1\u5fb7\u8207\u7fa9\u52c7\uff0c\u751f\u547d\u8207\u56de\u5fa9\u66f4\u7a69\u5b9a\u3002" },
  wei: { name: "\u66f9\u9b4f", color: "#6f7fa9", desc: "\u8ecd\u7d00\u56b4\u660e\uff0c\u9632\u79a6\u8207\u9996\u9818\u6230\u66f4\u53ef\u9760\u3002" },
  wu: { name: "\u6771\u5433", color: "#4f9a96", desc: "\u6c34\u706b\u5947\u8b00\uff0c\u6280\u80fd\u8207\u9060\u7a0b\u8f38\u51fa\u66f4\u5f37\u3002" },
  qun: { name: "\u7fa4\u96c4", color: "#a16f8d", desc: "\u5404\u8def\u5947\u624d\uff0c\u9023\u64ca\u8207\u66b4\u64ca\u66f4\u9748\u6d3b\u3002" }
};
window.THREE_KINGDOMS_DATA.bonds = [
  { id: "peach-oath", name: "\u6843\u5712\u7d50\u7fa9", heroes: ["liubei", "guanyu", "zhangfei"], kind: "atk", value: 0.08, desc: "\u5289\u95dc\u5f35\u540c\u968a\uff1a\u5168\u968a\u653b\u64ca +8%" },
  { id: "wolong-phoenix", name: "\u81e5\u9f8d\u9cf3\u96db", heroes: ["zhugeliang", "pangtong"], kind: "cooldown", value: 0.05, desc: "\u8af8\u845b\u4eae\u8207\u9f90\u7d71\u540c\u968a\uff1a\u6280\u80fd\u51b7\u537b -5%" },
  { id: "jiangdong-duo", name: "\u6c5f\u6771\u96d9\u59dd", heroes: ["daqiao", "xiaoqiao"], kind: "atk", value: 0.06, desc: "\u5927\u55ac\u8207\u5c0f\u55ac\u540c\u968a\uff1a\u6280\u80fd\u50b7\u5bb3 +6%" },
  { id: "five-tigers", name: "\u4e94\u864e\u9918\u5a01", heroes: ["guanyu", "zhangfei", "zhaoyun", "huangzhong", "machao"], kind: "def", value: 0.06, desc: "\u96c6\u7d50\u4e09\u540d\u4ee5\u4e0a\u4e94\u864e\uff1a\u5168\u968a\u9632\u79a6 +6%" }
];
window.THREE_KINGDOMS_DATA.dailyDungeons = [
  { id: "coin-vault", name: "\u9285\u96c0\u5bf6\u5eab", desc: "\u64ca\u9000\u5b88\u5eab\u8ecd\uff0c\u53d6\u5f97\u5927\u91cf\u9285\u9322\u3002", cost: 3, power: 2200, reward: { gold: 720, exp: 55 } },
  { id: "grain-field", name: "\u8ecd\u7ce7\u5c6f\u7530", desc: "\u5b88\u4f4f\u7ce7\u9053\uff0c\u88dc\u8db3\u884c\u8ecd\u7ce7\u8349\u3002", cost: 3, power: 2700, reward: { food: 620, exp: 55 } },
  { id: "weapon-yard", name: "\u795e\u5175\u8a66\u7149", desc: "\u6311\u6230\u935b\u5175\u5834\uff0c\u53d6\u5f97\u7389\u74a7\u8207\u7d93\u9a57\u3002", cost: 4, power: 3400, reward: { jade: 3, shards: 6, exp: 80 } }
];
window.THREE_KINGDOMS_DATA.treasures = [
  { id: "peach-jade", name: "\u6843\u5712\u7389\u74a7", desc: "\u5168\u968a\u751f\u547d\u4e0a\u9650 +5%\u3002", kind: "hp", value: 0.05, unlock: 1 },
  { id: "han-banner", name: "\u6f22\u5ba4\u65cc\u65d7", desc: "\u5168\u968a\u653b\u64ca +4%\u3002", kind: "atk", value: 0.04, unlock: 8 },
  { id: "eight-trigrams", name: "\u516b\u5366\u9663\u5716", desc: "\u6280\u80fd\u51b7\u537b\u901f\u5ea6 +5%\u3002", kind: "cooldown", value: 0.05, unlock: 16 },
  { id: "red-cliff-fire", name: "\u8d64\u58c1\u706b\u7a2e", desc: "\u5c0d Boss \u50b7\u5bb3 +6%\u3002", kind: "boss", value: 0.06, unlock: 24 },
  { id: "unified-seal", name: "\u4e00\u7d71\u5175\u7b26", desc: "\u5168\u968a\u9632\u79a6 +6%\u3002", kind: "def", value: 0.06, unlock: 50 }
];
window.THREE_KINGDOMS_DATA.titles = [
  { id: "volunteer", name: "\u7fa9\u52c7\u8ecd", desc: "\u521d\u5165\u6843\u5712", type: "stage", value: 1 },
  { id: "yellow-turban-breaker", name: "\u7834\u5dfe\u5148\u92d2", desc: "\u901a\u904e\u7b2c 10 \u95dc", type: "stage", value: 10 },
  { id: "hundred-battles", name: "\u767e\u6230\u8001\u5c07", desc: "\u901a\u904e\u7b2c 25 \u95dc", type: "stage", value: 25 },
  { id: "lord-of-heroes", name: "\u7fa4\u82f1\u4e4b\u4e3b", desc: "\u7d50\u8b58 20 \u540d\u6b66\u5c07", type: "heroes", value: 20 },
  { id: "arena-star", name: "\u6f14\u6b66\u7121\u96d9", desc: "\u6f14\u6b66\u7372\u52dd 4 \u5834", type: "arena", value: 4 }
];
window.THREE_KINGDOMS_DATA.tower = { name: "\u554f\u5929\u6a13", basePower: 2700, powerStep: 260, stamina: 4 };

window.THREE_KINGDOMS_DATA.avatarFrames = [
  { id: "plain", name: "\u7fa9\u52c7\u7d20\u6846", desc: "\u6843\u5712\u7fa9\u8ecd\u7684\u672c\u8272", color: "#c6a654", unlockStage: 0 },
  { id: "shu-banner", name: "\u8700\u6f22\u65cc\u65d7", desc: "\u901a\u904e\u7b2c 10 \u95dc\u89e3\u9396", color: "#65a66d", unlockStage: 10 },
  { id: "star-ribbon", name: "\u540d\u5c07\u91d1\u5e36", desc: "\u901a\u904e\u7b2c 25 \u95dc\u89e3\u9396", color: "#d4a746", unlockStage: 25 },
  { id: "red-cliff", name: "\u8d64\u58c1\u706b\u5370", desc: "\u901a\u904e\u7b2c 50 \u95dc\u89e3\u9396", color: "#bb5143", unlockStage: 50 }
];
window.THREE_KINGDOMS_DATA.announcements = [
  { id: "launch-notice", date: "2026-08-27", tag: "\u6025\u5831", title: "\u6843\u5712\u7fa9\u8ecd\u5df2\u96c6\u7d50", body: "\u65b0\u7248\u5df2\u958b\u653e\u554f\u5929\u6a13\u3001\u65e5\u5e38\u526f\u672c\u8207\u88dd\u5099\u7cbe\u7149\u3002" },
  { id: "sprite-notice", date: "2026-08-27", tag: "\u7f8e\u8853", title: "\u540d\u5c07\u5716\u8b5c\u66f4\u65b0", body: "\u6230\u5834\u89d2\u8272\u3001Boss\u3001\u5750\u9a0e\u3001Tile \u8207 VFX \u5df2\u7d71\u4e00\u50cf\u7d20\u6e32\u67d3\u3002" }
];
window.THREE_KINGDOMS_DATA.localEvents = [
  { id: "peach-oath-week", name: "\u6843\u5712\u7fa9\u52c7\u9031", desc: "\u672c\u9031\u7d2f\u7a4d 5 \u5834\u52dd\u5834\uff0c\u9818\u53d6\u7389\u74a7\u8207\u8ecd\u8cc7", kind: "wins", target: 5, reward: { jade: 6, gold: 500 }, period: "week" }
];
window.THREE_KINGDOMS_DATA.appVersion = "0.1.0-local";
