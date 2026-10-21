import type { Estudiante } from '@shared/types';
import { ICFES_AREA_COLORS } from '@features/coordinador/lib/icfesAreaColors';
import { institutionsMatch } from '@shared/lib/institucionesAcondicionamiento';

export interface SimSnapshot {
    simId: string;
    count: number;
    avg: number;
    median: number;
    max: number;
    min: number;
    stdDev: number;
    tasaAprobacion: number;
    niveles: { superior: number; alto: number; medio: number; bajo: number };
    subjectAvgs: Record<string, number>;
}

export type CoordinatorSimSummary = {
    simId: string;
    totalStudents: number;
    TODAS: SimSnapshot | null;
    institutions: Record<string, SimSnapshot>;
};

export const MATERIAS = [
    { key: 'lectura crítica', label: 'Lectura', color: ICFES_AREA_COLORS['lectura crítica'] },
    { key: 'matemáticas', label: 'Matemáticas', color: ICFES_AREA_COLORS['matemáticas'] },
    { key: 'sociales y ciudadanas', label: 'Sociales', color: ICFES_AREA_COLORS['sociales y ciudadanas'] },
    { key: 'ciencias naturales', label: 'Ciencias', color: ICFES_AREA_COLORS['ciencias naturales'] },
    { key: 'inglés', label: 'Inglés', color: ICFES_AREA_COLORS['inglés'] },
] as const;

export function getSubjectScore(student: Estudiante, materia: string): number {
    const p = student.puntajes?.[materia];
    if (!p) return 0;
    return typeof p === 'object' ? (p as { puntaje?: number }).puntaje || 0 : p;
}

export const normalizeInstitutionKey = (s: string) =>
    String(s || '')
        .toUpperCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

export function resolveInstitutionSnapshot(
    simData: CoordinatorSimSummary | undefined,
    institutionKey: string,
): SimSnapshot | null {
    if (!simData) return null;
    const instKey = institutionKey?.toUpperCase().trim();
    const showAll = !instKey || instKey === 'TODAS' || instKey === '*';
    if (showAll) return simData.TODAS;

    const matchedKey = Object.keys(simData.institutions || {}).find((k) =>
        institutionsMatch(k, instKey),
    );
    return matchedKey ? simData.institutions[matchedKey] : null;
}

export function buildSnapshotFromStudents(
    simId: string,
    students: Estudiante[],
): SimSnapshot | null {
    if (students.length === 0) return null;
    const scores = students.map((s) => s.puntaje_global || 0).filter((p) => p > 0);
    if (scores.length === 0) return null;

    const sorted = [...scores].sort((a, b) => a - b);
    const n = scores.length;
    const avg = scores.reduce((a, b) => a + b, 0) / n;
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const stdDev = Math.sqrt(scores.reduce((sum, s) => sum + (s - avg) ** 2, 0) / n);

    const niveles = { superior: 0, alto: 0, medio: 0, bajo: 0 };
    students.forEach((s) => {
        const p = s.puntaje_global || 0;
        if (p >= 400) niveles.superior++;
        else if (p >= 325) niveles.alto++;
        else if (p >= 250) niveles.medio++;
        else if (p > 0) niveles.bajo++;
    });

    const subjectAvgs: Record<string, number> = {};
    MATERIAS.forEach((m) => {
        const ss = students.map((s) => getSubjectScore(s, m.key)).filter((v) => v > 0);
        subjectAvgs[m.key] = ss.length > 0 ? ss.reduce((a, b) => a + b, 0) / ss.length : 0;
    });

    return {
        simId,
        count: students.length,
        avg: Math.round(avg),
        median: Math.round(median),
        max: Math.max(...scores, 0),
        min: Math.min(...scores),
        stdDev: Math.round(stdDev),
        tasaAprobacion: Math.round((scores.filter((p) => p >= 300).length / n) * 100),
        niveles,
        subjectAvgs,
    };
}

export function filterStudentsByInstitution(
    students: Estudiante[],
    institutionKey: string,
): Estudiante[] {
    const shouldFilter =
        institutionKey &&
        institutionKey.toUpperCase().trim() !== 'TODAS' &&
        institutionKey.trim() !== '*';
    if (!shouldFilter) return students;

    return students.filter((s) =>
        institutionsMatch(s.informacion_personal?.institucion || '', institutionKey),
    );
}
