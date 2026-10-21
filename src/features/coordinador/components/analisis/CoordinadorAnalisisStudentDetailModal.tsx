'use client';
import React, { useState, useEffect, useMemo } from 'react';
import type { Estudiante } from '@shared/types';
import { MATERIAS } from '@features/coordinador/lib/analisis/materias';
import {
  normalizeSubjectResp,
  getSubjectPuntaje,
  getSubjectRespuestas,
  groupBySesion,
} from '@features/coordinador/lib/analisis/subjectAnswers';
import { displayDocumentId } from '@features/coordinador/lib/demoPrivacy';
import StudentNivelesDesempenoPanel from '@features/coordinador/components/StudentNivelesDesempenoPanel';
import CoordinatorPerformanceAreaNav, {
    materiasFromPuntajes,
    PERFORMANCE_AREA_NAV_EMBED_PAD,
    usePerformanceAreaSelection,
} from '@features/coordinador/components/CoordinatorPerformanceAreaNav';
import { useCoordEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/context/CoordEmbedProvider';
import SimulationSourceBadge from '@features/coordinador/components/ui/SimulationSourceBadge';
import { tagStudentForSimulation } from '@shared/lib/studentDisplay';

export function CoordinadorAnalisisStudentDetailModal({
    student,
    currentSimulation,
    onClose,
}: {
    student: Estudiante;
    currentSimulation: string;
    onClose: () => void;
}) {
    const { maskDocumentIds, embedDemo } = useCoordEmbed();
    const [enrichedStudent, setEnrichedStudent] = useState<Estudiante>(student);
    const [detailLoading, setDetailLoading] = useState(false);
    const nombre = `${enrichedStudent.informacion_personal?.nombres || ''} ${enrichedStudent.informacion_personal?.apellidos || ''}`.trim();
    const id = enrichedStudent.informacion_personal?.numero_identificacion;
    const global = enrichedStudent.puntaje_global || 0;
    const initials = nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    useEffect(() => {
        let cancelled = false;
        setEnrichedStudent(student);
        const alreadyHasDetails = !!(student as any).respuestas_detalladas && Object.keys((student as any).respuestas_detalladas || {}).length > 0;
        if (alreadyHasDetails || !currentSimulation) return;
        setDetailLoading(true);
        (async () => {
            try {
                const dataModule = embedDemo
                    ? await import('@/app/landing-profesional/preview-paneles/_data/firestoreMock')
                    : await import('@features/simulacro/lib/firestoreService');
                const { enrichStudentWithDetailedAnswers } = dataModule;
                const enriched = await enrichStudentWithDetailedAnswers(student, currentSimulation);
                if (!cancelled) setEnrichedStudent(tagStudentForSimulation(enriched, currentSimulation));
            } catch (err) {
                console.warn('[AnalisisPage] Error cargando answerDetails:', err);
            } finally {
                if (!cancelled) setDetailLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [student, currentSimulation]);

    // Per-subject stats with normalized data
    const subjectStats = MATERIAS.map(m => {
        const p = getSubjectPuntaje(enrichedStudent, m.key);
        const items = normalizeSubjectResp(getSubjectRespuestas(enrichedStudent, m.key), m.key);
        const hasDetails = items.length > 0;
        const correct = hasDetails ? items.filter((r: any) => r.es_correcta).length : p.correctas;
        const total = hasDetails ? items.length : p.total_preguntas;
        const pct = total > 0 ? (correct / total * 100) : 0;
        const puntaje = p.puntaje;
        return { ...m, correct, total, pct, puntaje, items, hasDetails };
    });

    const totalCorrect = subjectStats.reduce((s, m) => s + m.correct, 0);
    const totalQ = subjectStats.reduce((s, m) => s + m.total, 0);
    const globalPct = totalQ > 0 ? (totalCorrect / totalQ * 100) : 0;
    const best = [...subjectStats].sort((a, b) => b.pct - a.pct)[0];
    const worst = [...subjectStats].sort((a, b) => a.pct - b.pct)[0];

    const [activeSubject, setActiveSubject] = useState(MATERIAS[0].key);
    const [selectedQ, setSelectedQ] = useState<number | null>(null);
    const [auditSesionFilter, setAuditSesionFilter] = useState<'all' | 'S1' | 'S2'>('all');
    const [contentView, setContentView] = useState<'audit' | 'niveles'>('audit');
    const nivelesAreas = useMemo(() => materiasFromPuntajes(enrichedStudent.puntajes), [enrichedStudent.puntajes]);
    const { activeKey: nivelesMateria, setActiveKey: setNivelesMateria } = usePerformanceAreaSelection(nivelesAreas);
    const activeData = subjectStats.find(s => s.key === activeSubject) || subjectStats[0];
    const sessionGroups = groupBySesion(activeData.items, activeSubject);
    const filteredSessionGroups =
        auditSesionFilter === 'all'
            ? sessionGroups
            : sessionGroups.filter(g => g.sesionKey === auditSesionFilter);
    const showSesionFilter = sessionGroups.filter(g => g.sesionKey === 'S1' || g.sesionKey === 'S2').length > 1;

    useEffect(() => {
        setAuditSesionFilter('all');
        setSelectedQ(null);
    }, [activeSubject]);

    // Escape to close
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    // Lock body scroll while modal is open
    useEffect(() => {
        const orig = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = orig; };
    }, []);

    const nivelColor = global >= 350 ? '#34d399' : global >= 280 ? '#60a5fa' : global >= 200 ? '#fbbf24' : '#ef4444';
    const nivelLabel = global >= 350 ? 'Superior' : global >= 280 ? 'Alto' : global >= 200 ? 'Medio' : 'Bajo';

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center overflow-y-auto overscroll-y-contain p-0 sm:items-center sm:p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" style={{ animation: 'sdmFadeIn 0.2s ease-out' }} />
            {/* Apple-style CSS animations */}
            <style>{`
                @keyframes sdmFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes sdmSlideUp { from { opacity: 0; transform: translateY(40px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes sdmRing { from { stroke-dasharray: 0 251.3; } }
                @keyframes sdmPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
                .sdm-card { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
                .sdm-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
                .sdm-card:active { transform: scale(0.97); }
                .sdm-q { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
                .sdm-q:hover { transform: translateY(-1px); z-index: 10; box-shadow: 0 4px 14px rgba(0,0,0,0.28); }
            `}</style>

            <div
                className={`relative flex max-h-[calc(100dvh_-_env(safe-area-inset-top,0px)_-_env(safe-area-inset-bottom,0px))] w-full flex-col overflow-hidden rounded-t-[28px] sm:max-h-[calc(100dvh_-_2rem)] sm:rounded-[28px] ${contentView === 'niveles' ? 'sm:max-w-5xl' : 'sm:max-w-xl'}`}
                style={{
                    background: 'linear-gradient(180deg, rgba(22,22,38,0.98) 0%, rgba(12,12,22,0.99) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
                    animation: 'sdmSlideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Drag indicator (mobile) */}
                <div className="sm:hidden flex justify-center pt-2 pb-1">
                    <div className="w-9 h-[5px] rounded-full bg-white/15" />
                </div>

                {/* ─── Header with gradient accent ─── */}
                <div className="relative shrink-0 overflow-hidden">
                    {/* Gradient accent line */}
                    <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${nivelColor}, #818cf8, ${best?.color || '#818cf8'})` }} />
                    {/* Background glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[120px] rounded-full opacity-20 blur-[60px]" style={{ background: nivelColor }} />

                    <div className="relative px-5 pt-5 pb-4">
                        {/* Close button */}
                        <button onClick={onClose}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer"
                            style={{ backdropFilter: 'blur(10px)' }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
                        </button>

                        <div className="flex items-center gap-4">
                            {/* Avatar with ring */}
                            <div className="relative flex-shrink-0">
                                <svg viewBox="0 0 80 80" width="64" height="64">
                                    <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                    <circle cx="40" cy="40" r="36" fill="none" stroke={nivelColor} strokeWidth="3"
                                        strokeDasharray={`${(globalPct / 100) * 226.2} 226.2`}
                                        strokeLinecap="round" transform="rotate(-90 40 40)"
                                        style={{ animation: 'sdmRing 1s ease-out', filter: `drop-shadow(0 0 4px ${nivelColor}40)` }} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-sm font-black"
                                        style={{ background: `${nivelColor}15`, color: nivelColor }}>
                                        {initials || '?'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-black text-white truncate leading-tight">{nombre || 'Estudiante'}</h2>
                                {id && (
                                    <p className="text-[11px] text-white/25 font-mono mt-0.5">
                                        {enrichedStudent.informacion_personal?.tipo_identificacion}:{' '}
                                        {displayDocumentId(id, maskDocumentIds)}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <SimulationSourceBadge simId={currentSimulation} compact />
                                    <span className="text-[11px] font-bold px-2.5 py-[3px] rounded-full" style={{ background: `${nivelColor}15`, color: nivelColor }}>
                                        {nivelLabel} · {global}
                                    </span>
                                    <span className="text-[11px] text-white/20">{totalCorrect}/{totalQ} respuestas</span>
                                </div>
                            </div>
                        </div>

                        {/* Strengths & weaknesses pills */}
                        {best && worst && best.key !== worst.key && (
                            <div className="flex gap-2 mt-3">
                                <div className="flex-1 rounded-2xl p-3" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.1)' }}>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <span className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-wider">Fortaleza</span>
                                    </div>
                                    <p className="text-xs font-bold text-emerald-400 mt-1">{best.label}</p>
                                    <p className="text-[11px] text-emerald-400/40">{best.correct}/{best.total} · {best.pct.toFixed(0)}%</p>
                                </div>
                                <div className="flex-1 rounded-2xl p-3" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        <span className="text-[10px] font-bold text-red-400/60 uppercase tracking-wider">Prioridad</span>
                                    </div>
                                    <p className="text-xs font-bold text-red-400 mt-1">{worst.label}</p>
                                    <p className="text-[11px] text-red-400/40">{worst.correct}/{worst.total} · {worst.pct.toFixed(0)}%</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="shrink-0 px-5 pb-2">
                    <div className="flex rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {([
                            { id: 'audit' as const, label: 'Auditoría' },
                            { id: 'niveles' as const, label: 'Niveles de desempeño' },
                        ]).map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setContentView(tab.id)}
                                className="flex-1 py-2.5 text-xs font-bold transition-all"
                                style={{
                                    background: contentView === tab.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                                    color: contentView === tab.id ? '#c4b5fd' : 'rgba(255,255,255,0.35)',
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {contentView === 'niveles' && (
                    <div
                        className="min-h-0 flex-1 overflow-y-auto overscroll-contain overflow-x-hidden px-5 space-y-4"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(255,255,255,0.08) transparent',
                            paddingBottom: PERFORMANCE_AREA_NAV_EMBED_PAD,
                        }}
                    >
                        <StudentNivelesDesempenoPanel
                            puntajes={enrichedStudent.puntajes}
                            showNav={false}
                            activeMateria={nivelesMateria}
                            onMateriaChange={setNivelesMateria}
                        />
                    </div>
                )}

                {contentView !== 'niveles' && (
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain overflow-x-hidden px-5 pb-5 space-y-4"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>

                    <>
                    <div>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[2px] mb-2">Rendimiento por Materia</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                            {subjectStats.map(s => {
                                const isActive = activeSubject === s.key;
                                return (
                                    <button key={s.key} onClick={() => { setActiveSubject(s.key); setSelectedQ(null); setAuditSesionFilter('all'); }}
                                        className="sdm-card flex-shrink-0 rounded-2xl px-3 py-2.5 text-center cursor-pointer"
                                        style={{
                                            minWidth: '90px',
                                            background: isActive ? `linear-gradient(135deg, ${s.color}18, ${s.color}08)` : 'rgba(255,255,255,0.025)',
                                            border: `1px solid ${isActive ? s.color + '35' : 'rgba(255,255,255,0.05)'}`,
                                            boxShadow: isActive ? `0 4px 20px ${s.color}12, inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
                                        }}>
                                        <p className="text-lg font-black leading-none" style={{ color: s.color }}>{s.puntaje || s.pct.toFixed(0)}</p>
                                        <p className="text-[10px] font-bold text-white/35 mt-1 truncate">{s.label}</p>
                                        <div className="mt-1.5 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.pct}%`, background: `linear-gradient(90deg, ${s.color}80, ${s.color})` }} />
                                        </div>
                                        <p className="text-[10px] text-white/20 mt-1 font-semibold">{s.correct}/{s.total}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active subject detail card */}
                    <div className="rounded-2xl overflow-hidden" style={{
                        background: `linear-gradient(180deg, ${activeData.color}06, rgba(255,255,255,0.015))`,
                        border: `1px solid ${activeData.color}18`,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
                    }}>
                        {/* Accent bar */}
                        <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${activeData.color}, ${activeData.color}40, transparent)` }} />

                        <div className="p-4 space-y-3">
                            {/* Stats row */}
                            <div className="flex items-center gap-3">
                                {/* Mini ring */}
                                <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
                                    <svg viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
                                        <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                                        <circle cx="26" cy="26" r="22" fill="none" stroke={activeData.color} strokeWidth="3"
                                            strokeDasharray={`${(activeData.pct / 100) * 138.2} 138.2`}
                                            strokeLinecap="round"
                                            style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 3px ${activeData.color}30)` }} />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-black" style={{ color: activeData.color }}>{activeData.pct.toFixed(0)}%</span>
                                    </div>
                                </div>

                                {/* Stat cards */}
                                <div className="flex-1 grid grid-cols-3 gap-1.5">
                                    <div className="rounded-xl p-2 text-center" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.1)' }}>
                                        <span className="text-base font-black text-emerald-400">{activeData.correct}</span>
                                        <p className="text-[9px] text-emerald-400/40 font-bold uppercase">Correctas</p>
                                    </div>
                                    <div className="rounded-xl p-2 text-center" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.08)' }}>
                                        <span className="text-base font-black text-red-400">{activeData.total - activeData.correct}</span>
                                        <p className="text-[9px] text-red-400/40 font-bold uppercase">Incorrectas</p>
                                    </div>
                                    <div className="rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span className="text-base font-black text-white/50">{activeData.total}</span>
                                        <p className="text-[9px] text-white/20 font-bold uppercase">Total</p>
                                    </div>
                                </div>
                            </div>

                            {/* Answer grid — grouped by session */}
                            {activeData.items.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Hoja de Respuestas</p>
                                        {showSesionFilter && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {(['all', 'S1', 'S2'] as const).map((key) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => { setAuditSesionFilter(key); setSelectedQ(null); }}
                                                        className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all"
                                                        style={{
                                                            background: auditSesionFilter === key ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                                                            border: `1px solid ${auditSesionFilter === key ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.08)'}`,
                                                            color: auditSesionFilter === key ? '#c4b5fd' : 'rgba(255,255,255,0.35)',
                                                        }}
                                                    >
                                                        {key === 'all' ? 'Todas' : key}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {filteredSessionGroups.map((g, gi) => {
                                        const gCorr = g.items.filter((r: any) => r.es_correcta).length;
                                        return (
                                            <div key={gi} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                {g.label && (
                                                    <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <span className="text-[10px] font-black text-white/35 uppercase tracking-widest">{g.label}</span>
                                                        <span className="text-[10px] text-white/20">{gCorr}/{g.items.length}</span>
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-[3px] p-2">
                                                    {g.items.map((r: any, i: number) => {
                                                        const qNum = r.numero || i + 1;
                                                        const isSelected = selectedQ === r.numero;
                                                        return (
                                                            <button key={i}
                                                                type="button"
                                                                className="sdm-q relative rounded-lg flex items-center justify-center cursor-pointer"
                                                                style={{
                                                                    width: '26px', height: '26px',
                                                                    background: isSelected ? 'rgba(99,102,241,0.3)' :
                                                                        r.es_correcta ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.12)',
                                                                    border: `1px solid ${isSelected ? 'rgba(99,102,241,0.5)' :
                                                                        r.es_correcta ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.18)'}`,
                                                                    color: isSelected ? '#c4b5fd' :
                                                                        r.es_correcta ? '#34d399' : '#ef4444',
                                                                    fontSize: '10px', fontWeight: 800,
                                                                }}
                                                                onClick={() => setSelectedQ(selectedQ === r.numero ? null : r.numero)}
                                                                title={`Abrir pregunta ${qNum}`}
                                                            >
                                                                {qNum}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {selectedQ !== null && g.items.some((x: any) => x.numero === selectedQ) && (() => {
                                                    const r = g.items.find((x: any) => x.numero === selectedQ);
                                                    if (!r) return null;
                                                    const studentAns = r.respuesta_estudiante || r.respuesta || '?';
                                                    const correctAns = r.respuesta_correcta || r.correcta || '?';
                                                    return (
                                                        <div className="mx-2 mb-2 rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', animation: 'sdmFadeIn 0.15s ease-out' }}>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-black text-indigo-300">Pregunta {r.numero}</span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.es_correcta ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                    {r.es_correcta ? 'Correcta' : 'Incorrecta'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <div className="text-center">
                                                                    <span className="text-lg font-black" style={{ color: r.es_correcta ? '#34d399' : '#ef4444' }}>{studentAns.toUpperCase()}</span>
                                                                    <p className="text-[8px] text-white/20 uppercase font-bold">Respondió</p>
                                                                </div>
                                                                {!r.es_correcta && (<>
                                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/15">
                                                                        <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                    <div className="text-center">
                                                                        <span className="text-lg font-black text-emerald-400">{correctAns.toUpperCase()}</span>
                                                                        <p className="text-[8px] text-white/20 uppercase font-bold">Correcta</p>
                                                                    </div>
                                                                </>)}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        );
                                    })}
                                    {/* Legend */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2.5 h-2.5 rounded" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.2)' }} />
                                            <span className="text-[10px] text-white/25">Correcta</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2.5 h-2.5 rounded" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.18)' }} />
                                            <span className="text-[10px] text-white/25">Incorrecta</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.015)' }}>
                                    <p className="text-white/35 text-xs font-semibold">
                                        {detailLoading ? 'Cargando respuestas detalladas…' : 'Detalle item a item no disponible para este estudiante'}
                                    </p>
                                    <p className="mt-1 text-[11px] text-white/20">
                                        Se muestran totales desde puntajes agregados: {activeData.correct}/{activeData.total} correctas.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    </>
                </div>
                )}

                {contentView === 'niveles' && (
                    <CoordinatorPerformanceAreaNav
                        items={nivelesAreas}
                        activeKey={nivelesMateria}
                        onSelect={setNivelesMateria}
                        layout="bottom"
                        anchor="embed"
                        label="Área de desempeño"
                    />
                )}
            </div>
        </div>
    );
}
