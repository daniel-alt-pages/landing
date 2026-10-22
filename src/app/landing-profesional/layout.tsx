import '@/app/globals.css';
import type { Metadata } from 'next';
import { MEDIA_MENTIONS } from '@/lib/mediaMentions';
import { Montserrat } from 'next/font/google';
import Script from 'next/script';
import './landing-profesional.css';
import { COTIZ_LANDING_THEME_LS_KEY } from '@/app/landing-profesional/contenido-landing/utilidades/cotizLandingDocChrome';

const SITE_URL = 'https://simulacros-sg.web.app';
const COTIZACION_URL = `${SITE_URL}/landing-profesional`;
const SEO_TITLE = 'Daniel Eduardo De la Cruz Vega | SEAMOSGENIOS, ADPMH y simulacros Saber 11 ICFES';
const SEO_DESCRIPTION =
  'Historia de Daniel Eduardo De la Cruz Vega, presidente, fundador y desarrollador de SEAMOSGENIOS: PreICFES que patrocina el sistema ADPMH, análisis detallado para mejorar habilidades, y aplica simulacros Saber 11 ICFES con IA, datos y propósito social.';
const DANIEL_IMAGE =
  'https://ik.imagekit.io/danydc/tr:w-1600,q-100,f-jpg/SEO%20WEB%20-%20SEAMOSGENIOS%20-%20DANIEL%20DE%20LA%20CRUZ%20VEGA/IMG-20260514-WA0009.jpg';
const DANIEL_PROFILE_URL = 'https://seamosgenios.org/NUEVO/secciones/tutor-daniel.html';
const DANIEL_LINKEDIN_URL = 'https://www.linkedin.com/in/daniel-eduardo-de-la-cruz-vega-b715a3297/';

const danielMediaMentions = MEDIA_MENTIONS;


