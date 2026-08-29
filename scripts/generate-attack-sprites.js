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

async function bodyLayer(spec) {
  const bodyPath = spec.bodyPath && fs.existsSync(spec.bodyPath)
    ? spec.bodyPath
    : path.join(outputDir, `combat-body-${spec.id}-v1.webp`);

  if (fs.existsSync(bodyPath)) {
    const width = spec.kind === "boss" ? 48 : 36;
    const height = spec.kind === "boss" ? 54 : 44;
    return sharp(bodyPath)
      .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .png()
      .toBuffer();
  }

  // Fallback if file not found
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44"><rect x="6" y="8" width="24" height="32" rx="3" fill="#632722"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function poseOverlay(accent, frame, column = 0) {
  // Pure clean transparent frame without any crude geometric rect or line patchwork
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"></svg>`;
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
    bodyPath: path.join(outputDir, `combat-body-${hero.id}-v1.webp`)
  }));

  const enemySpecs = ["bandit", "brute", "cavalry", "archer", "strategist"].map((id) => ({
    id,
    kind: "enemy",
    accent: id === "archer" ? "#8fb578" : id === "strategist" ? "#9d82c4" : "#d9534f",
    bodyPath: path.join(outputDir, `combat-body-${id}-v1.webp`)
  }));

  const bossAssetByGeneral = { zhangjiao: "zhangjiao", dongzhuo: "dongzhuo", lvbu: "lvbu", menghuo: "menghuo" };
  const bossSpecs = Object.entries(bossAssetByGeneral).map(([id, assetId]) => ({
    id: "boss-" + id,
    kind: "boss",
    accent: hexColor(data.enemyGenerals.find((item) => item.id === id)?.accent, "#d29f3a"),
    bodyPath: path.join(outputDir, `boss-${assetId}-v1.webp`)
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
        const top = spec.kind === "boss" ? 6 : 14;
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

