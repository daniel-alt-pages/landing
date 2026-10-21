/** Simulacro por defecto del tour y del panel embebido. */
export const SHOWCASE_DEFAULT_SIM = 'SG11-19';

/** Demo de respuestas: pregunta correcta en Lectura Crítica (heatmap). */
export const SHOWCASE_TOUR_DEMO = {
  materiaKey: 'lectura crítica',
  questionId: '101',
  studentOption: 'C',
} as const;

export const SHOWCASE_DASHBOARD_CLASS = 'showcase-student-dashboard';

/** Ver `navigation/showcase-navigation.ts` → SHOWCASE_NAV_CLICK_MAP */
export const showcaseDomIds = {
  navBack: 'showcase-nav-back',
  loginEmail: 'login-id-input',
  loginPassword: 'login-birth-input',
  loginSubmit: 'btn-id-birth-login',
  selectorProfile: 'showcase-selector-profile',
  selectorContinue: 'showcase-selector-continue',
  simTab: (simId: string) => `showcase-tab-${simId}`,
  navDashboard: 'showcase-nav-dashboard',
  navMetricas: 'showcase-nav-metricas',
  navRespuestas: 'showcase-nav-respuestas',
  navRanking: 'showcase-nav-ranking',
  navPerfil: 'showcase-nav-perfil',
  sectionRanking: 'showcase-section-ranking',
  sectionRankingKpi: 'showcase-section-ranking-kpi',
  sectionRankingTop: 'showcase-section-ranking-top',
  sectionDashboard: 'showcase-section-dashboard',
  /** Puntaje + ranking (parte superior del Inicio, como el dashboard real). */
  sectionScore: 'showcase-section-score',
  sectionBanner: 'showcase-section-banner',
  sectionMetricas: 'showcase-section-metricas',
  sectionMetricasHero: 'showcase-section-metricas-hero',
  sectionMetricasSkills: 'showcase-section-metricas-skills',
  sectionMetricasGrupo: 'showcase-section-metricas-grupo',
  sectionMetricasFortalezas: 'showcase-section-metricas-fortalezas',
  sectionMetricasPerfil: 'showcase-section-metricas-perfil',
  sectionMetricasArea: 'showcase-section-metricas-area',
  sectionPerfil: 'showcase-section-perfil',
  sectionPerfilEvolucion: 'showcase-section-perfil-evolucion',
  sectionPerfilSocial: 'showcase-section-perfil-social',
  sectionResultadosArea: 'showcase-section-resultados-area',
  sectionMaterias: 'showcase-section-materias',
  /** Banner «Respuestas Correctas del Simulacro» / Ver Claves (fin del scroll en Inicio). */
  sectionClaves: 'showcase-section-claves',
  /** CTA «Ver Ranking →» en tarjeta de posición global (Inicio). */
  dashboardVerRanking: 'showcase-dashboard-ver-ranking',
  /** «Volver al Dashboard» en Ranking. */
  rankingBackDashboard: 'showcase-ranking-back-dashboard',
  sectionRespuestas: 'showcase-section-respuestas',
  sectionRespuestasKpi: 'showcase-section-respuestas-kpi',
  /** Bloque logros + para repasar (insights personalizados). */
  sectionAnalisisInsights: 'showcase-section-analisis-insights',
  analisisExpandLogros: 'showcase-analisis-expand-logros',
  analisisExpandRepasar: 'showcase-analisis-expand-repasar',
  sectionHeatmap: 'showcase-section-heatmap',
  sectionRespuestasLegend: 'showcase-section-respuestas-legend',
  materiaTab: (materiaKey: string) => `showcase-materia-tab-${materiaKey}`,
  materiaAreaCard: (materiaKey: string) => `showcase-materia-area-${materiaKey}`,
  /** Botón «Analizar respuestas de {área}» dentro del modal de métricas por área. */
  metricasAreaAnalizar: 'showcase-metricas-area-analizar',
  questionBox: (questionNum: string) => `showcase-question-box-${questionNum}`,
  option: (letter: string) => `showcase-option-${letter}`,
  cursorIdle: 'showcase-cursor-idle',
} as const;
