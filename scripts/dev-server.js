"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const builtWebRoot = path.join(projectRoot, "www");
const serveBuiltOutput = process.argv.includes("--www");
const webRoot = serveBuiltOutput ? builtWebRoot : projectRoot;
const fallbackRoot = serveBuiltOutput ? projectRoot : null;
const portIndex = process.argv.indexOf("--port");
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT) || 8788;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function safeResolve(base, requestUrl) {
  const pathname = decodeURIComponent((requestUrl || "/").split("?")[0]);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^[/\\]+/, "");
  const target = path.resolve(base, relative);
  return target === base || target.startsWith(base + path.sep) ? target : null;
}

function serveFrom(response, file) {
  response.writeHead(200, {
    "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  fs.createReadStream(file).pipe(response);
}

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405);
    response.end("Method not allowed");
    return;
  }
  const primary = safeResolve(webRoot, request.url);
  const fallback = fallbackRoot ? safeResolve(fallbackRoot, request.url) : null;
  let file = primary && fs.existsSync(primary) && fs.statSync(primary).isFile()
    ? primary
    : fallback && fs.existsSync(fallback) && fs.statSync(fallback).isFile()
      ? fallback
      : null;

  if (!file && request.url) {
    // If a boss-* sheet was requested and does not exist, fall back to the base hero sheet or boss-dongzhuo
    const bossMatch = request.url.match(/\/(attack|move)-boss-([a-z0-9]+)-(v[0-9]+)\.webp/);
    if (bossMatch) {
      const altHero = path.resolve(webRoot, "assets", "characters", `${bossMatch[1]}-${bossMatch[2]}-${bossMatch[3]}.webp`);
      const altDongzhuo = path.resolve(webRoot, "assets", "characters", `${bossMatch[1]}-boss-dongzhuo-${bossMatch[3]}.webp`);
      if (fs.existsSync(altHero) && fs.statSync(altHero).isFile()) file = altHero;
      else if (fs.existsSync(altDongzhuo) && fs.statSync(altDongzhuo).isFile()) file = altDongzhuo;
    }
  }

  if (!file) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  if (request.method === "HEAD") {
    response.writeHead(200, { "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream" });
    response.end();
    return;
  }
  serveFrom(response, file);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`連接埠 ${port} 已被占用，伺服器無法啟動。`);
  } else {
    console.error("本機伺服器啟動失敗：" + error.message);
  }
  process.exitCode = 1;
});

server.listen(port, "127.0.0.1", () => {
  console.log("三國：群英再起 dev server: http://127.0.0.1:" + port + "/");
  console.log("Serving " + webRoot + (serveBuiltOutput ? " (built www with source fallback)" : " (source)"));
});
