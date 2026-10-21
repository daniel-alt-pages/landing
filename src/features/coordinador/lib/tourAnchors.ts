/**
 * Anclajes canónicos del tour contextual del panel coordinador.
 *
 * Convención:
 *   - Cada bloque importante expone `[data-coord-tour="<id>"]` en el contenedor
 *     de sección (`coord-card`, `<section>`, tarjeta con header) — no en SVG/canvas.
 *   - IDs con prefijo por vista para evitar colisiones.
 *
 * Al agregar un bloque nuevo:
 *   1) sumar el id aquí,
 *   2) `data-coord-tour={TourAnchors.X}` en el contenedor,
 *   3) registrar el paso en `coordinatorGuidedTourSteps`.
 */
export const TourAnchors = {
    // Shell
    navSidebar: 'coord-nav',
    navMobile: 'coord-nav-mobile',
    helpBubble: 'coord-help-bubble',
    reportToolbar: 'coord-report-toolbar',

    // Dashboard (/coordinador)
    dashboardTabs: 'd-tabs',
    dashboardOnePhrase: 'd0',
    /** @deprecated Prefer dashboardHeroScore / dashboardHeroLevels / dashboardHeroApproval */
    dashboardHero: 'd-hero-bento',
    dashboardHeroScore: 'd-hero-score',
    dashboardHeroLevels: 'coord-hero-niveles',
    dashboardHeroApproval: 'd-hero-approval',
    /** @deprecated Prefer dashboardKpisG1Chart … dashboardKpisSummary */
    dashboardKpis: 'd-kpis-block',
    dashboardKpisIntro: 'd-kpis-intro',
    dashboardKpisGroup1: 'd-kpis-g1',
    dashboardKpisGroup2: 'd-kpis-g2',
    dashboardKpisGroup3: 'd-kpis-g3',
    dashboardKpisG1Chart: 'd-kpis-g1-chart',
    dashboardKpisG2Chart: 'd-kpis-g2-chart',
    dashboardKpisG3Chart: 'd-kpis-g3-chart',
    dashboardKpisSummary: 'd-kpis-summary',
    /** @deprecated Usar anclas G1/G2/G3/summary */
    dashboardKpisRoot: 'coord-kpis',
    dashboardRadar: 'd-radar-block',
    dashboardRadarChart: 'd-radar-chart',
    dashboardDistribution: 'd-distribution-block',
    dashboardSubjectStrip: 'd-areas-block',
    /** @deprecated Prefer dashboardFollowupTop / dashboardFollowupRisk */
    dashboardFollowup: 'd-followup-block',
    dashboardFollowupTop: 'd-followup-top',
    dashboardFollowupRisk: 'd-followup-risk',
    dashboardGapAnalysis: 'd-gap-analysis',
    dashboardRanking: 'd-ranking-block',
    dashboardRankingSearch: 'd-ranking-search',
    dashboardRankingTable: 'd-ranking-table',
    /** @deprecated Prefer dashboardAnalisisKpis / Filters / Table */
    dashboardAnalisisTab: 'd-analisis-tab-block',
    dashboardAnalisisKpis: 'd-analisis-kpis',
    dashboardAnalisisFilters: 'd-analisis-filters',
    dashboardAnalisisTable: 'd-analisis-table',
    /** @deprecated Prefer dashboardAlertasSummary / dashboardAlertasTable */
    dashboardAlertasTab: 'd-alertas-tab-block',
    dashboardAlertasSummary: 'd-alertas-summary',
    dashboardAlertasTable: 'd-alertas-table',
    /** @deprecated Prefer dashboardBenchmarkHero / Areas / Context / Bars */
    dashboardBenchmarkTab: 'd-benchmark-tab-block',
    dashboardBenchmarkHero: 'd-benchmark-hero',
    dashboardBenchmarkGauge: 'd-benchmark-gauge',
    dashboardBenchmarkAreas: 'd-benchmark-areas',
    dashboardBenchmarkAreaCards: 'd-benchmark-areas-cards',
    dashboardBenchmarkContext: 'd-benchmark-context',
    dashboardBenchmarkBars: 'd-benchmark-bars',
    dashboardInsights: 'd-insights-block',
    dashboardFollowupRow: 'd-followup-row',

    // Modal perfil estudiante
    studentModalRoot: 'student-modal-root',
    studentModalHeader: 'student-modal-header',
    studentModalScores: 'student-modal-scores',
    studentModalTabs: 'student-modal-tabs',
    studentModalClose: 'student-modal-close',

    // Resumen / Pensum (/coordinador/pensum)
    resumenHeader: 'r0',
    resumenKpis: 'r1',
    /** @deprecated Prefer pensumAlert / pensumIndicators / pensumPlan */
    resumenActions: 'r2',
    pensumAlert: 'r-alert',
    pensumIndicators: 'r-indicators',
    pensumPlan: 'r-plan',
    pensumAreas: 'r-areas',
    pensumFilters: 'r-filters',
    pensumStrengths: 'r-strengths',
    pensumPlanAccordion: 'r-plan-accordion',
    pensumBanco: 'r-banco',

    // Comparativa (/coordinador/comparativa)
    comparativaHeader: 'c0',
    comparativaFilters: 'c1',
    /** @deprecated Prefer anclas por gráfico */
    comparativaContent: 'c2',
    comparativaKpis: 'comparativa-kpis',
    comparativaLollipop: 'c-lollipop-chart',
    comparativaSubjectChart: 'c-subject-chart',
    comparativaRadar: 'c-radar',
    comparativaBullets: 'c-bullets',
    comparativaApproval: 'c-approval',
    comparativaHeatmap: 'c-heatmap',
    comparativaContext: 'c-context',

    // Histórico (/coordinador/historico)
    historicoHeader: 'h0',
    historicoControls: 'h1',
    /** @deprecated Prefer historicoChartEvolution / Subjects / Levels */
    historicoCharts: 'h2',
    historicoKpis: 'historico-kpis',
    historicoChartEvolution: 'h-chart-evolution',
    historicoChartSubjects: 'h-chart-subjects',
    historicoChartLevels: 'h-chart-levels',

    // Análisis (/coordinador/analisis)
    analisisHeader: 'a0',
    analisisTabs: 'a1',
    /** @deprecated Prefer analisisKpis / analisisInsights */
    analisisContent: 'a2',
    analisisKpis: 'a-kpis',
    analisisInsights: 'a-insights',
    analisisDrawer: 'a-drawer',
    analisisQuestionModal: 'a-question-modal',

    // Estudiantes (/coordinador/estudiantes)
    estudiantesHeader: 'e0',
    estudiantesControls: 'e1',
    estudiantesTable: 'e2',

    // Respuestas (/coordinador/respuestas)
    respuestasHeader: 'resp0',
    respuestasControls: 'resp1',
    respuestasContent: 'resp2',

    // Desempeño (/coordinador/desempeno)
    desempenoHeader: 'p0',
    /** @deprecated Prefer anclas por CoordCard */
    desempenoContent: 'p1',
    desempenoExecutive: 'p-executive',
    desempenoLevels: 'p-levels',
    desempenoHistogram: 'p-histogram',
    desempenoStrengths: 'p-strengths',
    desempenoWeaknesses: 'p-weaknesses',
    desempenoRecommendations: 'p-recommendations',
    desempenoPlan: 'p-plan',
    desempenoCurricular: 'p-curricular',
    desempenoCurricularDonut: 'p-curricular-donut',
    desempenoCurricularBrechas: 'p-curricular-brechas',

    // Fallback
    fallback: 'g0',
} as const;

export type TourAnchorId = (typeof TourAnchors)[keyof typeof TourAnchors];
