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

export function StudentResponseCard({ student, materia, color, onSelectStudent }: { student: Estudiante; materia: string; color: string; onSelectStudent?: (s: Estudiante) => void }) {
    const nombre = `${student.informacion_personal?.nombres || ''} ${student.informacion_personal?.apellidos || ''}`.trim();
    const items = normalizeSubjectResp(getSubjectRespuestas(student, materia));
    const p = getSubjectPuntaje(student, materia);
    const hasDetails = items.length > 0;
    const correct = hasDetails ? items.filter((r: any) => r.es_correcta).length : p.correctas;
    const total = hasDetails ? items.length : p.total_preguntas;
    const pct = total > 0 ? (correct / total * 100) : 0;

    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => onSelectStudent?.(student)}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                        style={{ background: pct >= 70 ? 'rgba(52,211,153,0.2)' : pct >= 40 ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)' }}
                    >
                        {pct.toFixed(0)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-white/80 truncate">{nombre || 'Sin nombre'}</p>
                        <p className="text-xs text-white/30">{correct}/{total} correctas</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-2 rounded-full overflow-hidden" style={{ width: '80px', background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{
                            width: `${pct}%`,
                            background: pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#ef4444',
                        }} />
                    </div>
                    <span className="text-xs font-bold text-white/30 w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
            </div>
            {/* Response grid — grouped by session */}
            <div className="space-y-1.5">
                {hasDetails ? groupBySesion(items).map((g, gi) => (
                    <div key={gi}>
                        {g.label && (
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">{g.label}</p>
                        )}
                        <div className="flex flex-wrap gap-[3px]">
                            {g.items.map((r: any, i: number) => (
                                <div
                                    key={i}
                                    className="w-5 h-5 rounded-[3px] flex items-center justify-center text-[11px] font-bold"
                                    style={{
                                        background: r.es_correcta ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.15)',
                                        color: r.es_correcta ? '#34d399' : '#ef4444',
                                    }}
                                    title={`${questionLabel(r.numero)}: ${r.respuesta_estudiante || r.respuesta || '?'} → ${r.respuesta_correcta || r.correcta || '?'}`}
                                >
                                    {r.es_correcta ? '✓' : (r.respuesta_estudiante || r.respuesta || '?').charAt(0)}
                                </div>
                            ))}
                        </div>
                    </div>
                )) : (
                    <div className="rounded-lg border border-white/5 bg-white/[0.015] px-3 py-2">
                        <p className="text-[11px] text-white/35">
                            Sin detalle item a item. Resumen agregado: {correct}/{total} correctas · puntaje {p.puntaje}/100.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
