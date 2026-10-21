import { TourAnchors, type TourAnchorId } from '@features/coordinador/lib/tourAnchors';

import { routeKeyFromPathname } from '@features/coordinador/lib/coordinatorGuidedTourStorage';

import { switchDashboardTab } from '@features/coordinador/lib/dashboardTourBridge';
import { isMobileViewport, waitForTourAnchor } from '@features/coordinador/lib/tourDomUtils';
import { tourSwitchDashboardTab } from '@features/coordinador/lib/tourBridge';

export type TourTooltipPosition = 'top' | 'bottom' | 'center';

export type GuidedTourAdvanceOn = 'next' | 'targetClick' | 'customEvent' | 'modalOpen';

export type GuidedTourStep = {
    id: string;
    anchor?: TourAnchorId;
    resolveAnchor?: () => TourAnchorId | undefined;
    title: string;
    description: string;
    tip?: string;
    actionLabel?: string;
    position: TourTooltipPosition;
    highlight?: boolean;
    mode?: 'info' | 'action';
    advanceOn?: GuidedTourAdvanceOn;
    eventName?: string;
    allowTargetInteraction?: boolean;
    onAutoAction?: () => boolean | void | Promise<boolean | void>;
    /** Delay before auto-advancing info steps (ms). Default 2600. */
    autoAdvanceMs?: number;
    /** Delay before firing onAutoAction on action steps (ms). Default 1200. */
    autoActionDelayMs?: number;
    skipIfAnchorMissing?: boolean;
    onBeforeShow?: () => void | Promise<void>;
};

function tab(id: string): () => Promise<void> {
    return async () => {
        await tourSwitchDashboardTab(id);
        await waitForTourAnchor(TourAnchors.dashboardTabs, 1200);
    };
}

function shellSteps(): GuidedTourStep[] {
    return [
        {
            id: 'nav-sidebar',
            resolveAnchor: () =>
                isMobileViewport() ? TourAnchors.navMobile : TourAnchors.navSidebar,
            title: 'Menú principal',
            description:
                'Cada módulo responde una pregunta distinta: panorama (Dashboard), ruta curricular (Pensum), niveles, listado de alumnos, ítems difíciles, benchmark y evolución.',
            tip: 'En móvil, el menú está abajo. En escritorio, a la izquierda.',
            position: 'bottom',
            highlight: true,
        },
        {
            id: 'report-toolbar',
            anchor: TourAnchors.reportToolbar,
            title: 'Simulacro e institución',
            description:
                'Todos los gráficos y tablas usan el simulacro y la sede que elijas aquí. El Excel exporta exactamente ese contexto.',
            tip: 'Cambia de simulacro antes de comparar cohortes en reuniones de seguimiento.',
            position: 'bottom',
            highlight: true,
            skipIfAnchorMissing: true,
        },
        {
            id: 'shell-help-bubble',
            anchor: TourAnchors.helpBubble,
            title: 'Ayuda siempre disponible',
            description:
                'La burbuja (?) reabre el tour de esta sección, el recorrido completo del panel o el resumen narrado.',
            position: 'top',
            highlight: true,
        },
    ];
}



