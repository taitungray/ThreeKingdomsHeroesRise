/* Combat: units, waves, damage, skills and progression */
"use strict";

// Battlefield sprite scale: baseline readable size; bosses keep ceremonial bulk.
const ALLY_UNIT_SCALE = 1.22;
const ENEMY_UNIT_SCALE = 1.12;
const BOSS_UNIT_SCALE = 1.68;
const ENEMY_SPAWN_Y = 175;
const BOSS_SPAWN_Y = 205;

// Keep battlefield poses in eight stable directions so an attack reads as a
// directional action instead of a left/right mirrored idle sprite.
function directionIndex(angle) {
  const octant = Math.round(angle / (Math.PI / 4));
  return (octant + 8) % 8;
}

function setUnitDirection(unit, angle) {
  if (!Number.isFinite(angle)) return;
  unit.direction = directionIndex(angle);
  unit.facing = Math.cos(angle) < 0 ? -1 : 1;
}

function buildTerrain() {
  runtime.terrain.length = 0;
  let seed = activeStageNumber() * 92821 + 17;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 54; i += 1) {
    runtime.terrain.push({
      x: Math.floor(random() * 390),
      y: Math.floor(80 + random() * 535),
      size: 2 + Math.floor(random() * 8),
      type: random() > 0.72 ? "rock" : random() > 0.55 ? "grass" : "stain",
      tone: random()
    });
  }
}

function formationPoint(slot) {
  const columns = [95, 195, 295];
  const rows = [355, 422, 488];
  return { x: columns[slot % 3], y: rows[Math.floor(slot / 3)] };
}

function tacticBonus(id) {
  const activeTactic = save.equippedTactic || "snake";
  if (id !== activeTactic) return 0;
  const tactic = TACTICS.find((item) => item.id === id);
  if (!tactic) return 0;
  return tactic.base + ((save.tactics?.[id] || 1) - 1) * 0.025;
}

function livingUnits(units) {
  return units.filter((unit) => !unit.dead);
}

function hasStatus(unit, type) {
  return Boolean(unit?.statuses?.some((status) => status.type === type && status.duration > 0));
}

function statusValue(unit, type, fallback = 0) {
  return unit?.statuses?.find((status) => status.type === type && status.duration > 0)?.value ?? fallback;
}

function applyStatus(target, type, duration, value = 0, source = null) {
  if (!target || target.dead) return;
  if (target.hero?.id === "menghuo" && ["stun", "slow", "silence"].includes(type)) healUnit(target, target.maxHp * .06, source || target);
  target.statuses ||= [];
  const existing = target.statuses.find((status) => status.type === type);
  if (existing) {
    existing.duration = Math.max(existing.duration, duration);
    existing.value = Math.max(existing.value || 0, value);
    existing.source = source;
  } else {
    target.statuses.push({ type, duration, value, tick: 0, source });
  }
  addEffect("status", target.x, target.y - 24, type === "burn" ? "#ef7a40" : type === "slow" ? "#81c6d6" : type === "stun" ? "#f5d05a" : "#db8ac0", { radius: 22, life: .32 });
}

function tickUnitStatuses(unit, delta) {
  if (!unit.statuses) return;
  for (let index = unit.statuses.length - 1; index >= 0; index -= 1) {
    const status = unit.statuses[index];
    status.duration -= delta;
    if (status.type === "burn") {
      status.tick = (status.tick || 0) + delta;
      if (status.tick >= .5) {
        status.tick = 0;
        applyDamage({ atk: Math.max(3, status.value || 6), team: "enemy", x: unit.x, y: unit.y }, unit, .32, 0, { status: true });
      }
    }
    if (status.duration <= 0) unit.statuses.splice(index, 1);
  }
}

function teamPassiveBonus(kind) {
  const ids = new Set(save.formation || []);
  let bonus = 0;
  if (kind === "hp") bonus += (ids.has("lusu") ? .06 : 0) + (ids.has("chengpu") ? .07 : 0);
  if (kind === "cooldown") bonus += (ids.has("caocao") ? .04 : 0) + (ids.has("daqiao") ? .08 : 0);
  if (kind === "def" && [...ids].filter((id) => heroById(id)?.role === "\u6b65\u5175").length >= 3) bonus += .08;
  const factionCounts = Object.values(FACTION_BY_HERO).map((heroIds) => heroIds.filter((id) => ids.has(id)).length);
  const strongestFaction = Math.max(0, ...factionCounts);
  if (kind === "atk" && strongestFaction >= 3) bonus += .04;
  if (kind === "hp" && strongestFaction >= 4) bonus += .05;
  if (kind === "def" && strongestFaction >= 3) bonus += .04;
  for (const bond of activeBonds()) if (bond.kind === kind) bonus += bond.value || 0;
  const treasure = treasureById(save.equippedTreasure);
  if (treasure && treasure.kind === kind) bonus += treasure.value || 0;
  return bonus;
}

function attackSpeedMultiplier(unit) {
  let multiplier = 1;
  const hero = unit.hero;
  if (!hero) return multiplier;
  if (hero.id === "zhaoyun" && unit.moving) multiplier *= 1.08;
  if (hero.id === "gongsunzan" && runtime.elapsed < 8) multiplier *= 1.2;
  if (hero.id === "lejin" && runtime.elapsed < 10) multiplier *= 1.12;
  if (hasStatus(unit, "haste")) multiplier *= 1 + statusValue(unit, "haste", .12);
  if (hasStatus(unit, "slow")) multiplier *= 1 - Math.min(.45, statusValue(unit, "slow", .15));
  return Math.max(.35, multiplier);
}

function effectiveDefense(unit) {
  let defense = unit.def || 0;
  const hero = unit.hero;
  if (hero?.id === "xiahoudun" && unit.hp / unit.maxHp < .4) defense *= 1.2;
  if (hero?.id === "caoren" && unit.hp / unit.maxHp < .5) defense *= 1.18;
  if (hero?.id === "dianwei" && unit.hp / unit.maxHp < .5) unit.damageTakenMultiplier = .85;
  if (hero?.id === "yujin" && unit.y < 430) defense *= 1.09;
  if (hero?.id === "zhangfei" && unit.hp / unit.maxHp < .5) defense *= 1.08;
  if (hasStatus(unit, "guard")) defense *= 1 + statusValue(unit, "guard", .15);
  if (hasStatus(unit, "fragile")) defense *= 1 - Math.min(.45, statusValue(unit, "fragile", .1));
  return defense;
}

function attackMultiplier(attacker, target, baseMultiplier, context = {}) {
  let multiplier = baseMultiplier;
  const hero = attacker?.hero;
  if (!hero) return multiplier;
  if (context.skill) multiplier *= 1 + (heroSkillLevel(hero.id) - 1) * .12;
  const distance = context.distance ?? Math.hypot((target?.x || 0) - (attacker.x || 0), (target?.y || 0) - (attacker.y || 0));
  if (hero.id === "guanyu" && target?.type === "boss") multiplier *= 1.12;
  if (target?.type === "boss") multiplier *= 1 + teamPassiveBonus("boss");
  if (hero.id === "lubu" && target?.type === "boss" && livingUnits(runtime.allies).length === 1) multiplier *= 1.18;
  if (hero.id === "diaochan" && hasStatus(target, "mark")) multiplier *= 1.15;
  if (hero.id === "pangtong" && context.skill && hasStatus(target, "burn")) multiplier *= 1.18;
  if (hero.id === "xuhuang" && target?.hp >= target?.maxHp) multiplier *= 1.1;
  if ((hero.id === "ganning" || hero.id === "handang") && target?.role === "\u5f13\u5175") multiplier *= hero.id === "handang" ? 1.16 : 1.14;
  if (hero.id === "zhanghe" && target?.y < 330) multiplier *= 1.12;
  if (hero.id === "luxun" && context.skill) multiplier *= 1 + Math.min(.2, livingUnits(runtime.enemies).length * .025);
  if (hero.id === "zhangliao") multiplier *= 1 + Math.min(.18, Math.max(0, 4 - livingUnits(runtime.enemies).length) * .045);
  if (hero.id === "zhangliang" && target?.hp >= target?.maxHp) multiplier *= 1.15;
  if (hero.id === "huanggai") multiplier *= 1 + Math.floor((1 - attacker.hp / attacker.maxHp) / .2) * .05;
  if (hero.id === "madai") multiplier *= 1 + Math.min(.14, (attacker.speed || 0) / 280);
  if ((hero.id === "guanping" && save.formation.includes("guanyu")) || (hero.id === "xiaoqiao" && save.formation.includes("daqiao") && context.skill)) multiplier *= hero.id === "guanping" ? 1.12 : 1.16;
  if (hasStatus(target, "mark") && hero.id !== "diaochan") multiplier *= 1.05;
  if (hero.id === "machao" && context.charge && !attacker.passiveState.chargeUsed) multiplier *= 1.3;
  if (hero.id === "guojia" && context.skill && target?.hp / target?.maxHp < .35) multiplier *= 1.18;
  if (hero.id === "zhouyu" && context.skill && attacker.passiveState?.skillCount % 3 === 0) multiplier *= 1.08;
  return multiplier;
}

