// Prepares src/assets/img/hero.jpg from the approved stock photo
// (Cat Han, Unsplash, VgyN_CWXQVM; 3840×2560 original — see credits.md).
// 1. Softens the oval manufacturer badge on the oven door (brief: no real brand
//    logos): a feathered Gaussian-blur patch over the emblem only.
// 2. Resizes to 3200 px wide, JPEG q85 (source for astro:assets; keeps the repo small).
// Usage: node scripts/prep-hero-photo.mjs <path-to-original.jpg>
import sharp from 'sharp';

const input = process.argv[2];
if (!input) throw new Error('usage: node scripts/prep-hero-photo.mjs <original.jpg>');

const meta = await sharp(input).metadata();
if (meta.width !== 3840 || meta.height !== 2560) {
  throw new Error(`expected the 3840×2560 original, got ${meta.width}×${meta.height}: re-check the badge box`);
}

// Badge box in original pixels (emblem ≈ x 2617–2640, y 2140–2215) plus a margin.
const box = { left: 2570, top: 2090, width: 120, height: 180 };

const blurred = await sharp(input).extract(box).blur(14).raw().toBuffer();
// Feathered elliptical alpha so the patch has no visible edge.
const mask = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}">
      <defs><filter id="f"><feGaussianBlur stdDeviation="10"/></filter></defs>
      <ellipse cx="${2628 - box.left}" cy="${2178 - box.top}" rx="34" ry="62" fill="#fff" filter="url(#f)"/>
    </svg>`,
  ),
)
  .extractChannel(3) // alpha of the rendered ellipse
  .raw()
  .toBuffer();
const patch = await sharp(blurred, { raw: { width: box.width, height: box.height, channels: 3 } })
  .joinChannel(mask, { raw: { width: box.width, height: box.height, channels: 1 } })
  .png()
  .toBuffer();

// Two pipelines: within one, sharp applies resize before composite.
const retouched = await sharp(input)
  .composite([{ input: patch, left: box.left, top: box.top }])
  .png({ compressionLevel: 1 }) // lossless intermediate: no double JPEG compression
  .toBuffer();
await sharp(retouched)
  .resize(3200)
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile('src/assets/img/hero.jpg');

const out = await sharp('src/assets/img/hero.jpg').metadata();
console.log(`hero.jpg ${out.width}×${out.height}`);
