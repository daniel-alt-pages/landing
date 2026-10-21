/**
 * Firebase hosting rewrites for estudiante Mi Curso deep-links without per-student static HTML.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const firebaseJson = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
const rewrites = firebaseJson.hosting.rewrites ?? [];

describe('firebase hosting estudiante deep-link rewrites', () => {
  it('serves sg_demo curso shell for any student code path before catch-all', () => {
    const cursoNested = rewrites.find((r: { source: string }) => r.source === '/estudiante/*/curso/**');
    const cursoRoot = rewrites.find((r: { source: string }) => r.source === '/estudiante/*/curso');
    expect(cursoNested?.destination).toBe('/estudiante/sg_demo/curso.html');
    expect(cursoRoot?.destination).toBe('/estudiante/sg_demo/curso.html');
    const catchAllIdx = rewrites.findIndex((r: { source: string }) => r.source === '**');
    const nestedIdx = rewrites.findIndex((r: { source: string }) => r.source === '/estudiante/*/curso/**');
    expect(nestedIdx).toBeGreaterThanOrEqual(0);
    expect(catchAllIdx).toBeGreaterThan(nestedIdx);
  });
});
