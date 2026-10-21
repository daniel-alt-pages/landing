/**
 * Hojas extendidas del reporte coordinador (panel + legacy).
 * Gráficos vía Chart.js → PNG embebido en Excel.
 */
import type ExcelJS from 'exceljs';
import type { Estudiante } from '@shared/types';
import type {
    InstitutionMetrics,
    AlertaEstudiante,
    QuestionStat,
} from '@features/coordinador/hooks/useCoordinadorData';
import type { ExecutiveSummary } from '@features/coordinador/lib/executiveModel';
import { buildCoordinatorScientificExcelPolicy } from '@features/coordinador/lib/coordinatorExcelPolicy';
import {
    appendAreaPlanSheets,
    hasAreaPlanSheetsData,
} from '@features/coordinador/lib/coordinatorExcelAreaPlan';
import { NATIONAL_STATS } from '@features/benchmark/lib/nationalData';
import {
    setBrandTitle,
    sectionHeader,
    tableHeader,
    dataCell,
    BRAND_CONTENT_START_ROW,
    barVisualization,
    applyDataBar,
    applyColorScale,
    applyAutoFilter,
    applyTableFreeze,
    tabColorForGroup,
    SG_PRIMARY,
    SG_DANGER,
    SG_SUCCESS,
    SG_MUTED,
    SG_WARN,
    SG_TEXT,
    SG_CYAN,
    questionLabel,
    methodologyNote,
} from '@features/coordinador/lib/coordinatorExcelFormat';
import {
    correlationMagnitude,
    NOT_APPLICABLE,
    sampleSizeWarning,
} from '@features/coordinador/lib/coordinatorExcelValues';
import { sheetSesionesIncompletas } from '@features/coordinador/lib/coordinatorExcelSheets';
import { computePotencialRows } from '@features/coordinador/lib/coordinatorExcelPsychometrics';
import {
    computeCorrelationMatrix,
    computeLevelProfiles,
    computeGapRows,
    computeSessionStats,
    computeDepartmentStats,
    computeNationalBenchmarkRows,
    segmentacionRows,
    nationalAreaComparisonRows,
    distributionChartData,
    nivelChartData,
    areaChartData,
    institutionBenchmarkChartData,
    departmentChartData,
    studentsWithAreaScores,
    AREA_KEYS,
    AREA_SHORT,
} from '@features/coordinador/lib/coordinatorExcelAnalytics';
import {
    chartNiveles,
    chartBarras,
    chartDistribucion,
    chartRadarAreas,
    chartInstVsNacional,
    type ChartImage,
} from '@features/coordinador/lib/coordinatorExcelCharts';

export interface ExtendedExcelContext {
    wb: ExcelJS.Workbook;
    summary: ExecutiveSummary;
    inst: InstitutionMetrics;
    ranking: Estudiante[];
    allInstitutions: InstitutionMetrics[];
    alertas: {
        critico: AlertaEstudiante[];
        alto: AlertaEstudiante[];
        moderado: AlertaEstudiante[];
        monitoreo: AlertaEstudiante[];
    };
    questionAnalysis: Record<string, QuestionStat[]>;
    simulationId: string;
    reportMeta: string;
    evaluatedCount: number;
    registeredCount: number;
    exportStudents: Estudiante[];
}

/** Hojas pedagógicas opcionales: solo se crean si hay contenido real (no placeholders). */
/** @deprecated Usar hojas «MAT/LEC/… · Plan ICFES» unificadas por área. */
export function hasRecomendacionesSheetData(summary: ExecutiveSummary): boolean {
    return summary.recomendaciones.length > 0 || summary.competenciasDiagnostico.length > 0;
}

/** @deprecated Usar hojas «MAT/LEC/… · Plan ICFES» unificadas por área. */
export function hasPlanEstudioSheetData(summary: ExecutiveSummary): boolean {
    return summary.planEstudio.length > 0 || summary.planEstudioPasos.length > 0;
}

