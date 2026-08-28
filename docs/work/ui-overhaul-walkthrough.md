# 全遊戲 UI 視覺重構與手遊化升級完成紀錄 (Walkthrough)

## 優化背景與目標

徹底解決舊版 UI「像網頁做的、陽春、簡陋」的視覺問題，達成以下核心目標：
1. **零 CSS/文字硬拼圖標**：所有功能按鈕、導航、資源全部改用專屬繪製的 WebP 高清遊戲圖標。
2. **沉浸式黑金漆器手遊風格**：徹底移除泛黃泥土色（`#cdbd94`）平淡邊框，升級為深黑漆器、赤金鑲邊、3D 立體反光與物理按壓手感。
3. **戰場 HUD 與系統面板手遊化**：主公虎符牌、首領呼吸戰令、黑檀木漆金導航底座、古典御璽大捷印章。

---

## 具體改動與成果

### 1. 全套 28 款專屬 WebP 遊戲圖標資產生成導入
- **生成工具腳本**：[scripts/generate-ui-icons.js](file:///d:/Rayon/ThreeKingdomsHeroesRise/scripts/generate-ui-icons.js)
- **產出資產目錄**：`assets/icons/*.webp`
- **成果清單**：
  - **五大底部導航**：
    - `nav-battle.webp`：赤金雙龍交錯古劍與戰旗（征戰）
    - `nav-heroes.webp`：金甲神將頭盔與背光神威（武將）
    - `nav-formation.webp`：九宮八卦陣圖與青銅虎符（編隊）
    - `nav-tactics.webp`：諸葛錦囊與太極密卷（戰法）
    - `nav-campaign.webp`：羊皮戰略地圖與九州烽火（戰役）
  - **十三大軍務快捷圖標**：
    - `icon-settings.webp`（青銅機關盤）、`icon-mail.webp`（漆金火漆密信）、`icon-daily.webp`（點將軍令日曆）、`icon-shop.webp`（金玉行商殿）、`icon-menu.webp`（軍務總覽）、`icon-rank.webp`（霸主三階榜）、`icon-medal.webp`（金鑲玉勳章）、`icon-scroll.webp`（軍情戰報卷）、`icon-flag.webp`（赤炎戰旗）、`icon-book.webp`（武經圖鑑）、`icon-tower.webp`（九重問天樓）、`icon-arena.webp`（演武擂台）、`icon-dungeon.webp`（地宮石門）。
  - **五大資源與消耗品圖標**：
    - `res-coin.webp`（開元通寶金幣）、`res-food.webp`（錦袋軍糧捆）、`res-jade.webp`（剔透雙龍碧玉佩）、`res-shard.webp`（武魂神晶）、`res-exp.webp`（紫金太極玄天丹）。
  - **兩大古印璽印章**：
    - `seal-taoyuan.webp`（桃園初陣朱紅古印，取代文字 `桃`）
    - `seal-victory.webp`（大捷御璽戰報印章）
  - **四大裝備插槽底印**：
    - `slot-weapon.webp`、`slot-armor.webp`、`slot-mount.webp`、`slot-accessory.webp`。

### 2. 戰場主 HUD 沉浸式升級
- **改動檔案**：[styles.css](file:///d:/Rayon/ThreeKingdomsHeroesRise/styles.css)
- **成果**：
  - **主公名牌（Lord Card）**：升級為赤金鑲玉虎符金牌，帶有金屬邊框與琉璃經驗槽。
  - **資源欄（Resource Strip）**：改為深黑古銅條底座，所有資源搭配專屬發光圖標與清晰等寬數字。
  - **首領挑戰按鈕（Boss Trigger Button）**：就緒時具備赤炎燃燒光暈、金角衝天戰令與脈衝呼吸動態（`boss-pulse`）。
  - **底部導航列（Bottom Nav）**：升級為黑檀木漆金底座與金屬分割線，選中項目綻放金色聚光光環與浮雕上移。

### 3. 面板與彈窗手遊化質感重構
- **改動檔案**：[styles.css](file:///d:/Rayon/ThreeKingdomsHeroesRise/styles.css)
- **成果**：
  - **面板外框**：由黃泥底色改為深黑漆器（`#24221c ~ #161511`）搭配放射金屬暗紋與赤金邊框（`#8f7242`）。
  - **標題橫額**：改為御賜金匾樣式，兩側飾以祥雲金印。
  - **分頁標籤（Tabs）**：改為古風玉符籤條切換效果。
  - **武將名冊卡片**：SSR 金框、SR 紫框立體層次分明；未解鎖武將具備深色暗影與鎖鏈標籤。
  - **結算戰報（Settlement Modal）**：採用「大捷」朱紅御璽印章、發光金色木盤托底戰利品。

### 4. 開場與登入畫面去網頁化
- **改動檔案**：[styles.css](file:///d:/Rayon/ThreeKingdomsHeroesRise/styles.css)
- **成果**：
  - 由原本白色/米色置中網頁表單升級為深邃大氣的三國開局主視覺、燙金立體遊戲標題與金屬令牌按鈕。

### 5. 工程規範增訂
- **改動檔案**：[AGENTS.md](file:///d:/Rayon/ThreeKingdomsHeroesRise/AGENTS.md)
- **成果**：
  - 明確規範所有測試、驗證與建置流程**一律在背景命令列執行**（使用 `npm test`、`node --check`、`node build.js` 等），**嚴禁主動開啟或呼叫任何瀏覽器視窗**。

---

## 驗證結果

- `npm test` 冒煙測試與 40 篇文件連結校驗：**全數通過**
- `npm run test:docs` 文件規範檢查：**通過**
- `npm run test:combat-assets` 戰鬥資產與 Alpha 覆蓋率檢查：**通過**
- `node build.js` 構建產物同步：**成功同步至 `www/`**
