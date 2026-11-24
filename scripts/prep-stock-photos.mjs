// Prepares the stock photos for blocks 3, 4, 5 and 7 (collections, materials,
// projects, architect block) from the approved Unsplash originals (sources,
// authors and licences: credits.md).
// For each slot: optional feathered blur over brand badges / product labels
// (brief: no real logos), crop to the slot's aspect ratio, resize, JPEG q82.
// Coordinates are in pixels of the downloaded source, which is fetched as
// https://images.unsplash.com/photo-<cdn-id>?w=3200&q=88&fm=jpg (3200 px wide).
// Usage: node scripts/prep-stock-photos.mjs <dir-with-sources>
import sharp from 'sharp';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.argv[2];
if (!dir) throw new Error('usage: node scripts/prep-stock-photos.mjs <dir-with-sources>');
const out = fileURLToPath(new URL('../src/assets/img/', import.meta.url));

/** long: target long side of the output; blur: boxes {x, y, w, h} in source px. */
const slots = [
  // Block 3 — «Тихая геометрия» (Caroline Badran, one shoot)
  { out: 'collections/geometry-cover.jpg', src: 'geo-E_a0cDDljdM.jpg', size: [3200, 4481],
    crop: [0, 384, 3200, 4000], long: 2400,
    blur: [{ x: 700, y: 2250, w: 300, h: 140 }, { x: 990, y: 2030, w: 150, h: 210 }] },
  { out: 'collections/geometry-detail-1.jpg', src: 'geo-o2RDtMfnUXI.jpg', size: [3200, 4461],
    crop: [0, 2300, 3200, 2133], long: 2400,
    blur: [{ x: 1580, y: 2660, w: 540, h: 140 }, { x: 2200, y: 2470, w: 230, h: 300 }] },
  { out: 'collections/geometry-detail-2.jpg', src: 'geo-nOYbzx_Mf7I.jpg', size: [3200, 4457],
    crop: [0, 1400, 3200, 2133], long: 2400,
    blur: [{ x: 1910, y: 1750, w: 190, h: 270 }, { x: 2580, y: 1670, w: 110, h: 350 }] },
  // «Тёплый модерн» (Clay Banks, one house)
  { out: 'collections/modern-cover.jpg', src: 'mod-TDXF1KUyyTk.jpg', size: [3200, 2134],
    crop: [750, 0, 1707, 2134], long: 2134, blur: [] },
  { out: 'collections/modern-detail-1.jpg', src: 'mod-Mj3JSq-_7OI.jpg', size: [3200, 2134],
    crop: [869, 0, 1645, 1097], long: 1645, blur: [{ x: 1200, y: 760, w: 150, h: 90 }] },
  { out: 'collections/modern-detail-2.jpg', src: 'mod-xuq5LucyvNM.jpg', size: [3200, 2134],
    crop: [229, 457, 1828, 1219], long: 1828, blur: [] },
  // «Неоклассика» (Lisa Anna, one apartment)
  { out: 'collections/neoclassic-cover.jpg', src: 'neo-XReTDUZpRmg.jpg', size: [3200, 2133],
    // cropped left of the toaster and coffee maker, so no brand marks are in frame
    crop: [0, 110, 1528, 1910], long: 1910, blur: [] },
  { out: 'collections/neoclassic-detail-1.jpg', src: 'neo-gYsjkPCsCfU.jpg', size: [3200, 2133],
    crop: [1600, 297, 1371, 914], long: 1371, blur: [] },
  { out: 'collections/neoclassic-detail-2.jpg', src: 'neo-XReTDUZpRmg.jpg', size: [3200, 2133],
    crop: [274, 1280, 1143, 762], long: 1143, blur: [] },
  // Block 4 — materials (4:5)
  { out: 'materials/oak.jpg', src: 'mat-AE84zZ5C1Ws.jpg', size: [3200, 3200],
    crop: [320, 0, 2560, 3200], long: 1600, blur: [] },
  { out: 'materials/travertine.jpg', src: 'mat-UP1T5tEn_WI.jpg', size: [3200, 4799],
    crop: [0, 400, 3200, 4000], long: 1600, blur: [] },
  { out: 'materials/brass.jpg', src: 'mat-NL4MTg4U7I4.jpg', size: [3200, 2134],
    crop: [650, 0, 1707, 2134], long: 1600, blur: [] },
  { out: 'materials/hardware.jpg', src: 'mat-3JImvfAS24c.jpg', size: [3200, 2133],
    crop: [747, 0, 1706, 2133], long: 1600, blur: [] },
  // Block 5 — projects
  { out: 'projects/pines.jpg', src: 'prj-YpK33yZ3gQ.jpg', size: [3200, 2134],
    crop: [1280, 411, 1920, 1280], long: 1920, blur: [] },
  { out: 'projects/patriarshy.jpg', src: 'prj-xLEQEF3cC1s.jpg', size: [3200, 2133],
    crop: [178, 0, 2844, 2133], long: 2400, blur: [] },
  { out: 'projects/jurmala.jpg', src: 'prj-lL3MKPttNRA.jpg', size: [3200, 2133],
    crop: [178, 0, 2844, 2133], long: 2400, blur: [] },
  { out: 'projects/vasilievsky.jpg', src: 'prj-z6IUJy2dnpg.jpg', size: [3200, 4800],
    crop: [0, 857, 3200, 2400], long: 2400,
    // air-conditioner badge, stand-mixer name plate
    blur: [{ x: 985, y: 1565, w: 90, h: 80 }, { x: 1035, y: 2485, w: 180, h: 80 }, { x: 1028, y: 2668, w: 56, h: 56 }] },
  // Block 7 — architect (hands at a drafting table; no face)
  { out: 'people/vera-lanskaya.jpg', src: 'por-FPFq_trr2Y.jpg', size: [3200, 1801],
    crop: [1100, 0, 1000, 1250], long: 1250, blur: [] },
];

