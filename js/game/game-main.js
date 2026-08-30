/* Input and boot: event listeners, offline reward and startup */
"use strict";

window.TaoyuanBattle = window.TaoyuanBattle || {
  peek() {
    return { booting: true, allies: 0, enemies: 0, spawning: false, overlays: {} };
  }
};

document.querySelectorAll("[data-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    closeRailDrawer();
    openPanel(button.dataset.panel);
  });
});

$("railMoreButton")?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleRailDrawer();
});
$("railDrawerClose")?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeRailDrawer();
});

document.addEventListener("pointerdown", (event) => {
  if (event.target?.closest?.("button")) window.TaoyuanAudio?.sfx?.("click");
  if (!event.target?.closest?.(".right-rail, .right-rail-drawer, #railMoreButton")) closeRailDrawer();
}, { passive: true });

$("profileButton").addEventListener("click", () => {
  openPanel("profile");
});
$("panelClose").addEventListener("click", closePanel);
$("panelBackdrop").addEventListener("click", (event) => {
  if (event.target === $("panelBackdrop")) closePanel();
});
$("panelBack").addEventListener("click", () => {
  if (runtime.panel === "formation") renderFormation();
  else renderHeroes();
});
let holdActionTimer = null;
let holdActionInterval = null;

function clearHoldAction() {
  if (holdActionTimer) {
    clearTimeout(holdActionTimer);
    holdActionTimer = null;
  }
  if (holdActionInterval) {
    clearInterval(holdActionInterval);
    holdActionInterval = null;
  }
}

$("panelContent").addEventListener("pointerdown", (event) => {
  const button = event.target.closest("[data-action='hero-level'], [data-action='hero-skill'], [data-action='equipment-refine']");
  if (!button || button.disabled) return;
  clearHoldAction();
  
  holdActionTimer = setTimeout(() => {
    holdActionInterval = setInterval(() => {
      const heroId = button.dataset.hero;
      const action = button.dataset.action;
      const currentBtn = $("panelContent")?.querySelector('[data-action="' + action + '"][data-hero="' + heroId + '"]');
      if (!currentBtn || currentBtn.disabled) {
        clearHoldAction();
        return;
      }
      handlePanelAction(currentBtn);
    }, 85);
  }, 300);
});

document.addEventListener("pointerup", clearHoldAction);
document.addEventListener("pointercancel", clearHoldAction);
$("panelContent").addEventListener("pointerleave", clearHoldAction);

$("panelContent").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (button) handlePanelAction(button);
});

$("speedButton").addEventListener("click", () => {
  const speeds = save.maxStage >= 5 ? [1, 2, 4] : [1, 2];
  const index = speeds.indexOf(runtime.playSpeed);
  runtime.playSpeed = speeds[(index + 1) % speeds.length];
  runtime.timeScale = runtime.playSpeed;
  updateHud();
  toast("\u6230\u9b25\u901f\u5ea6 ×" + runtime.playSpeed);
});

$("bossButton").addEventListener("click", () => {
  if (runtime.waveClears >= 3 && !runtime.bossActive && !runtime.spawning) spawnWave(true);
});

$("claimOffline").addEventListener("click", () => {
  if (!runtime.pendingOffline) return;
  save.gold += runtime.pendingOffline.gold || 0;
  save.food += runtime.pendingOffline.food || 0;
  save.shards += runtime.pendingOffline.shards || 0;
  save.jade += runtime.pendingOffline.jade || 0;
  recordTaskProgress("daily-claim");
  runtime.pendingOffline = null;
  $("offlineModal").hidden = true;
  persist();
  updateHud();
  toast("離線軍資已收入府庫");
  window.TaoyuanAudio?.sfx?.("confirm");
});

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  // CSS object-fit keeps the fixed 390×720 world undistorted. Map input into
  // the displayed content box instead of treating the letterbox as gameplay.
  const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
  const contentWidth = canvas.width * scale;
  const contentHeight = canvas.height * scale;
  const offsetX = (rect.width - contentWidth) / 2;
  const offsetY = (rect.height - contentHeight) / 2;
  const x = (event.clientX - rect.left - offsetX) / scale;
  const y = (event.clientY - rect.top - offsetY) / scale;
  if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;

  addEffect("ring", x, y, "#d9d29e", { radius: 24, life: .3 });
});

