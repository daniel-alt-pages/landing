/**
 * Hojas principales reestructuradas: Portada, Resumen Ejecutivo, Potencial, Psicométrico.
 */
import type ExcelJS from 'exceljs';
import type { InstitutionMetrics } from '@features/coordinador/hooks/useCoordinadorData';
import type { ExecutiveSummary } from '@features/coordinador/lib/executiveModel';
import type { Estudiante } from '@shared/types';
import {
    computePsychometricRows,
    computePotencialRows,
    type PsychometricItemRow,
} from '@features/coordinador/lib/coordinatorExcelPsychometrics';
import type { QuestionStat } from '@features/coordinador/hooks/useCoordinadorData';
import { countEvaluadosInstitucion } from '@features/coordinador/lib/coordinatorCounts';
import {
    setBrandTitle,
    sectionHeader,
    tableHeader,
    dataCell,
    applyDataBar,
    applyColorScale,
    applyAutoFilter,
    applyTableFreeze,
    buildReportMeta,
    barVisualization,
    BRAND_CONTENT_START_ROW,
    questionLabel,
    tabColorForGroup,
    SG_PRIMARY,
    SG_TEXT,
    SG_MUTED,
    SG_DANGER,
    SG_WARN,
    SG_SUCCESS,
    NUM_FMT,
    methodologyNote,
    compactKpiGrid,
    mergeCellsResolved,
} from '@features/coordinador/lib/coordinatorExcelFormat';
import { NOT_APPLICABLE } from '@features/coordinador/lib/coordinatorExcelValues';

export const RESUMEN_SHEET = 'Resumen Ejecutivo';
export const PORTADA_SHEET = 'Portada';

export function sheetPortada(
    wb: ExcelJS.Workbook,
    summary: ExecutiveSummary,
    inst: InstitutionMetrics,
    simulationId: string,
    evaluatedCount: number,
    registeredCount: number
) {
    const reportMeta = buildReportMeta(inst.name, simulationId, evaluatedCount, registeredCount);
    const s = wb.addWorksheet(PORTADA_SHEET, {
        properties: { tabColor: { argb: tabColorForGroup('portada') } },
    });
    setBrandTitle(s, 'Reporte Coordinador — Portada', reportMeta);

    s.getColumn(1).width = 3;
    [2, 3, 4, 5, 6, 7].forEach(c => (s.getColumn(c).width = 11));

    sectionHeader(s, BRAND_CONTENT_START_ROW, `${inst.name} · ${simulationId}`);
    methodologyNote(
        s,
        BRAND_CONTENT_START_ROW + 1,
        `Población: ${evaluatedCount} evaluados (puntaje>0) de ${registeredCount} registrados. Fuente pedagógica: ${summary.referenceModeLabel}.`
    );

    compactKpiGrid(s, BRAND_CONTENT_START_ROW + 3, 2, [
        { label: 'Promedio global', value: summary.avg, sub: '/500', accent: SG_PRIMARY },
        { label: 'Tasa aprobación', value: `${summary.tasaAprobacion}%`, sub: '≥300 pts', accent: SG_SUCCESS },
        { label: 'Evaluados', value: evaluatedCount, sub: `de ${registeredCount}`, accent: SG_PRIMARY },
        { label: 'En riesgo', value: summary.riesgoCount, sub: 'seguimiento', accent: SG_DANGER },
        { label: 'Nivel general', value: summary.nivelGeneral, sub: summary.headline.slice(0, 36), accent: 'FF6366F1' },
        {
            label: 'Δ vs nacional',
            value: `${summary.deltaNacional >= 0 ? '+' : ''}${summary.deltaNacional}`,
            sub: `Ref. ${summary.nationalAvg}`,
            accent: summary.deltaNacional >= 0 ? SG_SUCCESS : SG_DANGER,
        },
    ]);

    sectionHeader(s, 20, 'Lectura rápida');
    mergeCellsResolved(s, 21, 2, 21, 7);
    dataCell(s.getCell(21, 2), summary.headline, { wrap: true });
    s.getCell(21, 2).font = { ...s.getCell(21, 2).font, italic: true };
    s.getRow(21).height = 36;

    sectionHeader(s, 23, 'Próximas 3 acciones');
    const acciones =
        summary.recomendaciones.length >= 3
            ? summary.recomendaciones.slice(0, 3)
            : [
                  ...summary.recomendaciones,
                  ...Array.from({ length: Math.max(0, 3 - summary.recomendaciones.length) }, () => NOT_APPLICABLE),
              ];
    acciones.forEach((a, i) => {
        dataCell(s.getCell(24 + i, 2), `${i + 1}. ${a}`, { wrap: true });
    });

    sectionHeader(s, 28, 'Cómo usar este archivo');
    const hints = [
        'Abra «Índice» para navegar por secciones con un clic.',
        '«Resumen Ejecutivo» concentra KPIs, áreas y recomendaciones.',
        'Una hoja «MAT/LEC/SOC/CIE/ING · Plan ICFES» por área: estadística, nivel, marco y plan de mejora.',
        'Solo se generan hojas de áreas con estudiantes evaluados (sin pestañas vacías).',
    ];
    hints.forEach((h, i) => {
        dataCell(s.getCell(29 + i, 2), `• ${h}`, { color: SG_MUTED });
    });
}

