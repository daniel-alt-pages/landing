/**
 * Genera firebase.hosting.staging.json: hosting sin cache agresivo (HTML/JS/CSS).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
const hosting = structuredClone(src.hosting);

const noStore = 'no-cache, no-store, must-revalidate';
const shortCache = 'public, max-age=60, must-revalidate';

const coopAllowPopups = { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' };

for (const rule of hosting.headers ?? []) {
  if (rule.source === '**') {
    const headers = rule.headers ?? [];
    const idx = headers.findIndex((h) => h.key === 'Cross-Origin-Opener-Policy');
    if (idx >= 0) headers[idx] = coopAllowPopups;
    else headers.push(coopAllowPopups);
    // Clean URLs (cleanUrls=true) serve HTML at extensionless paths like /login,
    // so **/*.html never matches them. Default fallback was max-age=3600, which
    // pins stale HTML referencing deleted chunk hashes after a redeploy (white/black
    // screen + "MIME text/html" script errors). Force revalidation here; asset rules
    // below override Cache-Control by key for /_next/static, js/css, fonts, images.
    const ccIdx = headers.findIndex((h) => h.key === 'Cache-Control');
    if (ccIdx >= 0) headers[ccIdx] = { key: 'Cache-Control', value: noStore };
    else headers.push({ key: 'Cache-Control', value: noStore });
    rule.headers = headers;
  }
  if (rule.source === '**/*.html') {
    rule.headers = [{ key: 'Cache-Control', value: noStore }];
  }
  if (rule.source === '**/*.@(js|css)') {
    rule.headers = [
      { key: 'Cache-Control', value: shortCache },
      { key: 'Access-Control-Allow-Origin', value: '*' },
    ];
  }
  if (rule.source === '/sw.js') {
    rule.headers = [{ key: 'Cache-Control', value: noStore }];
  }
}

writeFileSync(
  join(root, 'firebase.hosting.staging.json'),
  JSON.stringify({ hosting }, null, 2) + '\n',
  'utf8'
);

console.log('[prepare-firebase-hosting-staging] wrote firebase.hosting.staging.json');
