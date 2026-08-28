const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const outputDir = path.join(__dirname, "..", "assets", "characters");

const ink = "#1c1815";
const inkSoft = "#2e241c";
const steel = "#d9e2dc";
const steelLight = "#fcfaf0";
const steelDark = "#8b9c96";
const steelShine = "#ffffff";
const wood = "#6d4726";
const woodDark = "#4a2e16";
const gold = "#f1c242";
const goldLight = "#fff0a3";
const goldDark = "#a6781d";
const jade = "#4ba682";
const jadeLight = "#85e0bc";
const jadeDark = "#276850";
const red = "#c8392b";
const redLight = "#f06554";
const redDark = "#7e1b12";
const cyan = "#4da4d6";
const purple = "#985cb8";

function svg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" shape-rendering="crispEdges">
    <g stroke-linecap="round" stroke-linejoin="round">${body}</g>
  </svg>`;
}

const weapons = {
  // 雌雄雙股劍
  twin: svg(`
    <!-- Left Blade (Sword 1) -->
    <path d="M24 55 L16 20 L21 16 L31 51 Z" fill="${inkSoft}" stroke="${ink}" stroke-width="2"/>
    <path d="M25 53 L18 21 L21 18 L29 50 Z" fill="${steel}" />
    <path d="M22 20 L28 48" stroke="${steelLight}" stroke-width="1.5"/>
    <path d="M19 18 L23 18" stroke="${steelShine}" stroke-width="2"/>
    
    <!-- Right Blade (Sword 2) -->
    <path d="M33 55 L44 18 L39 15 L27 51 Z" fill="${inkSoft}" stroke="${ink}" stroke-width="2"/>
    <path d="M32 53 L42 19 L39 17 L28 50 Z" fill="${steelLight}" />
    <path d="M37 20 L30 48" stroke="${steelShine}" stroke-width="1.5"/>
    
    <!-- Golden Guards & Pommels -->
    <path d="M20 46 L36 46" stroke="${ink}" stroke-width="5"/>
    <path d="M20 46 L36 46" stroke="${gold}" stroke-width="3"/>
    <circle cx="28" cy="46" r="2" fill="${red}"/>
    <path d="M24 53 L32 53" stroke="${goldDark}" stroke-width="3"/>
    <circle cx="28" cy="56" r="2.5" fill="${gold}"/>
    <!-- Red Tassel -->
    <path d="M28 58 Q24 62 23 64" stroke="${red}" stroke-width="2" fill="none"/>
    <path d="M28 58 Q32 62 33 64" stroke="${redLight}" stroke-width="1.5" fill="none"/>
  `),

  // 青龍偃月刀
  guandao: svg(`
    <!-- Pole -->
    <path d="M32 58 L28 20" stroke="${ink}" stroke-width="6"/>
    <path d="M32 58 L28 20" stroke="${wood}" stroke-width="3"/>
    <path d="M31 56 L29 22" stroke="${woodDark}" stroke-width="1.5"/>
    
    <!-- Gold Dragon Head Base -->
    <path d="M25 24 C23 20 28 17 33 21 C36 24 33 28 27 28 Z" fill="${goldDark}" stroke="${ink}" stroke-width="2"/>
    <circle cx="29" cy="23" r="3" fill="${gold}"/>
    <circle cx="30" cy="22" r="1" fill="${red}"/>
    
    <!-- Heavy Blade -->
    <path d="M26 23 C14 20 8 11 14 4 C22 9 32 13 36 21 C34 26 30 28 25 27 Z" fill="${inkSoft}" stroke="${ink}" stroke-width="2.5"/>
    <path d="M25 22 C16 19 11 12 15 7 C22 11 30 15 33 21 C31 25 28 26 24 25 Z" fill="${jade}"/>
    <path d="M23 21 C17 18 13 13 16 9 C22 12 28 16 31 20" stroke="${jadeLight}" stroke-width="2" fill="none"/>
    <path d="M15 7 C21 11 28 15 32 20" stroke="${steelShine}" stroke-width="1.5" fill="none"/>
    <!-- Blade Spike Back -->
    <path d="M33 16 L38 18 L34 21 Z" fill="${gold}"/>
    
    <!-- Red Tassel Silk -->
    <path d="M32 26 C36 28 40 33 38 40 C37 36 34 32 30 30" fill="${red}" stroke="${ink}" stroke-width="1"/>
    <path d="M33 27 C37 29 39 34 37 38" stroke="${redLight}" stroke-width="1.5" fill="none"/>
    <!-- Brass End Cap -->
    <path d="M31 54 L33 58 L30 58 Z" fill="${gold}"/>
  `),

  // 丈八蛇矛
  serpent: svg(`
    <!-- Pole -->
    <path d="M32 58 L32 20" stroke="${ink}" stroke-width="6"/>
    <path d="M32 58 L32 20" stroke="${wood}" stroke-width="3"/>
    
    <!-- Snake Wavy Spearhead Base -->
    <path d="M25 22 L39 22" stroke="${gold}" stroke-width="3"/>
    
    <!-- Continuous Wavy Serpent Blade -->
    <path d="M32 3 C26 8 38 12 26 16 C25 19 28 22 32 22 C36 22 39 19 38 16 C26 12 38 8 32 3 Z" fill="${inkSoft}" stroke="${ink}" stroke-width="2"/>
    <path d="M32 4 C28 8 36 12 28 16 C27 18 29 20 32 20 C35 20 37 18 36 16 C28 12 36 8 32 4 Z" fill="${steel}"/>
    <path d="M32 4 L32 20" stroke="${steelShine}" stroke-width="1.5"/>
    
    <!-- Crimson Tassel Plume -->
    <path d="M25 22 C19 26 18 33 21 39 C23 34 25 28 29 26 Z" fill="${red}" stroke="${ink}" stroke-width="1"/>
    <path d="M24 24 C21 27 20 32 22 36" stroke="${redLight}" stroke-width="1.5" fill="none"/>
    <circle cx="32" cy="22" r="2.5" fill="${gold}"/>
  `),

  // 龍膽亮銀槍
  lance: svg(`
    <!-- Shaft -->
    <path d="M32 58 L32 16" stroke="${ink}" stroke-width="5"/>
    <path d="M32 58 L32 16" stroke="${woodDark}" stroke-width="2.5"/>
    
    <!-- Piercing Spear Tip -->
    <path d="M32 2 L40 16 L32 24 L24 16 Z" fill="${inkSoft}" stroke="${ink}" stroke-width="2"/>
    <path d="M32 4 L38 16 L32 22 L26 16 Z" fill="${steelLight}"/>
    <path d="M32 4 L32 22" stroke="${steelShine}" stroke-width="2"/>
    <path d="M26 16 L38 16" stroke="${steelShine}" stroke-width="1"/>
    
    <!-- Cyan / Jade Dragon Tassel -->
    <path d="M24 19 C18 22 17 29 20 34 C21 28 23 23 28 21" fill="${cyan}" stroke="${ink}" stroke-width="1"/>
    <path d="M23 21 C19 24 18 28 20 32" stroke="${steelShine}" stroke-width="1.5" fill="none"/>
    <path d="M36 19 C42 22 43 29 40 34 C39 28 37 23 32 21" fill="${cyan}" stroke="${ink}" stroke-width="1"/>
    
    <!-- Gold Socket -->
    <path d="M26 23 L38 23" stroke="${gold}" stroke-width="3"/>
    <circle cx="32" cy="23" r="2" fill="${red}"/>
  `),

  // 穿雲神臂弓
  bow: svg(`
    <!-- Bow Limb Arch -->
    <path d="M16 6 Q50 32 16 58" fill="none" stroke="${ink}" stroke-width="6"/>
    <path d="M16 6 Q46 32 16 58" fill="none" stroke="${wood}" stroke-width="3.5"/>
    <path d="M17 9 Q44 32 17 55" fill="none" stroke="${gold}" stroke-width="1.5"/>
    
    <!-- Dragon Head Tips -->
    <circle cx="16" cy="7" r="3" fill="${gold}" stroke="${ink}" stroke-width="1.5"/>
    <circle cx="16" cy="57" r="3" fill="${gold}" stroke="${ink}" stroke-width="1.5"/>
    
    <!-- Bowstring -->
    <path d="M16 7 L16 57" stroke="${steelShine}" stroke-width="1.5"/>
    
    <!-- Nocked Arrow -->
    <path d="M15 32 L49 32" stroke="${ink}" stroke-width="4"/>
    <path d="M15 32 L47 32" stroke="${steelLight}" stroke-width="2"/>
    <!-- Arrowhead -->
    <path d="M44 28 L52 32 L44 36 Z" fill="${steelShine}" stroke="${ink}" stroke-width="1.5"/>
    <!-- Arrow Fletching -->
    <path d="M16 28 L22 32 L16 36 Z" fill="${red}" stroke="${ink}" stroke-width="1"/>
    
    <!-- Center Grip -->
    <path d="M32 29 L35 35" stroke="${red}" stroke-width="4"/>
    <path d="M31 28 L34 36" stroke="${gold}" stroke-width="2"/>
  `),

  // 八卦白羽扇
  fan: svg(`
    <!-- Handle -->
    <path d="M32 58 L29 38" stroke="${ink}" stroke-width="5"/>
    <path d="M32 58 L29 38" stroke="${wood}" stroke-width="2.5"/>
    
    <!-- Fan Ribs & Feathers Outer -->
    <path d="M29 39 C16 33 12 20 16 10 C30 11 44 14 52 24 C47 35 39 39 29 39 Z" fill="${inkSoft}" stroke="${ink}" stroke-width="2"/>
    <path d="M29 37 C18 31 15 21 18 12 C30 13 41 16 48 24 C44 33 37 37 29 37 Z" fill="${steelLight}"/>
    
    <!-- Feather Strands Layer -->
    <path d="M19 14 C28 20 34 26 31 35" stroke="${steel}" stroke-width="2" fill="none"/>
    <path d="M26 13 C32 19 36 25 33 35" stroke="${steelDark}" stroke-width="1.5" fill="none"/>
    <path d="M34 15 C37 21 38 27 35 34" stroke="${jadeLight}" stroke-width="2" fill="none"/>
    <path d="M42 19 C41 24 39 29 36 33" stroke="${steelShine}" stroke-width="1.5" fill="none"/>
    
    <!-- Jade Taiji Center -->
    <circle cx="31" cy="36" r="4.5" fill="${jade}" stroke="${gold}" stroke-width="1.5"/>
    <circle cx="31" cy="36" r="2" fill="${steelShine}"/>
    <path d="M26 39 L36 39" stroke="${gold}" stroke-width="2.5"/>
    
    <!-- Tassel Pendant -->
    <circle cx="32" cy="58" r="2.5" fill="${jade}"/>
    <path d="M32 60 Q34 63 35 64" stroke="${red}" stroke-width="2" fill="none"/>
  `),

  // 日月乾坤圈
  rings: svg(`
    <!-- Shaft Handle Grip -->
    <path d="M32 58 L30 38" stroke="${ink}" stroke-width="5"/>
    <path d="M32 58 L30 38" stroke="${wood}" stroke-width="2.5"/>
    
    <!-- Primary Sun Ring (Left) -->
    <circle cx="25" cy="23" r="11" fill="none" stroke="${ink}" stroke-width="5"/>
    <circle cx="25" cy="23" r="11" fill="none" stroke="${gold}" stroke-width="3"/>
    <circle cx="25" cy="23" r="9" fill="none" stroke="${goldLight}" stroke-width="1"/>
    <!-- Spikes on Ring -->
    <path d="M25 10 L27 13 L23 13 Z" fill="${steelShine}"/>
    <path d="M12 23 L15 25 L15 21 Z" fill="${steelShine}"/>
    <path d="M25 36 L27 33 L23 33 Z" fill="${steelShine}"/>
    
    <!-- Secondary Moon Ring (Right) -->
    <circle cx="41" cy="19" r="10" fill="none" stroke="${ink}" stroke-width="5"/>
    <circle cx="41" cy="19" r="10" fill="none" stroke="${cyan}" stroke-width="3"/>
    <circle cx="41" cy="19" r="8" fill="none" stroke="${steelShine}" stroke-width="1"/>
    <!-- Spikes on Moon Ring -->
    <path d="M41 7 L43 10 L39 10 Z" fill="${goldLight}"/>
    <path d="M53 19 L50 21 L50 17 Z" fill="${goldLight}"/>
    
    <!-- Center Joint Brooch -->
    <path d="M26 38 L36 38" stroke="${goldDark}" stroke-width="3"/>
    <circle cx="31" cy="38" r="2.5" fill="${red}"/>
  `),

  // 方天畫戟
  halberd: svg(`
    <!-- Long Shaft -->
    <path d="M32 58 L32 15" stroke="${ink}" stroke-width="6"/>
    <path d="M32 58 L32 15" stroke="${woodDark}" stroke-width="3"/>
    
    <!-- Central Spearhead -->
    <path d="M32 2 L38 16 L32 23 L26 16 Z" fill="${inkSoft}" stroke="${ink}" stroke-width="2"/>
    <path d="M32 4 L36 16 L32 21 L28 16 Z" fill="${steelShine}"/>
    <path d="M32 4 L32 21" stroke="${steelLight}" stroke-width="2"/>
    
    <!-- Right Crescent Moon Blade -->
    <path d="M32 16 C44 11 52 14 50 25 C45 25 39 28 33 32 L28 27 Z" fill="${inkSoft}" stroke="${ink}" stroke-width="2"/>
    <path d="M33 17 C42 13 48 15 47 23 C42 24 38 27 34 30 L30 26 Z" fill="${gold}"/>
    <path d="M35 18 C43 14 47 16 46 22" stroke="${goldLight}" stroke-width="1.5" fill="none"/>
    <path d="M47 23 L51 24 L48 26 Z" fill="${steelShine}"/>
    
    <!-- Left Small Crescent Blade -->
    <path d="M32 18 C24 15 16 19 18 27 C22 26 27 28 31 31 Z" fill="${inkSoft}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M32 19 C25 17 19 20 20 25 C23 25 27 27 31 29 Z" fill="${goldDark}"/>
    
    <!-- Dual Scarlet Silk Tassels -->
    <path d="M30 26 C25 29 23 37 27 42 C28 37 30 32 33 30" fill="${red}" stroke="${ink}" stroke-width="1"/>
    <path d="M29 28 C26 31 25 36 28 40" stroke="${redLight}" stroke-width="1.5" fill="none"/>
    <path d="M34 26 C38 29 40 37 37 42 C36 37 34 32 31 30" fill="${red}" stroke="${ink}" stroke-width="1"/>
    
    <!-- Gold Dragon Collar -->
    <path d="M27 24 L37 24" stroke="${gold}" stroke-width="3"/>
    <circle cx="32" cy="24" r="2" fill="${red}"/>
  `),

  // 八面玄鐵青釭劍
  sword: svg(`
    <!-- Handle -->
    <path d="M32 58 L32 20" stroke="${ink}" stroke-width="6"/>
    <path d="M32 58 L32 20" stroke="${woodDark}" stroke-width="3"/>
    <path d="M32 46 L32 55" stroke="${gold}" stroke-width="2"/>
    
    <!-- Han Dynasty Double-Edged Blade -->
    <path d="M32 2 L41 18 L32 32 L23 18 Z" fill="${inkSoft}" stroke="${ink}" stroke-width="2.5"/>
    <path d="M32 4 L39 18 L32 30 L25 18 Z" fill="${steel}"/>
    <!-- Blade Ridge & Highlights -->
    <path d="M32 4 L32 30" stroke="${steelShine}" stroke-width="2.5"/>
    <path d="M26 18 L38 18" stroke="${steelDark}" stroke-width="1"/>
    <path d="M32 4 L37 17 L32 28" fill="${steelLight}"/>
    
    <!-- Imperial Golden Crossguard -->
    <path d="M20 32 L44 32" stroke="${ink}" stroke-width="6"/>
    <path d="M20 32 L44 32" stroke="${gold}" stroke-width="3.5"/>
    <path d="M20 32 L23 28 M44 32 L41 28" stroke="${goldLight}" stroke-width="2"/>
    <!-- Inset Ruby -->
    <circle cx="32" cy="32" r="2.5" fill="${red}" stroke="${ink}" stroke-width="1"/>
    
    <!-- Imperial Dragon Pommel & Tassel -->
    <circle cx="32" cy="57" r="3.5" fill="${gold}" stroke="${ink}" stroke-width="1.5"/>
    <circle cx="32" cy="57" r="1.5" fill="${jade}"/>
    <path d="M32 60 Q29 63 28 64" stroke="${red}" stroke-width="2" fill="none"/>
    <path d="M32 60 Q35 63 36 64" stroke="${redLight}" stroke-width="1.5" fill="none"/>
  `)
};

fs.mkdirSync(outputDir, { recursive: true });
Promise.all(Object.entries(weapons).map(([id, markup]) => sharp(Buffer.from(markup)).webp({ lossless: true }).toFile(path.join(outputDir, `combat-weapon-${id}-v2.webp`))))
  .then(() => console.log(`Generated ${Object.keys(weapons).length} transparent combat weapons.`))
  .catch((error) => { console.error(error); process.exitCode = 1; });