function criticalChance(attacker, target, baseChance, distance) {
  let chanceValue = baseChance;
  const hero = attacker?.hero;
  if (hero?.id === "huangzhong") chanceValue += Math.min(.12, Math.max(0, distance - 80) / 520);
  if (hero?.id === "panzhang" && target?.type === "boss") chanceValue += .1;
  if (hero?.id === "taishici" && attacker.lastTargetId === target?.id) chanceValue += Math.min(.16, (attacker.targetStreak || 0) * .04);
  return Math.min(.7, chanceValue);
}

function healUnit(target, amount, source) {
  if (!target || target.dead) return;
  const hero = source?.hero;
  const bonus = hero?.id === "liubei" || source?.hero?.id === "liubei" ? .04 : 0;
  const healed = Math.round(Math.min(target.maxHp - target.hp, amount * (1 + bonus)));
  if (healed <= 0) return;
  target.hp += healed;
  target.hpLag = Math.max(target.hp, target.hpLag || target.maxHp);
  addNumber(target.x, target.y - 35, healed, false, true);
  addEffect("ring", target.x, target.y, "#7be0a5", { radius: 28, life: .6 });
}

function registerCombatHit(target, critical) {
  if (!target || target.dead) return;
  runtime.combo = Math.min(999, (runtime.combo || 0) + 1);
  runtime.comboTimer = 2.2;
  save.stats.highestCombo = Math.max(save.stats.highestCombo || 0, runtime.combo);
  if (runtime.combo >= 8 && runtime.combo % 4 === 0) {
    addEffect("combo", target.x, target.y - 44, "#f5d276", { radius: 36, life: .42 });
  }
}


function makeAlly(heroId, slot, index) {
  const hero = heroById(heroId);
  const level = save.heroLevels[heroId] || 1;
  const equipment = heroEquipmentStats(heroId);
  const growth = heroGrowthMultiplier(heroId);
  const position = formationPoint(slot);
  const laneBonus = formationBonus(slot);
  const hpBonus = tacticBonus("wall");
  const atkBonus = tacticBonus("snake") + teamPassiveBonus("atk");
  const speedBonus = tacticBonus("wind");
  const maxHp = Math.round((hero.hp + level * 23 + equipment.hp) * growth * (1 + hpBonus + laneBonus.hp + teamPassiveBonus("hp")));
  return {
    id: hero.id + "-" + index,
    hero,
    team: "ally",
    x: position.x,
    y: position.y,
    homeX: position.x,
    homeY: position.y,
    renderX: position.x,
    renderY: position.y,
    hp: maxHp,
    maxHp,
    hpLag: maxHp,
    atk: (hero.atk + level * 3.2 + equipment.atk) * growth * (1 + atkBonus + laneBonus.atk),
    def: (hero.def + level * 0.8 + equipment.def) * growth * (1 + laneBonus.def + teamPassiveBonus("def")),
    speed: (hero.speed + equipment.speed) * (1 + speedBonus + laneBonus.speed),
    range: hero.range + equipment.range + laneBonus.range,
    cooldown: Math.random() * 0.5,
    skillCooldown: Math.random() * (hero.skillCooldown || 5) / (1 + teamPassiveBonus("cooldown")),
    attackCount: 0,
    statuses: [],
    passiveState: { lethalGuardUsed: false, chargeUsed: false, lastTargetId: "", targetStreak: 0 },
    hitFlash: 0,
    attackPose: 0,
    attackFrame: 0,
    direction: 4,
    attackDirection: 4,
    attackAngle: Math.PI,
    hitAngle: Math.PI,
    action: null,
    hitStun: 0,
    kickX: 0,
    kickY: 0,
    motionX: 0,
    motionY: 0,
    squashX: 0,
    squashY: 0,
    weaponSwing: 0,
    moving: 0,
    facing: -1,
    stepTimer: Math.random() * 0.2,
    deathTime: 0,
    deathSpin: 0,
    dead: false,
    scale: ALLY_UNIT_SCALE,
    role: hero.role
  };
}

function resetAllies() {
  runtime.allies = save.formation
    .filter((id) => isUnlocked(heroById(id)))
    .map((id, index) => makeAlly(id, save.positions[id] ?? (index + 3), index));
}

