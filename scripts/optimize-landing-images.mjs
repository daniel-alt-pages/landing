/**
 * Convierte las fotos pesadas de la landing a WebP (gratis, con sharp).
 * - historias: SVG con un JPG/PNG incrustado (7–15 MB c/u) -> WebP 1080 y 540 px de ancho.
 *   Las fuentes SVG quedan en assets-src/historias-svg (no se publican).
 * - mascotas PNG 512 px y pasos JPG 1152 px -> WebP.
 * Uso: node scripts/optimize-landing-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pub = path.join(root, 'public', 'landing');
const srcHist = path.join(root, 'assets-src', 'historias-svg');
const outHist = path.join(pub, 'historias');
fs.mkdirSync(outHist, { recursive: true });

for (const f of fs.readdirSync(srcHist).filter((n) => n.endsWith('.svg'))) {
  const base = f.replace(/\.svg$/, '');
  const input = fs.readFileSync(path.join(srcHist, f));
  for (const w of [1080, 540]) {
    const dest = path.join(outHist, `${base}-${w}.webp`);
    await sharp(input, { density: 72 * (w / 810) * 1.0, limitInputPixels: false, unlimited: true })
      .resize({ width: w })
      .webp({ quality: 74, effort: 5 })
      .toFile(dest);
  }
}
for (const f of ['ingles', 'lectura-critica', 'sociales-ciudadanas']) {
  await sharp(path.join(pub, 'mascotas', `${f}.png`)).resize({ width: 512 }).webp({ quality: 82 }).toFile(path.join(pub, 'mascotas', `${f}.webp`));
}
for (const f of ['analisis', 'caso', 'material', 'simulacro']) {
  for (const w of [800, 480]) {
    await sharp(path.join(pub, 'pasos', `${f}.jpg`)).resize({ width: w }).webp({ quality: 74 }).toFile(path.join(pub, 'pasos', `${f}-${w}.webp`));
  }
}
console.log('ok');