/** @deprecated Usar hojas «MAT/LEC/… · Plan ICFES» unificadas por área. */
export function hasPlanesInstitucionSheetData(ctx: ExtendedExcelContext): boolean {
    return ctx.summary.planEstudioPasos.length > 0;
}

/** Temas por ítem etiquetados en respuestas detalladas (aún no en QuestionStat). */
export function hasTemasCriticosSheetData(_ctx: ExtendedExcelContext): boolean {
    return false;
}

/** Snippets Apps Script/VBA: referencia técnica, no datos del simulacro. */
export function shouldIncludeAutomationSheet(_wb: ExcelJS.Workbook): boolean {
    return false;
}

function embedChart(
    wb: ExcelJS.Workbook,
    sheet: ExcelJS.Worksheet,
    img: ChartImage | null,
    col: number,
    row: number,
    scale = 0.62
) {
    if (!img?.base64) return;
    const id = wb.addImage({ base64: img.base64, extension: 'png' });
    sheet.addImage(id, {
        tl: { col, row },
        ext: { width: img.width * scale, height: img.height * scale },
    });
}



function sheetCorrelaciones(ctx: ExtendedExcelContext) {
    const { wb, inst, reportMeta } = ctx;
    const pool = studentsWithAreaScores(inst.students);
    if (pool.length < 3) return;

    const corr = computeCorrelationMatrix(inst.students);
    const s = wb.addWorksheet('Correlaciones');
    setBrandTitle(s, 'Análisis de correlación entre áreas', reportMeta);
    s.getColumn(2).width = 12;
    [3, 4, 5, 6, 7, 8, 9].forEach(c => (s.getColumn(c).width = 11));

    sectionHeader(s, BRAND_CONTENT_START_ROW, 'Matriz de correlación de Pearson (áreas con puntaje completo)');
    methodologyNote(
        s,
        BRAND_CONTENT_START_ROW + 1,
        `N=${pool.length} estudiantes con las 5 áreas calificadas. ${sampleSizeWarning(pool.length) || 'Muestra suficiente para interpretación descriptiva.'}`
    );
    tableHeader(s, 7, ['', ...corr.labels, 'Magnitud'], 2);
    corr.matrix.forEach((rowVals, i) => {
        const r = 8 + i;
        dataCell(s.getCell(r, 2), corr.labels[i], { bold: true });
        rowVals.forEach((v, j) => {
            const color = i === j ? SG_MUTED : Math.abs(v) >= 0.7 ? SG_SUCCESS : SG_TEXT;
            dataCell(s.getCell(r, 3 + j), v.toFixed(2), { align: 'center', color });
        });
        const maxOff = rowVals.reduce((m, v, idx) => (idx === i ? m : Math.max(m, Math.abs(v))), 0);
        dataCell(s.getCell(r, 3 + corr.labels.length), correlationMagnitude(maxOff), {
            align: 'center',
        });
    });

    const insightRow = 8 + corr.labels.length + 2;
    sectionHeader(s, insightRow, 'Insights');
    dataCell(s.getCell(insightRow + 1, 2), `Correlación más fuerte: ${corr.insights.strongest}`, {});
    dataCell(s.getCell(insightRow + 2, 2), `Correlación más débil: ${corr.insights.weakest}`, {});
}

