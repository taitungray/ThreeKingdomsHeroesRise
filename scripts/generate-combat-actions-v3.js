"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const characterDir = path.join(root, "assets", "characters");
const masterPath = path.join(characterDir, "core-heroes-action-master-v3.webp");
const supportMasterPath = path.join(characterDir, "support-heroes-action-master-v3.webp");
const enemyMasterPath = path.join(characterDir, "chapter1-enemies-action-master-v3.webp");
const coreMoveMasterPath = path.join(characterDir, "core-heroes-move-master-v3.webp");
const supportMoveMasterPath = path.join(characterDir, "support-heroes-move-master-v3.webp");
const enemyMoveMasterPath = path.join(characterDir, "chapter1-enemies-move-master-v3.webp");
const manifestPath = path.join(characterDir, "attack-manifest.json");
const moveManifestPath = path.join(characterDir, "move-manifest.json");
const cellSize = 96;
const columns = 8;
const rows = 5;
const coreRows = new Map([
  ["liubei", 0],
  ["guanyu", 1],
  ["zhangfei", 2],
  ["zhaoyun", 3]
]);
const supportRows = new Map([
  ["huangzhong", 0],
  ["sunshang", 1],
  ["caocao", 2],
  ["xiahoudun", 3]
]);
const enemyRows = new Map([
  ["bandit", 0],
  ["brute", 1],
  ["cavalry", 2],
  ["boss-zhangjiao", 3],
  ["boss-dongzhuo", 4]
]);

function isBackgroundCandidate(r, g, b, alpha, minimum = 222, tolerance = 7) {
  if (alpha <= 10) return true;
  const high = Math.max(r, g, b);
  const low = Math.min(r, g, b);
  return high >= minimum && high - low <= tolerance;
}

function removeConnectedCheckerboard(data, width, height, minimum = 222, tolerance = 7) {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (visited[index]) return;
    const offset = index * 4;
    if (!isBackgroundCandidate(data[offset], data[offset + 1], data[offset + 2], data[offset + 3], minimum, tolerance)) return;
    visited[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  for (let index = 0; index < visited.length; index += 1) {
    const offset = index * 4;
    data[offset + 3] = visited[index] ? 0 : 255;
  }

  // Remove the pale antialias fringe adjacent to the extracted checkerboard.
  for (let pass = 0; pass < 2; pass += 1) {
    const remove = [];
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        const offset = index * 4;
        if (data[offset + 3] === 0) continue;
        const high = Math.max(data[offset], data[offset + 1], data[offset + 2]);
        const low = Math.min(data[offset], data[offset + 1], data[offset + 2]);
        if (high < 226 || high - low > 11) continue;
        const touchesAlpha = data[offset - 1] === 0
          || data[offset + 7] === 0
          || data[offset - width * 4 + 3] === 0
          || data[offset + width * 4 + 3] === 0;
        if (touchesAlpha) remove.push(offset + 3);
      }
    }
    for (const alphaOffset of remove) data[alphaOffset] = 0;
  }
  return data;
}

function applyIdentityPalette(data, heroId) {
  if (heroId !== "liubei") return;
  for (let offset = 0; offset < data.length; offset += 4) {
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    if (r > 105 && g > 65 && b < 68 && r - g < 105) {
      data[offset] = Math.round(g * 0.62);
      data[offset + 1] = Math.min(210, Math.round(g * 1.08));
      data[offset + 2] = Math.round(g * 0.66);
    }
  }
}

function removePaleBackgroundIslands(data) {
  // WebP compression can close off pale checkerboard squares from the border
  // flood-fill. Clear those neutral islands globally; dark pixel outlines keep
  // white cloth and silver highlights attached to the authored silhouette.
  for (let offset = 0; offset < data.length; offset += 4) {
    const high = Math.max(data[offset], data[offset + 1], data[offset + 2]);
    const low = Math.min(data[offset], data[offset + 1], data[offset + 2]);
    if (high >= 205 && high - low <= 42) data[offset + 3] = 0;
  }
}

