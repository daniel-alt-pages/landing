import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FichaRender } from './FichaRender';
import { fichaFromLegacy } from './fichaLegacy';

describe('ficha de Calendario B', () => {
  it('pasa los beneficios a Qué incluye y lista las áreas', () => {
    const ficha = fichaFromLegacy({
      id: 'prd-e67905f70b',
      title: 'Calendario B - 2026',
      commerce: { productId: 'prd-e67905f70b', aulaId: 'aula-cal-b-2026' },
      includes: [{ label: 'Simulacros' }, { label: 'Desafíos' }],
      catalog: { coverUrl: '' },
    });
    const html = renderToStaticMarkup(createElement(FichaRender, { ficha }));
    expect(html).toContain('Simulacros');
    expect(html).toContain('Desafíos');
    expect(html).toContain('Matemáticas');
    expect(html).toContain('Calendario B 2026');
    expect(html).toContain('<strong>Cómo se trabaja</strong>');
    expect(ficha.blocks.some((block) => block.type === 'areas')).toBe(true);
  });
});
