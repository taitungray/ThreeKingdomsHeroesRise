"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const webRoot = path.join(projectRoot, "www");
const fallbackRoot = projectRoot;
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
  const fallback = safeResolve(fallbackRoot, request.url);
  const file = primary && fs.existsSync(primary) && fs.statSync(primary).isFile()
    ? primary
    : fallback && fs.existsSync(fallback) && fs.statSync(fallback).isFile()
      ? fallback
      : null;
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

server.listen(port, "127.0.0.1", () => {
  console.log("三國：群英再起 dev server: http://127.0.0.1:" + port + "/");
  console.log("Serving " + (fs.existsSync(webRoot) ? webRoot : fallbackRoot));
});