async function removeSmallAlphaIslands(pngBuffer, minimumPixels = 96, keepLargestOnly = false) {
  const { data, info } = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const visited = new Uint8Array(info.width * info.height);
  const queue = new Int32Array(info.width * info.height);
  const components = [];
  for (let start = 0; start < visited.length; start += 1) {
    if (visited[start] || data[start * 4 + 3] <= 10) continue;
    let head = 0;
    let tail = 0;
    const component = [];
    queue[tail++] = start;
    visited[start] = 1;
    while (head < tail) {
      const index = queue[head++];
      component.push(index);
      const x = index % info.width;
      const y = Math.floor(index / info.width);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= info.width || ny >= info.height) continue;
          const next = ny * info.width + nx;
          if (visited[next] || data[next * 4 + 3] <= 10) continue;
          visited[next] = 1;
          queue[tail++] = next;
        }
      }
    }
    components.push(component);
  }
  const largest = components.reduce((best, component) => Math.max(best, component.length), 0);
  for (const component of components) {
    const remove = keepLargestOnly ? component.length !== largest : component.length < minimumPixels;
    if (remove) for (const index of component) data[index * 4 + 3] = 0;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function authoredFrameBuffers(sourcePath, heroRows, rowCount = 4, backgroundMinimum = 222, columnCount = 5) {
  assert.ok(fs.existsSync(sourcePath), `missing generated action master: ${path.basename(sourcePath)}`);
  const master = sharp(sourcePath).ensureAlpha();
  const metadata = await master.metadata();
  assert.ok(metadata.width >= 1200 && metadata.height >= 960, "action master resolution is too small");
  const result = new Map();

  for (const [heroId, row] of heroRows) {
    const frames = [];
    for (let column = 0; column < columnCount; column += 1) {
      const left = Math.round(column * metadata.width / columnCount);
      const right = Math.round((column + 1) * metadata.width / columnCount);
      const top = Math.round(row * metadata.height / rowCount);
      const bottom = Math.round((row + 1) * metadata.height / rowCount);
      const width = right - left;
      const height = bottom - top;
      const { data, info } = await sharp(sourcePath)
        .extract({ left, top, width, height })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      removeConnectedCheckerboard(data, info.width, info.height, backgroundMinimum, 12);
      if (backgroundMinimum >= 200) removePaleBackgroundIslands(data);
      applyIdentityPalette(data, heroId);
      // The generated master can let an adjacent pose's long VFX graze a
      // cell boundary. Clear only the safe outer gutter before trimming.
      for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < 10; x += 1) {
          data[(y * info.width + x) * 4 + 3] = 0;
          data[(y * info.width + info.width - 1 - x) * 4 + 3] = 0;
        }
      }
      let framePipeline = sharp(data, { raw: info })
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .resize(cellSize - 4, cellSize - 4, {
          fit: "contain",
          position: "bottom",
          kernel: sharp.kernel.nearest,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        });
      // Runtime facing assumes every source silhouette faces right.
      if (enemyRows.has(heroId)) framePipeline = framePipeline.flop();
      const frame = await framePipeline.png().toBuffer();
      // A four-frame gait must contain one connected body/weapon silhouette;
      // detached pixels are usually a neighboring cell's weapon fragment.
      frames.push(await removeSmallAlphaIslands(frame, 96, columnCount === 4));
    }
    result.set(heroId, frames);
  }
  return result;
}

const phasePose = [
  { width: 52, height: 52, angle: -2, left: 4, top: 8 },
  { width: 54, height: 53, angle: -6, left: 2, top: 7 },
  { width: 59, height: 50, angle: 5, left: 4, top: 10 },
  { width: 57, height: 51, angle: 8, left: 3, top: 9 },
  { width: 53, height: 52, angle: 1, left: 5, top: 8 }
];

