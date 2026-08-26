# 三國：群英再起平台與發布規範

## 架構

- 根目錄 index.html、styles.css、game.js 是唯一的 Web 原始碼入口。
- node build.js 將 Web 檔案複製到 www/；Capacitor 只讀取 www/。
- package.json 固定 Capacitor 6 與 AdMob plugin 版本範圍。首次建立 Android wrapper 時執行 npm install、npx cap add android，之後用 npx cap sync android。
- manifest.json 與 sw.js 支援瀏覽器安裝和離線載入；Service Worker 不攔截外部網域。
- START_APP.bat 會同步 Web 產物、啟動本機伺服器並開啟瀏覽器；npm start 是相同流程的命令列版本。

## 開發與正式廣告

- 開發、Web 預覽使用 Google 官方測試 rewarded unit，不展示正式收益。
- window.TaoyuanAds.showRewardedAd() 是唯一廣告入口。它只允許使用者主動觸發，並在 rewarded event 後才發放獎勵。
- 不在戰鬥中插入強制廣告；初版只規劃離線軍資或每日補給的 rewarded ad。
- 正式建置必須以環境變數 TAOYUAN_ADMOB_APP_ID、TAOYUAN_ADMOB_REWARDED_ID 執行 node build.js --release。若仍是 REPLACE_WITH 會直接失敗。
- app-ads.txt 只能填入這個 application 的已驗證 publisher line，不能複製 IncenseAshes 的值。

## Android 發布

1. 確認 capacitor.config.json 的 application ID、名稱與商店帳號一致。
2. 執行 SETUP_ANDROID.bat 或 npm run setup:android，建立 Capacitor Android wrapper；再設定自己的簽名檔與 Gradle secrets。
3. 以發行環境設定廣告 ID，執行 npm run build:release 和 npx cap sync android。
4. npm run start:android 或 START_ANDROID_APP.bat 會同步 Web、安裝並啟動連接中的 Android 裝置／模擬器；npm run start:android:studio 只開啟 Android 專案資料夾。
5. 使用 scripts/build-release.ps1、打包APK.bat 或 npm run build:android 產生 AAB，並在 builds/ 同時保存 APK（除非使用 SkipApk）。腳本不建立預設密碼金鑰，也不包含任何憑證。
6. 未提供正式 AdMob ID、Android wrapper 或簽名設定時，腳本會明確停止並提示，不會偷偷使用參考專案設定。
7. 上架前完成隱私政策、Data safety、內容分級、廣告聲明、測試軌與 Play App Signing。

## 不可移植項目

參考專案的 Firebase project ID、google-services.json、keystore、upload certificate、正式 AdMob ID、商店截圖與神明素材都是專案專屬資料，本專案不會自動複製。
