/**
 * Lookup PIFA: documento → curso_grupo + grado (9/10/11).
 * Fuente: shared/config/pifa_curso_por_documento.json
 * (generado desde data/input/SG11 - 24/Todos los cursos/PIFA-2026-TODOS-LOS-ESTUDIANTES.xlsx)
 */
import catalog from '@shared/config/pifa_curso_por_documento.json';
import type { Estudiante } from '@shared/types';

export type PifaCursoEntry = {
    curso_grupo: string;
    grado: string;
    institucion?: string;
};

type CatalogShape = {
    by_documento?: Record<string, PifaCursoEntry>;
    default?: { by_documento?: Record<string, PifaCursoEntry> };
};

export const PIFA_GRADO_TODOS = 'TODOS';
export const PIFA_CURSO_TODOS = 'TODOS';
export const PIFA_SIN_DATO = 'SIN DATO';
export const PIFA_GRADO_OPTION_PREFIX = 'GRADO:';

export function pifaGradoOption(grado: string): string {
    return `${PIFA_GRADO_OPTION_PREFIX}${grado.trim()}`;
}

export function gradoFromPifaOption(value: string): string | null {
    if (!value.startsWith(PIFA_GRADO_OPTION_PREFIX)) return null;
    return value.slice(PIFA_GRADO_OPTION_PREFIX.length).trim() || null;
}

/** Individuales / pago único: sin filtro ni comparativa por curso. */
export function isIndividualInstitution(name: string | undefined | null): boolean {
    const n = String(name || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    if (!n) return false;
    return (
        n.startsWith('INDIVIDUAL') ||
        n.includes('PROYECTO SECUNDARIO') ||
        n.includes('PAGO UNICO')
    );
}

function resolveByDocumento(raw: unknown): Record<string, PifaCursoEntry> {
    const c = raw as CatalogShape;
    return c?.by_documento || c?.default?.by_documento || {};
}

/** Mutable: se puede rehidratar desde /data/config si el import llega vacío. */
let BY_DOC: Record<string, PifaCursoEntry> = resolveByDocumento(catalog);
let catalogLoad: Promise<number> | null = null;

export function pifaCatalogSize(): number {
    return Object.keys(BY_DOC).length;
}

/** Asegura catálogo PIFA en cliente (fallback fetch público). */
export function ensurePifaCatalogLoaded(): Promise<number> {
    if (pifaCatalogSize() >= 100) return Promise.resolve(pifaCatalogSize());
    if (typeof fetch === 'undefined') return Promise.resolve(pifaCatalogSize());
    if (!catalogLoad) {
        catalogLoad = fetch('/data/config/pifa_curso_por_documento.json')
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                const next = resolveByDocumento(data);
                if (Object.keys(next).length > Object.keys(BY_DOC).length) {
                    BY_DOC = next;
                }
                return pifaCatalogSize();
            })
            .catch(() => pifaCatalogSize());
    }
    return catalogLoad;
}

export function normalizeDocumentoId(value: string | number | undefined | null): string {
    return String(value || '').replace(/\D/g, '');
}

export function lookupPifaCurso(documento: string | number | undefined | null): PifaCursoEntry | null {
    const doc = normalizeDocumentoId(documento);
    if (!doc) return null;
    return BY_DOC[doc] ?? null;
}

export function enrichEstudianteConPifaCurso(student: Estudiante): Estudiante {
    const doc = student.informacion_personal?.numero_identificacion;
    const hit = lookupPifaCurso(doc);
    if (!hit) return student;
    return {
        ...student,
        informacion_personal: {
            ...student.informacion_personal,
            curso_grupo: hit.curso_grupo || undefined,
            grado: hit.grado || undefined,
        },
    };
}

export function enrichEstudiantesConPifaCurso(students: readonly Estudiante[]): Estudiante[] {
    return students.map(enrichEstudianteConPifaCurso);
}

export function studentGradoKey(student: Estudiante): string {
    const g = String(student.informacion_personal?.grado || '').trim();
    return g || PIFA_SIN_DATO;
}

