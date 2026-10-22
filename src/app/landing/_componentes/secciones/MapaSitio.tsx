import { RUTAS } from '../../_contenido/sitio';
import { ILUSTRACIONES } from '../../_contenido/sitio-ilustraciones';
import { Caveat } from 'next/font/google';
import { MotionIn } from '../primitivas/MotionIn';
import { B2bMapa } from './b2b/B2bMapa';

const caveat = Caveat({ subsets: ['latin'], weight: '700', display: 'swap' });

/**
 * «Qué encuentra en el sitio»: índice de navegación debajo del hero.
 * Tarjetas como enlaces reales, alternando claro/oscuro, con ilustraciones SVG en línea.
 * Ver landing-analisis/que-encuentra/REVISION-UIUX.md y REVISION-CRITICA.md.
 */
/** Evita que «2026-A» se parta en dos líneas. */
function noPartir(t: string) {
  const m = t.split(/(\d{4}-[A-Z])/);
  return m.map((p, k) => (k % 2 ? <span key={k} className="qe-nb">{p}</span> : p));
}

export function MapaSitio({ variante }: { variante?: 'b2b' } = {}) {
  if (variante === 'b2b') return <B2bMapa />;
  return (
    <section id="explorar" className="qe" aria-labelledby="mapa-titulo">
      <div className="qe-wrap">
        <div className="qe-head">
        <MotionIn className="qe-intro">
          <svg className="qe-burst" viewBox="0 0 50 50" fill="none" aria-hidden="true" focusable="false">
            <path d="M26 8 L33 22" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M10 19 L25 27" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M8 35 L23 32" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
          <h2 id="mapa-titulo" className="qe-title">Qué encuentra en el sitio</h2>
          <p className="qe-lead">Una página para cada pregunta: el modelo para colegios, la plataforma, los programas para estudiantes y la evidencia.</p>
        </MotionIn>
        <div className="qe-anno">
          <p className={`qe-hand ${caveat.className}`}>
            Todo lo que necesitas,<br />
            <span className="qe-hand-last">
              en un solo lugar
              <svg className="qe-underline" viewBox="0 0 70 12" fill="none" aria-hidden="true" focusable="false">
                <path d="M4 9 C 25 5, 45 4, 66 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
          </p>
          <svg className="qe-curve" viewBox="0 0 70 70" fill="none" aria-hidden="true" focusable="false">
            <path d="M58 10 C 35 16, 22 35, 20 58" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M14 49 L 20 59 L 28 51" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        </div>
        <ul className="qe-grid">
          {RUTAS.map((r, i) => (
            <MotionIn as="li" key={r.id} delay={i * 40} className={`qe-item qe-item--${r.id}`}>
              <a href={r.href} aria-labelledby={`qe-t-${r.id}`} className={`qe-card ${i % 2 === 0 ? 'is-dark' : 'is-light'}`}>
                <span className="qe-ilus" dangerouslySetInnerHTML={{ __html: ILUSTRACIONES[r.id] ?? '' }} />
                <span className="qe-body">
                  <span className="qe-eyebrow">{r.para}</span>
                  <span id={`qe-t-${r.id}`} className="qe-card-title">{noPartir(r.titulo)}</span>
                  <span className="qe-text">{r.texto}</span>
                  <span className="qe-ir">
                    Ver página
                    <span className="qe-arrow" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </span>
                  </span>
                </span>
              </a>
            </MotionIn>
          ))}
        </ul>
      </div>
    </section>
  );
}
