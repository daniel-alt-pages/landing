'use client';

import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getPerfilHabilidades,
    getNivelVisualConfig,
    NIVELES_DESEMPENO,
} from '@/lib/performanceLevels';
import type { NivelDesempenoDescriptor } from '@/lib/performanceLevels';
import {
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Target,
    Sparkles,
    ArrowRight,
    Lock,
    TrendingUp,
    BookOpen,
    Award,
    Zap,
    ShieldCheck,
    BarChart3,
    Rocket,
    Star,
    Trophy,
    Gauge,
    Milestone,
    Users,
    TrendingDown,
    Minus,
} from 'lucide-react';

// ─── Props ───────────────────────────────────────────────────────────

export interface BenchmarkingData {
    /** Puntaje promedio del grupo en esta materia (0-100) */
    promedioGrupo: number;
    /** Total de estudiantes evaluados en el grupo */
    totalEvaluados: number;
    /** Distribución de estudiantes por nivel (niveles 1-4) */
    distribucionNiveles?: { nivel: number; etiqueta: string; count: number; porcentaje: number }[];
}

export interface PerformanceLevelReportProps {
    /** Nombre de la materia seleccionada (e.g. "lectura crítica") */
    materia: string;
    /** Puntaje ICFES del estudiante en esa materia (0-100) */
    puntaje: number;
    /** Datos de benchmarking institucional (opcional) */
    benchmarking?: BenchmarkingData;
}

const LEVEL_VISUALS = {
    emerald: { stroke: '#10b981', glow: 'rgba(16,185,129,0.3)', text: 'text-emerald-400', ring: 'ring-emerald-500/20', progress: 'from-emerald-500 to-emerald-400' },
    blue: { stroke: '#3b82f6', glow: 'rgba(59,130,246,0.3)', text: 'text-blue-400', ring: 'ring-blue-500/20', progress: 'from-blue-500 to-blue-400' },
    amber: { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.3)', text: 'text-amber-400', ring: 'ring-amber-500/20', progress: 'from-amber-500 to-amber-400' },
    rose: { stroke: '#f43f5e', glow: 'rgba(244,63,94,0.3)', text: 'text-rose-400', ring: 'ring-rose-500/20', progress: 'from-rose-500 to-rose-400' },
} as const;

function getColorVisual(color: string) {
    return LEVEL_VISUALS[color as keyof typeof LEVEL_VISUALS] ?? LEVEL_VISUALS.blue;
}

function getNivelIcon(nivel: number): ComponentType<{ className?: string }> {
    switch (nivel) {
        case 4:
            return Trophy;
        case 3:
            return Star;
        case 2:
            return BookOpen;
        default:
            return Rocket;
    }
}

// ─── Institutional Benchmark Module ─────────────────────────────────

