import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const simulationsDir = path.join(root, 'public/data/simulations');
const outputPaths = [
  path.join(root, 'src/app/landing-profesional/contenido-landing/mapa-impacto/datos-geo/landingImpactSummary.json'),
  path.join(root, 'public/data/landing/landingImpactSummary.json'),
];

const SUBJECTS = [
  'matemáticas',
  'lectura crítica',
  'sociales y ciudadanas',
  'ciencias naturales',
  'inglés',
];

function normalizeLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const lower = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (['na', 'n/a', 'no especificado', 'sin departamento', 'undefined', 'null'].includes(lower)) return '';
  return raw.toLocaleLowerCase('es-CO').replace(/(^|[\s-])(\p{L})/gu, (_, prefix, letter) => {
    return `${prefix}${letter.toLocaleUpperCase('es-CO')}`;
  });
}

function getStudentId(student) {
  const info = student?.informacion_personal || {};
  return String(
    info.numero_identificacion ||
      info.documento ||
      info.id ||
      info.correo_electronico ||
      `${info.nombres || ''}-${info.apellidos || ''}-${info.institucion || ''}`
  ).trim();
}

function getDepartment(student) {
  const info = student?.informacion_personal || {};
  return normalizeLabel(info.departamento) || normalizeLabel(info.municipio) || 'No especificado';
}

function getScore(student) {
  return Number(student?.puntaje_global) || 0;
}

function emptyStats(name) {
  return {
    department: name,
    uniqueUsers: 0,
    evaluations: 0,
    validEvaluations: 0,
    scoreSum: 0,
    maxScore: 0,
    minScore: null,
    successCount: 0,
    subjectSums: Object.fromEntries(SUBJECTS.map((subject) => [subject, 0])),
    subjectCounts: Object.fromEntries(SUBJECTS.map((subject) => [subject, 0])),
  };
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function main() {
  const entries = await readdir(simulationsDir, { withFileTypes: true });
  const simulationIds = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'es-CO', { numeric: true }));

  const departments = new Map();
  const users = new Map();
  let totalEvaluations = 0;
  let validEvaluations = 0;

  for (const simulationId of simulationIds) {
    const filePath = path.join(simulationsDir, simulationId, 'students.json');
    let payload;
    try {
      payload = JSON.parse(await readFile(filePath, 'utf8'));
    } catch (error) {
      console.warn(`[landing-impact] skipping ${simulationId}: ${error.message}`);
      continue;
    }

    const students = Array.isArray(payload?.estudiantes) ? payload.estudiantes : [];
    for (const student of students) {
      const id = getStudentId(student);
      const department = getDepartment(student);
      const score = getScore(student);
      totalEvaluations += 1;

      if (!departments.has(department)) departments.set(department, emptyStats(department));
      const stats = departments.get(department);
      stats.evaluations += 1;

      if (id) {
        if (!users.has(id)) users.set(id, { departments: new Map(), validScores: [] });
        const user = users.get(id);
        user.departments.set(department, (user.departments.get(department) || 0) + 1);
        if (score > 0) user.validScores.push(score);
      }

      if (score > 0) {
        validEvaluations += 1;
        stats.validEvaluations += 1;
        stats.scoreSum += score;
        stats.maxScore = Math.max(stats.maxScore, score);
        stats.minScore = stats.minScore === null ? score : Math.min(stats.minScore, score);
        if (score >= 300) stats.successCount += 1;
      }

      for (const subject of SUBJECTS) {
        const subjectScore = Number(student?.puntajes?.[subject]?.puntaje) || 0;
        if (subjectScore > 0) {
          stats.subjectSums[subject] += subjectScore;
          stats.subjectCounts[subject] += 1;
        }
      }
    }
  }

  for (const user of users.values()) {
    const dominantDepartment =
      Array.from(user.departments.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es-CO'))[0]?.[0] ||
      'No especificado';
    if (!departments.has(dominantDepartment)) departments.set(dominantDepartment, emptyStats(dominantDepartment));
    departments.get(dominantDepartment).uniqueUsers += 1;
  }

  const departmentRows = Array.from(departments.values())
    .map((stats) => ({
      department: stats.department,
      uniqueUsers: stats.uniqueUsers,
      evaluations: stats.evaluations,
      validEvaluations: stats.validEvaluations,
      averageScore: stats.validEvaluations ? round(stats.scoreSum / stats.validEvaluations, 1) : 0,
      maxScore: stats.maxScore,
      minScore: stats.minScore ?? 0,
      successRate: stats.validEvaluations ? round((stats.successCount / stats.validEvaluations) * 100, 1) : 0,
      subjectAverages: Object.fromEntries(
        SUBJECTS.map((subject) => [
          subject,
          stats.subjectCounts[subject] ? round(stats.subjectSums[subject] / stats.subjectCounts[subject], 1) : 0,
        ])
      ),
    }))
    .sort((a, b) => b.uniqueUsers - a.uniqueUsers || b.averageScore - a.averageScore);

  const validUserScores = Array.from(users.values()).flatMap((user) => user.validScores);
  const summary = {
    generatedAt: new Date().toISOString(),
    source: 'public/data/simulations/*/students.json',
    privacy: 'Aggregate-only summary. No names, emails, phones or document numbers are exported.',
    simulations: simulationIds,
    totals: {
      simulations: simulationIds.length,
      uniqueUsers: users.size,
      evaluations: totalEvaluations,
      validEvaluations,
      departments: departmentRows.filter((row) => row.department !== 'No especificado').length,
      averageScore: validUserScores.length ? round(validUserScores.reduce((sum, value) => sum + value, 0) / validUserScores.length, 1) : 0,
    },
    departments: departmentRows,
  };

  const payload = `${JSON.stringify(summary, null, 2)}\n`;
  for (const outputPath of outputPaths) {
    await writeFile(outputPath, payload, 'utf8');
    console.log(
      `[landing-impact] wrote ${path.relative(root, outputPath)} · ${summary.totals.uniqueUsers} users · ${summary.totals.departments} departments`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
