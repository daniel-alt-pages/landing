'use client';

import { useEffect, useState } from 'react';
import {
    isGlobalCoordinatorScope,
    resolveCoordinatorSelectedInstitution,
} from '@features/auth/lib/admin-auth';
import type { CoordinadorDataOptions, CoordinadorStorageKeys } from '@features/coordinador/hooks/coordinadorDataOptions';
import { COORD_STORAGE_KEYS } from '@features/coordinador/hooks/coordinadorDataOptions';
import { canonicalInstitutionName } from '@shared/lib/institucionesAcondicionamiento';

function displayInstitutionName(raw: string): string {
    const key = String(raw || '').trim();
    if (!key || key === '*' || key.toUpperCase() === 'TODAS') return key;
    return canonicalInstitutionName(key);
}

export type CoordinadorFilterState = {
    baseInstitution: string;
    selectedInstitution: string;
    currentSimulation: string;
    setBaseInstitution: (v: string) => void;
    setSelectedInstitution: (v: string) => void;
    setCurrentSimulation: (v: string) => void;
    isGlobalCoordinator: boolean;
};

function resolveInstitutionFromStorage(
    resolved: CoordinadorDataOptions,
    storageKeys: CoordinadorStorageKeys,
): { baseInstitution: string; selectedInstitution: string; currentSimulation: string } {
    if (typeof window === 'undefined') {
        return { baseInstitution: '', selectedInstitution: '', currentSimulation: '' };
    }

    let inst = localStorage.getItem(storageKeys.institution) || '';
    const bootstrap = (resolved.bootstrapInstitution || '').trim();
    const bootstrapGlobal =
        !bootstrap || bootstrap === '*' || bootstrap.toUpperCase() === 'TODAS';

    if (bootstrap && !bootstrapGlobal) {
        inst = bootstrap;
    } else if (!inst && bootstrap) {
        inst = bootstrap;
    }

    const isGlobal = isGlobalCoordinatorScope(inst);
    const savedSelected = (localStorage.getItem(storageKeys.selectedInstitution) || '').trim();
    let selectedInstitution = '';
    if (bootstrap && !bootstrapGlobal) {
        selectedInstitution = resolveCoordinatorSelectedInstitution(bootstrap, bootstrap);
    } else if (isGlobal) {
        selectedInstitution = savedSelected || '';
    } else {
        selectedInstitution = resolveCoordinatorSelectedInstitution(inst, savedSelected);
    }

    const currentSimulation = localStorage.getItem(storageKeys.selectedSimulation) || '';
    return {
        baseInstitution: displayInstitutionName(inst) || inst,
        selectedInstitution: displayInstitutionName(selectedInstitution) || selectedInstitution,
        currentSimulation,
    };
}

/** Institución + simulacro seleccionados (localStorage + bootstrap demo). */
export function useCoordinadorFilters(
    resolved: CoordinadorDataOptions,
    storageKeys: CoordinadorStorageKeys,
): CoordinadorFilterState {
    const [baseInstitution, setBaseInstitution] = useState(
        () => resolveInstitutionFromStorage(resolved, storageKeys).baseInstitution,
    );
    const [selectedInstitution, setSelectedInstitution] = useState(
        () => resolveInstitutionFromStorage(resolved, storageKeys).selectedInstitution,
    );
    const [currentSimulation, setCurrentSimulation] = useState(
        () => resolveInstitutionFromStorage(resolved, storageKeys).currentSimulation,
    );

    useEffect(() => {
        const next = resolveInstitutionFromStorage(resolved, storageKeys);
        let inst = next.baseInstitution;
        const bootstrap = (resolved.bootstrapInstitution || '').trim();
        const bootstrapGlobal =
            !bootstrap || bootstrap === '*' || bootstrap.toUpperCase() === 'TODAS';

        if (bootstrap && !bootstrapGlobal) {
            inst = bootstrap;
            localStorage.setItem(storageKeys.institution, inst);
        } else if (!inst && bootstrap) {
            inst = bootstrap;
            localStorage.setItem(storageKeys.institution, inst);
        }
        setBaseInstitution(inst);

        const isGlobal = isGlobalCoordinatorScope(inst);
        const savedSelected = (localStorage.getItem(storageKeys.selectedInstitution) || '').trim();
        let nextSelected = '';
        if (bootstrap && !bootstrapGlobal) {
            nextSelected = displayInstitutionName(
                resolveCoordinatorSelectedInstitution(bootstrap, bootstrap),
            );
            setSelectedInstitution(nextSelected);
            localStorage.setItem(storageKeys.selectedInstitution, nextSelected);
        } else if (isGlobal) {
            nextSelected = displayInstitutionName(savedSelected || '');
            setSelectedInstitution(nextSelected);
            if (nextSelected && nextSelected !== savedSelected) {
                localStorage.setItem(storageKeys.selectedInstitution, nextSelected);
            }
        } else {
            nextSelected = displayInstitutionName(
                resolveCoordinatorSelectedInstitution(inst, savedSelected),
            );
            if (nextSelected !== savedSelected) {
                localStorage.setItem(storageKeys.selectedInstitution, nextSelected);
            }
            setSelectedInstitution(nextSelected);
        }

        const savedSim = localStorage.getItem(storageKeys.selectedSimulation) || '';
        if (savedSim) setCurrentSimulation(savedSim);
    }, [
        resolved.bootstrapInstitution,
        storageKeys.institution,
        storageKeys.selectedInstitution,
        storageKeys.selectedSimulation,
    ]);

    const isGlobalCoordinator = isGlobalCoordinatorScope(baseInstitution);

    return {
        baseInstitution,
        selectedInstitution,
        currentSimulation,
        setBaseInstitution,
        setSelectedInstitution,
        setCurrentSimulation,
        isGlobalCoordinator,
    };
}

export { COORD_STORAGE_KEYS };