const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-cotiz-sans',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const getStructuredDataAuthorType = (author: string) => (author === 'Richard Santa' ? 'Person' : 'Organization');

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  alternates: {
    canonical: '/landing-profesional',
  },
  category: 'educación',
  keywords: [
    'simulacros Saber 11',
    'simulacros ICFES',
    'pruebas Saber 11',
    'PreICFES Colombia',
    'simulacro ICFES para colegios',
    'aplicar simulacros Saber 11',
    'plataforma simulacros ICFES',
    'resultados pruebas Saber 11',
    'panel coordinador ICFES',
    'retroalimentación simulacro ICFES',
    'preparacion ICFES colegios',
    'SEAMOSGENIOS',
    'Daniel De la Cruz',
    'Daniel De la Cruz Vega',
    'Daniel Eduardo De la Cruz',
    'Daniel Eduardo De la Cruz Vega',
    'Daniel De la Cruz SEAMOSGENIOS',
    'Daniel Eduardo De la Cruz Vega Samsung Innovation Campus',
    'Daniel De la Cruz Forbes Colombia',
    'Daniel De la Cruz Universidad del Rosario',
    'Caño de Aguas Zapayán Daniel De la Cruz',
    'Daniel Eduardo De la Cruz Vega presidente SEAMOSGENIOS',
    'Daniel De la Cruz ScopeGenius',
    'Samsung CSR Global Stories Daniel De la Cruz',
    'Cristóbal Arteta Ripoll Daniel De la Cruz',
    'Growth Lab Universidad Icesi SEAMOSGENIOS',
    'ADPMH',
    'sistema ADPMH',
    'análisis detallado para mejorar habilidades',
    'SEAMOSGENIOS PreICFES',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'SEAMOSGENIOS',
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    url: COTIZACION_URL,
    images: [
      {
        url: DANIEL_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Daniel Eduardo De la Cruz Vega, fundador y desarrollador de SEAMOSGENIOS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: [DANIEL_IMAGE],
  },
  other: {
    classification: 'Simulacros Saber 11 ICFES para instituciones educativas',
    'application-name': 'SEAMOSGENIOS',
    'geo.region': 'CO',
    'geo.placename': 'Colombia',
    author: 'Daniel Eduardo De la Cruz Vega',
    'profile:first_name': 'Daniel Eduardo',
    'profile:last_name': 'De la Cruz Vega',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: 'SEAMOSGENIOS',
      alternateName: ['SeamosGenios'],
      url: SITE_URL,
      logo: `${SITE_URL}/logo_sg.svg`,
      areaServed: {
        '@type': 'Country',
        name: 'Colombia',
      },
      description:
        'PreICFES liderado por Daniel Eduardo De la Cruz Vega para aplicar simulacros Saber 11 ICFES, entregar resultados y orientar decisiones académicas. SEAMOSGENIOS patrocina el sistema ADPMH, análisis detallado para mejorar habilidades, para apoyar jóvenes con talento y pocos recursos.',
      founder: {
        '@id': `${SITE_URL}/#daniel-de-la-cruz`,
      },
    },
    {
      '@type': 'Thing',
      '@id': `${SITE_URL}/#adpmh`,
      name: 'ADPMH',
      alternateName: 'Análisis Detallado para Mejorar Habilidades',
      description:
        'Sistema ADPMH, análisis detallado para mejorar habilidades, patrocinado por SEAMOSGENIOS para apoyar jóvenes mediante diagnóstico, acompañamiento académico y mejora de habilidades para Saber 11 ICFES.',
      sponsor: {
        '@id': `${SITE_URL}/#organization`,
      },
      funder: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#daniel-de-la-cruz`,
      name: 'Daniel Eduardo De la Cruz Vega',
      alternateName: [
        'Daniel De la Cruz',
        'Daniel De la Cruz Vega',
        'Daniel Eduardo De la Cruz',
        'Daniel Eduardo De la Cruz Vega',
      ],
      jobTitle: 'Presidente, fundador y desarrollador de SEAMOSGENIOS',
      image: DANIEL_IMAGE,
      url: COTIZACION_URL,
      sameAs: [DANIEL_PROFILE_URL, DANIEL_LINKEDIN_URL, ...danielMediaMentions.map((mention) => mention.url)],
      worksFor: {
        '@id': `${SITE_URL}/#organization`,
      },
      homeLocation: {
        '@type': 'Place',
        name: 'Caño de Aguas, Zapayán, Magdalena, Colombia',
      },
      alumniOf: [
        {
          '@type': 'EducationalOrganization',
          name: 'Universidad del Rosario',
          url: 'https://urosario.edu.co/',
        },
        {
          '@type': 'Organization',
          name: 'Samsung Innovation Campus',
          url: 'https://csr.samsung.com/',
        },
      ],
      affiliation: [
        {
          '@type': 'Organization',
          name: 'SEAMOSGENIOS',
          url: SITE_URL,
        },
        {
          '@type': 'Organization',
          name: 'ScopeGenius',
        },
        {
          '@type': 'CollegeOrUniversity',
          name: 'Universidad ICESI',
          url: 'https://www.icesi.edu.co/',
        },
      ],
      award: [
        'Reconocimiento por excelencia académica en el Samsung Innovation Campus, 15 de agosto de 2024, Universidad del Rosario',
        'Historia publicada globalmente por Samsung CSR',
      ],
      knowsAbout: [
        'simulacros Saber 11',
        'ICFES',
        'inteligencia artificial',
        'programación',
        'pensamiento computacional',
        'robótica',
        'telecomunicaciones',
        'plataformas educativas',
        'preparación PreICFES',
        'educación premium accesible',
        'sistema ADPMH',
        'análisis detallado para mejorar habilidades',
        'democratización educativa',
        'preparación Saber 11 para jóvenes de escasos recursos',
      ],
      knows: [
        {
          '@type': 'Person',
          name: 'Cristóbal Arteta Ripoll',
          description: 'Tutor y referente académico mencionado por Daniel Eduardo De la Cruz Vega.',
        },
      ],
      subjectOf: danielMediaMentions.map((mention) => ({
        '@type': 'Article',
        name: mention.headline,
        headline: mention.headline,
        url: mention.url,
        datePublished: mention.datePublished,
        author: {
          '@type': getStructuredDataAuthorType(mention.author),
          name: mention.author,
        },
        publisher: {
          '@type': 'Organization',
          name: mention.name,
          url: mention.publisherUrl,
        },
      })),
      description:
        'Daniel Eduardo De la Cruz Vega es presidente, fundador y desarrollador de SEAMOSGENIOS, un PreICFES que patrocina el sistema ADPMH, análisis detallado para mejorar habilidades. Creció en Caño de Aguas, Zapayán, Magdalena, aprendió tecnología de forma autodidacta y creó una plataforma para aplicar simulacros Saber 11 ICFES con IA, datos, panel coordinador, resultados y retroalimentación. Su historia conecta Samsung Innovation Campus, ScopeGenius, Universidad del Rosario, Universidad ICESI, Forbes Colombia y Samsung CSR Global Stories.',
    },
    {
      '@type': 'Service',
      '@id': `${COTIZACION_URL}#service`,
      name: 'Simulacros Saber 11 ICFES para colegios',
      serviceType: 'Aplicación de simulacros Saber 11 ICFES',
      provider: {
        '@id': `${SITE_URL}/#organization`,
      },
      areaServed: {
        '@type': 'Country',
        name: 'Colombia',
      },
      audience: [
        {
          '@type': 'EducationalAudience',
          educationalRole: 'student',
        },
        {
          '@type': 'EducationalAudience',
          educationalRole: 'schoolAdministrator',
        },
      ],
      description:
        'La forma más completa de aplicar simulacros Saber 11 ICFES: SEAMOSGENIOS ofrece plataforma para estudiantes, panel coordinador, retroalimentación en vivo, grabaciones y lectura de resultados por institución. El PreICFES patrocina el sistema ADPMH para apoyar jóvenes con análisis detallado para mejorar habilidades.',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'COP',
        lowPrice: '15000',
        highPrice: '20000',
        offerCount: '2',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@type': ['WebPage', 'ProfilePage'],
      '@id': `${COTIZACION_URL}#webpage`,
      url: COTIZACION_URL,
      name: SEO_TITLE,
      description: SEO_DESCRIPTION,
      inLanguage: 'es-CO',
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'SEAMOSGENIOS',
        alternateName: 'SeamosGenios',
        url: SITE_URL,
      },
      about: [
        {
          '@id': `${SITE_URL}/#daniel-de-la-cruz`,
        },
        {
          '@id': `${COTIZACION_URL}#service`,
        },
      ],
      mainEntity: {
        '@id': `${SITE_URL}/#daniel-de-la-cruz`,
      },
      citation: danielMediaMentions.map((mention) => mention.url),
      dateModified: '2026-05-14',
      lastReviewed: '2026-05-14',
      mentions: [
        ...danielMediaMentions.map((mention) => ({
          '@type': 'Article',
          name: mention.headline,
          headline: mention.headline,
          url: mention.url,
          datePublished: mention.datePublished,
          author: {
            '@type': getStructuredDataAuthorType(mention.author),
            name: mention.author,
          },
          publisher: {
            '@type': 'Organization',
            name: mention.name,
            url: mention.publisherUrl,
          },
        })),
        {
          '@type': 'Person',
          name: 'Cristóbal Arteta Ripoll',
        },
        {
          '@type': 'CollegeOrUniversity',
          name: 'Universidad ICESI',
        },
        {
          '@type': 'CollegeOrUniversity',
          name: 'Universidad de los Andes',
        },
      ],
    },
  ],
};

export default function CotizacionSimulacroLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeBoot = `(function(){var k=${JSON.stringify(COTIZ_LANDING_THEME_LS_KEY)};function a(t){var bg=t==='light'?'#f3f4f6':'#07111f';var fg=t==='light'?'#0f172a':'#fafafa';var de=document.documentElement;de.setAttribute('data-cotiz-landing-theme',t);de.style.backgroundColor=bg;de.style.color=fg;var b=document.body;if(b){b.style.backgroundColor=bg;b.style.color=fg;}}function r(){try{var v=localStorage.getItem(k);var tone=(v==='light'||v==='dark')?v:'dark';window.__COTIZ_LANDING_TONE__=tone;a(tone);if(!document.body){document.addEventListener('DOMContentLoaded',function(){a(window.__COTIZ_LANDING_TONE__||'dark');});}}catch(e){window.__COTIZ_LANDING_TONE__='dark';a('dark');}}r();})();`;

  return (
    <div
      className={`cotizacion-demo-island ${montserrat.variable}`}
      data-app-surface="cotizacion-demo"
    >
      <Script id="cotiz-landing-theme-boot" strategy="beforeInteractive">
        {themeBoot}
      </Script>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      {children}
    </div>
  );
}
