import { RUTAS } from '../../_contenido/sitio';
import { MotionIn } from '../primitivas/MotionIn';

/** Qué hay en el resto del sitio, con resúmenes tomados del contenido de cada página. */
export function MapaSitio() {
  return (
    <section id="explorar" className="ag-section ag-mapa" aria-labelledby="mapa-titulo">
      <div className="ag-wrap">
        <MotionIn>
          <h2 id="mapa-titulo" className="ag-mapa-title">Qué encuentra en el sitio</h2>
          <p className="ag-mapa-lead">Una página para cada pregunta: el modelo para colegios, la plataforma, los programas para estudiantes y la evidencia.</p>
        </MotionIn>
        <ul className="ag-mapa-rutas">
          {RUTAS.map((r, i) => (
            <MotionIn as="li" key={r.id} delay={i * 40}>
              <a href={r.href} className="ag-mapa-ruta">
                <span className="ag-mapa-para">{r.para}</span>
                <strong>{r.titulo}</strong>
                <span className="ag-mapa-texto">{r.texto}</span>
                <span className="ag-mapa-ir" aria-hidden>Ver página →</span>
              </a>
            </MotionIn>
          ))}
        </ul>
      </div>
    </section>
  );
}
