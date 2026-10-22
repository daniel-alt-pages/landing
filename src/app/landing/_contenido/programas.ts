export type Acceso = 'incluido' | 'gratis' | 'pago';

export type SemanaId =
  | 'm2'
  | 'm1'
  | 's0'
  | 's1'
  | 's23'
  | 's4'
  | 's56'
  | 's6'
  | 's7'
  | 's8'
  | 's9'
  | 's1011'
  | 's12'
  | 's1314'
  | 's15';

export type Hito = {
  semana: SemanaId;
  titulo: string;
  texto: string;
  simulacro?: boolean;
};

export const PROGRAMAS = {
  eyebrow: 'Calendario B 2027-1',
  title: ['El año completo', 'en un solo calendario'] as const,
  lead: 'Dos programas, Intensivo y Vacacional, más simulacros abiertos para quien todavía no está matriculado. Cada tramo tiene clase, medición o retroalimentación.',
  teaserTitulo: ['Vea el año', 'antes de decidir'] as const,
  teaserLead: 'Intensivo de 16 semanas, vacacional de 8, y un calendario único para los dos. El detalle vive en Programas.',
  teaserCta: 'Ver el calendario',
  confirmar:
    'Fechas reales de cada semana del Calendario B 2027-1 aún no están publicadas: la página muestra semanas, no días. El cuadro impreso de horas (160+56+40+40+20) suma 316 y no cuadra con las 426; se publica el desglose que sí suma 426 (142 teóricas, 158 compilados, 126 prácticas). En el vacacional, 27+81+10 horas asincrónicas suman 118 y no las 136 anotadas. Las «Más de 170 horas» de vacacional.ts no coinciden con las 225 de este calendario. Falta definir encuentros con el colegio, la hoja de ruta y si el plan de refuerzo de 50 horas es para tutores o para estudiantes. Las imágenes de esta página son de ejemplo: reemplazarlas por fotos o capturas reales antes de producción.',
} as const;

export const PROGRAMAS_IMAGENES = {
  hero: {
    src: '/landing/programas/hero-calendario.webp',
    alt: 'Estudiantes de grado 11 revisan un calendario de pared en un salón iluminado.',
    width: 1280,
    height: 720,
  },
  panel: {
    src: '/landing/programas/panel-coordinacion.webp',
    alt: 'Ejemplo de un panel de coordinación con barras por área, sin datos reales.',
    width: 1280,
    height: 720,
  },
} as const;

export const FASES = [
  {
    id: 'pre',
    label: 'Prelanzamiento',
    rango: 'Semana -2 a -1',
    texto: 'Diagnóstico abierto y arranque de quien entra al intensivo.',
  },
  {
    id: 'fundamentos',
    label: 'Fundamentos',
    rango: 'Semana 0 a 7',
    texto: 'Formación del intensivo y dos mediciones.',
  },
  {
    id: 'transicion',
    label: 'Transición',
    rango: 'Semana 8',
    texto: 'Pausa del intensivo y arranque del vacacional.',
  },
  {
    id: 'practica',
    label: 'Práctica conjunta',
    rango: 'Semana 9 a 12',
    texto: 'Los dos programas comparten el mismo tramo.',
  },
  {
    id: 'cierre',
    label: 'Evaluación final',
    rango: 'Semana 13 a 15',
    texto: 'Medición de cierre, retroalimentación y masterclass.',
  },
] as const;

export const SEMANAS: readonly { id: SemanaId; label: string; fase: (typeof FASES)[number]['id'] }[] = [
  { id: 'm2', label: 'Semana -2', fase: 'pre' },
  { id: 'm1', label: 'Semana -1', fase: 'pre' },
  { id: 's0', label: 'Semana 0', fase: 'fundamentos' },
  { id: 's1', label: 'Semana 1', fase: 'fundamentos' },
  { id: 's23', label: 'Semanas 2 y 3', fase: 'fundamentos' },
  { id: 's4', label: 'Semana 4', fase: 'fundamentos' },
  { id: 's56', label: 'Semanas 5 y 6', fase: 'fundamentos' },
  { id: 's7', label: 'Semana 7', fase: 'fundamentos' },
  { id: 's8', label: 'Semana 8', fase: 'transicion' },
  { id: 's9', label: 'Semana 9', fase: 'practica' },
  { id: 's1011', label: 'Semanas 10 y 11', fase: 'practica' },
  { id: 's12', label: 'Semana 12', fase: 'practica' },
  { id: 's1314', label: 'Semanas 13 y 14', fase: 'cierre' },
  { id: 's15', label: 'Semana 15', fase: 'cierre' },
];

