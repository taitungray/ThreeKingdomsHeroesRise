"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "assets", "characters");

const HERO_VISUAL_STYLES = {
  liubei: { helm: "#d4a742", face: "#ffdcb5", body: "#3d7044", accent: "#d4a742", trim: "#f5e6a2", beard: "#3d2b1f", cape: "#2b5432" },
  guanyu: { helm: "#246b45", face: "#d85d45", body: "#1d5838", accent: "#e0b040", trim: "#f0d575", beard: "#1a120e", cape: "#154228" },
  zhangfei: { helm: "#35393d", face: "#6e5245", body: "#9e3428", accent: "#d09838", trim: "#f2ca6b", beard: "#181412", cape: "#782218" },
  zhaoyun: { helm: "#d8e2eb", face: "#ffe0c2", body: "#32629b", accent: "#e6f0fa", trim: "#79a8db", beard: "", cape: "#1f4470" },
  huangzhong: { helm: "#c29b47", face: "#fcdcb8", body: "#8f6b2e", accent: "#e0b958", trim: "#fae093", beard: "#e8edf2", cape: "#6b4f20" },
  sunshang: { helm: "#c83838", face: "#ffe2c8", body: "#b82b2b", accent: "#f5b547", trim: "#ffd47a", beard: "", cape: "#871a1a" },
  caocao: { helm: "#54306b", face: "#f7d8b5", body: "#482663", accent: "#dca838", trim: "#f5cb6c", beard: "#241812", cape: "#331847" },
  xiahoudun: { helm: "#3a3d45", face: "#eed0b0", body: "#363a45", accent: "#4582ba", trim: "#7bafe0", beard: "#201815", cape: "#222630" },
  zhugeliang: { helm: "#4d6b63", face: "#ffdfc4", body: "#3b5c53", accent: "#e8dfcb", trim: "#ffffff", beard: "#2b221a", cape: "#28443c" },
  diaochan: { helm: "#e8749e", face: "#ffe6d6", body: "#d4487b", accent: "#fad2e1", trim: "#fff0f7", beard: "", cape: "#a62b58" },
  lubu: { helm: "#a62622", face: "#ebd0b0", body: "#262322", accent: "#e8ad2c", trim: "#ffd066", beard: "#1a110d", cape: "#7a1410" },
  machao: { helm: "#dbe3e8", face: "#fde0c5", body: "#2b5680", accent: "#d4e6f7", trim: "#8ec4f5", beard: "", cape: "#1a3957" },
  dianwei: { helm: "#484b52", face: "#d8b08e", body: "#694336", accent: "#b88a45", trim: "#dbb274", beard: "#221815", cape: "#4a2c22" },
  zhouyu: { helm: "#b83030", face: "#ffe4cf", body: "#a82828", accent: "#eed488", trim: "#fff2b8", beard: "", cape: "#7a1a1a" },
  luxun: { helm: "#c03a3a", face: "#ffe5d0", body: "#b03232", accent: "#4aa38a", trim: "#87d6c0", beard: "", cape: "#802020" },
  simayi: { helm: "#3f2854", face: "#ebd3b8", body: "#331f45", accent: "#7d5ea8", trim: "#ba9ee0", beard: "#20181b", cape: "#221330" },
  ganning: { helm: "#993322", face: "#e0b892", body: "#22384d", accent: "#e88538", trim: "#fab37a", beard: "#1a1210", cape: "#152636" },
  taishici: { helm: "#965b2d", face: "#edd2b4", body: "#78451e", accent: "#d8a44d", trim: "#fae090", beard: "#2b1c12", cape: "#522c10" },
  zhangliao: { helm: "#404859", face: "#ebd4bc", body: "#30394a", accent: "#528fd4", trim: "#96c4fa", beard: "#1e1e24", cape: "#1f2633" },
  jiangwei: { helm: "#2d6349", face: "#fce0c6", body: "#224f3a", accent: "#d9a841", trim: "#fae082", beard: "", cape: "#163828" },
  pangtong: { helm: "#574332", face: "#e6c8a5", body: "#4a382a", accent: "#bd8e46", trim: "#e8c387", beard: "#241810", cape: "#33251a" },
  weiyan: { helm: "#244d3b", face: "#cca27a", body: "#1d4031", accent: "#c43f31", trim: "#f57f73", beard: "#1f1814", cape: "#142e22" }
};

