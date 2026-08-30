"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const characterRoot = path.join(root, "assets", "characters");

(async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(characterRoot, "modular-manifest.json"), "utf8"));
  const dataContext = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "data", "game-data.js"), "utf8"), dataContext, { filename: "game-data.js" });
  const data = dataContext.window.THREE_KINGDOMS_DATA;
  const portraitFiles = fs.readdirSync(characterRoot).filter((file) => file.startsWith("portrait-") && file.endsWith(".webp")).sort();

  assert.equal(manifest.portraits.size, 64, "portrait manifest grid must stay 64x64");
  assert.equal(portraitFiles.length, 50, "portrait set must cover the current 50-hero roster");
  assert.equal(data.heroes.length, 50, "portrait audit expects the current 50-hero roster");
  assert.ok(data.heroes.every((hero) => hero.portrait && fs.existsSync(path.join(root, hero.portrait))), "every hero portrait path must resolve");

  const metadata = await Promise.all(portraitFiles.map(async (file) => ({ file, ...(await sharp(path.join(characterRoot, file)).metadata()) })));
  for (const image of metadata) {
    assert.equal(image.format, "webp", `${image.file} must remain WebP`);
    assert.equal(image.width, 64, `${image.file} width must remain 64px`);
    assert.equal(image.height, 64, `${image.file} height must remain 64px`);
  }

  const uiSource = fs.readFileSync(path.join(root, "css", "ui-overhaul.css"), "utf8");
  for (const marker of [
    "--avatar-size-hud: 40px",
    "--avatar-size-roster: 48px",
    "--avatar-size-showcase: 88px",
    "aspect-ratio: 1",
    "background-size: contain !important"
  ]) {
    assert.ok(uiSource.includes(marker), `avatar sizing contract marker missing: ${marker}`);
  }

  console.log(`Portrait asset check passed: ${portraitFiles.length} files at 64x64; square UI sizing contract present.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
