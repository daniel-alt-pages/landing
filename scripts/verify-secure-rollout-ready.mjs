#!/usr/bin/env node
/**
 * Preflight estático antes de Fase 4 (reglas seguras prod).
 * No despliega; valida que artefactos y runbook existen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(root, '..');

const required = [
  'firestore.rules',
  'firestore.rules.prod',
  'firestore.rules.staging',
  'firebase.prod-secure.json',
  'scripts/deploy-firestore-prod-secure.mjs',
  'scripts/deploy-firestore-prod.mjs',
];

let failed = 0;

for (const rel of required) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.error(`FAIL missing ${rel}`);
    failed += 1;
  } else {
    console.log(`OK   ${rel}`);
  }
}

const legacy = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
const secure = fs.readFileSync(path.join(root, 'firestore.rules.prod'), 'utf8');

if (/allow read: if true/.test(legacy)) {
  console.log('WARN firestore.rules (legacy) still has public reads — expected until Fase 4 deploy');
} else {
  console.log('OK   firestore.rules no longer fully public');
}

if (/match \/results\/\{simId\}/.test(secure) && /canReadStudentProfile/.test(secure)) {
  console.log('OK   firestore.rules.prod protects student results');
} else {
  console.error('FAIL firestore.rules.prod missing result protection helpers');
  failed += 1;
}

const registry = path.join(repo, 'scripts', 'admin', 'roles_registry.json');
if (fs.existsSync(registry)) {
  console.log('OK   scripts/admin/roles_registry.json');
} else {
  console.error('FAIL missing roles_registry.json');
  failed += 1;
}

const runbook = path.join(repo, 'docs', 'ops', 'fase-4-prod-rollout.md');
if (fs.existsSync(runbook)) {
  console.log('OK   docs/ops/fase-4-prod-rollout.md');
} else {
  console.error('FAIL missing fase-4-prod-rollout runbook');
  failed += 1;
}

console.log('\nNext ops steps (manual, prod):');
console.log('  npm run staging:verify');
console.log('  npm run prod:preflight');
console.log('  cd reportes-sg-next && npm run deploy:firestore:prod:secure');

if (failed > 0) {
  console.error(`\n${failed} secure rollout check(s) failed`);
  process.exit(1);
}

console.log('\nSecure rollout artifacts ready (deploy still requires ops approval).');
