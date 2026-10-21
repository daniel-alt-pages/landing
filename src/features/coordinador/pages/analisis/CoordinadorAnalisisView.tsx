'use client';
import { useCoordinadorData as useCoordinadorDataHook } from '@features/coordinador/hooks/useCoordinadorData';
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Estudiante } from '@shared/types';
import { useUrlQueryState } from '@shared/hooks/useUrlQueryState';
import { LoadingState, ErrorState } from '@features/coordinador/components/ui';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { calcMean, calcMedian, calcMode, calcStdDev, calcCorrelation } from '@features/coordinador/lib/analisis/stats';
import { MATERIAS } from '@features/coordinador/lib/analisis/materias';
import {
    normalizeSubjectResp,
    getSubjectRespuestas,
    getSubjectPuntaje,
} from '@features/coordinador/lib/analisis/subjectAnswers';
import { CollapsibleSection } from '@features/coordinador/components/analisis/CollapsibleSection';
import { questionLabel } from '@/lib/questionLabel';
import { CoordinadorAnalisisStudentDetailModal } from '@features/coordinador/components/analisis/CoordinadorAnalisisStudentDetailModal';
import { StudentResponseCard } from '@features/coordinador/components/analisis/StudentResponseCard';
import { HeatmapGrid } from '@features/coordinador/components/analisis/HeatmapGrid';
import { QuestionDetailModal } from '@features/coordinador/components/analisis/QuestionDetailModal';
import { QuestionCard } from '@features/coordinador/components/analisis/QuestionCard';
import { resolveQuestionLetters } from '@features/coordinador/lib/answerOptions';
import { useCoordinadorPanelLayout } from '@features/coordinador/hooks/useCoordinadorPanelLayout';

export type UseCoordinadorDataFn = typeof useCoordinadorDataHook;

type AnalisisSort = 'num' | 'rate';

