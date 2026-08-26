/* Combat: units, waves, damage, skills and progression */
"use strict";

// Battlefield sprite scale: all units are smaller, while bosses retain hierarchy.
const ALLY_UNIT_SCALE = 0.88;
const ENEMY_UNIT_SCALE = 0.82;
const BOSS_UNIT_SCALE = 1.30;

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
  const columns = [105, 195, 285];
  const rows = [366, 420, 474];
  return { x: columns[slot % 3], y: rows[Math.floor(slot / 3)] };
}

function tacticBonus(id) {
  const tactic = TACTICS.find((item) => item.id === id);
  return tactic.base + (save.tactics[id] - 1) * 0.025;
}

function makeAlly(heroId, slot, index) {
  const hero = heroById(heroId);
  const level = save.heroLevels[heroId] || 1;
  const equipment = heroEquipmentStats(heroId);
  const position = formationPoint(slot);
  const laneBonus = formationBonus(slot);
  const hpBonus = tacticBonus("wall");
  const atkBonus = tacticBonus("snake");
  const speedBonus = tacticBonus("wind");
  const maxHp = Math.round((hero.hp + level * 23 + equipment.hp) * (1 + hpBonus + laneBonus.hp));
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
    atk: (hero.atk + level * 3.2 + equipment.atk) * (1 + atkBonus + laneBonus.atk),
    def: (hero.def + level * 0.8 + equipment.def) * (1 + laneBonus.def),
    speed: (hero.speed + equipment.speed) * (1 + speedBonus + laneBonus.speed),
    range: hero.range + equipment.range + laneBonus.range,
    cooldown: Math.random() * 0.5,
    skillCooldown: Math.random() * (hero.skillCooldown || 5),
    attackCount: 0,
    hitFlash: 0,
    attackPose: 0,
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

function makeEnemy(index, boss = false) {
  const stage = activeStageNumber();
  const config = stageDefinition(stage);
  const stagePower = config?.enemyPower || 1 + (stage - 1) * 0.16;
  const enemyType = boss ? "boss" : config?.enemyPool?.[(index + runtime.waveClears) % config.enemyPool.length] || (chance(0.25) ? "archer" : chance(0.32) ? "brute" : "bandit");
  const generalIds = config?.enemyGenerals || [];
  const waveGeneralIndex = Math.min(runtime.waveClears, Math.max(0, generalIds.length - 1));
  const enemyGeneralId = generalIds.length ? generalIds[waveGeneralIndex] : null;
  const enemyProfiles = {
    bandit: { role: "步兵", hp: 105, atk: 11, def: 3.5, speed: 13, range: 27, color: "#8f3630" },
    brute: { role: "步兵", hp: 148, atk: 14, def: 6, speed: 10, range: 29, color: "#565858" },
    cavalry: { role: "騎兵", hp: 118, atk: 15, def: 4.5, speed: 20, range: 34, color: "#795347" },
    archer: { role: "弓兵", hp: 82, atk: 10, def: 2.5, speed: 12, range: 125, color: "#557451" },
    strategist: { role: "謀士", hp: 76, atk: 13, def: 2, speed: 11, range: 138, color: "#5a527d" }
  };
  const profile = enemyProfiles[enemyType] || enemyProfiles.bandit;
  const maxHp = Math.round((boss ? (config?.bossHp || 680) : profile.hp + Math.random() * 18) * stagePower);
  const lanes = [78, 132, 190, 248, 309];
  const spawnX = lanes[index % lanes.length] + (Math.random() - 0.5) * 24;
  const spawnY = 184 + Math.floor(index / lanes.length) * 44 + Math.random() * 16;
  return {
    id: "enemy-" + Date.now() + "-" + index,
    team: "enemy",
    type: enemyType,
    enemyGeneralId: boss ? config?.bossGeneral || enemyGeneralId : enemyGeneralId,
    x: spawnX,
    y: spawnY,
    renderX: spawnX,
    renderY: spawnY,
    hp: maxHp,
    maxHp,
    atk: (boss ? (config?.bossAtk || 27) : profile.atk + Math.random() * 2) * stagePower,
    def: (boss ? 11 : profile.def) * stagePower,
    speed: boss ? 16 : profile.speed + Math.random() * 3,
    range: boss ? 42 : profile.range,
    cooldown: Math.random() * 0.8,
    attackCount: 0,
    hitFlash: 0,
    attackPose: 0,
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

function spawnWave(boss = false) {
  runtime.spawning = false;
  runtime.bossActive = boss;
  runtime.enemies = [];
  if (runtime.allies.length === 0 || runtime.allies.every((unit) => unit.dead)) resetAllies();
  const config = stageDefinition();
  const count = boss ? 1 + Math.min(4, activeStageNumber()) : config?.enemyCount || 4 + Math.min(7, activeStageNumber() + runtime.waveClears);
  for (let i = 0; i < count; i += 1) runtime.enemies.push(makeEnemy(i, boss && i === 0));
  showEnemyPreview(activeStageNumber(), boss ? 4 : runtime.waveClears + 1);
  if (boss) {
    const chapter = chapterForStage();
    $("bossName").textContent = enemyGeneralById(config?.bossGeneral)?.name || chapter.boss;
    $("bossBanner").classList.remove("show");
    void $("bossBanner").offsetWidth;
    $("bossBanner").classList.add("show");
    showDialogue("關羽", "兄長，敵將已現身。關某請戰！", "avatar-guanyu");
    addLog("遭遇首領「" + chapter.boss + "」。");
    beep(95, 0.3, "sawtooth", 0.04);
  }
  updateHud();
}

function nearestTarget(unit, targets) {
  let best = null;
  let bestDistance = Infinity;
  for (const target of targets) {
    if (target.dead) continue;
    const distance = Math.hypot(target.x - unit.x, (target.y - unit.y) * 1.12);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = target;
    }
  }
  return { target: best, distance: bestDistance };
}

function addNumber(x, y, value, critical = false, heal = false) {
  runtime.numbers.push({
    x,
    y,
    value: (heal ? "+" : "") + Math.round(value),
    life: 0.72,
    maxLife: 0.72,
    color: heal ? "#88e899" : critical ? "#ffe16b" : "#fff1da",
    // Damage needs to read instantly on a small mobile canvas. Keep crits
    // clearly dominant while leaving normal hits compact enough for stacks.
    size: critical ? 24 : 16
  });
}

function addEffect(type, x, y, color = "#fff", options = {}) {
  if (!save.effects) return;
  if (runtime.effects.length > 140) runtime.effects.splice(0, runtime.effects.length - 120);
  runtime.effects.push({
    type,
    x,
    y,
    color,
    life: options.life || 0.38,
    maxLife: options.life || 0.38,
    radius: options.radius || 35,
    angle: options.angle || 0,
    scale: options.scale || 1,
    facing: options.facing || 1
  });
}

function fireProjectile(attacker, target, color) {
  runtime.projectiles.push({
    x: attacker.x,
    y: attacker.y - 20,
    target,
    speed: attacker.role === "謀士" ? 245 : 310,
    color,
    damage: Math.max(2, attacker.atk - target.def * 0.55),
    team: attacker.team,
    life: 1.4
  });
}

function applyDamage(attacker, target, multiplier = 1, criticalChance = 0.12) {
  if (!target || target.dead) return;
  const critical = chance(criticalChance);
  const variance = 0.88 + Math.random() * 0.22;
  const damage = Math.max(2, (attacker.atk * multiplier - target.def * 0.58) * variance * (critical ? 1.72 : 1));
  target.hp -= damage;
  target.hitFlash = critical ? 0.2 : 0.14;
  target.hitStun = critical ? 0.075 : 0.035;
  const sourceX = Number.isFinite(attacker.x) ? attacker.x : target.x;
  const sourceY = Number.isFinite(attacker.y) ? attacker.y : target.y + 1;
  const knockAngle = Math.atan2(target.y - sourceY, target.x - sourceX);
  const knockForce = critical ? 10 : multiplier > 1.25 ? 7 : 4;
  target.kickX = Math.cos(knockAngle) * knockForce;
  target.kickY = Math.sin(knockAngle) * knockForce;
  addNumber(target.x, target.y - 31, damage, critical);
  addEffect("spark", target.x, target.y - 13, critical ? "#ffe270" : "#f1d8bd", { radius: critical ? 25 : 14, life: 0.22 });
  addEffect("impact", target.x, target.y - 14, critical ? "#fff08b" : "#f7d8ad", { radius: critical ? 34 : 19, life: critical ? 0.3 : 0.18, angle: knockAngle });
  runtime.hitStop = Math.max(runtime.hitStop, critical ? 0.055 : multiplier > 1.25 ? 0.04 : 0.018);
  if (critical) {
    runtime.shake = Math.max(runtime.shake, 5);
    addEffect("shockwave", target.x, target.y - 10, "#ffd769", { radius: 42, life: 0.34 });
  }
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
  addEffect("burst", target.x, target.y - 12, target.team === "enemy" ? "#b94934" : "#75a7ca", { radius: 42, life: 0.55 });
  addEffect("dust", target.x, target.y + 2, "#b7a77d", { radius: target.type === "boss" ? 42 : 25, life: 0.55 });
  if (target.team === "enemy") {
    const battleStage = activeStageNumber();
    const gold = target.type === "boss" ? 105 + battleStage * 22 : 4 + battleStage;
    const food = target.type === "boss" ? 46 + battleStage * 8 : chance(0.35) ? 2 : 0;
    save.gold += gold;
    save.food += food;
    gainExp(target.type === "boss" ? 55 + battleStage * 6 : 5);
    if (target.type === "boss") {
      runtime.shake = 10;
      beep(135, 0.22, "square", 0.045);
    }
  } else if (attacker) {
    addLog(target.hero.name + "力竭，等待重新整軍。");
  }
}

function useHeroSkill(unit, target) {
  unit.attackCount = 0;
  unit.skillCooldown = unit.hero.skillCooldown || 5;
  runtime.shake = Math.max(runtime.shake, 6);
  runtime.flash = 0.13;
  runtime.flashColor = unit.hero.accent;
  const hero = unit.hero;
  addEffect("shockwave", unit.x, unit.y - 10, hero.accent, { radius: 74, life: 0.48 });
  addEffect("afterimage", unit.x - Math.cos(unit.action?.angle || 0) * 11, unit.y - Math.sin(unit.action?.angle || 0) * 11, hero.accent, { life: 0.3, scale: unit.scale, facing: unit.facing });
  addEffect("afterimage", unit.x - Math.cos(unit.action?.angle || 0) * 22, unit.y - Math.sin(unit.action?.angle || 0) * 22, hero.accent, { life: 0.22, scale: unit.scale * 0.92, facing: unit.facing });
  showDialogue(hero.name, hero.skill + "！", hero.avatar);
  if (hero.id === "liubei") {
    for (const ally of runtime.allies) {
      if (ally.dead) continue;
      const heal = ally.maxHp * 0.12;
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      addNumber(ally.x, ally.y - 35, heal, false, true);
      addEffect("ring", ally.x, ally.y, "#7be0a5", { radius: 28, life: 0.6 });
    }
  } else if (hero.role === "弓兵" || hero.role === "謀士") {
    const living = runtime.enemies.filter((enemy) => !enemy.dead).slice(0, 4);
    living.forEach((enemy, index) => {
      setTimeout(() => {
        if (!enemy.dead) {
          applyDamage(unit, enemy, 1.4, 0.25);
          addEffect("bolt", enemy.x, enemy.y, hero.accent, { radius: 45, life: 0.38 });
        }
      }, index * 80);
    });
  } else {
    const living = runtime.enemies.filter((enemy) => !enemy.dead && Math.hypot(enemy.x - unit.x, enemy.y - unit.y) < 150);
    const skillAngle = Math.atan2(target.y - unit.y, target.x - unit.x);
    addEffect("slash", unit.x, unit.y - 8, hero.accent, { radius: 72, life: 0.48, angle: skillAngle });
    if (hero.id === "guanyu") {
      addEffect("slash", unit.x, unit.y - 8, "#ffcf65", { radius: 58, life: 0.38, angle: skillAngle - 0.55 });
      addEffect("slash", unit.x, unit.y - 8, "#f05d3e", { radius: 86, life: 0.54, angle: skillAngle + 0.48 });
    } else if (hero.id === "zhangfei") {
      runtime.shake = Math.max(runtime.shake, 9);
      addEffect("shockwave", unit.x, unit.y, "#e9c05c", { radius: 105, life: 0.62 });
      for (const enemy of living) {
        const pushAngle = Math.atan2(enemy.y - unit.y, enemy.x - unit.x);
        enemy.kickX += Math.cos(pushAngle) * 13;
        enemy.kickY += Math.sin(pushAngle) * 13;
      }
    } else if (hero.id === "zhaoyun") {
      for (let i = 1; i <= 3; i += 1) {
        addEffect("afterimage", unit.x - Math.cos(skillAngle) * i * 14, unit.y - Math.sin(skillAngle) * i * 14, hero.accent, { life: 0.18 + i * 0.05, scale: unit.scale * (1 - i * 0.06), facing: unit.facing });
      }
    }
    (living.length ? living : [target]).forEach((enemy) => applyDamage(unit, enemy, hero.id === "guanyu" ? 2.05 : 1.7, 0.24));
  }
  beep(hero.role === "謀士" ? 540 : 170, 0.12, "sawtooth", 0.035);
}

function attack(unit, target) {
  unit.cooldown = (unit.role === "騎兵" ? 0.78 : unit.role === "弓兵" ? 1.05 : unit.role === "謀士" ? 1.22 : 0.92) / (unit.team === "ally" ? 1 + tacticBonus("wind") : 1);
  unit.attackCount += 1;
  const skill = unit.team === "ally" && unit.attackCount >= 5 && unit.skillCooldown <= 0;
  const ranged = unit.team === "ally" && (unit.role === "弓兵" || unit.role === "謀士");
  const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
  unit.action = {
    target,
    skill,
    ranged,
    angle,
    elapsed: 0,
    impactAt: skill ? 0.2 : ranged ? 0.145 : 0.095,
    total: skill ? 0.52 : ranged ? 0.32 : 0.255,
    resolved: false
  };
  unit.facing = Math.cos(angle) < 0 ? -1 : 1;
  if (skill) {
    addEffect("charge", unit.x, unit.y - 13, unit.hero.accent, { radius: 38, life: 0.32 });
    beep(220, 0.075, "triangle", 0.022);
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
    unit.motionX -= Math.cos(action.angle) * 4;
    unit.motionY -= Math.sin(action.angle) * 4;
  } else {
    applyDamage(unit, target, 1, unit.team === "ally" ? 0.13 : 0.05);
    addEffect("slash", target.x, target.y - 12, unit.team === "ally" ? unit.hero.accent : "#e0b38d", { radius: 27, life: 0.22, angle: action.angle });
    if (unit.team === "ally" && unit.hero.id === "liubei") {
      addEffect("slash", target.x, target.y - 12, "#dce8d8", { radius: 23, life: 0.2, angle: action.angle + Math.PI / 2 });
    } else if (unit.team === "ally" && unit.hero.id === "guanyu") {
      addEffect("slash", target.x, target.y - 13, "#d4b356", { radius: 38, life: 0.3, angle: action.angle - 0.35 });
    } else if (unit.team === "ally" && unit.hero.id === "zhangfei") {
      addEffect("shockwave", target.x, target.y, "#b84a35", { radius: 30, life: 0.25 });
      runtime.shake = Math.max(runtime.shake, 3.2);
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

  if (action.elapsed < action.impactAt) {
    const anticipation = Math.sin(windup * Math.PI * 0.5);
    const pullback = action.skill ? 7 : 4;
    unit.motionX = -directionX * pullback * anticipation;
    unit.motionY = -directionY * pullback * anticipation;
    unit.squashX = -0.07 * anticipation;
    unit.squashY = 0.09 * anticipation;
    unit.weaponSwing = -0.75 * anticipation;
  } else {
    if (!action.resolved) {
      action.resolved = true;
      resolveAttack(unit, action);
    }
    const recovery = clamp((action.elapsed - action.impactAt) / (action.total - action.impactAt), 0, 1);
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
  }
  return true;
}

function updateUnit(unit, targets, delta) {
  if (unit.dead) return;
  unit.cooldown -= delta;
  if (unit.team === "ally") unit.skillCooldown = Math.max(0, unit.skillCooldown - delta);
  unit.hitFlash = Math.max(0, unit.hitFlash - delta);
  unit.attackPose = Math.max(0, unit.attackPose - delta);
  unit.hitStun = Math.max(0, unit.hitStun - delta);
  const kickDecay = Math.exp(-delta * 15);
  unit.kickX *= kickDecay;
  unit.kickY *= kickDecay;
  unit.moving = 0;
  if (unit.hitStun > 0) return;
  if (updateAction(unit, delta)) return;
  const { target, distance } = nearestTarget(unit, targets);
  if (!target) return;
  unit.facing = target.x < unit.x ? -1 : 1;
  if (distance > unit.range) {
    const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
    const spacing = unit.team === "ally" ? 1 : 0.82;
    unit.x += Math.cos(angle) * unit.speed * spacing * delta;
    unit.y += Math.sin(angle) * unit.speed * spacing * delta;
    unit.moving = 1;
    unit.stepTimer -= delta;
    if (unit.stepTimer <= 0) {
      unit.stepTimer = 0.2 + Math.random() * 0.1;
      addEffect("dust", unit.x, unit.y + 2, "#978b6c", { radius: 9, life: 0.3 });
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
      const fakeAttacker = { atk: projectile.damage, team: projectile.team, x: projectile.x, y: projectile.y };
      applyDamage(fakeAttacker, projectile.target, 1, 0.1);
      addEffect("impact", projectile.target.x, projectile.target.y - 16, projectile.color, { radius: 22, life: 0.2 });
      projectile.life = 0;
    } else {
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
    if (unit.dead && unit.deathTime > 0) {
      unit.deathTime = Math.max(0, unit.deathTime - delta);
      unit.kickX *= Math.exp(-delta * 5);
      unit.kickY += 18 * delta;
    }
  }
  runtime.effects = runtime.effects.filter((item) => item.life > 0);
  runtime.numbers = runtime.numbers.filter((item) => item.life > 0);
  runtime.shake = Math.max(0, runtime.shake - delta * 18);
  runtime.flash = Math.max(0, runtime.flash - delta);
}

function waveCleared() {
  if (runtime.spawning || runtime.enemies.length === 0 || runtime.enemies.some((enemy) => !enemy.dead)) return;
  runtime.spawning = true;
  if (runtime.bossActive) {
    const battleStage = activeStageNumber();
    const chapter = chapterForStage();
    const progressed = battleStage >= save.stage;
    if (progressed) {
      save.stage = battleStage + 1;
      save.maxStage = Math.max(save.maxStage || 1, save.stage);
      runtime.activeStage = save.stage;
    }
    const rewardScale = progressed ? 1 : 0.55;
    save.jade += progressed ? 2 : 1;
    save.gold += Math.round((140 + battleStage * 30) * rewardScale);
    save.food += Math.round((55 + battleStage * 9) * rewardScale);
    runtime.waveClears = 0;
    runtime.bossActive = false;
    addLog(progressed ? "擊破「" + chapter.boss + "」，推進至第 " + save.stage + " 關。" : "重打「" + chapter.boss + "」成功，取得戰功獎勵。");
    showDialogue("劉備", "眾將辛苦了，整軍後繼續前進。", "avatar-liubei");
    toast(progressed ? "首領擊破！獲得玉璧 ×2" : "重打成功！獲得部分戰功獎勵");
    const newlyUnlocked = progressed && HEROES.find((hero) => hero.unlock === battleStage);
    if (newlyUnlocked) {
      toast("名將來投：" + newlyUnlocked.name);
      $("heroNotice").textContent = "1";
      $("heroNotice").hidden = false;
    }
    buildTerrain();
    persist();
    setTimeout(() => {
      resetAllies();
      spawnWave(false);
    }, 1800);
  } else {
    runtime.waveClears += 1;
    const stageConfig = stageDefinition();
    save.gold += stageConfig?.goldBonus || 14 + activeStageNumber() * 3;
    addLog("清剿第 " + runtime.waveClears + " 波敵軍。");
    if (runtime.waveClears >= 3) {
      updateHud();
      if (runtime.auto) {
        setTimeout(() => spawnWave(true), 1600);
      } else {
        runtime.spawning = false;
        toast("首領已出現，點擊「關卡首領」迎戰");
      }
    } else {
      setTimeout(() => spawnWave(false), 1050);
    }
  }
}

function partyDefeated() {
  if (runtime.spawning || runtime.allies.length === 0 || runtime.allies.some((ally) => !ally.dead)) return;
  runtime.spawning = true;
  runtime.enemies.length = 0;
  addLog("我軍暫退整備，未損失關卡進度。");
  toast("全軍暫退，3 秒後重新集結");
  showDialogue("張飛", "歇口氣，再跟他們打過！", "avatar-zhangfei");
  setTimeout(() => {
    resetAllies();
    spawnWave(runtime.bossActive);
  }, 2800);
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
  const frameDelta = Math.min(0.1, rawDelta);
  runtime.renderDelta = frameDelta || 1 / 60;
  const delta = frameDelta * runtime.timeScale;
  runtime.elapsed += delta;
  if (runtime.hitStop > 0) {
    runtime.hitStop = Math.max(0, runtime.hitStop - frameDelta);
    updateEffects(frameDelta * 0.16);
    return;
  }
  if (runtime.auto && !runtime.spawning) {
    for (const ally of runtime.allies) updateUnit(ally, runtime.enemies, delta);
    for (const enemy of runtime.enemies) updateUnit(enemy, runtime.allies, delta);
  }
  updateProjectiles(delta);
  updateEffects(delta);
  waveCleared();
  partyDefeated();
  if (runtime.dialogueTimer > 0) {
    runtime.dialogueTimer -= delta;
    if (runtime.dialogueTimer <= 0) $("dialogueBox").classList.remove("show");
  }
}

