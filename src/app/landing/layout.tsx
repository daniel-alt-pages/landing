import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { FAQ } from './_contenido/faq';
import { RevealObserver } from './_componentes/primitivas/RevealObserver';
import { ConsentBanner } from './_componentes/secciones/ConsentBanner';
import { Breadcrumb } from './_componentes/secciones/Breadcrumb';
import { SiteFooter } from './_componentes/secciones/SiteFooter';
import { SiteHeader } from './_componentes/secciones/SiteHeader';
import { WhatsAppFab } from './_componentes/secciones/WhatsAppFab';
import './tokens.css';
import './landing-base.css';
import './landing.css';
import './tienda.css';
import './sistema.css';
import { MotionProvider } from './_componentes/primitivas/MotionProvider';

/** Dominio público de la landing (Vercel reescribe / → /landing; el resto vive en /landing/*). La app es app.seamosgenios.org. */
const SITE = 'https://seamosgenios.org';
const ORG_ID = `${SITE}/#organization`;

/** Tipografía única del sitio (tokens.css): Plus Jakarta Sans (variable 200-800) para títulos y texto;
 * Caveat solo como acento. Mismos subconjuntos locales que ya usaba /instituciones. */
const jakarta = localFont({
  src: './instituciones/fuentes/plus-jakarta-sans-var-latin-sub.woff2',
  weight: '200 800',
  display: 'swap',
  variable: '--font-alianza',
});
const caveat = localFont({
  src: './instituciones/fuentes/caveat-700-latin-sub.woff2',
  weight: '700',
  display: 'swap',
  variable: '--font-caveat',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  /* Manifest propio bajo /landing (en Pages /manifest.json queda fuera del sitio) con íconos PNG locales
   * de 5 y 14 KB generados del mismo app-icon.svg de prismic (240 KB) que usaba el manifest raíz. */
  manifest: '/landing/site.webmanifest',
  icons: {
    icon: [
      { url: '/landing/favicon.ico', sizes: 'any' },
      { url: '/landing/brand/sg-services-logo.svg', type: 'image/svg+xml' },
    ],
    apple: '/landing/brand/app-icon-192.png',
  },
  title: { absolute: 'Alianza Saber 11 para colegios | SEAMOSGENIOS' },
  description:
    'Simulacros tipo ICFES, panel de coordinación y clases en vivo para mejorar los resultados Saber 11 de su institución. El primer simulacro es gratis.',
  alternates: { canonical: './' },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'SEAMOSGENIOS',
    title: 'Alianza Saber 11 para colegios | SEAMOSGENIOS',
    description:
      'Simulacros tipo ICFES, panel de coordinación y clases en vivo para mejorar los resultados Saber 11 de su institución. El primer simulacro es gratis.',
    url: './',
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
      url: SITE,
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
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE },
      ],
    },
  ],
};

export default function AlianzaLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`alianza-root ${jakarta.variable} ${caveat.variable}`} lang="es-CO" data-app-surface="alianza">
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
