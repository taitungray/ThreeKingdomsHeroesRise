"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const { runDocChecks } = require("./check-docs");
function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(absolute) : [absolute];
  });
}
const imageRoots = [path.join(root, "assets"), path.join(root, "android", "app", "src", "main", "res")];
const nonWebpImageFiles = imageRoots.flatMap(collectFiles).filter((file) => /\.(png|jpe?g|gif)$/i.test(file));
assert.equal(nonWebpImageFiles.length, 0, "all project raster assets must use WebP");
const dataContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data", "game-data.js"), "utf8"), dataContext, { filename: "game-data.js" });
const data = dataContext.window.THREE_KINGDOMS_DATA;

assert.ok(data, "game data must expose a public data object");
assert.ok(data.heroes.length >= 50, "the roster should contain at least fifty heroes");
assert.equal(new Set(data.heroes.map((hero) => hero.id)).size, data.heroes.length, "hero ids must be unique");
assert.ok(data.heroes.every((hero) => hero.skillCooldown > 0 && hero.role), "every hero needs a role and skill cooldown");
const declaredPortraits = data.heroes.filter((hero) => hero.portrait);
assert.equal(declaredPortraits.length, data.heroes.length, "every hero should resolve to a generated portrait family");
assert.ok(declaredPortraits.every((hero) => fs.existsSync(path.join(root, hero.portrait))), "portrait assets that are declared in data must exist");
const declaredCombatSprites = data.heroes.filter((hero) => hero.combatSprite);
assert.equal(declaredCombatSprites.length, data.heroes.length, "every hero should resolve to a combat sprite family");
assert.ok(declaredCombatSprites.every((hero) => fs.existsSync(path.join(root, hero.combatSprite))), "combat sprite assets that are declared in data must exist");
assert.equal(data.paperDollSlots.length, 4, "paper doll must expose four equipment slots");
const mountSlot = data.paperDollSlots.find((slot) => slot.id === "mount");
assert.ok(mountSlot && mountSlot.choices.length >= 14, "mount paper-doll slot should contain the full mount pool");
assert.ok(mountSlot.choices.every((choice) => data.mountVisuals?.[choice.id]), "every mount needs a visual definition");
assert.ok(data.mountVisuals.redhare.tier >= 3 && data.mountVisuals["thunder-horse"].vfx, "high-tier mounts need detail metadata and VFX");
assert.ok(data.paperDollSlots.reduce((sum, slot) => sum + slot.choices.length, 0) >= 66, "equipment pool should contain at least sixty-six choices");
assert.ok(data.tactics.length >= 3, "the first release needs three tactics");
assert.ok(Object.keys(data.skillSpecs || {}).length >= 11, "core skill specs must be data-driven");
assert.ok(data.dailyTasks?.length >= 6 && data.weeklyTasks?.length >= 2, "daily and weekly task contracts must exist");
assert.ok(data.checkinRewards?.length >= 7, "weekly check-in contract must exist");
assert.ok(data.shopItems?.length >= 6, "shop contract must include local and native-safe products");
assert.ok(data.dailyDungeons?.length >= 3 && data.treasures?.length >= 5, "local daily mode and treasure contracts must exist");
assert.ok(data.bonds?.length >= 3 && Object.keys(data.factionByHero || {}).length >= 4, "faction and bond contracts must exist");
assert.ok(data.avatarFrames?.length >= 4, "avatar frame data must be present");
assert.ok(data.announcements?.length >= 2, "announcement data must be present");
assert.ok(data.localEvents?.length >= 1, "local event data must be present");
assert.ok(data.titles?.length >= 5 && data.tower?.powerStep > 0, "title and endless tower contracts must exist");
assert.ok(data.stages.length >= 100, "stage data must cover a long campaign");
assert.ok(data.enemyGenerals && data.enemyGenerals.length >= 8, "enemy-general preview data must contain named portraits");
assert.equal(new Set(data.enemyGenerals.map((general) => general.id)).size, data.enemyGenerals.length, "enemy-general ids must be unique");
assert.ok(data.stages.every((stage) => stage.waveCount === 3 && stage.enemyPool.length > 0), "each stage needs waves and an enemy pool");
assert.ok(data.stages.every((stage) => stage.name && stage.enemyGenerals?.length >= 3 && stage.bossGeneral), "each stage needs a name and one named general per wave");

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
for (const marker of ["function spawnResourceDrops", "function updateResourceDrops", "function drawResourceDrops", "runtime.drops", "function roleAdvantage", "function targetPriorityScore", "function damageSummary", "function heroSkillCost", "function drawWeatherOverlay", "function damageStatsHtml", "data-action=\"hero-skill\"", "function startStage", "function enemyGeneralById", "function showEnemyPreview", "enemyPreviewList", "enemyPreviewLabel", "waveGeneralIndex", "runtime.enemyPreviewTimer = setTimeout", "function beginWaveTransition", "showTransition && !boss", "playSpeed", "function drawWaveTransitionOverlay", "function toggleRailDrawer", "stageCompactLabel", "waveChip", "rightRailDrawer", "function activeStageNumber", "function stageDefinition", "function waveCleared", "function partyDefeated", "skillCooldown", "function showOfflineReward", "function renderAchievements", "function renderCollection", "function renderEvents", "function upgradeHeroStar", "function breakthroughHero", "function renderFrameSection", "function heroProgression", "function renderDungeons", "function challengeTower", "function sweepStage", "function refineHeroEquipment", "function refillStamina", "function drawCompactHeroDetails", "function drawHealthBar", "const spriteX = unit.scale < 1", "const gait = unit.moving ? walkCycle : 0", "function drawMountLeg", "function drawSkillEnergyBar", "const y = Math.round(visualY +", "const ALLY_UNIT_SCALE = 1.22", "const ENEMY_UNIT_SCALE = 1.12", "const BOSS_UNIT_SCALE = 1.68", "function directionIndex", "attackSpritePath", "const useAttackSprite", "const attackPaths", "attackFrame", "function directionLocalAngle", "function drawAttackPose", "function characterAnimationState", "function applyCombatBodyMotion", "function drawCombatBodySprite", "const actionTransform = Boolean(unit.action && !useAttackSprite)", "unit.type !== \"boss\"", "const boss = unit.type === \"boss\""]) {
  assert.ok(gameSource.includes(marker), `game loop marker missing: ${marker}`);
}
assert.ok(fs.statSync(path.join(root, "game.js")).size < 2000, "legacy game.js should stay a small compatibility marker");
assert.ok(fs.existsSync(path.join(root, "assets", "characters", "modular-manifest.json")), "modular asset manifest missing");
const attackManifestPath = path.join(root, "assets", "characters", "attack-manifest.json");
assert.ok(fs.existsSync(attackManifestPath), "attack sprite manifest missing");
const attackManifest = JSON.parse(fs.readFileSync(attackManifestPath, "utf8"));
assert.equal(attackManifest.cellSize, 64, "attack sprite cells must use the shared 64px grid");
assert.equal(attackManifest.columns, 8, "attack sprite sheets must expose eight directions");
assert.equal(attackManifest.rows, 5, "attack sprite sheets must expose five action frames");
const requiredAttackIds = [...data.heroes.map((hero) => hero.id), "bandit", "brute", "cavalry", "archer", "strategist", "boss-zhangjiao", "boss-dongzhuo", "boss-lvbu", "boss-menghuo"];
assert.equal(attackManifest.assets.length, requiredAttackIds.length, "every combat character needs an attack sprite sheet");
assert.ok(requiredAttackIds.every((id) => attackManifest.assets.some((asset) => asset.id === id)), "attack sprite manifest must cover heroes, enemy types and bosses");
assert.ok(attackManifest.assets.every((asset) => fs.existsSync(path.join(root, asset.path))), "declared attack sprite assets must exist");
assert.ok(fs.existsSync(path.join(root, "assets", "characters", "equipment-manifest.json")), "equipment asset manifest missing");
const combatWeaponManifestPath = path.join(root, "assets", "characters", "combat-weapon-manifest.json");
assert.ok(fs.existsSync(combatWeaponManifestPath), "combat weapon asset manifest missing");
const combatWeaponManifest = JSON.parse(fs.readFileSync(combatWeaponManifestPath, "utf8"));
assert.deepEqual(combatWeaponManifest.anchor, [32, 54], "combat weapons must share the hand anchor");
assert.equal(combatWeaponManifest.assets.length, 9, "combat weapon set must cover every combat weapon type");
assert.ok(combatWeaponManifest.assets.every((asset) => fs.existsSync(path.join(root, asset.path))), "declared combat weapon assets must exist");
assert.ok(fs.existsSync(path.join(root, "assets", "backgrounds", "terrain-manifest.json")), "terrain asset manifest missing");
assert.ok(fs.existsSync(path.join(root, "assets", "vfx", "vfx-manifest.json")), "VFX asset manifest missing");
assert.ok(fs.readdirSync(path.join(root, "assets", "characters")).filter((file) => file.startsWith("mount-") && file.endsWith(".webp")).length >= 14, "mount sprite assets must cover the mount pool");
assert.ok(fs.readdirSync(path.join(root, "assets", "vfx")).filter((file) => file.startsWith("vfx-") && file.endsWith(".webp")).length >= 16, "VFX sprite assets must cover the effect vocabulary");
assert.ok(fs.readdirSync(path.join(root, "assets", "backgrounds")).filter((file) => file.startsWith("terrain-tile-") && file.endsWith(".webp")).length >= 16, "terrain tile assets must cover the chapter palette");
assert.ok(["zhangjiao", "dongzhuo", "lvbu", "menghuo"].every((id) => fs.existsSync(path.join(root, "assets", "characters", "boss-" + id + "-v1.webp"))), "boss sprite assets must cover the boss set");
const authSource = fs.readFileSync(path.join(root, "js", "auth.js"), "utf8");
const audioSource = fs.readFileSync(path.join(root, "js", "audio.js"), "utf8");
assert.ok(authSource.includes("TaoyuanAuth") && authSource.includes("googleLogin") && authSource.includes("getSaveKey"), "Google auth module must expose cloud account saves");
const cloudSource = fs.readFileSync(path.join(root, "js", "cloud-save.js"), "utf8");
assert.ok(cloudSource.includes("taoyuan_qunying_saves") && cloudSource.includes("uploadToCloud") && cloudSource.includes("syncOnStartup"), "cloud save module must expose UID-scoped Firestore sync");
assert.ok(audioSource.includes("startMusic") && audioSource.includes("sfx"), "audio module must expose music and sound effects");
assert.ok(fs.existsSync(path.join(root, "assets", "icon.webp")), "app icon source missing");
assert.ok(fs.existsSync(path.join(root, "assets", "icons", "icon-192.webp")) && fs.existsSync(path.join(root, "assets", "icons", "icon-512.webp")), "PWA icon variants missing");
const styleSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");
for (const marker of ["Character portrait pass: distinct facial silhouettes", ".portrait-eyes::before", ".avatar-xiahoudun .portrait-eyes::before", ".portrait-rune"]) {
  assert.ok(styleSource.includes(marker), "portrait style marker missing: " + marker);
}
assert.ok(styleSource.includes("left: 50%") && styleSource.includes("transform: translate(-50%, 0)"), "dialogue and toast must stay horizontally centered");
assert.ok(styleSource.includes("margin-inline: auto") && styleSource.includes("bottom: auto"), "boss banner must center without top/bottom stretch");
assert.ok(!styleSource.includes("top: -4px; right: -4px"), "rail alert dots must stay inside the game frame");
assert.ok(gameSource.includes("showTransition && !boss"), "boss spawn must not stack a second wave title over the banner");
assert.ok(gameSource.includes("Boss arrival owns the single central narrative slot") && gameSource.includes('runtime.dialogueTimer = 0'), "boss spawn must clear dialogue before showing its banner");
assert.ok(!gameSource.includes("navigator.vibrate"), "browser vibration must stay removed from the game runtime");
assert.ok(gameSource.includes("const ATTACK_SPRITES_APPROVED = false") && gameSource.includes("ATTACK_SPRITES_APPROVED && Boolean(unit.action && attackSprite)"), "failed attack sheets must stay quarantined from runtime rendering");
assert.ok(gameSource.includes("Restore the unit-local translate/scale before drawing world-space bars"), "drawUnit must restore its local Canvas transform before drawing HUD bars");
assert.ok(gameSource.includes("playSpeed") && !gameSource.includes('toFixed(1) + "K"'), "speed HUD and resource counts must stay whole numbers");
assert.ok(gameSource.includes("entryY + delta * 420") && gameSource.includes("spawnWait"), "enemy entry must descend toward targetY and spawning must have a watchdog");
assert.ok(gameSource.includes("runtime.hitStop = 0"), "hitStop must not throttle the combat simulation");
assert.ok(gameSource.includes("Battle loop frame failed"), "battle loop must recover from frame errors instead of hard-stopping");
assert.ok(styleSource.includes("flex-wrap: nowrap") && styleSource.includes("overflow: hidden"), "stage meta must stay inside the top HUD");

