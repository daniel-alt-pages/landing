/**
 * Servidor estático sin dependencias para el export (`next start` no sirve con output: 'export').
 * Uso: node scripts/serve-out.mjs [carpeta=out] [puerto=3010] [prefijo=/]
 *   npm start                 -> out/ en http://127.0.0.1:3010/landing
 *   npm run start:pages       -> out-pages/ en http://127.0.0.1:3010/landing/ (igual que GitHub Pages)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [dirArg = 'out', portArg = '3010', prefixArg = '/'] = process.argv.slice(2);
const dir = path.resolve(dirArg);
const port = Number(portArg);
const prefix = ('/' + prefixArg.replace(/^\/+|\/+$/g, '') + '/').replace('//', '/');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.pdf': 'application/pdf',
};

function resolveFile(rel) {
  const base = path.join(dir, rel);
  if (!base.startsWith(dir)) return null;
  for (const c of [base, base + '.html', path.join(base, 'index.html')]) {
    try { if (fs.statSync(c).isFile()) return c; } catch { /* sigue */ }
  }
  return null;
}

http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (prefix !== '/' && url === prefix.slice(0, -1)) { res.writeHead(301, { Location: prefix }); return res.end(); }
  if (url === '/' && prefix === '/') {
    if (fs.existsSync(path.join(dir, 'landing.html'))) { res.writeHead(302, { Location: '/landing' }); return res.end(); }
  }
  if (!url.startsWith(prefix)) { res.writeHead(404); return res.end('Not found'); }
  const file = resolveFile(url.slice(prefix.length));
  const fallback = path.join(dir, '404.html');
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.existsSync(fallback) ? fs.createReadStream(fallback).pipe(res) : res.end('Not found');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`[serve] ${dir} en http://127.0.0.1:${port}${prefix}`));
