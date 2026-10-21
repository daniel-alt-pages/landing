'use client';

import { useCallback, useState } from 'react';
import type { Estudiante } from '@shared/types';
import type { CoordinadorHistoricoFirestore } from '../CoordinadorHistoricoView';
import {
    buildSnapshotFromStudents,
    filterStudentsByInstitution,
    resolveInstitutionSnapshot,
    type CoordinatorSimSummary,
    type SimSnapshot,
} from '../lib/snapshotHelpers';

export function useHistoricoSnapshots(firestore: CoordinadorHistoricoFirestore) {
    const { getCoordinatorSummary, getAllStudents } = firestore;
    const [historicalData, setHistoricalData] = useState<Record<string, SimSnapshot>>({});
    const [loadingHistory, setLoadingHistory] = useState(false);

    const loadHistoricalSnapshots = useCallback(
        async (institutionKey: string, simulationIds: string[]) => {
            setLoadingHistory(true);
            try {
                const summary = (await getCoordinatorSummary()) as Record<string, CoordinatorSimSummary>;
                const result: Record<string, SimSnapshot> = {};
                for (const simId of simulationIds) {
                    const snapshot = resolveInstitutionSnapshot(summary[simId], institutionKey);
                    if (snapshot) {
                        result[simId] = { ...snapshot, simId };
                    }
                }
                setHistoricalData(result);
            } catch (e) {
                console.warn('Error loading coordinator summary, falling back:', e);
                const result: Record<string, SimSnapshot> = {};
                for (const simId of simulationIds) {
                    try {
                        const allStudents = await getAllStudents(simId);
                        const myStudents = filterStudentsByInstitution(allStudents, institutionKey);
                        const snapshot = buildSnapshotFromStudents(simId, myStudents);
                        if (snapshot) result[simId] = snapshot;
                    } catch (loadErr) {
                        console.warn(`Error loading sim ${simId}:`, loadErr);
                    }
                }
                setHistoricalData(result);
            } finally {
                setLoadingHistory(false);
            }
        },
        [getAllStudents, getCoordinatorSummary],
    );

    const mergeCurrentInstitutionSnapshot = useCallback(
        (
            simId: string,
            inst: {
                students: Estudiante[];
                avg: number;
                median: number;
                max: number;
                min: number;
                tasaAprobacion: number;
                niveles: SimSnapshot['niveles'];
                subjectStats: Array<{ key: string; avg: number }>;
            },
        ) => {
            const subjectAvgs: Record<string, number> = {};
            inst.subjectStats.forEach((s) => {
                subjectAvgs[s.key] = s.avg;
            });

            const scores = inst.students.map((s) => s.puntaje_global || 0).filter((p) => p > 0);
            const n = scores.length || 1;
            const avg = scores.reduce((a, b) => a + b, 0) / n;
            const stdDev = Math.sqrt(scores.reduce((sum, s) => sum + (s - avg) ** 2, 0) / n);

            setHistoricalData((prev) => ({
                ...prev,
                [simId]: {
                    simId,
                    count: inst.students.length,
                    avg: inst.avg,
                    median: inst.median,
                    max: inst.max,
                    min: inst.min,
                    stdDev: Math.round(stdDev),
                    tasaAprobacion: inst.tasaAprobacion,
                    niveles: inst.niveles,
                    subjectAvgs,
                },
            }));
        },
        [],
    );

    return {
        historicalData,
        loadingHistory,
        loadHistoricalSnapshots,
        mergeCurrentInstitutionSnapshot,
    };
}
