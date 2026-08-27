const { chromium } = require("playwright");
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");

const root = process.cwd();
const port = 8803;
const server = spawn(process.execPath, [path.join(root, "scripts/dev-server.js"), "--port", String(port)], {
  cwd: root,
  stdio: "ignore"
});

function waitForServer() {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 40; i += 1) {
      try {
        await new Promise((ok, bad) => {
          http.get("http://127.0.0.1:" + port + "/", (res) => {
            res.resume();
            ok();
          }).on("error", bad);
        });
        return resolve();
      } catch {
        await new Promise((x) => setTimeout(x, 100));
      }
    }
    reject(new Error("no server"));
  });
}

(async () => {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 420, height: 820 } });
  await page.goto("http://127.0.0.1:" + port + "/index.html?bust=" + Date.now(), {
    waitUntil: "networkidle",
    timeout: 60000
  });
  if (await page.locator("#authGuest").isVisible().catch(() => false)) {
    await page.locator("#authGuest").click();
  }
  await page.waitForFunction(() => window.TaoyuanBattle?.peek, { timeout: 20000 });
  for (let i = 0; i < 10; i += 1) {
    if (await page.locator("#tutorialSkip").isVisible().catch(() => false)) {
      await page.locator("#tutorialSkip").click();
      break;
    }
    if (await page.locator("#tutorialNext").isVisible().catch(() => false)) {
      await page.locator("#tutorialNext").click();
    }
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(2000);

  const result = await page.evaluate(() => {
    const peek = window.TaoyuanBattle.peek();
    const canvas = document.getElementById("battleCanvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const samples = peek.positions.map(([x, y]) => {
      let bright = 0;
      let dark = 0;
      let total = 0;
      for (let dy = -40; dy <= 0; dy += 2) {
        for (let dx = -12; dx <= 12; dx += 2) {
          const px = Math.round(x + dx);
          const py = Math.round(y + dy);
          if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue;
          const data = ctx.getImageData(px, py, 1, 1).data;
          total += 1;
          const lum = (data[0] + data[1] + data[2]) / 3;
          if (lum > 160) bright += 1;
          if (lum < 90) dark += 1;
        }
      }
      return { x, y, bright, dark, total };
    });
    return { peek, samples, dataUrl: canvas.toDataURL("image/png") };
  });

  const base64 = result.dataUrl.split(",")[1];
  fs.writeFileSync(path.join(root, "tmp-canvas-raw.png"), Buffer.from(base64, "base64"));
  delete result.dataUrl;
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  server.kill();
})().catch((error) => {
  console.error(error);
  server.kill();
  process.exit(1);
});
