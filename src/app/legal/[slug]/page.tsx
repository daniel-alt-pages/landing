import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COMPANY } from '@/bridge/legal/company';
import { LEGAL_DOCS, getLegalDoc } from '@/bridge/legal/documents';

type LegalParams = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LEGAL_DOCS.map((doc) => ({ slug: doc.id }));
}

export async function generateMetadata({ params }: LegalParams) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  return {
    title: doc ? `${doc.title} · SEAMOSGENIOS` : 'Información legal',
    description: doc?.summary || 'Información legal de SEAMOSGENIOS SAS.',
  };
}

export default async function LegalDocumentPage({ params }: LegalParams) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  return (
    <main style={pageStyle}>
      <p style={kickerStyle}>
        {COMPANY.legalName} · NIT {COMPANY.nit} · {COMPANY.city}
      </p>
      <p style={{ marginTop: 16 }}>
        <Link href="/legal" style={linkStyle}>Todas las políticas</Link>
      </p>
      <h1 style={titleStyle}>{doc.title}</h1>
      <p style={metaStyle}>Actualizado el {doc.updated}</p>
      {doc.sections.map((section) => (
        <section key={section.heading} style={{ marginTop: 28 }}>
          <h2 style={headingStyle}>{section.heading}</h2>
          {(section.paragraphs || []).map((paragraph) => (
            <p key={paragraph} style={bodyStyle}>{paragraph}</p>
          ))}
          {section.bullets?.length ? (
            <ul style={bulletStyle}>
              {section.bullets.map((item) => (
                <li key={item} style={{ marginBottom: 8 }}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
      <nav aria-label="Otras políticas" style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {LEGAL_DOCS.filter((row) => row.id !== doc.id).map((row) => (
          <Link key={row.id} href={`/legal/${row.id}`} style={linkStyle}>{row.footerLabel}</Link>
        ))}
      </nav>
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

const kickerStyle = { fontSize: 13, fontWeight: 600 } as const;
const titleStyle = { fontSize: 32, lineHeight: 1.2, margin: '12px 0 0' } as const;
const metaStyle = { color: '#334155', fontSize: 14 } as const;
const headingStyle = { fontSize: 20, margin: '0 0 8px' } as const;
const bodyStyle = { fontSize: 16, lineHeight: 1.6, margin: '0 0 12px' } as const;
const bulletStyle = { paddingLeft: 20, fontSize: 16, lineHeight: 1.55 } as const;
const linkStyle = { color: '#9F1239', fontWeight: 700 } as const;
