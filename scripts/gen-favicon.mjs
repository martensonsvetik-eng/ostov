// Generates public/favicon.svg: the «О» of the wordmark (Cormorant Garamond 600 outline)
// in cream on graphite, centred on a rounded square. Usage: node scripts/gen-favicon.mjs
import opentype from 'opentype.js';
import fs from 'node:fs';

const b = fs.readFileSync('node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-cyrillic-600-normal.woff');
const font = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
const size = 56;
const g = font.charToGlyph('О');
const bb = g.getPath(0, 0, size).getBoundingBox();
const x = 32 - (bb.x1 + bb.x2) / 2;
const y = 32 - (bb.y1 + bb.y2) / 2;
const d = g.getPath(x, y, size).toPathData(2);
fs.writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#24221f"/><path d="${d}" fill="#f4f1ea"/></svg>\n`,
);
