/**
 * «Qué encuentra en el sitio» en el panel B2B (/instituciones). Textos de COPY.md (21-oct-2026),
 * todos tomados del propio sitio. Legal va al final y no es una tarjeta-enlace.
 */
export const B2B_MAPA = {
  titulo: 'Qué encuentra en el sitio',
  lead: 'Cada pregunta tiene su página. Elija por dónde empezar.',
  nota: ['Todo lo que necesita,', 'en un solo lugar'] as const,
  rutas: [
    { id: 'instituciones', etiqueta: 'Colegios', titulo: 'Modelo de servicios institucionales', texto: 'Tres niveles de preparación Saber 11 para el Calendario B-A 2027-1. El primer simulacro no tiene costo.', href: '/landing/instituciones#niveles' },
    { id: 'plataforma', etiqueta: 'Coordinación y docentes', titulo: 'Los paneles', texto: 'Paneles de coordinación y de estudiante. Los resultados se publican en la semana siguiente a cada simulacro.', href: '/landing/plataforma' },
    { id: 'programas', etiqueta: 'Estudiantes y familias', titulo: 'Programas y simulacros', texto: 'Programas para estudiantes de grado 11, con simulacros.', href: '#solicitar-reunion', ir: 'Hablar con nosotros' },
    { id: 'resultados', etiqueta: 'Resultados', titulo: 'Puntajes y mensajes 2026-A', texto: 'Puntajes destacados, mensajes de estudiantes del Calendario A 2026 y las 65 instituciones que ya aplicaron al menos un simulacro.', href: '/landing/resultados' },
    { id: 'nosotros', etiqueta: 'Equipo', titulo: 'Quiénes somos', texto: 'Nuestro fundador y el equipo de tutores.', href: '/landing/nosotros' },
  ],
  legal: {
    id: 'legal',
    etiqueta: 'Legal',
    titulo: 'Política de datos y cookies',
    texto: 'Tratamiento de datos personales según la Ley 1581 de 2012 y el Decreto 1377 de 2013.',
    datos: ['SEAMOSGENIOS S.A.S. · NIT 902080201-8', 'seamosgenios@adpmh.com'],
    href: '/landing/politica-de-datos',
  },
} as const;
