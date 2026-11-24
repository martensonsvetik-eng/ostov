// Generates local placeholder images for blocks 3, 4 and 7 (Collections, Materials, architect portrait).
// No downloads: warm tonal abstract compositions in the brief.md §6 palette that
// hint at each collection's character, and texture-like macro frames for the
// four materials. All are TODO-asset in credits.md: collection photos will be
// replaced with approved stock, material frames with the client's generated macro.
// Deterministic (seeded noise), so re-running gives identical files.
// Usage: node scripts/gen-placeholder-images.mjs [file-prefix]
//   e.g. `node scripts/gen-placeholder-images.mjs people/` regenerates only the portrait.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/assets/img/', import.meta.url));

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Grey noise as a PNG; `sx`/`sy` stretch it into streaks (wood grain, brushed metal). */
async function noise(w, h, seed, { sx = 1, sy = 1, blur = 0 } = {}) {
  const nw = Math.max(1, Math.round(w / sx));
  const nh = Math.max(1, Math.round(h / sy));
  const r = rng(seed);
  const buf = Buffer.alloc(nw * nh);
  for (let i = 0; i < buf.length; i++) buf[i] = Math.round(r() * 255);
  let img = sharp(buf, { raw: { width: nw, height: nh, channels: 1 } }).resize(w, h, { fit: 'fill', kernel: 'cubic' });
  if (blur) img = sharp(await img.png().toBuffer()).blur(blur);
  return img.png().toBuffer();
}

/** SVG → JPEG with a soft grain/texture overlay. */
async function render(file, w, h, svg, layers = []) {
  // Texture layers, then a fine film grain on everything.
  const all = [...layers, { seed: w * 7 + h, blend: 'soft-light', strength: 0.3, blur: 0.7 }];
  let base = await sharp(Buffer.from(svg)).resize(w, h).png().toBuffer();
  for (const l of all) {
    const tex = await noise(w, h, l.seed, l);
    const strength = l.strength ?? 0.5;
    const mixed = await sharp(base).composite([{ input: tex, blend: l.blend ?? 'overlay' }]).png().toBuffer();
    // Mix `mixed` over `base` at `strength` (sharp has no per-layer opacity).
    const alpha = await sharp({
      create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: strength } },
    })
      .png()
      .toBuffer();
    const top = await sharp(mixed).ensureAlpha().composite([{ input: alpha, blend: 'dest-in' }]).png().toBuffer();
    base = await sharp(base).composite([{ input: top }]).png().toBuffer();
  }
  const out = `${root}${file}`;
  const info = await sharp(base).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
  console.log(`${file}  ${w}×${h}  ${(info.size / 1024).toFixed(0)} KB`);
}

