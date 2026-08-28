"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "assets", "characters");
const cellSize = 64;
const columns = 8;
const rows = 5;

function hexColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(value || "") ? value : fallback;
}

async function enemyBodyBuffer(type) {
  const palettes = {
    bandit: { body: "#8f3630", light: "#b34935", dark: "#35231f" },
    brute: { body: "#565858", light: "#8d8a7b", dark: "#2a2d2d" },
    cavalry: { body: "#795347", light: "#b47b5c", dark: "#34251f" },
    archer: { body: "#557451", light: "#91a65e", dark: "#283626" },
    strategist: { body: "#5a527d", light: "#a18bc2", dark: "#27243d" }
  };
  const palette = palettes[type] || palettes.bandit;
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="42">',
    '<rect x="8" y="18" width="20" height="18" fill="' + palette.body + '"/>',
    '<rect x="6" y="20" width="5" height="14" fill="' + palette.light + '"/>',
    '<rect x="25" y="20" width="5" height="14" fill="' + palette.light + '"/>',
    '<rect x="10" y="8" width="16" height="12" fill="' + palette.light + '"/>',
    '<rect x="8" y="6" width="20" height="5" fill="' + palette.dark + '"/>',
    '<rect x="11" y="38" width="6" height="3" fill="' + palette.dark + '"/>',
    '<rect x="19" y="38" width="6" height="3" fill="' + palette.dark + '"/>',
    "</svg>"
  ].join("");
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function bodyLayer(spec) {
  if (spec.bodyPath && fs.existsSync(spec.bodyPath)) {
    const width = spec.kind === "boss" ? 48 : 36;
    const height = spec.kind === "boss" ? 54 : 42;
    return sharp(spec.bodyPath)
      .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .png()
      .toBuffer();
  }
  return enemyBodyBuffer(spec.id);
}

async function poseOverlay(accent, frame) {
  const reach = [-4, -2, 8, 12, 4][frame] || 0;
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">',
    '<line x1="28" y1="38" x2="' + (36 + reach) + '" y2="' + (30 - reach) + '" stroke="#241e19" stroke-width="5" stroke-linecap="square"/>',
    '<line x1="28" y1="38" x2="' + (36 + reach) + '" y2="' + (30 - reach) + '" stroke="' + accent + '" stroke-width="2" stroke-linecap="square"/>',
    frame >= 2 ? '<rect x="' + (34 + reach) + '" y="' + (28 - reach) + '" width="5" height="5" fill="#e1b34d"/>' : "",
    "</svg>"
  ].join("");
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function main() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "data", "game-data.js"), "utf8"), context, { filename: "game-data.js" });
  const data = context.window.THREE_KINGDOMS_DATA;
  const heroSpecs = data.heroes.map((hero) => ({
    id: hero.id,
    kind: "hero",
    accent: hexColor(hero.accent, "#d8bd62"),
    bodyPath: path.join(root, hero.combatSprite || ("assets/characters/combat-body-" + hero.id + "-v1.webp"))
  }));
  const enemySpecs = ["bandit", "brute", "cavalry", "archer", "strategist"].map((id) => ({
    id,
    kind: "enemy",
    accent: "#b34935",
    bodyPath: ""
  }));
  const bossAssetByGeneral = { zhangjiao: "zhangjiao", dongzhuo: "dongzhuo", lvbu: "lvbu", menghuo: "menghuo" };
  const bossSpecs = Object.entries(bossAssetByGeneral).map(([id, assetId]) => ({
    id: "boss-" + id,
    kind: "boss",
    accent: hexColor(data.enemyGenerals.find((item) => item.id === id)?.accent, "#d29f3a"),
    bodyPath: path.join(root, "assets", "characters", "boss-" + assetId + "-v1.webp")
  }));
  const specs = [...heroSpecs, ...enemySpecs, ...bossSpecs];
  const manifest = {
    version: 3,
    type: "combat-attack-sprite-sheet",
    cellSize,
    columns,
    rows,
    directions: ["east", "southeast", "south", "southwest", "west", "northwest", "north", "northeast"],
    frames: ["anticipation", "windup", "contact", "follow-through", "recovery"],
    anchor: "foot-center",
    rendering: { pixelRatio: 1, interpolation: "nearest", fallback: "procedural-canvas" },
    assets: []
  };
  for (const spec of specs) {
    const body = await bodyLayer(spec);
    const overlays = await Promise.all([0, 1, 2, 3, 4].map((frame) => poseOverlay(spec.accent, frame)));
    const composites = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const left = spec.kind === "boss" ? 8 : 14;
        const top = spec.kind === "boss" ? 6 : 16;
        composites.push({ input: body, left: column * cellSize + left, top: row * cellSize + top });
        composites.push({ input: overlays[row], left: column * cellSize, top: row * cellSize });
      }
    }
    const outputName = "attack-" + spec.id + "-v1.webp";
    await sharp({
      create: {
        width: columns * cellSize,
        height: rows * cellSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    }).composite(composites).webp({ lossless: true }).toFile(path.join(outputDir, outputName));
    manifest.assets.push({ id: spec.id, kind: spec.kind, path: "assets/characters/" + outputName });
    process.stdout.write("generated " + outputName + "\n");
  }
  fs.writeFileSync(path.join(outputDir, "attack-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log("Generated " + manifest.assets.length + " attack sprite sheets.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
