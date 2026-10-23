'use client';

import { RESULTADOS_SUPERACION } from '../../_contenido/resultados';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';
import { AlbumesCarousel } from './AlbumesCarousel';

/** `excluirFotos`: src de fotos que ya muestra otra sección de la misma página (p. ej. la cinta B 2026 en /landing). */
/** `carrusel={false}`: solo las tarjetas de Superación (en /landing el slider vive en #cifras). */
/** `superacion={false}`: sin tarjetas de Superación. `titulo`/`lead`: textos por página. `estilo="alianzas"`: tratamiento visual de AlianzasSection (solo /landing/resultados). */
type Linea = { text: string; accent?: boolean };
export function ResultsGallery({
  id = 'resultados',
  excluirFotos,
  carrusel = true,
  superacion = true,
  titulo,
  lead,
  estilo,
  titleAs = 'h2',
}: { titleAs?: 'h1' | 'h2'; id?: string; excluirFotos?: string[]; carrusel?: boolean; superacion?: boolean; titulo?: readonly Linea[]; lead?: string; estilo?: 'alianzas' } = {}) {
  return (
    <Section id={id} tone="grey" label={`${id}-title`} className={estilo === 'alianzas' ? 'ag-alianzas-sec ag-superacion-alianzas' : ''}>
      <DisplayTitle as={titleAs} id={`${id}-title`} lines={titulo ?? [{ text: 'Puntajes que' }, { text: 'cambian trayectorias', accent: true }]} />
      <Lead>{lead ?? 'Tres álbumes con los puntajes reales de nuestros estudiantes y quienes subieron más de 100 puntos con nuestro acompañamiento.'}</Lead>
      {carrusel ? <AlbumesCarousel excluirFotos={excluirFotos} /> : null}
      {superacion ? <div className={`ag-grid-4${estilo === 'alianzas' ? ' ag-alianzas-sec-body' : ''}`} style={{ marginTop: 16 }}>
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
      </div> : null}
    </Section>
  );
}
