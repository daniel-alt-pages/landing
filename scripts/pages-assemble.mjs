/**
 * Arma el artefacto de GitHub Pages en out-pages/ a partir de out/.
 * Pages sirve el repo en https://<usuario>.github.io/landing/, y la app ya vive
 * bajo /landing/*, así que out/landing/* pasa a ser la raíz del artefacto.
 * /_next se sirve en /landing/_next gracias a assetPrefix (GITHUB_PAGES=true).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'out');
const dest = path.join(root, 'out-pages');

if (!fs.existsSync(path.join(out, 'landing.html'))) {
  console.error('[pages] Falta out/landing.html. Corre antes: GITHUB_PAGES=true npm run build');
  process.exit(1);
}
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(path.join(out, 'landing'), dest, { recursive: true });
fs.cpSync(path.join(out, '_next'), path.join(dest, '_next'), { recursive: true });
fs.copyFileSync(path.join(out, 'landing.html'), path.join(dest, 'index.html'));
for (const f of ['landing.txt', '404.html', 'favicon.ico', 'robots.txt', 'sitemap.xml']) {
  const src = path.join(out, f);
  if (!fs.existsSync(src)) continue;
  fs.copyFileSync(src, path.join(dest, f === 'landing.txt' ? 'index.txt' : f));
}
// /ruta/ con barra final: GitHub Pages busca ruta/index.html. Copia cada ruta.html a ruta/index.html.
const conBarra = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '_next') conBarra(full); continue; }
    if (!e.name.endsWith('.html') || e.name === 'index.html' || (dir === dest && e.name === '404.html')) continue;
    const carpeta = full.slice(0, -5);
    fs.mkdirSync(carpeta, { recursive: true });
    const idx = path.join(carpeta, 'index.html');
    if (!fs.existsSync(idx)) fs.copyFileSync(full, idx);
  }
};
conBarra(dest);
// src/app/robots.ts y sitemap.ts sirven a simulacros-sg.web.app; en Pages mandan los de public/ (github.io/landing).
for (const f of ['robots.txt', 'sitemap.xml']) fs.copyFileSync(path.join(root, 'public', f), path.join(dest, f));
fs.writeFileSync(path.join(dest, '.nojekyll'), '');
console.log('[pages] Artefacto listo en out-pages/');
