import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Montserrat } from 'next/font/google';
import { FAQ } from './_contenido/faq';
import { RevealObserver } from './_componentes/primitivas/RevealObserver';
import { ConsentBanner } from './_componentes/secciones/ConsentBanner';
import { Breadcrumb } from './_componentes/secciones/Breadcrumb';
import { SiteFooter } from './_componentes/secciones/SiteFooter';
import { SiteHeader } from './_componentes/secciones/SiteHeader';
import { WhatsAppFab } from './_componentes/secciones/WhatsAppFab';
import './landing.css';
import './tienda.css';
import { MotionProvider } from './_componentes/primitivas/MotionProvider';

const SITE = 'https://alianza.seamosgenios.org';
const ORG_ID = 'https://simulacros-sg.web.app/#organization';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-alianza',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { absolute: 'Alianza Saber 11 para colegios | SEAMOSGENIOS' },
  description:
    'Simulacros tipo ICFES, panel de coordinación y clases en vivo para mejorar los resultados Saber 11 de su institución. El primer simulacro es gratis.',
  alternates: { canonical: SITE },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'SEAMOSGENIOS',
    title: 'Alianza Saber 11 para colegios | SEAMOSGENIOS',
    description:
      'Simulacros tipo ICFES, panel de coordinación y clases en vivo para mejorar los resultados Saber 11 de su institución. El primer simulacro es gratis.',
    url: SITE,
    images: [{ url: '/landing/og.jpg', width: 1200, height: 630, alt: 'Alianza estratégica educativa SEAMOSGENIOS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alianza Saber 11 para colegios | SEAMOSGENIOS',
    description: 'Primer simulacro gratis para tu colegio. Panel de coordinación y clases en vivo.',
    images: ['/landing/og.jpg'],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': ORG_ID,
      name: 'SEAMOSGENIOS',
      url: 'https://seamosgenios.org',
      areaServed: { '@type': 'Country', name: 'Colombia' },
    },
    {
      '@type': 'Service',
      '@id': `${SITE}/#alianza`,
      name: 'Alianza Saber 11 para instituciones',
      serviceType: 'Preparación Saber 11 para colegios',
      provider: { '@id': ORG_ID },
      areaServed: { '@type': 'Country', name: 'Colombia' },
      description: 'Simulacros tipo ICFES, panel de coordinación y clases en vivo para instituciones educativas.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SEAMOSGENIOS', item: 'https://seamosgenios.org' },
        { '@type': 'ListItem', position: 2, name: 'Alianza', item: SITE },
      ],
    },
  ],
};

export default function AlianzaLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`alianza-root ${montserrat.variable}`} lang="es-CO" data-app-surface="alianza">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      {/* Sin JS: framer-motion deja opacity:0 / blur en el HTML del servidor. Se fuerza visible. */}
      <noscript
        dangerouslySetInnerHTML={{
          __html:
            '<style>.alianza-root [style*="opacity:0"]{opacity:1!important;filter:none!important;transform:none!important}</style>',
        }}
      />
      <ConsentBanner />
      <SiteHeader />
      <main id="contenido">
        <Breadcrumb />
        <MotionProvider>{children}</MotionProvider>
      </main>
      <SiteFooter />
      <WhatsAppFab />
      <RevealObserver />
    </div>
  );
}
