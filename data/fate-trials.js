"use strict";

window.HERO_FATE_TRIALS = [
  {
    id: "trial-guanyu",
    heroId: "guanyu",
    name: "關羽 · 千里走單騎",
    chapter: "傳奇列傳 · 第一章",
    desc: "掛印封金，千里尋兄！一人一騎護二嫂，過五關斬六將！",
    power: 4500,
    cost: 3,
    bg: "#63352f",
    enemies: ["bandit", "cavalry", "brute"],
    boss: "huangzhong",
    bossName: "守關大將 · 蔡陽",
    reward: {
      shards: 30,
      jade: 88,
      gold: 5000,
      frame: { id: "frame-guanyu-dragon", name: "【武聖青龍】動態框" },
      title: { id: "title-guanyu-loyalty", name: "【義絕千秋】" }
    }
  },
  {
    id: "trial-zhaoyun",
    heroId: "zhaoyun",
    name: "趙雲 · 長坂坡百人斬",
    chapter: "傳奇列傳 · 第二章",
    desc: "當陽長坂坡，曹軍百萬鐵騎！子龍單騎救幼主，七進七出破重圍！",
    power: 7200,
    cost: 3,
    bg: "#385c83",
    enemies: ["cavalry", "archer", "brute"],
    boss: "xiahoudun",
    bossName: "曹魏先鋒 · 晏明",
    reward: {
      shards: 30,
      jade: 88,
      gold: 8000,
      frame: { id: "frame-zhaoyun-courage", name: "【一身是膽】動態框" },
      title: { id: "title-zhaoyun-changsheng", name: "【常勝將軍】" }
    }
  },
  {
    id: "trial-zhugeliang",
    heroId: "zhugeliang",
    name: "諸葛亮 · 七星壇借東風",
    chapter: "傳奇列傳 · 第三章",
    desc: "南屏山起七星祭壇，借三日三夜東南大風，逆轉赤壁乾坤！",
    power: 12000,
    cost: 4,
    bg: "#496c63",
    enemies: ["strategist", "archer", "cavalry"],
    boss: "zhangjiao",
    bossName: "天風護法 · 狂雷道者",
    reward: {
      shards: 30,
      jade: 100,
      gold: 12000,
      frame: { id: "frame-zhugeliang-bagua", name: "【天命八陣】動態框" },
      title: { id: "title-zhugeliang-wisdom", name: "【智絕乾坤】" }
    }
  },
  {
    id: "trial-caocao",
    heroId: "caocao",
    name: "曹操 · 官渡奇襲烏巢",
    chapter: "傳奇列傳 · 第四章",
    desc: "以弱勝強，五千精騎夜襲烏巢，烈火焚盡袁紹百萬糧草！",
    power: 18000,
    cost: 4,
    bg: "#434568",
    enemies: ["brute", "archer", "cavalry"],
    boss: "dongzhuo",
    bossName: "烏巢守將 · 淳于瓊",
    reward: {
      shards: 30,
      jade: 100,
      gold: 18000,
      frame: { id: "frame-caocao-hegemony", name: "【魏武霸業】動態框" },
      title: { id: "title-caocao-hero", name: "【超世之傑】" }
    }
  },
  {
    id: "trial-lubu",
    heroId: "lubu",
    name: "呂布 · 虎牢關戰三英",
    chapter: "傳奇列傳 · 第五章",
    desc: "虎牢關下一騎當千！手持方天畫戟，一人力敵天下英雄與劉關張三英！",
    power: 25000,
    cost: 5,
    bg: "#6e2f35",
    enemies: ["cavalry", "brute", "archer"],
    boss: "lvbu",
    bossName: "戰神幻影 · 鬼神修羅",
    reward: {
      shards: 35,
      jade: 120,
      gold: 25000,
      frame: { id: "frame-lubu-shura", name: "【修羅無雙】動態框" },
      title: { id: "title-lubu-unrivaled", name: "【天下無雙】" }
    }
  },
  {
    id: "trial-zhouyu",
    heroId: "zhouyu",
    name: "周瑜 · 赤壁烈火燎原",
    chapter: "傳奇列傳 · 第六章",
    desc: "羽扇綸巾，談笑間檣櫓灰飛煙滅！指揮萬艦火攻，大破百萬魏軍！",
    power: 32000,
    cost: 5,
    bg: "#7a2e24",
    enemies: ["archer", "strategist", "cavalry"],
    boss: "menghuo",
    bossName: "水寨巨艦 · 鐵甲旗艦",
    reward: {
      shards: 30,
      jade: 120,
      gold: 32000,
      frame: { id: "frame-zhouyu-fire", name: "【赤壁天火】動態框" },
      title: { id: "title-zhouyu-wind", name: "【江左風流】" }
    }
  }
];
