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
fs.writeFileSync(path.join(dest, '.nojekyll'), '');
console.log('[pages] Artefacto listo en out-pages/');
