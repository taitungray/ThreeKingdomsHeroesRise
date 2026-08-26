"use strict";

const { spawn } = require("child_process");
const http = require("http");
const net = require("net");
const path = require("path");

const requestedPort = Number(process.argv[2]) || 8788;
const shouldOpenBrowser = !process.argv.includes("--no-open");
const maxPortAttempts = 20;
const serverScript = path.join(__dirname, "scripts", "dev-server.js");

function canListen(port) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.once("error", (error) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") {
        resolve(false);
        return;
      }
      reject(error);
    });
    probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
  });
}

async function findAvailablePort(startPort) {
  for (let offset = 0; offset < maxPortAttempts; offset += 1) {
    const candidate = startPort + offset;
    if (await canListen(candidate)) return candidate;
  }
  throw new Error(`連接埠 ${startPort}-${startPort + maxPortAttempts - 1} 都已被占用。`);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isServerReady(port) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ready) => {
      if (settled) return;
      settled = true;
      resolve(ready);
    };
    const request = http.get({ hostname: "127.0.0.1", port, path: "/", timeout: 500 }, (response) => {
      response.resume();
      finish(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.on("timeout", () => {
      request.destroy();
      finish(false);
    });
    request.on("error", () => finish(false));
  });
}

async function waitForServer(port) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (await isServerReady(port)) return true;
    await delay(100);
  }
  return false;
}

function openBrowser(url) {
  let browserProcess;
  if (process.platform === "win32") {
    browserProcess = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/c", "start", "", url], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    });
  } else if (process.platform === "darwin") {
    browserProcess = spawn("open", [url], { detached: true, stdio: "ignore" });
  } else {
    browserProcess = spawn("xdg-open", [url], { detached: true, stdio: "ignore" });
  }
  browserProcess.once("error", () => console.error(`無法自動開啟瀏覽器，請手動前往 ${url}`));
  browserProcess.unref();
}

async function main() {
  const port = await findAvailablePort(requestedPort);
  if (port !== requestedPort) {
    console.log(`連接埠 ${requestedPort} 已被占用，自動改用 ${port}。`);
  }

  const child = spawn(process.execPath, [serverScript, "--port", String(port)], {
    cwd: __dirname,
    stdio: "inherit",
    windowsHide: true
  });
  child.once("error", (error) => {
    console.error("本機伺服器程序啟動失敗：" + error.message);
    process.exit(1);
  });
  child.once("exit", (code) => process.exit(code ?? 1));

  const ready = await waitForServer(port);
  if (!ready) {
    console.error("本機伺服器未能在 5 秒內就緒。");
    child.kill();
    return;
  }

  const url = `http://127.0.0.1:${port}/`;
  console.log("本機預覽已就緒：" + url);
  if (shouldOpenBrowser) openBrowser(url);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("本機預覽啟動失敗：" + error.message);
    process.exit(1);
  });
}

module.exports = {
  findAvailablePort,
  isServerReady,
  waitForServer
};
