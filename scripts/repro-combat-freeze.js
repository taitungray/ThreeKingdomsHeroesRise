"use strict";

/**
 * Headless repro: boot combat modules and run updateGame for several seconds.
 * Fails if units never move, loop throws, or spawning sticks forever.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function loadScript(context, relativePath) {
  const absolute = path.join(root, relativePath);
  const code = fs.readFileSync(absolute, "utf8");
  vm.runInContext(code, context, { filename: relativePath });
}

const elements = new Map();
function makeEl(id) {
  if (elements.has(id)) return elements.get(id);
  const el = {
    id,
    textContent: "",
    hidden: false,
    className: "",
    classList: {
      _set: new Set(),
      add(name) { this._set.add(name); },
      remove(name) { this._set.delete(name); },
      toggle(name, force) {
        if (force === undefined) {
          if (this._set.has(name)) this._set.delete(name);
          else this._set.add(name);
          return;
        }
        if (force) this._set.add(name);
        else this._set.delete(name);
      },
      contains(name) { return this._set.has(name); }
    },
    style: {},
    dataset: {},
    disabled: false,
    setAttribute() {},
    getAttribute() { return null; },
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    closest() { return null; },
    appendChild() {},
    remove() {},
    offsetWidth: 100,
    getContext() {
      return createCtx();
    }
  };
  elements.set(id, el);
  return el;
}

function createCtx() {
  const noop = () => {};
  return {
    canvas: { width: 390, height: 720 },
    imageSmoothingEnabled: false,
    save: noop, restore: noop, beginPath: noop, closePath: noop, fill: noop, stroke: noop,
    fillRect: noop, strokeRect: noop, clearRect: noop, fillText: noop, strokeText: noop,
    moveTo: noop, lineTo: noop, arc: noop, ellipse: noop, translate: noop, rotate: noop, scale: noop,
    quadraticCurveTo: noop, bezierCurveTo: noop, rect: noop, drawImage: noop,
    setTransform: noop, resetTransform: noop, clip: noop, transform: noop,
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => ({}),
    globalAlpha: 1, fillStyle: "#000", strokeStyle: "#000", lineWidth: 1, font: "10px sans-serif",
    textAlign: "left", textBaseline: "alphabetic", globalCompositeOperation: "source-over",
    shadowColor: "", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0
  };
}

["battleCanvas", "toast", "dialogueBox", "dialoguePortrait", "dialogueName", "dialogueText",
  "bossBanner", "bossName", "bossButton", "bossProgress", "goldValue", "foodValue", "jadeValue",
  "shardValue", "lordName", "lordLevel", "armyTitle", "expText", "expFill", "stageCompactLabel",
  "waveChip", "enemyPreview", "enemyPreviewList", "enemyPreviewStage", "enemyPreviewLabel",
  "speedButton", "mailDot", "dailyDot", "eventDot", "railMoreDot", "autoButton", "profileButton",
  "loadingScreen", "settlementModal", "offlineModal", "panelBackdrop", "gamePanel", "panelContent",
  "panelTitle", "panelClose", "panelBack", "comboMeter", "comboValue", "heroNotice", "authMessage",
  "tutorialLayer", "tutorialNext", "tutorialSkip", "settlementPrimary", "settlementSecondary",
  "claimOffline", "doubleOffline", "railMoreButton", "rightRailDrawer"
].forEach(makeEl);

const timers = [];
const context = {
  console,
  Math, JSON, Date, Array, Object, Number, String, Boolean, Set, Map, WeakMap, WeakSet,
  parseInt, parseFloat, isNaN, isFinite, Infinity, NaN, undefined,
  EncodeURIComponent: encodeURIComponent, decodeURIComponent,
  encodeURIComponent, decodeURIComponent,
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  setTimeout: (fn, ms) => {
    const id = { fn, due: Date.now() + (ms || 0) };
    timers.push(id);
    return id;
  },
  clearTimeout: (id) => {
    const i = timers.indexOf(id);
    if (i >= 0) timers.splice(i, 1);
  },
  setInterval: () => 1,
  clearInterval: () => {},
  localStorage: {
    _data: Object.create(null),
    getItem(k) { return this._data[k] ?? null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  document: {
    hidden: false,
    body: { appendChild() {} },
    getElementById: (id) => makeEl(id),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    createElement: () => makeEl("anon-" + Math.random())
  },
  window: {
    THREE_KINGDOMS_DATA: null,
    TaoyuanPlatform: { track() {}, reportError() {} },
    TaoyuanAudio: { sfx() {}, startMusic() {} },
    TaoyuanAds: { showRewardedAd: async () => false },
    TaoyuanAuth: { ready: Promise.resolve() },
    TaoyuanIAP: { restore: async () => ({ ok: false }) },
    addEventListener() {},
    requestAnimationFrame: () => 0
  },
  Image: class { constructor() { this.onload = null; this.onerror = null; this.src = ""; } },
  HTMLCanvasElement: class {},
  Event: class {},
  CustomEvent: class {}
};
context.globalThis = context;
context.self = context;
context.window.document = context.document;
context.window.localStorage = context.localStorage;
context.window.performance = context.performance;
vm.createContext(context);

loadScript(context, "data/game-data.js");
context.window.THREE_KINGDOMS_DATA = context.window.THREE_KINGDOMS_DATA;
loadScript(context, "data/shop-data.js");

const runtimeModules = [
  "js/game/game-core.js",
  "js/game/game-combat.js",
  "js/game/game-render.js",
  "js/game/game-ui.js"
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n;\n");
vm.runInContext(
  runtimeModules +
  "\n;this.__runtime = runtime; this.__save = save; this.__HEROES = HEROES;" +
  "this.__resetAllies = resetAllies; this.__spawnWave = spawnWave; this.__updateGame = updateGame;" +
  "this.__render = render; this.__useHeroSkill = typeof useHeroSkill === 'function' ? useHeroSkill : null;",
  context,
  { filename: "game-bundle.js" }
);

const runtime = context.__runtime;
const save = context.__save;
const HEROES = context.__HEROES;
const resetAllies = context.__resetAllies;
const spawnWave = context.__spawnWave;
const updateGame = context.__updateGame;
const render = context.__render;
assert.ok(runtime, "runtime missing");
assert.ok(typeof updateGame === "function", "updateGame missing");

// Minimal formation so combat can run.
save.formation = (HEROES || context.HEROES).filter((h) => h.unlock === 0).slice(0, 5).map((h) => h.id);
if (!save.formation.length) save.formation = ["liubei", "guanyu", "zhangfei"];
save.positions = Object.fromEntries(save.formation.map((id, i) => [id, i + 1]));
save.effects = true;
save.renderQuality = "high";
runtime.auto = true;
runtime.playSpeed = 1;
runtime.timeScale = 1;
runtime.backgrounded = false;
runtime.spawning = false;
runtime.hitStop = 0;
runtime.battleResult = null;

resetAllies();
spawnWave(false, false);

assert.ok(runtime.allies.length > 0, "allies must spawn");
assert.ok(runtime.enemies.length > 0, "enemies must spawn");

const allyStart = runtime.allies.map((u) => ({ id: u.id, x: u.x, y: u.y, hp: u.hp }));
const enemyStart = runtime.enemies.map((u) => ({ id: u.id, x: u.x, y: u.y, hp: u.hp }));

function flushTimers(now) {
  const due = timers.filter((t) => t.due <= now);
  for (const t of due) {
    const i = timers.indexOf(t);
    if (i >= 0) timers.splice(i, 1);
    t.fn();
  }
}

let errors = [];
const frames = 600; // 10 seconds at 60fps
const start = Date.now();
let skillPulses = 0;
const entryTracks = new Map();
const entryRegressions = [];
function trackEnemyEntry() {
  for (const enemy of runtime.enemies) {
    if (!Number.isFinite(enemy.entryY) || !Number.isFinite(enemy.targetY)) continue;
    const previous = entryTracks.get(enemy);
    if (!previous) {
      entryTracks.set(enemy, { id: enemy.id, first: enemy.entryY, last: enemy.entryY, target: enemy.targetY, frames: 1 });
      continue;
    }
    if (enemy.entryY + 0.05 < previous.last) entryRegressions.push(`${enemy.id}: ${previous.last} -> ${enemy.entryY}`);
    previous.last = enemy.entryY;
    previous.frames += 1;
  }
}
trackEnemyEntry();
for (let i = 0; i < frames; i += 1) {
  const now = start + i * (1000 / 60);
  try {
    flushTimers(now);
    // Periodically force skills to stress hitStop / timers.
    if (i > 0 && i % 90 === 0) {
      const ally = runtime.allies.find((u) => !u.dead);
      const enemy = runtime.enemies.find((u) => !u.dead);
      if (ally && enemy && context.__useHeroSkill) {
        context.__useHeroSkill(ally, enemy);
        skillPulses += 1;
      }
    }
    updateGame(1 / 60);
    trackEnemyEntry();
    render();
  } catch (error) {
    errors.push(error);
    break;
  }
}

const allyMoved = runtime.allies.some((u, i) => Math.hypot(u.x - allyStart[i].x, u.y - allyStart[i].y) > 0.5);
const enemyMoved = runtime.enemies.some((u) => {
  const startPos = enemyStart.find((e) => e.id === u.id);
  if (!startPos) return true;
  return Math.hypot(u.x - startPos.x, u.y - startPos.y) > 0.5 || u.hp < startPos.hp;
});
const anyDamage = runtime.allies.some((u, i) => u.hp !== allyStart[i].hp)
  || runtime.enemies.some((u) => {
    const startPos = enemyStart.find((e) => e.id === u.id);
    return startPos && u.hp < startPos.hp;
  })
  || runtime.enemies.length !== enemyStart.length
  || runtime.enemies.some((u) => u.dead);
const trackedEntries = [...entryTracks.values()].filter((track) => track.first < track.target - 1 && track.frames > 5);
const stalledEntries = trackedEntries.filter((track) => track.last < track.target - 1 && track.last <= track.first + 0.5);

console.log(JSON.stringify({
  allies: runtime.allies.length,
  enemies: runtime.enemies.length,
  spawning: runtime.spawning,
  hitStop: runtime.hitStop,
  playSpeed: runtime.playSpeed,
  timeScale: runtime.timeScale,
  auto: runtime.auto,
  allyMoved,
  enemyMoved,
  anyDamage,
  waveClears: runtime.waveClears,
  skillPulses,
  trackedEntries: trackedEntries.length,
  stalledEntries: stalledEntries.slice(0, 5),
  entryRegressions: entryRegressions.slice(0, 5),
  errors: errors.map((e) => String(e && e.stack || e)),
  allySample: runtime.allies.slice(0, 2).map((u) => ({ x: +u.x.toFixed(2), y: +u.y.toFixed(2), hp: u.hp, action: !!u.action, cooldown: +u.cooldown.toFixed(2) })),
  enemySample: runtime.enemies.slice(0, 2).map((u) => ({ x: +u.x.toFixed(2), y: +u.y.toFixed(2), hp: u.hp, dead: u.dead, entryY: u.entryY, targetY: u.targetY }))
}, null, 2));

assert.equal(errors.length, 0, "updateGame must not throw: " + (errors[0] && errors[0].stack));
assert.ok(allyMoved || enemyMoved || anyDamage, "combat must progress (move or deal damage) within 3s");
assert.ok(!runtime.spawning || runtime.battleResult, "spawning must not stick without settlement");
assert.equal(entryRegressions.length, 0, "enemy entryY must not move away from targetY: " + entryRegressions.join(", "));
assert.equal(stalledEntries.length, 0, "observed enemy entries must advance toward targetY: " + JSON.stringify(stalledEntries));
assert.ok(trackedEntries.length > 0, "the runtime test must observe at least one entering enemy over multiple frames");
console.log("Combat freeze repro PASSED");
