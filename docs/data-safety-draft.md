# Data safety 草稿

本專案已加入可選的 Google 登入與 Firebase Cloud Firestore 雲端存檔。正式送審前，請以實際 Firebase、Google Sign-In、AdMob SDK 與建置設定重新核對本文件。

## 目前會處理的資料

- Google 登入：Firebase UID、顯示名稱、Email、provider 與登入工作階段。
- 雲端存檔：玩家在遊戲內的關卡、武將、資源、成就、設定與同步時間。
- 本機資料：Firebase Auth 工作階段、訪客存檔、登入前待遷移存檔與雲端同步狀態。
- 廣告：rewarded ad 請求與 Google Mobile Ads 實際 SDK 可能產生的裝置／診斷資料，依正式 SDK 與同意流程填寫。

## 儲存與安全

Firestore 文件位於 `taoyuan_qunying_saves/{Firebase UID}`，規則只允許 `request.auth.uid` 相同的登入者讀寫。Google 密碼與 OAuth token 不寫入遊戲存檔。`android/app/google-services.json`、簽名檔及正式服務設定不應提交到 Git。

## 送審前待辦

1. 填入自己的 Firebase Web config、Google OAuth client、Android SHA-1／SHA-256 與 `google-services.json`。
2. 啟用 Google provider、部署 `firestore.rules`，並確認 Authorized domains。
3. 以真實 production build 測試登入、首次同步、跨裝置同步、登出、刪除網站資料與離線 fallback。
4. 依實際 SDK 行為完成 Google Play Data safety、隱私政策、帳號刪除／資料刪除流程與支援聯絡方式。