/**
 * Política de export Excel coordinador: fuente pedagógica e inclusión condicional de hojas.
 * Evita hojas vacías y activa fallback ICFES (niveles + marcos) sin depender del flag UI.
 */
import type { Estudiante } from '@shared/types';
import type {
    InstitutionMetrics,
    QuestionStat,
} from '@features/coordinador/hooks/useCoordinadorData';
import type { ExecutiveSummary } from '@features/coordinador/lib/executiveModel';
import type { PlanFallbackSource } from '@features/coordinador/lib/referencePerformanceDependencies';
import { hasUsefulQuestionMetadata } from '@features/coordinador/lib/referencePerformanceDependencies';
import { simulationHasPerQuestionTopics } from '@features/coordinador/lib/simulationEligibility';
import {
    computeDepartmentStats,
    computeGapRows,
    computeLevelProfiles,
    studentsWithAreaScores,
} from '@features/coordinador/lib/coordinatorExcelAnalytics';

export type CoordinatorPedagogicalSource = PlanFallbackSource;

export type CoordinatorExcelSheetKey =
    | 'correlaciones'
    | 'perfilNivel'
    | 'sesiones'
    | 'brechas'
    | 'departamentos'
    | 'benchmarkNacional'
    | 'areaPlanIcfes'
    | 'temasCriticos'
    | 'graficos';

export interface CoordinatorExcelPolicyInput {
    summary: ExecutiveSummary;
    inst: InstitutionMetrics;
    allInstitutions: InstitutionMetrics[];
    questionAnalysis: Record<string, QuestionStat[]>;
    simulationId: string;
    evaluatedCount: number;
    registeredCount: number;
    exportStudents: Estudiante[];
}

export interface CoordinatorScientificExcelPolicy {
    pedagogicalSource: CoordinatorPedagogicalSource;
    hasPerQuestionMetadata: boolean;
    referenceModeLabel: string;
    hasSheetData(sheet: CoordinatorExcelSheetKey): boolean;
}

const REFERENCE_MODE_LABELS: Record<CoordinatorPedagogicalSource, string> = {
    question_metadata: 'Metadata curricular por ítem (temarios ICFES)',
    performance_levels: 'Niveles de desempeño + marcos de referencia Saber 11° (ICFES/MEN)',
    hybrid: 'Híbrido: ítems críticos + niveles de desempeño y marco ICFES',
};

export function resolveCoordinatorPedagogicalSource(
    simulationId: string,
    questionAnalysis: Record<string, QuestionStat[]>,
    preguntasCriticasCount: number
): CoordinatorPedagogicalSource {
    const hasMeta =
        simulationHasPerQuestionTopics(simulationId) && hasUsefulQuestionMetadata(questionAnalysis);
    if (hasMeta && preguntasCriticasCount > 0) return 'hybrid';
    if (hasMeta) return 'question_metadata';
    return 'performance_levels';
}

export function referenceModeLabel(source: CoordinatorPedagogicalSource): string {
    return REFERENCE_MODE_LABELS[source];
}

export function buildCoordinatorScientificExcelPolicy(
    input: CoordinatorExcelPolicyInput
): CoordinatorScientificExcelPolicy {
    const {
        summary,
        inst,
        allInstitutions,
        questionAnalysis,
        simulationId,
        evaluatedCount,
        registeredCount,
    } = input;

    const pedagogicalSource = resolveCoordinatorPedagogicalSource(
        simulationId,
        questionAnalysis,
        summary.preguntasCriticas.length
    );
    const hasPerQuestionMetadata =
        simulationHasPerQuestionTopics(simulationId) && hasUsefulQuestionMetadata(questionAnalysis);

    function hasSheetData(sheet: CoordinatorExcelSheetKey): boolean {
        switch (sheet) {
            case 'correlaciones':
                return studentsWithAreaScores(inst.students).length >= 3;
            case 'perfilNivel':
                return computeLevelProfiles(inst.students).some(p => p.count > 0);
            case 'sesiones':
                return registeredCount > 0;
            case 'brechas':
                return computeGapRows(inst.students).rows.length > 0;
            case 'departamentos':
                return computeDepartmentStats(inst.students).length > 0;
            case 'benchmarkNacional':
                return allInstitutions.length >= 2;
            case 'areaPlanIcfes':
                return (
                    summary.competenciasDiagnostico.some(d => d.puntaje > 0) ||
                    inst.subjectStats.some(s => s.countStudents > 0 && s.avg > 0)
                );
            case 'temasCriticos':
                return false;
            case 'graficos':
                return evaluatedCount > 0;
            default:
                return false;
        }
    }

    return {
        pedagogicalSource,
        hasPerQuestionMetadata,
        referenceModeLabel: REFERENCE_MODE_LABELS[pedagogicalSource],
        hasSheetData,
    };
}
