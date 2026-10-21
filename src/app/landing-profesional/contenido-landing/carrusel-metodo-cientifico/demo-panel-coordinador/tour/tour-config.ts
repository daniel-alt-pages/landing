/**
 * Catálogo de fases del tour autoclic del panel coordinador.
 *
 * El recorrido cicla por las 7 sub-rutas del coordinador, mostrando cada
 * panel ~10 segundos sin requerir login.
 */

export type CoordTab =
  | 'resumen'
  | 'pensum'
  | 'desempeno'
  | 'estudiantes'
  | 'respuestas'
  | 'analisis'
  | 'comparativa'
  | 'historico';

export type CoordTourPhaseKind = 'reset' | 'hold' | 'tail';

export type CoordTourPhaseMeta = {
  id: CoordTab | 'reset' | 'tail';
  kind: CoordTourPhaseKind;
  tab: CoordTab;
  title: string;
  description: string;
};

export const COORD_TOUR_CATALOG: Record<string, CoordTourPhaseMeta> = {
  reset: {
    id: 'reset',
    kind: 'reset',
    tab: 'resumen',
    title: 'Reinicio del recorrido',
    description:
      'Vuelve a la vista de resumen del coordinador, sin filtros aplicados, lista para empezar de nuevo.',
  },
  resumen: {
    id: 'resumen',
    kind: 'hold',
    tab: 'resumen',
    title: '1. Resumen ejecutivo',
    description:
      'Vista de bienvenida con tarjetas KPI institucionales: promedio, tasa de aprobación, distribución y alertas críticas.',
  },
  pensum: {
    id: 'pensum',
    kind: 'hold',
    tab: 'pensum',
    title: '2. Pensum y temas ICFES',
    description:
      'Cobertura curricular por materia: qué competencias y afirmaciones cubre cada sesión del simulacro.',
  },
  desempeno: {
    id: 'desempeno',
    kind: 'hold',
    tab: 'desempeno',
    title: '3. Desempeño por niveles',
    description:
      'Distribución de estudiantes en los 4 niveles ICFES (Bajo, Medio, Alto, Superior) con visualizaciones limpias.',
  },
  estudiantes: {
    id: 'estudiantes',
    kind: 'hold',
    tab: 'estudiantes',
    title: '4. Estudiantes y alertas',
    description:
      'Tabla rankeada de estudiantes, filtros por nivel y modal de detalle con respuestas pregunta a pregunta.',
  },
  analisis: {
    id: 'analisis',
    kind: 'hold',
    tab: 'analisis',
    title: '5. Análisis por pregunta',
    description:
      'Auditoría de las preguntas más difíciles, distribución de opciones marcadas y exportable para retroalimentación.',
  },
  comparativa: {
    id: 'comparativa',
    kind: 'hold',
    tab: 'comparativa',
    title: '6. Comparativa entre instituciones',
    description:
      'Benchmark cruzado contra otras instituciones del mismo simulacro: ranking nacional, percentiles y brechas.',
  },
  historico: {
    id: 'historico',
    kind: 'hold',
    tab: 'historico',
    title: '7. Histórico de simulacros',
    description:
      'Evolución del rendimiento del grupo a lo largo de los simulacros: tendencias, mejoras y áreas a reforzar.',
  },
  tail: {
    id: 'tail',
    kind: 'tail',
    tab: 'resumen',
    title: 'Cierre del recorrido',
    description: 'Regresa a la vista resumen para repetir la demostración.',
  },
};

export const COORD_TOUR_NARRATIVE_ORDER: readonly string[] = [
  'resumen',
  'pensum',
  'desempeno',
  'estudiantes',
  'analisis',
  'comparativa',
  'historico',
] as const;
