import { getNivelDesempenoGlobal } from '@/lib/performanceLevels';

export interface ScoringShadowStudent {
    documento: string;
    nombre: string;
    institucion: string;
    sesion_parcial?: boolean;
    puntaje_global_v1: number;
    puntaje_global_v2: number;
    delta_global: number;
    nivel_v1: string;
    nivel_v2: string;
    puntajes_v1: Record<string, number>;
    puntajes_v2: Record<string, number>;
    areas?: Record<
        string,
        {
            correctas?: number;
            errores?: number;
            total_preguntas?: number;
            puntaje_v1?: number;
            puntaje_v2?: number;
            puntaje_v2_base?: number;
            correccion_suavizado?: number;
            delta_area?: number;
        }
    >;
}

export interface ScoringShadowPayload {
    simulacro: string;
    scoring_version: string;
    scoring_label?: string;
    calibracion_usada: string;
    anclaje_usado?: string | null;
    total_calificados: number;
    estudiantes: ScoringShadowStudent[];
}

interface StaticStudentsPayload {
    estudiantes?: Array<{
        informacion_personal?: {
            numero_identificacion?: string | number;
        };
        puntaje_global?: number;
        puntaje_global_pre_suavizado?: number;
        suavizado_aplicado?: boolean;
        puntajes?: Record<
            string,
            {
                correctas?: number;
                total_preguntas?: number;
                puntaje?: number;
                puntaje_pre_suavizado?: number;
                correccion_suavizado?: number;
            }
        >;
    }>;
}

function simIdCandidates(simId: string): string[] {
    const raw = String(simId || '').trim();
    const compact = raw.replace(/\s+/g, '');
    const out = new Set<string>();
    if (raw) out.add(raw);
    if (compact) out.add(compact);
    const normalized = compact.replace(/SG11-?/i, 'SG11-');
    if (normalized) {
        out.add(normalized);
        out.add(normalized.toUpperCase());
    }
    return [...out];
}

