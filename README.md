# 三國：群英再起 — 寫實三國放置 RPG 原型

這是一個直式手機 Web/H5 可玩版本，核心是寫實武將自動群戰、歷史關卡推進、無抽卡武將養成、編隊、兵種與戰法配置。

## 啟動

直接開啟 `index.html`，或在專案目錄執行：

```powershell
py -3 -m http.server 4173 --bind 127.0.0.1
```

再瀏覽 `http://127.0.0.1:4173/`。

若要使用已移植的開發腳本：

```powershell
npm install
npm run dev
```
- `data/game-data.js` 集中 50 名武將、66 件紙娃娃裝備、軍令、20 個章節與 100 個關卡的可調整資料。
- 執行邏輯已拆成 js/game/ 的 core、combat、render、ui、main 五個模組；模組邊界與載入順序見 `docs/specs/architecture.md`。

## 發布準備

- capacitor.config.json、manifest.json、sw.js 與 www/ 已準備好直式 Android/PWA 包裝。
- js/admob.js 只提供使用者主動觸發的 rewarded ad 接口；開發環境固定用 Google 測試 ID，尚未啟用正式廣告。
- 所有文件先從 `docs/README.md` 進入；規範、目前規格、工作清單、已知問題、QA、發布與歷史資料已分目錄管理。
- 正式版依 `docs/release/README.md` 完成 Firebase、application ID、AdMob、publisher line、隱私政策與簽名設定。
- UI 與後續製作遵守 `docs/standards/`；現況見 `docs/specs/current-game-spec.md`，待辦見 `docs/work/active-backlog.md`，問題見 `docs/issues/known-issues.md`。
- 不會從 IncenseAshes 複製 Firebase 憑證、keystore、upload certificate、正式廣告 ID 或商店素材。

先使用 SETUP_ANDROID.bat／npm run setup:android 建立 Android wrapper，再使用 START_ANDROID_APP.bat／npm run start:android 啟動裝置或模擬器；打包APK.bat／npm run build:android 會輸出到 builds/。

專案包含自製 WebP、Canvas 與 CSS 資產，未使用參考遊戲的商標或素材。現有戰鬥角色與兵器仍須通過逐狀態視覺驗收；README 不宣稱尚未驗證的資產已具發布品質。
