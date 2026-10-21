import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Estudiante } from '@shared/types';
import type {
    InstitutionMetrics,
    AlertaEstudiante,
    QuestionStat,
} from '@features/coordinador/hooks/useCoordinadorData';
import { countEvaluadosInstitucion } from '@features/coordinador/lib/coordinatorCounts';
import type { ExecutiveSummary } from '@features/coordinador/lib/executiveModel';
import {
    SG_PRIMARY,
    SG_PRIMARY_LIGHT,
    SG_TEXT,
    SG_MUTED,
    SG_DANGER,
    SG_WARN,
    SG_SUCCESS,
    SG_HEADER_BG,
    setBrandTitle,
    sectionHeader,
    tableHeader,
    dataCell,
    buildReportMeta,
    barVisualization,
    BRAND_CONTENT_START_ROW,
    applyDataBar,
    applyAutoFilter,
    applyTableFreeze,
    applyColorScale,
    questionLabel,
    tabColorForGroup,
    NUM_FMT,
    methodologyNote,
    mergeCellsResolved,
    scoreCell,
} from '@features/coordinador/lib/coordinatorExcelFormat';
import {
    displayText,
    safePct,
    cvInterpretation,
    sampleSizeWarning,
    NOT_APPLICABLE,
} from '@features/coordinador/lib/coordinatorExcelValues';
import type { SimulacionEstadisticas } from '@features/simulacro/lib/firestoreService';
import {
    sheetPortada,
    sheetResumenEjecutivo,
    sheetPotencialMejora,
} from '@features/coordinador/lib/coordinatorExcelSheets';
import { sheetAnalisisItemsUnificado } from '@features/coordinador/lib/coordinatorExcelItemAnalysis';
import {
    hydrateStudentsForQuestionAnalysis,
    resolveQuestionAnalysisForExport,
} from '@features/coordinador/lib/questionAnalysisResolver';
import { appendStudentFichas } from '@features/coordinador/lib/coordinatorExcelStudentSheets';
import { sheetAutomatizacion } from '@features/coordinador/lib/coordinatorExcelAutomation';

export {
    SG_PRIMARY,
    SG_PRIMARY_LIGHT,
    SG_TEXT,
    SG_MUTED,
    SG_DANGER,
    SG_WARN,
    SG_SUCCESS,
    SG_HEADER_BG,
    setBrandTitle,
    sectionHeader,
    tableHeader,
    dataCell,
    buildReportMeta,
    barVisualization,
} from '@features/coordinador/lib/coordinatorExcelFormat';
import { appendExtendedCoordinatorSheets, shouldIncludeAutomationSheet } from '@features/coordinador/lib/coordinatorExcelExtended';
import { wireCoordinatorExcelNavigation } from '@features/coordinador/lib/coordinatorExcelNav';
import { finalizeWorkbookLayout } from '@features/coordinador/lib/coordinatorExcelLayout';

/**
 * Reporte Excel específico para el coordinador.
 *
 * Más detallado que el resumen visual del panel pero más conciso que el
 * `generateExcelReport` del admin. Usa los datos ya filtrados por institución
 * y simulacro que entrega `useCoordinadorData`.
 *
 * Hojas (alineado al entregable legacy `Reporte_Coordinador_*`):
 *   1. Dashboard Ejecutivo — KPIs, barras por área, mapa de calor
 *   2. Estadísticas Avanzadas
 *   3. Ranking Estudiantes — todos los registrados + medallas top 3
 *   4. Benchmarking_Institucional (si hay varias instituciones)
 *   5. Análisis Preguntas Críticas (>40% error)
 *   6. KPIs y Percentiles · Rendimiento · Insights · Alertas · Ítems · Notas
 *   7. BASE_DATOS — filas planas para auditoría
 */

const AREA_EXPORT_COLUMNS: { key: string; header: string }[] = [
    { key: 'matemáticas', header: 'MAT' },
    { key: 'lectura crítica', header: 'LEC' },
    { key: 'sociales y ciudadanas', header: 'SOC' },
    { key: 'ciencias naturales', header: 'CIE' },
    { key: 'inglés', header: 'ING' },
];

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Convención de nombre alineada a entregables tipo:
 * `Reporte_Coordinador_SG11-17_TODAS_LAS_INSTITUCIONES_2026-05-07.xlsx`
 * (simulacro sin espacios, alcance en MAYÚSCULAS con guiones bajos, fecha local yyyy-mm-dd).
 */
export function buildCoordinatorReportFilename(
    simulationId: string,
    institutionDisplayName: string,
    date: Date = new Date()
): string {
    const sim = String(simulationId || '')
        .replace(/\s+/g, '')
        .trim() || 'SIM';
    const scope =
        String(institutionDisplayName || 'Institucion')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toUpperCase()
            .slice(0, 80) || 'INSTITUCION';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `Reporte_Coordinador_${sim}_${scope}_${y}-${m}-${d}.xlsx`;
}

function nivelByGlobal(p: number): { label: string; color: string } {
    if (p >= 400) return { label: 'Superior', color: SG_SUCCESS };
    if (p >= 325) return { label: 'Alto', color: 'FF2563EB' };
    if (p >= 250) return { label: 'Medio', color: SG_WARN };
    return { label: 'Bajo', color: SG_DANGER };
}

function areaScore(est: Estudiante, materiaKey: string): number {
    const raw = est.puntajes?.[materiaKey];
    if (raw == null) return 0;
    if (typeof raw === 'number') return Math.round(raw);
    const p = Number((raw as { puntaje?: number }).puntaje);
    return Number.isFinite(p) ? Math.round(p) : 0;
}

