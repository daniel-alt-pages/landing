'use client';

import { RESULTADOS_SUPERACION } from '../../_contenido/resultados';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';
import { AlbumesCarousel } from './AlbumesCarousel';

/** `excluirFotos`: src de fotos que ya muestra otra sección de la misma página (p. ej. la cinta B 2026 en /landing). */
export function ResultsGallery({ id = 'resultados', excluirFotos }: { id?: string; excluirFotos?: string[] } = {}) {
  return (
    <Section id={id} tone="grey" label={`${id}-title`}>
      <DisplayTitle id={`${id}-title`} lines={[{ text: 'Puntajes que' }, { text: 'cambian trayectorias', accent: true }]} />
      <Lead>Tres álbumes con los puntajes reales de nuestros estudiantes y quienes subieron más de 100 puntos con nuestro acompañamiento.</Lead>
      <AlbumesCarousel excluirFotos={excluirFotos} />
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
