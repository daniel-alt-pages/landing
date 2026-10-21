'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Estudiante } from '@shared/types';
import { NATIONAL_STATS, AREA_MAP, estimatePercentile } from '@features/benchmark/lib/nationalData';
import { displayDocumentId } from '@features/coordinador/lib/demoPrivacy';
import { getStudentPerformanceLevel, getStudentSubjectScore } from '@shared/lib/studentDisplay';
import { groupBySesion, normalizeSubjectResp } from '@features/coordinador/lib/analisis/subjectAnswers';
import StudentNivelesDesempenoPanel from '@features/coordinador/components/StudentNivelesDesempenoPanel';
import CoordinatorPerformanceAreaNav, {
    materiasFromPuntajes,
    PERFORMANCE_AREA_NAV_EMBED_PAD,
    usePerformanceAreaSelection,
} from '@features/coordinador/components/CoordinatorPerformanceAreaNav';
import type { QuestionStat } from '@features/coordinador/hooks/useCoordinadorData';
import {
    BarChart3,
    Target,
    BookOpen,
    TrendingUp,
    TrendingDown,
    FlaskConical,
    FileText,
    AlertTriangle,
} from 'lucide-react';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { MATERIAS as MATERIAS_BASE } from '@features/coordinador/lib/analisis/materias';
const MATERIAS = MATERIAS_BASE.map((m) => ({
    key: m.key,
    short:
        m.key === 'lectura crítica' ? 'Lect'
        : m.key === 'matemáticas' ? 'Mat'
        : m.key === 'sociales y ciudadanas' ? 'Soc'
        : m.key === 'ciencias naturales' ? 'Cien'
        : 'Ing',
    color: m.color,
}));

function getSubjectScore(student: Estudiante, materia: string): number {
    return getStudentSubjectScore(student, materia);
}

function getNivel(global: number): { label: string; color: string } {
    const n = getStudentPerformanceLevel(global);
    return { label: n.label, color: n.color };
}