function difficultyFromFailRate(rate: number): { label: string; color: string } {
    const pct = rate * 100;
    if (pct >= 80) return { label: 'Muy difícil', color: SG_DANGER };
    if (pct >= 50) return { label: 'Difícil', color: SG_WARN };
    if (pct >= 20) return { label: 'Media', color: 'FF2563EB' };
    if (pct > 0) return { label: 'Fácil', color: SG_SUCCESS };
    return { label: 'Muy fácil', color: SG_SUCCESS };
}

function sessionFlags(est: Estudiante): { s1: string; s2: string; estado: string } {
    const ses = (est as Estudiante & { secciones_completadas?: string[] }).secciones_completadas
        || (est as Estudiante & { sesiones?: string[] }).sesiones
        || [];
    const norm = ses.map(s => String(s).toUpperCase());
    const s1 = norm.some(s => s === 'S1' || s.includes('1')) ? 'Sí' : 'No';
    const s2 = norm.some(s => s === 'S2' || s.includes('2')) ? 'Sí' : 'No';
    let estado = 'Incompleto';
    if (s1 === 'Sí' && s2 === 'Sí') estado = 'Completo';
    else if (s1 === 'Sí' || s2 === 'Sí') estado = 'Parcial';
    return { s1, s2, estado };
}

function sortStudentsForExport(students: Estudiante[]): Estudiante[] {
    const withScore = students
        .filter(s => (Number(s.puntaje_global) || 0) > 0)
        .sort((a, b) => (Number(b.puntaje_global) || 0) - (Number(a.puntaje_global) || 0));
    const without = students
        .filter(s => !(Number(s.puntaje_global) || 0))
        .sort((a, b) =>
            `${a.informacion_personal?.apellidos || ''} ${a.informacion_personal?.nombres || ''}`.localeCompare(
                `${b.informacion_personal?.apellidos || ''} ${b.informacion_personal?.nombres || ''}`,
                'es'
            )
        );
    return [...withScore, ...without];
}

function medalForRank(rank: number, globalScore: number): string {
    if (globalScore <= 0) return '';
    if (rank === 1) return 'ORO';
    if (rank === 2) return 'PLATA';
    if (rank === 3) return 'BRONCE';
    return '';
}

function strongestDistractor(q: QuestionStat): string {
    const correct = String(q.correct || '?')
        .trim()
        .toUpperCase()
        .slice(0, 1);
    let best = NOT_APPLICABLE;
    let bestPct = 0;
    OPTION_LABELS.forEach(opt => {
        if (opt === correct) return;
        const count = q.counts?.[opt] || q.counts?.[opt.toLowerCase()] || 0;
        const pct = q.total > 0 ? count / q.total : 0;
        if (pct > bestPct) {
            bestPct = pct;
            best = `${opt} (${(pct * 100).toFixed(1)}%)`;
        }
    });
    return best;
}

function institutionalPercentile(rank: number, evaluatedCount: number): string {
    if (rank <= 0 || evaluatedCount <= 0) return NOT_APPLICABLE;
    const pct = Math.round(((evaluatedCount - rank + 1) / evaluatedCount) * 100);
    return `P${pct}`;
}

function studentAreaGap(est: Estudiante): string {
    const scores = AREA_EXPORT_COLUMNS.map(({ key }) => areaScore(est, key)).filter(p => p > 0);
    if (scores.length < 2) return NOT_APPLICABLE;
    return String(Math.max(...scores) - Math.min(...scores));
}

export interface CoordinatorExcelArgs {
    summary: ExecutiveSummary;
    inst: InstitutionMetrics;
    ranking: Estudiante[];
    allInstitutions?: InstitutionMetrics[];
    alertas: {
        critico: AlertaEstudiante[];
        alto: AlertaEstudiante[];
        moderado: AlertaEstudiante[];
        monitoreo: AlertaEstudiante[];
    };
    questionAnalysis?: Record<string, QuestionStat[]>;
    aggregateStats?: SimulacionEstadisticas | null;
    simulationId: string;
}

