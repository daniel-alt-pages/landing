'use client';

import { useEffect, useMemo, useState } from 'react';
import type { InstitutionMetrics } from './coordinadorTypes';
import {
    computeBenchmarkGoals,
    countEvaluatedStudents,
    institutionAreaPromedio,
    resolveInstitutionTerritory,
    type BenchmarkGoalRow,
} from '@features/benchmark/lib/benchmarkContextHelpers';
import {
    findSimilarSchools,
    getDepartmentPosition,
    loadNationalRankings,
    similarSchoolsScope,
    type SchoolRecord,
} from '@features/benchmark/lib/nationalData';

export interface BenchmarkContextData {
    loading: boolean;
    error: string | null;
    territoryLabel: string;
    municipalityLabel: string;
    territorySource: 'registry' | 'students' | 'unknown';
    areaPromedio: number;
    evaluatedCount: number;
    departmentPosition: number;
    departmentTotal: number;
    departmentPctSuperior: number;
    topDepartmentSchools: SchoolRecord[];
    similarSchools: SchoolRecord[];
    similarSchoolsScope: 'territory' | 'mixed' | 'national';
    rankingsLoaded: number;
    goals: BenchmarkGoalRow[];
}

const EMPTY: BenchmarkContextData = {
    loading: true,
    error: null,
    territoryLabel: 'Colombia',
    municipalityLabel: '',
    territorySource: 'unknown',
    areaPromedio: 0,
    evaluatedCount: 0,
    departmentPosition: 0,
    departmentTotal: 0,
    departmentPctSuperior: 0,
    topDepartmentSchools: [],
    similarSchools: [],
    similarSchoolsScope: 'national',
    rankingsLoaded: 0,
    goals: [],
};

export function useBenchmarkContext(inst: InstitutionMetrics | null): BenchmarkContextData {
    const [schools, setSchools] = useState<SchoolRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!inst) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        loadNationalRankings()
            .then((data) => {
                if (cancelled) return;
                setSchools(data);
                if (data.length === 0) {
                    setError('No se cargaron rankings nacionales.');
                }
            })
            .catch(() => {
                if (!cancelled) setError('Error al cargar rankings nacionales.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [inst?.name]);

    return useMemo(() => {
        if (!inst) return { ...EMPTY, loading: false };

        const territory = resolveInstitutionTerritory(inst.name, inst.students);
        const territoryLabel = territory.department;
        const municipalityLabel = territory.municipality;
        const areaPromedio = institutionAreaPromedio(inst);
        const evaluatedCount = countEvaluatedStudents(inst.students);
        const goals = computeBenchmarkGoals(inst);

        const dept = getDepartmentPosition(schools, territoryLabel, areaPromedio);
        const departmentPctSuperior =
            dept.total > 0 ? Math.round((1 - dept.position / dept.total) * 100) : 0;
        const similarLimit = 5;
        const similarSchools = schools.length
            ? findSimilarSchools(schools, areaPromedio, similarLimit, territoryLabel)
            : [];

        return {
            loading,
            error: schools.length === 0 && !loading ? error : null,
            territoryLabel,
            municipalityLabel,
            territorySource: territory.source,
            areaPromedio,
            evaluatedCount,
            departmentPosition: dept.position,
            departmentTotal: dept.total,
            departmentPctSuperior,
            topDepartmentSchools: dept.topSchools,
            similarSchools,
            similarSchoolsScope: similarSchoolsScope(schools, territoryLabel, similarSchools),
            rankingsLoaded: schools.length,
            goals,
        };
    }, [inst, schools, loading, error]);
}
