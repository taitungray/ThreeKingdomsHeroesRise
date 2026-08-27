"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const root = path.resolve(__dirname, "..");
const port = 8799;
const serveBuiltOutput = process.argv.includes("--www");

async function waitForServer(url, tries = 50) {
  for (let i = 0; i < tries; i += 1) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => { res.resume(); resolve(); });
        req.on("error", reject);
        req.setTimeout(400, () => req.destroy(new Error("timeout")));
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  throw new Error("dev server did not start");
}

async function main() {
  const serverArgs = [path.join(root, "scripts", "dev-server.js"), "--port", String(port)];
  if (serveBuiltOutput) serverArgs.push("--www");
  const server = spawn(process.execPath, serverArgs, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"]
  });
  try {
    await waitForServer("http://127.0.0.1:" + port + "/");
    const { chromium } = require("playwright");
    const browserExecutable = [
      process.env.PLAYWRIGHT_CHROMIUM_PATH,
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
    ].find((candidate) => candidate && fs.existsSync(candidate));
    const browser = await chromium.launch({ headless: true, ...(browserExecutable ? { executablePath: browserExecutable } : {}) });
    const page = await browser.newPage({ viewport: { width: 390, height: 720 }, deviceScaleFactor: 1 });
    await page.addInitScript(() => {
      // This suite isolates combat from first-run auth/tutorial behavior. Seed a
      // deterministic local guest before any game script reads localStorage.
      const guestId = "qa-browser";
      localStorage.setItem("taoyuan-guest-profile-v2", JSON.stringify({ id: guestId, displayName: "QA", createdAt: 1 }));
      localStorage.setItem("taoyuan-guest-save-" + guestId, JSON.stringify({
        version: 3,
        tutorialStep: 999,
        tutorialDone: true,
        lastSeen: Date.now()
      }));
      window.__combatDrawStats = {
        body: 0,
        weapon: 0,
        boss: 0,
        samples: [],
        transforms: { count: 0, maxAxis: 0, minE: Infinity, maxE: -Infinity, minF: Infinity, maxF: -Infinity }
      };
      const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function patchedDrawImage(image, ...args) {
        const src = String(image?.currentSrc || image?.src || "");
        const kind = src.includes("combat-body-") ? "body" : src.includes("combat-weapon-") ? "weapon" : /\/boss-[^/]+-v1\.webp/.test(src) ? "boss" : null;
        if (kind && window.__combatDrawStats) {
          window.__combatDrawStats[kind] += 1;
          const transform = this.getTransform();
          const bounds = window.__combatDrawStats.transforms;
          bounds.count += 1;
          bounds.maxAxis = Math.max(bounds.maxAxis, Math.abs(transform.a), Math.abs(transform.b), Math.abs(transform.c), Math.abs(transform.d));
          bounds.minE = Math.min(bounds.minE, transform.e);
          bounds.maxE = Math.max(bounds.maxE, transform.e);
          bounds.minF = Math.min(bounds.minF, transform.f);
          bounds.maxF = Math.max(bounds.maxF, transform.f);
          if (window.__combatDrawStats.samples.length < 8) {
            window.__combatDrawStats.samples.push({ kind, src: src.split("/").pop(), alpha: this.globalAlpha, transform: [transform.a, transform.b, transform.c, transform.d, transform.e, transform.f], args });
          }
        }
        return originalDrawImage.call(this, image, ...args);
      };
    });
    const pageErrors = [];
    const requestFailures = [];
    page.on("pageerror", (err) => pageErrors.push(String(err.stack || err)));
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().startsWith("Failed to load resource:")) pageErrors.push(msg.text());
    });
    page.on("requestfailed", (request) => requestFailures.push({ url: request.url(), error: request.failure()?.errorText || "request failed" }));

    await page.goto("http://127.0.0.1:" + port + "/index.html?bust=" + Date.now(), {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // Dismiss auth after its async Firebase/guest state resolves. A fixed sleep
    // can race the gate and leave the tutorial visible behind an auth overlay.
    const authGuest = page.locator("#authGuest");
    await authGuest.waitFor({ state: "visible", timeout: 4000 }).catch(() => {});
    if (await authGuest.isVisible().catch(() => false)) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {}),
        authGuest.click({ timeout: 5000 })
      ]);
    }
    await page.waitForFunction(() => Boolean(window.TaoyuanBattle?.peek), { timeout: 20000 });
    // showTutorial is intentionally delayed 420 ms after boot. Wait beyond that
    // point so this combat-only check cannot race a guest-login reload.
    await page.waitForTimeout(600);
    const tutorialSkip = page.locator("#tutorialSkip");
    if (await tutorialSkip.isVisible().catch(() => false)) {
      await tutorialSkip.click();
      await page.waitForTimeout(250);
    }

    const first = await page.evaluate(() => window.TaoyuanBattle.peek());
    await page.waitForTimeout(2000);
    const second = await page.evaluate(() => window.TaoyuanBattle.peek());
    const kicked = await page.evaluate(() => window.TaoyuanBattle.kick());
    await page.waitForTimeout(1500);
    let third = await page.evaluate(() => window.TaoyuanBattle.peek());
    if (third.spawning && third.enemies === 0) {
      await page.waitForFunction(() => {
        const state = window.TaoyuanBattle?.peek?.();
        return state && (!state.spawning || state.enemies > 0);
      }, { timeout: 3000 }).catch(() => {});
      third = await page.evaluate(() => window.TaoyuanBattle.peek());
    }

    const moved = JSON.stringify(first.positions) !== JSON.stringify(second.positions)
      || JSON.stringify(second.positions) !== JSON.stringify(third.positions)
      || first.elapsed !== second.elapsed
      || second.elapsed !== third.elapsed;
    const uniqueRequestFailures = [...new Map(requestFailures.map((failure) => [failure.url + "|" + failure.error, failure])).values()];
    const localRequestFailures = uniqueRequestFailures.filter((failure) => failure.url.startsWith("http://127.0.0.1:" + port));
    const externalRequestFailures = uniqueRequestFailures.filter((failure) => !failure.url.startsWith("http://127.0.0.1:" + port));
    const uiState = await page.evaluate(() => Object.fromEntries(["loadingScreen", "authScreen", "tutorialLayer", "panelBackdrop", "settlementModal", "offlineModal", "battleScreen"].map((id) => {
      const element = document.getElementById(id);
      if (!element) return [id, null];
      const style = getComputedStyle(element);
      return [id, { hidden: element.hidden, display: style.display, visibility: style.visibility, opacity: style.opacity, filter: style.filter }];
    })));
    const assetState = await page.evaluate(() => {
      const heroes = (window.THREE_KINGDOMS_DATA?.heroes || []).slice(0, 4).map((hero) => {
        const image = window.TaoyuanAssets?.cache?.get(hero.combatSprite);
        return { id: hero.id, path: hero.combatSprite, loaded: Boolean(image?.complete && image?.naturalWidth), width: image?.naturalWidth || 0, height: image?.naturalHeight || 0 };
      });
      const images = [...(window.TaoyuanAssets?.cache?.entries?.() || [])];
      return { declared: images.length, loaded: images.filter(([, image]) => image.complete && image.naturalWidth).length, heroes };
    });
    const drawStats = await page.evaluate(() => window.__combatDrawStats);
    const screenshotPath = process.env.COMBAT_QA_SCREENSHOT || "";
    if (screenshotPath) {
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    await browser.close();
    console.log(JSON.stringify({ target: serveBuiltOutput ? "www" : "source", browserExecutable: browserExecutable || "playwright-bundled", screenshotPath: screenshotPath || null, uiState, assetState, drawStats, first, second, kicked, third, moved, pageErrors: pageErrors.slice(0, 12), localRequestFailures, externalRequestFailures }, null, 2));

    if (!moved) throw new Error("units/elapsed did not change — AI freeze confirmed in browser");
    if (third.spawning && third.enemies === 0) throw new Error("spawning remained stuck with no enemies beyond the allowed transition window");
    if (!drawStats || drawStats.body < 1) throw new Error("combat body assets loaded but were never drawn to the Canvas");
    const bounds = drawStats.transforms || {};
    if (!bounds.count || bounds.maxAxis > 3.5 || bounds.minE < -100 || bounds.maxE > 490 || bounds.minF < -150 || bounds.maxF > 800) {
      throw new Error("combat draw transform bounds escaped the Canvas; save/restore may be unbalanced: " + JSON.stringify(bounds));
    }
    const escapedDraws = (drawStats.samples || []).filter((sample) => {
      const [a, b, c, d, e, f] = sample.transform;
      return Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d)) > 3.5 || e < -100 || e > 490 || f < -150 || f > 800;
    });
    if (escapedDraws.length) throw new Error("combat draw transforms escaped the Canvas; save/restore may be unbalanced: " + JSON.stringify(escapedDraws));
    for (const id of ["loadingScreen", "authScreen", "tutorialLayer", "panelBackdrop", "settlementModal", "offlineModal"]) {
      if (uiState[id] && uiState[id].display !== "none") throw new Error(`${id} still blocks the battle during browser QA`);
    }
    if (localRequestFailures.length) throw new Error("local game resources failed: " + JSON.stringify(localRequestFailures));
    if (pageErrors.length) throw new Error("browser console/page errors: " + pageErrors.slice(0, 5).join(" | "));
    if (externalRequestFailures.length) console.warn("External resources were unavailable in this environment:", externalRequestFailures);
    console.log("Browser combat freeze check PASSED");
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
