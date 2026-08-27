# Google Play 上架清單

狀態：RELEASE PROCEDURE。以下是每次送審都要核對的程序，不是目前進度表；實際未完成項目見 [目前工作清單](../work/active-backlog.md)。

1. 確認 `com.taitungray.taoyuanqunying` 是否為最終 application ID；發布後不任意變更。
2. 建立 512×512 PNG icon、1024×500 feature graphic 與至少 3 張直式遊戲截圖。
3. 提供公開可存取的繁體中文隱私政策 URL。
4. 依 production build 的 Firebase、Google Sign-In 與 AdMob 行為填寫 Data safety。
5. 完成內容分級、目標受眾與含廣告聲明。
6. 將自己的 publisher line 部署到網站根目錄 `app-ads.txt`。
7. 以自己的 keystore 和 Play App Signing 建立 signed AAB；金鑰不得進入 Git。
8. 先走 internal／closed test，驗證離線收益、存檔、旋轉鎖定與廣告成功／失敗路徑。
9. 準備支援信箱、資料刪除／保留說明、版本更新說明與審核登入資訊。
