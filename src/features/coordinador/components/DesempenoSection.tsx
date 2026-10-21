'use client';

import type { InstitutionMetrics, QuestionStat } from '@features/coordinador/hooks/useCoordinadorData';
import type { ExecutiveSummary, AreaInsight, PlanEstudioPaso } from '@features/coordinador/lib/executiveModel';
import { AREA_SEVERITY_UI } from '@features/coordinador/lib/executiveModel';
import CoordCard from '@features/coordinador/components/ui/CoordCard';
import SectionHeader from '@features/coordinador/components/ui/SectionHeader';
import { PrioritiesClearPanel } from '@features/coordinador/components/ui';
import CoordinadorInsightModal from '@features/coordinador/components/CoordinadorInsightModal';
import CurricularICFESDashboard from '@features/coordinador/components/CurricularICFESDashboard';
import { simulationSupportsPensumFullInsights } from '@features/coordinador/lib/simulationEligibility';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { ICFES_AREA_COLORS } from '@features/coordinador/lib/icfesAreaColors';
import {
    Activity,
    AlertTriangle,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    Lightbulb,
    Map,
    Shield,
    Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export interface DesempenoSectionProps {
    inst: InstitutionMetrics;
    pseudoPensum: boolean;
    executiveSummary: ExecutiveSummary | null;
    questionAnalysis?: Record<string, QuestionStat[]>;
    simulationId?: string;
}

/* ─── helpers ────────────────────────────────────────────────────────── */

function pct(n: number, d: number): number {
    if (d <= 0) return 0;
    return Math.round((n / d) * 1000) / 10;
}

/** Convierte delta numérico a texto llano (sin símbolos +/-/>) */
function deltaText(delta: number): string {
    const abs = Math.abs(delta).toFixed(1);
    if (delta > 0) return `${abs} puntos sobre el nacional`;
    if (delta < 0) return `${abs} puntos bajo el nacional`;
    return 'igual al nacional';
}

function deltaShort(delta: number): string {
    const abs = Math.abs(delta).toFixed(1);
    if (delta > 0) return `${abs} puntos sobre`;
    if (delta < 0) return `${abs} puntos bajo`;
    return 'igual al nacional';
}

/* ─── nivel badge ────────────────────────────────────────────────────── */

const NIVEL_CFG: Record<string, { glow: string; from: string; to: string }> = {
    Superior: { glow: '#34d399', from: '#064e3b', to: '#065f46' },
    Alto:     { glow: '#60a5fa', from: '#1e3a5f', to: '#1e40af' },
    Medio:    { glow: '#fbbf24', from: '#451a03', to: '#78350f' },
    Bajo:     { glow: '#fb7185', from: '#4c0519', to: '#881337' },
};

function NivelBadge({ nivel }: { nivel: string }) {
    const cfg = NIVEL_CFG[nivel] ?? NIVEL_CFG['Medio'];
    return (
        <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
            style={{
                background: `linear-gradient(135deg, ${cfg.from}, ${cfg.to})`,
                color: cfg.glow,
                border: `1px solid ${cfg.glow}55`,
                boxShadow: `0 0 14px ${cfg.glow}44`,
                letterSpacing: '0.12em',
            }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: cfg.glow }}
            />
            {nivel}
        </span>
    );
}

/* ─── severity chip ──────────────────────────────────────────────────── */

function SeverityChip({ severity }: { severity: string }) {
    const ui = AREA_SEVERITY_UI[severity as keyof typeof AREA_SEVERITY_UI];
    if (!ui) return null;
    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
            style={{
                background: `${ui.color}18`,
                color: ui.color,
                border: `1px solid ${ui.color}40`,
                boxShadow: `0 0 8px ${ui.color}22`,
            }}
        >
            {ui.label}
        </span>
    );
}

/* ─── futuristic progress bar ────────────────────────────────────────── */

