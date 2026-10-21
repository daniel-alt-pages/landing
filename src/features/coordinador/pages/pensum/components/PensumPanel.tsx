'use client';
import { useMemo, useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    BookOpen,
    Target,
    Info,
    ChevronRight,
    ChevronDown,
    Layers,
    ClipboardList,
    AlertCircle,
    Check,
} from 'lucide-react';
import type {
    ExecutiveSummary,
    AreaInsight,
    CriticalQuestion,
    PlanEstudioPaso,
} from '@features/coordinador/lib/executiveModel';
import { TOPIC_IMPORTANCE_META } from '@features/coordinador/lib/executiveModel';
import { normalizarMateriaAModeloArea } from '@features/coordinador/lib/macroReferencias';
import { buildQuestionStudyFocus, formatSigned } from '@features/coordinador/lib/pensumUtils';
import CoordinadorInsightModal, {
    CoordInsightBulletList,
    CoordInsightCallout,
    CoordInsightHighlight,
    CoordInsightMethodology,
    CoordInsightSection,
} from '@features/coordinador/components/CoordinadorInsightModal';
import { PrioritiesClearPanel } from '@features/coordinador/components/ui';
import { questionLabel } from '@/lib/questionLabel';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';

/**
 * Panel pensum alineado a la estructura de referencia Ideas/pensum.html (React + datos Firestore/exec summary).
 */

function modeloNombreLargo(modelo: string): string {
    if (modelo === 'Sociales') return 'Sociales y Ciudadanas';
    if (modelo === 'Ciencias') return 'Ciencias Naturales';
    return modelo;
}

function areaDotClass(modelo: string): string {
    const m = modelo.toLowerCase();
    if (m.includes('matem')) return 'bg-blue-400';
    if (m.includes('social')) return 'bg-yellow-400';
    if (m.includes('cienc')) return 'bg-green-400';
    if (m.includes('lectura')) return 'bg-purple-400';
    if (m.includes('ingl')) return 'bg-cyan-400';
    return 'bg-white/50';
}