async function fetchStaticStudents(simId: string, ts: number): Promise<StaticStudentsPayload | null> {
    try {
        const url = `/data/simulations/${encodeURIComponent(simId)}/students.json?v=${ts}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return null;
        return (await res.json()) as StaticStudentsPayload;
    } catch {
        return null;
    }
}

type StaticAreaScore = {
    correctas?: number;
    total_preguntas?: number;
    puntaje?: number;
    puntaje_pre_suavizado?: number;
    correccion_suavizado?: number;
};

/** Puntaje oficial vigente (lógica nueva / v3 suavizado) por área. */
function officialAreaScore(
    area: string,
    puntaje: StaticAreaScore | undefined,
    row: ScoringShadowStudent,
): number | undefined {
    if (puntaje?.puntaje !== undefined && puntaje.puntaje !== null) {
        return Number(puntaje.puntaje);
    }
    if (row.puntajes_v1[area] !== undefined) return Number(row.puntajes_v1[area]);
    if (row.areas?.[area]?.puntaje_v1 !== undefined) return Number(row.areas[area]?.puntaje_v1);
    return undefined;
}

/** Columna izquierda de la comparativa: calificación oficial publicada (lógica nueva). */
function applyOfficialNewBaseline(
    row: ScoringShadowStudent,
    source: NonNullable<StaticStudentsPayload['estudiantes']>[number] | undefined,
): ScoringShadowStudent {
    if (!source) return row;

    const puntajesV1 = { ...row.puntajes_v1 };
    const areas = { ...(row.areas ?? {}) };
    let hasOfficial = false;

    for (const [area, puntaje] of Object.entries(source.puntajes ?? {})) {
        const official = officialAreaScore(area, puntaje, row);
        if (official === undefined) continue;
        hasOfficial = true;
        puntajesV1[area] = official;
        const current = areas[area] ?? {};
        const tri = current.puntaje_v2 ?? row.puntajes_v2[area];
        areas[area] = {
            ...current,
            puntaje_v1: official,
            delta_area: tri !== undefined ? Number(tri) - official : current.delta_area,
        };
    }

    const pgOfficial =
        source.puntaje_global !== undefined && source.puntaje_global !== null
            ? Number(source.puntaje_global)
            : hasOfficial
              ? row.puntaje_global_v1
              : undefined;

    if (pgOfficial === undefined) {
        return { ...row, areas };
    }

    const pgTri = row.puntaje_global_v2;
    return {
        ...row,
        puntaje_global_v1: pgOfficial,
        puntajes_v1: puntajesV1,
        nivel_v1: getNivelDesempenoGlobal(pgOfficial),
        delta_global: pgTri - pgOfficial,
        areas,
    };
}

async function enrichShadowWithStudentDetails(
    simId: string,
    payload: ScoringShadowPayload,
    ts: number,
): Promise<ScoringShadowPayload> {
    const staticStudents = await fetchStaticStudents(simId, ts);
    const students = staticStudents?.estudiantes ?? [];
    if (!students.length) return payload;

    const byDocument = new Map<string, NonNullable<StaticStudentsPayload['estudiantes']>[number]>();
    for (const student of students) {
        const doc = String(student.informacion_personal?.numero_identificacion ?? '').trim();
        if (doc) byDocument.set(doc, student);
    }

    const enriched = payload.estudiantes.map((row) => {
        const source = byDocument.get(String(row.documento).trim());
        const officialRow = applyOfficialNewBaseline(row, source);
        if (!source?.puntajes) return officialRow;

        const areas = { ...(officialRow.areas ?? {}) };
        for (const [area, puntaje] of Object.entries(source.puntajes)) {
            const correctas = Number(puntaje.correctas ?? 0);
            const total = Number(puntaje.total_preguntas ?? 0);
            const current = areas[area] ?? {};
            const currentTotal = Number(current.total_preguntas ?? 0);

            if (total <= 0 && currentTotal > 0) continue;

            const puntajeV1 =
                officialAreaScore(area, puntaje, officialRow) ??
                current.puntaje_v1 ??
                officialRow.puntajes_v1[area];
            const puntajeV2 = current.puntaje_v2 ?? officialRow.puntajes_v2[area];

            areas[area] = {
                ...current,
                correctas,
                errores: Math.max(total - correctas, 0),
                total_preguntas: total,
                puntaje_v1: puntajeV1,
                puntaje_v2: puntajeV2,
                delta_area:
                    puntajeV1 !== undefined && puntajeV2 !== undefined
                        ? Number(puntajeV2) - Number(puntajeV1)
                        : current.delta_area,
                correccion_suavizado: current.correccion_suavizado ?? puntaje.correccion_suavizado,
            };
        }

        return { ...officialRow, areas };
    });

    return { ...payload, estudiantes: enriched };
}

export async function fetchScoringShadow(simId: string): Promise<ScoringShadowPayload | null> {
    if (!simId) return null;
    const ts = Date.now();
    for (const id of simIdCandidates(simId)) {
        try {
            const url = `/data/simulations/${encodeURIComponent(id)}/scoring_shadow.json?v=${ts}`;
            const res = await fetch(url, { cache: 'no-store' });
            if (res.ok) {
                const payload = (await res.json()) as ScoringShadowPayload;
                return await enrichShadowWithStudentDetails(id, payload, ts);
            }
        } catch {
            /* try next candidate */
        }
    }
    return null;
}

export function filterShadowByInstitution(
    rows: ScoringShadowStudent[],
    institution: string,
): ScoringShadowStudent[] {
    const inst = String(institution || '').trim();
    if (!inst || inst.toUpperCase() === 'TODAS' || inst === '*') return rows;
    const norm = (s: string) =>
        String(s || '')
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    const target = norm(inst);
    return rows.filter((r) => norm(r.institucion) === target);
}
