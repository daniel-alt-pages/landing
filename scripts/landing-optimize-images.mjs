#!/usr/bin/env node
/**
 * Copia SVG a public/landing y, si hay PNG/JPG en assets-src/landing,
 * genera AVIF y WebP con sharp. También escribe og.jpg y manifest.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(appRoot, 'assets-src', 'landing');
const outDir = path.join(appRoot, 'public', 'landing');
const widths = [480, 960, 1440];
const manifest = [];

function walk(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, list);
    else list.push(full);
  }
  return list;
}

fs.mkdirSync(outDir, { recursive: true });

for (const file of walk(srcDir)) {
  const rel = path.relative(srcDir, file).replace(/\\/g, '/');
  const dest = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const ext = path.extname(file).toLowerCase();
  if (ext === '.svg') {
    fs.copyFileSync(file, dest);
    manifest.push({ src: `/landing/${rel}`, kind: 'svg' });
    continue;
  }
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;
  const base = rel.replace(ext, '');
  for (const width of widths) {
    const image = sharp(file).resize({ width, withoutEnlargement: true });
    const avifRel = `${base}-${width}.avif`;
    const webpRel = `${base}-${width}.webp`;
    await image.clone().avif({ quality: 50 }).toFile(path.join(outDir, avifRel));
    await image.clone().webp({ quality: 72 }).toFile(path.join(outDir, webpRel));
    const meta = await sharp(file).metadata();
    manifest.push({ src: `/landing/${base}-${width}.webp`, width, height: meta.height || null });
  }
}

const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F4F4F5"/>
  <rect x="0" y="0" width="1200" height="16" fill="#CC0000"/>
  <text x="72" y="250" fill="#0F172A" font-family="Montserrat, Arial, sans-serif" font-size="72" font-weight="800">ALIANZA ESTRATÉGICA</text>
  <text x="72" y="340" fill="#CC0000" font-family="Montserrat, Arial, sans-serif" font-size="72" font-weight="800">EDUCATIVA</text>
  <text x="72" y="430" fill="#475569" font-family="Montserrat, Arial, sans-serif" font-size="28">Simulacros Saber 11 para tu colegio. El primero es gratis.</text>
</svg>`;
await sharp(Buffer.from(ogSvg)).jpeg({ quality: 80 }).toFile(path.join(outDir, 'og.jpg'));
manifest.push({ src: '/landing/og.jpg', width: 1200, height: 630 });

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`[landing:images] ${manifest.length} entradas`);
