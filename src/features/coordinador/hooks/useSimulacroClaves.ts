'use client';

import { useEffect, useState } from 'react';
import {
    getSimulationEstadisticas,
    type SimulacionEstadisticas,
} from '@features/simulacro/lib/firestoreService';

/** Solo documento `estadisticas` (1 read, cacheada) — claves oficiales del simulacro. */
export function useSimulacroClaves(simId: string) {
    const [stats, setStats] = useState<SimulacionEstadisticas | null>(null);
    const [loading, setLoading] = useState(Boolean(simId));
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!simId) {
            setStats(null);
            setLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        getSimulationEstadisticas(simId)
            .then((data) => {
                if (cancelled) return;
                setStats(data);
                if (!data || Object.keys(data.materias || {}).length === 0) {
                    setError('No hay claves publicadas para este simulacro.');
                }
            })
            .catch(() => {
                if (!cancelled) setError('No se pudieron cargar las claves del simulacro.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [simId]);

    return { stats, loading, error };
}
