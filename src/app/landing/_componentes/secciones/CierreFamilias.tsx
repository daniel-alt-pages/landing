import { CONTACTO } from '../../_contenido/contacto';
import { buildWaUrl, WA_TEXT } from '../../_lib/whatsapp';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

/** Cierre de /programas para estudiantes y familias. El cierre institucional vive en /instituciones#agendar. */
export function CierreFamilias() {
  return (
    <Section id="contacto" tone="white" label="cierre-familias-title">
      <header className="ag-section-head">
        <DisplayTitle id="cierre-familias-title" lines={[{ text: '¿Ya sabe qué programa' }, { text: 'le sirve?', accent: true }]} />
        <Lead>Elija su programa. Si tiene dudas, escríbanos por WhatsApp antes de comprar.</Lead>
      </header>
      <p className="ag-faq-cta">
        <a className="ag-btn" href="/landing/programas">Ver los programas</a>{' '}
        <a className="ag-btn" href={buildWaUrl(CONTACTO.whatsappB2B, WA_TEXT.estudiantes)}>Escribir por WhatsApp</a>
      </p>
      <p style={{ textAlign: 'center' }}>¿Escribe por un colegio? <a href="/landing/instituciones#agendar">Vea el portafolio para instituciones</a>.</p>
    </Section>
  );
}
