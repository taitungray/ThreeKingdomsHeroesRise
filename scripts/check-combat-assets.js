"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const characterRoot = path.join(root, "assets", "characters");

async function alphaMetrics(file, cellSize = null) {
  const image = sharp(file);
  const metadata = await image.metadata();
  assert.ok(metadata.hasAlpha, `${path.basename(file)} must have an alpha channel`);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alphaAt = (x, y) => data[(y * info.width + x) * 4 + 3];
  let opaque = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) if (alphaAt(x, y) > 10) opaque += 1;
  }
  const cells = [];
  if (cellSize) {
    assert.equal(info.width % cellSize, 0, `${path.basename(file)} width must align to cell size`);
    assert.equal(info.height % cellSize, 0, `${path.basename(file)} height must align to cell size`);
    for (let top = 0; top < info.height; top += cellSize) {
      for (let left = 0; left < info.width; left += cellSize) {
        let cellOpaque = 0;
        for (let y = top; y < top + cellSize; y += 1) {
          for (let x = left; x < left + cellSize; x += 1) if (alphaAt(x, y) > 10) cellOpaque += 1;
        }
        cells.push(cellOpaque / (cellSize * cellSize));
      }
    }
  }
  return { width: info.width, height: info.height, opaqueRatio: opaque / (info.width * info.height), cells };
}

async function runCombatAssetChecks() {
  const attackManifest = JSON.parse(fs.readFileSync(path.join(characterRoot, "attack-manifest.json"), "utf8"));
  assert.equal(attackManifest.cellSize, 64, "attack cell size must remain 64px");
  assert.equal(attackManifest.columns, 8, "attack sheets must contain eight directions");
  assert.equal(attackManifest.rows, 5, "attack sheets must contain five action frames");
  assert.equal(new Set(attackManifest.assets.map((asset) => asset.id)).size, attackManifest.assets.length, "attack asset ids must be unique");

  const sparseCells = [];
  for (const asset of attackManifest.assets) {
    const file = path.join(root, asset.path);
    assert.ok(fs.existsSync(file), `missing attack asset: ${asset.path}`);
    const metrics = await alphaMetrics(file, attackManifest.cellSize);
    assert.deepEqual([metrics.width, metrics.height], [512, 320], `${asset.id} attack sheet dimensions are invalid`);
    metrics.cells.forEach((ratio, index) => {
      if (ratio < 0.055) sparseCells.push(`${asset.id}#${index}=${(ratio * 100).toFixed(1)}%`);
      assert.ok(ratio < 0.7, `${asset.id} cell ${index} is too opaque and may contain a rectangular background`);
    });
  }
  assert.equal(sparseCells.length, 0, `attack cells are too sparse; body layer may be missing (${sparseCells.length} cells). Sample:\n${sparseCells.slice(0, 20).join("\n")}`);

  const weaponManifest = JSON.parse(fs.readFileSync(path.join(characterRoot, "combat-weapon-manifest.json"), "utf8"));
  assert.deepEqual(weaponManifest.canvas, { width: 64, height: 64 }, "combat weapon canvas must be 64x64");
  assert.deepEqual(weaponManifest.anchor, [32, 54], "combat weapons must use the shared hand anchor");
  assert.equal(new Set(weaponManifest.assets.map((asset) => asset.id)).size, weaponManifest.assets.length, "combat weapon ids must be unique");
  for (const asset of weaponManifest.assets) {
    const file = path.join(root, asset.path);
    assert.ok(fs.existsSync(file), `missing combat weapon: ${asset.path}`);
    const metrics = await alphaMetrics(file);
    assert.deepEqual([metrics.width, metrics.height], [64, 64], `${asset.id} weapon dimensions are invalid`);
    assert.ok(metrics.opaqueRatio > 0.02 && metrics.opaqueRatio < 0.45, `${asset.id} weapon alpha coverage is suspicious`);
  }

  console.log(`Combat asset check passed: ${attackManifest.assets.length} attack sheets and ${weaponManifest.assets.length} weapons.`);
}

if (require.main === module) {
  runCombatAssetChecks().catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
}

module.exports = { runCombatAssetChecks };
