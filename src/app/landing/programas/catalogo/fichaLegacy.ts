import type { CatalogItem, FichaBlock, ProductFicha, ProductSheet } from './catalogUi';

const AREAS = [
  'Matemáticas',
  'Lectura crítica',
  'Ciencias sociales',
  'Ciencias naturales',
  'Inglés',
  'Generalidades',
];

const PITCH_INCLUDES = [
  'Matemáticas, Lectura crítica, Ciencias sociales, Ciencias naturales e Inglés',
  'Generalidades del curso',
  'Desafíos, tareas, materiales y grabaciones en cada área',
  'Simulacros y miniexámenes',
  'Clases, calendario y comunidad',
];

function calendarioB(item: Pick<CatalogItem, 'id' | 'title' | 'commerce'>) {
  const aula = item.commerce?.aulaId || item.id || '';
  return /cal-?b|calendario\s*b/i.test(`${aula} ${item.title || ''}`);
}

function iconFor(label: string) {
  const folded = label.toLowerCase();
  if (folded.includes('simulacro')) return 'simulacro';
  if (folded.includes('miniexamen')) return 'examen';
  if (folded.includes('desaf')) return 'desafio';
  if (folded.includes('grabaci')) return 'grabacion';
  if (folded.includes('material')) return 'material';
  if (folded.includes('tarea')) return 'tarea';
  if (folded.includes('comunidad')) return 'comunidad';
  if (folded.includes('clase')) return 'clase';
  return 'punto';
}

function sheetOf(sheet?: ProductSheet) {
  return {
    headline: sheet?.headline || '',
    duration: sheet?.duration || '',
    columns: sheet?.columns || [],
    sections: sheet?.sections || [],
  };
}

/** Misma migración que el API cuando el producto todavía no trae `ficha`. */
export function fichaFromLegacy(item: Pick<CatalogItem, 'id' | 'title' | 'commerce' | 'includes' | 'story' | 'sheet' | 'catalog'>): ProductFicha {
  const perks = (item.includes || []).map((row) => (typeof row === 'string' ? row : row.label || '')).filter(Boolean).slice(0, 8);
  const sheet = sheetOf(item.sheet);
  const pitch = calendarioB(item) && !sheet.sections.length;
  const blocks: FichaBlock[] = [];
  const year = (item.title || '').match(/20\d{2}/)?.[0] || '2026';
  if (pitch) {
    blocks.push({
      id: 'intro',
      type: 'intro',
      title: '',
      body: `Calendario B ${year} es el aula para preparar la prueba Saber 11 por tu cuenta. Entras a las cinco áreas y a generalidades, y desde ahí practicas, entregas y revisas.\n\nEn cada área hay desafíos, tareas, materiales y grabaciones. El aula también reúne simulacros, miniexámenes, clases, el calendario y la comunidad del curso.`,
    });
  }
  const labels = perks.length ? perks : (pitch ? PITCH_INCLUDES : []);
  if (labels.length) {
    blocks.push({
      id: 'incluye',
      type: 'incluye',
      items: labels.map((label) => ({ icon: iconFor(label), label, note: '' })),
    });
  }
  for (const block of item.story || []) {
    if (blocks.length >= 16) break;
    if (block.kind === 'text' && block.text) {
      blocks.push({ id: block.id, type: 'texto', style: block.style || 'cuerpo', body: block.text });
    } else if (block.kind === 'image' && block.url && block.frame !== 'desktop' && block.frame !== 'mobile') {
      blocks.push({ id: block.id, type: 'imagen', url: block.url, ratio: (block.w || 0) < 80 ? '1:1' : '16:9', caption: '' });
    }
  }
  if (sheet.headline || sheet.duration || sheet.columns.length || sheet.sections.length) {
    blocks.push({ id: 'horario', type: 'horario', ...sheet });
  }
  if (pitch) {
    blocks.push({
      id: 'trabajo',
      type: 'texto',
      style: 'cuerpo',
      body: '**Cómo se trabaja**\nEntras al aula y eliges el área\nPracticas con desafíos y miniexámenes\nEntregas tareas y consultas materiales y grabaciones\nSigues las clases y las fechas en el calendario\nHablas con el curso en la comunidad',
    });
    blocks.push({
      id: 'persona',
      type: 'texto',
      style: 'nota',
      body: '**Tu acceso**\nEl pase es personal. Con tu cuenta entras a este aula y usas las áreas, la práctica y el calendario de este producto.',
    });
    blocks.push({ id: 'areas', type: 'areas', items: AREAS });
  }
  return {
    v: 1,
    cover: { wide: '', square: item.catalog?.coverUrl || '', alt: '' },
    blocks: blocks.slice(0, 16),
  };
}

export function fichaOfItem(item: CatalogItem): ProductFicha {
  if (item.ficha?.v === 1 && Array.isArray(item.ficha.blocks)) return item.ficha;
  return fichaFromLegacy(item);
}
