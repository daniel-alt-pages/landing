import Image from 'next/image';
import Link from 'next/link';
import { CONTACTO } from '../../_contenido/contacto';
import { FOOTER } from '../../_contenido/footer';
import { MENU } from '../../_contenido/menu';
import { buildWaUrl, WA_TEXT } from '../../_lib/whatsapp';
import { Pending } from '../primitivas/bits';
import { CookiePrefsButton } from './CookiePrefsButton';
import { FooterMark } from './FooterMark';

const CANALES = [
  {
    href: buildWaUrl(CONTACTO.whatsappB2B, WA_TEXT.header),
    kicker: 'WhatsApp instituciones',
    value: CONTACTO.telefonoB2BVisible,
  },
  // Línea alterna (304 235 9048) retirada del pie hasta que Daniel confirme si sigue activa.
  {
    href: buildWaUrl(CONTACTO.whatsappEstudiantes, WA_TEXT.estudiantes),
    kicker: 'Estudiantes',
    value: CONTACTO.whatsappEstudiantesVisible,
  },
  { href: `mailto:${FOOTER.correo}`, kicker: 'Correo', value: FOOTER.correo },
] as const;

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
  return (
    <footer className="ag-footer">
      <div className="ag-wrap ag-footer-grid">
        <div>
          <Image src="/landing/brand/logo-sg-blanco.svg" alt="SEAMOSGENIOS" width={140} height={40} style={{ height: 40, width: 'auto' }} />
          <p className="ag-footer-lead">{FOOTER.frase}</p>
          <Link className="ag-btn" href="/landing#solicitar-reunion">
            Agendar reunión
          </Link>
        </div>
        {MENU.map((group) => (
          <div key={group.id}>
            <p className="ag-footer-title">
              <Link href={group.href}>{group.label}</Link>
            </p>
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
      <div className="ag-wrap ag-footer-contact">
        <p className="ag-footer-title">Contacto</p>
        <ul className="ag-footer-channels">
          {CANALES.map((item) => (
            <li key={item.kicker}>
              <a href={item.href}>
                <small>{item.kicker}</small>
                <strong>{item.value}</strong>
              </a>
            </li>
          ))}
        </ul>
        <ul className="ag-footer-social">
          {REDES.map((item) => (
            <li key={item.label}>
              <a href={item.href} target="_blank" rel="noreferrer">
                <item.Mark />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        {CONTACTO.canalWhatsApp ? (
          <a className="ag-footer-qr" href={CONTACTO.canalWhatsApp}>
            <Image src="/landing/brand/qr-canal.svg" alt="Código QR del canal de WhatsApp" width={64} height={64} />
          </a>
        ) : null}
      </div>
      <FooterMark />
      <div className="ag-wrap ag-footer-legal">
        <Pending note={FOOTER.confirmar}>
          <p>
            © {new Date().getFullYear()} SEAMOSGENIOS SAS
            {FOOTER.nit ? ` · NIT ${FOOTER.nit}` : ''} · <Link href="/landing/politica-de-datos">Política de datos</Link>
            {' · '}
            <CookiePrefsButton />
            {' · '}
            <a href={CONTACTO.web}>seamosgenios.org</a>
          </p>
        </Pending>
      </div>
    </footer>
  );
}
