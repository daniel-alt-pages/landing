import { CARRILES } from '../../../_contenido/programas';

const TIENDA = '/landing/programas?tipo=programa';

/**
 * PreICFES Intensivo y Vacacional: aquí solo se mencionan (duración, horas, simulacros).
 * Solo se mencionan en el portafolio.
 */
export function B2bPreicfes() {
  const programas = CARRILES.filter((c) => c.id === 'intensivo' || c.id === 'vacacional');
  return (
    <section id="preicfes" className="ag-section ag-tone-white ag-b2b ag-b2b-preicfes" aria-labelledby="b2b-preicfes-title">
      <div className="ag-wrap">
        <h2 id="b2b-preicfes-title" className="ag-b2b-title">PreICFES para estudiantes</h2>
        <p className="ag-b2b-preicfes-lead">Además del modelo institucional, sus estudiantes pueden tomar un PreICFES por su cuenta. Se compra en la tienda.</p>
        <ul className="ag-b2b-preicfes-lista">
          {programas.map((p) => {
            const simulacros = p.hitos.filter((h) => h.simulacro).length;
            return (
              <li key={p.id}>
                <h3>{p.nombre}</h3>
                <p className="ag-b2b-preicfes-dato">{p.detalle}</p>
                <p>Incluye {simulacros} simulacros dentro del programa, con clases en vivo y retroalimentación.</p>
                <a className="ag-b2b-preicfes-ir" href={TIENDA}>Ver en la tienda<span aria-hidden="true"> →</span></a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