function dashboardSteps(): GuidedTourStep[] {
    return [

        ...shellSteps(),

        {

            id: 'd-welcome',

            title: 'Tu informe en un recorrido',

            description:

                'Verás el panorama del grupo, las pestañas de seguimiento (ranking, ítems críticos, alertas y benchmark) y cómo leer cada bloque.',

            tip: 'Usa las flechas del teclado ← → o el botón Siguiente para avanzar.',

            position: 'center',

            highlight: false,

        },

        {

            id: 'd-tabs',

            anchor: TourAnchors.dashboardTabs,

            title: 'Cinco vistas del informe',

            description:

                'Principal · Ranking · Preguntas difíciles · Alertas · Benchmark.\nEl tour cambiará de pestaña automáticamente.',

            tip: 'Empieza en Principal; luego revisa Alertas para casos bajo 300 pts.',

            position: 'bottom',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-hero-score',

            anchor: TourAnchors.dashboardHeroScore,

            title: 'Puntaje global del grupo',

            description: 'Promedio sobre 500 y mediana. Son la foto rápida del desempeño colectivo.',

            tip: 'Contrasta promedio vs mediana: si la mediana es menor, hay cola baja de rendimiento.',

            position: 'bottom',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-hero-levels',

            anchor: TourAnchors.dashboardHeroLevels,

            title: 'Barra de niveles ICFES',

            description: 'Proporción visual Superior, Alto, Medio y Bajo según el puntaje global.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-hero-approval',

            anchor: TourAnchors.dashboardHeroApproval,

            title: 'Tasa de aprobación',

            description: 'Porcentaje con puntaje global ≥ 300 y cuántos alumnos representa.',

            tip: 'Útil para metas institucionales y reportes a rectoría.',

            position: 'bottom',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-kpis-intro',

            anchor: TourAnchors.dashboardKpisIntro,

            title: 'Estadística descriptiva — vista general',

            description:

                'Bloque con tres tarjetas (tamaño/extremos, percentiles, dispersión) más resumen numérico abajo.',

            tip: 'El tour recorrerá cada tarjeta por separado.',

            position: 'bottom',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-kpis-g1',

            anchor: TourAnchors.dashboardKpisG1Chart,

            title: 'Grupo 1 · Tamaño y extremos',

            description:

                'N del grupo, puntaje mínimo/máximo e histograma compacto del puntaje global.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-kpis-g2',

            anchor: TourAnchors.dashboardKpisG2Chart,

            title: 'Grupo 2 · Percentiles',

            description: 'P10, P25, P50, P75 y P90 en escala 0–500. Marcan la posición relativa del grupo.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-kpis-g3',

            anchor: TourAnchors.dashboardKpisG3Chart,

            title: 'Grupo 3 · Dispersión',

            description: 'Desviación estándar, rango intercuartílico (IQR) y curva de campana centrada en el promedio.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-kpis-summary',

            anchor: TourAnchors.dashboardKpisSummary,

            title: 'Resumen central',

            description: 'Promedio, mediana, sesgo de Pearson y coeficiente de variación del puntaje global.',

            position: 'bottom',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-radar',

            anchor: TourAnchors.dashboardRadarChart,

            title: 'Análisis por áreas ICFES',

            description: 'Comparativo institución vs nacional y dispersión por nivel en las cinco áreas. Abajo: mejor área y área a reforzar.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-distribution',

            anchor: TourAnchors.dashboardDistribution,

            title: 'Distribución de puntajes',

            description: 'Cuántos estudiantes caen en cada rango. Pasa el cursor sobre un punto para el detalle.',

            position: 'bottom',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-areas',

            anchor: TourAnchors.dashboardSubjectStrip,

            title: 'Barras por materia',

            description: 'Promedio por área con avance respecto a 100 puntos máximos por competencia.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-followup-top',

            anchor: TourAnchors.dashboardFollowupTop,

            title: 'Top 5 del grupo',

            description: 'Mejores puntajes con desglose MAT · LEC · SOC · CIEN · ING. Clic en fila para ficha del estudiante.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-followup-risk',

            anchor: TourAnchors.dashboardFollowupRisk,

            title: 'Estudiantes en riesgo',

            description: 'Bajo 300 pts con área débil resaltada. Ideal para tutorías y plan de nivelación.',

            tip: 'Abre el detalle del alumno y cruza con Pensum o Análisis por pregunta.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('dashboard'),

        },

        {

            id: 'd-gap-analysis',

            anchor: TourAnchors.dashboardGapAnalysis,

            title: 'Brechas por estudiante',

            description:

                'Diferencia entre la mejor y la peor materia de cada evaluado. Brechas altas indican desbalance entre competencias.',

            position: 'top',

            highlight: true,

            onBeforeShow: () => tab('dashboard')(),

        },

        {
            id: 'd-insights',
            anchor: TourAnchors.dashboardInsights,
            title: 'Insights ejecutivos',
            description:
                'Resumen automático con fortalezas, riesgos y recomendaciones para comités académicos.',
            position: 'top',
            highlight: true,
            onBeforeShow: () => tab('dashboard')(),
        },

        {
            id: 'd-student-followup',
            anchor: TourAnchors.dashboardFollowupRow,
            title: 'Ficha de estudiante',
            description:
                'Clic en cualquier fila del Top 5 o en riesgo abre el perfil individual con puntajes, materias y comparación. El tour no abre modales para mantener el señalamiento estable.',
            tip: 'También puedes abrir perfiles desde Ranking o Estudiantes.',
            position: 'bottom',
            highlight: true,
            onBeforeShow: () => tab('dashboard')(),
        },

        {

            id: 'd-ranking-search',

            anchor: TourAnchors.dashboardRankingSearch,

            title: 'Búsqueda en ranking',

            description: 'Filtra por nombre o documento dentro del listado completo del grupo.',

            position: 'bottom',

            highlight: true,

            onBeforeShow: tab('ranking'),

        },

        {

            id: 'd-ranking-table',

            anchor: TourAnchors.dashboardRankingTable,

            title: 'Tabla de ranking',

            description: 'Lista ordenada con puntaje global y desglose por materia. Clic en fila para abrir detalle.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('ranking'),

        },

        {

            id: 'd-analisis-kpis',

            anchor: TourAnchors.dashboardAnalisisKpis,

            title: 'KPIs de ítems críticos',

            description: 'Total de ítems críticos, urgentes (>70% fallo), fallo promedio y áreas afectadas.',

            position: 'bottom',

            highlight: true,

            onBeforeShow: tab('analisis'),

        },

        {

            id: 'd-analisis-filters',

            anchor: TourAnchors.dashboardAnalisisFilters,

            title: 'Filtros de preguntas',

            description: 'Acota por área, severidad, sesión y orden de la lista de ítems difíciles.',

            position: 'bottom',

            highlight: true,

            onBeforeShow: tab('analisis'),

        },

        {

            id: 'd-analisis-table',

            anchor: TourAnchors.dashboardAnalisisTable,

            title: 'Tabla de preguntas críticas',

            description:

                'Cada fila muestra tasa de fallo y distribución A–D. Expande para ver estudiantes por opción marcada.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('analisis'),

        },

        {

            id: 'd-alertas-summary',

            anchor: TourAnchors.dashboardAlertasSummary,

            title: 'Resumen de alertas',

            description: 'Conteo por severidad: crítico (<200), alto, moderado (área débil) y monitoreo (250–300).',

            position: 'bottom',

            highlight: true,

            onBeforeShow: tab('alertas'),

        },

        {

            id: 'd-alertas-table',

            anchor: TourAnchors.dashboardAlertasTable,

            title: 'Detalle de alertas',

            description: 'Estudiantes en riesgo con puntaje, área débil, brecha y recomendación pedagógica.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('alertas'),

        },

        {

            id: 'd-benchmark-hero',

            anchor: TourAnchors.dashboardBenchmarkGauge,

            title: 'Percentil nacional global',

            description: 'Tu colegio frente a ~9.880 instituciones ICFES Saber 11°. El arco indica cuántos quedan detrás.',

            position: 'bottom',

            highlight: true,

            onBeforeShow: tab('benchmark'),

        },

        {

            id: 'd-benchmark-areas',

            anchor: TourAnchors.dashboardBenchmarkAreaCards,

            title: 'Percentiles por materia',

            description: 'Tarjetas con puntaje y barra de percentil en Global y cada competencia.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('benchmark'),

        },

        {

            id: 'd-benchmark-context',

            anchor: TourAnchors.dashboardBenchmarkContext,

            title: 'Contexto benchmark',

            description: 'Ranking simulacro, departamento y comparación con otras sedes del ecosistema SG.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('benchmark'),

        },

        {

            id: 'd-benchmark-bars',

            anchor: TourAnchors.dashboardBenchmarkBars,

            title: 'Barras vs referente nacional',

            description: 'Por competencia: barra institucional vs promedio ICFES y delta en puntos.',

            position: 'top',

            highlight: true,

            onBeforeShow: tab('benchmark'),

        },

    ];

}