function reducedMotionActive() {
  return !save.effects || Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

function applyLocalImpact(unit, amount) {
  if (reducedMotionActive() || !unit) return;
  const force = Number(amount) || 0;
  unit.kickX = (unit.kickX || 0) + (Math.random() - 0.5) * force * 0.4;
  unit.kickY = (unit.kickY || 0) - force * 0.18;
}

function beginWaveTransition(label) {
  runtime.waveTransition = { life: 0.55, maxLife: 0.55, label: label || "" };
  runtime.flash = 0.15;
  runtime.flashColor = "#0a0c0a";
}

function updateWaveTransition(delta) {
  if (!runtime.waveTransition) return;
  runtime.waveTransition.life -= delta;
  if (runtime.waveTransition.life <= 0) runtime.waveTransition = null;
}

function updateEnemyEntry(delta) {
  for (const enemy of runtime.enemies) {
    if (!Number.isFinite(enemy.entryY) || !Number.isFinite(enemy.targetY)) continue;
    if (enemy.entryY >= enemy.targetY) continue;
    enemy.entryY = Math.min(enemy.targetY, enemy.entryY + delta * 420);
    enemy.y = enemy.entryY;
    enemy.renderY = enemy.entryY;
  }
}

function makeEnemy(index, boss = false) {
  const stage = activeStageNumber();
  const config = stageDefinition(stage);
  const stagePower = config?.enemyPower || 1 + (stage - 1) * 0.16;
  let enemyType = boss ? "boss" : config?.enemyPool?.[(index + runtime.waveClears) % config.enemyPool.length] || (chance(0.25) ? "archer" : chance(0.32) ? "brute" : "bandit");
  let generalIds = config?.enemyGenerals || [];
  const waveGeneralIndex = Math.min(runtime.waveClears, Math.max(0, generalIds.length - 1));
  let enemyGeneralId = generalIds.length ? generalIds[waveGeneralIndex] : null;
  let modePowerScale = 1;

  if (runtime.mode === "tower") {
    modePowerScale = 1 + Math.max(0, (runtime.towerFloor || 1) - 1) * 0.12;
  } else if (runtime.mode === "arena") {
    const opp = (GAME_DATA.arenaOpponents || []).find((item) => item.id === runtime.arenaOpponent);
    if (opp) {
      modePowerScale = (opp.power || 2000) / 1600;
      generalIds = opp.generals || ["zhangjiao", "yanliang", "wenchou"];
      enemyGeneralId = generalIds[index % generalIds.length];
      if (boss || index === 0) enemyGeneralId = generalIds[0];
    }
  } else if (runtime.mode === "dungeon") {
    const dung = (GAME_DATA.dailyDungeons || []).find((item) => item.id === runtime.dungeonId);
    if (dung) {
      modePowerScale = (dung.power || 2200) / 1800;
      if (!boss) enemyType = dung.enemyType || "bandit";
      enemyGeneralId = dung.bossGeneral || "dongzhuo";
    }
  }

  const enemyProfiles = {
    bandit: { role: "步兵", hp: 105, atk: 11, def: 3.5, speed: 13, range: 27, color: "#8f3630" },
    brute: { role: "步兵", hp: 148, atk: 14, def: 6, speed: 10, range: 29, color: "#565858" },
    cavalry: { role: "騎兵", hp: 118, atk: 15, def: 4.5, speed: 20, range: 34, color: "#795347" },
    archer: { role: "弓兵", hp: 82, atk: 10, def: 2.5, speed: 12, range: 125, color: "#557451" },
    strategist: { role: "謀士", hp: 76, atk: 13, def: 2, speed: 11, range: 138, color: "#5a527d" }
  };
  const profile = enemyProfiles[enemyType] || enemyProfiles.bandit;
  const maxHp = Math.round((boss ? (config?.bossHp || 680) : profile.hp + Math.random() * 18) * stagePower * modePowerScale);
  const lanes = [78, 132, 190, 248, 309];
  const spawnX = lanes[index % lanes.length] + (Math.random() - 0.5) * 24;
  const targetY = (boss ? BOSS_SPAWN_Y : ENEMY_SPAWN_Y) + Math.floor(index / lanes.length) * 44 + Math.random() * 16;
  const entryFromTop = runtime.entryUnits;
  const spawnY = entryFromTop ? -28 - index * 8 : targetY;
  return {
    id: "enemy-" + Date.now() + "-" + index,
    team: "enemy",
    type: enemyType,
    enemyGeneralId: boss ? (runtime.mode === "dungeon" ? enemyGeneralId : config?.bossGeneral || enemyGeneralId) : enemyGeneralId,
    x: spawnX,
    y: spawnY,
    targetY,
    entryY: entryFromTop ? spawnY : targetY,
    renderX: spawnX,
    renderY: spawnY,
    hp: maxHp,
    maxHp,
    hpLag: maxHp,
    statuses: [],
    passiveState: {},
    atk: (boss ? (config?.bossAtk || 27) : profile.atk + Math.random() * 2) * stagePower * towerScale,
    def: (boss ? 11 : profile.def) * stagePower,
    speed: boss ? 16 : profile.speed + Math.random() * 3,
    range: boss ? 42 : profile.range,
    cooldown: Math.random() * 0.8,
    attackCount: 0,
    hitFlash: 0,
    attackPose: 0,
    attackFrame: 0,
    direction: 0,
    attackDirection: 0,
    attackAngle: 0,
    hitAngle: 0,
    action: null,
    hitStun: 0,
    kickX: 0,
    kickY: 0,
    motionX: 0,
    motionY: 0,
    squashX: 0,
    squashY: 0,
    weaponSwing: 0,
    moving: 0,
    facing: 1,
    stepTimer: Math.random() * 0.2,
    deathTime: 0,
    deathSpin: 0,
    dead: false,
    scale: boss ? BOSS_UNIT_SCALE : ENEMY_UNIT_SCALE + Math.random() * 0.08,
    color: boss ? "#6f2b26" : profile.color,
    accent: boss ? "#d29f3a" : "#b34935",
    role: boss ? "步兵" : profile.role
  };
}

function spawnWave(boss = false, showTransition = true) {
  runtime.spawning = false;
  runtime.bossActive = boss;
  runtime.enemies = [];
  if (runtime.allies.length === 0 || runtime.allies.every((unit) => unit.dead)) resetAllies();
  const config = stageDefinition();
  const waveNumber = boss ? 4 : runtime.waveClears + 1;
  if (showTransition && !boss) beginWaveTransition("第 " + waveNumber + " 波");
  runtime.entryUnits = true;
  const count = boss ? 1 + Math.min(4, activeStageNumber()) : config?.enemyCount || 4 + Math.min(7, activeStageNumber() + runtime.waveClears);
  for (let i = 0; i < count; i += 1) runtime.enemies.push(makeEnemy(i, boss && i === 0));
  runtime.entryUnits = false;
  if (boss) hideEnemyPreview();
  else showEnemyPreview(activeStageNumber(), waveNumber);
  if (boss) {
    const chapter = chapterForStage();
    $("bossName").textContent = enemyGeneralById(config?.bossGeneral)?.name || chapter.boss;
    // Boss arrival owns the single central narrative slot. Clear dialogue first
    // so the banner, preview and bottom dialogue never stack over the battle.
    $("dialogueBox")?.classList.remove("show");
    runtime.dialogueTimer = 0;
    hideEnemyPreview();
    const banner = $("bossBanner");
    banner.classList.remove("show");
    banner.setAttribute("aria-hidden", "false");
    void banner.offsetWidth;
    banner.classList.add("show");
    scheduleGameTimer(() => banner.setAttribute("aria-hidden", "true"), 1800);
    addLog("遭遇首領「" + chapter.boss + "」。");
    beep(95, 0.3, "sawtooth", 0.04);
    window.TaoyuanAudio?.sfx?.("boss");
  }
  updateHud();
}

const ROLE_COUNTER = Object.freeze({ "步兵": "弓兵", "弓兵": "騎兵", "騎兵": "步兵" });

function roleAdvantage(attacker, target) {
  if (!attacker || !target || attacker.team === target.team) return 1;
  if (ROLE_COUNTER[attacker.role] === target.role) return 1.15;
  if (ROLE_COUNTER[target.role] === attacker.role) return .88;
  return 1;
}

function targetPriorityScore(unit, target, distance) {
  let score = -distance * .18;
  if (unit.team === "enemy") {
    if (unit.type === "archer" || unit.role === "弓兵") score += target.role === "謀士" || target.role === "弓兵" ? 160 : 0;
    if (unit.type === "cavalry" || unit.role === "騎兵") score += target.role === "弓兵" || target.role === "謀士" ? 180 : 0;
    if (unit.type === "strategist" || unit.role === "謀士") score += target.role === "步兵" ? 130 : 0;
  }
  if (unit.team === "ally" && target.type === "boss") score += 12;
  if (target.maxHp > 0 && target.hp / target.maxHp < .25) score += 6;
  return score;
}

function nearestTarget(unit, targets) {
  let best = null;
  let bestDistance = Infinity;
  let bestScore = -Infinity;
  for (const target of targets) {
    if (target.dead) continue;
    const distance = Math.hypot(target.x - unit.x, (target.y - unit.y) * 1.12);
    const score = targetPriorityScore(unit, target, distance);
    if (score > bestScore) {
      bestScore = score;
      bestDistance = distance;
      best = target;
    }
  }
  return { target: best, distance: bestDistance };
}

function addNumber(x, y, value, critical = false, heal = false, options = {}) {
  const spreadX = options.isTag ? 0 : (Math.random() - 0.5) * 24;
  const spreadY = options.isTag ? -6 : (Math.random() - 0.5) * 8;
  const isText = typeof value === "string" && isNaN(Number(value));
  const displayText = isText ? value : ((heal ? "+" : "") + Math.round(Number(value)));
  runtime.numbers.push({
    x: x + spreadX,
    y: y - 8 + spreadY,
    value: displayText,
    life: critical ? 0.9 : 0.75,
    maxLife: critical ? 0.9 : 0.75,
    color: options.color || (heal ? "#88e899" : critical ? "#ffd84d" : "#fff1da"),
    size: options.size || (isText ? 20 : critical ? 28 : 17),
    angle: isText ? 0 : critical ? (Math.random() - 0.5) * 0.22 : (Math.random() - 0.5) * 0.1,
    pop: critical ? 1.25 : 1,
    isTag: isText || options.isTag
  });
}

function addEffect(type, x, y, color = "#fff", options = {}) {
  if (!save.effects) return;
  if (runtime.effects.length >= EFFECT_POOL_SIZE) releaseEffectRecord(runtime.effects.shift());
  const effect = takeEffectRecord();
  effect.type = type;
  effect.x = x;
  effect.y = y;
  effect.color = color;
  effect.life = options.life || 0.38;
  effect.maxLife = effect.life;
  effect.radius = options.radius || 35;
  effect.angle = options.angle || 0;
  effect.scale = options.scale || 1;
  effect.facing = options.facing || 1;
  runtime.effects.push(effect);
}
function spawnResourceDrops(x, y, reward = {}) {
  const entries = [
    { kind: "gold", amount: reward.gold },
    { kind: "food", amount: reward.food },
    { kind: "jade", amount: reward.jade },
    { kind: "shards", amount: reward.shards }
  ];
  for (const entry of entries) {
    if (!(entry.amount > 0)) continue;
    const life = 2.05 + Math.random() * 0.35;
    const index = runtime.drops.length;
    runtime.drops.push({
      kind: entry.kind,
      amount: Math.max(1, Math.round(entry.amount)),
      x: x + (index % 5 - 2) * 9 + (Math.random() - 0.5) * 5,
      y: y + (Math.floor(index / 5) % 2) * 4,
      age: Math.random() * 0.18,
      phase: Math.random() * Math.PI * 2,
      life,
      maxLife: life
    });
  }
  if (runtime.drops.length > 36) runtime.drops.splice(0, runtime.drops.length - 36);
}

function updateResourceDrops(delta) {
  const flyTargets = { gold: 48, food: 138, jade: 228, shards: 318 };
  for (const drop of runtime.drops) {
    drop.age += delta;
    if (drop.life <= 0.45 && !drop.flying) {
      drop.flying = true;
      drop.flyTargetX = flyTargets[drop.kind] || 48;
      drop.flyTargetY = 688;
    }
    if (drop.flying) {
      drop.x += (drop.flyTargetX - drop.x) * Math.min(1, delta * 7);
      drop.y += (drop.flyTargetY - drop.y) * Math.min(1, delta * 7);
      drop.life -= delta * 1.6;
    } else {
      drop.life -= delta;
    }
  }
  runtime.drops = runtime.drops.filter((drop) => drop.life > 0);
}

function clearResourceDrops() {
  runtime.drops.length = 0;
}

function fireProjectile(attacker, target, color, options = {}) {
  runtime.projectiles.push({
    x: attacker.x,
    y: attacker.y - 20,
    target,
    attacker,
    speed: attacker.role === "\u8b00\u58eb" ? 245 : 310,
    color,
    damage: Math.max(2, attacker.atk - effectiveDefense(target) * 0.55),
    team: attacker.team,
    skill: Boolean(options.skill),
    life: 1.4
  });
}

function applyDamage(attacker, target, multiplier = 1, criticalChanceBase = 0.12, context = {}) {
  if (!target || target.dead) return;
  const distance = Math.hypot((target.x || 0) - (attacker.x || 0), (target.y || 0) - (attacker.y || 0));
  const finalMultiplier = attackMultiplier(attacker, target, multiplier, { ...context, distance });
  const roleMultiplier = roleAdvantage(attacker, target);
  const critical = !context.status && chance(criticalChance(attacker, target, criticalChanceBase, distance));
  const variance = 0.88 + Math.random() * 0.22;
  const defense = effectiveDefense(target);
  const lowHealthReduction = target.hero?.id === "dianwei" && target.hp / target.maxHp < .5 ? .85 : 1;
  const wardReduction = hasStatus(target, "ward") ? 0.94 : 1;
  const damage = Math.max(2, Math.round((attacker.atk * finalMultiplier - defense * 0.58) * variance * (critical ? 1.72 : 1) * lowHealthReduction * wardReduction * roleMultiplier));
  if (!context.status && damage > 0) {
    const sourceId = attacker.hero?.id || attacker.enemyGeneralId || attacker.type || "enemy";
    runtime.damageStats[sourceId] = (runtime.damageStats[sourceId] || 0) + damage;
  }
  if (target.team === "ally" && target.hero?.id === "zhangfei" && target.hp - damage <= 0 && !target.passiveState.lethalGuardUsed) {
    target.passiveState.lethalGuardUsed = true;
    target.hp = 1;
    target.hpLag = Math.max(target.hpLag || target.maxHp, target.hp);
    addNumber(target.x, target.y - 31, 1, true);
    addEffect("guard", target.x, target.y - 18, "#e9c05c", { radius: 38, life: .55 });
    showDialogue(target.hero.name, "\u71d5\u4eba\u5c1a\u5728\uff01", target.hero.avatar);
    toast(target.hero.name + "\u89f8\u767c\u4e0d\u5c48\uff0c\u88ab\u52d5\u4fdd\u7559 1 \u5175\u529b");
    return;
  }
  target.hp -= damage;
  target.hpLag = Math.max(Number.isFinite(target.hpLag) ? target.hpLag : target.maxHp, target.hp);
  target.hitFlash = critical ? 0.2 : 0.14;
  target.hitStun = critical ? 0.075 : 0.035;
  const sourceX = Number.isFinite(attacker.x) ? attacker.x : target.x;
  const sourceY = Number.isFinite(attacker.y) ? attacker.y : target.y + 1;
  const knockAngle = Math.atan2(target.y - sourceY, target.x - sourceX);
  target.hitAngle = knockAngle;
  target.direction = directionIndex(knockAngle);
  const knockForce = critical ? 10 : finalMultiplier > 1.25 ? 7 : 4;
  target.kickX = Math.cos(knockAngle) * knockForce;
  target.kickY = Math.sin(knockAngle) * knockForce;
  if (!context.status) {
    addNumber(target.x, target.y - 31, damage, critical);
    addEffect("spark", target.x, target.y - 13, critical ? "#ffe270" : "#f1d8bd", { radius: critical ? 25 : 14, life: 0.22 });
    addEffect("impact", target.x, target.y - 14, critical ? "#fff08b" : "#f7d8ad", { radius: critical ? 34 : 19, life: critical ? 0.3 : 0.18, angle: knockAngle });
    registerCombatHit(target, critical);
  }
  if (!context.status) {
    runtime.hitStop = Math.max(runtime.hitStop, critical ? 0.045 : finalMultiplier > 1.25 ? 0.028 : 0.012);
  }
  if (critical) {
    applyLocalImpact(target, 5);
    addEffect("shockwave", target.x, target.y - 10, "#ffd769", { radius: 42, life: 0.34 });
  }
  if (attacker.hero?.id === "zhurong" && critical) applyStatus(target, "burn", 4, 8, attacker);
  if (attacker.hero?.id === "zhuran" && context.skill) applyStatus(target, "burn", 6, 8, attacker);
  if (attacker.hero?.id === "zhouyu" && context.skill && attacker.passiveState?.skillCount % 3 === 0) applyStatus(target, "burn", 4, 8, attacker);
  if (attacker.hero?.id === "simayi" && context.skill) applyStatus(target, "slow", 3, .08, attacker);
  if (attacker.hero?.id === "jiangwei" && context.skill) healUnit(attacker, attacker.maxHp * .08, attacker);
  if (attacker.hero?.id === "zhenji" && context.skill) livingUnits(runtime.allies).forEach((ally) => applyStatus(ally, "ward", 4, .06, attacker));
  if (attacker.hero?.id === "zhugeliang" && context.skill) applyStatus(target, "slow", 3, .1, attacker);
  if (attacker.hero?.id === "diaochan" && context.skill) applyStatus(target, "mark", 4, .15, attacker);
  if (attacker.hero?.id === "fazheng" && context.skill && target.type === "boss") applyStatus(target, "fragile", 4, .1, attacker);
  if (target.team === "ally" && target.hero?.id === "zhangbao" && attacker.team === "enemy" && !context.reflect) applyDamage(target, attacker, .08, 0, { reflect: true });
  if (target.hp <= 0) killUnit(target, attacker);
}

function killUnit(target, attacker) {
  if (target.dead) return;
  target.dead = true;
  target.hp = 0;
  target.deathTime = target.type === "boss" ? 0.9 : 0.58;
  target.deathSpin = chance(0.5) ? -1 : 1;
  target.kickX *= 1.6;
  target.kickY -= 5;
  const isBossOrElite = target.type === "boss" || target.isBoss || target.enemyGeneralId;
  addNumber(target.x, target.y - 36, isBossOrElite ? "破敵!" : "斬!", true, false, { color: isBossOrElite ? "#f5d05a" : "#ff6b6b", size: isBossOrElite ? 22 : 16, isTag: true });
  addEffect("burst", target.x, target.y - 12, target.team === "enemy" ? "#b94934" : "#75a7ca", { radius: 42, life: 0.55 });
  addEffect("dust", target.x, target.y + 2, "#b7a77d", { radius: target.type === "boss" ? 42 : 25, life: 0.55 });
  addEffect("soul", target.x, target.y - 25, target.team === "enemy" ? "#f0c66b" : "#86c8db", { radius: 20, life: 0.72 });
  if (target.team === "enemy") {
    const battleStage = activeStageNumber();
    const gold = target.type === "boss" ? 105 + battleStage * 22 : 4 + battleStage;
    const food = target.type === "boss" ? 46 + battleStage * 8 : chance(0.35) ? 2 : 0;
    const expMultiplier = save.formation.includes("xunyu") ? 1.1 : 1;
    const reward = { gold, food, exp: Math.round((target.type === "boss" ? 55 + battleStage * 6 : 5) * expMultiplier) };
    awardResources(reward);
    spawnResourceDrops(target.x, target.y, reward);
    recordStat("kills");
    save.battlePass.xp = (save.battlePass.xp || 0) + (target.type === "boss" ? 10 : 1);
    if (attacker?.hero?.id === "weiyan" || attacker?.hero?.id === "guanxing") applyStatus(attacker, "haste", 3, .12, attacker);
    if (target.type === "boss") {
      applyLocalImpact(target, 10);
      beep(135, 0.22, "square", 0.045);
    }
  } else if (attacker && target.hero) {
    addLog(target.hero.name + "力竭，等待重新整軍。");
  }
}

function useHeroSkill(unit, target) {
  unit.attackCount = 0;
  unit.skillCooldown = (unit.hero.skillCooldown || 5) / (1 + teamPassiveBonus("cooldown"));
  unit.passiveState.skillCount = (unit.passiveState.skillCount || 0) + 1;
  applyLocalImpact(unit, 6);
  runtime.flash = reducedMotionActive() ? 0 : 0.13;
  runtime.flashColor = unit.hero.accent;
  runtime.skillCutIn = {
    hero: unit.hero,
    skillName: unit.hero.skill,
    life: 0.65,
    maxLife: 0.65
  };
  const hero = unit.hero;
  const skillFactor = 1 + (heroSkillLevel(hero.id) - 1) * .12;
  const spec = SKILL_SPECS[hero.id] || { tone: hero.role === "\u8b00\u58eb" ? "thunder" : "slash", color: hero.accent };
  recordStat("skills");
  recordTaskProgress("daily-skill");
  save.battlePass.xp = (save.battlePass.xp || 0) + 3;
  addEffect("charge", unit.x, unit.y - 18, spec.color || hero.accent, { radius: 44, life: .34 });
  addEffect("shockwave", unit.x, unit.y - 10, spec.color || hero.accent, { radius: 74, life: 0.48 });
  addEffect("afterimage", unit.x - Math.cos(unit.action?.angle || 0) * 11, unit.y - Math.sin(unit.action?.angle || 0) * 11, hero.accent, { life: 0.3, scale: unit.scale, facing: unit.facing });
  showDialogue(hero.name, hero.skill + "\uff01", hero.avatar);
  const enemies = livingUnits(runtime.enemies);
  const closeEnemies = enemies.filter((enemy) => Math.hypot(enemy.x - unit.x, enemy.y - unit.y) < 180);
  if (hero.id === "liubei") {
    livingUnits(runtime.allies).forEach((ally) => healUnit(ally, ally.maxHp * .12 * skillFactor, unit));
    addEffect("rally", unit.x, unit.y - 20, "#7be0a5", { radius: 92, life: .72 });
  } else if (hero.id === "guanyu") {
    addEffect("slash", unit.x, unit.y - 8, "#d7b84f", { radius: 74, life: .48, angle: unit.action?.angle || 0 });
    addEffect("slash", unit.x, unit.y - 8, "#f05d3e", { radius: 96, life: .54, angle: (unit.action?.angle || 0) - .48 });
    closeEnemies.forEach((enemy) => applyDamage(unit, enemy, 2.05, .28, { skill: true }));
  } else if (hero.id === "zhangfei") {
    addEffect("stun", unit.x, unit.y - 10, "#e9c05c", { radius: 108, life: .62 });
    closeEnemies.forEach((enemy) => {
      const angle = Math.atan2(enemy.y - unit.y, enemy.x - unit.x);
      enemy.kickX += Math.cos(angle) * 16;
      enemy.kickY += Math.sin(angle) * 16;
      applyStatus(enemy, "stun", 1.15, 0, unit);
      applyDamage(unit, enemy, 1.7, .24, { skill: true });
    });
    applyLocalImpact(unit, 10);
  } else if (hero.id === "zhaoyun") {
    for (let i = 1; i <= 4; i += 1) addEffect("afterimage", unit.x - Math.cos(unit.action?.angle || 0) * i * 14, unit.y - Math.sin(unit.action?.angle || 0) * i * 14, hero.accent, { life: .16 + i * .06, scale: unit.scale * (1 - i * .05), facing: unit.facing });
    (closeEnemies.length ? closeEnemies : [target]).forEach((enemy) => applyDamage(unit, enemy, 1.72, .26, { skill: true, charge: true }));
  } else if (hero.id === "huangzhong") {
    enemies.slice(0, 3).forEach((enemy, index) => scheduleGameTimer(() => {
      if (enemy.dead) return;
      fireProjectile(unit, enemy, hero.accent, { skill: true });
      addEffect("bolt", enemy.x, enemy.y, hero.accent, { radius: 45, life: .38 });
    }, index * 90));
  } else if (hero.id === "sunshang") {
    enemies.slice(0, 4).forEach((enemy, index) => {
      fireProjectile(unit, enemy, hero.accent, { skill: true });
      if (index % 2 === 0) fireProjectile(unit, enemy, "#ffd47a", { skill: true });
    });
    addEffect("volley", unit.x, unit.y - 15, hero.accent, { radius: 82, life: .54 });
  } else if (hero.id === "caocao") {
    livingUnits(runtime.allies).forEach((ally) => applyStatus(ally, "haste", 5, .16, unit));
    enemies.slice(0, 4).forEach((enemy) => applyDamage(unit, enemy, 1.25, .2, { skill: true }));
    addEffect("rally", unit.x, unit.y - 18, hero.accent, { radius: 90, life: .7 });
  } else if (hero.id === "xiahoudun") {
    applyStatus(unit, "guard", 2.5, .25, unit);
    closeEnemies.forEach((enemy) => applyDamage(unit, enemy, 1.55, .24, { skill: true }));
    addEffect("guard", unit.x, unit.y - 18, hero.accent, { radius: 48, life: .58 });
  } else if (hero.id === "zhugeliang") {
    enemies.slice(0, 5).forEach((enemy, index) => {
      scheduleGameTimer(() => {
        if (enemy.dead) return;
        applyDamage(unit, enemy, 1.45, .24, { skill: true });
        applyStatus(enemy, "slow", 3, .25, unit);
        addEffect("bolt", enemy.x, enemy.y - 10, hero.accent, { radius: 48, life: .42 });
      }, index * 75);
    });
    addEffect("rune", unit.x, unit.y - 8, hero.accent, { radius: 92, life: .72 });
  } else if (hero.id === "diaochan") {
    enemies.slice(0, 4).forEach((enemy, index) => {
      applyStatus(enemy, "mark", 4, .15, unit);
      applyDamage(unit, enemy, 1.35, .3, { skill: true });
      addEffect("petal", enemy.x, enemy.y - 20, hero.accent, { radius: 42, life: .6, angle: index * .9 });
    });
  } else if (hero.id === "lubu") {
    enemies.forEach((enemy) => {
      if (Math.hypot(enemy.x - unit.x, enemy.y - unit.y) < 210) applyDamage(unit, enemy, 2.4, .3, { skill: true });
    });
    addEffect("meteor", unit.x, unit.y - 20, "#f06a4d", { radius: 132, life: .76 });
    applyLocalImpact(unit, 13);
  } else if (hero.role === "\u5f13\u5175" || hero.role === "\u8b00\u58eb") {
    enemies.slice(0, 4).forEach((enemy) => {
      fireProjectile(unit, enemy, hero.accent, { skill: true });
      applyDamage(unit, enemy, 1.4, .25, { skill: true });
    });
  } else {
    (closeEnemies.length ? closeEnemies : [target]).forEach((enemy) => applyDamage(unit, enemy, 1.7, .24, { skill: true }));
    addEffect("slash", unit.x, unit.y - 8, hero.accent, { radius: 72, life: .48, angle: unit.action?.angle || 0 });
  }
  beep(hero.role === "\u8b00\u58eb" ? 540 : 170, 0.12, "sawtooth", 0.035);
  window.TaoyuanAudio?.sfx?.("skill");
}

function attack(unit, target) {
  const role = unit.role;
  const attackInterval = role === "\u9a0e\u5175" ? .78 : role === "\u5f13\u5175" ? 1.05 : role === "\u8b00\u58eb" ? 1.22 : .92;
  unit.cooldown = attackInterval / ((unit.team === "ally" ? 1 + tacticBonus("wind") : 1) * attackSpeedMultiplier(unit));
  unit.attackCount += 1;
  unit.passiveState ||= {};
  if (unit.passiveState.lastTargetId === target.id) unit.passiveState.targetStreak = (unit.passiveState.targetStreak || 0) + 1;
  else { unit.passiveState.lastTargetId = target.id; unit.passiveState.targetStreak = 1; }
  unit.lastTargetId = target.id;
  unit.targetStreak = unit.passiveState.targetStreak;
  const skill = unit.team === "ally" && unit.attackCount >= 5 && unit.skillCooldown <= 0 && !hasStatus(unit, "silence");
  const ranged = unit.team === "ally" && (role === "\u5f13\u5175" || role === "\u8b00\u58eb");
  const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
  unit.action = {
    target,
    skill,
    ranged,
    angle,
    direction: directionIndex(angle),
    phase: "anticipation",
    elapsed: 0,
    impactAt: skill ? .2 : ranged ? .145 : .095,
    total: skill ? .52 : ranged ? .32 : .255,
    resolved: false
  };
  unit.attackDirection = directionIndex(angle);
  unit.attackAngle = angle;
  setUnitDirection(unit, angle);
  if (skill) {
    addEffect("charge", unit.x, unit.y - 13, unit.hero.accent, { radius: 38, life: .32 });
    beep(220, .075, "triangle", .022);
  }
}

function resolveAttack(unit, action) {
  let target = action.target;
  if (!target || target.dead) {
    const targetPool = unit.team === "ally" ? runtime.enemies : runtime.allies;
    target = nearestTarget(unit, targetPool).target;
  }
  if (!target) return;
  if (action.skill) {
    useHeroSkill(unit, target);
    return;
  }
  if (action.ranged) {
    fireProjectile(unit, target, unit.hero.accent);
    if ((unit.hero.id === "sunshang" || unit.hero.id === "xiahouyuan") && chance(.14)) scheduleGameTimer(() => {
      if (!target.dead) fireProjectile(unit, target, "#ffd47a");
    }, 70);
    unit.motionX -= Math.cos(action.angle) * 4;
    unit.motionY -= Math.sin(action.angle) * 4;
  } else {
    const charge = unit.team === "ally" && unit.hero.id === "machao" && unit.moving;
    applyDamage(unit, target, 1, unit.team === "ally" ? 0.13 : 0.05, { charge });
    if (charge) unit.passiveState.chargeUsed = true;
    addEffect("slash", target.x, target.y - 12, unit.team === "ally" ? unit.hero.accent : "#e0b38d", { radius: 27, life: 0.22, angle: action.angle });
    if (unit.team === "ally" && unit.hero.id === "liubei") {
      addEffect("slash", target.x, target.y - 12, "#dce8d8", { radius: 23, life: 0.2, angle: action.angle + Math.PI / 2 });
    } else if (unit.team === "ally" && unit.hero.id === "guanyu") {
      addEffect("slash", target.x, target.y - 13, "#d4b356", { radius: 38, life: 0.3, angle: action.angle - 0.35 });
    } else if (unit.team === "ally" && unit.hero.id === "zhangfei") {
      addEffect("shockwave", target.x, target.y, "#b84a35", { radius: 30, life: 0.25 });
      applyLocalImpact(target, 3.2);
    } else if (unit.team === "ally" && unit.hero.id === "zhaoyun") {
      addEffect("afterimage", unit.x - Math.cos(action.angle) * 13, unit.y - Math.sin(action.angle) * 13, "#75bceb", { life: 0.2, scale: unit.scale * 0.9, facing: unit.facing });
    }
    addEffect("dust", unit.x, unit.y + 2, "#a99b77", { radius: 16, life: 0.28 });
    if (unit.team === "ally") {
      addEffect("afterimage", unit.x - Math.cos(action.angle) * 8, unit.y - Math.sin(action.angle) * 8, unit.hero.accent, { life: 0.16, scale: unit.scale * 0.94, facing: unit.facing });
      beep(150 + Math.random() * 35, 0.04, "square", 0.014);
    }
  }
}

function updateAction(unit, delta) {
  const action = unit.action;
  if (!action) return false;
  action.elapsed += delta;
  const windup = clamp(action.elapsed / action.impactAt, 0, 1);
  const directionX = Math.cos(action.angle);
  const directionY = Math.sin(action.angle);
  unit.direction = action.direction;
  unit.attackFrame = Math.min(4, Math.floor((action.elapsed / action.total) * 5));

  if (action.elapsed < action.impactAt) {
    action.phase = "anticipation";
    const anticipation = Math.sin(windup * Math.PI * 0.5);
    unit.attackPose = anticipation;
    const pullback = action.skill ? 7 : 4;
    unit.motionX = -directionX * pullback * anticipation;
    unit.motionY = -directionY * pullback * anticipation;
    unit.squashX = -0.07 * anticipation;
    unit.squashY = 0.09 * anticipation;
    unit.weaponSwing = -0.75 * anticipation;
  } else {
    action.phase = "strike";
    if (!action.resolved) {
      action.resolved = true;
      resolveAttack(unit, action);
    }
    const recovery = clamp((action.elapsed - action.impactAt) / (action.total - action.impactAt), 0, 1);
    unit.attackPose = Math.pow(1 - recovery, 1.45);
    const snap = Math.pow(1 - recovery, 2);
    const lunge = action.ranged ? -4 : action.skill ? 20 : 11;
    unit.motionX = directionX * lunge * snap;
    unit.motionY = directionY * lunge * snap;
    unit.squashX = 0.13 * snap;
    unit.squashY = -0.11 * snap;
    unit.weaponSwing = 1.9 * snap;
  }

  if (action.elapsed >= action.total) {
    unit.action = null;
    unit.motionX = 0;
    unit.motionY = 0;
    unit.squashX = 0;
    unit.squashY = 0;
    unit.weaponSwing = 0;
    unit.attackPose = 0;
    unit.attackFrame = 0;
  }
  return true;
}

function updateUnit(unit, targets, delta) {
  if (unit.dead) return;
  if (!Number.isFinite(unit.x) || !Number.isFinite(unit.y)) {
    unit.x = clamp(Number(unit.x) || 195, 35, 350);
    unit.y = clamp(Number(unit.y) || (unit.team === "ally" ? 420 : ENEMY_SPAWN_Y), 112, 575);
  }
  if (!Number.isFinite(unit.speed) || unit.speed <= 0) unit.speed = unit.team === "ally" ? 22 : 13;
  // Entering enemies stay on the drop path until they reach the lane.
  if (unit.team === "enemy" && Number.isFinite(unit.entryY) && Number.isFinite(unit.targetY) && unit.entryY < unit.targetY - 0.5) {
    tickUnitStatuses(unit, delta);
    unit.cooldown -= delta * attackSpeedMultiplier(unit);
    unit.hitFlash = Math.max(0, unit.hitFlash - delta);
    return;
  }
  tickUnitStatuses(unit, delta);
  if (unit.dead) return;
  unit.cooldown -= delta * attackSpeedMultiplier(unit);
  if (unit.team === "ally") unit.skillCooldown = Math.max(0, unit.skillCooldown - delta * (1 + teamPassiveBonus("cooldown")));
  unit.hitFlash = Math.max(0, unit.hitFlash - delta);
  unit.attackPose = Math.max(0, unit.attackPose - delta);
  unit.hitStun = Math.max(0, unit.hitStun - delta);
  const kickDecay = Math.exp(-delta * 15);
  unit.kickX = Number.isFinite(unit.kickX) ? unit.kickX * kickDecay : 0;
  unit.kickY = Number.isFinite(unit.kickY) ? unit.kickY * kickDecay : 0;
  unit.moving = 0;
  if (unit.hitStun > 0 || hasStatus(unit, "stun")) return;
  if (updateAction(unit, delta)) return;
  const selected = nearestTarget(unit, targets);
  const target = selected.target;
  const distance = selected.distance;
  if (!target) return;
  if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) return;
  const targetAngle = Math.atan2(target.y - unit.y, target.x - unit.x);
  setUnitDirection(unit, targetAngle);
  if (distance > unit.range) {
    const angle = targetAngle;
    const spacing = unit.team === "ally" ? 1 : .82;
    unit.x += Math.cos(angle) * unit.speed * spacing * delta;
    unit.y += Math.sin(angle) * unit.speed * spacing * delta;
    unit.moving = 1;
    unit.stepTimer -= delta;
    if (unit.stepTimer <= 0) {
      unit.stepTimer = .2 + Math.random() * .1;
      addEffect("dust", unit.x, unit.y + 2, "#978b6c", { radius: 9, life: .3 });
    }
    unit.x = clamp(unit.x, 35, 350);
    unit.y = clamp(unit.y, 112, 575);
  } else if (unit.cooldown <= 0) {
    attack(unit, target);
  }
}

