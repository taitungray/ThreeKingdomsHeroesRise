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
const frameRotations = [-24, -14, 12, 27, 8];
const frameReach = [-7, -3, 14, 21, 10];

function hexColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(value || "") ? value : fallback;
}

function imageMarkup(base64, x, y, width, height) {
  return '<image href="data:image/webp;base64,' + base64 + '" x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" preserveAspectRatio="none"/>';
}

function enemyBodyMarkup(type) {
  const palettes = {
    bandit: { body: "#8f3630", light: "#b34935", dark: "#35231f" },
    brute: { body: "#565858", light: "#8d8a7b", dark: "#2a2d2d" },
    cavalry: { body: "#795347", light: "#b47b5c", dark: "#34251f" },
    archer: { body: "#557451", light: "#91a65e", dark: "#283626" },
    strategist: { body: "#5a527d", light: "#a18bc2", dark: "#27243d" }
  };
  const palette = palettes[type] || palettes.bandit;
  return [
    '<rect x="20" y="39" width="25" height="21" fill="' + palette.body + '"/>',
    '<rect x="16" y="43" width="6" height="16" fill="' + palette.light + '"/>',
    '<rect x="43" y="43" width="6" height="16" fill="' + palette.light + '"/>',
    '<rect x="22" y="23" width="20" height="17" fill="' + palette.light + '"/>',
    '<rect x="18" y="20" width="28" height="7" fill="' + palette.dark + '"/>',
    '<rect x="25" y="35" width="4" height="3" fill="' + palette.dark + '"/>',
    '<rect x="35" y="35" width="4" height="3" fill="' + palette.dark + '"/>',
    type === "brute" ? '<rect x="14" y="18" width="6" height="16" fill="#d8bd72"/><rect x="42" y="18" width="6" height="16" fill="#d8bd72"/>' : "",
    type === "archer" ? '<path d="M47 29 Q58 42 47 54" fill="none" stroke="#d6b76a" stroke-width="2"/>' : "",
    type === "strategist" ? '<circle cx="32" cy="17" r="5" fill="#d8bd72"/>' : "",
    '<rect x="24" y="61" width="7" height="3" fill="' + palette.dark + '"/>',
    '<rect x="34" y="61" width="7" height="3" fill="' + palette.dark + '"/>'
  ].join("");
}

function frameMarkup(bodyMarkup, accent, direction, frame, column, row) {
  const baseAngle = direction * 45;
  const angle = (baseAngle + frameRotations[frame]) * Math.PI / 180;
  const lean = baseAngle + frameRotations[frame] * 0.26;
  const reach = frameReach[frame];
  const pullX = Math.cos(angle) * reach;
  const pullY = Math.sin(angle) * reach;
  const shoulderX = 39;
  const shoulderY = 42;
  const offShoulderX = 27;
  const offShoulderY = 42;
  const handX = shoulderX + pullX;
  const handY = shoulderY + pullY;
  const offHandX = offShoulderX + pullX * 0.54;
  const offHandY = offShoulderY + pullY * 0.54;
  const cellX = column * cellSize;
  const cellY = row * cellSize;
  const alpha = frame === 2 ? 0.95 : frame === 3 ? 0.68 : 0.5;
  const outline = "#241e19";
  const gold = "#e1b34d";
  return [
    '<g transform="translate(' + cellX + ',' + cellY + ')" shape-rendering="crispEdges">',
    '<g transform="rotate(' + lean.toFixed(2) + ',32,64)">',
    bodyMarkup,
    '</g>',
    '<g stroke-linecap="square" stroke-linejoin="miter">',
    '<line x1="' + shoulderX + '" y1="' + shoulderY + '" x2="' + handX.toFixed(2) + '" y2="' + handY.toFixed(2) + '" stroke="' + outline + '" stroke-width="6"/>',
    '<line x1="' + shoulderX + '" y1="' + shoulderY + '" x2="' + handX.toFixed(2) + '" y2="' + handY.toFixed(2) + '" stroke="' + accent + '" stroke-width="2.5"/>',
    '<line x1="' + offShoulderX + '" y1="' + offShoulderY + '" x2="' + offHandX.toFixed(2) + '" y2="' + offHandY.toFixed(2) + '" stroke="' + outline + '" stroke-width="5"/>',
    '<line x1="' + offShoulderX + '" y1="' + offShoulderY + '" x2="' + offHandX.toFixed(2) + '" y2="' + offHandY.toFixed(2) + '" stroke="' + accent + '" stroke-width="1.7"/>',
    '<rect x="' + Math.round(handX - 2) + '" y="' + Math.round(handY - 2) + '" width="4" height="4" fill="' + gold + '"/>',
    frame >= 2 ? '<line opacity="' + alpha + '" x1="' + (handX - Math.cos(angle) * 4).toFixed(2) + '" y1="' + (handY - Math.sin(angle) * 4).toFixed(2) + '" x2="' + (handX - Math.cos(angle) * 25).toFixed(2) + '" y2="' + (handY - Math.sin(angle) * 25).toFixed(2) + '" stroke="' + accent + '" stroke-width="2"/>' : "",
    frame === 2 ? '<rect x="' + Math.round(handX - 3) + '" y="' + Math.round(handY - 3) + '" width="6" height="6" fill="' + gold + '"/>' : "",
    '</g>',
    '</g>'
  ].join("");
}