function stopRuntimeTimers() {
  clearInterval(runtime.hudTimerId);
  clearInterval(runtime.persistTimerId);
  clearInterval(runtime.loopWatchId);
  runtime.hudTimerId = 0;
  runtime.persistTimerId = 0;
  runtime.loopWatchId = 0;
}

function startRuntimeTimers() {
  stopRuntimeTimers();
  runtime.hudTimerId = setInterval(() => {
    if (!document.hidden && !runtime.backgrounded) updateHud();
  }, 350);
  runtime.persistTimerId = setInterval(() => {
    if (!document.hidden) persist();
  }, 5000);
  // WebView/SW can silently drop rAF; keep a watchdog that restarts the battle clock.
  runtime.loopWatchId = setInterval(() => {
    if (document.hidden) return;
    runtime.backgrounded = false;
    const now = performance.now();
    const pulseAge = now - (runtime.loopPulse || 0);
    if (!runtime.rafId || pulseAge > 320) {
      runtime.rafId = 0;
      runtime.lastTime = now;
      startGameLoop();
      try {
        updateGame(1 / 30);
        render();
        runtime.loopPulse = performance.now();
      } catch (error) {
        console.error("Battle watchdog frame failed", error);
      }
    }
  }, 250);
}

function stopGameLoop() {
  if (runtime.rafId) cancelAnimationFrame(runtime.rafId);
  runtime.rafId = 0;
}

function startGameLoop() {
  if (!runtime.backgrounded && !document.hidden && !runtime.rafId) runtime.rafId = requestAnimationFrame(gameLoop);
}

function resumeBattleLoop() {
  runtime.backgrounded = false;
  runtime.lastTime = performance.now();
  startRuntimeTimers();
  if (!runtime.rafId) startGameLoop();
}

window.addEventListener("taoyuan-save-replaced", () => {
  runtime.activeStage = Math.max(1, Number(save.stage) || 1);
  runtime.waveClears = 0;
  runtime.bossActive = false;
  runtime.spawning = false;
  runtime.enemies = [];
  runtime.projectiles = [];
  runtime.numbers = [];
  runtime.damageStats = {};
  resetAllies();
  showEnemyPreview(activeStageNumber());
  updateHud();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    runtime.backgrounded = true;
    persist();
    stopRuntimeTimers();
    stopGameLoop();
    return;
  }
  const secondsAwayFromBattle = Math.max(0, (Date.now() - (save.lastSeen || Date.now())) / 1000);
  save.lastSeen = Date.now();
  persist();
  if (secondsAwayFromBattle >= 90 && !runtime.pendingOffline) showOfflineReward(secondsAwayFromBattle);
  resumeBattleLoop();
});
window.addEventListener("pageshow", resumeBattleLoop);
window.addEventListener("focus", resumeBattleLoop);
window.addEventListener("beforeunload", persist);

const secondsAway = Math.max(0, (Date.now() - (save.lastSeen || Date.now())) / 1000);
buildTerrain();
resetAllies();
showEnemyPreview(activeStageNumber());
recordStat("battles");
spawnWave(false);
updateHud();
showDialogue("張飛", "大哥，前方發現黃巾賊軍！", "avatar-zhangfei");
if (secondsAway >= 90) setTimeout(() => showOfflineReward(secondsAway), 500);
persist();
startRuntimeTimers();
startGameLoop();

