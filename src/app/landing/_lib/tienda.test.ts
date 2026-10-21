import { describe, expect, it } from 'vitest';
import type { CatalogItem } from '../programas/catalogo/catalogUi';
import { pricesFromStore, storeFromCommerce, type TiendaProduct } from './tienda';

const aula: CatalogItem = {
  id: 'aula-cal-b-2026',
  title: 'Calendario B - 2026',
  priceCop: 0,
  seatsRemaining: 12,
  catalog: { kind: 'programa', needs: ['saber11'], coverUrl: '/b.jpg' },
};

const product: TiendaProduct = {
  id: 'prd-b',
  name: 'Pase Calendario B',
  kind: 'pase',
  priceCop: 180000,
  perks: ['Simulacros'],
  items: [{ kind: 'aula', ref: 'aula-cal-b-2026' }],
};

describe('tienda de comercio', () => {
  it('solo vende productos de Comercio, con los datos del aula que incluyen', () => {
    const rows = storeFromCommerce([product], [aula]);
    expect(rows.map((item) => item.id)).toEqual(['prd-b']);
    expect(rows[0].commerce).toEqual({ productId: 'prd-b', aulaId: 'aula-cal-b-2026' });
    expect(rows[0].priceCop).toBe(180000);
    expect(rows[0].catalog?.needs).toEqual(['saber11']);
    expect(rows[0].catalog?.coverUrl).toBe('/b.jpg');
    expect(rows[0].seatsRemaining).toBe(12);
  });

  it('la portada del producto se usa antes que la del aula', () => {
    const rows = storeFromCommerce([{ ...product, coverUrl: 'https://cdn.example/cuadrada.jpg' }], [aula]);
    expect(rows[0].catalog?.coverUrl).toBe('https://cdn.example/cuadrada.jpg');
  });

  it('sin productos en Comercio la tienda queda vacía aunque haya aulas', () => {
    expect(storeFromCommerce([], [aula])).toEqual([]);
  });

  it('conserva el precio anterior y el relato de la ficha', () => {
    const rows = storeFromCommerce([{
      ...product,
      priceCop: 899900,
      comparePriceCop: 1200000,
      story: [
        { id: 'foto', kind: 'image', text: '', url: 'https://cdn.example/foto.jpg', x: 2, y: 4, w: 46 },
        { id: 'copy', kind: 'text', text: 'Prepárate para el examen.', url: '', x: 52, y: 8, w: 44 },
      ],
    }], [aula]);
    expect(rows[0].comparePriceCop).toBe(1200000);
    expect(rows[0].priceCop).toBe(899900);
    expect(rows[0].story).toEqual([
      { id: 'foto', kind: 'image', text: '', url: 'https://cdn.example/foto.jpg', x: 2, y: 4, w: 46 },
      { id: 'copy', kind: 'text', text: 'Prepárate para el examen.', url: '', x: 52, y: 8, w: 44 },
    ]);
  });

  it('pasa el horario y las secciones del producto', () => {
    const rows = storeFromCommerce([{
      ...product,
      sheet: {
        headline: 'Horarios de este calendario',
        duration: 'De enero a junio',
        columns: [{ id: 'sab', label: 'Sábados', rows: [{ label: 'Mañana', hours: '8:00 a. m. – 12:00 p. m.' }] }],
        sections: [{ id: 'inc', title: 'Qué incluye', body: 'Clases en vivo' }],
      },
    }], [aula]);
    expect(rows[0].sheet?.headline).toBe('Horarios de este calendario');
    expect(rows[0].sheet?.columns?.[0].rows?.[0].hours).toBe('8:00 a. m. – 12:00 p. m.');
  });

  it('el carrito solo cobra precios de Comercio', () => {
    expect(pricesFromStore([product])).toEqual({ 'prd-b': 180000 });
  });

  it('la ficha guardada manda en qué incluye y en la portada', () => {
    const rows = storeFromCommerce([{
      ...product,
      ficha: {
        v: 1,
        cover: { square: 'https://cdn.example/sq.jpg', wide: '', alt: '' },
        blocks: [{ id: 'inc', type: 'incluye', items: [{ icon: 'examen', label: 'Miniexámenes', note: '' }] }],
      },
    }], [aula]);
    expect(rows[0].includes).toEqual([{ label: 'Miniexámenes' }]);
    expect(rows[0].catalog?.coverUrl).toBe('https://cdn.example/sq.jpg');
    expect(rows[0].ficha?.blocks[0].type).toBe('incluye');
  });
});
