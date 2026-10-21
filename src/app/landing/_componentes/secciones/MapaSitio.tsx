import { RUTAS } from '../../_contenido/sitio';
import { ILUSTRACIONES } from '../../_contenido/sitio-ilustraciones';
import { MotionIn } from '../primitivas/MotionIn';

/**
 * «Qué encuentra en el sitio»: índice de navegación debajo del hero.
 * Tarjetas como enlaces reales, alternando claro/oscuro, con ilustraciones SVG en línea.
 * Ver landing-analisis/que-encuentra/REVISION-UIUX.md y REVISION-CRITICA.md.
 */
export function MapaSitio() {
  return (
    <section id="explorar" className="qe" aria-labelledby="mapa-titulo">
      <div className="qe-wrap">
        <MotionIn>
          <h2 id="mapa-titulo" className="qe-title">Qué encuentra en el sitio</h2>
          <p className="qe-lead">Una página para cada pregunta: el modelo para colegios, la plataforma, los programas para estudiantes y la evidencia.</p>
          <p className="qe-note">Todo lo que usted necesita, en un solo lugar.</p>
        </MotionIn>
        <ul className="qe-grid">
          {RUTAS.map((r, i) => (
            <MotionIn as="li" key={r.id} delay={i * 40} className="qe-item">
              <a href={r.href} className={`qe-card ${i % 2 ? 'is-dark' : 'is-light'}`}>
                <span className="qe-ilus" dangerouslySetInnerHTML={{ __html: ILUSTRACIONES[r.id] ?? '' }} />
                <span className="qe-body">
                  <span className="qe-eyebrow">{r.para}</span>
                  <span className="qe-card-title">{r.titulo}</span>
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
