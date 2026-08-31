# 三國：群英再起工程規範

## 專案定位與原始碼

本專案是直式 Web/H5 三國放置 RPG。可編輯的 Web 原始碼以根目錄 `index.html`、`styles.css`、`data/`、`js/`、`assets/` 為準；`game.js` 只保留相容性標記。`www/` 是 `build.js` 的同步產物，不直接修改。

全部文字檔使用 UTF-8，確立以 **《桃園結義：放置三國RPG》（Three Kingdoms: Idle RPG，參考影片：https://www.youtube.com/watch?v=ASJ868tKH3A）** 為最高戰鬥與美術對標，採用正統 16-bit / 32-bit 精緻點陣像素（Pixel Art）武將與戰場風格。不得覆蓋或提交 `google-services.json`、簽名金鑰、上傳憑證、正式 AdMob ID 或其他祕密；不得使用破壞性 git 指令，先保留使用者現有修改。

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
- **每次 commit 前，必須再次確認文件是否皆已同步更新**：在提交任何 commit 之前，務必檢查 `docs/`（包含 `docs/specs/`、`docs/issues/`、`docs/work/`、`docs/qa/` 等）中相關規格、已知問題狀態與待辦清單是否已與程式現況完全同步，並執行 `npm run test:docs` 通過檢查。
- 需要同步 Web 產物時才執行 `node build.js`；一般修改不自動產生 Android APK/AAB。
- **測試全部在背景執行，嚴禁主動開啟瀏覽器視窗**。所有單元測試、冒煙測試、語法與資產校驗均使用命令列（`npm test`、`node --check` 等）於背景完成；除非使用者明確要求開啟外部瀏覽器，否則絕對不得啟動瀏覽器或彈出視窗。
- 測試結果必須區分自動化、命令列、實機與尚未執行；不得把程式字串或檔案存在誤報成玩法、視覺已通過。

## 品質審查與角色責任

- 遊戲品質一律依 `docs/standards/game-quality-review.md` 的四層驗收：資深玩家盲測、資深企劃、資深美術／UI、工程與自動化 QA。
- 自動化、source／`www` smoke 或全 50 名角色無 overflow，只能證明對應功能斷言；不得代替好玩、好懂、美術品質或真人玩家證據。
- 遊戲總監、企劃、美術、UI 與 QA 必須各自留下判定與證據。一人模擬多角色時要分段標記「角色模擬審查」；沒有真人參與不得宣稱完成玩家盲測。
- 優先驗收第一章垂直切片；每輪只修最高優先 3–5 項後重測。任一角色提出 P0／P1 或必要證據缺失，整體仍為 `FAIL`。
- 後續任何活動頁、簽到、戰令、節慶、兌換或限時入口同樣受四層規範約束，並需通過 `docs/standards/game-quality-review.md` 的活動追加門檻；不得使用假倒數、假排名、假領取或未配置服務冒充完成。

## 戰鬥與 UI 強制底線

- 角色、敵人、Boss、兵器必須是完整的全身 16-bit 點陣像素武將，嚴禁以粗糙幾何方塊、半身大頭貼、黑框、debug hitbox 或不透明矩形冒充完成資產。
- 兵器必須自然融入角色手部，嚴禁以靜態小圖生硬貼於脖子或面部；揮砍時應由渲染引擎動態呈現流暢刀光劍影。
- 我方、普通敵人與 Boss 都要覆蓋 idle／move／attack／hit／death；動作節奏需清晰流暢。
- 敵將預告、首領橫幅、對話與結算不得同時堆疊遮住主要戰鬥區；傷害跳字與血條需精緻清爽。
- UI、存檔、獎勵、數值或文字有改動時，同步所有顯示、tooltip、ARIA、文件與測試資料，避免平行來源。
- 未通過 `docs/qa/qa-test-matrix.md` 的硬門檻，不得宣稱完成或可發布。

## 發布規則

`docs/release/platform-and-release.md` 是 Android、PWA、廣告與發布流程的單一參考。正式上架前必須替換所有 `REPLACE_WITH` 佔位值，確認隱私權政策、Data safety、`app-ads.txt` 與實際 SDK 行為一致，並使用自己的 Android application ID 與簽名金鑰。

## 參考專案

1. **核心美術與戰鬥對標**：YouTube 實機參考 [《桃園結義：放置三國RPG》](https://www.youtube.com/watch?v=ASJ868tKH3A)（Three Kingdoms: Idle RPG），規範正統 16-bit 點陣像素名將、清爽戰場與兩軍橫向對衝戰鬥。
2. **工程與架構參考**：位於 `C:/IncenseAshes/`，作放置手遊資訊架構、文件治理與 QA 矩陣方法借鑑。整合紀錄見 `docs/reference/reference-integration-audit.md`。