// ========================================
// Mini Radar Chart for Student Profile
// ========================================
function MiniRadar({ data }: { data: { label: string; value: number; color: string }[] }) {
    const cx = 80, cy = 80, R = 55, n = data.length;
    const step = (2 * Math.PI) / n;
    const pt = (i: number, v: number) => ({
        x: cx + R * (v / 100) * Math.cos(i * step - Math.PI / 2),
        y: cy + R * (v / 100) * Math.sin(i * step - Math.PI / 2),
    });
    const polygon = data.map((_, i) => pt(i, _.value)).map(p => `${p.x},${p.y}`).join(' ');
    return (
        <svg viewBox="0 0 160 160" className="w-full max-w-[200px] mx-auto">
            <defs>
                <linearGradient id="mRadarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.10" />
                </linearGradient>
            </defs>
            {[25, 50, 75, 100].map(pct => (
                <polygon key={pct} points={data.map((_, i) => pt(i, pct)).map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            ))}
            {data.map((_, i) => { const p = pt(i, 100); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.04)" />; })}
            <polygon points={polygon} fill="url(#mRadarFill)" stroke="#818cf8" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.3))' }} />
            {data.map((d, i) => {
                const p = pt(i, d.value);
                return <circle key={`d-${i}`} cx={p.x} cy={p.y} r="3" fill={d.color} stroke="#0a0e1a" strokeWidth="1.5" />;
            })}
            {data.map((d, i) => {
                const p = pt(i, 120);
                return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontWeight="700">{d.label} <tspan fill={d.color}>{d.value}</tspan></text>;
            })}
        </svg>
    );
}

// ========================================
// Evolution Chart — Multi-Simulacro Line Chart
// ========================================
function EvolutionChart({ data }: { data: { simId: string; label: string; score: number }[] }) {
    if (data.length < 2) return null;
    const W = 360, H = 168, PAD = { t: 28, r: 20, b: 36, l: 42 };
    const cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
    const scores = data.map(d => d.score);
    const minS = Math.min(...scores) - 15, maxS = Math.max(...scores) + 15;
    const range = maxS - minS || 1;
    const pts = data.map((d, i) => ({ x: PAD.l + (i / (data.length - 1)) * cW, y: PAD.t + cH - ((d.score - minS) / range) * cH, ...d }));
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const delta = data[data.length - 1].score - data[0].score;
    const trendColor = delta > 0 ? '#34d399' : delta < 0 ? '#ef4444' : '#fbbf24';
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block overflow-visible" preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="evoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={trendColor} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                const y = PAD.t + cH * (1 - pct);
                return <g key={pct}><line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.04)" /><text x={PAD.l - 6} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="7" fontWeight="600">{Math.round(minS + range * pct)}</text></g>;
            })}
            <path d={`${pathD} L ${pts[pts.length - 1].x} ${PAD.t + cH} L ${pts[0].x} ${PAD.t + cH} Z`} fill="url(#evoFill)" />
            <path d={pathD} fill="none" stroke={trendColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${trendColor}60)` }} />
            {pts.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="5" fill="#0a0e1a" stroke={trendColor} strokeWidth="2.5" />
                    <text x={p.x} y={p.y - 10} textAnchor="middle" fill={trendColor} fontSize="10" fontWeight="800">{p.score}</text>
                    <text x={p.x} y={PAD.t + cH + 14} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="600">{p.label}</text>
                </g>
            ))}
            <text x={W - PAD.r} y={12} textAnchor="end" fill={trendColor} fontSize="9" fontWeight="800">{delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {delta > 0 ? '+' : ''}{delta} pts</text>
        </svg>
    );
}

// ========================================
// Distribution Curve — Histogram with Student Marker
// ========================================
function DistributionCurve({ scores, studentScore, color }: { scores: number[]; studentScore: number; color: string }) {
    if (scores.length < 5) return null;
    const W = 360, H = 90, PAD = { t: 8, r: 10, b: 18, l: 10 };
    const cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
    const min = Math.min(...scores), max = Math.max(...scores);
    const range = max - min || 1;
    const BINS = 18;
    const binW = range / BINS;
    const bins = Array(BINS).fill(0) as number[];
    scores.forEach(s => { const idx = Math.min(Math.floor((s - min) / binW), BINS - 1); bins[idx]++; });
    const maxBin = Math.max(...bins) || 1;
    const pts = bins.map((c, i) => ({ x: PAD.l + ((i + 0.5) / BINS) * cW, y: PAD.t + cH - (c / maxBin) * cH }));
    let pathD = `M ${PAD.l} ${PAD.t + cH}`;
    pts.forEach((p, i) => { if (i === 0) pathD += ` L ${p.x} ${p.y}`; else { const prev = pts[i - 1]; pathD += ` C ${(prev.x + p.x) / 2} ${prev.y} ${(prev.x + p.x) / 2} ${p.y} ${p.x} ${p.y}`; } });
    pathD += ` L ${PAD.l + cW} ${PAD.t + cH} Z`;
    const sX = PAD.l + ((studentScore - min) / range) * cW;
    const below = scores.filter(s => s < studentScore).length;
    const pct = Math.round((below / scores.length) * 100);
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs><linearGradient id="distG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient></defs>
            <path d={pathD} fill="url(#distG)" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
            <line x1={sX} y1={PAD.t} x2={sX} y2={PAD.t + cH} stroke={color} strokeWidth="2" strokeDasharray="4 2" />
            <circle cx={sX} cy={PAD.t + 4} r="3.5" fill={color} />
            <text x={sX} y={PAD.t + cH + 13} textAnchor="middle" fill={color} fontSize="8" fontWeight="800">P{pct}</text>
            <text x={PAD.l + 2} y={PAD.t + cH + 13} textAnchor="start" fill="rgba(255,255,255,0.12)" fontSize="7">{min}</text>
            <text x={PAD.l + cW - 2} y={PAD.t + cH + 13} textAnchor="end" fill="rgba(255,255,255,0.12)" fontSize="7">{max}</text>
        </svg>
    );
}

const HISTORY_SIM_LIMIT = 6;

// ========================================
// Student Profile Modal V2 — Intelligence Panel
// ========================================
export default function CoordinatorStudentProfileModal({
    student,
    onClose,
    institutionAvg,
    allStudents,
    questionAnalysis,
    currentSimulation,
    availableSimulations,
    maskDocumentIds = false,
    embedDemo = false,
    initialTab = 'perfil',
}: {
    student: Estudiante;
    onClose: () => void;
    institutionAvg: Record<string, number>;
    allStudents: Estudiante[];
    questionAnalysis: Record<string, QuestionStat[]>;
    currentSimulation: string;
    availableSimulations: string[];
    maskDocumentIds?: boolean;
    embedDemo?: boolean;
    initialTab?: 'perfil' | 'niveles' | 'analisis';
}) {
    const [activeTab, setActiveTab] = useState<'perfil' | 'niveles' | 'analisis'>(initialTab);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [difficultyMode, setDifficultyMode] = useState(false);
    const [selectedQ, setSelectedQ] = useState<{ materia: string; num: number } | null>(null);
    const [sesionFilter, setSesionFilter] = useState<'all' | 'S1' | 'S2'>('all');
    const [hydratedStudent, setHydratedStudent] = useState<Estudiante | null>(null);
    const [hydrateLoading, setHydrateLoading] = useState(true);
    const [historyData, setHistoryData] = useState<{ simId: string; global: number; subjects: Record<string, number> }[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [enrichedRd, setEnrichedRd] = useState<Record<string, any> | null>(null);
    const [rdLoading, setRdLoading] = useState(false);

    const displayStudent = hydratedStudent ?? student;
    const info = displayStudent.informacion_personal || ({} as Estudiante['informacion_personal']);

    const nivelesAreas = useMemo(() => materiasFromPuntajes(displayStudent.puntajes), [displayStudent.puntajes]);
    const { activeKey: nivelesMateria, setActiveKey: setNivelesMateria } = usePerformanceAreaSelection(nivelesAreas);

    const global = displayStudent.puntaje_global || 0;
    const nivel = getNivel(global);

    const historySimIds = useMemo(
        () => availableSimulations.slice(-HISTORY_SIM_LIMIT),
        [availableSimulations],
    );

    useEffect(() => {
        setActiveTab(initialTab);
        setExpandedSubject(null);
        setSelectedQ(null);
        setSesionFilter('all');
        setHydratedStudent(null);
        setEnrichedRd(null);
        setHistoryData([]);
        setHistoryLoaded(false);
        setHistoryLoading(false);
    }, [student.informacion_personal?.numero_identificacion, initialTab]);

    useEffect(() => {
        const studentId = info.numero_identificacion;
        if (!studentId) {
            setHydrateLoading(false);
            return;
        }
        let cancelled = false;
        setHydrateLoading(true);
        (async () => {
            try {
                const dataModule = embedDemo
                    ? await import('@/app/landing-profesional/preview-paneles/_data/firestoreMock')
                    : await import('@features/simulacro/lib/firestoreService');
                const { hasRespuestasDetalladas } = dataModule;
                let full: Estudiante = student;
                if ('hydrateCoordinatorStudent' in dataModule && typeof dataModule.hydrateCoordinatorStudent === 'function') {
                    full = await dataModule.hydrateCoordinatorStudent(student, currentSimulation);
                } else {
                    const detailed = await dataModule.getStudentResults(studentId, currentSimulation, true);
                    full = detailed ?? await dataModule.enrichStudentWithDetailedAnswers(student, currentSimulation);
                }
                if (cancelled) return;
                setHydratedStudent(full);
                if (hasRespuestasDetalladas(full) && full.respuestas_detalladas) {
                    setEnrichedRd(full.respuestas_detalladas as Record<string, unknown>);
                }
            } catch (e) {
                console.warn('[StudentProfile] Error hidratando estudiante:', e);
            } finally {
                if (!cancelled) setHydrateLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [info.numero_identificacion, currentSimulation, embedDemo, student]);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const pctGlobal = estimatePercentile('Global', global);

    // Ranking
    const sorted = useMemo(() => [...allStudents].filter(s => (s.puntaje_global || 0) > 0).sort((a, b) => (b.puntaje_global || 0) - (a.puntaje_global || 0)), [allStudents]);
    const rankPos = sorted.findIndex(s => s.informacion_personal?.numero_identificacion === info.numero_identificacion) + 1;

    // Nearby students for ranking context
    const nearbyStudents = useMemo(() => {
        const idx = sorted.findIndex(s => s.informacion_personal?.numero_identificacion === info.numero_identificacion);
        if (idx < 0) return [];
        const start = Math.max(0, idx - 2);
        const end = Math.min(sorted.length, idx + 3);
        return sorted.slice(start, end).map((s, i) => ({
            name: `${s.informacion_personal?.nombres || ''} ${s.informacion_personal?.apellidos || ''}`.trim(),
            score: s.puntaje_global || 0,
            pos: start + i + 1,
            isCurrent: s.informacion_personal?.numero_identificacion === info.numero_identificacion,
        }));
    }, [sorted, info.numero_identificacion]);

    // Subject data
    const subjectData = MATERIAS.map(m => {
        const score = getSubjectScore(displayStudent, m.key);
        const areaKey = AREA_MAP[m.key] || 'Lectura';
        const national = NATIONAL_STATS.areas[areaKey as keyof typeof NATIONAL_STATS.areas]?.mean || 50;
        const pct = estimatePercentile(areaKey as any, score);
        return { ...m, score, national, instAvg: institutionAvg[m.key] || 0, percentile: pct, diffNational: score - national, diffInst: score - (institutionAvg[m.key] || 0) };
    });

    const bestSubject = [...subjectData].sort((a, b) => b.score - a.score)[0];
    const worstSubject = [...subjectData].sort((a, b) => a.score - b.score)[0];
    const aboveNational = subjectData.filter(s => s.diffNational >= 0).length;

    const respuestasRaw = enrichedRd || (displayStudent.respuestas_detalladas as Record<string, unknown>) || {};
    // Build normalized map: { materia: normalizedArray[] }
    const respuestas: Record<string, any[]> = useMemo(() => {
        const result: Record<string, any[]> = {};
        Object.entries(respuestasRaw).forEach(([materia, raw]) => {
            result[materia] = normalizeSubjectResp(raw, materia);
        });
        return result;
    }, [enrichedRd, displayStudent.respuestas_detalladas]); // eslint-disable-line react-hooks/exhaustive-deps

    const allScores = useMemo(() => sorted.map(s => s.puntaje_global || 0), [sorted]);

    // Evolución: solo en tab Perfil, últimos N simulacros
    useEffect(() => {
        if (activeTab !== 'perfil' || historyLoaded) return;
        const studentId = info.numero_identificacion;
        if (!studentId || historySimIds.length < 2) return;

        let cancelled = false;
        setHistoryLoading(true);
        (async () => {
            try {
                const dataModule = embedDemo
                    ? await import('@/app/landing-profesional/preview-paneles/_data/firestoreMock')
                    : await import('@features/simulacro/lib/firestoreService');
                const { getStudentResults } = dataModule;
                const results: typeof historyData = [];
                for (const simId of historySimIds) {
                    try {
                        const data = await getStudentResults(studentId, simId);
                        if (data && (data.puntaje_global || 0) > 0) {
                            const subjects: Record<string, number> = {};
                            MATERIAS.forEach(m => { subjects[m.key] = getSubjectScore(data, m.key); });
                            results.push({ simId, global: data.puntaje_global || 0, subjects });
                        }
                    } catch { /* skip */ }
                }
                if (!cancelled) setHistoryData(results);
            } catch { /* skip */ }
            if (!cancelled) {
                setHistoryLoading(false);
                setHistoryLoaded(true);
            }
        })();
        return () => { cancelled = true; };
    }, [activeTab, historyLoaded, info.numero_identificacion, historySimIds, embedDemo]);

    // Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleClose]);

    // Fallback: detalle extra si hidratación no trajo respuestas_detalladas
    useEffect(() => {
        if (activeTab !== 'analisis') return;
        if (enrichedRd) return;
        const studentId = info.numero_identificacion;
        if (!studentId || hydrateLoading) return;
        setRdLoading(true);
        (async () => {
            try {
                const dataModule = embedDemo
                    ? await import('@/app/landing-profesional/preview-paneles/_data/firestoreMock')
                    : await import('@features/simulacro/lib/firestoreService');
                const { enrichStudentWithDetailedAnswers } = dataModule;
                const enriched = await enrichStudentWithDetailedAnswers(displayStudent, currentSimulation);
                if (enriched.respuestas_detalladas && Object.keys(enriched.respuestas_detalladas).length > 0) {
                    setEnrichedRd(enriched.respuestas_detalladas as Record<string, unknown>);
                }
            } catch (e) {
                console.warn('[StudentProfile] Error cargando respuestas_detalladas:', e);
            } finally {
                setRdLoading(false);
            }
        })();
    }, [activeTab, enrichedRd, info.numero_identificacion, currentSimulation, displayStudent, embedDemo, hydrateLoading]);

    // Lock body scroll while modal is open
    useEffect(() => {
        const orig = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = orig; };
    }, []);

    // Ref for scroll container to reset on tab change (not via key)
    const scrollRef = useRef<HTMLDivElement>(null);
    const handleTabChange = useCallback((tab: 'perfil' | 'niveles' | 'analisis') => {
        setActiveTab(tab);
        setSelectedQ(null);
        // Reset scroll to top on tab change without destroying the DOM
        requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ top: 0 });
        });
    }, []);

    // Question difficulty lookup
    const getQDiff = (materia: string, num: number) => {
        const stats = questionAnalysis[materia];
        if (!stats) return null;
        return stats.find(s => s.num === num) || null;
    };

    const TABS = [
        { id: 'perfil' as const, label: 'Perfil', Icon: BarChart3 },
        { id: 'niveles' as const, label: 'Niveles', Icon: Target },
        { id: 'analisis' as const, label: 'Análisis', Icon: BookOpen },
    ];

    return (
        <div
            className="fixed inset-0 z-[200] flex justify-center items-end sm:items-center p-0 sm:p-6"
            style={{
                fontFamily: "'Inter', sans-serif",
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
            }}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={handleClose} aria-hidden />
            <style jsx>{`
                @keyframes modalInMobile { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes modalInDesktop { from { transform: translateY(8px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes ringReveal { from { stroke-dasharray: 0 251.3; } }
                .tab-content-enter { animation: fadeIn 0.2s ease-out; }
                .modal-panel { animation: modalInMobile 0.25s ease-out; }
                @media (min-width: 640px) {
                    .modal-panel { animation: modalInDesktop 0.22s ease-out; }
                }
            `}</style>

            <div
                role="dialog"
                aria-modal="true"
                data-coord-tour={TourAnchors.studentModalRoot}
                className="modal-panel relative z-10 flex w-full sm:max-w-2xl shrink-0 flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)))] sm:max-h-[calc(100dvh-3rem)]"
                style={{ background: 'linear-gradient(180deg, rgba(15,15,28,0.99) 0%, rgba(8,9,14,0.99) 100%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 -8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)' }}>

                {/* ─── Compact Header ─── */}
                <div className="relative shrink-0" data-coord-tour={TourAnchors.studentModalHeader}>
                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${nivel.color}, #818cf8, ${bestSubject?.color || '#818cf8'})` }} />
                    <div className="px-4 py-3 flex items-center gap-3">
                        {/* Avatar + score */}
                        <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black"
                                style={{ background: `linear-gradient(135deg, ${nivel.color}25, ${nivel.color}08)`, border: `1.5px solid ${nivel.color}50`, color: nivel.color }}>
                                {(info.nombres || 'X')[0]}{(info.apellidos || 'X')[0]}
                            </div>
                            <div className="absolute -bottom-1 -right-1 px-1 py-px rounded text-[11px] font-black leading-none"
                                style={{ background: nivel.color, color: '#000', boxShadow: `0 1px 4px ${nivel.color}60` }}>
                                {global}
                            </div>
                        </div>
                        {/* Name + badges */}
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-black text-white uppercase tracking-wide truncate leading-tight">
                                {(info.nombres || '').toUpperCase()} {(info.apellidos || '').toUpperCase()}
                            </h2>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[11px] font-bold px-1.5 py-px rounded" style={{ background: `${nivel.color}18`, color: nivel.color }}>{nivel.label}</span>
                                <span className="text-[11px] font-bold px-1.5 py-px rounded" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>Percentil {pctGlobal}</span>
                                <span className="text-[11px] font-bold px-1.5 py-px rounded" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>Puesto {rankPos} de {sorted.length}</span>
                                <span className="text-[11px] font-mono text-white/20 hidden sm:inline">
                                    {displayDocumentId(info.numero_identificacion, maskDocumentIds)}
                                </span>
                            </div>
                        </div>
                        <button onClick={handleClose} data-coord-tour={TourAnchors.studentModalClose} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 hover:bg-white/10 cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ─── Tabs (compact segmented) ─── */}
                <div className="px-4 pb-2 shrink-0" data-coord-tour={TourAnchors.studentModalTabs}>
                    <div className="flex rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {TABS.map(t => (
                            <button key={t.id} onClick={() => handleTabChange(t.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold transition-all cursor-pointer relative"
                                style={{
                                    background: activeTab === t.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                                    color: activeTab === t.id ? '#c4b5fd' : 'rgba(255,255,255,0.3)',
                                }}>
                                <t.Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                <span>{t.label}</span>
                                {activeTab === t.id && (
                                    <div className="absolute bottom-0 left-[25%] right-[25%] h-[2px] rounded-full" style={{ background: '#818cf8', boxShadow: '0 0 8px rgba(99,102,241,0.5)' }} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─── Scrollable Content ─── */}
                <div
                    ref={scrollRef}
                    className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4"
                    style={{
                        scrollBehavior: 'auto',
                        paddingBottom: activeTab === 'niveles' ? PERFORMANCE_AREA_NAV_EMBED_PAD : 28,
                    }}
                >
                    <div className="tab-content-enter space-y-2" style={{ overflowAnchor: 'none' }}>

                        {/* ═══ TAB: PERFIL ═══ */}
                        {activeTab === 'perfil' && (
                            <>
                                {/* ── Hero: Gauge + KPIs ── */}
                                <div className="rounded-xl p-3 relative overflow-hidden"
                                    style={{ background: `linear-gradient(135deg, ${nivel.color}05, rgba(99,102,241,0.02))`, border: `1px solid ${nivel.color}12` }}>
                                    <div className="flex items-center gap-4">
                                        {/* Circular gauge — compact */}
                                        <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
                                            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                                                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="7" />
                                                <circle cx="50" cy="50" r="40" fill="none" stroke={nivel.color} strokeWidth="7"
                                                    strokeDasharray={`${(global / 500) * 251.3} 251.3`}
                                                    strokeLinecap="round"
                                                    style={{ filter: `drop-shadow(0 0 6px ${nivel.color}40)`, animation: 'ringReveal 0.8s ease-out both' }} />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-xl font-black leading-none" style={{ color: nivel.color }}>{global}</span>
                                                <span className="text-[6px] font-bold text-white/15 uppercase">/500</span>
                                            </div>
                                        </div>
                                        {/* KPI grid */}
                                        <div className="flex-1 grid grid-cols-3 gap-1.5">
                                            <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.1)' }}>
                                                <span className="text-base font-black text-amber-400 leading-none">#{rankPos}</span>
                                                <p className="text-[6px] font-bold text-amber-400/35 uppercase mt-0.5">Puesto</p>
                                            </div>
                                            <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                                                <span className="text-base font-black text-indigo-400 leading-none">{pctGlobal}</span>
                                                <p className="text-[6px] font-bold text-indigo-400/35 uppercase mt-0.5">Percentil</p>
                                            </div>
                                            <div className="rounded-lg p-2 text-center" style={{ background: `${aboveNational >= 3 ? 'rgba(52,211,153,0.05)' : 'rgba(239,68,68,0.05)'}`, border: `1px solid ${aboveNational >= 3 ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
                                                <span className="text-base font-black leading-none" style={{ color: aboveNational >= 3 ? '#34d399' : '#ef4444' }}>{aboveNational}/5</span>
                                                <p className="text-[6px] font-bold text-white/20 uppercase mt-0.5">vs Nac.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Fortaleza / Prioridad (compact) ── */}
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="rounded-lg p-2.5 flex items-center gap-2"
                                        style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.12)' }}>
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${bestSubject.color}10` }}>
                                            <span className="text-sm font-black" style={{ color: bestSubject.color }}>{bestSubject.score}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-emerald-400/50 uppercase inline-flex items-center gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                                                Fortaleza
                                            </p>
                                            <p className="text-[11px] font-black text-emerald-400 capitalize truncate">{bestSubject.key}</p>
                                            <p className="text-[11px] text-white/20">Percentil {bestSubject.percentile}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-lg p-2.5 flex items-center gap-2"
                                        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${worstSubject.color}10` }}>
                                            <span className="text-sm font-black" style={{ color: worstSubject.color }}>{worstSubject.score}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-red-400/50 uppercase inline-flex items-center gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden />
                                                Prioridad
                                            </p>
                                            <p className="text-[11px] font-black text-red-400 capitalize truncate">{worstSubject.key}</p>
                                            <p className="text-[11px] text-white/20">{worstSubject.diffNational >= 0 ? '+' : ''}{worstSubject.diffNational.toFixed(0)} vs nac</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Subject Bars (compact, no redundant labels) ── */}
                                <div className="rounded-xl p-3 space-y-2" data-coord-tour={TourAnchors.studentModalScores} style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-bold text-white/25 uppercase tracking-widest">Rendimiento por Materia</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1"><div className="w-4 h-1 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.4), #818cf8)' }} /><span className="text-[6px] text-white/20">Tú</span></div>
                                            <div className="flex items-center gap-1"><div className="w-4 h-1 rounded-full bg-white/8" /><span className="text-[6px] text-white/20">Nac</span></div>
                                        </div>
                                    </div>
                                    {subjectData.map(s => (
                                        <div key={s.key} className="space-y-0.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                                                    <span className="text-[11px] font-semibold text-white/40 capitalize">{s.key}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-black" style={{ color: s.color }}>{s.score}</span>
                                                    <span className="text-[11px] font-bold px-1 rounded" style={{ background: s.diffNational >= 0 ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)', color: s.diffNational >= 0 ? '#34d399' : '#ef4444' }}>
                                                        {s.diffNational >= 0 ? '↑' : '↓'}{Math.abs(s.diffNational).toFixed(0)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="relative h-2.5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                <div className="absolute top-0 h-full rounded" style={{ width: `${s.national}%`, background: 'rgba(255,255,255,0.05)' }} />
                                                <div className="absolute top-0 h-full rounded" style={{ width: `${s.score}%`, background: `linear-gradient(90deg, ${s.color}50, ${s.color})`, boxShadow: `0 0 8px ${s.color}15` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ── Radar + Distribution ── */}
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest text-center mb-1">Competencias</p>
                                        <MiniRadar data={subjectData.map(s => ({ label: s.short, value: s.score, color: s.color }))} />
                                    </div>
                                    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest text-center mb-1">Distribución</p>
                                        <DistributionCurve scores={allScores} studentScore={global} color={nivel.color} />
                                        <p className="text-[6px] text-center text-white/15 mt-0.5">Supera al {Math.round((allScores.filter(s => s < global).length / allScores.length) * 100)}%</p>
                                    </div>
                                </div>

                                {/* ── Evolution Chart ── */}
                                {!historyLoading && historyData.length >= 2 && (
                                    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[11px] font-bold text-white/25 uppercase tracking-widest">Evolución</p>
                                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1" style={{ background: historyData[historyData.length - 1].global > historyData[0].global ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', color: historyData[historyData.length - 1].global > historyData[0].global ? '#34d399' : '#ef4444' }}>
                                                {historyData[historyData.length - 1].global > historyData[0].global
                                                    ? <TrendingUp className="h-3 w-3" aria-hidden />
                                                    : <TrendingDown className="h-3 w-3" aria-hidden />}
                                                {historyData[historyData.length - 1].global - historyData[0].global > 0 ? '+' : ''}{historyData[historyData.length - 1].global - historyData[0].global}
                                            </span>
                                        </div>
                                        <EvolutionChart data={historyData.map(h => ({ simId: h.simId, label: h.simId.replace('SG11-', 'S'), score: h.global }))} />
                                    </div>
                                )}
                                {!historyLoading && historyData.length < 2 && (
                                    <div className="rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <p className="text-[11px] text-white/15 inline-flex items-center justify-center gap-1">
                                            <TrendingUp className="h-3 w-3 opacity-40" aria-hidden />
                                            Evolución disponible con 2+ simulacros
                                        </p>
                                    </div>
                                )}

                                {/* ── Ranking Context (compact) ── */}
                                {nearbyStudents.length > 0 && (
                                    <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest mb-1.5">Ranking</p>
                                        <div className="space-y-0.5">
                                            {nearbyStudents.map((s, i) => (
                                                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-md"
                                                    style={{ background: s.isCurrent ? 'rgba(99,102,241,0.08)' : 'transparent', border: s.isCurrent ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent' }}>
                                                    <span className="text-[11px] font-mono text-white/15 w-4 text-right">#{s.pos}</span>
                                                    <span className={`text-xs flex-1 truncate ${s.isCurrent ? 'font-black text-white' : 'font-medium text-white/30'}`}>{s.name.toUpperCase()}</span>
                                                    <span className={`text-xs font-black ${s.isCurrent ? 'text-indigo-400' : 'text-white/20'}`}>{s.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ═══ TAB: NIVELES DE DESEMPEÑO ═══ */}
                        {activeTab === 'niveles' && (
                            <StudentNivelesDesempenoPanel
                                puntajes={displayStudent.puntajes}
                                showNav={false}
                                activeMateria={nivelesMateria}
                                onMateriaChange={setNivelesMateria}
                            />
                        )}

                        {/* ═══ TAB: ANÁLISIS ═══ */}
                        {activeTab === 'analisis' && (
                            <div className="space-y-4">
                                {/* ─── Auto Diagnosis Cards ─── */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-xl p-3" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
                                        <p className="text-[11px] font-bold text-emerald-400/50 uppercase tracking-wider inline-flex items-center gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                                            Fortaleza
                                        </p>
                                        <p className="text-xs font-black text-emerald-400 capitalize mt-0.5">{bestSubject.key}</p>
                                        <p className="text-[11px] text-white/30 mt-0.5">Percentil {bestSubject.percentile} · {bestSubject.diffNational >= 0 ? '+' : ''}{bestSubject.diffNational.toFixed(0)} vs nacional</p>
                                    </div>
                                    <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                        <p className="text-[11px] font-bold text-red-400/50 uppercase tracking-wider inline-flex items-center gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden />
                                            Prioridad
                                        </p>
                                        <p className="text-xs font-black text-red-400 capitalize mt-0.5">{worstSubject.key}</p>
                                        <p className="text-[11px] text-white/30 mt-0.5">Percentil {worstSubject.percentile} · {worstSubject.diffNational >= 0 ? '+' : ''}{worstSubject.diffNational.toFixed(0)} vs nacional</p>
                                    </div>
                                </div>

                                {/* ─── Toggle + Header ─── */}
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Todas las Materias</p>
                                    <button onClick={() => { setDifficultyMode(!difficultyMode); setSelectedQ(null); }}
                                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                                        style={{ background: difficultyMode ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)', color: difficultyMode ? '#60a5fa' : 'rgba(255,255,255,0.3)', border: `1px solid ${difficultyMode ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                                        {difficultyMode
                                            ? <><FlaskConical className="h-3 w-3" aria-hidden /> Dificultad Grupal</>
                                            : <><FileText className="h-3 w-3" aria-hidden /> Resultado Individual</>}
                                    </button>
                                </div>

                                {/* ─── Subject Grid (ALL VISIBLE) ─── */}
                                <div className="grid grid-cols-5 gap-2">
                                    {subjectData.map(s => {
                                        const preguntas = respuestas[s.key] || [];
                                        const correctas = preguntas.filter((p: any) => p.es_correcta).length;
                                        const total = preguntas.length;
                                        const pctCorr = total > 0 ? Math.round((correctas / total) * 100) : 0;
                                        const isSelected = expandedSubject === s.key;
                                        return (
                                            <button key={s.key} onClick={() => { setExpandedSubject(isSelected ? null : s.key); setSelectedQ(null); setSesionFilter('all'); }}
                                                className="rounded-xl p-3 text-center transition-all cursor-pointer hover:scale-[1.03]"
                                                style={{
                                                    background: isSelected ? `linear-gradient(135deg, ${s.color}15, ${s.color}08)` : 'rgba(255,255,255,0.02)',
                                                    border: `1px solid ${isSelected ? s.color + '40' : 'rgba(255,255,255,0.06)'}`,
                                                    boxShadow: isSelected ? `0 4px 20px ${s.color}15` : 'none',
                                                }}>
                                                <div className="text-2xl font-black" style={{ color: s.color }}>{s.score}</div>
                                                <p className="text-[11px] font-bold text-white/40 uppercase mt-1 truncate">{s.short}</p>
                                                <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                    <div className="h-full rounded-full" style={{ width: `${pctCorr}%`, background: s.color }} />
                                                </div>
                                                <p className="text-[11px] text-white/25 mt-1">{correctas}/{total}</p>
                                                <span className="text-[11px] font-bold mt-1 inline-block" style={{ color: s.diffNational >= 0 ? '#34d399' : '#ef4444' }}>
                                                    {s.diffNational >= 0 ? '↑' : '↓'}{Math.abs(s.diffNational).toFixed(0)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* ─── Expanded Subject Detail ─── */}
                                {expandedSubject && (() => {
                                    const s = subjectData.find(x => x.key === expandedSubject);
                                    if (!s) return null;
                                    const preguntas = respuestas[s.key] || [];
                                    const correctas = preguntas.filter((p: any) => p.es_correcta).length;
                                    const total = preguntas.length;
                                    const pctCorr = total > 0 ? Math.round((correctas / total) * 100) : 0;
                                    const subjectScores = sorted.map(st => getSubjectScore(st, s.key)).filter(v => v > 0);
                                    const topScore = subjectScores.length > 0 ? Math.max(...subjectScores) : 0;

                                    return (
                                        <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.04), ${s.color}06)`, border: `1px solid ${s.color}25`, animation: 'fadeIn 0.2s ease-out' }}>
                                            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}40, transparent)` }} />
                                            <div className="p-4 space-y-3">
                                                {/* Stats row */}
                                                <div className="flex items-center gap-3">
                                                    <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
                                                        <svg viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                                                            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                                                            <circle cx="28" cy="28" r="24" fill="none" stroke={s.color} strokeWidth="4"
                                                                strokeDasharray={`${(pctCorr / 100) * 150.8} 150.8`} strokeLinecap="round" />
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <span className="text-sm font-black" style={{ color: s.color }}>{pctCorr}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-3 gap-1.5">
                                                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)' }}>
                                                            <span className="text-lg font-black text-emerald-400">{correctas}</span>
                                                            <p className="text-[11px] text-emerald-400/40 font-bold uppercase">Correctas</p>
                                                        </div>
                                                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                                                            <span className="text-lg font-black text-red-400">{total - correctas}</span>
                                                            <p className="text-[11px] text-red-400/40 font-bold uppercase">Incorrectas</p>
                                                        </div>
                                                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                            <span className="text-lg font-black text-white/50">{total}</span>
                                                            <p className="text-[11px] text-white/20 font-bold uppercase">Total</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Peer comparison */}
                                                <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div className="relative h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                        <div className="absolute top-0 h-full rounded-full" style={{ width: `${topScore > 0 ? (s.score / topScore) * 100 : 0}%`, background: `linear-gradient(90deg, ${s.color}50, ${s.color})` }} />
                                                        <div className="absolute top-0 h-full w-px bg-white/40" style={{ left: `${topScore > 0 ? (s.instAvg / topScore) * 100 : 0}%` }} />
                                                    </div>
                                                    <p className="text-[11px] text-white/25 text-center mt-1">Prom: {s.instAvg.toFixed(0)} | <span style={{ color: s.color }}>Tú: {s.score}</span> | Top: {topScore}</p>
                                                </div>
                                                {/* Answer sheet — grouped by session */}
                                                {total > 0 && (() => {
                                                    const allGroups = groupBySesion(preguntas, s.key);
                                                    const showSesionFilter = allGroups.filter(g => g.sesionKey === 'S1' || g.sesionKey === 'S2').length > 1;
                                                    const groups =
                                                        sesionFilter === 'all'
                                                            ? allGroups
                                                            : allGroups.filter(g => g.sesionKey === sesionFilter);

                                                    const renderTile = (p: any, idx: number) => {
                                                        const qNum = p.numero || idx + 1;
                                                        const diff = getQDiff(s.key, qNum);
                                                        const failRate = diff ? diff.rate : 0;
                                                        const isSelQ = selectedQ?.materia === s.key && selectedQ?.num === qNum;
                                                        let bg: string, fg: string, bdr: string;
                                                        if (difficultyMode && diff) {
                                                            if (failRate > 0.7) { bg = 'rgba(239,68,68,0.2)'; fg = '#ef4444'; bdr = 'rgba(239,68,68,0.35)'; }
                                                            else if (failRate > 0.3) { bg = 'rgba(251,191,36,0.15)'; fg = '#fbbf24'; bdr = 'rgba(251,191,36,0.3)'; }
                                                            else { bg = 'rgba(52,211,153,0.12)'; fg = '#34d399'; bdr = 'rgba(52,211,153,0.25)'; }
                                                        } else {
                                                            bg = p.es_correcta ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)';
                                                            fg = p.es_correcta ? '#34d399' : '#ef4444';
                                                            bdr = p.es_correcta ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)';
                                                        }
                                                        const isStrength = p.es_correcta && failRate > 0.5;
                                                        const isAlert = !p.es_correcta && failRate < 0.3 && diff;
                                                        return (
                                                            <div key={idx} className="w-[28px] h-[28px] rounded-lg text-[11px] font-bold flex items-center justify-center cursor-pointer transition-all hover:scale-110 relative"
                                                                style={{ background: isSelQ ? 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(99,102,241,0.2))' : bg, color: isSelQ ? '#c4b5fd' : fg, border: `1px solid ${isSelQ ? 'rgba(99,102,241,0.6)' : bdr}` }}
                                                                onClick={(e) => { e.stopPropagation(); setSelectedQ(isSelQ ? null : { materia: s.key, num: qNum }); }}>
                                                                {qNum}
                                                                {isStrength && <TrendingUp className="absolute -top-1 -right-1 h-2.5 w-2.5 text-emerald-400" aria-hidden />}
                                                                {isAlert && <AlertTriangle className="absolute -top-1 -right-1 h-2.5 w-2.5 text-amber-400" aria-hidden />}
                                                            </div>
                                                        );
                                                    };

                                                    // Helper: render question detail inline
                                                    const renderDetail = (pregunta: any, sesionLabel: string) => {
                                                        const qNum = pregunta.numero;
                                                        const qDiff = getQDiff(s.key, qNum);
                                                        const successRate = qDiff ? Math.round((1 - qDiff.rate) * 100) : null;
                                                        const studentAns = pregunta.respuesta_estudiante || pregunta.respuesta || '?';
                                                        const correctAns = pregunta.respuesta_correcta || pregunta.correcta || '?';
                                                        const isCorrectQ = pregunta.es_correcta;
                                                        return (
                                                            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', animation: 'fadeIn 0.2s ease-out' }}>
                                                                <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #818cf8, transparent)' }} />
                                                                <div className="p-3 space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-black text-indigo-300">Pregunta {qNum}</span>
                                                                            {sesionLabel && (
                                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: 'rgba(196,181,253,0.7)' }}>{sesionLabel}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${isCorrectQ ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                                {isCorrectQ ? '✓ Correcta' : '✗ Incorrecta'}
                                                                            </span>
                                                                            <button onClick={() => setSelectedQ(null)} className="text-white/30 hover:text-white/60 cursor-pointer text-xs">✕</button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-3 gap-1.5">
                                                                        <div className="rounded-lg p-2 text-center" style={{ background: isCorrectQ ? 'rgba(52,211,153,0.06)' : 'rgba(239,68,68,0.06)' }}>
                                                                            <span className="text-xl font-black" style={{ color: isCorrectQ ? '#34d399' : '#ef4444' }}>{studentAns}</span>
                                                                            <p className="text-[6px] text-white/20 uppercase font-bold">Respondió</p>
                                                                        </div>
                                                                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(52,211,153,0.06)' }}>
                                                                            <span className="text-xl font-black text-emerald-400">{correctAns}</span>
                                                                            <p className="text-[6px] text-white/20 uppercase font-bold">Correcta</p>
                                                                        </div>
                                                                        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                                            <span className="text-xl font-black" style={{ color: successRate !== null && successRate >= 50 ? '#34d399' : '#ef4444' }}>{successRate ?? '—'}%</span>
                                                                            <p className="text-[6px] text-white/20 uppercase font-bold">Grupal</p>
                                                                        </div>
                                                                    </div>
                                                                    {qDiff && (
                                                                        <div className="space-y-1">
                                                                            {Object.entries(qDiff.counts).sort((a: any, b: any) => b[1] - a[1]).map(([opt, count]) => {
                                                                                const pctOpt = qDiff.total > 0 ? Math.round(((count as number) / qDiff.total) * 100) : 0;
                                                                                const isCorrectOpt = opt === qDiff.correct;
                                                                                const isStudentOpt = opt === studentAns;
                                                                                return (
                                                                                    <div key={opt} className="flex items-center gap-1.5">
                                                                                        <span className="text-[11px] font-black w-4 text-center" style={{ color: isCorrectOpt ? '#34d399' : isStudentOpt ? '#a5b4fc' : 'rgba(255,255,255,0.25)' }}>{opt}</span>
                                                                                        <div className="flex-1 h-3.5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                                                            <div className="h-full rounded" style={{ width: `${Math.max(pctOpt, 2)}%`, background: isCorrectOpt ? '#34d39960' : isStudentOpt && !isCorrectQ ? '#ef444460' : 'rgba(255,255,255,0.1)' }} />
                                                                                        </div>
                                                                                        <span className="text-[11px] text-white/30 w-8 text-right">{pctOpt}%</span>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    };

                                                    return (
                                                        <div className="space-y-3">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <p className="text-[11px] font-bold text-white/25 uppercase tracking-wider">Hoja de Respuestas</p>
                                                                {showSesionFilter && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {(['all', 'S1', 'S2'] as const).map((key) => (
                                                                            <button
                                                                                key={key}
                                                                                type="button"
                                                                                onClick={(e) => { e.stopPropagation(); setSesionFilter(key); setSelectedQ(null); }}
                                                                                className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                                                                style={{
                                                                                    background: sesionFilter === key ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                                                                                    border: `1px solid ${sesionFilter === key ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                                                                    color: sesionFilter === key ? '#c4b5fd' : 'rgba(255,255,255,0.35)',
                                                                                }}
                                                                            >
                                                                                {key === 'all' ? 'Todas' : key}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {groups.map((g, gi) => {
                                                                const gCorrectas = g.items.filter((p: any) => p.es_correcta).length;
                                                                // Check if the selected question belongs to THIS group
                                                                const selInGroup = selectedQ?.materia === s.key &&
                                                                    g.items.some((p: any) => p.numero === selectedQ.num);
                                                                const selPregunta = selInGroup
                                                                    ? g.items.find((p: any) => p.numero === selectedQ.num)
                                                                    : null;
                                                                return (
                                                                    <div key={gi} className="space-y-2">
                                                                        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${selInGroup ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                                                                            {g.label && (
                                                                                <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                                                    <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">{g.label}</span>
                                                                                    <span className="text-[11px] text-white/20">{gCorrectas}/{g.items.length} correctas</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex flex-wrap gap-[4px] p-2.5">
                                                                                {g.items.map((p: any, idx: number) => renderTile(p, idx))}
                                                                            </div>
                                                                        </div>
                                                                        {/* Detail inline — only for the group that owns the selected question */}
                                                                        {selPregunta && renderDetail(selPregunta, g.label)}
                                                                    </div>
                                                                );
                                                            })}
                                                            {/* Legend */}
                                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                                {!difficultyMode ? (<>
                                                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }} /><span className="text-[11px] text-white/25">Correcta</span></div>
                                                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }} /><span className="text-[11px] text-white/25">Incorrecta</span></div>
                                                                </>) : (<>
                                                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded" style={{ background: 'rgba(52,211,153,0.12)' }} /><span className="text-[11px] text-white/25">Fácil</span></div>
                                                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded" style={{ background: 'rgba(251,191,36,0.15)' }} /><span className="text-[11px] text-white/25">Media</span></div>
                                                                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded" style={{ background: 'rgba(239,68,68,0.2)' }} /><span className="text-[11px] text-white/25">Difícil</span></div>
                                                                </>)}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })()}


                            </div>
                        )}
                    </div>
                </div>

                {activeTab === 'niveles' && (
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
