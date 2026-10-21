'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, FlaskConical, Minus, Search } from 'lucide-react';
import type { ScoringShadowPayload, ScoringShadowStudent } from '@features/coordinador/lib/scoringShadow';
import { displayDocumentId } from '@features/coordinador/lib/demoPrivacy';

const AREAS = [
    'matemáticas',
    'lectura crítica',
    'sociales y ciudadanas',
    'ciencias naturales',
    'inglés',
] as const;

const T = {
    card: 'rounded-xl border border-white/[0.08] bg-[#111827]/90 backdrop-blur-md',
};

const AREA_COLORS: Record<string, string> = {
    'matemáticas': '#38bdf8',
    'lectura crítica': '#f43f5e',
    'sociales y ciudadanas': '#fb7185',
    'ciencias naturales': '#22c55e',
    'inglés': '#a855f7',
};

type AnswerItem = {
    respuesta?: string;
    respuesta_estudiante?: string;
    correcta?: string;
    respuesta_correcta?: string;
    es_correcta?: boolean;
    sin_respuesta?: boolean;
    invalidada?: boolean;
    sesion?: string;
};

type StudentAnswerDetails = {
    respuestas_detalladas?: Record<string, Record<string, AnswerItem>>;
};

function average(values: number[]) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pct(value: number, total: number) {
    if (!total) return '0.0%';
    return `${((value / total) * 100).toFixed(1)}%`;
}

function signed(value: number | undefined) {
    const n = Number(value ?? 0);
    return `${n >= 0 ? '+' : ''}${n}`;
}

function totalErrors(row: ScoringShadowStudent) {
    return Object.values(row.areas ?? {}).reduce(
        (sum, area) => sum + Number(area.errores ?? 0),
        0,
    );
}

function totalQuestions(row: ScoringShadowStudent) {
    return Object.values(row.areas ?? {}).reduce(
        (sum, area) => sum + Number(area.total_preguntas ?? 0),
        0,
    );
}

function auditSignals(row: ScoringShadowStudent) {
    const signals: string[] = [];
    const errors = totalErrors(row);
    const questions = totalQuestions(row);
    if (Math.abs(row.delta_global) >= 40) signals.push('Delta alto');
    if (row.nivel_v1 !== row.nivel_v2) signals.push('Cambia nivel');
    if (row.sesion_parcial) signals.push('Sesion parcial');
    if (questions > 0 && errors / questions >= 0.45) signals.push('Muchos errores');
    if (!questions) signals.push('Sin detalle item');
    if (!signals.length) signals.push('Estable');
    return signals;
}

function normalizeSimId(simId: string) {
    return String(simId || '').trim().replace(/\s+/g, '').replace(/SG11-?/i, 'SG11-');
}

function areaRows(row: ScoringShadowStudent) {
    return AREAS.map((area) => {
        const meta = row.areas?.[area];
        const actual = row.puntajes_v1[area] ?? meta?.puntaje_v1 ?? 0;
        const tri = row.puntajes_v2[area] ?? meta?.puntaje_v2 ?? actual;
        const correctas = Number(meta?.correctas ?? 0);
        const total = Number(meta?.total_preguntas ?? 0);
        const errores = Number(meta?.errores ?? Math.max(total - correctas, 0));
        return {
            area,
            actual,
            tri,
            delta: tri - actual,
            correctas,
            total,
            errores,
            pct: total > 0 ? (correctas / total) * 100 : 0,
            color: AREA_COLORS[area],
        };
    });
}

function answerStatus(item: AnswerItem) {
    if (item.invalidada) return 'invalidada';
    if (item.sin_respuesta) return 'sin-respuesta';
    return item.es_correcta ? 'correcta' : 'incorrecta';
}