function InstitutionalBenchmark({ puntaje, benchmarking, colorVisual, materiaConfig }: {
    puntaje: number;
    benchmarking: BenchmarkingData;
    colorVisual: typeof LEVEL_VISUALS[keyof typeof LEVEL_VISUALS];
    materiaConfig: { niveles: NivelDesempenoDescriptor[] };
}) {
    const diff = puntaje - benchmarking.promedioGrupo;
    const diffAbs = Math.abs(diff);
    const estaArriba = diff >= 0;
    const DiffIcon = diff > 2 ? TrendingUp : diff < -2 ? TrendingDown : Minus;
    const diffColor = diff > 2 ? 'text-emerald-400' : diff < -2 ? 'text-rose-400' : 'text-white/50';
    const diffBg = diff > 2 ? 'bg-emerald-500/10 border-emerald-500/20' : diff < -2 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/[0.04] border-white/[0.08]';

    // Calcular percentil aproximado (qué % del grupo está por debajo)
    const distribucion = benchmarking.distribucionNiveles;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5"
        >
            {/* Ambient glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/[0.06] rounded-full blur-[40px] pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <Users className="w-4.5 h-4.5 text-violet-300" />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-white/90 tracking-tight">Posición Institucional</h4>
                        <p className="text-[11px] text-white/35 font-medium">
                            Comparativa con {benchmarking.totalEvaluados} compañeros
                        </p>
                    </div>
                </div>

                {/* Main comparison */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {/* Tu puntaje */}
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-center">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Tu Puntaje</p>
                        <p className={`text-2xl font-black ${colorVisual.text}`}>{puntaje}</p>
                        <p className="text-[10px] text-white/30">/100 pts</p>
                    </div>

                    {/* Diferencia */}
                    <div className={`rounded-xl border p-3 text-center ${diffBg}`}>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                            {estaArriba ? 'Por encima' : 'Por debajo'}
                        </p>
                        <div className={`flex items-center justify-center gap-1 ${diffColor}`}>
                            <DiffIcon className="w-4 h-4" />
                            <span className="text-xl font-black">{diffAbs === 0 ? '=' : `${diffAbs}`}</span>
                        </div>
                        <p className="text-[10px] text-white/30">pts vs grupo</p>
                    </div>

                    {/* Promedio grupo */}
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-center">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Promedio</p>
                        <p className="text-2xl font-black text-white/70">{benchmarking.promedioGrupo}</p>
                        <p className="text-[10px] text-white/30">Institución</p>
                    </div>
                </div>

                {/* Barra de posición relativa */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Tu posición relativa</span>
                        <span className={`text-[11px] font-black ${colorVisual.text}`}>
                            {estaArriba ? `↑ ${diffAbs} pts sobre el promedio` : diffAbs === 0 ? 'En el promedio' : `↓ ${diffAbs} pts bajo el promedio`}
                        </span>
                    </div>
                    {/* Gauge de posición — muestra puntaje propio vs promedio en la misma barra */}
                    <div className="relative h-3 w-full rounded-full bg-white/[0.06] overflow-visible">
                        {/* Zona del grupo (rango típico ±10 del promedio) */}
                        <div
                            className="absolute top-0 h-full rounded-full bg-white/[0.08]"
                            style={{
                                left: `${Math.max(0, (benchmarking.promedioGrupo - 10))}%`,
                                width: `${Math.min(20, 100 - Math.max(0, benchmarking.promedioGrupo - 10))}%`,
                            }}
                        />
                        {/* Línea del promedio */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/30 rounded-full z-10"
                            style={{ left: `${benchmarking.promedioGrupo}%` }}
                        />
                        {/* Barra del estudiante */}
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${puntaje}%` }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${colorVisual.progress} opacity-80`}
                        />
                        {/* Dot del estudiante */}
                        <motion.div
                            initial={{ left: '0%' }}
                            animate={{ left: `${Math.min(96, puntaje)}%` }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white/80 shadow-lg z-20 bg-gradient-to-br ${colorVisual.progress}`}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-white/25">0</span>
                        <span className="text-[10px] text-white/25">50</span>
                        <span className="text-[10px] text-white/25">100</span>
                    </div>
                </div>

                {/* Distribución por niveles */}
                {distribucion && distribucion.length > 0 && (
                    <div>
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Distribución del grupo por nivel</p>
                        <div className="space-y-1.5">
                            {distribucion.map((item) => {
                                const nivelVis = getNivelVisualConfig(item.nivel);
                                const colorV = getColorVisual(nivelVis.color);
                                const esNivelEstudiante = materiaConfig.niveles.find(
                                    n => n.nivel === item.nivel &&
                                    puntaje >= n.puntajeMin && puntaje <= n.puntajeMax
                                );
                                return (
                                    <div key={item.nivel} className={`rounded-xl p-2.5 transition-colors ${
                                        esNivelEstudiante ? 'bg-white/[0.05] border border-white/[0.12]' : 'bg-white/[0.02]'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${colorV.text}`}>
                                                {item.etiqueta}
                                            </span>
                                            {esNivelEstudiante && (
                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 uppercase tracking-wider">Tú</span>
                                            )}
                                            <span className="ml-auto text-[10px] text-white/40 font-semibold">
                                                {item.count} est. · {item.porcentaje}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.porcentaje}%` }}
                                                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.6 + item.nivel * 0.08 }}
                                                className={`h-full rounded-full bg-gradient-to-r ${colorV.progress}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Circular Gauge ──────────────────────────────────────────────────

function CircularGauge({ value, color, label }: { value: number; color: string; label: string }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    const c = getColorVisual(color);

    return (
        <div className="relative flex flex-col items-center">
            <svg width="160" height="160" viewBox="0 0 160 160" className="drop-shadow-lg">
                {/* Track */}
                <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                {/* Progress */}
                <motion.circle
                    cx="80" cy="80" r={radius} fill="none"
                    stroke={c.stroke}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                    transform="rotate(-90 80 80)"
                    style={{ filter: `drop-shadow(0 0 10px ${c.glow})` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                    className={`text-4xl font-black tracking-tight ${c.text}`}
                >
                    {value}
                </motion.span>
                <span className="text-[11px] font-bold text-white/45 uppercase tracking-[0.15em]">
                    {label}
                </span>
            </div>
        </div>
    );
}

// ─── Stat Metric Card ────────────────────────────────────────────────

const KPI_TILE_BASE =
    'relative overflow-hidden rounded-2xl border p-4 flex flex-col items-center justify-center text-center min-h-[7.25rem]';

function KpiGridTile({
    label,
    icon: Icon,
    accent = 'neutral',
    children,
    footer,
}: {
    label: string;
    icon: ComponentType<{ className?: string }>;
    accent?: 'emerald' | 'cyan' | 'slate' | 'neutral';
    children: ReactNode;
    footer?: ReactNode;
}) {
    const shell = {
        emerald: 'bg-emerald-500/[0.08] border-emerald-500/20',
        cyan: 'bg-cyan-500/[0.08] border-cyan-500/20',
        slate: 'bg-white/[0.03] border-white/[0.08]',
        neutral: 'bg-white/[0.03] border-white/10',
    };
    const iconTone = {
        emerald: 'bg-emerald-500/15 text-emerald-400',
        cyan: 'bg-cyan-500/15 text-cyan-400',
        slate: 'bg-white/[0.06] text-white/40',
        neutral: 'bg-white/[0.04] text-white/60',
    };

    return (
        <div className={`${KPI_TILE_BASE} ${shell[accent]}`}>
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${iconTone[accent]}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="w-full min-w-0">{children}</div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45 leading-tight">
                {label}
            </p>
            {footer ? <div className="mt-2 w-full">{footer}</div> : null}
        </div>
    );
}

function MetricCard({ count, label, icon, accent }: {
    count: number; label: string;
    icon: ComponentType<{ className?: string }>;
    accent: 'emerald' | 'cyan' | 'slate';
}) {
    const valueTone = {
        emerald: 'text-emerald-400',
        cyan: 'text-cyan-400',
        slate: 'text-white/80',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
            <KpiGridTile label={label} icon={icon} accent={accent}>
                <div className={`text-2xl font-black leading-none tabular-nums ${valueTone[accent]}`}>
                    {count}
                </div>
            </KpiGridTile>
        </motion.div>
    );
}

// ─── Nivel Step ──────────────────────────────────────────────────────

function NivelStep({
    descriptor, isActive, isCompleted, isLocked, expanded, onToggle,
}: {
    descriptor: NivelDesempenoDescriptor;
    isActive: boolean; isCompleted: boolean; isLocked: boolean;
    expanded: boolean; onToggle: () => void;
}) {
    const vis = getNivelVisualConfig(descriptor.nivel);
    const colorVisual = getColorVisual(vis.color);

    return (
        <div className="relative">
            {/* Connector line */}
            {descriptor.nivel < 4 && (
                <div className={`absolute left-[21px] top-[48px] bottom-0 w-[2px] transition-colors duration-500
                    ${isCompleted ? 'bg-gradient-to-b from-emerald-500/40 to-emerald-500/10' : 'bg-white/[0.05]'}`}
                />
            )}

            <button
                onClick={onToggle}
                aria-expanded={expanded}
                aria-label={`${descriptor.etiqueta}. ${expanded ? 'Ocultar' : 'Ver'} habilidades`}
                className={`relative z-10 w-full text-left transition-all duration-300 rounded-2xl p-4 group
                    ${isActive
                        ? `glass-premium border ${vis.borderColor} shadow-lg`
                        : isCompleted
                            ? 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.05]'
                            : 'bg-white/[0.01] border border-white/[0.04] opacity-50 hover:opacity-70'
                    }`}
            >
                <div className="flex items-start gap-4">
                    {/* Step circle */}
                    <div className={`shrink-0 w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all
                        ${isActive
                            ? `${vis.badgeClass} border ring-2 ring-offset-1 ring-offset-transparent ${colorVisual.ring}`
                            : isCompleted
                                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                                : 'bg-white/[0.04] border border-white/10 text-white/25'
                        }`}
                    >
                        {isCompleted && !isActive ? (
                            <CheckCircle2 className="w-5 h-5" />
                        ) : isLocked ? (
                            <Lock className="w-4 h-4" />
                        ) : (
                            <span className="text-sm font-black">{descriptor.nivel}</span>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-base font-black tracking-wide ${isActive ? vis.textColor : isCompleted ? 'text-white/80' : 'text-white/40'}`}>
                                {descriptor.etiqueta}
                            </span>
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full
                                ${isActive ? vis.badgeClass + ' border' : 'bg-white/[0.04] text-white/30 border border-white/[0.06]'}`}>
                                {descriptor.puntajeMin}–{descriptor.puntajeMax} pts
                            </span>
                            {isActive && (
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/20 uppercase tracking-[0.1em]"
                                >
                                    Tu nivel
                                </motion.span>
                            )}
                        </div>
                        <p className={`text-sm leading-relaxed line-clamp-2 ${isActive ? 'text-white/65' : isCompleted ? 'text-white/50' : 'text-white/25'}`}>
                            {descriptor.descripcionGeneral}
                        </p>
                    </div>

                    {/* Toggle */}
                    <div className={`shrink-0 p-1.5 rounded-lg transition-colors ${expanded ? 'bg-white/10' : 'bg-white/[0.03]'}`}>
                        {expanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>
                </div>
            </button>

            {/* Expanded skills */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="ml-[58px] mr-2 mt-2 mb-4 space-y-1.5">
                            {descriptor.habilidades.map((hab, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.3 }}
                                    className={`flex items-start gap-3 text-sm p-3.5 rounded-xl transition-colors border
                                        ${isCompleted
                                            ? 'bg-emerald-500/[0.05] border-emerald-500/15 text-white/70'
                                            : isActive
                                                ? 'bg-white/[0.04] border-white/[0.08] text-white/65'
                                                : 'bg-white/[0.02] border-white/[0.04] text-white/30'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400/70" />
                                    ) : isActive ? (
                                        <Target className="w-4 h-4 mt-0.5 shrink-0 text-amber-400/70" />
                                    ) : (
                                        <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/20" />
                                    )}
                                    <span className="leading-relaxed">{hab}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Componente principal ────────────────────────────────────────────

