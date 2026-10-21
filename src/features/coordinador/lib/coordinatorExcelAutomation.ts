/**
 * Hoja de automatización (Apps Script + VBA como texto copiable).
 */
import type ExcelJS from 'exceljs';
import {
    setBrandTitle,
    sectionHeader,
    dataCell,
    BRAND_CONTENT_START_ROW,
    mergeCellsResolved,
    SG_MUTED,
    SG_PRIMARY,
    tabColorForGroup,
} from '@features/coordinador/lib/coordinatorExcelFormat';

const APPS_SCRIPT = `/**
 * Seamos Genios — utilidades para reporte coordinador (Google Sheets).
 * Extensiones > Apps Script > pegar y guardar.
 */
function sgRefreshPivotFromBase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const base = ss.getSheetByName('BASE_DATOS');
  if (!base) {
    SpreadsheetApp.getUi().alert('No se encontró la hoja BASE_DATOS.');
    return;
  }
  let pivot = ss.getSheetByName('Pivot_SG');
  if (!pivot) pivot = ss.insertSheet('Pivot_SG');
  pivot.clear();
  const range = base.getDataRange();
  const pivotTable = pivot.getRange(1, 1).createPivotTable(range);
  pivotTable.addRowGroup(4); // Institución
  pivotTable.addColumnGroup(6); // Global buckets — ajustar según columnas
  pivotTable.addPivotValue(6, SpreadsheetApp.PivotTableSummarizeFunction.AVERAGE);
}

function sgHighlightIncompleteSessions() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sesiones Incompletas');
  if (!sh) return;
  const last = sh.getLastRow();
  if (last < 3) return;
  sh.getRange(3, 1, last - 2, 3).setBackground('#FEF3C7');
}`;

const VBA_MODULE = `' Seamos Genios — módulo VBA opcional (Excel desktop)
' Alt+F11 > Insertar > Módulo > pegar
Option Explicit

Public Sub SG_RefreshRankingFilter()
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Ranking Estudiantes")
    On Error GoTo 0
    If ws Is Nothing Then
        MsgBox "No se encontró Ranking Estudiantes", vbExclamation
        Exit Sub
    End If
    ws.AutoFilterMode = False
    ws.Range("A4").CurrentRegion.AutoFilter Field:=5, Criteria1:=">=300"
    MsgBox "Filtro aplicado: Global >= 300", vbInformation
End Sub

Public Sub SG_GoToIndex()
    ThisWorkbook.Worksheets("Índice").Activate
    Range("A1").Select
End Sub`;

export function sheetAutomatizacion(wb: ExcelJS.Workbook, reportMeta: string) {
    const s = wb.addWorksheet('Automatización', {
        properties: { tabColor: { argb: tabColorForGroup('referencia') } },
    });
    setBrandTitle(s, 'Automatización e integraciones', reportMeta);
    s.getColumn(1).width = 4;
    s.getColumn(2).width = 42;

    const contentStart = BRAND_CONTENT_START_ROW;
    sectionHeader(s, contentStart, 'Recomendación');
    mergeCellsResolved(s, contentStart + 1, 2, contentStart + 1, 2);
    dataCell(
        s.getCell(contentStart + 1, 2),
        'Este archivo se entrega como .xlsx sin macros incrustadas (compatibilidad y seguridad). Copie los snippets siguientes si su institución desea automatizar en Google Sheets o Excel desktop.',
        { color: SG_MUTED, wrap: true }
    );
    s.getRow(contentStart + 1).height = 48;

    sectionHeader(s, contentStart + 3, 'Google Apps Script (.gs)');
    dataCell(s.getCell(contentStart + 4, 2), APPS_SCRIPT, { size: 9, wrap: true });
    s.getCell(contentStart + 4, 2).alignment = { wrapText: true, vertical: 'top' };
    s.getRow(contentStart + 4).height = 220;

    sectionHeader(s, contentStart + 6, 'VBA (.bas) — Excel desktop');
    dataCell(s.getCell(contentStart + 7, 2), VBA_MODULE, { size: 9, wrap: true });
    s.getCell(contentStart + 7, 2).alignment = { wrapText: true, vertical: 'top' };
    s.getRow(contentStart + 7).height = 180;

    sectionHeader(s, contentStart + 9, 'Casos de uso sugeridos');
    const tips = [
        'Pivot desde BASE_DATOS para reportes internos por sede o grado.',
        'Filtrar Ranking >= 300 para listas de refuerzo.',
        'Vincular Sesiones Incompletas con recordatorios vía correo (Apps Script MailApp).',
        'Importar ítems psicométricos con poder "Pobre" a planificación curricular.',
    ];
    tips.forEach((t, i) => {
        dataCell(s.getCell(contentStart + 10 + i, 1), `${i + 1}.`, { align: 'right', bold: true, color: SG_PRIMARY });
        dataCell(s.getCell(contentStart + 10 + i, 2), t, {});
    });
}