function updateProjectiles(delta) {
  for (const projectile of runtime.projectiles) {
    projectile.life -= delta;
    if (projectile.life <= 0 || !projectile.target || projectile.target.dead) continue;
    const dx = projectile.target.x - projectile.x;
    const dy = projectile.target.y - 18 - projectile.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 12) {
      const attacker = projectile.attacker || { atk: projectile.damage, team: projectile.team, x: projectile.x, y: projectile.y };
      applyDamage(attacker, projectile.target, 1, projectile.skill ? .18 : .1, { skill: projectile.skill });
      addEffect("impact", projectile.target.x, projectile.target.y - 16, projectile.color, { radius: 22, life: .2 });
      projectile.life = 0;
    } else if (distance > 0) {
      projectile.x += (dx / distance) * projectile.speed * delta;
      projectile.y += (dy / distance) * projectile.speed * delta;
    }
  }
  runtime.projectiles = runtime.projectiles.filter((item) => item.life > 0);
}

function updateEffects(delta) {
  for (const effect of runtime.effects) effect.life -= delta;
  for (const number of runtime.numbers) {
    number.life -= delta;
    number.y -= 24 * delta;
  }
  for (const unit of [...runtime.allies, ...runtime.enemies]) {
    if (!unit.dead && Number.isFinite(unit.hpLag)) unit.hpLag = Math.max(unit.hp, unit.hpLag - unit.maxHp * delta * 3.6);
    if (unit.dead && unit.deathTime > 0) {
      unit.deathTime = Math.max(0, unit.deathTime - delta);
      unit.kickX *= Math.exp(-delta * 5);
      unit.kickY += 18 * delta;
    }
  }
  recycleExpiredEffects();
  runtime.numbers = runtime.numbers.filter((item) => item.life > 0);
  runtime.shake = 0;
  runtime.flash = Math.max(0, runtime.flash - delta);
}

