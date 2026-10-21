/**
 * Verifica que cada simulacro listado en public/data/current_simulation.json
 * tenga el paquete mínimo para el panel del coordinador (resumen cruzado,
 * estudiantes con puntajes por área y señal de respuestas_detalladas en local).
 *
 * Uso: node scripts/verify-coordinator-simulation-data.mjs
 * (desde la carpeta reportes-sg-next)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const AREAS = ['matemáticas', 'lectura crítica', 'sociales y ciudadanas', 'ciencias naturales', 'inglés'];

function normalizeSimId(s) {
  return String(s ?? '')
    .trim()
    .replace(/-T$/i, '');
}

function readHeadUtf8(filePath, maxBytes = 196608) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(Math.min(maxBytes, fs.statSync(filePath).size));
    fs.readSync(fd, buf, 0, buf.length, 0);
    return buf.toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
}

function main() {
  const cfgPath = path.join(ROOT, 'public/data/current_simulation.json');
  const sumPath = path.join(ROOT, 'public/data/coordinator_summary.json');
  if (!fs.existsSync(cfgPath)) {
    console.error('Missing', cfgPath);
    process.exit(1);
  }
  if (!fs.existsSync(sumPath)) {
    console.error('Missing', sumPath);
    process.exit(1);
  }

  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const summary = JSON.parse(fs.readFileSync(sumPath, 'utf8'));

  const available = [...new Set((cfg.available || []).map(normalizeSimId))].filter(Boolean).sort();
  const summaryKeys = Object.keys(summary).map(normalizeSimId).sort();

  const issues = [];

  const missingSummary = available.filter((s) => !summary[s]);
  if (missingSummary.length) {
    issues.push(`Simulacros en current_simulation sin entrada en coordinator_summary: ${missingSummary.join(', ')}`);
  }

  const orphanSummary = summaryKeys.filter((k) => !available.includes(k));
  if (orphanSummary.length) {
    issues.push(`Entradas en coordinator_summary no listadas en available: ${orphanSummary.join(', ')}`);
  }

  for (const sim of available) {
    const s = summary[sim];
    if (!s) continue;

    if (!s.institutions || typeof s.institutions !== 'object' || Object.keys(s.institutions).length === 0) {
      issues.push(`${sim}: coordinator_summary sin institutions`);
    }

    const t = s.TODAS || s.todas;
    if (!t) {
      issues.push(`${sim}: coordinator_summary sin bloque TODAS`);
    } else if (!t.subjectAvgs || typeof t.subjectAvgs !== 'object') {
      issues.push(`${sim}: TODAS sin subjectAvgs`);
    } else {
      const miss = AREAS.filter((a) => !(a in t.subjectAvgs));
      if (miss.length) issues.push(`${sim}: TODAS.subjectAvgs incompleto (falta: ${miss.join(', ')})`);
    }

    const simDir = path.join(ROOT, 'public/data/simulations', sim);
    const studentsJson = path.join(simDir, 'students.json');
    const manifestJson = path.join(simDir, 'manifest.json');
    const estGrupo = path.join(simDir, 'estadisticas_grupo.json');

    if (!fs.existsSync(studentsJson)) issues.push(`${sim}: falta students.json`);
    if (!fs.existsSync(manifestJson)) issues.push(`${sim}: falta manifest.json`);
    if (!fs.existsSync(estGrupo)) issues.push(`${sim}: falta estadisticas_grupo.json`);

    if (fs.existsSync(studentsJson)) {
      const head = readHeadUtf8(studentsJson);
      if (!head.includes('"estudiantes"')) issues.push(`${sim}: students.json sin clave estudiantes (prefijo)`);
      if (!head.includes('"puntajes"')) issues.push(`${sim}: students.json sin puntajes en prefijo (¿vacío?)`);
      if (!head.includes('"respuestas_detalladas"')) {
        issues.push(`${sim}: students.json sin respuestas_detalladas en primeros ~200KB (preguntas críticas pueden quedar vacías en local)`);
      }
    }
  }

  if (issues.length) {
    console.error('Verificación coordinador / simulacros: FALLOS\n');
    for (const line of issues) console.error(' -', line);
    process.exit(1);
  }

  console.log(`OK: ${available.length} simulacros alineados (current_simulation ↔ coordinator_summary ↔ public/data/simulations/*/…).`);
  console.log('IDs:', available.join(', '));
  console.log(
    '\nNota: temas/metadata ICFES por pregunta → solo SG11-17 (simulationEligibility.ts). Otros simulacros: competencias y plan por niveles de desempeño + marco ICFES, aunque tengan respuestas_detalladas.',
  );
}

main();