export const CARRILES: readonly {
  id: 'intensivo' | 'vacacional' | 'abiertos';
  nombre: string;
  detalle: string;
  hitos: readonly Hito[];
}[] = [
  {
    id: 'intensivo',
    nombre: 'PreICFES Intensivo',
    detalle: '16 semanas · unas 426 horas en vivo',
    hitos: [
      { semana: 'm2', titulo: 'Simulacro abierto', texto: 'Primera medición para conocer el nivel antes de empezar.', simulacro: true },
      { semana: 'm1', titulo: 'Resultados', texto: 'Sesión en vivo para leer el diagnóstico y entrar al programa.' },
      { semana: 's0', titulo: 'Inducción', texto: 'Plataforma, método de estudio, tutores y canal de soporte.' },
      { semana: 's1', titulo: 'Línea base', texto: 'Arranque de clases y diagnóstico por área.' },
      { semana: 's23', titulo: 'Simulacro 1', texto: 'Primera medición del programa. Las clases no se detienen.', simulacro: true },
      { semana: 's4', titulo: 'Retroalimentación', texto: 'Los resultados se vuelven temas de refuerzo.' },
      { semana: 's56', titulo: 'Simulacro 2', texto: 'Segunda medición, con las clases en su ritmo normal.', simulacro: true },
      { semana: 's7', titulo: 'Evolución', texto: 'Comparación de las dos mediciones y reporte para las familias.' },
      { semana: 's8', titulo: 'Simulacro 3', texto: 'Medición intermedia en la semana de pausa.', simulacro: true },
      { semana: 's9', titulo: 'Regreso', texto: 'Bloques conceptuales y ajuste de ritmo, ya junto al vacacional.' },
      { semana: 's1011', titulo: 'Simulacro compartido', texto: 'La misma prueba que presenta el vacacional.', simulacro: true },
      { semana: 's12', titulo: 'Gran retro', texto: 'Encuentro conjunto y análisis de preguntas.' },
      { semana: 's1314', titulo: 'Simulacro final', texto: 'Medición de cierre del programa.', simulacro: true },
      { semana: 's15', titulo: 'Cierre', texto: 'Diagnóstico frente al final, informe individual y despedida.' },
    ],
  },
  {
    id: 'vacacional',
    nombre: 'PreICFES Vacacional',
    detalle: '8 semanas · unas 225 horas en vivo',
    hitos: [
      { semana: 's6', titulo: 'Inscripciones', texto: 'Se abren los cupos con un simulacro de diagnóstico.' },
      { semana: 's7', titulo: 'Inducción', texto: 'Cierre de cupos e inducción breve antes de la primera clase.' },
      { semana: 's8', titulo: 'Diagnóstico', texto: 'Primera medición del vacacional y arranque del ciclo.', simulacro: true },
      { semana: 's9', titulo: 'Práctica', texto: 'Pregunta, error, explicación y repetición, con compilados Saber 11.' },
      { semana: 's1011', titulo: 'Simulacro compartido', texto: 'La misma prueba que presenta el intensivo.', simulacro: true },
      { semana: 's12', titulo: 'Gran retro', texto: 'Encuentro junto al intensivo.' },
      { semana: 's1314', titulo: 'Simulacro final', texto: 'Medición de cierre, compartida con el intensivo.', simulacro: true },
      { semana: 's15', titulo: 'Cierre', texto: 'Masterclass de retroalimentación en vivo.' },
    ],
  },
  {
    id: 'abiertos',
    nombre: 'Simulacros abiertos',
    detalle: 'Para quien no está matriculado en un programa',
    hitos: [
      { semana: 'm2', titulo: 'Simulacro abierto 1', texto: 'Diagnóstico sin costo. Sirve para conocer el nivel.', simulacro: true },
      { semana: 'm1', titulo: 'Resultados', texto: 'Sesión en vivo para leer ese diagnóstico.' },
      { semana: 's0', titulo: 'Comunidad', texto: 'De la semana 0 a la 5, el canal de WhatsApp comparte tips y mini preguntas.' },
      { semana: 's6', titulo: 'Simulacro abierto 2', texto: 'Otro diagnóstico sin costo, de cara al vacacional.', simulacro: true },
      { semana: 's7', titulo: 'Invitación', texto: 'Estudiantes externos y colegios pueden sumarse al simulacro abierto.' },
      { semana: 's1011', titulo: 'Simulacro abierto', texto: 'La misma prueba de los programas, con inscripción aparte.', simulacro: true },
      { semana: 's12', titulo: 'Retro abierta', texto: 'La retroalimentación también se ofrece a quien quiera asistir.' },
      { semana: 's1314', titulo: 'Simulacro abierto', texto: 'Una prueba distinta al examen de cierre de los programas.', simulacro: true },
      { semana: 's15', titulo: 'Masterclass', texto: 'Retroalimentación en vivo y abierta.' },
    ],
  },
];

