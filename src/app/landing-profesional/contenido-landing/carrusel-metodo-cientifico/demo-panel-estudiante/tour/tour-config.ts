import type { ShowcaseDashboardTab } from '../types/showcase.types';
import { showcaseDomIds } from '../constants/dom-ids';

export const SHOWCASE_TOUR_CURSOR_HOME = { x: 420, y: 200 } as const;

export type ShowcaseTourPhaseKind =
  | 'reset'
  | 'hold'
  | 'scroll'
  | 'click'
  | 'detail'
  | 'tail';

/** Metadatos de cada beat del tour (scrolls, holds y clics). */
export type ShowcaseTourSectionMeta = {
  id: string;
  kind: ShowcaseTourPhaseKind;
  title: string;
  /** Texto largo: qué muestra la sección y por qué importa en el flujo. */
  description: string;
  tab: ShowcaseDashboardTab | null;
  domTargetId?: string;
};

/** Scroll vertical completo por pestaña (sincronizado con `SHOWCASE_TOUR_PANEL_MS.scrollFull`). */
export const SHOWCASE_TOUR_SCROLL_MS = {
  panelFull: 4_600,
} as const;

/** Catálogo legible: scrolls + secciones sin scroll (holds / clics). */
export const SHOWCASE_TOUR_SECTION_CATALOG: Record<string, ShowcaseTourSectionMeta> = {
  reset: {
    id: 'reset',
    kind: 'reset',
    title: 'Inicio del ciclo',
    description:
      'Entorno demo aislado: entra directo al panel del estudiante con datos simulados (sin login ni Firestore). Reinicia en Inicio, simulacro SG11-19.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.sectionScore,
  },
  dashboardGeneral: {
    id: 'dashboardGeneral',
    kind: 'hold',
    title: '1. Panel principal',
    description:
      'Recorrido inicial por el dashboard: puntaje, percentil, resumen general, nombre del estudiante y accesos principales.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.sectionScore,
  },
  navegarSimulacros: {
    id: 'navegarSimulacros',
    kind: 'click',
    title: '2. Navegar entre simulacros',
    description:
      'El cursor cambia entre simulacros SG11 para enseñar búsqueda histórica: cada selección recalcula puntajes, ranking y áreas.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.simTab('SG11-19'),
  },
  rankingGeneral: {
    id: 'rankingGeneral',
    kind: 'click',
    title: '3. Ranking General',
    description:
      'Abre la tabla de posiciones. El estudiante compara su puesto, puntaje, percentil y top de compañeros del grupo.',
    tab: 'ranking',
    domTargetId: showcaseDomIds.sectionRanking,
  },
  perfilEvolucion: {
    id: 'perfilEvolucion',
    kind: 'scroll',
    title: '4. Perfil por Área & Evolución',
    description:
      'Explica fortalezas y evolución por materia: radar, barras y tendencia frente a simulacros anteriores.',
    tab: 'perfil',
    domTargetId: showcaseDomIds.sectionPerfilEvolucion,
  },
  metricasDesempeno: {
    id: 'metricasDesempeno',
    kind: 'click',
    title: '5. Métricas de Desempeño',
    description:
      'Entra a métricas globales: puntaje, posición, efectividad, percentil y comparación contra el promedio del grupo.',
    tab: 'metricas',
    domTargetId: showcaseDomIds.sectionMetricas,
  },
  metricasArea: {
    id: 'metricasArea',
    kind: 'scroll',
    title: '6. Métricas por Área',
    description:
      'Profundiza en el desglose por materia: Matemáticas, Lectura, Sociales, Naturales e Inglés con puntajes y rankings.',
    tab: 'metricas',
    domTargetId: showcaseDomIds.sectionMetricasArea,
  },
  resultadosArea: {
    id: 'resultadosArea',
    kind: 'scroll',
    title: '7. Resultados por Área',
    description:
      'Abre el resumen de una materia después del simulacro: correctas, promedio del grupo, diferencia y puntaje ICFES.',
    tab: 'respuestas',
    domTargetId: showcaseDomIds.sectionResultadosArea,
  },
  analisisRespuestas: {
    id: 'analisisRespuestas',
    kind: 'detail',
    title: '8. Análisis de respuestas',
    description:
      'Revisión pregunta por pregunta: colores de acierto/error, selección de una pregunta y modal con opciones y distribución.',
    tab: 'respuestas',
    domTargetId: showcaseDomIds.option('C'),
  },
  dashboardScore: {
    id: 'dashboardScore',
    kind: 'hold',
    title: 'Puntaje y posición',
    description:
      'Muestra el puntaje global del simulacro, el percentil y la comparación con el grupo. Es la primera impresión: cómo le fue al estudiante en conjunto antes de bajar al detalle por materia.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.sectionScore,
  },
  scrollDashboardFull: {
    id: 'scrollDashboardFull',
    kind: 'scroll',
    title: 'Recorrido · Inicio',
    description:
      'Scroll completo del panel Inicio: desde el puntaje global hasta el bloque de materias ICFES, sin saltar al final del ciclo.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.sectionMaterias,
  },
  scrollDashboardClaves: {
    id: 'scrollDashboardClaves',
    kind: 'scroll',
    title: 'Inicio · Ver Claves',
    description:
      'Baja por el main del dashboard hasta el banner «Respuestas Correctas del Simulacro» / Ver Claves.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.sectionClaves,
  },
  scrollDashboardToTop: {
    id: 'scrollDashboardToTop',
    kind: 'scroll',
    title: 'Inicio · volver arriba',
    description: 'Sube el scroll al inicio del panel para alcanzar el CTA de ranking.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.sectionScore,
  },
  clickDashboardVerRanking: {
    id: 'clickDashboardVerRanking',
    kind: 'click',
    title: 'Ver Ranking',
    description: 'Clic en «Ver Ranking →» de la tarjeta de posición global.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.dashboardVerRanking,
  },
  scrollRankingMid: {
    id: 'scrollRankingMid',
    kind: 'scroll',
    title: 'Ranking · fondo',
    description: 'Scroll hasta el final del panel de ranking (tabla y podio).',
    tab: 'ranking',
    domTargetId: showcaseDomIds.sectionRanking,
  },
  scrollRankingToTop: {
    id: 'scrollRankingToTop',
    kind: 'scroll',
    title: 'Ranking · arriba',
    description: 'Sube el scroll para volver al encabezado del ranking.',
    tab: 'ranking',
    domTargetId: showcaseDomIds.sectionRankingKpi,
  },
  clickRankingBack: {
    id: 'clickRankingBack',
    kind: 'click',
    title: 'Volver al Dashboard',
    description: 'Regresa a Inicio desde ranking.',
    tab: 'ranking',
    domTargetId: showcaseDomIds.rankingBackDashboard,
  },
  clickNavRespuestas: {
    id: 'clickNavRespuestas',
    kind: 'click',
    title: 'Ir a Respuestas',
    description: 'Pestaña Respuestas en el header de Inicio.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.navRespuestas,
  },
  clickAnalisisMaterias: {
    id: 'clickAnalisisMaterias',
    kind: 'click',
    title: 'Materias en análisis',
    description: 'Recorre Matemáticas, Sociales, Ciencias e Inglés en el selector de materias.',
    tab: 'respuestas',
    domTargetId: showcaseDomIds.materiaTab('matemáticas'),
  },
  clickAnalisisLogros: {
    id: 'clickAnalisisLogros',
    kind: 'click',
    title: 'Logros difíciles',
    description:
      'Expande “Tus mejores logros” para mostrar preguntas difíciles que el estudiante sí acertó.',
    tab: 'respuestas',
    domTargetId: showcaseDomIds.analisisExpandLogros,
  },
  clickAnalisisRepasar: {
    id: 'clickAnalisisRepasar',
    kind: 'click',
    title: 'Preguntas para repasar',
    description:
      'Expande “Para repasar” y deja visible la lista de preguntas prioritarias antes de abrir una pregunta.',
    tab: 'respuestas',
    domTargetId: showcaseDomIds.analisisExpandRepasar,
  },
  detailPreguntaLogro: {
    id: 'detailPreguntaLogro',
    kind: 'detail',
    title: 'Detalle desde logros',
    description:
      'Abre una pregunta destacada del análisis personalizado para mostrar el modal con explicación y distribución.',
    tab: 'respuestas',
    domTargetId: showcaseDomIds.questionBox('101'),
  },
  detailPreguntaIngles: {
    id: 'detailPreguntaIngles',
    kind: 'detail',
    title: 'Pregunta · Inglés',
    description: 'Abre el detalle de una pregunta en el heatmap de Inglés.',
    tab: 'respuestas',
    domTargetId: showcaseDomIds.questionBox('80'),
  },
  scrollMetricasFull: {
    id: 'scrollMetricasFull',
    kind: 'scroll',
    title: 'Recorrido · Métricas',
    description: 'Scroll completo del panel de métricas de desempeño.',
    tab: 'metricas',
    domTargetId: showcaseDomIds.sectionMetricas,
  },
  scrollMetricasToTop: {
    id: 'scrollMetricasToTop',
    kind: 'scroll',
    title: 'Métricas · arriba',
    description: 'Sube al nav sticky para pulsar Volver.',
    tab: 'metricas',
    domTargetId: showcaseDomIds.sectionMetricasHero,
  },
  holdDashboardMaterias: {
    id: 'holdDashboardMaterias',
    kind: 'hold',
    title: 'Materias del simulacro',
    description:
      'Pausa sobre las tarjetas de materias para leer colores, porcentajes y ranking por asignatura. Desde aquí el estudiante elige qué área profundizar; el tour enfatiza que el producto organiza todo por materia.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.sectionMaterias,
  },
  clickSimulacros: {
    id: 'clickSimulacros',
    kind: 'click',
    title: 'Selector de simulacros',
    description:
      'Recorre SG11-08, 09, 10 y vuelve a SG11-19. Demuestra que el historial de simulacros es navegable y que métricas y análisis se recalculan al cambiar de evento.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.simTab('SG11-19'),
  },
  clickNavMetricas: {
    id: 'clickNavMetricas',
    kind: 'click',
    title: 'Ir a Métricas',
    description:
      'Abre la pestaña Métricas del panel embebido. Transición del resumen por materias al tablero analítico (fortalezas, perfil, comparación con el grupo).',
    tab: 'metricas',
    domTargetId: showcaseDomIds.navMetricas,
  },
  holdMetricasHero: {
    id: 'holdMetricasHero',
    kind: 'hold',
    title: 'Panel de métricas',
    description:
      'Enfoca el bloque principal de estadísticas: puntaje, distribución de habilidades y lectura rápida del desempeño agregado. Complementa el dashboard con gráficos y rankings por competencia.',
    tab: 'metricas',
    domTargetId: showcaseDomIds.sectionMetricas,
  },
  clickNavAnalisis: {
    id: 'clickNavAnalisis',
    kind: 'click',
    title: 'Ir a Análisis de respuestas',
    description:
      'Entra a la vista Análisis (respuestas pregunta a pregunta). A partir de aquí el scroll vuelve a importar: primero KPIs de la materia, luego el mapa de aciertos.',
    tab: 'respuestas',
    domTargetId: showcaseDomIds.navRespuestas,
  },
  scrollAnalisisFull: {
    id: 'scrollAnalisisFull',
    kind: 'scroll',
    title: 'Recorrido · Análisis',
    description:
      'Scroll completo de la pestaña Análisis: cabecera, KPIs por materia, heatmap S1/S2 y leyenda — en un solo desplazamiento continuo al abrir la pestaña.',
    tab: 'respuestas',
    domTargetId: showcaseDomIds.sectionRespuestas,
  },
  holdAnalisisKpis: {
    id: 'holdAnalisisKpis',
    kind: 'hold',
    title: 'Resumen por materia',
    description:
      'Mantiene visibles los KPIs de Matemáticas (materia demo del tour). Permite comparar al estudiante con su cohorte antes de entrar al detalle pregunta por pregunta.',
    tab: 'respuestas',
    domTargetId: showcaseDomIds.sectionRespuestasKpi,
  },
  detailPreguntaModal: {
    id: 'detailPreguntaModal',
    kind: 'detail',
    title: 'Detalle de pregunta',
    description:
      'Modal con estado de la respuesta, dificultad global y distribución de opciones del grupo. El puntero recorre la opción marcada por el estudiante para explicar el análisis comparativo.',
    tab: 'respuestas',
    domTargetId: showcaseDomIds.option('C'),
  },
  tailVolverInicio: {
    id: 'tailVolverInicio',
    kind: 'tail',
    title: 'Volver a Inicio',
    description:
      'Cierra el modal de pregunta y regresa a Inicio antes de Ranking y Métricas.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.navDashboard,
  },
  clickMetricasAnalizar: {
    id: 'clickMetricasAnalizar',
    kind: 'click',
    title: 'Analizar respuestas del área',
    description:
      'Desde el modal de Matemáticas en Métricas, abre Análisis con la materia en la URL (`returnTo` guarda Métricas).',
    tab: 'respuestas',
    domTargetId: showcaseDomIds.metricasAreaAnalizar,
  },
  clickNavBack: {
    id: 'clickNavBack',
    kind: 'click',
    title: 'Volver',
    description:
      'Usa `returnTo` o la pila interna para regresar a Métricas sin saltos de estado.',
    tab: 'metricas',
    domTargetId: showcaseDomIds.navBack,
  },
  cierreCiclo: {
    id: 'cierreCiclo',
    kind: 'tail',
    title: 'Cierre del ciclo',
    description: 'Vuelve a Inicio y reinicia la demostración.',
    tab: 'dashboard',
    domTargetId: showcaseDomIds.navDashboard,
  },
};

export const SHOWCASE_TOUR_SCROLL_PHASE_IDS = [
  'scrollDashboardFull',
  'scrollAnalisisFull',
] as const;

/** Orden narrativo mostrado en la columna izquierda del showcase (estilo product tour). */
export const SHOWCASE_TOUR_NARRATIVE_ORDER = [
  'scrollDashboardClaves',
  'clickDashboardVerRanking',
  'scrollRankingMid',
  'clickRankingBack',
  'clickNavRespuestas',
  'scrollAnalisisFull',
  'clickAnalisisMaterias',
  'detailPreguntaIngles',
  'clickNavBack',
  'clickNavMetricas',
  'scrollMetricasFull',
  'clickNavBack',
  'cierreCiclo',
] as const;

export const SHOWCASE_TOUR_NARRATIVE_PHASES = SHOWCASE_TOUR_NARRATIVE_ORDER.map(
  (id) => SHOWCASE_TOUR_SECTION_CATALOG[id],
);
