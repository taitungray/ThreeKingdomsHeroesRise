# 三國：群英再起工程規範

## 專案定位與原始碼

本專案是直式 Web/H5 三國放置 RPG。可編輯的 Web 原始碼以根目錄 `index.html`、`styles.css`、`data/`、`js/`、`assets/` 為準；`game.js` 只保留相容性標記。`www/` 是 `build.js` 的同步產物，不直接修改。

全部文字檔使用 UTF-8，保留繁體中文與三國像素美術方向。不得覆蓋或提交 `google-services.json`、簽名金鑰、上傳憑證、正式 AdMob ID 或其他祕密；不得使用破壞性 git 指令，先保留使用者現有修改。

## 文件權威順序

文件發生衝突時依下列順序判斷：

1. 本檔與 `docs/standards/` 的強制規範。
2. `docs/specs/` 與程式、資料、manifest 可直接驗證的現況。
3. `docs/issues/`、`docs/work/` 與 `docs/qa/` 的問題、行動與驗收。
4. `docs/release/` 的平台程序與外部條件。
5. `docs/reference/` 與 `docs/archive/` 只代表參考或歷史，不是目前完成證明。

程式現況與文件不一致時，不可挑對自己有利的說法；先標記「不一致」，修正權威現況文件，再決定改程式或改文件。使用下列證據標籤：`已確認`、`推論`、`缺少證據`、`不一致`。

## 修改與驗證

- 文件、文案或低風險樣式可走快速路徑：檢查連結、語法及直接受影響頁面。
- 戰鬥生命週期、角色渲染、動畫、輸入、存檔、獎勵、廣告或建置屬高風險：除語法外，必須執行對應回歸測試與完整流程。
- JS 改動至少執行 `node --check game.js`、所有 `js/game/*.js` 的 `node --check`、`npm test`。
- 文件改動執行 `npm run test:docs`；戰鬥角色資產改動執行 `npm run test:combat-assets`。
- 需要同步 Web 產物時才執行 `node build.js`；一般修改不自動產生 Android APK/AAB。
- 只有使用者要求畫面測試、截圖或視覺驗收時，才啟動瀏覽器流程，規則見 `docs/qa/visual-qa.md`。
- 測試結果必須區分自動化、瀏覽器視覺、實機與尚未執行；不得把程式字串或檔案存在誤報成玩法、視覺已通過。

## 戰鬥與 UI 強制底線

- 角色、敵人、Boss、兵器不得以方塊、卡片底色、黑框、debug hitbox 或不透明矩形冒充完成資產。
- 我方、普通敵人與 Boss 都要覆蓋 idle／move／attack／hit／death；兵器必須通過手部 anchor、比例、朝向與不穿模檢查。
- 敵將預告、首領橫幅、對話與結算不得同時堆疊遮住主要戰鬥區；同一時刻只允許一個中央敘事覆蓋層。
- UI、存檔、獎勵、數值或文字有改動時，同步所有顯示、tooltip、ARIA、文件與測試資料，避免平行來源。
- 未通過 `docs/qa/qa-test-matrix.md` 的硬門檻，不得宣稱完成或可發布。

## 發布規則

`docs/release/platform-and-release.md` 是 Android、PWA、廣告與發布流程的單一參考。正式上架前必須替換所有 `REPLACE_WITH` 佔位值，確認隱私權政策、Data safety、`app-ads.txt` 與實際 SDK 行為一致，並使用自己的 Android application ID 與簽名金鑰。

## 參考專案

實際可讀參考位於 `C:/IncenseAshes/`；若日後另有 `D:/Rayon/IncenseAshes/`，也只能作工程結構與規範比較。可採用流程、證據分級、QA 與文件治理方法；不得直接複製其題材、美術、Firebase、AdMob、生產簽名、商店素材、帳號或專案識別資料。整合紀錄見 `docs/reference/reference-integration-audit.md`。
