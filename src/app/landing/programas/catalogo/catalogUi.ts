import { formatCop } from '@/bridge/catalogFilter';
import { platformAppUrl } from '../../_contenido/contacto';

/** Origen de la app, el mismo host por el que se abrió la landing. */
function appOrigin() {
  return platformAppUrl();
}

export const APP = (process.env.NEXT_PUBLIC_EDUGENIOS_WEB_ORIGIN || 'http://localhost:8081').replace(/\/$/, '');

export const KINDS = [
  { id: '', label: 'Todos' },
  { id: 'programa', label: 'Programa' },
  { id: 'simulacro', label: 'Simulacro' },
  { id: 'curso', label: 'Curso' },
];

const KIND_LABEL: Record<string, string> = {
  programa: 'Programa',
  simulacro: 'Simulacro',
  curso: 'Curso',
};

export type StoryBlock = {
  id: string;
  kind: 'text' | 'image';
  text?: string;
  url?: string;
  x: number;
  y: number;
  w: number;
  style?: 'cuerpo' | 'titulo' | 'enfasis' | 'nota';
  weight?: 'regular' | 'bold';
  frame?: 'libre' | 'desktop' | 'mobile';
  fit?: 'contain';
};

export type SheetRow = { label?: string; hours?: string };
export type SheetColumn = { id: string; label?: string; rows?: SheetRow[] };
export type SheetSection = { id: string; title?: string; body?: string };
export type ProductSheet = {
  headline?: string;
  duration?: string;
  columns?: SheetColumn[];
  sections?: SheetSection[];
};

export type FichaInclude = { icon?: string; label?: string; note?: string };
export type FichaQuestion = { q?: string; a?: string };
export type FichaBlock = {
  id: string;
  type: 'intro' | 'incluye' | 'imagen' | 'texto' | 'areas' | 'horario' | 'preguntas' | 'llamado' | string;
  title?: string;
  body?: string;
  style?: 'cuerpo' | 'titulo' | 'enfasis' | 'nota' | string;
  url?: string;
  ratio?: '16:9' | '1:1' | string;
  caption?: string;
  label?: string;
  note?: string;
  items?: Array<FichaInclude | FichaQuestion | string>;
  headline?: string;
  duration?: string;
  columns?: SheetColumn[];
  sections?: SheetSection[];
};

export type ProductFicha = {
  v: 1;
  cover?: { wide?: string; square?: string; alt?: string };
  blocks: FichaBlock[];
};

export type CatalogNeed = { id: string; label: string };
export type CatalogRow = { key?: string; label?: string } | string;

export type CatalogItem = {
  id: string;
  title: string;
  description?: string;
  color?: string;
  priceCop?: number;
  comparePriceCop?: number;
  badge?: string;
  seatsFull?: boolean;
  seatsRemaining?: number | null;
  includes?: CatalogRow[];
  addons?: { key: string; label: string; priceCop: number }[];
  catalog?: {
    kind?: string;
    tagline?: string;
    highlights?: CatalogRow[];
    durationLabel?: string;
    startsLabel?: string;
    coverUrl?: string;
    featured?: boolean;
    needs?: string[];
  };
  /** Producto armado en Comercio. El cobro usa ese id, no el precio suelto del aula. */
  commerce?: { productId: string; aulaId: string };
  /** Ficha v1. Si no viene, la landing la arma con lo que el producto todavía guarda suelto. */
  ficha?: ProductFicha;
  /** Bloques viejos. La ficha pública ya no los dibuja. */
  story?: StoryBlock[];
  /** Horario suelto, anterior a la ficha v1. */
  sheet?: ProductSheet;
};

export function kindLabel(kind?: string) {
  return (kind && KIND_LABEL[kind]) || 'Programa';
}

export function seatsLabel(item: CatalogItem) {
  if (item.seatsFull) return 'Sin cupos';
  if (item.seatsRemaining == null) return 'Cupos abiertos';
  if (item.seatsRemaining === 1) return 'Queda 1 cupo';
  return `Quedan ${item.seatsRemaining} cupos`;
}

export function priceLabel(value?: number) {
  return value && value > 0 ? formatCop(value) : 'Gratis';
}

export function rowLabel(row: CatalogRow) {
  return typeof row === 'string' ? row : row.label || '';
}

export function enrollHref(id: string) {
  return `${appOrigin()}/inscripcion?aula=${encodeURIComponent(id)}`;
}

/** Pagar un producto de Comercio, o el aula publicada si no hay producto. */
export function payHref(item: { id: string; productId?: string; aulaId?: string; commerce?: { productId?: string; aulaId?: string } }) {
  const productId = item.productId || item.commerce?.productId || '';
  const aulaId = item.aulaId || item.commerce?.aulaId || (productId ? '' : item.id);
  if (productId && !aulaId) return '';
  const params = new URLSearchParams();
  if (aulaId) params.set('aula', aulaId);
  if (productId) params.set('producto', productId);
  const query = params.toString();
  return query ? `${appOrigin()}/inscripcion?${query}` : '';
}

export function accountHref(id: string) {
  return `${appOrigin()}/estudiante/cuenta/programas?producto=${encodeURIComponent(id)}`;
}

export function includeColumns(count: number) {
  if (count > 1 && count % 3 === 0) return 3;
  if (count > 1 && count % 2 === 0) return 2;
  return 0;
}
