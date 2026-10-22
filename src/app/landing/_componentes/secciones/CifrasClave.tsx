'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Section } from '../primitivas/Section';
import { ResumenModal } from '../bits/ResumenModal';
import { Marquee } from '../primitivas/Marquee';
import { MarqueePause } from '../primitivas/MarqueePause';
import { COLEGIOS } from '../../_contenido/colegios';

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

export function CifrasClave() {
  const reduce = useReducedMotion();
  const reveal = (i: number) => (reduce
    ? {}
    : { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.4, delay: i * 0.05, ease: EASE } });
  return (
    <Section id="cifras" tone="grey" label="cifras-title">
      <p className="ag-eyebrow">La alianza en cifras</p>
      <h2 id="cifras-title" className="ag-h2">Datos claros para decidir</h2>
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
      <MarqueePause target="sg-cifras-cinta" label="los escudos de las instituciones" />
      <ResumenModal
        titulo="La alianza en cuatro datos"
        puntos={[
          { titulo: '65 instituciones', texto: ' ya aplicaron al menos un simulacro con SeamosGenios.' },
          { titulo: 'Primer simulacro gratis', texto: ' sin costo y sin obligación de contratar.' },
          { titulo: 'Respuesta en 1 día hábil', texto: ' un asesor le escribe para coordinar.' },
          { titulo: 'Reunión de 30 minutos', texto: ' le mostramos la plataforma en vivo.' },
        ]}
      />
    </Section>
  );
}
