/**
 * Fichas individuales por estudiante (condicional: 1 IE, ≤ umbral).
 */
import type ExcelJS from 'exceljs';
import type { Estudiante } from '@shared/types';
import type { ExtendedExcelContext } from '@features/coordinador/lib/coordinatorExcelExtended';
import { displayDocumentId, displayStudentName } from '@features/coordinador/lib/demoPrivacy';
import { AREA_KEYS } from '@features/coordinador/lib/coordinatorExcelAnalytics';
import { chartRadarAreas } from '@features/coordinador/lib/coordinatorExcelCharts';
import {
    setBrandTitle,
    sectionHeader,
    tableHeader,
    dataCell,
    applyDataBar,
    applyExpressionRule,
    BRAND_CONTENT_START_ROW,
    SG_SUCCESS,
    SG_DANGER,
    SG_MUTED,
    SG_PRIMARY,
    SG_WARN,
    questionLabel,
    tabColorForGroup,
    NUM_FMT,
} from '@features/coordinador/lib/coordinatorExcelFormat';

export const UMBRAL_FICHAS_ESTUDIANTE = 200;

function areaScore(est: Estudiante, key: string): number {
    const raw = est.puntajes?.[key];
    if (raw == null) return 0;
    if (typeof raw === 'number') return Math.round(raw);
    const p = Number((raw as { puntaje?: number }).puntaje);
    return Number.isFinite(p) ? Math.round(p) : 0;
}

function areaLabel(key: string): string {
    const map: Record<string, string> = {
        'matemáticas': 'Matemáticas',
        'lectura crítica': 'Lectura Crítica',
        'sociales y ciudadanas': 'Sociales y Ciudadanas',
        'ciencias naturales': 'Ciencias Naturales',
        inglés: 'Inglés',
    };
    return map[key] || key;
}

function countErrorsInArea(est: Estudiante, materia: string): number {
    const rd = (est as Estudiante & { respuestas_detalladas?: Record<string, unknown> }).respuestas_detalladas;
    const raw = rd?.[materia];
    if (!raw) return 0;
    let n = 0;
    const walk = (r: Record<string, unknown>) => {
        if (r.es_correcta === false) n += 1;
    };
    if (Array.isArray(raw)) {
        raw.forEach(itemRaw => {
            const item = itemRaw as unknown as Record<string, unknown>;
            walk(item);
        });
    } else if (typeof raw === 'object') {
        Object.values(raw as Record<string, unknown>).forEach(v => walk(v as Record<string, unknown>));
    }
    return n;
}

type DetailRow = {
    pregunta: string;
    area: string;
    tu: string;
    correcta: string;
    ok: boolean;
};

function extractDetailRows(est: Estudiante): DetailRow[] {
    const rd = (est as Estudiante & { respuestas_detalladas?: Record<string, unknown> }).respuestas_detalladas;
    if (!rd) return [];
    const rows: DetailRow[] = [];
    Object.entries(rd).forEach(([materia, raw]) => {
        const push = (num: number, tu: string, corr: string, ok: boolean) => {
            rows.push({
                pregunta: questionLabel(num),
                area: areaLabel(materia),
                tu: tu.toUpperCase().slice(0, 1),
                correcta: corr.toUpperCase().slice(0, 1),
                ok,
            });
        };
        if (Array.isArray(raw)) {
            raw.forEach(itemRaw => {
                const r = itemRaw as unknown as Record<string, unknown>;
                const num = Number(r.numero ?? r.num ?? 0);
                if (num <= 0) return;
                push(
                    num,
                    String(r.respuesta_estudiante ?? r.respuesta ?? '?'),
                    String(r.respuesta_correcta ?? r.correcta ?? '?'),
                    !!r.es_correcta
                );
            });
        } else if (typeof raw === 'object' && raw !== null) {
            Object.entries(raw as Record<string, unknown>).forEach(([k, v]) => {
                const num = Number(k);
                if (num <= 0) return;
                const r = v as Record<string, unknown>;
                push(
                    num,
                    String(r.respuesta_estudiante ?? r.respuesta ?? '?'),
                    String(r.respuesta_correcta ?? r.correcta ?? '?'),
                    !!r.es_correcta
                );
            });
        }
    });
    return rows.sort((a, b) => a.area.localeCompare(b.area, 'es') || a.pregunta.localeCompare(b.pregunta, 'es'));
}

function weakestArea(est: Estudiante): { key: string; score: number } | null {
    let best: { key: string; score: number } | null = null;
    AREA_KEYS.forEach(key => {
        const p = areaScore(est, key);
        if (p <= 0) return;
        if (!best || p < best.score) best = { key, score: p };
    });
    return best;
}

function embedChart(wb: ExcelJS.Workbook, sheet: ExcelJS.Worksheet, base64: string, col: number, row: number) {
    if (!base64) return;
    const id = wb.addImage({ base64, extension: 'png' });
    sheet.addImage(id, { tl: { col, row }, ext: { width: 320, height: 240 } });
}

export function shouldAppendStudentFichas(ctx: ExtendedExcelContext, threshold = UMBRAL_FICHAS_ESTUDIANTE): boolean {
    if (ctx.allInstitutions.length > 1) return false;
    if (ctx.registeredCount > threshold) return false;
    return ctx.exportStudents.some(
        s =>
            (s as Estudiante & { respuestas_detalladas?: Record<string, unknown> }).respuestas_detalladas &&
            Object.keys(
                (s as Estudiante & { respuestas_detalladas?: Record<string, unknown> }).respuestas_detalladas || {}
            ).length > 0
    );
}

