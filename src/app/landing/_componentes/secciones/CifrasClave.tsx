'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Section } from '../primitivas/Section';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Marquee } from '../primitivas/Marquee';
import { COLEGIOS } from '../../_contenido/colegios';
import { VOCES } from '../../_contenido/voces';
import { VoiceWall } from './VoiceWall';

/**
 * Cifras clave (número + texto, sin gráficos) y cinta de escudos reales (COLEGIOS). SOLO datos confirmados que ya publica el sitio:
 * 65 instituciones (hero.ts / menu.ts), primer simulacro gratis (faq.ts), respuesta en el próximo
 * día hábil y reunión de 30 minutos (gracias/GraciasView.tsx). No agregar cifras sin fuente.
 */
/** Título de la sección en dos líneas (solo cambiar el texto aquí). */
export const TITULO_CIFRAS = { linea1: 'Datos para decidir', linea2: 'puntajes que lo demuestran' } as const;

const EASE = [0.16, 1, 0.3, 1] as const;

const CIFRAS = [
  { tag: 'Instituciones', num: String(COLEGIOS.length), label: 'instituciones ya aplicaron al menos un simulacro.' },
  { tag: 'Primer simulacro', num: '$ 0', label: 'El primer simulacro no tiene costo ni lo obliga a contratar.' },
  { tag: 'Respuesta', num: '1 día hábil', label: 'Un asesor le escribe en el próximo día hábil.' },
  { tag: 'Reunión', num: '30', label: 'minutos de reunión para ver la plataforma en vivo.' },
];

/** `muroVoces`: solo la home lo activa; muestra el muro 2026A (sin título ni Lead) bajo la cinta de escudos. */
export function CifrasClave({ muroVoces = false }: { muroVoces?: boolean }) {
  const reduce = useReducedMotion();
  // Siempre se pasan whileInView/viewport: el HTML estático sale con opacity 0 (initial) y, si con
  // movimiento reducido no hubiera animación, las cifras quedaban invisibles. Con reduce: sin desplazamiento y duración 0.
  const reveal = (i: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: reduce ? { duration: 0 } : { duration: 0.4, delay: i * 0.05, ease: EASE },
  });
  return (
    <Section id="cifras" tone="grey" label="cifras-title">
      <DisplayTitle id="cifras-title" lines={[{ text: TITULO_CIFRAS.linea1 }, { text: TITULO_CIFRAS.linea2, accent: true }]} />
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
      {muroVoces ? <VoiceWall items={VOCES.filter((item) => item.text)} compact /> : null}
    </Section>
  );
}