const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dataPosition = indexSource.indexOf("data/game-data.js");
const modulePositions = runtimeModules.map((file) => indexSource.indexOf(`js/game/${file}`));
const cloudPosition = indexSource.indexOf("js/cloud-save.js");
assert.ok(cloudPosition > modulePositions[0] && cloudPosition < modulePositions[modulePositions.length - 1], "cloud save must load after game state and before game boot");
assert.ok(dataPosition >= 0 && modulePositions.every((position) => position > dataPosition), "data must load before runtime modules");
assert.ok(modulePositions.every((position, index) => index === 0 || position > modulePositions[index - 1]), "runtime modules must load in dependency order");
assert.ok(indexSource.includes("id=\"authScreen\"") && indexSource.includes("id=\"googleLoginButton\"") && indexSource.includes("id=\"authGuest\"") && indexSource.includes("js/auth.js") && indexSource.includes("js/cloud-save.js") && indexSource.includes("js/audio.js"), "Google auth, cloud save, and audio UI hooks missing");
assert.ok(indexSource.includes("firebase-app-compat.js") && indexSource.includes("firebase-auth-compat.js") && indexSource.includes("firebase-firestore-compat.js"), "Firebase SDK scripts missing");
assert.ok(!indexSource.includes("authPassword") && !indexSource.includes("authPasswordConfirm"), "password auth fields must stay removed");
assert.ok(fs.existsSync(path.join(root, "firestore.rules")), "Firestore security rules missing");
assert.ok(fs.existsSync(path.join(root, "android", "app", "src", "main", "java", "com", "taitungray", "taoyuanqunying", "NativeGoogleAuthPlugin.java")), "native Google auth bridge missing");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
assert.ok(manifest.icons?.some((icon) => icon.src === "assets/icons/icon-192.webp") && manifest.icons?.some((icon) => icon.src === "assets/icons/icon-512.webp"), "manifest must reference generated PWA icons");
assert.ok(indexSource.includes('id="doubleOffline"') && indexSource.includes('id="dailyDot"') && indexSource.includes('data-panel="collection"') && indexSource.includes('data-panel="tower"') && indexSource.includes('data-panel="dungeon"'), "local progression UI hooks missing");
assert.ok(fs.existsSync(path.join(root, "docs", "reference", "reference-analysis.md")), "reference analysis document missing");
assert.ok(fs.existsSync(path.join(root, "docs", "specs", "architecture.md")), "architecture document missing");
for (const requiredDoc of [
  ["specs", "current-game-spec.md"],
  ["work", "active-backlog.md"],
  ["issues", "known-issues.md"],
  ["qa", "qa-test-matrix.md"],
  ["reference", "reference-integration-audit.md"],
  ["standards", "combat-character-render-contract.md"]
]) {
  assert.ok(fs.existsSync(path.join(root, "docs", ...requiredDoc)), `authority document missing: ${requiredDoc.join("/")}`);
}