function damageSummary() {
  return save.formation.map((id) => ({
    id,
    name: heroById(id)?.name || id,
    value: Math.round(runtime.damageStats[id] || 0)
  })).sort((a, b) => b.value - a.value);
}

function waveCleared() {
  if (runtime.spawning || runtime.enemies.length === 0 || runtime.enemies.some((enemy) => !enemy.dead)) return;
  runtime.spawning = true;

  if (runtime.mode === "arena") {
    const opp = (GAME_DATA.arenaOpponents || []).find((item) => item.id === runtime.arenaOpponent);
    const reward = opp?.reward || { gold: 500, jade: 2 };
    awardResources(reward);
    if (opp && !save.arena.claimed.includes(opp.id)) save.arena.claimed.push(opp.id);
    save.arena.wins = (save.arena.wins || 0) + 1;
    save.arena.attempts = (save.arena.attempts || 0) + 1;
    recordStat("wins");
    recordTaskProgress("daily-arena");
    runtime.waveClears = 0;
    runtime.bossActive = false;
    runtime.nextStageAfterSettlement = save.stage;
    runtime.battleResult = { type: "win", stage: save.stage, boss: "演武·" + (opp?.name || "對手"), progressed: false, newlyUnlocked: "", reward, damage: damageSummary(), mode: "arena" };
    addLog("演武場擊敗「" + (opp?.name || "對手") + "」，威震三軍！");
    runtime.mode = "campaign";
    runtime.arenaOpponent = null;
    persist();
    if (typeof showSettlement === "function") showSettlement(runtime.battleResult);
    return;
  }

  if (runtime.bossActive) {
    if (runtime.mode === "dungeon") {
      const dung = (GAME_DATA.dailyDungeons || []).find((item) => item.id === runtime.dungeonId);
      const reward = dung?.reward || { gold: 800, exp: 50 };
      awardResources(reward);
      save.dungeons ||= { date: localDateKey(), claimed: {} };
      if (dung) save.dungeons.claimed[dung.id] = true;
      recordStat("wins");
      recordStat("bosses");
      recordTaskProgress("daily-dungeon");
      runtime.waveClears = 0;
      runtime.bossActive = false;
      runtime.nextStageAfterSettlement = save.stage;
      runtime.battleResult = { type: "win", stage: save.stage, boss: dung?.name || "每日特訓", progressed: false, newlyUnlocked: "", reward, damage: damageSummary(), mode: "dungeon" };
      addLog("每日副本「" + (dung?.name || "特訓") + "」全勝通關！");
      runtime.mode = "campaign";
      runtime.dungeonId = null;
      persist();
      if (typeof showSettlement === "function") showSettlement(runtime.battleResult);
      return;
    }

    if (runtime.mode === "tower") {
      const floor = runtime.towerFloor || 1;
      const reward = { gold: 170 + floor * 22, food: 55 + floor * 8, jade: floor % 5 === 0 ? 2 : 0, exp: 24 + floor * 3, shards: 1 };
      awardResources(reward);
      save.tower.floor = floor;
      save.tower.best = Math.max(save.tower.best || 0, floor);
      recordStat("wins");
      recordStat("bosses");
      runtime.waveClears = 0;
      runtime.bossActive = false;
      runtime.nextStageAfterSettlement = save.stage;
      runtime.battleResult = { type: "win", stage: save.stage, boss: "問天樓第 " + floor + " 層", progressed: false, newlyUnlocked: "", reward, damage: damageSummary(), mode: "tower" };
      addLog("問天樓第 " + floor + " 層通關。");
      runtime.mode = "campaign";
      runtime.towerFloor = 0;
      persist();
      if (typeof showSettlement === "function") showSettlement(runtime.battleResult);
      return;
    }

    const battleStage = activeStageNumber();
    const chapter = chapterForStage();
    const progressed = battleStage >= save.stage;
    const newlyUnlocked = progressed && HEROES.find((hero) => hero.unlock === battleStage);
    const reward = {
      jade: progressed ? (battleStage >= 25 ? 3 : 2) : 1,
      gold: Math.round((140 + battleStage * 30) * (progressed ? 1 : .55)),
      food: Math.round((55 + battleStage * 9) * (progressed ? 1 : .55)),
      exp: 30 + battleStage * 4,
      shards: progressed ? (battleStage >= 25 ? 3 : 2) : 1
    };
    awardResources(reward);
    const dropSource = runtime.enemies.find((unit) => unit.type === "boss") || runtime.enemies[runtime.enemies.length - 1];
    spawnResourceDrops(dropSource?.x || 195, dropSource?.y || 330, reward);
    recordStat("wins");
    recordStat("bosses");
    recordTaskProgress("weekly-boss");
    if (newlyUnlocked) recordTaskProgress("weekly-heroes");
    save.stageStars[battleStage] = 3;
    if (progressed) {
      save.stage = battleStage + 1;
      save.maxStage = Math.max(save.maxStage || 1, save.stage);
      runtime.activeStage = save.stage;
    }
    runtime.waveClears = 0;
    runtime.bossActive = false;
    runtime.nextStageAfterSettlement = progressed ? save.stage : battleStage;
    runtime.battleResult = { type: "win", stage: battleStage, boss: chapter.boss, progressed, newlyUnlocked: newlyUnlocked?.name || "", reward, damage: damageSummary() };
    addLog(progressed ? "\u64ca\u7834\u300c" + chapter.boss + "\u300d\uff0c\u63a8\u9032\u81f3\u7b2c " + save.stage + " \u95dc\u3002" : "\u91cd\u6253\u300c" + chapter.boss + "\u300d\u6210\u529f\uff0c\u53d6\u5f97\u6230\u529f\u734e\u52f5\u3002");
    showDialogue("\u5289\u5099", "\u773e\u5c07\u8f9b\u82e6\u4e86\uff0c\u6574\u8ecd\u5f8c\u7e7c\u7e8c\u524d\u9032\u3002", "avatar-liubei");
    if (newlyUnlocked) toast("\u540d\u5c07\u4f86\u6295\uff1a" + newlyUnlocked.name);
    persist();
    window.TaoyuanPlatform?.track?.("battle_result", runtime.battleResult);
    if (typeof showSettlement === "function") showSettlement(runtime.battleResult);
    else scheduleGameTimer(() => startStage(runtime.nextStageAfterSettlement), 1800);
  } else {
    runtime.waveClears += 1;
    const stageConfig = stageDefinition();
    const waveReward = { gold: stageConfig?.goldBonus || 14 + activeStageNumber() * 3, shards: 1 };
    awardResources(waveReward);
    const dropSource = runtime.enemies[runtime.enemies.length - 1];
    spawnResourceDrops(dropSource?.x || 195, dropSource?.y || 330, waveReward);
    recordTaskProgress("daily-battle");
    save.battlePass.xp = (save.battlePass.xp || 0) + 1;
    addLog("\u6e05\u527f\u7b2c " + runtime.waveClears + " \u6ce2\u6575\u8ecd\u3002");
    beginWaveTransition("第 " + runtime.waveClears + " 波");
    if (runtime.waveClears >= 3) {
      updateHud();
      scheduleGameTimer(() => spawnWave(true, false), 700);
    } else {
      scheduleGameTimer(() => spawnWave(false, false), 450);
    }
  }
}

