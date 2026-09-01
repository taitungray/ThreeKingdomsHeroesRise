"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const characterDir = path.join(root, "assets", "characters");
const actionMasterPath = path.join(characterDir, "core-heroes-action-master-v4.webp");
const moveMasterPath = path.join(characterDir, "core-heroes-move-master-v4.webp");
const cellSize = 128;
const actionColumns = 8;
const actionRows = 5;
const pilotRows = new Map([
  ["liubei", 0],
  ["guanyu", 1],
  ["zhangfei", 2],
  ["zhaoyun", 3]
]);

function isBackgroundCandidate(r, g, b, alpha, minimum = 172, tolerance = 62) {
  if (alpha <= 10) return true;
  const high = Math.max(r, g, b);
  const low = Math.min(r, g, b);
  return high >= minimum && high - low <= tolerance;
}

function removeConnectedBackground(data, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (visited[index]) return;
    const offset = index * 4;
    if (!isBackgroundCandidate(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) return;
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
    data[index * 4 + 3] = visited[index] ? 0 : 255;
  }

  // Clear enclosed neutral background holes
  const holeVisited = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (visited[idx] || holeVisited[idx]) continue;
      const off = idx * 4;
      const r = data[off];
      const g = data[off + 1];
      const b = data[off + 2];
      const high = Math.max(r, g, b);
      const low = Math.min(r, g, b);
      const isNeutralWhite = (high >= 215 && high - low <= 25);
      const isChromaMagenta = (r >= 200 && b >= 180 && g <= 80 && r - g >= 120 && b - g >= 100);
      if (!isNeutralWhite && !isChromaMagenta) continue;

      const holeQueue = [idx];
      holeVisited[idx] = 1;
      const component = [idx];
      let hHead = 0;
      while (hHead < holeQueue.length) {
        const cIdx = holeQueue[hHead++];
        const cx = cIdx % width;
        const cy = Math.floor(cIdx / width);
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nIdx = ny * width + nx;
          if (visited[nIdx] || holeVisited[nIdx]) continue;
          const nOff = nIdx * 4;
          const nr = data[nOff];
          const ng = data[nOff + 1];
          const nb = data[nOff + 2];
          const nHigh = Math.max(nr, ng, nb);
          const nLow = Math.min(nr, ng, nb);
          if ((nHigh >= 215 && nHigh - nLow <= 25) || (nr >= 200 && nb >= 180 && ng <= 80 && nr - ng >= 120 && nb - ng >= 100)) {
            holeVisited[nIdx] = 1;
            holeQueue.push(nIdx);
            component.push(nIdx);
          }
        }
      }
      if (component.length >= 6) {
        for (const cIdx of component) {
          visited[cIdx] = 1;
          data[cIdx * 4 + 3] = 0;
        }
      }
    }
  }

  // Remove only pale pixels touching the extracted exterior. This keeps white
  // cloth and Zhao Yun's silver highlights while clearing generated mattes.
  for (let pass = 0; pass < 3; pass += 1) {
    const remove = [];
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        const offset = index * 4;
        if (data[offset + 3] === 0) continue;
        const high = Math.max(data[offset], data[offset + 1], data[offset + 2]);
        const low = Math.min(data[offset], data[offset + 1], data[offset + 2]);
        const isPale = (high >= 170 && high - low <= 28)
          || (high >= 190 && high - low <= 42)
          || (high >= 220 && high - low <= 55);
        if (!isPale) continue;
        const touchesAlpha = data[offset - 4 + 3] === 0
          || data[offset + 4 + 3] === 0
          || data[offset - width * 4 + 3] === 0
          || data[offset + width * 4 + 3] === 0;
        if (touchesAlpha) remove.push(offset + 3);
      }
    }
    for (const alphaOffset of remove) data[alphaOffset] = 0;
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

