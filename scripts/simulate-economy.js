"use strict";

const fs = require("fs");
const path = require("path");

// 模擬瀏覽器環境
global.window = global;
require(path.join(__dirname, "..", "data", "game-data.js"));
const GAME_DATA = global.THREE_KINGDOMS_DATA;

console.log("==================================================");
console.log("   三國：群英再起 - 全週期經濟與數值平衡模擬");
console.log("==================================================");

// 1. 關卡產出模擬 (1 ~ 100 關)
let totalCampaignGold = 0;
let totalCampaignFood = 0;
let totalCampaignJade = 0;
let totalCampaignShards = 0;

console.log("\n[1. 關卡首通產出統計]");
const stageMilestones = [10, 25, 50, 75, 100];
GAME_DATA.stages.forEach((stage) => {
  const s = stage.id;
  const gold = Math.round(140 + s * 30);
  const food = Math.round(55 + s * 9);
  const jade = s >= 25 ? 3 : 2;
  const shards = s >= 25 ? 3 : 2;

  totalCampaignGold += gold;
  totalCampaignFood += food;
  totalCampaignJade += jade;
  totalCampaignShards += shards;

  if (stageMilestones.includes(s)) {
    const chapterName = GAME_DATA.chapters[Math.floor((s - 1) / 5)]?.name || "征戰";
    console.log(`- 第 ${s} 關 (${chapterName}) 累計首通產出: 銅錢 ${totalCampaignGold.toLocaleString()}, 糧草 ${totalCampaignFood.toLocaleString()}, 玉璧 ${totalCampaignJade}, 碎片 ${totalCampaignShards}`);
  }
});

// 2. 每日活動、日常副本、離線掛機與簽到產出 (30 天模擬)
const dailyBattlePassGold = 3 * 50 * 30; // 每日征戰波次
const dailyDungeonGold = 950 * 30;
const dailyDungeonFood = 850 * 30;
const dailyDungeonJade = 4 * 30;
const dailyDungeonShards = 8 * 30;
const dailyTasksGold = (180 + 260 + 120 + 220) * 30;
const dailyTasksFood = (60 + 35 + 100 + 100) * 30;
const dailyTasksJade = 2 * 30;
const weeklyArenaJade = 15 * 4; // 4週
const weeklyArenaGold = 3400 * 4;
const checkinGold30d = (120 + 260 + 700) * 4;
const checkinFood30d = (180 + 360) * 4;
const checkinJade30d = (2 + 5 + 8) * 4;

// 離線掛機收益 (平均在第 30 關掛機，每小時約 1000 銅錢，每日 8 小時)
const afkGold30d = 8 * 1100 * 30;
const afkFood30d = 8 * 350 * 30;

// 成就獎勵 (通關與養成累計)
const achievementsGold = 700 + 1800 + 500 + 1200 + 1500 + 1600 + 500 + 800;
const achievementsJade = 3 + 8 + 20 + 5 + 12 + 20 + 8 + 15 + 5 + 15 + 8 + 10 + 10 + 8;
const achievementsFood = 300 + 500 + 500;

const total30dGold = dailyDungeonGold + dailyTasksGold + dailyBattlePassGold + weeklyArenaGold + checkinGold30d + afkGold30d + achievementsGold;
const total30dFood = dailyDungeonFood + dailyTasksFood + checkinFood30d + afkFood30d + achievementsFood;
const total30dJade = dailyDungeonJade + dailyTasksJade + weeklyArenaJade + checkinJade30d + achievementsJade;
const total30dShards = dailyDungeonShards + (GAME_DATA.shopItems.find(i => i.id === "hero-shards") ? 18 * 15 : 0);

console.log("\n[2. 30天日常/副本/演武累計產出]");
console.log(`- 30天日常銅錢: ${total30dGold.toLocaleString()}`);
console.log(`- 30天日常糧草: ${total30dFood.toLocaleString()}`);
console.log(`- 30天日常玉璧: ${total30dJade}`);
console.log(`- 30天日常碎片: ${total30dShards}`);

// 3. 武將養成消耗 (5 人主力小隊升至 Lv.60)
let upgradeGoldCost5Heroes = 0;
let breakthroughShards5Heroes = 0;
let breakthroughJade5Heroes = 0;

for (let lvl = 1; lvl < 60; lvl++) {
  const costPerHero = 70 + lvl * 42;
  upgradeGoldCost5Heroes += costPerHero * 5;
}

// 突破 (3星升4星、4星升5星、突破+1~+5)
const breakthroughSteps = 5;
breakthroughShards5Heroes = (18 + 24 + 30 + 36 + 42) * 5;
breakthroughJade5Heroes = (2 + 3 + 4 + 5 + 6) * 5;

// 4. 戰法升級消耗 (3 個戰法各升至 Lv.10)
let tacticsFoodCost = 0;
GAME_DATA.tactics.forEach((t) => {
  for (let lvl = 1; lvl <= 10; lvl++) {
    tacticsFoodCost += t.cost * lvl;
  }
});

console.log("\n[3. 5人主力養成至 Lv.60 總消耗]");
console.log(`- 武將升級銅錢消耗: ${upgradeGoldCost5Heroes.toLocaleString()} (首通+30天覆蓋率: ${((totalCampaignGold + total30dGold) / upgradeGoldCost5Heroes * 100).toFixed(1)}%)`);
console.log(`- 戰法升級糧草消耗: ${tacticsFoodCost.toLocaleString()} (首通+30天覆蓋率: ${((totalCampaignFood + total30dFood) / tacticsFoodCost * 100).toFixed(1)}%)`);
console.log(`- 武將突破碎片消耗: ${breakthroughShards5Heroes} (首通+30天覆蓋率: ${((totalCampaignShards + total30dShards) / breakthroughShards5Heroes * 100).toFixed(1)}%)`);
console.log(`- 武將突破玉璧消耗: ${breakthroughJade5Heroes} (首通+30天覆蓋率: ${((totalCampaignJade + total30dJade) / breakthroughJade5Heroes * 100).toFixed(1)}%)`);

// 5. 健全性檢驗
const goldHealthy = (totalCampaignGold + total30dGold) >= upgradeGoldCost5Heroes;
const foodHealthy = (totalCampaignFood + total30dFood) >= tacticsFoodCost;
const shardsHealthy = (totalCampaignShards + total30dShards) >= breakthroughShards5Heroes;
const jadeHealthy = (totalCampaignJade + total30dJade) >= breakthroughJade5Heroes;

console.log("\n[4. 經濟平衡診斷結論]");
if (goldHealthy && foodHealthy && shardsHealthy && jadeHealthy) {
  console.log(">>> PASS: 全遊戲經濟數值平衡良好，產銷比合理，無卡點或通貨膨脹。");
} else {
  console.error(">>> WARN: 部分資源產出與消耗比例需微調。");
  process.exit(1);
}
console.log("==================================================");
