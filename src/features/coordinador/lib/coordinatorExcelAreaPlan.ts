/**
 * Hoja pedagógica unificada por área: estadística + niveles ICFES + marco + plan de mejora.
 * Reemplaza Recomendaciones, Planes_institucion, Plan_de_estudio, Dependencias_competencias,
 * Diagnóstico_niveles y Plan_competencias.
 */
import type ExcelJS from 'exceljs';
import { NATIONAL_STATS } from '@features/benchmark/lib/nationalData';
import type { SubjectStat } from '@features/coordinador/hooks/coordinadorTypes';
import type { ExtendedExcelContext } from '@features/coordinador/lib/coordinatorExcelExtended';
import type { PlanEstudioPaso } from '@features/coordinador/lib/executiveModel';
import {
    BRAND_CONTENT_START_ROW,
    BRAND_MERGE_END_COL,
    compactKpiGrid,
    dataCell,
    mergeCellsResolved,
    methodologyNote,
    nivelIcfesBadge,
    sectionHeader,
    setBrandTitle,
    severityBadge,
    SG_DANGER,
    SG_MUTED,
    SG_PRIMARY,
    SG_SUCCESS,
    SG_WARN,
    tabColorForGroup,
    tableHeader,
} from '@features/coordinador/lib/coordinatorExcelFormat';
import { NOT_APPLICABLE } from '@features/coordinador/lib/coordinatorExcelValues';
import { normalizarMateriaAModeloArea } from '@features/coordinador/lib/macroReferencias';
import { questionLabel } from '@/lib/questionLabel';
import type { AreaCanonica, AreaDiagnostico } from '@features/coordinador/lib/referencePerformanceDependencies';
import {
    exportDependencyCatalogRows,
    REFERENCIA_POR_AREA,
} from '@features/coordinador/lib/referencePerformanceDependencies';

const AREA_ORDER: AreaCanonica[] = [
    'Matemáticas',
    'Lectura Crítica',
    'Sociales',
    'Ciencias',
    'Inglés',
];

const AREA_TAB: Record<AreaCanonica, string> = {
    Matemáticas: 'MAT',
    'Lectura Crítica': 'LEC',
    Sociales: 'SOC',
    Ciencias: 'CIE',
    Inglés: 'ING',
};

const NAT_KEY: Record<AreaCanonica, keyof typeof NATIONAL_STATS.areas> = {
    Matemáticas: 'Matematicas',
    'Lectura Crítica': 'Lectura',
    Sociales: 'Sociales',
    Ciencias: 'Ciencias',
    Inglés: 'Ingles',
};

const ESTADO_COLOR: Record<string, string> = {
    dominada: SG_SUCCESS,
    en_desarrollo: SG_PRIMARY,
    por_reforzar: SG_WARN,
    urgente: SG_DANGER,
};

export function areaPlanSheetName(area: AreaCanonica): string {
    return `${AREA_TAB[area]} · Plan ICFES`;
}

export const AREA_PLAN_SHEET_NAMES = AREA_ORDER.map(areaPlanSheetName);

interface AreaPlanBundle {
    area: AreaCanonica;
    diagnostico: AreaDiagnostico | null;
    subject: SubjectStat | null;
    plan: PlanEstudioPaso | null;
    refDocumento: string;
}

function nationalMean(area: AreaCanonica): number {
    return NATIONAL_STATS.areas[NAT_KEY[area]]?.mean ?? 50;
}

function buildAreaBundles(ctx: ExtendedExcelContext): AreaPlanBundle[] {
    const { summary, inst } = ctx;
    return AREA_ORDER.map(area => ({
        area,
        diagnostico: summary.competenciasDiagnostico.find(d => d.areaNombre === area) ?? null,
        subject:
            inst.subjectStats.find(
                s => normalizarMateriaAModeloArea(s.name) === area || s.name === area
            ) ?? null,
        plan: summary.planEstudioPasos.find(p => p.areaNombre === area) ?? null,
        refDocumento: REFERENCIA_POR_AREA[area]?.documentoRef ?? 'Marco ICFES Saber 11°',
    })).filter(b => {
        if (b.diagnostico && b.diagnostico.puntaje > 0) return true;
        if (b.subject && b.subject.countStudents > 0 && b.subject.avg > 0) return true;
        return false;
    });
}

