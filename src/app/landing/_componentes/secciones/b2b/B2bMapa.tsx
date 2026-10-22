import { Caveat } from 'next/font/google';
import { B2B_MAPA } from '../../../_contenido/b2b/mapa';
import { ILUSTRACIONES } from '../../../_contenido/sitio-ilustraciones';
import { AlEntrar } from './base/AlEntrar';

const caveat = Caveat({ subsets: ['latin'], weight: '700', display: 'swap' });

function Ir({ texto = 'Ver página' }: { texto?: string }) {
  return (
    <span className="ag-b2m-ir">
      {texto}
      <span className="ag-b2m-circulo" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
      </span>
    </span>
  );
}

/** «Qué encuentra en el sitio» del panel B2B: tarjetas-enlace con etiqueta, «Ver página» y Legal al final. */
export function B2bMapa() {
  const { legal } = B2B_MAPA;
  return (
    <section id="explorar" className="ag-section ag-tone-white ag-b2b ag-b2m" aria-labelledby="b2m-titulo">
      <div className="ag-wrap">
        <div className="ag-b2m-head">
          <div className="ag-b2m-intro">
            <h2 id="b2m-titulo" className="ag-b2m-titulo">{B2B_MAPA.titulo}</h2>
            <p className="ag-b2m-lead">{B2B_MAPA.lead}</p>
          </div>
          <AlEntrar className="ag-b2m-nota">
            <p className={`ag-b2m-mano ${caveat.className}`}>
              <span className="ag-b2m-l1">{B2B_MAPA.nota[0]}</span>
              <span className="ag-b2m-l2">{B2B_MAPA.nota[1]}</span>
            </p>
            <svg className="ag-b2m-flecha" viewBox="0 0 70 70" fill="none" aria-hidden="true" focusable="false">
              <path d="M10 14 C 36 12, 50 30, 46 58" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M37 50 L 46 60 L 55 51" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </AlEntrar>
        </div>
        <AlEntrar className="ag-b2m-grid-wrap">
          <ul className="ag-b2m-grid">
            {B2B_MAPA.rutas.map((r, i) => (
              <li key={r.id} className="ag-b2m-item">
                <a href={r.href} aria-labelledby={`b2m-t-${r.id}`} className={`ag-b2m-card ${i % 2 === 0 ? 'is-claro' : 'is-oscuro'}`}>
                  <span className="ag-b2m-ilus" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ILUSTRACIONES[r.id] ?? '' }} />
                  <span className="ag-b2m-etiqueta">{r.etiqueta}</span>
                  <h3 id={`b2m-t-${r.id}`} className="ag-b2m-card-titulo">{r.titulo}</h3>
                  <span className="ag-b2m-texto">{r.texto}</span>
                  <Ir texto={'ir' in r ? r.ir : undefined} />
                </a>
              </li>
            ))}
            <li className="ag-b2m-item">
              <div className="ag-b2m-card is-oscuro is-legal">
                <span className="ag-b2m-ilus" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ILUSTRACIONES[legal.id] ?? '' }} />
                <span className="ag-b2m-etiqueta">{legal.etiqueta}</span>
                <h3 id="b2m-t-legal" className="ag-b2m-card-titulo">{legal.titulo}</h3>
                <span className="ag-b2m-texto">{legal.texto}</span>
                {legal.datos.map((d) => <span key={d} className="ag-b2m-texto ag-b2m-dato">{d}</span>)}
                <a className="ag-b2m-legal-link" href={legal.href} aria-labelledby="b2m-ir-legal b2m-t-legal">
                  <span id="b2m-ir-legal" className="ag-b2m-ir">Ver página
                    <span className="ag-b2m-circulo" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </span>
                  </span>
                </a>
              </div>
            </li>
          </ul>
        </AlEntrar>
      </div>
    </section>
  );
}
