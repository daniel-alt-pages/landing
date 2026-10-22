/** Portafolio B2B · Calendario B-A 2027-1. Texto de la landing del deck institucional. */

export const B2B_NAV = [
  { href: '#ciclo', id: 'ciclo', label: 'Ciclo' },
  { href: '#porque', id: 'porque', label: 'Por qué' },
  { href: '#niveles', id: 'niveles', label: 'Niveles' },
  { href: '#programa', id: 'programa', label: 'Cada nivel' },
  { href: '#plataforma', id: 'plataforma', label: 'Plataforma' },
  { href: '#servicio', id: 'servicio', label: 'Cómo trabajamos' },
  { href: '#agendar', id: 'agendar', label: 'Agendar' },
] as const;

export const B2B_HERO = {
  chip: 'SEAMOSGENIOS S.A.S. · NIT 902080201-8',
  kicker: 'Calendario B-A 2027-1',
  title: 'Preparación Saber 11 para colegios: medible, trazable y acompañada',
  accent: 'medible, trazable y acompañada',
  lead: 'Para que más estudiantes lleguen a la universidad. Para colegios y consejos directivos.',
  pilares: [
    { title: '3 niveles' },
    { title: 'Escala 0-500' },
    { title: '4 actores' },
  ],
};

export const B2B_RESUMEN = {
  eyebrow: 'Resumen',
  title: ['Resumen', 'ejecutivo'] as const,
  lead: 'Evaluación tipo Saber 11, formación virtual sincrónica, práctica, analítica y acompañamiento a la comunidad educativa. La institución elige la profundidad: desde una evaluación puntual hasta un programa continuo.',
  pasos: [
    { title: 'Evaluar', text: 'Dónde estamos' },
    { title: 'Comprender', text: 'Qué está pasando' },
    { title: 'Formar', text: 'Qué reforzar' },
    { title: 'Acompañar', text: 'Quién necesita apoyo' },
    { title: 'Verificar', text: 'Qué cambió' },
    { title: 'Mejorar', text: 'Qué sigue' },
  ],
  idea: 'SEAMOSGENIOS no sustituye la labor de la institución: es un aliado académico y de analítica que aporta información útil, acompañamiento y oportunidades de intervención.',
  cierre: 'La preparación Saber 11 deja de ser solo un conjunto de clases y se convierte en un proceso medible, trazable y acompañado.',
};

export const B2B_PROBLEMA = {
  eyebrow: 'Contexto',
  title: ['El problema', 'que resolvemos'] as const,
  lead: 'Cada año, miles de estudiantes no alcanzan los resultados Saber 11 que necesitan para ingresar a la educación superior. Las causas son estructurales.',
  cifras: [
    { n: '5 de cada 10', text: 'estudiantes de zona urbana ingresan a la universidad justo después de terminar el colegio.' },
    { n: '3 de cada 10', text: 'estudiantes de zona rural ingresan a la universidad justo después de terminar el colegio.' },
  ],
  fuente: 'Fuente: Presidencia de la República (2025)',
  cicloTitulo: 'El ciclo que está limitando su futuro',
  ciclo: [
    { title: 'Problema', text: 'Preparación insuficiente, recursos limitados y metodologías que no responden a las exigencias actuales.' },
    { title: 'Consecuencia', text: 'Resultados bajos y menos oportunidades de ingreso a la universidad.' },
    { title: 'Oportunidad', text: 'Con acompañamiento y herramientas adecuadas, cada estudiante alcanza su máximo potencial.' },
  ],
  compromiso: 'Nuestro compromiso es romper este ciclo y abrirles las puertas a un futuro posible.',
};

export const B2B_QUIENES = {
  eyebrow: 'Nosotros',
  title: ['¿Quiénes', 'somos?'] as const,
  lead: 'En Colombia, prepararse bien para Saber 11 sigue siendo un privilegio. SEAMOSGENIOS SAS (NIT 902080201-8) rompe esa barrera con preparación Saber 11, evaluación educativa, tecnología y análisis de datos.',
  rasgos: [
    { title: 'Acceso a los mejores', text: 'Tutores de las mejores universidades: U. Andes, UIS, ICESI, UdeA, Nacional, etc.' },
    { title: 'Cero desplazamientos', text: 'Más tiempo para estudiar desde casa.' },
    { title: 'Flexibilidad horaria', text: 'Clases en vivo y grabadas.' },
    { title: 'Aprendizaje adaptativo', text: 'Reportes por nivel de desempeño individual y grupal.' },
  ],
  mision: 'Transformar vidas con herramientas reales que abran el futuro académico de cualquier estudiante.',
  vision: 'Democratizar la educación en Colombia y ser el programa virtual líder en calidad, impacto social y oportunidad para todos.',
};

