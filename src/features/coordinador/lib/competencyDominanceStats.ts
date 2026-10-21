/**
 * Diagnóstico fiel a niveles de desempeño ICFES (MEN):
 * - Nivel del área = solo por rango de puntaje (catálogo).
 * - Habilidades alcanzadas = checklist `habilidadesNivel` por nivel (pasados + tramo actual).
 * - Competencias del marco = cobertura por esas habilidades de nivel, no % artificial del tramo.
 */

export interface CompetenciaMarcoInput {
    id: string;
    nombre: string;
    afirmacion: string;
    habilidades: string[];
    pesoPrueba?: number;
}

export interface NivelRangoInput {
    nivel: 1 | 2 | 3 | 4;
    min: number;
    max: number;
    etiqueta: string;
    descriptorGeneral: string;
    habilidadesNivel?: string[];
}

export type DominioEstado = 'dominada' | 'en_desarrollo' | 'por_reforzar' | 'urgente';

export interface HabilidadNivelDiagnostico {
    nombre: string;
    nivel: 1 | 2 | 3 | 4;
    etiquetaNivel: string;
    alcanzada: boolean;
}

export interface HabilidadDiagnostico {
    nombre: string;
    estado: Exclude<DominioEstado, 'urgente'>;
    /** Cobertura estimada vía habilidades de nivel (0–100). */
    dominioPct: number;
    nivelReferencia: 1 | 2 | 3 | 4;
    umbralProgresoRangoPct: number;
    brechaRangoPct: number;
}

export interface CompetenciaDominioStats {
    competenciaId: string;
    competenciaNombre: string;
    afirmacion: string;
    estado: DominioEstado;
    dominioPct: number;
    prioridad: number;
    habilidadesDetalle: HabilidadDiagnostico[];
    habilidadesDominadas: string[];
    habilidadesPorReforzar: string[];
    interpretacion: string;
}

export interface NivelPosicionStats {
    rangoMin: number;
    rangoMax: number;
    progresoEnRangoPct: number;
    dominioNivelPct: number;
    puntosParaSiguienteNivel: number | null;
    etiquetaSiguienteNivel: string | null;
    interpretacionPosicion: string;
}

function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
}

/** % recorrido del tramo [min, max] donde cayó el puntaje (0 = piso, 100 = techo). */
export function calcProgresoEnRango(puntaje: number, min: number, max: number): number {
    const span = Math.max(1, max - min);
    const raw = ((puntaje - min) / span) * 100;
    return Math.round(clamp(raw, 0, 100) * 10) / 10;
}

const STOP_TOKENS = new Set([
    'para', 'por', 'con', 'sin', 'del', 'las', 'los', 'una', 'uno', 'como', 'esta', 'este', 'son', 'sus', 'que',
]);

/** Cuántas habilidades del nivel actual se consideran alcanzadas según posición en el tramo. */
function countHabilidadesNivelAlcanzadas(count: number, progresoTramo: number): number {
    if (count <= 0) return 0;
    if (progresoTramo >= 85) return count;
    if (progresoTramo >= 60) return Math.ceil(count * 0.75);
    if (progresoTramo >= 35) return Math.ceil(count * 0.5);
    if (progresoTramo >= 12) return 1;
    return 0;
}

/** Checklist oficial: habilidades de nivel según puntaje y tramo. */
export function buildHabilidadesNivelDiagnostico(
    nivelActual: 1 | 2 | 3 | 4,
    progresoTramo: number,
    niveles: NivelRangoInput[]
): HabilidadNivelDiagnostico[] {
    const out: HabilidadNivelDiagnostico[] = [];

    for (const nv of niveles) {
        const list = nv.habilidadesNivel ?? [];
        if (nv.nivel < nivelActual) {
            for (const nombre of list) {
                out.push({ nombre, nivel: nv.nivel, etiquetaNivel: nv.etiqueta, alcanzada: true });
            }
        } else if (nv.nivel === nivelActual) {
            const nOk = countHabilidadesNivelAlcanzadas(list.length, progresoTramo);
            list.forEach((nombre, i) => {
                out.push({
                    nombre,
                    nivel: nv.nivel,
                    etiquetaNivel: nv.etiqueta,
                    alcanzada: i < nOk,
                });
            });
        } else {
            for (const nombre of list) {
                out.push({ nombre, nivel: nv.nivel, etiquetaNivel: nv.etiqueta, alcanzada: false });
            }
        }
    }

    return out;
}

function normalizeTokens(text: string): string[] {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[^a-z0-9ñü\s]/gi, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !STOP_TOKENS.has(w));
}

function overlapScore(a: string, b: string): number {
    const A = new Set(normalizeTokens(a));
    const B = new Set(normalizeTokens(b));
    if (A.size === 0 || B.size === 0) return 0;
    let inter = 0;
    for (const t of A) {
        if (B.has(t)) inter++;
    }
    return inter / Math.min(A.size, B.size);
}

