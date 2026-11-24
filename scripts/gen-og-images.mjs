// Generates public/og-ru.jpg and public/og-en.jpg (1200×630): graphite background,
// the wordmark from src/components/sections/logo-paths.ts and the hero tagline set in
// Cormorant Garamond (converted to outlines, so no system font is needed).
// Usage: node scripts/gen-og-images.mjs
import sharp from 'sharp';
import opentype from 'opentype.js';
import fs from 'node:fs';

const dir = 'node_modules/@fontsource/cormorant-garamond/files/';
const load = (f) => {
  const b = fs.readFileSync(dir + f);
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const fonts = [load('cormorant-garamond-cyrillic-500-normal.woff'), load('cormorant-garamond-latin-500-normal.woff')];
const n = (v) => String(+v.toFixed(2));

function textPath(text, size) {
  let x = 0;
  let d = '';
  for (const ch of text) {
    const font = fonts.find((f) => f.charToGlyph(ch).index !== 0);
    if (!font) throw new Error(`missing glyph ${ch}`);
    const g = font.charToGlyph(ch);
    for (const c of g.getPath(x, 0, size).commands) {
      if (c.type === 'Z') d += 'Z';
      else if (c.type === 'M' || c.type === 'L') d += `${c.type}${n(c.x)} ${n(c.y)}`;
      else if (c.type === 'Q') d += `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
      else if (c.type === 'C') d += `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    }
    x += (g.advanceWidth * size) / font.unitsPerEm;
  }
  return { d, w: x };
}

const src = fs.readFileSync('src/components/sections/logo-paths.ts', 'utf8');
const logos = JSON.parse(src.slice(src.indexOf('{"ru"'), src.lastIndexOf('}') + 1));
const taglines = { ru: 'Кухня — это каркас дома', en: 'The kitchen is the frame of the home' };

for (const lang of ['ru', 'en']) {
  const logo = logos[lang];
  const k = 5; // wordmark 28 px → 140 px
  const tag = textPath(taglines[lang], 64);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#24221f"/>
  <rect x="80" y="80" width="1040" height="470" fill="none" stroke="#3a3733" stroke-width="1"/>
  <g transform="translate(120 150) scale(${k})" fill="#f4f1ea"><path d="${logo.d}"/></g>
  <rect x="120" y="330" width="64" height="2" fill="#c9cfb4"/>
  <g transform="translate(120 440)" fill="#f4f1ea"><path d="${tag.d}"/></g>
</svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile(`public/og-${lang}.jpg`);
  console.log(`og-${lang}.jpg`, 'tagline width', Math.round(tag.w));
}