async function main() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "data", "game-data.js"), "utf8"), context, { filename: "game-data.js" });
  const data = context.window.THREE_KINGDOMS_DATA;
  const heroes = data.heroes;
  const heroSpecs = heroes.map((hero) => {
    const bodyPath = path.join(root, hero.combatSprite || ("assets/characters/combat-body-" + hero.id + "-v1.webp"));
    if (!fs.existsSync(bodyPath)) throw new Error("Missing combat body for " + hero.id);
    return {
      id: hero.id,
      kind: "hero",
      accent: hexColor(hero.accent, "#d8bd62"),
      bodyMarkup: imageMarkup(fs.readFileSync(bodyPath).toString("base64"), 16, 26, 32, 38)
    };
  });
  const enemySpecs = ["bandit", "brute", "cavalry", "archer", "strategist"].map((id) => ({
    id,
    kind: "enemy",
    accent: "#b34935",
    bodyMarkup: enemyBodyMarkup(id)
  }));
  const bossAssetByGeneral = { zhangjiao: "zhangjiao", dongzhuo: "dongzhuo", lvbu: "lvbu", menghuo: "menghuo" };
  const bossSpecs = Object.entries(bossAssetByGeneral).map(([id, assetId]) => {
    const bodyPath = path.join(root, "assets", "characters", "boss-" + assetId + "-v1.webp");
    if (!fs.existsSync(bodyPath)) throw new Error("Missing boss body for " + assetId);
    const general = data.enemyGenerals.find((item) => item.id === id);
    return {
      id: "boss-" + id,
      kind: "boss",
      accent: hexColor(general?.accent, "#d29f3a"),
      bodyMarkup: imageMarkup(fs.readFileSync(bodyPath).toString("base64"), 0, 6, 64, 58)
    };
  });
  const specs = [...heroSpecs, ...enemySpecs, ...bossSpecs];
  const manifest = {
    version: 2,
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
    const cells = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) cells.push(frameMarkup(spec.bodyMarkup, spec.accent, column, row, column, row));
    }
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + (columns * cellSize) + '" height="' + (rows * cellSize) + '" viewBox="0 0 ' + (columns * cellSize) + ' ' + (rows * cellSize) + '">',
      cells.join(""),
      '</svg>'
    ].join("");
    const outputName = "attack-" + spec.id + "-v1.webp";
    await sharp(Buffer.from(svg)).webp({ lossless: true }).toFile(path.join(outputDir, outputName));
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
