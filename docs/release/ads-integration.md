# 廣告接口規格

狀態：RELEASE PROCEDURE。描述 rewarded ad 的產品與發獎契約，不代表正式 AdMob 已設定。

目前版本只預留 rewarded ad，不會在 Web 預覽中強制顯示廣告。

## 建議放置

- 離線收益視窗：使用者選擇觀看後，將離線銅錢與糧草提高一次。
- 每日補給：每日最多一次，獎勵固定且可在 UI 先看見。
- 不在戰鬥過程中插入 interstitial，也不以誤觸方式放置廣告按鈕。

## 發獎規則

1. 按鈕文字必須明確包含「觀看廣告」。
2. 先呼叫 TaoyuanAds.showRewardedAd({ onReward })，不要先加資源。
3. 只有 plugin 的 rewarded event 且廣告正常結束時才呼叫 onReward。
4. 失敗、跳過、逾時或重複點擊都不給獎勵。
5. 送出獎勵後立即 persist()，並在 UI 顯示結果。

## 實作與合規

- 開發 ID 固定使用 Google test ID；正式 ID 只由 release build 的環境變數注入。
- 使用 General 內容分級、非兒童導向設定；若日後改變目標族群，須同步檢查 Play Families 政策。
- 上架前補齊真實 publisher line、隱私政策 URL、Data safety 與商店中的含廣告聲明。
