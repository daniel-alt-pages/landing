/**
 * Simulation types for versioned data structure
 */

import type { Estudiante } from '@shared/types';

export interface SimulationManifest {
    id: string;
    name: string;
    date: string;
    version?: string;
    totalStudents: number;
    sessions?: string[];
    generatedAt?: string;
}

export interface SimulationStudentsFile {
    version: string;
    simulationId: string;
    students: Record<string, Estudiante>;
    index: string[];
}

export interface CurrentSimulation {
    active: string;
    available: string[];
}

export type PlannerSessionState = 'pendiente' | 'estudiado' | 'repasar';

export interface PlannerCustomizationPayload {
    targetDateISO?: string;
    weeksAvailable?: number;
    dailyAvailability?: Record<string, number>;
    busyDates?: string[];
    customEventsPerDay?: number;
    horasObjetivoSemana?: number;
    horasObjetivoDia?: number;
    sessionStates?: Record<string, PlannerSessionState>;
    source?: 'local' | 'cloud';
    updatedAt?: number;
}

export interface PlannerGlobalProfile extends PlannerCustomizationPayload {
    studentId?: string;
}

export interface PlannerSimulationOverride extends PlannerCustomizationPayload {
    studentId?: string;
    simulationId?: string;
}

export interface PlannerMergedProfile {
    global: PlannerGlobalProfile | null;
    simulation: PlannerSimulationOverride | null;
    merged: PlannerCustomizationPayload | null;
    cloudUpdatedAt: number;
}

export interface PlannerQuotaState {
    dateKey: string;
    uploadsUsed: number;
    uploadsLimit: number;
    remaining: number;
}
