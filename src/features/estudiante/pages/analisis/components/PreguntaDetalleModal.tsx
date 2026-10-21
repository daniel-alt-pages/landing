'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    BarChart,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    X,
    XCircle,
} from 'lucide-react';
import { questionLabel } from '@/lib/questionLabel';
import type { RespuestaDetallada } from '@features/estudiante/pages/analisis/lib/types';

export type PreguntaStats = {
    A: number;
    B: number;
    C: number;
    D: number;
    Total: number;
    correctas: number;
    correcta: string;
    distEsPorcentaje: boolean;
    pctAcierto?: number;
    [key: string]: number | string | boolean | undefined;
};

type Props = {
    pregunta: RespuestaDetallada;
    materia: string;
    preguntas: RespuestaDetallada[];
    stats: PreguntaStats | null;
    esInvalidada: boolean;
    onClose: () => void;
    onSelect: (pregunta: RespuestaDetallada) => void;
    resolveStripColor: (resp: RespuestaDetallada) => string;
};

function prettyMarcoSlug(value: string): string {
    return String(value || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

function resolveTema(resp: RespuestaDetallada): string {
    const principal = String(resp.tema_principal || '').trim();
    if (principal) return principal;
    const raw = String(resp.tema_raw || '').trim();
    if (raw) return raw;
    const lista = Array.isArray(resp.temas)
        ? String(resp.temas.find((t) => typeof t === 'string' && t.trim()) || '').trim()
        : '';
    if (lista) return lista;
    const comp = prettyMarcoSlug(resp.competencia || '');
    const afirm = prettyMarcoSlug(resp.afirmacion || '');
    if (comp && afirm) return `${comp} · ${afirm}`;
    return comp || afirm || '';
}

function MetaField({ label, value }: { label: string; value?: string | null }) {
    const text = String(value || '').trim();
    if (!text) return null;
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-snug text-white/85">{text}</p>
        </div>
    );
}

export function PreguntaDetalleModal({
    pregunta,
    materia,
    preguntas,
    stats,
    esInvalidada,
    onClose,
    onSelect,
    resolveStripColor,
}: Props) {
    const sorted = useMemo(
        () => [...preguntas].sort((a, b) => a.numero - b.numero),
        [preguntas],
    );

    const currentIndex = sorted.findIndex((q) => q.numero === pregunta.numero);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex >= 0 && currentIndex < sorted.length - 1;

    const goPrev = useCallback(() => {
        if (!hasPrev) return;
        onSelect(sorted[currentIndex - 1]);
    }, [currentIndex, hasPrev, onSelect, sorted]);

    const goNext = useCallback(() => {
        if (!hasNext) return;
        onSelect(sorted[currentIndex + 1]);
    }, [currentIndex, hasNext, onSelect, sorted]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = 'unset';
        };
    }, [goNext, goPrev, onClose]);

    const pctAc = stats
        ? Math.round(
              stats.pctAcierto ??
                  (stats.Total > 0 ? (stats.correctas / stats.Total) * 100 : 0),
          )
        : null;
    const ratio = pctAc != null ? pctAc / 100 : 0.5;
    const tema = resolveTema(pregunta);

    const metaFields = [
        { label: 'Sesión', value: pregunta.sesion },
        { label: 'Competencia', value: prettyMarcoSlug(pregunta.competencia || '') },
        { label: 'Componente', value: prettyMarcoSlug(pregunta.componente || '') },
        { label: 'Afirmación', value: prettyMarcoSlug(pregunta.afirmacion || '') },
        { label: 'Evidencia', value: prettyMarcoSlug(pregunta.evidencia || '') },
        { label: 'Nivel cognitivo', value: prettyMarcoSlug(pregunta.nivel_cognitivo || '') },
        { label: 'Tipo de texto', value: prettyMarcoSlug(pregunta.tipo_texto_o_evidencia || '') },
        { label: 'Fuente marco', value: prettyMarcoSlug(pregunta.fuente_marco || '') },
    ].filter((f) => String(f.value || '').trim());

    const baseOpts = ['A', 'B', 'C', 'D'];
    const extraOpts = stats
        ? Object.keys(stats)
              .filter((k) => /^[E-Z]$/.test(k) && !baseOpts.includes(k))
              .sort()
        : [];
    const options = [...baseOpts, ...extraOpts];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
                role="dialog"
                aria-modal
                aria-labelledby="pregunta-detalle-title"
            >
                <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-md"
                    onClick={onClose}
                    aria-hidden
                />

                <div className="relative z-10 flex w-full max-w-4xl items-stretch gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={goPrev}
                        disabled={!hasPrev}
                        aria-label="Pregunta anterior"
                        className="hidden sm:flex h-12 w-12 shrink-0 self-center items-center justify-center rounded-2xl border border-white/15 bg-slate-900/90 text-white shadow-lg transition-all hover:border-cyan-300/40 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        <ChevronLeft size={22} />
                    </button>

                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }}
                        className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl max-h-[92vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-900/80 px-4 py-3 backdrop-blur-xl sm:px-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/20">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p
                                        id="pregunta-detalle-title"
                                        className="truncate text-base font-bold text-white sm:text-lg"
                                    >
                                        {questionLabel(pregunta.numero)}
                                    </p>
                                    <p className="truncate text-[10px] font-bold uppercase tracking-wider text-white/40">
                                        {materia}
                                        {currentIndex >= 0
                                            ? ` · ${currentIndex + 1} de ${sorted.length}`
                                            : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:hidden">
                                <button
                                    type="button"
                                    onClick={goPrev}
                                    disabled={!hasPrev}
                                    className="rounded-lg border border-white/10 p-2 text-white/70 disabled:opacity-30"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    disabled={!hasNext}
                                    className="rounded-lg border border-white/10 p-2 text-white/70 disabled:opacity-30"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
                            {sorted.length > 1 && (
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                                        Mapa rápido · clic para saltar
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {sorted.map((q) => {
                                            const active = q.numero === pregunta.numero;
                                            return (
                                                <button
                                                    key={q.numero}
                                                    type="button"
                                                    onClick={() => onSelect(q)}
                                                    className={`h-7 min-w-[1.75rem] rounded-md px-1 text-[10px] font-bold text-white transition-all ${
                                                        active
                                                            ? 'ring-2 ring-cyan-300 ring-offset-1 ring-offset-slate-900 scale-110'
                                                            : 'opacity-80 hover:opacity-100 hover:scale-105'
                                                    } ${resolveStripColor(q)}`}
                                                >
                                                    {q.numero}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div
                                className={`flex items-center gap-4 rounded-2xl p-4 ${
                                    esInvalidada
                                        ? 'border border-slate-500/30 bg-gradient-to-r from-slate-500/20 to-slate-500/5'
                                        : pregunta.es_correcta
                                          ? 'border border-emerald-500/30 bg-gradient-to-r from-emerald-500/20 to-emerald-500/5'
                                          : 'border border-rose-500/30 bg-gradient-to-r from-rose-500/20 to-rose-500/5'
                                }`}
                            >
                                <div
                                    className={`rounded-xl p-3 ${
                                        esInvalidada
                                            ? 'bg-slate-500/20 text-slate-400'
                                            : pregunta.es_correcta
                                              ? 'bg-emerald-500/20 text-emerald-400'
                                              : 'bg-rose-500/20 text-rose-400'
                                    }`}
                                >
                                    {esInvalidada ? (
                                        <AlertTriangle size={28} />
                                    ) : pregunta.es_correcta ? (
                                        <CheckCircle2 size={28} />
                                    ) : (
                                        <XCircle size={28} />
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">
                                        {esInvalidada
                                            ? 'Pregunta invalidada'
                                            : pregunta.es_correcta
                                              ? '¡Correcta!'
                                              : 'Incorrecta'}
                                    </h4>
                                    <p className="text-sm text-white/60">
                                        {esInvalidada
                                            ? 'No afecta tu puntaje.'
                                            : pregunta.es_correcta
                                              ? 'Has dominado este concepto.'
                                              : `La correcta era ${pregunta.respuesta_correcta}, tú marcaste ${pregunta.respuesta_estudiante}.`}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase text-white/35">Tu marca</p>
                                    <p className="mt-1 text-xl font-black text-white">
                                        {pregunta.respuesta_estudiante || 'NR'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase text-white/35">Correcta</p>
                                    <p className="mt-1 text-xl font-black text-emerald-400">
                                        {pregunta.respuesta_correcta || '—'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase text-white/35">Grupo acertó</p>
                                    <p className="mt-1 text-xl font-black text-cyan-300">
                                        {pctAc != null ? `${pctAc}%` : '—'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase text-white/35">Evaluados</p>
                                    <p className="mt-1 text-xl font-black text-white">
                                        {stats?.Total ?? '—'}
                                    </p>
                                </div>
                            </div>

                            {(tema || metaFields.length > 0) && (
                                <div className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-4">
                                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-violet-200/80">
                                        Datos de la pregunta
                                    </p>
                                    {tema && (
                                        <p className="mb-3 text-sm font-semibold leading-snug text-white/90">
                                            {tema}
                                        </p>
                                    )}
                                    {metaFields.length > 0 && (
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {metaFields.map((f) => (
                                                <MetaField key={f.label} label={f.label} value={f.value} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {stats && !esInvalidada && (
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                                            Dificultad global
                                        </span>
                                        <span className="font-bold tabular-nums text-white">
                                            {pctAc}% acertó
                                        </span>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pctAc}%` }}
                                            className={`h-full rounded-full ${
                                                ratio >= 0.6
                                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                                    : ratio >= 0.4
                                                      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                                                      : 'bg-gradient-to-r from-rose-500 to-rose-400'
                                            }`}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-white/50">
                                        {ratio < 0.4
                                            ? 'Pregunta difícil — pocos la acertaron'
                                            : ratio >= 0.7
                                              ? 'Pregunta fácil — la mayoría acertó'
                                              : 'Dificultad media'}
                                    </p>
                                </div>
                            )}

                            {stats && !esInvalidada && (
                                <div>
                                    <h5 className="mb-3 flex items-center gap-2 text-sm font-bold text-white/70">
                                        <BarChart size={16} className="text-purple-400" />
                                        Cómo respondió el grupo
                                    </h5>
                                    <div className="space-y-2">
                                        {options.map((opt) => {
                                            const rawVal = Number(stats[opt] || 0);
                                            const pct = stats.distEsPorcentaje
                                                ? Math.round(rawVal)
                                                : stats.Total > 0
                                                  ? Math.round((rawVal / stats.Total) * 100)
                                                  : 0;
                                            const count = stats.distEsPorcentaje
                                                ? Math.round((rawVal / 100) * stats.Total)
                                                : rawVal;
                                            const isCorrect = opt === pregunta.respuesta_correcta;
                                            const isSelected = opt === pregunta.respuesta_estudiante;

                                            return (
                                                <div
                                                    key={opt}
                                                    className={`rounded-xl border p-3 ${
                                                        isCorrect
                                                            ? 'border-emerald-400/40 bg-emerald-500/10'
                                                            : isSelected
                                                              ? 'border-rose-400/40 bg-rose-500/10'
                                                              : 'border-cyan-300/20 bg-gradient-to-r from-indigo-500/12 to-cyan-500/10'
                                                    }`}
                                                >
                                                    <div className="mb-2 flex justify-between text-xs">
                                                        <span
                                                            className={`flex items-center gap-2 font-bold ${
                                                                isCorrect
                                                                    ? 'text-emerald-400'
                                                                    : isSelected && !isCorrect
                                                                      ? 'text-rose-400'
                                                                      : 'text-cyan-100/90'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                                                                    isCorrect
                                                                        ? 'bg-emerald-500 text-white'
                                                                        : isSelected
                                                                          ? 'bg-rose-500 text-white'
                                                                          : 'bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/25'
                                                                }`}
                                                            >
                                                                {opt}
                                                            </span>
                                                            {isCorrect && 'Correcta'}
                                                            {isSelected && !isCorrect && '← Tu respuesta'}
                                                        </span>
                                                        <span className="font-bold tabular-nums text-white">
                                                            {pct}%
                                                            {!stats.distEsPorcentaje && stats.Total > 0 && (
                                                                <span className="ml-1 text-white/40">
                                                                    ({count})
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            className={`h-full rounded-full ${
                                                                isCorrect
                                                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                                                    : isSelected
                                                                      ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                                                                      : 'bg-gradient-to-r from-cyan-400 to-violet-400'
                                                            }`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <p className="text-[10px] text-white/35">
                                    ← → para navegar · Esc para cerrar
                                </p>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <button
                        type="button"
                        onClick={goNext}
                        disabled={!hasNext}
                        aria-label="Pregunta siguiente"
                        className="hidden sm:flex h-12 w-12 shrink-0 self-center items-center justify-center rounded-2xl border border-white/15 bg-slate-900/90 text-white shadow-lg transition-all hover:border-cyan-300/40 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        <ChevronRight size={22} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