const DEFAULT_HERO_STYLE = {
  helm: "#a67838",
  face: "#fde0c5",
  body: "#3b5c43",
  accent: "#d4a742",
  trim: "#fae093",
  beard: "#2b1f18",
  cape: "#284430"
};

const ENEMY_BODY_STYLES = {
  bandit: { helm: "#802b24", face: "#e0ba94", body: "#632722", accent: "#b0433a", trim: "#d9736a", beard: "#241715", cape: "#4a1915" },
  brute: { helm: "#4a4d52", face: "#cca585", body: "#3b3d42", accent: "#7a7e85", trim: "#b0b4bd", beard: "#1c1d21", cape: "#292a2e" },
  cavalry: { helm: "#734928", face: "#e6c29e", body: "#5c371b", accent: "#a66c3f", trim: "#cfa076", beard: "#21160e", cape: "#402410" },
  archer: { helm: "#476140", face: "#eed2b5", body: "#384f33", accent: "#6f9164", trim: "#a3c797", beard: "", cape: "#253621" },
  strategist: { helm: "#453859", face: "#ebd3be", body: "#382d4a", accent: "#786299", trim: "#b097d6", beard: "#1e1826", cape: "#261d33" },
  locked: { helm: "#36383b", face: "#4a4d52", body: "#2a2c2e", accent: "#52565c", trim: "#6e737a", beard: "#1c1d1f", cape: "#1c1d1f" }
};

