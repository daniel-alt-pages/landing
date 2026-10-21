/**
 * Política de navegación del panel coordinador (NO revertir sin pedido explícito).
 *
 * 1. Marco ICFES por competencia → desactivado (`COORDINADOR_ICFES_COMPETENCIAS_MARCO_ENABLED`).
 * 2. Pensum → ítem de menú solo si el simulacro activo es SG11-17 (metadata por ítem).
 * 3. /coordinador/competencias → redirect legado a desempeño.
 */

import { simulationSupportsPensumFullInsights } from '@features/coordinador/lib/simulationEligibility';

export type CoordinatorNavItemId =
    | 'dashboard'
    | 'desempeno'
    | 'pensum'
    | 'estudiantes'
    | 'respuestas'
    | 'analisis'
    | 'comparativa'
    | 'historico';

/** Orden canónico del sidebar (pensum se filtra por simulacro). */
export const COORDINATOR_NAV_ORDER: CoordinatorNavItemId[] = [
    'dashboard',
    'desempeno',
    'pensum',
    'estudiantes',
    'respuestas',
    'analisis',
    'comparativa',
    'historico',
];

export function shouldShowPensumNav(simulationId: string): boolean {
    return simulationSupportsPensumFullInsights(simulationId);
}

export function filterCoordinatorNavIds(simulationId: string): CoordinatorNavItemId[] {
    const showPensum = shouldShowPensumNav(simulationId);
    return COORDINATOR_NAV_ORDER.filter((id) => id !== 'pensum' || showPensum);
}

export function readSelectedSimulationFromStorage(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('coordinator_selected_simulation') || '';
}

/** Sincroniza sidebar / mobile nav con el simulacro del header (useCoordinadorData). */
export const COORDINATOR_SIMULATION_EVENT = 'sg-coordinator-simulation';

export function broadcastCoordinatorSimulation(simulationId: string): void {
    if (typeof window === 'undefined' || !simulationId) return;
    window.dispatchEvent(
        new CustomEvent(COORDINATOR_SIMULATION_EVENT, {
            detail: { simulationId },
        }),
    );
}
