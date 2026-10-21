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
import { resolveQuestionLetters } from '@features/coordinador/lib/answerOptions';

export function QuestionDetailModal({ q, materia, onClose }: {
    q: { num: number; failed: number; total: number; rate: number; correct: string; counts: Record<string, number>; studentMap: Record<string, string[]> };
    materia: { label: string; color: string };
    onClose: () => void;
}) {
    const failPct = q.rate * 100;
    const successPct = 100 - failPct;
    const letters = resolveQuestionLetters(q.counts, q.correct, q.studentMap);
    const maxCount = Math.max(...letters.map(l => q.counts[l] || 0), 1);
    const hasStudentNames = letters.some(l => (q.studentMap?.[l]?.length || 0) > 0) || (q.studentMap?.['NR']?.length || 0) > 0;
    const totalStudentsPerAnswer = hasStudentNames
        ? letters.reduce((sum, l) => sum + (q.studentMap?.[l]?.length || 0), 0) + (q.studentMap?.['NR']?.length || 0)
        : q.total;

    // Determine the "distractor principal" — highest incorrect answer
    const topDistractor = letters.filter(l => l !== q.correct).reduce((best, l) => (q.counts[l] || 0) > (q.counts[best] || 0) ? l : best, letters.filter(l => l !== q.correct)[0]);
    const distractorPct = q.total > 0 ? ((q.counts[topDistractor] || 0) / q.total * 100) : 0;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <div
                className="relative flex-1 flex flex-col overflow-hidden animate-in"
                style={{
                    background: 'linear-gradient(135deg, rgba(18,18,32,0.99), rgba(12,12,22,0.99))',
                    animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <style>{`
                    @keyframes slideUp {
                        from { transform: translateY(30px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}</style>

                {/* ═══ Top Bar ═══ */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 lg:px-10 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-4">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-[3px] uppercase" style={{ color: materia.color }}>{materia.label}</p>
                            <p className="text-xl font-black text-white">{questionLabel(q.num)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Quick KPIs in top bar */}
                        <div className="hidden sm:flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-[10px] text-white/25 font-bold uppercase">Correcta</p>
                                <p className="text-lg font-black text-green-400">{q.correct}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-white/25 font-bold uppercase">Acierto</p>
                                <p className="text-lg font-black" style={{ color: successPct >= 60 ? '#34d399' : successPct >= 40 ? '#fbbf24' : '#ef4444' }}>{successPct.toFixed(0)}%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-white/25 font-bold uppercase">Total</p>
                                <p className="text-lg font-black text-white">{q.total}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] hover:bg-white/10 transition-all text-white/40 hover:text-white border border-white/5 hover:border-white/10"
                        >
                            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                        </button>
                    </div>
                </div>

                {/* ═══ Main Content — 2 Column Layout ═══ */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-0 min-h-full">

                        {/* ─── Left Column: KPIs + Distribution ─── */}
                        <div className="px-6 lg:px-10 py-6 lg:border-r border-white/[0.06] space-y-6">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-white/[0.04] rounded-xl p-4 text-center border border-white/5">
                                    <p className="text-[10px] text-white/25 font-bold uppercase tracking-wider">Correcta</p>
                                    <p className="text-2xl font-black text-green-400 mt-1">{q.correct}</p>
                                </div>
                                <div className="bg-white/[0.04] rounded-xl p-4 text-center border border-white/5">
                                    <p className="text-[10px] text-white/25 font-bold uppercase tracking-wider">Acierto</p>
                                    <p className="text-2xl font-black mt-1" style={{ color: successPct >= 60 ? '#34d399' : successPct >= 40 ? '#fbbf24' : '#ef4444' }}>
                                        {successPct.toFixed(0)}%
                                    </p>
                                </div>
                                <div className="bg-white/[0.04] rounded-xl p-4 text-center border border-white/5">
                                    <p className="text-[10px] text-white/25 font-bold uppercase tracking-wider">Fallo</p>
                                    <p className="text-2xl font-black text-red-400 mt-1">{failPct.toFixed(0)}%</p>
                                </div>
                                <div className="bg-white/[0.04] rounded-xl p-4 text-center border border-white/5">
                                    <p className="text-[10px] text-white/25 font-bold uppercase tracking-wider">Respuestas</p>
                                    <p className="text-2xl font-black text-white mt-1">{q.total}</p>
                                </div>
                            </div>

                            {/* Distribution bars */}
                            <div>
                                <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Distribución de Respuestas</p>
                                <div className="space-y-3">
                                    {letters.map(l => {
                                        const count = q.counts[l] || 0;
                                        const pct = q.total > 0 ? (count / q.total * 100) : 0;
                                        const isCorrect = l === q.correct;
                                        const barColor = isCorrect ? '#34d399' : pct > 25 && !isCorrect ? '#f97316' : 'rgba(255,255,255,0.15)';
                                        return (
                                            <div key={l} className="flex items-center gap-3">
                                                <span className={`text-sm font-black w-8 text-center ${isCorrect ? 'text-green-400' : 'text-white/40'}`}>{l}</span>
                                                <div className="flex-1 h-9 rounded-xl overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                    <div className="h-full rounded-xl transition-all duration-700" style={{ width: `${Math.max(pct, 1)}%`, background: barColor }} />
                                                    <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-bold text-white/60">{count} ({pct.toFixed(0)}%)</span>
                                                </div>
                                                {isCorrect && <span className="text-green-400 text-sm font-bold">✓</span>}
                                            </div>
                                        );
                                    })}
                                    {/* NR */}
                                    {(q.counts['NR'] || 0) > 0 && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black w-8 text-center text-white/20">NR</span>
                                            <div className="flex-1 h-9 rounded-xl overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                <div className="h-full rounded-xl" style={{ width: `${(q.counts['NR'] / q.total * 100)}%`, background: 'rgba(255,255,255,0.08)' }} />
                                                <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-bold text-white/30">{q.counts['NR']}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Insight panel */}
                            <div className="rounded-xl p-4 space-y-2" style={{ background: `${materia.color}08`, border: `1px solid ${materia.color}15` }}>
                                <p className="text-xs font-bold" style={{ color: materia.color }}>Análisis Automático</p>
                                <p className="text-[12px] text-white/50 leading-relaxed">
                                    {successPct >= 60
                                        ? `${questionLabel(q.num)} tiene un buen rendimiento con ${successPct.toFixed(0)}% de acierto.`
                                        : successPct >= 40
                                            ? `${questionLabel(q.num)} presenta rendimiento moderado. El distractor principal es la opción ${topDistractor} con ${distractorPct.toFixed(0)}% de selección.`
                                            : `${questionLabel(q.num)} es crítica: solo ${successPct.toFixed(0)}% de acierto. La opción ${topDistractor} captura ${distractorPct.toFixed(0)}% de las respuestas — se recomienda revisión profunda del tema.`
                                    }
                                </p>
                                {successPct < 60 && (
                                    <div className="flex items-center gap-4 pt-1 text-[11px]">
                                        <span className="text-white/25">Distractor:</span>
                                        <span className="font-black text-orange-400">{topDistractor} ({distractorPct.toFixed(0)}%)</span>
                                        <span className="text-white/25">vs Correcta:</span>
                                        <span className="font-black text-green-400">{q.correct} ({successPct.toFixed(0)}%)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── Right Column: Students per Answer ─── */}
                        <div className="px-6 lg:px-10 py-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Estudiantes por Respuesta</p>
                                <span className="text-[11px] text-white/20 font-bold">{totalStudentsPerAnswer} total</span>
                            </div>
                            <div className="space-y-3">
                                {letters.map(l => {
                                    const students = q.studentMap?.[l] || [];
                                    const isCorrect = l === q.correct;
                                    const count = hasStudentNames ? students.length : (q.counts[l] || 0);
                                    if (count === 0) return null;
                                    const pct = q.total > 0 ? (count / q.total * 100) : 0;
                                    return (
                                        <details key={l} className="group rounded-xl overflow-hidden transition-all" style={{ background: isCorrect ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)', border: isCorrect ? '1px solid rgba(52,211,153,0.15)' : '1px solid rgba(255,255,255,0.06)' }}>
                                            <summary className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-white/[0.02] transition-colors">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${isCorrect ? 'bg-green-500/15 text-green-400' : 'bg-white/[0.04] text-white/40'}`}>
                                                    {l}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-bold ${isCorrect ? 'text-green-400' : 'text-white/60'}`}>{count} estudiante{count !== 1 ? 's' : ''}</span>
                                                        {isCorrect && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-green-500/15 text-green-400">CORRECTA</span>}
                                                    </div>
                                                    <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: isCorrect ? '#34d399' : pct > 25 ? '#f97316' : 'rgba(255,255,255,0.2)' }} />
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold ${isCorrect ? 'text-green-400/60' : 'text-white/25'}`}>{pct.toFixed(0)}%</span>
                                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-white/20 group-open:rotate-180 transition-transform duration-200 flex-shrink-0">
                                                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </summary>
                                            <div className="px-4 pb-4 pt-1">
                                                {hasStudentNames ? (
                                                    <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto">
                                                        {students.map((name, i) => (
                                                            <span key={i} className={`text-xs px-2.5 py-1 rounded-lg transition-all hover:scale-[1.02] ${isCorrect ? 'bg-green-500/10 text-green-400/80 hover:bg-green-500/15' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70'}`}>
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-[12px] text-white/35">
                                                        {count} estudiantes seleccionaron esta opción.
                                                    </p>
                                                )}
                                            </div>
                                        </details>
                                    );
                                })}
                                {/* NR Students */}
                                {(q.studentMap?.['NR']?.length || 0) > 0 && (
                                    <details className="group rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <summary className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-white/[0.02] transition-colors">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black bg-white/[0.04] text-white/30">NR</div>
                                            <span className="text-sm font-bold text-white/40">{q.studentMap['NR'].length} sin respuesta</span>
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="ml-auto text-white/20 group-open:rotate-180 transition-transform duration-200">
                                                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </summary>
                                        <div className="px-4 pb-4 pt-1 flex flex-wrap gap-1.5">
                                            {q.studentMap['NR'].map((name, i) => (
                                                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.03] text-white/30">{name}</span>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════
// Question Card (for grouped view)
// ═══════════════════════════════════════
