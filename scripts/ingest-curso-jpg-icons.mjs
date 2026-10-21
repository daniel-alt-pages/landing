/**
 * JPG del album ImgBB → public/curso/icons/*.webp (fondo negro → transparente).
 * Uso: node scripts/ingest-curso-jpg-icons.mjs
 */
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = join(root, 'public', 'curso', 'icons');
const BLACK_THRESHOLD = 28;

async function knockOutBlack(inputPath, outputPath, width, height) {
  const sharp = (await import('sharp')).default;
  const { data, info } = await sharp(inputPath)
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
      data[i + 3] = 0;
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 86, effort: 4 })
    .toFile(outputPath);
}

async function main() {
  const jpgs = readdirSync(iconsDir).filter((f) => f.endsWith('.jpg'));
  if (!jpgs.length) {
    console.log('No hay .jpg en public/curso/icons/');
    return;
  }

  for (const file of jpgs) {
    const slug = file.replace(/\.jpg$/i, '');
    const input = join(iconsDir, file);
    await knockOutBlack(input, join(iconsDir, `${slug}.webp`), 128, 128);
    await knockOutBlack(input, join(iconsDir, `${slug}@2x.webp`), 256, 256);
    console.log('OK', slug);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