async function blurPatch(input, { x, y, w, h }) {
  const blurred = await sharp(input).extract({ left: x, top: y, width: w, height: h }).blur(Math.max(6, Math.min(w, h) / 6)).raw().toBuffer();
  const mask = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <defs><filter id="f"><feGaussianBlur stdDeviation="${Math.min(w, h) / 10}"/></filter></defs>
        <rect x="${w * 0.08}" y="${h * 0.08}" width="${w * 0.84}" height="${h * 0.84}" rx="${Math.min(w, h) / 5}" fill="#fff" filter="url(#f)"/>
      </svg>`,
    ),
  )
    .extractChannel(3)
    .raw()
    .toBuffer();
  const patch = await sharp(blurred, { raw: { width: w, height: h, channels: 3 } })
    .joinChannel(mask, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer();
  return { input: patch, left: x, top: y };
}

const only = process.argv[3];
for (const s of slots) {
  if (only && !s.out.startsWith(only)) continue;
  const input = join(dir, s.src);
  const meta = await sharp(input).metadata();
  if (meta.width !== s.size[0] || meta.height !== s.size[1]) {
    throw new Error(`${s.src}: expected ${s.size.join('×')}, got ${meta.width}×${meta.height}`);
  }
  // Retouch on a lossless intermediate (sharp applies resize before composite in one pipeline).
  const patches = await Promise.all(s.blur.map((b) => blurPatch(input, b)));
  const retouched = await sharp(input).removeAlpha().composite(patches).png({ compressionLevel: 1 }).toBuffer();
  const [left, top, width, height] = s.crop;
  const info = await sharp(retouched)
    .extract({ left, top, width, height })
    .resize(width >= height ? { width: Math.min(s.long, width) } : { height: Math.min(s.long, height) })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(out, s.out));
  console.log(`${s.out}  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}