const svgWrap = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}<filter id="soft"><feGaussianBlur stdDeviation="2"/></filter><filter id="haze"><feGaussianBlur stdDeviation="40"/></filter></defs>${body}</svg>`;

// Light from the left, as in the hero photo: a warm wash fading right.
const light = (a = 0.35) =>
  `<linearGradient id="light" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="#fff6e6" stop-opacity="${a}"/><stop offset="0.6" stop-color="#fff6e6" stop-opacity="0"/></linearGradient>`;

/* ---------- Collections: covers 4:5, details 3:2 ---------- */
const CW = 1600, CH = 2000, DW = 1800, DH = 1200;

const collections = {
  // Тихая геометрия: graphite planes, flush fronts with shadow-gap handles, oak worktop.
  'geometry-cover': [CW, CH, svgWrap(CW, CH, `
    <rect width="${CW}" height="${CH}" fill="#d9d3c7"/>
    <rect x="0" y="0" width="${CW}" height="760" fill="#cfc8ba"/>
    <rect x="980" y="120" width="520" height="560" fill="#ebe6dc"/>
    <rect x="0" y="1060" width="${CW}" height="70" fill="url(#oak)"/>
    <rect x="0" y="1130" width="${CW}" height="870" fill="#3a3834"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${i * 400}" y="1130" width="396" height="870" fill="${i % 2 ? '#3d3b37' : '#383632'}"/><rect x="${i * 400}" y="1150" width="396" height="10" fill="#22201d"/>`).join('')}
    <rect x="120" y="1000" width="260" height="60" fill="#a88a63" opacity="0.6"/>
    <rect width="${CW}" height="${CH}" fill="url(#light)"/>`,
    `<linearGradient id="oak" x1="0" x2="1"><stop offset="0" stop-color="#b89670"/><stop offset="1" stop-color="#9c7a54"/></linearGradient>${light(0.4)}`)],
  'geometry-detail-1': [DW, DH, svgWrap(DW, DH, `
    <rect width="${DW}" height="${DH}" fill="#3b3935"/>
    ${[0, 1, 2].map((i) => `<rect x="0" y="${i * 400}" width="${DW}" height="392" fill="${['#403e3a', '#3a3834', '#36342f'][i]}"/><rect x="0" y="${i * 400 + 392}" width="${DW}" height="8" fill="#1d1b19"/>`).join('')}
    <rect x="0" y="0" width="${DW}" height="120" fill="url(#oak)"/>
    <rect width="${DW}" height="${DH}" fill="url(#light)"/>`,
    `<linearGradient id="oak" x1="0" x2="1"><stop offset="0" stop-color="#c09d76"/><stop offset="1" stop-color="#a07e58"/></linearGradient>${light(0.3)}`), [{ seed: 11, sx: 40, sy: 1, strength: 0.25 }]],
  'geometry-detail-2': [DW, DH, svgWrap(DW, DH, `
    <rect width="${DW}" height="${DH}" fill="#b39069"/>
    <rect x="0" y="760" width="${DW}" height="440" fill="#3a3834"/>
    <rect x="0" y="760" width="${DW}" height="14" fill="#1f1d1a"/>
    <rect x="1180" y="0" width="620" height="760" fill="#cfc8ba" opacity="0.5"/>
    <rect width="${DW}" height="${DH}" fill="url(#light)"/>`, light(0.3)), [{ seed: 12, sx: 60, sy: 2, strength: 0.6 }]],

  // Тёплый модерн: walnut, soft radii, brass.
  'modern-cover': [CW, CH, svgWrap(CW, CH, `
    <rect width="${CW}" height="${CH}" fill="#e2d6c4"/>
    <path d="M200 900 V420 a400 400 0 0 1 800 0 V900 Z" fill="#d2c2aa"/>
    <circle cx="1210" cy="430" r="140" fill="none" stroke="#b08a4a" stroke-width="10"/>
    <rect x="1200" y="0" width="20" height="290" fill="#b08a4a"/>
    <rect x="80" y="1080" width="1440" height="920" rx="180" fill="url(#walnut)"/>
    <rect x="80" y="1040" width="1440" height="80" rx="40" fill="#efe6d8"/>
    <rect x="240" y="1300" width="1120" height="12" rx="6" fill="#b89150"/>
    <rect width="${CW}" height="${CH}" fill="url(#light)"/>`,
    `<linearGradient id="walnut" x1="0" x2="1"><stop offset="0" stop-color="#6e4a33"/><stop offset="1" stop-color="#553624"/></linearGradient>${light(0.35)}`), [{ seed: 21, sx: 50, sy: 1.5, strength: 0.35 }]],
  'modern-detail-1': [DW, DH, svgWrap(DW, DH, `
    <rect width="${DW}" height="${DH}" fill="#e5dac9"/>
    <rect x="-200" y="380" width="1700" height="1000" rx="320" fill="url(#walnut)"/>
    <rect x="200" y="640" width="900" height="14" rx="7" fill="#c19a57"/>
    <rect width="${DW}" height="${DH}" fill="url(#light)"/>`,
    `<linearGradient id="walnut" x1="0" x2="1"><stop offset="0" stop-color="#734d35"/><stop offset="1" stop-color="#4f3221"/></linearGradient>${light(0.3)}`), [{ seed: 22, sx: 50, sy: 1.5, strength: 0.4 }]],
  'modern-detail-2': [DW, DH, svgWrap(DW, DH, `
    <rect width="${DW}" height="${DH}" fill="#5a3b28"/>
    <circle cx="1150" cy="560" r="300" fill="url(#brass)"/>
    <circle cx="1150" cy="560" r="300" fill="none" stroke="#7c5d2c" stroke-width="6"/>
    <rect x="1140" y="0" width="20" height="260" fill="#a9874a"/>
    <path d="M0 1200 V900 a300 300 0 0 1 300 -300 H700 V1200 Z" fill="#e5dac9" opacity="0.9"/>
    <rect width="${DW}" height="${DH}" fill="url(#light)"/>`,
    `<radialGradient id="brass" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#e3c487"/><stop offset="0.55" stop-color="#b48d4c"/><stop offset="1" stop-color="#7e5e2d"/></radialGradient>${light(0.25)}`), [{ seed: 23, sx: 50, sy: 1.5, strength: 0.3 }]],

  // Неоклассика: panelled ivory fronts, hand-painted, marble.
  'neoclassic-cover': [CW, CH, svgWrap(CW, CH, `
    <rect width="${CW}" height="${CH}" fill="#e9e4d8"/>
    ${[0, 1, 2].map((i) => `<rect x="${140 + i * 460}" y="160" width="400" height="700" fill="#efebe1" stroke="#d4cdbd" stroke-width="6"/><rect x="${180 + i * 460}" y="200" width="320" height="620" fill="none" stroke="#d9d2c3" stroke-width="10"/>`).join('')}
    <rect x="0" y="1050" width="${CW}" height="90" fill="url(#marble)"/>
    <path d="M0 1080 C300 1060 500 1120 820 1090 S1300 1060 1600 1100" stroke="#b9b3a8" stroke-width="3" fill="none"/>
    <rect x="0" y="1140" width="${CW}" height="860" fill="#ece7dc"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${i * 400 + 30}" y="1200" width="340" height="740" fill="#f0ece2" stroke="#d6cfc0" stroke-width="6"/><rect x="${i * 400 + 70}" y="1240" width="260" height="660" fill="none" stroke="#dcd5c6" stroke-width="10"/>`).join('')}
    <rect width="${CW}" height="${CH}" fill="url(#light)"/>`,
    `<linearGradient id="marble" x1="0" x2="1"><stop offset="0" stop-color="#f3f1ec"/><stop offset="1" stop-color="#dcd8cf"/></linearGradient>${light(0.3)}`)],
  'neoclassic-detail-1': [DW, DH, svgWrap(DW, DH, `
    <rect width="${DW}" height="${DH}" fill="#e8e3d6"/>
    <rect x="160" y="120" width="1480" height="960" fill="#eeeadf" stroke="#cfc8b8" stroke-width="10"/>
    <rect x="260" y="220" width="1280" height="760" fill="none" stroke="#d7d0c0" stroke-width="26"/>
    <rect x="300" y="260" width="1200" height="680" fill="none" stroke="#c8c1b0" stroke-width="4"/>
    <rect width="${DW}" height="${DH}" fill="url(#light)"/>`, light(0.35))],
  'neoclassic-detail-2': [DW, DH, svgWrap(DW, DH, `
    <rect width="${DW}" height="${DH}" fill="#efede7"/>
    <g filter="url(#soft)" fill="none" stroke-linecap="round">
      <path d="M-40 300 C400 260 600 520 1000 470 S1500 300 1880 420" stroke="#a9a397" stroke-width="5"/>
      <path d="M-40 760 C300 700 640 900 980 820 S1500 700 1880 860" stroke="#b6b0a5" stroke-width="3"/>
      <path d="M600 -40 C640 300 520 600 700 900 S760 1150 720 1240" stroke="#bdb7ac" stroke-width="2"/>
      <path d="M1300 -40 C1260 260 1420 500 1340 760" stroke="#aca69a" stroke-width="2.5"/>
    </g>
    <rect width="${DW}" height="${DH}" fill="url(#light)"/>`, light(0.2)), [{ seed: 33, sx: 3, sy: 3, blur: 6, strength: 0.5 }]],
};

/* ---------- Materials: 4:5 macro frames ---------- */
const MW = 1200, MH = 1500;
const materials = {
  oak: [MW, MH, svgWrap(MW, MH, `<rect width="${MW}" height="${MH}" fill="url(#g)"/>`,
    `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c7a47a"/><stop offset="1" stop-color="#9a764f"/></linearGradient>`),
    [{ seed: 41, sx: 1.5, sy: 120, strength: 0.5 }, { seed: 42, sx: 6, sy: 300, strength: 0.4 }]],
  travertine: [MW, MH, svgWrap(MW, MH, `
    <rect width="${MW}" height="${MH}" fill="#d9cdb8"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="0" y="${i * 170 + 20}" width="${MW}" height="${40 + (i % 3) * 22}" fill="${i % 2 ? '#cdbfa6' : '#e2d7c4'}" opacity="0.7"/>`).join('')}
    ${(() => { const r = rng(43); return Array.from({ length: 160 }, () => `<ellipse cx="${(r() * MW).toFixed(0)}" cy="${(r() * MH).toFixed(0)}" rx="${(4 + r() * 22).toFixed(0)}" ry="${(2 + r() * 5).toFixed(0)}" fill="#8e7f68" opacity="${(0.35 + r() * 0.4).toFixed(2)}"/>`).join(''); })()}`),
    [{ seed: 44, sx: 8, sy: 2, blur: 1, strength: 0.55 }]],
  brass: [MW, MH, svgWrap(MW, MH, `
    <rect width="${MW}" height="${MH}" fill="url(#b)"/>
    <ellipse cx="380" cy="420" rx="520" ry="260" fill="#f6dfa8" opacity="0.35" filter="url(#haze)"/>
    ${(() => { const r = rng(45); return Array.from({ length: 14 }, () => `<circle cx="${(r() * MW).toFixed(0)}" cy="${(r() * MH).toFixed(0)}" r="${(30 + r() * 120).toFixed(0)}" fill="#6f5a33" opacity="${(0.08 + r() * 0.12).toFixed(2)}" filter="url(#haze)"/>`).join(''); })()}`,
    `<linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9b66f"/><stop offset="0.5" stop-color="#b48e4a"/><stop offset="1" stop-color="#7f6230"/></linearGradient>`),
    [{ seed: 46, sx: 200, sy: 1, strength: 0.5 }]],
  hardware: [MW, MH, svgWrap(MW, MH, `
    <rect width="${MW}" height="${MH}" fill="#2e2c29"/>
    <rect x="160" y="300" width="880" height="900" rx="28" fill="url(#m)"/>
    <rect x="220" y="380" width="760" height="120" rx="60" fill="#56534d"/>
    <circle cx="600" cy="820" r="170" fill="url(#c)"/>
    <circle cx="600" cy="820" r="60" fill="#3a3834"/>
    <rect x="260" y="1060" width="680" height="40" rx="20" fill="#6a665e"/>
    <circle cx="300" cy="640" r="22" fill="#2a2825"/><circle cx="900" cy="640" r="22" fill="#2a2825"/>
    <ellipse cx="420" cy="480" rx="380" ry="160" fill="#ffffff" opacity="0.08" filter="url(#haze)"/>`,
    `<linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b877e"/><stop offset="1" stop-color="#4a4741"/></linearGradient><radialGradient id="c" cx="0.35" cy="0.3"><stop offset="0" stop-color="#a39e93"/><stop offset="1" stop-color="#55524b"/></radialGradient>`),
    [{ seed: 47, sx: 120, sy: 1, strength: 0.3 }]],
};

