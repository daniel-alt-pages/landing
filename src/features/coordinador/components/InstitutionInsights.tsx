'use client';
import { useState } from 'react';
import {
    Lightbulb,
    TrendingUp,
    TrendingDown,
    BookOpen,
    Target,
    Info,
    ChevronRight,
    ClipboardList,
} from 'lucide-react';
import type {
    ExecutiveSummary,
    AreaInsight,
    PlanEstudioPaso,
} from '@features/coordinador/lib/executiveModel';
import CoordinadorInsightModal, {
    CoordInsightBulletList,
    CoordInsightCallout,
    CoordInsightHighlight,
    CoordInsightMethodology,
    CoordInsightSection,
} from '@features/coordinador/components/CoordinadorInsightModal';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { PrioritiesClearPanel } from '@features/coordinador/components/ui';

/**
 * Insights ejecutivos con priorización por áreas y plan de acción.
 */

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

export default function InstitutionInsights({
    summary,
}: {
    summary: ExecutiveSummary;
}) {
    const [modal, setModal] = useState<ModalState>(null);
    const hasPerformanceData =
        summary.totalEvaluados > 0 &&
        summary.allAreas.some((a) => Number(a.avg) > 0);

    return (
        <div data-coordinator-theme className="space-y-4" data-coord-tour={TourAnchors.dashboardInsights}>
            {/* Headline */}
            <div
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.04))',
                    border: '1px solid var(--coord-border)',
                }}
            >
                <div className="absolute top-0 left-0 right-0 h-[2px] coord-brand-stripe" />
                <div className="flex items-start gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                            background: 'rgba(99,102,241,0.18)',
                            border: '1px solid rgba(99,102,241,0.3)',
                        }}
                    >
                        <Lightbulb className="w-5 h-5" style={{ color: '#a5b4fc' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p
                                className="text-[10px] font-bold uppercase tracking-[3px]"
                                style={{ color: 'var(--coord-text-tertiary)' }}
                            >
                                Lectura ejecutiva
                            </p>
                            <button
                                type="button"
                                onClick={() => setModal({ type: 'executive' })}
                                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-colors hover:bg-white/10"
                                style={{ color: '#a5b4fc' }}
                            >
                                <Info className="w-3.5 h-3.5" />
                                Contexto y metodología
                            </button>
                        </div>
                        <h2
                            className="text-base md:text-lg font-extrabold leading-snug cursor-pointer hover:text-indigo-200/95 transition-colors"
                            style={{ color: 'var(--coord-text-primary)' }}
                            onClick={() => setModal({ type: 'executive' })}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setModal({ type: 'executive' });
                                }
                            }}
                        >
                            {summary.headline}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px]" style={{ color: 'var(--coord-text-secondary)' }}>
                            <span>
                                <span className="font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                                    Nivel:
                                </span>{' '}
                                {summary.nivelGeneral}
                            </span>
                            <span>
                                <span className="font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                                    Promedio:
                                </span>{' '}
                                {summary.avg}/500 ({summary.deltaNacional >= 0 ? '+' : ''}
                                {summary.deltaNacional} vs nacional)
                            </span>
                            <span>
                                <span className="font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                                    Aprobación:
                                </span>{' '}
                                {summary.tasaAprobacion}%
                            </span>
                            <span>
                                <span className="font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                                    En riesgo:
                                </span>{' '}
                                {summary.riesgoCount}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fortalezas + Debilidades */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="coord-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4" style={{ color: '#34d399' }} />
                        <h3 className="text-sm font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                            Fortalezas institucionales
                        </h3>
                    </div>
                    {summary.fortalezasContexto === 'intrains' ? (
                        <p className="text-[10px] mb-3 leading-relaxed" style={{ color: 'var(--coord-text-tertiary)' }}>
                            Ningún área iguala el referente nacional. Las tarjetas muestran las líneas con{' '}
                            <strong style={{ color: 'var(--coord-text-secondary)' }}>mayor promedio local</strong> en tu
                            institución (orden Institución 1 a Institución 3), datos del simulacro actual.
                        </p>
                    ) : null}
                    {summary.fortalezas.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--coord-text-tertiary)' }}>
                            No hay promedios por área suficientes para comparar fortalezas.
                        </p>
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
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingDown className="w-4 h-4" style={{ color: '#fb7185' }} />
                        <h3 className="text-sm font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                            Áreas a priorizar
                        </h3>
                    </div>
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

            {/* Plan de estudio + Recomendaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="coord-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-4 h-4" style={{ color: '#a5b4fc' }} />
                        <h3 className="text-sm font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                            Plan por área
                        </h3>
                    </div>
                    <p className="text-[10px] mb-3 leading-relaxed" style={{ color: 'var(--coord-text-tertiary)' }}>
                        Acciones por área según nivel de desempeño y brecha vs referente nacional.
                    </p>
                    {summary.planEstudioPasos.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--coord-text-tertiary)' }}>
                            {hasPerformanceData
                                ? 'Sin oportunidades críticas detectadas. Mantener trabajo actual.'
                                : 'No se puede construir plan: faltan puntajes válidos por área.'}
                        </p>
                    ) : (
                        <ol className="space-y-2.5">
                            {summary.planEstudioPasos.map(paso => {
                                const cortoResumen = (() => {
                                    const cut = paso.resumen.indexOf('): ');
                                    return cut >= 0 ? paso.resumen.slice(cut + 3).trim() : paso.resumen;
                                })();
                                return (
                                <li key={paso.areaKey}>
                                    <button
                                        type="button"
                                        onClick={() => setModal({ type: 'plan', paso })}
                                        className="flex gap-3 w-full text-left rounded-lg p-2 -m-2 hover:bg-white/[0.04] transition-colors group"
                                    >
                                        <span
                                            className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 group-hover:ring-1 group-hover:ring-indigo-400/40"
                                            style={{
                                                background: 'rgba(99,102,241,0.18)',
                                                color: '#a5b4fc',
                                            }}
                                        >
                                            {paso.orden}
                                        </span>
                                        <span
                                            className="text-[12px] leading-relaxed flex-1 min-w-0"
                                            style={{ color: 'var(--coord-text-secondary)' }}
                                        >
                                            <span className="font-medium" style={{ color: 'var(--coord-text-primary)' }}>
                                                {paso.areaNombre}
                                            </span>{' '}
                                            ({severityToTone[paso.severidad].label}) · {cortoResumen}
                                            {paso.documentoMacro && (
                                                <span className="block text-[10px] text-indigo-300/75 mt-1 font-semibold">
                                                    Marco ICFES ·{' '}
                                                    {paso.practicasAulaMacro.length} prácticas sugeridas
                                                </span>
                                            )}
                                            <span className="block text-[10px] text-indigo-300/80 mt-1 font-semibold">
                                                Detalle: marco ICFES + guía coordinación →
                                            </span>
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-white/25 shrink-0 mt-1 group-hover:text-white/50" />
                                    </button>
                                </li>
                            );
                            })}
                        </ol>
                    )}
                </div>

                <div className="coord-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-4 h-4" style={{ color: '#fbbf24' }} />
                        <h3 className="text-sm font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                            Recomendaciones para la institución
                        </h3>
                    </div>
                    {summary.recomendaciones.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--coord-text-tertiary)' }}>
                            Sin acciones prioritarias adicionales. Seguir monitoreo regular.
                        </p>
                    ) : (
                        <ul className="space-y-2.5">
                            {summary.recomendaciones.map((rec, i) => (
                                <li key={i} className="flex gap-2.5">
                                    <span
                                        className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                                        style={{ background: '#fbbf24' }}
                                    />
                                    <span
                                        className="text-[12px] leading-relaxed"
                                        style={{ color: 'var(--coord-text-secondary)' }}
                                    >
                                        {rec}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Modales */}
            <CoordinadorInsightModal
                open={modal?.type === 'executive'}
                onClose={() => setModal(null)}
                title="Contexto del resumen ejecutivo"
                subtitle={`${summary.institutionName} · Simulacro ${summary.simulationId}`}
                icon={Lightbulb}
                accent="indigo"
                size="lg"
            >
                <CoordInsightHighlight>{summary.headline}</CoordInsightHighlight>

                <CoordInsightSection title="Cómo leer este resumen" icon={Info} accent="cyan">
                    <CoordInsightBulletList>
                        <li>
                            Nivel general del grupo: <strong>{summary.nivelGeneral}</strong> (según franjas de puntaje
                            global ICFES humanizado).
                        </li>
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
                            La priorización de intervención usa la escala ICFES del puntaje global (Superior / Alto /
                            Medio / Bajo).
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
                                            Cruza esta área con los estudiantes en nivel Bajo y Medio para tutorías
                                            focalizadas por competencia.
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
                    return (
                        <>
                            {paso.nivelIcfes && (
                                <div
                                    className="rounded-lg px-3 py-2 text-[12px]"
                                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
                                >
                                    Nivel ICFES del área: <strong>{paso.nivelIcfes}</strong>
                                </div>
                            )}

                            {paso.competenciasMacro.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-indigo-300/80">
                                        Plan por competencias — acciones en aula
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
