# 角色與戰場畫面全面視覺優化實作計畫

本計畫針對遊戲目前視覺「太醜、風格割裂、兵器太小、敵我不分、頭像粗糙、打擊感欠佳」等問題進行全方位升級，建立統一、精緻且具備三國武俠氛圍的像素戰場與 UI 介面。

## 審查重點

1. **UI 頭像全面升級**：全面使用 50 名武將與敵將的 WebP 像素肖像（`assets/characters/portrait-*.webp`），移除粗糙的 CSS 漸層色塊拼裝臉。
2. **戰場兵器重新生成**：升級 `scripts/generate-combat-weapons.js`，重製 9 大兵器（雙股劍、青龍刀、丈八蛇矛、龍膽槍、穿雲弓、羽扇、乾坤圈、方天戟、玄鐵劍），大幅提升外型辨識度、金屬質感與揮擊光刃。
3. **敵我陣營鮮明區分**：敵方單位增加專屬暗紅戰陣光環與受擊血條反饋，強化力士、神射、術士、鐵騎等兵種特徵，解決「打誰都像在打自己人」的混亂感。
4. **打擊感與技能特效重構**：移除生硬的發光大黃球，改為流暢的武將戰陣光環、兵器流光、連擊暴擊火花與受擊微震動。
5. **戰場地景與環境氛圍升級**：調整地形圖層混合權重與色彩漸層，優化雨/雪/夜環境粒子動態，提升整體戰場沉浸感。

## 具體改動規劃

---

### 1. 兵器資產重製 (Assets & Generation Scripts)

#### [MODIFY] [scripts/generate-combat-weapons.js](file:///d:/Rayon/ThreeKingdomsHeroesRise/scripts/generate-combat-weapons.js)
- 重新設計 9 大兵器 SVG：
  - **青龍偃月刀 (guandao)**：加粗青龍吐刃結構、金龍盤柄、銳利刀鋒。
  - **丈八蛇矛 (serpent)**：重現三彎蛇刃、紅纓槍穗、金屬光澤。
  - **方天畫戟 (halberd)**：增添雙月牙側刃、金龍戟尖與紅纓。
  - **龍膽槍 (lance)**：加長銀白槍尖、寒芒微光。
  - **穿雲弓 (bow)**：精緻雕花弓臂、緊繃弦線與搭箭細節。
  - **八卦羽扇 (fan)**：青翠羽片層次、八卦玉墜。
  - **陰陽雙劍 (twin)**：雌雄雙刃交錯、金柄玄鞘。
  - **日月乾坤圈 (rings)**：銳利輪齒、粉金光華。
  - **玄鐵寶劍 (sword)**：八面漢劍造型、黃金護手。
- 執行腳本生成全新的 9 張 `assets/characters/combat-weapon-*.webp`。

---

### 2. 戰鬥渲染管線升級 (Combat Rendering Engine)

#### [MODIFY] [js/game/game-render.js](file:///d:/Rayon/ThreeKingdomsHeroesRise/js/game/game-render.js)
- **敵我辨識系統**：
  - 敵方單位底盤增加暗紅色陣營陰影與煞氣粒子。
  - 敵方精英與小兵在被攻擊時提供即時受擊反饋。
- **技能就緒與特效升級**：
  - 廢棄粗暴的黃色圓形發光球，實作「武將八卦/戰陣流光地環 + 武器流芒」。
  - 升級斬擊特效（Slash）、衝擊波（Impact）與連擊跳字樣式。
  - 強化 Boss 登場威壓光環與暗金煞氣。
- **武器手部 Anchor 與揮擊軌跡調校**：
  - 依據新武器規格校準 `weaponHandOffset` 與 `weaponRestLean`，使兵器自然握於武將手中，揮擊時產生流光弧線。
- **地形與環境渲染增強**：
  - 提升 `drawBackground()` 中地形圖層的透光度與柔和漸層（0.28 -> 0.45）。
  - 改進 `drawWeatherOverlay()`：雪花增加微旋與飄落層次，細雨增加透明斜紋與水花。

---

### 3. UI 與樣式統一 (Styles & UI System)

#### [MODIFY] [styles.css](file:///d:/Rayon/ThreeKingdomsHeroesRise/styles.css)
- **全面肖像化**：
  - 讓 `.pixel-avatar` 預設具備平滑圓角/方框裁切與高品質背景肖像渲染。
  - 隱藏殘留的粗糙偽元素色塊（`::before`, `::after` 的方塊臉）。
  - 對話框、主公卡、戰場預覽、武將詳情卡全面適配 WebP 肖像。
- **戰鬥 HUD 與反饋微調**：
  - 提升連擊計數器（Combo Meter）與關卡首領進度條的精緻金屬質感。

#### [MODIFY] [js/game/game-ui.js](file:///d:/Rayon/ThreeKingdomsHeroesRise/js/game/game-ui.js)
- 確保所有武將在任何面板（列表、編隊、詳情、對話框、敵將預覽）一律優先渲染專屬 WebP 肖像。

---

## 驗證計畫

### 自動化測試
```powershell
# 1. 語法檢查
node --check js/game/game-render.js
node --check js/game/game-ui.js
node --check scripts/generate-combat-weapons.js

# 2. 自動化測試套件
npm test
npm run test:docs
npm run test:combat-assets

# 3. 產物構建同步
node build.js
```

### 人工檢驗重點
1. 武將手中的武器清晰可見、比例合適且揮舞自然。
2. 敵軍與我方在戰場上一目了然，不再混淆。
3. 主公卡與對話框頭像呈現精緻像素肖像，而非色塊拼裝。
4. 技能發動時具備流暢戰陣光環與打擊光效。
5. 戰場背景更有層次與三國古戰場氛圍。
