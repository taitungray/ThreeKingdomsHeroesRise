# 三國：群英再起工程規範

## 專案定位

本專案是直式 Web/H5 三國放置 RPG，原始碼以根目錄的 `index.html`、`styles.css`、`game.js` 為主，透過 `build.js` 同步到 Capacitor 使用的 `www/`。

## 修改與驗證

- 全部文字檔使用 UTF-8；保留繁體中文與既有像素美術風格。
- 遊戲規則、動畫、UI 與存檔改動後，至少執行 `node --check game.js`。
- 需要同步 Web 產物時才執行 `node build.js`；一般修改不自動產生 Android APK/AAB。
- 不要覆蓋或提交 `google-services.json`、簽名金鑰、上傳憑證、正式 AdMob ID 或其他專案祕密。
- 不使用破壞性的 git 指令；先保留使用者現有修改。

## UI 與製作規範

docs/ui-display-rules.md 是 UI、觸控、表面、字級、角色辨識與動畫的強制底線。docs/production-rules.md 是新增功能、存檔、獎勵、資產與驗證流程的強制底線。只有使用者要求畫面測試、截圖或視覺驗收時，才啟動瀏覽器與視覺 QA 流程；規則見 docs/visual-qa.md。

## 發布規則

`docs/platform-and-release.md` 是 Android、PWA、廣告與發布流程的單一參考。正式上架前必須替換所有 `REPLACE_WITH` 佔位值，確認隱私權政策、Data safety、`app-ads.txt` 與實際 SDK 行為一致，並使用自己的 Android application ID 與簽名金鑰。

## 參考專案

`D:/Rayon/IncenseAshes/` 僅作為工程結構與規範參考；不得直接複製其 Firebase、AdMob、生產簽名、商店素材或專案識別資料。
