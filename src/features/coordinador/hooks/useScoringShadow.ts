'use client';

import { useEffect, useState } from 'react';
import { isLocalDevHost } from '@shared/lib/isLocalDev';
import {
    fetchScoringShadow,
    filterShadowByInstitution,
    type ScoringShadowPayload,
    type ScoringShadowStudent,
} from '@features/coordinador/lib/scoringShadow';

const shadowMemory = new Map<string, ScoringShadowPayload>();

export function useScoringShadow(simId: string, institution: string) {
    const [payload, setPayload] = useState<ScoringShadowPayload | null>(() =>
        simId ? shadowMemory.get(simId) ?? null : null,
    );
    const [loading, setLoading] = useState(() =>
        simId ? !shadowMemory.has(simId) : false,
    );
    const enabled = isLocalDevHost();

    useEffect(() => {
        if (!enabled || !simId) {
            setPayload(null);
            setLoading(false);
            return;
        }
        let cancelled = false;
        const hasStale = shadowMemory.has(simId);
        if (!hasStale) setLoading(true);
        fetchScoringShadow(simId)
            .then((data) => {
                if (cancelled) return;
                if (data) shadowMemory.set(simId, data);
                setPayload(data);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [enabled, simId]);

    const rows: ScoringShadowStudent[] = payload
        ? filterShadowByInstitution(payload.estudiantes, institution)
        : [];

    return {
        enabled,
        loading,
        available: !!payload,
        payload,
        rows,
    };
}
