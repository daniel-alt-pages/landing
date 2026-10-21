'use client';

import { useMemo, useState } from 'react';
import { KeyRound, X, Layers, BookOpen } from 'lucide-react';
import {
    type ClavePregunta,
    MATERIA_COLORS,
    MATERIA_LABELS,
    aciertoTone,
    groupPreguntasBySesion,
    sortMateriasClaves,
} from '@features/estudiante/pages/dashboard/lib/answerKeySessions';
import { questionLabel } from '@/lib/questionLabel';

const MATERIA_SHORT: Record<string, string> = {
    'lectura crítica': 'Lect.',
    'matemáticas': 'Mat.',
    'sociales y ciudadanas': 'Soc.',
    'ciencias naturales': 'Cnat.',
    'inglés': 'Ing.',
};

type Props = {
    open: boolean;
    loading: boolean;
    simId: string | null;
    data: Record<string, ClavePregunta[]> | null;
    onClose: () => void;
};

function formatSimLabel(simId: string) {
    return simId.replace(/^SG11-/, 'SG11 #');
}

export default function AnswerKeyModal({ open, loading, simId, data, onClose }: Props) {
    const materiasSorted = useMemo(
        () => (data ? sortMateriasClaves(Object.entries(data)) : []),
        [data],
    );
    const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
    const activeMateria = useMemo(() => {
        if (!open || materiasSorted.length === 0) return null;
        if (selectedMateria && materiasSorted.some(([m]) => m === selectedMateria)) {
            return selectedMateria;
        }
        return materiasSorted[0][0];
    }, [open, materiasSorted, selectedMateria]);

    if (!open) return null;

    const activeEntry = materiasSorted.find(([m]) => m === activeMateria) ?? materiasSorted[0];

    const totalPreguntas = data
        ? Object.values(data).reduce((sum, qs) => sum + qs.length, 0)
        : 0;
    const totalMaterias = data ? Object.keys(data).length : 0;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="answer-key-title"
        >
            <button
                type="button"
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                aria-label="Cerrar"
                onClick={onClose}
            />

            <div className="relative z-10 flex h-dvh max-h-dvh w-full max-w-5xl flex-col overflow-hidden rounded-none border border-white/10 bg-[#0c0a14] shadow-2xl shadow-violet-950/50 sm:h-auto sm:max-h-[92vh] sm:rounded-[1.75rem]">
                {/* Header */}
                <div className="relative shrink-0 overflow-hidden border-b border-white/10">
                    <div
                        className="absolute inset-0 opacity-90"
                        style={{
                            background:
                                'linear-gradient(135deg, #4c1d95 0%, #5b21b6 35%, #312e81 70%, #1e1b4b 100%)',
                        }}
                    />
                    <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl" />
                    <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />

                    <div className="relative flex items-start justify-between gap-4 px-5 py-5 sm:px-7 sm:py-6">
                        <div className="min-w-0">
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-100">
                                <KeyRound className="h-3.5 w-3.5" aria-hidden />
                                Premium Answer Key
                            </div>
                            <h2 id="answer-key-title" className="text-xl font-black tracking-tight text-white sm:text-2xl">
                                Respuestas Correctas
                            </h2>
                            <p className="mt-1 text-sm font-medium text-violet-200/90">
                                {simId ? `Simulacro ${formatSimLabel(simId)}` : 'Cargando simulacro…'}
                                {data ? ` · ${totalPreguntas} preguntas` : ''}
                            </p>
                            {data && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                                        <Layers className="h-3.5 w-3.5 text-violet-200" aria-hidden />
                                        {totalMaterias} áreas
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                                        <BookOpen className="h-3.5 w-3.5 text-violet-200" aria-hidden />
                                        Separado por sesión S1 / S2
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            aria-label="Cerrar modal"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Selector de área */}
                {data && materiasSorted.length > 0 && (
                    <div
                        className="shrink-0 overflow-x-hidden border-b border-white/10 bg-[#0a0812]/95 px-3 py-3 sm:px-5"
                        role="tablist"
                        aria-label="Área del simulacro"
                    >
                        <div className="flex max-w-full gap-2 overflow-x-auto overflow-y-hidden pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:h-0">
                            {materiasSorted.map(([materia, preguntas]) => {
                                const color = MATERIA_COLORS[materia] || '#818cf8';
                                const label = MATERIA_LABELS[materia] || materia;
                                const short = MATERIA_SHORT[materia] || label;
                                const isActive = activeMateria === materia;
                                return (
                                    <button
                                        key={materia}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        aria-controls={`answer-key-panel-${materia.replace(/\s+/g, '-')}`}
                                        onClick={() => setSelectedMateria(materia)}
                                        className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 sm:px-3.5 ${
                                            isActive
                                                ? 'border-white/20 bg-white/[0.08] shadow-lg'
                                                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]'
                                        }`}
                                        style={
                                            isActive
                                                ? { boxShadow: `0 4px 20px ${color}30`, borderColor: `${color}55` }
                                                : undefined
                                        }
                                    >
                                        <span
                                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black text-white"
                                            style={{ background: color }}
                                        >
                                            {label.charAt(0)}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-[11px] font-bold leading-tight text-white sm:hidden">
                                                {short}
                                            </span>
                                            <span className="hidden text-[11px] font-bold leading-tight text-white sm:block sm:max-w-[7.5rem] sm:truncate">
                                                {label}
                                            </span>
                                            <span className="block text-[9px] font-medium tabular-nums text-white/45">
                                                {preguntas.length} preg.
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6 sm:py-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-20">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500/25 border-t-violet-400" />
                            <p className="text-sm font-medium text-violet-200/70">Cargando claves del simulacro…</p>
                        </div>
                    ) : data && activeEntry ? (
                        <div className="space-y-6">
                            {(() => {
                                const [materia, preguntas] = activeEntry;
                                const color = MATERIA_COLORS[materia] || '#818cf8';
                                const label = MATERIA_LABELS[materia] || materia;
                                const porSesion = groupPreguntasBySesion(materia, preguntas);

                                return (
                                    <section
                                        key={materia}
                                        id={`answer-key-panel-${materia.replace(/\s+/g, '-')}`}
                                        role="tabpanel"
                                        aria-label={label}
                                        className="overflow-hidden rounded-2xl border bg-white/[0.02]"
                                        style={{ borderColor: `${color}35` }}
                                    >
                                        <header
                                            className="flex items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-5"
                                            style={{
                                                borderColor: `${color}25`,
                                                background: `linear-gradient(90deg, ${color}18, transparent)`,
                                            }}
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-lg"
                                                    style={{
                                                        background: color,
                                                        boxShadow: `0 8px 24px ${color}40`,
                                                    }}
                                                >
                                                    {label.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="truncate text-sm font-extrabold tracking-tight text-white sm:text-base">
                                                        {label}
                                                    </h3>
                                                    <p className="text-[11px] font-medium" style={{ color: `${color}cc` }}>
                                                        {preguntas.length} preguntas · {porSesion.length} sesión
                                                        {porSesion.length !== 1 ? 'es' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </header>

                                        <div className="space-y-5 p-4 sm:p-5">
                                            {porSesion.map(({ sesion, items }) => {
                                                const isS1 = sesion === 1;
                                                const sesionAccent = isS1 ? '#a78bfa' : '#38bdf8';
                                                return (
                                                    <div key={sesion}>
                                                        <div className="mb-3 flex items-center gap-3">
                                                            <div
                                                                className="h-7 w-1 rounded-full"
                                                                style={{ background: sesionAccent }}
                                                            />
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-widest text-white/90">
                                                                    Sesión {sesion}
                                                                </p>
                                                                <p className="text-[10px] font-medium text-white/45">
                                                                    {items.length} preguntas en esta sesión
                                                                </p>
                                                            </div>
                                                            <div className="ml-auto hidden h-px flex-1 bg-white/10 sm:block" />
                                                        </div>

                                                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                                                            {items.map((p) => {
                                                                const tone = aciertoTone(p.porcentaje_acierto);
                                                                return (
                                                                    <div
                                                                        key={`${sesion}-${p.numero}`}
                                                                        className="group relative rounded-xl border border-white/[0.08] bg-white/[0.03] px-1 py-2.5 text-center transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
                                                                        title={`${questionLabel(p.numero)} · ${Math.round(p.porcentaje_acierto)}% acierto grupal`}
                                                                    >
                                                                        <p
                                                                            className="text-[7px] font-bold leading-tight sm:text-[9px]"
                                                                            style={{ color: `${color}99` }}
                                                                        >
                                                                            Pregunta {p.numero}
                                                                        </p>
                                                                        <p
                                                                            className="mt-1 text-2xl font-black leading-none tracking-tight sm:text-3xl"
                                                                            style={{
                                                                                color,
                                                                                textShadow: `0 0 20px ${color}55`,
                                                                            }}
                                                                        >
                                                                            {p.respuesta_correcta}
                                                                        </p>
                                                                        <div className="mx-auto mt-2 h-1 w-[80%] overflow-hidden rounded-full bg-white/10">
                                                                            <div
                                                                                className={`h-full rounded-full ${tone.bar}`}
                                                                                style={{
                                                                                    width: `${Math.min(100, Math.max(4, p.porcentaje_acierto))}%`,
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <p className={`mt-1 text-[8px] font-semibold tabular-nums ${tone.text}`}>
                                                                            {Math.round(p.porcentaje_acierto)}%
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <p className="text-sm font-medium text-violet-200/50">
                                No se pudieron cargar las respuestas. Intenta de nuevo.
                            </p>
                        </div>
                    )}
                </div>

                {data && (
                    <footer className="shrink-0 border-t border-violet-500/15 bg-violet-950/30 px-5 py-3 text-center">
                        <p className="text-[11px] font-medium text-violet-200/55">
                            Seamos Genios Colombia · {totalPreguntas} respuestas verificadas · barras = % acierto del grupo
                        </p>
                    </footer>
                )}
            </div>
        </div>
    );
}
