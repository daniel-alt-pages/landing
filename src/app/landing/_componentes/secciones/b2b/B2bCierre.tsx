import { CheckCircle2, Mail, MessageCircle, Phone } from 'lucide-react';
import { B2B_CIERRE } from '../../../_contenido/b2b/modelo';
import { b2bWhatsappUrl, B2B_CONTACTO } from '../../../_contenido/b2b/precios';
import { LeadForm } from '../LeadForm';

const BENEFICIOS_DIAGNOSTICO = [
  'Simulacro diagnóstico inicial sin costo para grado 11',
  'Informe analítico ejecutivo para Rectoría y Consejo Directivo',
  'Modelo TRI calibrado con la escala oficial del ICFES',
  'Acompañamiento técnico y respuesta en menos de 24 horas',
];

export function B2bCierre() {
  return (
    <section id="agendar" className="ag-section ag-tone-red ag-b2b ag-b2b-cierre" aria-labelledby="b2b-cierre-title">
      <div className="ag-wrap ag-b2b-cierre-grid">
        <div className="ag-b2b-cierre-info">
          <span className="ag-b2b-cierre-kicker">Alianzas y Adopción Institucional</span>
          <h2 id="b2b-cierre-title">{B2B_CIERRE.titulo}</h2>
          <p className="ag-b2b-cierre-lead">{B2B_CIERRE.linea}</p>

          <ul className="ag-b2b-cierre-beneficios">
            {BENEFICIOS_DIAGNOSTICO.map((beneficio) => (
              <li key={beneficio}>
                <CheckCircle2 size={18} className="ag-b2b-cierre-check" aria-hidden="true" />
                <span>{beneficio}</span>
              </li>
            ))}
          </ul>

          <div className="ag-b2b-cierre-contacto">
            <a
              className="ag-b2b-btn ag-b2b-btn-white"
              href={b2bWhatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={18} aria-hidden="true" />
              Escribir por WhatsApp
            </a>
            <a
              className="ag-b2b-btn ag-b2b-btn-ghost-white"
              href={`mailto:${B2B_CONTACTO.email}`}
            >
              <Mail size={18} aria-hidden="true" />
              {B2B_CONTACTO.email}
            </a>
          </div>

          <p className="ag-b2b-cierre-tel">
            <Phone size={16} aria-hidden="true" />
            <span>Línea institucional: <strong>{B2B_CONTACTO.telefonoVisible}</strong></span>
          </p>
        </div>

        {/* Destino del CTA «Agendar reunión» del header en esta página: el usuario no sale de /instituciones */}
        <div id="solicitar-reunion" className="ag-b2b-form-card">
          <div className="ag-b2b-form-head">
            <h3>Agendar reunión técnica</h3>
            <p>Complete los datos de la institución para coordinar la sesión de 30 minutos.</p>
          </div>
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