assert.ok(indexSource.includes('data-panel="events"') && indexSource.includes('id="eventDot"'), "events panel hooks missing");
assert.ok(!gameSource.includes("DAILY RATIONS") && !gameSource.includes("LOCAL GHOST LADDER") && !gameSource.includes("CUSTOM LOADOUT"), "panel copy must stay Traditional Chinese, not English eyebrows");
assert.ok(gameSource.includes("今日軍務") && gameSource.includes("panel-action") && gameSource.includes('weekly ? "週" : "日"'), "daily sheet must use readable Chinese task cards and 44px claim actions");
assert.ok(!styleSource.includes("linear-gradient(135deg, #d9c28f0b") && !styleSource.includes("transparent 25% 50%, #5b47291a"), "command sheets must not draw a diagonal X texture");
assert.ok(styleSource.includes("--type-body") && styleSource.includes(".panel-action"), "panel type scale and claim actions must be defined");
assert.ok(!indexSource.includes("FIRST MARCH"), "tutorial eyebrow must use Traditional Chinese");
assert.ok(indexSource.includes("rail-drawer-head") && indexSource.includes("軍務") && indexSource.includes("id=\"railDrawerClose\""), "more-menu must be a command list, not a second icon column");
assert.ok(styleSource.includes("Native mobile-game HUD") && styleSource.includes(".rail-drawer-list"), "native HUD restyle markers missing");
runDocChecks();
console.log(`Smoke test passed: ${data.heroes.length} heroes, ${data.stages.length} stages, ${data.paperDollSlots.length} paper-doll slots.`);