/** Nivel ICFES donde el documento declara una habilidad afín (marco ↔ niveles). */
export function resolveNivelReferenciaHabilidad(
    habilidadMarco: string,
    niveles: NivelRangoInput[],
    indexInCompetencia: number,
    totalEnCompetencia: number
): { nivel: 1 | 2 | 3 | 4; matchConfident: boolean } {
    let bestNivel: 1 | 2 | 3 | 4 | null = null;
    let bestScore = 0;

    for (const nv of niveles) {
        const candidatas = nv.habilidadesNivel?.length ? nv.habilidadesNivel : [nv.descriptorGeneral];
        for (const hNivel of candidatas) {
            const score = overlapScore(habilidadMarco, hNivel);
            if (score > bestScore && score >= 0.32) {
                bestScore = score;
                bestNivel = nv.nivel;
            }
        }
    }

    if (bestNivel != null) return { nivel: bestNivel, matchConfident: true };

    const fallback = (
        totalEnCompetencia <= 0
            ? 2
            : Math.min(4, Math.max(1, Math.ceil(((indexInCompetencia + 1) / totalEnCompetencia) * 4)))
    ) as 1 | 2 | 3 | 4;
    return { nivel: fallback, matchConfident: false };
}

function marcoHabilidadCubierta(
    habilidadMarco: string,
    nivelReferencia: number,
    nivelActual: number,
    habilidadesNivel: HabilidadNivelDiagnostico[],
    matchConfident: boolean
): boolean {
    const alcanzadas = habilidadesNivel.filter(h => h.alcanzada);
    if (alcanzadas.some(h => overlapScore(habilidadMarco, h.nombre) >= 0.28)) return true;

    if (matchConfident && nivelActual > nivelReferencia) return true;

    if (nivelActual === nivelReferencia) {
        const delNivel = alcanzadas.filter(h => h.nivel === nivelReferencia);
        const totalNivel = habilidadesNivel.filter(h => h.nivel === nivelReferencia).length;
        if (totalNivel > 0 && delNivel.length / totalNivel >= 0.5) return true;
    }

    return false;
}

function diagnoseHabilidadMarco(
    habilidadMarco: string,
    nivelReferencia: 1 | 2 | 3 | 4,
    matchConfident: boolean,
    nivelActual: 1 | 2 | 3 | 4,
    puntaje: number,
    progresoTramo: number,
    niveles: NivelRangoInput[],
    habilidadesNivel: HabilidadNivelDiagnostico[]
): HabilidadDiagnostico {
    const cubierta = marcoHabilidadCubierta(
        habilidadMarco,
        nivelReferencia,
        nivelActual,
        habilidadesNivel,
        matchConfident
    );
    const banda = niveles.find(n => n.nivel === nivelReferencia) ?? niveles[0];
    const brechaPts =
        nivelActual < nivelReferencia
            ? Math.round(Math.max(0, banda.min - puntaje) * 10) / 10
            : Math.round(Math.max(0, 60 - progresoTramo) * 10) / 10;

    if (cubierta) {
        return {
            nombre: habilidadMarco,
            estado: 'dominada',
            dominioPct: 100,
            nivelReferencia,
            umbralProgresoRangoPct: 60,
            brechaRangoPct: 0,
        };
    }

    if (nivelActual < nivelReferencia - 1) {
        return {
            nombre: habilidadMarco,
            estado: 'por_reforzar',
            dominioPct: Math.max(5, 25 - (nivelReferencia - nivelActual) * 10),
            nivelReferencia,
            umbralProgresoRangoPct: 60,
            brechaRangoPct: brechaPts,
        };
    }

    if (nivelActual === nivelReferencia && progresoTramo >= 35) {
        return {
            nombre: habilidadMarco,
            estado: 'en_desarrollo',
            dominioPct: Math.round(35 + progresoTramo * 0.45),
            nivelReferencia,
            umbralProgresoRangoPct: 60,
            brechaRangoPct: brechaPts,
        };
    }

    return {
        nombre: habilidadMarco,
        estado: 'por_reforzar',
        dominioPct: Math.round(clamp(progresoTramo * 0.35, 8, 35)),
        nivelReferencia,
        umbralProgresoRangoPct: 60,
        brechaRangoPct: brechaPts,
    };
}

