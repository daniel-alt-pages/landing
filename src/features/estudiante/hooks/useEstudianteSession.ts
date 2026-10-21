'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';
import { ensureEstudianteSessionBootstrap } from '@features/estudiante/hooks/ensureEstudianteSessionBootstrap';

export const ESTUDIANTE_STORAGE_KEYS = {
    studentId: 'student_id',
    studentName: 'student_name',
    studentEmail: 'student_email',
    studentData: 'student_data',
    simulacroSelected: 'simulacro_selected',
    linkedProfiles: 'linked_profiles',
    selectedProfileId: 'selected_profile_id',
    courseSelected: 'course_selected',
    courseOnly: 'course_only',
    panelMode: 'student_panel_mode',
} as const;

export type EstudianteSessionOptions = {
    storageKeys?: typeof ESTUDIANTE_STORAGE_KEYS;
};

function readStorage(key: string): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(key) || '';
}

export function useEstudianteSession(options: EstudianteSessionOptions = {}) {
    const keys = options.storageKeys ?? ESTUDIANTE_STORAGE_KEYS;
    const pathname = usePathname();
    const router = useRouter();
    const isDemo = isDemoEstudianteRoute(pathname);

    const [studentId, setStudentIdState] = useState(() => readStorage(keys.studentId));
    const [simulacroSelected, setSimulacroSelectedState] = useState(() =>
        readStorage(keys.simulacroSelected),
    );

    const syncFromStorage = useCallback(() => {
        setStudentIdState(readStorage(keys.studentId));
        setSimulacroSelectedState(readStorage(keys.simulacroSelected));
    }, [keys.simulacroSelected, keys.studentId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        ensureEstudianteSessionBootstrap(pathname);
        syncFromStorage();
    }, [pathname, syncFromStorage]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const onSimChange = () => syncFromStorage();
        window.addEventListener('sg-simulacro-selected', onSimChange);
        window.addEventListener('storage', onSimChange);
        return () => {
            window.removeEventListener('sg-simulacro-selected', onSimChange);
            window.removeEventListener('storage', onSimChange);
        };
    }, [syncFromStorage]);

    const setStudentId = useCallback(
        (id: string) => {
            localStorage.setItem(keys.studentId, id);
            setStudentIdState(id);
        },
        [keys.studentId],
    );

    const setSimulacroSelected = useCallback(
        (simId: string) => {
            localStorage.setItem(keys.simulacroSelected, simId);
            setSimulacroSelectedState(simId);
        },
        [keys.simulacroSelected],
    );

    const basePath = useMemo(() => (isDemo ? '/demo/estudiante' : '/estudiante'), [isDemo]);

    const navigateTo = useCallback(
        (segment: string, query?: Record<string, string>) => {
            let pathPart = segment;
            let qsFromSegment = '';
            if (segment.includes('?')) {
                const splitAt = segment.indexOf('?');
                pathPart = segment.slice(0, splitAt);
                qsFromSegment = segment.slice(splitAt + 1);
            }
            const cleaned = pathPart.replace(/^\/(demo\/)?estudiante\//, '').replace(/^\//, '');
            const qs = query
                ? `?${new URLSearchParams(query).toString()}`
                : qsFromSegment
                  ? `?${qsFromSegment}`
                  : '';
            const segmentPath = !cleaned || cleaned === 'dashboard' ? '' : `/${cleaned}`;
            router.push(`${basePath}${segmentPath}${qs}`);
        },
        [basePath, router],
    );

    return {
        studentId,
        simulacroSelected,
        setStudentId,
        setSimulacroSelected,
        isDemo,
        basePath,
        navigateTo,
        storageKeys: keys,
    };
}