export function hasAreaPlanSheetsData(ctx: ExtendedExcelContext): boolean {
    return buildAreaBundles(ctx).length > 0;
}

function noteBlock(s: ExcelJS.Worksheet, row: number, text: string): number {
    mergeCellsResolved(s, row, 2, row, BRAND_MERGE_END_COL);
    dataCell(s.getCell(row, 2), text, { wrap: true, color: SG_MUTED });
    s.getRow(row).height = Math.min(56, 22 + Math.ceil(text.length / 90) * 14);
    return row + 1;
}

function renderAreaPlanSheet(wb: ExcelJS.Workbook, ctx: ExtendedExcelContext, bundle: AreaPlanBundle) {
    const { summary, reportMeta } = ctx;
    const { area, diagnostico, subject, plan, refDocumento } = bundle;

    const s = wb.addWorksheet(areaPlanSheetName(area), {
        properties: { tabColor: { argb: tabColorForGroup('pedagogico') } },
    });
    setBrandTitle(s, `${area} — Diagnóstico y plan ICFES`, reportMeta);
    [1, 2, 3, 4, 5, 6].forEach((c, i) => {
        s.getColumn(c).width = i === 0 ? 3 : i === 1 ? 26 : i === 3 ? 38 : 16;
    });

    let row = BRAND_CONTENT_START_ROW;
    methodologyNote(
        s,
        row++,
        `${summary.referenceModeLabel}. ${refDocumento}. Escala del área: 0–100 (ICFES humanizado).`,
        BRAND_MERGE_END_COL
    );
    row++;

    // ── 1. Estadística institucional ──
    sectionHeader(s, row++, '1. Diagnóstico estadístico', BRAND_MERGE_END_COL);
    const avg = subject?.avg ?? diagnostico?.puntaje ?? 0;
    const nat = nationalMean(area);
    const delta = Math.round((avg - nat) * 10) / 10;
    compactKpiGrid(s, row, 2, [
        { label: 'Promedio', value: avg, sub: '/100', accent: SG_PRIMARY },
        { label: 'Mediana', value: subject?.median ?? NOT_APPLICABLE, accent: SG_PRIMARY },
        { label: 'Desv. estándar', value: subject?.stdDev ?? NOT_APPLICABLE, accent: SG_PRIMARY },
        {
            label: 'Δ vs nacional',
            value: `${delta >= 0 ? '+' : ''}${delta}`,
            sub: `Ref. ${nat}`,
            accent: delta >= 0 ? SG_SUCCESS : SG_DANGER,
        },
    ]);
    row += 9;

    if (subject) {
        tableHeader(s, row++, ['Mín', 'Máx', 'Evaluados', 'Moda'], 2);
        dataCell(s.getCell(row, 2), subject.min, { align: 'right' });
        dataCell(s.getCell(row, 3), subject.max, { align: 'right' });
        dataCell(s.getCell(row, 4), subject.countStudents, { align: 'right' });
        dataCell(s.getCell(row, 5), subject.mode, { align: 'right' });
        row += 2;
    }

    // ── 2. Nivel ICFES y rangos ──
    if (diagnostico) {
        sectionHeader(s, row++, '2. Nivel de desempeño ICFES', BRAND_MERGE_END_COL);
        tableHeader(s, row++, ['Indicador', 'Valor'], 2);
        const nivelRows: [string, string | number][] = [
            ['Nivel alcanzado', diagnostico.nivelEtiqueta],
            ['Rango oficial (pts)', `${diagnostico.rangoMin} – ${diagnostico.rangoMax}`],
            ['Posición en tramo', `${diagnostico.progresoEnRangoPct}%`],
            ['Dominio en tramo', `${diagnostico.dominioNivelPct}%`],
            ['Puntos al siguiente nivel', diagnostico.puntosParaSiguienteNivel ?? 'Nivel máximo'],
            ['Meta siguiente', diagnostico.etiquetaSiguienteNivel ?? '—'],
        ];
        nivelRows.forEach(([label, val], i) => {
            const r = row + i;
            dataCell(s.getCell(r, 2), label, { bold: true, bg: 'FFF8FAFC' });
            if (i === 0) nivelIcfesBadge(s.getCell(r, 3), diagnostico.nivel, String(val));
            else dataCell(s.getCell(r, 3), val, { align: 'right' });
        });
        row += nivelRows.length + 1;

        row = noteBlock(s, row, diagnostico.descriptorNivel);
        row = noteBlock(s, row, diagnostico.interpretacionPosicion);
        row++;
    }

    // ── 3. Competencias del marco ──
    if (diagnostico?.competencias.length) {
        sectionHeader(s, row++, '3. Competencias del marco ICFES', BRAND_MERGE_END_COL);
        tableHeader(s, row++, ['Competencia', 'Estado', 'Dominio %', 'Afirmación'], 2);
        diagnostico.competencias
            .sort((a, b) => a.prioridad - b.prioridad)
            .forEach(comp => {
                dataCell(s.getCell(row, 2), comp.competenciaNombre, { bold: true });
                dataCell(s.getCell(row, 3), comp.estado.replace(/_/g, ' '), {
                    align: 'center',
                    color: ESTADO_COLOR[comp.estado] ?? SG_MUTED,
                    bold: true,
                });
                dataCell(s.getCell(row, 4), `${comp.dominioPct}%`, { align: 'right' });
                dataCell(s.getCell(row, 5), comp.afirmacion, { wrap: true, color: SG_MUTED });
                s.getRow(row).height = 32;
                row++;
            });
        row++;
    }

    // ── 4. Habilidades de nivel (checklist ICFES) ──
    if (diagnostico?.habilidadesNivel.length) {
        sectionHeader(s, row++, '4. Habilidades del nivel de desempeño', BRAND_MERGE_END_COL);
        tableHeader(s, row++, ['Habilidad', 'Nivel ref.', 'Estado'], 2);
        diagnostico.habilidadesNivel.forEach(h => {
            dataCell(s.getCell(row, 2), h.nombre, { wrap: true });
            dataCell(s.getCell(row, 3), h.etiquetaNivel, { align: 'center' });
            dataCell(s.getCell(row, 4), h.alcanzada ? 'Alcanzada' : 'Por desarrollar', {
                align: 'center',
                color: h.alcanzada ? SG_SUCCESS : SG_WARN,
                bold: true,
            });
            row++;
        });
        row++;
    }

    // ── 5. Habilidades del marco por competencia ──
    if (diagnostico?.competencias.some(c => c.habilidadesDetalle.length)) {
        sectionHeader(s, row++, '5. Habilidades del marco (detalle)', BRAND_MERGE_END_COL);
        tableHeader(s, row++, ['Competencia', 'Habilidad', 'Estado', '%'], 2);
        diagnostico.competencias.forEach(comp => {
            comp.habilidadesDetalle.forEach(h => {
                dataCell(s.getCell(row, 2), comp.competenciaNombre, { color: SG_MUTED });
                dataCell(s.getCell(row, 3), h.nombre, { wrap: true });
                dataCell(s.getCell(row, 4), h.estado.replace(/_/g, ' '), {
                    align: 'center',
                    color: ESTADO_COLOR[h.estado] ?? SG_MUTED,
                });
                dataCell(s.getCell(row, 5), `${h.dominioPct}%`, { align: 'right' });
                row++;
            });
        });
        row++;
    }

    // ── 6. Referencia marco ↔ nivel (solo área y nivel actual) ──
    if (diagnostico) {
        const deps = exportDependencyCatalogRows().filter(
            r => r.area === area && r.nivel === diagnostico.nivel
        );
        if (deps.length) {
            sectionHeader(s, row++, '6. Marco ↔ nivel (referencia curricular)', BRAND_MERGE_END_COL);
            tableHeader(s, row++, ['Competencia', 'Habilidad marco', 'Habilidad nivel'], 2);
            deps.slice(0, 40).forEach(d => {
                dataCell(s.getCell(row, 2), d.competencia, { wrap: true });
                dataCell(s.getCell(row, 3), d.habilidadMarco, { wrap: true, color: SG_MUTED });
                dataCell(s.getCell(row, 4), d.habilidadNivel, { wrap: true });
                s.getRow(row).height = 28;
                row++;
            });
            if (deps.length > 40) {
                row = noteBlock(s, row, `… y ${deps.length - 40} filas adicionales en catálogo ICFES.`);
            }
            row++;
        }
    }

    // ── 7. Ítems críticos (si hay metadata) ──
    const items = plan?.vinculosPreguntasCriticas ?? [];
    if (items.length) {
        sectionHeader(s, row++, '7. Ítems críticos vinculados', BRAND_MERGE_END_COL);
        tableHeader(s, row++, ['Pregunta', 'Error', 'Prioridad'], 2);
        items.forEach(q => {
            dataCell(s.getCell(row, 2), questionLabel(q.num), { bold: true });
            dataCell(s.getCell(row, 3), `${Math.round(q.failRate * 100)}%`, {
                align: 'right',
                color: SG_DANGER,
            });
            dataCell(s.getCell(row, 4), q.importance, { align: 'center' });
            row++;
        });
        row++;
    }

    // ── 8. Plan de mejora ──
    sectionHeader(s, row++, '8. Plan de mejora institucional', BRAND_MERGE_END_COL);
    if (plan) {
        severityBadge(s.getCell(row, 2), plan.severidad);
        dataCell(s.getCell(row, 3), `Prioridad ${plan.orden} · Fuente: ${plan.fallbackSource}`, {
            color: SG_MUTED,
        });
        row += 2;
        row = noteBlock(s, row, plan.resumen);

        if (plan.microAcciones.length) {
            sectionHeader(s, row++, 'Acciones inmediatas', BRAND_MERGE_END_COL);
            plan.microAcciones.forEach(a => {
                dataCell(s.getCell(row, 2), `• ${a}`, { wrap: true });
                row++;
            });
            row++;
        }
        if (plan.practicasAulaMacro.length) {
            sectionHeader(s, row++, 'Prácticas de aula (marco MEN/ICFES)', BRAND_MERGE_END_COL);
            plan.practicasAulaMacro.slice(0, 8).forEach(p => {
                dataCell(s.getCell(row, 2), `• ${p}`, { wrap: true });
                row++;
            });
            row++;
        }
        if (plan.hitosTresSemanas.length) {
            sectionHeader(s, row++, 'Hitos — 3 semanas', BRAND_MERGE_END_COL);
            plan.hitosTresSemanas.forEach(h => {
                dataCell(s.getCell(row, 2), `• ${h}`, { wrap: true });
                row++;
            });
            row++;
        }
        if (plan.indicadoresInstitucion.length) {
            sectionHeader(s, row++, 'Indicadores de seguimiento', BRAND_MERGE_END_COL);
            plan.indicadoresInstitucion.forEach(ind => {
                dataCell(s.getCell(row, 2), `• ${ind}`, { wrap: true });
                row++;
            });
            row++;
        }
    } else if (diagnostico?.accionesSugeridas.length) {
        diagnostico.accionesSugeridas.forEach(a => {
            dataCell(s.getCell(row, 2), `• ${a}`, { wrap: true });
            row++;
        });
        row++;
    } else {
        row = noteBlock(
            s,
            row,
            'Sin plan correctivo urgente: sostener rutinas de acompañamiento y monitoreo periódico.'
        );
    }

    // Recomendación general del área (insights)
    const insight = summary.allAreas.find(
        a => normalizarMateriaAModeloArea(a.name) === area || a.name === area
    );
    if (insight?.recomendacion) {
        sectionHeader(s, row++, 'Recomendación coordinación', BRAND_MERGE_END_COL);
        row = noteBlock(s, row, insight.recomendacion);
    }

    s.views = [{ state: 'frozen', xSplit: 1, ySplit: BRAND_CONTENT_START_ROW }];
}

/** Crea una hoja unificada por área evaluada (máx. 5). */
export function appendAreaPlanSheets(ctx: ExtendedExcelContext): void {
    const bundles = buildAreaBundles(ctx);
    for (const bundle of bundles) {
        renderAreaPlanSheet(ctx.wb, ctx, bundle);
    }
}
