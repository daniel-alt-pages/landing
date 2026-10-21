/**
 * Verifica que el bundle en out/ apunte al proyecto Firebase esperado.
 * Uso: node scripts/verify-build-firebase-project.mjs pruebas-sg-aa586
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const expected = process.argv[2];
if (!expected) {
  console.error('Uso: node scripts/verify-build-firebase-project.mjs <project-id>');
  process.exit(1);
}

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const outDir = join(root, 'out');
const forbidden =
  expected === 'pruebas-sg-aa586'
    ? ['projectId:"simulacros-sg"', 'projectId: "simulacros-sg"', 'authDomain:"simulacros-sg.firebaseapp.com"']
    : expected === 'simulacros-sg'
      ? ['projectId:"pruebas-sg-aa586"', 'authDomain:"pruebas-sg-aa586.firebaseapp.com"']
      : [];

function walkJs(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkJs(full, files);
    else if (extname(entry.name) === '.js' && statSync(full).size < 5_000_000) files.push(full);
  }
  return files;
}

function main() {
  if (!existsSync(outDir)) {
    console.error('[verify-build-firebase] Falta out/. Ejecuta assemble/build primero.');
    process.exit(1);
  }

  const chunks = walkJs(join(outDir, '_next', 'static'));
  let foundExpected = false;
  const leaks = [];

  for (const file of chunks) {
    const text = readFileSync(file, 'utf8');
    if (text.includes(expected)) foundExpected = true;
    for (const bad of forbidden) {
      if (text.includes(bad)) leaks.push({ file, bad });
    }
  }

  if (!foundExpected) {
    console.error(`[verify-build-firebase] ❌ No se encontró "${expected}" en out/_next/static`);
    process.exit(1);
  }

  if (leaks.length > 0) {
    console.error('[verify-build-firebase] ❌ Proyecto Firebase incorrecto en bundle:');
    for (const l of leaks.slice(0, 5)) {
      console.error(`   ${l.bad} → ${l.file}`);
    }
    process.exit(1);
  }

  console.log(`[verify-build-firebase] ✅ Bundle OK → ${expected}`);
}

main();
