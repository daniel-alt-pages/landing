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

export function QuestionCard({ q, materia, onClick }: {
    q: { num: number; failed: number; total: number; rate: number; correct: string; counts: Record<string, number> };
    materia: { color: string };
    onClick: () => void;
}) {
    const failPct = q.rate * 100;
    const isCritical = q.rate > 0.4;
    const letters = resolveQuestionLetters(q.counts, q.correct);
    const topDistractor = letters.filter(l => l !== q.correct).reduce((b, l) => (q.counts[l] || 0) > (q.counts[b] || 0) ? l : b, letters[0]);

    return (
        <div
            className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{
                background: isCritical ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                border: isCritical ? '1px solid rgba(239,68,68,0.12)' : '1px solid rgba(255,255,255,0.05)',
            }}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black" style={{ color: materia.color }}>{questionLabel(q.num)}</span>
                <div className="flex items-center gap-2">
                    <span className="text-green-400 text-xs font-bold bg-green-500/10 px-1.5 py-0.5 rounded">{q.correct}</span>
                    <span className={`text-xs font-black ${isCritical ? 'text-red-400' : 'text-white/40'}`}>{failPct.toFixed(0)}% fallo</span>
                </div>
            </div>
            {/* Mini distribution */}
            <div className="flex gap-1 h-4">
                {letters.map(l => {
                    const pct = q.total > 0 ? (q.counts[l] || 0) / q.total * 100 : 0;
                    return (
                        <div key={l} className="flex-1 rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <div className="h-full rounded-sm" style={{
                                width: `${pct}%`,
                                background: l === q.correct ? '#34d399' : l === topDistractor && isCritical ? '#f97316' : 'rgba(255,255,255,0.1)',
                            }} />
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-1">
                {letters.map(l => (
                    <span key={l} className={`text-[11px] flex-1 text-center ${l === q.correct ? 'text-green-400/60' : 'text-white/20'}`}>{l}</span>
                ))}
            </div>
        </div>
    );
}
