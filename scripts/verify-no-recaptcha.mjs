#!/usr/bin/env node
/**
 * Verifica que no haya reCAPTCHA / App Check Web activo en el cliente.
 * node scripts/verify-no-recaptcha.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');

const forbidden = [
  /initializeAppCheck/,
  /ReCaptchaV3Provider/,
  /ReCaptchaEnterpriseProvider/,
  /www\.google\.com\/recaptcha/,
  /NEXT_PUBLIC_RECAPTCHA/,
  /exchangeRecaptchaV3Token/,
];

const allowlist = new Set([
  path.join(root, 'scripts', 'verify-no-recaptcha.mjs'),
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?|mjs|json|env.*)$/.test(entry.name)) out.push(full);
  }
  return out;
}

let failed = 0;

for (const file of walk(src)) {
  if (allowlist.has(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(text)) {
      console.error(`FAIL ${path.relative(root, file)} matches ${pattern}`);
      failed += 1;
    }
  }
}

const envExample = path.join(root, '..', '..', 'env', 'landing.env.example');
if (fs.existsSync(envExample)) {
  const envText = fs.readFileSync(envExample, 'utf8');
  if (/RECAPTCHA/i.test(envText)) {
    console.error('FAIL .env.local.example mentions RECAPTCHA');
    failed += 1;
  } else {
    console.log('OK   .env.local.example (no RECAPTCHA vars)');
  }
}

if (failed > 0) {
  console.error(`\n${failed} reCAPTCHA/App Check check(s) failed`);
  process.exit(1);
}

console.log('\nNo reCAPTCHA / App Check Web references in src/');
