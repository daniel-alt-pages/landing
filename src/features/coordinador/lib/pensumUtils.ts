import type { CriticalQuestion } from '@features/coordinador/lib/executiveModel';
import { macroGuia, normalizarMateriaAModeloArea } from '@features/coordinador/lib/macroReferencias';
import { questionLabel } from '@/lib/questionLabel';

export function formatSigned(value: number, suffix = '') {
    return `${value >= 0 ? '+' : ''}${value}${suffix}`;
}

export function buildQuestionStudyFocus(q: CriticalQuestion) {
    const areaNombre = normalizarMateriaAModeloArea(q.materia) ?? q.materia;
    const macro = macroGuia(areaNombre);
    const idx = Math.max(0, (q.num - 1) % Math.max(1, macro?.competenciasFoco.length ?? 1));
    const errorPct = Math.round(q.failRate * 100);
    const aciertoPct = Math.max(0, 100 - errorPct);
    const margenSobreUmbral = errorPct - 50;
    const competencia = macro?.competenciasFoco[idx] ?? `Competencia evaluada en ${areaNombre}`;
    const practica =
        macro?.practicasAula[idx] ?? `Taller focalizado sobre el contenido evaluado en ${questionLabel(q.num)}.`;
    const evidencia =
        macro?.evidenciaSeguimiento[idx % Math.max(1, macro?.evidenciaSeguimiento.length ?? 1)] ??
        `Mini-evaluable de seguimiento para ${questionLabel(q.num)}.`;

    return {
        areaNombre,
        eje: competencia,
        accion: practica,
        evidencia,
        errorPct,
        aciertoPct,
        margenSobreUmbral,
        afectados: `${q.failedCount}/${q.total}`,
    };
}