const ROUTE_STEPS: Record<string, () => GuidedTourStep[]> = {

    dashboard: dashboardSteps,

    pensum: () => [

        ...shellSteps(),

        {

            id: 'r-welcome',

            title: 'Pensum y cobertura',

            description: 'Vista curricular: qué temas del pensum se evalúan y cómo se relacionan con el simulacro.',

            position: 'center',

        },

        {

            id: 'r-header',

            anchor: TourAnchors.resumenHeader,

            title: 'Resumen del pensum',

            description: 'Contexto del simulacro activo, institución y exportación Excel del plan curricular.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'r-alert',

            anchor: TourAnchors.pensumAlert,

            title: 'Alerta institucional',

            description: 'Headline ejecutivo con promedio, aprobación y estudiantes en riesgo del simulacro.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'r-indicators',

            anchor: TourAnchors.pensumIndicators,

            title: 'Indicadores de error',

            description: 'Glosario de tasa de error, puntos potenciales y discriminación usados en el pensum.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'r-plan',

            anchor: TourAnchors.pensumPlan,

            title: 'Plan pregunta por pregunta',

            description: 'Qué estudiar, en qué orden y por qué — ítems con ≥50% de fallo del grupo.',

            tip: 'Exporta el Excel cuando el simulacro tenga temario cargado (p. ej. SG11-17).',

            position: 'top',

            highlight: true,

        },

        {

            id: 'r-filters',

            anchor: TourAnchors.pensumFilters,

            title: 'Filtros del plan',

            description: 'Filtra por urgencia (crítico, alto, moderado) y por área para priorizar la intervención.',

            position: 'bottom',

            highlight: true,

            skipIfAnchorMissing: true,

        },

        {

            id: 'r-strengths',

            anchor: TourAnchors.pensumStrengths,

            title: 'Fortalezas institucionales',

            description: 'Áreas donde el grupo destaca. Úsalas como ancla para replicar buenas prácticas.',

            position: 'top',

            highlight: true,

            skipIfAnchorMissing: true,

        },

        {

            id: 'r-plan-accordion',

            anchor: TourAnchors.pensumPlanAccordion,

            title: 'Plan por área (acordeón)',

            description: 'Expande cada materia para ver pasos correctivos, ítems vinculados y guía de coordinación.',

            position: 'top',

            highlight: true,

            skipIfAnchorMissing: true,

        },

        {

            id: 'r-banco',

            anchor: TourAnchors.pensumBanco,

            title: 'Banco de preguntas difíciles',

            description: 'Listado de ítems con ≥50% de error. Filtra por materia para sesiones de nivelación.',

            position: 'top',

            highlight: true,

            skipIfAnchorMissing: true,

        },

        {

            id: 'r-areas',

            anchor: TourAnchors.pensumAreas,

            title: 'Tarjetas por materia',

            description: 'Acceso rápido al detalle curricular de Matemáticas, Lectura, Sociales, Ciencias e Inglés.',

            position: 'top',

            highlight: true,

        },

    ],

    desempeno: () => [

        ...shellSteps(),

        {

            id: 'p-welcome',

            title: 'Desempeño institucional',

            description: 'Análisis ejecutivo por bloques: resumen, niveles, histograma, fortalezas y plan de acción.',

            position: 'center',

        },

        {

            id: 'p-header',

            anchor: TourAnchors.desempenoHeader,

            title: 'Vista de desempeño',

            description: 'Panorama de cómo se distribuye el grupo en los niveles ICFES.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'p-executive',

            anchor: TourAnchors.desempenoExecutive,

            title: 'Resumen ejecutivo',

            description: 'KPIs clave: promedio, mediana, aprobación, riesgo, σ, CV y total evaluados.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'p-levels',

            anchor: TourAnchors.desempenoLevels,

            title: 'Distribución por niveles',

            description: 'Proporción del grupo en Superior, Alto, Medio y Bajo con barras de progreso.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'p-histogram',

            anchor: TourAnchors.desempenoHistogram,

            title: 'Histograma global',

            description: 'Concentración de estudiantes por rango de puntaje. El rango «pico» marca la moda del grupo.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'p-strengths',

            anchor: TourAnchors.desempenoStrengths,

            title: 'Fortalezas',

            description: 'Áreas que superan el referente nacional o, si no hay ninguna, las mejores dentro de la institución.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'p-weaknesses',

            anchor: TourAnchors.desempenoWeaknesses,

            title: 'Áreas a priorizar',

            description: 'Brechas frente al referente nacional ordenadas por urgencia pedagógica.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'p-recommendations',

            anchor: TourAnchors.desempenoRecommendations,

            title: 'Recomendaciones',

            description: 'Acciones automáticas derivadas del análisis del simulacro para comités académicos.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'p-plan',

            anchor: TourAnchors.desempenoPlan,

            title: 'Plan de estudio por área',

            description: 'Pasos concretos por competencia: ítems críticos, acciones y hitos de seguimiento.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'p-curricular',

            anchor: TourAnchors.desempenoCurricular,

            title: 'Dashboard curricular ICFES',

            description: 'Mapa de cobertura curricular y alineación pensum–simulacro cuando hay temario disponible.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'p-curricular-donut',

            anchor: TourAnchors.desempenoCurricularDonut,

            title: 'Distribución por niveles',

            description: 'Donut de niveles ICFES por área. Clic en segmento filtra brechas hacia el nivel superior.',

            position: 'top',

            highlight: true,

            skipIfAnchorMissing: true,

        },

        {

            id: 'p-curricular-brechas',

            anchor: TourAnchors.desempenoCurricularBrechas,

            title: 'Matriz de brechas',

            description: 'Competencias fallidas inferidas desde el nivel actual hacia niveles superiores del marco ICFES.',

            position: 'top',

            highlight: true,

            skipIfAnchorMissing: true,

        },

    ],

    estudiantes: () => [

        ...shellSteps(),

        {

            id: 'e-welcome',

            title: 'Explorador de estudiantes',

            description: 'Busca, filtra y abre el reporte individual de cada evaluado.',

            position: 'center',

        },

        {

            id: 'e-header',

            anchor: TourAnchors.estudiantesHeader,

            title: 'Listado institucional',

            description: 'Total de estudiantes evaluados en el simulacro actual.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'e-controls',

            anchor: TourAnchors.estudiantesControls,

            title: 'Búsqueda y filtros',

            description: 'Localiza por nombre o documento; ordena y compara selección.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'e-table',

            anchor: TourAnchors.estudiantesTable,

            title: 'Tabla de resultados',

            description: 'Puntaje global y desglose por materia. Clic en fila para abrir detalle.',

            position: 'top',

            highlight: true,

        },

    ],

    respuestas: () => [

        ...shellSteps(),

        {

            id: 'r-welcome',

            title: 'Respuestas del simulacro',

            description: 'Revisa ítem a ítem las marcas de cada estudiante del simulacro activo.',

            position: 'center',

        },

        {

            id: 'r-header',

            anchor: TourAnchors.respuestasHeader,

            title: 'Contexto del simulacro',

            description: 'Institución, conteo de evaluados y simulacro fuente de los datos.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'r-controls',

            anchor: TourAnchors.respuestasControls,

            title: 'Selector de área',

            description: 'Burbuja flotante con las 5 áreas ICFES; visible mientras recorres el bloque de claves.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'r-content',

            anchor: TourAnchors.respuestasContent,

            title: 'Mapa de respuestas',

            description: 'Clic en estudiante para abrir el detalle pregunta a pregunta.',

            position: 'top',

            highlight: true,

        },

    ],

    analisis: () => [

        ...shellSteps(),

        {

            id: 'a-welcome',

            title: 'Análisis por pregunta',

            description: 'Identifica ítems con bajo porcentaje de acierto para planear clase.',

            position: 'center',

        },

        {

            id: 'a-header',

            anchor: TourAnchors.analisisHeader,

            title: 'Panel de análisis',

            description: 'Resumen del simulacro y selector de simulacro alternativo.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'a-tabs',

            anchor: TourAnchors.analisisTabs,

            title: 'Selector de materias',

            description: 'Cambia de competencia. Cada tarjeta muestra promedio, % acierto e ítems críticos.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'a-kpis',

            anchor: TourAnchors.analisisKpis,

            title: 'KPIs de la materia',

            description:

                'Donut de preguntas (ok/precaución/críticas), acierto promedio, peor ítem e insight automático. Clic en un KPI abre el panel lateral de ítems (fuera del tour).',

            position: 'top',

            highlight: true,

        },

        {

            id: 'a-insights',

            anchor: TourAnchors.analisisInsights,

            title: 'Secciones avanzadas',

            description:

                'Estadísticas por competencia, ranking interno, alertas, correlaciones, perfil de niveles y brechas — desplegables.',

            position: 'top',

            highlight: true,

        },

    ],

    comparativa: () => [

        ...shellSteps(),

        {

            id: 'c-welcome',

            title: 'Benchmark institucional',

            description: 'Compara tu sede con otras instituciones del ecosistema Seamos Genios.',

            position: 'center',

        },

        {

            id: 'c-header',

            anchor: TourAnchors.comparativaHeader,

            title: 'Posición y percentiles',

            description: 'Ranking nacional y KPIs por materia frente al promedio.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'c-filters',

            anchor: TourAnchors.comparativaFilters,

            title: 'Filtros de comparación',

            description: 'Enfoca una materia o cambia entre vista de barras y mapa de calor.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'c-kpis',

            anchor: TourAnchors.comparativaKpis,

            title: 'Indicadores clave',

            description: 'Ranking simulacro, percentil nacional y delta por materia frente al ICFES.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'c-context',

            anchor: TourAnchors.comparativaContext,

            title: 'Contexto benchmark',

            description: 'Panel compacto con posición departamental y referentes del simulacro.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'c-lollipop',

            anchor: TourAnchors.comparativaLollipop,

            title: 'Evolución entre instituciones',

            description:

                'Elige colegios y simulacros para comparar el promedio global. La línea punteada es el referente nacional ICFES.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'c-subject-chart',

            anchor: TourAnchors.comparativaSubjectChart,

            title: 'Barras por competencia',

            description: 'Todas las materias lado a lado por institución con referente nacional punteado.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'c-radar',

            anchor: TourAnchors.comparativaRadar,

            title: 'Perfil radar',

            description: 'Polígonos de rendimiento por competencia. Tu sede (★) vs otras instituciones.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'c-bullets',

            anchor: TourAnchors.comparativaBullets,

            title: 'Posición nacional por área',

            description: 'Bullet charts: puntaje vs marcador nacional y percentil estimado por materia.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'c-approval',

            anchor: TourAnchors.comparativaApproval,

            title: 'Tasa de aprobación',

            description: 'Porcentaje de estudiantes ≥300 pts por institución, ordenado de mayor a menor.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'c-heatmap',

            anchor: TourAnchors.comparativaHeatmap,

            title: 'Mapa de calor',

            description: 'Tabla comparativa completa por materia y global. Colores más intensos = mejor puntaje.',

            position: 'top',

            highlight: true,

        },

    ],

    historico: () => [

        ...shellSteps(),

        {

            id: 'h-welcome',

            title: 'Evolución histórica',

            description: 'Sigue la tendencia del grupo a lo largo de varios simulacros.',

            position: 'center',

        },

        {

            id: 'h-header',

            anchor: TourAnchors.historicoHeader,

            title: 'Tendencias',

            description: 'Contexto temporal de la institución.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'h-controls',

            anchor: TourAnchors.historicoControls,

            title: 'Controles de métrica',

            description: 'Cambia entre promedio, mediana, extremos o tasa de aprobación; selecciona simulacros.',

            position: 'bottom',

            highlight: true,

        },

        {

            id: 'h-kpis',

            anchor: TourAnchors.historicoKpis,

            title: 'KPIs por simulacro',

            description: 'Indicadores clave consolidados en el tiempo.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'h-chart-evolution',

            anchor: TourAnchors.historicoChartEvolution,

            title: 'Evolución del puntaje',

            description: 'Barras por simulacro con delta vs anterior y resaltado del simulacro activo.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'h-chart-subjects',

            anchor: TourAnchors.historicoChartSubjects,

            title: 'Tendencia por competencia',

            description: 'Mini sparklines y delta total por materia entre el primer y último simulacro seleccionado.',

            position: 'top',

            highlight: true,

        },

        {

            id: 'h-chart-levels',

            anchor: TourAnchors.historicoChartLevels,

            title: 'Evolución de niveles',

            description: 'Porcentaje del grupo en Superior, Alto, Medio y Bajo en cada fecha de simulacro.',

            position: 'top',

            highlight: true,

        },

    ],

};



export function getGuidedTourStepsForPath(pathname: string): GuidedTourStep[] {

    const key = routeKeyFromPathname(pathname);

    const factory = ROUTE_STEPS[key];

    if (factory) return factory();

    return [

        ...shellSteps(),

        {

            id: 'g0',

            anchor: TourAnchors.fallback,

            title: 'Panel coordinador',

            description: 'Usa el menú lateral para explorar cada módulo del reporte.',

            position: 'center',

        },

    ];

}



export function stepExistsOnPath(pathname: string, stepId: string): boolean {

    return getGuidedTourStepsForPath(pathname).some(s => s.id === stepId);

}

export function resolveStepAnchor(step: GuidedTourStep): TourAnchorId | undefined {
    return step.resolveAnchor?.() ?? step.anchor;
}


