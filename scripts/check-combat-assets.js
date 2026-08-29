"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
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
  const edgeCells = [];
  if (cellSize) {
    assert.equal(info.width % cellSize, 0, `${path.basename(file)} width must align to cell size`);
    assert.equal(info.height % cellSize, 0, `${path.basename(file)} height must align to cell size`);
    for (let top = 0; top < info.height; top += cellSize) {
      for (let left = 0; left < info.width; left += cellSize) {
        let cellOpaque = 0;
        let edgeOpaque = 0;
        for (let y = top; y < top + cellSize; y += 1) {
          for (let x = left; x < left + cellSize; x += 1) {
            if (alphaAt(x, y) <= 10) continue;
            cellOpaque += 1;
            const localX = x - left;
            const localY = y - top;
            if (localX < 3 || localX >= cellSize - 3 || localY < 3 || localY >= cellSize - 3) edgeOpaque += 1;
          }
        }
        cells.push(cellOpaque / (cellSize * cellSize));
        edgeCells.push(edgeOpaque);
      }
    }
  }
  return { width: info.width, height: info.height, opaqueRatio: opaque / (info.width * info.height), cells, edgeCells };
}

async function phaseSignatures(file, cellSize) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const signatures = [];
  for (let row = 0; row < 5; row += 1) {
    const hash = crypto.createHash("sha256");
    for (let y = row * cellSize; y < (row + 1) * cellSize; y += 1) {
      const start = (y * info.width) * 4;
      hash.update(data.subarray(start, start + cellSize * 4));
    }
    signatures.push(hash.digest("hex"));
  }
  return signatures;
}

async function stripFrameSignatures(file, cellSize, count) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const signatures = [];
  for (let column = 0; column < count; column += 1) {
    const hash = crypto.createHash("sha256");
    for (let y = 0; y < cellSize; y += 1) {
      const start = (y * info.width + column * cellSize) * 4;
      hash.update(data.subarray(start, start + cellSize * 4));
    }
    signatures.push(hash.digest("hex"));
  }
  return signatures;
}

async function alphaComponentCounts(file, cellSize, columns) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const counts = [];
  for (let column = 0; column < columns; column += 1) {
    const visited = new Uint8Array(cellSize * cellSize);
    const queue = new Int32Array(cellSize * cellSize);
    let components = 0;
    for (let y0 = 0; y0 < cellSize; y0 += 1) {
      for (let x0 = 0; x0 < cellSize; x0 += 1) {
        const start = y0 * cellSize + x0;
        const startOffset = (y0 * info.width + column * cellSize + x0) * 4;
        if (visited[start] || data[startOffset + 3] <= 10) continue;
        components += 1;
        let head = 0;
        let tail = 0;
        queue[tail++] = start;
        visited[start] = 1;
        while (head < tail) {
          const index = queue[head++];
          const x = index % cellSize;
          const y = Math.floor(index / cellSize);
          for (let dy = -1; dy <= 1; dy += 1) {
            for (let dx = -1; dx <= 1; dx += 1) {
              if (!dx && !dy) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= cellSize || ny >= cellSize) continue;
              const next = ny * cellSize + nx;
              const offset = (ny * info.width + column * cellSize + nx) * 4;
              if (visited[next] || data[offset + 3] <= 10) continue;
              visited[next] = 1;
              queue[tail++] = next;
            }
          }
        }
      }
    }
    counts.push(components);
  }
  return counts;
}

