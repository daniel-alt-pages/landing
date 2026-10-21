import { B2B_CIERRE } from '../../../_contenido/b2b/modelo';
import { b2bWhatsappUrl, B2B_CONTACTO } from '../../../_contenido/b2b/precios';

export function B2bCierre() {
  return (
    <section id="agendar" className="ag-section ag-tone-red ag-b2b ag-b2b-cierre" aria-labelledby="b2b-cierre-title">
      <div className="ag-wrap">
        <h2 id="b2b-cierre-title">{B2B_CIERRE.titulo}</h2>
        <p>{B2B_CIERRE.linea}</p>
        <div className="ag-b2b-acciones">
          <a className="ag-b2b-btn" href={`mailto:${B2B_CONTACTO.email}`}>Agendar reunión</a>
          <a className="ag-b2b-btn ag-b2b-btn-ghost" href={b2bWhatsappUrl()}>Escribir por WhatsApp</a>
        </div>
        <p className="ag-b2b-nota">{B2B_CONTACTO.email} · {B2B_CONTACTO.telefonoVisible}</p>
      </div>
    </section>
  );
}
