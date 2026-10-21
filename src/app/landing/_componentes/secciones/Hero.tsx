import { HERO } from '../../_contenido/hero';
import { ALCANCE } from '../../_contenido/sitio';
import { contactoHref } from '../../_lib/links';
import { MotionIn } from '../primitivas/MotionIn';
import { Counter } from '../primitivas/Counter';
import { HeroMascota } from './HeroMascota';
import { HeroTiendaEjemplo } from './HeroTiendaEjemplo';

/** Mini infografías con los conteos reales de cada cifra (9 colegios, 20 instituciones, 65 instituciones). */
const Casita = ({ x, y }: { x: number; y: number }) => (
  <path transform={`translate(${x} ${y})`} d="M0 6 6 1l6 5v8H0z M4.5 14v-4h3v4" />
);
const STAT_VIS = [
  // 716 estudiantes en 9 colegios: 9 colegios
  <svg key="v1" viewBox="0 0 64 52" className="ag-cifra-vis is-casas">
    {Array.from({ length: 9 }, (_, i) => <Casita key={i} x={2 + (i % 3) * 21} y={2 + Math.floor(i / 3) * 17} />)}
  </svg>,
  // 420 estudiantes en 20 instituciones: 20 bloques
  <svg key="v2" viewBox="0 0 64 52" className="ag-cifra-vis is-bloques">
    {Array.from({ length: 20 }, (_, i) => <rect key={i} x={2 + (i % 5) * 12.5} y={2 + Math.floor(i / 5) * 12.5} width="9" height="9" rx="2" />)}
  </svg>,
  // 65 instituciones: 65 puntos
  <svg key="v3" viewBox="0 0 64 52" className="ag-cifra-vis is-puntos">
    {Array.from({ length: 65 }, (_, i) => <circle key={i} cx={3 + (i % 13) * 4.85} cy={4 + Math.floor(i / 13) * 11} r="1.9" />)}
  </svg>,
];

export function Hero() {
  return (
    <section id="inicio" className="ag-section ag-hero ag-hero-v2" aria-labelledby="hero-title">
      <div className="ag-hero-grid ag-hero-1col">
        <div className="ag-hero-copy">
          {/* H1 en un solo nodo de texto y sin animación: es el texto del primer pliegue. */}
          <h1 id="hero-title" className="ag-display">{`${HERO.title[0]} ${HERO.title[1]}`}</h1>
          <MotionIn onMount delay={40}>
            <p className="ag-lead">{HERO.lead}</p>
            <ul className="ag-hero-bullets">
              {HERO.bullets.map((b) => (
                <li key={b}>
                  <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {b}
                </li>
              ))}
            </ul>
          </MotionIn>
          <MotionIn onMount delay={80} className="ag-hero-cta">
            <a className="ag-btn" href={contactoHref('reunion')}>{HERO.ctaPrimary}</a>
            <a className="ag-text-link" href={contactoHref('simulacro')}>o {HERO.ctaSecondary.toLowerCase()}</a>
          </MotionIn>
          <HeroMascota />
          <MotionIn onMount delay={120}>
            <dl className="ag-hero-alcance">
              {ALCANCE.map((row, i) => (
                <div key={row.valor} className="ag-cifra">
                  <span className="ag-cifra-vis-wrap" aria-hidden="true">{STAT_VIS[i]}</span>
                  <dt><Counter value={Number(row.valor)} /></dt>
                  <dd>{row.texto}</dd>
                </div>
              ))}
            </dl>
          </MotionIn>
          <HeroTiendaEjemplo />
        </div>
      </div>
    </section>
  );
}
