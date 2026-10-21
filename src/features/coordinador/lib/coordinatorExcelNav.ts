/**
 * Navegación interna del reporte Excel (Índice ↔ hojas).
 * Usa fórmula HYPERLINK — compatible con Excel desktop y web.
 */
import type ExcelJS from 'exceljs';
import {
    setBrandTitle,
    sectionHeader,
    tableHeader,
    dataCell,
    kpiCard,
    mergeCellsResolved,
    BRAND_NAV_ROW,
    BRAND_CONTENT_START_ROW,
    SG_PRIMARY,
    SG_MUTED,
    SG_SUCCESS,
    SG_DANGER,
    methodologyNote,
} from '@features/coordinador/lib/coordinatorExcelFormat';
import { PORTADA_SHEET, RESUMEN_SHEET } from '@features/coordinador/lib/coordinatorExcelSheets';

/** Hoja principal / tabla de contenidos */
export const HOME_SHEET = 'Índice';

/** Hub ejecutivo consolidado */
export const EXEC_SHEET = RESUMEN_SHEET;

export interface NavEntry {
    group: string;
    sheet: string;
    label: string;
    audience?: string;
    priority?: number;
}

const GROUP_ORDER = [
    'Portada',
    'Resumen',
    'Visualización',
    'Estudiantes',
    'Análisis',
    'Seguimiento',
    'Geografía',
    'Benchmark',
    'Pedagógico',
    'Datos',
    'Referencia',
    'Automatización',
    'Fichas',
];

/** Catálogo canónico (hojas opcionales se omiten si no existen en el libro). */
export const NAV_CATALOG: NavEntry[] = [
    { group: 'Portada', sheet: PORTADA_SHEET, label: 'KPIs en tarjetas y lectura rápida', audience: 'Rectoría', priority: 1 },
    { group: 'Resumen', sheet: RESUMEN_SHEET, label: 'Tablero KPIs, áreas, top/bottom y recomendaciones', audience: 'Coordinación', priority: 1 },
    { group: 'Visualización', sheet: 'Gráficos', label: 'Gráficas embebidas (Chart.js)', audience: 'Coordinación', priority: 2 },
    { group: 'Estudiantes', sheet: 'Ranking Estudiantes', label: 'Ranking completo y medallas', audience: 'Docente', priority: 1 },
    { group: 'Estudiantes', sheet: 'Potencial de Mejora', label: 'Puntos recuperables por área' },
    { group: 'Estudiantes', sheet: 'Estudiantes', label: 'Listado detallado' },
    { group: 'Seguimiento', sheet: 'Alertas y Riesgo', label: 'Alertas por severidad' },
    { group: 'Seguimiento', sheet: 'Sesiones', label: 'Completitud S1 / S2' },
    { group: 'Seguimiento', sheet: 'Sesiones Incompletas', label: 'Solo pendientes de sesión' },
    { group: 'Resumen', sheet: 'Estadísticas Avanzadas', label: 'Mediana, moda, varianza por área' },
    { group: 'Resumen', sheet: 'KPIs y Percentiles', label: 'Indicadores y percentiles' },
    { group: 'Resumen', sheet: 'Insights y Recomendaciones', label: 'Fortalezas, debilidades, plan' },
    { group: 'Análisis', sheet: 'Análisis por ítem', label: 'Críticas, distribución, psicométrico y distractores' },
    { group: 'Análisis', sheet: 'Correlaciones', label: 'Matriz Pearson entre áreas' },
    { group: 'Análisis', sheet: 'Perfil por Nivel', label: 'Perfil tipo por nivel global' },
    { group: 'Análisis', sheet: 'Brechas', label: 'Brechas fuerte/débil por estudiante' },
    { group: 'Geografía', sheet: 'Departamentos', label: 'Rendimiento por departamento' },
    { group: 'Benchmark', sheet: 'Benchmarking_Institucional', label: 'Comparativa entre IE del alcance' },
    { group: 'Benchmark', sheet: 'Benchmark Nacional', label: 'Simulacro vs ICFES 2025' },
    { group: 'Benchmark', sheet: 'Rendimiento por Área', label: 'Áreas vs referente nacional' },
    { group: 'Pedagógico', sheet: 'MAT · Plan ICFES', label: 'Matemáticas — diagnóstico, marco y plan' },
    { group: 'Pedagógico', sheet: 'LEC · Plan ICFES', label: 'Lectura Crítica — diagnóstico, marco y plan' },
    { group: 'Pedagógico', sheet: 'SOC · Plan ICFES', label: 'Sociales — diagnóstico, marco y plan' },
    { group: 'Pedagógico', sheet: 'CIE · Plan ICFES', label: 'Ciencias — diagnóstico, marco y plan' },
    { group: 'Pedagógico', sheet: 'ING · Plan ICFES', label: 'Inglés — diagnóstico, marco y plan' },
    { group: 'Pedagógico', sheet: 'Temas_criticos_inst', label: 'Temas críticos (cuando hay etiquetas)' },
    { group: 'Datos', sheet: 'BASE_DATOS', label: 'Base plana para pivots', audience: 'Analista', priority: 1 },
    { group: 'Referencia', sheet: 'Notas Metodológicas', label: 'Definiciones y limitaciones', audience: 'Analista', priority: 2 },
    { group: 'Automatización', sheet: 'Automatización', label: 'Snippets Apps Script y VBA' },
];