function bubbleStyleForArea(name: string): { bg: string; border: string; color: string } {
    const n = name.toLowerCase();
    if (n.includes('matem'))
        return { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', color: 'rgba(96,165,250,0.95)' };
    if (n.includes('social'))
        return { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', color: 'rgba(251,191,36,0.95)' };
    if (n.includes('cienc'))
        return { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', color: 'rgba(74,222,128,0.95)' };
    if (n.includes('lectura'))
        return { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)', color: 'rgba(192,132,252,0.95)' };
    if (n.includes('ingl'))
        return { bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.25)', color: 'rgba(34,211,238,0.95)' };
    return { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)', color: '#c4b5fd' };
}

function classifyRecomendacion(text: string): 'critica' | 'alta' | 'media' {
    const t = text.toLowerCase();
    if (
        t.includes('crítica') ||
        t.includes('critica') ||
        t.includes('<30%') ||
        t.includes('remediac') ||
        (t.includes('tutor') && t.includes('estudiante')) ||
        (t.includes('riesgo activo') && t.includes('asign'))
    )
        return 'critica';
    if (t.includes('dispersión') || t.includes('diferenciar') || t.includes('mayor oportunidad') || t.includes('prioriza'))
        return 'alta';
    return 'media';
}

function areaModeloToSlug(modelo: string): string {
    if (modelo === 'Matemáticas') return 'matematicas';
    if (modelo === 'Sociales') return 'sociales';
    if (modelo === 'Ciencias') return 'ciencias';
    if (modelo === 'Lectura Crítica') return 'lectura';
    if (modelo === 'Inglés') return 'ingles';
    return 'otros';
}

function splitRecomendacion(rec: string): { title: string; rest: string } {
    const m = rec.match(/^(.+?[.!?])\s+/);
    if (m && m[1].length <= 160) return { title: m[1].trim(), rest: rec.slice(m[1].length).trim() };
    const cut = rec.indexOf(':');
    if (cut > 0 && cut < 100) return { title: rec.slice(0, cut).trim(), rest: rec.slice(cut + 1).trim() };
    const t =
        rec.length > 88 ? `${rec.slice(0, 85).trim()}…` : rec.trim();
    return { title: t, rest: rec };
}

function SoftEmptyState({
    title,
    body,
    tone = 'success',
}: {
    title: string;
    body: string;
    tone?: 'success' | 'info' | 'warning';
}) {
    const color = tone === 'success' ? '#34d399' : tone === 'warning' ? '#fbbf24' : '#60a5fa';
    return (
        <div
            className="rounded-2xl px-4 py-5 text-center"
            style={{
                background: `linear-gradient(135deg, ${color}12, rgba(255,255,255,0.025))`,
                border: `1px solid ${color}30`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 18px ${color}0d`,
            }}
            role="status"
        >
            <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}
            >
                <Check className="h-5 w-5" strokeWidth={3} />
            </div>
            <div className="text-sm font-black" style={{ color: 'var(--coord-text-primary)' }}>{title}</div>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed" style={{ color: 'var(--coord-text-secondary)' }}>{body}</p>
        </div>
    );
}

function recSeverityUi(sev: 'critica' | 'alta' | 'media'): { badge: string; border: string; bg: string; color: string } {
    if (sev === 'critica')
        return {
            badge: 'CRÍTICA',
            border: 'rgba(239,68,68,0.35)',
            bg: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(127,29,29,0.06))',
            color: '#f87171',
        };
    if (sev === 'alta')
        return {
            badge: 'ALTA',
            border: 'rgba(251,146,60,0.35)',
            bg: 'linear-gradient(135deg, rgba(251,146,60,0.1), rgba(124,45,18,0.05))',
            color: '#fb923c',
        };
    return {
        badge: 'MEDIA',
        border: 'rgba(234,179,8,0.3)',
        bg: 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(66,52,22,0.05))',
        color: '#fbbf24',
    };
}

const severityToTone: Record<
    AreaInsight['severity'],
    { color: string; bg: string; ring: string; label: string }
> = {
    critico: {
        color: '#fb7185',
        bg: 'rgba(244, 63, 94, 0.08)',
        ring: 'rgba(244, 63, 94, 0.25)',
        label: 'Intervención inmediata',
    },
    alto: {
        color: '#fb923c',
        bg: 'rgba(251, 146, 60, 0.08)',
        ring: 'rgba(251, 146, 60, 0.25)',
        label: 'Prioridad alta',
    },
    moderado: {
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.08)',
        ring: 'rgba(251, 191, 36, 0.25)',
        label: 'Refuerzo focalizado',
    },
    monitoreo: {
        color: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.08)',
        ring: 'rgba(96, 165, 250, 0.25)',
        label: 'Monitoreo',
    },
    ok: {
        color: '#34d399',
        bg: 'rgba(52, 211, 153, 0.08)',
        ring: 'rgba(52, 211, 153, 0.25)',
        label: 'Sostenimiento',
    },
};

type ModalState =
    | null
    | { type: 'executive' }
    | { type: 'area'; area: AreaInsight; role: 'fortaleza' | 'debilidad' }
    | { type: 'tema'; q: CriticalQuestion }
    | { type: 'plan'; paso: PlanEstudioPaso };

function AreaCard({
    area,
    kind,
    onOpen,
}: {
    area: AreaInsight;
    kind: 'fortaleza' | 'debilidad';
    onOpen: () => void;
}) {
    const tone = severityToTone[area.severity];
    const Icon = kind === 'fortaleza' ? TrendingUp : TrendingDown;
    const rankBadge =
        kind === 'debilidad' && area.institutionalPriority != null
            ? `Prioridad ${area.institutionalPriority}`
            : kind === 'fortaleza' && area.leverageRank != null
              ? `Fortaleza ${area.leverageRank}`
              : kind === 'fortaleza' && area.relativaIntra && area.intraRank != null
                ? `Institución ${area.intraRank}`
                : null;
    const rankHint =
        kind === 'debilidad'
            ? `Prioridad institucional ${rankBadge}: entre las áreas por debajo del nacional, esta es la #${area.institutionalPriority ?? '—'} en urgencia.`
            : area.relativaIntra && area.intraRank != null
              ? `${rankBadge}: entre las líneas de la institución, esta es la #${area.intraRank} por promedio de área en este simulacro (referente nacional no alcanzado en ningún área).`
              : `Fortaleza relativa ${rankBadge}: entre las áreas en o sobre el nacional, la #${area.leverageRank ?? '—'} para apalancar buenas prácticas.`;

    return (
        <button
            type="button"
            onClick={onOpen}
            className="rounded-xl p-4 text-left w-full transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            style={{
                background: tone.bg,
                border: `1px solid ${tone.ring}`,
            }}
        >
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" style={{ color: tone.color }} />
                    <span
                        className="text-[10px] font-bold uppercase tracking-widest truncate"
                        style={{ color: tone.color }}
                    >
                        {tone.label}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {rankBadge && (
                        <span
                            className="text-[10px] font-black px-1.5 py-0.5 rounded"
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                color: tone.color,
                                border: `1px solid ${tone.ring}`,
                            }}
                            title={rankHint}
                        >
                            {rankBadge}
                        </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/40" />
                </div>
            </div>
            <div className="flex items-baseline justify-between gap-2 mb-1">
                <h4 className="text-sm font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                    {area.name}
                </h4>
                <div className="flex items-baseline gap-1">
                    <span className="text-base font-black" style={{ color: 'var(--coord-text-primary)' }}>
                        {area.avg.toFixed(0)}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--coord-text-faint)' }}>
                        /100
                    </span>
                </div>
            </div>
            <p className="text-[11px] mb-2" style={{ color: 'var(--coord-text-tertiary)' }}>
                Nacional {area.nationalAvg.toFixed(0)} ·{' '}
                <span style={{ color: tone.color }} className="font-bold">
                    {area.delta >= 0 ? '+' : ''}
                    {area.delta.toFixed(1)}
                </span>{' '}
                vs nacional
            </p>
            <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--coord-text-secondary)' }}>
                {area.recomendacion}
            </p>
            <span className="text-[10px] font-semibold mt-2 inline-block text-indigo-300/90">
                Toca para ver detalle y priorización →
            </span>
        </button>
    );
}

export default function PensumPanel({
    summary,
    hasQuestionData = false,
}: {
    summary: ExecutiveSummary;
    hasQuestionData?: boolean;
}) {
    const [modal, setModal] = useState<ModalState>(null);
    const [temaFilter, setTemaFilter] = useState<'todas' | CriticalQuestion['importance']>('todas');
    const [temaAreaFilter, setTemaAreaFilter] = useState<'todas' | string>('todas');
    const [areaPlanFilter, setAreaPlanFilter] = useState<'todas' | string>('todas');
    const [expandedPlanKey, setExpandedPlanKey] = useState<string | null>(null);
    const [bancoMateria, setBancoMateria] = useState<'all' | string>('all');

    const temaAreaChips = useMemo(() => {
        const seen = new Map<string, { label: string; count: number }>();
        summary.preguntasCriticas.forEach(q => {
            const modelo = normalizarMateriaAModeloArea(q.materia) ?? q.materia;
            if (!seen.has(modelo)) seen.set(modelo, { label: modelo, count: 0 });
            seen.get(modelo)!.count++;
        });
        return Array.from(seen.entries()).map(([slug, v]) => ({ slug, ...v }));
    }, [summary.preguntasCriticas]);

    const temasFiltrados = useMemo(() => {
        let qs = summary.preguntasCriticas;
        if (temaFilter !== 'todas') qs = qs.filter(q => q.importance === temaFilter);
        if (temaAreaFilter !== 'todas')
            qs = qs.filter(q => (normalizarMateriaAModeloArea(q.materia) ?? q.materia) === temaAreaFilter);
        return qs;
    }, [summary.preguntasCriticas, temaFilter, temaAreaFilter]);

    const countsByImportance = useMemo(() => {
        const c = { critico: 0, alto: 0, moderado: 0 };
        summary.preguntasCriticas.forEach(q => {
            c[q.importance]++;
        });
        return c;
    }, [summary.preguntasCriticas]);

    const distribucionPorArea = useMemo(() => {
        const tallies = new Map<string, number>();
        for (const q of summary.preguntasCriticas) {
            const modelo = normalizarMateriaAModeloArea(q.materia) ?? q.materia;
            tallies.set(modelo, (tallies.get(modelo) ?? 0) + 1);
        }
        const order = ['Matemáticas', 'Sociales', 'Ciencias', 'Lectura Crítica', 'Inglés'];
        return order.filter(k => (tallies.get(k) ?? 0) > 0).map(k => ({
            modelo: k,
            label: modeloNombreLargo(k),
            count: tallies.get(k) ?? 0,
        }));
    }, [summary.preguntasCriticas]);

    const bancoCountsBySlug = useMemo(() => {
        const m: Record<string, number> = {
            matematicas: 0,
            sociales: 0,
            ciencias: 0,
            lectura: 0,
            ingles: 0,
            otros: 0,
        };
        for (const q of summary.preguntasCriticas) {
            const modelo = normalizarMateriaAModeloArea(q.materia) ?? q.materia;
            const slug = areaModeloToSlug(modelo);
            m[slug] = (m[slug] ?? 0) + 1;
        }
        return m;
    }, [summary.preguntasCriticas]);

    const maxErrorPct = useMemo(
        () => summary.preguntasCriticas.reduce((acc, q) => Math.max(acc, Math.round(q.failRate * 100)), 0),
        [summary.preguntasCriticas]
    );
    const maxAfectados = useMemo(
        () => summary.preguntasCriticas.reduce((acc, q) => Math.max(acc, q.failedCount), 0),
        [summary.preguntasCriticas]
    );
    const areasAfectadasCount = useMemo(() => {
        const s = new Set(
            summary.preguntasCriticas.map(q => normalizarMateriaAModeloArea(q.materia) ?? q.materia)
        );
        return s.size;
    }, [summary.preguntasCriticas]);

    const planPasosFiltrados = useMemo(() => {
        if (areaPlanFilter === 'todas') return summary.planEstudioPasos;
        return summary.planEstudioPasos.filter(p => {
            const modelo = normalizarMateriaAModeloArea(p.areaNombre) ?? p.areaNombre;
            return areaModeloToSlug(modelo) === areaPlanFilter;
        });
    }, [summary.planEstudioPasos, areaPlanFilter]);

    const preguntasBanco = useMemo(() => {
        if (bancoMateria === 'all') return summary.preguntasCriticas;
        return summary.preguntasCriticas.filter(q => {
            const modelo = normalizarMateriaAModeloArea(q.materia) ?? q.materia;
            return areaModeloToSlug(modelo) === bancoMateria;
        });
    }, [summary.preguntasCriticas, bancoMateria]);

    const areaByKey = useMemo(() => {
        const m = new Map<string, AreaInsight>();
        summary.allAreas.forEach(a => m.set(a.key, a));
        return m;
    }, [summary.allAreas]);

    const mainTopic = summary.preguntasCriticas[0] ?? null;
    const pensumAccionable = useMemo(
        () => temasFiltrados.map(q => ({ q, focus: buildQuestionStudyFocus(q) })),
        [temasFiltrados]
    );
    const selectedTopicFocus = modal?.type === 'tema' ? buildQuestionStudyFocus(modal.q) : null;
    const hasPerformanceData =
        summary.totalEvaluados > 0 &&
        summary.allAreas.some((a) => Number(a.avg) > 0);

    const ordenSugerido =
        mainTopic != null
            ? `Empezar por la pregunta con mayor tasa de error (${modeloNombreLargo(normalizarMateriaAModeloArea(mainTopic.materia) ?? mainTopic.materia)}, ${Math.round(mainTopic.failRate * 100)}%), aplicar la estrategia de estudio indicada, evaluar nuevamente con 2–3 ítems similares, y luego pasar a la siguiente pregunta de la lista.`
            : 'Sin ítems por encima del umbral crítico en este corte.';

    const planAreaFilterChips: {
        slug: 'todas' | string;
        label: string;
        bubble: ReturnType<typeof bubbleStyleForArea>;
    }[] = [
        { slug: 'todas', label: 'Todas las áreas', bubble: { bg: 'rgba(139,92,246,0.2)', border: 'rgba(139,92,246,0.4)', color: '#c4b5fd' } },
        { slug: 'matematicas', label: 'Matemáticas', bubble: bubbleStyleForArea('Matemáticas') },
        { slug: 'sociales', label: 'Sociales y Ciudadanas', bubble: bubbleStyleForArea('Sociales') },
        { slug: 'ciencias', label: 'Ciencias Naturales', bubble: bubbleStyleForArea('Ciencias') },
        { slug: 'lectura', label: 'Lectura Crítica', bubble: bubbleStyleForArea('Lectura') },
        { slug: 'ingles', label: 'Inglés', bubble: bubbleStyleForArea('Inglés') },
    ];

    return (
        <div data-coordinator-theme className="space-y-4">
            <div
                className="rounded-2xl p-5 overflow-hidden border"
                data-coord-tour={TourAnchors.pensumAlert}
                style={{
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.04))',
                    borderColor: 'rgba(239,68,68,0.15)',
                }}
            >
                <div className="flex items-start gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }}
                    >
                        <AlertCircle className="w-5 h-5 text-red-400" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[3px] text-red-400/70 mb-1">
                            Alerta institucional
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h2 className="text-base md:text-lg font-extrabold text-white leading-snug flex-1 min-w-0">
                                {summary.headline}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setModal({ type: 'executive' })}
                                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg shrink-0 border border-white/10 hover:bg-white/10"
                                style={{ color: '#a5b4fc' }}
                            >
                                <Info className="w-3.5 h-3.5" />
                                Contexto
                            </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-white/60">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                <strong className="text-white/80">Promedio:</strong> {summary.avg}/500 (
                                {Math.abs(summary.deltaNacional)} pts {summary.deltaNacional >= 0 ? 'por encima' : 'por debajo'}{' '}
                                del nacional)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-400" />
                                <strong className="text-white/80">Aprobación:</strong> {summary.tasaAprobacion}%
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-400" />
                                <strong className="text-white/80">En riesgo:</strong> {summary.riesgoCount} estudiantes
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl p-5 border border-[color:var(--coord-border)] bg-[color:var(--coord-trace-bg)]" data-coord-tour={TourAnchors.pensumIndicators}>
                <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                    <h3 className="text-sm font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                        ¿Qué son los indicadores de error?
                    </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        {
                            k: 'err',
                            abbr: '%',
                            title: 'Tasa de Error',
                            border: 'rgba(239,68,68,0.15)',
                            bg: 'rgba(239,68,68,0.06)',
                            tc: '#fca5a5',
                            body: 'Porcentaje de estudiantes que respondieron incorrectamente la pregunta. Un valor ≥50% indica que la mayoría del grupo no domina el tema.',
                        },
                        {
                            k: 'pp',
                            abbr: 'pp',
                            title: 'Puntos sobre Umbral',
                            border: 'rgba(245,158,11,0.15)',
                            bg: 'rgba(245,158,11,0.06)',
                            tc: '#fcd34d',
                            body: 'Cuántos puntos porcentuales supera la tasa de error el umbral crítico del 50%. Ejemplo: 68% error = +18 pp sobre el umbral.',
                        },
                        {
                            k: 'n',
                            abbr: '#',
                            title: 'Estudiantes Afectados',
                            border: 'rgba(99,102,241,0.15)',
                            bg: 'rgba(99,102,241,0.06)',
                            tc: '#a5b4fc',
                            body: 'Cantidad absoluta de estudiantes que fallaron la pregunta sobre el total que presentó el simulacro.',
                        },
                        {
                            k: 'ok',
                            abbr: 'OK',
                            title: 'Tasa de Acierto',
                            border: 'rgba(6,182,212,0.15)',
                            bg: 'rgba(6,182,212,0.06)',
                            tc: '#67e8f9',
                            body: 'El inverso de la tasa de error. Si el error es 68%, el acierto es 32%. Muestra qué fracción del grupo sí domina el tema.',
                        },
                    ].map(card => (
                        <div
                            key={card.k}
                            className="rounded-xl p-3.5 transition-transform hover:-translate-y-0.5"
                            style={{ background: card.bg, border: `1px solid ${card.border}` }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span
                                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                                    style={{
                                        background: `${card.tc}22`,
                                        color: card.tc,
                                    }}
                                >
                                    {card.k === 'ok' ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : card.abbr}
                                </span>
                                <span className="text-[11px] font-bold" style={{ color: card.tc }}>
                                    {card.title}
                                </span>
                            </div>
                            <p className="text-[10px] text-white/50 leading-relaxed">{card.body}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[color:var(--coord-border)] bg-[color:var(--coord-trace-bg)]" data-coord-tour={TourAnchors.pensumPlan}>
                <div className="h-[2px] coord-brand-stripe w-full opacity-90" />
                <div className="p-5 space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p
                                className="text-[10px] font-bold uppercase tracking-[3px]"
                                style={{ color: 'var(--coord-text-tertiary)' }}
                            >
                                Plan de estudio pregunta por pregunta
                            </p>
                            <h3 className="text-lg font-black" style={{ color: 'var(--coord-text-primary)' }}>
                                Qué estudiar, en qué orden y por qué
                            </h3>
                        </div>
                        <span
                            className="rounded-xl px-3 py-2 text-[11px] font-semibold self-start"
                            style={{
                                color: '#fef3c7',
                                background: 'rgba(245,158,11,0.1)',
                                border: '1px solid rgba(245,158,11,0.24)',
                            }}
                        >
                            Umbral crítico: preguntas donde ≥50% de estudiantes fallaron
                        </span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.6fr] gap-3">
                        <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Resumen general</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-3xl font-black tabular-nums text-white">{temasFiltrados.length}</p>
                                    <p className="text-[11px] text-white/55">preguntas críticas</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-black tabular-nums text-white">{maxErrorPct}%</p>
                                    <p className="text-[11px] text-white/55">máxima tasa de error</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-black tabular-nums text-white">{areasAfectadasCount}</p>
                                    <p className="text-[11px] text-white/55">áreas afectadas</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-black tabular-nums text-white">{maxAfectados}</p>
                                    <p className="text-[11px] text-white/55">máx. estudiantes afectados</p>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-white/10">
                                <p className="text-[11px] leading-relaxed text-white/60">
                                    <strong className="text-amber-200">Orden sugerido:</strong> {ordenSugerido}
                                </p>
                            </div>
                            <div className="pt-2 border-t border-white/10">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">
                                    Distribución por área
                                </p>
                                <div className="space-y-1.5">
                                    {distribucionPorArea.length === 0 ? (
                                        <p className="text-[10px] text-white/45">Sin distribución (sin ítems críticos).</p>
                                    ) : (
                                        distribucionPorArea.map(row => (
                                            <div key={row.modelo} className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${areaDotClass(row.modelo)}`} />
                                                <span className="text-[10px] text-white/50 flex-1">{row.label}</span>
                                                <span className="text-[10px] font-bold text-white/70">
                                                    {row.count} {row.count === 1 ? 'pregunta' : 'preguntas'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.03] min-h-[120px]">
                            {summary.preguntasCriticas.length > 0 && (
                                <div className="border-b border-white/10" data-coord-tour={TourAnchors.pensumFilters}>
                                    {/* Fila 1: filtro por urgencia */}
                                    <div className="px-3 pt-3 pb-2 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTemaFilter('todas')}
                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                                                temaFilter === 'todas'
                                                    ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200'
                                                    : 'border-white/10 text-white/50 hover:bg-white/5'
                                            }`}
                                        >
                                            Todas ({summary.preguntasCriticas.length})
                                        </button>
                                        {(['critico', 'alto', 'moderado'] as const).map(imp => {
                                            const meta = TOPIC_IMPORTANCE_META[imp];
                                            const n = countsByImportance[imp];
                                            if (n === 0) return null;
                                            return (
                                                <button
                                                    key={imp}
                                                    type="button"
                                                    onClick={() => setTemaFilter(imp)}
                                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                                                        temaFilter === imp
                                                            ? 'ring-1 ring-offset-1 ring-offset-transparent'
                                                            : 'opacity-90 hover:opacity-100'
                                                    }`}
                                                    style={{
                                                        background: meta.bg,
                                                        borderColor: temaFilter === imp ? meta.ring : `${meta.color}33`,
                                                        color: meta.color,
                                                        ...(temaFilter === imp ? { boxShadow: `0 0 0 1px ${meta.ring}` } : {}),
                                                    }}
                                                >
                                                    {meta.short} ({n})
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {/* Fila 2: filtro por área */}
                                    {temaAreaChips.length > 1 && (
                                        <div className="px-3 pb-3 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setTemaAreaFilter('todas')}
                                                className="text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all"
                                                style={{
                                                    background: 'rgba(139,92,246,0.12)',
                                                    borderColor: 'rgba(139,92,246,0.3)',
                                                    color: '#c4b5fd',
                                                    opacity: temaAreaFilter === 'todas' ? 1 : 0.4,
                                                }}
                                            >
                                                Todas las áreas
                                            </button>
                                            {temaAreaChips.map(chip => {
                                                const s = bubbleStyleForArea(chip.slug);
                                                const active = temaAreaFilter === chip.slug;
                                                return (
                                                    <button
                                                        key={chip.slug}
                                                        type="button"
                                                        onClick={() => setTemaAreaFilter(active ? 'todas' : chip.slug)}
                                                        className="text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all"
                                                        style={{
                                                            background: s.bg,
                                                            borderColor: s.border,
                                                            color: s.color,
                                                            opacity: active ? 1 : 0.4,
                                                            boxShadow: active ? `0 0 0 1px ${s.border}` : undefined,
                                                        }}
                                                    >
                                                        {chip.label} ({chip.count})
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                            {pensumAccionable.length === 0 ? (
                                <div className="p-5">
                                    <SoftEmptyState
                                        title={
                                            summary.preguntasCriticas.length === 0
                                                ? hasQuestionData
                                                    ? 'Sin ítems críticos'
                                                    : 'Sin datos de preguntas'
                                                : 'Filtro sin resultados'
                                        }
                                        body={
                                            summary.preguntasCriticas.length === 0
                                                ? hasQuestionData
                                                    ? 'Ninguna pregunta supera el umbral crítico del 50% de error. Mantén práctica de sostenimiento y seguimiento regular.'
                                                    : 'No hay agregados de preguntas para distinguir buen desempeño de una carga incompleta. Revisa `institution_question_stats`.'
                                                : 'No hay preguntas en esta categoría. Cambia el filtro para revisar otros niveles de prioridad.'
                                        }
                                        tone={summary.preguntasCriticas.length === 0 ? (hasQuestionData ? 'success' : 'warning') : 'info'}
                                    />
                                </div>
                            ) : (
                                <div className="divide-y divide-white/10">
                                    {pensumAccionable.map(({ q, focus }) => {
                                        const err = Math.round(q.failRate * 100);
                                        const barW = Math.min(100, err);
                                        return (
                                            <button
                                                key={`${q.materia}-${q.num}-${q.priorityOrder}-row`}
                                                type="button"
                                                onClick={() => setModal({ type: 'tema', q })}
                                                className="w-full text-left p-4 hover:bg-white/[0.04] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span
                                                        className="inline-flex items-center justify-center shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-black border border-white/10 bg-white/[0.05] whitespace-nowrap"
                                                        style={{ color: TOPIC_IMPORTANCE_META[q.importance].color }}
                                                    >
                                                        <span>Tema {q.priorityOrder}</span>
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-[11px] font-bold text-white">
                                                                Pregunta {q.num}
                                                            </span>
                                                            <span
                                                                className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
                                                                style={{
                                                                    borderColor: `${TOPIC_IMPORTANCE_META[q.importance].color}44`,
                                                                    color: TOPIC_IMPORTANCE_META[q.importance].color,
                                                                }}
                                                            >
                                                                {focus.areaNombre}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-[11px] text-white/55 line-clamp-2">{focus.eje}</p>
                                                        <div className="mt-2 h-2 rounded-full bg-white/[0.08] overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 error-bar"
                                                                style={{ width: `${barW}%` }}
                                                            />
                                                        </div>
                                                        <div className="mt-1.5 flex flex-wrap gap-3 text-[10px] text-white/45">
                                                            <span>
                                                                <strong className="text-rose-300">{err}%</strong> error
                                                            </span>
                                                            <span>{focus.afectados} estudiantes</span>
                                                            <span>{formatSigned(focus.margenSobreUmbral, ' pp')} umbral</span>
                                                            <span className="text-teal-300/90">{100 - err}% acierto</span>
                                                        </div>
                                                    </div>
                                                    <ChevronDown className="w-4 h-4 text-white/25 shrink-0 rotate-[-90deg]" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div
                        className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-2 text-[11px]"
                        style={{
                            background: 'rgba(17,24,39,0.8)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}
                    >
                        <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-white/60">
                            <strong className="text-white/80">Cómo usar esta tabla:</strong> cada fila es una pregunta del
                            simulacro. Haz clic para ver la estrategia de estudio y la evidencia de seguimiento. El orden
                            va de mayor a menor urgencia.
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="coord-card p-5" data-coord-tour={TourAnchors.pensumStrengths}>
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4" style={{ color: '#34d399' }} />
                        <h3 className="text-sm font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                            Fortalezas institucionales
                        </h3>
                    </div>
                    {summary.fortalezasContexto === 'intrains' ? (
                        <p className="text-[10px] mb-3 text-white/40 leading-relaxed">
                            Estas son las áreas donde la institución obtuvo los mejores resultados relativos; ninguna
                            alcanza el promedio nacional. Úsalas como ancla para replicar buenas prácticas (orden I# en
                            tarjetas).
                        </p>
                    ) : (
                        <p className="text-[10px] mb-3 text-white/40 leading-relaxed">
                            Áreas en o por encima del referente nacional o con mayor apalancamiento relativo (F#). Sirven
                            para documentar y escalar metodología.
                        </p>
                    )}
                    {summary.fortalezas.length === 0 ? (
                        <SoftEmptyState
                            title="Sin fortalezas comparables"
                            body="Aún no hay promedios por área suficientes para declarar una fortaleza. Cuando existan datos válidos, aparecerán aquí."
                            tone="info"
                        />
                    ) : (
                        <div className="space-y-2.5">
                            {summary.fortalezas.map(a => (
                                <AreaCard
                                    key={a.key}
                                    area={a}
                                    kind="fortaleza"
                                    onOpen={() => setModal({ type: 'area', area: a, role: 'fortaleza' })}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="coord-card p-5">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="w-4 h-4" style={{ color: '#fb7185' }} />
                        <h3 className="text-sm font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                            Áreas que requieren atención prioritaria
                        </h3>
                    </div>
                    <p className="text-[10px] mb-3 text-white/40 leading-relaxed">
                        Por debajo del nacional; el orden P# indica urgencia institucional. Abre cada tarjeta para ver la
                        guía práctica y el vínculo con ítems críticos.
                    </p>
                    {summary.debilidades.length === 0 ? (
                        <PrioritiesClearPanel
                            hasPerformanceData={hasPerformanceData}
                            fortalezas={summary.fortalezas}
                            areasAligned={summary.allAreas.filter((a) => a.delta >= 0)}
                        />
                    ) : (
                        <div className="space-y-2.5">
                            {summary.debilidades.map(a => (
                                <AreaCard
                                    key={a.key}
                                    area={a}
                                    kind="debilidad"
                                    onOpen={() => setModal({ type: 'area', area: a, role: 'debilidad' })}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="coord-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-300 shrink-0" />
                        <h3 className="text-sm font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                            Plan de estudio por área
                        </h3>
                    </div>
                    <span className="text-[10px] text-white/40 sm:ml-auto">
                        Selecciona un área para ver su plan detallado
                    </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4" data-coord-tour={TourAnchors.pensumAreas}>
                    {planAreaFilterChips.map(chip => {
                        const active = areaPlanFilter === chip.slug;
                        return (
                            <button
                                key={chip.slug}
                                type="button"
                                onClick={() => {
                                    setAreaPlanFilter(chip.slug);
                                    setExpandedPlanKey(null);
                                }}
                                className="filter-bubble text-[11px] font-bold px-3.5 py-2 rounded-full border transition-all hover:scale-[1.02]"
                                style={{
                                    background: chip.bubble.bg,
                                    borderColor: chip.bubble.border,
                                    color: chip.bubble.color,
                                    opacity: active ? 1 : 0.45,
                                    boxShadow: active ? '0 2px 12px rgba(139,92,246,0.12)' : undefined,
                                }}
                            >
                                {chip.label}
                            </button>
                        );
                    })}
                </div>
                {summary.planEstudioPasos.length === 0 ? (
                    <SoftEmptyState
                        title={hasPerformanceData ? 'Sin plan correctivo requerido' : 'No se puede construir plan correctivo'}
                        body={
                            hasPerformanceData
                                ? 'No se detectaron oportunidades críticas para construir un plan de choque. Mantener trabajo actual y revisar tendencias.'
                                : 'Faltan puntajes válidos. Verifica datos antes de asumir que no se requiere intervención.'
                        }
                        tone={hasPerformanceData ? 'success' : 'warning'}
                    />
                ) : planPasosFiltrados.length === 0 ? (
                    <SoftEmptyState
                        title="Filtro sin pasos"
                        body="No hay acciones asociadas a esta área. Elige otro filtro o vuelve a todas las áreas."
                        tone="info"
                    />
                ) : (
                    <div className="space-y-3" data-coord-tour={TourAnchors.pensumPlanAccordion}>
                        {planPasosFiltrados.map(paso => {
                            const modelo = normalizarMateriaAModeloArea(paso.areaNombre) ?? paso.areaNombre;
                            const tone = severityToTone[paso.severidad];
                            const open = expandedPlanKey === paso.areaKey;
                            const ins = areaByKey.get(paso.areaKey);
                            const cortoResumen = (() => {
                                const cut = paso.resumen.indexOf('): ');
                                return cut >= 0 ? paso.resumen.slice(cut + 3).trim() : paso.resumen;
                            })();
                            return (
                                <div
                                    key={paso.areaKey}
                                    className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
                                >
                                    <button
                                        type="button"
                                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.04] transition-colors"
                                        onClick={() => setExpandedPlanKey(open ? null : paso.areaKey)}
                                    >
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${areaDotClass(modelo)}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[13px] font-bold text-white">{paso.areaNombre}</span>
                                                <span
                                                    className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md border"
                                                    style={{
                                                        borderColor: tone.ring,
                                                        color: tone.color,
                                                        background: tone.bg,
                                                    }}
                                                >
                                                    {tone.label}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-white/50 mt-1 line-clamp-2">{cortoResumen}</p>
                                            <p className="text-[10px] text-white/40 mt-1">
                                                Promedio {ins ? ins.avg.toFixed(0) : '—'}
                                                /100 · Nacional {ins ? ins.nationalAvg.toFixed(0) : '—'} · Gap{' '}
                                                {ins ? ins.delta.toFixed(1) : '—'} pts
                                            </p>
                                        </div>
                                        <ChevronDown
                                            className={`w-5 h-5 text-white/35 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {open ? (
                                        <div className="px-4 pb-4 pt-0 border-t border-white/[0.06] space-y-3">
                                            {paso.vinculosPreguntasCriticas.length > 0 && (
                                                <p className="text-[10px] text-indigo-200/85 pt-3">
                                                    {paso.vinculosPreguntasCriticas.length} ítem(s) crítico(s) vinculados en
                                                    esta área.
                                                </p>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setModal({ type: 'plan', paso })}
                                                className="inline-flex items-center gap-2 text-[11px] font-bold px-3 py-2 rounded-xl border border-indigo-400/35 text-indigo-200 hover:bg-indigo-500/10 transition-colors"
                                            >
                                                Ver plan completo (marco + guía coordinación)
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="coord-card p-5">
                <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                        Recomendaciones para la institución
                    </h3>
                </div>
                <p className="text-[10px] mb-4 text-white/40 leading-relaxed">
                    Acciones concretas derivadas del análisis del simulacro {summary.simulationId}. Severidad inferida por
                    palabras clave en el texto.
                </p>
                {summary.recomendaciones.length === 0 ? (
                    <SoftEmptyState
                        title={hasPerformanceData ? 'Sin acciones urgentes' : 'Sin base para recomendar'}
                        body={
                            hasPerformanceData
                                ? 'No se generaron recomendaciones prioritarias adicionales. Mantén monitoreo regular y ciclos de sostenimiento.'
                                : 'No hay datos suficientes para generar recomendaciones. Este estado no debe interpretarse como buen desempeño.'
                        }
                        tone={hasPerformanceData ? 'success' : 'warning'}
                    />
                ) : (
                    <div className="space-y-3">
                        {summary.recomendaciones.map((rec, i) => {
                            const sev = classifyRecomendacion(rec);
                            const ui = recSeverityUi(sev);
                            const { title, rest } = splitRecomendacion(rec);
                            const detail =
                                rest.length > 0 ? rest : title.endsWith('…') ? rec : rec.length > title.length ? rec : '';
                            return (
                                <div
                                    key={i}
                                    className="rounded-2xl p-4 border"
                                    style={{ background: ui.bg, borderColor: ui.border }}
                                >
                                    <div className="flex flex-wrap items-start gap-2 mb-2">
                                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black bg-white/10 text-white shrink-0">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-bold text-white leading-snug">{title}</p>
                                        </div>
                                        <span
                                            className="text-[9px] font-black px-2 py-1 rounded-md border shrink-0"
                                            style={{
                                                borderColor: ui.border,
                                                color: ui.color,
                                                background: 'rgba(0,0,0,0.2)',
                                            }}
                                        >
                                            {ui.badge}
                                        </span>
                                    </div>
                                    {detail ? (
                                        <p className="text-[12px] leading-relaxed text-white/70 pl-10">{detail}</p>
                                    ) : null}
                                    <div className="mt-3 pl-10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                                            <p className="font-bold text-amber-200/90 uppercase tracking-wider mb-0.5">
                                                Acción concreta
                                            </p>
                                            <p className="text-white/55">Asignar responsable y calendarizar el primer ciclo de refuerzo alineado al marco de la competencia.</p>
                                        </div>
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                                            <p className="font-bold text-cyan-200/90 uppercase tracking-wider mb-0.5">
                                                Plazo sugerido
                                            </p>
                                            <p className="text-white/55">
                                                {sev === 'critica'
                                                    ? 'Inmediato – 8 semanas'
                                                    : sev === 'alta'
                                                      ? 'Semanas 1–8'
                                                      : 'Semanas 1–4 (piloto)'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="coord-card p-5" data-coord-tour={TourAnchors.pensumBanco}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <h3 className="text-sm font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                            Banco de preguntas con mayor dificultad
                        </h3>
                    </div>
                    <span className="sm:ml-auto text-[10px] font-semibold text-white/40">
                        {summary.preguntasCriticas.length} ítem(s) con error institucional ≥50%
                    </span>
                </div>
                <p className="text-[10px] text-white/40 mb-3 leading-relaxed">
                    Urgencia por color: <span className="text-red-400 font-bold">&gt;65% error</span>,{' '}
                    <span className="text-orange-400 font-bold">60–65%</span>,{' '}
                    <span className="text-amber-300 font-bold">&lt;60%</span>.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setBancoMateria('all')}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                            bancoMateria === 'all'
                                ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200'
                                : 'border-white/10 text-white/50 hover:bg-white/5'
                        }`}
                    >
                        Todas ({summary.preguntasCriticas.length})
                    </button>
                    {(
                        [
                            ['matematicas', 'Matemáticas'],
                            ['sociales', 'Sociales'],
                            ['ciencias', 'Ciencias'],
                            ['lectura', 'Lectura Crítica'],
                            ['ingles', 'Inglés'],
                        ] as const
                    ).map(([slug, label]) => {
                        const n = bancoCountsBySlug[slug] ?? 0;
                        if (n === 0) return null;
                        const st = bubbleStyleForArea(label);
                        return (
                            <button
                                key={slug}
                                type="button"
                                onClick={() => setBancoMateria(slug)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                                    bancoMateria === slug ? 'ring-1 ring-indigo-400/50' : 'opacity-70 hover:opacity-100'
                                }`}
                                style={{
                                    background: st.bg,
                                    borderColor: st.border,
                                    color: st.color,
                                }}
                            >
                                {modeloNombreLargo(label)} ({n})
                            </button>
                        );
                    })}
                </div>
                {preguntasBanco.length === 0 ? (
                    <SoftEmptyState
                        title={
                            summary.preguntasCriticas.length === 0
                                ? hasQuestionData
                                    ? 'Sin preguntas críticas'
                                    : 'Sin datos de preguntas'
                                : 'Filtro sin preguntas'
                        }
                        body={
                            summary.preguntasCriticas.length === 0
                                ? hasQuestionData
                                    ? 'Ninguna pregunta supera el umbral de error institucional. Este bloque queda en modo seguimiento.'
                                    : 'No se cargaron agregados de preguntas para este filtro/simulacro. Revisa la conexión de datos antes de concluir buen desempeño.'
                                : 'No hay ítems para el área seleccionada. Cambia el filtro para revisar el resto.'
                        }
                        tone={summary.preguntasCriticas.length === 0 ? (hasQuestionData ? 'success' : 'warning') : 'info'}
                    />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {preguntasBanco.map(q => {
                            const err = Math.round(q.failRate * 100);
                            const border =
                                err > 65
                                    ? 'rgba(248,113,113,0.45)'
                                    : err >= 60
                                      ? 'rgba(251,146,60,0.45)'
                                      : 'rgba(245,158,11,0.35)';
                            const modelo = normalizarMateriaAModeloArea(q.materia) ?? q.materia;
                            return (
                                <button
                                    key={`${q.materia}-${q.num}-banco`}
                                    type="button"
                                    onClick={() => setModal({ type: 'tema', q })}
                                    className="rounded-xl p-3 text-left border bg-white/[0.03] hover:bg-white/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
                                    style={{ borderColor: border }}
                                >
                                    <p className="text-[10px] font-black text-white/40">{questionLabel(q.num)}</p>
                                    <p className="text-[11px] font-bold text-white line-clamp-2 mt-1">
                                        {modeloNombreLargo(modelo)}
                                    </p>
                                    <p className="text-lg font-black tabular-nums text-rose-200 mt-2">{err}%</p>
                                    <p className="text-[9px] text-white/45">error · Tema {q.priorityOrder}</p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modales */}
            <CoordinadorInsightModal
                open={modal?.type === 'executive'}
                onClose={() => setModal(null)}
                title="Contexto del resumen ejecutivo"
                subtitle={`${summary.institutionName} · Simulacro ${summary.simulationId}`}
                icon={Info}
                accent="indigo"
                size="lg"
            >
                <CoordInsightHighlight>{summary.headline}</CoordInsightHighlight>

                <CoordInsightSection title="Cómo leer este resumen" icon={BookOpen} accent="cyan">
                    <CoordInsightBulletList>
                        <li>
                            Percentil y comparativos usan referencias nacionales publicadas (ICFES /
                            score_analysis_report).
                        </li>
                        <li>
                            Las áreas se priorizan con <strong>P#</strong> entre todas las competencias por debajo del
                            promedio nacional; las fortalezas por encima del referente con <strong>F#</strong>.
                        </li>
                        <li>
                            Si ningún área alcanza el referente nacional, el bloque de fortalezas muestra las de{' '}
                            <strong>mayor promedio local</strong> con insignia <strong>I#</strong>, sin duplicar el top
                            de priorización.
                        </li>
                        <li>
                            Los temas críticos ordenan por <strong>tasa de error institucional</strong> del ítem (no
                            por dificultad teórica nacional).
                        </li>
                    </CoordInsightBulletList>
                </CoordInsightSection>

                <CoordInsightSection title="Metodología" icon={ClipboardList} accent="amber">
                    <CoordInsightMethodology items={summary.metodologia} />
                </CoordInsightSection>
            </CoordinadorInsightModal>

            <CoordinadorInsightModal
                open={modal?.type === 'area'}
                onClose={() => setModal(null)}
                title={modal?.type === 'area' ? modal.area.name : ''}
                subtitle={
                    modal?.type === 'area'
                        ? modal.role === 'debilidad'
                            ? `Área prioritaria institucional · Severidad: ${severityToTone[modal.area.severity].label}`
                            : modal.area.relativaIntra
                              ? `Mejor línea institucional (sin área ≥ referente nacional) · ${severityToTone[modal.area.severity].label}`
                              : `Fortaleza institucional · ${severityToTone[modal.area.severity].label}`
                        : ''
                }
            >
                {modal?.type === 'area' && (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {modal.role === 'debilidad' && modal.area.institutionalPriority != null && (
                                <span
                                    className="text-[11px] font-black px-2 py-1 rounded-lg"
                                    style={{
                                        background: 'rgba(251,113,133,0.15)',
                                        color: '#fb7185',
                                        border: '1px solid rgba(251,113,133,0.35)',
                                    }}
                                >
                                    Prioridad {modal.area.institutionalPriority}
                                </span>
                            )}
                            {modal.role === 'fortaleza' && modal.area.leverageRank != null && (
                                <span
                                    className="text-[11px] font-black px-2 py-1 rounded-lg"
                                    style={{
                                        background: 'rgba(52,211,153,0.15)',
                                        color: '#34d399',
                                        border: '1px solid rgba(52,211,153,0.35)',
                                    }}
                                >
                                    Fortaleza {modal.area.leverageRank}
                                </span>
                            )}
                            {modal.role === 'fortaleza' && modal.area.relativaIntra && modal.area.intraRank != null && (
                                <span
                                    className="text-[11px] font-black px-2 py-1 rounded-lg"
                                    style={{
                                        background: 'rgba(52,211,153,0.12)',
                                        color: '#5eead4',
                                        border: '1px solid rgba(94,234,212,0.35)',
                                    }}
                                >
                                    Institución {modal.area.intraRank}
                                </span>
                            )}
                            <span
                                className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white/5 border border-white/10"
                                style={{ color: 'var(--coord-text-secondary)' }}
                            >
                                Promedio {modal.area.avg.toFixed(1)}/100 · Nacional{' '}
                                {modal.area.nationalAvg.toFixed(1)}
                            </span>
                        </div>
                        <p className="font-medium text-white/88">{modal.area.headline}</p>
                        <p className="text-white/68">{modal.area.recomendacion}</p>
                        <CoordInsightCallout title="Qué hacer en práctica">
                            <CoordInsightBulletList>
                                {modal.role === 'debilidad' ? (
                                    <>
                                        <li>
                                            Asignar docente líder en {modal.area.name} con seguimiento quincenal de
                                            avances cuantitativos (simulacros cortos).
                                        </li>
                                        <li>
                                            Cruza esta área con los temas críticos de la misma competencia en la cuadrícula
                                            inferior: si coinciden, sube la prioridad real del tema en el aula.
                                        </li>
                                        <li>
                                            Documentar estudiantes del cuartil inferior solo en esta área para tutorías
                                            focalizadas.
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li>
                                            Extraer rutinas didácticas de {modal.area.name} y pilotarlas en 1–2 grupos
                                            paralelos de otras áreas.
                                        </li>
                                        <li>
                                            Usar esta fortaleza como ancla motivacional en comunicaciones a padres y en
                                            consejería académica.
                                        </li>
                                    </>
                                )}
                            </CoordInsightBulletList>
                        </CoordInsightCallout>
                    </>
                )}
            </CoordinadorInsightModal>

            <CoordinadorInsightModal
                open={modal?.type === 'tema'}
                onClose={() => setModal(null)}
                title={modal?.type === 'tema' ? `${questionLabel(modal.q.num)} · ${modal.q.materia}` : ''}
                subtitle={modal?.type === 'tema' ? `Tema ${modal.q.priorityOrder} · ${TOPIC_IMPORTANCE_META[modal.q.importance].label}` : ''}
            >
                {modal?.type === 'tema' && selectedTopicFocus && (() => {
                    const f = selectedTopicFocus;
                    const q = modal.q;
                    const imp = TOPIC_IMPORTANCE_META[q.importance];
                    const errColor = f.errorPct >= 65 ? '#f87171' : f.errorPct >= 60 ? '#fb923c' : '#fbbf24';
                    const [failedStr, totalStr] = f.afectados.split('/');
                    const failed = parseInt(failedStr, 10);
                    const total = parseInt(totalStr, 10);
                    return (
                        <>
                            {/* Stat cards */}
                            <div className="grid grid-cols-3 gap-2">
                                <div
                                    className="rounded-xl p-3 flex flex-col gap-0.5"
                                    style={{ background: `${errColor}12`, border: `1px solid ${errColor}30` }}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">Error</span>
                                    <span className="text-2xl font-black tabular-nums leading-none" style={{ color: errColor }}>
                                        {f.errorPct}%
                                    </span>
                                    <span className="text-[10px] text-white/40">{f.aciertoPct}% lo logró</span>
                                </div>
                                <div
                                    className="rounded-xl p-3 flex flex-col gap-0.5"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">Fallaron</span>
                                    <span className="text-2xl font-black tabular-nums leading-none text-white/85">{failed}</span>
                                    <span className="text-[10px] text-white/40">de {total} estudiantes</span>
                                </div>
                                <div
                                    className="rounded-xl p-3 flex flex-col gap-0.5"
                                    style={{ background: `${errColor}10`, border: `1px solid ${errColor}25` }}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">Sobre límite</span>
                                    <span className="text-2xl font-black tabular-nums leading-none" style={{ color: errColor }}>
                                        +{f.margenSobreUmbral}
                                    </span>
                                    <span className="text-[10px] text-white/40">pts vs 50% alerta</span>
                                </div>
                            </div>

                            {/* Barra error vs acierto */}
                            <div>
                                <div className="flex justify-between text-[10px] text-white/35 mb-1">
                                    <span>Fallaron ({f.errorPct}%)</span>
                                    <span>Respondieron bien ({f.aciertoPct}%)</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden bg-white/10 flex">
                                    <div
                                        className="h-full"
                                        style={{ width: `${f.errorPct}%`, background: errColor, borderRadius: '9999px 0 0 9999px' }}
                                    />
                                    <div className="h-full flex-1" style={{ background: 'rgba(45,212,191,0.35)', borderRadius: '0 9999px 9999px 0' }} />
                                </div>
                                <p className="text-[10px] text-white/30 mt-1">
                                    Límite de alerta: 50% de error — esta pregunta lo supera por{' '}
                                    <span className="font-bold text-white/50">{f.margenSobreUmbral} puntos porcentuales</span>
                                </p>
                            </div>

                            {/* Prioridad chip */}
                            <div className="flex flex-wrap gap-2 items-center">
                                <span
                                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black whitespace-nowrap"
                                    style={{ background: imp.bg, color: imp.color, border: `1px solid ${imp.ring}` }}
                                >
                                    Tema {q.priorityOrder} de la lista
                                </span>
                                <span className="text-[11px] text-white/40 leading-tight">
                                    Área: <span className="text-white/60">{q.materia}</span>
                                </span>
                            </div>

                            {/* Qué evalúa */}
                            <div
                                className="rounded-lg p-3"
                                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}
                            >
                                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-300/70 mb-1.5">
                                    Qué evalúa esta pregunta
                                </p>
                                <p className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--coord-text-primary)' }}>
                                    {f.eje}
                                </p>
                            </div>

                            {/* Qué hacer + cómo verificar */}
                            <div
                                className="rounded-lg p-3 space-y-3"
                                style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(45,212,191,0.22)' }}
                            >
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-teal-300/70 mb-1">
                                        Qué hacer en clase
                                    </p>
                                    <p className="text-[12px] text-white/75 leading-snug">{f.accion}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-teal-300/70 mb-1">
                                        Cómo saber si el grupo mejoró
                                    </p>
                                    <p className="text-[12px] text-white/75 leading-snug">{f.evidencia}</p>
                                </div>
                            </div>

                            {/* Meta en lenguaje claro */}
                            <div
                                className="rounded-lg p-3"
                                style={{ background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.2)' }}
                            >
                                <p className="text-[10px] font-bold uppercase tracking-wide text-rose-300/70 mb-2">
                                    Meta para esta pregunta
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex gap-2 text-[12px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                        <span className="text-white/70">
                                            Lograr que la tasa de error baje de{' '}
                                            <span className="font-bold text-white/90">{f.errorPct}% a menos del 50%</span> en la
                                            siguiente evaluación corta.
                                        </span>
                                    </li>
                                    <li className="flex gap-2 text-[12px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                        <span className="text-white/70">
                                            Si no se llega al 50%, mejorar al menos{' '}
                                            <span className="font-bold text-white/90">8 puntos porcentuales</span> respecto al
                                            resultado actual.
                                        </span>
                                    </li>
                                    <li className="flex gap-2 text-[12px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                        <span className="text-white/70">
                                            Llevar registro de los estudiantes que repiten el error para darles atención
                                            personalizada.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </>
                    );
                })()}
            </CoordinadorInsightModal>

            <CoordinadorInsightModal
                open={modal?.type === 'plan'}
                onClose={() => setModal(null)}
                title={modal?.type === 'plan' ? `${modal.paso.areaNombre}` : ''}
                subtitle={
                    modal?.type === 'plan'
                        ? `${severityToTone[modal.paso.severidad].label}${
                              modal.paso.institucionalPriority != null
                                  ? ` · Prioridad ${modal.paso.institucionalPriority}`
                                  : ''
                          }`
                        : ''
                }
            >
                {modal?.type === 'plan' && (() => {
                    const paso = modal.paso;
                    const errColor = (p: number) => p >= 65 ? '#f87171' : p >= 60 ? '#fb923c' : '#fbbf24';
                    return (
                        <>
                            {/* 1. Ítems críticos: tabla compacta con estadísticas */}
                            {paso.vinculosPreguntasCriticas.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-rose-300/80">
                                        Ítems críticos a resolver — {paso.vinculosPreguntasCriticas.length} pregunta{paso.vinculosPreguntasCriticas.length !== 1 ? 's' : ''}
                                    </p>
                                    <div className="space-y-1.5">
                                        {paso.vinculosPreguntasCriticas
                                            .slice()
                                            .sort((a, b) => b.failRate - a.failRate)
                                            .map(v => {
                                                const err = Math.round(v.failRate * 100);
                                                const c = errColor(err);
                                                return (
                                                    <div
                                                        key={`${v.materia}-${v.num}`}
                                                        className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                                                        style={{ background: `${c}10`, border: `1px solid ${c}33` }}
                                                    >
                                                        <span
                                                            className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black shrink-0 whitespace-nowrap"
                                                            style={{ background: `${c}22`, color: c }}
                                                        >
                                                            Tema {v.priorityOrder}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-white/80 shrink-0">
                                                            Pregunta {v.num}
                                                        </span>
                                                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                            <div className="h-full rounded-full" style={{ width: `${err}%`, background: c }} />
                                                        </div>
                                                        <span className="text-[11px] font-black tabular-nums shrink-0" style={{ color: c }}>
                                                            {err}%
                                                        </span>
                                                        <span
                                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap"
                                                            style={{ background: `${c}18`, color: c }}
                                                        >
                                                            {TOPIC_IMPORTANCE_META[v.importance].short}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* 2. Plan de estudio: competencia → acción en aula */}
                            {paso.competenciasMacro.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-indigo-300/80">
                                        Plan de estudio — temas y acciones
                                    </p>
                                    <ol className="space-y-2">
                                        {paso.competenciasMacro.map((comp, i) => (
                                            <li
                                                key={i}
                                                className="flex gap-2.5 rounded-lg p-2.5"
                                                style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
                                            >
                                                <span
                                                    className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-black shrink-0 mt-px"
                                                    style={{ background: 'rgba(99,102,241,0.25)', color: '#a5b4fc' }}
                                                >
                                                    {i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[12px] text-white/85 leading-snug">{comp}</p>
                                                    {paso.practicasAulaMacro[i] && (
                                                        <p className="text-[11px] text-teal-300/75 mt-1 leading-snug">
                                                            → {paso.practicasAulaMacro[i]}
                                                        </p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* 3. Ruta semanal */}
                            {paso.hitosTresSemanas.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-teal-300/80 flex items-center gap-1.5">
                                        <ClipboardList className="w-3 h-3 shrink-0" />
                                        Ruta semanal
                                    </p>
                                    <ol className="space-y-1.5">
                                        {paso.hitosTresSemanas.map((h, i) => (
                                            <li key={i} className="flex gap-2.5 text-[12px]">
                                                <span
                                                    className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-black shrink-0 mt-px"
                                                    style={{ background: 'rgba(20,184,166,0.22)', color: '#5eead4' }}
                                                >
                                                    {i + 1}
                                                </span>
                                                <span className="text-white/65 leading-snug">{h}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* 4. Cómo medir el avance */}
                            {paso.evidenciasSeguimiento.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-amber-300/80 flex items-center gap-1.5">
                                        <Target className="w-3 h-3 shrink-0" />
                                        Cómo verificar el avance
                                    </p>
                                    <ul className="space-y-1.5">
                                        {paso.evidenciasSeguimiento.map((e, i) => (
                                            <li key={i} className="flex gap-2 text-[12px]">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                                <span className="text-white/65 leading-snug">{e}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    );
                })()}
            </CoordinadorInsightModal>
        </div>
    );
}