async function runCombatAssetChecks() {
  const attackManifest = JSON.parse(fs.readFileSync(path.join(characterRoot, "attack-manifest.json"), "utf8"));
  assert.equal(attackManifest.version, 6, "runtime expects the v4 pilot attack manifest");
  assert.equal(attackManifest.cellSize, 64, "attack cell size must remain 64px");
  assert.equal(attackManifest.detailCellSize, 96, "high-detail attack cells must remain 96px");
  assert.equal(attackManifest.ultraDetailCellSize, 128, "v4 pilot attack cells must use 128px");
  assert.equal(attackManifest.columns, 8, "attack sheets must contain eight directions");
  assert.equal(attackManifest.rows, 5, "attack sheets must contain five action frames");
  assert.equal(new Set(attackManifest.assets.map((asset) => asset.id)).size, attackManifest.assets.length, "attack asset ids must be unique");

  const sparseCells = [];
  for (const asset of attackManifest.assets) {
    assert.match(asset.path, /-v2\.webp$/, `${asset.id} must use a non-destructive v2 action sheet`);
    const file = path.join(root, asset.path);
    assert.ok(fs.existsSync(file), `missing attack asset: ${asset.path}`);
    const metrics = await alphaMetrics(file, attackManifest.cellSize);
    assert.deepEqual([metrics.width, metrics.height], [512, 320], `${asset.id} attack sheet dimensions are invalid`);
    metrics.cells.forEach((ratio, index) => {
      if (ratio < 0.055) sparseCells.push(`${asset.id}#${index}=${(ratio * 100).toFixed(1)}%`);
      assert.ok(ratio < 0.7, `${asset.id} cell ${index} is too opaque and may contain a rectangular background`);
    });
    const signatures = await phaseSignatures(file, attackManifest.cellSize);
    assert.ok(new Set(signatures).size >= 3, `${asset.id} must contain distinct anticipation/contact/recovery poses`);
  }
  assert.equal(sparseCells.length, 0, `attack cells are too sparse; body layer may be missing (${sparseCells.length} cells). Sample:\n${sparseCells.slice(0, 20).join("\n")}`);

  const detailAssets = attackManifest.assets.filter((asset) => asset.detailPath);
  assert.equal(detailAssets.length, 15, "high-detail roster must cover eight heroes, five enemy types and two bosses");
  for (const asset of detailAssets) {
    assert.match(asset.detailPath, /-v3\.webp$/, `${asset.id} must use a v3 high-detail action sheet`);
    const file = path.join(root, asset.detailPath);
    assert.ok(fs.existsSync(file), `missing high-detail attack asset: ${asset.detailPath}`);
    const metrics = await alphaMetrics(file, attackManifest.detailCellSize);
    assert.deepEqual([metrics.width, metrics.height], [768, 480], `${asset.id} high-detail attack dimensions are invalid`);
    metrics.cells.forEach((ratio, index) => {
      assert.ok(ratio > 0.04, `${asset.id} high-detail cell ${index} is too sparse`);
      assert.ok(ratio < 0.7, `${asset.id} high-detail cell ${index} may contain a rectangular background`);
    });
    const signatures = await phaseSignatures(file, attackManifest.detailCellSize);
    assert.ok(new Set(signatures).size >= 3, `${asset.id} high-detail sheet needs distinct attack phases`);
  }

  const ultraDetailAssets = attackManifest.assets.filter((asset) => asset.ultraDetailPath);
  assert.deepEqual(ultraDetailAssets.map((asset) => asset.id), ["liubei", "guanyu", "zhangfei", "zhaoyun"], "v4 pilot roster must stay limited to the first four battle heroes");
  for (const asset of ultraDetailAssets) {
    assert.match(asset.ultraDetailPath, /-v4\.webp$/, `${asset.id} must use a v4 ultra-detail action sheet`);
    const file = path.join(root, asset.ultraDetailPath);
    assert.ok(fs.existsSync(file), `missing v4 pilot attack asset: ${asset.ultraDetailPath}`);
    const metrics = await alphaMetrics(file, attackManifest.ultraDetailCellSize);
    assert.deepEqual([metrics.width, metrics.height], [1024, 640], `${asset.id} v4 attack dimensions are invalid`);
    metrics.cells.forEach((ratio, index) => {
      assert.ok(ratio > 0.12, `${asset.id} v4 attack cell ${index} is too sparse`);
      assert.ok(ratio < 0.48, `${asset.id} v4 attack cell ${index} may contain a rectangular background`);
      assert.ok(metrics.edgeCells[index] < 96, `${asset.id} v4 attack cell ${index} has opaque edge bands or dirty background blocks`);
    });
    const signatures = await phaseSignatures(file, attackManifest.ultraDetailCellSize);
    assert.ok(new Set(signatures).size >= 4, `${asset.id} v4 attack sheet needs four or more distinct action phases`);
  }

  const moveManifest = JSON.parse(fs.readFileSync(path.join(characterRoot, "move-manifest.json"), "utf8"));
  assert.equal(moveManifest.version, 3, "runtime expects the v4 pilot move manifest");
  assert.equal(moveManifest.cellSize, 96, "high-detail move cells must remain 96px");
  assert.equal(moveManifest.ultraDetailCellSize, 128, "v4 pilot move cells must use 128px");
  assert.equal(moveManifest.columns, 4, "move strips must contain four grounded gait frames");
  assert.equal(moveManifest.assets.length, 15, "high-detail move roster changed");
  assert.equal(new Set(moveManifest.assets.map((asset) => asset.id)).size, moveManifest.assets.length, "move asset ids must be unique");
  for (const asset of moveManifest.assets) {
    assert.match(asset.path, /-v3\.webp$/, `${asset.id} must use a v3 move strip`);
    const file = path.join(root, asset.path);
    assert.ok(fs.existsSync(file), `missing move asset: ${asset.path}`);
    const metrics = await alphaMetrics(file, moveManifest.cellSize);
    assert.deepEqual([metrics.width, metrics.height], [384, 96], `${asset.id} move strip dimensions are invalid`);
    metrics.cells.forEach((ratio, index) => {
      assert.ok(ratio > 0.035, `${asset.id} move frame ${index} is too sparse`);
      assert.ok(ratio < 0.7, `${asset.id} move frame ${index} may contain a rectangular background`);
    });
    const signatures = await stripFrameSignatures(file, moveManifest.cellSize, moveManifest.columns);
    assert.equal(new Set(signatures).size, 4, `${asset.id} must contain four distinct gait poses`);
  }

  const ultraDetailMoves = moveManifest.assets.filter((asset) => asset.ultraDetailPath);
  assert.deepEqual(ultraDetailMoves.map((asset) => asset.id), ["liubei", "guanyu", "zhangfei", "zhaoyun"], "v4 move pilot roster must match the first four battle heroes");
  for (const asset of ultraDetailMoves) {
    assert.match(asset.ultraDetailPath, /-v4\.webp$/, `${asset.id} must use a v4 ultra-detail move strip`);
    const file = path.join(root, asset.ultraDetailPath);
    assert.ok(fs.existsSync(file), `missing v4 pilot move asset: ${asset.ultraDetailPath}`);
    const metrics = await alphaMetrics(file, moveManifest.ultraDetailCellSize);
    assert.deepEqual([metrics.width, metrics.height], [512, 128], `${asset.id} v4 move dimensions are invalid`);
    metrics.cells.forEach((ratio, index) => {
      assert.ok(ratio > 0.2 && ratio < 0.48, `${asset.id} v4 move frame ${index} has suspicious alpha coverage`);
      assert.ok(metrics.edgeCells[index] < 96, `${asset.id} v4 move frame ${index} has opaque edge bands or dirty background blocks`);
    });
    const signatures = await stripFrameSignatures(file, moveManifest.ultraDetailCellSize, moveManifest.columns);
    assert.equal(new Set(signatures).size, 4, `${asset.id} v4 move strip must contain four distinct gait poses`);
    const componentCounts = await alphaComponentCounts(file, moveManifest.ultraDetailCellSize, moveManifest.columns);
    assert.ok(componentCounts.every((count) => count === 1), `${asset.id} v4 move strip must not contain detached cross-cell weapon fragments: ${componentCounts.join(",")}`);
  }

  const weaponManifest = JSON.parse(fs.readFileSync(path.join(characterRoot, "combat-weapon-manifest.json"), "utf8"));
  assert.deepEqual(weaponManifest.canvas, { width: 64, height: 64 }, "combat weapon canvas must be 64x64");
  assert.deepEqual(weaponManifest.anchor, [32, 54], "combat weapons keep a shared default hand anchor");
  assert.ok(weaponManifest.assets.every((asset) => Array.isArray(asset.anchor) && asset.anchor.length === 2), "each combat weapon needs its own hand anchor");
  assert.equal(new Set(weaponManifest.assets.map((asset) => asset.id)).size, weaponManifest.assets.length, "combat weapon ids must be unique");
  for (const asset of weaponManifest.assets) {
    const file = path.join(root, asset.path);
    assert.ok(fs.existsSync(file), `missing combat weapon: ${asset.path}`);
    const metrics = await alphaMetrics(file);
    assert.deepEqual([metrics.width, metrics.height], [64, 64], `${asset.id} weapon dimensions are invalid`);
    assert.ok(metrics.opaqueRatio > 0.02 && metrics.opaqueRatio < 0.45, `${asset.id} weapon alpha coverage is suspicious`);
  }

  console.log(`Combat asset check passed: ${attackManifest.assets.length} legacy attack sheets, ${detailAssets.length} high-detail attack sheets, ${ultraDetailAssets.length} ultra-detail v4 pilots, ${moveManifest.assets.length} high-detail move strips and ${weaponManifest.assets.length} weapons.`);
}

if (require.main === module) {
  runCombatAssetChecks().catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
}

module.exports = { runCombatAssetChecks };