export function sheetResumenEjecutivo(
    wb: ExcelJS.Workbook,
    summary: ExecutiveSummary,
    inst: InstitutionMetrics,
    ranking: Estudiante[],
    reportMeta: string,
    evaluatedCount: number,
    registeredCount: number
) {
    const s = wb.addWorksheet(RESUMEN_SHEET, {
        properties: { tabColor: { argb: tabColorForGroup('resumen') } },
    });

    setBrandTitle(s, 'Tablero de Inteligencia Académica', reportMeta);

    s.getColumn(1).width = 22;
    s.getColumn(2).width = 14;
    s.getColumn(3).width = 18;
    s.getColumn(4).width = 14;
    s.getColumn(5).width = 12;
    s.getColumn(6).width = 12;

    sectionHeader(s, BRAND_CONTENT_START_ROW, 'Lectura ejecutiva', 6);
    methodologyNote(
        s,
        BRAND_CONTENT_START_ROW + 1,
        `Columna izquierda: diagnóstico. Columna derecha: acciones. Fuente: ${summary.referenceModeLabel}.`,
        6
    );
    mergeCellsResolved(s, 7, 1, 7, 6);
    const headlineCell = s.getCell('A7');
    headlineCell.value = summary.headline;
    headlineCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: SG_TEXT } };
    headlineCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
    s.getRow(7).height = 36;

    sectionHeader(s, 9, 'Indicadores principales (diagnóstico · acción)', 6);
    const indicadores: [string, string | number, string][] = [
        ['Estudiantes en institución', registeredCount, ''],
        ['Estudiantes evaluados (puntaje > 0)', evaluatedCount, ''],
        ['Promedio global (0-500)', summary.avg, summary.avg >= 300 ? 'Aprobando' : 'Por debajo de 300'],
        ['Mediana', summary.median, ''],
        ['Tasa de aprobación (≥300)', `${summary.tasaAprobacion}%`, ''],
        ['Nivel general', summary.nivelGeneral, ''],
        ['Promedio nacional ICFES 2025', summary.nationalAvg.toFixed(1), ''],
        [
            'Diferencia vs nacional',
            `${summary.deltaNacional >= 0 ? '+' : ''}${summary.deltaNacional}`,
            summary.deltaNacional >= 0 ? 'Por encima' : 'Por debajo',
        ],
        ['Estudiantes en riesgo', summary.riesgoCount, ''],
    ];
    indicadores.forEach((row, i) => {
        const r = 10 + i;
        dataCell(s.getCell(r, 1), row[0], { bold: true, bg: 'FFF9FAFB' });
        const color = row[0] === 'Tasa de aprobación (≥300)' && summary.tasaAprobacion < 50 ? SG_DANGER : undefined;
        dataCell(s.getCell(r, 2), row[1], { align: 'right', bold: true, color });
        dataCell(s.getCell(r, 3), row[2] || NOT_APPLICABLE, { color: SG_MUTED });
    });

    // Bloque rectoría (ex Ejecutivo)
    const evaluated = ranking.filter(e => (Number(e.puntaje_global) || 0) > 0);
    const top5 = evaluated.slice(0, 5);
    const bottom5 = [...evaluated]
        .sort((a, b) => (Number(a.puntaje_global) || 0) - (Number(b.puntaje_global) || 0))
        .slice(0, 5);
    let row = 19;
    sectionHeader(s, row++, 'Top 5 y atención prioritaria');
    top5.forEach((est, i) => {
        const nombre = `${est.informacion_personal?.nombres || ''} ${est.informacion_personal?.apellidos || ''}`.trim();
        dataCell(s.getCell(row, 1), `${i + 1}. ${nombre}`, {});
        dataCell(s.getCell(row, 2), Number(est.puntaje_global) || 0, { align: 'right', bold: true });
        row++;
    });
    row++;
    bottom5.forEach((est, i) => {
        const nombre = `${est.informacion_personal?.nombres || ''} ${est.informacion_personal?.apellidos || ''}`.trim();
        dataCell(s.getCell(row, 1), `${i + 1}. ${nombre}`, { color: SG_DANGER });
        dataCell(s.getCell(row, 2), Number(est.puntaje_global) || 0, { align: 'right' });
        row++;
    });

    sectionHeader(s, row++, 'Recomendaciones para la institución');
    if (summary.recomendaciones.length === 0) {
        mergeCellsResolved(s, row, 1, row, 6);
        dataCell(s.getCell(row, 1), 'Sin acciones prioritarias adicionales.', { color: SG_MUTED });
        row += 2;
    } else {
        summary.recomendaciones.forEach((rec, i) => {
            dataCell(s.getCell(row, 1), `${i + 1}.`, { align: 'right', bold: true, color: SG_PRIMARY });
            mergeCellsResolved(s, row, 2, row, 6);
            dataCell(s.getCell(row, 2), rec, {});
            s.getCell(row, 2).alignment = { wrapText: true, vertical: 'middle' };
            s.getRow(row).height = 28;
            row++;
        });
        row++;
    }

    sectionHeader(s, row++, 'Indicadores globales');
    const kpiLabels = ['PROMEDIO GLOBAL', 'MÁXIMO', 'MÍNIMO', '% ÉXITO (>300)'];
    const kpiVals = [
        inst.avg,
        inst.max,
        inst.min,
        `${((evaluatedCount > 0 ? ranking.filter(e => (e.puntaje_global || 0) >= 300).length / evaluatedCount : 0) * 100).toFixed(1)}%`,
    ];
    tableHeader(s, row++, kpiLabels, 2);
    kpiVals.forEach((v, i) => {
        dataCell(s.getCell(row, 2 + i), v, { align: 'center', bold: true, size: 12 });
    });
    row += 2;

    sectionHeader(s, row++, 'Rendimiento por áreas');
    const areaHdr = row++;
    tableHeader(s, areaHdr, ['ÁREA', 'PROM.', 'DSV.', 'VISUALIZACIÓN'], 2);
    inst.subjectStats.forEach((area, i) => {
        const r = areaHdr + 1 + i;
        dataCell(s.getCell(r, 2), area.name, { bold: true });
        dataCell(s.getCell(r, 3), area.avg, { align: 'right', numFmt: NUM_FMT.int });
        dataCell(s.getCell(r, 4), area.stdDev, { align: 'right' });
        dataCell(s.getCell(r, 5), barVisualization(area.avg / 100), {
            align: 'left',
            color: area.avg >= 65 ? SG_SUCCESS : area.avg >= 45 ? SG_WARN : SG_DANGER,
        });
    });
    if (inst.subjectStats.length) {
        applyDataBar(s, `C${areaHdr + 1}:C${areaHdr + inst.subjectStats.length}`, SG_PRIMARY, 1);
    }
    row = areaHdr + inst.subjectStats.length + 2;

    sectionHeader(s, row++, 'Mapa de calor — distribución por área');
    const heatHdr = row++;
    tableHeader(s, heatHdr, ['ÁREA', 'BAJO', 'BÁSICO', 'ALTO', 'SUPERIOR'], 2);
    inst.subjectStats.forEach((area, i) => {
        const scores = inst.students.map(st => {
            const raw = st.puntajes?.[area.key];
            if (raw == null) return 0;
            if (typeof raw === 'number') return raw;
            return Number((raw as { puntaje?: number }).puntaje) || 0;
        }).filter(p => p > 0);
        const n = scores.length || 1;
        let bajo = 0, basico = 0, alto = 0, superior = 0;
        scores.forEach(p => {
            if (p <= 30) bajo++;
            else if (p <= 60) basico++;
            else if (p <= 80) alto++;
            else superior++;
        });
        const r = heatHdr + 1 + i;
        dataCell(s.getCell(r, 2), area.name, { bold: true });
        dataCell(s.getCell(r, 3), bajo / n, { align: 'right', numFmt: NUM_FMT.pct, color: SG_DANGER });
        dataCell(s.getCell(r, 4), basico / n, { align: 'right', numFmt: NUM_FMT.pct });
        dataCell(s.getCell(r, 5), alto / n, { align: 'right', numFmt: NUM_FMT.pct });
        dataCell(s.getCell(r, 6), superior / n, { align: 'right', numFmt: NUM_FMT.pct, color: SG_SUCCESS });
    });
}

