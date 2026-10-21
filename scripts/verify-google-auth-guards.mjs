#!/usr/bin/env node
/**
 * Guardas estáticos: Google único + documento como identidad.
 * node scripts/verify-google-auth-guards.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, '..');

const checks = [
  ['src/features/auth/lib/loadGoogleAuth.ts', /loadGoogleAuth/],
  ['src/app/login/page.tsx', /loadGoogleAuth/],
  ['src/app/login/page.tsx', /handleGoogleLogin/],
  ['src/features/auth/components/EstudianteLoginShell.tsx', /Continuar con Google/],
  ['src/features/auth/components/EstudianteLoginShell.tsx', /StudentEmailLookupHelp/],
  ['src/features/auth/components/EstudianteLoginShell.tsx', /PRISMIC_SERVICES_LOGO|SgBrandLogo/],
  ['src/features/auth/components/StudentEmailLookupHelp.tsx', /lookupStudentEmailHelp/],
  ['src/features/auth/lib/loadStudentLookup.ts', /lookupStudentById/],
  ['src/features/curso/lib/courseAccessIdentityMatch.ts', /courseAccessMatchesIdentity/],
  ['src/features/curso/lib/courseFirestore.ts', /courseAccessIdentityMatch/],
  ['../../env/landing.env.example', /NEXT_PUBLIC_DIRECT_LOGIN_ENABLED=false/],
];

const forbiddenInLogin = [
  ['src/app/login/page.tsx', /loginStudentByIdAndBirthDate/],
  ['src/app/login/page.tsx', /lookupStudentById/],
  ['src/features/auth/components/EstudianteLoginShell.tsx', /Acceso Directo/],
  ['src/features/auth/components/EstudianteLoginShell.tsx', /lookupStudentById/],
  ['src/features/auth/components/EstudianteLoginShell.tsx', /loginStudentByIdAndBirthDate/],
  ['src/features/auth/components/StudentEmailLookupHelp.tsx', /loginStudentByIdAndBirthDate/],
  ['src/features/auth/components/StudentEmailLookupHelp.tsx', /Acceso Directo/],
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

for (const [rel, pattern] of forbiddenInLogin) {
  const file = path.join(repo, rel);
  const text = fs.readFileSync(file, 'utf8');
  if (pattern.test(text)) {
    console.error(`FAIL ${rel} still contains forbidden ${pattern}`);
    failed += 1;
  } else {
    console.log(`OK   ${rel} (no ${pattern})`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} guard checks failed`);
  process.exit(1);
}

console.log('\nGoogle-only auth guards OK');