function estadoCompetenciaFiel(
    habilidades: HabilidadDiagnostico[],
    nivelActual: 1 | 2 | 3 | 4,
    progresoTramo: number,
    nivelesReferencia: (1 | 2 | 3 | 4)[]
): DominioEstado {
    const n = habilidades.length;
    if (n === 0) return 'por_reforzar';

    const cubiertas = habilidades.filter(h => h.estado === 'dominada').length;
    const dominioPct = Math.round((cubiertas / n) * 100);
    const maxRef = Math.max(...nivelesReferencia);

    if (nivelActual >= 3 && cubiertas === n && progresoTramo >= 55) return 'dominada';
    if (nivelActual >= 4 && cubiertas >= n - 1) return 'dominada';

    if (nivelActual <= 1 && dominioPct < 40) return 'urgente';
    if (nivelActual < maxRef - 1) return 'urgente';

    if (dominioPct < 45 || nivelActual < maxRef) return 'por_reforzar';

    return 'en_desarrollo';
}

function interpretacionCompetencia(
    estado: DominioEstado,
    dominioPct: number,
    nivelActual: number,
    nivelEtiqueta: string,
    maxRef: number
): string {
    switch (estado) {
        case 'dominada':
            return `${dominioPct}% de evidencias del marco cubiertas por habilidades de nivel ya alcanzadas (${nivelEtiqueta}).`;
        case 'urgente':
            return `${dominioPct}% cubierto: el área está en ${nivelEtiqueta} y varias habilidades del marco exigen niveles superiores (hasta nivel ${maxRef}).`;
        case 'por_reforzar':
            return `${dominioPct}% cubierto en ${nivelEtiqueta}: consolidar habilidades del nivel de desempeño antes de exigir las de nivel ${maxRef}.`;
        default:
            return `${dominioPct}% cubierto: en consolidación de ${nivelEtiqueta}; avanzar en el tramo del nivel actual.`;
    }
}

