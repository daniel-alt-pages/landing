/**
 * Escudos de instituciones que aplicaron al menos un simulacro.
 * Lee los SVG de assets-src/colegios-pifa (zip PIFA 2026, no versionado)
 * y escribe WebP en public/landing/colegios más src/app/landing/_contenido/colegios.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(appRoot, 'assets-src', 'colegios-pifa');
const outDir = path.join(appRoot, 'public', 'landing', 'colegios');
const tsPath = path.join(appRoot, 'src', 'app', 'landing', '_contenido', 'colegios.ts');

const SMALL = new Set(['de', 'del', 'y']);
const ACRONYMS = new Set(['ie', 'ied', 'ierd', 'iet', 'ietac', 'cc']);
const ACCENT = {
  institucion: 'institución',
  corporacion: 'corporación',
  tecnica: 'técnica',
  tecnico: 'técnico',
  garcia: 'garcía',
  martinez: 'martínez',
  hernandez: 'hernández',
  maria: 'maría',
  gaitan: 'gaitán',
  agustin: 'agustín',
  tablon: 'tablón',
  jesus: 'jesús',
  jésus: 'jesús',
  tuenjelito: 'tunjuelito',
  marquez: 'márquez',
  jimenez: 'jiménez',
  victor: 'víctor',
};

function titleEs(value) {
  let index = 0;
  return value
    .toLocaleLowerCase('es')
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      const lower = part.toLocaleLowerCase('es');
      const core = lower.replace(/[^a-záéíóúüñ]/gi, '');
      const token = core ? lower.replace(core, ACCENT[core] || core) : lower;
      const bare = token.replace(/[.,]/g, '');
      if (bare === 'xxi') {
        index += 1;
        return 'XXI';
      }
      if (ACRONYMS.has(bare)) {
        index += 1;
        return token.toLocaleUpperCase('es');
      }
      if (index > 0 && SMALL.has(token)) {
        index += 1;
        return token;
      }
      index += 1;
      return token.charAt(0).toLocaleUpperCase('es') + token.slice(1);
    })
    .join('');
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseName(filename) {
  let raw = filename.replace(/\.svg$/i, '').replace(/\s+/g, ' ').trim();
  if (/^PREICFES GRATUITO/i.test(raw)) return null;
  raw = raw
    .replace(/ - SIMULACROS$/i, '')
    .replace(/EUCATIVA/g, 'EDUCATIVA')
    .replace(/DEPARTALMENTAL/g, 'DEPARTAMENTAL')
    .replace(/HORARIO PERDOMO/g, 'HORACIO PERDOMO');
  if (raw.includes('PRADO VERANIEGO')) {
    return { name: 'Colegio Prado Veraniego', place: 'Suba, Bogotá' };
  }
  const split = raw.indexOf(' - ');
  const namePart = split > 0 ? raw.slice(0, split) : raw;
  const placePart = split > 0 ? raw.slice(split + 3) : '';
  return { name: titleEs(namePart), place: placePart ? titleEs(placePart) : '' };
}

const files = fs.readdirSync(srcDir).filter((name) => name.toLowerCase().endsWith('.svg'));
const schools = [];
const used = new Set();

for (const file of files.sort((a, b) => a.localeCompare(b, 'es'))) {
  const parsed = parseName(file);
  if (!parsed) {
    console.log('omitido (no es colegio):', file);
    continue;
  }
  let id = slugify(parsed.name);
  if (used.has(id)) id = `${id}-${slugify(parsed.place) || '2'}`;
  used.add(id);
  const dest = path.join(outDir, `${id}.webp`);
  fs.mkdirSync(outDir, { recursive: true });
  await sharp(path.join(srcDir, file), { density: 144 })
    .flatten({ background: '#ffffff' })
    .trim({ threshold: 18 })
    .resize(280, 280, { fit: 'inside', withoutEnlargement: false })
    .webp({ quality: 82 })
    .toFile(dest);
  schools.push({
    id,
    name: parsed.name,
    short: parsed.name,
    department: parsed.place || 'Colombia',
    src: `/landing/colegios/${id}.webp`,
    bytes: fs.statSync(dest).size,
  });
}

const lines = schools
  .map(
    (school) => `  {
    id: '${school.id}',
    name: '${school.name.replace(/'/g, "\\'")}',
    short: '${school.short.replace(/'/g, "\\'")}',
    department: '${school.department.replace(/'/g, "\\'")}',
    src: '${school.src}',
  }`,
  )
  .join(',\n');

const ts = `import type { SchoolLogo } from './tipos';

/** Escudos de instituciones que aplicaron al menos un simulacro con SeamosGenios. Fuente: PIFA 2026. */
export const COLEGIOS: SchoolLogo[] = [
${lines},
];
`;

fs.writeFileSync(tsPath, ts);
const total = schools.reduce((sum, school) => sum + school.bytes, 0);
console.log(`colegios ${schools.length}  webp ${(total / 1024).toFixed(0)} KB`);
for (const school of schools) console.log(`- ${school.name} | ${school.department}`);
