/* Render: Canvas sprites, effects and frame loop */
"use strict";

const ASSETS = window.TaoyuanAssets || {
  cache: new Map(),
  load(path) {
    if (!path) return Promise.resolve(null);
    if (this.cache.has(path)) return Promise.resolve(this.cache.get(path));
    const image = new Image();
    this.cache.set(path, image);
    return new Promise((resolve) => {
      image.onload = () => resolve(image);
      image.onerror = () => { this.cache.delete(path); resolve(null); };
      image.src = path;
    });
  },
  preload(paths = []) { return Promise.all(paths.map((path) => this.load(path))); },
  get(path) {
    if (!path) return null;
    let image = this.cache.get(path);
    if (!image) {
      this.load(path);
      image = this.cache.get(path);
    }
    return image?.complete && image.naturalWidth ? image : null;
  }
};
window.TaoyuanAssets = ASSETS;

const TERRAIN_TILE_BY_CHAPTER = [0, 1, 2, 3, 4, 6, 7, 2, 8, 14, 9, 10, 6, 13, 11, 12, 15, 14, 13, 10];
const VFX_ASSET_BY_TYPE = { afterimage: 2, dust: 12, impact: 15, shockwave: 14, charge: 1, slash: 0, ring: 10, bolt: 4, status: 5, combo: 14, rally: 10, guard: 9, stun: 8, volley: 3, rune: 11, petal: 6, soul: 13, meteor: 7 };
// Attack sheets passed the combat-asset alpha gate (generate-attack-sprites.js
// composites body via sharp). Visual five-phase / eight-direction review is
// still VERIFY; keep the runtime flag so a failed remake can be quarantined.
const ATTACK_SPRITES_APPROVED = true;
const BOSS_SPRITE_BY_GENERAL = { zhangjiao: "zhangjiao", simayi: "zhangjiao", dongzhuo: "dongzhuo", yuanshao: "dongzhuo", lvbu: "lvbu", menghuo: "menghuo", zhurong: "menghuo" };
const ENEMY_BODY_BY_TYPE = { ...(GAME_DATA.enemyIdentityMap?.types || { bandit: "caoren", brute: "dianwei", cavalry: "xiahoudun", archer: "huangzhong", strategist: "simayi" }) };
const ENEMY_GENERAL_BODY_ALIASES = { ...(GAME_DATA.enemyIdentityMap?.generals || { zhangjiao: "zhangliang", dongzhuo: "yuanshao", lvbu: "lubu", yuanshao: "yuanshao", yanliang: "zhangfei", wenchou: "xiahoudun", taishici: "taishici", huangzhong: "huangzhong", menghuo: "menghuo", zhurong: "zhurong", simayi: "simayi" }) };
const WEAPON_ANCHORS = {
  sword: [32, 54],
  twin: [30, 52],
  guandao: [28, 56],
  serpent: [28, 56],
  lance: [32, 58],
  bow: [22, 40],
  fan: [36, 48],
  rings: [36, 46],
  halberd: [26, 56]
};
const LOCKED_COMBAT_BODY_PATH = "assets/characters/combat-body-locked-v1.webp";
function enemyCombatBodyPath(unit) {
  const identity = ENEMY_GENERAL_BODY_ALIASES[unit.enemyGeneralId] || ENEMY_BODY_BY_TYPE[unit.type] || ENEMY_BODY_BY_TYPE.bandit || "caoren";
  return "assets/characters/combat-body-" + identity + "-v1.webp";
}
function terrainTileAsset(chapterIndex) {
  const tileId = TERRAIN_TILE_BY_CHAPTER[chapterIndex % TERRAIN_TILE_BY_CHAPTER.length] ?? 0;
  return ASSETS.get("assets/backgrounds/terrain-tile-" + tileId + "-v1.webp");
}
function drawTerrainTileLayer(chapterIndex) {
  const tile = terrainTileAsset(chapterIndex);
  if (!tile) return;
  ctx.save();
  ctx.globalAlpha = 0.48;
  for (let y = 0; y < 720; y += 96) {
    for (let x = 0; x < 390; x += 96) ctx.drawImage(tile, x, y, 96, 96);
  }
  ctx.restore();
}

function drawPixelRect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function drawBackground() {
  const chapter = chapterForStage();
  ctx.fillStyle = chapter.base;
  ctx.fillRect(0, 0, 390, 720);
  drawTerrainTileLayer(Math.floor((activeStageNumber() - 1) / STAGES_PER_CHAPTER));

  const gradient = ctx.createLinearGradient(0, 80, 390, 610);
  gradient.addColorStop(0, "#d9d3b522");
  gradient.addColorStop(0.5, "#22291d00");
  gradient.addColorStop(1, "#14171299");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 390, 720);

  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = chapter.path;
  ctx.lineWidth = 104;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(185, 86);
  ctx.bezierCurveTo(255, 230, 118, 340, 210, 620);
  ctx.stroke();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#d5c699";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  for (const mark of runtime.terrain) {
    if (mark.type === "stain") {
      ctx.globalAlpha = 0.16 + mark.tone * 0.1;
      ctx.fillStyle = mark.tone > 0.5 ? "#314532" : "#b2aa7d";
      ctx.beginPath();
      ctx.ellipse(mark.x, mark.y, mark.size * 2.3, mark.size, mark.tone * 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (mark.type === "grass") {
      ctx.globalAlpha = 0.56;
      ctx.strokeStyle = mark.tone > 0.5 ? "#33492f" : "#455735";
      ctx.lineWidth = 2;
      for (let blade = 0; blade < 3; blade += 1) {
        ctx.beginPath();
        ctx.moveTo(mark.x + blade * 3, mark.y + mark.size);
        ctx.lineTo(mark.x + blade * 2 - 3, mark.y - mark.size);
        ctx.stroke();
      }
    } else {
      ctx.globalAlpha = 0.6;
      drawPixelRect(mark.x, mark.y, mark.size * 2, mark.size, mark.tone > 0.5 ? "#555748" : "#77735f");
      drawPixelRect(mark.x + 2, mark.y, mark.size, 2, "#aaa087");
    }
  }
  ctx.globalAlpha = 1;

  drawMapDecoration(26, 126, "tree");
  drawMapDecoration(352, 262, "tree");
  drawMapDecoration(31, 402, "rock");
  drawMapDecoration(354, 525, "flag");

  drawChapterEnvironment(chapter);
  drawWeatherOverlay();

  const vignette = ctx.createRadialGradient(195, 335, 120, 195, 335, 350);
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, "#0e110b99");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 390, 720);
}

function drawWeatherOverlay() {
  const stage = activeStageNumber();
  const weather = stage % 11 === 0 ? "snow" : stage % 5 === 0 ? "night" : stage % 3 === 0 ? "rain" : "clear";
  if (weather === "clear") return;
  ctx.save();
  if (weather === "night") {
    ctx.fillStyle = "#121b3366";
    ctx.fillRect(0, 0, 390, 720);
    for (let i = 0; i < 12; i += 1) {
      const pulse = (Math.sin(runtime.elapsed * 3 + i * 1.5) + 1) * 0.5;
      const x = (i * 37 + Math.sin(runtime.elapsed * 0.8 + i) * 12) % 370 + 10;
      const y = 100 + ((i * 47 + Math.cos(runtime.elapsed * 0.6 + i) * 16) % 520);
      ctx.globalAlpha = 0.3 + pulse * 0.55;
      ctx.fillStyle = i % 2 === 0 ? "#ffd97a" : "#c4f2bb";
      drawPixelRect(x, y, 2, 2, ctx.fillStyle);
    }
  } else if (weather === "snow") {
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 36; i += 1) {
      const sway = Math.sin(runtime.elapsed * 2 + i) * 6;
      const x = (i * 39 + Math.floor(runtime.elapsed * 12) + sway) % 410 - 10;
      const y = (i * 27 + Math.floor(runtime.elapsed * 28)) % 620 + 80;
      const size = (i % 3 === 0) ? 3 : 2;
      ctx.globalAlpha = (i % 2 === 0) ? 0.65 : 0.4;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Rain
    ctx.strokeStyle = "#a2bfd2";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 32; i += 1) {
      const x = (i * 43 + Math.floor(runtime.elapsed * 18)) % 410 - 10;
      const y = (i * 29 + Math.floor(runtime.elapsed * 65)) % 620 + 80;
      ctx.globalAlpha = 0.25 + (i % 4) * 0.08;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 14);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawChapterEnvironment(chapter) {
  const chapterIndex = Math.floor((activeStageNumber() - 1) / STAGES_PER_CHAPTER);
  const pulse = (Math.sin(runtime.elapsed * 2.5) + 1) * .5;
  ctx.save();
  ctx.globalAlpha = .22;
  if (chapterIndex === 1) {
    ctx.fillStyle = "#415537";
    for (let i = 0; i < 5; i += 1) drawPixelRect(12 + i * 83, 106 + (i % 2) * 10, 28, 9, "#4c633d");
    ctx.fillStyle = "#a98f55";
    for (let i = 0; i < 3; i += 1) drawPixelRect(40 + i * 137, 570 - i * 13, 48, 4, "#b7a56c");
  } else if (chapterIndex === 2) {
    ctx.fillStyle = "#4c5554";
    for (let i = 0; i < 4; i += 1) drawPixelRect(20 + i * 110, 126 + (i % 2) * 9, 46, 8, "#596564");
    ctx.fillStyle = "#252c2a";
    for (let i = 0; i < 5; i += 1) drawPixelRect(7 + i * 78, 610 - (i % 2) * 11, 36, 10, "#303a35");
  } else if (chapterIndex === 3) {
    ctx.fillStyle = "#384b46";
    for (let i = 0; i < 5; i += 1) drawPixelRect(4 + i * 93, 123 + (i % 3) * 8, 54, 6, "#405e57");
    ctx.fillStyle = "#9b7c4c";
    for (let i = 0; i < 6; i += 1) drawPixelRect(18 + i * 67, 590 - (i % 2) * 12, 26, 3, "#b29660");
  } else if (chapterIndex === 4) {
    ctx.fillStyle = "#e7e5cc";
    for (let i = 0; i < 8; i += 1) drawPixelRect(12 + i * 51, 98 + (i % 3) * 28, 4, 4, "#f4f3dc");
    ctx.fillStyle = "#71818a";
    for (let i = 0; i < 4; i += 1) drawPixelRect(9 + i * 121, 156 + (i % 2) * 17, 55, 5, "#81949a");
  } else if (chapterIndex >= 5) {
    ctx.fillStyle = "#b6a26b";
    for (let i = 0; i < 7; i += 1) drawPixelRect(16 + i * 57, 98 + (i % 4) * 24, 2, 13, "#d5c17b");
    ctx.fillStyle = "#5e3930";
    for (let i = 0; i < 3; i += 1) drawPixelRect(15 + i * 153, 155 + i * 13, 48, 5, "#7d4435");
  }
  ctx.globalAlpha = .18 + pulse * .08;
  ctx.fillStyle = chapterIndex >= 5 ? "#dfad52" : chapterIndex === 4 ? "#d9f1f0" : "#c2a873";
  for (let i = 0; i < 9; i += 1) {
    const x = (i * 71 + Math.floor(runtime.elapsed * (chapterIndex >= 5 ? 18 : 9))) % 390;
    const y = 95 + ((i * 83 + Math.floor(runtime.elapsed * 7)) % 500);
    drawPixelRect(x, y, chapterIndex === 4 ? 2 : 3, chapterIndex === 4 ? 5 : 2, ctx.fillStyle);
  }
  ctx.restore();
}

function drawMapDecoration(x, y, type) {
  if (type === "tree") {
    drawPixelRect(x - 3, y + 9, 7, 19, "#493b28");
    drawPixelRect(x - 17, y - 4, 34, 20, "#304a32");
    drawPixelRect(x - 10, y - 14, 25, 19, "#415e3b");
    drawPixelRect(x - 2, y - 21, 13, 14, "#597149");
  } else if (type === "rock") {
    drawPixelRect(x - 13, y, 28, 14, "#55564c");
    drawPixelRect(x - 8, y - 7, 19, 10, "#77766a");
    drawPixelRect(x - 4, y - 5, 9, 3, "#aaa38c");
  } else {
    drawPixelRect(x, y - 25, 3, 45, "#332719");
    ctx.fillStyle = "#8d302b";
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 23);
    ctx.lineTo(x + 26, y - 17);
    ctx.lineTo(x + 3, y - 6);
    ctx.fill();
  }
}

function drawHealthBar(unit, visualX = unit.x + unit.motionX + unit.kickX, visualY = unit.y + unit.motionY + unit.kickY) {
  if (unit.dead || (unit.team === "enemy" && unit.type !== "boss")) return;
  const boss = unit.type === "boss";
  const width = boss ? 60 : 44;
  const x = Math.round(visualX - width / 2);
  const y = boss ? Math.round(visualY - 62 * unit.scale) : Math.round(visualY + 11 * unit.scale);
  drawPixelRect(x - 1, y - 1, width + 2, 7, "#151310");
  const hpRatio = clamp(unit.hp / unit.maxHp, 0, 1);
  const lagRatio = clamp(Number.isFinite(unit.hpLag) ? unit.hpLag / unit.maxHp : hpRatio, hpRatio, 1);
  drawPixelRect(x, y, width, 5, "#6d1d1b");
  if (lagRatio > hpRatio) drawPixelRect(x, y, Math.ceil(width * lagRatio), 5, "#fff1cf");
  drawPixelRect(x, y, Math.ceil(width * hpRatio), 5, boss ? "#e6b345" : "#4eb95b");
  drawPixelRect(x, y, Math.ceil(width * hpRatio), 1, boss ? "#fff2a8" : "#8ee398");
}

function drawSkillEnergyBar(unit, visualX, visualY) {
  if (unit.dead || unit.team !== "ally") return;
  const width = 44;
  const x = Math.round(visualX - width / 2);
  const healthOffset = 11 * unit.scale;
  const y = Math.round(visualY + healthOffset + 9);
  const attacksNeeded = 5;
  const attackRatio = clamp((unit.attackCount || 0) / attacksNeeded, 0, 1);
  const cooldownReady = (unit.skillCooldown || 0) <= 0;
  const ready = attackRatio >= 1 && cooldownReady;
  const ratio = cooldownReady ? attackRatio : Math.min(0.84, attackRatio * 0.84);
  const pulse = (Math.sin(runtime.elapsed * 9 + unit.x * 0.05) + 1) * 0.5;
  const border = ready ? (pulse > 0.4 ? "#fff5ab" : "#dfaf3c") : "#161410";
  const fill = ready ? (pulse > 0.5 ? "#ffe86b" : "#f1c84d") : cooldownReady ? "#5cb2c9" : "#65596b";
  drawPixelRect(x - 1, y - 1, width + 2, 6, border);
  drawPixelRect(x, y, width, 4, "#241f17");
  drawPixelRect(x, y, Math.ceil(width * ratio), 4, fill);
  if (ready) {
    drawPixelRect(x, y, Math.ceil(width * ratio), 1, "#fffde0");
    drawPixelRect(x + Math.max(0, Math.ceil(width * ratio) - 6), y, 6, 2, "#ffffff");
  }
}

