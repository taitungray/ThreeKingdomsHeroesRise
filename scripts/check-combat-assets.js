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
  const paleEdgeCells = [];
  const neutralBlockCells = [];
  const topMarginCells = [];
  if (cellSize) {
    assert.equal(info.width % cellSize, 0, `${path.basename(file)} width must align to cell size`);
    assert.equal(info.height % cellSize, 0, `${path.basename(file)} height must align to cell size`);
    for (let top = 0; top < info.height; top += cellSize) {
      for (let left = 0; left < info.width; left += cellSize) {
        let cellOpaque = 0;
        let edgeOpaque = 0;
        let paleEdge = 0;
        let firstOpaqueRow = cellSize;
        const neutralMask = new Uint8Array(cellSize * cellSize);
        for (let y = top; y < top + cellSize; y += 1) {
          for (let x = left; x < left + cellSize; x += 1) {
            if (alphaAt(x, y) <= 10) continue;
            cellOpaque += 1;
            const localX = x - left;
            const localY = y - top;
            firstOpaqueRow = Math.min(firstOpaqueRow, localY);
            // Feet and ground-contact ink may intentionally use the bottom
            // row. Only the top and side gutters indicate a cropped head or
            // cross-cell leak.
            if (localX === 0 || localX === cellSize - 1 || localY === 0) edgeOpaque += 1;
            const offset = (y * info.width + x) * 4;
            const high = Math.max(data[offset], data[offset + 1], data[offset + 2]);
            const low = Math.min(data[offset], data[offset + 1], data[offset + 2]);
            let touchesAlpha = false;
            for (let dy = -1; dy <= 1 && !touchesAlpha; dy += 1) {
              for (let dx = -1; dx <= 1; dx += 1) {
                if (!dx && !dy) continue;
                const nx = localX + dx;
                const ny = localY + dy;
                if (nx < 0 || ny < 0 || nx >= cellSize || ny >= cellSize
                  || alphaAt(left + nx, top + ny) <= 10) {
                  touchesAlpha = true;
                  break;
                }
              }
            }
            if (touchesAlpha && high >= 145 && high - low <= 112) paleEdge += 1;
            if (high >= 235 && low >= 225 && high - low <= 25) {
              neutralMask[localY * cellSize + localX] = 1;
            }
          }
        }
        const neutralVisited = new Uint8Array(neutralMask.length);
        const queue = new Int32Array(neutralMask.length);
        let largestNeutralBlock = 0;
        for (let start = 0; start < neutralMask.length; start += 1) {
          if (!neutralMask[start] || neutralVisited[start]) continue;
          let head = 0;
          let tail = 0;
          let componentSize = 0;
          queue[tail++] = start;
          neutralVisited[start] = 1;
          while (head < tail) {
            const index = queue[head++];
            componentSize += 1;
            const x = index % cellSize;
            const y = Math.floor(index / cellSize);
            for (let dy = -1; dy <= 1; dy += 1) {
              for (let dx = -1; dx <= 1; dx += 1) {
                if (!dx && !dy) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= cellSize || ny >= cellSize) continue;
                const next = ny * cellSize + nx;
                if (!neutralMask[next] || neutralVisited[next]) continue;
                neutralVisited[next] = 1;
                queue[tail++] = next;
              }
            }
          }
          largestNeutralBlock = Math.max(largestNeutralBlock, componentSize);
        }
        cells.push(cellOpaque / (cellSize * cellSize));
        edgeCells.push(edgeOpaque);
        paleEdgeCells.push(paleEdge);
        neutralBlockCells.push(largestNeutralBlock);
        topMarginCells.push(firstOpaqueRow);
      }
    }
  }
  return {
    width: info.width,
    height: info.height,
    opaqueRatio: opaque / (info.width * info.height),
    cells,
    edgeCells,
    paleEdgeCells,
    neutralBlockCells,
    topMarginCells
  };
}

