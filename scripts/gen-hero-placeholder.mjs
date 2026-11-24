// Generates src/assets/img/hero.jpg — a PLACEHOLDER for the first-screen photo.
// Abstract, text-free tonal composition in the brand palette that suggests a
// kitchen with an island in soft morning light. Replace with the approved stock
// photo (see credits.md, TODO-asset). Usage: node scripts/gen-hero-placeholder.mjs
import sharp from 'sharp';

const W = 2400;
const H = 1600;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="0.35">
      <stop offset="0" stop-color="#efe8dc"/>
      <stop offset="0.55" stop-color="#e2d9ca"/>
      <stop offset="1" stop-color="#cfc4b2"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b9a68c"/>
      <stop offset="1" stop-color="#8f7a60"/>
    </linearGradient>
    <linearGradient id="oak" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9a7a5a"/>
      <stop offset="0.5" stop-color="#86694c"/>
      <stop offset="1" stop-color="#6e553d"/>
    </linearGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f1ebdf"/>
      <stop offset="1" stop-color="#d9cfbd"/>
    </linearGradient>
    <linearGradient id="tall" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#d2c4ac"/>
      <stop offset="1" stop-color="#b8a88d"/>
    </linearGradient>
    <linearGradient id="shaft" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fffaf0" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#fffaf0" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.45" cy="0.4" r="0.85">
      <stop offset="0.55" stop-color="#24221f" stop-opacity="0"/>
      <stop offset="1" stop-color="#24221f" stop-opacity="0.35"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="60"/></filter>
    <filter id="shadow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#wall)"/>
  <!-- window glow, left -->
  <rect x="120" y="90" width="760" height="980" fill="#fbf7ee" filter="url(#soft)"/>
  <rect x="200" y="160" width="600" height="840" fill="#fffdf7" opacity="0.7"/>
  <rect x="496" y="160" width="8" height="840" fill="#d9d0c1" opacity="0.6"/>
  <rect x="880" y="930" width="700" height="60" fill="#d7ccb9"/>
  <rect x="880" y="990" width="700" height="260" fill="#bfae94"/>
  <!-- tall cabinetry, right -->
  <rect x="1580" y="120" width="820" height="1130" fill="url(#tall)"/>
  <rect x="1850" y="120" width="3" height="1130" fill="#a8977c" opacity="0.7"/>
  <rect x="2120" y="120" width="3" height="1130" fill="#a8977c" opacity="0.7"/>
  <!-- floor -->
  <rect x="0" y="1250" width="${W}" height="350" fill="url(#floor)"/>
  <!-- light shaft across the room -->
  <polygon points="200,160 800,160 1900,1600 700,1600" fill="url(#shaft)" filter="url(#soft)" opacity="0.55"/>
  <!-- pendants -->
  <rect x="1059" y="0" width="3" height="560" fill="#3a3631"/>
  <rect x="1459" y="0" width="3" height="520" fill="#3a3631"/>
  <path d="M1000 600 Q1060 520 1120 600 Z" fill="#2f2c28"/>
  <path d="M1400 560 Q1460 480 1520 560 Z" fill="#2f2c28"/>
  <!-- island shadow -->
  <ellipse cx="1260" cy="1520" rx="820" ry="60" fill="#3b3128" opacity="0.55" filter="url(#shadow)"/>
  <!-- island: oak body and travertine top -->
  <rect x="460" y="1080" width="1600" height="430" fill="url(#oak)"/>
  <rect x="460" y="1080" width="1600" height="40" fill="#5d4733" opacity="0.35"/>
  <rect x="430" y="1020" width="1660" height="64" fill="url(#stone)"/>
  <rect x="430" y="1020" width="1660" height="6" fill="#fffaf0" opacity="0.8"/>
  <!-- objects on the island -->
  <ellipse cx="900" cy="1000" rx="70" ry="22" fill="#d9cfbd"/>
  <rect x="1500" y="930" width="46" height="92" rx="10" fill="#6f7a5a"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;

await sharp(Buffer.from(svg))
  .blur(3) // soften hard edges: reads as an out-of-focus interior, not a diagram
  .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:4:4' })
  .toFile('src/assets/img/hero.jpg');

const meta = await sharp('src/assets/img/hero.jpg').metadata();
console.log(`hero.jpg ${meta.width}×${meta.height}`);