export function sheetPotencialMejora(wb: ExcelJS.Workbook, students: Estudiante[], reportMeta: string) {
    const rows = computePotencialRows(students);
    const s = wb.addWorksheet('Potencial de Mejora', {
        properties: { tabColor: { argb: tabColorForGroup('estudiantes') } },
    });
    setBrandTitle(s, 'Plan de Potencial de Mejora', reportMeta);
    const headers = [
        'Pos.',
        'Id',
        'Nombre',
        'Global',
        'Pot. Lectura',
        'Pot. Matemáticas',
        'Pot. Sociales',
        'Pot. Ciencias',
        'Pot. Inglés',
        'Total potencial',
    ];
    headers.forEach((_, i) => {
        s.getColumn(i + 1).width = i === 2 ? 22 : i === 9 ? 14 : 10;
    });
    const hdr = BRAND_CONTENT_START_ROW;
    tableHeader(s, hdr, headers, 1);
    rows.forEach((row, idx) => {
        const r = hdr + 1 + idx;
        let c = 1;
        dataCell(s.getCell(r, c++), idx + 1, { align: 'right' });
        dataCell(s.getCell(r, c++), row.id, {});
        dataCell(s.getCell(r, c++), row.nombre, {});
        dataCell(s.getCell(r, c++), row.global, { align: 'right', bold: true });
        dataCell(s.getCell(r, c++), row.potencialLec, { align: 'right' });
        dataCell(s.getCell(r, c++), row.potencialMat, { align: 'right' });
        dataCell(s.getCell(r, c++), row.potencialSoc, { align: 'right' });
        dataCell(s.getCell(r, c++), row.potencialCie, { align: 'right' });
        dataCell(s.getCell(r, c++), row.potencialIng, { align: 'right' });
        dataCell(s.getCell(r, c++), row.totalPotencial, { align: 'right', bold: true, color: SG_PRIMARY });
    });
    const last = hdr + rows.length;
    if (rows.length) {
        applyDataBar(s, `E${hdr + 1}:I${last}`, 'FF06B6D4', 1);
        applyColorScale(s, `J${hdr + 1}:J${last}`, 2);
        applyAutoFilter(s, hdr, headers.length, last);
        applyTableFreeze(s, hdr, 2);
    }
}

