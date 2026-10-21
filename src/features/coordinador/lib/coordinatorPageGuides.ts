import { routeKeyFromPathname } from '@features/coordinador/lib/coordinatorGuidedTourStorage';

export type PageGuide = { title: string; script: string };

const PAGE_GUIDES_BY_ROUTE: Record<string, PageGuide> = {
    dashboard: {
        title: 'Dashboard Principal',
        script: `Bienvenido al Dashboard Principal del coordinador.
En esta página puedes ver el resumen general del rendimiento de tu institución en el simulacro seleccionado.
Arriba encontrarás el puntaje promedio global de tus estudiantes sobre 500, junto con la tasa de aprobación y la mediana.
A la derecha verás la distribución por niveles: cuántos estudiantes están en nivel Superior, Alto, Medio y Bajo.
Más abajo hay indicadores estadísticos clave como el máximo, mínimo, percentiles 90 y 75, desviación estándar y rango intercuartil.
El gráfico de radar te muestra el rendimiento comparativo de tus estudiantes en las 5 competencias.
Puedes cambiar el simulacro con el selector en la cabecera del reporte.`,
    },
    desempeno: {
        title: 'Desempeño ejecutivo',
        script: `Esta es la vista de Desempeño.
Aquí encuentras el análisis ejecutivo: niveles globales, fortalezas y brechas por área, recomendaciones y el dashboard ICFES.
Usa el tour interactivo desde la burbuja de ayuda para recorrer cada bloque con spotlight.
El resumen ejecutivo condensa los hallazgos clave para reuniones con directivos.`,
    },
    estudiantes: {
        title: 'Listado de Estudiantes',
        script: `Esta es la sección de Estudiantes.
Aquí puedes ver la lista completa de todos los estudiantes evaluados en el simulacro actual.
Puedes buscar por nombre o número de identificación.
Cada fila muestra el puntaje global y un desglose por materia.
Puedes hacer clic en cualquier estudiante para ver su reporte detallado individual.`,
    },
    respuestas: {
        title: 'Respuestas del simulacro',
        script: `Esta sección muestra las respuestas item a item del simulacro seleccionado.
Filtra por materia, busca estudiantes y alterna entre heatmap y tarjetas por alumno.
Haz clic en un estudiante para abrir el detalle pregunta a pregunta.`,
    },
    analisis: {
        title: 'Análisis de Preguntas',
        script: `Esta es la sección de Análisis de Preguntas Críticas.
Aquí puedes identificar las preguntas donde tus estudiantes tuvieron mayor dificultad.
Las preguntas se ordenan por porcentaje de acierto, de menor a mayor.
Puedes filtrar por materia para enfocarte en una competencia específica.`,
    },
    comparativa: {
        title: 'Benchmark Institucional',
        script: `Bienvenido al Benchmark Institucional.
Esta página compara el rendimiento de tu institución contra otras que usan Seamos Genios.
Verás tu posición en el ranking, percentil nacional y puntajes por materia.
Puedes alternar entre barras y mapa de calor para explorar los datos.`,
    },
    historico: {
        title: 'Evolución Histórica',
        script: `Esta es la sección de Tendencias Históricas.
Aquí puedes ver cómo ha evolucionado el rendimiento de tu institución a lo largo de múltiples simulacros.
Las barras muestran el puntaje promedio de cada simulacro.
La tendencia por competencia indica qué materias mejoran o retroceden.`,
    },
    pensum: {
        title: 'Pensum curricular',
        script: `Esta es la vista de Pensum.
Muestra el diagnóstico curricular por temas del simulacro, cuando el simulacro incluye metadata de temarios.
Úsala para planificar refuerzos por unidad temática.`,
    },
};

/** Guía narrada por ruta del panel coordinador. */
export function resolvePageGuide(pathname: string): PageGuide {
    const key = routeKeyFromPathname(pathname);
    return PAGE_GUIDES_BY_ROUTE[key] ?? PAGE_GUIDES_BY_ROUTE.dashboard;
}

export function stepToSpeechText(step: {
    title: string;
    description: string;
    tip?: string;
}): string {
    const parts = [step.title, step.description];
    if (step.tip) parts.push(`Consejo: ${step.tip}`);
    return parts.join('. ').replace(/\s+/g, ' ').trim();
}
