/**
 * Hoja unificada de análisis por ítem (críticas + distribución + psicométrico + segmentación).
 */
import type ExcelJS from 'exceljs';
import type { Estudiante } from '@shared/types';
import type { QuestionStat } from '@features/coordinador/hooks/useCoordinadorData';
import { computePsychometricRows } from '@features/coordinador/lib/coordinatorExcelPsychometrics';
import { segmentacionRows } from '@features/coordinador/lib/coordinatorExcelAnalytics';
import {
    setBrandTitle,
    sectionHeader,
    tableHeader,
    dataCell,
    questionLabel,
    tabColorForGroup,
    BRAND_CONTENT_START_ROW,
    NUM_FMT,
    SG_PRIMARY,
    SG_TEXT,
    SG_MUTED,
    SG_DANGER,
    SG_SUCCESS,
    SG_WARN,
    applyDataBar,
    applyAutoFilter,
    applyTableFreeze,
} from '@features/coordinador/lib/coordinatorExcelFormat';
import { NOT_APPLICABLE, safePct } from '@features/coordinador/lib/coordinatorExcelValues';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
const CRITICAL_MIN_RATE = 0.4;

export function hasItemAnalysisData(questionAnalysis: Record<string, QuestionStat[]>): boolean {
    return Object.values(questionAnalysis).some(items => items.some(q => q.total > 0));
}

