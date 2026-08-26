# 三國：群英再起 — 像素三國放置 RPG 原型

這是一個直式手機 Web/H5 可玩版本，核心是像素武將自動群戰、歷史關卡推進、無抽卡武將養成、編隊、兵種與戰法配置。

## 啟動

直接開啟 `index.html`，或在專案目錄執行：

```powershell
py -3 -m http.server 4173 --bind 127.0.0.1
```

再瀏覽 `http://127.0.0.1:4173/`。

若要使用已移植的開發腳本：

npm install
npm run dev

`npm run build` 會把根目錄 Web 原始碼同步到 Capacitor 的 `www/`；不會建立 Android APK/AAB。

`npm test` 會檢查資料表、關卡波次、紙娃娃槽位、核心循環入口與建置載入順序。

也可以直接雙擊 START_APP.bat，它會同步 Web 產物、啟動本機伺服器並開啟瀏覽器。

## 操作

- 戰鬥會自動進行；可切換 `AUTO` 與 `×1 / ×2`。
- 武將以專屬輪廓、頭冠、甲冑、兵器、待機動作與攻擊特效區分，不只依靠換色。
- 底部可進入武將、編隊與戰法頁。
- 武將頁可升級角色；編隊頁可替換出戰成員；戰法頁可強化全隊效果。
- 武將詳情內有紙娃娃配置：可輪換兵器、戰甲、坐騎與信物；外觀及對應數值加成會即時同步至隊伍。
- 進度與離線收益會儲存在瀏覽器 `localStorage`。
- 戰役頁可進入目前關卡或重打已通關章節；重打只給部分戰功，不會倒退最高進度。
- `data/game-data.js` 集中 50 名武將、66 件紙娃娃裝備、軍令、20 個章節與 100 個關卡的可調整資料。
- 執行邏輯已拆成 js/game/ 的 core、combat、render、ui、main 五個模組；模組邊界與載入順序見 docs/architecture.md。

## 發布準備

- capacitor.config.json、manifest.json、sw.js 與 www/ 已準備好直式 Android/PWA 包裝。
- js/admob.js 只提供使用者主動觸發的 rewarded ad 接口；開發環境固定用 Google 測試 ID，尚未啟用正式廣告。
- 正式版請先閱讀 docs/platform-and-release.md、docs/ads-integration.md 與 docs/google-play-submission.md，填入自己的 application ID、AdMob ID、publisher line、隱私政策 URL 與簽名設定。
- UI 與後續製作必須遵守 docs/ui-display-rules.md、docs/production-rules.md；需要截圖或畫面驗收時使用 docs/visual-qa.md。
- 不會從 IncenseAshes 複製 Firebase 憑證、keystore、upload certificate、正式廣告 ID 或商店素材。

先使用 SETUP_ANDROID.bat／npm run setup:android 建立 Android wrapper，再使用 START_ANDROID_APP.bat／npm run start:android 啟動裝置或模擬器；打包APK.bat／npm run build:android 會輸出到 builds/。

所有角色、像素圖形、場景與 UI 都由程式與 CSS 原創繪製，未使用參考遊戲的商標或素材。
