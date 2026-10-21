import Link from 'next/link';
import { COMPANY } from '@/bridge/legal/company';
import { LEGAL_DOCS } from '@/bridge/legal/documents';

export const metadata = {
  title: 'Información legal · SEAMOSGENIOS',
  description: 'Términos, privacidad, cookies, reembolsos y contacto de SEAMOSGENIOS SAS.',
};

export default function LegalIndexPage() {
  return (
    <main style={pageStyle}>
      <p style={kickerStyle}>SEAMOSGENIOS SAS · NIT {COMPANY.nit} · {COMPANY.city}</p>
      <h1 style={titleStyle}>Información legal</h1>
      <p style={leadStyle}>Términos, privacidad, cookies, reembolsos, acceso y contacto.</p>
      <ul style={listStyle}>
        {LEGAL_DOCS.map((doc) => (
          <li key={doc.id}>
            <Link href={`/legal/${doc.id}`} style={linkStyle}>{doc.title}</Link>
            <p style={summaryStyle}>{doc.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}

const pageStyle = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '48px 20px 72px',
  fontFamily: 'Montserrat, system-ui, sans-serif',
  color: '#0F172A',
  background: '#FFFFFF',
  minHeight: '100vh',
} as const;

const kickerStyle = { fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' } as const;
const titleStyle = { fontSize: 32, lineHeight: 1.2, margin: '12px 0 8px' } as const;
const leadStyle = { fontSize: 16, lineHeight: 1.5, color: '#334155' } as const;
const listStyle = { listStyle: 'none', padding: 0, margin: '28px 0 0', display: 'grid', gap: 16 } as const;
const linkStyle = { color: '#9F1239', fontWeight: 700, fontSize: 18 } as const;
const summaryStyle = { margin: '4px 0 0', color: '#334155', fontSize: 14, lineHeight: 1.45 } as const;