async function fallbackFrames(asset) {
  const bodyId = asset.id.startsWith("boss-") ? asset.id.slice(5) : asset.id;
  const candidates = asset.kind === "boss"
    ? [`boss-${bodyId}-v1.webp`, `combat-body-${bodyId}-v1.webp`]
    : [`combat-body-${bodyId}-v1.webp`, "combat-body-locked-v1.webp"];
  const source = candidates.map((name) => path.join(characterDir, name)).find(fs.existsSync);
  assert.ok(source, `missing body source for ${asset.id}`);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  removeConnectedCheckerboard(data, info.width, info.height, 58, 10);
  const cleanedSource = await sharp(data, { raw: info }).png().toBuffer();
  const frames = [];
  for (const pose of phasePose) {
    const body = await sharp(cleanedSource)
      .ensureAlpha()
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize(pose.width, pose.height, {
        fit: "contain",
        position: "bottom",
        kernel: sharp.kernel.nearest,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .rotate(pose.angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const frame = await sharp({
      create: { width: cellSize, height: cellSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).composite([{ input: body, left: pose.left, top: pose.top }]).png().toBuffer();
    frames.push(frame);
  }
  return frames;
}

async function normalizedCoreFrames(frames) {
  return Promise.all(frames.map((frame) => sharp({
    create: { width: cellSize, height: cellSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite([{ input: frame, left: 2, top: 3 }]).png().toBuffer()));
}

async function writeSheet(asset, frames) {
  const composites = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      // Direction is handled by the runtime facing transform; keeping one
      // authored silhouette avoids AI-generated identity drift between angles.
      composites.push({ input: frames[row], left: column * cellSize, top: row * cellSize });
    }
  }
  const outputName = `attack-${asset.id}-v3.webp`;
  await sharp({
    create: {
      width: columns * cellSize,
      height: rows * cellSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite(composites).webp({ lossless: true }).toFile(path.join(characterDir, outputName));
  return `assets/characters/${outputName}`;
}

async function writeMoveSheet(asset, frames) {
  const composites = frames.map((frame, column) => ({ input: frame, left: column * cellSize, top: 0 }));
  const outputName = `move-${asset.id}-v3.webp`;
  await sharp({
    create: {
      width: frames.length * cellSize,
      height: cellSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite(composites).webp({ lossless: true }).toFile(path.join(characterDir, outputName));
  return `assets/characters/${outputName}`;
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const authored = new Map([
    ...await authoredFrameBuffers(masterPath, coreRows),
    ...await authoredFrameBuffers(supportMasterPath, supportRows),
    ...await authoredFrameBuffers(enemyMasterPath, enemyRows, 5, 40)
  ]);
  // First-chapter ranged/support enemies previously fell back to portrait
  // cards. Reuse complete full-body archetypes until their unique masters are
  // authored, so no bust or card art can enter the combat Canvas.
  authored.set("archer", authored.get("huangzhong"));
  authored.set("strategist", authored.get("boss-zhangjiao"));
  for (const asset of manifest.assets) {
    if (!authored.has(asset.id)) {
      delete asset.detailPath;
      continue;
    }
    const frames = await normalizedCoreFrames(authored.get(asset.id));
    asset.detailPath = await writeSheet(asset, frames);
    process.stdout.write(`generated ${asset.detailPath}\n`);
  }
  manifest.version = 5;
  manifest.detailCellSize = cellSize;
  manifest.source = {
    core: "assets/characters/core-heroes-action-master-v3.webp",
    support: "assets/characters/support-heroes-action-master-v3.webp",
    chapter1Enemies: "assets/characters/chapter1-enemies-action-master-v3.webp",
    authoredHeroes: [...coreRows.keys(), ...supportRows.keys()],
    authoredEnemies: [...enemyRows.keys(), "archer", "strategist"],
    fallback: "full-body authored visual archetype; portrait-card combat art is forbidden"
  };
  manifest.frames = ["anticipation", "windup", "contact", "follow-through", "recovery"];
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const authoredMoves = new Map([
    ...await authoredFrameBuffers(coreMoveMasterPath, coreRows, 4, 40, 4),
    ...await authoredFrameBuffers(supportMoveMasterPath, supportRows, 4, 40, 4),
    ...await authoredFrameBuffers(enemyMoveMasterPath, enemyRows, 5, 40, 4)
  ]);
  authoredMoves.set("archer", authoredMoves.get("huangzhong"));
  authoredMoves.set("strategist", authoredMoves.get("boss-zhangjiao"));
  const moveManifest = {
    version: 2,
    type: "combat-move-sprite-strip",
    cellSize,
    columns: 4,
    rows: 1,
    frames: ["left-contact", "left-pass", "right-contact", "right-pass"],
    anchor: "foot-center",
    rendering: { interpolation: "nearest", loop: true },
    sources: {
      core: "assets/characters/core-heroes-move-master-v3.webp",
      support: "assets/characters/support-heroes-move-master-v3.webp",
      chapter1Enemies: "assets/characters/chapter1-enemies-move-master-v3.webp"
    },
    assets: []
  };
  for (const [id, frames] of authoredMoves) {
    const asset = manifest.assets.find((entry) => entry.id === id);
    assert.ok(asset, `missing attack manifest identity for move sprite ${id}`);
    const normalized = await normalizedCoreFrames(frames);
    moveManifest.assets.push({ id, kind: asset.kind, path: await writeMoveSheet(asset, normalized) });
  }
  fs.writeFileSync(moveManifestPath, `${JSON.stringify(moveManifest, null, 2)}\n`, "utf8");
  console.log(`Generated ${authored.size} high-detail v3 action sheets and ${moveManifest.assets.length} move strips.`);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
