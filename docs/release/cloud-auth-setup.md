# Google 登入與雲端存檔設定

狀態：RELEASE PROCEDURE。描述正式環境設定方式；目前外部依賴狀態只在 [目前工作清單](../work/active-backlog.md) 維護。

遊戲已接上 Firebase Authentication 與 Cloud Firestore 的流程：Google 登入後，以 Firebase UID 作為 `taoyuan_qunying_saves/{uid}` 文件 ID；啟動時下載並合併存檔，遊戲內保存會 debounce 上傳，登出前會先嘗試上傳最後一次進度。

## Firebase 專案

1. 建立本專案自己的 Firebase project，不使用 `IncenseAshes` 的 project ID、OAuth client、`google-services.json` 或任何正式憑證。
2. 在 Authentication → Sign-in providers 啟用 Google。
3. 將實際 Web 應用設定以環境變數注入 release build：

```powershell
$env:TAOYUAN_FIREBASE_API_KEY = "你的 Web API key"
$env:TAOYUAN_FIREBASE_AUTH_DOMAIN = "你的專案.firebaseapp.com"
$env:TAOYUAN_FIREBASE_PROJECT_ID = "你的專案 ID"
$env:TAOYUAN_FIREBASE_STORAGE_BUCKET = "你的 storage bucket"
$env:TAOYUAN_FIREBASE_MESSAGING_SENDER_ID = "你的 sender ID"
$env:TAOYUAN_FIREBASE_WEB_APP_ID = "你的 Web app ID"
$env:TAOYUAN_FIREBASE_MEASUREMENT_ID = "可選的 G- ID"
$env:TAOYUAN_ADMOB_APP_ID = "正式 AdMob app ID"
$env:TAOYUAN_ADMOB_REWARDED_ID = "正式 rewarded ad unit ID"
node build.js --release
```

開發 build 會保留 `REPLACE_WITH` 佔位值，因此沒有 Firebase 設定時仍可用訪客本機存檔；Google 按鈕會提示尚未設定。

4. 將 `firestore.rules` 部署到同一個 Firebase project。規則只允許登入者讀寫自己 UID 的文件。
5. 將本機開發網址與正式網域加入 Firebase Authentication 的 Authorized domains。

## Android Google Sign-In

1. 在 Firebase project 新增 Android app，application ID 必須是 `com.taitungray.taoyuanqunying`。
2. 登記開發／正式簽名的 SHA-1 與 SHA-256。
3. 下載該 project 的 `google-services.json` 放到 `android/app/google-services.json`。此檔案已被 `.gitignore` 排除，禁止提交。
4. 確認 `android/app/src/main/res/values/strings.xml` 的 `google_web_client_id` 已換成自己的 Web OAuth client ID；若存在 `google-services.json` 產生的 `default_web_client_id`，原生 bridge 會優先使用它。
5. 執行 `npx cap sync android` 後再建置 APK／AAB。

沒有自己的 Firebase 設定時，程式碼與 UI 仍會安全 fallback 到訪客模式，但不會假裝 Google 登入或雲端同步已啟用。

## 存檔與合併規則

- Google 帳號的本機快取鍵為 `taoyuan-cloud-save-{firebaseUid}`，訪客則使用獨立的 `taoyuan-guest-save-{id}`。
- 第一次 Google 登入會嘗試把登入前的訪客／舊版本機存檔上傳到該 Google 帳號；若雲端已有存檔，會以最新快照為主並合併關卡、解鎖、成就、武將等高水位紀錄。
- 金幣、糧草、玉璧等消耗型數值跟隨最新快照，避免把兩台裝置的消費直接相加。
- Firestore 只保存遊戲存檔與最低限度的 Google 顯示名稱、Email、provider 標記，不保存 Google 密碼或 OAuth token。
