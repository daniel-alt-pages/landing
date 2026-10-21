import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { SimulacionEstadisticas } from '@features/simulacro/lib/firestoreService';
import { MATERIAS, formatAreaDisplayName } from '@features/coordinador/lib/analisis/materias';
import {
    clavesForMateria,
    type SimulacroClaveItem,
} from '@features/coordinador/lib/clavesFromEstadisticas';
import {
    setBrandTitle,
    sectionHeader,
    tableHeader,
    dataCell,
    BRAND_CONTENT_START_ROW,
    tabColorForGroup,
    SG_PRIMARY,
    SG_SUCCESS,
    SG_WARN,
    SG_DANGER,
    SG_MUTED,
    NUM_FMT,
    applyAutoFilter,
    applyTableFreeze,
    applyDataBar,
    methodologyNote,
    mergeCellsResolved,
} from '@features/coordinador/lib/coordinatorExcelFormat';
import { finalizeWorkbookLayout } from '@features/coordinador/lib/coordinatorExcelLayout';

const RESUMEN_SHEET = 'Resumen';
const TODAS_SHEET = 'Todas las claves';

const AREA_SHORT: Record<string, string> = {
    'lectura crítica': 'LEC',
    'matemáticas': 'MAT',
    'sociales y ciudadanas': 'SOC',
    'ciencias naturales': 'CIE',
    'inglés': 'ING',
};

type ClaveRow = {
    area: string;
    areaKey: string;
    sesion: string;
    numero: number;
    clave: string;
    pct: number;
};

export type GenerateClavesExcelInput = {
    stats: SimulacionEstadisticas;
    simulationId: string;
    institutionName: string;
};

function dificultadLabel(pct: number): string {
    if (pct >= 70) return 'Alto acierto';
    if (pct >= 45) return 'Medio';
    return 'Dificultad alta';
}

function dificultadColor(pct: number): string {
    if (pct >= 70) return SG_SUCCESS;
    if (pct >= 45) return SG_WARN;
    return SG_DANGER;
}

