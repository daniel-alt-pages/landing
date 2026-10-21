'use client';



import { useMemo, useState } from 'react';

import {

    ChevronDown,

    Target,

    BookOpen,

    AlertOctagon,

    Info,

    Gauge,

    Layers,
    Check,
    Circle,
} from 'lucide-react';

import type { AreaDiagnostico } from '@features/coordinador/lib/referencePerformanceDependencies';
import type { PlanEstudioPaso } from '@features/coordinador/lib/executiveModel';

import { METODOLOGIA_DOMINIO_ICFES } from '@features/coordinador/lib/referencePerformanceDependencies';

import {
    estadoDominioArea,
    estadoDominioDesdePct,
    flattenUrgentCompetencies,
    labelPrioridadCompetencia,
    PRIORIDAD_COMPETENCIA_TITLE,
} from '@features/coordinador/lib/competencyDominanceStats';

import type { DominioEstado } from '@features/coordinador/lib/competencyDominanceStats';

import CoordCard from '@features/coordinador/components/ui/CoordCard';

import SectionHeader from '@features/coordinador/components/ui/SectionHeader';

import CoordinatorPerformanceAreaNav, {
    usePerformanceAreaSelection,
} from '@features/coordinador/components/CoordinatorPerformanceAreaNav';

import {

    GlowBar,

    DominioRing,

    EstadoDominioBadge,

    CoordMiniKpi,

    ESTADO_DOMINIO_UI,
    NIVEL_ICFES_UI,

} from '@features/coordinador/components/ui/coordVisualPrimitives';



function formatPts(n: number): string {

    const r = Math.round(n * 10) / 10;

    return Number.isInteger(r) ? String(r) : r.toFixed(1);

}



const AREA_COLORS: Record<string, string> = {

    'Matemáticas': '#8b5cf6',

    'Lectura Crítica': '#f59e0b',

    Sociales: '#10b981',

    Ciencias: '#06b6d4',

    Inglés: '#ec4899',

};



/** Anillo = puntaje en escala 0–100 del área (no % del tramo del nivel). */
function AreaScoreRing({ puntaje, color, size = 64 }: { puntaje: number; color: string; size?: number }) {
    const r = (size - 8) / 2;
    const c = 2 * Math.PI * r;
    const globalPct = Math.min(100, Math.max(0, puntaje));
    const offset = c - (globalPct / 100) * c;
    const center = Math.round(puntaje);
    return (
        <div
            className="relative shrink-0"
            style={{ width: size, height: size }}
            title={`Puntaje área: ${formatPts(puntaje)} / 100`}
            aria-label={`Puntaje ${center} de 100 en la escala del área`}
        >
            <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={5}
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
                />
            </svg>
            <span
                className="absolute inset-0 flex flex-col items-center justify-center font-black tabular-nums text-white leading-none"
                style={{ color }}
            >
                <span className="text-sm">{center}</span>
                <span className="text-[8px] font-bold text-white/45 mt-0.5">/100</span>
            </span>
        </div>
    );
}

/** Barra calibrada: escala 0–100 con tramo del nivel resaltado + marcador de puntaje real. */
function EscalaAreaConTramo({
    min,
    max,
    puntaje,
    progresoTramoPct,
    nivelEtiqueta,
    color,
}: {
    min: number;
    max: number;
    puntaje: number;
    progresoTramoPct: number;
    nivelEtiqueta: string;
    color: string;
}) {
    const posGlobal = Math.min(100, Math.max(0, puntaje));
    const bandStart = Math.min(100, Math.max(0, min));
    const bandEnd = Math.min(100, Math.max(bandStart, max));
    const bandWidth = Math.max(0, bandEnd - bandStart);

    return (
        <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                Escala del área (0–100)
            </p>
            <div className="flex justify-between text-[10px] font-bold tabular-nums text-white/40">
                <span>0</span>
                <span className="text-white/70">{formatPts(puntaje)} pts</span>
                <span>100</span>
            </div>
            <div
                className="relative h-3 rounded-full bg-white/[0.06] overflow-visible"
                role="img"
                aria-label={`Puntaje ${formatPts(puntaje)} en escala 0 a 100; nivel ${nivelEtiqueta} entre ${min} y ${max}`}
            >
                <div
                    className="absolute inset-y-0 rounded-full"
                    style={{
                        left: `${bandStart}%`,
                        width: `${bandWidth}%`,
                        background: `${color}20`,
                        border: `1px solid ${color}55`,
                    }}
                    title={`Tramo ${nivelEtiqueta}: ${min}–${max}`}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg z-10"
                    style={{
                        left: `calc(${posGlobal}% - 7px)`,
                        background: color,
                    }}
                />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10px] text-white/50">
                <span>
                    <strong className="text-white/75">{nivelEtiqueta}</strong> ({min}–{max})
                </span>
                <span title="Porcentaje solo dentro del tramo del nivel, no sobre 0–100">
                    En el tramo: <strong className="text-white/70">{progresoTramoPct}%</strong>
                </span>
            </div>
        </div>
    );
}