function partyDefeated() {
  if (runtime.spawning || runtime.allies.length === 0 || runtime.allies.some((ally) => !ally.dead)) return;
  runtime.spawning = true;
  runtime.enemies.length = 0;

  if (runtime.mode === "arena") {
    addLog("演武場切磋惜敗，調整陣容再試。");
    runtime.mode = "campaign";
    runtime.arenaOpponent = null;
  } else if (runtime.mode === "dungeon") {
    addLog("副本特訓未竟全功，整軍再戰。");
    runtime.mode = "campaign";
    runtime.dungeonId = null;
  } else if (runtime.mode === "tower") {
    addLog("問天樓第 " + (runtime.towerFloor || 1) + " 層整軍失敗，層數不變。");
    runtime.mode = "campaign";
    runtime.towerFloor = 0;
  }

  recordStat("losses");
  runtime.nextStageAfterSettlement = activeStageNumber();
  runtime.battleResult = { type: "lose", stage: activeStageNumber(), reward: {}, damage: damageSummary() };
  addLog("\u6211\u8ecd\u66ab\u9000\u6574\u5099\uff0c\u672a\u640d\u5931\u95dc\u5361\u9032\u5ea6\u3002");
  showDialogue("\u5f35\u98db", "\u6b47\u53e3\u6c23\uff0c\u518d\u8ddf\u4ed6\u5011\u6253\u904e\uff01", "avatar-zhangfei");
  if (typeof showSettlement === "function") showSettlement(runtime.battleResult);
  else scheduleGameTimer(() => { resetAllies(); spawnWave(false); }, 1800);
}
function gainExp(amount) {
  save.exp += amount;
  let needed = 90 + save.level * 35;
  while (save.exp >= needed) {
    save.exp -= needed;
    save.level += 1;
    save.gold += 100;
    toast("主公升至 Lv." + save.level);
    needed = 90 + save.level * 35;
  }
}

