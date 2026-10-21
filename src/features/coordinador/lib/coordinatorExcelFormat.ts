/**
 * Estilos compartidos del export Excel coordinador (sin dependencias circulares).
 */
import type ExcelJS from 'exceljs';
import {
    displayMetric,
    displayText,
    isBlank,
    MISSING_TEXT,
    NOT_APPLICABLE,
} from '@features/coordinador/lib/coordinatorExcelValues';

export const SG_PRIMARY = 'FF1E3A5F';
export const SG_PRIMARY_LIGHT = 'FFE8EEF4';
export const SG_TEXT = 'FF0F172A';
export const SG_MUTED = 'FF64748B';
export const SG_DANGER = 'FFB91C1C';
export const SG_WARN = 'FFD97706';
export const SG_SUCCESS = 'FF047857';
export const SG_HEADER_BG = 'FF0F172A';
export const SG_CYAN = 'FF0891B2';
export const SG_SURFACE = 'FFF8FAFC';
export const SG_BORDER = 'FFE2E8F0';
export const SG_INFO = 'FF0369A1';
export const SG_NEUTRAL = 'FF94A3B8';
export const SG_LOW_RISK = 'FF15803D';
export const SG_HIGH_RISK = 'FFB91C1C';

/** Colores oficiales por nivel ICFES (1–4). */
export const SG_NIVEL_ICFES: Record<1 | 2 | 3 | 4, string> = {
    1: 'FFB91C1C',
    2: 'FFD97706',
    3: 'FF0369A1',
    4: 'FF047857',
};

export const SG_NIVEL_ICFES_BG: Record<1 | 2 | 3 | 4, string> = {
    1: 'FFFEE2E2',
    2: 'FFFFEDD5',
    3: 'FFDBEAFE',
    4: 'FFD1FAE5',
};

export type DataCellKind = 'text' | 'metric' | 'raw';
export type QualityBadgeState = 'Completo' | 'Parcial' | 'Sin dato' | 'No aplica';

/** Columnas de merge para título/sección (compacto; el layout recorta el resto). */
export const BRAND_MERGE_END_COL = 12;

/** Fila de barra «← Índice / Portada» (tras cabecera de marca). */
export const BRAND_NAV_ROW = 4;

/** Primera fila de contenido de la hoja (debajo de cabecera + navegación). */
export const BRAND_CONTENT_START_ROW = 5;

export type TabGroup =
    | 'portada'
    | 'resumen'
    | 'estudiantes'
    | 'analisis'
    | 'seguimiento'
    | 'benchmark'
    | 'pedagogico'
    | 'datos'
    | 'visual'
    | 'referencia';

const TAB_COLORS: Record<TabGroup, string> = {
    portada: SG_PRIMARY,
    resumen: 'FF334155',
    estudiantes: 'FF475569',
    analisis: 'FF1E40AF',
    seguimiento: SG_DANGER,
    benchmark: SG_CYAN,
    pedagogico: SG_INFO,
    datos: 'FF64748B',
    visual: SG_CYAN,
    referencia: SG_MUTED,
};

export function tabColorForGroup(group: TabGroup): string {
    return TAB_COLORS[group] ?? SG_PRIMARY;
}

export const NUM_FMT = {
    int: '#,##0',
    pct: '0.0%',
    pct2: '0.00%',
    decimal: '0.00',
    score: '#,##0',
} as const;

/**
 * Aplica merge deshaciendo antes cualquier merge que intersecte el rango.
 * ExcelJS lanza si el rango toca celdas ya mergeadas (p. ej. cabecera de marca en fila 4).
 */
export function mergeCellsResolved(
    sheet: ExcelJS.Worksheet,
    top: number,
    left: number,
    bottom: number,
    right: number
) {
    sheet.unMergeCells(top, left, bottom, right);
    sheet.mergeCells(top, left, bottom, right);
}