function sanitizeSheetName(name: string): string {
    return name.replace(/[\\/*?:[\]]/g, ' ').trim().slice(0, 31);
}

export function buildClavesReportFilename(
    simulationId: string,
    institutionName: string,
    date: Date = new Date(),
): string {
    const sim = String(simulationId || '')
        .replace(/\s+/g, '')
        .trim() || 'SIM';
    const scope =
        String(institutionName || 'Institucion')
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '_')
            .slice(0, 40) || 'INSTITUCION';
    const d = date.toISOString().slice(0, 10);
    return `Claves_${sim}_${scope}_${d}.xlsx`;
}

function buildClavesMeta(simulationId: string, institutionName: string): string {
    const generated = new Date().toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
    return [
        `Claves oficiales del simulacro ${simulationId}`,
        `Generado ${generated} · Alcance: ${institutionName} · Sin datos individuales de estudiantes`,
    ].join('\n');
}

function collectAllClaveRows(stats: SimulacionEstadisticas): ClaveRow[] {
    const rows: ClaveRow[] = [];
    for (const m of MATERIAS) {
        const items = clavesForMateria(stats, m.key);
        for (const item of items) {
            rows.push({
                area: formatAreaDisplayName(m.key),
                areaKey: m.key,
                sesion: item.sesion || 'S1',
                numero: item.numero,
                clave: item.respuesta_correcta,
                pct: item.porcentaje_acierto,
            });
        }
    }
    return rows.sort((a, b) => {
        const areaOrder =
            MATERIAS.findIndex((m) => m.key === a.areaKey) -
            MATERIAS.findIndex((m) => m.key === b.areaKey);
        if (areaOrder !== 0) return areaOrder;
        if (a.sesion !== b.sesion) return a.sesion.localeCompare(b.sesion);
        return a.numero - b.numero;
    });
}

function writeClaveTableRow(
    sheet: ExcelJS.Worksheet,
    row: number,
    data: {
        area?: string;
        sesion: string;
        numero: number;
        clave: string;
        pct: number;
    },
    startCol = 1,
    includeArea = true,
) {
    let col = startCol;
    if (includeArea) {
        dataCell(sheet.getCell(row, col), data.area ?? '', { align: 'left' });
        col += 1;
    }
    dataCell(sheet.getCell(row, col), data.sesion, { align: 'center' });
    col += 1;
    dataCell(sheet.getCell(row, col), data.numero, { align: 'center' });
    col += 1;
    dataCell(sheet.getCell(row, col), data.clave, {
        align: 'center',
        bold: true,
        color: SG_PRIMARY,
    });
    col += 1;
    const pctCell = sheet.getCell(row, col);
    dataCell(pctCell, data.pct / 100, {
        align: 'center',
        numFmt: NUM_FMT.pct,
        color: dificultadColor(data.pct),
    });
    col += 1;
    dataCell(sheet.getCell(row, col), dificultadLabel(data.pct), {
        align: 'center',
        color: dificultadColor(data.pct),
    });
}

function sheetResumenClaves(
    wb: ExcelJS.Workbook,
    rows: ClaveRow[],
    simulationId: string,
    institutionName: string,
    reportMeta: string,
) {
    const s = wb.addWorksheet(RESUMEN_SHEET, {
        properties: { tabColor: { argb: tabColorForGroup('portada') } },
    });
    setBrandTitle(s, 'Claves del simulacro', reportMeta);

    s.getColumn(1).width = 3;
    s.getColumn(2).width = 22;
    s.getColumn(3).width = 12;
    s.getColumn(4).width = 14;
    s.getColumn(5).width = 14;
    s.getColumn(6).width = 16;

    sectionHeader(s, BRAND_CONTENT_START_ROW, `${institutionName} · ${simulationId}`);
    methodologyNote(
        s,
        BRAND_CONTENT_START_ROW + 1,
        'Respuestas correctas oficiales por área ICFES. El % de acierto refleja el desempeño agregado del grupo en el simulacro (no incluye datos individuales).',
    );

    const headerRow = BRAND_CONTENT_START_ROW + 3;
    tableHeader(s, headerRow, ['Área', 'Preguntas', 'Prom. acierto', 'Alto ≥70%', 'Dificultad <45%'], 2);

    let r = headerRow + 1;
    for (const m of MATERIAS) {
        const areaRows = rows.filter((row) => row.areaKey === m.key);
        if (areaRows.length === 0) continue;

        const avg = Math.round(
            areaRows.reduce((sum, row) => sum + row.pct, 0) / areaRows.length,
        );
        const high = areaRows.filter((row) => row.pct >= 70).length;
        const low = areaRows.filter((row) => row.pct < 45).length;

        dataCell(s.getCell(r, 2), formatAreaDisplayName(m.key));
        dataCell(s.getCell(r, 3), areaRows.length, { align: 'center' });
        dataCell(s.getCell(r, 4), `${avg}%`, {
            align: 'center',
            color: dificultadColor(avg),
            bold: true,
        });
        dataCell(s.getCell(r, 5), high, { align: 'center', color: SG_SUCCESS });
        dataCell(s.getCell(r, 6), low, { align: 'center', color: SG_DANGER });
        r += 1;
    }

    sectionHeader(s, r + 1, 'Cómo usar este archivo');
    const hints = [
        '«Todas las claves» concentra el listado completo filtrable por área y sesión.',
        'Cada pestaña LEC/MAT/SOC/CIE/ING muestra las claves de un área ICFES.',
        'La columna «% Acierto grupal» indica qué tan fácil fue la pregunta para el grupo.',
    ];
    hints.forEach((hint, i) => {
        mergeCellsResolved(s, r + 2 + i, 2, r + 2 + i, 6);
        dataCell(s.getCell(r + 2 + i, 2), `• ${hint}`, { color: SG_MUTED, wrap: true });
    });
}

function sheetTodasClaves(wb: ExcelJS.Workbook, rows: ClaveRow[], reportMeta: string) {
    const s = wb.addWorksheet(TODAS_SHEET, {
        properties: { tabColor: { argb: tabColorForGroup('datos') } },
    });
    setBrandTitle(s, 'Todas las claves', reportMeta);

    const columns = ['Área ICFES', 'Sesión', 'Nº Pregunta', 'Clave', '% Acierto grupal', 'Dificultad'];
    const headerRow = BRAND_CONTENT_START_ROW;
    tableHeader(s, headerRow, columns);

    rows.forEach((row, i) => {
        writeClaveTableRow(s, headerRow + 1 + i, row, 1, true);
    });

    const lastRow = headerRow + rows.length;
    applyAutoFilter(s, headerRow, columns.length, lastRow);
    applyTableFreeze(s, headerRow);
    applyDataBar(s, `E${headerRow + 1}:E${lastRow}`, SG_PRIMARY, 1);

    s.getColumn(1).width = 22;
    s.getColumn(2).width = 10;
    s.getColumn(3).width = 12;
    s.getColumn(4).width = 8;
    s.getColumn(5).width = 16;
    s.getColumn(6).width = 16;
}

function sheetAreaClaves(
    wb: ExcelJS.Workbook,
    materiaKey: string,
    items: SimulacroClaveItem[],
    accentArgb: string,
    reportMeta: string,
) {
    const short = AREA_SHORT[materiaKey] ?? formatAreaDisplayName(materiaKey).slice(0, 8);
    const sheetName = sanitizeSheetName(`${short} · Claves`);
    const s = wb.addWorksheet(sheetName, {
        properties: { tabColor: { argb: tabColorForGroup('analisis') } },
    });
    const areaLabel = formatAreaDisplayName(materiaKey);

    setBrandTitle(s, `${areaLabel} — Claves`, reportMeta);

    const columns = ['Sesión', 'Nº Pregunta', 'Clave', '% Acierto grupal', 'Dificultad'];
    const headerRow = BRAND_CONTENT_START_ROW;
    tableHeader(s, headerRow, columns);

    const sorted = [...items].sort((a, b) => {
        if (a.sesion !== b.sesion) return (a.sesion || 'S1').localeCompare(b.sesion || 'S1');
        return a.numero - b.numero;
    });

    sorted.forEach((item, i) => {
        writeClaveTableRow(
            s,
            headerRow + 1 + i,
            {
                sesion: item.sesion || 'S1',
                numero: item.numero,
                clave: item.respuesta_correcta,
                pct: item.porcentaje_acierto,
            },
            1,
            false,
        );
        const claveCell = s.getCell(headerRow + 1 + i, 3);
        claveCell.font = { ...claveCell.font, color: { argb: accentArgb } };
    });

    const lastRow = headerRow + sorted.length;
    applyAutoFilter(s, headerRow, columns.length, lastRow);
    applyTableFreeze(s, headerRow);
    applyDataBar(s, `D${headerRow + 1}:D${lastRow}`, accentArgb, 1);

    s.getColumn(1).width = 10;
    s.getColumn(2).width = 12;
    s.getColumn(3).width = 8;
    s.getColumn(4).width = 16;
    s.getColumn(5).width = 16;
}

function hexToArgb(hex: string): string {
    const raw = hex.replace('#', '');
    const normalized = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    return `FF${normalized.toUpperCase()}`;
}

export async function generateClavesExcel({
    stats,
    simulationId,
    institutionName,
}: GenerateClavesExcelInput): Promise<void> {
    const rows = collectAllClaveRows(stats);
    if (rows.length === 0) {
        throw new Error('No hay claves publicadas para exportar.');
    }

    const reportMeta = buildClavesMeta(simulationId, institutionName);
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Seamos Genios Colombia';
    wb.created = new Date();

    sheetResumenClaves(wb, rows, simulationId, institutionName, reportMeta);
    sheetTodasClaves(wb, rows, reportMeta);

    for (const m of MATERIAS) {
        const items = clavesForMateria(stats, m.key);
        if (items.length > 0) {
            sheetAreaClaves(wb, m.key, items, hexToArgb(m.color), reportMeta);
        }
    }

    finalizeWorkbookLayout(wb);

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, buildClavesReportFilename(simulationId, institutionName));
}