export async function generateCoordinatorExcel(args: CoordinatorExcelArgs): Promise<void> {
    const {
        summary,
        inst,
        ranking,
        allInstitutions = [],
        alertas,
        questionAnalysis: inputQuestionAnalysis = {},
        aggregateStats: inputAggregateStats = null,
        simulationId,
    } = args;
    const registeredCount = inst.students.length;
    const evaluatedCount = countEvaluadosInstitucion(inst.students);
    let exportStudents = sortStudentsForExport(inst.students);
    exportStudents = await hydrateStudentsForQuestionAnalysis(exportStudents, simulationId);

    let aggregateStats = inputAggregateStats;
    if (!aggregateStats) {
        try {
            const { getSimulationEstadisticas } = await import('@features/simulacro/lib/firestoreService');
            aggregateStats = await getSimulationEstadisticas(simulationId);
        } catch {
            aggregateStats = null;
        }
    }

    const questionAnalysis = resolveQuestionAnalysisForExport({
        questionAnalysis: inputQuestionAnalysis,
        aggregateStats,
        students: exportStudents,
        institutionScoped: true,
    });

    const reportMeta = buildReportMeta(inst.name, simulationId, evaluatedCount, registeredCount);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Seamos Genios';
    wb.created = new Date();
    wb.title = `Reporte Coordinador ${inst.name} ${simulationId}`;

    // ─── Portada + Resumen Ejecutivo (consolidado) ─────────────
    sheetPortada(wb, summary, inst, simulationId, evaluatedCount, registeredCount);
    sheetResumenEjecutivo(wb, summary, inst, ranking, reportMeta, evaluatedCount, registeredCount);

    // ─── Hoja 2: Estadísticas Avanzadas ───────────────────────
    {
        const s = wb.addWorksheet('Estadísticas Avanzadas');
        setBrandTitle(s, 'Análisis Estadístico Profundo', reportMeta);
        s.getColumn(1).width = 4;
        s.getColumn(2).width = 22;
        [3, 4, 5, 6, 7, 8, 9, 10].forEach(c => (s.getColumn(c).width = 14));
        sectionHeader(s, BRAND_CONTENT_START_ROW, `Basado en ${evaluatedCount} estudiantes con puntaje > 0 — ${simulationId}`);
        methodologyNote(
            s,
            BRAND_CONTENT_START_ROW + 1,
            `Población: N evaluados=${evaluatedCount}, N registrados=${registeredCount}. Escala por área: 0-100 (ICFES humanizada). CV = (σ/μ)×100.`
        );
        const nWarn = sampleSizeWarning(evaluatedCount);
        if (nWarn) methodologyNote(s, BRAND_CONTENT_START_ROW + 2, nWarn);
        const hdrRow = nWarn ? BRAND_CONTENT_START_ROW + 3 : BRAND_CONTENT_START_ROW + 2;
        tableHeader(
            s,
            hdrRow,
            ['ÁREA (MR ICFES)', 'PROMEDIO', 'MEDIANA', 'MODA', 'MÍN', 'MÁX', 'DESVIACIÓN', 'VAR %', 'CV INTERP.'],
            2
        );
        inst.subjectStats.forEach((area, i) => {
            const r = hdrRow + 1 + i;
            dataCell(s.getCell(r, 2), area.name, { bold: true });
            scoreCell(s.getCell(r, 3), area.avg, 100);
            dataCell(s.getCell(r, 4), area.median, { align: 'right', kind: 'metric' });
            dataCell(s.getCell(r, 5), area.mode, { align: 'right', kind: 'metric' });
            dataCell(s.getCell(r, 6), area.min, { align: 'right', kind: 'metric' });
            dataCell(s.getCell(r, 7), area.max, { align: 'right', kind: 'metric' });
            dataCell(s.getCell(r, 8), area.stdDev, { align: 'right', kind: 'metric' });
            dataCell(s.getCell(r, 9), area.varPct, { align: 'right', kind: 'metric' });
            dataCell(s.getCell(r, 10), cvInterpretation(Number(area.varPct) || 0), { color: SG_MUTED });
        });
        const statsLast = hdrRow + inst.subjectStats.length;
        if (inst.subjectStats.length) {
            applyDataBar(s, `C${hdrRow + 1}:C${statsLast}`, SG_PRIMARY, 1);
        }
    }

    // ─── Hoja 3: Ranking Estudiantes ──────────────────────────
    {
        const s = wb.addWorksheet('Ranking Estudiantes', {
            properties: { tabColor: { argb: tabColorForGroup('estudiantes') } },
        });
        setBrandTitle(s, 'Cuadro de Honor y Ranking', reportMeta);
        const headers = [
            'PUESTO',
            'ESTUDIANTE',
            'INSTITUCIÓN',
            'GLOBAL',
            ...AREA_EXPORT_COLUMNS.map(a => a.header),
            'NIVEL',
            'MEDALLA',
            'SESIONES',
            'PERCENTIL INST.',
            'BRECHA ÁREAS',
        ];
        headers.forEach((_, i) => {
            s.getColumn(i + 1).width = i === 1 ? 24 : i === 2 ? 20 : 10;
        });
        tableHeader(s, 4, headers, 1);
        let honorRank = 0;
        exportStudents.forEach((est, idx) => {
            const r = 5 + idx;
            const score = Number(est.puntaje_global) || 0;
            if (score > 0) honorRank += 1;
            const niv = nivelByGlobal(score);
            const nombre = displayText(
                `${est.informacion_personal?.nombres || ''} ${est.informacion_personal?.apellidos || ''}`.trim()
            );
            let col = 1;
            dataCell(s.getCell(r, col++), score > 0 ? honorRank : idx + 1, { align: 'right' });
            dataCell(s.getCell(r, col++), nombre, {});
            dataCell(s.getCell(r, col++), est.informacion_personal?.institucion, {});
            scoreCell(s.getCell(r, col++), score, 500);
            AREA_EXPORT_COLUMNS.forEach(({ key }) => {
                const p = areaScore(est, key);
                if (p > 0) scoreCell(s.getCell(r, col++), p, 100);
                else dataCell(s.getCell(r, col++), p === 0 ? 0 : NOT_APPLICABLE, { align: 'right', kind: 'metric' });
            });
            dataCell(s.getCell(r, col++), score > 0 ? niv.label : 'Bajo', { align: 'center', color: niv.color });
            dataCell(s.getCell(r, col++), medalForRank(honorRank, score) || NOT_APPLICABLE, { align: 'center' });
            const ses = sessionFlags(est);
            dataCell(s.getCell(r, col++), ses.estado, {
                align: 'center',
                color: ses.estado === 'Completo' ? SG_SUCCESS : ses.estado === 'Parcial' ? SG_WARN : SG_DANGER,
            });
            dataCell(s.getCell(r, col++), institutionalPercentile(honorRank, evaluatedCount), { align: 'right' });
            dataCell(s.getCell(r, col++), studentAreaGap(est), { align: 'right', kind: 'metric' });
        });
        const lastRank = 4 + exportStudents.length;
        if (exportStudents.length) {
            applyDataBar(s, `E5:I${lastRank}`, SG_PRIMARY, 1);
            applyAutoFilter(s, 4, headers.length, lastRank);
        }
        s.views = [{ state: 'frozen', xSplit: 2, ySplit: 4 }];
    }

    sheetPotencialMejora(wb, exportStudents, reportMeta);

    // ─── Hoja 4: Benchmarking institucional ───────────────────
    if (allInstitutions.length > 1) {
        const s = wb.addWorksheet('Benchmarking_Institucional');
        setBrandTitle(s, 'Benchmarking: balance por institución', reportMeta);
        tableHeader(
            s,
            4,
            [
                'INSTITUCIÓN',
                'EVALUADOS',
                'PROM. GLOBAL',
                'VISUALIZACIÓN',
                'MATEMÁTICAS',
                'LECTURA',
                'SOCIALES',
                'CIENCIAS',
                'INGLÉS',
            ],
            1
        );
        [...allInstitutions]
            .sort((a, b) => b.avg - a.avg)
            .forEach((row, i) => {
                const r = 5 + i;
                const evalN = countEvaluadosInstitucion(row.students);
                const areaAvg = (key: string) =>
                    row.subjectStats.find(a => a.key === key)?.avg ?? 0;
                dataCell(s.getCell(r, 1), row.name, { bold: true });
                dataCell(s.getCell(r, 2), evalN, { align: 'right' });
                dataCell(s.getCell(r, 3), row.avg, { align: 'right', bold: true });
                dataCell(s.getCell(r, 4), barVisualization(row.avg / 500), { align: 'left' });
                dataCell(s.getCell(r, 5), areaAvg('matemáticas'), { align: 'right' });
                dataCell(s.getCell(r, 6), areaAvg('lectura crítica'), { align: 'right' });
                dataCell(s.getCell(r, 7), areaAvg('sociales y ciudadanas'), { align: 'right' });
                dataCell(s.getCell(r, 8), areaAvg('ciencias naturales'), { align: 'right' });
                dataCell(s.getCell(r, 9), areaAvg('inglés'), { align: 'right' });
            });
        const benchLast = 4 + allInstitutions.length;
        if (allInstitutions.length) {
            applyDataBar(s, `C5:C${benchLast}`, SG_PRIMARY, 1);
        }
    }

    // ─── Análisis por ítem (críticas + distribución + psicométrico + segmentación) ──
    sheetAnalisisItemsUnificado(wb, questionAnalysis, exportStudents, reportMeta, inst.name);

    // ─── KPIs y Percentiles ───────────────────────────
    {
        const s = wb.addWorksheet('KPIs y Percentiles');
        setBrandTitle(s, 'KPIs y Percentiles', `${inst.name} · ${simulationId}`);

        s.getColumn(1).width = 22;
        s.getColumn(2).width = 14;
        s.getColumn(3).width = 22;
        s.getColumn(4).width = 14;

        sectionHeader(s, BRAND_CONTENT_START_ROW, 'Métricas estadísticas (puntaje global 0-500)');
        methodologyNote(
            s,
            BRAND_CONTENT_START_ROW + 1,
            `N evaluados=${evaluatedCount} · N registrados=${registeredCount}. Umbrales nivel: Superior≥400, Alto≥325, Medio≥250, Bajo<250.`
        );

        sectionHeader(s, 7, 'Tendencia central');
        const central: [string, number | string][] = [
            ['Promedio', inst.avg],
            ['Mediana', inst.median],
            ['Máximo', inst.max],
            ['Mínimo', inst.min],
        ];
        central.forEach((row, i) => {
            const r = 8 + i;
            dataCell(s.getCell(r, 1), row[0], { bold: true, bg: 'FFF9FAFB' });
            dataCell(s.getCell(r, 2), row[1], { align: 'right', bold: true });
        });

        sectionHeader(s, 13, 'Dispersión');
        const dispersion: [string, number | string][] = [
            ['Desviación estándar', inst.stdDev],
            ['Coeficiente de variación', `${inst.coefVar}%`],
            ['Interpretación CV', cvInterpretation(Number(inst.coefVar) || 0)],
        ];
        dispersion.forEach((row, i) => {
            const r = 14 + i;
            dataCell(s.getCell(r, 1), row[0], { bold: true, bg: 'FFF9FAFB' });
            dataCell(s.getCell(r, 2), row[1], { align: 'right' });
        });

        sectionHeader(s, 18, 'Distribución (percentiles)');
        const distribution: [string, number | string][] = [
            ['Percentil 90', inst.p90],
            ['Percentil 75', inst.p75],
            ['Percentil 25', inst.p25],
            ['Rango intercuartil (IQR)', inst.iqr],
        ];
        distribution.forEach((row, i) => {
            const r = 19 + i;
            dataCell(s.getCell(r, 1), row[0], { bold: true, bg: 'FFF9FAFB' });
            dataCell(s.getCell(r, 2), row[1], { align: 'right' });
        });

        sectionHeader(s, 24, 'Aprobación y población');
        const approval: [string, number | string][] = [
            ['Tasa aprobación (≥300)', `${inst.tasaAprobacion}%`],
            ['N evaluados (puntaje > 0)', evaluatedCount],
            ['N registrados', registeredCount],
        ];
        approval.forEach((row, i) => {
            const r = 25 + i;
            dataCell(s.getCell(r, 1), row[0], { bold: true, bg: 'FFF9FAFB' });
            dataCell(s.getCell(r, 2), row[1], { align: 'right', bold: true });
        });

        // Distribución niveles
        sectionHeader(s, 29, 'Distribución por nivel');
        tableHeader(s, 14, ['Nivel', 'Rango', 'Estudiantes', '% del total'], 1);
        const total = inst.students.length || 1;
        const niveles: [string, string, number, string][] = [
            ['Superior', '≥400', inst.niveles.superior, SG_SUCCESS],
            ['Alto', '325-399', inst.niveles.alto, 'FF2563EB'],
            ['Medio', '250-324', inst.niveles.medio, SG_WARN],
            ['Bajo', '<250', inst.niveles.bajo, SG_DANGER],
        ];
        niveles.forEach((n, i) => {
            const r = 15 + i;
            const pct = safePct(n[2], total);
            dataCell(s.getCell(r, 1), n[0], { bold: true, color: n[3] });
            dataCell(s.getCell(r, 2), n[1], { align: 'center' });
            dataCell(s.getCell(r, 3), n[2], { align: 'right', bold: true });
            dataCell(s.getCell(r, 4), pct, { align: 'right' });
        });
    }

    // ─── Hoja 3: Rendimiento por Área ─────────────────────────
    {
        const s = wb.addWorksheet('Rendimiento por Área');
        setBrandTitle(s, 'Rendimiento por Área', `${inst.name} · ${simulationId}`);

        const widths = [22, 12, 12, 12, 12, 12, 14, 14];
        widths.forEach((w, i) => (s.getColumn(i + 1).width = w));

        sectionHeader(s, BRAND_CONTENT_START_ROW, 'Promedios por área (escala 0-100)');
        tableHeader(
            s,
            5,
            ['Área', 'Promedio', 'Mediana', 'Mínimo', 'Máximo', 'D.E.', 'Estudiantes', 'Aciertos/Total'],
            1
        );

        inst.subjectStats.forEach((area, i) => {
            const r = 6 + i;
            const color = area.avg >= 65 ? SG_SUCCESS : area.avg >= 45 ? SG_WARN : SG_DANGER;
            dataCell(s.getCell(r, 1), area.name, { bold: true });
            dataCell(s.getCell(r, 2), area.avg, { align: 'right', bold: true, color });
            dataCell(s.getCell(r, 3), area.median, { align: 'right' });
            dataCell(s.getCell(r, 4), area.min, { align: 'right' });
            dataCell(s.getCell(r, 5), area.max, { align: 'right' });
            dataCell(s.getCell(r, 6), area.stdDev, { align: 'right' });
            dataCell(s.getCell(r, 7), area.countStudents, { align: 'right' });
            dataCell(
                s.getCell(r, 8),
                area.totalPreguntas > 0 ? `${area.correctas}/${area.totalPreguntas}` : NOT_APPLICABLE,
                { align: 'center' }
            );
        });
        const areaLast = 5 + inst.subjectStats.length;
        if (inst.subjectStats.length) {
            applyDataBar(s, `B6:B${areaLast}`, SG_PRIMARY, 1);
            applyColorScale(s, `B6:B${areaLast}`, 2);
        }
    }
    {
        const s = wb.addWorksheet('Insights y Recomendaciones', {
            properties: { tabColor: { argb: 'FF0EA5E9' } },
        });
        setBrandTitle(s, 'Insights y Recomendaciones', `${inst.name} · ${simulationId}`);

        s.getColumn(1).width = 22;
        s.getColumn(2).width = 12;
        s.getColumn(3).width = 12;
        s.getColumn(4).width = 12;
        s.getColumn(5).width = 28;
        s.getColumn(6).width = 11;
        s.getColumn(7).width = 14;

        const fortalezasHeaderRow = BRAND_CONTENT_START_ROW;
        const fortalezasTableRow = fortalezasHeaderRow + 1;
        const fortalezasDataStartRow = fortalezasTableRow + 1;
        sectionHeader(
            s,
            fortalezasHeaderRow,
            summary.fortalezasContexto === 'intrains'
                ? 'Fortalezas (mayor puntaje medio local — ningún área ≥ referente nacional)'
                : 'Fortalezas'
        );
        tableHeader(s, fortalezasTableRow, ['Área', 'Promedio', 'Nacional', 'Δ', 'Lectura'], 1);
        if (summary.fortalezas.length === 0) {
            mergeCellsResolved(s, fortalezasDataStartRow, 1, fortalezasDataStartRow, 5);
            dataCell(
                s.getCell(fortalezasDataStartRow, 1),
                summary.fortalezasContexto === 'intrains'
                    ? 'Sin promedios por área para listar fortalezas locales.'
                    : 'No se detectan áreas por encima del referente nacional.',
                {
                    color: SG_MUTED,
                }
            );
        } else {
            summary.fortalezas.forEach((a, i) => {
                const r = fortalezasDataStartRow + i;
                dataCell(s.getCell(r, 1), a.name, { bold: true });
                dataCell(s.getCell(r, 2), a.avg, { align: 'right' });
                dataCell(s.getCell(r, 3), a.nationalAvg, { align: 'right' });
                dataCell(s.getCell(r, 4), `${a.delta >= 0 ? '+' : ''}${a.delta}`, {
                    align: 'right',
                    bold: true,
                    color: SG_SUCCESS,
                });
                dataCell(s.getCell(r, 5), a.headline, {});
                s.getCell(r, 5).alignment = { wrapText: true, vertical: 'middle' };
                s.getRow(r).height = 26;
            });
        }

        const startDeb = fortalezasDataStartRow + Math.max(summary.fortalezas.length, 1) + 1;
        sectionHeader(s, startDeb, 'Áreas a priorizar');
        tableHeader(s, startDeb + 1, ['Área', 'Promedio', 'Nacional', 'Δ', 'Acción recomendada'], 1);

        if (summary.debilidades.length === 0) {
            mergeCellsResolved(s, startDeb + 2, 1, startDeb + 2, 5);
            dataCell(s.getCell(startDeb + 2, 1), 'Todas las áreas en nivel nacional o superior.', {
                color: SG_MUTED,
            });
        } else {
            summary.debilidades.forEach((a, i) => {
                const r = startDeb + 2 + i;
                dataCell(s.getCell(r, 1), a.name, { bold: true });
                dataCell(s.getCell(r, 2), a.avg, { align: 'right' });
                dataCell(s.getCell(r, 3), a.nationalAvg, { align: 'right' });
                dataCell(s.getCell(r, 4), `${a.delta >= 0 ? '+' : ''}${a.delta}`, {
                    align: 'right',
                    bold: true,
                    color: SG_DANGER,
                });
                dataCell(s.getCell(r, 5), a.recomendacion, {});
                s.getCell(r, 5).alignment = { wrapText: true, vertical: 'middle' };
                s.getRow(r).height = 30;
            });
        }

        const startPlan = startDeb + 2 + Math.max(summary.debilidades.length, 1) + 1;
        sectionHeader(s, startPlan, 'Plan de estudio sugerido (próximas semanas)');
        if (summary.planEstudio.length === 0) {
            mergeCellsResolved(s, startPlan + 1, 1, startPlan + 1, 5);
            dataCell(s.getCell(startPlan + 1, 1), 'Sin plan crítico. Mantener la metodología.', {
                color: SG_MUTED,
            });
        } else {
            let planRowOffset = 0;
            summary.planEstudioPasos.forEach((paso, i) => {
                const r = startPlan + 1 + planRowOffset;
                dataCell(s.getCell(r, 1), `Paso ${i + 1}`, {
                    bold: true,
                    color: SG_PRIMARY,
                    align: 'center',
                });
                const bloqueMacro = [
                    paso.documentoMacro ? `Referencia: ${paso.documentoMacro}` : null,
                    paso.competenciasMacro.length
                        ? `Competencias (marco): ${paso.competenciasMacro.join(' ')}`
                        : null,
                    paso.practicasAulaMacro.length ? `Prácticas sugeridas: ${paso.practicasAulaMacro.join(' ')}` : null,
                    paso.evidenciasSeguimiento.length
                        ? `Evidencia/seguimiento: ${paso.evidenciasSeguimiento.join(' ')}`
                        : null,
                    paso.guiaCoordinacion.length
                        ? `Guía coordinación:\n${paso.guiaCoordinacion.map((g, j) => `${j + 1}. ${g}`).join('\n')}`
                        : null,
                    paso.hitosTresSemanas.length
                        ? `3 semanas:\n${paso.hitosTresSemanas.map((g, j) => `S${j + 1}: ${g}`).join('\n')}`
                        : null,
                    paso.indicadoresInstitucion.length
                        ? `Indicadores:\n${paso.indicadoresInstitucion.map((g, j) => `· ${g}`).join('\n')}`
                        : null,
                    paso.microAcciones.length ? `Acciones locales: ${paso.microAcciones.join(' ')}` : null,
                    paso.vinculosPreguntasCriticas.length
                        ? `Ítems críticos: ${paso.vinculosPreguntasCriticas.map(v => questionLabel(v.num)).join(', ')}`
                        : null,
                ]
                    .filter(Boolean)
                    .join('\n\n');
                const cuerpo = `${paso.resumen}\n\n${bloqueMacro}`.trim();
                mergeCellsResolved(s, r, 2, r, 5);
                dataCell(s.getCell(r, 2), cuerpo, {});
                s.getCell(r, 2).alignment = { wrapText: true, vertical: 'middle' };
                const lines = Math.min(48, Math.max(4, Math.ceil(cuerpo.length / 72)));
                s.getRow(r).height = Math.min(400, lines * 14 + 24);
                planRowOffset += 1;
            });
        }

        // Preguntas críticas
        const startPC = startPlan + 1 + Math.max(summary.planEstudio.length, 1) + 1;
        if (summary.preguntasCriticas.length > 0) {
            sectionHeader(s, startPC, 'Preguntas críticas (≥50% de error)');
            tableHeader(s, startPC + 1, ['Materia', 'Pregunta', '% Error', 'Fallaron', 'De total', 'Orden', 'Categoría'], 1);
            summary.preguntasCriticas.forEach((q, i) => {
                const r = startPC + 2 + i;
                dataCell(s.getCell(r, 1), q.materia, { bold: true });
                dataCell(s.getCell(r, 2), questionLabel(q.num), { align: 'center' });
                dataCell(s.getCell(r, 3), `${Math.round(q.failRate * 100)}%`, {
                    align: 'right',
                    bold: true,
                    color: SG_DANGER,
                });
                dataCell(s.getCell(r, 4), q.failedCount, { align: 'right' });
                dataCell(s.getCell(r, 5), q.total, { align: 'right' });
                dataCell(s.getCell(r, 6), `T${q.priorityOrder}`, { align: 'center', bold: true });
                dataCell(s.getCell(r, 7), q.importance === 'critico' ? 'Crítico' : q.importance === 'alto' ? 'Alto' : 'Moderado', {});
            });
        }
    }

    // ─── Hoja 5: Estudiantes (ranking completo por área) ───────
    {
        const s = wb.addWorksheet('Estudiantes');
        setBrandTitle(
            s,
            'Ranking por estudiante',
            `${inst.name} · ${simulationId} · ${evaluatedCount} evaluados de ${registeredCount} registrados`
        );

        const headers = [
            'Pos',
            'ID',
            'Nombre',
            'Apellidos',
            'Institución',
            'Global',
            ...AREA_EXPORT_COLUMNS.map(a => a.header),
            'S1',
            'S2',
            'Estado sesión',
            'Nivel',
            'Área débil',
        ];
        const colCount = headers.length;
        headers.forEach((_, i) => {
            s.getColumn(i + 1).width =
                i === 0 ? 6 : i <= 4 ? 22 : i === 5 ? 10 : i <= 10 ? 8 : 14;
        });

        tableHeader(s, 4, headers, 1);

        let evalRank = 0;
        exportStudents.forEach((est, idx) => {
            const r = 5 + idx;
            const score = Number(est.puntaje_global) || 0;
            if (score > 0) evalRank += 1;
            const niv = nivelByGlobal(score);
            const ses = sessionFlags(est);

            let weakest = NOT_APPLICABLE;
            let weakestVal = 999;
            if (est.puntajes) {
                AREA_EXPORT_COLUMNS.forEach(({ key }) => {
                    const p = areaScore(est, key);
                    if (p > 0 && p < weakestVal) {
                        weakestVal = p;
                        weakest = key;
                    }
                });
            }

            let col = 1;
            dataCell(s.getCell(r, col++), score > 0 ? evalRank : NOT_APPLICABLE, { align: 'right', color: SG_MUTED });
            dataCell(s.getCell(r, col++), est.informacion_personal?.numero_identificacion, {});
            dataCell(s.getCell(r, col++), est.informacion_personal?.nombres, {});
            dataCell(s.getCell(r, col++), est.informacion_personal?.apellidos, {});
            dataCell(s.getCell(r, col++), est.informacion_personal?.institucion, { color: SG_MUTED });
            scoreCell(s.getCell(r, col++), score, 500, { bold: true });
            AREA_EXPORT_COLUMNS.forEach(({ key }) => {
                const p = areaScore(est, key);
                if (p > 0) scoreCell(s.getCell(r, col++), p, 100);
                else dataCell(s.getCell(r, col++), p === 0 ? 0 : NOT_APPLICABLE, { align: 'right', kind: 'metric' });
            });
            dataCell(s.getCell(r, col++), ses.s1, { align: 'center' });
            dataCell(s.getCell(r, col++), ses.s2, { align: 'center' });
            dataCell(s.getCell(r, col++), ses.estado, {
                align: 'center',
                color: ses.estado === 'Completo' ? SG_SUCCESS : ses.estado === 'Parcial' ? SG_WARN : SG_DANGER,
            });
            dataCell(s.getCell(r, col++), niv.label, { align: 'center', color: niv.color });
            dataCell(
                s.getCell(r, col++),
                typeof weakest === 'string' && weakest !== NOT_APPLICABLE ? `${weakest} (${weakestVal})` : weakest,
                { color: SG_MUTED, size: 9 }
            );

            if (idx % 2 === 0) {
                for (let c = 1; c <= colCount; c++) {
                    const cell = s.getCell(r, c);
                    if (!cell.fill || (cell.fill as ExcelJS.FillPattern).fgColor === undefined) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
                    }
                }
            }
        });

        s.views = [{ state: 'frozen', xSplit: 2, ySplit: 4 }];
    }

    // ─── Hoja 6: Alertas y Riesgo ─────────────────────────────
    {
        const s = wb.addWorksheet('Alertas y Riesgo', {
            properties: { tabColor: { argb: SG_DANGER } },
        });
        setBrandTitle(s, 'Alertas y Riesgo', `${inst.name} · ${simulationId}`);

        const widths = [16, 14, 26, 26, 12, 22, 32];
        widths.forEach((w, i) => (s.getColumn(i + 1).width = w));

        const groups: [string, string, AlertaEstudiante[]][] = [
            ['Crítico (<200)', SG_DANGER, alertas.critico],
            ['Alto (200-249)', SG_WARN, alertas.alto],
            ['Moderado', 'FFD97706', alertas.moderado],
            ['Monitoreo', 'FF2563EB', alertas.monitoreo],
        ];

        let row = BRAND_CONTENT_START_ROW;
        groups.forEach(([label, color, list]) => {
            sectionHeader(s, row, `${label} · ${list.length} estudiantes`);
            row += 1;
            tableHeader(
                s,
                row,
                ['Nivel', 'ID', 'Nombre', 'Área débil', 'Mín área', 'Brecha vs avg', 'Recomendación'],
                1
            );
            row += 1;
            if (list.length === 0) {
                mergeCellsResolved(s, row, 1, row, 7);
                dataCell(s.getCell(row, 1), 'Sin estudiantes en este nivel.', { color: SG_MUTED });
                row += 2;
                return;
            }
            const brechaStart = row;
            list.forEach(a => {
                dataCell(s.getCell(row, 1), label.split(' ')[0], { bold: true, color });
                dataCell(s.getCell(row, 2), a.id, { align: 'left' });
                dataCell(s.getCell(row, 3), a.nombre, {});
                dataCell(s.getCell(row, 4), a.areaDebil, { color: SG_MUTED });
                dataCell(s.getCell(row, 5), a.minPuntaje, { align: 'right' });
                dataCell(s.getCell(row, 6), a.brecha, { align: 'right', color: SG_DANGER });
                dataCell(s.getCell(row, 7), a.recomendacion, {});
                row += 1;
            });
            applyDataBar(s, `F${brechaStart}:F${row - 1}`, SG_DANGER, 1);
            row += 1;
        });
    }

    // ─── Notas Metodológicas ──────────────────────────
    {
        const s = wb.addWorksheet('Notas Metodológicas');
        setBrandTitle(s, 'Notas Metodológicas', 'Cómo leer este reporte');

        s.getColumn(1).width = 4;
        s.getColumn(2).width = 42;

        sectionHeader(s, BRAND_CONTENT_START_ROW, 'Definiciones y supuestos');
        summary.metodologia.forEach((line, i) => {
            const r = 5 + i;
            dataCell(s.getCell(r, 1), `${i + 1}.`, {
                align: 'right',
                bold: true,
                color: SG_PRIMARY,
            });
            dataCell(s.getCell(r, 2), line, {});
            s.getCell(r, 2).alignment = { wrapText: true, vertical: 'middle' };
            s.getRow(r).height = 26;
        });

        const startCav = 5 + summary.metodologia.length + 1;
        sectionHeader(s, startCav, 'Limitaciones y consideraciones');

        const caveats = [
            'Los promedios por área usan curva ICFES humanizada (escala 0-100) y pueden diferir levemente del puntaje global.',
            'Si la institución carga datos por ranking precomputado en lugar de detalle por estudiante, el análisis de preguntas críticas usa estadísticas agregadas (no per-estudiante).',
            'Los percentiles vs nacional usan el dataset ICFES 2025 y pueden ajustarse cuando el INSS publique nuevas calibraciones.',
            'Las recomendaciones son sugerencias automatizadas basadas en patrones; deben validarse con los docentes responsables.',
            'Celdas vacías se reemplazan por «Sin dato» (texto) o «No aplica» (métrica). El 0 solo indica medición real o sesión incompleta.',
        ];

        const dictStart = startCav + caveats.length + 2;
        sectionHeader(s, dictStart, 'Diccionario BASE_DATOS');
        const dictRows: [string, string][] = [
            ['ID', 'Número de identificación del estudiante'],
            ['Global', 'Puntaje global ICFES 0-500'],
            ['MAT/LEC/SOC/CIE/ING', 'Puntaje por área 0-100'],
            ['S1/S2', 'Sesión completada: Sí/No'],
            ['Estado sesión', 'Completo | Parcial | Incompleto'],
            ['Departamento', 'Campo informacion_personal.departamento'],
            ['Nivel global', 'Superior | Alto | Medio | Bajo según puntaje global'],
        ];
        tableHeader(s, dictStart + 1, ['Columna', 'Definición'], 2);
        dictRows.forEach(([col, def], i) => {
            const r = dictStart + 2 + i;
            dataCell(s.getCell(r, 2), col, { bold: true });
            dataCell(s.getCell(r, 3), def, { wrap: true });
        });
        caveats.forEach((line, i) => {
            const r = startCav + 1 + i;
            dataCell(s.getCell(r, 1), `•`, { align: 'right', color: SG_MUTED });
            dataCell(s.getCell(r, 2), line, { color: SG_MUTED });
            s.getCell(r, 2).alignment = { wrapText: true, vertical: 'middle' };
            s.getRow(r).height = 30;
        });
    }

    // ─── BASE_DATOS (auditoría / pivots) ──────────────────────
    {
        const s = wb.addWorksheet('BASE_DATOS');
        setBrandTitle(s, 'Base de datos del alcance exportado', reportMeta);
        const headers = [
            'ID',
            'Nombres',
            'Apellidos',
            'Institución',
            'Departamento',
            'Simulacro',
            'Global',
            ...AREA_EXPORT_COLUMNS.map(a => a.header),
            'S1',
            'S2',
            'Estado sesión',
            'Nivel global',
        ];
        tableHeader(s, 4, headers, 1);
        headers.forEach((_, i) => {
            s.getColumn(i + 1).width = i <= 3 ? 22 : 12;
        });
        exportStudents.forEach((est, idx) => {
            const r = 5 + idx;
            const ses = sessionFlags(est);
            const score = Number(est.puntaje_global) || 0;
            const niv = nivelByGlobal(score);
            const info = est.informacion_personal as unknown as Record<string, unknown> | undefined;
            const depto = displayText(info?.departamento || info?.Departamento);
            let c = 1;
            dataCell(s.getCell(r, c++), est.informacion_personal?.numero_identificacion, {});
            dataCell(s.getCell(r, c++), est.informacion_personal?.nombres, {});
            dataCell(s.getCell(r, c++), est.informacion_personal?.apellidos, {});
            dataCell(s.getCell(r, c++), est.informacion_personal?.institucion, {});
            dataCell(s.getCell(r, c++), depto, {});
            dataCell(s.getCell(r, c++), simulationId, {});
            scoreCell(s.getCell(r, c++), score, 500);
            AREA_EXPORT_COLUMNS.forEach(({ key }) => {
                const p = areaScore(est, key);
                if (p > 0) scoreCell(s.getCell(r, c++), p, 100);
                else dataCell(s.getCell(r, c++), p === 0 ? 0 : NOT_APPLICABLE, { align: 'right', kind: 'metric' });
            });
            dataCell(s.getCell(r, c++), ses.s1, { align: 'center' });
            dataCell(s.getCell(r, c++), ses.s2, { align: 'center' });
            dataCell(s.getCell(r, c++), ses.estado, { align: 'center' });
            dataCell(s.getCell(r, c++), niv.label, { align: 'center', color: niv.color });
        });
        s.views = [{ state: 'frozen', xSplit: 1, ySplit: 4 }];
    }

    await appendExtendedCoordinatorSheets({
        wb,
        summary,
        inst,
        ranking,
        allInstitutions,
        alertas,
        questionAnalysis,
        simulationId,
        reportMeta,
        evaluatedCount,
        registeredCount,
        exportStudents,
    });

    if (shouldIncludeAutomationSheet(wb)) {
        sheetAutomatizacion(wb, reportMeta);
    }
    await appendStudentFichas({
        wb,
        summary,
        inst,
        ranking,
        allInstitutions,
        alertas,
        questionAnalysis,
        simulationId,
        reportMeta,
        evaluatedCount,
        registeredCount,
        exportStudents,
    });

    wireCoordinatorExcelNavigation(wb, reportMeta, {
        avg: summary.avg,
        tasa: summary.tasaAprobacion,
        evaluados: evaluatedCount,
        riesgo: summary.riesgoCount,
    });
    finalizeWorkbookLayout(wb);

    // Persistir
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const filename = buildCoordinatorReportFilename(simulationId, inst.name);
    saveAs(blob, filename);
}
