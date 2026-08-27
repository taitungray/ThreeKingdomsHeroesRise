/* Input and boot: event listeners, offline reward and startup */
"use strict";

document.querySelectorAll("[data-panel]").forEach((button) => {
  button.addEventListener("click", () => openPanel(button.dataset.panel));
});

$("profileButton").addEventListener("click", () => openPanel("profile"));
$("panelClose").addEventListener("click", closePanel);
$("panelBackdrop").addEventListener("click", (event) => {
  if (event.target === $("panelBackdrop")) closePanel();
});
$("panelBack").addEventListener("click", () => {
  if (runtime.panel === "formation") renderFormation();
  else renderHeroes();
});
$("panelContent").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (button) handlePanelAction(button);
});
document.addEventListener("pointerdown", (event) => {
  if (event.target?.closest?.("button")) window.TaoyuanAudio?.sfx?.("click");
}, { passive: true });

$("autoButton").addEventListener("click", () => {
  runtime.auto = !runtime.auto;
  if (runtime.auto && runtime.waveClears >= 3 && !runtime.bossActive && !runtime.spawning) spawnWave(true);
  updateHud();
  toast(runtime.auto ? "自動戰鬥已開啟" : "戰鬥已暫停");
});

$("speedButton").addEventListener("click", () => {
  const speeds = save.maxStage >= 5 ? [1, 2, 4] : [1, 2];
  const index = speeds.indexOf(runtime.timeScale);
  runtime.timeScale = speeds[(index + 1) % speeds.length];
  updateHud();
  toast("\u6230\u9b25\u901f\u5ea6 ×" + runtime.timeScale);
});

$("bossButton").addEventListener("click", () => {
  if (runtime.waveClears >= 3 && !runtime.bossActive && !runtime.spawning) spawnWave(true);
});

$("claimOffline").addEventListener("click", () => {
  if (!runtime.pendingOffline) return;
  save.gold += runtime.pendingOffline.gold;
  save.food += runtime.pendingOffline.food;
  recordTaskProgress("daily-claim");
  runtime.pendingOffline = null;
  $("offlineModal").hidden = true;
  persist();
  updateHud();
  toast("離線軍資已收入府庫");
  beep(720, .14, "triangle", .04);
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
  if (!runtime.auto) {
    const ally = runtime.allies.find((unit) => !unit.dead && Math.hypot(unit.x - x, unit.y - y) < 34);
    if (ally) {
      if (ally.attackCount < 5 || ally.skillCooldown > 0) return toast("該武將戰法尚未準備");
      if (hasStatus(ally, "silence")) return toast("該武將目前被沉默");
      const target = nearestTarget(ally, runtime.enemies).target;
      if (target) {
        useHeroSkill(ally, target);
        toast(ally.hero.name + " 手動施放「" + ally.hero.skill + "」");
      }
    }
  }
});

function stopRuntimeTimers() {
  clearInterval(runtime.hudTimerId);
  clearInterval(runtime.persistTimerId);
  runtime.hudTimerId = 0;
  runtime.persistTimerId = 0;
}

function startRuntimeTimers() {
  stopRuntimeTimers();
  runtime.hudTimerId = setInterval(() => {
    if (!document.hidden && !runtime.backgrounded) updateHud();
  }, 350);
  runtime.persistTimerId = setInterval(() => {
    if (!document.hidden) persist();
  }, 5000);
}

function stopGameLoop() {
  if (runtime.rafId) cancelAnimationFrame(runtime.rafId);
  runtime.rafId = 0;
}

function startGameLoop() {
  if (!runtime.backgrounded && !document.hidden && !runtime.rafId) runtime.rafId = requestAnimationFrame(gameLoop);
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
  runtime.backgrounded = false;
  runtime.lastTime = performance.now();
  save.lastSeen = Date.now();
  persist();
  if (secondsAwayFromBattle >= 90 && !runtime.pendingOffline) showOfflineReward(secondsAwayFromBattle);
  startRuntimeTimers();
  startGameLoop();
});
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



$("tutorialNext").addEventListener("click", advanceTutorial);
$("tutorialSkip").addEventListener("click", () => {
  save.tutorialDone = true;
  persist();
  $("tutorialLayer").hidden = true;
});
document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("#settlementPrimary, #settlementSecondary");
  if (!button || $("settlementModal").hidden) return;
  closeSettlement(button.dataset.settlementAction || "close");
});
$("settlementPrimary").addEventListener("click", () => {
  if ($("settlementModal").hidden) return;
  closeSettlement($("settlementPrimary").dataset.settlementAction || "close");
});
$("settlementSecondary").addEventListener("click", () => {
  if ($("settlementModal").hidden) return;
  closeSettlement($("settlementSecondary").dataset.settlementAction || "close");
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!$("tutorialLayer").hidden) return;
  if (!$("settlementModal").hidden) closeSettlement("close");
  else if (!$("panelBackdrop").hidden) closePanel();
});
window.addEventListener("error", (event) => window.TaoyuanPlatform?.reportError?.(event.error || event.message));
scheduleGameTimer(() => {
  $("loadingScreen").hidden = true;
  showTutorial();
}, 420);

$("doubleOffline").addEventListener("click", async () => {
  if (!runtime.pendingOffline) return;
  const button = $("doubleOffline");
  button.disabled = true;
  const reward = { ...runtime.pendingOffline };
  const accepted = save.adFree || await window.TaoyuanAds.showRewardedAd({ onReward: () => {} });
  button.disabled = false;
  if (!accepted) return toast("\u5ee3\u544a\u5c1a\u672a\u5b8c\u6210");
  save.gold += reward.gold * 2;
  save.food += reward.food * 2;
  recordTaskProgress("daily-claim");
  runtime.pendingOffline = null;
  $("offlineModal").hidden = true;
  persist();
  updateHud();
  toast("\u96e2\u7dda\u8ecd\u8cc7\u5df2\u7ffb\u500d");
});