export function sheetAnalisisPsicometrico(
    wb: ExcelJS.Workbook,
    questionAnalysis: Record<string, QuestionStat[]>,
    students: Estudiante[],
    reportMeta: string
) {
    const rows = computePsychometricRows(questionAnalysis, students);
    const s = wb.addWorksheet('Análisis Psicométrico', {
        properties: { tabColor: { argb: tabColorForGroup('analisis') } },
    });
    setBrandTitle(s, 'Análisis Psicométrico de Ítems', reportMeta);
    const headers = [
        'Pregunta',
        'Área',
        'Clave',
        '% Acierto',
        '% Error',
        'Discriminación',
        'Poder discriminativo',
        'Desviación',
        'Varianza',
        'Evaluados',
    ];
    headers.forEach((_, i) => {
        s.getColumn(i + 1).width = i === 1 ? 18 : i === 6 ? 16 : 10;
    });
    const hdr = BRAND_CONTENT_START_ROW;
    sectionHeader(
        s,
        hdr,
        rows[0]?.degraded
            ? 'Modo agregado (sin respuestas por estudiante — discriminación limitada)'
            : 'Modo completo con respuestas detalladas por estudiante'
    );
    const tableRow = hdr + 1;
    tableHeader(s, tableRow, headers, 1);
    if (rows.length === 0) {
        dataCell(
            s.getCell(tableRow + 1, 1),
            'No hay ítems con datos agregados para este alcance. Verifique que el simulacro incluya análisis por pregunta.',
            { color: SG_MUTED, wrap: true }
        );
        mergeCellsResolved(s, tableRow + 1, 1, tableRow + 1, headers.length);
        return;
    }
    rows.forEach((row: PsychometricItemRow, idx) => {
        const r = tableRow + 1 + idx;
        dataCell(s.getCell(r, 1), questionLabel(row.num), {});
        dataCell(s.getCell(r, 2), row.materia, { bold: true });
        dataCell(s.getCell(r, 3), row.clave, { align: 'center', color: SG_SUCCESS });
        dataCell(s.getCell(r, 4), row.pctAcierto, { align: 'right', numFmt: NUM_FMT.pct2 });
        dataCell(s.getCell(r, 5), row.pctError, { align: 'right', numFmt: NUM_FMT.pct2, color: SG_DANGER });
        dataCell(s.getCell(r, 6), row.discriminacion ?? NOT_APPLICABLE, {
            align: 'right',
            numFmt: row.discriminacion != null ? NUM_FMT.decimal : undefined,
        });
        const poderColor =
            row.poderDiscriminativo === 'Excelente'
                ? SG_SUCCESS
                : row.poderDiscriminativo === 'Pobre'
                  ? SG_DANGER
                  : SG_TEXT;
        dataCell(s.getCell(r, 7), row.poderDiscriminativo, { align: 'center', color: poderColor, bold: true });
        dataCell(s.getCell(r, 8), row.desviacion, { align: 'right', numFmt: NUM_FMT.decimal });
        dataCell(s.getCell(r, 9), row.varianza, { align: 'right', numFmt: NUM_FMT.decimal });
        dataCell(s.getCell(r, 10), row.total, { align: 'right' });
    });
    const last = tableRow + rows.length;
    if (rows.length) {
        applyDataBar(s, `D${tableRow + 1}:D${last}`, SG_SUCCESS, 1);
        applyDataBar(s, `E${tableRow + 1}:E${last}`, SG_DANGER, 2);
        applyAutoFilter(s, tableRow, headers.length, last);
        applyTableFreeze(s, tableRow, 1);
    }
}

