/* Render: Canvas sprites, effects and frame loop */
"use strict";

function drawPixelRect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function drawBackground() {
  const chapter = chapterForStage();
  ctx.fillStyle = chapter.base;
  ctx.fillRect(0, 0, 390, 720);

  const gradient = ctx.createLinearGradient(0, 80, 390, 610);
  gradient.addColorStop(0, "#d9d3b51a");
  gradient.addColorStop(0.55, "#22291d00");
  gradient.addColorStop(1, "#1a1e1788");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 390, 720);

  ctx.save();
  ctx.globalAlpha = 0.52;
  ctx.strokeStyle = chapter.path;
  ctx.lineWidth = 112;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(185, 86);
  ctx.bezierCurveTo(255, 230, 118, 340, 210, 620);
  ctx.stroke();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = "#d5c699";
  ctx.lineWidth = 5;
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

  const vignette = ctx.createRadialGradient(195, 335, 120, 195, 335, 350);
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, "#12150f88");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 390, 720);
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
  if (unit.dead) return;
  const width = unit.type === "boss" ? 48 : unit.team === "ally" ? 36 : 28;
  const x = Math.round(visualX - width / 2);
  const y = Math.round(visualY - (unit.type === "boss" ? 54 : 40) * unit.scale);
  drawPixelRect(x - 1, y - 1, width + 2, 6, "#1a1714");
  drawPixelRect(x, y, width, 4, "#6d1d1b");
  drawPixelRect(x, y, Math.ceil(width * clamp(unit.hp / unit.maxHp, 0, 1)), 4, unit.team === "ally" ? "#55a960" : "#cf4534");
}

