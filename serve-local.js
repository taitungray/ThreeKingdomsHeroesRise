"use strict";

const { spawn } = require("child_process");
const path = require("path");

const port = Number(process.argv[2]) || 8788;
const serverScript = path.join(__dirname, "scripts", "dev-server.js");
const child = spawn(process.execPath, [serverScript, "--port", String(port)], {
  cwd: __dirname,
  stdio: "inherit",
  windowsHide: true
});

function openBrowser(url) {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore", windowsHide: true }).unref();
  } else if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}

setTimeout(() => openBrowser("http://127.0.0.1:" + port + "/"), 700);
child.on("exit", (code) => process.exit(code || 0));