function fmtScore(n: number): string {
    const r = Math.round(n * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function buildNivelPosicionStats(
    puntaje: number,
    rango: NivelRangoInput,
    niveles: NivelRangoInput[]
): NivelPosicionStats {
    const progresoEnRangoPct = calcProgresoEnRango(puntaje, rango.min, rango.max);
    const siguiente = niveles.find(n => n.nivel === rango.nivel + 1);
    const puntosParaSiguienteNivel = siguiente
        ? Math.round(Math.max(0, siguiente.min - puntaje) * 10) / 10
        : null;
    const ptsLabel = fmtScore(puntaje);

    let interpretacionPosicion: string;
    if (progresoEnRangoPct <= 12) {
        interpretacionPosicion = `Puntaje ${ptsLabel} en el piso del ${rango.etiqueta} (${rango.min}–${rango.max}): recién ingresa al nivel; priorizar las habilidades de nivel declaradas en el documento ICFES.`;
    } else if (progresoEnRangoPct >= 88) {
        if (rango.nivel <= 2) {
            interpretacionPosicion = `Puntaje ${ptsLabel} alto dentro del ${rango.etiqueta} (${rango.min}–${rango.max}), pero sigue en nivel bajo en la escala 0–100${
                puntosParaSiguienteNivel != null
                    ? `; faltan ${fmtScore(puntosParaSiguienteNivel)} pts para ${siguiente?.etiqueta ?? 'siguiente nivel'}`
                    : ''
            }.`;
        } else {
            interpretacionPosicion = `Puntaje ${ptsLabel} cerca del techo del ${rango.etiqueta}${
                puntosParaSiguienteNivel != null
                    ? `; faltan ${fmtScore(puntosParaSiguienteNivel)} pts para ${siguiente?.etiqueta ?? 'siguiente nivel'}.`
                    : '.'
            }`;
        }
    } else {
        interpretacionPosicion = `Puntaje ${ptsLabel} en ${rango.etiqueta} (${rango.min}–${rango.max}): ${progresoEnRangoPct}% del tramo del nivel — consolidación en curso según habilidades de nivel.`;
    }

    return {
        rangoMin: rango.min,
        rangoMax: rango.max,
        progresoEnRangoPct,
        dominioNivelPct: progresoEnRangoPct,
        puntosParaSiguienteNivel,
        etiquetaSiguienteNivel: siguiente?.etiqueta ?? null,
        interpretacionPosicion,
    };
}

export function buildCompetenciaDominioStats(
    comp: CompetenciaMarcoInput,
    progresoEnRangoPct: number,
    nivelIcFes: 1 | 2 | 3 | 4,
    puntaje: number,
    niveles: NivelRangoInput[],
    habilidadesNivel: HabilidadNivelDiagnostico[],
    nivelEtiqueta: string,
    pesoMultiplier = 1
): CompetenciaDominioStats {
    const n = comp.habilidades.length;
    const refs = comp.habilidades.map((h, i) => resolveNivelReferenciaHabilidad(h, niveles, i, n));
    const nivelesRef = refs.map(r => r.nivel);

    const habilidadesDetalle = comp.habilidades.map((h, i) =>
        diagnoseHabilidadMarco(
            h,
            refs[i].nivel,
            refs[i].matchConfident,
            nivelIcFes,
            puntaje,
            progresoEnRangoPct,
            niveles,
            habilidadesNivel
        )
    );

    const cubiertas = habilidadesDetalle.filter(h => h.estado === 'dominada').length;
    const dominioPct = n > 0 ? Math.round((cubiertas / n) * 100) : 0;

    const habilidadesDominadas = habilidadesDetalle
        .filter(h => h.estado === 'dominada')
        .map(h => h.nombre);
    const habilidadesPorReforzar = habilidadesDetalle
        .filter(h => h.estado !== 'dominada')
        .map(h => h.nombre);

    const maxRef = nivelesRef.length > 0 ? Math.max(...nivelesRef) : nivelIcFes;
    const peso = (comp.pesoPrueba ?? 1 / 3) * pesoMultiplier;
    const estado = estadoCompetenciaFiel(habilidadesDetalle, nivelIcFes, progresoEnRangoPct, nivelesRef);

    const prioridadScore = Math.round(
        (100 - dominioPct) * peso * (estado === 'urgente' ? 1.2 : 1) + (maxRef - nivelIcFes) * 8
    );

    return {
        competenciaId: comp.id,
        competenciaNombre: comp.nombre,
        afirmacion: comp.afirmacion,
        estado,
        dominioPct,
        prioridad: prioridadScore,
        habilidadesDetalle,
        habilidadesDominadas,
        habilidadesPorReforzar,
        interpretacion: interpretacionCompetencia(estado, dominioPct, nivelIcFes, nivelEtiqueta, maxRef),
    };
}

export const PRIORIDAD_COMPETENCIA_TITLE =
    'Orden de intervención según brecha entre nivel ICFES del área y habilidades del marco. 1 = atender primero. No es número de pregunta.';

export function labelPrioridadCompetencia(n: number): string {
    return `Prioridad ${n}`;
}

export function assignPrioridadOrden(competencias: CompetenciaDominioStats[]): CompetenciaDominioStats[] {
    const sorted = [...competencias].sort((a, b) => b.prioridad - a.prioridad);
    return sorted.map((c, i) => ({ ...c, prioridad: i + 1 }));
}

const PRIORIDAD_ESTADO_DOMINIO: Record<DominioEstado, number> = {
    urgente: 0,
    por_reforzar: 1,
    en_desarrollo: 2,
    dominada: 3,
};

export function peorEstadoDominio(estados: DominioEstado[]): DominioEstado {
    if (estados.length === 0) return 'por_reforzar';
    return estados.reduce((peor, e) =>
        PRIORIDAD_ESTADO_DOMINIO[e] < PRIORIDAD_ESTADO_DOMINIO[peor] ? e : peor
    );
}

/**
 * Estado visual del área: alineado al peor estado de competencias.
 * Nunca «Dominada» en nivel 1–3 solo por % del tramo (eso no es dominio ICFES pleno).
 */
export function estadoDominioArea(
    nivelIcFes: 1 | 2 | 3 | 4,
    progresoTramo: number,
    competencias: { estado: DominioEstado }[] = []
): DominioEstado {
    let estado: DominioEstado;

    if (competencias.length > 0) {
        estado = peorEstadoDominio(competencias.map(c => c.estado));
    } else if (nivelIcFes >= 4) {
        estado = 'dominada';
    } else if (nivelIcFes === 3) {
        estado = progresoTramo >= 55 ? 'en_desarrollo' : 'por_reforzar';
    } else if (nivelIcFes === 2) {
        estado = progresoTramo >= 40 ? 'en_desarrollo' : 'por_reforzar';
    } else {
        estado = progresoTramo >= 65 ? 'por_reforzar' : 'urgente';
    }

    if (nivelIcFes < 4 && estado === 'dominada') {
        estado = 'en_desarrollo';
    }
    if (nivelIcFes >= 3 && estado === 'urgente') {
        estado = 'por_reforzar';
    }

    return estado;
}

export function estadoDominioDesdePct(dominioPct: number): DominioEstado {
    if (dominioPct >= 78) return 'dominada';
    if (dominioPct >= 55) return 'en_desarrollo';
    if (dominioPct >= 35) return 'por_reforzar';
    return 'urgente';
}

export function flattenUrgentCompetencies(
    areas: { areaNombre: string; competencias: CompetenciaDominioStats[] }[],
    limit = 8
) {
    const flat = areas.flatMap(a =>
        a.competencias
            .filter(c => c.estado === 'urgente' || c.estado === 'por_reforzar')
            .map(c => ({ area: a.areaNombre, ...c }))
    );
    return flat.sort((a, b) => a.prioridad - b.prioridad).slice(0, limit);
}
