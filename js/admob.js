(function installTaoyuanAds() {
  "use strict";

  const TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917";
  const PROD_REWARDED_ID = "ca-app-pub-5128536500084993/8801564103";
  const configured = window.TAOYUAN_ADMOB_CONFIG || {};
  const state = {
    initialized: false,
    initializing: null,
    showing: false,
    preparing: null
  };

  function nativeAdMob() {
    return window.Capacitor?.Plugins?.AdMob || null;
  }

  function activeRewardedId() {
    if (configured.isTesting) return TEST_REWARDED_ID;
    return configured.rewardedAdUnitId || PROD_REWARDED_ID;
  }

  async function init() {
    if (state.initialized) return true;
    if (state.initializing) return state.initializing;
    const plugin = nativeAdMob();
    if (!plugin) return false;
    state.initializing = (async () => {
      try {
        await plugin.initialize({
          initializeForTesting: Boolean(configured.isTesting),
          testingDevices: [],
          maxAdContentRating: "General",
          tagForUnderAgeOfConsent: false,
          tagForChildDirectedTreatment: false
        });
        state.initialized = true;
        return true;
      } catch (error) {
        console.warn("[TaoyuanAds] initialize failed", error);
        return false;
      } finally {
        state.initializing = null;
      }
    })();
    return state.initializing;
  }

  async function prepare() {
    const plugin = nativeAdMob();
    if (!plugin || state.preparing) return state.preparing || false;
    state.preparing = (async () => {
      try {
        await init();
        await plugin.prepareRewardVideoAd({
          adId: activeRewardedId(),
          isTesting: Boolean(configured.isTesting),
          npa: true,
          immersiveMode: true
        });
        return true;
      } catch (error) {
        console.warn("[TaoyuanAds] prepare failed", error);
        return false;
      } finally {
        state.preparing = null;
      }
    })();
    return state.preparing;
  }

  async function showRewardedAd(options = {}) {
    if (state.showing) return false;
    state.showing = true;
    const plugin = nativeAdMob();

    if (!plugin) {
      if (typeof window.openGameConfirm !== 'function') {
        state.showing = false;
        return false;
      }
      if (typeof window.openGameConfirm === 'function') {
        const accepted = await window.openGameConfirm(
          String.fromCodePoint(35264, 30475, 24291, 21578),
          String.fromCodePoint(35264, 30475, 30701, 29255, 24291, 21578, 24460, 21487, 38936, 21462, 38989, 22806, 29518, 21237, 21966, 65311)
        );
        state.showing = false;
        if (accepted) options.onReward?.();
        return accepted;
      }
      const accepted = window.confirm("這是 Web 預覽用的廣告模擬。觀看後領取獎勵？");
      state.showing = false;
      if (accepted) options.onReward?.();
      return accepted;
    }

    await init();
    const prepared = await prepare();
    if (!prepared) {
      state.showing = false;
      return false;
    }
    return new Promise(async (resolve) => {
      let rewarded = false;
      let settled = false;
      const handles = [];
      const finish = (value) => {
        if (settled) return;
        settled = true;
        handles.forEach((handle) => handle?.remove?.());
        state.showing = false;
        if (value) options.onReward?.();
        prepare();
        resolve(Boolean(value));
      };
      const timeout = window.setTimeout(() => finish(false), 45000);
      try {
        handles.push(await plugin.addListener("onRewardedVideoAdReward", () => {
          rewarded = true;
        }));
        handles.push(await plugin.addListener("onRewardedVideoAdDismissed", () => {
          window.clearTimeout(timeout);
          finish(rewarded);
        }));
        handles.push(await plugin.addListener("onRewardedVideoAdFailedToShow", () => {
          window.clearTimeout(timeout);
          finish(false);
        }));
        await plugin.showRewardVideoAd();
      } catch (error) {
        window.clearTimeout(timeout);
        console.warn("[TaoyuanAds] show failed", error);
        finish(false);
      }
    });
  }

  window.TaoyuanAds = Object.freeze({
    init,
    prepare,
    showRewardedAd,
    isNative: () => Boolean(nativeAdMob()),
    isTesting: () => configured.isTesting !== false
  });

  // 頁面載入時只初始化/預載，不主動彈廣告。
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init().then(() => prepare());
    }, { once: true });
  } else {
    init().then(() => prepare());
  }
}());