export async function appendStudentFichas(
    ctx: ExtendedExcelContext,
    threshold = UMBRAL_FICHAS_ESTUDIANTE
): Promise<number> {
    if (!shouldAppendStudentFichas(ctx, threshold)) return 0;

    const { wb, reportMeta, exportStudents } = ctx;
    let count = 0;

    for (const est of exportStudents) {
        const score = Number(est.puntaje_global) || 0;
        if (score <= 0) continue;

        const id = est.informacion_personal?.numero_identificacion || '';
        const sheetName = `ID_${displayDocumentId(id).replace(/[^a-zA-Z0-9]/g, '')}`.slice(0, 31);
        if (wb.getWorksheet(sheetName)) continue;

        const s = wb.addWorksheet(sheetName, {
            properties: { tabColor: { argb: tabColorForGroup('estudiantes') } },
        });
        const nombre = displayStudentName(
            est.informacion_personal?.nombres,
            est.informacion_personal?.apellidos
        );

        setBrandTitle(s, `Reporte de Diagnóstico Personalizado`, `${nombre} · ${reportMeta.split('\n')[0]}`);

        s.getColumn(1).width = 4;
        s.getColumn(2).width = 22;
        s.getColumn(3).width = 14;
        s.getColumn(4).width = 14;
        s.getColumn(5).width = 14;
        s.getColumn(6).width = 14;

        const profileHeaderRow = BRAND_CONTENT_START_ROW;
        const profileDataStartRow = profileHeaderRow + 1;
        sectionHeader(s, profileHeaderRow, 'Perfil del estudiante');
        dataCell(s.getCell(profileDataStartRow, 2), 'Estudiante:', { bold: true });
        dataCell(s.getCell(profileDataStartRow, 3), nombre, { bold: true });
        dataCell(s.getCell(profileDataStartRow + 1, 2), 'ID:', { bold: true });
        dataCell(s.getCell(profileDataStartRow + 1, 3), displayDocumentId(id), {});
        dataCell(s.getCell(profileDataStartRow + 2, 2), 'Puntaje Global:', { bold: true });
        dataCell(s.getCell(profileDataStartRow + 2, 3), score, {
            bold: true,
            size: 14,
            color: SG_PRIMARY,
            align: 'center',
        });

        const radarData = AREA_KEYS.map(k => ({ label: areaLabel(k).split(' ')[0], value: areaScore(est, k) })).filter(
            d => d.value > 0
        );
        const radar = await chartRadarAreas(radarData, 'Perfil por área');
        if (radar?.base64) embedChart(wb, s, radar.base64, profileDataStartRow, 4);

        const areaHeaderRow = profileDataStartRow + 4;
        const areaTableRow = areaHeaderRow + 1;
        const areaDataStartRow = areaTableRow + 1;
        sectionHeader(s, areaHeaderRow, 'Resumen de desempeño por área');
        tableHeader(s, areaTableRow, ['Área', 'Nº Errores', 'Puntaje (0-100)'], 2);
        let r = areaDataStartRow;
        AREA_KEYS.forEach(key => {
            const pts = areaScore(est, key);
            if (pts <= 0) return;
            dataCell(s.getCell(r, 2), areaLabel(key), { bold: true });
            dataCell(s.getCell(r, 3), countErrorsInArea(est, key), { align: 'right' });
            dataCell(s.getCell(r, 4), pts, { align: 'right', bold: true });
            r++;
        });
        if (r > areaDataStartRow) {
            applyDataBar(s, `D${areaDataStartRow}:D${r - 1}`, SG_PRIMARY, 1);
        }

        const details = extractDetailRows(est);
        if (details.length) {
            sectionHeader(s, r + 1, 'Análisis detallado ítem por ítem');
            const hdr = r + 2;
            tableHeader(s, hdr, ['Pregunta', 'Área', 'Tu respuesta', 'Respuesta correcta', 'Resultado'], 2);
            let dr = hdr + 1;
            details.forEach(d => {
                dataCell(s.getCell(dr, 2), d.pregunta, {});
                dataCell(s.getCell(dr, 3), d.area, { color: SG_MUTED });
                dataCell(s.getCell(dr, 4), d.tu, { align: 'center', bold: !d.ok, color: d.ok ? SG_SUCCESS : SG_DANGER });
                dataCell(s.getCell(dr, 5), d.correcta, { align: 'center', color: SG_SUCCESS });
                dataCell(s.getCell(dr, 6), d.ok ? 'Correcto' : 'Incorrecto', {
                    align: 'center',
                    color: d.ok ? SG_SUCCESS : SG_DANGER,
                    bold: true,
                });
                dr++;
            });
            applyExpressionRule(
                s,
                `F${hdr + 1}:F${dr - 1}`,
                `INDIRECT("F"&ROW())="Incorrecto"`,
                'FFFEE2E2',
                2
            );
            applyExpressionRule(
                s,
                `F${hdr + 1}:F${dr - 1}`,
                `INDIRECT("F"&ROW())="Correcto"`,
                'FFDCFCE7',
                3
            );
            r = dr;
        }

        const weak = weakestArea(est);
        sectionHeader(s, r + 1, 'Plan de mejora sugerido');
        const planLines = weak
            ? [
                  `Priorizar refuerzo en ${areaLabel(weak.key)} (puntaje ${weak.score}/100).`,
                  'Repasar ítems incorrectos marcados en rojo arriba.',
                  'Meta próximo simulacro: +10 pts en el área débil.',
              ]
            : ['Mantener rutina de estudio balanceada en las cinco áreas.'];
        planLines.forEach((line, i) => {
            dataCell(s.getCell(r + 2 + i, 2), `• ${line}`, { wrap: true });
        });

        count += 1;
    }

    return count;
}
