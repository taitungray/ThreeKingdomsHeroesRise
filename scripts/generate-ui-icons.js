"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const iconDir = path.join(root, "assets", "icons");

if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

const UI_ICONS = {
  // Resources
  "res-coin": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="21" fill="#8a6125" stroke="#4a320f" stroke-width="2"/>
  <circle cx="24" cy="24" r="18" fill="#d9a841"/>
  <circle cx="24" cy="24" r="15" fill="#f5cb5d"/>
  <rect x="17" y="17" width="14" height="14" rx="1" fill="#5c3f14" stroke="#d9a841" stroke-width="1.5"/>
  <rect x="19" y="19" width="10" height="10" fill="#291a08"/>
  <circle cx="24" cy="11" r="1.5" fill="#fff"/>
  <circle cx="11" cy="24" r="1.5" fill="#fff"/>
</svg>`,

  "res-food": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- Sack Base -->
  <path d="M12 20 Q10 44 24 44 Q38 44 36 20 Q32 16 24 16 Q16 16 12 20 Z" fill="#9e7b47" stroke="#473418" stroke-width="2"/>
  <path d="M15 22 Q13 41 24 41 Q35 41 33 22 Z" fill="#c7a267"/>
  <!-- Tied Rope -->
  <rect x="18" y="14" width="12" height="4" rx="2" fill="#d43728"/>
  <!-- Sack Top Opening & Wheat Ears -->
  <path d="M16 14 L12 8 L20 11 L24 6 L28 11 L36 8 L32 14 Z" fill="#e8c47d" stroke="#5c4420" stroke-width="1.5"/>
  <path d="M24 18 L24 38" stroke="#8a6733" stroke-width="2" stroke-dasharray="3,3"/>
</svg>`,

  "res-jade": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="20" fill="#1b523b" stroke="#0e2e21" stroke-width="2"/>
  <circle cx="24" cy="24" r="17" fill="#328a64"/>
  <circle cx="24" cy="24" r="14" fill="#5ac494"/>
  <circle cx="24" cy="24" r="7" fill="#0e2e21"/>
  <!-- Jade Carving Arc -->
  <path d="M24 8 A16 16 0 0 1 40 24" stroke="#a3f0cb" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="24" cy="24" r="5" fill="#1b523b"/>
  <circle cx="16" cy="16" r="2" fill="#fff" opacity="0.7"/>
</svg>`,

  "res-shard": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <polygon points="24,4 40,16 34,42 14,42 8,16" fill="#8f2b1d" stroke="#42110a" stroke-width="2"/>
  <polygon points="24,8 36,18 31,38 17,38 12,18" fill="#d94b36"/>
  <!-- Core Gem Facets -->
  <polygon points="24,8 31,18 24,34 17,18" fill="#ff7e6b"/>
  <polygon points="24,8 17,18 24,24" fill="#fff" opacity="0.6"/>
  <polygon points="24,34 31,38 24,40 17,38" fill="#8f2b1d"/>
</svg>`,

  // Nav Icons
  "nav-battle": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- Crossed Halberds / Swords -->
  <line x1="8" y1="40" x2="38" y2="10" stroke="#40342a" stroke-width="5" stroke-linecap="round"/>
  <line x1="8" y1="40" x2="38" y2="10" stroke="#d49e3d" stroke-width="3" stroke-linecap="round"/>
  <line x1="40" y1="40" x2="10" y2="10" stroke="#40342a" stroke-width="5" stroke-linecap="round"/>
  <line x1="40" y1="40" x2="10" y2="10" stroke="#d49e3d" stroke-width="3" stroke-linecap="round"/>
  <!-- Blades -->
  <polygon points="38,10 44,4 36,4" fill="#e8edf2" stroke="#242220" stroke-width="1.5"/>
  <polygon points="10,10 4,4 12,4" fill="#e8edf2" stroke="#242220" stroke-width="1.5"/>
  <!-- Center Shield / Seal -->
  <circle cx="24" cy="24" r="8" fill="#9e281b" stroke="#f5cb5d" stroke-width="2"/>
  <circle cx="24" cy="24" r="4" fill="#f5cb5d"/>
</svg>`,

  "nav-heroes": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- General Gold Helmet -->
  <path d="M10 28 C10 14 38 14 38 28 L34 36 L14 36 Z" fill="#8c611e" stroke="#382408" stroke-width="2"/>
  <path d="M12 27 C12 16 36 16 36 27 L32 34 L16 34 Z" fill="#d99f34"/>
  <!-- Brow Band & Red Feather Plume -->
  <rect x="12" y="26" width="24" height="6" fill="#fce588" stroke="#4a320a" stroke-width="1"/>
  <circle cx="24" cy="29" r="2.5" fill="#d93625"/>
  <path d="M24 16 Q30 4 36 6 Q30 10 24 16 Z" fill="#d93625"/>
  <path d="M24 16 Q18 4 12 6 Q18 10 24 16 Z" fill="#d93625"/>
  <rect x="22" y="14" width="4" height="6" fill="#fce588"/>
</svg>`,

  "nav-formation": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- 3x3 Tactical Board -->
  <rect x="6" y="6" width="36" height="36" rx="4" fill="#304732" stroke="#d9a841" stroke-width="2"/>
  <rect x="8" y="8" width="32" height="32" rx="2" fill="#1c2b1e"/>
  <!-- 9 Grid Points -->
  <circle cx="14" cy="14" r="3.5" fill="#d9a841"/>
  <circle cx="24" cy="14" r="3.5" fill="#f5cb5d"/>
  <circle cx="34" cy="14" r="3.5" fill="#d9a841"/>
  <circle cx="14" cy="24" r="3.5" fill="#f5cb5d"/>
  <circle cx="24" cy="24" r="5" fill="#d93625" stroke="#f5cb5d" stroke-width="1.5"/>
  <circle cx="34" cy="24" r="3.5" fill="#f5cb5d"/>
  <circle cx="14" cy="34" r="3.5" fill="#d9a841"/>
  <circle cx="24" cy="34" r="3.5" fill="#f5cb5d"/>
  <circle cx="34" cy="34" r="3.5" fill="#d9a841"/>
</svg>`,

  "nav-tactics": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- Bamboo Scroll -->
  <rect x="8" y="10" width="32" height="28" rx="2" fill="#8f6e3d" stroke="#3b2b14" stroke-width="2"/>
  <line x1="14" y1="10" x2="14" y2="38" stroke="#3b2b14" stroke-width="1.5"/>
  <line x1="20" y1="10" x2="20" y2="38" stroke="#3b2b14" stroke-width="1.5"/>
  <line x1="26" y1="10" x2="26" y2="38" stroke="#3b2b14" stroke-width="1.5"/>
  <line x1="32" y1="10" x2="32" y2="38" stroke="#3b2b14" stroke-width="1.5"/>
  <!-- Red Imperial Seal on Scroll -->
  <rect x="22" y="18" width="14" height="14" rx="2" fill="#a82319" stroke="#fad061" stroke-width="1.5"/>
  <rect x="25" y="21" width="8" height="8" fill="#fad061"/>
</svg>`,

  "nav-campaign": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- Ancient Map & Mountain Pass -->
  <rect x="6" y="8" width="36" height="32" rx="3" fill="#c4aa76" stroke="#47381e" stroke-width="2"/>
  <!-- Mountain contours -->
  <polygon points="10,32 18,18 26,32" fill="#695636"/>
  <polygon points="22,32 30,14 38,32" fill="#806840"/>
  <!-- Red Route & War Flag -->
  <path d="M12 36 Q24 28 34 16" stroke="#a82319" stroke-width="2.5" stroke-dasharray="3,2" fill="none"/>
  <circle cx="34" cy="16" r="3" fill="#a82319"/>
  <line x1="34" y1="16" x2="34" y2="6" stroke="#2b2011" stroke-width="1.5"/>
  <polygon points="34,6 42,9 34,12" fill="#d9a841"/>
</svg>`,

  // Right Rail & Drawer Function Icons
  "icon-settings": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="16" fill="#4d5357" stroke="#1f2224" stroke-width="2"/>
  <circle cx="24" cy="24" r="13" fill="#858f96"/>
  <circle cx="24" cy="24" r="6" fill="#1f2224"/>
  <!-- 8 Gear Teeth -->
  <rect x="22" y="4" width="4" height="6" fill="#858f96" stroke="#1f2224" stroke-width="1"/>
  <rect x="22" y="38" width="4" height="6" fill="#858f96" stroke="#1f2224" stroke-width="1"/>
  <rect x="4" y="22" width="6" height="4" fill="#858f96" stroke="#1f2224" stroke-width="1"/>
  <rect x="38" y="22" width="6" height="4" fill="#858f96" stroke="#1f2224" stroke-width="1"/>
</svg>`,

  "icon-mail": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect x="6" y="10" width="36" height="28" rx="3" fill="#d4bc8a" stroke="#4a3c20" stroke-width="2"/>
  <polygon points="6,10 24,26 42,10" fill="#edd6a6" stroke="#4a3c20" stroke-width="1.5"/>
  <polygon points="6,38 18,24 6,10" fill="#c4ab78"/>
  <polygon points="42,38 30,24 42,10" fill="#c4ab78"/>
  <!-- Red Wax Seal -->
  <circle cx="24" cy="26" r="5" fill="#a82319" stroke="#fce588" stroke-width="1.5"/>
</svg>`,

  "icon-daily": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect x="6" y="10" width="36" height="32" rx="3" fill="#edd6a6" stroke="#4a3c20" stroke-width="2"/>
  <rect x="6" y="10" width="36" height="10" rx="3" fill="#8f2b1d" stroke="#4a3c20" stroke-width="1.5"/>
  <!-- Calendar Clips -->
  <rect x="14" y="6" width="4" height="7" rx="1" fill="#fce588" stroke="#3d2b14" stroke-width="1"/>
  <rect x="30" y="6" width="4" height="7" rx="1" fill="#fce588" stroke="#3d2b14" stroke-width="1"/>
  <!-- Date Grid -->
  <circle cx="15" cy="26" r="2" fill="#524128"/>
  <circle cx="24" cy="26" r="2" fill="#524128"/>
  <circle cx="33" cy="26" r="2" fill="#524128"/>
  <circle cx="15" cy="34" r="2" fill="#524128"/>
  <circle cx="24" cy="34" r="3" fill="#a82319"/>
  <circle cx="33" cy="34" r="2" fill="#524128"/>
</svg>`,

  "icon-shop": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- Shop Pavilion Roof -->
  <path d="M4 18 L24 6 L44 18 L38 22 L10 22 Z" fill="#8f2b1d" stroke="#38130d" stroke-width="2"/>
  <polygon points="10,22 14,22 12,28" fill="#d9a841"/>
  <polygon points="18,22 22,22 20,28" fill="#d9a841"/>
  <polygon points="26,22 30,22 28,28" fill="#d9a841"/>
  <polygon points="34,22 38,22 36,28" fill="#d9a841"/>
  <!-- Shop Counter & Ingot -->
  <rect x="10" y="24" width="28" height="18" fill="#edd6a6" stroke="#4a3c20" stroke-width="2"/>
  <!-- Gold Ingot -->
  <path d="M18 36 L30 36 L34 31 L14 31 Z" fill="#fce588" stroke="#8a611e" stroke-width="1.5"/>
</svg>`,

  "icon-menu": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect x="6" y="6" width="36" height="36" rx="4" fill="#3d372e" stroke="#1f1b16" stroke-width="2"/>
  <rect x="10" y="12" width="28" height="5" rx="2" fill="#d9a841" stroke="#473413" stroke-width="1"/>
  <rect x="10" y="21" width="28" height="5" rx="2" fill="#d9a841" stroke="#473413" stroke-width="1"/>
  <rect x="10" y="30" width="28" height="5" rx="2" fill="#d9a841" stroke="#473413" stroke-width="1"/>
</svg>`,

  "icon-rank": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- 3-Tier Podium -->
  <rect x="6" y="24" width="11" height="18" fill="#8f6945" stroke="#3b2816" stroke-width="1.5"/>
  <rect x="18" y="14" width="12" height="28" fill="#d9a841" stroke="#523d13" stroke-width="1.5"/>
  <rect x="31" y="28" width="11" height="14" fill="#82573d" stroke="#3b2416" stroke-width="1.5"/>
  <!-- Crown on 1st place -->
  <path d="M19 12 L21 7 L24 10 L27 7 L29 12 Z" fill="#fce588" stroke="#523d13" stroke-width="1"/>
</svg>`,

  "icon-medal": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- Ribbon -->
  <polygon points="18,4 24,14 14,20" fill="#a82319"/>
  <polygon points="30,4 24,14 34,20" fill="#851912"/>
  <!-- Gold Medal -->
  <circle cx="24" cy="28" r="14" fill="#8c611e" stroke="#3b2609" stroke-width="1.5"/>
  <circle cx="24" cy="28" r="12" fill="#f5cb5d"/>
  <circle cx="24" cy="28" r="9" fill="#d99f34"/>
  <!-- Star -->
  <polygon points="24,21 26,26 31,26 27,29 29,34 24,31 19,34 21,29 17,26 22,26" fill="#fff"/>
</svg>`,

  "icon-scroll": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <path d="M10 8 Q24 14 38 8 L38 38 Q24 44 10 38 Z" fill="#edd6a6" stroke="#4a3c20" stroke-width="2"/>
  <path d="M8 6 Q10 2 12 6 L12 36 Q10 40 8 36 Z" fill="#c4aa76" stroke="#4a3c20" stroke-width="1.5"/>
  <path d="M36 6 Q38 2 40 6 L40 36 Q38 40 36 36 Z" fill="#c4aa76" stroke="#4a3c20" stroke-width="1.5"/>
  <!-- Writing Lines -->
  <line x1="16" y1="16" x2="32" y2="16" stroke="#695333" stroke-width="2" stroke-linecap="round"/>
  <line x1="16" y1="22" x2="32" y2="22" stroke="#695333" stroke-width="2" stroke-linecap="round"/>
  <line x1="16" y1="28" x2="26" y2="28" stroke="#695333" stroke-width="2" stroke-linecap="round"/>
</svg>`,

  "icon-flag": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- Flagpole -->
  <line x1="10" y1="6" x2="10" y2="44" stroke="#4a3820" stroke-width="3" stroke-linecap="round"/>
  <circle cx="10" cy="6" r="2.5" fill="#f5cb5d"/>
  <!-- Tiger Banner -->
  <polygon points="12,8 40,16 12,28" fill="#a82319" stroke="#420e09" stroke-width="1.5"/>
  <polygon points="12,12 32,17 12,24" fill="#d94b36"/>
  <!-- Gold Fringe -->
  <line x1="40" y1="16" x2="44" y2="18" stroke="#f5cb5d" stroke-width="2"/>
</svg>`,

  "icon-book": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- Ancient Blue Cloth Book Binding -->
  <rect x="8" y="6" width="32" height="36" rx="2" fill="#244d70" stroke="#12273b" stroke-width="2"/>
  <!-- White Silk Book Label -->
  <rect x="12" y="10" width="8" height="26" rx="1" fill="#f7f5eb" stroke="#a89f89" stroke-width="1"/>
  <!-- Stitched Thread Spines -->
  <line x1="34" y1="6" x2="34" y2="42" stroke="#e8dfcb" stroke-width="1.5"/>
  <line x1="34" y1="14" x2="40" y2="14" stroke="#e8dfcb" stroke-width="1.5"/>
  <line x1="34" y1="24" x2="40" y2="24" stroke="#e8dfcb" stroke-width="1.5"/>
  <line x1="34" y1="34" x2="40" y2="34" stroke="#e8dfcb" stroke-width="1.5"/>
</svg>`,

  "icon-tower": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- Multi-tier Pagoda / Watchtower -->
  <polygon points="24,4 12,14 36,14" fill="#8f2b1d" stroke="#3b110b" stroke-width="1.5"/>
  <rect x="16" y="14" width="16" height="8" fill="#edd6a6" stroke="#4a3c20" stroke-width="1.5"/>
  <polygon points="24,18 8,26 40,26" fill="#8f2b1d" stroke="#3b110b" stroke-width="1.5"/>
  <rect x="14" y="26" width="20" height="9" fill="#edd6a6" stroke="#4a3c20" stroke-width="1.5"/>
  <polygon points="24,30 6,37 42,37" fill="#8f2b1d" stroke="#3b110b" stroke-width="1.5"/>
  <rect x="12" y="37" width="24" height="7" fill="#695636" stroke="#3b2b14" stroke-width="1.5"/>
</svg>`,

  "icon-arena": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- Crossed War Spears on Ring -->
  <circle cx="24" cy="24" r="18" fill="#42251d" stroke="#8c3826" stroke-width="2"/>
  <circle cx="24" cy="24" r="14" fill="#1f1411"/>
  <line x1="10" y1="38" x2="38" y2="10" stroke="#f5cb5d" stroke-width="3" stroke-linecap="round"/>
  <line x1="38" y1="38" x2="10" y2="10" stroke="#f5cb5d" stroke-width="3" stroke-linecap="round"/>
  <!-- Dragon / Tiger Crest -->
  <circle cx="24" cy="24" r="6" fill="#a82319" stroke="#f5cb5d" stroke-width="1.5"/>
</svg>`,

  "icon-dungeon": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- Dungeon Stone Gate / Cave -->
  <path d="M8 42 L8 18 Q24 4 40 18 L40 42 Z" fill="#2d332f" stroke="#171a18" stroke-width="2"/>
  <path d="M14 42 L14 22 Q24 12 34 22 L34 42 Z" fill="#0f1210"/>
  <!-- Iron Gate Bars & Torches -->
  <line x1="20" y1="18" x2="20" y2="42" stroke="#8a948e" stroke-width="1.5"/>
  <line x1="28" y1="18" x2="28" y2="42" stroke="#8a948e" stroke-width="1.5"/>
  <line x1="14" y1="28" x2="34" y2="28" stroke="#8a948e" stroke-width="1.5"/>
  <!-- Red Dungeon Eye / Flame -->
  <circle cx="24" cy="24" r="3.5" fill="#d93b2b"/>
  <circle cx="24" cy="24" r="1.5" fill="#ffef8a"/>
</svg>`,

  "res-exp": `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <!-- Purple / Gold Elixir Pill -->
  <circle cx="24" cy="24" r="18" fill="#4d1b59" stroke="#25092e" stroke-width="2"/>
  <circle cx="24" cy="24" r="15" fill="#84329b"/>
  <circle cx="24" cy="24" r="12" fill="#b147d1"/>
  <!-- Golden Daoist Ring & Aura -->
  <ellipse cx="24" cy="24" rx="16" ry="6" fill="none" stroke="#f5cb5d" stroke-width="2" transform="rotate(-25 24 24)"/>
  <circle cx="20" cy="18" r="3" fill="#fff" opacity="0.65"/>
</svg>`,

  "slot-weapon": `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect x="4" y="4" width="56" height="56" rx="4" fill="#2b2319" stroke="#6e5634" stroke-width="2"/>
  <path d="M16 48 L44 16 L48 20 L20 52 Z" fill="#9e8054" opacity="0.4"/>
  <polygon points="44,16 52,12 48,20" fill="#d9a841"/>
  <line x1="14" y1="50" x2="48" y2="16" stroke="#d9a841" stroke-width="2" stroke-linecap="round"/>
</svg>`,

  "slot-armor": `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect x="4" y="4" width="56" height="56" rx="4" fill="#2b2319" stroke="#6e5634" stroke-width="2"/>
  <path d="M20 16 L32 22 L44 16 L48 30 L40 48 L24 48 L16 30 Z" fill="#9e8054" opacity="0.4" stroke="#d9a841" stroke-width="2"/>
  <circle cx="32" cy="32" r="4" fill="#d9a841"/>
</svg>`,

  "slot-mount": `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect x="4" y="4" width="56" height="56" rx="4" fill="#2b2319" stroke="#6e5634" stroke-width="2"/>
  <!-- Horseshoe / War Mount Silhouette -->
  <path d="M20 44 C16 34 16 20 32 20 C48 20 48 34 44 44 L38 42 C40 34 38 28 32 28 C26 28 24 34 26 42 Z" fill="#d9a841" opacity="0.5"/>
  <circle cx="32" cy="24" r="3" fill="#f5cb5d"/>
</svg>`,

  "slot-accessory": `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect x="4" y="4" width="56" height="56" rx="4" fill="#2b2319" stroke="#6e5634" stroke-width="2"/>
  <!-- Jade Pendant Silhouette -->
  <circle cx="32" cy="28" r="12" fill="none" stroke="#d9a841" stroke-width="3" opacity="0.6"/>
  <circle cx="32" cy="28" r="5" fill="#d9a841" opacity="0.8"/>
  <line x1="32" y1="40" x2="32" y2="52" stroke="#d93b2b" stroke-width="3" stroke-linecap="round"/>
</svg>`,

  "seal-taoyuan": `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <!-- Ancient Imperial Cinnabar Seal -->
  <rect x="6" y="6" width="84" height="84" rx="10" fill="#872318" stroke="#f5cb5d" stroke-width="4"/>
  <rect x="12" y="12" width="72" height="72" rx="6" fill="#66140b" stroke="#f5cb5d" stroke-width="1.5"/>
  <!-- Stylized Seal Character 桃 -->
  <path d="M28 24 L28 72 M18 42 L38 42 M18 34 L28 42 M20 62 L38 48" stroke="#f5cb5d" stroke-width="4" stroke-linecap="round"/>
  <path d="M50 24 L74 24 M62 24 L62 40 M48 40 L76 40 M54 48 L70 48 M48 56 L76 56 M62 56 L62 76 M46 64 L56 76 M78 64 L68 76" stroke="#f5cb5d" stroke-width="3.5" stroke-linecap="round"/>
</svg>`,

  "seal-victory": `
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="58" fill="#8f2015" stroke="#fce588" stroke-width="5"/>
  <circle cx="64" cy="64" r="50" fill="none" stroke="#fce588" stroke-width="2" stroke-dasharray="6,4"/>
  <!-- 大捷 (Victory) Ancient Seal Calligraphy -->
  <text x="64" y="76" font-family="'DFKai-SB', 'KaiTi', serif" font-size="44" font-weight="bold" fill="#fce588" text-anchor="middle" letter-spacing="4">大捷</text>
</svg>`
};

async function main() {
  for (const [name, svg] of Object.entries(UI_ICONS)) {
    const dest = path.join(iconDir, `${name}.webp`);
    const size = name.startsWith("slot-") ? 64 : name.startsWith("seal-") ? 96 : 48;
    await sharp(Buffer.from(svg.trim()))
      .resize(size, size)
      .webp({ quality: 95, lossless: true })
      .toFile(dest);
    console.log(`Generated ${name}.webp (${size}x${size})`);
  }
  console.log("All UI icons generated successfully!");
}

main().catch(console.error);
