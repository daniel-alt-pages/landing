'use client';

import { useState } from 'react';
import { AREA_LABELS, MURO_2026, RESULTADOS_DESTACADOS, RESULTADOS_SUPERACION } from '../../_contenido/resultados';
import { track } from '../../_lib/analytics';
import CountUp from '../bits/CountUp';
import { BrandPhoto } from '../primitivas/BrandPhoto';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Lightbox, type LightItem } from '../primitivas/Lightbox';
import { Section } from '../primitivas/Section';

export function ResultsGallery() {
  const [index, setIndex] = useState<number | null>(null);
  const items: LightItem[] = [...RESULTADOS_DESTACADOS, ...MURO_2026].map((item) => ({
    id: item.id,
    title: `${item.name} · ${item.global}/500`,
    text: `${item.city}. ${item.detail ?? 'Resultado Saber 11.'}`,
  }));

  return (
    <Section id="resultados" tone="grey" label="resultados-title">
      <DisplayTitle id="resultados-title" lines={[{ text: 'Puntajes que' }, { text: 'cambian trayectorias', accent: true }]} />
      <Lead>Un puntaje perfecto, cuatro resultados de élite y estudiantes que subieron más de 100 puntos con nuestro acompañamiento.</Lead>
      <div className="ag-grid-4" style={{ marginTop: 24 }}>
        {RESULTADOS_DESTACADOS.map((card, cardIndex) => (
          <button
            key={card.id}
            type="button"
            className="ag-card ag-result-card"
            onClick={() => {
              setIndex(cardIndex);
              track('open_result', { id: card.id });
            }}
          >
            <BrandPhoto alt="" />
            <p className="ag-stat-num ag-accent" style={{ fontSize: 40 }}>
              {/* El número final, invisible, reserva el ancho: el conteo no desplaza «/500». */}
              <span style={{ display: 'inline-grid' }}>
                <span aria-hidden style={{ gridArea: '1 / 1', visibility: 'hidden' }}>
                  {card.global}
                </span>
                <span style={{ gridArea: '1 / 1', justifySelf: 'start' }}>
                  <CountUp to={card.global} duration={1.2} />
                </span>
              </span>
              <span style={{ fontSize: 18 }}>/500</span>
            </p>
            <h3 className="ag-h3">{card.name}</h3>
            <p>{card.city}</p>
            {card.areas ? (
              <ul style={{ padding: 0, listStyle: 'none' }}>
                {AREA_LABELS.map((label, areaIndex) => (
                  <li key={label}>
                    <span>
                      {label}: {card.areas?.[areaIndex]}
                    </span>
                    <div className="ag-area" aria-hidden>
                      <span style={{ width: `${card.areas?.[areaIndex] ?? 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </button>
        ))}
      </div>
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
      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </Section>
  );
}