window.TaoyuanBattle = {
  peek() {
    return {
      allies: runtime.allies.length,
      enemies: runtime.enemies.filter((unit) => !unit.dead).length,
      spawning: runtime.spawning,
      backgrounded: runtime.backgrounded,
      rafId: runtime.rafId,
      auto: runtime.auto,
      playSpeed: runtime.playSpeed,
      timeScale: runtime.timeScale,
      hitStop: runtime.hitStop,
      elapsed: runtime.elapsed,
      loopPulse: runtime.loopPulse || 0,
      positions: runtime.allies.slice(0, 5).map((unit) => [Math.round(unit.x), Math.round(unit.y), Math.round(unit.hp)]),
      enemyPositions: runtime.enemies.filter((unit) => !unit.dead).slice(0, 5).map((unit) => [Math.round(unit.x), Math.round(unit.y), Math.round(unit.entryY || unit.y)]),
      bossActive: runtime.bossActive,
      panel: runtime.panel,
      mode: runtime.mode,
      overlays: {
        preview: Boolean($("enemyPreview")?.classList.contains("show")),
        banner: Boolean($("bossBanner")?.classList.contains("show")),
        dialogue: Boolean($("dialogueBox")?.classList.contains("show")),
        settlement: Boolean($("settlementModal") && !$("settlementModal").hidden)
      }
    };
  },
  spawnBoss() {
    spawnWave(true, false);
    return this.peek();
  },
  startStageKeepPanel(stage) {
    startStage(stage || activeStageNumber(), "QA keep panel", { keepPanel: true });
    return this.peek();
  },
  openPanel(type) {
    openPanel(type);
    return this.peek();
  },
  closePanel() {
    closePanel();
    return this.peek();
  },
  getSave() {
    return save;
  },
  setStage(stage) {
    save.stage = Math.max(1, Number(stage) || 1);
    if (typeof persist === "function") persist();
    if (typeof updateHud === "function") updateHud();
    return this.peek();
  },
  kick() {
    runtime.backgrounded = false;
    runtime.spawning = false;
    runtime.hitStop = 0;
    runtime.auto = true;
    runtime.rafId = 0;
    resumeBattleLoop();
    return this.peek();
  }
};



$("tutorialNext")?.addEventListener("click", () => {
  if (typeof advanceTutorial === "function") advanceTutorial();
});
$("tutorialSkip")?.addEventListener("click", () => {
  save.tutorialDone = true;
  persist();
  const layer = $("tutorialLayer");
  if (layer) layer.hidden = true;
});
document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("#settlementPrimary, #settlementSecondary");
  if (!button || $("settlementModal").hidden) return;
  closeSettlement(button.dataset.settlementAction || "close");
});
$("settlementPrimary")?.addEventListener("click", () => {
  if ($("settlementModal")?.hidden) return;
  closeSettlement($("settlementPrimary")?.dataset?.settlementAction || "close");
});
$("settlementSecondary")?.addEventListener("click", () => {
  if ($("settlementModal")?.hidden) return;
  closeSettlement($("settlementSecondary")?.dataset?.settlementAction || "close");
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if ($("tutorialLayer") && !$("tutorialLayer").hidden) return;
  if ($("settlementModal") && !$("settlementModal").hidden) closeSettlement("close");
  else if ($("panelBackdrop") && !$("panelBackdrop").hidden) closePanel();
});
window.addEventListener("error", (event) => window.TaoyuanPlatform?.reportError?.(event.error || event.message));
scheduleGameTimer(() => {
  const loading = $("loadingScreen");
  if (loading) loading.hidden = true;
  if (typeof showTutorial === "function") showTutorial();
}, 420);

$("doubleOffline").addEventListener("click", async () => {
  if (!runtime.pendingOffline) return;
  const button = $("doubleOffline");
  button.disabled = true;
  const reward = { ...runtime.pendingOffline };
  const accepted = save.adFree || await window.TaoyuanAds.showRewardedAd({ onReward: () => {} });
  button.disabled = false;
  if (!accepted) return toast("廣告尚未完成");
  save.gold += (reward.gold || 0) * 2;
  save.food += (reward.food || 0) * 2;
  save.shards += (reward.shards || 0) * 2;
  save.jade += (reward.jade || 0) * 2;
  recordTaskProgress("daily-claim");
  runtime.pendingOffline = null;
  $("offlineModal").hidden = true;
  persist();
  updateHud();
  toast("離線軍資已雙倍入庫！");
  window.TaoyuanAudio?.sfx?.("reward");
});
