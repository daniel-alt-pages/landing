import { B2B_PREICFES } from '../../../_contenido/b2b/preicfes';

const CONTACTO = '#solicitar-reunion';

/**
 * PreICFES Intensivo y Vacacional: aquí solo se mencionan (duración, horas, simulacros).
 * Solo se mencionan en el portafolio.
 */
export function B2bPreicfes() {
  return (
    <section id="preicfes" className="ag-section ag-tone-white ag-b2b ag-b2b-preicfes" aria-labelledby="b2b-preicfes-title">
      <div className="ag-wrap">
        <h2 id="b2b-preicfes-title" className="ag-b2b-title">PreICFES para estudiantes</h2>
        <p className="ag-b2b-preicfes-lead">Además del modelo institucional, sus estudiantes pueden tomar un PreICFES por su cuenta. Si le interesa para sus estudiantes, hablemos.</p>
        <ul className="ag-b2b-preicfes-lista">
          {B2B_PREICFES.map((p) => {
            return (
              <li key={p.id}>
                <h3>{p.nombre}</h3>
                <p className="ag-b2b-preicfes-dato">{p.detalle}</p>
                <p>Incluye {p.simulacros} simulacros dentro del programa, con clases en vivo y retroalimentación.</p>
                <a className="ag-b2b-preicfes-ir" href={CONTACTO}>Hablar con nosotros<span aria-hidden="true"> →</span></a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