async function extractFrames(sourcePath, columnCount, flopIds = new Set()) {
  assert.ok(fs.existsSync(sourcePath), `missing v4 pilot master: ${path.basename(sourcePath)}`);
  const metadata = await sharp(sourcePath).metadata();
  assert.ok(metadata.width >= 1200 && metadata.height >= 960, `${path.basename(sourcePath)} resolution is too small`);
  const result = new Map();

  for (const [heroId, row] of pilotRows) {
    const frames = [];
    for (let column = 0; column < columnCount; column += 1) {
      const left = Math.round(column * metadata.width / columnCount);
      const right = Math.round((column + 1) * metadata.width / columnCount);
      const top = Math.round(row * metadata.height / pilotRows.size);
      const bottom = Math.round((row + 1) * metadata.height / pilotRows.size);
      const { data, info } = await sharp(sourcePath)
        .extract({ left, top, width: right - left, height: bottom - top })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      removeConnectedBackground(data, info.width, info.height);

      // Generated long weapons can graze the cell seam; keep a narrow safe
      // gutter so adjacent heroes never leak into the current combat frame.
      const gutter = Math.max(5, Math.round(info.width * 0.018));
      for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < gutter; x += 1) {
          data[(y * info.width + x) * 4 + 3] = 0;
          data[(y * info.width + info.width - 1 - x) * 4 + 3] = 0;
        }
      }

      let pipeline = sharp(data, { raw: info })
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .resize(cellSize - 6, cellSize - 6, {
          fit: "contain",
          position: "bottom",
          kernel: sharp.kernel.nearest,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: 4,
          bottom: 2,
          left: 3,
          right: 3,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        });
      // Runtime facing invariant: all source frames must face right.
      if (flopIds.has(heroId)) pipeline = pipeline.flop();
      const normalized = await pipeline
        .png()
        .toBuffer();
      // Movement cells keep one connected body/weapon silhouette. A detached
      // island here is almost always a neighboring cell's weapon fragment.
      frames.push(await removeSmallAlphaIslands(normalized, 96, columnCount === 4));
    }
    result.set(heroId, frames);
  }
  return result;
}

async function safeWriteFile(filePath, buffer, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      fs.writeFileSync(filePath, buffer);
      return;
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise((resolve) => setTimeout(resolve, 80 * (i + 1)));
    }
  }
}

async function writeActionSheet(id, frames) {
  assert.equal(frames.length, 5, `${id} needs five v4 action phases`);
  const composites = [];
  for (let row = 0; row < actionRows; row += 1) {
    for (let column = 0; column < actionColumns; column += 1) {
      composites.push({ input: frames[row], left: column * cellSize, top: row * cellSize });
    }
  }
  const outputName = `attack-${id}-v4.webp`;
  const buf = await sharp({
    create: {
      width: actionColumns * cellSize,
      height: actionRows * cellSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite(composites).webp({ lossless: true }).toBuffer();
  await safeWriteFile(path.join(characterDir, outputName), buf);
  return `assets/characters/${outputName}`;
}

async function writeMoveStrip(id, frames) {
  assert.equal(frames.length, 4, `${id} needs four v4 movement phases`);
  const outputName = `move-${id}-v4.webp`;
  const buf = await sharp({
    create: {
      width: frames.length * cellSize,
      height: cellSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite(frames.map((input, column) => ({ input, left: column * cellSize, top: 0 })))
    .webp({ lossless: true })
    .toBuffer();
  await safeWriteFile(path.join(characterDir, outputName), buf);
  return `assets/characters/${outputName}`;
}

async function main() {
  const actionFrames = await extractFrames(actionMasterPath, 5, new Set());
  // v4 move master already faces RIGHT for all four pilots; flopping guanyu caused LEFT sheets and moonwalking.
  const moveFrames = await extractFrames(moveMasterPath, 4, new Set());

  for (const id of pilotRows.keys()) {
    const attackPath = await writeActionSheet(id, actionFrames.get(id));
    const movePath = await writeMoveStrip(id, moveFrames.get(id));
    process.stdout.write(`generated reference ${attackPath} and ${movePath}\n`);
  }

  console.log(`Generated ${pilotRows.size} inactive v4 references at ${cellSize}px; runtime manifests were not changed.`);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
