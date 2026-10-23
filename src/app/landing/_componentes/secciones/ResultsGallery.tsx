'use client';

import { RESULTADOS_SUPERACION } from '../../_contenido/resultados';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';
import { AlbumesCarousel } from './AlbumesCarousel';

export function ResultsGallery({ id = 'resultados' }: { id?: string } = {}) {
  return (
    <Section id={id} tone="grey" label={`${id}-title`}>
      <DisplayTitle id={`${id}-title`} lines={[{ text: 'Puntajes que' }, { text: 'cambian trayectorias', accent: true }]} />
      <Lead>Tres álbumes con los puntajes reales de nuestros estudiantes y quienes subieron más de 100 puntos con nuestro acompañamiento.</Lead>
      <AlbumesCarousel />
      <div className="ag-grid-4" style={{ marginTop: 16 }}>
        {RESULTADOS_SUPERACION.map((card) => (
          <article key={card.id} className="ag-card">
            <p className="ag-eyebrow">Superación</p>
            <h3 className="ag-h3">{card.name}</h3>
            <p className="ag-delta ag-delta-lg">
              {card.from ? `${card.from} → ${card.global}` : `${card.global}/500`}
            </p>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