export function studentCursoKey(student: Estudiante): string {
    const c = String(student.informacion_personal?.curso_grupo || '').trim();
    return c || PIFA_SIN_DATO;
}

export function filterStudentsByPifaCurso(
    students: readonly Estudiante[],
    grado: string,
    curso: string,
): Estudiante[] {
    const g = (grado || PIFA_GRADO_TODOS).trim();
    const c = (curso || PIFA_CURSO_TODOS).trim();
    const filterGrado = g && g !== PIFA_GRADO_TODOS;
    const filterCurso = c && c !== PIFA_CURSO_TODOS;
    if (!filterGrado && !filterCurso) return [...students];

    return students.filter((s) => {
        if (filterGrado && studentGradoKey(s) !== g) return false;
        if (filterCurso && studentCursoKey(s) !== c) return false;
        return true;
    });
}

/** Opciones de grado presentes en la cohorte (TODOS primero). */
export function collectGradoOptions(students: readonly Estudiante[]): string[] {
    const set = new Set<string>();
    let hasAny = false;
    for (const s of students) {
        const g = studentGradoKey(s);
        if (g !== PIFA_SIN_DATO) hasAny = true;
        set.add(g);
    }
    if (!hasAny && set.size <= 1) return [];
    const ordered = [PIFA_GRADO_TODOS];
    for (const g of ['9', '10', '11']) {
        if (set.has(g)) ordered.push(g);
    }
    if (set.has(PIFA_SIN_DATO)) ordered.push(PIFA_SIN_DATO);
    for (const g of [...set].sort()) {
        if (!ordered.includes(g)) ordered.push(g);
    }
    return ordered;
}

/** Opciones de curso_grupo; si grado acotado, solo cursos de ese grado. */
export function collectCursoOptions(students: readonly Estudiante[], grado: string): string[] {
    const g = (grado || PIFA_GRADO_TODOS).trim();
    const scoped =
        g && g !== PIFA_GRADO_TODOS
            ? students.filter((s) => studentGradoKey(s) === g)
            : students;
    const set = new Set<string>();
    let hasNamed = false;
    for (const s of scoped) {
        const c = studentCursoKey(s);
        if (c !== PIFA_SIN_DATO) hasNamed = true;
        set.add(c);
    }
    if (!hasNamed && set.size <= 1) return [];
    const named = [...set].filter((c) => c !== PIFA_SIN_DATO).sort((a, b) => a.localeCompare(b, 'es'));
    const out = [PIFA_CURSO_TODOS, ...named];
    if (set.has(PIFA_SIN_DATO)) out.push(PIFA_SIN_DATO);
    return out;
}

/**
 * Selector profesional unificado:
 * TODOS → grado completo → cursos del grado.
 */
export function collectGroupedCursoOptions(students: readonly Estudiante[]): string[] {
    const grados = collectGradoOptions(students).filter(
        (grado) => grado !== PIFA_GRADO_TODOS && grado !== PIFA_SIN_DATO,
    );
    const out = [PIFA_CURSO_TODOS];
    for (const grado of grados) {
        out.push(pifaGradoOption(grado));
        out.push(
            ...collectCursoOptions(students, grado).filter(
                (curso) => curso !== PIFA_CURSO_TODOS && curso !== PIFA_SIN_DATO,
            ),
        );
    }
    if (students.some((student) => studentCursoKey(student) === PIFA_SIN_DATO)) {
        out.push(PIFA_SIN_DATO);
    }
    return out;
}

export function selfCheckPifaCurso(): void {
    if (inferSmoke('9-1') !== '9') throw new Error('grado 9-1');
    if (Object.keys(BY_DOC).length < 100) throw new Error('catálogo PIFA vacío');
    if (gradoFromPifaOption(pifaGradoOption('10')) !== '10') {
        throw new Error('opción grado 10');
    }
}

/** Solo para smoke del módulo (espejo liviano de infer_grado Python). */
function inferSmoke(curso: string): string {
    const raw = curso
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const m = raw.match(/(?:GRADO|CURSO)?\s*(11|10|9)(?:\D|$)/);
    return m?.[1] || '';
}
