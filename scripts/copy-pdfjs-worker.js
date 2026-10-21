/**
 * Copia el worker de pdfjs-dist a /public para CSP same-origin (worker-src 'self').
 * Se ejecuta en postinstall.
 */
const fs = require('fs');
const path = require('path');

const pdfPkgDir = path.dirname(require.resolve('pdfjs-dist/package.json'));
const src = path.join(pdfPkgDir, 'build', 'pdf.worker.min.mjs');
const dest = path.join(__dirname, '..', 'public', 'pdf.worker.min.mjs');

if (!fs.existsSync(src)) {
  console.warn('[copy-pdfjs-worker] No se encontró', src);
  process.exit(0);
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log('[copy-pdfjs-worker] Copiado a public/pdf.worker.min.mjs');
