"use strict";

const fs = require("fs");
const path = require("path");

const root = __dirname;
const output = path.join(root, "www");
const isRelease = process.argv.includes("--release");

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || value.includes("REPLACE_WITH")) {
    throw new Error("Release build requires " + name + " to be set.");
  }
  return value;
}

function copyFileIfPresent(relativePath) {
  const source = path.join(root, relativePath);
  if (!fs.existsSync(source)) return;
  const target = path.join(output, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDirectoryIfPresent(relativePath) {
  const source = path.join(root, relativePath);
  if (!fs.existsSync(source)) return;
  const target = path.join(output, relativePath);
  fs.cpSync(source, target, { recursive: true });
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

[
  "index.html",
  "styles.css",
  "game.js",
  "manifest.json",
  "sw.js",
  "app-ads.txt",
  "privacy.html"
].forEach(copyFileIfPresent);
copyDirectoryIfPresent("assets");
copyDirectoryIfPresent("data");
copyDirectoryIfPresent("js");

const adConfig = isRelease
  ? {
      appId: requiredEnv("TAOYUAN_ADMOB_APP_ID"),
      rewardedAdUnitId: requiredEnv("TAOYUAN_ADMOB_REWARDED_ID"),
      isTesting: false
    }
  : {
      appId: "ca-app-pub-3940256099942544~3347511713",
      rewardedAdUnitId: "ca-app-pub-3940256099942544/5224354917",
      isTesting: true
    };

const configSource = [
  "(function configureAdMob() {",
  "  window.TAOYUAN_ADMOB_CONFIG = Object.freeze(" + JSON.stringify(adConfig, null, 2) + ");",
  "}());",
  ""
].join("\n");
fs.mkdirSync(path.join(output, "js"), { recursive: true });
fs.writeFileSync(path.join(output, "js", "admob-config.js"), configSource, "utf8");

console.log((isRelease ? "Release" : "Development") + " web build ready: " + output);
