# Runtime 架構

狀態：CURRENT TECHNICAL SPEC。描述目前程式邊界、載入順序與生命週期責任；未來重構工作放在 [目前工作清單](../work/active-backlog.md)。

## Source of truth

| 範圍 | 目前來源 |
|---|---|
| HTML 與載入順序 | `index.html` |
| 全域樣式與響應式 | `styles.css` |
| 武將、裝備、關卡與內容資料 | `data/` |
| 共用狀態、存檔與 migration | `js/game/game-core.js` |
| 波次、傷害、技能、死亡與結算 | `js/game/game-combat.js` |
| Canvas、角色、兵器、VFX 與 frame | `js/game/game-render.js` |
| HUD、面板、清單與操作 | `js/game/game-ui.js` |
| boot、全域輸入、背景恢復與 timers | `js/game/game-main.js` |
| Web／原生平台能力 | `js/platform.js`、`js/iap.js`、`js/admob.js` |
| 同步後的 Web 產物 | `www/`，由 `build.js` 產生，不直接修改 |

`game.js` 只保留相容性標記，不是主要 runtime。

## 載入順序

`index.html` 依序載入：

1. `data/game-data.js`
2. `js/game/game-core.js`
3. `js/game/game-combat.js`
4. `js/game/game-render.js`
5. `js/game/game-ui.js`
6. `js/game/game-main.js`

目前使用 ordered classic scripts，以維持 WebView 全域 runtime 相容性。模組依賴只能往前，不得讓 data 或 core 反向依賴 UI／main。

## 狀態與責任

- `save` 是持久化資料來源；新欄位要有預設值、schema migration 與無效資料保護。
- `runtime` 是單次執行狀態；單位、projectile、effect、overlay、timer 與結算在重試／下一關時要完整清理。
- combat action 是攻擊、受擊、死亡、音效與 VFX 的共同事件來源；renderer 不建立第二套戰鬥真相。
- UI 只能透過既定 action 修改資料；發獎後依固定順序更新記憶體、persist 與 HUD。
- 每個 RAF、interval、timeout、audio／native listener 都要有擁有者與取消點。

## Frame 與背景生命週期

- `game-main.js` 擁有 RAF、HUD timer、週期存檔、visibility 與 foreground recovery。
- 背景時停止 RAF 與非必要 timer，保存時間戳；回前景重設時間基準，不建立第二個 loop。
- `game-combat.js` 推進 wave、Boss、death 與 settlement；`game-render.js` 只讀狀態繪製。
- effect records 使用固定池回收；stage reset 需清空活動 effect、projectile、number、drop 與 overlay。

## 資產與渲染

- `TaoyuanAssets` 負責 manifest 預載、快取、尺寸與載入狀態。
- `assets/characters/modular-manifest.json` 管理角色家族、body、portrait、Boss 與 anchor；裝備圖示由 equipment manifest 管理。
- 戰場 body、attack、weapon、mount 與 VFX 各自只畫一次；只有檔案存在但 runtime 沒有 draw call，不算接入。
- 角色使用 foot-center；兵器使用 manifest hand anchor。詳細規格見 [戰鬥角色渲染契約](../standards/combat-character-render-contract.md)。
- UI 裝飾可使用核准 fallback；核心戰鬥角色、敵人、Boss 與兵器不可回退成矩形、黑卡或程序方塊。

## 開發與建置目標

- `npm run dev` 直接提供根目錄 source。
- `node build.js` 同步 source 到 `www/`。
- `npm run dev:www` 只用於驗證同步後產物。
- 測試報告必須標示 target 是 source 或 `www`，禁止讓舊 `www/` 混入 source QA。

## 架構不一致處理

架構文件描述目前應成立的邊界，不是願望。若 source、manifest、runtime 消費或測試證據不符，先在 [已知問題](../issues/known-issues.md) 標記「不一致」，再於 [目前工作清單](../work/active-backlog.md) 安排行動；歷史 roadmap 不能覆蓋現況。
