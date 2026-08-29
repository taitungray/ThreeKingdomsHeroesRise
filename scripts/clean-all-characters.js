"use strict";

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const charDir = path.join(root, "assets", "characters");

async function cleanTransparentAsset(srcPath, destPath, targetW = 44, targetH = 52) {
  if (!fs.existsSync(srcPath)) return false;
  
  const { data, info } = await sharp(srcPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const channels = info.channels;
  const mask = new Uint8Array(w * h); // 1 = background, 0 = foreground
  const queue = [];

  function isBackgroundCandidate(x, y) {
    const idx = (y * w + x) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = channels === 4 ? data[idx + 3] : 255;
    if (a < 30) return true;
    
    // Grey/White checkerboard pattern removal
    const isGrey = Math.abs(r - g) <= 8 && Math.abs(g - b) <= 8 && Math.abs(r - b) <= 8;
    const isWhiteSquare = (r >= 235 && g >= 235 && b >= 235);
    const isGreySquare = isGrey && (r >= 180 && r <= 230);
    const isBlackBg = (r < 25 && g < 25 && b < 25);
    return isWhiteSquare || isGreySquare || isBlackBg;
  }

  // Seed flood fill from image perimeter
  for (let x = 0; x < w; x++) {
    if (isBackgroundCandidate(x, 0)) { mask[0 * w + x] = 1; queue.push(x, 0); }
    if (isBackgroundCandidate(x, h - 1)) { mask[(h - 1) * w + x] = 1; queue.push(x, h - 1); }
  }
  for (let y = 0; y < h; y++) {
    if (isBackgroundCandidate(0, y)) { mask[y * w + 0] = 1; queue.push(0, y); }
    if (isBackgroundCandidate(w - 1, y)) { mask[y * w + (w - 1)] = 1; queue.push(w - 1, y); }
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    
    const neighbors = [
      [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nidx = ny * w + nx;
        if (mask[nidx] === 0 && isBackgroundCandidate(nx, ny)) {
          mask[nidx] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }

  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const idx = i * channels;
    if (mask[i] === 1) {
      out[i * 4 + 3] = 0;
    } else {
      out[i * 4] = data[idx];
      out[i * 4 + 1] = data[idx + 1];
      out[i * 4 + 2] = data[idx + 2];
      out[i * 4 + 3] = 255;
    }
  }

  const trimmed = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 5 })
    .toBuffer({ resolveWithObject: true });

  await sharp(trimmed.data, { raw: { width: trimmed.info.width, height: trimmed.info.height, channels: 4 } })
    .resize(targetW, targetH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 100, lossless: true })
    .toFile(destPath);

  return true;
}

async function main() {
  const files = fs.readdirSync(charDir).filter((f) => f.startsWith("combat-body-") && f.endsWith(".webp"));
  console.log("Cleaning " + files.length + " character body assets...");
  for (const file of files) {
    const filePath = path.join(charDir, file);
    await cleanTransparentAsset(filePath, filePath, 44, 52);
  }
  console.log("All character assets cleaned with true alpha transparency.");
}

main().catch(console.error);
