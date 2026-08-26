"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const dataContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data", "game-data.js"), "utf8"), dataContext, { filename: "game-data.js" });
const data = dataContext.window.THREE_KINGDOMS_DATA;

assert.ok(data, "game data must expose a public data object");
assert.ok(data.heroes.length >= 50, "the roster should contain at least fifty heroes");
assert.equal(new Set(data.heroes.map((hero) => hero.id)).size, data.heroes.length, "hero ids must be unique");
assert.ok(data.heroes.every((hero) => hero.skillCooldown > 0 && hero.role), "every hero needs a role and skill cooldown");
assert.equal(data.paperDollSlots.length, 4, "paper doll must expose four equipment slots");
const mountSlot = data.paperDollSlots.find((slot) => slot.id === "mount");
assert.ok(mountSlot && mountSlot.choices.length >= 14, "mount paper-doll slot should contain the full mount pool");
assert.ok(mountSlot.choices.every((choice) => data.mountVisuals?.[choice.id]), "every mount needs a visual definition");
assert.ok(data.mountVisuals.redhare.tier >= 3 && data.mountVisuals["thunder-horse"].vfx, "high-tier mounts need detail metadata and VFX");
assert.ok(data.paperDollSlots.reduce((sum, slot) => sum + slot.choices.length, 0) >= 66, "equipment pool should contain at least sixty-six choices");
assert.ok(data.tactics.length >= 3, "the first release needs three tactics");
assert.ok(data.stages.length >= 100, "stage data must cover a long campaign");
assert.ok(data.stages.every((stage) => stage.waveCount === 3 && stage.enemyPool.length > 0), "each stage needs waves and an enemy pool");

const runtimeModules = [
  "game-core.js",
  "game-combat.js",
  "game-render.js",
  "game-ui.js",
  "game-main.js"
];
const gameSource = runtimeModules.map((file) => {
  const modulePath = path.join(root, "js", "game", file);
  assert.ok(fs.existsSync(modulePath), `runtime module missing: ${file}`);
  return fs.readFileSync(modulePath, "utf8");
}).join("\n");
for (const marker of ["function startStage", "function activeStageNumber", "function stageDefinition", "function waveCleared", "function partyDefeated", "skillCooldown", "function showOfflineReward"]) {
  assert.ok(gameSource.includes(marker), `game loop marker missing: ${marker}`);
}
assert.ok(fs.statSync(path.join(root, "game.js")).size < 2000, "legacy game.js should stay a small compatibility marker");

const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dataPosition = indexSource.indexOf("data/game-data.js");
const modulePositions = runtimeModules.map((file) => indexSource.indexOf(`js/game/${file}`));
assert.ok(dataPosition >= 0 && modulePositions.every((position) => position > dataPosition), "data must load before runtime modules");
assert.ok(modulePositions.every((position, index) => index === 0 || position > modulePositions[index - 1]), "runtime modules must load in dependency order");
assert.ok(fs.existsSync(path.join(root, "docs", "reference-analysis.md")), "reference analysis document missing");
assert.ok(fs.existsSync(path.join(root, "docs", "architecture.md")), "architecture document missing");
assert.ok(fs.existsSync(path.join(root, "docs", "game-completion-plan.md")), "completion plan document missing");

console.log(`Smoke test passed: ${data.heroes.length} heroes, ${data.stages.length} stages, ${data.paperDollSlots.length} paper-doll slots.`);