function HabilidadesNivelBlock({ diag }: { diag: AreaDiagnostico }) {
    const delNivel = diag.habilidadesNivel.filter(h => h.nivel === diag.nivel);
    const previas = diag.habilidadesNivel.filter(h => h.nivel < diag.nivel);
    const futuras = diag.habilidadesNivel.filter(h => h.nivel > diag.nivel);

    return (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" aria-hidden />
                Habilidades del nivel de desempeño ({diag.nivelEtiqueta})
            </p>
            {delNivel.length > 0 ? (
                <ul className="space-y-1.5">
                    {delNivel.map(h => (
                        <li key={h.nombre} className="flex items-start gap-2 text-xs text-white/75">
                            {h.alcanzada ? (
                                <Check className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden />
                            ) : (
                                <Circle className="w-4 h-4 shrink-0 text-white/25" aria-hidden />
                            )}
                            <span className={h.alcanzada ? '' : 'text-white/45'}>{h.nombre}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-white/45">Sin listado granular para este nivel en el catálogo.</p>
            )}
            {previas.length > 0 && (
                <p className="text-[10px] text-emerald-400/90">
                    {previas.filter(h => h.alcanzada).length} habilidades de niveles anteriores ya alcanzadas.
                </p>
            )}
            {futuras.length > 0 && (
                <p className="text-[10px] text-white/40">
                    {futuras.length} habilidades de niveles superiores pendientes (meta al subir de nivel).
                </p>
            )}
        </div>
    );
}

function HabilidadRow({
    nombre,
    dominioPct,
    estado,
    nivelReferencia,
    brecha,
}: {
    nombre: string;
    dominioPct: number;
    estado: string;
    nivelReferencia: number;
    brecha: number;
}) {

    const cfg = ESTADO_DOMINIO_UI[estado as DominioEstado] ?? ESTADO_DOMINIO_UI.en_desarrollo;

    return (

        <div

            className="rounded-xl px-3 py-3 space-y-2 transition-colors hover:bg-white/[0.02]"

            style={{

                background: `linear-gradient(135deg, ${cfg.color}08, transparent)`,

                border: `1px solid ${cfg.color}22`,

                borderLeft: `3px solid ${cfg.color}`,

            }}

        >

            <div className="flex items-start justify-between gap-2">

                <p className="text-xs coord-text-body leading-snug flex-1">{nombre}</p>

                <span className="text-sm font-black tabular-nums shrink-0" style={{ color: cfg.color }}>

                    {dominioPct}%

                </span>

            </div>

            <GlowBar pctVal={dominioPct} color={cfg.color} height={6} />

            <p className="text-[10px] coord-text-muted">
                Evidencia esperada desde {nivelReferencia}
                {brecha > 0 ? ` · brecha ${brecha}` : ' · cubierta por habilidades de nivel'}
            </p>

        </div>

    );

}



function CompetenciaCard({

    comp,

    areaColor,

}: {

    comp: AreaDiagnostico['competencias'][number];

    areaColor: string;

}) {

    const cfg = ESTADO_DOMINIO_UI[comp.estado];



    return (

        <div

            className="rounded-xl overflow-hidden transition-transform hover:scale-[1.005] motion-reduce:transform-none"

            style={{

                background: `linear-gradient(135deg, ${cfg.color}0c, transparent)`,

                border: `1px solid ${cfg.color}35`,

                boxShadow: `0 4px 24px ${cfg.color}12, inset 0 1px 0 rgba(255,255,255,0.04)`,

                borderLeft: `3px solid ${cfg.color}`,

            }}

        >

            <div className="p-4 space-y-4">

                <div className="flex flex-wrap items-start gap-4">

                    <DominioRing

                        pct={comp.dominioPct}

                        color={cfg.color}

                        size={56}

                        centerLabel={

                            <span style={{ color: cfg.color }}>{comp.dominioPct}</span>

                        }

                    />

                    <div className="flex-1 min-w-0 space-y-2">

                        <div className="flex flex-wrap items-center gap-2">

                            <span

                                className="text-[10px] font-bold px-2.5 py-0.5 rounded-md tabular-nums tracking-wide"

                                title={PRIORIDAD_COMPETENCIA_TITLE}

                                style={{

                                    background: `linear-gradient(135deg, ${areaColor}22, ${areaColor}11)`,

                                    color: areaColor,

                                    border: `1px solid ${areaColor}44`,

                                }}

                            >

                                {labelPrioridadCompetencia(comp.prioridad)}

                            </span>

                            <EstadoDominioBadge estado={comp.estado} />

                        </div>

                        <p className="text-sm font-bold coord-text-head leading-tight tracking-tight">

                            {comp.competenciaNombre}

                        </p>

                        {comp.afirmacion ? (

                            <p className="text-[11px] coord-text-muted leading-snug line-clamp-2 italic">

                                {comp.afirmacion}

                            </p>

                        ) : null}

                        <p className="text-xs coord-text-body leading-relaxed">{comp.interpretacion}</p>

                    </div>

                </div>



                <div className="grid gap-2 sm:grid-cols-2">

                    {comp.habilidadesDetalle.map(h => (

                        <HabilidadRow
                            key={h.nombre}
                            nombre={h.nombre}
                            dominioPct={h.dominioPct}
                            estado={h.estado}
                            nivelReferencia={h.nivelReferencia}
                            brecha={h.brechaRangoPct}
                        />

                    ))}

                </div>

            </div>

        </div>

    );

}


function RutaNivelacionBlock({
    paso,
    areaColor,
}: {
    paso?: PlanEstudioPaso;
    areaColor: string;
}) {
    if (!paso) return null;

    const acciones = paso.microAcciones.slice(0, 5);
    const hitos = paso.hitosTresSemanas.slice(0, 4);
    const indicadores = paso.indicadoresInstitucion.slice(0, 4);

    return (
        <div
            className="rounded-xl border p-4 space-y-4"
            style={{
                borderColor: `${areaColor}35`,
                background: `linear-gradient(135deg, ${areaColor}10, rgba(255,255,255,0.02))`,
                boxShadow: `0 0 18px ${areaColor}12`,
            }}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                        Ruta integrada de nivelación
                    </p>
                    <p className="mt-1 text-sm font-bold text-white">{paso.areaNombre}</p>
                    <p className="mt-1 text-xs text-white/60 leading-relaxed">{paso.resumen}</p>
                </div>
                <span
                    className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{
                        color: areaColor,
                        border: `1px solid ${areaColor}44`,
                        background: `${areaColor}16`,
                    }}
                >
                    Fuente: niveles ICFES
                </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
                {acciones.length > 0 && (
                    <div className="rounded-lg border border-white/[0.06] bg-black/15 p-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/45">
                            Acciones
                        </p>
                        <ul className="space-y-1.5">
                            {acciones.map((a, i) => (
                                <li key={i} className="text-xs text-white/75 leading-relaxed">
                                    {a}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {hitos.length > 0 && (
                    <div className="rounded-lg border border-white/[0.06] bg-black/15 p-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/45">
                            Hitos 3 semanas
                        </p>
                        <ul className="space-y-1.5">
                            {hitos.map((h, i) => (
                                <li key={i} className="text-xs text-white/75 leading-relaxed">
                                    {h}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {indicadores.length > 0 && (
                    <div className="rounded-lg border border-white/[0.06] bg-black/15 p-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/45">
                            Indicadores
                        </p>
                        <ul className="space-y-1.5">
                            {indicadores.map((x, i) => (
                                <li key={i} className="text-xs text-white/75 leading-relaxed">
                                    {x}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}



function AreaSection({
    diag,
    defaultOpen,
    planPaso,
}: {
    diag: AreaDiagnostico;
    defaultOpen?: boolean;
    planPaso?: PlanEstudioPaso;
}) {
    const [open, setOpen] = useState(defaultOpen ?? false);
    const areaTint = AREA_COLORS[diag.areaNombre] ?? '#818cf8';
    const estadoArea = estadoDominioArea(
        diag.nivel,
        diag.progresoEnRangoPct,
        diag.competencias
    );
    const domCfg = ESTADO_DOMINIO_UI[estadoArea];
    const nivelCfg = NIVEL_ICFES_UI[diag.nivel];

    return (
        <section
            className="rounded-2xl overflow-hidden border bg-[#0c101c]/90 backdrop-blur-sm shadow-xl shadow-black/20"
            style={{
                borderColor: `${domCfg.color}40`,
                boxShadow: `0 8px 32px ${domCfg.color}12`,
            }}
        >
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full text-left p-5 md:p-6 hover:bg-white/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 min-h-[44px]"
                aria-expanded={open}
            >
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <AreaScoreRing puntaje={diag.puntaje} color={domCfg.color} size={64} />
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ background: areaTint, boxShadow: `0 0 8px ${areaTint}` }}
                                        aria-hidden
                                    />
                                    {diag.areaNombre}
                                </h3>
                                <span
                                    className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                    style={{
                                        color: nivelCfg.color,
                                        border: `1px solid ${nivelCfg.color}55`,
                                        background: `linear-gradient(135deg, ${nivelCfg.from}, ${nivelCfg.to})`,
                                    }}
                                >
                                    {diag.nivelEtiqueta}
                                </span>
                                <EstadoDominioBadge estado={estadoArea} />
                            </div>
                            <p className="text-xs text-white/55 leading-relaxed line-clamp-2">
                                {diag.interpretacionPosicion}
                            </p>
                            {diag.descriptorNivel ? (
                                <p className="text-[11px] text-white/40 mt-1 leading-snug line-clamp-2">
                                    {diag.descriptorNivel}
                                </p>
                            ) : null}
                            {diag.puntosParaSiguienteNivel != null && (
                                <p className="text-[11px] text-cyan-300/90 mt-1 font-medium">
                                    +{formatPts(diag.puntosParaSiguienteNivel)} pts → {diag.etiquetaSiguienteNivel}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="lg:w-72 shrink-0">
                        <EscalaAreaConTramo
                            min={diag.rangoMin}
                            max={diag.rangoMax}
                            puntaje={diag.puntaje}
                            progresoTramoPct={diag.progresoEnRangoPct}
                            nivelEtiqueta={diag.nivelEtiqueta}
                            color={domCfg.color}
                        />
                    </div>
                    <ChevronDown
                        className={`w-5 h-5 text-white/40 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
                        aria-hidden
                    />
                </div>
            </button>

            {open && (
                <div className="px-5 md:px-6 pb-6 pt-0 border-t border-white/[0.06] space-y-4">
                    <RutaNivelacionBlock paso={planPaso} areaColor={areaTint} />
                    <HabilidadesNivelBlock diag={diag} />
                    {diag.competencias.map(c => (
                        <CompetenciaCard key={c.competenciaId} comp={c} areaColor={areaTint} />
                    ))}
                    {diag.accionesSugeridas.length > 0 && (
                        <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-2 flex items-center gap-1.5">
                                <Gauge className="w-3.5 h-3.5" aria-hidden />
                                Plan de acción (por prioridad estadística)
                            </p>
                            <ol className="space-y-2 list-decimal list-inside">
                                {diag.accionesSugeridas.map((a, i) => (
                                    <li key={i} className="text-xs text-white/75 leading-relaxed">
                                        {a}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}



export interface CompetenciasDiagnosticoPanelProps {
    diagnosticos: AreaDiagnostico[];
    planEstudioPasos?: PlanEstudioPaso[];
    variant?: 'institucional' | 'estudiante';
    compact?: boolean;
    /** Tarjetas por área arriba; KPIs y prioridades debajo (diseño preferido). */
    areasHero?: boolean;
}



export default function CompetenciasDiagnosticoPanel({
    diagnosticos,
    planEstudioPasos = [],
    variant = 'institucional',
    compact = false,
    areasHero = false,
}: CompetenciasDiagnosticoPanelProps) {

    const [showMetodo, setShowMetodo] = useState(false);



    const urgentes = useMemo(

        () =>

            flattenUrgentCompetencies(

                diagnosticos.map(d => ({ areaNombre: d.areaNombre, competencias: d.competencias }))

            ),

        [diagnosticos]

    );



    const resumen = useMemo(() => {

        let competencias = 0;

        let dominioSum = 0;

        for (const d of diagnosticos) {

            for (const c of d.competencias) {

                competencias += 1;

                dominioSum += c.dominioPct;

            }

        }

        const dominioMedio = competencias > 0 ? Math.round(dominioSum / competencias) : 0;

        return { areas: diagnosticos.length, competencias, dominioMedio, urgentes: urgentes.length };

    }, [diagnosticos, urgentes.length]);

    const planByArea = useMemo(
        () => new Map(planEstudioPasos.map(p => [p.areaNombre, p])),
        [planEstudioPasos]
    );

    const areaNavItems = useMemo(
        () => diagnosticos.map((d) => ({ key: d.areaNombre, label: d.areaNombre })),
        [diagnosticos],
    );

    const { activeKey: activeArea, setActiveKey: setActiveArea } =
        usePerformanceAreaSelection(areaNavItems);

    const diagnosticosVisibles = useMemo(
        () => diagnosticos.filter((d) => d.areaNombre === activeArea),
        [diagnosticos, activeArea],
    );

    const areaNav = (
        <CoordinatorPerformanceAreaNav
            items={areaNavItems}
            activeKey={activeArea}
            onSelect={setActiveArea}
            layout="header"
            label="Área ICFES"
        />
    );



    if (diagnosticos.length === 0) {

        return (

            <CoordCard stripe="indigo">

                <div className="py-10 text-center">

                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30 coord-text-muted" aria-hidden />

                    <p className="text-sm coord-text-muted">Sin puntajes por área para generar diagnóstico ICFES.</p>

                </div>

            </CoordCard>

        );

    }



    const areaList = (
        <div className="space-y-4">
            {diagnosticosVisibles.map((d) => (
                <AreaSection
                    key={d.areaNombre}
                    diag={d}
                    planPaso={planByArea.get(d.areaNombre)}
                    defaultOpen={!compact}
                />
            ))}
        </div>
    );

    const chromeBlock = (
        <>
            <CoordCard stripe="indigo">

                <SectionHeader

                    title="Dominio por competencias · marco ICFES"

                    description={

                        variant === 'institucional'

                            ? 'El nivel ICFES sale del puntaje; las habilidades de nivel son checklist del documento; las competencias miden cobertura del marco con esas evidencias.'

                            : 'Tu puntaje ubica el nivel; el dominio por habilidad depende de cuánto avanzaste en ese tramo.'

                    }

                    accent="var(--coord-accent)"

                    icon={<Target size={16} />}

                    right={

                        <button

                            type="button"

                            onClick={() => setShowMetodo(v => !v)}

                            className="inline-flex items-center gap-2 text-xs font-bold min-h-[44px] px-3 rounded-lg transition-colors"

                            style={{

                                color: 'var(--coord-accent)',

                                border: '1px solid color-mix(in srgb, var(--coord-accent) 40%, transparent)',

                                background: 'color-mix(in srgb, var(--coord-accent) 12%, transparent)',

                            }}

                        >

                            <Info className="w-4 h-4" aria-hidden />

                            {showMetodo ? 'Ocultar criterio' : 'Ver criterio'}

                        </button>

                    }

                />



                {!compact && (

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">

                        <CoordMiniKpi label="Áreas" value={resumen.areas} color="#8b5cf6" />

                        <CoordMiniKpi

                            label="Competencias"

                            value={resumen.competencias}

                            color="#60a5fa"

                        />

                        <CoordMiniKpi
                            label="Dominio medio"
                            value={`${resumen.dominioMedio}%`}
                            sub="promedio estimado del marco"
                            color={
                                ESTADO_DOMINIO_UI[estadoDominioDesdePct(resumen.dominioMedio)].color
                            }
                        />

                        <CoordMiniKpi

                            label="Prioridad alta"

                            value={resumen.urgentes}

                            sub="urgente o por reforzar"

                            color={
                                resumen.urgentes > 0
                                    ? ESTADO_DOMINIO_UI.urgente.color
                                    : ESTADO_DOMINIO_UI.dominada.color
                            }

                        />

                    </div>

                )}



                {showMetodo && (
                    <>
                    <div className="mt-5 pt-4 border-t flex flex-wrap gap-2" style={{ borderColor: 'var(--coord-border)' }}>
                        {(Object.keys(ESTADO_DOMINIO_UI) as DominioEstado[]).map(est => (
                            <EstadoDominioBadge key={est} estado={est} />
                        ))}
                    </div>
                    <ul

                        className="mt-3 space-y-2"

                    >

                        {METODOLOGIA_DOMINIO_ICFES.map((line, i) => (

                            <li key={i} className="text-xs coord-text-body leading-relaxed flex gap-2">

                                <span

                                    className="font-black shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px]"

                                    style={{

                                        background: 'color-mix(in srgb, var(--coord-accent) 18%, transparent)',

                                        color: 'var(--coord-accent)',

                                    }}

                                >

                                    {i + 1}

                                </span>

                                {line}

                            </li>

                        ))}

                    </ul>
                    </>
                )}

            </CoordCard>



            {!compact && urgentes.length > 0 && (

                <CoordCard stripe="rose" padding="md">

                    <SectionHeader

                        title="Prioridad institucional"

                        description="Competencias que requieren intervención antes en el plan de estudio."

                        accent="#fb7185"

                        icon={<AlertOctagon size={16} />}

                    />

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 mt-4">

                        {urgentes.map(u => {

                            const cfg = ESTADO_DOMINIO_UI[u.estado];

                            return (

                                <div

                                    key={`${u.area}-${u.competenciaId}`}

                                    className="rounded-xl px-3 py-3 flex items-center gap-3 transition-transform hover:scale-[1.02] motion-reduce:transform-none"

                                    style={{

                                        background: `linear-gradient(135deg, ${cfg.color}12, transparent)`,

                                        border: `1px solid ${cfg.color}40`,

                                        boxShadow: `0 0 20px ${cfg.color}15`,

                                    }}

                                >

                                    <DominioRing

                                        pct={u.dominioPct}

                                        color={cfg.color}

                                        size={48}

                                        centerLabel={

                                            <span className="text-[10px]" style={{ color: cfg.color }}>

                                                {u.dominioPct}

                                            </span>

                                        }

                                    />

                                    <div className="min-w-0 flex-1">

                                        <p className="text-[10px] font-bold uppercase tracking-wider coord-text-muted">

                                            {u.area}

                                        </p>

                                        <p className="text-xs font-semibold coord-text-head truncate">

                                            {u.competenciaNombre}

                                        </p>

                                    </div>

                                    <span
                                        className="text-[10px] font-semibold tabular-nums coord-text-muted shrink-0 text-right"
                                        title={PRIORIDAD_COMPETENCIA_TITLE}
                                    >
                                        {labelPrioridadCompetencia(u.prioridad)}
                                    </span>

                                </div>

                            );

                        })}

                    </div>

                </CoordCard>

            )}
        </>
    );

    if (areasHero) {
        return (
            <div className="space-y-5">
                {areaNav}
                {areaList}
                {!compact && (
                    <details className="group rounded-2xl border border-white/[0.08] bg-[#0c101c]/60 overflow-hidden">
                        <summary className="cursor-pointer list-none px-5 py-3.5 flex items-center justify-between gap-2 text-sm font-semibold text-white/70 hover:bg-white/[0.02] min-h-[44px]">
                            <span className="flex items-center gap-2">
                                <Layers className="w-4 h-4" aria-hidden />
                                Métricas, prioridades y criterio estadístico
                            </span>
                            <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                        </summary>
                        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-white/[0.06]">{chromeBlock}</div>
                    </details>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {areaNav}
            {chromeBlock}
            <div className="flex items-center gap-2 px-1">
                <Layers className="w-4 h-4 coord-text-muted" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-widest coord-text-muted">
                    Detalle del área seleccionada
                </p>
            </div>
            {areaList}
        </div>
    );
}

