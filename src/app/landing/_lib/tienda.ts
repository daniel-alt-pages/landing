import type { CatalogItem, ProductFicha, ProductSheet, StoryBlock } from '../programas/catalogo/catalogUi';

export type TiendaConfig = {
  heroTitle?: string;
  heroSubtitle?: string;
  ctaLabel?: string;
  urgencyBanner?: boolean;
  urgencyText?: string;
  bold?: boolean;
  transfer?: boolean;
  allowInstallments?: boolean;
};

export type TiendaProduct = {
  id: string;
  name: string;
  kind: string;
  priceCop: number;
  comparePriceCop?: number;
  badge?: string;
  coverUrl?: string;
  perks?: string[];
  stock?: number | null;
  items?: { kind?: string; ref?: string }[];
  story?: StoryBlock[];
  sheet?: ProductSheet;
  ficha?: ProductFicha;
};

const KIND: Record<string, string> = {
  simulacro: 'simulacro',
  desafio: 'curso',
  material: 'curso',
  tutoria: 'curso',
  pase: 'programa',
  combo: 'programa',
};

export function coverForKind(kind?: string) {
  if (kind === 'simulacro') return '/landing/productos/simulacro.jpg';
  if (kind === 'curso') return '/landing/productos/curso.jpg';
  return '/landing/productos/intensivo.jpg';
}

export function aulaOfProduct(product: { items?: { kind?: string; ref?: string }[] }) {
  const row = (product.items || []).find((item) => item.kind === 'aula' && item.ref);
  return row?.ref || '';
}

/** Producto de Comercio con los datos públicos del aula que vende (foto, necesidades, cupos). */
export function productToCatalog(product: TiendaProduct, aulas: CatalogItem[] = []): CatalogItem {
  const aulaId = aulaOfProduct(product);
  const aula = aulas.find((row) => row.id === aulaId);
  const perks = (product.perks || []).filter(Boolean);
  const ficha = product.ficha?.v === 1 && Array.isArray(product.ficha.blocks) ? product.ficha : undefined;
  const incluido = (ficha?.blocks || []).find((block) => block.type === 'incluye');
  const labels = (incluido?.items || []).map((item) => {
    if (typeof item === 'string') return item;
    return 'label' in item ? (item.label || '') : '';
  }).filter(Boolean);
  const stock = product.stock == null ? null : Number(product.stock);
  const aulaFull = Boolean(aula?.seatsFull);
  const cover = product.coverUrl || ficha?.cover?.square || ficha?.cover?.wide || aula?.catalog?.coverUrl || '';
  return {
    id: product.id,
    title: product.name,
    description: aula?.description || '',
    priceCop: Number(product.priceCop) || 0,
    comparePriceCop: Number(product.comparePriceCop) || 0,
    badge: product.badge || '',
    seatsFull: stock === 0 || aulaFull,
    seatsRemaining: stock ?? aula?.seatsRemaining ?? null,
    includes: labels.length ? labels.map((label) => ({ label })) : (perks.length ? perks.map((label) => ({ label })) : aula?.includes || []),
    catalog: {
      ...(aula?.catalog || {}),
      kind: aula?.catalog?.kind || KIND[product.kind] || 'programa',
      coverUrl: cover,
    },
    commerce: { productId: product.id, aulaId },
    story: Array.isArray(product.story) ? product.story.filter((block) => block && (block.kind === 'text' || block.kind === 'image')) : [],
    sheet: product.sheet && typeof product.sheet === 'object' ? product.sheet : undefined,
    ficha,
  };
}

export function storeFromCommerce(products: TiendaProduct[] = [], aulas: CatalogItem[] = []) {
  return products.filter((item) => item?.id && item.name).map((item) => productToCatalog(item, aulas));
}

export function pricesFromStore(products: { id?: string; priceCop?: number }[] = []) {
  const next: Record<string, number> = {};
  for (const item of products) {
    if (item?.id) next[String(item.id)] = Number(item.priceCop) || 0;
  }
  return next;
}