export function sheetSesionesIncompletas(wb: ExcelJS.Workbook, students: Estudiante[], reportMeta: string) {
    const s = wb.addWorksheet('Sesiones Incompletas', {
        properties: { tabColor: { argb: tabColorForGroup('seguimiento') } },
    });
    setBrandTitle(s, 'Registro de estudiantes con sesiones pendientes', reportMeta);
    s.getColumn(1).width = 4;
    s.getColumn(2).width = 18;
    s.getColumn(3).width = 24;
    s.getColumn(4).width = 18;
    const hdr = BRAND_CONTENT_START_ROW;
    tableHeader(s, hdr, ['Id', 'Nombre', 'Sesiones faltantes'], 2);
    let row = hdr + 1;
    students.forEach(est => {
        const ses =
            (est as Estudiante & { secciones_completadas?: string[] }).secciones_completadas ||
            (est as Estudiante & { sesiones?: string[] }).sesiones ||
            [];
        const norm = ses.map(x => String(x).toUpperCase());
        const s1 = norm.some(x => x === 'S1' || x.includes('1'));
        const s2 = norm.some(x => x === 'S2' || x.includes('2'));
        if (s1 && s2) return;
        const missing: string[] = [];
        if (!s1) missing.push('Sesión 1');
        if (!s2) missing.push('Sesión 2');
        dataCell(s.getCell(row, 2), est.informacion_personal?.numero_identificacion, {});
        dataCell(
            s.getCell(row, 3),
            `${est.informacion_personal?.nombres || ''} ${est.informacion_personal?.apellidos || ''}`.trim() ||
                NOT_APPLICABLE,
            {}
        );
        dataCell(s.getCell(row, 4), missing.join(', '), { color: SG_WARN, bold: true });
        row++;
    });
    if (row === hdr + 1) {
        dataCell(s.getCell(row, 2), 'Todos los estudiantes completaron ambas sesiones.', { color: SG_MUTED });
    } else {
        applyAutoFilter(s, hdr, 3, row - 1);
        applyTableFreeze(s, hdr, 1);
    }
}
