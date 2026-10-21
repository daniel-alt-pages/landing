import { HERO } from '../../_contenido/hero';
import { ALCANCE } from '../../_contenido/sitio';
import { contactoHref } from '../../_lib/links';
import { MotionIn } from '../primitivas/MotionIn';
import { HeroMascota } from './HeroMascota';
import { HeroTiendaEjemplo } from './HeroTiendaEjemplo';

const iconProps = { viewBox: '0 0 24 24', width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Iconos de los indicadores: estudiantes, instituciones, simulacro aplicado. */
const STAT_ICONS = [
  <svg key="est" {...iconProps}><circle cx="9" cy="8" r="3.25" /><path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" /><circle cx="17" cy="9" r="2.5" /><path d="M16.5 14.6c2.3.2 4 1.8 4.5 4.4" /></svg>,
  <svg key="inst" {...iconProps}><path d="M3 9.5 12 4l9 5.5" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 20h18" /></svg>,
  <svg key="sim" {...iconProps}><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M9 3.5h6v2.5H9z" /><path d="m8.5 12.5 2 2 4-4.5" /><path d="M8.5 17.5h7" /></svg>,
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
                <div key={row.valor} className="ag-stat-card">
                  <span className="ag-stat-icon" aria-hidden="true">{STAT_ICONS[i]}</span>
                  <dt>{row.valor}</dt>
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