function GlowBar({
    pctVal,
    color,
    height = 8,
}: {
    pctVal: number;
    color: string;
    height?: number;
}) {
    const clamped = Math.min(100, Math.max(0, pctVal));
    return (
        <div
            className="rounded-full overflow-hidden"
            style={{
                height,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <div
                className="h-full rounded-full"
                style={{
                    width: `${clamped}%`,
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                    boxShadow: `0 0 10px ${color}66, 0 0 20px ${color}22`,
                    transition: 'width 0.6s ease',
                }}
            />
        </div>
    );
}

/* ─── kpi futuristic tile ────────────────────────────────────────────── */

function FuturisticKpi({
    label,
    value,
    sub,
    color = 'var(--coord-accent)',
    icon,
}: {
    label: string;
    value: string | number;
    sub?: string;
    color?: string;
    icon?: React.ReactNode;
}) {
    return (
        <div
            className="rounded-xl p-3 space-y-1"
            style={{
                background: `linear-gradient(135deg, ${color}0d, transparent)`,
                border: `1px solid ${color}28`,
                boxShadow: `0 0 16px ${color}0d`,
            }}
        >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: `${color}bb` }}>
                {icon}
                {label}
            </div>
            <div className="text-xl font-black tabular-nums coord-text-head" style={{ color }}>
                {value}
            </div>
            {sub && (
                <div className="text-[10px] coord-text-muted leading-tight">{sub}</div>
            )}
        </div>
    );
}

/* ─── area card ──────────────────────────────────────────────────────── */

function AreaCard({ insight, onClick }: { insight: AreaInsight; onClick?: () => void }) {
    const ui = AREA_SEVERITY_UI[insight.severity as keyof typeof AREA_SEVERITY_UI];
    const color = ui?.color ?? '#888';
    return (
        <button
            type="button"
            className="w-full text-left rounded-xl p-4 space-y-3 transition-all hover:scale-[1.01]"
            style={{
                background: `linear-gradient(135deg, ${color}0c, transparent)`,
                border: `1px solid ${color}30`,
                boxShadow: `0 2px 16px ${color}10`,
                borderLeft: `3px solid ${color}`,
            }}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="text-sm font-bold coord-text-head tracking-tight">{insight.name}</div>
                    <div className="text-xs coord-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                        {insight.headline}
                    </div>
                </div>
                <SeverityChip severity={insight.severity} />
            </div>

            <GlowBar pctVal={insight.avg} color={color} height={6} />

            <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-3">
                    <span>
                        <span className="coord-text-muted">Institución </span>
                        <span className="font-black coord-text-head">{insight.avg.toFixed(1)}/100</span>
                    </span>
                    <span>
                        <span className="coord-text-muted">Nacional </span>
                        <span className="font-semibold coord-text-body">{insight.nationalAvg.toFixed(1)}</span>
                    </span>
                </div>
                <span
                    className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                    style={{
                        background: insight.delta >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
                        color: insight.delta >= 0 ? '#34d399' : '#fb7185',
                    }}
                >
                    {deltaShort(insight.delta)}
                </span>
            </div>
        </button>
    );
}

