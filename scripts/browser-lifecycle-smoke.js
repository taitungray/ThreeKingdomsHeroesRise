"use strict";

/**
 * Background browser lifecycle regression for the complete combat outcome loop.
 * Covers campaign win/lose, settlement continue/retry/close, alternate modes,
 * corrupt-save recovery, rapid HUD input and local request/console failures.
 * Does not open a visible browser window.
 */

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.LIFECYCLE_QA_PORT) || 8809;
const serveBuiltOutput = process.argv.includes("--www");

async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i += 1) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => { res.resume(); resolve(); });
        req.on("error", reject);
        req.setTimeout(500, () => req.destroy(new Error("timeout")));
      });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }
  throw new Error("dev server did not start");
}

async function main() {
  const args = [path.join(root, "scripts", "dev-server.js"), "--port", String(port)];
  if (serveBuiltOutput) args.push("--www");
  const server = spawn(process.execPath, args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let browser;
  const failures = [];
  const pageErrors = [];
  const localRequestFailures = [];
  try {
    await waitForServer("http://127.0.0.1:" + port + "/");
    const { chromium } = require("playwright");
    const browserExecutable = [
      process.env.PLAYWRIGHT_CHROMIUM_PATH,
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
    ].find((candidate) => candidate && fs.existsSync(candidate));
    browser = await chromium.launch({ headless: true, ...(browserExecutable ? { executablePath: browserExecutable } : {}) });
    const page = await browser.newPage({ viewport: { width: 390, height: 720 }, deviceScaleFactor: 1 });
    page.on("pageerror", (error) => pageErrors.push(String(error.stack || error)));
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) pageErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      if (request.url().startsWith("http://127.0.0.1:" + port)) localRequestFailures.push({ url: request.url(), error: request.failure()?.errorText || "request failed" });
    });
    await page.route("**/sw.js*", (route) => route.abort());
    await page.addInitScript(() => {
      const guestId = "qa-lifecycle";
      localStorage.setItem("taoyuan-guest-profile-v2", JSON.stringify({ id: guestId, displayName: "Lifecycle QA", createdAt: 1 }));
      localStorage.setItem("taoyuan-guest-save-" + guestId, JSON.stringify({ version: 3, tutorialStep: 999, tutorialDone: true, lastSeen: Date.now() }));
    });
    await page.goto("http://127.0.0.1:" + port + "/?qa=lifecycle&bust=" + Date.now(), { waitUntil: "domcontentloaded", timeout: 60000 });
    const authGuest = page.locator('#authGuest');
    await authGuest.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await authGuest.isVisible().catch(() => false)) await authGuest.click({ timeout: 5000 });
    await page.waitForFunction(() => {
      return Boolean(window.TaoyuanBattle?.peek) && !window.TaoyuanBattle.peek().booting;
    }, { timeout: 25000 });
    await page.waitForTimeout(700); // lifecycle boot settled

    const evaluateOutcome = async (mode, fixture = {}) => page.evaluate(({ mode, fixture }) => {
      const rt = Function("return runtime")();
      const save = Function("return save")();
      const wave = Function("return waveCleared")();
      rt.mode = mode;
      rt.spawning = false;
      rt.battleResult = null;
      rt.waveClears = 0;
      rt.bossActive = true;
      rt.enemies = [{ id: "qa-boss", type: "boss", dead: true, hp: 0, maxHp: 100, x: 195, y: 260 }];
      rt.arenaOpponent = fixture.arenaOpponent || null;
      rt.dungeonId = fixture.dungeonId || null;
      rt.towerFloor = fixture.towerFloor || 1;
      rt.trialId = fixture.trialId || null;
      save.arena ||= { wins: 0, attempts: 0, claimed: [], week: "qa" };
      save.arena.claimed = [];
      save.dungeons ||= { date: "qa", claimed: {} };
      save.dungeons.claimed = {};
      if (mode === "trial" && !rt.trialId) rt.trialId = window.HERO_FATE_TRIALS?.[0]?.id || null;
      wave();
      return {
        mode,
        result: rt.battleResult,
        modal: Boolean(document.getElementById("settlementModal") && !document.getElementById("settlementModal").hidden),
        title: document.getElementById("settlementTitle")?.textContent || "",
        primary: document.getElementById("settlementPrimary")?.dataset?.settlementAction || "",
        secondary: document.getElementById("settlementSecondary")?.dataset?.settlementAction || ""
      };
    }, { mode, fixture });

    const campaignWin = await evaluateOutcome("campaign");
    if (!campaignWin.modal || campaignWin.result?.type !== "win" || campaignWin.primary !== "continue" || campaignWin.secondary !== "retry") failures.push("campaign win settlement actions are incomplete: " + JSON.stringify(campaignWin));
    await page.evaluate(() => document.getElementById("settlementSecondary")?.click());
    await page.waitForTimeout(150);
    const retryAfterWin = await page.evaluate(() => {
      const rt = Function("return runtime")();
      return { modal: !document.getElementById("settlementModal")?.hidden, result: rt.battleResult, spawning: rt.spawning, enemies: rt.enemies.length, allies: rt.allies.length };
    });
    if (retryAfterWin.modal || retryAfterWin.result || retryAfterWin.spawning || retryAfterWin.enemies < 1 || retryAfterWin.allies < 1) failures.push("campaign win retry did not restart a clean battle: " + JSON.stringify(retryAfterWin));

    const campaignLose = await page.evaluate(() => {
      const rt = Function("return runtime")();
      rt.mode = "campaign";
      rt.spawning = false;
      rt.battleResult = null;
      rt.enemies = [];
      rt.allies.forEach((ally) => { ally.dead = true; ally.hp = 0; });
      Function("return partyDefeated")()();
      return {
        result: rt.battleResult,
        modal: Boolean(document.getElementById("settlementModal") && !document.getElementById("settlementModal").hidden),
        title: document.getElementById("settlementTitle")?.textContent || "",
        primary: document.getElementById("settlementPrimary")?.dataset?.settlementAction || "",
        secondary: document.getElementById("settlementSecondary")?.dataset?.settlementAction || ""
      };
    });
    if (!campaignLose.modal || campaignLose.result?.type !== "lose" || campaignLose.primary !== "retry" || campaignLose.secondary !== "close") failures.push("campaign lose settlement actions are incomplete: " + JSON.stringify(campaignLose));
    await page.evaluate(() => document.getElementById("settlementPrimary")?.click());
    await page.waitForTimeout(180);
    const retryAfterLose = await page.evaluate(() => {
      const rt = Function("return runtime")();
      return { modal: !document.getElementById("settlementModal")?.hidden, result: rt.battleResult, spawning: rt.spawning, enemies: rt.enemies.length, alliesAlive: rt.allies.filter((ally) => !ally.dead).length };
    });
    if (retryAfterLose.modal || retryAfterLose.result || retryAfterLose.spawning || retryAfterLose.enemies < 1 || retryAfterLose.alliesAlive < 1) failures.push("campaign lose retry did not revive and restart the party: " + JSON.stringify(retryAfterLose));

    await page.evaluate(() => {
      const key = window.TaoyuanGameState?.getSaveKey?.() || "taoyuan-qunying-v2";
      localStorage.setItem(key, "{corrupt-save");
    });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => Boolean(window.TaoyuanBattle?.peek) && !window.TaoyuanBattle.peek().booting, { timeout: 25000 });
    await page.waitForTimeout(650);
    const recovered = await page.evaluate(() => ({ stage: window.TaoyuanBattle.getSave?.()?.stage, allies: window.TaoyuanBattle.peek?.().allies, modal: !document.getElementById("settlementModal")?.hidden }));
    if (recovered.stage !== 1 || recovered.allies < 1 || recovered.modal) failures.push("corrupt-save recovery did not return to a clean default state: " + JSON.stringify(recovered));

    const modes = [
      ["arena", { arenaOpponent: "arena-1" }],
      ["dungeon", { dungeonId: "dungeon-gold" }],
      ["tower", { towerFloor: 1 }],
      ["trial", { trialId: "trial-liubei" }]
    ];
    const alternateModes = [];
    for (const [mode, fixture] of modes) {
      if (mode === 'arena') fixture.arenaOpponent = 'ghost-1';
      if (mode === 'dungeon') fixture.dungeonId = 'coin-vault';
      const outcome = await evaluateOutcome(mode, fixture);
      alternateModes.push(outcome);
      if (!outcome.modal || outcome.result?.type !== "win" || outcome.result?.mode !== mode) failures.push(mode + " win did not produce a mode-specific settlement: " + JSON.stringify(outcome));
      await page.evaluate(() => document.getElementById("settlementSecondary")?.click());
      await page.waitForTimeout(100);
    }

    const rapidInput = await page.evaluate(() => {
      const button = document.getElementById("speedButton");
      for (let i = 0; i < 24; i += 1) button?.click();
      const speed = Function("return runtime")().playSpeed;
      return { speed, text: button?.textContent || "" };
    });
    if (![1, 2, 4].includes(rapidInput.speed) || !/×[124]/.test(rapidInput.text)) failures.push("rapid speed input left an invalid state: " + JSON.stringify(rapidInput));

    const report = { target: serveBuiltOutput ? "www" : "source", alternateModes, rapidInput, corruptSaveRecovered: recovered, pageErrors: pageErrors.slice(0, 12), localRequestFailures: [...new Map(localRequestFailures.map((failure) => [failure.url + "|" + failure.error, failure])).values()], failures };
    console.log(JSON.stringify(report, null, 2));
    if (pageErrors.length) failures.push("browser console/page errors: " + pageErrors.slice(0, 5).join(" | "));
    if (localRequestFailures.length) failures.push("local game resources failed: " + JSON.stringify(localRequestFailures));
    if (failures.length) throw new Error("lifecycle smoke failed: " + failures.join(" | "));
    console.log("Browser lifecycle smoke PASSED");
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
