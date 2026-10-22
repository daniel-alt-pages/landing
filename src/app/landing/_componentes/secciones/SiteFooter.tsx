import Image from 'next/image';
import Link from 'next/link';
import { CONTACTO } from '../../_contenido/contacto';
import { FOOTER } from '../../_contenido/footer';
import { MENU } from '../../_contenido/menu';
import { buildWaUrl, WA_TEXT } from '../../_lib/whatsapp';
import { Pending } from '../primitivas/bits';
import { CookiePrefsButton } from './CookiePrefsButton';
import { FooterMark } from './FooterMark';

function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ag-footer-icon">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function PhoneMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ag-footer-icon">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ag-footer-icon">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-3.2 1.6-4.8 4.9-4.9 1.2-.1 1.6-.1 4.8-.1Zm0 1.8c-3.1 0-3.5 0-4.7.1-2.2.1-3.2 1-3.3 3.3-.1 1.2-.1 1.6-.1 4.6s0 3.4.1 4.6c.1 2.2 1.1 3.2 3.3 3.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c2.2-.1 3.2-1.1 3.3-3.3.1-1.2.1-1.6.1-4.6s0-3.4-.1-4.6c-.1-2.2-1.1-3.2-3.3-3.3-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5.1-2.1a1.1 1.1 0 1 1 0 2.3 1.1 1.1 0 0 1 0-2.3Z" />
    </svg>
  );
}

function TikTokMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="currentColor" d="M14 3h2.2a4.8 4.8 0 0 0 3.6 3.4v2.3a7.2 7.2 0 0 1-3.6-1.1v7.1a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.4a3.3 3.3 0 1 0 2.3 3.1V3Z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="currentColor" d="M13.5 21v-7.2h2.4l.4-2.8h-2.8V9.2c0-.8.2-1.4 1.4-1.4H16.5V5.3c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2h-2.5v2.8H10.6V21h2.9Z" />
    </svg>
  );
}

const REDES = [
  { href: CONTACTO.redes.instagram, label: 'Instagram', Mark: InstagramMark },
  { href: CONTACTO.redes.tiktok, label: 'TikTok', Mark: TikTokMark },
  { href: CONTACTO.redes.facebook, label: 'Facebook', Mark: FacebookMark },
] as const;

export function SiteFooter() {
  const correoContacto = FOOTER.correo || 'soporte@seamosgenios.com';

  return (
    <footer className="ag-footer">
      {/* Navegación y Encabezado del Footer */}
      <div className="ag-wrap ag-footer-grid">
        <div>
          <Image
            src="/landing/brand/logo-sg-blanco.svg"
            alt="SEAMOSGENIOS"
            width={140}
            height={40}
            style={{ height: 40, width: 'auto' }}
          />
          <p className="ag-footer-lead">{FOOTER.frase}</p>
          <Link className="ag-btn" href="/landing#solicitar-reunion">
            Agendar reunión
          </Link>
        </div>
        {MENU.map((group) => (
          <div key={group.id}>
            <h2 className="ag-footer-title">
              <Link href={group.href}>{group.label}</Link>
            </h2>
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Sección Contacto y Redes: Centrada y Espaciada */}
      <div className="ag-wrap ag-footer-contact-wrap">
        <h2 className="ag-footer-contact-heading">CONTACTO Y REDES</h2>
        <div className="ag-footer-contact-cols">
          {/* Canales de atención */}
          <div className="ag-footer-contact-col">
            <h3 className="ag-footer-contact-subhead">CANALES DE ATENCIÓN</h3>
            <div className="ag-footer-contact-items">
              <a
                href={buildWaUrl(CONTACTO.whatsappB2B, WA_TEXT.header)}
                className="ag-footer-channel-link"
                target="_blank"
                rel="noreferrer"
              >
                <WhatsAppMark />
                <div className="ag-footer-channel-body">
                  <span className="ag-footer-channel-label">(icono de WhatsApp)</span>
                  <strong className="ag-footer-channel-val">{CONTACTO.telefonoB2BVisible}</strong>
                </div>
              </a>
              <a
                href={buildWaUrl(CONTACTO.whatsappEstudiantes, WA_TEXT.estudiantes)}
                className="ag-footer-channel-link"
                target="_blank"
                rel="noreferrer"
              >
                <PhoneMark />
                <div className="ag-footer-channel-body">
                  <span className="ag-footer-channel-label">(icono de teléfono)</span>
                  <strong className="ag-footer-channel-val">{CONTACTO.whatsappEstudiantesVisible}</strong>
                </div>
              </a>
            </div>
          </div>

          {/* Correo electrónico */}
          <div className="ag-footer-contact-col">
            <h3 className="ag-footer-contact-subhead">CORREO ELECTRÓNICO</h3>
            <div className="ag-footer-contact-items">
              <a href={`mailto:${correoContacto}`} className="ag-footer-channel-link">
                <MailMark />
                <div className="ag-footer-channel-body">
                  <span className="ag-footer-channel-label">(icono de correo)</span>
                  <strong className="ag-footer-channel-val">{correoContacto}</strong>
                </div>
              </a>
            </div>
          </div>

          {/* Síguenos en */}
          <div className="ag-footer-contact-col">
            <h3 className="ag-footer-contact-subhead">SÍGUENOS EN</h3>
            <div className="ag-footer-social-row">
              {REDES.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="ag-footer-social-link"
                >
                  <item.Mark />
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Marca SeamosGenios */}
      <FooterMark />

      {/* Barra de cookies y legal: Centrada en contenedor con píldora */}
      <div className="ag-wrap ag-footer-legal-wrap">
        <div className="ag-footer-legal-pill">
          <Pending note={FOOTER.confirmar}>
            <p className="ag-footer-legal-copy">
              © {new Date().getFullYear()} SEAMOSGENIOS SAS
              {FOOTER.nit ? ` · NIT ${FOOTER.nit}` : ''} ·{' '}
              <Link href="/landing/politica-de-datos">Política de datos</Link>
              {' · '}
              <CookiePrefsButton />
              {' · '}
              <a href={CONTACTO.web}>seamosgenios.org</a>
            </p>
          </Pending>
        </div>
      </div>
    </footer>
  );
}