function generateCombatBodySvg(style, isBoss = false) {
  const w = 64;
  const h = 76;
  const helm = style.helm || "#a67838";
  const face = style.face || "#fde0c5";
  const body = style.body || "#3b5c43";
  const accent = style.accent || "#d4a742";
  const trim = style.trim || "#fae093";
  const beard = style.beard;
  const cape = style.cape || "#284430";

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <!-- Cape / Robe Back Layer -->
  <path d="M16 28 Q10 48 14 66 L26 66 L26 34 Z" fill="${cape}" opacity="0.95"/>
  <path d="M48 28 Q54 48 50 66 L38 66 L38 34 Z" fill="${cape}" opacity="0.95"/>
  
  <!-- Boots / Legs -->
  <rect x="22" y="60" width="8" height="13" rx="1" fill="#181512"/>
  <rect x="34" y="60" width="8" height="13" rx="1" fill="#181512"/>
  <rect x="22" y="68" width="8" height="4" fill="#383025"/>
  <rect x="34" y="68" width="8" height="4" fill="#383025"/>

  <!-- Tassets / Lower Armor Skirt -->
  <path d="M18 46 L46 46 L43 62 L21 62 Z" fill="${body}"/>
  <path d="M20 46 L28 62 L36 62 L44 46 Z" fill="${trim}" opacity="0.8"/>
  <rect x="30" y="46" width="4" height="16" fill="${accent}"/>

  <!-- Torso Armor / Cuirass -->
  <rect x="18" y="24" width="28" height="24" rx="2" fill="${body}"/>
  <path d="M22 26 L42 26 L38 44 L26 44 Z" fill="${accent}" opacity="0.85"/>
  <!-- Chest Medallion / Lion Emblem -->
  <circle cx="32" cy="34" r="5" fill="${trim}"/>
  <circle cx="32" cy="34" r="3" fill="${accent}"/>
  <circle cx="32" cy="34" r="1.5" fill="#fff"/>

  <!-- Golden Belt -->
  <rect x="18" y="44" width="28" height="5" fill="#291c10"/>
  <rect x="20" y="45" width="24" height="3" fill="${accent}"/>
  <rect x="29" y="43" width="6" height="7" rx="1" fill="${trim}"/>
  <rect x="30.5" y="44.5" width="3" height="4" fill="#6e1f14"/>

  <!-- Shoulder Pauldrons -->
  <rect x="10" y="24" width="10" height="14" rx="2" fill="${accent}"/>
  <rect x="12" y="26" width="6" height="10" fill="${trim}"/>
  <rect x="44" y="24" width="10" height="14" rx="2" fill="${accent}"/>
  <rect x="46" y="26" width="6" height="10" fill="${trim}"/>

  <!-- Head / Face -->
  <rect x="22" y="10" width="20" height="18" rx="3" fill="${face}"/>
  
  <!-- Eyes -->
  <rect x="25" y="17" width="4" height="2.5" fill="#1f1814"/>
  <rect x="26" y="17" width="1.5" height="1.5" fill="#fff"/>
  <rect x="35" y="17" width="4" height="2.5" fill="#1f1814"/>
  <rect x="36" y="17" width="1.5" height="1.5" fill="#fff"/>
  
  <!-- Eyebrows -->
  <rect x="24" y="15" width="5" height="1.5" fill="#291c14"/>
  <rect x="35" y="15" width="5" height="1.5" fill="#291c14"/>

  <!-- Beard if present -->
  ${beard ? `
  <path d="M26 24 Q32 36 38 24 Z" fill="${beard}"/>
  <path d="M28 22 Q32 30 36 22 Z" fill="${beard}"/>
  ` : `
  <rect x="30" y="22" width="4" height="1.5" fill="#d48a7b"/>
  `}

  <!-- Helmet / Headdress -->
  <path d="M18 13 Q32 2 46 13 L44 18 L20 18 Z" fill="${helm}"/>
  <rect x="20" y="11" width="24" height="4" fill="${accent}"/>
  <rect x="30" y="3" width="4" height="10" fill="${trim}"/>
  <circle cx="32" cy="4" r="3" fill="${trim}"/>
  <circle cx="32" cy="4" r="1.5" fill="#d43728"/>

  <!-- Helmet Crest / Feather plume -->
  <path d="M32 3 Q36 -3 40 1 Q36 3 32 3 Z" fill="#d43728"/>
  <path d="M32 3 Q28 -3 24 1 Q28 3 32 3 Z" fill="#d43728"/>

  <!-- Hands / Forearms -->
  <rect x="12" y="38" width="6" height="6" rx="1" fill="${face}"/>
  <rect x="46" y="38" width="6" height="6" rx="1" fill="${face}"/>
</svg>
`.trim();
}

async function main() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "data", "game-data.js"), "utf8"), context, { filename: "game-data.js" });
  const data = context.window.THREE_KINGDOMS_DATA;

  // Generate 50 hero combat bodies
  for (const hero of data.heroes) {
    const style = HERO_VISUAL_STYLES[hero.id] || {
      ...DEFAULT_HERO_STYLE,
      body: hero.color || DEFAULT_HERO_STYLE.body,
      accent: hero.accent || DEFAULT_HERO_STYLE.accent
    };
    const svg = generateCombatBodySvg(style, false);
    const dest = path.join(outputDir, `combat-body-${hero.id}-v1.webp`);
    await sharp(Buffer.from(svg))
      .resize(64, 76)
      .webp({ quality: 95, lossless: true })
      .toFile(dest);
    console.log(`Generated high-def combat-body-${hero.id}-v1.webp (64x76)`);
  }

  // Generate Enemy & Locked combat bodies
  for (const [type, style] of Object.entries(ENEMY_BODY_STYLES)) {
    const svg = generateCombatBodySvg(style, false);
    const dest = path.join(outputDir, `combat-body-${type}-v1.webp`);
    await sharp(Buffer.from(svg))
      .resize(64, 76)
      .webp({ quality: 95, lossless: true })
      .toFile(dest);
    console.log(`Generated high-def combat-body-${type}-v1.webp (64x76)`);
  }

  console.log("All combat bodies regenerated in 64x76 HD Retina resolution!");
}

main().catch(console.error);
