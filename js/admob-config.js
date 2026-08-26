(function configureAdMob() {
  // 開發與 Web 預覽一律使用 Google 官方測試 rewarded unit。
  // 正式版由 build.js --release 注入自己的 unit，避免把別的專案 ID 帶過來。
  window.TAOYUAN_ADMOB_CONFIG = Object.freeze({
    appId: "ca-app-pub-3940256099942544~3347511713",
    rewardedAdUnitId: "ca-app-pub-3940256099942544/5224354917",
    releaseAppId: "REPLACE_WITH_YOUR_ADMOB_APP_ID",
    releaseRewardedAdUnitId: "REPLACE_WITH_YOUR_REWARDED_AD_UNIT_ID",
    isTesting: true
  });
}());