export const B2B_PROPUESTA = {
  eyebrow: 'Propuesta de valor',
  title: ['La evaluación no termina', 'en un puntaje'] as const,
  lead: 'Empresa colombiana orientada a la preparación Saber 11, evaluación educativa, tecnología y análisis de datos.',
  capacidades: [
    { title: 'Formación', text: 'Clases sincrónicas, material, grabaciones, práctica y orientación complementaria.' },
    { title: 'Evaluación', text: 'Simulacros, mini simulacros, pruebas cortas, desafíos y análisis de respuestas.' },
    { title: 'Tecnología', text: 'Plataforma por roles: asistencia, contenidos, resultados, comunicaciones y trazabilidad.' },
    { title: 'Analítica', text: 'Por estudiante, grupo, institución, área y competencia; histórico, benchmark de instituciones focalizadas y alertas.' },
    { title: 'Acompañamiento', text: 'Seguimiento, socialización de resultados, planes de acción y apoyo a familias.' },
  ],
  checks: [
    'Busca explicar qué está ocurriendo y dónde intervenir.',
    'La institución ve asistencia, participación y desempeño durante todo el proceso.',
    'Los estudiantes viven una experiencia digital continua, no encuentros aislados.',
    'En el Nivel 3, familias, docentes y directivos reciben herramientas de acompañamiento.',
    'El programa anual une dos calendarios con diagnóstico, refuerzo y verificación: ningún ciclo empieza de cero.',
  ],
  ficha: [
    ['Razón social', 'SEAMOSGENIOS S.A.S.'],
    ['NIT', '902080201-8'],
    ['Contacto', 'seamosgenios@adpmh.com'],
    ['Modalidad institucional', 'Virtual'],
    ['Clases y encuentros', 'Google Meet, gestionados por SEAMOSGENIOS'],
    ['Plataforma', 'Ecosistema propio: formación, evaluación, resultados, comunicación y PQRS.'],
  ],
};

export const B2B_CADENA = {
  eyebrow: 'Arquitectura del portafolio B2B',
  title: ['Cadena de valor', 'institucional'] as const,
  lead: 'Tres niveles de profundidad. Cada nivel puede configurarse dentro de límites previamente acordados con la institución.',
  eslabones: [
    { n: '1', title: 'Evaluar', text: 'Simulacros estandarizados' },
    { n: '2', title: 'Comprender', text: 'Analítica de brechas y datos' },
    { n: '3', title: 'Formar', text: 'Clases en vivo y conceptos' },
    { n: '4', title: 'Acompañar', text: 'Comité directivo y familias' },
    { n: '5', title: 'Intervenir', text: 'Refuerzo y solución de errores' },
    { n: '6', title: 'Verificar', text: 'Medición de avance T0, T1 y T2' },
    { n: '7', title: 'Mejorar', text: 'Impacto sostenido en Saber 11' },
  ],
  nota: 'Los productos no son ofertas aisladas: son niveles crecientes de profundidad en la misma cadena.',
};

export const B2B_NIVELES = [
  {
    id: 'nivel-1',
    label: 'Nivel 1',
    name: 'Evaluación institucional Saber 11',
    question: '¿Dónde estamos?',
    modo: 'Medición estandarizada y diagnóstica',
    cover: 'Cubre evaluar y comprender. Punto de entrada para colegios que requieren un diagnóstico puntual.',
    offer: 'Diagnóstico',
    note: 'Punto de entrada para un diagnóstico puntual.',
    href: '#n1',
    cta: 'Ver el Nivel 1',
    includesLabel: 'Qué incluye',
    includes: [
      'Simulacro tipo Saber 11, de diagnóstico y de cierre',
      'Aplicación digital o física coordinada',
      'Reporte de cada estudiante y del colegio',
      'Socialización de resultados, de 1,5 a 2 horas',
      'Consulta de resultados en la plataforma',
      'Entrega del informe a directivos',
    ],
    points: [
      'Aplicación digital o física coordinada.',
      'Reportes individuales e informe institucional consolidado.',
      'Sesión de socialización de resultados (1,5 a 2 horas).',
    ],
  },
  {
    id: 'nivel-2',
    label: 'Nivel 2',
    name: 'Evaluación + formación focalizada',
    question: '¿Dónde estamos y qué debemos reforzar?',
    modo: 'Medir, priorizar e intervenir',
    cover: 'Cubre evaluar, comprender, formar, intervenir y verificar. Intervención ágil sobre las brechas, con medición de progreso.',
    offer: 'Intervención',
    note: 'Proyecto acotado para medir e intervenir.',
    href: '#n2',
    cta: 'Ver el Nivel 2',
    includesLabel: 'Todo lo del Nivel 1, más:',
    includes: [
      'Formación sincrónica sobre las brechas',
      'Evaluación corta para verificar el progreso',
      'Analítica de brechas por área',
      'Contenidos junto con los resultados',
      'Socialización técnica para docentes',
      'Asistencia durante esas horas de formación',
    ],
    points: [
      'Simulacro institucional con calificación tipo Saber 11.',
      'Formación sincrónica focalizada en las brechas detectadas.',
      'Evaluación corta de verificación de progreso académico.',
    ],
  },
  {
    id: 'nivel-3',
    label: 'Nivel 3',
    name: 'Programa institucional integral',
    question: '¿Cómo construimos una mejora continua?',
    modo: 'Acompañar, medir, intervenir y transformar',
    cover: 'Cubre el 100% de la cadena: evaluar, comprender, formar, acompañar, intervenir, verificar y mejorar. Alianza de largo plazo: SEAMOSGENIOS se integra como el motor de analítica y alto rendimiento del colegio.',
    offer: 'Mejora continua',
    note: 'Alianza de uno o dos calendarios escolares.',
    href: '#n3',
    cta: 'Ver el Nivel 3',
    includesLabel: 'Todo lo del Nivel 2, más:',
    includes: [
      'PreICFES completo y evaluación periódica',
      'Estudiante, familias, docentes y directivos en el mismo ecosistema',
      'Dos encuentros con familias y un tablero',
      'Hasta 15 horas de comité estratégico',
      'Alertas tempranas durante todo el proceso',
      'Plan de mejora entre calendarios',
    ],
    points: [
      'Relación estratégica continua durante 1 o 2 calendarios escolares.',
      'PreICFES intensivo completo y evaluación periódica continua.',
      'Ecosistema de 4 actores: estudiante, familias, docentes y directivos.',
      'Hasta 15 horas de acompañamiento estratégico y plan de mejora interciclo.',
    ],
  },
] as const;