export function CoordinadorAnalisisView({
    useCoordinadorData,
    embedDemo = false,
}: {
    useCoordinadorData: UseCoordinadorDataFn;
    /** Demo landing embebida (misma lógica responsiva que preview-paneles). */
    embedDemo?: boolean;
}) {
    const layout = useCoordinadorPanelLayout(embedDemo);
    const {
        myInstitution: inst, questionAnalysis,
        availableSimulations, currentSimulation, setSimulation,
        currentInstitution,
        loading, error, loadFullStudents,
    } = useCoordinadorData();

    // Cargar datos completos (con respuestas_detalladas) al entrar a esta página
    useEffect(() => {
        loadFullStudents();
    }, [currentSimulation, currentInstitution]); // eslint-disable-line react-hooks/exhaustive-deps

    const [selectedMateria, setSelectedMateria] = useUrlQueryState('materia', MATERIAS[0].key, { persist: !embedDemo });
    const [sortByRaw, setSortByRaw] = useUrlQueryState('sort', 'rate', { persist: !embedDemo });
    const sortBy: AnalisisSort = sortByRaw === 'num' ? 'num' : 'rate';
    const setSortBy = (v: AnalisisSort) => setSortByRaw(v);
    const [heatmapViewRaw, setHeatmapViewRaw] = useUrlQueryState('heatmap', 'grid', { persist: !embedDemo });
    const heatmapView: 'grid' | 'list' = heatmapViewRaw === 'list' ? 'list' : 'grid';
    const setHeatmapView = (v: 'grid' | 'list') => setHeatmapViewRaw(v);
    const [questionViewRaw, setQuestionViewRaw] = useUrlQueryState('qview', 'list', { persist: !embedDemo });
    const questionView: 'list' | 'group' = questionViewRaw === 'group' ? 'group' : 'list';
    const setQuestionView = (v: 'list' | 'group') => setQuestionViewRaw(v);
    const [modalQuestion, setModalQuestion] = useState<any>(null);
    const [studentId, setStudentId] = useUrlQueryState('student', '', { persist: !embedDemo });
    const [modalStudent, setModalStudent] = useState<Estudiante | null>(null);
    const [sidebarOpenRaw, setSidebarOpenRaw] = useUrlQueryState('drawer', '', { persist: !embedDemo });
    const sidebarOpen = sidebarOpenRaw === '1';
    const setSidebarOpen = (open: boolean) => setSidebarOpenRaw(open ? '1' : '');
    const [sidebarTabRaw, setSidebarTabRaw] = useUrlQueryState('drawerTab', 'questions', { persist: !embedDemo });
    const sidebarTab: 'questions' | 'heatmap' = sidebarTabRaw === 'heatmap' ? 'heatmap' : 'questions';
    const setSidebarTab = (v: 'questions' | 'heatmap') => setSidebarTabRaw(v);

    const openStudentModal = useCallback(
        (s: Estudiante) => {
            setModalStudent(s);
            setStudentId(s.informacion_personal?.numero_identificacion || '');
        },
        [setStudentId],
    );
    const closeStudentModal = useCallback(() => {
        setModalStudent(null);
        setStudentId('');
    }, [setStudentId]);

    useEffect(() => {
        if (!studentId || loading || !inst) return;
        const found = (inst.students || []).find(
            (s) => String(s.informacion_personal?.numero_identificacion || '') === studentId,
        );
        if (found) setModalStudent(found);
    }, [studentId, loading, inst]);

    // Listen for sidebar open requests from nav layout
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.tab) setSidebarTab(detail.tab);
            setSidebarOpen(true);
        };
        window.addEventListener('open-analisis-drawer', handler);
        return () => window.removeEventListener('open-analisis-drawer', handler);
    }, []);
    const materia = MATERIAS.find(m => m.key === selectedMateria) || MATERIAS[0];

    // Questions for selected subject
    const subjectQuestions = questionAnalysis[selectedMateria] || [];
    const sorted = useMemo(() =>
        [...subjectQuestions].sort((a, b) => sortBy === 'rate' ? b.rate - a.rate : a.num - b.num),
        [subjectQuestions, sortBy]
    );
    const displayLetters = useMemo(() => {
        const set = new Set<string>();
        subjectQuestions.forEach(q => {
            resolveQuestionLetters(q.counts, q.correct, q.studentMap).forEach(l => set.add(l));
        });
        const sortedLetters = Array.from(set).sort();
        return sortedLetters.length > 0 ? sortedLetters : ['A', 'B', 'C', 'D'];
    }, [subjectQuestions]);
    const criticalCount = subjectQuestions.filter(q => q.rate > 0.4).length;

    // Group questions by difficulty tier
    const grouped = useMemo(() => {
        const tiers = {
            critical: { label: 'Críticas (>40% fallo)', questions: [] as typeof subjectQuestions, color: '#ef4444', dot: '●' },
            caution: { label: 'Precaución (25-40%)', questions: [] as typeof subjectQuestions, color: '#fbbf24', dot: '●' },
            ok: { label: 'Aceptables (<25%)', questions: [] as typeof subjectQuestions, color: '#34d399', dot: '●' },
        };
        subjectQuestions.forEach(q => {
            if (q.rate > 0.4) tiers.critical.questions.push(q);
            else if (q.rate > 0.25) tiers.caution.questions.push(q);
            else tiers.ok.questions.push(q);
        });
        return Object.values(tiers).filter(t => t.questions.length > 0);
    }, [subjectQuestions]);

    const avgSuccess = subjectQuestions.length > 0
        ? subjectQuestions.reduce((sum, q) => sum + (1 - q.rate), 0) / subjectQuestions.length * 100
        : 0;
    const liveModalQuestion = modalQuestion
        ? subjectQuestions.find(q => q.num === modalQuestion.num) || modalQuestion
        : null;

    // ─── Section Previews (computed for collapsed state) ───
    const emptyPreviews = { stats: '', ranking: '', alertas: '', correlaciones: '', perfil: '', brechaStr: '' };
    const sectionPreviews = useMemo(() => {
        if (!inst) return emptyPreviews;
        const sStats = inst.subjectStats || [];
        const bestSubj = [...sStats].sort((a, b) => b.avg - a.avg)[0];
        const worstSubj = [...sStats].sort((a, b) => a.avg - b.avg)[0];
        const stats = bestSubj && worstSubj ? `Mejor: ${bestSubj.key} ${bestSubj.avg.toFixed(0)} · Peor: ${worstSubj.key} ${worstSubj.avg.toFixed(0)}` : '';
        const puntajes = inst.students.map((e: any) => Number(e.puntaje_global) || 0).filter((p: number) => p > 0);
        const promedioG = puntajes.length > 0 ? puntajes.reduce((a: number, b: number) => a + b, 0) / puntajes.length : 0;
        const ranking = `${inst.students.length} estudiantes · Promedio global: ${Math.round(promedioG)}`;
        const riskStudents = inst.students.filter((e: any) => (Number(e.puntaje_global) || 0) > 0 && (Number(e.puntaje_global) || 0) < 250).length;
        const alertas = `${riskStudents} estudiantes en riesgo de ${inst.students.length} totales`;
        const correlaciones = 'Matriz de correlación Pearson entre las 5 áreas evaluadas';
        const nivelTests = [(g: number) => g > 400, (g: number) => g > 300 && g <= 400, (g: number) => g > 200 && g <= 300, (g: number) => g > 0 && g <= 200];
        const nivelCounts = nivelTests.map(fn => inst.students.filter((e: any) => fn(Number(e.puntaje_global) || 0)).length);
        const perfil = `Superior: ${nivelCounts[0]} · Alto: ${nivelCounts[1]} · Básico: ${nivelCounts[2]} · Bajo: ${nivelCounts[3]}`;
        const brechas = inst.students.map((e: any) => {
            const areas = MATERIAS.map(m => Number(e.puntajes?.[m.key]?.puntaje) || 0).filter((s: number) => s > 0);
            return areas.length >= 2 ? Math.max(...areas) - Math.min(...areas) : 0;
        }).filter((b: number) => b > 0);
        const avgBrecha = brechas.length > 0 ? brechas.reduce((a: number, b: number) => a + b, 0) / brechas.length : 0;
        const brechaStr = `Brecha promedio: ${Math.round(avgBrecha)} pts · ${brechas.filter((b: number) => b > 20).length} brechas altas`;
        return { stats, ranking, alertas, correlaciones, perfil, brechaStr };
    }, [inst, selectedMateria]);

    if (loading) {
        return <LoadingState message="Cargando análisis por materia…" />;
    }

    if (error || !inst) {
        return (
            <ErrorState
                message="No fue posible cargar el análisis"
                detail={error || 'Sin datos disponibles para esta institución/simulacro.'}
            />
        );
    }


    return (
        <div
            data-coordinator-theme
            className={`${layout.analisisRootClass ?? ''} ${layout.pagePaddingClass} max-w-7xl mx-auto space-y-5 min-w-0`.trim()}
        >
            {/* ═══ Header + Sim Selector ═══ */}
            <div
                className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"
                data-coord-tour={TourAnchors.analisisHeader}
            >
                <div>
                    <p className="text-xs font-bold tracking-[3px] uppercase mb-1" style={{ color: materia.color }}>
                        Análisis de Preguntas
                    </p>
                    <h1 className="text-2xl font-black coord-text-head">Análisis por Materia</h1>
                    <p className="text-sm coord-text-muted">{inst.students.length} estudiantes · {inst.name}</p>
                </div>
                {availableSimulations.length > 1 && (
                    <select
                        value={currentSimulation}
                        onChange={e => setSimulation(e.target.value)}
                        className="coord-input-native"
                        aria-label="Cambiar simulacro"
                        style={{ maxWidth: '220px' }}
                    >
                        {availableSimulations.map(s => (
                            <option key={s} value={s} style={{ background: '#0f1623' }}>{s}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* ═══ Subject Tabs ═══ */}

            {/* ═══ Subject Tabs — Enhanced ═══ */}
            <div
                className="grid grid-cols-2 sm:grid-cols-5 gap-2"
                data-coord-tour={TourAnchors.analisisTabs}
            >
                {MATERIAS.map(m => {
                    const stat = inst.subjectStats.find(s => s.key === m.key);
                    const qs = questionAnalysis[m.key] || [];
                    const crit = qs.filter(q => q.rate > 0.4).length;
                    const successRate = qs.length > 0 ? qs.reduce((sum, q) => sum + (1 - q.rate), 0) / qs.length * 100 : 0;
                    const isActive = selectedMateria === m.key;
                    return (
                        <button
                            key={m.key}
                            onClick={() => setSelectedMateria(m.key)}
                            className="text-left p-3 rounded-xl transition-all relative overflow-hidden group"
                            style={{
                                background: isActive ? m.gradient : 'rgba(255,255,255,0.03)',
                                border: isActive ? `1px solid ${m.color}` : '1px solid rgba(255,255,255,0.06)',
                                boxShadow: isActive ? `0 4px 20px ${m.color}20` : 'none',
                            }}
                        >
                            <p className={`text-[11px] font-bold truncate ${isActive ? 'text-white' : 'text-white/50'}`}>{m.label}</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <p className={`text-lg font-black ${isActive ? 'text-white' : 'text-white/30'}`}>{stat?.avg.toFixed(1) || '—'}</p>
                                {qs.length > 0 && (
                                    <span className={`text-[11px] font-bold ${isActive ? 'text-white/60' : 'text-white/20'}`}>{qs.length}p</span>
                                )}
                            </div>
                            {/* Progress bar */}
                            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)' }}>
                                <div className="h-full rounded-full transition-all duration-500" style={{
                                    width: `${successRate}%`,
                                    background: isActive ? 'rgba(255,255,255,0.7)' : (successRate >= 60 ? '#34d399' : successRate >= 40 ? '#fbbf24' : '#ef4444'),
                                }} />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <span className={`text-[11px] font-bold ${isActive ? 'text-white/50' : 'text-white/20'}`}>{successRate.toFixed(0)}% acierto</span>
                                {crit > 0 && (
                                    <span className={`text-[11px] font-bold px-1 py-0.5 rounded ${isActive ? 'bg-white/20 text-white/80' : 'bg-red-500/10 text-red-400/70'}`}>
                                        {crit} crit
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="space-y-5 min-w-0">
            {/* ═══ KPI Row — Enriched ═══ */}
            {(() => {
                const cautionCount = subjectQuestions.filter(q => q.rate > 0.25 && q.rate <= 0.4).length;
                const okCount = subjectQuestions.length - criticalCount - cautionCount;
                const total = subjectQuestions.length || 1;
                const worstQ = sorted[0];
                const donutR = 18, donutC = 2 * Math.PI * donutR;
                const seg1 = (okCount / total) * donutC;
                const seg2 = (cautionCount / total) * donutC;
                const seg3 = (criticalCount / total) * donutC;
                const gaugeColor = avgSuccess >= 60 ? '#34d399' : avgSuccess >= 40 ? '#fbbf24' : '#ef4444';
                const insight = criticalCount === 0
                    ? `${materia.label} no tiene preguntas críticas — excelente rendimiento general.`
                    : criticalCount <= 2
                        ? `${materia.label} tiene ${criticalCount} pregunta${criticalCount > 1 ? 's' : ''} crítica${criticalCount > 1 ? 's' : ''}. ${worstQ ? `${questionLabel(worstQ.num)} (${(worstQ.rate * 100).toFixed(0)}% fallo)` : ''} requiere atención.`
                        : `${materia.label} presenta ${criticalCount} preguntas críticas de ${total} — se recomienda revisión profunda.`;
                return (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-coord-tour={TourAnchors.analisisKpis}>
                            {/* Card 1: Preguntas — Mini Donut — INTERACTIVE */}
                            <button
                                onClick={() => { setSidebarTab('questions'); setSidebarOpen(true); }}
                                className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-left transition-all duration-300 hover:border-indigo-500/30 hover:bg-indigo-500/[0.04] hover:shadow-lg hover:shadow-indigo-500/5 hover:scale-[1.02] active:scale-[0.98] group cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-white/30 uppercase tracking-wider group-hover:text-indigo-300/60 transition-colors">Preguntas</p>
                                        <span className="text-[10px] font-bold text-indigo-400/0 group-hover:text-indigo-400/60 transition-all duration-300 flex items-center gap-0.5">
                                            Ver todo →
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <svg width="48" height="48" viewBox="0 0 48 48">
                                            <circle cx="24" cy="24" r={donutR} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                                            <circle cx="24" cy="24" r={donutR} fill="none" stroke="#34d399" strokeWidth="5" strokeDasharray={`${seg1} ${donutC - seg1}`} strokeDashoffset={donutC * 0.25} strokeLinecap="round" />
                                            <circle cx="24" cy="24" r={donutR} fill="none" stroke="#fbbf24" strokeWidth="5" strokeDasharray={`${seg2} ${donutC - seg2}`} strokeDashoffset={donutC * 0.25 - seg1} strokeLinecap="round" />
                                            <circle cx="24" cy="24" r={donutR} fill="none" stroke="#ef4444" strokeWidth="5" strokeDasharray={`${seg3} ${donutC - seg3}`} strokeDashoffset={donutC * 0.25 - seg1 - seg2} strokeLinecap="round" />
                                            <text x="24" y="26" textAnchor="middle" fill="white" fontSize="13" fontWeight="900">{total}</text>
                                        </svg>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[11px] text-white/40">{okCount} ok</span></div>
                                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /><span className="text-[11px] text-white/40">{cautionCount} precaución</span></div>
                                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-[11px] text-white/40">{criticalCount} críticas</span></div>
                                        </div>
                                    </div>
                                </div>
                            </button>
                            {/* Card 2: Acierto Promedio — Gauge — INTERACTIVE */}
                            <button
                                onClick={() => { setSidebarTab('heatmap'); setSidebarOpen(true); }}
                                className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-left transition-all duration-300 hover:border-emerald-500/30 hover:bg-emerald-500/[0.04] hover:shadow-lg hover:shadow-emerald-500/5 hover:scale-[1.02] active:scale-[0.98] group cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-white/30 uppercase tracking-wider group-hover:text-emerald-300/60 transition-colors">Acierto Promedio</p>
                                        <span className="text-[10px] font-bold text-emerald-400/0 group-hover:text-emerald-400/60 transition-all duration-300 flex items-center gap-0.5">
                                            Heatmap →
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <svg width="56" height="36" viewBox="0 0 56 36">
                                            <path d="M 6 32 A 22 22 0 0 1 50 32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round" />
                                            <path d="M 6 32 A 22 22 0 0 1 50 32" fill="none" stroke={gaugeColor} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(avgSuccess / 100) * 69} 69`} />
                                            <text x="28" y="32" textAnchor="middle" fill={gaugeColor} fontSize="12" fontWeight="900">{avgSuccess.toFixed(0)}%</text>
                                        </svg>
                                        <div>
                                            <p className="text-[11px] text-white/25 pb-1">{avgSuccess >= 60 ? 'Bueno' : avgSuccess >= 40 ? 'Regular' : 'Bajo'}</p>
                                            <p className="text-[10px] text-white/15">{inst.students.length} est.</p>
                                        </div>
                                    </div>
                                </div>
                            </button>
                            {/* Card 3: Críticas — Proportional Bar — INTERACTIVE */}
                            <button
                                onClick={() => { setSortBy('rate'); setQuestionView('list'); setSidebarTab('questions'); setSidebarOpen(true); }}
                                className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-left transition-all duration-300 hover:border-red-500/30 hover:bg-red-500/[0.04] hover:shadow-lg hover:shadow-red-500/5 hover:scale-[1.02] active:scale-[0.98] group cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-white/30 uppercase tracking-wider group-hover:text-red-300/60 transition-colors">Críticas (&gt;40% fallo)</p>
                                        <span className="text-[10px] font-bold text-red-400/0 group-hover:text-red-400/60 transition-all duration-300 flex items-center gap-0.5">
                                            Detalle →
                                        </span>
                                    </div>
                                    <p className="text-2xl font-black text-red-400">{criticalCount}<span className="text-sm text-white/20 font-bold ml-1">/ {total}</span></p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(criticalCount / total) * 100}%`, background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
                                        </div>
                                        <span className="text-[11px] text-red-400/60 font-bold w-8 text-right">{((criticalCount / total) * 100).toFixed(0)}%</span>
                                    </div>
                                    {cautionCount > 0 && <p className="text-[11px] text-yellow-400/50 mt-1">+ {cautionCount} en precaución</p>}
                                </div>
                            </button>
                            {/* Card 4: Peor Pregunta — Mini Distribution — INTERACTIVE */}
                            <button
                                onClick={() => { if (worstQ) setModalQuestion(worstQ); }}
                                className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-left transition-all duration-300 hover:border-orange-500/30 hover:bg-orange-500/[0.04] hover:shadow-lg hover:shadow-orange-500/5 hover:scale-[1.02] active:scale-[0.98] group cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-white/30 uppercase tracking-wider group-hover:text-orange-300/60 transition-colors">Peor Pregunta</p>
                                        <span className="text-[10px] font-bold text-orange-400/0 group-hover:text-orange-400/60 transition-all duration-300 flex items-center gap-0.5">
                                            Analizar →
                                        </span>
                                    </div>
                                    {worstQ ? (
                                        <div>
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-lg font-black text-red-400">{questionLabel(worstQ.num)}</span>
                                                <span className="text-xs text-white/25">{(worstQ.rate * 100).toFixed(0)}% fallo</span>
                                            </div>
                                            <div className="flex gap-1 h-5">
                                                {['A', 'B', 'C', 'D'].map(l => {
                                                    const pct = worstQ.total > 0 ? (worstQ.counts[l] || 0) / worstQ.total * 100 : 0;
                                                    const isCorrect = l === worstQ.correct;
                                                    return (
                                                        <div key={l} className="flex-1 flex flex-col items-center gap-0.5">
                                                            <div className="w-full rounded-sm overflow-hidden" style={{ height: '12px', background: 'rgba(255,255,255,0.04)' }}>
                                                                <div className="w-full rounded-sm" style={{ height: `${Math.max(pct, 5)}%`, marginTop: `${Math.max(100 - pct, 0)}%`, background: isCorrect ? '#34d399' : 'rgba(239,68,68,0.5)' }} />
                                                            </div>
                                                            <span className={`text-[11px] font-bold ${isCorrect ? 'text-green-400' : 'text-white/20'}`}>{l}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : <p className="text-2xl font-black text-white/20">—</p>}
                                </div>
                            </button>
                        </div>
                        {/* Auto Insight */}
                        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl" style={{ background: `${materia.color}08`, border: `1px solid ${materia.color}15` }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={materia.color} strokeWidth="1.5" className="flex-shrink-0 mt-0.5">
                                <circle cx="8" cy="8" r="6" /><path d="M8 5v3" strokeLinecap="round" /><circle cx="8" cy="11" r="0.5" fill={materia.color} />
                            </svg>
                            <p className="text-[11px] text-white/50 leading-relaxed">{insight}</p>
                        </div>
                    </>
                );
            })()}


            {/* ═══ Sidebar Drawer ═══ */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                </div>
            )}
            <div
                data-coord-tour={TourAnchors.analisisDrawer}
                className={`fixed inset-0 z-50 flex flex-col transition-all duration-300 ease-in-out ${layout.drawerInsetClass}`}
                style={{

                    opacity: sidebarOpen ? 1 : 0,
                    background: 'linear-gradient(135deg, rgba(22,22,38,0.98), rgba(16,16,28,0.99))',

                    pointerEvents: sidebarOpen ? 'auto' : 'none',
                }}
            >
                {/* Sidebar Header */}
                <div className="flex-shrink-0 p-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full" style={{ background: materia.color }} />
                            <span className="text-xs font-bold text-white">{materia.label}</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                        </button>
                    </div>
                    {/* Tab Switcher */}
                    <div className="flex items-center bg-white/[0.04] rounded-xl p-1 border border-white/5">
                        <button
                            onClick={() => setSidebarTab('questions')}
                            className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-lg transition-all"
                            style={{
                                background: sidebarTab === 'questions' ? `${materia.color}18` : 'transparent',
                                color: sidebarTab === 'questions' ? materia.color : 'rgba(255,255,255,0.3)',
                            }}
                        >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2" /><line x1="5" y1="5" x2="11" y2="5" /><line x1="5" y1="8" x2="11" y2="8" /><line x1="5" y1="11" x2="9" y2="11" /></svg>
                            Preguntas
                        </button>
                        <button
                            onClick={() => setSidebarTab('heatmap')}
                            className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-lg transition-all"
                            style={{
                                background: sidebarTab === 'heatmap' ? `${materia.color}18` : 'transparent',
                                color: sidebarTab === 'heatmap' ? materia.color : 'rgba(255,255,255,0.3)',
                            }}
                        >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
                                <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
                            </svg>
                            Heatmap
                        </button>
                    </div>
                    {/* Materia Selector */}
                    <div className="flex items-center gap-1 mt-2">
                        {MATERIAS.map(m => (
                            <button
                                key={m.key}
                                onClick={() => setSelectedMateria(m.key)}
                                className="flex-1 px-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center"
                                style={{
                                    background: selectedMateria === m.key ? m.gradient : 'rgba(255,255,255,0.03)',
                                    color: selectedMateria === m.key ? 'white' : 'rgba(255,255,255,0.3)',
                                    border: selectedMateria === m.key ? `1px solid ${m.color}50` : '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                {m.label.length > 10 ? m.label.split(' ')[0] : m.label}
                            </button>
                        ))}
                    </div>
                    {/* KPI Summary Strip */}
                    <div className="flex items-center gap-3 mt-3 px-1">
                        <div className="flex items-center gap-1.5"><span className="text-[11px] text-white/20 uppercase font-bold">Preguntas</span><span className="text-xs text-white/50 font-black">{subjectQuestions.length}</span></div>
                        <span className="text-white/10">|</span>
                        <div className="flex items-center gap-1.5"><span className="text-[11px] text-white/20 uppercase font-bold">Acierto</span><span className="text-xs font-black" style={{ color: avgSuccess >= 60 ? '#34d399' : avgSuccess >= 40 ? '#fbbf24' : '#ef4444' }}>{avgSuccess.toFixed(0)}%</span></div>
                        <span className="text-white/10">|</span>
                        <div className="flex items-center gap-1.5"><span className="text-[11px] text-white/20 uppercase font-bold">Estudiantes</span><span className="text-xs text-white/50 font-black">{inst.students.length}</span></div>
                    </div>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* ── Questions Tab ── */}
                    {sidebarTab === 'questions' && (
                        <div>
                            {/* Sub-toolbar */}
                            <div className="sticky top-0 z-10 px-4 py-2.5 flex items-center justify-between" style={{ background: 'rgba(22,22,38,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <div className="flex items-center gap-1">
                                    {MATERIAS.map(m => (
                                        <button
                                            key={m.key}
                                            onClick={() => setSelectedMateria(m.key)}
                                            className="px-2 py-1 rounded-md text-[11px] font-bold transition-all"
                                            style={{
                                                background: selectedMateria === m.key ? `${m.color}20` : 'transparent',
                                                color: selectedMateria === m.key ? m.color : 'rgba(255,255,255,0.25)',
                                                border: selectedMateria === m.key ? `1px solid ${m.color}30` : '1px solid transparent',
                                            }}
                                        >
                                            {m.label.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 border border-white/5">
                                    {(['list', 'group'] as const).map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setQuestionView(v)}
                                            className="text-xs font-bold px-2.5 py-1.5 rounded-md transition-all"
                                            style={{
                                                background: questionView === v ? 'rgba(139,92,246,0.2)' : 'transparent',
                                                color: questionView === v ? '#c4b5fd' : 'rgba(255,255,255,0.3)',
                                            }}
                                        >
                                            {v === 'list' ? 'Lista' : 'Agrupado'}
                                        </button>
                                    ))}
                                </div>
                                {questionView === 'list' && (
                                    <div className="flex items-center gap-1">
                                        {(['rate', 'num'] as const).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setSortBy(s)}
                                                className="text-xs font-bold px-2 py-1 rounded-md transition-all"
                                                style={{
                                                    background: sortBy === s ? (s === 'rate' ? 'rgba(239,68,68,0.15)' : 'rgba(139,92,246,0.15)') : 'transparent',
                                                    color: sortBy === s ? (s === 'rate' ? '#ef4444' : '#a78bfa') : 'rgba(255,255,255,0.3)',
                                                }}
                                            >
                                                {s === 'rate' ? '↓ Fallo' : '# Orden'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* LIST VIEW */}
                            {questionView === 'list' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0" style={{ background: 'rgba(22,22,38,0.98)' }}>
                                            <tr>
                                                <th className="text-left py-2.5 px-4 text-white/30 font-bold text-xs">#</th>
                                                <th className="text-center py-2.5 px-2 text-white/30 font-bold text-xs">Resp.</th>
                                                <th className="text-center py-2.5 px-2 text-white/30 font-bold text-xs" style={{ minWidth: '90px' }}>% Fallo</th>
                                                {displayLetters.map(l => (
                                                    <th key={l} className="text-center py-2.5 px-2 text-white/30 font-bold text-xs">{l}</th>
                                                ))}
                                                <th className="text-center py-2.5 px-2 text-white/30 font-bold text-xs">NR</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sorted.map(q => {
                                                const failPct = q.rate * 100;
                                                const isCritical = q.rate > 0.4;
                                                const letters = resolveQuestionLetters(q.counts, q.correct, q.studentMap);
                                                const correctKey = q.correct.toUpperCase().trim();
                                                const topDistractor = letters.filter(l => l !== correctKey).reduce((best, l) => (q.counts[l] || 0) > (q.counts[best] || 0) ? l : best, letters.find(l => l !== correctKey) || 'A');
                                                return (
                                                    <tr
                                                        key={q.num}
                                                        className="border-b border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer"
                                                        style={isCritical ? { background: 'rgba(239,68,68,0.03)' } : undefined}
                                                        onClick={() => setModalQuestion(q)}
                                                    >
                                                        <td className="py-2 px-4"><span className="font-black text-sm" style={{ color: materia.color }}>{questionLabel(q.num)}</span></td>
                                                        <td className="py-2 px-2 text-center"><span className="font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">{q.correct}</span></td>
                                                        <td className="py-2 px-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                                    <div className="h-full rounded-full" style={{ width: `${Math.max(failPct, 2)}%`, background: isCritical ? '#ef4444' : failPct > 25 ? '#fbbf24' : '#34d399' }} />
                                                                </div>
                                                                <span className={`text-xs font-black w-8 text-right ${isCritical ? 'text-red-400' : 'text-white/40'}`}>{failPct.toFixed(0)}%</span>
                                                            </div>
                                                        </td>
                                                        {displayLetters.map(l => {
                                                            const hasOption = letters.includes(l);
                                                            return (
                                                            <td key={l} className="py-2 px-2 text-center">
                                                                {hasOption ? (
                                                                    <span className={l === correctKey ? 'text-green-400 font-bold' : l === topDistractor && isCritical ? 'text-orange-400 font-bold' : 'text-white/30'}>{q.counts[l] || 0}</span>
                                                                ) : (
                                                                    <span className="text-white/10">—</span>
                                                                )}
                                                            </td>
                                                            );
                                                        })}
                                                        <td className="py-2 px-2 text-center text-white/20">{q.counts['NR'] || 0}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {sorted.length === 0 && (
                                        <div className="p-8 text-center text-white/20 text-sm">No hay datos de preguntas para esta materia</div>
                                    )}
                                </div>
                            )}

                            {/* GROUPED VIEW */}
                            {questionView === 'group' && (
                                <div className="p-4 pt-2 space-y-4">
                                    {grouped.map(tier => (
                                        <div key={tier.label}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-2 h-2 rounded-full" style={{ background: tier.color }} />
                                                <h4 className="text-xs font-bold" style={{ color: tier.color }}>{tier.label}</h4>
                                                <span className="text-xs text-white/20 font-bold bg-white/[0.04] px-2 py-0.5 rounded-full">{tier.questions.length}</span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {tier.questions.sort((a, b) => b.rate - a.rate).map(q => (
                                                    <QuestionCard key={q.num} q={q} materia={materia} onClick={() => setModalQuestion(q)} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {grouped.length === 0 && (
                                        <div className="p-8 text-center text-white/20 text-sm">No hay datos de preguntas para esta materia</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Heatmap Tab ── */}
                    {sidebarTab === 'heatmap' && (
                        <div>
                            {/* Sub-toolbar */}
                            <div className="sticky top-0 z-10 px-4 py-2.5 flex items-center justify-between" style={{ background: 'rgba(22,22,38,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/25 font-medium">{inst.students.length} estudiantes</span>
                                    <span className="text-white/10">·</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" />
                                        <span className="text-xs text-white/30">Correcta</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-sm bg-red-500/50" />
                                        <span className="text-xs text-white/30">Incorrecta</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {MATERIAS.map(m => (
                                        <button
                                            key={m.key}
                                            onClick={() => setSelectedMateria(m.key)}
                                            className="px-2 py-1 rounded-md text-[11px] font-bold transition-all"
                                            style={{
                                                background: selectedMateria === m.key ? `${m.color}20` : 'transparent',
                                                color: selectedMateria === m.key ? m.color : 'rgba(255,255,255,0.25)',
                                                border: selectedMateria === m.key ? `1px solid ${m.color}30` : '1px solid transparent',
                                            }}
                                        >
                                            {m.label.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 border border-white/5">
                                    {(['grid', 'list'] as const).map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setHeatmapView(v)}
                                            className="text-xs font-bold px-2.5 py-1.5 rounded-md transition-all"
                                            style={{
                                                background: heatmapView === v ? `${materia.color}20` : 'transparent',
                                                color: heatmapView === v ? materia.color : 'rgba(255,255,255,0.3)',
                                            }}
                                        >
                                            {v === 'grid' ? 'Heatmap' : 'Lista'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {heatmapView === 'grid' ? (
                                <HeatmapGrid
                                    students={inst.students}
                                    materia={selectedMateria}
                                    color={materia.color}
                                    questionStats={subjectQuestions}
                                    onSelectStudent={openStudentModal}
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-2 p-4">
                                    {[...inst.students]
                                        .sort((a, b) => {
                                            const ra = normalizeSubjectResp(getSubjectRespuestas(a, selectedMateria));
                                            const rb = normalizeSubjectResp(getSubjectRespuestas(b, selectedMateria));
                                            const pa = getSubjectPuntaje(a, selectedMateria);
                                            const pb = getSubjectPuntaje(b, selectedMateria);
                                            const ca = ra.length > 0 ? ra.filter((r: any) => r.es_correcta).length : pa.correctas;
                                            const cb = rb.length > 0 ? rb.filter((r: any) => r.es_correcta).length : pb.correctas;
                                            return cb - ca;
                                        })
                                        .map((s, i) => (
                                            <StudentResponseCard key={i} student={s} materia={selectedMateria} color={materia.color} onSelectStudent={openStudentModal} />
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* Sidebar Footer */}
                <div className="flex-shrink-0 p-3 flex items-center justify-between gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(16,16,28,0.95)' }}>
                    <div className="flex items-center gap-1.5">
                        {MATERIAS.map(m => (
                            <button
                                key={m.key}
                                onClick={() => setSelectedMateria(m.key)}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black transition-all"
                                title={m.label}
                                style={{
                                    background: selectedMateria === m.key ? `${m.color}25` : 'rgba(255,255,255,0.03)',
                                    color: selectedMateria === m.key ? m.color : 'rgba(255,255,255,0.2)',
                                    border: selectedMateria === m.key ? `1px solid ${m.color}40` : '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                {m.label.charAt(0)}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-xs font-bold text-white/30 hover:text-white/60 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                    >
                        Cerrar
                    </button>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* NEW SECTIONS FROM EXCEL REPORT                           */}
            {/* ═══════════════════════════════════════════════════════════ */}

            {/* ═══ 1. Estadísticas Avanzadas ═══ */}
            <div data-coord-tour={TourAnchors.analisisInsights} className="space-y-3">
            <CollapsibleSection
                title="Estadísticas Avanzadas"
                preview={sectionPreviews.stats}
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400"><circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" /></svg>}
            >
                <div className="p-5 overflow-x-auto">
                    <p className="text-xs text-white/30 mb-3">Análisis estadístico profundo por competencia · {inst.students.length} estudiantes</p>
                    <table className="w-full text-[11px]">
                        <thead>
                            <tr className="text-left">
                                {['Competencia', 'Promedio', 'Mediana', 'Moda', 'Mín', 'Máx', 'Desv. Est.', 'Coef. Var.'].map(h => (
                                    <th key={h} className="py-2 px-3 text-[11px] font-bold text-white/30 uppercase tracking-wider border-b border-white/5">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {MATERIAS.map(m => {
                                const scores = inst.students.map(e => Number(e.puntajes?.[m.key]?.puntaje) || 0).filter(s => s > 0);
                                const mean = calcMean(scores);
                                const stdDev = calcStdDev(scores);
                                const cv = mean > 0 ? stdDev / mean : 0;
                                return (
                                    <tr key={m.key} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                                        <td className="py-2.5 px-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                                                <span className="font-bold text-white/70">{m.label}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-3 font-bold" style={{ color: m.color }}>{mean.toFixed(1)}</td>
                                        <td className="py-2.5 px-3 text-white/50">{calcMedian(scores).toFixed(1)}</td>
                                        <td className="py-2.5 px-3 text-white/50">{calcMode(scores)}</td>
                                        <td className="py-2.5 px-3 text-red-400/60">{scores.length > 0 ? Math.min(...scores) : '—'}</td>
                                        <td className="py-2.5 px-3 text-green-400/60">{scores.length > 0 ? Math.max(...scores) : '—'}</td>
                                        <td className="py-2.5 px-3 text-white/40">{stdDev.toFixed(1)}</td>
                                        <td className="py-2.5 px-3">
                                            <span className={`font-bold ${cv > 0.3 ? 'text-red-400' : cv > 0.15 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                {(cv * 100).toFixed(0)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* ═══ 2. Ranking Estudiantes ═══ */}
            <CollapsibleSection
                preview={sectionPreviews.ranking}
                title={`Ranking Estudiantes (${inst.students.length})`}
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-yellow-400"><path d="M8 2l2 4 4.5.7-3.3 3.2.8 4.6L8 12.3 3.9 14.5l.8-4.6L1.5 6.7 6 6z" /></svg>}
            >
                <div className="p-5 overflow-x-auto">
                    <table className="w-full text-[11px]">
                        <thead>
                            <tr className="text-left">
                                {['#', 'Estudiante', 'Global', ...MATERIAS.map(m => m.label), 'Rendimiento'].map(h => (
                                    <th key={h} className="py-2 px-2 text-[11px] font-bold text-white/30 uppercase tracking-wider border-b border-white/5 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[...inst.students]
                                .sort((a, b) => (b.puntaje_global || 0) - (a.puntaje_global || 0))
                                .slice(0, 50)
                                .map((s, i) => {
                                    const nombre = `${s.informacion_personal?.nombres || ''} ${s.informacion_personal?.apellidos || ''}`.trim();
                                    const g = s.puntaje_global || 0;
                                    return (
                                        <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer" onClick={() => openStudentModal(s)}>
                                            <td className="py-2 px-2 text-white/20 font-mono">{i + 1}</td>
                                            <td className="py-2 px-2 text-white/70 font-bold truncate max-w-[180px]">{nombre || '—'}</td>
                                            <td className="py-2 px-2">
                                                <span className="font-black" style={{ color: g >= 300 ? '#34d399' : g >= 200 ? '#fbbf24' : '#ef4444' }}>{g}</span>
                                            </td>
                                            {MATERIAS.map(m => {
                                                const p = Number(s.puntajes?.[m.key]?.puntaje) || 0;
                                                return <td key={m.key} className="py-2 px-2 text-white/40">{p || '—'}</td>;
                                            })}
                                            <td className="py-2 px-2">
                                                <div className="h-1.5 w-16 rounded-full overflow-hidden bg-white/5">
                                                    <div className="h-full rounded-full" style={{
                                                        width: `${Math.min(g / 5, 100)}%`,
                                                        background: g >= 300 ? '#34d399' : g >= 200 ? '#fbbf24' : '#ef4444',
                                                    }} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                    {inst.students.length > 50 && (
                        <p className="text-center text-xs text-white/20 mt-3">Mostrando los primeros 50 de {inst.students.length} estudiantes</p>
                    )}
                </div>
            </CollapsibleSection>

            {/* ═══ 3. Alertas y Estudiantes en Riesgo ═══ */}
            <CollapsibleSection
                preview={sectionPreviews.alertas}
                title="Alertas y Estudiantes en Riesgo"
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400"><path d="M8 2L1 14h14L8 2z" /><line x1="8" y1="6" x2="8" y2="10" /><circle cx="8" cy="12" r="0.5" fill="currentColor" /></svg>}
            >
                {(() => {
                    const alertas = { critico: [] as any[], alto: [] as any[], moderado: [] as any[], monitoreo: [] as any[] };
                    const puntajesGlobales = inst.students.map(e => Number(e.puntaje_global) || 0).filter(p => p > 0);
                    const promedioGlobal = calcMean(puntajesGlobales);

                    inst.students.forEach(est => {
                        const global = Number(est.puntaje_global) || 0;
                        const nombre = `${est.informacion_personal?.nombres || ''} ${est.informacion_personal?.apellidos || ''}`.trim();
                        let areaDebil = '—', minPuntaje = 100;
                        if (est.puntajes) {
                            Object.entries(est.puntajes).forEach(([area, data]) => {
                                const p = Number(data.puntaje) || 0;
                                if (p < minPuntaje && p > 0) { minPuntaje = p; areaDebil = area; }
                            });
                        }
                        const brecha = promedioGlobal - global;
                        const reg = { nombre, global, areaDebil, minPuntaje, brecha, student: est };
                        if (global > 0 && global < 200) alertas.critico.push({ ...reg, nivel: 'CRÍTICO', rec: 'Intervención inmediata' });
                        else if (global >= 200 && global < 250) alertas.alto.push({ ...reg, nivel: 'ALTO', rec: 'Seguimiento semanal' });
                        else if (minPuntaje < 40 && minPuntaje > 0) alertas.moderado.push({ ...reg, nivel: 'MODERADO', rec: `Refuerzo en ${areaDebil}` });
                        else if (global >= 250 && global < 300) alertas.monitoreo.push({ ...reg, nivel: 'MONITOREO', rec: 'Supervisión regular' });
                    });

                    const tiers = [
                        { key: 'critico', label: 'Crítico', desc: '< 200 pts', items: alertas.critico, color: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
                        { key: 'alto', label: 'Alto', desc: '200-250 pts', items: alertas.alto, color: '#f97316', bg: 'rgba(249,115,22,0.06)' },
                        { key: 'moderado', label: 'Moderado', desc: 'Área < 40', items: alertas.moderado, color: '#eab308', bg: 'rgba(234,179,8,0.06)' },
                        { key: 'monitoreo', label: 'Monitoreo', desc: '250-300 pts', items: alertas.monitoreo, color: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
                    ];
                    return (
                        <div className="p-5 space-y-4">
                            {/* Summary cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {tiers.map(t => (
                                    <div key={t.key} className="rounded-xl p-3 border" style={{ background: t.bg, borderColor: `${t.color}20` }}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                                            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.color }}>{t.label}</p>
                                        </div>
                                        <p className="text-2xl font-black" style={{ color: t.color }}>{t.items.length}</p>
                                        <p className="text-[11px] text-white/25">{t.desc}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Expandable lists */}
                            {tiers.filter(t => t.items.length > 0).map(t => (
                                <details key={t.key} className="group">
                                    <summary className="cursor-pointer flex items-center gap-2 text-xs font-bold py-2" style={{ color: t.color }}>
                                        <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                                        {t.label} — {t.items.length} estudiantes
                                    </summary>
                                    <div className="mt-2 space-y-1 pl-4">
                                        {t.items.map((a: any, i: number) => (
                                            <div key={i}
                                                className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-white/[0.03] cursor-pointer border border-transparent hover:border-white/5"
                                                onClick={() => openStudentModal(a.student)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-xs text-white/15 font-mono w-5">{i + 1}</span>
                                                    <span className="text-xs text-white/60 font-bold truncate">{a.nombre}</span>
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <span className="text-xs text-white/25">{a.areaDebil}</span>
                                                    <span className="text-xs font-black" style={{ color: t.color }}>{a.global}</span>
                                                    <span className="text-[11px] text-white/20">{a.rec}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </div>
                    );
                })()}
            </CollapsibleSection>

            {/* ═══ 4. Correlaciones entre Áreas ═══ */}
            <CollapsibleSection
                preview={sectionPreviews.correlaciones}
                title="Correlaciones entre Áreas"
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400"><path d="M2 14L6 6l4 5 4-11" /><circle cx="6" cy="6" r="1.5" fill="currentColor" /><circle cx="10" cy="11" r="1.5" fill="currentColor" /></svg>}
            >
                {(() => {
                    const areaKeys = MATERIAS.map(m => m.key);
                    const areaScores: Record<string, number[]> = {};
                    areaKeys.forEach(key => {
                        areaScores[key] = inst.students.map(e => Number(e.puntajes?.[key]?.puntaje) || 0);
                    });
                    return (
                        <div className="p-5">
                            <p className="text-xs text-white/30 mb-4">Matriz de correlación de Pearson — Identifica patrones de rendimiento entre áreas</p>
                            <div className="overflow-x-auto">
                                <table className="text-[11px]">
                                    <thead>
                                        <tr>
                                            <th className="py-2 px-3 text-[11px] text-white/20"></th>
                                            {MATERIAS.map(m => (
                                                <th key={m.key} className="py-2 px-3 text-[11px] font-bold text-white/40 text-center whitespace-nowrap">{m.label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {MATERIAS.map((mRow, ri) => (
                                            <tr key={mRow.key}>
                                                <td className="py-2 px-3 text-xs font-bold text-white/40 whitespace-nowrap">{mRow.label}</td>
                                                {MATERIAS.map((mCol, ci) => {
                                                    const corr = ri === ci ? 1 : calcCorrelation(areaScores[mRow.key], areaScores[mCol.key]);
                                                    const abs = Math.abs(corr);
                                                    const hue = corr >= 0 ? '142' : '0'; // green vs red
                                                    return (
                                                        <td key={mCol.key} className="py-2 px-3 text-center font-bold" style={{
                                                            background: ri === ci ? 'rgba(139,92,246,0.1)' : `hsla(${hue}, 70%, 50%, ${abs * 0.3})`,
                                                            color: ri === ci ? '#a78bfa' : abs > 0.5 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)',
                                                            minWidth: '60px',
                                                        }}>
                                                            {corr.toFixed(2)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center gap-4 mt-4 text-[11px] text-white/25">
                                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm" style={{ background: 'hsla(142, 70%, 50%, 0.3)' }} /> Positiva</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm" style={{ background: 'hsla(0, 70%, 50%, 0.3)' }} /> Negativa</div>
                                <span>{'>'} 0.7 = Fuerte · 0.4-0.7 = Moderada · {'<'} 0.4 = Débil</span>
                            </div>
                        </div>
                    );
                })()}
            </CollapsibleSection>

            {/* ═══ 5. Perfil por Nivel de Desempeño ═══ */}
            <CollapsibleSection
                preview={sectionPreviews.perfil}
                title="Perfil por Nivel de Desempeño"
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400"><circle cx="8" cy="5" r="3" /><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" /></svg>}
            >
                {(() => {
                    const niveles = [
                        { label: 'Superior', rango: '> 400', color: '#22c55e', bg: 'rgba(34,197,94,0.06)', test: (g: number) => g > 400 },
                        { label: 'Alto', rango: '301-400', color: '#3b82f6', bg: 'rgba(59,130,246,0.06)', test: (g: number) => g > 300 && g <= 400 },
                        { label: 'Básico', rango: '201-300', color: '#eab308', bg: 'rgba(234,179,8,0.06)', test: (g: number) => g > 200 && g <= 300 },
                        { label: 'Bajo', rango: '≤ 200', color: '#ef4444', bg: 'rgba(239,68,68,0.06)', test: (g: number) => g > 0 && g <= 200 },
                    ];
                    const profiles = niveles.map(n => {
                        const ests = inst.students.filter(e => n.test(Number(e.puntaje_global) || 0));
                        const globals = ests.map(e => Number(e.puntaje_global) || 0);
                        const avg = calcMean(globals);
                        const areaStats = MATERIAS.map(m => ({
                            label: m.label,
                            avg: calcMean(ests.map(e => Number(e.puntajes?.[m.key]?.puntaje) || 0).filter(s => s > 0)),
                        }));
                        const sorted = [...areaStats].sort((a, b) => b.avg - a.avg);
                        return { ...n, count: ests.length, avg, fortaleza: sorted[0], debilidad: sorted[sorted.length - 1], brecha: (sorted[0]?.avg || 0) - (sorted[sorted.length - 1]?.avg || 0) };
                    }).filter(p => p.count > 0);

                    return (
                        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {profiles.map(p => (
                                <div key={p.label} className="rounded-xl p-4 border" style={{ background: p.bg, borderColor: `${p.color}15` }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                                                <h4 className="text-sm font-black" style={{ color: p.color }}>{p.label}</h4>
                                            </div>
                                            <p className="text-[11px] text-white/25 mt-0.5">{p.rango}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black" style={{ color: p.color }}>{p.count}</p>
                                            <p className="text-[11px] text-white/25">estudiantes</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-black/10 rounded-lg p-2">
                                            <p className="text-[11px] text-white/30 uppercase">Promedio</p>
                                            <p className="text-sm font-black text-white/60">{Math.round(p.avg)}</p>
                                        </div>
                                        <div className="bg-black/10 rounded-lg p-2">
                                            <p className="text-[11px] text-green-400/50 uppercase">Fortaleza</p>
                                            <p className="text-xs font-bold text-green-400">{p.fortaleza?.label || '—'}</p>
                                            <p className="text-[11px] text-white/20">{p.fortaleza?.avg?.toFixed(0) || ''}</p>
                                        </div>
                                        <div className="bg-black/10 rounded-lg p-2">
                                            <p className="text-[11px] text-red-400/50 uppercase">Debilidad</p>
                                            <p className="text-xs font-bold text-red-400">{p.debilidad?.label || '—'}</p>
                                            <p className="text-[11px] text-white/20">{p.debilidad?.avg?.toFixed(0) || ''}</p>
                                        </div>
                                    </div>
                                    {p.brecha > 5 && (
                                        <p className="text-[11px] text-white/20 mt-2 text-center">
                                            Brecha interna: <strong className="text-white/40">{p.brecha.toFixed(0)} pts</strong>
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </CollapsibleSection>

            {/* ═══ 6. Análisis de Brechas ═══ */}
            <CollapsibleSection
                preview={sectionPreviews.brechaStr}
                title="Análisis de Brechas por Estudiante"
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400"><path d="M2 8h5M9 8h5" /><path d="M7 5v6M9 5v6" /></svg>}
            >
                {(() => {
                    const brechasRaw = inst.students.map(est => {
                        const areas = MATERIAS.map(m => ({
                            name: m.label,
                            score: Number(est.puntajes?.[m.key]?.puntaje) || 0,
                        })).filter(a => a.score > 0);
                        if (areas.length < 2) return null;
                        const sorted = [...areas].sort((a, b) => b.score - a.score);
                        return {
                            student: est,
                            nombre: `${est.informacion_personal?.nombres || ''} ${est.informacion_personal?.apellidos || ''}`.trim(),
                            global: Number(est.puntaje_global) || 0,
                            fuerte: sorted[0],
                            debil: sorted[sorted.length - 1],
                            brecha: sorted[0].score - sorted[sorted.length - 1].score,
                        };
                    }).filter((x): x is NonNullable<typeof x> => x !== null);
                    const brechasData = brechasRaw.sort((a, b) => b.brecha - a.brecha);

                    const brechaPromedio = calcMean(brechasData.map(b => b.brecha));
                    const brechasAltas = brechasData.filter(b => b.brecha > 20).length;

                    return (
                        <div className="p-5">
                            {/* KPIs */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/5">
                                    <p className="text-[11px] text-white/30 uppercase">Brecha Promedio</p>
                                    <p className="text-xl font-black text-violet-400">{Math.round(brechaPromedio)} pts</p>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/5">
                                    <p className="text-[11px] text-white/30 uppercase">Brecha Máxima</p>
                                    <p className="text-xl font-black text-red-400">{brechasData.length > 0 ? brechasData[0].brecha : 0} pts</p>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/5">
                                    <p className="text-[11px] text-white/30 uppercase">Brecha Alta ({'>'}20)</p>
                                    <p className="text-xl font-black text-orange-400">{brechasAltas}</p>
                                </div>
                            </div>
                            {/* Table */}
                            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                <table className="w-full text-[11px]">
                                    <thead className="sticky top-0">
                                        <tr className="text-left" style={{ background: 'rgba(20,20,35,0.95)' }}>
                                            {['#', 'Estudiante', 'Global', 'Área Fuerte', 'Pts', 'Área Débil', 'Pts', 'Brecha', 'Riesgo'].map((h, i) => (
                                                <th key={i} className="py-2 px-2 text-[11px] font-bold text-white/30 uppercase tracking-wider border-b border-white/5">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {brechasData.slice(0, 50).map((b, i) => {
                                            const risk = b.brecha > 30 ? { label: 'Crítica', color: '#ef4444' } : b.brecha > 20 ? { label: 'Alta', color: '#f97316' } : b.brecha > 10 ? { label: 'Moderada', color: '#eab308' } : { label: 'Baja', color: '#34d399' };
                                            return (
                                                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer" onClick={() => openStudentModal(b.student)}>
                                                    <td className="py-2 px-2 text-white/15 font-mono">{i + 1}</td>
                                                    <td className="py-2 px-2 text-white/60 font-bold truncate max-w-[160px]">{b.nombre}</td>
                                                    <td className="py-2 px-2 text-white/40">{b.global}</td>
                                                    <td className="py-2 px-2 text-green-400 font-bold">{b.fuerte.name}</td>
                                                    <td className="py-2 px-2 text-green-400/60">{b.fuerte.score}</td>
                                                    <td className="py-2 px-2 text-red-400 font-bold">{b.debil.name}</td>
                                                    <td className="py-2 px-2 text-red-400/60">{b.debil.score}</td>
                                                    <td className="py-2 px-2 font-black" style={{ color: risk.color }}>{b.brecha}</td>
                                                    <td className="py-2 px-2">
                                                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${risk.color}15`, color: risk.color }}>
                                                            {risk.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })()}
            </CollapsibleSection>
            </div>
            </div>

            {/* ═══ Modals ═══ */}
            {
                liveModalQuestion && (
                    <QuestionDetailModal
                        q={liveModalQuestion}
                        materia={materia}
                        onClose={() => setModalQuestion(null)}
                    />
                )
            }
            {
                modalStudent && (
                    <CoordinadorAnalisisStudentDetailModal
                        student={modalStudent}
                        currentSimulation={currentSimulation}
                        onClose={closeStudentModal}
                    />
                )
            }
        </div >
    );
}
