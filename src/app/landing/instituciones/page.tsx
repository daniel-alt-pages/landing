import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { CONTACTO } from '../_contenido/contacto';
import { B2B_CONTACTO } from '../_contenido/b2b/contacto';
import { B2bCierre } from '../_componentes/secciones/b2b/B2bCierre';
import { B2bGobierno } from '../_componentes/secciones/b2b/B2bGobierno';
import { B2bHero } from '../_componentes/secciones/b2b/B2bHero';
import { B2bNiveles } from '../_componentes/secciones/b2b/B2bNiveles';
import { B2bNosotros } from '../_componentes/secciones/b2b/B2bNosotros';
import { B2bPlataforma } from '../_componentes/secciones/b2b/B2bPlataforma';
import { B2bPasos } from '../_componentes/secciones/b2b/B2bPasos';
import { B2bArquitectura } from '../_componentes/secciones/b2b/B2bArquitectura';
import { B2bPrograma } from '../_componentes/secciones/b2b/B2bPrograma';
import { B2bResumen } from '../_componentes/secciones/b2b/B2bResumen';
import './b2b-base.css';
import './b2b-secciones.css';
import './b2b-diagramas.css';
import './b2b-portafolio.css';
import './b2b-pdf.css';
import './b2b-diagramas-v2.css';
import './b2b-problema-quienes.css';
import './b2b-mapa.css';
import './b2b-hero.css';
import './b2b-desktop.css';
import './b2b-rediseno.css';
import './b2b-ciclo.css';
import './b2b-plataforma-v4.css';

/** Lenguaje visual de la referencia de Daniel (maqueta-daniel.html): Plus Jakarta Sans + Caveat. Solo dentro del panel; el header no cambia. */
/* Subconjuntos propios (fonttools, todas las features OpenType conservadas, misma apariencia):
 * Latín básico + Latin-1 (tildes, ñ, ¿¡) + comillas, rayas, viñeta, … y €. Antes: 5 pesos de Jakarta
 * y 2 de Caveat desde next/font/google (7 archivos, 5 precargados).
 * - Jakarta: el archivo variable 200-800 (24 KB) cubre todos los pesos que usa el panel.
 * - Caveat: solo se usa a 700 en titulillos decorativos; no se precarga (display swap). */
const jakarta = localFont({
  src: './fuentes/plus-jakarta-sans-var-latin-sub.woff2',
  weight: '200 800',
  display: 'swap',
  variable: '--font-jakarta',
});
const caveat = localFont({
  src: './fuentes/caveat-700-latin-sub.woff2',
  weight: '700',
  display: 'swap',
  variable: '--font-caveat',
  preload: false,
});

const DESCRIPCION_SOCIAL = 'Simulacros tipo Saber 11 y clases en vivo para su colegio. Reportes por estudiante y por grupo en la semana siguiente.';

export const metadata: Metadata = {
  title: { absolute: 'Preparación Saber 11 para colegios | SEAMOSGENIOS' },
  description: 'Simulacros tipo Saber 11, clases en vivo de matemáticas y lectura crítica, y reportes por estudiante y por colegio. Resultados en la semana siguiente.',
  alternates: { canonical: '/landing/instituciones' },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'SEAMOSGENIOS',
    title: 'Preparación Saber 11 para colegios | SEAMOSGENIOS',
    description: DESCRIPCION_SOCIAL,
    url: '/landing/instituciones',
    images: [{ url: '/landing/og.jpg', width: 1200, height: 630, alt: 'Preparación Saber 11 para colegios con SEAMOSGENIOS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Preparación Saber 11 para colegios | SEAMOSGENIOS',
    description: DESCRIPCION_SOCIAL,
    images: ['/landing/og.jpg'],
  },
};

const SITE = 'https://seamosgenios.org';
const URL_PANEL = `${SITE}/landing/instituciones`;
/** JSON-LD del panel (plantillas de seo-b2b/schema). Contacto solo con datos de b2b/contacto.ts; sin LinkedIn (no existe en el repo). */
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['Organization', 'EducationalOrganization'],
      '@id': `${SITE}/#organization`,
      name: 'SEAMOSGENIOS',
      legalName: 'SEAMOSGENIOS S.A.S.',
      taxID: '902080201-8',
      alternateName: ['Seamos Genios', 'SeamosGenios'],
      url: `${SITE}/`,
      logo: `${SITE}/brand/sg-services-logo.svg`,
      description: 'Empresa colombiana que ofrece a colegios simulacros tipo Saber 11 calificados con Teoría de Respuesta al Ítem, paneles de coordinación y formación virtual.',
      areaServed: { '@type': 'Country', name: 'Colombia' },
      knowsAbout: ['Prueba Saber 11', 'Simulacros tipo Saber 11', 'Teoría de Respuesta al Ítem', 'Lectura crítica', 'Matemáticas'],
      contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: B2B_CONTACTO.telefonoVisible.replace(/\s/g, ''), email: B2B_CONTACTO.email, areaServed: 'CO', availableLanguage: 'es' },
      sameAs: [CONTACTO.redes.instagram, CONTACTO.redes.tiktok, CONTACTO.redes.facebook],
    },
    { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'SEAMOSGENIOS', inLanguage: 'es-CO', publisher: { '@id': `${SITE}/#organization` } },
    {
      '@type': 'Service',
      '@id': `${URL_PANEL}#service`,
      name: 'Simulacros Saber 11 y acompañamiento para colegios',
      serviceType: 'Preparación para la prueba Saber 11 para instituciones educativas',
      provider: { '@id': `${SITE}/#organization` },
      areaServed: { '@type': 'Country', name: 'Colombia' },
      audience: { '@type': 'EducationalAudience', educationalRole: 'administrator' },
      availableChannel: { '@type': 'ServiceChannel', serviceUrl: URL_PANEL },
      description: 'Simulacros tipo Saber 11 calificados con Teoría de Respuesta al Ítem (aproximación, no resultado oficial del Icfes), paneles de coordinación y de estudiante, y formación virtual sincrónica. Calendario B-A 2027-1.',
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${URL_PANEL}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Portafolio B2B', item: URL_PANEL },
      ],
    },
  ],
};

export default function InstitucionesPage() {
  return (
    <div className={`b2b-panel b2b-v4 ${jakarta.variable} ${caveat.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, '\\u003c') }} />
      <B2bHero />
      <B2bResumen />
      <B2bPasos />
      <B2bArquitectura />
      <B2bNiveles />
      <B2bPrograma />
      <B2bPlataforma />
      <B2bGobierno />
      <B2bNosotros />
      <B2bCierre />
    </div>
  );
}