function sheetPerfilNivel(ctx: ExtendedExcelContext) {
    const { wb, inst, reportMeta } = ctx;
    const profiles = computeLevelProfiles(inst.students);
    if (!profiles.some(p => p.count > 0)) return;

    const s = wb.addWorksheet('Perfil por Nivel');
    setBrandTitle(s, 'Perfil del estudiante tipo por nivel', reportMeta);
    s.getColumn(2).width = 14;
    [3, 4, 5, 6, 7, 8].forEach(c => (s.getColumn(c).width = 18));

    sectionHeader(s, BRAND_CONTENT_START_ROW, 'Resumen por nivel de desempeño global');
    tableHeader(
        s,
        5,
        ['Nivel', 'Estudiantes', 'Promedio', 'Área fuerte', 'Área débil', 'Brecha', 'Recomendación'],
        2
    );
    profiles.forEach((p, i) => {
        const r = 6 + i;
        dataCell(s.getCell(r, 2), p.nivel, { bold: true });
        dataCell(s.getCell(r, 3), p.count, { align: 'right' });
        dataCell(s.getCell(r, 4), p.count > 0 ? p.avgGlobal : NOT_APPLICABLE, { align: 'right' });
        dataCell(s.getCell(r, 5), p.areaFuerte, {});
        dataCell(s.getCell(r, 6), p.areaDebil, {});
        dataCell(s.getCell(r, 7), p.count > 0 ? p.brecha : NOT_APPLICABLE, { align: 'right' });
        dataCell(s.getCell(r, 8), p.recomendacion, { color: SG_MUTED });
    });

    const detailStart = 6 + profiles.length + 2;
    sectionHeader(s, detailStart, 'Promedios por área y nivel');
    tableHeader(s, detailStart + 1, ['Nivel', ...AREA_SHORT.map((_, i) => AREA_KEYS[i].slice(0, 12))], 2);
    profiles.forEach((p, i) => {
        const r = detailStart + 2 + i;
        dataCell(s.getCell(r, 2), p.nivel, { bold: true });
        AREA_KEYS.forEach((k, j) => {
            dataCell(s.getCell(r, 3 + j), p.areaAvgs[k] ?? 0, { align: 'right' });
        });
    });
}

function sheetSesiones(ctx: ExtendedExcelContext) {
    const { wb, inst, reportMeta, registeredCount } = ctx;
    if (registeredCount <= 0) return;

    const stats = computeSessionStats(inst.students);
    const s = wb.addWorksheet('Sesiones');
    setBrandTitle(s, 'Seguimiento de completitud S1 / S2', reportMeta);
    s.getColumn(2).width = 14;
    s.getColumn(3).width = 28;
    s.getColumn(4).width = 28;
    [5, 6, 7, 8, 9].forEach(c => (s.getColumn(c).width = 12));

    const total = registeredCount || inst.students.length || 1;
    sectionHeader(s, BRAND_CONTENT_START_ROW, 'Resumen de sesiones');
    const resumen = [
        ['Ambas sesiones', stats.ambas, stats.ambas / total],
        ['Solo S1', stats.soloS1, stats.soloS1 / total],
        ['Solo S2', stats.soloS2, stats.soloS2 / total],
        ['Incompletos', stats.incompletos, stats.incompletos / total],
    ];
    tableHeader(s, 5, ['Estado', 'Cantidad', '%'], 2);
    resumen.forEach(([label, n, pct], i) => {
        const r = 6 + i;
        dataCell(s.getCell(r, 2), label, { bold: true });
        dataCell(s.getCell(r, 3), n as number, { align: 'right' });
        dataCell(s.getCell(r, 4), `${((pct as number) * 100).toFixed(1)}%`, { align: 'right' });
    });

    let row = 11;
    sectionHeader(s, row++, 'Detalle por estudiante');
    tableHeader(s, row++, ['#', 'Documento', 'Nombre', 'Institución', 'S1', 'S2', 'Estado', 'Global'], 2);
    stats.rows.slice(0, 800).forEach((sr, idx) => {
        const r = row++;
        dataCell(s.getCell(r, 2), idx + 1, { align: 'center' });
        dataCell(s.getCell(r, 3), sr.id, {});
        dataCell(s.getCell(r, 4), sr.nombre, {});
        dataCell(s.getCell(r, 5), sr.institucion, { color: SG_MUTED });
        dataCell(s.getCell(r, 6), sr.s1, { align: 'center' });
        dataCell(s.getCell(r, 7), sr.s2, { align: 'center' });
        const estColor =
            sr.estado === 'Completo' ? SG_SUCCESS : sr.estado.includes('Falta') ? SG_WARN : SG_DANGER;
        dataCell(s.getCell(r, 8), sr.estado, { align: 'center', color: estColor });
        dataCell(s.getCell(r, 9), sr.global, { align: 'right' });
    });
    s.views = [{ state: 'frozen', xSplit: 2, ySplit: 11 }];
}

