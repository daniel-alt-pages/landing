/**
 * Ajuste de columnas/filas para evitar texto cortado en el export coordinador.
 */
import type ExcelJS from 'exceljs';

export interface LayoutOptions {
    minWidth?: number;
    maxWidth?: number;
    /** Filas de encabezado de marca (no recalcular altura agresiva). */
    headerRows?: number;
    padding?: number;
    /** Columnas vacías tras la última usada (ancho mínimo). */
    trailingPad?: number;
}

export type SheetLayoutProfile = 'executive' | 'wideTable' | 'audit' | 'chart' | 'studentFicha' | 'methodology';

export const LAYOUT_PROFILES: Record<SheetLayoutProfile, LayoutOptions> = {
    executive: { minWidth: 9, maxWidth: 32, padding: 1, trailingPad: 0, headerRows: 4 },
    wideTable: { minWidth: 8, maxWidth: 24, padding: 1, trailingPad: 0, headerRows: 4 },
    audit: { minWidth: 10, maxWidth: 22, padding: 1, trailingPad: 0, headerRows: 4 },
    chart: { minWidth: 4, maxWidth: 12, padding: 0, trailingPad: 1, headerRows: 3 },
    studentFicha: { minWidth: 9, maxWidth: 26, padding: 1, trailingPad: 0, headerRows: 10 },
    methodology: { minWidth: 10, maxWidth: 44, padding: 1, trailingPad: 0, headerRows: 3 },
};

const SHEET_PROFILE_MAP: Record<string, SheetLayoutProfile> = {
    Índice: 'executive',
    Portada: 'executive',
    'Resumen Ejecutivo': 'executive',
    'Estadísticas Avanzadas': 'wideTable',
    'Ranking Estudiantes': 'wideTable',
    'Potencial de Mejora': 'wideTable',
    Estudiantes: 'audit',
    BASE_DATOS: 'audit',
    'Notas Metodológicas': 'methodology',
    Gráficos: 'chart',
    Sesiones: 'wideTable',
    'Sesiones Incompletas': 'wideTable',
    'Alertas y Riesgo': 'wideTable',
    'Análisis por ítem': 'wideTable',
    Correlaciones: 'wideTable',
    'Perfil por Nivel': 'wideTable',
    Brechas: 'wideTable',
    Departamentos: 'wideTable',
    'Benchmark Nacional': 'wideTable',
    'Segmentación de Errores': 'wideTable',
    'MAT · Plan ICFES': 'methodology',
    'LEC · Plan ICFES': 'methodology',
    'SOC · Plan ICFES': 'methodology',
    'CIE · Plan ICFES': 'methodology',
    'ING · Plan ICFES': 'methodology',
};

function profileForSheet(name: string): SheetLayoutProfile {
    if (name.startsWith('ID_')) return 'studentFicha';
    return SHEET_PROFILE_MAP[name] ?? 'wideTable';
}

const DEFAULT_MIN = 8;
const DEFAULT_MAX = 28;
const DEFAULT_PAD = 1;
const TRAILING_COL_WIDTH = 2;

function cellText(cell: ExcelJS.Cell): string {
    const v = cell.value;
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        return String(v);
    }
    if (typeof v === 'object') {
        if ('formula' in v && v.formula) {
            const f = String(v.formula);
            const m = f.match(/HYPERLINK\([^,]+,\s*"([^"]*)"\)/i);
            if (m) return m[1];
            return f.slice(0, 40);
        }
        if ('richText' in v && Array.isArray((v as ExcelJS.CellRichTextValue).richText)) {
            return (v as ExcelJS.CellRichTextValue).richText.map(t => t.text).join('');
        }
        if ('text' in v) return String((v as { text: string }).text);
        if ('result' in v && v.result != null) return String(v.result);
    }
    return '';
}

function longestLineChars(text: string): number {
    if (!text) return 0;
    return Math.max(...text.split(/\r?\n/).map(line => line.length), 0);
}

/** Parse merge range like A1:L2 → col span for a master cell. */
function mergeColSpan(sheet: ExcelJS.Worksheet, row: number, col: number): number {
    const merges = (sheet as ExcelJS.Worksheet & { model?: { merges?: string[] } }).model?.merges;
    if (!merges?.length) return 1;
    for (const ref of merges) {
        const m = ref.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
        if (!m) continue;
        const c1 = colLettersToNum(m[1]);
        const r1 = Number(m[2]);
        const c2 = colLettersToNum(m[3]);
        const r2 = Number(m[4]);
        if (row >= r1 && row <= r2 && col >= c1 && col <= c2) {
            return Math.max(1, c2 - c1 + 1);
        }
    }
    return 1;
}

function colLettersToNum(letters: string): number {
    let n = 0;
    for (const ch of letters.toUpperCase()) {
        n = n * 26 + (ch.charCodeAt(0) - 64);
    }
    return n;
}

function getLastUsedColumn(sheet: ExcelJS.Worksheet): number {
    let maxCol = 1;
    sheet.eachRow({ includeEmpty: false }, row => {
        row.eachCell({ includeEmpty: false }, cell => {
            maxCol = Math.max(maxCol, Number(cell.col));
        });
    });
    return maxCol;
}

/** Recorta columnas sobrantes para que no ocupen ancho por defecto en Excel. */
export function trimTrailingColumns(sheet: ExcelJS.Worksheet, pad = 0) {
    const lastUsed = getLastUsedColumn(sheet);
    const keepUntil = lastUsed + pad;
    for (let c = keepUntil + 1; c <= Math.max(keepUntil + 4, 16); c++) {
        sheet.getColumn(c).width = TRAILING_COL_WIDTH;
    }
}