function difficultyFromFailRate(rate: number): { label: string; color: string } {
    const pct = rate * 100;
    if (pct >= 80) return { label: 'Muy difícil', color: SG_DANGER };
    if (pct >= 50) return { label: 'Difícil', color: SG_WARN };
    if (pct >= 20) return { label: 'Media', color: 'FF2563EB' };
    if (pct > 0) return { label: 'Fácil', color: SG_SUCCESS };
    return { label: 'Muy fácil', color: SG_SUCCESS };
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

function collectCriticalItems(questionAnalysis: Record<string, QuestionStat[]>) {
    const critical: { materia: string; q: QuestionStat }[] = [];
    Object.entries(questionAnalysis).forEach(([materia, items]) => {
        (items || []).forEach(q => {
            if (q.rate >= CRITICAL_MIN_RATE && q.total > 0) critical.push({ materia, q });
        });
    });
    critical.sort((a, b) => b.q.rate - a.q.rate);
    return critical;
}

function psychometricLookup(students: Estudiante[], questionAnalysis: Record<string, QuestionStat[]>) {
    const map = new Map<string, ReturnType<typeof computePsychometricRows>[number]>();
    computePsychometricRows(questionAnalysis, students).forEach(row => {
        map.set(`${row.materia}:${row.num}`, row);
    });
    return map;
}

export function sheetAnalisisItemsUnificado(
    wb: ExcelJS.Workbook,
    questionAnalysis: Record<string, QuestionStat[]>,
    students: Estudiante[],
    reportMeta: string,
    instLabel: string
) {
    if (!hasItemAnalysisData(questionAnalysis)) return;

    const s = wb.addWorksheet('Análisis por ítem', {
        properties: { tabColor: { argb: tabColorForGroup('analisis') } },
    });
    setBrandTitle(
        s,
        'Análisis por ítem',
        `${instLabel} · críticas, distribución, psicométrico y distractores\n${reportMeta.split('\n')[0] || reportMeta}`
    );

    const colWidths = [14, 10, 10, 10, 10, 9, 9, 9, 9, 9, 9, 12, 11, 14, 10, 10];
    colWidths.forEach((w, i) => (s.getColumn(i + 1).width = w));

    const psycho = psychometricLookup(students, questionAnalysis);
    const hasDetailed = [...psycho.values()].some(r => !r.degraded);
    let row = BRAND_CONTENT_START_ROW;

    sectionHeader(
        s,
        row++,
        hasDetailed
            ? 'Vista consolidada — respuestas detalladas por estudiante'
            : 'Vista consolidada — estadísticas agregadas del simulacro'
    );

    const critical = collectCriticalItems(questionAnalysis);
    if (critical.length) {
        sectionHeader(s, row++, `Preguntas críticas (tasa de fallo ≥ ${CRITICAL_MIN_RATE * 100}%)`);
        tableHeader(
            s,
            row++,
            [
                'Área',
                'Pregunta',
                'Tasa fallo',
                'N',
                'Riesgo',
                'Correcta',
                'Distractor',
                'Interpretación',
                'Acción',
            ],
            1
        );
        const critStart = row;
        critical.forEach(({ materia, q }) => {
            const risk =
                q.rate >= 0.8 ? 'Crítico' : q.rate >= 0.6 ? 'Alto' : q.rate >= 0.5 ? 'Moderado' : 'Atención';
            dataCell(s.getCell(row, 1), materia, { bold: true });
            dataCell(s.getCell(row, 2), questionLabel(q.num), { align: 'center' });
            dataCell(s.getCell(row, 3), safePct(q.failed ?? Math.round(q.rate * q.total), q.total), {
                align: 'right',
                bold: true,
                color: SG_DANGER,
            });
            dataCell(s.getCell(row, 4), q.total, { align: 'right' });
            dataCell(s.getCell(row, 5), risk, { align: 'center' });
            dataCell(s.getCell(row, 6), String(q.correct || '?').toUpperCase().slice(0, 1), {
                align: 'center',
                color: SG_SUCCESS,
            });
            dataCell(s.getCell(row, 7), strongestDistractor(q), {});
            dataCell(
                s.getCell(row, 8),
                q.rate >= 0.6 ? 'Error mayoritario: revisar prerrequisito' : 'Error frecuente: reforzar ítem análogo',
                { wrap: true }
            );
            dataCell(s.getCell(row, 9), `Retroalimentación guiada en ${materia}`, { wrap: true, color: SG_MUTED });
            row++;
        });
        applyDataBar(s, `C${critStart}:C${row - 1}`, SG_DANGER, 1);
        row++;
    }

    const materias = Object.keys(questionAnalysis).sort();
    materias.forEach(materia => {
        const items = (questionAnalysis[materia] || []).filter(q => q.total > 0);
        if (!items.length) return;

        sectionHeader(s, row++, `${materia} · ${items.length} ítems`);
        tableHeader(
            s,
            row++,
            [
                '#',
                'Correcta',
                'Total',
                'Aciertos',
                '% Acierto',
                '% A',
                '% B',
                '% C',
                '% D',
                '% E',
                '% F',
                'Dificultad',
                'Discrim.',
                'Poder',
                'Desv.',
            ],
            1
        );
        const tableStart = row;
        items.forEach(q => {
            const aciertos = Math.max(0, q.total - q.failed);
            const pctAcierto = q.total > 0 ? (aciertos / q.total) * 100 : 0;
            const diff = difficultyFromFailRate(q.rate);
            const correctLetter = String(q.correct || '?').trim().toUpperCase().slice(0, 1);
            const pm = psycho.get(`${materia}:${q.num}`);

            dataCell(s.getCell(row, 1), q.num, { align: 'center', bold: true });
            dataCell(s.getCell(row, 2), correctLetter, { align: 'center', bold: true, color: SG_SUCCESS });
            dataCell(s.getCell(row, 3), q.total, { align: 'right' });
            dataCell(s.getCell(row, 4), aciertos, { align: 'right' });
            dataCell(s.getCell(row, 5), `${pctAcierto.toFixed(1)}%`, {
                align: 'right',
                bold: true,
                color: pctAcierto < 50 ? SG_DANGER : SG_TEXT,
            });

            OPTION_LABELS.forEach((opt, oi) => {
                const count = q.counts?.[opt] || q.counts?.[opt.toLowerCase()] || 0;
                const pct = q.total > 0 ? (count / q.total) * 100 : 0;
                const isCorrect = opt === correctLetter;
                dataCell(s.getCell(row, 6 + oi), `${pct.toFixed(1)}%`, {
                    align: 'right',
                    bold: isCorrect,
                    color: isCorrect ? SG_SUCCESS : SG_TEXT,
                    bg: isCorrect ? 'FFDCFCE7' : count > 0 ? 'FFF3F4F6' : undefined,
                });
            });

            dataCell(s.getCell(row, 12), diff.label, { align: 'center', color: diff.color, bold: true });
            dataCell(s.getCell(row, 13), pm?.discriminacion ?? NOT_APPLICABLE, {
                align: 'right',
                numFmt: pm?.discriminacion != null ? NUM_FMT.decimal : undefined,
            });
            const poderColor =
                pm?.poderDiscriminativo === 'Excelente'
                    ? SG_SUCCESS
                    : pm?.poderDiscriminativo === 'Pobre'
                      ? SG_DANGER
                      : SG_TEXT;
            dataCell(s.getCell(row, 14), pm?.poderDiscriminativo ?? NOT_APPLICABLE, {
                align: 'center',
                color: poderColor,
                bold: true,
            });
            dataCell(s.getCell(row, 15), pm?.desviacion ?? NOT_APPLICABLE, {
                align: 'right',
                numFmt: pm ? NUM_FMT.decimal : undefined,
            });
            row++;
        });

        if (items.length) {
            applyAutoFilter(s, tableStart - 1, 15, row - 1);
        }
        row++;
    });

    const segRows = segmentacionRows(questionAnalysis);
    if (segRows.length) {
        sectionHeader(s, row++, 'Segmentación de errores — estudiantes por distractor');
        tableHeader(s, row++, ['Materia', 'Pregunta', 'Opción', 'Estudiantes (muestra)', 'Acción didáctica'], 1);
        segRows.forEach(r => {
            dataCell(s.getCell(row, 1), r.materia, { bold: true });
            dataCell(s.getCell(row, 2), r.num, { align: 'center' });
            dataCell(s.getCell(row, 3), r.opcion, { align: 'center', color: SG_DANGER });
            dataCell(s.getCell(row, 4), r.estudiantes || NOT_APPLICABLE, { wrap: true });
            dataCell(
                s.getCell(row, 5),
                `Retroalimentar distractor ${r.opcion}: explicar por qué no aplica`,
                { wrap: true, color: SG_MUTED }
            );
            s.getRow(row).height = 28;
            row++;
        });
    }

    applyTableFreeze(s, BRAND_CONTENT_START_ROW + 1, 1);
}