export const COMPARTIDO = {
  titulo: 'Un simulacro, tres grupos',
  texto:
    'En las semanas 10 y 11 hay una sola prueba. La presentan el intensivo, el vacacional y quien se inscribe por fuera. En la semana 13 el simulacro abierto es otra prueba: no es el examen de cierre de quienes están matriculados.',
} as const;

export const CATALOGO: readonly {
  semana: string;
  codigo: string;
  nombre: string;
  intensivo: Acceso | null;
  vacacional: Acceso | null;
  abierto: Acceso | null;
}[] = [
  { semana: 'Semana -2', codigo: 'SIM-B26-G01', nombre: 'Simulacro de apertura', intensivo: null, vacacional: null, abierto: 'gratis' },
  { semana: 'Semanas 2 y 3', codigo: 'SIM-B26-I01', nombre: 'Simulacro intensivo 1', intensivo: 'incluido', vacacional: null, abierto: null },
  { semana: 'Semanas 5 y 6', codigo: 'SIM-B26-I02', nombre: 'Simulacro intensivo 2', intensivo: 'incluido', vacacional: null, abierto: null },
  { semana: 'Semana 6', codigo: 'SIM-B26-G02', nombre: 'Simulacro abierto del vacacional', intensivo: null, vacacional: null, abierto: 'gratis' },
  { semana: 'Semana 8', codigo: 'SIM-B26-I03', nombre: 'Simulacro intensivo 3', intensivo: 'incluido', vacacional: null, abierto: null },
  { semana: 'Semana 8', codigo: 'SIM-B26-V01', nombre: 'Diagnóstico vacacional', intensivo: null, vacacional: 'incluido', abierto: null },
  { semana: 'Semanas 10 y 11', codigo: 'SIM-B26-C01', nombre: 'Simulacro compartido', intensivo: 'incluido', vacacional: 'incluido', abierto: 'pago' },
  { semana: 'Semanas 13 y 14', codigo: 'SIM-B26-F01', nombre: 'Simulacro final de los programas', intensivo: 'incluido', vacacional: 'incluido', abierto: null },
  { semana: 'Semana 13', codigo: 'SIM-B26-P02', nombre: 'Simulacro abierto 2', intensivo: null, vacacional: null, abierto: 'pago' },
  { semana: 'Semana 15', codigo: 'SIM-B26-M01', nombre: 'Masterclass de retroalimentación', intensivo: 'incluido', vacacional: 'incluido', abierto: 'gratis' },
];

export const ACCESO_LABEL: Record<Acceso, string> = {
  incluido: 'Incluido',
  gratis: 'Gratis',
  pago: 'Pago',
};

export const CTA_PROGRAMAS = {
  titulo: '¿Dudas sobre los programas?',
  texto: 'Un asesor le ayuda a elegir entre intensivo, vacacional o solo simulacros.',
  cta: 'Escribir por WhatsApp',
} as const;
