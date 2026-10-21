'use client';
import React, { useState, useEffect, useRef } from 'react';
import type { Estudiante } from '@shared/types';
import { MATERIAS } from '@features/coordinador/lib/analisis/materias';
import {
  normalizeSubjectResp,
  getSubjectPuntaje,
  getSubjectRespuestas,
  groupBySesion,
} from '@features/coordinador/lib/analisis/subjectAnswers';
import { questionLabel } from '@/lib/questionLabel';
import { studentDepartamento, studentDocumentId, studentFullName, studentInstitucion } from '@shared/lib/studentDisplay';

export function HeatmapGrid({
    students,
    materia,
    color,
    questionStats = [],
    onSelectStudent,
}: {
    students: Estudiante[];
    materia: string;
    color: string;
    questionStats?: Array<{ num: number; failed: number; total: number; rate: number; correct: string; counts: Record<string, number> }>;
    onSelectStudent?: (s: Estudiante) => void;
}) {
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: { q: number; ans: string; correct: string; isCorrect: boolean } } | null>(null);

    const sampleNorm = students.map(s => normalizeSubjectResp(getSubjectRespuestas(s, materia))).find(arr => arr.length > 0);
    const numQ = sampleNorm ? sampleNorm.length : 0;
    // Session boundary index for visual separator (index of first S2 question)
    const s2Start = sampleNorm ? sampleNorm.findIndex(r => r.sesion === 'S2') : -1;

    if (numQ === 0 && questionStats.length > 0) {
        const ordered = [...questionStats].sort((a, b) => a.num - b.num);
        return (
            <div className="overflow-x-auto px-5 pb-5 pt-1">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4" style={{ minWidth: `${Math.max(680, ordered.length * 34)}px` }}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-white/70">Heatmap agregado</p>
                            <p className="text-[11px] text-white/45">
                                Producción usa estadísticas preagregadas para evitar leer respuestas de todos los estudiantes.
                            </p>
                        </div>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] font-bold text-white/60">
                            {ordered.length} preguntas
                        </span>
                    </div>
                    <div className="flex items-end gap-1">
                        {ordered.map((q) => {
                            const failPct = Math.round(q.rate * 100);
                            const height = Math.max(12, Math.round(q.rate * 96));
                            const barColor = failPct >= 50 ? '#ef4444' : failPct >= 30 ? '#fbbf24' : '#34d399';
                            return (
                                <button
                                    key={q.num}
                                    type="button"
                                    className="group flex w-8 flex-col items-center gap-1 rounded-lg px-1 py-2 hover:bg-white/[0.04]"
                                    title={`${questionLabel(q.num)}: ${failPct}% error · correcta ${q.correct}`}
                                >
                                    <span className="text-[10px] font-bold text-white/45">{q.num}</span>
                                    <span
                                        className="w-4 rounded-full transition-transform group-hover:scale-110"
                                        style={{ height, background: barColor, boxShadow: `0 0 10px ${barColor}66` }}
                                    />
                                    <span className="text-[9px] font-black" style={{ color: barColor }}>
                                        {failPct}%
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    if (numQ === 0) {
        return (
            <div className="p-8 text-center text-white/20 text-sm">
                No hay datos de respuestas detalladas para esta materia
            </div>
        );
    }

    const sorted = [...students].sort((a, b) => {
        const ia = normalizeSubjectResp(getSubjectRespuestas(a, materia));
        const ib = normalizeSubjectResp(getSubjectRespuestas(b, materia));
        const ca = ia.filter((r: any) => r.es_correcta).length;
        const cb = ib.filter((r: any) => r.es_correcta).length;
        return cb - ca;
    });

    // Event delegation — position:fixed tooltip so it NEVER clips
    const handleCellHover = (e: React.MouseEvent) => {
        const cell = (e.target as HTMLElement).closest('[data-cell]') as HTMLElement | null;
        if (!cell) { setTooltip(null); return; }
        const rect = cell.getBoundingClientRect();
        setTooltip({
            x: rect.left + rect.width / 2,
            y: rect.top,
            content: {
                q: Number(cell.dataset.q) || 0,
                ans: cell.dataset.ans || '?',
                correct: cell.dataset.correct || '?',
                isCorrect: cell.dataset.iscorrect === '1',
            },
        });
    };

    return (
        <>
            {/* CSS-only cell hover — zero React re-renders */}
            <style>{`
            [data-cell] { transition: transform 0.1s, box-shadow 0.1s; cursor: crosshair; }
            [data-cell]:hover { transform: scale(1.5); z-index: 10; position: relative; box-shadow: 0 0 0 2px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.15); border-radius: 3px; }
        `}</style>
            <div className="hm-grid-root overflow-auto max-h-[min(72vh,720px)] px-2 sm:px-4 pb-4 pt-1">
                <div style={{ minWidth: `max(100%, calc(var(--hm-name-col) + ${numQ * 20}px))` }}>
                    {/* Column headers with session separators */}
                    <div className="flex items-end mb-1.5">
                        <div className="hm-grid-sticky-name shrink-0" aria-hidden="true" />
                        <div className="flex items-end min-w-0">
                        {sampleNorm && sampleNorm.map((r: any, i: number) => (
                            <div
                                key={i}
                                className="text-center flex-shrink-0 relative"
                                style={{ width: 'var(--hm-cell-w)', margin: '0 var(--hm-cell-gap)' }}
                            >
                                {/* Session label at boundary */}
                                {i === 0 && r.sesion && (
                                    <span className="absolute -top-4 left-0 text-[8px] font-black text-white/20 uppercase tracking-widest whitespace-nowrap">S1</span>
                                )}
                                {s2Start > 0 && i === s2Start && (
                                    <span className="absolute -top-4 left-0 text-[8px] font-black text-white/20 uppercase tracking-widest whitespace-nowrap">S2</span>
                                )}
                                {/* Separator line before S2 */}
                                {s2Start > 0 && i === s2Start && (
                                    <div className="absolute left-0 top-0 bottom-0 w-px -ml-1" style={{ background: 'rgba(139,92,246,0.3)' }} />
                                )}
                                <span className={`text-[10px] sm:text-[11px] font-bold ${(r.numero) % 5 === 0 ? 'text-white/35' : 'text-white/15'}`}>{r.numero || i + 1}</span>
                            </div>
                        ))}
                        </div>
                    </div>
                    {/* Separator */}
                    <div className="flex mb-1">
                        <div className="hm-grid-sticky-name shrink-0" aria-hidden="true" />
                        <div className="h-px flex-1 min-w-0" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
                    </div>
                    {/* Student rows — event delegation for tooltips */}
                    <div
                        onMouseMove={handleCellHover}
                        onMouseLeave={() => setTooltip(null)}
                    >
                        {sorted.map((s, si) => {
                            const nombre = studentFullName(s);
                            const meta = [studentDocumentId(s), studentDepartamento(s), studentInstitucion(s)].filter(Boolean).join(' · ');
                            const items = normalizeSubjectResp(getSubjectRespuestas(s, materia));
                            const correct = items.filter((r: any) => r.es_correcta).length;
                            const pct = numQ > 0 ? (correct / numQ * 100) : 0;
                            const isExpanded = expandedRow === si;

                            return (
                                <div key={si}>
                                    <div
                                        className="flex items-center rounded-lg py-[2px] cursor-pointer hover:bg-white/[0.02]"
                                        style={{
                                            background: isExpanded ? 'rgba(139,92,246,0.08)' : 'transparent',
                                        }}
                                        onClick={() => setExpandedRow(isExpanded ? null : si)}
                                    >
                                        {/* Student name — sticky al scroll horizontal */}
                                        <div className="hm-grid-sticky-name flex items-center gap-1.5 sm:gap-2 pr-2 sm:pr-3">
                                            <span className="text-[10px] sm:text-xs text-white/15 font-mono w-4 sm:w-5 text-right shrink-0">{si + 1}</span>
                                            <div className="min-w-0 flex-1">
                                                <span className={`text-[10px] sm:text-xs truncate font-semibold block ${isExpanded ? 'text-purple-300' : 'text-white/50'}`}>
                                                    {nombre || '—'}
                                                </span>
                                                {meta && (
                                                    <span className="text-[8px] sm:text-[9px] text-white/25 truncate block max-sm:hidden" title={meta}>{meta}</span>
                                                )}
                                            </div>
                                            <span className={`text-[10px] sm:text-[11px] font-bold shrink-0 ${pct >= 70 ? 'text-green-400/50' : pct >= 40 ? 'text-yellow-400/50' : 'text-red-400/50'}`}>
                                                {correct}/{numQ}
                                            </span>
                                        </div>
                                        {/* Response cells — with session separator */}
                                        <div className="flex items-center">
                                            {items.map((r: any, qi: number) => {
                                                const isCorrect = r?.es_correcta;
                                                const hasData = !!r;
                                                const isS2Boundary = s2Start > 0 && qi === s2Start;
                                                return (
                                                    <div key={qi} className="flex items-center">
                                                        {isS2Boundary && (
                                                            <div style={{ width: '2px', height: '14px', background: 'rgba(139,92,246,0.3)', marginRight: '2px', borderRadius: '1px', flexShrink: 0 }} />
                                                        )}
                                                        <div
                                                            className="flex-shrink-0 rounded-[2px]"
                                                            data-cell=""
                                                            data-q={r?.numero || qi + 1}
                                                            data-ans={(r?.respuesta_estudiante || r?.respuesta || '?').toUpperCase()}
                                                            data-correct={(r?.respuesta_correcta || r?.correcta || '?').toUpperCase()}
                                                            data-iscorrect={isCorrect ? '1' : '0'}
                                                            style={{
                                                                width: 'var(--hm-cell-w)',
                                                                height: 'var(--hm-cell-h)',
                                                                margin: '0 var(--hm-cell-gap)',
                                                                background: !hasData ? 'rgba(255,255,255,0.02)' :
                                                                    isCorrect ? 'rgba(52,211,153,0.5)' : 'rgba(239,68,68,0.4)',
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {/* Expanded detail */}
                                    {isExpanded && (
                                        <div className="mt-1 mb-3 p-3 rounded-xl ml-[var(--hm-name-col)]"
                                            style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-bold text-purple-300">{nombre}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                        style={{
                                                            background: pct >= 70 ? 'rgba(52,211,153,0.1)' : pct >= 40 ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
                                                            color: pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#ef4444',
                                                        }}>
                                                        {pct.toFixed(0)}% ({correct}/{numQ})
                                                    </span>
                                                    <button
                                                        className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); onSelectStudent?.(s); }}
                                                    >
                                                        Ver perfil
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {groupBySesion(items).map((g, gi) => (
                                                    <div key={gi}>
                                                        {g.label && (
                                                            <p className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-1">{g.label}</p>
                                                        )}
                                                        <div className="flex flex-wrap gap-1">
                                                            {g.items.map((r: any, i: number) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex flex-col items-center rounded-md px-1 py-0.5"
                                                                    style={{
                                                                        minWidth: '28px',
                                                                        background: r.es_correcta ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.08)',
                                                                        border: `1px solid ${r.es_correcta ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.12)'}`,
                                                                    }}
                                                                >
                                                                    <span className="text-[11px] text-white/20">{r.numero || i + 1}</span>
                                                                    <span className={`text-xs font-black ${r.es_correcta ? 'text-green-400' : 'text-red-400'}`}>
                                                                        {(r.respuesta_estudiante || r.respuesta || '?').toUpperCase()}
                                                                    </span>
                                                                    {!r.es_correcta && (
                                                                        <span className="text-[11px] text-green-400/50">{(r.respuesta_correcta || r.correcta || '').toUpperCase()}</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                    }
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* position:fixed tooltip — NEVER clips against overflow containers */}
            {tooltip && (
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y}px`,
                        transform: 'translate(-50%, -100%) translateY(-8px)',
                    }}
                >
                    <div className="bg-gray-950/95 backdrop-blur-sm border border-white/15 rounded-xl px-3 py-2 whitespace-nowrap shadow-2xl" style={{ minWidth: '120px' }}>
                        <p className="text-[11px] text-white/40 mb-0.5 font-medium">Pregunta {tooltip.content.q}</p>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-black ${tooltip.content.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {tooltip.content.ans}
                            </span>
                            {!tooltip.content.isCorrect && (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20"><path d="M5 8h6M11 5l3 3-3 3" /></svg>
                                    <span className="text-sm font-black text-green-400">{tooltip.content.correct}</span>
                                </>
                            )}
                        </div>
                        <p className="text-[11px] font-bold mt-0.5" style={{ color: tooltip.content.isCorrect ? '#34d399' : '#ef4444' }}>
                            {tooltip.content.isCorrect ? '✓ Correcta' : '✗ Incorrecta'}
                        </p>
                    </div>
                    {/* Arrow */}
                    <div className="flex justify-center">
                        <div className="w-2 h-2 bg-gray-950/95 border-r border-b border-white/15 rotate-45 -mt-1" />
                    </div>
                </div>
            )}
        </>
    );
}
