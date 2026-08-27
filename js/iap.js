/* Optional native IAP bridge. Web builds expose a truthful disabled fallback. */
"use strict";
(function () {
  const native = () => Boolean(window.Capacitor?.isNativePlatform?.());
  window.TaoyuanIAP = Object.freeze({
    isAvailable: native,
    purchase: async (productId) => {
      if (!native()) return { ok: false, reason: "native-required", productId };
      const bridge = window.Capacitor?.Plugins?.Purchase;
      if (!bridge?.purchase) return { ok: false, reason: "store-plugin-missing", productId };
      try { return { ok: true, productId, result: await bridge.purchase({ productId }) }; } catch (error) { return { ok: false, reason: String(error?.message || error), productId }; }
    },
    restore: async () => {
      if (!native()) return { ok: false, reason: "native-required" };
      const bridge = window.Capacitor?.Plugins?.Purchase;
      if (!bridge?.restorePurchases) return { ok: false, reason: "store-plugin-missing" };
      try { return { ok: true, result: await bridge.restorePurchases() }; } catch (error) { return { ok: false, reason: String(error?.message || error) }; }
    }
  });
})();
