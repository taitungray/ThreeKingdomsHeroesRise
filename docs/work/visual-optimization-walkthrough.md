# 角色與戰場畫面視覺優化完成紀錄 (Walkthrough)

## 優化項目與改動成果

### 1. 戰場 9 大三國神兵重繪生成
- **改動檔案**：[scripts/generate-combat-weapons.js](file:///d:/Rayon/ThreeKingdomsHeroesRise/scripts/generate-combat-weapons.js)
- **產出資產**：`assets/characters/combat-weapon-*.webp`（共 9 張）
- **成果**：
  - **青龍偃月刀**：翡翠玉刃、黃金盤龍 collar、飄逸紅綢水袖纓穗。
  - **丈八蛇矛**：三彎流暢蛇形矛尖、紅纓與金扣。
  - **方天畫戟**：雙月牙護刃、金龍戟尖與雙側紅纓。
  - **龍膽槍**：銳利銀芒槍頭、青藍龍紋纓穗。
  - **穿雲弓**：雕花弓臂、搭箭與羽翎。
  - **八卦羽扇**：白羽與翡翠羽層疊、太極玉墜與流蘇。
  - **雙股劍**：雌雄雙刃交錯、金柄與朱紅纓穗。
  - **日月乾坤圈**：日輪月刃雙環、齒鋒金芒。
  - **玄鐵青釭劍**：八面漢劍造型、寶石護手與玉佩。

### 2. UI 頭像全面 WebP 肖像化與 1254px 高清名將立繪接入
- **改動檔案**：[styles.css](file:///d:/Rayon/ThreeKingdomsHeroesRise/styles.css), [js/game/game-ui.js](file:///d:/Rayon/ThreeKingdomsHeroesRise/js/game/game-ui.js), [index.html](file:///d:/Rayon/ThreeKingdomsHeroesRise/index.html)
- **成果**：
  - 徹底移除 CSS 粗糙方塊面部色塊（眼睛、符文、頭盔色帶偽元素）。
  - 對話框、主公卡、武將列表、編隊欄位統一以 50 名武將與敵將專屬 WebP 像素頭像呈現。
  - **武將詳情頁特寫**：11 大核心名將（劉備、關羽、張飛、趙雲、諸葛亮、曹操、夏侯惇、黃忠、孫尚香、貂蟬、呂布）點開詳情時全面接入 1254px 高清半身大立繪，搭配金屬錦框。
  - **武將卡列表升級**：武將卡片增加 SSR 金框 / SR 紫框、職業兵種標籤（步/騎/弓/謀）與「出陣」印記，層次分明。

### 3. 戰鬥角色小人（Combat Body）全面升級為 64×76 高清解析度 (2× Retina Pixel Density)
- **改動檔案**：[scripts/generate-combat-bodies.js](file:///d:/Rayon/ThreeKingdomsHeroesRise/scripts/generate-combat-bodies.js), [scripts/generate-attack-sprites.js](file:///d:/Rayon/ThreeKingdomsHeroesRise/scripts/generate-attack-sprites.js)
- **成果**：
  - **解析度翻倍**：全 50 名武將、5 類敵兵與鎖定小人由 `32×38` 升級為 **`64×76` 高清精細像素**（細節精度提升 4 倍）。
  - **徹底消除顆粒感**：精細重繪頭盔翎羽、面部五官（眼神/鬍鬚）、肩甲護心鏡、金屬腰帶、戰袍褶皺與腿甲，放大 1.22x 或在手機高解析螢幕上徹底告別粗糙模糊的馬賽克方塊感。
  - **59 張攻擊圖集同步重構**：全面以 64×76 高清小人為底板重新合成輸出。

### 4. 敵我陣營鮮明區分與 5 星神將戰場光環
- **改動檔案**：[js/game/game-render.js](file:///d:/Rayon/ThreeKingdomsHeroesRise/js/game/game-render.js)
- **成果**：
  - 敵方單位底盤加入暗紅陣營陰影與戰術標記光環（小兵紅圈、Boss 威壓血紅雙環）。
  - 5 星神將在戰場腳底加入專屬金色靈氣流光環。
  - 普通敵人強化力士巨肩角盔、神射手箭袋披巾、術士符紋等造型細節。

### 4. 打擊感與技能光環特效重構
- **改動檔案**：[js/game/game-render.js](file:///d:/Rayon/ThreeKingdomsHeroesRise/js/game/game-render.js)
- **成果**：
  - 技能就緒狀態改為「武將腳底八卦戰陣流光地環 + 旋轉光點 + 向上流動的武魄金芒」，不再遮蓋角色身體。
  - 斬擊弧光增加內層金白光刃，衝擊波與受擊火花更具爆發感，連擊跳字增加彈跳動態。

### 5. 戰場背景地形與環境氛圍升級
- **改動檔案**：[js/game/game-render.js](file:///d:/Rayon/ThreeKingdomsHeroesRise/js/game/game-render.js)
- **成果**：
  - 地形 Tile 混合透明度由 0.28 提升至 0.48，背景不再是一片平淡死綠。
  - 雨天增加斜向漸隱雨絲，雪天增加輕柔微旋雪花，夜間增加漂浮螢火微光。

---

## 驗證結果
- `node --check` 語法檢查：**全數通過**
- `npm test` 冒煙測試：**通過 (50 heroes, 100 stages)**
- `npm run test:docs` 文件連結與規範檢查：**通過**
- `npm run test:combat-assets` 戰鬥資產與 Alpha 覆蓋率檢查：**通過 (59 attack sheets, 9 weapons)**
- `node build.js` 構建產物同步：**成功同步至 www/**