/** Agrupa columnas de BASE_DATOS para navegación rápida. */
function applyBaseDatosOutline(sheet: ExcelJS.Worksheet) {
    if (sheet.name !== 'BASE_DATOS') return;
    // Columnas 1-4: identidad, 5-6: global, 7-11: áreas, 12-14: sesiones
    [1, 5, 7, 12].forEach(col => {
        sheet.getColumn(col).outlineLevel = 1;
    });
}

/** Ancho de columna en caracteres según contenido usado. */
export function optimizeWorksheetLayout(sheet: ExcelJS.Worksheet, opts: LayoutOptions = {}) {
    const minW = opts.minWidth ?? DEFAULT_MIN;
    const maxW = opts.maxWidth ?? DEFAULT_MAX;
    const pad = opts.padding ?? DEFAULT_PAD;
    const headerRows = opts.headerRows ?? 3;

    const colMax = new Map<number, number>();

    sheet.eachRow({ includeEmpty: false }, row => {
        row.eachCell({ includeEmpty: false }, cell => {
            const col = Number(cell.col);
            const rowNum = Number(cell.row);
            const text = cellText(cell);
            const len = longestLineChars(text);
            if (len === 0) return;

            const colSpan = mergeColSpan(sheet, rowNum, col);
            const effectiveLen =
                rowNum <= headerRows && colSpan > 1 ? Math.ceil(len / colSpan) : len;

            let need = effectiveLen + pad;
            if (cell.font?.bold) need += 1;

            const wrapThreshold = rowNum <= headerRows ? 48 : 36;
            if (cell.alignment?.wrapText || effectiveLen > wrapThreshold) {
                cell.alignment = {
                    ...cell.alignment,
                    wrapText: true,
                    vertical: cell.alignment?.vertical ?? 'top',
                };
            }

            colMax.set(col, Math.max(colMax.get(col) ?? 0, need));
        });
    });

    colMax.forEach((chars, colNum) => {
        const col = sheet.getColumn(colNum);
        const next = Math.min(maxW, Math.max(minW, chars));
        col.width = next;
    });

    sheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
        if (rowNum <= headerRows) {
            if (rowNum === 2 || rowNum === 3) {
                let subtitleLines = 1;
                row.eachCell({ includeEmpty: false }, cell => {
                    const t = cellText(cell);
                    if (!t) return;
                    cell.alignment = { ...cell.alignment, wrapText: true, vertical: 'middle' };
                    const colSpan = mergeColSpan(sheet, rowNum, Number(cell.col));
                    const col = sheet.getColumn(Number(cell.col));
                    const w = (col.width ?? 14) * colSpan;
                    const perLine = Math.max(10, Math.floor(w * 0.92));
                    subtitleLines = Math.max(
                        subtitleLines,
                        ...t.split(/\r?\n/).map(line => Math.ceil(line.length / perLine) || 1)
                    );
                });
                row.height = Math.min(48, Math.max(18, subtitleLines * 13 + 4));
            }
            return;
        }

        let rowLines = 1;
        row.eachCell({ includeEmpty: false }, cell => {
            const align = cell.alignment;
            if (!align?.wrapText) return;
            const text = cellText(cell);
            if (!text) return;
            const col = sheet.getColumn(Number(cell.col));
            const w = col.width ?? minW;
            const perLine = Math.max(6, Math.floor(w * 0.85));
            for (const line of text.split(/\r?\n/)) {
                rowLines = Math.max(rowLines, Math.ceil(line.length / perLine) || 1);
            }
        });

        if (rowLines > 1) {
            row.height = Math.min(96, Math.max(row.height ?? 15, rowLines * 14 + 4));
        }
    });

    trimTrailingColumns(sheet, opts.trailingPad ?? 0);
    applyBaseDatosOutline(sheet);
}

function applySheetFreeze(sheet: ExcelJS.Worksheet, profile: SheetLayoutProfile) {
    if (sheet.name === 'Gráficos' || sheet.name === 'Índice' || sheet.name === 'Portada') return;
    if (profile === 'studentFicha') {
        sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 10 }];
        return;
    }
    if (profile === 'audit' || sheet.name === 'Ranking Estudiantes' || sheet.name === 'Estudiantes') {
        const headerRow = sheet.name.startsWith('ID_') ? 10 : 4;
        sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: headerRow }];
    }
}

export function finalizeWorkbookLayout(wb: ExcelJS.Workbook, opts?: LayoutOptions) {
    const skipAuto = new Set(['Gráficos']);
    const skipOptimize = new Set(['Gráficos']);

    wb.worksheets.forEach(ws => {
        const profile = profileForSheet(ws.name);
        const layoutOpts: LayoutOptions = {
            ...LAYOUT_PROFILES[profile],
            ...opts,
        };

        if (ws.name === 'Gráficos') {
            ws.getColumn(1).width = 2;
            ws.getColumn(2).width = 4;
            trimTrailingColumns(ws, 1);
            return;
        }
        if (!skipOptimize.has(ws.name)) {
            optimizeWorksheetLayout(ws, layoutOpts);
        } else {
            trimTrailingColumns(ws, 1);
        }
        applySheetFreeze(ws, profile);
        if (skipAuto.has(ws.name)) return;
        if (!ws.autoFilter && ws.rowCount > 5) {
            const headerRow = ws.name.startsWith('ID_') ? 10 : 4;
            const maxCol = Math.min(getLastUsedColumn(ws), 20);
            if (ws.rowCount > headerRow && maxCol >= 1) {
                ws.autoFilter = {
                    from: { row: headerRow, column: 1 },
                    to: { row: ws.rowCount, column: maxCol },
                };
            }
        }
    });
}