function escapeSheetName(name: string): string {
    return name.replace(/'/g, "''");
}

function sheetLocation(targetSheet: string, anchor = 'A1'): string {
    const needsQuotes = /[\s'!]/.test(targetSheet);
    const ref = needsQuotes ? `'${escapeSheetName(targetSheet)}'` : targetSheet;
    return `#${ref}!${anchor}`;
}

/** Fórmula HYPERLINK a otra hoja del mismo libro. */
export function internalLinkFormula(targetSheet: string, display: string, anchor = 'A1'): string {
    const loc = sheetLocation(targetSheet, anchor);
    const text = display.replace(/"/g, '""');
    return `HYPERLINK("${loc}","${text}")`;
}

export function applyInternalLink(
    cell: ExcelJS.Cell,
    targetSheet: string,
    display: string,
    anchor = 'A1'
) {
    cell.value = { formula: internalLinkFormula(targetSheet, display, anchor) };
    cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0563C1' }, underline: true };
}

function entriesForWorkbook(sheetNames: Set<string>): NavEntry[] {
    const seen = new Set<string>();
    const ordered: NavEntry[] = [];

    for (const entry of NAV_CATALOG) {
        if (!sheetNames.has(entry.sheet) || seen.has(entry.sheet)) continue;
        ordered.push(entry);
        seen.add(entry.sheet);
    }

    sheetNames.forEach(name => {
        if (name === HOME_SHEET || name === PORTADA_SHEET || seen.has(name)) return;
        const group = name.startsWith('ID_') ? 'Fichas' : 'Otros';
        ordered.push({ group, sheet: name, label: name.startsWith('ID_') ? 'Ficha individual' : name });
    });

    ordered.sort((a, b) => {
        const ga = GROUP_ORDER.indexOf(a.group);
        const gb = GROUP_ORDER.indexOf(b.group);
        if (ga !== gb) return (ga === -1 ? 99 : ga) - (gb === -1 ? 99 : gb);
        return a.sheet.localeCompare(b.sheet, 'es');
    });

    return ordered;
}

function moveWorksheetToFirst(wb: ExcelJS.Workbook, name: string) {
    const ws = wb.getWorksheet(name);
    if (!ws) return;
    const sheets = wb.worksheets;
    const idx = sheets.indexOf(ws);
    if (idx <= 0) return;
    sheets.splice(idx, 1);
    sheets.unshift(ws);
}

function reorderPortadaIndex(wb: ExcelJS.Workbook) {
    moveWorksheetToFirst(wb, HOME_SHEET);
    const portada = wb.getWorksheet(PORTADA_SHEET);
    const index = wb.getWorksheet(HOME_SHEET);
    if (portada && index) {
        const sheets = wb.worksheets;
        const pi = sheets.indexOf(portada);
        const ii = sheets.indexOf(index);
        if (pi > ii + 1) {
            sheets.splice(pi, 1);
            sheets.splice(ii + 1, 0, portada);
        }
    }
}

/** Barra fila 3: volver al índice (+ dashboard en hojas de detalle). */
export function addBackNavigationBar(sheet: ExcelJS.Worksheet, sheetNames: Set<string>) {
    if (sheet.name === HOME_SHEET || sheet.name === PORTADA_SHEET) return;

    sheet.getRow(BRAND_NAV_ROW).height = 18;

    if (sheet.name === EXEC_SHEET) {
        applyInternalLink(sheet.getCell(BRAND_NAV_ROW, 1), HOME_SHEET, '← Índice');
        applyInternalLink(sheet.getCell(BRAND_NAV_ROW, 2), PORTADA_SHEET, '← Portada');
        const quick: [string, string][] = [
            ['Ranking Estudiantes', 'Ranking'],
            ['Potencial de Mejora', 'Potencial'],
            ['Análisis por ítem', 'Ítems'],
            ['Alertas y Riesgo', 'Alertas'],
            ['Gráficos', 'Gráficos'],
        ];
        let col = 4;
        quick.forEach(([target, label]) => {
            if (!sheetNames.has(target)) return;
            applyInternalLink(sheet.getCell(BRAND_NAV_ROW, col), target, label);
            col += 2;
        });
        return;
    }

    applyInternalLink(sheet.getCell(BRAND_NAV_ROW, 1), HOME_SHEET, '← Índice');
    applyInternalLink(sheet.getCell(BRAND_NAV_ROW, 2), PORTADA_SHEET, '← Portada');
    if (sheetNames.has(EXEC_SHEET)) {
        applyInternalLink(sheet.getCell(BRAND_NAV_ROW, 4), EXEC_SHEET, '← Resumen ejecutivo');
    }
}

function buildIndexSheet(
    wb: ExcelJS.Workbook,
    reportMeta: string,
    entries: NavEntry[],
    kpiSummary?: { avg: number; tasa: number; evaluados: number; riesgo: number }
) {
    const existing = wb.getWorksheet(HOME_SHEET);
    if (existing) wb.removeWorksheet(existing.id);

    const s = wb.addWorksheet(HOME_SHEET, { properties: { tabColor: { argb: SG_PRIMARY } } });
    setBrandTitle(s, 'Índice de navegación', reportMeta);

    s.getColumn(1).width = 3;
    s.getColumn(2).width = 14;
    s.getColumn(3).width = 22;
    s.getColumn(4).width = 28;
    s.getColumn(5).width = 12;
    s.getColumn(6).width = 10;
    s.getColumn(7).width = 10;

    const kpiRow = BRAND_CONTENT_START_ROW + 1;
    if (kpiSummary) {
        sectionHeader(s, BRAND_CONTENT_START_ROW, 'Resumen del alcance');
        kpiCard(s, kpiRow, 2, 'Promedio', kpiSummary.avg, SG_PRIMARY, '/500');
        kpiCard(s, kpiRow, 4, 'Aprobación', `${kpiSummary.tasa}%`, SG_SUCCESS, '≥300');
        kpiCard(s, kpiRow, 6, 'Evaluados', kpiSummary.evaluados, SG_PRIMARY, 'estudiantes');
        kpiCard(s, kpiRow, 8, 'En riesgo', kpiSummary.riesgo, SG_DANGER, 'seguimiento');
    }

    const start = kpiSummary ? kpiRow + 4 : BRAND_CONTENT_START_ROW;
    sectionHeader(s, start, 'Contenido del reporte — clic para abrir cada hoja');
    methodologyNote(
        s,
        start + 1,
        'Audiencia: Rectoría (síntesis), Coordinación (seguimiento), Docente (estudiantes), Analista (datos/base). Prioridad 1 = lectura obligatoria.'
    );
    tableHeader(s, start + 2, ['Sección', 'Hoja', 'Descripción', 'Audiencia', 'Prioridad', 'Abrir'], 2);

    let row = start + 3;
    let lastGroup = '';
    entries.forEach(entry => {
        if (entry.group !== lastGroup) {
            if (lastGroup) row += 1;
            dataCell(s.getCell(row, 2), entry.group, { bold: true, color: SG_PRIMARY });
            mergeCellsResolved(s, row, 2, row, 7);
            lastGroup = entry.group;
            row += 1;
        }

        dataCell(s.getCell(row, 2), entry.group, { color: SG_MUTED });
        applyInternalLink(s.getCell(row, 3), entry.sheet, entry.sheet);
        dataCell(s.getCell(row, 4), entry.label, {});
        dataCell(s.getCell(row, 5), entry.audience || 'General', { align: 'center' });
        dataCell(s.getCell(row, 6), entry.priority ?? 2, { align: 'center' });
        applyInternalLink(s.getCell(row, 7), entry.sheet, 'Ir →');
        s.getRow(row).height = 20;
        row += 1;
    });

    row += 1;
    sectionHeader(s, row, 'Accesos rápidos');
    row += 1;
    applyInternalLink(s.getCell(row, 3), PORTADA_SHEET, 'Abrir Portada →');
    applyInternalLink(s.getCell(row, 5), EXEC_SHEET, 'Abrir Resumen Ejecutivo →');
    s.views = [{ state: 'frozen', xSplit: 0, ySplit: start + 1 }];
}

export interface NavKpiSummary {
    avg: number;
    tasa: number;
    evaluados: number;
    riesgo: number;
}

/**
 * Crea hoja Índice, enlaces desde índice a cada hoja, y barra «volver» en el resto.
 * Llamar una vez terminadas todas las hojas del workbook.
 */
export function wireCoordinatorExcelNavigation(
    wb: ExcelJS.Workbook,
    reportMeta: string,
    kpiSummary?: NavKpiSummary
) {
    const names = new Set(wb.worksheets.map(ws => ws.name));
    const entries = entriesForWorkbook(names);

    buildIndexSheet(wb, reportMeta, entries, kpiSummary);
    moveWorksheetToFirst(wb, HOME_SHEET);
    reorderPortadaIndex(wb);

    const present = new Set(wb.worksheets.map(ws => ws.name));
    wb.worksheets.forEach(ws => {
        if (ws.name === HOME_SHEET) return;
        addBackNavigationBar(ws, present);
    });
}
