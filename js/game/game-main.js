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

$("autoButton").addEventListener("click", () => {
  runtime.auto = !runtime.auto;
  if (runtime.auto && runtime.waveClears >= 3 && !runtime.bossActive && !runtime.spawning) spawnWave(true);
  updateHud();
  toast(runtime.auto ? "自動戰鬥已開啟" : "戰鬥已暫停");
});

$("speedButton").addEventListener("click", () => {
  runtime.timeScale = runtime.timeScale === 1 ? 2 : 1;
  updateHud();
  toast("戰鬥速度 ×" + runtime.timeScale);
});

$("bossButton").addEventListener("click", () => {
  if (runtime.waveClears >= 3 && !runtime.bossActive && !runtime.spawning) spawnWave(true);
});

$("claimOffline").addEventListener("click", () => {
  if (!runtime.pendingOffline) return;
  save.gold += runtime.pendingOffline.gold;
  save.food += runtime.pendingOffline.food;
  runtime.pendingOffline = null;
  $("offlineModal").hidden = true;
  persist();
  updateHud();
  toast("離線軍資已收入府庫");
  beep(720, .14, "triangle", .04);
});

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * canvas.width;
  const y = (event.clientY - rect.top) / rect.height * canvas.height;
  addEffect("ring", x, y, "#d9d29e", { radius: 24, life: .3 });
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) persist();
  else runtime.lastTime = performance.now();
});
window.addEventListener("beforeunload", persist);

const secondsAway = Math.max(0, (Date.now() - (save.lastSeen || Date.now())) / 1000);
buildTerrain();
resetAllies();
showEnemyPreview(activeStageNumber());
spawnWave(false);
updateHud();
showDialogue("張飛", "大哥，前方發現黃巾賊軍！", "avatar-zhangfei");
if (secondsAway >= 90) setTimeout(() => showOfflineReward(secondsAway), 500);
persist();
setInterval(updateHud, 350);
setInterval(persist, 5000);
requestAnimationFrame(gameLoop);

