/**
 * Convierte SVG de mascotas SG a WebP optimizado para portadas de grabaciones.
 * Uso: node scripts/convert-mascot-covers.mjs
 */
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.resolve(root, '..', 'mascotas - seamosgenios');
const outDir = path.resolve(root, 'public', 'images', 'recordings', 'mascotas');

/** Nombre de archivo fuente (substring) → slug de salida */
const NAME_MAP = [
  ['MATEM', 'matematicas'],
  ['LECTURA', 'lectura-critica'],
  ['COMPETENCIAS', 'sociales-ciudadanas'],
  ['CIENCIAS', 'ciencias-naturales'],
  ['INGL', 'ingles'],
  ['GRUPO', 'grupo-de-mascotas'],
];

function resolveSlug(filename) {
  const upper = filename.toUpperCase();
  for (const [needle, slug] of NAME_MAP) {
    if (upper.includes(needle)) return slug;
  }
  return null;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const files = (await readdir(srcDir)).filter((f) => f.toLowerCase().endsWith('.svg'));

  for (const file of files) {
    const slug = resolveSlug(file);
    if (!slug) {
      console.warn(`Skip (sin mapa): ${file}`);
      continue;
    }

    const input = path.join(srcDir, file);
    const outWebp = path.join(outDir, `${slug}.webp`);
    const outPng = path.join(outDir, `${slug}.png`);

    const isGroup = slug === 'grupo-de-mascotas';
    const size = isGroup ? { width: 960, height: 540 } : { width: 512, height: 512 };
    const fit = isGroup ? 'contain' : 'contain';
    const bg = isGroup
      ? { r: 5, g: 5, b: 8, alpha: 1 }
      : { r: 0, g: 0, b: 0, alpha: 0 };

    await sharp(input, { density: isGroup ? 120 : 150 })
      .resize(size.width, size.height, { fit, background: bg })
      .webp({ quality: isGroup ? 85 : 82, effort: 4 })
      .toFile(outWebp);

    await sharp(input, { density: isGroup ? 120 : 150 })
      .resize(size.width, size.height, { fit, background: bg })
      .png({ compressionLevel: 9 })
      .toFile(outPng);

    console.log(`OK ${slug} ← ${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
