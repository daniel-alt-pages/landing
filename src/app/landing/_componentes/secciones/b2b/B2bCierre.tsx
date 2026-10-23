import { COLEGIOS } from '../../../_contenido/colegios';
import { B2B_CIERRE } from '../../../_contenido/b2b/modelo';
import { b2bWhatsappUrl, B2B_CONTACTO } from '../../../_contenido/b2b/contacto';
import { LeadForm } from '../LeadForm';

export function B2bCierre() {
  return (
    <section id="agendar" className="ag-section ag-tone-red ag-b2b ag-b2b-cierre" aria-labelledby="b2b-cierre-title">
      <div className="ag-wrap ag-b2b-cierre-grid">
        <div className="ag-b2b-cierre-copy">
          <h2 id="b2b-cierre-title">{B2B_CIERRE.titulo}</h2>
          <p>{B2B_CIERRE.linea}</p>
          <ul className="ag-b2b-cierre-lista">
            <li>Informe individual para cada estudiante.</li>
            <li>Panel general de resultados por competencia para la rectoría.</li>
            <li>Resultados a la semana siguiente.</li>
          </ul>
          <ul className="ag-b2b-cierre-trust" aria-label="Datos de la alianza">
            <li><strong>500/500</strong> en 2025</li>
            <li><strong>{COLEGIOS.length} instituciones</strong> con al menos un simulacro</li>
          </ul>
          <p className="ag-b2b-nota">
            <a href={`mailto:${B2B_CONTACTO.email}`}>{B2B_CONTACTO.email}</a>
            <br />
            {B2B_CONTACTO.telefonoVisible} · <a href={b2bWhatsappUrl()}>Escribir por WhatsApp</a>
          </p>
        </div>
        {/* Destino del CTA «Agendar reunión» del header en esta página: el usuario no sale de /instituciones. */}
        <div id="solicitar-reunion" className="ag-b2b-form-card">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