function drawWeapon(unit, color) {
  const heroId = unit.team === "ally" ? unit.hero.id : "enemy";
  const visualId = unit.team === "ally" ? (unit.hero.visual || heroId) : "enemy";
  const equippedWeapon = unit.team === "ally" ? heroLoadout(heroId).weapon : null;
  ctx.save();
  ctx.translate(7, -17);
  ctx.rotate(unit.weaponSwing);
  ctx.translate(-7, 17);
  ctx.strokeStyle = "#30291f";
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (heroId === "enemy") {
    ctx.moveTo(9, -11);
    ctx.lineTo(17, -26);
    ctx.stroke();
    drawPixelRect(14, -29, 6, 10, color);
  } else if (equippedWeapon === "twin") {
    ctx.moveTo(7, -10);
    ctx.lineTo(18, -34);
    ctx.moveTo(-7, -10);
    ctx.lineTo(-17, -32);
    ctx.stroke();
    drawPixelRect(15, -37, 5, 11, "#d9e1d7");
    drawPixelRect(-20, -35, 5, 11, "#d9e1d7");
    drawPixelRect(11, -24, 10, 3, "#4d8f55");
    drawPixelRect(-21, -23, 10, 3, "#4d8f55");
  } else if (equippedWeapon === "guandao") {
    ctx.lineWidth = 4;
    ctx.moveTo(7, -7);
    ctx.lineTo(22, -49);
    ctx.stroke();
    ctx.fillStyle = "#8db7a0";
    ctx.beginPath();
    ctx.moveTo(21, -51);
    ctx.quadraticCurveTo(34, -50, 31, -39);
    ctx.lineTo(22, -43);
    ctx.lineTo(17, -53);
    ctx.closePath();
    ctx.fill();
    drawPixelRect(18, -47, 5, 4, "#d3b75e");
  } else if (equippedWeapon === "serpent") {
    ctx.lineWidth = 4;
    ctx.moveTo(7, -7);
    ctx.lineTo(22, -46);
    ctx.stroke();
    ctx.strokeStyle = "#b74835";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(19, -40);
    ctx.lineTo(26, -44);
    ctx.lineTo(21, -48);
    ctx.stroke();
    ctx.fillStyle = "#d9ded8";
    ctx.beginPath();
    ctx.moveTo(22, -55);
    ctx.lineTo(27, -45);
    ctx.lineTo(19, -46);
    ctx.closePath();
    ctx.fill();
  } else if (equippedWeapon === "lance") {
    ctx.lineWidth = 3;
    ctx.moveTo(7, -7);
    ctx.lineTo(24, -49);
    ctx.stroke();
    ctx.strokeStyle = "#3181bd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(19, -42);
    ctx.lineTo(28, -39);
    ctx.moveTo(20, -44);
    ctx.lineTo(29, -45);
    ctx.stroke();
    ctx.fillStyle = "#eef3ec";
    ctx.beginPath();
    ctx.moveTo(25, -57);
    ctx.lineTo(29, -47);
    ctx.lineTo(21, -49);
    ctx.closePath();
    ctx.fill();
  } else if (equippedWeapon === "bow") {
    ctx.strokeStyle = "#684b26";
    ctx.lineWidth = 3;
    ctx.arc(13, -18, 11, -1.25, 1.25);
    ctx.moveTo(16, -28);
    ctx.lineTo(16, -8);
    ctx.stroke();
    drawPixelRect(15, -31, 3, 25, "#d3b85f");
  } else if (equippedWeapon === "fan" || equippedWeapon === "rings") {
    ctx.moveTo(9, -10);
    ctx.lineTo(14, -23);
    ctx.stroke();
    ctx.fillStyle = equippedWeapon === "rings" ? "#e97bad" : "#e7e3d1";
    ctx.beginPath();
    ctx.moveTo(13, -24);
    ctx.quadraticCurveTo(28, -34, 30, -18);
    ctx.lineTo(16, -13);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = equippedWeapon === "rings" ? "#7d3d75" : "#607e78";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(15, -22);
    ctx.lineTo(28, -20);
    ctx.moveTo(16, -21);
    ctx.lineTo(26, -27);
    ctx.stroke();
  } else if (equippedWeapon === "halberd") {
    ctx.lineWidth = 4;
    ctx.moveTo(7, -7);
    ctx.lineTo(23, -50);
    ctx.stroke();
    ctx.fillStyle = "#e5b443";
    ctx.beginPath();
    ctx.moveTo(24, -57);
    ctx.lineTo(29, -48);
    ctx.lineTo(24, -43);
    ctx.lineTo(18, -49);
    ctx.closePath();
    ctx.fill();
    drawPixelRect(23, -53, 13, 4, "#c83b32");
  } else if (visualId === "xiahoudun") {
    ctx.moveTo(8, -9);
    ctx.lineTo(20, -35);
    ctx.stroke();
    ctx.fillStyle = "#aebac7";
    ctx.beginPath();
    ctx.moveTo(17, -40);
    ctx.lineTo(27, -35);
    ctx.lineTo(19, -21);
    ctx.lineTo(15, -27);
    ctx.closePath();
    ctx.fill();
    drawPixelRect(12, -24, 12, 3, "#375a86");
  } else if (visualId === "caocao") {
    ctx.moveTo(8, -9);
    ctx.lineTo(20, -35);
    ctx.stroke();
    drawPixelRect(17, -39, 6, 17, "#d3d8df");
    drawPixelRect(12, -24, 13, 3, "#8c57a8");
  } else if (unit.role === "謀士") {
    ctx.moveTo(12, -8);
    ctx.lineTo(15, -31);
    ctx.stroke();
    drawPixelRect(14, -32, 6, 12, color);
  } else {
    ctx.moveTo(9, -10);
    ctx.lineTo(19, -30);
    ctx.stroke();
    drawPixelRect(14, -32, 6, 12, color);
  }
  ctx.restore();
}