export const B2B_COMPARATIVO = {
  title: ['Comparativo de valor', 'institucional'] as const,
  lead: 'Tres niveles de profundidad: medir, intervenir y acompañar hacia la mejora continua.',
  headers: ['Dimensión', 'Nivel 1 · Evaluación', 'Nivel 2 · Focalizada', 'Nivel 3 · Integral'],
  rows: [
    ['Evaluación tipo Saber 11', 'Diagnóstica y de cierre', 'Con verificación', 'Batería periódica'],
    ['Formación para estudiantes', 'No incluye', 'Formación sincrónica focalizada', 'PreICFES completo'],
    ['Plataforma y ecosistema', 'Consulta de resultados', 'Resultados y contenidos', 'Ecosistema total y racha'],
    ['Analítica y reportes', 'Individual y del colegio', 'Brechas por área', 'Lectura profunda (BI)'],
    ['Acompañamiento a familias', 'No incluye', 'No, salvo excepción', '2 encuentros y tablero'],
    ['Herramientas docentes', 'Socialización', 'Socialización técnica', 'Sala interactiva'],
    ['Gestión de directivos', 'Entrega de informe', 'Resultados y corte', 'Hasta 15 h de comité estratégico'],
    ['Monitoreo de asistencia', 'Solo el día de la prueba', 'Asistencia en la formación', 'Control sincrónico permanente'],
    ['Sistema de alertas', 'No aplica', 'Parcial', 'Tempranas, en todo el proceso'],
    ['Personalización curricular', 'Baremo estándar', 'Basada en brechas', 'Plan a la medida de la institución'],
    ['Continuidad anual', 'Transaccional', 'Proyecto acotado', 'Plan de mejora interciclo'],
    ['Relación con el colegio', 'Puntual: medir', 'Corta: medir e intervenir', 'Estratégica: mejora continua'],
  ],
};

/** Filas N1, N2 y N3. Columnas en el orden de B2B_CADENA.eslabones. */
export const B2B_COBERTURA = [
  [true, true, false, false, false, false, false],
  [true, true, true, false, true, true, false],
  [true, true, true, true, true, true, true],
] as const;

export const B2B_PASOS_CORTOS = ['Evaluar', 'Comprender', 'Formar', 'Acompañar', 'Intervenir', 'Verificar', 'Mejorar'] as const;

export const B2B_CICLO_CENTRO = 'La evaluación no termina en un puntaje.';
export const B2B_CICLO_CIERRE = 'SEAMOSGENIOS acompaña con datos. No reemplaza a la institución.';

export const B2B_PORQUE = {
  pregunta: '¿Por qué lo necesito?',
  titulo: 'La brecha no es de capacidad',
  acento: 'capacidad',
  bajada: 'Menos estudiantes de zona rural entran a la universidad al salir del colegio.',
  cadena: ['Preparación insuficiente', 'Resultados bajos', 'Menos acceso'],
} as const;

export const B2B_CIERRE = {
  titulo: '¿Empezamos con un simulacro tipo Saber 11?',
  linea: 'Cuéntenos de su institución y le proponemos por dónde empezar.',
} as const;
