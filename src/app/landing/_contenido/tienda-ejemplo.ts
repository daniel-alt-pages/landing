/**
 * PRODUCTOS DE EJEMPLO. NO SON REALES.
 *
 * Sirven solo para diseñar la vitrina (ProductRail) y el aviso (StorefrontBanner)
 * cuando la API de Comercio (127.0.0.1:5000) no responde.
 * Nombres y precios son marcadores evidentes: no corresponden a ningún producto.
 *
 * Bandera: NEXT_PUBLIC_TIENDA_EJEMPLO
 *   - '1'  → se usan también en build (rama de revisión).
 *   - '0'  → nunca se usan.
 *   - vacío → solo en `npm run dev`.
 * Para pasar a productos reales: dejar la bandera en '0' (o borrarla en producción)
 * y configurar NEXT_PUBLIC_EDUGENIOS_API_URL con la API pública de Comercio.
 */
import type { TiendaConfig, TiendaProduct } from '../_lib/tienda';

export function tiendaEjemploActiva() {
  const flag = process.env.NEXT_PUBLIC_TIENDA_EJEMPLO;
  if (flag === '0') return false;
  if (flag === '1') return true;
  return process.env.NODE_ENV === 'development';
}

export const TIENDA_EJEMPLO_CONFIG: TiendaConfig = {
  heroTitle: 'Programas · Ejemplo ilustrativo',
  heroSubtitle: 'Ejemplo ilustrativo de la tienda. Estos productos no están a la venta.',
  urgencyBanner: false,
  urgencyText: 'Ejemplo ilustrativo · Así se verá un aviso de la tienda.',
  transfer: true,
};

const p = (id: string, name: string, kind: string, priceCop: number): TiendaProduct => ({
  id: `ejemplo-${id}`,
  name: `${name} (ejemplo)`,
  kind,
  priceCop,
  badge: 'EJEMPLO',
  perks: ['Producto de ejemplo. No está a la venta.'],
});

export const TIENDA_EJEMPLO_PRODUCTOS: TiendaProduct[] = [
  p('a', 'Pase A', 'pase', 0),
  p('b', 'Combo B', 'combo', 0),
  p('c', 'Simulacro C', 'simulacro', 0),
  p('d', 'Curso D', 'material', 0),
  p('e', 'Simulacro E', 'simulacro', 0),
];
