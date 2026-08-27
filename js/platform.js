/* Platform-safe hooks: native integrations can attach without breaking Web/H5. */
"use strict";
(function () {
  const key = "taoyuan-platform-events";
  function readEvents() { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } }
  function track(name, payload = {}) {
    const events = readEvents();
    events.push({ name, payload, at: Date.now() });
    try { localStorage.setItem(key, JSON.stringify(events.slice(-80))); } catch {}
  }
  window.TaoyuanPlatform = Object.freeze({
    isNative: () => Boolean(window.Capacitor?.isNativePlatform?.()),
    track,
    requestNotifications: async () => {
      if (!("Notification" in window)) return "unsupported";
      if (Notification.permission === "granted") return "granted";
      try { return await Notification.requestPermission(); } catch { return "denied"; }
    },
    reportError: (error) => track("runtime_error", { message: String(error?.message || error) })
  });
})();
