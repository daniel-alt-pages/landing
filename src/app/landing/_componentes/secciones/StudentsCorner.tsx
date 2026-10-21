import { formatCOP } from '@/lib/cotizacionSimulacro';
import { CONTACTO } from '../../_contenido/contacto';
import { VACACIONAL } from '../../_contenido/vacacional';
import { buildWaUrl, WA_TEXT } from '../../_lib/whatsapp';
import { Pending } from '../primitivas/bits';
import { Section } from '../primitivas/Section';

export function StudentsCorner() {
  const waEstudiantes = buildWaUrl(CONTACTO.whatsappEstudiantes, WA_TEXT.estudiantes);
  return (
    <Section id="estudiantes" tone="white" label="estudiantes-title">
      <div className="ag-students">
        <div>
          <p className="ag-eyebrow">Estudiantes y familias</p>
          <h2 id="estudiantes-title" className="ag-h2">
            <span>{VACACIONAL.titulo2}</span>
          </h2>
          <p className="ag-lead">También puedes prepararte por tu cuenta con nuestro PreICFES, con los mismos tutores y la misma plataforma.</p>
        </div>
        <Pending note={VACACIONAL.confirmar}>
          {VACACIONAL.activo ? (
            <article className="ag-card">
              <span className="ag-badge">{VACACIONAL.descuento}</span>
              <h3 className="ag-h3" style={{ marginTop: 12 }}>
                {VACACIONAL.titulo}
              </h3>
              <p>{VACACIONAL.lead}</p>
              {VACACIONAL.fechas ? <p>{VACACIONAL.fechas}</p> : null}
              <p>
                <s>{formatCOP(VACACIONAL.precioAntes)}</s> <strong className="ag-price">{formatCOP(VACACIONAL.precio)}</strong>
              </p>
              <ul>
                {VACACIONAL.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a className="ag-btn" href={waEstudiantes}>
                Quiero inscribirme
              </a>
            </article>
          ) : (
            <article className="ag-card">
              <h3 className="ag-h3">{VACACIONAL.inactivoTitulo}</h3>
              <p>{VACACIONAL.inactivoTexto}</p>
              <a className="ag-btn" href={CONTACTO.canalWhatsApp || waEstudiantes}>
                {CONTACTO.canalWhatsApp ? 'Unirme al canal' : 'Avisarme por WhatsApp'}
              </a>
            </article>
          )}
        </Pending>
      </div>
    </Section>
  );
}
