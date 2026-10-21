import type { Estudiante } from '@shared/types';

export interface InstitutionMetrics {
    name: string;
    students: Estudiante[];
    avg: number;
    median: number;
    stdDev: number;
    coefVar: number;
    max: number;
    min: number;
    p25: number;
    p75: number;
    p90: number;
    iqr: number;
    tasaAprobacion: number;
    niveles: { superior: number; alto: number; medio: number; bajo: number };
    distribucion: Record<string, number>;
    subjectStats: SubjectStat[];
    top5: Estudiante[];
    enRiesgo: Estudiante[];
}

export interface SubjectStat {
    name: string;
    key: string;
    avg: number;
    median: number;
    mode: number;
    min: number;
    max: number;
    stdDev: number;
    varPct: number;
    correctas: number;
    totalPreguntas: number;
    countStudents: number;
}

export interface QuestionStat {
    num: number;
    failed: number;
    total: number;
    rate: number;
    correct: string;
    counts: Record<string, number>;
    studentMap: Record<string, string[]>;
    blankCount?: number;
    sessionMissingCount?: number;
    sessionMissingRate?: number;
    highSessionMissing?: boolean;
}

export interface AlertaEstudiante {
    nombre: string;
    id: string;
    global: number;
    areaDebil: string;
    minPuntaje: number;
    brecha: number;
    nivel: string;
    recomendacion: string;
}

export interface CoordinadorData {
    myInstitution: InstitutionMetrics | null;
    allInstitutions: InstitutionMetrics[];
    questionAnalysis: Record<string, QuestionStat[]>;
    alertas: {
        critico: AlertaEstudiante[];
        alto: AlertaEstudiante[];
        moderado: AlertaEstudiante[];
        monitoreo: AlertaEstudiante[];
    };
    ranking: Estudiante[];
    availableSimulations: string[];
    currentSimulation: string;
    availableInstitutions: string[];
    currentInstitution: string;
    /**
     * Cohorte de la IE seleccionada ANTES del filtro curso PIFA.
     * Sirve para comparativa por curso (varios grupos en la misma institución).
     */
    cohortStudents: Estudiante[];
    /** Filtro PIFA unificado (grado/curso: 9, 11-1, 10-A, …). */
    availableCursos: string[];
    currentCurso: string;
    loading: boolean;
    error: string | null;
    setSimulation: (sim: string) => void;
    setInstitution: (inst: string) => void;
    setCurso: (curso: string) => void;
    loadFullStudents: () => Promise<void>;
}
