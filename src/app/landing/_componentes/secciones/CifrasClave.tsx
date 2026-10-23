'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Section } from '../primitivas/Section';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Marquee } from '../primitivas/Marquee';
import { COLEGIOS } from '../../_contenido/colegios';
import { ALBUMES } from '../../_contenido/albumes';
import { INSTAGRAM_RESULTADOS_INTRO } from '../../_contenido/videos';

/**
 * Cifras clave (número + texto, sin gráficos) y cinta de escudos reales (COLEGIOS). SOLO datos confirmados que ya publica el sitio:
 * 65 instituciones (hero.ts / menu.ts), primer simulacro gratis (faq.ts), respuesta en el próximo
 * día hábil y reunión de 30 minutos (gracias/GraciasView.tsx). No agregar cifras sin fuente.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

const CIFRAS = [
  { tag: 'Instituciones', num: String(COLEGIOS.length), label: 'instituciones ya aplicaron al menos un simulacro.' },
  { tag: 'Primer simulacro', num: '$ 0', label: 'El primer simulacro no tiene costo ni lo obliga a contratar.' },
  { tag: 'Respuesta', num: '1 día hábil', label: 'Un asesor le escribe en el próximo día hábil.' },
  { tag: 'Reunión', num: '30', label: 'minutos de reunión para ver la plataforma en vivo.' },
];

const puntaje = (alt: string) => Number(/(\d{3})\/500/.exec(alt)?.[1] ?? 0);
/** Los 6 puntajes más altos del álbum Calendario B 2026 (albumes.ts). */
const TOP_B2026 = ALBUMES.filter((a) => a.id.startsWith('b2026'))
  .flatMap((a) => a.fotos)
  .sort((x, y) => puntaje(y.alt) - puntaje(x.alt))
  .slice(0, 6);

export function CifrasClave() {
  const reduce = useReducedMotion();
  const reveal = (i: number) => (reduce
    ? {}
    : { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.4, delay: i * 0.05, ease: EASE } });
  return (
    <Section id="cifras" tone="grey" label="cifras-title">
      <DisplayTitle id="cifras-title" lines={[{ text: 'Datos claros' }, { text: 'para decidir', accent: true }]} />
      <div className="sg-cifras">
        {CIFRAS.map((c, i) => (
          <motion.article key={c.tag} className="sg-cifra" {...reveal(i)}>
            <p className="sg-cifra-tag">{c.tag}</p>
            <p className="sg-cifra-num">{c.num}</p>
            <p className="sg-cifra-label">{c.label}</p>
          </motion.article>
        ))}
      </div>
      <div className="sg-cifras-colegios" id="sg-cifras-cinta">
        <Marquee className="ag-marquee-schools sg-marquee-crests" label={`Escudos de las ${COLEGIOS.length} instituciones con al menos un simulacro`}>
          {COLEGIOS.map((school) => (
            <figure key={school.id} className="sg-crest">
              <img src={school.src} alt="" width={64} height={64} loading="lazy" />
              <figcaption>{school.name}</figcaption>
            </figure>
          ))}
        </Marquee>
      </div>
      <div className="sg-b2026" aria-labelledby="b2026-title">
        <DisplayTitle id="b2026-title" lines={[{ text: 'Resultados' }, { text: 'Calendario B 2026', accent: true }]} />
        <p className="sg-b2026-lead">{INSTAGRAM_RESULTADOS_INTRO}</p>
        <ul className="sg-b2026-cards">
          {TOP_B2026.map((f) => (
            <li key={f.src} className="sg-b2026-card">
              <img src={f.src} alt={f.alt} width={1080} height={1350} loading="lazy" decoding="async" />
            </li>
          ))}
        </ul>
        <p className="sg-b2026-cta">
          <a className="ag-btn" href="/landing/resultados#resultados">Ver los álbumes completos</a>
        </p>
      </div>
    </Section>
  );
}