export default function PerformanceLevelReport({ materia, puntaje, benchmarking }: PerformanceLevelReportProps) {
    const [expandedNivel, setExpandedNivel] = useState<number | null>(null);
    const [showAllDominadas, setShowAllDominadas] = useState(false);

    const perfil = useMemo(() => getPerfilHabilidades(materia, puntaje), [materia, puntaje]);
    const materiaConfig = NIVELES_DESEMPENO[materia.toLowerCase()];

    if (!perfil || !materiaConfig) return null;

    const vis = getNivelVisualConfig(perfil.nivelActual.nivel);
    const colorVisual = getColorVisual(vis.color);
    const NivelActualIcon = getNivelIcon(perfil.nivelActual.nivel);
    const handleToggle = (nivel: number) => setExpandedNivel(prev => prev === nivel ? null : nivel);

    const MAX_DOMINADAS_VISIBLE = 4;
    const dominadasVisibles = showAllDominadas
        ? perfil.habilidadesDominadas
        : perfil.habilidadesDominadas.slice(0, MAX_DOMINADAS_VISIBLE);
    const tieneHabilidadesOcultas = perfil.habilidadesDominadas.length > MAX_DOMINADAS_VISIBLE;
    const brechaSiguiente = perfil.nivelSiguiente ? perfil.nivelSiguiente.puntajeMin - puntaje : 0;
    const todoDominado = !perfil.nivelSiguiente && perfil.habilidadesEnDesarrollo.length === 0 && perfil.habilidadesPorDesarrollar.length === 0;

    return (
        <section className="pb-8 space-y-5 px-0">
            {/* ── HEADER: Institutional Hero Card ── */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-3xl glass-premium p-5 sm:p-7"
            >
                {/* Ambient glow effects */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 ${vis.glowColor} rounded-full blur-[80px] opacity-50 pointer-events-none`} />
                <div className={`absolute -bottom-16 -left-16 w-36 h-36 ${vis.glowColor} rounded-full blur-[60px] opacity-25 pointer-events-none`} />
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/[0.02] to-transparent pointer-events-none" />

                <div className="relative z-10">
                    {/* Top bar: label + badge */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${vis.badgeClass} border flex items-center justify-center shadow-lg`}>
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                                    Nivel de Desempeño ICFES
                                </h3>
                                <p className="text-[11px] text-white/45 font-semibold tracking-wider uppercase">
                                    {materiaConfig.nombrePrueba} · Saber 11°
                                </p>
                            </div>
                        </div>
                        {!perfil.nivelSiguiente && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1, type: 'spring', stiffness: 200 }}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/25"
                            >
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">Nivel Máximo</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Main content: Gauge + Level info */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                        {/* Circular gauge */}
                        <CircularGauge
                            value={puntaje}
                            color={vis.color}
                            label="puntos"
                        />

                        {/* Level details */}
                        <div className="flex-1 text-center sm:text-left space-y-4">
                            <div>
                                <div className="flex items-center justify-center sm:justify-start gap-3 mb-1.5">
                                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${vis.badgeClass}`}>
                                        <NivelActualIcon className="h-5 w-5" />
                                    </span>
                                    <span className={`text-2xl sm:text-3xl font-black ${vis.textColor} tracking-wide`}>
                                        {perfil.nivelActual.etiqueta}
                                    </span>
                                </div>
                                <p className="text-sm text-white/50 leading-relaxed max-w-md">
                                    {perfil.nivelActual.descripcionGeneral}
                                </p>
                            </div>

                            {/* Progress to next level */}
                            {perfil.nivelSiguiente && (
                                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-bold text-white/45 uppercase tracking-wider">
                                            Progreso al {perfil.nivelSiguiente.etiqueta}
                                        </span>
                                        <span className={`text-sm font-black ${vis.textColor}`}>{perfil.progreso}%</span>
                                    </div>
                                    <div className="relative h-2.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${perfil.progreso}%` }}
                                            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                                            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${colorVisual.progress}`}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1.5">
                                        <span className="text-[10px] text-white/30">{perfil.nivelActual.puntajeMin} pts</span>
                                        <span className="text-[10px] text-white/30">
                                            Faltan {perfil.nivelSiguiente.puntajeMin - puntaje} pts
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── KPI GRID (competencias + resumen de área) ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
                <MetricCard count={perfil.habilidadesDominadas.length} label="Dominadas" icon={ShieldCheck} accent="emerald" />
                <MetricCard count={perfil.habilidadesEnDesarrollo.length} label="En desarrollo" icon={Zap} accent="cyan" />
                <MetricCard count={perfil.habilidadesPorDesarrollar.length} label="Por alcanzar" icon={Target} accent="slate" />

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                    <KpiGridTile label="Puntaje del área" icon={Gauge} accent="neutral">
                        <p className="text-2xl font-black text-white tabular-nums leading-none">
                            {puntaje}
                            <span className="text-sm font-bold text-white/45 ml-0.5">/100</span>
                        </p>
                    </KpiGridTile>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                    <KpiGridTile
                        label="Progreso global"
                        icon={TrendingUp}
                        accent="neutral"
                        footer={(
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${perfil.progresoGlobal}%` }}
                                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
                                    className={`h-full rounded-full bg-gradient-to-r ${colorVisual.progress}`}
                                />
                            </div>
                        )}
                    >
                        <p className="text-2xl font-black text-white tabular-nums leading-none">{perfil.progresoGlobal}%</p>
                    </KpiGridTile>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                    <KpiGridTile label="Brecha al siguiente nivel" icon={Milestone} accent="neutral">
                        <p className={`text-2xl font-black tabular-nums leading-none ${brechaSiguiente > 0 ? 'text-white' : 'text-emerald-400'}`}>
                            {brechaSiguiente > 0 ? `${brechaSiguiente} pts` : 'Nivel máximo'}
                        </p>
                    </KpiGridTile>
                </motion.div>
            </motion.div>

            {/* ── BENCHMARKING INSTITUCIONAL ── */}
            {benchmarking && (
                <InstitutionalBenchmark
                    puntaje={puntaje}
                    benchmarking={benchmarking}
                    colorVisual={colorVisual}
                    materiaConfig={materiaConfig}
                />
            )}

            {/* ── HABILIDADES DOMINADAS ── */}
            {perfil.habilidadesDominadas.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/[0.06] via-teal-500/[0.03] to-transparent border border-emerald-500/15 p-4 sm:p-5"
                >
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                                <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-base font-black text-emerald-400 tracking-tight">
                                    Competencias Dominadas
                                </h4>
                                <p className="text-[11px] text-emerald-400/50 font-medium">
                                    Niveles anteriores superados
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {dominadasVisibles.map((hab, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.04 }}
                                    className="flex items-start gap-3 text-sm text-white/65 p-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/[0.1]"
                                >
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400/60" />
                                    <span className="leading-relaxed">{hab}</span>
                                </motion.div>
                            ))}
                        </div>

                        {tieneHabilidadesOcultas && (
                            <button
                                onClick={() => setShowAllDominadas(!showAllDominadas)}
                                aria-label={showAllDominadas ? 'Mostrar menos competencias dominadas' : 'Mostrar más competencias dominadas'}
                                className="mt-4 text-xs font-bold text-emerald-400/60 hover:text-emerald-400 transition-colors flex items-center gap-2 group"
                            >
                                {showAllDominadas
                                    ? 'Mostrar menos'
                                    : `+${perfil.habilidadesDominadas.length - MAX_DOMINADAS_VISIBLE} competencias más`
                                }
                                {showAllDominadas
                                    ? <ChevronUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                                    : <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                                }
                            </button>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ── EN DESARROLLO / POR ALCANZAR ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.26 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-3"
            >
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
                    <div className="mb-3 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-cyan-300" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-cyan-200">En desarrollo</h4>
                            <p className="text-[11px] text-cyan-200/55">Competencias del nivel actual</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {perfil.habilidadesEnDesarrollo.length > 0 ? (
                            <>
                                {perfil.habilidadesEnDesarrollo.slice(0, 3).map((hab, i) => (
                                    <div key={i} className="rounded-xl border border-cyan-300/15 bg-white/[0.03] px-3 py-2.5 text-sm text-white/70 leading-relaxed">
                                        {hab}
                                    </div>
                                ))}
                                {perfil.habilidadesEnDesarrollo.length > 3 && (
                                    <p className="text-xs text-cyan-100/70 font-semibold">
                                        +{perfil.habilidadesEnDesarrollo.length - 3} competencias más en este nivel
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                        <Trophy className="h-4.5 w-4.5 text-emerald-300" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-emerald-200">¡Felicitaciones!</p>
                                        <p className="text-[12px] text-emerald-100/70 leading-relaxed">
                                            {todoDominado
                                                ? 'Ya dominas todas las competencias de esta área.'
                                                : 'Ya superaste las competencias de tu nivel actual.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/15 flex items-center justify-center">
                            <Target className="w-4 h-4 text-white/65" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white/90">Por alcanzar</h4>
                            <p className="text-[11px] text-white/45">Siguientes competencias objetivo</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {perfil.habilidadesPorDesarrollar.length > 0 ? (
                            <>
                                {perfil.habilidadesPorDesarrollar.slice(0, 3).map((hab, i) => (
                                    <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-white/65 leading-relaxed">
                                        {hab}
                                    </div>
                                ))}
                                {perfil.habilidadesPorDesarrollar.length > 3 && (
                                    <p className="text-xs text-white/50 font-semibold">
                                        +{perfil.habilidadesPorDesarrollar.length - 3} competencias futuras
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-300" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-emerald-200">¡Listo!</p>
                                        <p className="text-[12px] text-emerald-100/70 leading-relaxed">
                                            {todoDominado
                                                ? 'No quedan competencias por alcanzar en esta área.'
                                                : 'No hay competencias pendientes por encima de tu nivel actual.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ── RUTA DE NIVELES (STEPPER) ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5"
            >
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/[0.02] rounded-full blur-[40px] pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                            <TrendingUp className="w-4.5 h-4.5 text-white/50" />
                        </div>
                        <div>
                            <h4 className="text-base font-black text-white/90 tracking-tight">
                                Ruta de Desempeño
                            </h4>
                            <p className="text-[11px] text-white/35 font-medium">
                                Toca cada nivel para ver habilidades en detalle
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {materiaConfig.niveles.map((descriptor) => {
                            const isActive = descriptor.nivel === perfil.nivelActual.nivel;
                            const isCompleted = descriptor.nivel < perfil.nivelActual.nivel;
                            const isLocked = descriptor.nivel > perfil.nivelActual.nivel;

                            return (
                                <NivelStep
                                    key={descriptor.nivel}
                                    descriptor={descriptor}
                                    isActive={isActive}
                                    isCompleted={isCompleted}
                                    isLocked={isLocked}
                                    expanded={expandedNivel === descriptor.nivel}
                                    onToggle={() => handleToggle(descriptor.nivel)}
                                />
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* ── NEXT LEVEL CTA ── */}
            {perfil.nivelSiguiente && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className={`relative overflow-hidden rounded-2xl glass-premium border ${getNivelVisualConfig(perfil.nivelSiguiente.nivel).borderColor} p-4 sm:p-5`}
                >
                    <div className={`absolute -top-12 -left-12 w-28 h-28 ${getNivelVisualConfig(perfil.nivelSiguiente.nivel).glowColor} rounded-full blur-[50px] opacity-40 pointer-events-none`} />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className={`w-9 h-9 rounded-xl ${getNivelVisualConfig(perfil.nivelSiguiente.nivel).badgeClass} border flex items-center justify-center`}>
                                <Award className="w-4.5 h-4.5" />
                            </div>
                            <div>
                                <h4 className={`text-base font-black ${getNivelVisualConfig(perfil.nivelSiguiente.nivel).textColor} tracking-tight`}>
                                    Siguiente meta: {perfil.nivelSiguiente.etiqueta}
                                </h4>
                                <p className="text-[11px] text-white/40 font-medium">
                                    {perfil.nivelSiguiente.puntajeMin - puntaje} puntos más para alcanzar este nivel
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-white/50 leading-relaxed mb-4">
                            {perfil.nivelSiguiente.descripcionGeneral}
                        </p>

                        <button
                            onClick={() => handleToggle(perfil.nivelSiguiente!.nivel)}
                            aria-label={`Ver habilidades de ${perfil.nivelSiguiente.etiqueta}`}
                            className="flex items-center gap-2 text-xs font-bold text-white/45 hover:text-white/75 transition-colors group"
                        >
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            <span>
                                Ver las {perfil.nivelSiguiente.habilidades.length} habilidades de este nivel
                            </span>
                        </button>
                    </div>
                </motion.div>
            )}

            {/* ── FOOTER ── */}
            <div className="text-center pt-1">
                <p className="text-[11px] text-white/20 font-medium tracking-wide">
                    Fuente: Niveles de desempeño ICFES · Saber 11° 2022
                </p>
            </div>
        </section>
    );
}
