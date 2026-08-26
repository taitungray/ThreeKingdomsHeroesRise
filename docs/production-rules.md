# 三國：群英再起製作與工程規範

狀態：強制的製作底線。目標是讓後續新增武將、面板、活動、廣告與上架流程不再回到「先寫一堆 CSS、最後才補規則」。

## 1. Source of truth

- Web 原始碼包含根目錄 index.html、styles.css、`js/game/`、`data/`、assets/；`game.js` 僅為相容性標記。
- www/ 是 build.js 產物，不直接手改。
- capacitor.config.json、manifest.json、sw.js、package.json 是平台設定來源。
- docs/ui-display-rules.md 是 UI 權威；docs/platform-and-release.md 是發布權威；docs/accessibility-wcag.md 是無障礙權威。
- 不把 IncenseAshes 的 Firebase、AdMob、keystore、商店圖片或識別值當成預設值。

## 2. 新功能流程

1. 先寫 Screen Goal、玩家下一步、主要狀態與 layout anchor。
2. 先選表面家族與字級／間距／觸控 token，再寫 HTML/CSS。
3. 定義 normal、pressed、selected、disabled、loading、error、claimed。
4. 玩法狀態、存檔與獎勵規則先於視覺 polish。
5. 實作最小範圍；不要順手重寫整個 UI 或把無關修正混進同一批。
6. 針對受影響的螢幕做語法、功能與響應式驗證。
7. 需要時才同步 www/；普通 Web 修改不自動產生 APK/AAB。

## 3. 單檔原型的邊界

執行邏輯已拆成 `js/game/` 的 core、combat、render、ui、main 五個模組。新增內容應放進對應邊界，避免把資料、畫面與事件再互相複製。

- HEROES、紙娃娃、戰法與章節資料集中維護。
- 存檔只透過 loadSave、persist 與明確的版本 migration。
- 資源變更後同步 updateHud、persist 與對應的操作回饋。
- innerHTML 只使用本地常數與已編碼資料；不要把未驗證使用者輸入直接插入 DOM。
- 動畫時間、音效、震動與廣告狀態不可各自建立平行旗標。

## 4. 存檔、獎勵與廣告不變量

- 正常獎勵與廣告加碼分開發放；廣告失敗不能回滾已取得的正常獎勵。
- 只有 rewarded event 完成後才發廣告獎勵。
- 雙擊、重新整理、回呼重送不能重複發獎；領取鍵與每日上限要寫入存檔。
- 數值先更新記憶體，再 persist，再更新 HUD；失敗時要有可理解訊息。
- 離線收益、重置進度與裝備切換都要能在重新載入後還原。

## 5. 資產與效能

- 圖片依用途放 assets/ui、assets/nav、assets/currency、assets/characters、assets/backgrounds；不得把不同遊戲素材混進來。
- 像素圖使用 nearest-neighbor；角色與武器不任意縮放或拉伸。
- Canvas 更新只在遊戲 loop 內做；DOM 面板開啟時不新增無限 timer 或 listener。
- setInterval、requestAnimationFrame、AdMob listener 都要有清楚的生命週期。
- 先保留可讀與穩定，再做粒子與陰影；手機低階裝置不能因裝飾掉到不可玩。

## 6. 修改與驗證

- JS：對 `js/game/*.js` 與 `game.js` 執行 `node --check`，再跑 `npm test`。
- 設定：解析 package.json、manifest.json、capacitor.config.json。
- UI：至少檢查 390×720；若使用者要求視覺評審，才啟動瀏覽器、截圖與比較。
- Build：需要同步產物時執行 node build.js；release 只在使用者要求時執行。
- 任何測試失敗要說明是程式問題、環境缺少或預期 guard，不把錯誤吞掉。

## 7. 變更紀錄

涉及 UI、存檔、廣告、Android、版本號或資料安全時，更新對應 docs；不要只把規則留在聊天訊息或暫時註解。
