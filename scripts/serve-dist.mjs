/**
 * Static server for Lighthouse CI that behaves like GitHub Pages: HTTPS + HTTP/2, gzip for
 * text, `dist/` under the `/ostov/` base, a directory without a trailing slash redirects,
 * unknown paths get 404.html.
 *
 * Why not `astro preview`: it serves HTML/CSS uncompressed over HTTP/1.1, so Lighthouse
 * would simulate ~6× more HTML/CSS bytes than a real visitor downloads. Plain local HTTP is
 * also not enough on machines whose antivirus web filter re-serves local HTTP decompressed
 * (seen here: responses arrive with `X-Content-Encoding-Over-Network: gzip`); HTTPS is not
 * touched. The certificate is a throwaway self-signed one for `localhost`, made with
 * `openssl` on first run and kept in node_modules/.cache (Chrome runs with
 * --ignore-certificate-errors, see lighthouserc*.json).
 *
 * Usage: `node scripts/serve-dist.mjs [port]` after `npm run build`.
 */
import { createSecureServer } from 'node:http2';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const PORT = Number(process.argv[2] || process.env.PORT || 4322);
const BASE = '/ostov/';
const ROOT = resolve('dist');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg', '.webmanifest']);

function tls() {
  const dir = resolve('node_modules/.cache/serve-dist-tls');
  const key = join(dir, 'key.pem');
  const cert = join(dir, 'cert.pem');
  if (!existsSync(key) || !existsSync(cert)) {
    mkdirSync(dir, { recursive: true });
    execFileSync(
      'openssl',
      ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '3650', '-subj', '/CN=localhost'],
      { stdio: 'ignore', env: { ...process.env, MSYS_NO_PATHCONV: '1' } },
    );
  }
  return Promise.all([readFile(key), readFile(cert)]);
}

async function file(path) {
  try {
    return (await stat(path)).isFile() ? path : null;
  } catch {
    return null;
  }
}

function send(req, res, status, path, body) {
  const ext = extname(path);
  const headers = { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'max-age=600' };
  if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    body = gzipSync(body);
    headers['content-encoding'] = 'gzip';
    headers.vary = 'Accept-Encoding';
  }
  headers['content-length'] = body.length;
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

async function handle(req, res) {
  const url = new URL(req.url || '/', 'https://localhost');
  const p = decodeURIComponent(url.pathname);
  const notFound = async () => send(req, res, 404, '404.html', await readFile(join(ROOT, '404.html')));
  if (!p.startsWith(BASE)) return notFound();
  const rel = normalize(p.slice(BASE.length)).replace(/^[/\\]+/, '');
  const abs = join(ROOT, rel);
  if (!abs.startsWith(ROOT)) return notFound();

  const direct = await file(abs);
  const index = direct ? null : await file(join(abs, 'index.html'));
  if (index && !p.endsWith('/')) {
    res.writeHead(301, { location: `${p}/${url.search}` });
    return res.end();
  }
  const hit = direct || index;
  if (!hit) return notFound();
  send(req, res, 200, hit, await readFile(hit));
}

const [key, cert] = await tls();
createSecureServer({ key, cert, allowHTTP1: true }, (req, res) => {
  handle(req, res).catch(() => {
    res.writeHead(500);
    res.end();
  });
}).listen(PORT, () => console.log(`serving dist at https://localhost:${PORT}${BASE}`));