function drawMountOrFeet(unit, heroId, walkCycle, mountId = "") {
  const mounted = (unit.role === "騎兵" || unit.type === "boss") && mountId !== "foot";
  if (mounted) {
    const horse = mountId === "jadelion" || heroId === "zhaoyun" ? "#d9d9ce" : mountId === "redhare" || heroId === "lubu" ? "#6f342d" : heroId === "guanyu" ? "#715343" : unit.team === "ally" ? "#aaa99e" : "#5e5042";
    const horseLight = mountId === "jadelion" || heroId === "zhaoyun" ? "#f1eee1" : mountId === "redhare" || heroId === "lubu" ? "#9b4a36" : unit.team === "ally" ? "#c1b6a4" : "#756250";
    const gallop = unit.moving ? Math.round(walkCycle * 2) : 0;
    drawPixelRect(-18, -13, 35, 12, horse);
    drawPixelRect(11, -19, 13, 12, horseLight);
    drawPixelRect(17, -23, 7, 6, horseLight);
    drawPixelRect(-14 + gallop, -3, 5, 9, "#28241e");
    drawPixelRect(8 - gallop, -3, 5, 9, "#28241e");
    drawPixelRect(-20, -12, 5, 3, heroId === "lubu" ? "#c84535" : "#332a24");
    drawPixelRect(-8, -16, 17, 4, heroId === "lubu" ? "#d8ae45" : unit.team === "ally" ? "#6a744f" : "#4b352a");
  } else {
    const stride = unit.moving ? Math.round(walkCycle * (heroId === "zhangfei" ? 4 : 3)) : 0;
    const boot = heroId === "diaochan" || heroId === "sunshang" ? "#5b3047" : "#2a251e";
    drawPixelRect(-8 + stride, -10, 6, 10, boot);
    drawPixelRect(2 - stride, -10, 6, 10, boot);
  }
}