async function assertMasterAlpha(relativePath) {
  const file = path.join(root, relativePath);
  assert.ok(fs.existsSync(file), `missing master source: ${relativePath}`);
  const metadata = await sharp(file).metadata();
  assert.equal(metadata.hasAlpha, true, `${relativePath} must preserve true alpha after remaster import`);
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

async function assertMoveFacingRight(file, cellSize, id, archetype) {
  // Polearms, gold blades, bows and horse mass sit opposite the face.
  // Skin/mass heuristics call those silhouettes LEFT even when masters face RIGHT;
  // flopping to satisfy the heuristic is what caused combat moonwalking.
  const skipArchetypes = new Set([
    "guanyu", "zhaoyun", "zhangfei", "huangzhong", "lubu",
    "bandit", "brute", "cavalry",
    "boss-dongzhuo", "boss-lvbu", "boss-menghuo", "boss-zhangjiao"
  ]);
  if (skipArchetypes.has(archetype) || skipArchetypes.has(String(id).replace(/ v4$/, ""))) return;
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let skinL = 0;
  let skinR = 0;
  let massL = 0;
  let massR = 0;
  const midX = cellSize / 2;
  for (let y = 0; y < cellSize; y += 1) {
    for (let x = 0; x < cellSize; x += 1) {
      const idx = (y * info.width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a > 30) {
        if (x < midX) massL += 1;
        else massR += 1;
        if (y < cellSize * 0.5 && r > 140 && g > 90 && b > 55 && r > g && g > b) {
          if (x < midX) skinL += 1;
          else skinR += 1;
        }
      }
    }
  }
  const facing = (Math.abs(skinR - skinL) >= 10)
    ? (skinR >= skinL ? "RIGHT" : "LEFT")
    : (massR >= massL ? "RIGHT" : "LEFT");
  assert.equal(facing, "RIGHT", `${id} movement sprite must face RIGHT by default for runtime facing mirroring`);
}

async function runCombatAssetChecks() {
  const attackManifest = JSON.parse(fs.readFileSync(path.join(characterRoot, "attack-manifest.json"), "utf8"));
  assert.equal(attackManifest.version, 6, "runtime expects the current high-detail attack manifest");
  assert.equal(attackManifest.cellSize, 64, "attack cell size must remain 64px");
  assert.equal(attackManifest.detailCellSize, 96, "high-detail attack cells must remain 96px");
  assert.equal(attackManifest.ultraDetailCellSize, undefined, "inactive v4 pilot metadata must not remain in the runtime attack manifest");
  assert.equal(attackManifest.columns, 8, "attack sheets must contain eight directions");
  assert.equal(attackManifest.rows, 5, "attack sheets must contain five action frames");
  assert.equal(new Set(attackManifest.assets.map((asset) => asset.id)).size, attackManifest.assets.length, "attack asset ids must be unique");
  await assertMasterAlpha(attackManifest.source.core);
  await assertMasterAlpha(attackManifest.source.chapter1Enemies);

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
  assert.equal(detailAssets.length, 59, "high-detail roster must cover 50 heroes, five enemy types and four bosses");
  for (const asset of detailAssets) {
    assert.match(asset.detailPath, /-v3\.webp$/, `${asset.id} must use a v3 high-detail action sheet`);
    const file = path.join(root, asset.detailPath);
    assert.ok(fs.existsSync(file), `missing high-detail attack asset: ${asset.detailPath}`);
    const metrics = await alphaMetrics(file, attackManifest.detailCellSize);
    assert.deepEqual([metrics.width, metrics.height], [768, 480], `${asset.id} high-detail attack dimensions are invalid`);
    metrics.cells.forEach((ratio, index) => {
      assert.ok(ratio > 0.04, `${asset.id} high-detail cell ${index} is too sparse`);
      assert.ok(ratio < 0.7, `${asset.id} high-detail cell ${index} may contain a rectangular background`);
      assert.ok(metrics.edgeCells[index] < 110, `${asset.id} high-detail cell ${index} has opaque edge bands or dirty background blocks`);
      assert.ok(metrics.paleEdgeCells[index] < 8, `${asset.id} high-detail cell ${index} has a light or grey alpha-edge halo`);
      assert.ok(metrics.neutralBlockCells[index] < 96, `${asset.id} high-detail cell ${index} has an opaque neutral-white background block`);
      assert.ok(metrics.topMarginCells[index] >= 4, `${asset.id} high-detail cell ${index} has insufficient headroom and may crop the head`);
    });
    const signatures = await phaseSignatures(file, attackManifest.detailCellSize);
    assert.ok(new Set(signatures).size >= 3, `${asset.id} high-detail sheet needs distinct attack phases`);
  }

  const ultraDetailAssets = attackManifest.assets.filter((asset) => asset.ultraDetailPath);
  assert.deepEqual(ultraDetailAssets, [], "baked-checker v4 references must stay out of the runtime attack manifest");

  const moveManifest = JSON.parse(fs.readFileSync(path.join(characterRoot, "move-manifest.json"), "utf8"));
  assert.equal(moveManifest.version, 3, "runtime expects the current high-detail move manifest");
  assert.equal(moveManifest.cellSize, 96, "high-detail move cells must remain 96px");
  assert.equal(moveManifest.ultraDetailCellSize, undefined, "inactive v4 pilot metadata must not remain in the runtime move manifest");
  assert.equal(moveManifest.columns, 4, "move strips must contain four grounded gait frames");
  assert.equal(moveManifest.assets.length, 59, "high-detail move roster must cover 50 heroes, five enemy types and four bosses");
  assert.equal(new Set(moveManifest.assets.map((asset) => asset.id)).size, moveManifest.assets.length, "move asset ids must be unique");
  await assertMasterAlpha(moveManifest.sources.core);
  await assertMasterAlpha(moveManifest.sources.chapter1Enemies);
  for (const asset of moveManifest.assets) {
    assert.match(asset.path, /-v3\.webp$/, `${asset.id} must use a v3 move strip`);
    const file = path.join(root, asset.path);
    assert.ok(fs.existsSync(file), `missing move asset: ${asset.path}`);
    const metrics = await alphaMetrics(file, moveManifest.cellSize);
    assert.deepEqual([metrics.width, metrics.height], [384, 96], `${asset.id} move strip dimensions are invalid`);
    metrics.cells.forEach((ratio, index) => {
      assert.ok(ratio > 0.035, `${asset.id} move frame ${index} is too sparse`);
      assert.ok(ratio < 0.7, `${asset.id} move frame ${index} may contain a rectangular background`);
      assert.ok(metrics.paleEdgeCells[index] < 8, `${asset.id} move frame ${index} has a light or grey alpha-edge halo`);
      assert.ok(metrics.neutralBlockCells[index] < 96, `${asset.id} move frame ${index} has an opaque neutral-white background block`);
      assert.ok(metrics.topMarginCells[index] >= 4, `${asset.id} move frame ${index} has insufficient headroom and may crop the head`);
    });
    const signatures = await stripFrameSignatures(file, moveManifest.cellSize, moveManifest.columns);
    assert.equal(new Set(signatures).size, 4, `${asset.id} must contain four distinct gait poses`);
    await assertMoveFacingRight(file, moveManifest.cellSize, asset.id, asset.archetype);
  }

  const ultraDetailMoves = moveManifest.assets.filter((asset) => asset.ultraDetailPath);
  assert.deepEqual(ultraDetailMoves, [], "baked-checker v4 references must stay out of the runtime move manifest");

  const v4PilotSource = fs.readFileSync(path.join(root, "scripts", "generate-combat-actions-v4-pilot.js"), "utf8");
  assert.ok(
    !/fs\.writeFileSync\((?:attack|move)ManifestPath/.test(v4PilotSource)
      && !/\.ultraDetailPath\s*=/.test(v4PilotSource),
    "v4 research generator must not write reference assets back into runtime manifests"
  );
  assert.ok(
    /extractFrames\(moveMasterPath, 4, new Set\(\)\)/.test(v4PilotSource),
    "v4 move masters already face RIGHT; flopping any row makes combat moonwalk"
  );
  const v3GenSource = fs.readFileSync(path.join(root, "scripts", "generate-combat-actions-v3.js"), "utf8");
  assert.ok(
    /toneNeutralBoundaryPixels\(isolated\)/.test(v3GenSource),
    "v3 generator must tone light and grey mattes without adding an exterior black outline"
  );
  assert.ok(
    /authoredFrameBuffers\(coreMoveMasterPath, coreRows, 4, 180, 4, new Set\(\)\)/.test(v3GenSource)
      && /authoredFrameBuffers\(supportMoveMasterPath, supportRows, 4, 180, 4, new Set\(\)\)/.test(v3GenSource)
      && /authoredFrameBuffers\(enemyMoveMasterPath, enemyRows, 5, 180, 4, new Set\(\)\)/.test(v3GenSource)
      && /authoredFrameBuffers\(enemyMasterPath, enemyRows, 5, 180, 5, new Set\(\)\)/.test(v3GenSource),
    "all current v3 attack/move masters already face RIGHT; any generator flop inverts gait"
  );

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

  const UNIQUE_CORE_HERO_IDS = [
    "liubei", "guanyu", "zhangfei", "zhaoyun", "huangzhong", "sunshang",
    "caocao", "xiahoudun", "zhugeliang", "diaochan", "lubu"
  ];
  const coreFingerprints = new Map();
  for (const id of UNIQUE_CORE_HERO_IDS) {
    const asset = attackManifest.assets.find((entry) => entry.id === id);
    assert.ok(asset, `missing attack manifest entry for core hero ${id}`);
    assert.equal(asset.archetype, id, `${id} must use its own combat archetype, not a clone of ${asset.archetype}`);
    const file = path.join(root, asset.detailPath);
    const { data } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const fingerprint = crypto.createHash("sha256").update(data).digest("hex");
    const cloneOf = [...coreFingerprints.entries()].find(([, hash]) => hash === fingerprint)?.[0];
    assert.ok(!cloneOf, `${id} v3 attack sheet must not be a pixel clone of ${cloneOf}`);
    coreFingerprints.set(id, fingerprint);
  }

  // Runtime AUTHORED_ACTION_SPRITES must resolve to real on-disk sheets (no invisible bosses).
  const renderSource = fs.readFileSync(path.join(root, "js", "game", "game-render.js"), "utf8");
  assert.ok(
    renderSource.includes("const ULTRA_DETAIL_ACTION_SPRITES = new Set();"),
    "runtime must keep the baked-checker v4 reference sheets disabled"
  );
  const authoredMatch = renderSource.match(/AUTHORED_ACTION_SPRITES = new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(authoredMatch, "AUTHORED_ACTION_SPRITES declaration missing");
  const authoredIds = [...authoredMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.ok(authoredIds.length >= 59, "authored combat roster unexpectedly small");
  for (const id of authoredIds) {
    const attackName = `attack-${id}-v3.webp`;
    const moveName = `move-${id}-v3.webp`;
    assert.ok(fs.existsSync(path.join(characterRoot, attackName)), `AUTHORED id ${id} missing ${attackName}`);
    assert.ok(fs.existsSync(path.join(characterRoot, moveName)), `AUTHORED id ${id} missing ${moveName}`);
  }
  assert.ok(renderSource.includes("BOSS_ACTION_SPRITE_BY_GENERAL"), "boss generals must map to existing action sheets");
  assert.ok(!/"boss-yuanshao"|"boss-zhurong"|"boss-simayi"/.test(authoredMatch[1]), "missing boss sheets must not stay in AUTHORED_ACTION_SPRITES");

  console.log(`Combat asset check passed: ${attackManifest.assets.length} legacy attack sheets, ${detailAssets.length} active high-detail attack sheets, no v4 runtime references, ${moveManifest.assets.length} active high-detail move strips and ${weaponManifest.assets.length} weapons.`);
}

if (require.main === module) {
  runCombatAssetChecks().catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
}

module.exports = { runCombatAssetChecks };