function SoftEmptyState({
    title,
    body,
    tone = 'info',
    icon,
}: {
    title: string;
    body: string;
    tone?: 'success' | 'info' | 'warning';
    icon?: React.ReactNode;
}) {
    const color = tone === 'success' ? '#34d399' : tone === 'warning' ? '#fbbf24' : '#60a5fa';
    return (
        <div
            className="rounded-xl px-4 py-5 text-center"
            style={{
                background: `linear-gradient(135deg, ${color}12, rgba(255,255,255,0.025))`,
                border: `1px solid ${color}30`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 18px ${color}0d`,
            }}
            role="status"
        >
            <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                    color,
                    background: `${color}18`,
                    border: `1px solid ${color}35`,
                }}
            >
                {icon ?? <CheckCircle2 size={18} />}
            </div>
            <div className="text-sm font-black coord-text-head">{title}</div>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed coord-text-muted">{body}</p>
        </div>
    );
}

/* ─── plan step card ─────────────────────────────────────────────────── */

function PlanStepCard({ paso }: { paso: PlanEstudioPaso }) {
    const [open, setOpen] = useState(false);
    const ui = AREA_SEVERITY_UI[paso.severidad as keyof typeof AREA_SEVERITY_UI];
    const color = ui?.color ?? '#888';
    return (
        <div
            className="rounded-xl border overflow-hidden"
            style={{
                borderColor: `${color}30`,
                background: `linear-gradient(135deg, ${color}06, transparent)`,
            }}
        >
            <button
                type="button"
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors hover:bg-white/5"
                onClick={() => setOpen((v) => !v)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span
                        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black"
                        style={{
                            background: `linear-gradient(135deg, ${color}22, ${color}44)`,
                            color,
                            border: `1px solid ${color}44`,
                            boxShadow: `0 0 8px ${color}33`,
                        }}
                    >
                        {paso.orden}
                    </span>
                    <div className="min-w-0">
                        <div className="text-sm font-bold coord-text-head">{paso.areaNombre}</div>
                        <SeverityChip severity={paso.severidad} />
                    </div>
                </div>
                <ChevronDown
                    size={15}
                    className="shrink-0 coord-text-muted transition-transform"
                    style={{ transform: open ? 'rotate(180deg)' : undefined }}
                />
            </button>

            {open && (
                <div
                    className="px-4 pb-4 pt-0 space-y-3 border-t"
                    style={{ borderColor: `${color}22` }}
                >
                    <p className="text-sm coord-text-body leading-relaxed pt-3">{paso.resumen}</p>

                    {paso.competenciasMacro.length > 0 && (
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest coord-text-muted mb-1.5">
                                Competencias (Marco)
                            </div>
                            <ul className="space-y-1">
                                {paso.competenciasMacro.map((c, i) => (
                                    <li key={i} className="text-xs coord-text-body flex items-start gap-1.5">
                                        <CheckCircle2 size={11} className="mt-0.5 shrink-0" style={{ color }} />
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {paso.microAcciones.length > 0 && (
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest coord-text-muted mb-1.5">
                                Micro-acciones
                            </div>
                            <ul className="space-y-1">
                                {paso.microAcciones.map((a, i) => (
                                    <li key={i} className="text-xs coord-text-body flex items-start gap-1.5">
                                        <Zap size={11} className="mt-0.5 shrink-0" style={{ color }} />
                                        {a}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {paso.hitosTresSemanas.length > 0 && (
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest coord-text-muted mb-1.5">
                                Hitos (3 semanas)
                            </div>
                            <ul className="space-y-1">
                                {paso.hitosTresSemanas.map((h, i) => (
                                    <li key={i} className="text-xs coord-text-body flex items-start gap-1.5">
                                        <Map size={11} className="mt-0.5 shrink-0" style={{ color }} />
                                        {h}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {paso.vinculosPreguntasCriticas.length > 0 && (
                        <div
                            className="rounded-lg px-3 py-2"
                            style={{
                                background: `${color}0a`,
                                border: `1px solid ${color}22`,
                            }}
                        >
                            <div className="text-[10px] font-bold uppercase tracking-widest coord-text-muted mb-1.5">
                                Ítems críticos vinculados
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {paso.vinculosPreguntasCriticas.slice(0, 6).map((v) => (
                                    <span
                                        key={`${v.materia}-${v.num}`}
                                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold"
                                        style={{
                                            background: `${color}15`,
                                            color,
                                            border: `1px solid ${color}30`,
                                        }}
                                    >
                                        P{v.num} · {Math.round(v.failRate * 100)} de cada 100 falla
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── main component ─────────────────────────────────────────────────── */

export default function DesempenoSection({
    inst,
    pseudoPensum,
    executiveSummary,
    questionAnalysis = {},
    simulationId = '',
}: DesempenoSectionProps) {
    const [areaModal, setAreaModal] = useState<AreaInsight | null>(null);

    const computed = useMemo(() => {
        const total = inst.students.filter((s) => (Number(s.puntaje_global) || 0) > 0).length;
        const n = inst.niveles;

        const nivelRows = [
            { key: 'superior', label: 'Superior', count: n.superior, color: '#34d399' },
            { key: 'alto',     label: 'Alto',     count: n.alto,     color: '#60a5fa' },
            { key: 'medio',    label: 'Medio',    count: n.medio,    color: '#fbbf24' },
            { key: 'bajo',     label: 'Bajo',     count: n.bajo,     color: '#fb7185' },
        ].map((r) => ({ ...r, pct: pct(r.count, total) }));

        const histRows = Object.entries(inst.distribucion || {})
            .map(([range, count]) => ({ range, count: Number(count) || 0 }))
            .filter((x) => x.count > 0);
        const histMax = histRows.reduce((m, x) => Math.max(m, x.count), 0) || 1;

        return { total, nivelRows, histRows, histMax };
    }, [inst]);

    const es = executiveSummary;
    const hasPerformanceData =
        computed.total > 0 &&
        inst.subjectStats.some((s) => s.countStudents > 0 && Number(s.avg) > 0);

    return (
        <div className="space-y-6">
            {/* ── HERO EJECUTIVO ──────────────────────────────────── */}
            <CoordCard stripe={pseudoPensum ? 'amber' : 'indigo'} data-coord-tour={TourAnchors.desempenoExecutive}>
                <SectionHeader
                    title="Resumen ejecutivo"
                    description={es?.headline ?? 'Análisis de desempeño institucional.'}
                    accent={pseudoPensum ? 'var(--coord-warning)' : 'var(--coord-accent)'}
                    icon={<Activity size={16} />}
                    right={
                        es ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <NivelBadge nivel={es.nivelGeneral} />
                                <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide whitespace-nowrap"
                                    style={{
                                        background: es.deltaNacional >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
                                        color: es.deltaNacional >= 0 ? '#34d399' : '#fb7185',
                                        border: `1px solid ${es.deltaNacional >= 0 ? '#34d39944' : '#fb718544'}`,
                                    }}
                                >
                                    {deltaShort(es.deltaNacional)}
                                </span>
                            </div>
                        ) : null
                    }
                />

                {/* KPI grid — fila 1 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                    <FuturisticKpi
                        label="Promedio global"
                        value={`${inst.avg}`}
                        sub="de 500 puntos posibles"
                        color={inst.avg >= 325 ? '#34d399' : inst.avg >= 250 ? '#fbbf24' : '#fb7185'}
                    />
                    <FuturisticKpi
                        label="Mediana"
                        value={inst.median}
                        sub="puntaje del estudiante central"
                        color="#60a5fa"
                    />
                    <FuturisticKpi
                        label="Tasa de aprobación"
                        value={`${inst.tasaAprobacion}%`}
                        sub="alcanzaron 300 puntos o más"
                        color={inst.tasaAprobacion >= 70 ? '#34d399' : inst.tasaAprobacion >= 50 ? '#fbbf24' : '#fb7185'}
                    />
                    <FuturisticKpi
                        label="Estudiantes en riesgo"
                        value={es?.riesgoCount ?? 0}
                        sub="requieren acompañamiento activo"
                        color={(es?.riesgoCount ?? 0) > 0 ? '#fb7185' : '#34d399'}
                        icon={<AlertTriangle size={10} />}
                    />
                </div>

                {/* KPI grid — fila 2 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    <FuturisticKpi
                        label="Desviación estándar"
                        value={inst.stdDev}
                        sub="qué tan separados están los puntajes"
                        color="#a78bfa"
                    />
                    <FuturisticKpi
                        label="Coef. de variación"
                        value={`${inst.coefVar}%`}
                        sub={inst.coefVar > 25 ? 'grupo muy heterogéneo' : 'grupo relativamente uniforme'}
                        color={inst.coefVar > 25 ? '#fbbf24' : '#34d399'}
                    />
                    <FuturisticKpi
                        label="Total evaluados"
                        value={computed.total}
                        sub="con puntaje global válido"
                        color="#94a3b8"
                    />
                </div>
            </CoordCard>

            {/* ── DISTRIBUCIÓN DE NIVELES ─────────────────────────── */}
            <CoordCard stripe="cyan" data-coord-tour={TourAnchors.desempenoLevels}>
                <SectionHeader
                    title="Distribución por niveles"
                    description="Proporción del grupo en cada nivel ICFES. Un nivel Superior corresponde a 400 puntos o más; Bajo es menos de 250."
                    accent="var(--coord-info)"
                />
                <div className="mt-5 space-y-4">
                    {computed.nivelRows.map((r) => (
                        <div key={r.key}>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            background: r.color,
                                            boxShadow: `0 0 6px ${r.color}`,
                                        }}
                                    />
                                    <span className="text-sm font-bold coord-text-head">{r.label}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="font-black tabular-nums" style={{ color: r.color }}>
                                        {r.pct}%
                                    </span>
                                    <span className="coord-text-muted">({r.count} estudiantes)</span>
                                </div>
                            </div>
                            <GlowBar pctVal={r.pct} color={r.color} height={10} />
                        </div>
                    ))}
                </div>
            </CoordCard>

            {/* ── HISTOGRAMA GLOBAL ───────────────────────────────── */}
            <CoordCard stripe="violet" data-coord-tour={TourAnchors.desempenoHistogram}>
                <SectionHeader
                    title="Histograma de puntaje global"
                    description="Cuántos estudiantes se concentran en cada rango de puntaje. El rango más alto indica dónde está la mayoría del grupo."
                    accent="var(--coord-accent)"
                />
                <div className="mt-5 space-y-3">
                    {computed.histRows.length === 0 ? (
                        <SoftEmptyState
                            title="Sin puntajes globales válidos"
                            body="Cuando haya estudiantes con simulacro completo, aquí aparecerá la concentración por rangos de puntaje."
                            tone="info"
                            icon={<Activity size={18} />}
                        />
                    ) : computed.histRows.map(({ range, count }) => {
                        const total = computed.total || 1;
                        const p = Math.round((count / total) * 1000) / 10;
                        const isPeak = count === computed.histMax;
                        const color = isPeak ? '#a78bfa' : '#6366f1';
                        return (
                            <div key={range}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        {isPeak && (
                                            <span
                                                className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide"
                                                style={{ background: '#a78bfa22', color: '#a78bfa' }}
                                            >
                                                pico
                                            </span>
                                        )}
                                        <span className="text-xs font-semibold coord-text-body">{range}</span>
                                    </div>
                                    <div className="text-xs flex items-center gap-1.5">
                                        <span className="font-black tabular-nums" style={{ color }}>
                                            {count}
                                        </span>
                                        <span className="coord-text-muted">estudiantes · {p}%</span>
                                    </div>
                                </div>
                                <GlowBar pctVal={p} color={color} height={8} />
                            </div>
                        );
                    })}
                </div>
            </CoordCard>

            {/* ── FORTALEZAS / ÁREAS A PRIORIZAR ─────────────────── */}
            {es && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CoordCard stripe="emerald" data-coord-tour={TourAnchors.desempenoStrengths}>
                        <SectionHeader
                            title={
                                es.fortalezasContexto === 'intrains'
                                    ? 'Mejores promedios internos'
                                    : 'Fortalezas institucionales'
                            }
                            description={
                                es.fortalezasContexto === 'intrains'
                                    ? 'Ningún área supera el referente nacional este simulacro. Estas son las de mayor promedio dentro de la institución.'
                                    : 'Áreas que superan el referente nacional. Metodologías replicables en el resto del plan.'
                            }
                            accent="var(--coord-success)"
                            icon={<Shield size={14} />}
                        />
                        <div className="mt-3 space-y-2">
                            {es.fortalezas.length === 0 ? (
                                <SoftEmptyState
                                    title="Aún no hay fortalezas comparables"
                                    body="No hay promedios por área suficientes para declarar una fortaleza institucional. Revisa la carga de puntajes o espera más estudiantes evaluados."
                                    tone="info"
                                    icon={<Shield size={18} />}
                                />
                            ) : (
                                es.fortalezas.map((f) => (
                                    <AreaCard key={f.key} insight={f} onClick={() => setAreaModal(f)} />
                                ))
                            )}
                        </div>
                    </CoordCard>

                    <CoordCard stripe="rose" data-coord-tour={TourAnchors.desempenoWeaknesses}>
                        <SectionHeader
                            title="Áreas a priorizar"
                            description="Las que presentan mayor brecha frente al referente nacional, ordenadas por urgencia."
                            accent="var(--coord-danger)"
                            icon={<AlertTriangle size={14} />}
                        />
                        <div className="mt-3 space-y-2">
                            {es.debilidades.length === 0 ? (
                                <PrioritiesClearPanel
                                    hasPerformanceData={hasPerformanceData}
                                    fortalezas={es.fortalezas}
                                    areasAligned={es.allAreas.filter((a) => a.delta >= 0)}
                                />
                            ) : (
                                es.debilidades.map((d) => (
                                    <AreaCard key={d.key} insight={d} onClick={() => setAreaModal(d)} />
                                ))
                            )}
                        </div>
                    </CoordCard>
                </div>
            )}

            {/* ── RECOMENDACIONES INSTITUCIONALES ────────────────── */}
            {es && es.recomendaciones.length > 0 && (
                <CoordCard stripe={pseudoPensum ? 'amber' : 'indigo'} data-coord-tour={TourAnchors.desempenoRecommendations}>
                    <SectionHeader
                        title="Recomendaciones institucionales"
                        description="Generadas automáticamente a partir de los resultados del simulacro."
                        accent={pseudoPensum ? 'var(--coord-warning)' : 'var(--coord-accent)'}
                        icon={<Lightbulb size={16} />}
                    />
                    <ul className="mt-4 space-y-2">
                        {es.recomendaciones.map((r, i) => {
                            const colors = [
                                ICFES_AREA_COLORS['matemáticas'],
                                ICFES_AREA_COLORS['lectura crítica'],
                                ICFES_AREA_COLORS['sociales y ciudadanas'],
                                ICFES_AREA_COLORS['ciencias naturales'],
                                ICFES_AREA_COLORS['inglés'],
                            ];
                            const c = colors[i % colors.length];
                            return (
                                <li
                                    key={i}
                                    className="rounded-xl px-4 py-3 flex items-start gap-3"
                                    style={{
                                        background: `${c}08`,
                                        border: `1px solid ${c}25`,
                                    }}
                                >
                                    <span
                                        className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                                        style={{
                                            background: `linear-gradient(135deg, ${c}33, ${c}55)`,
                                            color: c,
                                            border: `1px solid ${c}44`,
                                            boxShadow: `0 0 8px ${c}33`,
                                        }}
                                    >
                                        {i + 1}
                                    </span>
                                    <span className="text-sm coord-text-body leading-relaxed">{r}</span>
                                </li>
                            );
                        })}
                    </ul>
                </CoordCard>
            )}
            {es && es.recomendaciones.length === 0 && (
                <CoordCard stripe="emerald" data-coord-tour={TourAnchors.desempenoRecommendations}>
                    <SectionHeader
                        title="Recomendaciones institucionales"
                        description="No se detectaron alertas automáticas para este corte."
                        accent="var(--coord-success)"
                        icon={<Lightbulb size={16} />}
                    />
                    <div className="mt-4">
                        <SoftEmptyState
                            title={hasPerformanceData ? 'Desempeño estable' : 'Sin base para recomendar'}
                            body={
                                hasPerformanceData
                                    ? 'No hay acciones urgentes nuevas. Sostén el plan actual, revisa tendencias y programa seguimiento regular.'
                                    : 'No se generaron recomendaciones porque faltan datos válidos, no porque el desempeño sea necesariamente bueno.'
                            }
                            tone={hasPerformanceData ? 'success' : 'warning'}
                            icon={hasPerformanceData ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                        />
                    </div>
                </CoordCard>
            )}

            {/* ── PLAN DE ESTUDIO POR ÁREA ────────────────────────── */}
            {es && es.planEstudioPasos.length > 0 && (
                <CoordCard stripe={pseudoPensum ? 'amber' : 'cyan'} data-coord-tour={TourAnchors.desempenoPlan}>
                    <SectionHeader
                        title={pseudoPensum ? 'Plan de choque curricular' : 'Plan de estudio por área'}
                        description={
                            pseudoPensum
                                ? 'Áreas críticas ordenadas por urgencia con acciones concretas para este simulacro.'
                                : 'Acciones pedagógicas por área, ítems críticos vinculados e hitos de seguimiento.'
                        }
                        accent={pseudoPensum ? 'var(--coord-warning)' : 'var(--coord-info)'}
                        icon={<BookOpen size={16} />}
                    />
                    <div className="mt-4 space-y-3">
                        {es.planEstudioPasos.map((p) => (
                            <PlanStepCard key={p.areaKey} paso={p} />
                        ))}
                    </div>
                </CoordCard>
            )}
            {es && es.planEstudioPasos.length === 0 && (
                <CoordCard stripe="emerald" data-coord-tour={TourAnchors.desempenoPlan}>
                    <SectionHeader
                        title={pseudoPensum ? 'Plan de choque curricular' : 'Plan de estudio por área'}
                        description="No hay brechas suficientes para construir una ruta correctiva automática."
                        accent="var(--coord-success)"
                        icon={<BookOpen size={16} />}
                    />
                    <div className="mt-4">
                        <SoftEmptyState
                            title={hasPerformanceData ? 'Sin plan correctivo requerido' : 'No se puede construir plan correctivo'}
                            body={
                                hasPerformanceData
                                    ? 'El sistema no detectó áreas en nivel crítico, alto o moderado. Mantén práctica de sostenimiento y monitoreo por simulacro.'
                                    : 'Faltan puntajes válidos por área. Verifica datos antes de concluir que no se requiere intervención.'
                            }
                            tone={hasPerformanceData ? 'success' : 'warning'}
                            icon={hasPerformanceData ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                        />
                    </div>
                </CoordCard>
            )}

            {/* ── Dashboard curricular ICFES (completo; ver docs/coordinador-desempeno.md §6) ── */}
            <div data-coord-tour={TourAnchors.desempenoCurricular}>
            <CurricularICFESDashboard
                estudiantes={inst.students}
                pseudoPensum={!simulationSupportsPensumFullInsights(simulationId)}
                questionAnalysis={questionAnalysis}
            />
            </div>

            {/* ── MODAL DETALLE ÁREA ──────────────────────────────── */}
            <CoordinadorInsightModal
                open={!!areaModal}
                onClose={() => setAreaModal(null)}
                title={areaModal?.name ?? ''}
                subtitle={
                    areaModal
                        ? `${areaModal.avg.toFixed(1)} de 100 en la institución · Nacional: ${areaModal.nationalAvg.toFixed(1)} · ${deltaText(areaModal.delta)}`
                        : undefined
                }
                footer={
                    <div className="flex justify-end">
                        <button type="button" className="coord-btn-ghost" onClick={() => setAreaModal(null)}>
                            Cerrar
                        </button>
                    </div>
                }
            >
                {areaModal && (
                    <div className="space-y-4">
                        <SeverityChip severity={areaModal.severity} />
                        {areaModal.relativaIntra && (
                            <p className="text-xs coord-text-muted">Mayor promedio dentro de la institución este simulacro.</p>
                        )}

                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest coord-text-muted mb-1">
                                Diagnóstico
                            </div>
                            <p className="text-sm coord-text-body leading-relaxed">{areaModal.headline}</p>
                        </div>

                        <div
                            className="rounded-xl p-3"
                            style={{
                                background: `${AREA_SEVERITY_UI[areaModal.severity as keyof typeof AREA_SEVERITY_UI]?.color ?? '#888'}0d`,
                                border: `1px solid ${AREA_SEVERITY_UI[areaModal.severity as keyof typeof AREA_SEVERITY_UI]?.color ?? '#888'}25`,
                            }}
                        >
                            <div className="text-[10px] font-bold uppercase tracking-widest coord-text-muted mb-1">
                                Recomendación
                            </div>
                            <p className="text-sm coord-text-body leading-relaxed">{areaModal.recomendacion}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            {[
                                { label: 'Institución', value: `${areaModal.avg.toFixed(1)}/100` },
                                { label: 'Nacional',    value: `${areaModal.nationalAvg.toFixed(1)}/100` },
                                { label: 'Diferencia',  value: deltaShort(areaModal.delta) },
                            ].map((x) => (
                                <div
                                    key={x.label}
                                    className="rounded-lg p-2"
                                    style={{
                                        border: '1px solid var(--coord-border)',
                                        background: 'var(--coord-surface)',
                                    }}
                                >
                                    <div className="text-[10px] coord-text-muted">{x.label}</div>
                                    <div className="text-sm font-black coord-text-head mt-0.5">{x.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CoordinadorInsightModal>
        </div>
    );
}
