const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const outputDir = path.join(__dirname, "..", "assets", "characters");
const ink = "#241c18";
const steel = "#dce4dd";
const steelLight = "#f5f0d8";
const wood = "#76502e";
const gold = "#e5b443";
const jade = "#78ac98";
const red = "#b74439";

function svg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" shape-rendering="crispEdges">
    <g stroke-linecap="round" stroke-linejoin="round">${body}</g>
  </svg>`;
}

const weapons = {
  twin: svg(`
    <path d="M31 55 L19 19 L24 17 L35 51" fill="none" stroke="${ink}" stroke-width="4"/>
    <path d="M31 55 L19 19 L24 17 L35 51" fill="none" stroke="${steel}" stroke-width="2"/>
    <path d="M34 55 L45 16 L40 15 L30 51" fill="none" stroke="${ink}" stroke-width="4"/>
    <path d="M34 55 L45 16 L40 15 L30 51" fill="none" stroke="${steelLight}" stroke-width="2"/>
    <path d="M24 47 L36 47 M24 51 L36 51" stroke="${gold}" stroke-width="2"/>
  `),
  guandao: svg(`
    <path d="M32 55 L29 22" stroke="${ink}" stroke-width="5"/>
    <path d="M32 55 L29 22" stroke="${wood}" stroke-width="2.5"/>
    <path d="M28 25 C17 22 13 15 17 8 C23 12 32 15 35 23 C35 28 31 31 26 31 Z" fill="${ink}"/>
    <path d="M28 24 C19 21 16 16 18 11 C24 14 30 17 33 23 C32 26 30 28 26 29 Z" fill="${jade}"/>
    <path d="M20 13 C24 16 28 18 31 22" fill="none" stroke="${steelLight}" stroke-width="1.5"/>
    <path d="M25 31 L33 31" stroke="${gold}" stroke-width="2"/>
  `),
  serpent: svg(`
    <path d="M32 55 L29 24" stroke="${ink}" stroke-width="5"/>
    <path d="M32 55 L29 24" stroke="${wood}" stroke-width="2.5"/>
    <path d="M29 27 C20 24 17 19 21 15 C25 19 31 19 34 15 C38 19 35 25 29 27 Z" fill="${ink}"/>
    <path d="M29 25 C23 23 21 20 23 18 C27 21 31 20 34 18 C35 21 33 24 29 25 Z" fill="${red}"/>
    <path d="M27 17 C29 13 33 12 36 14 C34 16 32 18 30 20" fill="none" stroke="${steel}" stroke-width="2"/>
  `),
  lance: svg(`
    <path d="M32 55 L32 14" stroke="${ink}" stroke-width="4"/>
    <path d="M32 55 L32 14" stroke="${wood}" stroke-width="2"/>
    <path d="M32 7 L39 18 L32 24 L25 18 Z" fill="${ink}"/>
    <path d="M32 9 L37 18 L32 21 L27 18 Z" fill="${steelLight}"/>
    <path d="M27 18 L20 20 M37 18 L44 20" stroke="${jade}" stroke-width="2"/>
    <path d="M27 24 L37 24" stroke="${gold}" stroke-width="2"/>
  `),
  bow: svg(`
    <path d="M18 10 Q47 32 18 54" fill="none" stroke="${ink}" stroke-width="5"/>
    <path d="M18 10 Q43 32 18 54" fill="none" stroke="${wood}" stroke-width="2.5"/>
    <path d="M18 10 L18 54" stroke="${steelLight}" stroke-width="1.5"/>
    <path d="M18 32 L45 32" stroke="${ink}" stroke-width="3"/>
    <path d="M18 32 L45 32" stroke="${steelLight}" stroke-width="1"/>
    <path d="M18 28 L18 36" stroke="${gold}" stroke-width="2"/>
  `),
  fan: svg(`
    <path d="M32 55 L29 39" stroke="${ink}" stroke-width="4"/>
    <path d="M32 55 L29 39" stroke="${wood}" stroke-width="2"/>
    <path d="M29 40 C19 35 16 23 19 13 C30 14 41 17 48 25 C44 34 37 39 29 40 Z" fill="${ink}"/>
    <path d="M29 37 C22 33 20 25 21 16 C30 17 39 19 45 25 C41 31 35 35 29 37 Z" fill="${steelLight}"/>
    <path d="M22 17 L29 37 M28 17 L31 36 M35 19 L34 34 M41 22 L37 31" fill="none" stroke="${jade}" stroke-width="1.5"/>
    <path d="M27 40 L34 40" stroke="${gold}" stroke-width="2"/>
  `),
  rings: svg(`
    <path d="M32 55 L30 38" stroke="${ink}" stroke-width="4"/>
    <path d="M32 55 L30 38" stroke="${wood}" stroke-width="2"/>
    <circle cx="26" cy="25" r="9" fill="none" stroke="${ink}" stroke-width="4"/>
    <circle cx="26" cy="25" r="9" fill="none" stroke="#e97bad" stroke-width="2"/>
    <circle cx="40" cy="21" r="8" fill="none" stroke="${ink}" stroke-width="4"/>
    <circle cx="40" cy="21" r="8" fill="none" stroke="#f1b3d0" stroke-width="2"/>
    <path d="M27 39 L34 39" stroke="${gold}" stroke-width="2"/>
  `),
  halberd: svg(`
    <path d="M32 55 L32 19" stroke="${ink}" stroke-width="5"/>
    <path d="M32 55 L32 19" stroke="${wood}" stroke-width="2.5"/>
    <path d="M32 20 C42 14 50 16 49 25 C45 25 40 28 35 31 L28 27 Z" fill="${ink}"/>
    <path d="M33 21 C41 17 46 18 46 23 C42 24 38 26 34 29 L30 26 Z" fill="${gold}"/>
    <path d="M33 31 L43 33" stroke="${red}" stroke-width="2"/>
  `),
  sword: svg(`
    <path d="M32 55 L32 19" stroke="${ink}" stroke-width="5"/>
    <path d="M32 55 L32 19" stroke="${wood}" stroke-width="2.5"/>
    <path d="M32 7 L39 21 L32 31 L25 21 Z" fill="${ink}"/>
    <path d="M32 10 L36 21 L32 27 L28 21 Z" fill="${steelLight}"/>
    <path d="M24 31 L40 31" stroke="${gold}" stroke-width="2"/>
  `)
};

fs.mkdirSync(outputDir, { recursive: true });
Promise.all(Object.entries(weapons).map(([id, markup]) => sharp(Buffer.from(markup)).webp({ lossless: true }).toFile(path.join(outputDir, `combat-weapon-${id}-v2.webp`))))
  .then(() => console.log(`Generated ${Object.keys(weapons).length} transparent combat weapons.`))
  .catch((error) => { console.error(error); process.exitCode = 1; });
