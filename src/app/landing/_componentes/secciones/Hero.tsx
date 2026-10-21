import { HERO } from '../../_contenido/hero';
import { ALCANCE } from '../../_contenido/sitio';
import { contactoHref } from '../../_lib/links';
import { MotionIn } from '../primitivas/MotionIn';
import { HeroMascota } from './HeroMascota';

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
            <p className="ag-hero-prueba">{HERO.prueba}</p>
          </MotionIn>
          <HeroMascota />
          <MotionIn onMount delay={120}>
            <dl className="ag-hero-alcance">
              {ALCANCE.map((row) => (
                <div key={row.valor}>
                  <dt>{row.valor}</dt>
                  <dd>{row.texto}</dd>
                </div>
              ))}
            </dl>
          </MotionIn>
        </div>
      </div>
    </section>
  );
}
