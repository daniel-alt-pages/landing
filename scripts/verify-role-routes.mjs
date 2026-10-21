#!/usr/bin/env node
/**
 * Verifica que existan las rutas de los tres roles y fixtures mínimos.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const requiredRoutes = [
  'src/app/estudiante',
  'src/app/coordinador',
  'src/app/admin-panel',
  'src/app/demo/estudiante',
  'src/app/login',
];

for (const rel of requiredRoutes) {
  const p = path.join(appRoot, rel);
  if (!fs.existsSync(p)) errors.push(`Ruta/rol faltante: ${rel}`);
}

const fixtures = [
  'public/data/current_simulation.json',
  'public/data/auth_index.json',
  'public/data/coordinator_tokens.json',
  'public/data/simulations/EDU-PILOT-01/students.json',
  'public/data/simulations/EDU-PILOT-01/manifest.json',
];

for (const rel of fixtures) {
  const p = path.join(appRoot, rel);
  if (!fs.existsSync(p)) errors.push(`Fixture faltante: ${rel}`);
}

const current = JSON.parse(
  fs.readFileSync(path.join(appRoot, 'public/data/current_simulation.json'), 'utf8')
);
if (!current.active || !Array.isArray(current.available)) {
  errors.push('current_simulation.json debe tener active + available');
}

const flagsPath = path.join(appRoot, 'src/shared/config/localFeatureFlags.ts');
const flags = fs.readFileSync(flagsPath, 'utf8');
for (const key of ['studentReports: true', 'coordinatorReports: true', 'adminPanel: true', 'firebase: false']) {
  if (!flags.includes(key)) errors.push(`Flag ausente/incorrecto: ${key}`);
}

if (errors.length) {
  console.error('[verify:roles] FALLÓ\n' + errors.map((e) => ` - ${e}`).join('\n'));
  process.exit(1);
}
console.log('[verify:roles] OK — estudiante/coordinador/admin + fixtures');
