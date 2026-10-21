/**
 * ICONOS/*.svg (raster embebido, ~3MB) → public/curso/icons/*.webp + ICONOS/prismic-web/*.webp
 * Uso: node scripts/optimize-curso-icons.mjs
 */
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const repoRoot = join(root, '..');
const iconsSrc = join(repoRoot, 'ICONOS');
const outPublic = join(root, 'public', 'curso', 'icons');
const outPrismic = join(repoRoot, 'ICONOS', 'prismic-web');

const NAME_MAP = {
  'ICONO DE HORAS': 'horas',
  'ICONO DE CLASES PROGRAMADAS': 'clases-programadas',
  'ICONO DE TASA SEMANAL': 'tasa-semanal',
  'ICONO DE TASA GLOBAL': 'tasa-global',
  'ICONO DE ASISTENCIAS COMPLETAS': 'asistencias-completas',
  'ICONO DE ASISTENCIAS PARCIALES': 'asistencias-parciales',
  'ICONO DE AUSENCIA': 'ausencia',
  'ICONO DE PROXIMAS CLASES': 'proximas-clases',
};

const SIZES = [
  { suffix: '', width: 128, height: 128 },
  { suffix: '@2x', width: 256, height: 256 },
];

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Instala sharp: npm install sharp --save-dev');
    process.exit(1);
  }

  if (!existsSync(iconsSrc)) {
    console.error('No existe ICONOS/');
    process.exit(1);
  }

  mkdirSync(outPublic, { recursive: true });
  mkdirSync(outPrismic, { recursive: true });

  const files = readdirSync(iconsSrc).filter((f) => f.endsWith('.svg'));
  let ok = 0;

  for (const file of files) {
    const base = file.replace(/\.svg$/i, '');
    const slug = NAME_MAP[base];
    if (!slug) {
      console.warn('skip (sin mapa):', file);
      continue;
    }

    const input = join(iconsSrc, file);
    for (const { suffix, width, height } of SIZES) {
      const name = `${slug}${suffix}.webp`;
      const outPaths = [join(outPublic, name), join(outPrismic, name)];
      const buffer = await sharp(input, { density: 144 })
        .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

      for (const out of outPaths) {
        await sharp(buffer).toFile(out);
      }
      ok += 1;
    }
    console.log('OK', slug);
  }

  console.log(`\n${ok} variantes → public/curso/icons/ y ICONOS/prismic-web/`);
  console.log('Sube ICONOS/prismic-web/*.webp a Prismic Media y pega URLs en courseSeguimientoIcons.ts');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
