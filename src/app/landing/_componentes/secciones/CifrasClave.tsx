'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Section } from '../primitivas/Section';
import { ResumenModal } from '../bits/ResumenModal';

/**
 * Cifras clave con gráficos ligeros (SVG/CSS). SOLO datos confirmados que ya publica el sitio:
 * 65 instituciones (hero.ts / menu.ts), primer simulacro gratis (faq.ts), respuesta en el próximo
 * día hábil y reunión de 30 minutos (gracias/GraciasView.tsx). No agregar cifras sin fuente.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

export function CifrasClave() {
  const reduce = useReducedMotion();
  const reveal = (i: number) => (reduce
    ? {}
    : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.45, delay: i * 0.06, ease: EASE } });
  const circ = 2 * Math.PI * 36;
  return (
    <Section id="cifras" tone="grey" label="cifras-title">
      <p className="ag-eyebrow">La alianza en cifras</p>
      <h2 id="cifras-title" className="ag-h2">Datos claros para decidir</h2>
      <div className="sg-cifras">
        <motion.article className="sg-cifra" {...reveal(0)}>
          <p className="sg-cifra-tag">Instituciones</p>
          <p className="sg-cifra-num">65</p>
          <div className="sg-dots" role="img" aria-label="65 puntos, uno por institución">
            {Array.from({ length: 65 }, (_, i) => <span key={i} />)}
          </div>
          <p className="sg-cifra-label">instituciones ya aplicaron al menos un simulacro.</p>
        </motion.article>
        <motion.article className="sg-cifra" {...reveal(1)}>
          <p className="sg-cifra-tag">Primer simulacro</p>
          <p className="sg-cifra-num">$ 0</p>
          <div className="sg-line" aria-hidden><span style={{ transform: 'scaleX(1)' }} /></div>
          <p className="sg-cifra-label">El primer simulacro no tiene costo ni lo obliga a contratar.</p>
        </motion.article>
        <motion.article className="sg-cifra" {...reveal(2)}>
          <p className="sg-cifra-tag">Respuesta</p>
          <p className="sg-cifra-num">1 día hábil</p>
          <p className="sg-steps" aria-hidden><b>Solicitud</b><i /><b>Asesor</b></p>
          <p className="sg-cifra-label">Un asesor le escribe en el próximo día hábil.</p>
        </motion.article>
        <motion.article className="sg-cifra" {...reveal(3)}>
          <p className="sg-cifra-tag">Reunión</p>
          <svg className="sg-ring" viewBox="0 0 88 88" role="img" aria-label="30 minutos, media hora">
            <circle className="track" cx="44" cy="44" r="36" />
            <motion.circle className="fill" cx="44" cy="44" r="36" transform="rotate(-90 44 44)"
              strokeDasharray={circ}
              initial={reduce ? false : { strokeDashoffset: circ }}
              whileInView={{ strokeDashoffset: circ / 2 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE }}
              style={reduce ? { strokeDashoffset: circ / 2 } : undefined} />
            <text x="44" y="50" textAnchor="middle" fontSize="18" fontWeight="800" fill="currentColor">30</text>
          </svg>
          <p className="sg-cifra-label">minutos de reunión para ver la plataforma en vivo.</p>
        </motion.article>
      </div>
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