export function setBrandTitle(sheet: ExcelJS.Worksheet, title: string, subtitle: string) {
    const endCol = BRAND_MERGE_END_COL;
    mergeCellsResolved(sheet, 1, 1, 1, endCol);
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Seamos Genios · ${title}`;
    titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SG_HEADER_BG },
    };
    sheet.getRow(1).height = 28;

    const metaLines = subtitle
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .slice(0, 2);
    if (!metaLines.length) metaLines.push(subtitle.trim());

    metaLines.forEach((line, i) => {
        const rowNum = 2 + i;
        mergeCellsResolved(sheet, rowNum, 1, rowNum, endCol);
        const cell = sheet.getCell(rowNum, 1);
        cell.value = line;
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FFCBD5E1' } };
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: SG_HEADER_BG },
        };
        const wrappedLines = Math.max(1, Math.ceil(line.length / 95));
        sheet.getRow(rowNum).height = Math.min(44, 16 + wrappedLines * 12);
    });

    const navRow = BRAND_NAV_ROW;
    mergeCellsResolved(sheet, navRow, 1, navRow, endCol);
    sheet.getCell(navRow, 1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SG_HEADER_BG },
    };
    sheet.getRow(navRow).height = 6;
}

export function sectionHeader(
    sheet: ExcelJS.Worksheet,
    row: number,
    text: string,
    endCol: number = BRAND_MERGE_END_COL
) {
    mergeCellsResolved(sheet, row, 1, row, endCol);
    const cell = sheet.getCell(row, 1);
    cell.value = text;
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: SG_PRIMARY } };
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SG_PRIMARY_LIGHT } };
    cell.border = {
        bottom: { style: 'medium', color: { argb: SG_PRIMARY } },
    };
    sheet.getRow(row).height = 22;
}

export function tableHeader(
    sheet: ExcelJS.Worksheet,
    row: number,
    columns: string[],
    startCol = 1
) {
    columns.forEach((label, i) => {
        const cell = sheet.getCell(row, startCol + i);
        cell.value = label;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: SG_HEADER_BG },
        };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF374151' } },
            bottom: { style: 'thin', color: { argb: 'FF374151' } },
            left: { style: 'thin', color: { argb: 'FF374151' } },
            right: { style: 'thin', color: { argb: 'FF374151' } },
        };
    });
    sheet.getRow(row).height = 20;
}

export function dataCell(
    cell: ExcelJS.Cell,
    value: ExcelJS.CellValue,
    opts: {
        bold?: boolean;
        color?: string;
        align?: 'left' | 'center' | 'right';
        bg?: string;
        size?: number;
        wrap?: boolean;
        numFmt?: string;
        kind?: DataCellKind;
        fallback?: string;
    } = {}
) {
    const kind =
        opts.kind ??
        (typeof value === 'number' || typeof value === 'boolean' || (value && typeof value === 'object')
            ? 'raw'
            : 'text');
    let finalValue: ExcelJS.CellValue = value;
    if (kind === 'text') {
        finalValue = displayText(value, opts.fallback ?? MISSING_TEXT);
    } else if (kind === 'metric') {
        finalValue = displayMetric(value, opts.fallback ?? NOT_APPLICABLE);
    } else if (isBlank(value)) {
        finalValue = opts.fallback ?? MISSING_TEXT;
    }
    cell.value = finalValue;
    cell.font = {
        name: 'Calibri',
        size: opts.size ?? 10,
        bold: opts.bold,
        color: { argb: opts.color ?? SG_TEXT },
    };
    const textLen =
        typeof finalValue === 'string'
            ? finalValue.length
            : typeof finalValue === 'number'
              ? String(finalValue).length
              : 0;
    const shouldWrap = opts.wrap ?? textLen > 48;
    cell.alignment = {
        horizontal: opts.align ?? 'left',
        vertical: shouldWrap ? 'top' : 'middle',
        wrapText: shouldWrap,
    };
    cell.border = {
        bottom: { style: 'thin', color: { argb: SG_BORDER } },
    };
    if (opts.bg) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.bg } };
    }
    if (opts.numFmt) {
        cell.numFmt = opts.numFmt;
    }
}

/** Tarjeta KPI (label arriba, valor grande, subtítulo opcional). Ocupa 2 columnas x 3 filas. */
export function kpiCard(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    startCol: number,
    label: string,
    value: string | number,
    accentColor: string = SG_PRIMARY,
    sub?: string
) {
    const endCol = startCol + 1;
    const endRow = startRow + 2;
    mergeCellsResolved(sheet, startRow, startCol, endRow, endCol);

    const cell = sheet.getCell(startRow, startCol);
    const lines = [label, String(value), sub || ''].filter(Boolean);
    cell.value = lines.join('\n');
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SG_SURFACE } };
    cell.border = {
        top: { style: 'thin', color: { argb: accentColor } },
        left: { style: 'thin', color: { argb: SG_BORDER } },
        bottom: { style: 'thin', color: { argb: SG_BORDER } },
        right: { style: 'thin', color: { argb: SG_BORDER } },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.font = { name: 'Calibri', size: 9, color: { argb: SG_MUTED } };

    // Rich text simulation via note: ExcelJS richText on merged cells is cleaner
    cell.value = {
        richText: [
            { font: { name: 'Calibri', size: 9, color: { argb: SG_MUTED } }, text: `${label}\n` },
            {
                font: { name: 'Calibri', size: 18, bold: true, color: { argb: accentColor } },
                text: String(value),
            },
            ...(sub
                ? [{ font: { name: 'Calibri', size: 8, color: { argb: SG_MUTED } }, text: `\n${sub}` }]
                : []),
        ],
    };
    sheet.getRow(startRow).height = 28;
    sheet.getRow(startRow + 1).height = 28;
    sheet.getRow(startRow + 2).height = 16;
    sheet.getColumn(startCol).width = 11;
    sheet.getColumn(endCol).width = 11;
}

/** Data bar nativo (Excel) sobre un rango A1-style. */
export function applyDataBar(
    sheet: ExcelJS.Worksheet,
    range: string,
    colorArgb: string = SG_PRIMARY,
    priority = 1
) {
    sheet.addConditionalFormatting({
        ref: range,
        rules: [
            {
                type: 'dataBar',
                priority,
                gradient: true,
                showValue: true,
                cfvo: [{ type: 'min' }, { type: 'max' }],
                color: { argb: colorArgb },
            } as ExcelJS.DataBarRuleType,
        ],
    });
}

/** Escala de color 3 tonos (rojo → amarillo → verde). */
export function applyColorScale(
    sheet: ExcelJS.Worksheet,
    range: string,
    priority = 1
) {
    sheet.addConditionalFormatting({
        ref: range,
        rules: [
            {
                type: 'colorScale',
                priority,
                cfvo: [{ type: 'min' }, { type: 'percentile', value: 50 }, { type: 'max' }],
                color: [
                    { argb: 'FFFECACA' },
                    { argb: 'FFFEF08A' },
                    { argb: 'FFBBF7D0' },
                ],
            },
        ],
    });
}

/** Regla expresión: resalta celda si valor cumple condición (p. ej. resultado incorrecto). */
export function applyExpressionRule(
    sheet: ExcelJS.Worksheet,
    range: string,
    formula: string,
    bg: string,
    priority: number
) {
    sheet.addConditionalFormatting({
        ref: range,
        rules: [
            {
                type: 'expression',
                priority,
                formulae: [formula],
                style: {
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
                },
            },
        ],
    });
}

export function applyAutoFilter(sheet: ExcelJS.Worksheet, headerRow: number, lastCol: number, lastRow: number) {
    if (lastRow <= headerRow) return;
    sheet.autoFilter = {
        from: { row: headerRow, column: 1 },
        to: { row: lastRow, column: lastCol },
    };
}

export function applyTableFreeze(
    sheet: ExcelJS.Worksheet,
    headerRow: number,
    freezeCols = 0
) {
    sheet.views = [{ state: 'frozen', xSplit: freezeCols, ySplit: headerRow }];
}

/** Nota metodológica bajo encabezado de sección. */
export function methodologyNote(
    sheet: ExcelJS.Worksheet,
    row: number,
    text: string,
    endCol: number = BRAND_MERGE_END_COL
) {
    mergeCellsResolved(sheet, row, 1, row, endCol);
    const cell = sheet.getCell(row, 1);
    cell.value = text;
    cell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: SG_MUTED } };
    cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true, indent: 1 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SG_SURFACE } };
    sheet.getRow(row).height = Math.min(48, 18 + Math.ceil(text.length / 80) * 12);
}

const BADGE_COLORS: Record<QualityBadgeState, string> = {
    Completo: SG_SUCCESS,
    Parcial: SG_WARN,
    'Sin dato': SG_NEUTRAL,
    'No aplica': SG_MUTED,
};

export function qualityBadge(cell: ExcelJS.Cell, state: QualityBadgeState) {
    dataCell(cell, state, {
        kind: 'raw',
        align: 'center',
        bold: true,
        color: BADGE_COLORS[state],
        bg: 'FFF9FAFB',
    });
}

const SEVERITY_COLORS: Record<string, { fg: string; bg: string }> = {
    critico: { fg: SG_DANGER, bg: 'FFFEE2E2' },
    alto: { fg: SG_WARN, bg: 'FFFFEDD5' },
    moderado: { fg: 'FFCA8A04', bg: 'FFFEF9C3' },
    monitoreo: { fg: SG_INFO, bg: 'FFDBEAFE' },
    ok: { fg: SG_SUCCESS, bg: 'FFD1FAE5' },
};

/** Badge de severidad pedagógica (critico, alto, moderado…). */
export function severityBadge(cell: ExcelJS.Cell, severity: string) {
    const key = severity.toLowerCase();
    const palette = SEVERITY_COLORS[key] ?? { fg: SG_MUTED, bg: SG_SURFACE };
    dataCell(cell, severity, {
        kind: 'text',
        align: 'center',
        bold: true,
        color: palette.fg,
        bg: palette.bg,
    });
}

/** Badge de nivel ICFES (1–4) con color oficial. */
export function nivelIcfesBadge(cell: ExcelJS.Cell, nivel: 1 | 2 | 3 | 4, label: string) {
    dataCell(cell, label, {
        kind: 'text',
        align: 'center',
        bold: true,
        color: SG_NIVEL_ICFES[nivel],
        bg: SG_NIVEL_ICFES_BG[nivel],
    });
}

export function scoreCell(
    cell: ExcelJS.Cell,
    score: number | string,
    scale: 100 | 500 = 100,
    opts: { bold?: boolean; align?: 'left' | 'center' | 'right' } = {}
) {
    if (typeof score === 'string') {
        dataCell(cell, score, { kind: 'text', align: opts.align ?? 'right', bold: opts.bold });
        return;
    }
    const pct = scale === 500 ? score / 500 : score / 100;
    const color =
        pct >= 0.8 ? SG_SUCCESS : pct >= 0.65 ? SG_INFO : pct >= 0.45 ? SG_WARN : score > 0 ? SG_DANGER : SG_MUTED;
    dataCell(cell, score, {
        kind: 'raw',
        align: opts.align ?? 'right',
        bold: opts.bold ?? true,
        color,
        numFmt: NUM_FMT.int,
    });
}

export interface CompactKpiItem {
    label: string;
    value: string | number;
    sub?: string;
    accent?: string;
}

/** Grid KPI denso: 2 columnas x N filas, 4 KPIs por bloque. */
export function compactKpiGrid(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    startCol: number,
    items: CompactKpiItem[]
) {
    items.forEach((item, i) => {
        const col = startCol + (i % 2) * 3;
        const row = startRow + Math.floor(i / 2) * 4;
        kpiCard(sheet, row, col, item.label, item.value, item.accent ?? SG_PRIMARY, item.sub);
    });
}

export function buildReportMeta(
    instName: string,
    simulationId: string,
    evaluated: number,
    registered: number
): string {
    const scope = instName.toUpperCase().includes('TODAS')
        ? 'Todas las instituciones (vista agregada)'
        : instName;
    const generated = new Date().toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
    return [
        `Análisis de ${evaluated} estudiantes evaluados (de ${registered} registrados) — ${simulationId}`,
        `Marco Saber 11 (MEN–ICFES) · Generado ${generated} · Alcance: ${scope} · ${registered} estudiantes en archivo`,
    ].join('\n');
}

export function barVisualization(ratio: number, width = 12): string {
    const r = Math.min(1, Math.max(0, ratio));
    const filled = Math.round(r * width);
    return '█'.repeat(filled) + (filled < width ? '░'.repeat(width - filled) : '');
}

export { questionLabel } from '@/lib/questionLabel';
