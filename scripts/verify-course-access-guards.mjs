#!/usr/bin/env node
/**
 * Verifica guardas de acceso a Mi Curso (matriz estática del plan).
 * Ejecutar: node scripts/verify-course-access-guards.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, '..');

const checks = [
  ['firestore.rules', /canReadCourseDoc\(/],
  ['firestore.rules', /courseAccessGrantDoc\(/],
  ['firestore.rules', /canReadOwnCourseAccessRow\(/],
  ['src/features/curso/components/CourseAccessGate.tsx', /CourseGoogleSecurityPrompt/],
  ['src/features/curso/components/CourseAccessGate.tsx', /CourseAccessNotFound/],
  ['src/features/curso/lib/courseAuthReal.ts', /hasRealGoogleAuthSync/],
  ['src/features/curso/lib/courseFirestore.ts', /fetchEntitledCourseById/],
  ['src/features/curso/lib/clearCourseSessionCaches.ts', /clearCourseSessionCaches/],
  ['src/features/curso/hooks/useCourseWorkspace.ts', /fetchEntitledCourseById/],
];

let failed = 0;

for (const [rel, pattern] of checks) {
  const file = path.join(repo, rel);
  const text = fs.readFileSync(file, 'utf8');
  if (!pattern.test(text)) {
    console.error(`FAIL ${rel} missing ${pattern}`);
    failed += 1;
  } else {
    console.log(`OK   ${rel}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} guard checks failed`);
  process.exit(1);
}

console.log('\nMatriz manual pendiente en navegador:');
console.log('- fecha+número → /estudiante/curso → prompt Google, 0 reads curso');
console.log('- Google sin courseAccess → 404 cliente');
console.log('- Google con courseAccess → panel OK');
console.log('- course_selected manipulado → no carga curso ajeno');
