"use strict";

// Converts the ImageGen review outputs into lossless, transparent master sheets.
// This is intentionally a small, deterministic import step: it only removes a
// neutral matte that is connected to the outside edge and never chroma-keys
// pixels inside a character silhouette.
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const generatedRoot = process.argv[2]
  || process.env.TK_IMAGEGEN_ROOT
  || "C:/Users/user/.codex/generated_images/01a05ef0-bbb1-7300-854b-39bc90b93c5d";
const jobs = [
  {
    input: path.join(generatedRoot, "exec-33a15916-b56c-403d-bc7f-a325a841ac1b.png"),
    output: path.join(root, "assets/characters/core-heroes-action-master-v4-clean.webp"),
    matte: "neutral"
  },
  {
    input: path.join(generatedRoot, "exec-df3e6a86-67a5-4c85-98f2-c429e9f64a7f.png"),
    output: path.join(root, "assets/characters/core-heroes-move-master-v4-clean.webp"),
    matte: "neutral"
  },
  {
    input: path.join(generatedRoot, "exec-75fdf15e-c5d6-4346-b8cc-b68fc1b20ec2.png"),
    output: path.join(root, "assets/characters/chapter1-enemies-action-master-v4-clean.webp"),
    matte: "neutral"
  },
  {
    input: path.join(generatedRoot, "exec-0704feb7-22ce-4ea6-9f6e-ff41acfc0475.png"),
    output: path.join(root, "assets/characters/chapter1-enemies-move-master-v4-clean.webp"),
    matte: "preserve-alpha"
  }
];

function isNeutralMatte(r, g, b, alpha) {
  if (alpha <= 10) return true;
  const low = Math.min(r, g, b);
  const high = Math.max(r, g, b);
  return low >= 230 && high - low <= 14;
}

function removeConnectedNeutralMatte(data, width, height) {
  const size = width * height;
  const visited = new Uint8Array(size);
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (visited[index]) return;
    const offset = index * 4;
    if (!isNeutralMatte(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) return;
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
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) enqueue(x + dx, y + dy);
  }

  let removed = 0;
  for (let index = 0; index < size; index += 1) {
    if (visited[index]) {
      data[index * 4 + 3] = 0;
      removed += 1;
    }
  }
  return removed;
}

async function main() {
  for (const job of jobs) {
    const image = sharp(job.input).ensureAlpha();
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    const removed = job.matte === "neutral"
      ? removeConnectedNeutralMatte(data, info.width, info.height)
      : 0;
    await sharp(data, { raw: info }).webp({ lossless: true }).toFile(job.output);
    let opaque = 0;
    for (let offset = 3; offset < data.length; offset += 4) {
      if (data[offset] > 10) opaque += 1;
    }
    process.stdout.write(`${path.basename(job.output)} ${info.width}x${info.height} `
      + `removed=${removed} opaque=${opaque}\n`);
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