/* ---------- Block 7: architect portrait 4:5 (TODO-asset) ---------- */
// Abstract head-and-shoulders silhouette against a warm wall, light from the left.
const PW = 800, PH = 1000;
const people = {
  'vera-lanskaya': [PW, PH, svgWrap(PW, PH, `
    <rect width="${PW}" height="${PH}" fill="#d8cfc0"/>
    <rect x="520" y="0" width="280" height="${PH}" fill="#cdc3b2"/>
    <path d="M130 1000 C140 800 250 720 400 715 C550 720 660 800 670 1000 Z" fill="#4a4640"/>
    <path d="M340 640 h120 v110 a60 40 0 0 1 -120 0 Z" fill="#b89a82"/>
    <ellipse cx="400" cy="480" rx="125" ry="160" fill="#c4a68d"/>
    <path d="M270 500 C250 330 340 290 410 292 C500 296 560 350 535 520 C520 430 470 380 400 380 C330 382 290 430 270 500 Z" fill="#5a4334"/>
    <rect width="${PW}" height="${PH}" fill="url(#light)"/>`, light(0.35))],
};

const only = process.argv[2] ?? '';
const want = (file) => file.startsWith(only);
await mkdir(`${root}collections`, { recursive: true });
await mkdir(`${root}materials`, { recursive: true });
await mkdir(`${root}people`, { recursive: true });
for (const [name, [w, h, svg, layers]] of Object.entries(collections)) if (want(`collections/${name}`)) await render(`collections/${name}.jpg`, w, h, svg, layers);
for (const [name, [w, h, svg, layers]] of Object.entries(materials)) if (want(`materials/${name}`)) await render(`materials/${name}.jpg`, w, h, svg, layers);
for (const [name, [w, h, svg, layers]] of Object.entries(people)) if (want(`people/${name}`)) await render(`people/${name}.jpg`, w, h, svg, layers);
