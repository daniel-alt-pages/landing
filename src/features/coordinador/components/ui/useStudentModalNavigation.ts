'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Estudiante } from '@shared/types';

export function getStudentDocId(student: Estudiante | null | undefined): string {
    return String(student?.informacion_personal?.numero_identificacion || '').trim();
}

type Options = {
    /** Ordenar por puntaje global descendente (default: true). */
    sortByScore?: boolean;
    /** Solo incluir estudiantes con puntaje > 0. */
    onlyScored?: boolean;
};

export function useStudentModalNavigation(
    initialStudent: Estudiante,
    allStudents: Estudiante[] | undefined,
    options: Options = {},
) {
    const { sortByScore = true, onlyScored = false } = options;

    const sortedStudents = useMemo(() => {
        let list = [...(allStudents || [])].filter(s => getStudentDocId(s));
        if (onlyScored) {
            list = list.filter(s => (s.puntaje_global || 0) > 0);
        }
        if (sortByScore) {
            list.sort((a, b) => (b.puntaje_global || 0) - (a.puntaje_global || 0));
        }
        return list;
    }, [allStudents, onlyScored, sortByScore]);

    const [currentStudent, setCurrentStudent] = useState(initialStudent);

    useEffect(() => {
        setCurrentStudent(initialStudent);
    }, [getStudentDocId(initialStudent)]);

    const currentIndex = useMemo(() => {
        const id = getStudentDocId(currentStudent);
        if (!id || sortedStudents.length === 0) return -1;
        return sortedStudents.findIndex(s => getStudentDocId(s) === id);
    }, [currentStudent, sortedStudents]);

    const canPrev = currentIndex > 0;
    const canNext = currentIndex >= 0 && currentIndex < sortedStudents.length - 1;
    const showNav = sortedStudents.length > 1 && currentIndex >= 0;

    const goPrev = useCallback(() => {
        if (currentIndex <= 0) return;
        setCurrentStudent(sortedStudents[currentIndex - 1]);
    }, [currentIndex, sortedStudents]);

    const goNext = useCallback(() => {
        if (currentIndex < 0 || currentIndex >= sortedStudents.length - 1) return;
        setCurrentStudent(sortedStudents[currentIndex + 1]);
    }, [currentIndex, sortedStudents]);

    useEffect(() => {
        if (!showNav) return;
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goPrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goNext();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showNav, goPrev, goNext]);

    return {
        currentStudent,
        currentIndex,
        total: sortedStudents.length,
        canPrev,
        canNext,
        showNav,
        goPrev,
        goNext,
    };
}
