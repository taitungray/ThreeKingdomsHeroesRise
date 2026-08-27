# 發布文件入口

狀態：PROCEDURE。此目錄描述「發布時如何做與必須滿足什麼」，不是目前待辦狀態。實際尚未完成的外部工作只在 [目前工作清單](../work/active-backlog.md) 維護。

## 文件

- [平台與發布規範](platform-and-release.md)：Web、PWA、Capacitor、Android、簽名與發布總流程。
- [Google 登入與雲端存檔](cloud-auth-setup.md)：Firebase、OAuth、Firestore 與 Android 設定。
- [廣告接口規格](ads-integration.md)：rewarded ad 行為、發獎與合規底線。
- [Google Play 提交程序](google-play-submission.md)：商店送審必查項目。
- [Data safety 草稿](data-safety-draft.md)：依實際 SDK 與資料流完成申報的基線。

IAP 的舊技術評估已移到 [歷史計畫](../archive/plans/payment-and-iap-plan.md)；正式選型與政策必須在實作當下重新查證，不能直接採用歷史費率或插件建議。

## 安全底線

- 不提交 `google-services.json`、keystore、upload certificate、服務帳號、OAuth secret、正式 AdMob ID 或其他祕密。
- 開發版只用測試 ID；正式建置缺少必要環境變數時必須停止。
- 不複製 IncenseAshes 或其他專案的 Firebase、廣告、簽名、商店素材與識別資料。
- 文件聲稱與實際 SDK 行為不同時，以實際 production build、政策與實機證據為準。
