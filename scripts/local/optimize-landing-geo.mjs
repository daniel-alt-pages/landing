/**
 * Copia el GeoJSON de departamentos a public/ y reduce precisión de coordenadas
 * para menor peso en Hosting (objetivo landing ~1 MB/visitante).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const source = path.join(
  root,
  'src/app/landing-profesional/contenido-landing/mapa-impacto/datos-geo/colombiaDepartmentsLatLon.geo.json',
);
const targetDir = path.join(root, 'public/data/landing');
const target = path.join(targetDir, 'colombia-departments-latlon.geo.json');

function roundCoord(value) {
  return Math.round(value * 1e4) / 1e4;
}

function roundCoords(coords) {
  if (typeof coords[0] === 'number') {
    return [roundCoord(coords[0]), roundCoord(coords[1])];
  }
  return coords.map(roundCoords);
}

function roundGeometry(geometry) {
  if (!geometry?.coordinates) return geometry;
  return {
    ...geometry,
    coordinates: roundCoords(geometry.coordinates),
  };
}

const raw = JSON.parse(fs.readFileSync(source, 'utf8'));
const optimized = {
  type: raw.type,
  features: raw.features.map((feature) => ({
    ...feature,
    geometry: roundGeometry(feature.geometry),
  })),
};

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(target, JSON.stringify(optimized));

const sourceKb = (fs.statSync(source).size / 1024).toFixed(1);
const targetKb = (fs.statSync(target).size / 1024).toFixed(1);
console.log(`[landing-geo] ${sourceKb} KB → ${targetKb} KB → ${path.relative(root, target)}`);
