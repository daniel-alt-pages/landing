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
  heroTitle: 'Programas a la venta (ejemplo)',
  heroSubtitle: 'Vitrina de prueba con productos ficticios. No están a la venta.',
  urgencyBanner: true,
  urgencyText: 'Ejemplo · Aviso de prueba de la tienda. Texto y fechas ficticios.',
  bold: true,
  transfer: true,
};

const p = (id: string, name: string, kind: string, priceCop: number): TiendaProduct => ({
  id: `ejemplo-${id}`,
  name: `[Ejemplo] ${name}`,
  kind,
  priceCop,
  badge: 'Ejemplo',
  perks: ['Producto ficticio de prueba'],
});

export const TIENDA_EJEMPLO_PRODUCTOS: TiendaProduct[] = [
  p('a', 'Producto de prueba A', 'pase', 111111),
  p('b', 'Producto de prueba B', 'combo', 222222),
  p('c', 'Simulacro de prueba C', 'simulacro', 33333),
  p('d', 'Curso de prueba D', 'material', 44444),
  p('e', 'Simulacro de prueba E', 'simulacro', 55555),
];