function DeltaBadge({ value }: { value: number }) {
    if (value > 0) {
        return (
            <span className="inline-flex items-center gap-0.5 text-emerald-400 font-semibold tabular-nums">
                <ArrowUp className="w-3 h-3" aria-hidden />
                +{value}
            </span>
        );
    }
    if (value < 0) {
        return (
            <span className="inline-flex items-center gap-0.5 text-red-400 font-semibold tabular-nums">
                <ArrowDown className="w-3 h-3" aria-hidden />
                {value}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-0.5 text-white/40 tabular-nums">
            <Minus className="w-3 h-3" aria-hidden />
            0
        </span>
    );
}

export default function CoordinadorScoringPreviewTab({
    rows,
    payload,
    maskDocumentIds = false,
}: {
    rows: ScoringShadowStudent[];
    payload: ScoringShadowPayload | null;
    maskDocumentIds?: boolean;
}) {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'delta' | 'tri' | 'name' | 'errors'>('delta');
    const [selectedDoc, setSelectedDoc] = useState<string>('');
    const [activeArea, setActiveArea] = useState<(typeof AREAS)[number]>('matemáticas');
    const [answerDetailsByDoc, setAnswerDetailsByDoc] = useState<Record<string, StudentAnswerDetails | null>>({});

    const stats = useMemo(() => {
        if (!rows.length) {
            return {
                avgActual: 0,
                avgTri: 0,
                avgDelta: 0,
                cambioNivel: 0,
                sube: 0,
                baja: 0,
                igual: 0,
                errores: 0,
                conDetalle: 0,
                sesionParcial: 0,
                deltaAlto: 0,
                nivelSube: 0,
                nivelBaja: 0,
            };
        }
        const deltas = rows.map((r) => r.delta_global);
        const levelRank: Record<string, number> = { Bajo: 1, Medio: 2, Alto: 3, Superior: 4 };
        const withDetails = rows.filter((r) => totalQuestions(r) > 0);
        return {
            avgActual: average(rows.map((r) => r.puntaje_global_v1)),
            avgTri: average(rows.map((r) => r.puntaje_global_v2)),
            avgDelta: deltas.reduce((a, b) => a + b, 0) / deltas.length,
            cambioNivel: rows.filter((r) => r.nivel_v1 !== r.nivel_v2).length,
            sube: deltas.filter((d) => d > 0).length,
            baja: deltas.filter((d) => d < 0).length,
            igual: deltas.filter((d) => d === 0).length,
            errores: rows.reduce((sum, row) => sum + totalErrors(row), 0),
            conDetalle: withDetails.length,
            sesionParcial: rows.filter((r) => r.sesion_parcial).length,
            deltaAlto: deltas.filter((d) => Math.abs(d) >= 40).length,
            nivelSube: rows.filter((r) => (levelRank[r.nivel_v2] ?? 0) > (levelRank[r.nivel_v1] ?? 0)).length,
            nivelBaja: rows.filter((r) => (levelRank[r.nivel_v2] ?? 0) < (levelRank[r.nivel_v1] ?? 0)).length,
        };
    }, [rows]);

    const areaAudit = useMemo(
        () =>
            AREAS.map((area) => {
                const areaRows = rows.filter((row) => row.puntajes_v1[area] !== undefined || row.puntajes_v2[area] !== undefined);
                const detailRows = rows.filter((row) => Number(row.areas?.[area]?.total_preguntas ?? 0) > 0);
                const errors = detailRows.reduce((sum, row) => sum + Number(row.areas?.[area]?.errores ?? 0), 0);
                const questions = detailRows.reduce((sum, row) => sum + Number(row.areas?.[area]?.total_preguntas ?? 0), 0);
                return {
                    area,
                    actual: average(areaRows.map((row) => row.puntajes_v1[area] ?? 0)),
                    tri: average(areaRows.map((row) => row.puntajes_v2[area] ?? 0)),
                    delta: average(areaRows.map((row) => (row.puntajes_v2[area] ?? 0) - (row.puntajes_v1[area] ?? 0))),
                    errorRate: questions ? errors / questions : 0,
                    detailRows: detailRows.length,
                };
            }),
        [rows],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = rows;
        if (q) {
            list = list.filter(
                (r) =>
                    r.nombre.toLowerCase().includes(q) ||
                    r.documento.includes(q) ||
                    r.institucion.toLowerCase().includes(q),
            );
        }
        return [...list].sort((a, b) => {
            if (sortBy === 'name') return a.nombre.localeCompare(b.nombre);
            if (sortBy === 'tri') return b.puntaje_global_v2 - a.puntaje_global_v2;
            if (sortBy === 'errors') {
                const errorsA = Object.values(a.areas ?? {}).reduce((sum, area) => sum + Number(area.errores ?? 0), 0);
                const errorsB = Object.values(b.areas ?? {}).reduce((sum, area) => sum + Number(area.errores ?? 0), 0);
                return errorsB - errorsA;
            }
            return b.delta_global - a.delta_global;
        });
    }, [rows, search, sortBy]);

    const selectedStudent = useMemo(
        () => rows.find((row) => row.documento === selectedDoc) ?? filtered[0] ?? rows[0],
        [filtered, rows, selectedDoc],
    );

    const selectedAreas = useMemo(
        () => (selectedStudent ? areaRows(selectedStudent) : []),
        [selectedStudent],
    );

    const selectedBestActual = useMemo(
        () => [...selectedAreas].sort((a, b) => b.actual - a.actual)[0],
        [selectedAreas],
    );
    const selectedWeakActual = useMemo(
        () => [...selectedAreas].sort((a, b) => a.actual - b.actual)[0],
        [selectedAreas],
    );
    const selectedBestDelta = useMemo(
        () => [...selectedAreas].sort((a, b) => b.delta - a.delta)[0],
        [selectedAreas],
    );
    const selectedWorstDelta = useMemo(
        () => [...selectedAreas].sort((a, b) => a.delta - b.delta)[0],
        [selectedAreas],
    );

    useEffect(() => {
        if (!selectedStudent?.documento || !payload?.simulacro) return;
        if (answerDetailsByDoc[selectedStudent.documento] !== undefined) return;
        let cancelled = false;
        const doc = selectedStudent.documento;
        const sim = normalizeSimId(payload.simulacro);
        fetch(`/data/simulations/${encodeURIComponent(sim)}/answerDetails/${encodeURIComponent(doc)}.json?v=${Date.now()}`, {
            cache: 'no-store',
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: StudentAnswerDetails | null) => {
                if (!cancelled) {
                    setAnswerDetailsByDoc((prev) => ({ ...prev, [doc]: data }));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setAnswerDetailsByDoc((prev) => ({ ...prev, [doc]: null }));
                }
            });
        return () => {
            cancelled = true;
        };
    }, [answerDetailsByDoc, payload?.simulacro, selectedStudent?.documento]);

    const selectedAnswers = selectedStudent
        ? answerDetailsByDoc[selectedStudent.documento]?.respuestas_detalladas?.[activeArea] ?? null
        : null;
    const selectedAnswerItems = selectedAnswers
        ? Object.entries(selectedAnswers).sort((a, b) => Number(a[0]) - Number(b[0]))
        : [];

    return (
        <div className="space-y-4 animate-fade-in" data-coordinator-theme>
            <div className={`${T.card} p-4 border-amber-500/30 bg-amber-500/[0.06]`}>
                <div className="flex items-start gap-3">
                    <FlaskConical className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden />
                    <div>
                        <p className="text-sm font-bold text-amber-200">Modo sombra — solo local</p>
                        <p className="text-xs text-white/60 mt-1 leading-relaxed">
                            Comparativa dual por estudiante: lógica nueva oficial (v3 suavizado)
                            vs acercamiento TRI por fases. La columna izquierda es la calificación
                            publicada; la derecha es sombra local que no modifica Firestore.
                        </p>
                        {payload?.scoring_label && (
                            <p className="text-[10px] text-amber-100/70 mt-2">
                                Acercamiento: {payload.scoring_label}
                            </p>
                        )}
                        {payload?.calibracion_usada && (
                            <p className="text-[10px] text-white/40 mt-2 font-mono truncate">
                                Calibración: {payload.calibracion_usada.split(/[/\\]/).pop()}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Estudiantes', value: rows.length },
                    { label: 'Prom. lógica nueva', value: stats.avgActual.toFixed(1) },
                    { label: 'Prom. aprox. TRI', value: stats.avgTri.toFixed(1), accent: '#93c5fd' },
                    { label: 'Δ promedio', value: `${stats.avgDelta >= 0 ? '+' : ''}${stats.avgDelta.toFixed(1)}` },
                    { label: 'Suben', value: stats.sube, accent: '#34d399' },
                    { label: 'Bajan', value: stats.baja, accent: '#f87171' },
                    { label: 'Delta alto', value: stats.deltaAlto, accent: '#fbbf24' },
                    { label: 'Cambian nivel', value: stats.cambioNivel, accent: '#fbbf24' },
                    { label: 'Con detalle item', value: `${stats.conDetalle}/${rows.length}`, accent: '#93c5fd' },
                    { label: 'Sesion parcial', value: stats.sesionParcial, accent: '#fbbf24' },
                ].map((k) => (
                    <div key={k.label} className={`${T.card} p-4`}>
                        <p className="text-[10px] uppercase tracking-wide text-white/40">{k.label}</p>
                        <p
                            className="text-xl font-bold tabular-nums mt-1"
                            style={k.accent ? { color: k.accent } : { color: '#fff' }}
                        >
                            {k.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className={`${T.card} p-4 md:p-5 xl:col-span-1 border-sky-400/20`}>
                    <p className="text-[10px] uppercase tracking-wide text-sky-200/60 font-semibold">Lectura de decision</p>
                    <h3 className="text-base font-bold text-white mt-1">Auditoria comparativa</h3>
                    <p className="text-xs text-white/55 mt-2 leading-relaxed">
                        La comparativa no decide solo por promedio. Revisa estabilidad, cambios
                        de nivel, estudiantes con delta alto, sesiones parciales y si el cambio
                        se explica por errores/correctas por area.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-white/[0.04] p-3">
                            <p className="text-white/40">Suben nivel</p>
                            <p className="text-lg font-bold text-emerald-300 tabular-nums">{stats.nivelSube}</p>
                        </div>
                        <div className="rounded-lg bg-white/[0.04] p-3">
                            <p className="text-white/40">Bajan nivel</p>
                            <p className="text-lg font-bold text-red-300 tabular-nums">{stats.nivelBaja}</p>
                        </div>
                    </div>
                </div>

                <div className={`${T.card} p-4 md:p-5 border-white/[0.08]`}>
                    <p className="text-[10px] uppercase tracking-wide text-white/40 font-semibold">Lógica nueva</p>
                    <h3 className="text-base font-bold text-white mt-1">Auditoria de referencia</h3>
                    <ul className="mt-3 space-y-2 text-xs text-white/58 leading-relaxed">
                        <li>Promedio base: <span className="text-white font-semibold">{stats.avgActual.toFixed(1)}</span> puntos globales.</li>
                        <li>Ventaja: coincide con la calificación oficial publicada en el panel y reportes.</li>
                        <li>Riesgo: puede ocultar si el puntaje viene de patrones de error distintos, porque pesa menos la dificultad relativa del item.</li>
                        <li>Uso recomendado: mantener como referencia oficial mientras se valida la estabilidad del acercamiento.</li>
                    </ul>
                </div>

                <div className={`${T.card} p-4 md:p-5 border-amber-400/20`}>
                    <p className="text-[10px] uppercase tracking-wide text-amber-200/60 font-semibold">Acercamiento TRI</p>
                    <h3 className="text-base font-bold text-white mt-1">Auditoria del modelo sombra</h3>
                    <ul className="mt-3 space-y-2 text-xs text-white/58 leading-relaxed">
                        <li>Promedio sombra: <span className="text-white font-semibold">{stats.avgTri.toFixed(1)}</span> puntos globales.</li>
                        <li>Delta medio TRI vs lógica nueva: <span className="text-white font-semibold">{stats.avgDelta >= 0 ? '+' : ''}{stats.avgDelta.toFixed(1)}</span>.</li>
                        <li>Ventaja: incorpora topes y pesos empiricos conservadores para acercarse a una lectura por dificultad.</li>
                        <li>Riesgo: si baja/sube niveles sin explicacion por errores o sesion parcial, no debe adoptarse como oficial.</li>
                    </ul>
                </div>
            </div>

            {selectedStudent && (
                <div className={`${T.card} overflow-hidden border-violet-400/25 bg-[#0c1020]/95`}>
                    <div className="relative border-b border-white/[0.06] bg-[#151827] px-4 py-4 md:px-5">
                        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-300" />
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10 text-sm font-black text-cyan-200">
                                    {selectedStudent.nombre.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('')}
                                    <span className="absolute -bottom-1 -right-1 rounded-full border border-[#151827] bg-emerald-400 px-1.5 py-0.5 text-[9px] font-black text-black">
                                        {selectedStudent.puntaje_global_v2}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-black uppercase tracking-wide text-white">
                                        {selectedStudent.nombre}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                                        <span className="rounded-full bg-white/8 px-2 py-0.5 text-white/45">
                                            {displayDocumentId(selectedStudent.documento, maskDocumentIds)}
                                        </span>
                                        <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-emerald-300">
                                            {selectedStudent.nivel_v2}
                                        </span>
                                        <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-amber-200">
                                            Δ {selectedStudent.delta_global >= 0 ? '+' : ''}{selectedStudent.delta_global}
                                        </span>
                                        {selectedStudent.sesion_parcial && (
                                            <span className="rounded-full bg-red-400/10 px-2 py-0.5 text-red-200">
                                                Sesion parcial
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 truncate text-[11px] text-white/35">{selectedStudent.institucion}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center text-xs lg:min-w-[360px]">
                                <div className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
                                    <p className="text-[10px] uppercase tracking-wide text-white/35">Lógica nueva</p>
                                    <p className="mt-1 text-2xl font-black tabular-nums text-white">{selectedStudent.puntaje_global_v1}</p>
                                    <p className="text-[10px] text-white/35">{selectedStudent.nivel_v1}</p>
                                </div>
                                <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3">
                                    <p className="text-[10px] uppercase tracking-wide text-cyan-200/60">Aprox. TRI</p>
                                    <p className="mt-1 text-2xl font-black tabular-nums text-cyan-100">{selectedStudent.puntaje_global_v2}</p>
                                    <p className="text-[10px] text-cyan-100/45">{selectedStudent.nivel_v2}</p>
                                </div>
                                <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3">
                                    <p className="text-[10px] uppercase tracking-wide text-amber-100/55">Cambio</p>
                                    <p className={`mt-1 text-2xl font-black tabular-nums ${selectedStudent.delta_global >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                        {selectedStudent.delta_global >= 0 ? '+' : ''}{selectedStudent.delta_global}
                                    </p>
                                    <p className="text-[10px] text-amber-100/45">
                                        {selectedStudent.nivel_v1 === selectedStudent.nivel_v2 ? 'Mismo nivel' : `${selectedStudent.nivel_v1} → ${selectedStudent.nivel_v2}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 p-4 md:p-5 xl:grid-cols-[1.15fr_0.85fr]">
                        <div className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Diagnóstico lógica nueva</p>
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[10px] uppercase text-emerald-300/65">Fortaleza</p>
                                            <p className="mt-1 text-sm font-bold text-white capitalize">{selectedBestActual?.area}</p>
                                            <p className="text-[11px] text-white/35">{selectedBestActual?.actual} puntos</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase text-red-300/65">Debilidad</p>
                                            <p className="mt-1 text-sm font-bold text-white capitalize">{selectedWeakActual?.area}</p>
                                            <p className="text-[11px] text-white/35">{selectedWeakActual?.actual} puntos</p>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-white/45">
                                        Lee el rendimiento como escala publicada: buena para continuidad, pero menos
                                        explicativa cuando dos estudiantes tienen patrones de error distintos.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.055] p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/55">Diagnostico aprox. TRI</p>
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[10px] uppercase text-emerald-300/65">Mejora</p>
                                            <p className="mt-1 text-sm font-bold text-white capitalize">{selectedBestDelta?.area}</p>
                                            <p className="text-[11px] text-emerald-300">{signed(selectedBestDelta?.delta)} puntos</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase text-red-300/65">Castigo</p>
                                            <p className="mt-1 text-sm font-bold text-white capitalize">{selectedWorstDelta?.area}</p>
                                            <p className="text-[11px] text-red-300">{signed(selectedWorstDelta?.delta)} puntos</p>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-white/45">
                                        El acercamiento premia o reduce segun calibracion conservadora por item.
                                        La adopcion conviene solo si estos cambios se explican con errores reales.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                                {selectedAreas.map((area) => (
                                    <button
                                        key={area.area}
                                        type="button"
                                        onClick={() => setActiveArea(area.area)}
                                        className={`rounded-2xl border p-3 text-left transition ${activeArea === area.area ? 'bg-white/[0.08]' : 'bg-white/[0.025] hover:bg-white/[0.045]'}`}
                                        style={{
                                            borderColor: activeArea === area.area ? `${area.color}99` : 'rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        <p className="text-[10px] font-black uppercase text-white/35">{area.area.split(' ')[0]}</p>
                                        <div className="mt-2 flex items-end justify-between gap-2">
                                            <p className="text-2xl font-black tabular-nums" style={{ color: area.color }}>{area.tri}</p>
                                            <p className={`text-xs font-bold tabular-nums ${area.delta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                                {area.delta >= 0 ? '+' : ''}{area.delta}
                                            </p>
                                        </div>
                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                                            <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(area.pct, 100))}%`, background: area.color }} />
                                        </div>
                                        <p className="mt-1 text-[10px] text-white/35">
                                            Nueva {area.actual} · {area.correctas}/{area.total}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Mapa de respuestas</p>
                                    <h3 className="mt-1 text-sm font-bold capitalize text-white">{activeArea}</h3>
                                </div>
                                <div className="text-right text-[10px] text-white/35">
                                    <p>Verde correcta</p>
                                    <p>Rojo error</p>
                                </div>
                            </div>

                            {selectedAnswerItems.length > 0 ? (
                                <div className="mt-4 max-h-[250px] overflow-y-auto pr-1">
                                    <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
                                        {selectedAnswerItems.map(([num, item]) => {
                                            const status = answerStatus(item);
                                            const cls =
                                                status === 'correcta'
                                                    ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-200'
                                                    : status === 'incorrecta'
                                                        ? 'border-red-300/35 bg-red-400/15 text-red-200'
                                                        : status === 'invalidada'
                                                            ? 'border-amber-300/35 bg-amber-400/15 text-amber-200'
                                                            : 'border-white/15 bg-white/[0.04] text-white/35';
                                            return (
                                                <div
                                                    key={num}
                                                    title={`Pregunta ${num}: ${item.respuesta_estudiante ?? item.respuesta ?? '—'} / correcta ${item.respuesta_correcta ?? item.correcta ?? '—'}`}
                                                    className={`rounded-lg border px-1.5 py-1 text-center text-[10px] font-black tabular-nums ${cls}`}
                                                >
                                                    {num}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-white/45">
                                    No se pudo cargar el mapa pregunta a pregunta para esta materia. La
                                    comparativa mantiene correctas/errores por area desde `students.json`.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className={`${T.card} p-4 md:p-5 overflow-hidden`}>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-white">Auditoria por area</h3>
                        <p className="text-xs text-white/45 mt-1">
                            Promedio lógica nueva vs aproximación TRI y tasa de error disponible en el detalle ítem a ítem.
                        </p>
                    </div>
                    <p className="text-[10px] text-white/35">
                        Errores visibles: {stats.errores.toLocaleString('es-CO')}
                    </p>
                </div>
                <div className="overflow-x-auto -mx-1">
                    <table className="w-full min-w-[760px] text-xs">
                        <thead>
                            <tr className="text-white/45 border-b border-white/[0.08]">
                                <th className="text-left py-2 px-2 font-semibold">Area</th>
                                <th className="text-right py-2 px-2 font-semibold">Prom. nueva</th>
                                <th className="text-right py-2 px-2 font-semibold">Prom. aprox. TRI</th>
                                <th className="text-right py-2 px-2 font-semibold">Delta</th>
                                <th className="text-right py-2 px-2 font-semibold">Tasa error</th>
                                <th className="text-right py-2 px-2 font-semibold">Detalle</th>
                                <th className="text-left py-2 px-2 font-semibold">Lectura</th>
                            </tr>
                        </thead>
                        <tbody>
                            {areaAudit.map((area) => (
                                <tr key={area.area} className="border-b border-white/[0.04]">
                                    <td className="py-2 px-2 text-white font-medium capitalize">{area.area}</td>
                                    <td className="py-2 px-2 text-right text-white/65 tabular-nums">{area.actual.toFixed(1)}</td>
                                    <td className="py-2 px-2 text-right text-white tabular-nums">{area.tri.toFixed(1)}</td>
                                    <td className="py-2 px-2 text-right"><DeltaBadge value={Math.round(area.delta)} /></td>
                                    <td className="py-2 px-2 text-right text-white/65 tabular-nums">{pct(area.errorRate, 1)}</td>
                                    <td className="py-2 px-2 text-right text-white/45 tabular-nums">{area.detailRows}/{rows.length}</td>
                                    <td className="py-2 px-2 text-white/55">
                                        {Math.abs(area.delta) >= 8
                                            ? 'Area sensible: revisar si el cambio se explica por dificultad y errores.'
                                            : 'Área estable: cambio moderado frente a la lógica nueva.'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={`${T.card} p-4 md:p-5 overflow-hidden`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-white">Lógica nueva → acercamiento TRI</h3>
                        <p className="text-xs text-white/45 mt-1">{filtered.length} de {rows.length} en esta vista</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            className="coord-input-native text-xs py-1.5"
                            aria-label="Ordenar"
                        >
                            <option value="delta">Mayor delta</option>
                            <option value="tri">Mayor acercamiento TRI</option>
                            <option value="errors">Más errores</option>
                            <option value="name">Nombre</option>
                        </select>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar…"
                                className="coord-input-native w-48 max-w-full text-xs"
                                style={{ paddingLeft: '2.25rem' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-1">
                    <table className="w-full min-w-[1160px] text-xs">
                        <thead>
                            <tr className="text-white/45 border-b border-white/[0.08]">
                                <th className="text-left py-2 px-2 font-semibold">#</th>
                                <th className="text-left py-2 px-2 font-semibold">Estudiante</th>
                                <th className="text-right py-2 px-2 font-semibold">Nueva</th>
                                <th className="text-right py-2 px-2 font-semibold">Aprox. TRI</th>
                                <th className="text-right py-2 px-2 font-semibold">Δ</th>
                                <th className="text-left py-2 px-2 font-semibold">Nivel</th>
                                <th className="text-center py-2 px-2 font-semibold">Sesión</th>
                                <th className="text-left py-2 px-2 font-semibold">Auditoria</th>
                                {AREAS.map((a) => (
                                    <th key={a} className="text-right py-2 px-1 font-semibold whitespace-nowrap">
                                        {a.split(' ')[0]} · err
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r, idx) => (
                                <tr
                                    key={r.documento}
                                    onClick={() => setSelectedDoc(r.documento)}
                                    className={`cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.05] ${selectedStudent?.documento === r.documento ? 'bg-cyan-400/[0.07]' : ''}`}
                                >
                                    <td className="py-2 px-2 text-white/35 tabular-nums">{idx + 1}</td>
                                    <td className="py-2 px-2">
                                        <p className="font-medium text-white truncate max-w-[200px]">{r.nombre}</p>
                                        <p className="text-[10px] text-white/40 font-mono">
                                            {displayDocumentId(r.documento, maskDocumentIds)}
                                        </p>
                                    </td>
                                    <td className="py-2 px-2 text-right tabular-nums text-white/70">{r.puntaje_global_v1}</td>
                                    <td className="py-2 px-2 text-right tabular-nums text-white font-semibold">{r.puntaje_global_v2}</td>
                                    <td className="py-2 px-2 text-right">
                                        <DeltaBadge value={r.delta_global} />
                                    </td>
                                    <td className="py-2 px-2 text-white/60 whitespace-nowrap">
                                        {r.nivel_v1}
                                        {r.nivel_v1 !== r.nivel_v2 && (
                                            <span className="text-amber-400"> → {r.nivel_v2}</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                        {r.sesion_parcial ? (
                                            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200">
                                                Parcial
                                            </span>
                                        ) : (
                                            <span className="text-white/35">Completa</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-2">
                                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                                            {auditSignals(r).map((signal) => (
                                                <span
                                                    key={signal}
                                                    className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/55"
                                                >
                                                    {signal}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    {AREAS.map((area) => {
                                        const meta = r.areas?.[area];
                                        const d =
                                            (r.puntajes_v2[area] ?? 0) - (r.puntajes_v1[area] ?? 0);
                                        return (
                                            <td key={area} className="py-2 px-1 text-right tabular-nums">
                                                <span className="text-white/50">{r.puntajes_v1[area] ?? '—'}</span>
                                                <span className="text-white/30 mx-0.5">→</span>
                                                <span className="text-white">{r.puntajes_v2[area] ?? '—'}</span>
                                                {d !== 0 && (
                                                    <span
                                                        className={`ml-1 text-[10px] ${d > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                                                    >
                                                        ({d > 0 ? '+' : ''}{d})
                                                    </span>
                                                )}
                                                {meta && (
                                                    <p className="text-[10px] text-white/35 mt-0.5">
                                                        {meta.errores ?? 0} err · {meta.correctas ?? 0}/{meta.total_preguntas ?? 0}
                                                    </p>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