function directionWorldAngle(unit, attack = false) {
  const index = attack && unit.action ? unit.action.direction : unit.direction;
  const fallback = unit.facing < 0 ? 4 : 0;
  return (Number.isFinite(index) ? index : fallback) * Math.PI / 4;
}

function directionLocalAngle(unit, attack = false) {
  const worldAngle = directionWorldAngle(unit, attack);
  return Math.atan2(Math.sin(worldAngle) * unit.facing, Math.cos(worldAngle) * unit.facing);
}

function attackPoseProgress(unit) {
  return clamp(Number(unit.attackPose) || 0, 0, 1);
}

function drawAttackPose(unit, accent, useAttackSprite = false) {
  if (!unit.action || unit.dead || useAttackSprite) return;
  const action = unit.action;
  const pose = attackPoseProgress(unit);
  const angle = directionLocalAngle(unit, true);
  const forwardX = Math.cos(angle);
  const forwardY = Math.sin(angle);
  const sideX = -forwardY;
  const sideY = forwardX;
  const ranged = action.ranged;
  const frameJolt = unit.attackFrame === 2 ? 2 : unit.attackFrame === 3 ? 1 : 0;
  const reach = (ranged ? 9 : action.skill ? 15 : 13) * pose;
  const pull = action.phase === "anticipation" ? -reach * 0.78 : reach;
  const shoulderX = 5;
  const shoulderY = -24;
  const handX = shoulderX + forwardX * pull + sideX * 2;
  const handY = shoulderY + forwardY * pull + sideY * 2 - frameJolt;

  ctx.save();
  if (pose > 0.18 && action.phase !== "anticipation") {
    const trail = ranged ? 10 : 16;
    const trailAlpha = Math.min(0.8, pose * 0.9);
    ctx.globalAlpha = trailAlpha;
    drawPixelLine(handX - forwardX * 3, handY - forwardY * 3, handX - forwardX * trail + sideX * 3, handY - forwardY * trail + sideY * 3, accent, ranged ? 1 : 2);
    if (!ranged) drawPixelLine(handX - forwardX * 5, handY - forwardY * 5, handX - forwardX * (trail + 5) - sideX * 2, handY - forwardY * (trail + 5) - sideY * 2, "#f5d276", 1);
    ctx.globalAlpha = 1;
  }
  if (action.skill && pose > 0.24) {
    ctx.globalAlpha = 0.45 + pose * 0.45;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(handX, handY, 3 + pose * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

const COMBAT_WEAPON_IDS = Object.freeze(["twin", "guandao", "serpent", "lance", "bow", "fan", "rings", "halberd", "sword"]);
const COMBAT_WEAPON_ALIAS = Object.freeze({
  fang: "sword", crescent: "guandao", meteor: "halberd", firebow: "bow", ironfan: "fan",
  tassel: "lance", "dragon-spear": "serpent", "jade-fan": "fan", "frost-blade": "sword",
  "meteor-hammer": "halberd", "phoenix-fan": "fan", "chain-sickle": "guandao", skybow: "bow",
  "black-iron": "sword", "imperial-sword": "twin", "qilin-staff": "halberd"
});

function resolveCombatWeaponId(unit) {
  const heroId = unit.team === "ally" ? unit.hero?.id : null;
  const equipped = heroId ? heroLoadout(heroId).weapon : null;
  const fallback = unit.role === "弓兵" ? "bow" : unit.role === "謀士" ? "fan" : unit.role === "騎兵" ? "lance" : "sword";
  const raw = equipped || fallback;
  if (COMBAT_WEAPON_IDS.includes(raw)) return raw;
  return COMBAT_WEAPON_ALIAS[raw] || "sword";
}

function weaponRestLean(weaponId) {
  // Asset tip points to -Y. Lean tip toward the body's forward side so the
  // blade sits beside the torso instead of floating as a white V/X above the skull.
  if (weaponId === "bow") return -0.08;
  if (weaponId === "fan" || weaponId === "rings") return 0.42;
  if (weaponId === "twin") return 0.58;
  if (weaponId === "guandao" || weaponId === "serpent" || weaponId === "halberd") return 0.78;
  return 0.7;
}

function weaponHandOffset(weaponId) {
  if (weaponId === "bow") return { x: 10, y: -18 };
  if (weaponId === "fan" || weaponId === "rings") return { x: 7, y: -20 };
  if (weaponId === "twin") return { x: 8, y: -16 };
  return { x: 9, y: -17 };
}

function drawWeapon(unit) {
  const weaponAssetId = resolveCombatWeaponId(unit);
  const weaponImage = ASSETS.get("assets/characters/combat-weapon-" + weaponAssetId + "-v2.webp");
  if (!weaponImage) return;
  const pose = attackPoseProgress(unit);
  const hand = weaponHandOffset(weaponAssetId);
  let angle;
  if (unit.action) {
    const swing = unit.action.phase === "anticipation" ? -0.55 * pose : 0.88 * pose;
    // Upright asset → rotate so tip follows facing/attack direction.
    angle = directionLocalAngle(unit, true) + Math.PI / 2 + swing;
  } else {
    const idleSway = Math.sin((runtime.elapsed || 0) * 3.2 + (unit.x || 0) * 0.04) * 0.04;
    angle = weaponRestLean(weaponAssetId) + idleSway + (Number(unit.weaponSwing) || 0) * 0.12;
  }

  // Keep weapon proportional to the 32×38 combat body (not a 64px tower over the head).
  const weaponScale = unit.type === "boss" ? 0.78 : unit.team === "ally" ? 0.58 : 0.52;
  const weaponSize = 64 * weaponScale;
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = false;
  const [anchorX, anchorY] = WEAPON_ANCHORS[weaponAssetId] || [32, 54];
  ctx.drawImage(weaponImage, -anchorX * weaponScale, -anchorY * weaponScale, weaponSize, weaponSize);

  if (unit.action && pose > 0.22 && unit.action.phase !== "anticipation") {
    const arcAlpha = Math.min(0.75, (1 - Math.abs(pose - 0.55) * 1.8) * 0.9);
    if (arcAlpha > 0.05) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = arcAlpha;
      const trailGrad = ctx.createLinearGradient(0, -10 * weaponScale, 0, -56 * weaponScale);
      trailGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      trailGrad.addColorStop(0.5, unit.accent || "#ffd868");
      trailGrad.addColorStop(1, "#ffffff");
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 3.5 * weaponScale;
      ctx.beginPath();
      ctx.arc(0, 0, 48 * weaponScale, -Math.PI / 2 - 0.75, -Math.PI / 2 + 0.35);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

function mountVisualDefinition(unit, heroId, mountId) {
  const configured = mountId && GAME_DATA.mountVisuals?.[mountId];
  if (configured) return configured;
  return {
    species: "horse",
    tier: 1,
    body: heroId === "lubu" ? "#6f342d" : unit.team === "ally" ? "#aaa99e" : "#5e5042",
    light: heroId === "lubu" ? "#c15a42" : unit.team === "ally" ? "#c1b6a4" : "#756250",
    mane: "#3a302b",
    hoof: "#28241e",
    armor: heroId === "lubu" ? "#d8ae45" : unit.team === "ally" ? "#6a744f" : "#4b352a",
    ornament: "#f0d47a",
    vfx: "dust"
  };
}

function drawMountVfx(mount, unit, walkCycle) {
  const pulse = (Math.sin(runtime.elapsed * 7 + unit.x * 0.04) + 1) * 0.5;
  const drift = Math.round(Math.sin(runtime.elapsed * 4 + unit.y * 0.03) * 2);
  if (mount.vfx === "ember") {
    ctx.globalAlpha = 0.42 + pulse * 0.28;
    drawPixelRect(18, -9 - drift, 3, 3, mount.ornament || "#f0a03d");
    drawPixelRect(-20 - drift, -4, 2, 3, "#e2683d");
    drawPixelRect(10, -29 + drift, 2, 3, "#ffd36b");
    ctx.globalAlpha = 1;
  } else if (mount.vfx === "snow") {
    ctx.globalAlpha = 0.48 + pulse * 0.22;
    drawPixelRect(-23 + drift, -22, 2, 2, mount.ornament || "#e4f8ff");
    drawPixelRect(20 - drift, -10, 2, 2, "#f7ffff");
    drawPixelRect(-10, 1 + drift, 3, 2, "#d8f2ea");
    ctx.globalAlpha = 1;
  } else if (mount.vfx === "lightning") {
    ctx.globalAlpha = 0.35 + pulse * 0.4;
    drawPixelLine(-25, -3, -21, -7, mount.ornament || "#d9f4ff", 1.5);
    drawPixelLine(-21, -7, -23, -11, mount.ornament || "#d9f4ff", 1.5);
    drawPixelLine(25, -4, 22, -8, "#9bd7ff", 1.5);
    ctx.globalAlpha = 1;
  } else if (mount.vfx === "mist") {
    ctx.globalAlpha = 0.2 + pulse * 0.14;
    drawPixelRect(-26, -4 + drift, 8, 3, mount.ornament || "#dff6ef");
    drawPixelRect(19, -1 - drift, 9, 3, "#e8f4ff");
    ctx.globalAlpha = 1;
  } else if (mount.vfx === "leaf") {
    ctx.globalAlpha = 0.52;
    drawPixelRect(-26 + drift, -17, 3, 2, mount.ornament || "#c4e39a");
    drawPixelRect(23 - drift, -7, 3, 2, "#96c27b");
    ctx.globalAlpha = 1;
  } else if (mount.vfx === "shadow") {
    ctx.globalAlpha = 0.28 + pulse * 0.12;
    drawPixelRect(-25 - drift, -7, 5, 3, mount.mane || "#141622");
    drawPixelRect(21 + drift, -4, 5, 3, mount.mane || "#141622");
    ctx.globalAlpha = 1;
  } else if (unit.moving) {
    ctx.globalAlpha = 0.2;
    drawPixelRect(-24, 0, 6, 2, "#d3c09c");
    drawPixelRect(20, 2, 5, 2, "#b8a98d");
    ctx.globalAlpha = 1;
  }
}

// Draw a connected two-part leg so the gait reads as one creature instead of
// separate floating rectangles. The upper segment shares the body palette and
// the lower segment carries the hoof, with opposite phases for front/rear legs.
function drawMountLeg(x, phase, body, hoof, width = 5, length = 11) {
  const shift = Math.round(phase * 2);
  const lift = phase > 0.35 ? 1 : 0;
  drawPixelRect(x + shift, -8 - lift, width, 7 + lift, body);
  drawPixelRect(x + shift, -3 - lift, width, Math.max(5, length - 4 + lift), hoof);
  drawPixelRect(x + shift + (phase > 0 ? 1 : 0), 3 - lift, Math.max(3, width - 1), 2, hoof);
}
function drawDetailedMount(mount, unit, heroId, walkCycle) {
  // Freeze the gait while idle; otherwise legs and tail keep drifting apart from
  // the body when the unit has reached its target.
  const gait = unit.moving ? walkCycle : 0;
  const stride = Math.round(gait * 2);
  const body = mount.body || "#8e8373";
  const light = mount.light || body;
  const mane = mount.mane || "#3a302b";
  const hoof = mount.hoof || "#28241e";
  const armor = mount.armor || "#6a744f";
  const ornament = mount.ornament || light;
  const species = mount.species || "horse";

  if (species === "elephant") {
    drawPixelRect(-23, -18, 37, 16, body);
    drawPixelRect(-17, -22, 25, 7, light);
    drawPixelRect(11, -21, 11, 12, light);
    drawPixelRect(20, -15, 5, 18, body);
    drawPixelRect(23, 0, 4, 6, light);
    drawPixelRect(7, -24, 10, 7, mane);
    drawMountLeg(-18, gait, body, hoof, 6, 11);
    drawMountLeg(-5, -gait, body, hoof, 6, 10);
    drawMountLeg(8, gait, body, hoof, 6, 11);
    drawPixelRect(-13, -20, 25, 4, armor);
    drawPixelRect(-7, -24, 3, 4, ornament);
    drawPixelRect(1, -24, 3, 4, ornament);
  } else if (species === "deer") {
    drawPixelRect(-19, -14, 29, 9, body);
    drawPixelRect(-8, -21, 12, 11, body);
    drawPixelRect(6, -27, 10, 9, light);
    drawPixelRect(14, -24, 8, 4, light);
    drawMountLeg(-15, gait, body, hoof, 4, 11);
    drawMountLeg(-5, -gait, body, hoof, 4, 11);
    drawMountLeg(4, gait, body, hoof, 4, 11);
    drawMountLeg(15, -gait, body, hoof, 4, 11);
    drawPixelRect(-8, -18, 17, 3, armor);
    drawPixelLine(9, -28, 5, -34, ornament, 2);
    drawPixelLine(12, -28, 16, -34, ornament, 2);
    drawPixelLine(7, -32, 3, -33, ornament, 1);
    drawPixelLine(15, -32, 19, -33, ornament, 1);
  } else if (species === "rhino") {
    drawPixelRect(-23, -17, 39, 15, body);
    drawPixelRect(-13, -22, 25, 8, light);
    drawPixelRect(13, -21, 11, 10, light);
    drawPixelRect(23, -19, 7, 4, ornament);
    drawMountLeg(-18, gait, body, hoof, 7, 11);
    drawMountLeg(-5, -gait, body, hoof, 7, 11);
    drawMountLeg(8, gait, body, hoof, 7, 11);
    drawPixelRect(-13, -20, 27, 5, armor);
    drawPixelRect(-1, -24, 3, 5, ornament);
  } else if (species === "panther") {
    drawPixelRect(-22, -13, 35, 9, body);
    drawPixelRect(8, -19, 13, 10, light);
    drawPixelRect(17, -23, 9, 7, light);
    drawPixelRect(18, -29, 4, 7, mane);
    drawPixelRect(24, -27, 4, 3, ornament);
    drawMountLeg(-15, gait, body, hoof, 4, 10);
    drawMountLeg(-4, -gait, body, hoof, 4, 10);
    drawMountLeg(7, gait, body, hoof, 4, 10);
    drawPixelRect(-20, -15, 7, 3, mane);
    drawPixelLine(-21, -11, -29, -17 - stride, mane, 2);
    drawPixelRect(-10, -17, 18, 3, armor);
  } else {
    drawPixelRect(-21, -14, 34, 12, body);
    drawPixelRect(-12, -19, 23, 8, body);
    drawPixelRect(8, -22, 13, 10, light);
    drawPixelRect(18, -26, 9, 7, light);
    drawPixelRect(23, -23, 7, 3, light);
    drawPixelRect(13, -30, 4, 7, mane);
    drawPixelRect(9, -27, 3, 8, mane);
    drawMountLeg(-15, gait, body, hoof, 5, 11);
    drawMountLeg(-3, -gait, body, hoof, 5, 10);
    drawMountLeg(7, gait, body, hoof, 5, 11);
    drawMountLeg(18, -gait, body, hoof, 5, 10);
    drawPixelRect(-10, -18, 20, 4, armor);
    drawPixelRect(-4, -21, 8, 3, ornament);
    drawPixelLine(21, -21, 27, -20, ornament, 1);
    drawPixelRect(23, -23, 2, 2, "#241b1b");
    drawPixelRect(15, -19, 3, 2, ornament);
  }
  if (mount.tier >= 3) {
    drawPixelRect(-18, -12, 4, 4, ornament);
    drawPixelRect(10, -13, 4, 4, ornament);
    drawPixelLine(-17, -9, -11, -6, armor, 1);
    drawPixelLine(10, -9, 16, -6, armor, 1);
  }
  if (mount.tier >= 4) {
    const glint = (Math.sin(runtime.elapsed * 5 + unit.x * 0.05) + 1) * 0.5;
    ctx.globalAlpha = 0.45 + glint * 0.35;
    drawPixelRect(-1, -25, 3, 3, ornament);
    drawPixelRect(3, -24, 3, 2, ornament);
    ctx.globalAlpha = 1;
  }
  drawMountVfx(mount, unit, walkCycle);
}

function drawMountOrFeet(unit, heroId, walkCycle, mountId = "") {
  const isCavalry = unit.role === "騎兵" || unit.type === "boss";
  const resolvedMountId = (mountId && mountId !== "foot") ? mountId : (isCavalry ? "grey" : (unit.team === "ally" ? "grey" : "foot"));
  const mounted = resolvedMountId !== "foot";
  if (!mounted) {
    const footImage = ASSETS.get("assets/characters/mount-foot-v1.webp");
    if (footImage) {
      ctx.drawImage(footImage, -16, -14, 32, 14);
    }
    return;
  }
  const lift = unit.moving ? -Math.abs(walkCycle) * 0.8 : 0;
  ctx.save();
  ctx.translate(0, lift);
  const mountScale = unit.type === "boss" ? 1.25 : 1.12;
  const mountImage = ASSETS.get("assets/characters/mount-" + resolvedMountId + "-v1.webp");
  if (mountImage) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mountImage, -26 * mountScale, -33 * mountScale, 52 * mountScale, 34 * mountScale);
  } else {
    // Canvas procedural mount fallback
    drawDetailedMount(mountVisualDefinition(unit, heroId, resolvedMountId), unit, heroId, walkCycle);
  }
  ctx.restore();
  drawMountVfx(mountVisualDefinition(unit, heroId, resolvedMountId), unit, walkCycle);
}

function drawHeroBack(heroId, accent, walkCycle, idleCycle) {
  const flutter = (idleCycle || 0) * 1.2;
  ctx.save();
  ctx.globalAlpha = 0.82;
  if (heroId === "liubei") {
    ctx.fillStyle = "#3f7f4d";
    ctx.beginPath();
    ctx.moveTo(-8, -27);
    ctx.lineTo(-15 - flutter, -19);
    ctx.lineTo(-11 - flutter, -5);
    ctx.lineTo(-5, -10);
    ctx.fill();
  } else if (heroId === "guanyu") {
    ctx.fillStyle = "#235f43";
    ctx.beginPath();
    ctx.moveTo(-8, -29);
    ctx.lineTo(-19 - flutter, -24);
    ctx.lineTo(-15 - flutter, -2);
    ctx.lineTo(-4, -7);
    ctx.fill();
  } else if (heroId === "zhangfei") {
    drawPixelRect(-16, -27, 8, 19, "#8d2f2a");
  } else if (heroId === "zhaoyun") {
    drawPixelRect(-14, -27, 8, 19, "#2f6fa9");
  } else if (heroId === "caocao") {
    ctx.fillStyle = "#332b50";
    ctx.beginPath();
    ctx.moveTo(-9, -29);
    ctx.lineTo(-18 - flutter, -22);
    ctx.lineTo(-14 - flutter, -3);
    ctx.lineTo(1, -9);
    ctx.fill();
  } else if (heroId === "lubu") {
    ctx.fillStyle = "#8c2028";
    ctx.beginPath();
    ctx.moveTo(-10, -30);
    ctx.lineTo(-20 - flutter, -23);
    ctx.lineTo(-16 - flutter, -1);
    ctx.lineTo(2, -8);
    ctx.fill();
  } else if (heroId === "sunshang" || heroId === "diaochan") {
    ctx.strokeStyle = heroId === "sunshang" ? "#e3a640" : "#e36aa5";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-5, -38);
    ctx.quadraticCurveTo(-21 - flutter, -31, -15 - flutter, -12);
    ctx.stroke();
  } else {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-9, -27);
    ctx.lineTo(-15 - flutter, -21);
    ctx.lineTo(-12 - flutter, -7);
    ctx.lineTo(-6, -11);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeroBody(heroId, body, accent) {
  if (heroId === "liubei") {
    drawPixelRect(-10, -28, 20, 21, "#e8e1c7");
    drawPixelRect(-13, -22, 5, 17, "#e8e1c7");
    drawPixelRect(8, -22, 5, 17, "#e8e1c7");
    drawPixelRect(-2, -28, 4, 17, "#4c9558");
    drawPixelRect(-9, -13, 18, 4, "#b58d3d");
  } else if (heroId === "guanyu") {
    drawPixelRect(-9, -30, 18, 23, "#24734f");
    drawPixelRect(-13, -24, 5, 17, "#319062");
    drawPixelRect(8, -24, 5, 17, "#319062");
    drawPixelRect(-9, -14, 18, 4, "#b6382e");
    drawPixelRect(-12, -29, 6, 5, "#d0a64e");
    drawPixelRect(6, -29, 6, 5, "#d0a64e");
  } else if (heroId === "zhangfei") {
    drawPixelRect(-13, -28, 26, 21, "#565e67");
    drawPixelRect(-17, -24, 6, 16, "#9f3c31");
    drawPixelRect(11, -24, 6, 16, "#9f3c31");
    drawPixelRect(-10, -25, 20, 5, "#858e91");
    drawPixelRect(-11, -13, 22, 5, "#a33c2d");
  } else if (heroId === "zhaoyun") {
    drawPixelRect(-9, -29, 18, 22, "#e1e3dc");
    drawPixelRect(-13, -24, 5, 17, "#bfc9ce");
    drawPixelRect(8, -24, 5, 17, "#bfc9ce");
    drawPixelRect(-7, -26, 14, 5, "#7d99aa");
    drawPixelRect(-10, -16, 20, 4, "#3277b2");
    drawPixelRect(-4, -21, 8, 8, "#4e82ba");
  } else if (heroId === "huangzhong") {
    drawPixelRect(-10, -28, 20, 21, "#856930");
    drawPixelRect(-13, -22, 5, 16, "#b29445");
    drawPixelRect(8, -22, 5, 16, "#b29445");
    drawPixelRect(-10, -16, 20, 4, "#d2b95e");
    drawPixelRect(-15, -27, 5, 17, "#5f4225");
  } else if (heroId === "sunshang") {
    drawPixelRect(-10, -28, 20, 19, "#cb536d");
    drawPixelRect(-13, -23, 5, 16, "#f0b55f");
    drawPixelRect(8, -23, 5, 16, "#f0b55f");
    ctx.fillStyle = "#d8667c";
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(10, -10);
    ctx.lineTo(14, -3);
    ctx.lineTo(-14, -3);
    ctx.fill();
  } else if (heroId === "caocao") {
    drawPixelRect(-11, -29, 22, 22, "#3b3d5c");
    drawPixelRect(-14, -24, 5, 17, "#6f4890");
    drawPixelRect(9, -24, 5, 17, "#6f4890");
    drawPixelRect(-8, -26, 16, 5, "#a98945");
    drawPixelRect(-11, -14, 22, 4, "#1f2031");
  } else if (heroId === "xiahoudun") {
    drawPixelRect(-12, -29, 24, 22, "#294e7d");
    drawPixelRect(-16, -25, 6, 18, "#687f9d");
    drawPixelRect(10, -25, 6, 18, "#687f9d");
    drawPixelRect(-10, -27, 20, 6, "#9aaabd");
    drawPixelRect(-12, -14, 24, 5, "#71362f");
  } else if (heroId === "zhugeliang") {
    drawPixelRect(-10, -29, 20, 24, "#d8d6c9");
    drawPixelRect(-13, -23, 5, 18, "#79a49b");
    drawPixelRect(8, -23, 5, 18, "#79a49b");
    drawPixelRect(-2, -28, 4, 20, "#76a198");
    drawPixelRect(-10, -11, 20, 4, "#536e69");
  } else if (heroId === "diaochan") {
    drawPixelRect(-9, -28, 18, 18, "#9859b5");
    drawPixelRect(-13, -23, 5, 17, "#e36ba8");
    drawPixelRect(8, -23, 5, 17, "#e36ba8");
    ctx.fillStyle = "#ad63be";
    ctx.beginPath();
    ctx.moveTo(-9, -12);
    ctx.lineTo(9, -12);
    ctx.lineTo(15, -3);
    ctx.lineTo(-15, -3);
    ctx.fill();
    drawPixelRect(-10, -16, 20, 3, "#e8bd5c");
  } else if (heroId === "lubu") {
    drawPixelRect(-12, -31, 24, 24, "#8f252c");
    drawPixelRect(-16, -26, 6, 19, "#d1a33c");
    drawPixelRect(10, -26, 6, 19, "#d1a33c");
    drawPixelRect(-9, -28, 18, 7, "#d8ad47");
    drawPixelRect(-12, -15, 24, 5, "#332529");
  } else {
    drawPixelRect(-10, -27, 20, 19, body);
    drawPixelRect(-13, -22, 5, 16, accent);
    drawPixelRect(8, -22, 5, 16, accent);
  }
}

function drawHeroHead(heroId, idleCycle) {
  const skin = heroId === "guanyu" ? "#b95e47" : heroId === "zhangfei" ? "#ae704e" : heroId === "lubu" ? "#c9825b" : "#d39a70";
  const faceWidth = heroId === "zhangfei" ? 20 : heroId === "guanyu" ? 17 : 16;
  drawPixelRect(-faceWidth / 2, -41, faceWidth, 15, skin);
  if (heroId === "liubei") {
    drawPixelRect(-11, -38, 3, 8, skin);
    drawPixelRect(8, -38, 3, 8, skin);
    drawPixelRect(-9, -44, 18, 7, "#342519");
    drawPixelRect(-5, -49, 10, 6, "#4f8c56");
    drawPixelRect(-2, -55, 4, 7, "#4f8c56");
    drawPixelRect(-5, -29, 4, 2, "#4a2a20");
    drawPixelRect(1, -29, 4, 2, "#4a2a20");
  } else if (heroId === "guanyu") {
    drawPixelRect(-10, -45, 20, 8, "#244f3d");
    drawPixelRect(-6, -49, 12, 5, "#2a694d");
    drawPixelRect(-7, -35, 5, 2, "#231813");
    drawPixelRect(2, -35, 5, 2, "#231813");
    ctx.fillStyle = "#2e1c17";
    ctx.beginPath();
    ctx.moveTo(-6, -29);
    ctx.lineTo(6, -29);
    ctx.lineTo(3 + idleCycle, -7);
    ctx.lineTo(-3 + idleCycle, -7);
    ctx.closePath();
    ctx.fill();
    drawPixelRect(-5, -26, 10, 3, "#1e1613");
  } else if (heroId === "zhangfei") {
    drawPixelRect(-11, -44, 22, 6, "#201811");
    drawPixelRect(-12, -47, 24, 4, "#a94434");
    drawPixelRect(-8, -36, 6, 3, "#1e1612");
    drawPixelRect(2, -36, 6, 3, "#1e1612");
    drawPixelRect(-10, -31, 20, 10, "#241a15");
    drawPixelRect(-7, -22, 14, 8, "#241a15");
    drawPixelRect(-13, -32, 5, 7, "#241a15");
    drawPixelRect(8, -32, 5, 7, "#241a15");
  } else if (heroId === "zhaoyun") {
    drawPixelRect(-10, -46, 20, 10, "#cfd4d2");
    drawPixelRect(-6, -49, 12, 5, "#edf0e8");
    drawPixelRect(-2, -57, 4, 9, "#347db8");
    drawPixelRect(1, -59 + idleCycle, 4, 6, "#59a1d1");
    drawPixelRect(-9, -43, 4, 11, "#7e98a7");
    drawPixelRect(5, -43, 4, 11, "#7e98a7");
  } else if (heroId === "huangzhong") {
    drawPixelRect(-9, -45, 18, 8, "#88713b");
    drawPixelRect(-6, -49, 12, 5, "#b99b4e");
    drawPixelRect(-7, -35, 5, 2, "#e4d2b5");
    drawPixelRect(2, -35, 5, 2, "#e4d2b5");
    ctx.fillStyle = "#ddd0b7";
    ctx.beginPath();
    ctx.moveTo(-6, -29);
    ctx.lineTo(6, -29);
    ctx.lineTo(2, -12);
    ctx.lineTo(-2, -12);
    ctx.fill();
  } else if (heroId === "sunshang") {
    drawPixelRect(-10, -45, 20, 9, "#4d2928");
    drawPixelRect(-12, -42, 5, 13, "#4d2928");
    drawPixelRect(7, -42, 5, 13, "#4d2928");
    drawPixelRect(-4, -50, 8, 6, "#d5536b");
    drawPixelRect(6, -49, 6, 6, "#f0b55f");
  } else if (heroId === "caocao") {
    drawPixelRect(-10, -45, 20, 8, "#25201d");
    drawPixelRect(-7, -51, 14, 7, "#68438a");
    drawPixelRect(-10, -50, 4, 5, "#b68c43");
    drawPixelRect(6, -50, 4, 5, "#b68c43");
    drawPixelRect(-6, -29, 12, 3, "#33231d");
  } else if (heroId === "xiahoudun") {
    drawPixelRect(-10, -46, 20, 9, "#385a83");
    drawPixelRect(-12, -44, 5, 11, "#7d91aa");
    drawPixelRect(7, -44, 5, 11, "#7d91aa");
    drawPixelRect(-7, -37, 7, 4, "#211c1a");
    drawPixelRect(-5, -34, 9, 2, "#211c1a");
  } else if (heroId === "zhugeliang") {
    drawPixelRect(-10, -44, 20, 7, "#30302d");
    drawPixelRect(-8, -54, 16, 11, "#d9d2c0");
    drawPixelRect(-12, -45, 24, 4, "#d9d2c0");
    drawPixelRect(-5, -29, 10, 2, "#40332c");
  } else if (heroId === "diaochan") {
    drawPixelRect(-10, -45, 20, 10, "#42223d");
    drawPixelRect(-13, -48, 7, 7, "#42223d");
    drawPixelRect(6, -48, 7, 7, "#42223d");
    drawPixelRect(-12, -50, 5, 4, "#e576ad");
    drawPixelRect(7, -50, 5, 4, "#e576ad");
    drawPixelRect(-2, -48, 4, 4, "#e5b954");
  } else if (heroId === "lubu") {
    drawPixelRect(-11, -47, 22, 11, "#85252a");
    drawPixelRect(-7, -51, 14, 6, "#d3a83e");
    ctx.strokeStyle = "#c93635";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4, -50);
    ctx.quadraticCurveTo(-16, -61, -21 - idleCycle * 2, -48);
    ctx.moveTo(4, -50);
    ctx.quadraticCurveTo(16, -61, 21 + idleCycle * 2, -48);
    ctx.stroke();
    drawPixelRect(-7, -35, 5, 2, "#251716");
    drawPixelRect(2, -35, 5, 2, "#251716");
  }
  drawPixelRect(-5, -36, 3, 2, "#211a16");
  drawPixelRect(3, -36, 3, 2, "#211a16");
}

function drawPixelLine(x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawArmorMicroDetails(armorId, idleCycle) {
  const shimmer = idleCycle > 0.25 ? 1 : 0;
  if (armorId === 'iron') {
    drawPixelRect(-11, -26, 3, 8, '#d7dedc');
    drawPixelRect(8, -26, 3, 8, '#d7dedc');
    drawPixelRect(-8, -23, 16, 2, '#73818a');
    drawPixelRect(-7, -18, 14, 2, '#9da9ad');
    drawPixelRect(-8, -14, 3, 2, '#e3e6dd');
    drawPixelRect(5, -14, 3, 2, '#e3e6dd');
    drawPixelLine(-8, -21, -5, -18, '#eff1e8');
    drawPixelLine(8, -21, 5, -18, '#eff1e8');
  } else if (armorId === 'silk') {
    drawPixelRect(-9, -24, 3, 10, '#d49abd');
    drawPixelRect(6, -24, 3, 10, '#d49abd');
    drawPixelRect(-7, -19, 14, 2, '#efc4dc');
    drawPixelRect(-8, -12, 16, 2, '#734f88');
    drawPixelLine(-7, -16, -2, -11, '#f5d6e8');
    drawPixelLine(7, -16, 2, -11, '#f5d6e8');
  } else if (armorId === 'crimson') {
    drawPixelRect(-12, -27, 4, 11, '#e0b34d');
    drawPixelRect(8, -27, 4, 11, '#e0b34d');
    drawPixelRect(-8, -25, 16, 3, '#be3b32');
    drawPixelRect(-7, -19, 14, 2, '#7c2028');
    drawPixelRect(-5, -15, 10, 2, '#e5b74b');
    drawPixelRect(-10, -25, 2, 3, shimmer ? '#fff0a2' : '#f0d478');
    drawPixelRect(8, -25, 2, 3, shimmer ? '#fff0a2' : '#f0d478');
  } else {
    drawPixelRect(-7, -24, 3, 11, '#e5d8ae');
    drawPixelRect(4, -24, 3, 11, '#e5d8ae');
    drawPixelRect(-8, -20, 16, 2, '#b18b42');
    drawPixelRect(-5, -15, 10, 2, '#d3b75e');
    drawPixelLine(-6, -27, -1, -23, '#fff3ce');
    drawPixelLine(6, -27, 1, -23, '#fff3ce');
  }
}

function drawHeroDetails(heroId, armorId, idleCycle, walkCycle) {
  const glint = idleCycle > 0.4 ? '#fff5c6' : '#eadba4';
  ctx.save();
  ctx.lineJoin = 'miter';

  if (heroId === 'liubei') {
    drawPixelRect(-8, -27, 3, 2, '#fff4da');
    drawPixelRect(5, -27, 3, 2, '#fff4da');
    drawPixelRect(-7, -24, 2, 11, '#c8b996');
    drawPixelRect(5, -24, 2, 11, '#c8b996');
    drawPixelRect(-3, -26, 6, 2, '#f8efda');
    drawPixelRect(-2, -23, 4, 3, '#4c9558');
    drawPixelRect(-7, -17, 14, 2, '#b58d3d');
    drawPixelRect(-2, -15, 4, 8, '#c6973f');
    drawPixelRect(-5, -40, 4, 1, '#4b2c20');
    drawPixelRect(2, -40, 4, 1, '#4b2c20');
    drawPixelRect(-1, -38, 2, 4, '#b67952');
    drawPixelRect(-3, -11, 2, 2, glint);
    drawPixelRect(2, -11, 2, 2, glint);
  } else if (heroId === 'guanyu') {
    drawPixelRect(-11, -28, 3, 5, '#d7b858');
    drawPixelRect(8, -28, 3, 5, '#d7b858');
    drawPixelRect(-8, -26, 16, 2, '#155339');
    for (const y of [-22, -18, -14]) {
      drawPixelRect(-7, y, 3, 2, '#74a878');
      drawPixelRect(4, y, 3, 2, '#74a878');
    }
    drawPixelRect(-2, -29, 4, 2, '#cf3b32');
    drawPixelRect(-8, -38, 5, 2, '#2e1c19');
    drawPixelRect(3, -38, 5, 2, '#2e1c19');
    drawPixelRect(-4, -27, 2, 9, '#633329');
    drawPixelRect(2, -27, 2, 9, '#633329');
    drawPixelRect(-3, -19, 2, 9, '#a05d47');
    drawPixelRect(1, -17, 2, 8, '#a05d47');
    drawPixelRect(-6, -10, 12, 2, '#241614');
  } else if (heroId === 'zhangfei') {
    drawPixelRect(-13, -27, 3, 4, '#aeb6b5');
    drawPixelRect(10, -27, 3, 4, '#aeb6b5');
    drawPixelRect(-9, -24, 18, 2, '#333a42');
    drawPixelRect(-9, -19, 18, 2, '#333a42');
    drawPixelRect(-8, -14, 16, 2, '#d04b34');
    drawPixelRect(-7, -11, 3, 2, '#efc66c');
    drawPixelRect(4, -11, 3, 2, '#efc66c');
    drawPixelRect(-8, -39, 5, 2, '#271b15');
    drawPixelRect(3, -39, 5, 2, '#271b15');
    drawPixelRect(-9, -43, 18, 1, '#e0a64c');
    drawPixelLine(-6, -31, -3, -27, '#5f4638');
    drawPixelLine(6, -31, 3, -27, '#5f4638');
    drawPixelRect(-4, -25, 2, 4, '#aeb5b6');
    drawPixelRect(2, -25, 2, 4, '#aeb5b6');
  } else if (heroId === 'zhaoyun') {
    drawPixelRect(-11, -28, 4, 3, '#f7f7ef');
    drawPixelRect(7, -28, 4, 3, '#f7f7ef');
    for (const y of [-24, -20, -16]) drawPixelRect(-7, y, 14, 1, '#9aaab2');
    drawPixelRect(-2, -25, 4, 11, '#4d84b8');
    drawPixelRect(-8, -36, 5, 1, '#56636c');
    drawPixelRect(3, -36, 5, 1, '#56636c');
    drawPixelRect(-7, -47, 3, 2, '#aab8bb');
    drawPixelRect(4, -47, 3, 2, '#aab8bb');
    drawPixelRect(-2, -58 + Math.round(idleCycle), 4, 2, glint);
    drawPixelRect(-5, -11, 3, 2, '#6ba4cc');
    drawPixelRect(2, -11, 3, 2, '#6ba4cc');
  } else if (heroId === 'huangzhong') {
    drawPixelRect(-11, -27, 3, 10, '#594027');
    drawPixelRect(8, -27, 3, 10, '#594027');
    drawPixelRect(-8, -22, 16, 2, '#d7bc60');
    drawPixelRect(-9, -17, 3, 3, '#d7bc60');
    drawPixelRect(6, -17, 3, 3, '#d7bc60');
    drawPixelRect(-8, -40, 4, 1, '#5b412a');
    drawPixelRect(4, -40, 4, 1, '#5b412a');
    drawPixelLine(-8, -43, -5, -38, '#f0ddbd');
    drawPixelLine(8, -43, 5, -38, '#f0ddbd');
    drawPixelRect(-14, -24, 3, 8, '#6b492a');
    drawPixelRect(-13, -18, 4, 2, glint);
  } else if (heroId === 'sunshang') {
    drawPixelRect(-8, -27, 3, 2, '#f6d79a');
    drawPixelRect(5, -27, 3, 2, '#f6d79a');
    drawPixelRect(-7, -22, 2, 10, '#f0b55f');
    drawPixelRect(5, -22, 2, 10, '#f0b55f');
    drawPixelRect(-9, -15, 18, 2, '#a13e5b');
    drawPixelRect(-4, -10, 3, 3, '#f8d9a1');
    drawPixelRect(1, -10, 3, 3, '#f8d9a1');
    drawPixelRect(-8, -39, 4, 2, '#2e1b1d');
    drawPixelRect(3, -39, 4, 2, '#2e1b1d');
    drawPixelRect(-12, -45, 2, 6, '#e5b050');
    drawPixelRect(10, -45, 2, 6, '#e5b050');
    drawPixelLine(-7, -19, -3, -15, '#ffdfab');
    drawPixelLine(7, -19, 3, -15, '#ffdfab');
  } else if (heroId === 'caocao') {
    drawPixelRect(-10, -28, 3, 6, '#8b78a7');
    drawPixelRect(7, -28, 3, 6, '#8b78a7');
    drawPixelRect(-7, -24, 14, 2, '#202235');
    drawPixelRect(-2, -24, 4, 10, '#8d55ad');
    drawPixelRect(-8, -18, 16, 2, '#b9914a');
    drawPixelRect(-7, -39, 4, 1, '#211a18');
    drawPixelRect(3, -39, 4, 1, '#211a18');
    drawPixelRect(-2, -49, 4, 3, '#e0c36d');
    drawPixelRect(-5, -12, 3, 2, glint);
    drawPixelRect(2, -12, 3, 2, glint);
  } else if (heroId === 'xiahoudun') {
    drawPixelRect(-13, -27, 4, 5, '#8fa7bf');
    drawPixelRect(9, -27, 4, 5, '#8fa7bf');
    drawPixelRect(-9, -21, 18, 2, '#1c3353');
    drawPixelRect(-7, -16, 14, 2, '#aab8c5');
    drawPixelRect(-8, -39, 7, 3, '#211d20');
    drawPixelRect(3, -39, 5, 1, '#211d20');
    drawPixelLine(4, -35, 8, -31, '#dc9e76');
    drawPixelRect(-9, -26, 2, 3, glint);
    drawPixelRect(8, -26, 2, 3, glint);
  } else if (heroId === 'zhugeliang') {
    drawPixelRect(-8, -27, 3, 11, '#8bb5ac');
    drawPixelRect(5, -27, 3, 11, '#8bb5ac');
    drawPixelRect(-7, -23, 14, 2, '#ece6d2');
    drawPixelRect(-2, -24, 4, 12, '#5b807a');
    drawPixelRect(-8, -16, 16, 2, '#536e69');
    drawPixelRect(-8, -39, 4, 1, '#2d2927');
    drawPixelRect(4, -39, 4, 1, '#2d2927');
    drawPixelLine(-7, -51, -3, -47, '#f6edda');
    drawPixelLine(7, -51, 3, -47, '#f6edda');
    drawPixelRect(-5, -12, 3, 2, glint);
    drawPixelRect(2, -12, 3, 2, glint);
  } else if (heroId === 'diaochan') {
    drawPixelRect(-8, -27, 3, 9, '#e36ba8');
    drawPixelRect(5, -27, 3, 9, '#e36ba8');
    drawPixelRect(-7, -20, 14, 2, '#e8bd5c');
    drawPixelRect(-4, -14, 8, 3, '#e875ac');
    drawPixelRect(-8, -39, 4, 2, '#3a1e36');
    drawPixelRect(3, -39, 4, 2, '#3a1e36');
    drawPixelRect(-12, -45, 2, 5, '#e6bd64');
    drawPixelRect(10, -45, 2, 5, '#e6bd64');
    drawPixelLine(-6, -24, -3, -19, '#f4b8d2');
    drawPixelLine(6, -24, 3, -19, '#f4b8d2');
  } else if (heroId === 'lubu') {
    drawPixelRect(-12, -28, 4, 8, '#e3b34d');
    drawPixelRect(8, -28, 4, 8, '#e3b34d');
    drawPixelRect(-8, -24, 16, 2, '#5d1c26');
    drawPixelRect(-6, -20, 12, 2, '#e3b34d');
    drawPixelRect(-9, -15, 18, 2, '#3b2025');
    drawPixelRect(-7, -39, 4, 2, '#3a1d1b');
    drawPixelRect(3, -39, 4, 2, '#3a1d1b');
    drawPixelRect(-2, -48, 4, 3, '#fff0b0');
    drawPixelLine(-9, -25, -5, -21, '#f7d45e');
    drawPixelLine(9, -25, 5, -21, '#f7d45e');
    drawPixelRect(-5, -12, 3, 2, glint);
    drawPixelRect(2, -12, 3, 2, glint);
  } else {
    drawPixelRect(-8, -23, 3, 10, '#d7cfb4');
    drawPixelRect(5, -23, 3, 10, '#d7cfb4');
    drawPixelRect(-7, -17, 14, 2, '#72674f');
    drawPixelRect(-7, -39, 4, 1, '#33291f');
    drawPixelRect(3, -39, 4, 1, '#33291f');
  }

  drawArmorMicroDetails(armorId, idleCycle);
  if (walkCycle !== 0) {
    drawPixelRect(-10, -5, 4, 2, '#221d18');
    drawPixelRect(6, -5, 4, 2, '#221d18');
  }
  ctx.restore();
}

// Compact pixel pass: extra 1-2px landmarks keep small battlefield sprites readable.
function drawCompactHeroDetails(heroId, body, accent, armorId, accessoryId, idleCycle, unitScale) {
  const compact = unitScale < 1.02;
  const glint = idleCycle > 0.35 ? '#fff4b8' : '#e6d396';
  ctx.save();
  ctx.globalAlpha = compact ? 0.96 : 0.7;
  ctx.lineJoin = 'miter';

  // Symmetrical landmarks survive a small render size better than thin outlines.
  drawPixelRect(-11, -25, 2, 2, accent);
  drawPixelRect(9, -25, 2, 2, accent);
  drawPixelRect(-2, -28, 4, 2, glint);
  drawPixelRect(-7, -13, 3, 1, '#2a211b');
  drawPixelRect(4, -13, 3, 1, '#2a211b');
  drawPixelRect(-9, -8, 3, 1, accent);
  drawPixelRect(6, -8, 3, 1, accent);

  // Sparse face landmarks remain legible at 0.9x without becoming noisy.
  drawPixelRect(-7, -33, 2, 1, '#fff0d2');
  drawPixelRect(5, -33, 2, 1, '#fff0d2');
  drawPixelRect(-1, -31, 2, 1, '#8b513d');

  if (heroId === 'liubei') {
    drawPixelRect(-6, -18, 12, 1, '#b58d3d');
    drawPixelRect(-2, -24, 4, 4, '#4c9558');
    drawPixelRect(-9, -31, 2, 3, '#f5eacb');
    drawPixelRect(7, -31, 2, 3, '#f5eacb');
  } else if (heroId === 'guanyu') {
    drawPixelRect(-8, -21, 3, 1, '#78b47f');
    drawPixelRect(5, -21, 3, 1, '#78b47f');
    drawPixelRect(-2, -26, 4, 2, '#d34537');
    drawPixelRect(-2, -15 + Math.round(idleCycle * 0.3), 4, 5, '#9d5945');
  } else if (heroId === 'zhangfei') {
    drawPixelRect(-9, -19, 18, 1, '#aeb6b5');
    drawPixelRect(-10, -25, 2, 2, '#d9dedb');
    drawPixelRect(8, -25, 2, 2, '#d9dedb');
    drawPixelRect(-5, -10, 3, 2, '#efc66c');
    drawPixelRect(2, -10, 3, 2, '#efc66c');
  } else if (heroId === 'zhaoyun') {
    drawPixelRect(-8, -22, 2, 1, '#f2f4ed');
    drawPixelRect(6, -22, 2, 1, '#f2f4ed');
    drawPixelRect(-2, -26, 4, 2, '#4d84b8');
    drawPixelRect(-1, -51 + Math.round(idleCycle), 2, 3, '#59a1d1');
  } else if (heroId === 'huangzhong') {
    drawPixelRect(-8, -21, 16, 1, '#d7bc60');
    drawPixelRect(-13, -24, 2, 7, '#6b492a');
    drawPixelRect(-12, -18, 3, 2, glint);
  } else if (heroId === 'sunshang' || heroId === 'diaochan') {
    drawPixelRect(-8, -17, 16, 1, '#e8bd5c');
    drawPixelRect(-11, -30, 2, 4, accent);
    drawPixelRect(9, -30, 2, 4, accent);
    drawPixelRect(-2, -47, 4, 2, glint);
  } else if (heroId === 'caocao') {
    drawPixelRect(-8, -19, 16, 1, '#b9914a');
    drawPixelRect(-2, -25, 4, 5, '#8d55ad');
    drawPixelRect(-10, -27, 2, 3, '#b9914a');
    drawPixelRect(8, -27, 2, 3, '#b9914a');
  } else if (heroId === 'xiahoudun') {
    drawPixelRect(-9, -20, 18, 1, '#aab8c5');
    drawPixelRect(4, -35, 5, 2, '#211d20');
    drawPixelRect(4, -33, 3, 2, '#dc9e76');
    drawPixelRect(-11, -27, 2, 2, '#d6e5ef');
  } else if (heroId === 'zhugeliang') {
    drawPixelRect(-8, -17, 16, 1, '#536e69');
    drawPixelRect(3, -24, 3, 8, '#e6e0ce');
    drawPixelRect(-2, -52, 4, 2, glint);
  } else if (heroId === 'lubu') {
    drawPixelRect(-9, -20, 18, 1, '#e3b34d');
    drawPixelRect(-12, -27, 2, 6, '#f1c85c');
    drawPixelRect(10, -27, 2, 6, '#f1c85c');
    drawPixelRect(-2, -48, 4, 3, glint);
  } else {
    // Extra heroes inherit a base silhouette, so their accent becomes a signature sash.
    drawPixelRect(-8, -17, 16, 1, accent);
    drawPixelRect(-10, -24, 2, 2, body);
    drawPixelRect(8, -24, 2, 2, accent);
  }

  // One compact marker per paper-doll slot keeps loadout identity visible in battle.
  if (armorId === 'iron' || armorId === 'silver' || armorId === 'black-iron') {
    drawPixelRect(-10, -23, 2, 4, '#d5d9d2');
    drawPixelRect(8, -23, 2, 4, '#d5d9d2');
  } else if (armorId === 'silk' || armorId === 'scholar' || armorId === 'cloud-robe') {
    drawPixelRect(-8, -12, 2, 4, '#e8b9d7');
    drawPixelRect(6, -12, 2, 4, '#e8b9d7');
  } else if (armorId === 'crimson' || armorId === 'flame' || armorId === 'vermilion-mail') {
    drawPixelRect(-10, -24, 2, 5, '#e3b34d');
    drawPixelRect(8, -24, 2, 5, '#e3b34d');
  } else if (armorId === 'mountain' || armorId === 'tiger-plate' || armorId === 'nine-dragon') {
    drawPixelRect(-12, -27, 3, 5, glint);
    drawPixelRect(9, -27, 3, 5, glint);
  } else if (armorId === 'azure-mail' || armorId === 'ghost-cloak') {
    drawPixelRect(-9, -18, 2, 5, '#80b7c9');
    drawPixelRect(7, -18, 2, 5, '#80b7c9');
  }

  if (accessoryId === 'jade' || accessoryId === 'jade-pearl' || accessoryId === 'phoenix-jade') {
    drawPixelRect(-1, -21 + Math.round(idleCycle), 2, 3, '#86dfb2');
  } else if (accessoryId === 'dragon' || accessoryId === 'tiger-seal' || accessoryId === 'strategist-seal') {
    drawPixelRect(5, -20 + Math.round(idleCycle), 3, 2, '#e4b84f');
  } else if (accessoryId === 'war' || accessoryId === 'war-drum' || accessoryId === 'tiger-charm') {
    drawPixelRect(-10, -20, 2, 3, '#d54d36');
    drawPixelRect(8, -20, 2, 3, '#d54d36');
  } else if (accessoryId === 'feather' || accessoryId === 'golden-feather') {
    drawPixelRect(3, -25 + Math.round(idleCycle), 2, 7, '#e5e0ce');
  } else if (accessoryId === 'star-map') {
    drawPixelRect(-4, -21, 2, 2, '#9fd8ef');
    drawPixelRect(1, -19, 2, 2, '#e6d396');
  } else if (accessoryId === 'imperial-edict') {
    drawPixelRect(-4, -20, 2, 5, '#f0e3bd');
  }
  ctx.restore();
}
function drawEnemyDetails(unit, idleCycle) {
  const metal = unit.type === 'boss' ? '#d7b255' : '#a8afb0';
  const shade = unit.type === 'boss' ? '#60201f' : '#3f3330';
  ctx.save();
  drawPixelRect(-9, -25, 18, 2, shade);
  drawPixelRect(-7, -20, 14, 2, metal);
  drawPixelRect(-8, -15, 16, 2, shade);
  drawPixelRect(-8, -40, 4, 2, '#2a201c');
  drawPixelRect(4, -40, 4, 2, '#2a201c');
  drawPixelRect(-2, -46 + Math.round(idleCycle), 4, 5, metal);
  drawPixelRect(-12, -26, 3, 6, metal);
  drawPixelRect(9, -26, 3, 6, metal);
  if (unit.type === 'archer') {
    drawPixelRect(-14, -23, 3, 13, '#624827');
    drawPixelLine(-13, -24, -13, -10, '#e2be69');
  } else if (unit.type === 'brute' || unit.type === 'boss') {
    drawPixelRect(-12, -33, 5, 3, metal);
    drawPixelRect(7, -33, 5, 3, metal);
    drawPixelRect(-5, -10, 10, 2, metal);
  }
  ctx.restore();
}

function drawArmorOverlay(armorId, idleCycle) {
  if (armorId === "iron") {
    drawPixelRect(-12, -27, 4, 10, "#d5d9d2");
    drawPixelRect(8, -27, 4, 10, "#d5d9d2");
    drawPixelRect(-7, -24, 14, 3, "#8c9aa0");
  } else if (armorId === "silk") {
    ctx.fillStyle = "#e0b2d2";
    ctx.beginPath();
    ctx.moveTo(-9, -9);
    ctx.lineTo(-14 - idleCycle * 2, -2);
    ctx.lineTo(0, -6);
    ctx.lineTo(14 + idleCycle * 2, -2);
    ctx.lineTo(9, -9);
    ctx.closePath();
    ctx.fill();
  } else if (armorId === "crimson") {
    drawPixelRect(-12, -27, 4, 13, "#e3b34d");
    drawPixelRect(8, -27, 4, 13, "#e3b34d");
    drawPixelRect(-7, -24, 14, 4, "#b53d32");
  }
}

function drawAccessory(heroId, accessoryId, idleCycle) {
  if (accessoryId === "jade") {
    drawPixelRect(-2, -20 + Math.round(idleCycle), 4, 4, "#86dfb2");
  } else if (accessoryId === "dragon") {
    drawPixelRect(5, -19 + Math.round(idleCycle), 5, 3, "#e4b84f");
  } else if (accessoryId === "war") {
    drawPixelRect(-10, -19, 4, 4, "#b63c30");
    drawPixelRect(6, -19, 4, 4, "#b63c30");
  } else if (accessoryId === "feather") {
    drawPixelRect(3, -24 + Math.round(idleCycle), 3, 8, "#e5e0ce");
  }
}

function drawEnemyBody(unit, body, accent, idleCycle) {
  if (unit.type === "boss") {
    const bossId = unit.enemyGeneralId;
    if (bossId === "zhangjiao" || bossId === "simayi") {
      drawPixelRect(-13, -30, 26, 24, bossId === "zhangjiao" ? "#695081" : "#36384f");
      drawPixelRect(-17, -24, 6, 18, "#9a78a4");
      drawPixelRect(11, -24, 6, 18, "#9a78a4");
      drawPixelRect(-10, -46, 20, 8, "#d8c06c");
      drawPixelRect(-8, -54, 16, 9, "#816aa2");
      drawPixelRect(14, -58, 3, 31, "#4b352b");
      drawPixelRect(10, -60, 12, 5, "#e0b84d");
    } else if (bossId === "dongzhuo" || bossId === "yuanshao") {
      drawPixelRect(-17, -31, 34, 27, "#332d2e");
      drawPixelRect(-21, -25, 7, 20, "#6e5045");
      drawPixelRect(14, -25, 7, 20, "#6e5045");
      drawPixelRect(-14, -35, 28, 8, "#a47a4d");
      drawPixelRect(-13, -50, 26, 14, "#a97e58");
      drawPixelRect(-17, -56, 34, 8, "#262126");
      drawPixelRect(-21, -51, 5, 14, "#e1bc61");
      drawPixelRect(16, -51, 5, 14, "#e1bc61");
    } else if (bossId === "lvbu") {
      drawPixelRect(-14, -31, 28, 25, "#8f252c");
      drawPixelRect(-19, -26, 7, 20, "#d1a33c");
      drawPixelRect(12, -26, 7, 20, "#d1a33c");
      drawPixelRect(-12, -48, 24, 12, "#c9825b");
      drawPixelRect(-17, -59, 9, 22, "#be3335");
      drawPixelRect(8, -59, 9, 22, "#be3335");
      drawPixelRect(-5, -62, 4, 18, "#f2c95d");
      drawPixelRect(1, -65, 4, 21, "#f2c95d");
    } else if (bossId === "menghuo" || bossId === "zhurong") {
      drawPixelRect(-16, -29, 32, 26, bossId === "menghuo" ? "#4e6b50" : "#9e473d");
      drawPixelRect(-21, -24, 7, 18, "#d49b52");
      drawPixelRect(14, -24, 7, 18, "#d49b52");
      drawPixelRect(-13, -50, 26, 18, "#6e4b34");
      drawPixelRect(-20, -57, 10, 9, "#a87c4f");
      drawPixelRect(10, -57, 10, 9, "#a87c4f");
      drawPixelRect(-16, -43, 32, 5, "#e3c068");
    }
    return;
  }
  drawPixelRect(-10, -27, 20, 19, body);
  drawPixelRect(-13, -22, 5, 16, accent);
  drawPixelRect(8, -22, 5, 16, accent);
  drawPixelRect(-8, -40, 16, 14, "#b97c58");
  drawPixelRect(-10, -43, 20, 7, accent);
  drawPixelRect(-6, -46, 12, 5, accent);
  drawPixelRect(-2 + Math.round(idleCycle), -51, 4, 8, accent);
  drawPixelRect(-5, -36, 3, 2, "#211a16");
  drawPixelRect(3, -36, 3, 2, "#211a16");
  if (unit.type === "brute" || unit.type === "boss") {
    drawPixelRect(-12, -48, 5, 11, "#d8bd72");
    drawPixelRect(7, -48, 5, 11, "#d8bd72");
  }
}

function drawHealthBar(unit, x, visualY) {
  const isBoss = unit.type === "boss";
  const isAlly = unit.team === "ally";
  if (!isAlly && !isBoss && !(unit.hitFlash > 0 || (unit.hp < unit.maxHp * 0.98))) return;
  const barW = isBoss ? 46 : isAlly ? 34 : 22;
  const barH = isBoss ? 4 : 3;
  // Positioned cleanly at the unit's base / feet so the head and face are completely unobstructed
  const y = Math.round(visualY + (isBoss ? 8 : 4));
  const ratio = clamp(unit.hp / Math.max(1, unit.maxHp), 0, 1);
  const lagRatio = clamp((Number.isFinite(unit.hpLag) ? unit.hpLag : unit.hp) / Math.max(1, unit.maxHp), 0, 1);
  ctx.save();
  ctx.fillStyle = isBoss ? "#4d0e0a" : isAlly ? "#1f1c16" : "#2f1414";
  ctx.fillRect(x - barW / 2 - 1, y - 1, barW + 2, barH + 2);
  ctx.fillStyle = "#181510";
  ctx.fillRect(x - barW / 2, y, barW, barH);
  ctx.fillStyle = "#733324";
  ctx.fillRect(x - barW / 2, y, barW * lagRatio, barH);
  ctx.fillStyle = isAlly ? "#4cb858" : isBoss ? "#dc3828" : "#c64235";
  ctx.fillRect(x - barW / 2, y, barW * ratio, barH);
  ctx.fillStyle = "#ffffff44";
  ctx.fillRect(x - barW / 2, y, barW * ratio, 1);
  ctx.restore();
}

function drawUnitNameTag(unit, x, visualY) {
  if (!unit || unit.dead) return;
  ctx.save();
  if (unit.type === "boss") {
    // Boss name displayed neatly under the feet / base
    const y = Math.round(visualY + 20);
    const general = ENEMY_GENERALS.find(g => g.id === unit.enemyGeneralId);
    const name = general?.name || "敵首領";
    ctx.font = "bold 9px 'DFKai-SB', 'KaiTi', sans-serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#380907";
    ctx.lineWidth = 2.5;
    ctx.strokeText("★ " + name + " ★", x, y);
    ctx.fillStyle = "#ff5544";
    ctx.fillText("★ " + name + " ★", x, y);
  } else if (unit.team === "ally" && unit.hero) {
    const y = Math.round(visualY + 16);
    ctx.font = "bold 8px 'DFKai-SB', 'KaiTi', sans-serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#1a1612";
    ctx.lineWidth = 2;
    ctx.strokeText(unit.hero.name, x, y);
    ctx.fillStyle = unit.hero.rarity >= 5 ? "#ffe88a" : "#f0ede6";
    ctx.fillText(unit.hero.name, x, y);
  }
  ctx.restore();
}

function drawSkillEnergyBar(unit, x, visualY) {
  if (unit.team !== "ally" || !unit.hero) return;
  const barW = 34;
  const barH = 2.5;
  // Placed right below the health bar at feet
  const y = Math.round(visualY + 8);
  const ready = unit.attackCount >= 5 && unit.skillCooldown <= 0 && !hasStatus(unit, "silence");
  const charge = ready ? 1 : clamp(unit.attackCount / 5, 0, 1);
  const pulse = ready ? 0.55 + Math.sin(runtime.elapsed * 14) * 0.45 : 1;
  ctx.save();
  ctx.fillStyle = "#0e0f0c";
  ctx.fillRect(x - barW / 2 - 1, y - 1, barW + 2, barH + 2);
  ctx.fillStyle = "#1a1812";
  ctx.fillRect(x - barW / 2, y, barW, barH);
  ctx.fillStyle = ready ? "#f0c653" : "#8a7340";
  ctx.globalAlpha = pulse;
  ctx.fillRect(x - barW / 2, y, barW * charge, barH);
  if (ready) {
    ctx.fillStyle = "#fff6c8";
    ctx.fillRect(x - barW / 2, y, barW * charge, 1);
  }
  ctx.restore();
}

function drawStatusBadges(unit, x, y) {
  const statuses = (unit.statuses || []).filter((status) => status.duration > 0);
  if (!statuses.length) return;
  const colors = { burn: "#ef7a40", slow: "#81c6d6", stun: "#f5d05a", mark: "#e875ac", fragile: "#d29f3a", guard: "#9fc6e8", haste: "#7be0a5", silence: "#9d8eaa", ward: "#d7b84f" };
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "700 7px ui-monospace, Consolas, monospace";
  statuses.slice(0, 3).forEach((status, index) => {
    const px = x - 10 + index * 10;
    ctx.fillStyle = colors[status.type] || "#ddd";
    ctx.fillRect(px - 3, y - 44, 6, 6);
    ctx.fillStyle = "#fff";
    ctx.fillText(status.type[0].toUpperCase(), px, y - 39);
  });
  ctx.restore();
}

function characterAnimationState(unit) {
  if (unit.dead) return "death";
  if (unit.hitFlash > 0) return "hit";
  if (unit.action?.skill) return "skill";
  if (unit.action) return "attack";
  return unit.moving ? "walk" : "idle";
}

// Combat-body WebP files are the identity layer. This motion pass gives every
// character a readable loop even when a state-specific sprite sheet is not
// needed: breathing, gait, recoil, skill focus and collapse all share the same
// timing contract as the directional attack sheets.
function applyCombatBodyMotion(unit, state, walkCycle, idleCycle, deathProgress, options = {}) {
  const outerDeath = Boolean(options.outerDeath);
  const outerAction = Boolean(options.outerAction);
  if ((outerDeath && state === "death") || (outerAction && (state === "attack" || state === "skill"))) {
    if (state === "idle" || state === "walk") {
      /* keep gait even when an outer transform owns attack/death */
    } else {
      return;
    }
  }
  if (state === "idle") {
    const breathe = idleCycle * 0.5;
    ctx.translate(0, breathe * 0.6);
    ctx.scale(1 + breathe * 0.014, 1 - breathe * 0.022);
  } else if (state === "walk") {
    // Pure vertical step cadence with zero horizontal sway or tilt
    const lift = Math.abs(walkCycle);
    ctx.translate(0, -lift * 0.85);
    ctx.scale(1, 1 - lift * 0.035);
  } else if (state === "hit") {
    const recoil = clamp((Number(unit.hitFlash) || 0) / 0.2, 0, 1);
    ctx.translate(-Math.cos(unit.hitAngle || 0) * recoil * 1.8, -recoil * 0.8);
    ctx.rotate(Math.sin(unit.hitAngle || 0) * recoil * 0.06);
    ctx.scale(1 - recoil * 0.07, 1 + recoil * 0.085);
  } else if (state === "skill") {
    const pose = attackPoseProgress(unit);
    const focus = Math.sin((unit.action?.elapsed || 0) * 18) * pose;
    ctx.translate(0, -pose * 0.8);
    ctx.scale(1 + pose * 0.035 + focus * 0.006, 1 - pose * 0.045);
  } else if (state === "death") {
    ctx.translate(0, deathProgress * 1.4);
    ctx.scale(1 + deathProgress * 0.04, 1 - deathProgress * 0.12);
  }
}

function drawHeroDetailOverlay(unit, walkCycle, idleCycle) {
  const heroId = unit.hero?.id || "liubei";
  const accent = unit.hero?.accent || "#d29f3a";
  const ready = (unit.attackCount || 0) >= 5 && (unit.skillCooldown || 0) <= 0;

  ctx.save();
  
  // Dynamic flowing cape behind hero body
  const capeSway = Math.sin(runtime.elapsed * 4.5 + unit.x * 0.1) * (unit.moving ? 3.5 : 1.2) + (unit.motionX ? -unit.motionX * 0.35 : 0);
  const capeColor = heroId === "guanyu" ? "#164d30" : heroId === "caocao" ? "#412656" : heroId === "zhaoyun" ? "#264870" : heroId === "lubu" ? "#7d161d" : accent;
  ctx.save();
  ctx.fillStyle = capeColor;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(-10, -28);
  ctx.quadraticCurveTo(-14 + capeSway, -18, -12 + capeSway * 1.2, -8);
  ctx.lineTo(-6, -14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Skill Ready Aura: Tactical Rotating Bagua / Formation Battle Halo at unit feet + ascending golden motes
  if (ready) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const auraPulse = (Math.sin(runtime.elapsed * 8 + unit.x * 0.1) + 1) * 0.5;
    const rot = runtime.elapsed * 2.2;
    
    // Ground Battle Ring
    ctx.globalAlpha = 0.45 + auraPulse * 0.35;
    ctx.strokeStyle = "#f3c64c";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 21 + auraPulse * 2, 7 + auraPulse, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary inner ring
    ctx.globalAlpha = 0.25 + auraPulse * 0.25;
    ctx.strokeStyle = "#ffe48a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14 + auraPulse, 4.5 + auraPulse * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Rotating Formation Sparks
    for (let i = 0; i < 4; i += 1) {
      const ang = rot + (i * Math.PI) / 2;
      const sx = Math.cos(ang) * (20 + auraPulse * 2);
      const sy = Math.sin(ang) * 7;
      ctx.fillStyle = "#fff5ab";
      ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
    }
    
    // Ascending golden qi motes around weapon / body
    const moteY = -8 - ((runtime.elapsed * 32 + (unit.x % 17) * 4) % 34);
    ctx.fillStyle = "#ffd55e";
    ctx.fillRect(-6 + Math.sin(runtime.elapsed * 6) * 4, moteY, 2, 2);
    ctx.fillRect(7 - Math.cos(runtime.elapsed * 6) * 4, moteY + 8, 2, 2);
    
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }
  ctx.restore();
}

function drawEnemyDetailOverlay(unit, walkCycle, idleCycle) {
  const isBoss = unit.type === "boss";

  ctx.save();
  if (isBoss) {
    // Boss intimidating presence aura & ornate crest
    ctx.globalCompositeOperation = "screen";
    const bossPulse = (Math.sin(runtime.elapsed * 5 + unit.x * 0.08) + 1) * 0.5;
    ctx.globalAlpha = 0.3 + bossPulse * 0.3;
    ctx.fillStyle = unit.accent || "#e03828";
    ctx.beginPath();
    ctx.ellipse(0, 0, 32 + bossPulse * 4, 11 + bossPulse * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
}

function drawCombatBodySprite(unit, image, state, walkCycle, idleCycle, deathProgress, motionOptions) {
  if (!image) return;
  ctx.save();
  applyCombatBodyMotion(unit, state, walkCycle, idleCycle, deathProgress, motionOptions);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, -16, -38, 32, 38);
  if (unit.team === "ally") {
    drawHeroDetailOverlay(unit, walkCycle, idleCycle);
  } else {
    drawEnemyDetailOverlay(unit, walkCycle, idleCycle);
  }
  ctx.restore();
}

function drawProceduralCombatBody(unit, visualId, accent, state, walkCycle, idleCycle, deathProgress, motionOptions) {
  ctx.save();
  applyCombatBodyMotion(unit, state, walkCycle, idleCycle, deathProgress, motionOptions);
  if (unit.team === "ally") {
    const body = unit.hero?.color || "#6d765d";
    drawHeroBody(visualId || unit.hero?.id || "liubei", body, accent || "#b54832");
    drawHeroHead(visualId || unit.hero?.id || "liubei", idleCycle);
  } else {
    drawEnemyBody(unit, unit.color || "#8f3630", accent || unit.color || "#8f3630", idleCycle);
  }
  ctx.restore();
}

function drawUnit(unit) {
  if (unit.dead && unit.deathTime <= 0) return;
  if (!Number.isFinite(unit.x) || !Number.isFinite(unit.y)) {
    unit.x = clamp(Number(unit.x) || 195, 35, 350);
    unit.y = clamp(Number(unit.y) || (unit.team === "ally" ? 420 : 200), 112, 575);
  }
  if (!Number.isFinite(unit.motionX)) unit.motionX = 0;
  if (!Number.isFinite(unit.motionY)) unit.motionY = 0;
  if (!Number.isFinite(unit.kickX)) unit.kickX = 0;
  if (!Number.isFinite(unit.kickY)) unit.kickY = 0;
  if (!Number.isFinite(unit.scale) || unit.scale <= 0) unit.scale = unit.team === "ally" ? 1.22 : 1;
  if (!Number.isFinite(unit.facing) || unit.facing === 0) unit.facing = unit.team === "ally" ? -1 : 1;
  const walkCycle = Math.sin(runtime.elapsed * 15 + unit.x * 0.08);
  const idleCycle = Math.sin(runtime.elapsed * 3.2 + unit.x * 0.03);
  const animationState = characterAnimationState(unit);
  const heroId = unit.team === "ally" ? unit.hero.id : "enemy";
  const visualId = unit.team === "ally" ? (unit.hero.visual || heroId) : "enemy";
  const loadout = unit.team === "ally" ? heroLoadout(heroId) : null;
  const moveBounce = visualId === "zhangfei" ? 2.9 : visualId === "zhaoyun" ? 1.35 : 2;
  const idleBounce = visualId === "guanyu" ? 0.35 : visualId === "zhangfei" ? 0.55 : 0.8;
  const bob = unit.moving ? -Math.abs(walkCycle) * moveBounce : idleCycle * idleBounce;
  const renderX = unit.x + unit.motionX + unit.kickX;
  const renderY = unit.y + unit.motionY + unit.kickY;
  const renderDelta = Number.isFinite(runtime.renderDelta) ? Math.max(0.001, runtime.renderDelta) : 1 / 60;
  const visualEase = 1 - Math.exp(-renderDelta * (unit.moving ? 18 : 22));
  if (!Number.isFinite(unit.renderX)) unit.renderX = renderX;
  if (!Number.isFinite(unit.renderY)) unit.renderY = renderY;
  unit.renderX += (renderX - unit.renderX) * visualEase;
  unit.renderY += (renderY - unit.renderY) * visualEase;
  const deathMax = unit.type === "boss" ? 0.9 : 0.58;
  const deathProgress = unit.dead ? 1 - unit.deathTime / deathMax : 0;
  ctx.save();
  const spriteX = unit.scale < 1 ? Math.round(unit.renderX * 2) / 2 : unit.renderX;
  const spriteY = unit.scale < 1 ? Math.round((unit.renderY + bob) * 2) / 2 : unit.renderY + bob;
  ctx.translate(spriteX, spriteY);

  ctx.globalAlpha = unit.dead ? 0.2 * (1 - deathProgress) : 0.38;
  ctx.fillStyle = unit.type === "boss" ? "#280706" : unit.team === "enemy" ? "#200e0e" : "#10120e";
  ctx.beginPath();
  ctx.ellipse(0, 2, (unit.type === "boss" ? 30 : 20) * unit.scale * (1 + deathProgress * 0.35), (unit.type === "boss" ? 10 : 6.5) * unit.scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Enemy Tactical Ground Indicator
  if (!unit.dead && unit.team === "enemy") {
    ctx.save();
    ctx.globalAlpha = unit.type === "boss" ? 0.5 : 0.25;
    ctx.strokeStyle = unit.type === "boss" ? "#d83828" : "#ba3d30";
    ctx.lineWidth = unit.type === "boss" ? 2 : 1;
    ctx.beginPath();
    ctx.ellipse(0, 2, (unit.type === "boss" ? 26 : 17) * unit.scale, (unit.type === "boss" ? 8.5 : 5.5) * unit.scale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 5-Star Hero Golden Ground Halo
  if (unit.team === "ally" && !unit.dead && (unit.hero?.rarity >= 5)) {
    ctx.save();
    const heroHaloPulse = (Math.sin(runtime.elapsed * 4 + unit.x * 0.05) + 1) * 0.5;
    ctx.globalAlpha = 0.22 + heroHaloPulse * 0.18;
    ctx.strokeStyle = "#e8b84d";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 2, (18 + heroHaloPulse * 2) * unit.scale, (6 + heroHaloPulse) * unit.scale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.globalAlpha = unit.dead ? clamp(unit.deathTime / deathMax * 1.35, 0, 1) : 1;

  if (unit.dead) {
    ctx.translate(0, deathProgress * 10);
    ctx.rotate(unit.deathSpin * deathProgress * 1.18);
  }
  const deathSquash = unit.dead ? 1 - deathProgress * 0.32 : 1;
  ctx.scale(unit.scale * unit.facing * (1 + unit.squashX), unit.scale * deathSquash * (1 + unit.squashY));
  const accent = unit.team === "ally" ? unit.hero.accent : unit.accent;
  const spritePromise = unit.team === "ally" ? ASSETS.get(unit.hero.combatSprite) : null;
  const enemyBodyPath = unit.team === "enemy" ? enemyCombatBodyPath(unit) : null;
  const enemyBodySprite = unit.team === "enemy"
    ? ASSETS.get(enemyBodyPath) || ASSETS.get(LOCKED_COMBAT_BODY_PATH)
    : null;
  const attackSpriteId = unit.team === "ally" ? heroId : unit.type === "boss" ? "boss-" + (BOSS_SPRITE_BY_GENERAL[unit.enemyGeneralId] || "zhangjiao") : (unit.type || "bandit");
  const attackSpritePath = "assets/characters/attack-" + attackSpriteId + "-v1.webp";
  const attackSprite = ASSETS.get(attackSpritePath);
  const bossSpriteId = unit.type === "boss" ? BOSS_SPRITE_BY_GENERAL[unit.enemyGeneralId] : null;
  const bossSprite = bossSpriteId ? ASSETS.get("assets/characters/boss-" + bossSpriteId + "-v1.webp") : null;
  const spriteImage = spritePromise || enemyBodySprite || bossSprite;
  const useAttackSprite = ATTACK_SPRITES_APPROVED && Boolean(unit.action && attackSprite);
  const actionTransform = Boolean(unit.action && !useAttackSprite);
  const motionOptions = { outerDeath: unit.dead, outerAction: actionTransform };
  if (actionTransform) {
    ctx.save();
    const pose = attackPoseProgress(unit);
    const angle = directionLocalAngle(unit, true);
    const frameOffset = unit.action.phase === "anticipation" ? -pose * 3.5 : pose * (unit.action.ranged ? 2.5 : 5.5);
    const frameJolt = unit.attackFrame === 2 ? -1.5 : unit.attackFrame === 3 ? 0.8 : 0;
    ctx.translate(Math.cos(angle) * frameOffset, Math.sin(angle) * frameOffset + frameJolt);
    ctx.rotate(-Math.sin(angle) * 0.08 * pose);
    ctx.scale(1 + pose * 0.035, 1 - pose * 0.045);
  }
  const isCavalry = unit.role === "騎兵" || unit.type === "boss";
  const resolvedMount = loadout?.mount || (isCavalry ? "grey" : (unit.team === "ally" ? "grey" : "foot"));
  const isMounted = resolvedMount !== "foot";
  const riderLift = isMounted && !(unit.type === "boss" && bossSprite) ? -9 : 0;

  if (!(unit.type === "boss" && bossSprite)) drawMountOrFeet(unit, visualId, walkCycle, resolvedMount);

  ctx.save();
  ctx.translate(0, riderLift);

  if (useAttackSprite) {
    const column = clamp(Number(unit.action?.direction ?? unit.direction) || 0, 0, 7);
    const row = clamp(Number(unit.attackFrame) || 0, 0, 4);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(attackSprite, column * 64, row * 64, 64, 64, -32, -64, 64, 64);
  } else if (unit.team === "ally") {
    if (spritePromise) drawCombatBodySprite(unit, spritePromise, animationState, walkCycle, idleCycle, deathProgress, motionOptions);
    else drawProceduralCombatBody(unit, visualId, accent, animationState, walkCycle, idleCycle, deathProgress, motionOptions);
  } else if (bossSprite) {
    ctx.save();
    applyCombatBodyMotion(unit, animationState, walkCycle, idleCycle, deathProgress, motionOptions);
    ctx.drawImage(bossSprite, -32, -70, 64, 72);
    drawEnemyDetailOverlay(unit, walkCycle, idleCycle);
    ctx.restore();
  } else if (enemyBodySprite) {
    drawCombatBodySprite(unit, enemyBodySprite, animationState, walkCycle, idleCycle, deathProgress, motionOptions);
  } else {
    drawProceduralCombatBody(unit, visualId, accent, animationState, walkCycle, idleCycle, deathProgress, motionOptions);
  }
  drawAttackPose(unit, accent, useAttackSprite || Boolean(spriteImage));
  if (unit.hitFlash > 0) {
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = Math.min(0.82, unit.hitFlash * 5);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(0, unit.type === "boss" ? -34 : -22, unit.type === "boss" ? 24 : 12, unit.type === "boss" ? 32 : 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  if (!useAttackSprite && !(unit.type === "boss" && bossSprite)) drawWeapon(unit);
  ctx.restore();
  if (actionTransform) ctx.restore();
  // Restore the unit-local translate/scale before drawing world-space bars.
  // Without this, transforms accumulate across units and push later sprites
  // completely outside the 390x720 Canvas.
  ctx.restore();
  if (!unit.dead) {
    const barY = unit.renderY + bob + unit.kickY;
    drawUnitNameTag(unit, unit.renderX + unit.kickX, barY);
    drawHealthBar(unit, unit.renderX + unit.kickX, barY);
    drawSkillEnergyBar(unit, unit.renderX + unit.kickX, barY);
    drawStatusBadges(unit, unit.renderX + unit.kickX, barY);
  }
}


function preloadConfiguredAssets() {
  // Preload only the immediate starting combat assets; remaining 46 heroes and late stages lazy-load via ASSETS.get()
  const attackIds = ["liubei", "guanyu", "zhangfei", "zhaoyun", "bandit", "boss-zhangjiao"];
  const attackPaths = attackIds.map((id) => "assets/characters/attack-" + id + "-v1.webp");
  const startPaths = [
    "assets/characters/portrait-liubei-v1.webp",
    "assets/characters/portrait-guanyu-v1.webp",
    "assets/characters/portrait-zhangfei-v1.webp",
    "assets/characters/portrait-zhaoyun-v1.webp",
    "assets/characters/combat-body-liubei-v1.webp",
    "assets/characters/combat-body-guanyu-v1.webp",
    "assets/characters/combat-body-zhangfei-v1.webp",
    "assets/characters/combat-body-zhaoyun-v1.webp",
    "assets/characters/combat-body-locked-v1.webp",
    "assets/backgrounds/terrain-tile-0-v1.webp",
    ...attackPaths
  ];
  ASSETS.preload(startPaths);
}
preloadConfiguredAssets();

function drawEffects({ groundOnly = false } = {}) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const effect of runtime.effects) {
    const isGroundEffect = effect.type === "dust";
    if (groundOnly !== isGroundEffect) continue;
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = Math.sin(progress * Math.PI);
    const assetIndex = VFX_ASSET_BY_TYPE[effect.type];
    const vfxImage = assetIndex === undefined ? null : ASSETS.get("assets/vfx/vfx-" + assetIndex + "-v1.webp");
    if (vfxImage) {
      ctx.save();
      ctx.globalAlpha = alpha * (effect.type === "status" ? 0.72 : 0.9);
      ctx.translate(effect.x, effect.y);
      ctx.rotate(effect.angle || 0);
      const vfxScale = Math.max(0.45, effect.scale || 1);
      ctx.drawImage(vfxImage, -32 * vfxScale, -32 * vfxScale, 64 * vfxScale, 64 * vfxScale);
      ctx.restore();
      continue;
    }
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = effect.color;
    ctx.fillStyle = effect.color;
    ctx.lineWidth = Math.max(2, 6 * (1 - progress));
    if (effect.type === "afterimage") {
      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.scale(effect.scale * effect.facing, effect.scale);
      ctx.globalAlpha = alpha * 0.28;
      ctx.fillStyle = effect.color;
      ctx.fillRect(-10, -27, 20, 20);
      ctx.fillRect(-8, -41, 16, 14);
      ctx.fillRect(-13, -22, 5, 15);
      ctx.fillRect(8, -22, 5, 15);
      ctx.restore();
    } else if (effect.type === "dust") {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha * 0.48;
      ctx.fillStyle = effect.color;
      for (let i = 0; i < 5; i += 1) {
        const offset = (i - 2) * effect.radius * 0.28;
        const rise = Math.abs(i - 2) * 2 + progress * 5;
        const size = Math.max(2, effect.radius * (0.22 - progress * 0.11));
        ctx.fillRect(effect.x + offset - size / 2, effect.y - rise - size / 2, size, size);
      }
      ctx.restore();
    } else if (effect.type === "impact") {
      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.rotate(effect.angle);
      for (let i = 0; i < 6; i += 1) {
        ctx.rotate(Math.PI / 3);
        ctx.fillStyle = effect.color;
        ctx.fillRect(effect.radius * progress * 0.25, -2, effect.radius * (0.35 + progress * 0.4), Math.max(1, 4 * (1 - progress)));
        ctx.fillStyle = "#fff";
        ctx.fillRect(effect.radius * progress * 0.35, -1, effect.radius * (0.15 + progress * 0.2), Math.max(1, 2 * (1 - progress)));
      }
      ctx.restore();
    } else if (effect.type === "shockwave") {
      ctx.beginPath();
      ctx.ellipse(effect.x, effect.y, effect.radius * progress, effect.radius * progress * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.type === "charge") {
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (1 - progress * 0.45), 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 4; i += 1) {
        const angle = progress * 5 + i * Math.PI / 2;
        const orbit = effect.radius * (0.7 - progress * 0.35);
        ctx.fillRect(effect.x + Math.cos(angle) * orbit - 2, effect.y + Math.sin(angle) * orbit - 2, 4, 4);
      }
    } else if (effect.type === "slash") {
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (0.45 + progress * 0.7), effect.angle - 1.4, effect.angle + 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (0.28 + progress * 0.45), effect.angle - 1.2, effect.angle + 1.2);
      ctx.stroke();
      ctx.strokeStyle = "#fffde8";
      ctx.lineWidth = Math.max(1, 2.5 * (1 - progress));
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (0.42 + progress * 0.65), effect.angle - 1.0, effect.angle + 1.0);
      ctx.stroke();
    } else if (effect.type === "ring") {
      ctx.beginPath();
      ctx.ellipse(effect.x, effect.y, effect.radius * progress, effect.radius * progress * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.type === "bolt") {
      ctx.beginPath();
      ctx.moveTo(effect.x - 10, effect.y - 75 + progress * 40);
      ctx.lineTo(effect.x + 6, effect.y - 49);
      ctx.lineTo(effect.x - 4, effect.y - 27);
      ctx.lineTo(effect.x + 8, effect.y - 2);
      ctx.stroke();
    } else if (effect.type === "status") {
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (.55 + progress * .45), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(effect.x - 2, effect.y - 2, 4, 4);
    } else if (effect.type === "combo") {
      ctx.save();
      const bounce = Math.sin(progress * Math.PI) * 6;
      ctx.translate(effect.x, effect.y - progress * 24 - bounce);
      ctx.font = "900 " + Math.round(18 + progress * 6) + "px ui-monospace, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.strokeStyle = "#24160c";
      ctx.lineWidth = 4;
      ctx.strokeText("COMBO", 0, 0);
      ctx.fillStyle = effect.color || "#f1c552";
      ctx.fillText("COMBO", 0, 0);
      ctx.restore();
    } else if (effect.type === "rally") {
      for (let i = 0; i < 5; i += 1) {
        const angle = progress * 4 + i * Math.PI * 2 / 5;
        const radius = effect.radius * (.35 + progress * .45);
        ctx.fillRect(effect.x + Math.cos(angle) * radius - 3, effect.y + Math.sin(angle) * radius - 3, 6, 6);
      }
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * progress, 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.type === "guard") {
      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.rotate(progress * .8);
      ctx.strokeRect(-effect.radius * .55, -effect.radius * .55, effect.radius * 1.1, effect.radius * 1.1);
      ctx.strokeRect(-effect.radius * .38, -effect.radius * .38, effect.radius * .76, effect.radius * .76);
      ctx.restore();
    } else if (effect.type === "stun") {
      for (let i = 0; i < 3; i += 1) {
        const angle = i * Math.PI * 2 / 3 + progress * 4;
        ctx.fillRect(effect.x + Math.cos(angle) * effect.radius * .55 - 3, effect.y + Math.sin(angle) * effect.radius * .22 - 3, 6, 6);
      }
    } else if (effect.type === "volley") {
      for (let i = 0; i < 7; i += 1) {
        const x = effect.x - effect.radius * .65 + i * effect.radius * .2;
        const y = effect.y - progress * effect.radius * .35 + Math.sin(i * 2) * 6;
        ctx.fillRect(x, y, 3, 13);
      }
    } else if (effect.type === "rune") {
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (.35 + progress * .65), 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i += 1) {
        const angle = i * Math.PI / 4;
        ctx.fillRect(effect.x + Math.cos(angle) * effect.radius * progress - 2, effect.y + Math.sin(angle) * effect.radius * progress - 2, 4, 4);
      }
    } else if (effect.type === "petal") {
      ctx.save();
      ctx.translate(effect.x, effect.y - progress * 12);
      ctx.rotate(effect.angle + progress * 2);
      for (let i = 0; i < 5; i += 1) {
        ctx.rotate(Math.PI * 2 / 5);
        ctx.fillRect(effect.radius * progress * .25, -3, 9, 5);
      }
      ctx.restore();
    } else if (effect.type === "soul") {
      ctx.save();
      ctx.translate(effect.x, effect.y - progress * 34);
      ctx.globalAlpha = alpha * .75;
      ctx.fillRect(-4, -8, 8, 13);
      ctx.fillRect(-7, -3, 14, 4);
      ctx.fillRect(-2, -13, 4, 5);
      ctx.restore();
    } else if (effect.type === "meteor") {
      ctx.save();
      ctx.translate(effect.x + progress * 22, effect.y - effect.radius * (.8 - progress * .7));
      ctx.rotate(-.68);
      ctx.fillRect(-8, -8, 16, 16);
      ctx.fillRect(-22, 0, 14, 4);
      ctx.fillRect(-35, 7, 11, 3);
      ctx.restore();
      ctx.beginPath();
      ctx.ellipse(effect.x, effect.y, effect.radius * progress, effect.radius * progress * .35, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.type === "clash") {
      ctx.save();
      ctx.translate(effect.x, effect.y);
      for (let i = 0; i < 6; i += 1) {
        const sparkAngle = (i * Math.PI / 3) + (effect.angle || 0);
        const sparkDist = effect.radius * progress;
        ctx.fillStyle = i % 2 === 0 ? "#ffffff" : (effect.color || "#ffe57f");
        ctx.fillRect(Math.cos(sparkAngle) * sparkDist - 1.5, Math.sin(sparkAngle) * sparkDist - 1.5, 3, 3);
      }
      ctx.restore();
    } else {
      const particles = effect.type === "burst" ? 12 : 6;
      for (let i = 0; i < particles; i += 1) {
        const angle = (Math.PI * 2 * i) / particles + effect.angle;
        const distance = effect.radius * progress;
        const size = Math.max(1, 5 * (1 - progress));
        ctx.fillRect(effect.x + Math.cos(angle) * distance - size / 2, effect.y + Math.sin(angle) * distance - size / 2, size, size);
      }
    }
  }
  if (!groundOnly) for (const projectile of runtime.projectiles) {
    const dx = projectile.target && !projectile.target.dead ? projectile.target.x - projectile.x : 1;
    const dy = projectile.target && !projectile.target.dead ? projectile.target.y - projectile.y : 0;
    const angle = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.95;

    // Wind trail behind projectile
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-24, -1);
    ctx.lineTo(-8, -1);
    ctx.moveTo(-20, 1);
    ctx.lineTo(-6, 1);
    ctx.stroke();

    // Arrow / Projectile shaft
    ctx.strokeStyle = projectile.color || "#ffd868";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(4, 0);
    ctx.stroke();

    // Arrow head (pointy tip)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(1, -3);
    ctx.lineTo(2, 0);
    ctx.lineTo(1, 3);
    ctx.closePath();
    ctx.fill();

    // Arrow fletching
    ctx.fillStyle = projectile.color || "#ffd868";
    ctx.fillRect(-16, -2.5, 4, 1.5);
    ctx.fillRect(-16, 1, 4, 1.5);
    ctx.restore();
  }
  ctx.restore();
  if (groundOnly) return;

  for (const number of runtime.numbers) {
    ctx.globalAlpha = clamp(number.life / number.maxLife * 1.5, 0, 1);
    const numberProgress = 1 - number.life / number.maxLife;
    const popScale = numberProgress < 0.2
      ? 0.72 + numberProgress / 0.2 * 0.28
      : 1.04 - (numberProgress - 0.2) * 0.18;
    const scale = popScale * (number.pop || 1);
    ctx.save();
    ctx.translate(number.x, number.y - numberProgress * 18);
    if (number.angle) ctx.rotate(number.angle * (1 - numberProgress));
    ctx.font = (number.size >= 24 ? "800 " : "700 ") + Math.round(number.size * scale) + "px ui-monospace, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.lineWidth = number.size >= 24 ? 4 : 2;
    ctx.strokeStyle = number.size >= 24 ? "#3a170f" : "#25140d";
    ctx.strokeText(number.value, 0, 0);
    ctx.fillStyle = number.color;
    ctx.fillText(number.value, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawResourceDrops() {
  if (!runtime.drops.length) return;
  const styles = {
    gold: { main: "#dfaa38", light: "#ffe899", dark: "#6e421c" },
    food: { main: "#7ea352", light: "#d6ebb0", dark: "#3a5632" },
    jade: { main: "#4ea39e", light: "#c2fff5", dark: "#204e52" },
    shards: { main: "#9f6ebd", light: "#e8c4ff", dark: "#4a2463" }
  };
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "700 11px ui-monospace, Consolas, monospace";
  for (const drop of runtime.drops) {
    const style = styles[drop.kind] || styles.gold;
    const alpha = clamp(drop.life / 0.4, 0, 1);
    const x = Math.round(drop.x);
    const y = Math.round(drop.y);
    ctx.globalAlpha = alpha;

    // Small ground shadow
    ctx.fillStyle = "#100e0b88";
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Compact neat pixel icon (8x8)
    ctx.fillStyle = style.dark;
    ctx.fillRect(x - 4, y - 4, 8, 8);
    ctx.fillStyle = style.main;
    ctx.fillRect(x - 3, y - 3, 6, 6);
    ctx.fillStyle = style.light;
    ctx.fillRect(x - 2, y - 2, 2, 2);

    // Clean gain text
    ctx.strokeStyle = "#1b140d";
    ctx.lineWidth = 2;
    ctx.strokeText("+" + formatNumber(drop.amount), x, y - 7);
    ctx.fillStyle = style.light;
    ctx.fillText("+" + formatNumber(drop.amount), x, y - 7);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawBattleTitle() {
  const chapter = chapterForStage();
  const stageConfig = stageDefinition(activeStageNumber());
  const stageName = stageConfig?.name || chapter.stage;
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.translate(195, 260);
  ctx.rotate(-0.1);
  ctx.font = stageName.length > 8 ? "bold 43px DFKai-SB, KaiTi, serif" : "bold 54px DFKai-SB, KaiTi, serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#151810";
  ctx.fillText(stageName, 0, 0);
  ctx.restore();
}

function drawWaveTransitionOverlay() {
  const transition = runtime.waveTransition;
  if (!transition) return;
  const progress = 1 - transition.life / transition.maxLife;
  const alpha = Math.sin(Math.min(progress * 2.2, 1) * Math.PI);
  const bounce = progress < 0.35 ? 1 + Math.sin(progress / 0.35 * Math.PI) * 0.12 : 1;
  ctx.save();
  ctx.globalAlpha = alpha * 0.92;
  ctx.textAlign = "center";
  ctx.font = "900 " + Math.round(34 * bounce) + "px DFKai-SB, KaiTi, serif";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#2a1810";
  ctx.strokeText(transition.label, 195, 248);
  ctx.fillStyle = "#f5c95d";
  ctx.fillText(transition.label, 195, 248);
  ctx.restore();
}

function drawSkillCutIn() {
  const cutIn = runtime.skillCutIn;
  if (!cutIn || !save.effects || reducedMotionActive()) return;
  const progress = 1 - cutIn.life / cutIn.maxLife;
  const alpha = Math.sin(Math.min(progress * 2.2, 1) * Math.PI);
  const slideIn = progress < 0.25 ? (1 - progress / 0.25) * 60 : 0;

  ctx.save();
  ctx.globalAlpha = alpha * 0.92;

  const grad = ctx.createLinearGradient(0, 190, 390, 246);
  grad.addColorStop(0, "rgba(20, 16, 26, 0)");
  grad.addColorStop(0.25, "rgba(42, 28, 16, 0.88)");
  grad.addColorStop(0.75, "rgba(42, 28, 16, 0.88)");
  grad.addColorStop(1, "rgba(20, 16, 26, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 192, 390, 54);

  ctx.strokeStyle = "#f0c65e";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(25, 192);
  ctx.lineTo(365, 192);
  ctx.moveTo(25, 246);
  ctx.lineTo(365, 246);
  ctx.stroke();

  const portrait = cutIn.hero?.portrait ? ASSETS.get(cutIn.hero.portrait) : null;
  const avatarX = 52 + slideIn;
  const avatarY = 219;
  if (portrait) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, 22, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(portrait, avatarX - 22, avatarY - 22, 44, 44);
    ctx.restore();
    ctx.strokeStyle = "#ffdf79";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.textAlign = "left";
  ctx.font = "bold 13px DFKai-SB, KaiTi, serif";
  ctx.fillStyle = "#ffdd80";
  ctx.fillText("【無雙奧義】" + (cutIn.hero?.name || "名將"), avatarX + 32, 211);

  ctx.font = "900 20px DFKai-SB, KaiTi, serif";
  ctx.strokeStyle = "#240e06";
  ctx.lineWidth = 3.5;
  ctx.strokeText((cutIn.skillName || "大招") + "！", avatarX + 32, 235);
  ctx.fillStyle = "#fff4d4";
  ctx.fillText((cutIn.skillName || "大招") + "！", avatarX + 32, 235);

  ctx.restore();
}

function drawUnitShouts() {
  const units = [...runtime.allies, ...runtime.enemies].filter((unit) => unit.shout && unit.shout.life > 0);
  if (!units.length) return;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 11px sans-serif";

  for (const unit of units) {
    const shout = unit.shout;
    const progress = 1 - (shout.life / (shout.maxLife || 2.0));
    const alpha = Math.min(1, shout.life * 2.5);
    const bubbleY = unit.y - 58 - progress * 10;
    const bubbleX = clamp(unit.x, 70, canvas.width - 70);

    const text = shout.text;
    const textWidth = ctx.measureText(text).width;
    const paddingX = 8;
    const paddingY = 4;
    const bw = textWidth + paddingX * 2;
    const bh = 18;
    const bx = bubbleX - bw / 2;
    const by = bubbleY - bh / 2;

    ctx.globalAlpha = alpha;

    // 氣泡本體底色 (深色黑金像素風格)
    ctx.fillStyle = "rgba(18, 14, 10, 0.88)";
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 4);
    ctx.fill();

    // 金色邊框
    ctx.strokeStyle = unit.team === "ally" ? "rgba(235, 195, 85, 0.9)" : "rgba(220, 90, 70, 0.9)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 氣泡指向箭頭
    ctx.fillStyle = "rgba(18, 14, 10, 0.88)";
    ctx.beginPath();
    ctx.moveTo(bubbleX - 4, by + bh);
    ctx.lineTo(bubbleX + 4, by + bh);
    ctx.lineTo(bubbleX, by + bh + 4);
    ctx.closePath();
    ctx.fill();

    // 箭頭線條
    ctx.strokeStyle = unit.team === "ally" ? "rgba(235, 195, 85, 0.9)" : "rgba(220, 90, 70, 0.9)";
    ctx.beginPath();
    ctx.moveTo(bubbleX - 4, by + bh);
    ctx.lineTo(bubbleX, by + bh + 4);
    ctx.lineTo(bubbleX + 4, by + bh);
    ctx.stroke();

    // 氣泡文字
    ctx.fillStyle = unit.team === "ally" ? "#fff2b3" : "#ffd2cc";
    ctx.fillText(text, bubbleX, bubbleY);
  }

  ctx.restore();
}

const WEATHER_PARTICLES = Array.from({ length: 36 }, () => ({
  x: Math.random() * 400,
  y: Math.random() * 600,
  speed: 1 + Math.random() * 2,
  size: 1 + Math.random() * 2,
  rot: Math.random() * Math.PI * 2,
  rotSpeed: (Math.random() - 0.5) * 0.05,
  alpha: 0.3 + Math.random() * 0.5
}));

function drawWeatherEffects() {
  if (!save.effects) return;
  const weather = typeof currentStageWeather === "function" ? currentStageWeather() : "clear";
  if (weather === "clear") return;

  ctx.save();
  for (const p of WEATHER_PARTICLES) {
    if (weather === "rain") {
      p.y += p.speed * 4.5 + 4;
      p.x -= p.speed * 0.8;
      if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * (canvas.width + 100); }
      if (p.x < -20) p.x = canvas.width + 10;
      ctx.strokeStyle = "rgba(180, 215, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 3, p.y + 12);
      ctx.stroke();
    } else if (weather === "snow") {
      p.y += p.speed * 0.9 + 0.5;
      p.x += Math.sin(p.y * 0.02 + p.rot) * 0.8;
      p.rot += p.rotSpeed;
      if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
      ctx.fillStyle = "rgba(245, 250, 255, 0.75)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (weather === "fire") {
      p.y -= p.speed * 1.5 + 0.8;
      p.x += Math.sin(p.y * 0.03) * 1.2;
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      ctx.fillStyle = p.speed > 2 ? "rgba(255, 110, 40, 0.8)" : "rgba(255, 210, 80, 0.85)";
      ctx.fillRect(p.x, p.y, p.size, p.size);
    } else if (weather === "sand") {
      p.x -= p.speed * 3.5 + 2;
      p.y += (p.speed - 1.5) * 0.8;
      if (p.x < -20) { p.x = canvas.width + 20; p.y = Math.random() * canvas.height; }
      ctx.fillStyle = "rgba(215, 180, 115, 0.45)";
      ctx.fillRect(p.x, p.y, p.size * 1.5, p.size);
    } else if (weather === "leaves") {
      p.y += p.speed * 1.1 + 0.5;
      p.x -= Math.sin(p.y * 0.025) * 1.8;
      p.rot += p.rotSpeed * 1.5;
      if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * (canvas.width + 50); }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.speed > 2 ? "#c46231" : "#d99738";
      ctx.fillRect(-2, -1, 4, 3);
      ctx.restore();
    } else if (weather === "mist") {
      p.x -= p.speed * 0.4;
      p.y += Math.sin(p.x * 0.02) * 0.3;
      if (p.x < -50) { p.x = canvas.width + 50; p.y = Math.random() * canvas.height; }
      ctx.fillStyle = "rgba(210, 225, 230, 0.06)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 24 + p.size * 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (weather === "gold") {
      p.y -= p.speed * 0.8 + 0.3;
      p.x += Math.sin(p.y * 0.02) * 0.6;
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      ctx.fillStyle = "rgba(255, 225, 120, 0.65)";
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }
  ctx.restore();
}

function render() {
  ctx.save();
  drawBackground();
  drawBattleTitle();
  drawResourceDrops();
  // Walking dust belongs to the ground plane, below mounts and character bodies.
  drawEffects({ groundOnly: true });
  const units = [...runtime.allies, ...runtime.enemies].filter((unit) => !unit.dead || unit.deathTime > 0).sort((a, b) => a.y - b.y);
  for (const unit of units) drawUnit(unit);
  drawUnitShouts();
  drawEffects();
  drawWeatherEffects();
  drawWaveTransitionOverlay();
  drawSkillCutIn();
  ctx.restore();
  if (runtime.flash > 0 && save.effects) {
    ctx.save();
    ctx.globalAlpha = clamp(runtime.flash * 2.8, 0, 0.22);
    ctx.fillStyle = runtime.flashColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function gameLoop(time) {
  if (document.hidden) {
    runtime.rafId = 0;
    return;
  }
  runtime.backgrounded = false;
  if (!Number.isFinite(time) || !Number.isFinite(runtime.lastTime)) runtime.lastTime = time || performance.now();
  let delta = (time - runtime.lastTime) / 1000;
  if (!Number.isFinite(delta) || delta < 0) delta = 1 / 60;
  runtime.lastTime = time;
  runtime.loopPulse = performance.now();
  try {
    updateGame(delta);
    const shouldRender = save.renderQuality !== "low" || Math.floor(time / 90) % 2 === 0;
    if (shouldRender) render();
  } catch (error) {
    console.error("Battle loop frame failed", error);
    runtime.spawning = false;
    runtime.hitStop = 0;
    if (typeof toast === "function") toast("戰場短暫異常，已自動恢復");
  }
  runtime.rafId = requestAnimationFrame(gameLoop);
}
