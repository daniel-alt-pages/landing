/**
 * Elegibilidad por simulacro en el panel coordinador.
 *
 * Temas / metadata ICFES por pregunta: solo SG11-17 (pipeline temarios + question_metadata).
 * El resto usa plan y métricas por área / ítems críticos sin temario por pregunta.
 */

/** Diagnóstico marco ICFES por competencia (panel + Excel). Desactivado hasta tener recursos. */
export const COORDINADOR_ICFES_COMPETENCIAS_MARCO_ENABLED = false;

/** Único simulacro con temarios y metadata enriquecida por ítem. */
export const SIM_ID_WITH_PER_QUESTION_TOPICS = 'SG11-17';

/** @deprecated Usar SIM_ID_WITH_PER_QUESTION_TOPICS */
export const SIM_IDS_PENSUM_DETALLADO_OK = [SIM_ID_WITH_PER_QUESTION_TOPICS] as const;

/** Etiqueta UI (pensum / competencias con ítems). */
export const SIM_ID_PENSUM_DETALLADO_OK = SIM_ID_WITH_PER_QUESTION_TOPICS;

export function canonicalSimulationId(simId: string): string {
    return String(simId ?? '')
        .trim()
        .replace(/-T$/i, '');
}

/** True solo si el simulacro tiene question_metadata con temas/ICFES por pregunta (hoy: SG11-17). */
export function simulationHasPerQuestionTopics(simId: string): boolean {
    return canonicalSimulationId(simId).toUpperCase() === SIM_ID_WITH_PER_QUESTION_TOPICS;
}

/** True solo si debe mostrarse PensumPanel con temario detallado. */
export function simulationSupportsPensumFullInsights(simId: string): boolean {
    return simulationHasPerQuestionTopics(simId);
}
