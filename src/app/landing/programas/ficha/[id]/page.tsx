import type { Metadata } from 'next';
import { FichaPagina } from '../../catalogo/FichaPagina';
import { fuenteTienda } from '../../../_datos/tienda';

export const metadata: Metadata = {
  title: { absolute: 'Ficha del programa | Alianza SEAMOSGENIOS' },
  description: 'Ficha completa del programa: qué incluye, imágenes y cómo inscribirte.',
};

/**
 * Export estático: los ids vienen del catálogo remoto (/api/tienda/landing + /api/programas).
 * En build se intenta leer ese catálogo; si no hay API, se genera una ficha
 * "_" que muestra el estado "no encontrado" del cliente.
 */
export async function generateStaticParams(): Promise<{ id: string }[]> {
  const base = (process.env.NEXT_PUBLIC_EDUGENIOS_API_URL || '').trim().replace(/\/$/, '');
  const ids = new Set<string>();
  if (base) {
    for (const url of [`${base}/api/tienda/landing`, `${base}/api/programas`]) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const body = (await res.json()) as { products?: { id?: unknown }[]; items?: { id?: unknown }[] };
        for (const row of [...(body.products || []), ...(body.items || [])]) {
          if (row && (typeof row.id === 'string' || typeof row.id === 'number')) ids.add(String(row.id));
        }
      } catch {
        /* sin API en build: se usa el fallback */
      }
    }
  }
  fuenteTienda().idsEstaticos().forEach((id) => ids.add(id));
  if (!ids.size) ids.add('_');
  return [...ids].map((id) => ({ id }));
}

export const dynamicParams = false;

export default async function FichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FichaPagina id={decodeURIComponent(id)} />;
}
