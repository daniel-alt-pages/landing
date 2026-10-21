import type { LogoItem } from '@/app/landing-profesional/contenido-landing/ui-componentes/LogoLoop';
import { SIMULATION_PRICES } from '@/lib/cotizacionSimulacro';
import {
  BadgeDollarSign,
  BarChart3,
  BookOpenText,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  Home,
  MapPinned,
  MonitorPlay,
  PanelsTopLeft,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { Icon } from './tipos';

export const COTIZ_LANDING_NAV_LINKS: readonly { href: string; label: string; icon: Icon }[] = [
  { href: '#inicio', label: 'Inicio', icon: Home },
  { href: '#metodo-pdf', label: 'Método', icon: FlaskConical },
  { href: '#impacto-acumulado', label: 'Cobertura', icon: MapPinned },
  { href: '#producto', label: 'Plataforma', icon: PanelsTopLeft },
  { href: '#cotizacion', label: 'Cotizar', icon: BadgeDollarSign },
  { href: '#recursos', label: 'Recursos', icon: BookOpenText },
  { href: '#faq', label: 'FAQ', icon: HelpCircle },
];

export const faqItems = [
  {
    question: '¿El simulacro es presencial o virtual?',
    answer:
      'Actualmente nuestros simulacros son 100% virtuales: puedes presentarlos desde casa en condiciones similares al examen real ICFES. Próximamente también ofreceremos la opción presencial. Los resultados se entregan de forma digital a través de tu dashboard personalizado.',
  },
  {
    question: '¿Cuándo se realizan los simulacros?',
    answer:
      'Los simulacros se programan generalmente los sábados. Las fechas exactas se anuncian en nuestras redes sociales y por WhatsApp. La próxima aplicación disponible se confirma al inscribirte.',
  },
  {
    question: '¿Cómo recibo mis resultados?',
    answer:
      'Al día siguiente del simulacro recibes acceso a tu dashboard con puntaje global, desglose por área, ranking, fortalezas y debilidades, y un plan de estudio orientado con analítica educativa.',
  },
  {
    question: '¿Es seguro pagar por WhatsApp?',
    answer:
      'Sí. Al contactarnos por WhatsApp te enviamos un link de pago seguro (Nequi, Daviplata o transferencia bancaria). Tu información está protegida y recibes confirmación inmediata de tu inscripción.',
  },
  {
    question: '¿Cuántas preguntas tiene cada simulacro?',
    answer:
      'Cada simulacro contiene exactamente 254 preguntas distribuidas en las 5 áreas del ICFES: Matemáticas, Lectura Crítica, Sociales y Ciudadanas, Ciencias Naturales e Inglés. El formato es idéntico al del examen real.',
  },
  {
    question: '¿Hay garantía de devolución?',
    answer:
      'Sí. Si no recibes tus resultados completos en el dashboard dentro de las 24 horas posteriores al simulacro, te devolvemos el 100% de tu dinero sin preguntas.',
  },
  {
    question: '¿Puedo presentar el simulacro desde cualquier ciudad?',
    answer:
      'Sí. Como los simulacros son 100% virtuales, puedes presentarlos desde cualquier lugar de Colombia (o del mundo) con conexión a internet. Solo necesitas un dispositivo con navegador web. Próximamente también tendremos sedes presenciales en varias ciudades.',
  },
] as const;

export const displaySerif = "font-[family-name:var(--font-cotiz-sans),Montserrat,ui-sans-serif,sans-serif]";

export const danielProfileImages = [
  'https://ik.imagekit.io/danydc/tr:w-1200,q-80,f-jpg/SEO%20WEB%20-%20SEAMOSGENIOS%20-%20DANIEL%20DE%20LA%20CRUZ%20VEGA/IMG-20260514-WA0009.jpg',
  'https://ik.imagekit.io/danydc/tr:w-1200,q-80,f-jpg/SEO%20WEB%20-%20SEAMOSGENIOS%20-%20DANIEL%20DE%20LA%20CRUZ%20VEGA/IMG-20260514-WA0010.jpg',
  'https://ik.imagekit.io/danydc/tr:w-1200,q-80,f-jpg/SEO%20WEB%20-%20SEAMOSGENIOS%20-%20DANIEL%20DE%20LA%20CRUZ%20VEGA/IMG-20260514-WA0011.jpg',
  'https://ik.imagekit.io/danydc/tr:w-1200,q-80,f-jpg/SEO%20WEB%20-%20SEAMOSGENIOS%20-%20DANIEL%20DE%20LA%20CRUZ%20VEGA/IMG-20260514-WA0001.jpg',
  'https://ik.imagekit.io/danydc/tr:w-1200,q-80,f-jpg/SEO%20WEB%20-%20SEAMOSGENIOS%20-%20DANIEL%20DE%20LA%20CRUZ%20VEGA/IMG-20260514-WA0005.jpg',
  'https://ik.imagekit.io/danydc/tr:w-1200,q-80,f-jpg/SEO%20WEB%20-%20SEAMOSGENIOS%20-%20DANIEL%20DE%20LA%20CRUZ%20VEGA/IMG-20260514-WA0003.jpg',
  'https://ik.imagekit.io/danydc/tr:w-1200,q-80,f-jpg/SEO%20WEB%20-%20SEAMOSGENIOS%20-%20DANIEL%20DE%20LA%20CRUZ%20VEGA/IMG-20260513-WA0214.jpg?updatedAt=1778736421528',
  'https://ik.imagekit.io/danydc/tr:w-1200,q-80,f-jpg/SEO%20WEB%20-%20SEAMOSGENIOS%20-%20DANIEL%20DE%20LA%20CRUZ%20VEGA/IMG-20260513-WA0209.jpg?updatedAt=1778736421299',
  'https://ik.imagekit.io/danydc/tr:w-1200,q-80,f-jpg/SEO%20WEB%20-%20SEAMOSGENIOS%20-%20DANIEL%20DE%20LA%20CRUZ%20VEGA/IMG-20260513-WA0230.jpg?updatedAt=1778736421457',
] as const;

export const danielStoryPoints = [
  {
    label: 'Origen',
    title: 'Caño de Aguas, Zapayán',
    text: 'Creció en un corregimiento del noroeste periférico de Colombia, en la región Caribe, marcado por el conflicto y por pocas oportunidades.',
  },
  {
    label: 'Tecnología',
    title: 'Autodidacta sin infraestructura',
    text: 'Aprendió por cuenta propia programación, pensamiento computacional, telecomunicaciones, robótica e inteligencia artificial.',
  },
  {
    label: 'SIC',
    title: 'Samsung Innovation Campus',
    text: 'A los 17 años fue seleccionado por el programa internacional; el 15 de agosto de 2024 recibió reconocimiento por excelencia académica en la Universidad del Rosario.',
  },
  {
    label: 'ScopeGenius',
    title: 'Hackathon e innovación',
    text: 'Integró ScopeGenius, un proyecto de innovación ligado a su formación técnica.',
  },
  {
    label: 'Medios',
    title: 'Historia publicada',
    text: 'Samsung Electronics publicó su historia a nivel internacional, y medios como Forbes Colombia, El Nuevo Siglo, AVI Latinoamérica y C-Level también registraron ese camino.',
  },
  {
    label: 'Movimiento',
    title: 'SEAMOSGENIOS y sistema ADPMH',
    text: 'SEAMOSGENIOS es el PreICFES que lidera Daniel y patrocina el sistema ADPMH: análisis detallado para mejorar habilidades.',
  },
] as const;

export const danielProfileHighlights = [
  { value: 'Caño de Aguas', label: 'Origen en Zapayán, Magdalena' },
  { value: '2023–2024', label: 'Reconocimiento de excelencia académica en Samsung Innovation Campus, Universidad del Rosario' },
  { value: '15 ago 2024', label: 'Reconocimiento por excelencia académica en Universidad del Rosario' },
] as const;

export const danielDeveloperIntroParagraphs = [
  'Daniel Eduardo De la Cruz Vega creció en Caño de Aguas, corregimiento de Zapayán (Magdalena), en el Caribe colombiano. Su historia arranca en un territorio marcado por el conflicto y la escasez de oportunidades: un computador sobre una caja de cartón, aprendizaje autodidacta en programación, robótica e inteligencia artificial, y la decisión de que la educación con estándar alto no deba quedar reservada a quienes ya tienen ventaja.',
  'A los 20 años lidera SEAMOSGENIOS como movimiento y plataforma PreICFES. Desde ahí impulsa el sistema ADPMH (análisis detallado para mejorar habilidades), acompañamiento académico, grupos de estudio y rutas de preparación Saber 11 con datos. Parte del ecosistema es gratuito o patrocinado para jóvenes que lo necesitan: no es “todo gratis”, pero sí accesible —cualquier estudiante o institución puede sumarse según su realidad.',
  'Esta página trabaja en conjunto con esa línea PreICFES y abre un canal comercial claro: simulacros tipo ICFES que cualquier persona puede comprar (estudiante individual o institución), con retro en vivo, grabaciones y paneles de lectura. Tarifas transparentes en COP, misma experiencia base para todos los matriculados.',
] as const;

export const danielDeveloperIntroFacts = [
  { label: 'Origen', value: 'Caño de Aguas, Zapayán · Magdalena · Caribe colombiano' },
  { label: 'Rol', value: 'Fundador y desarrollador de la plataforma SEAMOSGENIOS' },
  { label: 'PreICFES', value: 'Preparación Saber 11, datos y acompañamiento (ecosistema + ADPMH)' },
  { label: 'Simulacros', value: 'Compra individual o institucional —accesible, no solo gratuito' },
] as const;

export const danielWikiFigure = {
  alt: 'Daniel Eduardo De la Cruz Vega, fundador de SEAMOSGENIOS',
  caption: 'Daniel Eduardo De la Cruz Vega, fundador y desarrollador de la plataforma SEAMOSGENIOS (PreICFES).',
} as const;

export const danielImpactHighlights = [
  'Inicié este camino a los 14 años con un propósito claro: trabajar duro por mi familia y transformar la educación.',
  'La educación con estándar premium no debe ser exclusiva: parte del ecosistema ADPMH es patrocinada para jóvenes que la necesitan, con análisis, grupos de estudio y materiales.',
] as const;

export const APA_LAST_CHECKED_LABEL = '14 de mayo de 2026';

export const danielMediaMentions = [
  {
    source: 'Samsung Newsroom',
    href: 'https://csr.samsung.com/en/storyView.do?contentsId=229',
    author: 'Samsung Corporate Citizenship',
    date: '2025',
    title: 'Breaking barriers with tech',
    site: 'Samsung Corporate Citizenship',
    inTextCitation: '(Samsung Corporate Citizenship, 2025)',
    apaReference:
      'Samsung Corporate Citizenship. (2025). Breaking barriers with tech.',
    note: 'Historia global sobre barreras, tecnología e innovación.',
  },
  {
    source: 'Universidad del Rosario',
    href: 'https://urosario.edu.co/periodico-nova-et-vetera/escuela-de-administracion/samsung-y-universidad-rosario-forman-talento-ia',
    author: 'Universidad del Rosario',
    date: '2024, 20 de agosto',
    title: 'Samsung Electronics Colombia y la Universidad del Rosario capacitaron gratuitamente a jóvenes en inteligencia artificial',
    site: 'Universidad del Rosario',
    inTextCitation: '(Universidad del Rosario, 2024)',
    apaReference:
      'Universidad del Rosario. (2024, 20 de agosto). Samsung Electronics Colombia y la Universidad del Rosario capacitaron gratuitamente a jóvenes en inteligencia artificial.',
    note: 'Caso destacado del programa Samsung Innovation Campus.',
  },
  {
    source: 'LinkedIn · Samsung Electronics Colombia',
    href: 'https://www.linkedin.com/posts/samsung-electronics-colombia_samsunginnovationcampus-inteligenciaartificialparatodos-ugcPost-7235388760526401536-2XpW?utm_source=share&utm_medium=member_android&rcm=ACoAADwgCMwBff2K_oIJQsSomjkmVwk4EhFSkjM',
    author: 'Samsung Electronics Colombia',
    date: 's. f.',
    title: 'Samsung Innovation Campus: inteligencia artificial para todos',
    site: 'LinkedIn',
    inTextCitation: '(Samsung Electronics Colombia, s. f.)',
    apaReference:
      'Samsung Electronics Colombia. (s. f.). Samsung Innovation Campus: inteligencia artificial para todos [Publicación en LinkedIn].',
    note: 'Publicación institucional de Samsung Colombia sobre el programa y su comunidad.',
  },
  {
    source: 'LinkedIn · Escuela de Administración UR',
    href: 'https://www.linkedin.com/posts/escuela-administracion-ur_inteligenciaartificial-ugcPost-7230201450033786880-8gLk?utm_source=share&utm_medium=member_android&rcm=ACoAADwgCMwBff2K_oIJQsSomjkmVwk4EhFSkjM',
    author: 'Escuela de Administración - Universidad del Rosario',
    date: 's. f.',
    title: 'Inteligencia artificial y formación de jóvenes',
    site: 'LinkedIn',
    inTextCitation: '(Escuela de Administración - Universidad del Rosario, s. f.)',
    apaReference:
      'Escuela de Administración - Universidad del Rosario. (s. f.). Inteligencia artificial y formación de jóvenes [Publicación en LinkedIn].',
    note: 'Respaldo institucional del ecosistema Universidad del Rosario alrededor de la formación en IA.',
  },
  {
    source: 'LinkedIn · Respaldo de trayectoria',
    href: 'https://www.linkedin.com/feed/update/urn:li:activity:7232386137837780993?updateEntityUrn=urn%3Ali%3Afs_updateV2%3A%28urn%3Ali%3Aactivity%3A7232386137837780993%2CFEED_DETAIL%2CEMPTY%2CDEFAULT%2Cfalse%29',
    author: 'LinkedIn',
    date: 's. f.',
    title: 'Publicación de respaldo sobre trayectoria y formación',
    site: 'LinkedIn',
    inTextCitation: '(LinkedIn, s. f.-a)',
    apaReference:
      'LinkedIn. (s. f.-a). Publicación de respaldo sobre trayectoria y formación [Publicación en LinkedIn].',
    note: 'Evidencia pública adicional sobre el proceso formativo y la historia personal.',
  },
  {
    source: 'LinkedIn · Respaldo SIC',
    href: 'https://www.linkedin.com/feed/update/urn:li:activity:7230247411028226048?updateEntityUrn=urn%3Ali%3Afs_updateV2%3A%28urn%3Ali%3Aactivity%3A7230247411028226048%2CFEED_DETAIL%2CEMPTY%2CDEFAULT%2Cfalse%29',
    author: 'LinkedIn',
    date: 's. f.',
    title: 'Publicación de respaldo sobre Samsung Innovation Campus',
    site: 'LinkedIn',
    inTextCitation: '(LinkedIn, s. f.-b)',
    apaReference:
      'LinkedIn. (s. f.-b). Publicación de respaldo sobre Samsung Innovation Campus [Publicación en LinkedIn].',
    note: 'Referencia complementaria sobre el paso por Samsung Innovation Campus.',
  },
  {
    source: 'Forbes Colombia',
    href: 'https://forbes.co/ia/este-programa-de-formacion-esta-educando-a-jovenes-colombianos-en-inteligencia-artificial',
    author: 'Forbes Staff',
    date: '2024, 18 de agosto',
    title: 'Este programa de formación está educando a jóvenes colombianos en inteligencia artificial',
    site: 'Forbes Colombia',
    inTextCitation: '(Forbes Staff, 2024)',
    apaReference:
      'Forbes Staff. (2024, 18 de agosto). Este programa de formación está educando a jóvenes colombianos en inteligencia artificial. Forbes Colombia.',
    note: 'Cita sobre IA aplicada y aprendizaje práctico.',
  },
  {
    source: 'El Nuevo Siglo',
    href: 'https://www.elnuevosiglo.com.co/cultura-y-sociedad/inteligencia-artificial-una-oportunidad-para-el-futuro-de-los-jovenes',
    author: 'Redacción Cultura',
    date: '2024, 18 de agosto',
    title: 'Inteligencia artificial, una oportunidad para el futuro de los jóvenes',
    site: 'El Nuevo Siglo',
    inTextCitation: '(Redacción Cultura, 2024)',
    apaReference:
      'Redacción Cultura. (2024, 18 de agosto). Inteligencia artificial, una oportunidad para el futuro de los jóvenes. El Nuevo Siglo.',
    note: 'Cobertura sobre inteligencia artificial y jóvenes.',
  },
  {
    source: 'AVI Latinoamérica',
    href: 'https://www.avilatinoamerica.com/novedades/ultimas-noticias/22-empresas/24415-samsung-y-universidad-del-rosario-capacitaron-a-jovenes-en-ia.html',
    author: 'Santa, R.',
    date: '2024',
    title: 'Samsung y Universidad del Rosario capacitaron a jóvenes en IA',
    site: 'AVI Latinoamérica',
    inTextCitation: '(Santa, 2024)',
    apaReference:
      'Santa, R. (2024). Samsung y Universidad del Rosario capacitaron a jóvenes en IA. AVI Latinoamérica.',
    note: 'Nota sobre la capacitación en IA de Samsung y URosario.',
  },
  {
    source: 'Revista C-Level',
    href: 'https://revistaclevel.com/samsung-electronics-colombia-y-la-universidad-del-rosario-capacitaron-gratuitamente-jovenes-en',
    author: 'Revista C-Level',
    date: '2024, 19 de agosto',
    title: 'Samsung Electronics Colombia y la Universidad del Rosario capacitaron gratuitamente a jóvenes en inteligencia artificial',
    site: 'Revista C-Level',
    inTextCitation: '(Revista C-Level, 2024)',
    apaReference:
      'Revista C-Level. (2024, 19 de agosto). Samsung Electronics Colombia y la Universidad del Rosario capacitaron gratuitamente a jóvenes en inteligencia artificial.',
    note: 'Publicación sobre formación gratuita en IA para jóvenes.',
  },
] as const;

type TechLogoKind =
  | 'next'
  | 'react'
  | 'typescript'
  | 'tailwind'
  | 'firebase'
  | 'chart'
  | 'webgl'
  | 'pdf'
  | 'excel'
  | 'imagekit'
  | 'youtube'
  | 'cloudflare';

function TechLogoSvg({ kind }: { kind: TechLogoKind }) {
  const common = 'h-8 w-8';

  if (kind === 'react') {
    return (
      <svg viewBox="0 0 48 48" className={common} fill="none" aria-hidden>
        <circle cx="24" cy="24" r="4" fill="currentColor" />
        <ellipse cx="24" cy="24" rx="18" ry="7" stroke="currentColor" strokeWidth="3" />
        <ellipse cx="24" cy="24" rx="18" ry="7" stroke="currentColor" strokeWidth="3" transform="rotate(60 24 24)" />
        <ellipse cx="24" cy="24" rx="18" ry="7" stroke="currentColor" strokeWidth="3" transform="rotate(120 24 24)" />
      </svg>
    );
  }

  if (kind === 'next') {
    return (
      <svg viewBox="0 0 48 48" className={common} fill="none" aria-hidden>
        <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="3" />
        <path d="M16 33V15l17 22M32 15v18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'typescript') {
    return (
      <svg viewBox="0 0 48 48" className={common} fill="none" aria-hidden>
        <rect x="7" y="7" width="34" height="34" rx="7" stroke="currentColor" strokeWidth="3" />
        <path d="M14 18h16M22 18v17M32 34c5 0 5-8 0-8s-5-8 1-8c2 0 3 .5 4 1.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'tailwind') {
    return (
      <svg viewBox="0 0 48 48" className={common} fill="none" aria-hidden>
        <path
          d="M9 25c4-8 9-12 15-12 9 0 10 7 15 7-4 8-9 12-15 12-9 0-10-7-15-7Z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M13 32c3-4 7-6 11-6 6 0 7 4 11 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'firebase') {
    return (
      <svg viewBox="0 0 48 48" className={common} fill="none" aria-hidden>
        <path d="M10 39 18 8l7 14 5-9 8 26H10Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M18 8 25 39M30 13 25 39" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'chart') {
    return (
      <svg viewBox="0 0 48 48" className={common} fill="none" aria-hidden>
        <path d="M10 38h28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <rect x="13" y="24" width="5" height="14" rx="2" fill="currentColor" />
        <rect x="22" y="14" width="5" height="24" rx="2" fill="currentColor" />
        <rect x="31" y="20" width="5" height="18" rx="2" fill="currentColor" />
      </svg>
    );
  }

  if (kind === 'webgl') {
    return (
      <svg viewBox="0 0 48 48" className={common} fill="none" aria-hidden>
        <path d="M24 7 39 16v17L24 41 9 33V16L24 7Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M9 16 24 25l15-9M24 25v16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'pdf') {
    return (
      <svg viewBox="0 0 48 48" className={common} fill="none" aria-hidden>
        <path d="M14 6h15l7 7v29H14V6Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M29 6v8h7M17 31h14M17 24h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'excel') {
    return (
      <svg viewBox="0 0 48 48" className={common} fill="none" aria-hidden>
        <rect x="8" y="9" width="32" height="30" rx="5" stroke="currentColor" strokeWidth="3" />
        <path d="M8 20h32M8 29h32M19 9v30M30 9v30" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    );
  }

  if (kind === 'imagekit') {
    return (
      <svg viewBox="0 0 48 48" className={common} fill="none" aria-hidden>
        <rect x="8" y="10" width="32" height="28" rx="6" stroke="currentColor" strokeWidth="3" />
        <path d="m12 34 9-10 7 7 5-5 7 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="32" cy="18" r="3" fill="currentColor" />
      </svg>
    );
  }

  if (kind === 'youtube') {
    return (
      <svg viewBox="0 0 48 48" className={common} fill="none" aria-hidden>
        <rect x="7" y="14" width="34" height="20" rx="7" stroke="currentColor" strokeWidth="3" />
        <path d="m22 20 9 4-9 4v-8Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" className={common} fill="none" aria-hidden>
      <path d="M16 32h18a8 8 0 0 0 0-16 12 12 0 0 0-23 5 6 6 0 0 0 5 11Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M17 35h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const platformTechLogos: readonly LogoItem[] = [
  {
    node: <TechLogoSvg kind="next" />,
    title: 'Next.js 16',
    href: 'https://nextjs.org',
    description: 'App Router + export estático',
  },
  {
    node: <TechLogoSvg kind="react" />,
    title: 'React 19',
    href: 'https://react.dev',
    description: 'Interfaz y componentes',
  },
  {
    node: <TechLogoSvg kind="typescript" />,
    title: 'TypeScript',
    href: 'https://www.typescriptlang.org',
    description: 'Tipado de plataforma',
  },
  {
    node: <TechLogoSvg kind="tailwind" />,
    title: 'Tailwind CSS 4',
    href: 'https://tailwindcss.com',
    description: 'Sistema visual responsive',
  },
  {
    node: <TechLogoSvg kind="firebase" />,
    title: 'Firebase',
    href: 'https://firebase.google.com',
    description: 'Auth, Firestore y Hosting',
  },
  {
    node: <TechLogoSvg kind="chart" />,
    title: 'Chart.js',
    href: 'https://www.chartjs.org',
    description: 'Gráficas y lectura de datos',
  },
  {
    node: <TechLogoSvg kind="webgl" />,
    title: 'OGL + WebGL',
    href: 'https://github.com/oframe/ogl',
    description: 'Galería visual acelerada',
  },
  {
    node: <TechLogoSvg kind="pdf" />,
    title: 'PDF.js',
    href: 'https://mozilla.github.io/pdf.js/',
    description: 'Lectura de reportes PDF',
  },
  {
    node: <TechLogoSvg kind="excel" />,
    title: 'ExcelJS + XLSX',
    href: 'https://github.com/exceljs/exceljs',
    description: 'Procesamiento de hojas',
  },
  {
    node: <TechLogoSvg kind="imagekit" />,
    title: 'ImageKit',
    href: 'https://imagekit.io',
    description: 'Imágenes optimizadas',
  },
  {
    node: <TechLogoSvg kind="youtube" />,
    title: 'YouTube Embed',
    href: 'https://developers.google.com/youtube',
    description: 'Videos en la landing',
  },
  {
    node: <TechLogoSvg kind="cloudflare" />,
    title: 'Cloudflare Tunnel',
    href: 'https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/',
    description: 'Pruebas públicas locales',
  },
] as const;

export const includedItems = [
  'Simulacro completo tipo ICFES',
  'Retroalimentación en vivo en fecha programada; si la fecha ya pasó, la institución mantiene acceso a las grabaciones',
  'Acceso a grabaciones para repasar la sesion',
  'Experiencia de plataforma para estudiantes y coordinadores',
];

export const studentAccess = [
  {
    icon: GraduationCap,
    title: 'Resultados claros',
    text: 'El estudiante ve su desempeño, puntaje global y progreso por areas para entender donde mejorar.',
  },
  {
    icon: ClipboardList,
    title: 'Analisis accionable',
    text: 'La plataforma convierte respuestas y errores en lectura pedagogica, no solo en una nota.',
  },
  {
    icon: MonitorPlay,
    title: 'Grabaciones incluidas',
    text: 'Después de la retroalimentación en vivo, cada estudiante puede volver a estudiar la explicación.',
  },
];

export const coordinatorAccess = [
  {
    icon: BarChart3,
    title: 'Panel por curso',
    text: 'Coordinadores acceden a resumenes, comparativas, historico y seguimiento por estudiante.',
  },
  {
    icon: Users,
    title: 'Lectura institucional',
    text: 'La institución puede revisar fortalezas, alertas y oportunidades por grado o grupo matriculado.',
  },
  {
    icon: ShieldCheck,
    title: 'Decision con evidencia',
    text: 'Los datos ayudan a priorizar refuerzos, socializar resultados y preparar próximas aplicaciones.',
  },
];

export const pricingCards = [
  {
    segment: 'Estudiante individual',
    price: SIMULATION_PRICES.individual,
    detail: 'Para compra directa de 1 simulacro.',
    badge: 'Individual',
  },
  {
    segment: 'Institución',
    price: SIMULATION_PRICES.institution,
    detail: 'Por estudiante matriculado en cursos o grados.',
    badge: 'Institucional',
  },
];

/** Carrusel del panel Método — añade ítems aquí o vía Prismic (MP4) cuando migres videos. */
export type MethodShowcaseItem =
  | { type: 'label'; label: string; hint?: string; /** Demo autoclic estilo panel estudiante (carrusel 3D) */ panelDemo?: boolean }
  | {
      type: 'drive-embed';
      label: string;
      driveFileId: string;
      /** Simula carpetas Drive + autoclic antes del preview */
      browseDemo?: boolean;
      recordingFileName?: string;
      showcaseDescription?: string;
    }
  | {
      type: 'hosted-video';
      label: string;
      prismicVideoUrl?: string;
      youtubeId?: string;
    };

export const methodShowcaseItems: MethodShowcaseItem[] = [
  { type: 'label', label: 'PreICFES · Saber 11', panelDemo: true },
  { type: 'label', label: 'Coordinación académica' },
  {
    type: 'drive-embed',
    label: 'Grabaciones de las clases',
    driveFileId: '1ObQAsw7jlxaFQINVTwGwop9CEHtwgWmE',
    browseDemo: true,
    recordingFileName:
      'RETROALIMENTACIÓN SESIÓN 2 (SG11-16) - LECTURA CRÍTICA - PREINTENSIVO SEAMOSGENIOS - CAL A - 2026',
    showcaseDescription:
      'Cada sesión queda en Drive con nombre de cohorte y área: coordinación abre la retro en un clic; el estudiante repasa la clase cuando necesite.',
  },
  {
    type: 'label',
    label: 'Retroalimentación en vivo',
    hint: 'La explicación del docente en la fecha programada; después pasa al archivo de grabación.',
  },
  { type: 'label', label: 'Panel institucional' },
];

/** @deprecated Usar methodShowcaseItems */
export const trustedMarks = methodShowcaseItems;

export const packageHighlights = includedItems.map((title, i) => ({
  version: `${String(i + 1).padStart(2, '0')}`,
  title,
}));

export const platformVideoStories = [
  {
    eyebrow: 'Estudiante · 01',
    title: 'Inicio de sesión',
    text: 'Entrada al sistema, autenticación y primer contacto con la plataforma del estudiante.',
    prismicVideoUrl: undefined,
    youtubeId: 'MOPf18v_aoA',
  },
  {
    eyebrow: 'Estudiante · 02',
    title: 'Panel principal: dashboard general',
    text: 'Vista inicial del rendimiento, resumen de resultados y navegación principal del estudiante.',
    prismicVideoUrl: undefined,
    youtubeId: '0FOpVLCr5uA',
  },
  {
    eyebrow: 'Estudiante · 03',
    title: 'Navegar entre simulacros',
    text: 'Cambio entre aplicaciones para comparar desempeño y revisar el historial disponible.',
    prismicVideoUrl: undefined,
    youtubeId: 'pfVTR9dsGDE',
  },
  {
    eyebrow: 'Estudiante · 04',
    title: 'Ranking general',
    text: 'Lectura de posición relativa para entender desempeño frente al grupo evaluado.',
    prismicVideoUrl: undefined,
    youtubeId: 'Ta4cFLuSvAo',
  },
  {
    eyebrow: 'Estudiante · 05',
    title: 'Perfil por área y evolución',
    text: 'Seguimiento por áreas para identificar fortalezas, rezagos y cambios entre ciclos.',
    prismicVideoUrl: undefined,
    youtubeId: 'p9owMWP1KUU',
  },
  {
    eyebrow: 'Estudiante · 06',
    title: 'Métricas de desempeño',
    text: 'Indicadores generales para interpretar resultados más allá del puntaje final.',
    prismicVideoUrl: undefined,
    youtubeId: 'SV9JXcKJ5Ww',
  },
  {
    eyebrow: 'Estudiante · 07',
    title: 'Métricas de desempeño por área',
    text: 'Desagregación por área para priorizar estudio y orientar refuerzos específicos.',
    prismicVideoUrl: undefined,
    youtubeId: 'rnmumHDFlzE',
  },
  {
    eyebrow: 'Estudiante · 08',
    title: 'Resultados por área',
    text: 'Detalle de desempeño por área evaluada para convertir el resultado en plan de mejora.',
    prismicVideoUrl: undefined,
    youtubeId: 'VsD0GTpNVZQ',
  },
  {
    eyebrow: 'Estudiante · 09',
    title: 'Análisis de respuestas',
    text: 'Revisión de respuestas para reconocer errores, patrones y oportunidades de aprendizaje.',
    prismicVideoUrl: undefined,
    youtubeId: 'SC45PRt_RkI',
  },
] as const;

export const scientificPlatformLayers = [
  {
    step: '01',
    title: 'Medición educativa',
    text: 'Cada aplicación parte de una prueba tipo Saber 11 con respuestas trazables por estudiante, área y sesión. La plataforma organiza esa evidencia como una observación educativa estructurada, no como una nota aislada.',
  },
  {
    step: '02',
    title: 'Procesamiento psicométrico descriptivo',
    text: 'Las respuestas se transforman en porcentajes, puntajes, distribuciones, niveles de desempeño, comparativas y señales de consistencia. Este procesamiento permite leer patrones de error sin prometer diagnósticos clínicos ni reemplazar el criterio docente.',
  },
  {
    step: '03',
    title: 'Analítica por estudiante',
    text: 'El panel individual traduce resultados en una ruta comprensible: desempeño global, áreas fuertes, áreas críticas, ranking, histórico y foco de estudio. El objetivo es reducir incertidumbre y orientar práctica deliberada.',
  },
  {
    step: '04',
    title: 'Analítica institucional',
    text: 'El panel coordinador agrega la información por curso, grado e institución para detectar brechas, priorizar refuerzos y socializar hallazgos con evidencia. La lectura agregada evita decisiones basadas solo en impresiones.',
  },
  {
    step: '05',
    title: 'Ciclo de retroalimentación',
    text: 'La simulación no termina con el puntaje: la retroalimentación en vivo, las grabaciones y los reportes cierran el ciclo entre medición, explicación, repaso y nueva toma de decisiones académicas.',
  },
] as const;

export const scientificChartPanels = [
  {
    label: 'Progreso',
    title: 'Ruta de mejora por ciclos',
    metric: '81%',
    description: 'Ejemplo de cómo se observa avance cuando un estudiante repite medición, retroalimentación y práctica.',
    kind: 'line',
    values: [38, 52, 61, 73, 81],
  },
  {
    label: 'Brechas',
    title: 'Lectura comparativa por área',
    metric: '5 áreas',
    description: 'Ejemplo de barras para priorizar refuerzos por Matemáticas, Lectura, Sociales, Naturales e Inglés.',
    kind: 'bars',
    values: [68, 74, 58, 63, 71],
  },
] as const;

