/**
 * CAPA DE DATOS DE LA TIENDA (punto único de conexión con el backend).
 *
 * Los componentes NO importan los archivos de ejemplo directamente: piden los datos a
 * `fuenteTienda()`. Hoy la fuente es de ejemplo (_contenido/tienda-ejemplo*.ts).
 * Para pasar al servidor real basta con implementar `fuenteApi` (TODO) y devolverla aquí;
 * los tipos ya son los definitivos.
 *
 *   - Catálogo (productos + configuración): API de Comercio `/api/tienda/landing`.
 *   - Ficha (descripción, incluye, detalles, opiniones, preguntas).
 *   - Comentarios: ver _lib/comentarios.ts (postComentario + NEXT_PUBLIC_COMENTARIOS_API_URL).
 */
import type { TiendaConfig, TiendaProduct } from '../_lib/tienda';
import { TIENDA_EJEMPLO_CONFIG, TIENDA_EJEMPLO_PRODUCTOS, tiendaEjemploActiva } from '../_contenido/tienda-ejemplo';
import {
  extrasTarjeta,
  fichaEjemploDe,
  FICHA_EJEMPLO_IDS,
  type ExtrasTarjeta,
  type FichaEjemplo,
} from '../_contenido/tienda-ejemplo-fichas';

export type FichaPrograma = FichaEjemplo;
export type { ExtrasTarjeta };

export interface FuenteTienda {
  /** Nombre de la fuente, para depurar. */
  readonly nombre: 'ejemplo' | 'api';
  catalogo(): { config: TiendaConfig; products: TiendaProduct[] };
  ficha(id: string): FichaPrograma | null;
  extras(id: string): ExtrasTarjeta | null;
  /** Ids con ficha estática (generateStaticParams). */
  idsEstaticos(): string[];
}

const fuenteEjemplo: FuenteTienda = {
  nombre: 'ejemplo',
  catalogo: () => ({ config: TIENDA_EJEMPLO_CONFIG, products: TIENDA_EJEMPLO_PRODUCTOS }),
  ficha: fichaEjemploDe,
  extras: extrasTarjeta,
  idsEstaticos: () => FICHA_EJEMPLO_IDS,
};

/** Fuente vacía: sin ejemplo y sin backend de fichas todavía. */
const fuenteVacia: FuenteTienda = {
  nombre: 'api',
  catalogo: () => ({ config: TIENDA_EJEMPLO_CONFIG, products: [] }),
  ficha: () => null,
  extras: () => null,
  idsEstaticos: () => [],
};

/** TODO(backend): devolver aquí la fuente real (fichas/opiniones desde la API) cuando exista. */
export function fuenteTienda(): FuenteTienda {
  return tiendaEjemploActiva() ? fuenteEjemplo : fuenteVacia;
}

export { tiendaEjemploActiva };