function sheetBrechas(ctx: ExtendedExcelContext) {
    const { wb, inst, reportMeta } = ctx;
    const { rows, avgGap, maxGap, highGaps } = computeGapRows(inst.students);
    if (!rows.length) return;

    const s = wb.addWorksheet('Brechas');
    setBrandTitle(s, 'Brechas intra-estudiante entre áreas', reportMeta);
    [2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((c, i) => (s.getColumn(c).width = i < 2 ? 28 : 14));

    sectionHeader(s, BRAND_CONTENT_START_ROW, 'Resumen');
    dataCell(s.getCell(5, 2), 'Brecha promedio (pts)', { bold: true });
    dataCell(s.getCell(5, 3), avgGap, { align: 'right' });
    dataCell(s.getCell(5, 4), 'Brecha máxima', { bold: true });
    dataCell(s.getCell(5, 5), maxGap, { align: 'right' });
    dataCell(s.getCell(5, 6), 'Estudiantes brecha >20', { bold: true });
    dataCell(s.getCell(5, 7), highGaps, { align: 'right', color: SG_DANGER });

    sectionHeader(s, 7, 'Ranking de brechas (mayor primero)');
    tableHeader(
        s,
        8,
        ['Nombre', 'ID', 'Institución', 'Global', 'Fuerte', 'Pts', 'Débil', 'Pts', 'Brecha', 'Riesgo', 'Recomendación'],
        2
    );
    rows.slice(0, 500).forEach((g, i) => {
        const r = 9 + i;
        dataCell(s.getCell(r, 2), g.nombre, {});
        dataCell(s.getCell(r, 3), g.id, { color: SG_MUTED });
        dataCell(s.getCell(r, 4), g.institucion, { color: SG_MUTED });
        dataCell(s.getCell(r, 5), g.global, { align: 'right' });
        dataCell(s.getCell(r, 6), g.fuerte, {});
        dataCell(s.getCell(r, 7), g.fuertePts, { align: 'right' });
        dataCell(s.getCell(r, 8), g.debil, {});
        dataCell(s.getCell(r, 9), g.debilPts, { align: 'right' });
        dataCell(s.getCell(r, 10), g.brecha, { align: 'right', bold: true });
        const riskColor =
            g.riesgo === 'Crítica' || g.riesgo === 'Alta' ? SG_DANGER : g.riesgo === 'Moderada' ? SG_WARN : SG_SUCCESS;
        dataCell(s.getCell(r, 11), g.riesgo, { align: 'center', color: riskColor });
        dataCell(
            s.getCell(r, 12),
            g.riesgo === 'Crítica' || g.riesgo === 'Alta'
                ? `Intervención focalizada en ${g.debil}`
                : g.riesgo === 'Moderada'
                  ? `Refuerzo guiado en ${g.debil}`
                  : 'Monitoreo rutinario',
            { wrap: true, color: SG_MUTED }
        );
    });
    const brechaLast = 8 + Math.min(rows.length, 500);
    if (rows.length) {
        applyDataBar(s, `J9:J${brechaLast}`, SG_DANGER, 1);
        applyAutoFilter(s, 8, 10, brechaLast);
        applyTableFreeze(s, 8, 1);
    }
}

function sheetDepartamentos(ctx: ExtendedExcelContext) {
    const { wb, inst, reportMeta, evaluatedCount } = ctx;
    const rows = computeDepartmentStats(inst.students);
    if (!rows.length) return;

    const s = wb.addWorksheet('Departamentos');
    setBrandTitle(s, 'Análisis por departamento', reportMeta);
    s.getColumn(2).width = 22;
    [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(c => (s.getColumn(c).width = 11));

    sectionHeader(s, BRAND_CONTENT_START_ROW, `Comparativa geográfica (campo informacion_personal.departamento)`);
    methodologyNote(s, BRAND_CONTENT_START_ROW + 1, 'Estudiantes sin departamento se agrupan en «Sin dato».');
    tableHeader(
        s,
        7,
        ['#', 'Departamento', 'Eval.', 'Prom.', 'Máx', 'Mín', '% éxito', 'MAT', 'LEC', 'SOC', 'CIE', 'ING'],
        2
    );
    rows.forEach((d, i) => {
        const r = 8 + i;
        dataCell(s.getCell(r, 2), i + 1, { align: 'center' });
        dataCell(s.getCell(r, 3), d.departamento, { bold: true });
        dataCell(s.getCell(r, 4), d.evaluados, { align: 'right' });
        dataCell(s.getCell(r, 5), d.promedio, { align: 'right' });
        dataCell(s.getCell(r, 6), d.max, { align: 'right' });
        dataCell(s.getCell(r, 7), d.min, { align: 'right' });
        dataCell(s.getCell(r, 8), `${d.tasaExito}%`, { align: 'right' });
        dataCell(s.getCell(r, 9), d.mats, { align: 'right' });
        dataCell(s.getCell(r, 10), d.lec, { align: 'right' });
        dataCell(s.getCell(r, 11), d.soc, { align: 'right' });
        dataCell(s.getCell(r, 12), d.cie, { align: 'right' });
        dataCell(s.getCell(r, 13), d.ing, { align: 'right' });
    });
    if (rows.length) {
        applyDataBar(s, `E8:E${7 + rows.length}`, SG_CYAN, 1);
    }

    const distStart = 7 + rows.length + 2;
    sectionHeader(s, distStart, 'Distribución de estudiantes por ubicación');
    const total = evaluatedCount || 1;
    rows.forEach((d, i) => {
        const r = distStart + 1 + i;
        dataCell(s.getCell(r, 2), d.departamento, {});
        dataCell(s.getCell(r, 3), d.evaluados, { align: 'right' });
        dataCell(s.getCell(r, 4), `${((d.evaluados / total) * 100).toFixed(1)}%`, { align: 'right' });
        dataCell(s.getCell(r, 5), barVisualization(d.evaluados / total), {});
    });

    sectionHeader(s, distStart + rows.length + 2, 'Gráfico de barras por departamento en hoja «Gráficos»');
}

function sheetBenchmarkNacional(ctx: ExtendedExcelContext) {
    const { wb, allInstitutions, reportMeta, evaluatedCount } = ctx;
    if (allInstitutions.length < 2) return;

    const benchRows = computeNationalBenchmarkRows(allInstitutions);
    const s = wb.addWorksheet('Benchmark Nacional');
    setBrandTitle(s, 'Benchmark nacional — simulacro vs ICFES 2025', reportMeta);
    s.getColumn(2).width = 32;
    [3, 4, 5, 6, 7, 8].forEach(c => (s.getColumn(c).width = 12));

    sectionHeader(s, BRAND_CONTENT_START_ROW, `Resumen institucional (${evaluatedCount} evaluados en alcance)`);
    methodologyNote(
        s,
        BRAND_CONTENT_START_ROW + 1,
        'Fuente referente: ICFES 2025 · Escala global 0-500 · Δ = Prom. simulacro − Prom. nacional (pts absolutos).'
    );
    tableHeader(
        s,
        7,
        ['Institución', '# est.', 'Prom. sim.', 'Prom. nac.', 'Δ abs.', 'Percentil', 'Ind.'],
        2
    );
    benchRows.forEach((b, i) => {
        const r = 8 + i;
        dataCell(s.getCell(r, 2), b.institucion, { bold: true });
        dataCell(s.getCell(r, 3), b.estudiantes, { align: 'right' });
        dataCell(s.getCell(r, 4), b.promSim, { align: 'right' });
        dataCell(s.getCell(r, 5), b.promNac, { align: 'right', color: SG_MUTED });
        dataCell(s.getCell(r, 6), b.delta >= 0 ? `+${b.delta}` : b.delta, {
            align: 'right',
            color: b.delta >= 0 ? SG_SUCCESS : SG_DANGER,
        });
        dataCell(s.getCell(r, 7), `P${b.percentil}`, { align: 'right' });
        dataCell(s.getCell(r, 8), b.indicador, { align: 'center' });
    });
    const benchLast = 5 + benchRows.length;
    if (benchRows.length) {
        applyDataBar(s, `D6:D${benchLast}`, SG_PRIMARY, 1);
        applyColorScale(s, `F6:F${benchLast}`, 2);
    }

    const natGlobal = Math.round(NATIONAL_STATS.global.mean);
    const natRow = 6 + benchRows.length;
    dataCell(s.getCell(natRow, 2), 'Referente nacional ICFES 2025', { bold: true, color: SG_PRIMARY });
    dataCell(s.getCell(natRow, 5), natGlobal, { align: 'right', bold: true });

    const areaStart = natRow + 2;
    sectionHeader(s, areaStart, 'Comparativa por área — institución seleccionada vs nacional');
    const inst = ctx.inst;
    const areaRows = nationalAreaComparisonRows(inst);
    tableHeader(s, areaStart + 1, ['Área', 'Prom. inst.', 'Prom. nac.', 'Δ', 'Percentil est.'], 2);
    areaRows.forEach((cells, i) => {
        const r = areaStart + 2 + i;
        cells.forEach((val, j) => {
            dataCell(s.getCell(r, 2 + j), val, j === 3 ? { color: String(val).startsWith('+') ? SG_SUCCESS : SG_DANGER } : {});
        });
    });
}

function sheetSegmentacion(ctx: ExtendedExcelContext) {
    const { wb, questionAnalysis, reportMeta } = ctx;
    const rows = segmentacionRows(questionAnalysis);
    const s = wb.addWorksheet('Segmentación de Errores');
    setBrandTitle(s, 'Segmentación de errores por opción', reportMeta);
    s.getColumn(2).width = 16;
    s.getColumn(3).width = 8;
    s.getColumn(4).width = 8;
    s.getColumn(5).width = 36;

    sectionHeader(s, BRAND_CONTENT_START_ROW, 'Estudiantes que marcaron distractores (preguntas >40% error)');
    if (!rows.length) {
        dataCell(s.getCell(5, 2), 'Sin datos de respuesta por estudiante en este alcance. Revise «Análisis Preguntas Críticas».', {
            color: SG_MUTED,
        });
        return;
    }
    tableHeader(s, 5, ['Materia', 'Pregunta', 'Opción', 'Estudiantes (muestra)', 'Acción didáctica'], 2);
    rows.forEach((r, i) => {
        const row = 6 + i;
        dataCell(s.getCell(row, 2), r.materia, { bold: true });
        dataCell(s.getCell(row, 3), r.num, { align: 'center' });
        dataCell(s.getCell(row, 4), r.opcion, { align: 'center', color: SG_DANGER });
        dataCell(s.getCell(row, 5), r.estudiantes || NOT_APPLICABLE, {});
        dataCell(
            s.getCell(row, 6),
            `Retroalimentar distractor ${r.opcion}: explicar por qué no aplica y reforzar clave correcta`,
            { wrap: true, color: SG_MUTED }
        );
        s.getCell(row, 5).alignment = { wrapText: true, vertical: 'top' };
        s.getRow(row).height = 28;
    });
}

function sheetTemasCriticos(ctx: ExtendedExcelContext) {
    if (!hasTemasCriticosSheetData(ctx)) return;

    const { wb, reportMeta } = ctx;
    const s = wb.addWorksheet('Temas_criticos_inst');
    setBrandTitle(s, 'Temas críticos por institución', reportMeta);
    s.getColumn(2).width = 42;
    sectionHeader(s, BRAND_CONTENT_START_ROW, 'Temas etiquetados por pregunta');
}

async function sheetGraficos(ctx: ExtendedExcelContext) {
    const { wb, inst, allInstitutions, reportMeta, evaluatedCount } = ctx;
    if (evaluatedCount <= 0) return;

    const [nivelesImg, distImg, areasImg, deptImg, benchImg, instNatImg, potencialImg] = await Promise.all([
        chartNiveles(nivelChartData(inst), 'Distribución por nivel'),
        chartDistribucion(distributionChartData(inst), 'Histograma puntaje global'),
        chartRadarAreas(areaChartData(inst), 'Perfil por área (0-100)'),
        chartBarras(
            departmentChartData(computeDepartmentStats(inst.students)),
            'Promedio por departamento',
            true
        ),
        allInstitutions.length > 1
            ? chartBarras(institutionBenchmarkChartData(allInstitutions), 'Benchmark institucional', true)
            : Promise.resolve(null),
        (() => {
            const labels = inst.subjectStats.map(a => a.name.split(' ')[0]);
            const instV = inst.subjectStats.map(a => a.avg);
            const natV = inst.subjectStats.map(a => {
                const key = a.key;
                const natKey =
                    key === 'lectura crítica'
                        ? 'Lectura Crítica'
                        : key === 'matemáticas'
                          ? 'Matemáticas'
                          : key === 'sociales y ciudadanas'
                            ? 'Sociales y Ciudadanas'
                            : key === 'ciencias naturales'
                              ? 'Ciencias Naturales'
                              : 'Inglés';
                return (NATIONAL_STATS.areas as Record<string, { mean: number }>)[natKey]?.mean ?? 50;
            });
            return chartInstVsNacional(labels, instV, natV, 'Institución vs nacional por área');
        })(),
        chartBarras(
            computePotencialRows(inst.students)
                .slice(0, 15)
                .map(r => ({ label: r.nombre.split(' ')[0] || r.id, value: r.totalPotencial })),
            'Top 15 — potencial de mejora total',
            true
        ),
    ]);

    const placements: { img: ChartImage | null; title: string }[] = [
        { img: nivelesImg, title: 'Niveles de desempeño' },
        { img: distImg, title: 'Distribución global' },
        { img: areasImg, title: 'Radar de áreas' },
        { img: instNatImg, title: 'Áreas vs nacional' },
        { img: deptImg, title: 'Departamentos' },
        { img: benchImg, title: 'Instituciones' },
        { img: potencialImg, title: 'Potencial de mejora (Top 15)' },
    ].filter(p => p.img?.base64);

    if (!placements.length) return;

    const s = wb.addWorksheet('Gráficos', { properties: { tabColor: { argb: tabColorForGroup('visual') } } });
    setBrandTitle(s, 'Visualizaciones del reporte', reportMeta);
    s.getColumn(1).width = 2;
    s.getColumn(2).width = 4;

    let chartRow = BRAND_CONTENT_START_ROW;

    for (const { img, title } of placements) {
        if (!img?.base64) continue;
        sectionHeader(s, chartRow, title);
        chartRow += 1;
        embedChart(wb, s, img, 1, chartRow, 0.55);
        chartRow += 22;
    }
}

/** Añade hojas extendidas + gráficos al workbook ya poblado con hojas base. */
export async function appendExtendedCoordinatorSheets(ctx: ExtendedExcelContext): Promise<void> {
    const policy = buildCoordinatorScientificExcelPolicy(ctx);

    if (policy.hasSheetData('correlaciones')) sheetCorrelaciones(ctx);
    if (policy.hasSheetData('perfilNivel')) sheetPerfilNivel(ctx);
    if (policy.hasSheetData('sesiones')) sheetSesiones(ctx);
    sheetSesionesIncompletas(ctx.wb, ctx.inst.students, ctx.reportMeta);
    if (policy.hasSheetData('brechas')) sheetBrechas(ctx);
    if (policy.hasSheetData('departamentos')) sheetDepartamentos(ctx);
    if (policy.hasSheetData('benchmarkNacional')) sheetBenchmarkNacional(ctx);
    if (hasAreaPlanSheetsData(ctx)) appendAreaPlanSheets(ctx);
    if (policy.hasSheetData('temasCriticos')) sheetTemasCriticos(ctx);
    if (policy.hasSheetData('graficos')) await sheetGraficos(ctx);
}