function updateGame(rawDelta) {
  // A wider cap keeps auto-battle moving in throttled WebViews without allowing huge tab-resume jumps.
  const frameDelta = Math.min(0.1, rawDelta || 1 / 60);
  runtime.renderDelta = frameDelta;
  const playSpeed = Math.max(1, Number(runtime.playSpeed) || 1);
  runtime.playSpeed = playSpeed;
  runtime.timeScale = playSpeed;
  runtime.auto = true;
  runtime.hitStop = 0;
  const delta = frameDelta * playSpeed;
  runtime.elapsed += delta;
  if (runtime.comboTimer > 0) runtime.comboTimer = Math.max(0, runtime.comboTimer - delta);
  else runtime.combo = 0;

  // Wave handoff watchdog: never leave the field frozen waiting on a missing timer.
  if (runtime.spawning && !runtime.battleResult) {
    runtime.spawnWait = (runtime.spawnWait || 0) + frameDelta;
    if (runtime.spawnWait > 1.1) {
      runtime.spawnWait = 0;
      spawnWave(runtime.waveClears >= 3 && !runtime.bossActive, false);
    }
  } else {
    runtime.spawnWait = 0;
  }

  // Keep AI alive even during wave handoff so the battle never looks hard-locked.
  for (const ally of runtime.allies) updateUnit(ally, runtime.enemies, delta);
  for (const enemy of runtime.enemies) updateUnit(enemy, runtime.allies, delta);
  updateProjectiles(delta);
  updateEffects(delta);
  updateResourceDrops(delta);
  updateWaveTransition(frameDelta);
  updateEnemyEntry(delta);
  if (runtime.skillCutIn) {
    runtime.skillCutIn.life -= frameDelta;
    if (runtime.skillCutIn.life <= 0) runtime.skillCutIn = null;
  }
  waveCleared();
  partyDefeated();
  if (runtime.dialogueTimer > 0) {
    runtime.dialogueTimer -= delta;
    if (runtime.dialogueTimer <= 0) $("dialogueBox").classList.remove("show");
  }
}