function drawHeroBack(heroId, accent, walkCycle, idleCycle) {
  const flutter = walkCycle * 3 + idleCycle;
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

function drawUnit(unit) {
  if (unit.dead && unit.deathTime <= 0) return;
  const walkCycle = Math.sin(runtime.elapsed * 15 + unit.x * 0.08);
  const idleCycle = Math.sin(runtime.elapsed * 3.2 + unit.x * 0.03);
  const heroId = unit.team === "ally" ? unit.hero.id : "enemy";
  const visualId = unit.team === "ally" ? (unit.hero.visual || heroId) : "enemy";
  const loadout = unit.team === "ally" ? heroLoadout(heroId) : null;
  const moveBounce = visualId === "zhangfei" ? 2.9 : visualId === "zhaoyun" ? 1.35 : 2;
  const idleBounce = visualId === "guanyu" ? 0.35 : visualId === "zhangfei" ? 0.55 : 0.8;
  const bob = unit.moving ? -Math.abs(walkCycle) * moveBounce : idleCycle * idleBounce;
  const renderX = unit.x + unit.motionX + unit.kickX;
  const renderY = unit.y + unit.motionY + unit.kickY;
  const visualEase = 1 - Math.exp(-runtime.renderDelta * (unit.moving ? 18 : 22));
  if (!Number.isFinite(unit.renderX)) unit.renderX = renderX;
  if (!Number.isFinite(unit.renderY)) unit.renderY = renderY;
  unit.renderX += (renderX - unit.renderX) * visualEase;
  unit.renderY += (renderY - unit.renderY) * visualEase;
  const deathMax = unit.type === "boss" ? 0.9 : 0.58;
  const deathProgress = unit.dead ? 1 - unit.deathTime / deathMax : 0;
  ctx.save();
  ctx.translate(unit.renderX, unit.renderY + bob);

  ctx.globalAlpha = unit.dead ? 0.2 * (1 - deathProgress) : 0.36;
  ctx.fillStyle = "#10120e";
  ctx.beginPath();
  ctx.ellipse(0, 2, (unit.type === "boss" ? 24 : 16) * (1 + deathProgress * 0.35), unit.type === "boss" ? 8 : 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = unit.dead ? clamp(unit.deathTime / deathMax * 1.35, 0, 1) : 1;

  if (unit.dead) {
    ctx.translate(0, deathProgress * 10);
    ctx.rotate(unit.deathSpin * deathProgress * 1.18);
  }
  const deathSquash = unit.dead ? 1 - deathProgress * 0.32 : 1;
  ctx.scale(unit.scale * unit.facing * (1 + unit.squashX), unit.scale * deathSquash * (1 + unit.squashY));

  const body = unit.team === "ally" ? unit.hero.color : unit.color;
  const accent = unit.team === "ally" ? unit.hero.accent : unit.accent;
  drawMountOrFeet(unit, visualId, walkCycle, loadout?.mount);

  if (unit.team === "ally") {
    drawHeroBack(visualId, accent, unit.moving ? walkCycle : 0, idleCycle);
    drawHeroBody(visualId, body, accent);
    drawArmorOverlay(loadout?.armor, idleCycle);
    drawAccessory(visualId, loadout?.accessory, idleCycle);
    drawHeroHead(visualId, idleCycle);
    drawHeroDetails(visualId, loadout?.armor, idleCycle, unit.moving ? walkCycle : 0);
  } else {
    drawEnemyBody(unit, body, accent, idleCycle);
    drawEnemyDetails(unit, idleCycle);
  }
  if (unit.hitFlash > 0) {
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = Math.min(0.82, unit.hitFlash * 5);
    drawPixelRect(-10, -27, 20, 19, "#fff");
    drawPixelRect(-13, -22, 5, 16, "#fff");
    drawPixelRect(8, -22, 5, 16, "#fff");
    drawPixelRect(-8, -40, 16, 14, "#fff");
    drawPixelRect(-10, -43, 20, 7, "#fff");
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  drawWeapon(unit, accent);
  ctx.restore();
  if (!unit.dead) drawHealthBar(unit, unit.renderX, unit.renderY + bob);
}

function drawEffects() {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const effect of runtime.effects) {
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = Math.sin(progress * Math.PI);
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
        ctx.fillRect(effect.radius * progress * 0.25, -2, effect.radius * (0.35 + progress * 0.4), Math.max(1, 4 * (1 - progress)));
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
      ctx.arc(effect.x, effect.y, effect.radius * (0.45 + progress * 0.7), effect.angle - 1.3, effect.angle + 1.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (0.25 + progress * 0.45), effect.angle - 1.1, effect.angle + 1.1);
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
  for (const projectile of runtime.projectiles) {
    const dx = projectile.target && !projectile.target.dead ? projectile.target.x - projectile.x : 1;
    const dy = projectile.target && !projectile.target.dead ? projectile.target.y - projectile.y : 0;
    const angle = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = projectile.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-17, 0);
    ctx.lineTo(2, 0);
    ctx.stroke();
    ctx.fillStyle = projectile.color;
    ctx.fillRect(-4, -2, 11, 4);
    ctx.fillStyle = "#fff8d2";
    ctx.fillRect(0, -1, 7, 2);
    ctx.restore();
  }
  ctx.restore();

  for (const number of runtime.numbers) {
    ctx.globalAlpha = clamp(number.life / number.maxLife * 1.5, 0, 1);
    const numberProgress = 1 - number.life / number.maxLife;
    const popScale = numberProgress < 0.22 ? 0.65 + numberProgress / 0.22 * 0.55 : 1.2 - (numberProgress - 0.22) * 0.25;
    ctx.font = "bold " + Math.round(number.size * popScale) + "px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#25140d";
    ctx.strokeText(number.value, number.x, number.y);
    ctx.fillStyle = number.color;
    ctx.fillText(number.value, number.x, number.y);
  }
  ctx.globalAlpha = 1;
}

function drawBattleTitle() {
  const chapter = chapterForStage();
  ctx.save();
  ctx.globalAlpha = 0.17;
  ctx.translate(195, 326);
  ctx.rotate(-0.1);
  ctx.font = "bold 54px DFKai-SB, KaiTi, serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#151810";
  ctx.fillText(chapter.stage, 0, 0);
  ctx.restore();
}

function render() {
  ctx.save();
  if (runtime.shake > 0 && save.effects) {
    ctx.translate((Math.random() - 0.5) * runtime.shake, (Math.random() - 0.5) * runtime.shake);
  }
  drawBackground();
  drawBattleTitle();
  const units = [...runtime.allies, ...runtime.enemies].filter((unit) => !unit.dead || unit.deathTime > 0).sort((a, b) => a.y - b.y);
  for (const unit of units) drawUnit(unit);
  drawEffects();
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
  const delta = (time - runtime.lastTime) / 1000;
  runtime.lastTime = time;
  updateGame(delta);
  render();
  requestAnimationFrame(gameLoop);
}
