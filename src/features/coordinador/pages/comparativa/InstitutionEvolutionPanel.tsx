'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronLeft,
    ChevronRight,
    HelpCircle,
    Maximize2,
    Minimize2,
    MonitorSmartphone,
    Search,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { getCoordinatorSummary } from '@features/simulacro/lib/firestoreService';
import { institutionsMatch } from '@shared/lib/institucionesAcondicionamiento';
import { NATIONAL_STATS } from '@features/benchmark/lib/nationalData';
import type { CoordinatorSimSummary, SimSnapshot } from '@features/coordinador/pages/historico/lib/snapshotHelpers';
import {
    DENSE_SERIES_THRESHOLD,
    EvolutionLineChart,
    InstitutionLogoMark,
    PanelModal,
    PanelStatus,
    buildSnapshotLookup,
    collectInstitutionKeys,
    institutionSeriesColor,
    type InstSeries,
    type PointDetail,
} from './institutionEvolutionUi';

const ZOOM_STEPS = [1, 1.25, 1.5, 1.75, 2] as const;

export default function InstitutionEvolutionPanel({
    myName,
    availableSimulations,
    currentSimulation,
}: {
    myName: string;
    availableSimulations: string[];
    currentSimulation: string;
}) {
    const [summary, setSummary] = useState<Record<string, CoordinatorSimSummary> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedInsts, setSelectedInsts] = useState<string[]>([]);
    const [selectedSims, setSelectedSims] = useState<string[]>([]);
    const [focusSim, setFocusSim] = useState(currentSimulation);
    const [bootstrapped, setBootstrapped] = useState(false);
    const [query, setQuery] = useState('');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerDraft, setPickerDraft] = useState<string[]>([]);
    const [pickerQuery, setPickerQuery] = useState('');
    const [pointDetail, setPointDetail] = useState<PointDetail | null>(null);
    const [listScope, setListScope] = useState<'selected' | 'all'>('all');
    const [helpOpen, setHelpOpen] = useState(false);
    const [chartFullscreen, setChartFullscreen] = useState(false);
    const [chartZoom, setChartZoom] = useState(1);
    const [chartYFit, setChartYFit] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = (await getCoordinatorSummary()) as Record<string, CoordinatorSimSummary>;
                if (!cancelled) setSummary(data || {});
            } catch (e) {
                if (!cancelled) setError('No se pudo cargar el histórico institucional.');
                console.warn('[InstitutionEvolutionPanel]', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const simIdsInSummary = useMemo(() => {
        if (!summary) return [];
        const fromAvail = availableSimulations.filter((id) => summary[id]?.institutions);
        return fromAvail.length > 0
            ? fromAvail
            : Object.keys(summary).filter((id) => summary[id]?.institutions);
    }, [summary, availableSimulations]);

    const institutionOptions = useMemo(() => {
        if (!summary) return [];
        return collectInstitutionKeys(summary, simIdsInSummary);
    }, [summary, simIdsInSummary]);

    const orderedInstitutions = useMemo(() => {
        const mine = institutionOptions.filter((n) => institutionsMatch(n, myName));
        const rest = institutionOptions.filter((n) => !institutionsMatch(n, myName));
        return [...mine, ...rest];
    }, [institutionOptions, myName]);

    const filteredInstitutions = useMemo(() => {
        const q = query.trim().toLowerCase();
        let base = orderedInstitutions;
        if (listScope === 'selected') {
            base = orderedInstitutions.filter((n) =>
                selectedInsts.some((p) => institutionsMatch(p, n)),
            );
        }
        // Seleccionadas primero (más útiles visibles); luego el resto.
        const selectedSet = selectedInsts;
        base = [...base].sort((a, b) => {
            const aOn = selectedSet.some((p) => institutionsMatch(p, a)) ? 0 : 1;
            const bOn = selectedSet.some((p) => institutionsMatch(p, b)) ? 0 : 1;
            if (aOn !== bOn) return aOn - bOn;
            const aMine = institutionsMatch(a, myName) ? 0 : 1;
            const bMine = institutionsMatch(b, myName) ? 0 : 1;
            if (aMine !== bMine) return aMine - bMine;
            return a.localeCompare(b, 'es');
        });
        if (!q) return base;
        return base.filter(
            (n) =>
                n.toLowerCase().includes(q) ||
                (institutionsMatch(n, myName) && ('tú'.includes(q) || 'tu'.includes(q))),
        );
    }, [orderedInstitutions, query, myName, listScope, selectedInsts]);

    const pickerFiltered = useMemo(() => {
        const q = pickerQuery.trim().toLowerCase();
        if (!q) return orderedInstitutions;
        return orderedInstitutions.filter(
            (n) =>
                n.toLowerCase().includes(q) ||
                (institutionsMatch(n, myName) && ('tú'.includes(q) || 'tu'.includes(q))),
        );
    }, [orderedInstitutions, pickerQuery, myName]);

    const snapshotLookup = useMemo(() => {
        if (!summary) return new Map<string, Map<string, SimSnapshot>>();
        return buildSnapshotLookup(summary, simIdsInSummary, institutionOptions);
    }, [summary, simIdsInSummary, institutionOptions]);

    useEffect(() => {
        if (!summary || bootstrapped || institutionOptions.length === 0 || simIdsInSummary.length === 0) {
            return;
        }
        const pivot = simIdsInSummary.includes(currentSimulation)
            ? currentSimulation
            : simIdsInSummary[simIdsInSummary.length - 1];
        const ranked = institutionOptions
            .map((name) => {
                const snap = snapshotLookup.get(name.toUpperCase())?.get(pivot);
                return { name, avg: Number(snap?.avg) || 0 };
            })
            .sort((a, b) => b.avg - a.avg);

        // Default UI: Top 6 + todos los simulacros + pestaña "En gráfica".
        const pick: string[] = [];
        const mine = institutionOptions.find((n) => institutionsMatch(n, myName));
        if (mine) pick.push(mine);
        for (const row of ranked) {
            if (pick.length >= 6) break;
            if (!pick.some((p) => institutionsMatch(p, row.name))) pick.push(row.name);
        }

        setSelectedInsts(pick);
        setSelectedSims([...simIdsInSummary]);
        setFocusSim(pivot);
        setListScope('selected');
        setChartZoom(1);
        setChartYFit(false);
        setBootstrapped(true);
    }, [
        summary,
        bootstrapped,
        institutionOptions,
        simIdsInSummary,
        currentSimulation,
        myName,
        snapshotLookup,
    ]);

    useEffect(() => {
        if (currentSimulation) setFocusSim(currentSimulation);
    }, [currentSimulation]);

    const series: InstSeries[] = useMemo(() => {
        return selectedInsts.map((name) => {
            const bucket = snapshotLookup.get(name.toUpperCase());
            return {
                name,
                color: institutionSeriesColor(name, selectedInsts),
                points: selectedSims.map((simId) => {
                    const snap = bucket?.get(simId);
                    return {
                        simId,
                        avg: Number(snap?.avg) || 0,
                        count: Number(snap?.count) || 0,
                    };
                }),
            };
        });
    }, [selectedInsts, selectedSims, snapshotLookup]);

    const toggleInst = (name: string) => {
        setSelectedInsts((prev) => {
            const on = prev.some((p) => institutionsMatch(p, name));
            if (on) return prev.filter((p) => !institutionsMatch(p, name));
            return [...prev, name];
        });
    };

    const toggleDraftInst = (name: string) => {
        setPickerDraft((prev) => {
            const on = prev.some((p) => institutionsMatch(p, name));
            if (on) return prev.filter((p) => !institutionsMatch(p, name));
            return [...prev, name];
        });
    };

    const closePicker = useCallback(() => setPickerOpen(false), []);
    const closePointDetail = useCallback(() => setPointDetail(null), []);
    const closeChartFullscreen = useCallback(() => setChartFullscreen(false), []);

    useEffect(() => {
        if (!chartFullscreen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !document.querySelector('[data-evolution-modal-root]')) {
                closeChartFullscreen();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [chartFullscreen, closeChartFullscreen]);

    const zoomIn = () => {
        setChartZoom((z) => {
            const i = ZOOM_STEPS.findIndex((s) => Math.abs(s - z) < 0.001);
            const idx = i < 0 ? 0 : i;
            return ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, idx + 1)] ?? z;
        });
    };
    const zoomOut = () => {
        setChartZoom((z) => {
            const i = ZOOM_STEPS.findIndex((s) => Math.abs(s - z) < 0.001);
            const idx = i < 0 ? 0 : i;
            return ZOOM_STEPS[Math.max(0, idx - 1)] ?? z;
        });
    };
    const resetZoom = () => {
        setChartZoom(1);
        setChartYFit(false);
    };

    const openPicker = () => {
        setPickerDraft([...selectedInsts]);
        setPickerQuery('');
        setPickerOpen(true);
    };

    const applyPicker = () => {
        setSelectedInsts([...pickerDraft]);
        setListScope('selected');
        setPickerOpen(false);
    };

    const selectAllDraft = () => setPickerDraft([...orderedInstitutions]);
    const clearDraft = () => {
        const mine = orderedInstitutions.find((n) => institutionsMatch(n, myName));
        setPickerDraft(mine ? [mine] : []);
    };

    const clearLive = () => {
        const mine = orderedInstitutions.find((n) => institutionsMatch(n, myName));
        setSelectedInsts(mine ? [mine] : []);
        setListScope('selected');
    };
    const selectRecommended = () => {
        const mine = orderedInstitutions.find((n) => institutionsMatch(n, myName));
        const ranked = orderedInstitutions
            .map((name) => ({
                name,
                avg: Number(snapshotLookup.get(name.toUpperCase())?.get(focusSim)?.avg) || 0,
            }))
            .sort((a, b) => b.avg - a.avg);
        const pick: string[] = [];
        if (mine) pick.push(mine);
        for (const row of ranked) {
            if (pick.length >= 6) break;
            if (!pick.some((p) => institutionsMatch(p, row.name))) pick.push(row.name);
        }
        setSelectedInsts(pick);
        setListScope('selected');
    };

    const toggleSim = (simId: string) => {
        setSelectedSims((prev) => {
            if (prev.includes(simId)) {
                if (prev.length <= 2) return prev;
                return prev.filter((s) => s !== simId);
            }
            return [...prev, simId].sort(
                (a, b) => simIdsInSummary.indexOf(a) - simIdsInSummary.indexOf(b),
            );
        });
        setFocusSim(simId);
    };

    const scrollTimeline = (dir: -1 | 1) => {
        const el = timelineRef.current;
        if (!el) return;
        const reduceMotion =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollBy({ left: dir * 180, behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    if (loading) {
        return <PanelStatus>Cargando evolución histórica de instituciones…</PanelStatus>;
    }
    if (error) {
        return <PanelStatus tone="error">{error}</PanelStatus>;
    }
    if (institutionOptions.length === 0 || simIdsInSummary.length < 2) {
        return (
            <PanelStatus>
                Se necesitan al menos 2 simulacros con instituciones en el resumen histórico.
            </PanelStatus>
        );
    }

    const last6 = simIdsInSummary.slice(-6);
    const last6Active =
        selectedSims.length === last6.length && last6.every((id) => selectedSims.includes(id));
    const allActive = selectedSims.length === simIdsInSummary.length;
    const nat = NATIONAL_STATS.global.mean;

    const isDense = selectedInsts.length > DENSE_SERIES_THRESHOLD;

    const renderInstRow = (
        name: string,
        selected: string[],
        onToggle: (name: string) => void,
    ) => {
        const on = selected.some((p) => institutionsMatch(p, name));
        const color = on ? institutionSeriesColor(name, selected) : undefined;
        const mine = institutionsMatch(name, myName);
        const score = on
            ? Number(snapshotLookup.get(name.toUpperCase())?.get(focusSim)?.avg) || 0
            : 0;
        return (
            <button
                key={name}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => onToggle(name)}
                title={name}
                className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors duration-150 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                style={{
                    background:
                        mine && on
                            ? 'rgba(167,139,250,0.14)'
                            : on
                              ? 'rgba(103,232,249,0.07)'
                              : 'transparent',
                    boxShadow: on && color ? `inset 3px 0 0 ${color}` : undefined,
                    opacity: on ? 1 : 0.72,
                }}
            >
                <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                    style={{
                        background: on && color ? color : 'transparent',
                        borderColor: on && color ? color : 'rgba(255,255,255,0.3)',
                    }}
                    aria-hidden
                >
                    {on ? <span className="block h-1 w-1 rounded-full bg-[#020617]" /> : null}
                </span>
                <InstitutionLogoMark name={name} color={color} size={36} />
                <span className="min-w-0 flex-1">
                    <span
                        className={`block truncate text-[11px] font-semibold leading-tight ${
                            mine ? 'text-violet-50' : 'text-white/90'
                        }`}
                    >
                        {mine ? <span className="mr-1 text-[9px] font-bold text-violet-200">TÚ ·</span> : null}
                        {name}
                    </span>
                </span>
                {on ? (
                    <span
                        className={`shrink-0 tabular-nums text-[12px] font-bold ${
                            score > 0
                                ? mine
                                    ? 'text-violet-100'
                                    : 'text-cyan-200'
                                : 'text-white/35'
                        }`}
                        title={`Promedio en ${focusSim || 'el simulacro enfocado'}`}
                    >
                        {score > 0 ? score.toFixed(0) : '—'}
                    </span>
                ) : null}
            </button>
        );
    };

    const institutionList = (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 space-y-2.5 border-b border-white/[0.06] p-3">
                <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[13px] font-semibold text-white">Colegios en la gráfica</h4>
                    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white/55">
                        {selectedInsts.length}/{orderedInstitutions.length}
                    </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={openPicker}
                        className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-400/10 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-50 transition-colors hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                    >
                        <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                        Elegir colegios
                    </button>
                    <button
                        type="button"
                        onClick={selectRecommended}
                        className="min-h-9 rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] font-semibold text-white/70 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                        title="Tu colegio + los 5 con mejor promedio en el simulacro enfocado"
                    >
                        Top 6
                    </button>
                    <button
                        type="button"
                        onClick={clearLive}
                        className="min-h-9 rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] font-semibold text-white/70 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                    >
                        Solo tú
                    </button>
                </div>
                <div
                    className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/25 p-0.5"
                    role="tablist"
                    aria-label="Filtro de lista"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={listScope === 'selected'}
                        onClick={() => setListScope('selected')}
                        className={`min-h-8 rounded-md text-[11px] font-semibold transition-colors ${
                            listScope === 'selected'
                                ? 'bg-white/10 text-white'
                                : 'text-white/45 hover:text-white/70'
                        }`}
                    >
                        En gráfica ({selectedInsts.length})
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={listScope === 'all'}
                        onClick={() => setListScope('all')}
                        className={`min-h-8 rounded-md text-[11px] font-semibold transition-colors ${
                            listScope === 'all'
                                ? 'bg-white/10 text-white'
                                : 'text-white/45 hover:text-white/70'
                        }`}
                    >
                        Catálogo ({orderedInstitutions.length})
                    </button>
                </div>
                <div className="relative">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                        aria-hidden
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar colegio…"
                        aria-label="Buscar colegio"
                        className="h-10 w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-10 pr-3 text-[13px] text-white placeholder:text-white/30 focus:border-cyan-500/45 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
                    />
                </div>
            </div>

            <div
                className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5"
                role="listbox"
                aria-label="Lista de colegios"
                aria-multiselectable="true"
            >
                {filteredInstitutions.length === 0 ? (
                    <p className="px-2 py-8 text-center text-[12px] text-white/45">
                        {listScope === 'selected'
                            ? 'Ningún colegio en la gráfica. Usa “Elegir colegios” o “Top 6”.'
                            : 'Sin coincidencias.'}
                    </p>
                ) : (
                    filteredInstitutions.map((name) => renderInstRow(name, selectedInsts, toggleInst))
                )}
            </div>

            <div className="shrink-0 space-y-2 border-t border-white/[0.08] bg-[#080e18]/80 p-3">
                <p className="text-[11px] leading-relaxed text-white/55">
                    El número a la derecha es el promedio en{' '}
                    <span className="font-semibold text-white/80">{focusSim || 'el simulacro marcado'}</span>
                    .
                </p>
                <button
                    type="button"
                    onClick={() => setHelpOpen(true)}
                    className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-semibold text-white/75 transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                >
                    <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                    ¿Cómo leer esta gráfica?
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.015]">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
                <div className="min-w-0 max-w-2xl">
                    <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                        Evolución por simulacro
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                        Compara el promedio de tu colegio con otros a lo largo del tiempo. La línea punteada es el
                        promedio nacional (~{nat.toFixed(0)} pts).
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setHelpOpen(true)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[12px] font-semibold text-white/70 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                    >
                        <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                        Ayuda
                    </button>
                    <button
                        type="button"
                        onClick={openPicker}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-[12px] font-semibold text-cyan-50 transition-colors hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                    >
                        <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                        Colegios ({selectedInsts.length})
                    </button>
                    <div
                        className="inline-flex items-center gap-0.5 rounded-lg border border-white/[0.1] bg-black/20 p-1"
                        role="group"
                        aria-label="Cuántos simulacros mostrar"
                    >
                        <button
                            type="button"
                            aria-pressed={last6Active}
                            onClick={() => setSelectedSims(simIdsInSummary.slice(-6))}
                            className={`min-h-9 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
                                last6Active
                                    ? 'bg-cyan-500/20 text-cyan-100'
                                    : 'text-white/45 hover:bg-white/[0.04] hover:text-white/70'
                            }`}
                        >
                            Últimos 6
                        </button>
                        <button
                            type="button"
                            aria-pressed={allActive}
                            onClick={() => setSelectedSims([...simIdsInSummary])}
                            className={`min-h-9 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
                                allActive
                                    ? 'bg-cyan-500/20 text-cyan-100'
                                    : 'text-white/45 hover:bg-white/[0.04] hover:text-white/70'
                            }`}
                        >
                            Todos
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-b border-cyan-300/15 bg-cyan-400/[0.08] px-4 py-3 md:hidden landscape:hidden">
                <div className="flex items-start gap-3 text-cyan-50">
                    <MonitorSmartphone className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden />
                    <p className="text-[13px] leading-relaxed">
                        Este panel se ve mejor en un computador o con el celular en posición horizontal.
                    </p>
                </div>
            </div>

            <div className="relative border-b border-white/[0.06] px-2 py-2.5 sm:px-3">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#0f141c] to-transparent sm:w-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#0f141c] to-transparent sm:w-10" />
                <button
                    type="button"
                    onClick={() => scrollTimeline(-1)}
                    className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/70 transition-colors hover:bg-black/75 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                    aria-label="Desplazar simulacros a la izquierda"
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                    type="button"
                    onClick={() => scrollTimeline(1)}
                    className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/70 transition-colors hover:bg-black/75 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                    aria-label="Desplazar simulacros a la derecha"
                >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
                <div
                    ref={timelineRef}
                    className="flex gap-1.5 overflow-x-auto px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    role="listbox"
                    aria-label="Simulacros en la línea de tiempo"
                    aria-multiselectable="true"
                >
                    {simIdsInSummary.map((simId) => {
                        const on = selectedSims.includes(simId);
                        const isFocus = focusSim === simId;
                        const isActual = simId === currentSimulation;
                        return (
                            <button
                                key={simId}
                                type="button"
                                role="option"
                                aria-selected={on}
                                aria-current={isFocus ? 'true' : undefined}
                                onClick={() => toggleSim(simId)}
                                className={`relative shrink-0 rounded-lg px-3 py-2 text-[12px] font-semibold whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/55 ${
                                    isFocus
                                        ? 'bg-cyan-500/20 text-cyan-50 ring-1 ring-cyan-300/50'
                                        : on
                                          ? 'bg-cyan-500/10 text-cyan-100 ring-1 ring-cyan-500/30'
                                          : 'bg-white/[0.03] text-white/40 ring-1 ring-white/10 hover:bg-white/[0.06] hover:text-white/65'
                                }`}
                            >
                                {simId}
                                {isActual ? (
                                    <span className="ml-1.5 rounded bg-cyan-400/25 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-cyan-100">
                                        Actual
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="border-b border-white/[0.06] px-3 py-2 lg:hidden">
                <button
                    type="button"
                    onClick={openPicker}
                    className="flex min-h-11 w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                >
                    <span className="text-[13px] font-semibold text-white">
                        Colegios en la gráfica
                        <span className="ml-2 font-normal text-white/40">
                            {selectedInsts.length} de {orderedInstitutions.length}
                        </span>
                    </span>
                    <span className="text-[12px] font-semibold text-cyan-200/80">Elegir</span>
                </button>
            </div>

            <div className="flex min-h-0 flex-col lg:flex-row lg:items-stretch">
                {/* Altura fija = gráfica; la lista hace scroll adentro (no estira la página). */}
                <aside className="hidden h-[min(640px,72vh)] max-h-[min(640px,72vh)] w-[340px] shrink-0 flex-col overflow-hidden border-r border-white/[0.06] lg:flex">
                    {institutionList}
                </aside>

                <div className="flex min-h-[300px] min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-4 lg:h-[min(640px,72vh)] lg:max-h-[min(640px,72vh)]">
                    {isDense ? (
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2.5">
                            <p className="max-w-xl text-[12px] leading-relaxed text-amber-50/95">
                                Estás viendo {selectedInsts.length} colegios a la vez. Para entender la comparación,
                                usa <strong className="font-semibold">Top 6</strong> (recomendado).
                            </p>
                            <button
                                type="button"
                                onClick={selectRecommended}
                                className="min-h-9 shrink-0 rounded-lg bg-amber-300/90 px-3 py-1.5 text-[12px] font-bold text-slate-950 transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-100/70"
                            >
                                Comparar Top 6
                            </button>
                        </div>
                    ) : null}
                    {selectedInsts.length === 0 || selectedSims.length < 2 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                            <p className="text-sm text-white/55">
                                Elige al menos 1 colegio y 2 simulacros para ver la evolución.
                            </p>
                            <button
                                type="button"
                                onClick={selectRecommended}
                                className="min-h-10 rounded-xl bg-cyan-400 px-4 py-2 text-[13px] font-bold text-slate-950 hover:bg-cyan-300"
                            >
                                Empezar con Top 6
                            </button>
                        </div>
                    ) : (
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <div
                                    className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1"
                                    role="group"
                                    aria-label="Zoom y vista de la gráfica"
                                >
                                    <button
                                        type="button"
                                        onClick={zoomOut}
                                        disabled={chartZoom <= ZOOM_STEPS[0]}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-white/[0.08] disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                                        aria-label="Alejar"
                                        title="Alejar"
                                    >
                                        <ZoomOut className="h-4 w-4" aria-hidden />
                                    </button>
                                    <span className="min-w-[3.25rem] text-center text-[12px] font-semibold tabular-nums text-white/80">
                                        {Math.round(chartZoom * 100)}%
                                    </span>
                                    <button
                                        type="button"
                                        onClick={zoomIn}
                                        disabled={chartZoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-white/[0.08] disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                                        aria-label="Acercar"
                                        title="Acercar"
                                    >
                                        <ZoomIn className="h-4 w-4" aria-hidden />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetZoom}
                                        className="min-h-9 rounded-lg px-2.5 text-[11px] font-semibold text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={chartYFit}
                                        onClick={() => setChartYFit((v) => !v)}
                                        className={`min-h-9 rounded-lg px-2.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
                                            chartYFit
                                                ? 'bg-cyan-400/20 text-cyan-50'
                                                : 'text-white/60 hover:bg-white/[0.08] hover:text-white/85'
                                        }`}
                                        title="Acerca el eje vertical al rango real de los puntajes"
                                    >
                                        Ajustar eje Y
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setChartFullscreen(true)}
                                    className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-[12px] font-semibold text-cyan-50 transition-colors hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                                >
                                    <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                                    Pantalla completa
                                </button>
                            </div>
                            <div className="flex min-h-0 flex-1 flex-col justify-start overflow-hidden">
                                <EvolutionLineChart
                                    simIds={selectedSims}
                                    series={series}
                                    selectedSim={focusSim}
                                    myName={myName}
                                    onSelectSim={setFocusSim}
                                    onPointDetail={setPointDetail}
                                    zoom={chartZoom}
                                    yFit={chartYFit}
                                    showHint={false}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {chartFullscreen && typeof document !== 'undefined'
                ? createPortal(
                      <div
                          className="fixed inset-0 z-[210] flex flex-col bg-[#020617]"
                          role="dialog"
                          aria-modal="true"
                          aria-label="Gráfica en pantalla completa"
                      >
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
                              <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/80">
                                      Vista ampliada
                                  </p>
                                  <h3 className="text-base font-semibold text-white sm:text-lg">
                                      Evolución por simulacro
                                  </h3>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                  <div
                                      className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1"
                                      role="group"
                                      aria-label="Zoom y vista"
                                  >
                                      <button
                                          type="button"
                                          onClick={zoomOut}
                                          disabled={chartZoom <= ZOOM_STEPS[0]}
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/[0.08] disabled:opacity-35"
                                          aria-label="Alejar"
                                      >
                                          <ZoomOut className="h-4 w-4" aria-hidden />
                                      </button>
                                      <span className="min-w-[3.25rem] text-center text-[12px] font-semibold tabular-nums text-white">
                                          {Math.round(chartZoom * 100)}%
                                      </span>
                                      <button
                                          type="button"
                                          onClick={zoomIn}
                                          disabled={chartZoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/[0.08] disabled:opacity-35"
                                          aria-label="Acercar"
                                      >
                                          <ZoomIn className="h-4 w-4" aria-hidden />
                                      </button>
                                      <button
                                          type="button"
                                          onClick={resetZoom}
                                          className="min-h-9 rounded-lg px-2.5 text-[11px] font-semibold text-white/65 hover:bg-white/[0.08]"
                                      >
                                          Reset
                                      </button>
                                      <button
                                          type="button"
                                          aria-pressed={chartYFit}
                                          onClick={() => setChartYFit((v) => !v)}
                                          className={`min-h-9 rounded-lg px-2.5 text-[11px] font-semibold ${
                                              chartYFit
                                                  ? 'bg-cyan-400/25 text-cyan-50'
                                                  : 'text-white/65 hover:bg-white/[0.08]'
                                          }`}
                                      >
                                          Ajustar eje Y
                                      </button>
                                  </div>
                                  <button
                                      type="button"
                                      onClick={closeChartFullscreen}
                                      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                                  >
                                      <Minimize2 className="h-4 w-4" aria-hidden />
                                      Salir
                                  </button>
                              </div>
                          </div>
                          <div className="min-h-0 flex-1 overflow-hidden p-4 sm:p-6">
                              <EvolutionLineChart
                                  simIds={selectedSims}
                                  series={series}
                                  selectedSim={focusSim}
                                  myName={myName}
                                  onSelectSim={setFocusSim}
                                  onPointDetail={setPointDetail}
                                  zoom={chartZoom}
                                  yFit={chartYFit}
                                  tall
                                  showHint
                              />
                          </div>
                          <p className="border-t border-white/10 px-4 py-2 text-center text-[11px] text-white/40">
                              Esc para salir · Zoom {Math.round(chartZoom * 100)}%
                              {chartYFit ? ' · eje Y ajustado a los datos' : ' · eje Y 0–500'}
                          </p>
                      </div>,
                      document.body,
                  )
                : null}

            <PanelModal
                open={pickerOpen}
                title="¿Qué colegios quieres comparar?"
                description="Marca los colegios que aparecerán como líneas en la gráfica. Recomendación: entre 4 y 8 para leerlo con claridad. Los cambios se aplican solo al pulsar “Ver en la gráfica”."
                onClose={closePicker}
                wide
                footer={
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold tabular-nums text-white">
                                {pickerDraft.length} colegio{pickerDraft.length === 1 ? '' : 's'} marcados
                            </p>
                            <p className="text-[11px] text-white/45">
                                {pickerDraft.length > DENSE_SERIES_THRESHOLD
                                    ? 'Atención: con tantos colegios la gráfica se vuelve difícil de leer'
                                    : 'Buena cantidad para comparar'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={closePicker}
                                className="min-h-11 rounded-xl border border-white/12 bg-white/[0.03] px-4 py-2 text-[13px] font-semibold text-white/75 transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={applyPicker}
                                className="min-h-11 rounded-xl bg-cyan-400 px-4 py-2 text-[13px] font-bold text-slate-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
                            >
                                Ver en la gráfica
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <ol className="grid gap-2 text-[12px] leading-relaxed text-white/60 sm:grid-cols-3">
                        <li className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                            <span className="font-semibold text-cyan-200">1.</span> Marca colegios
                        </li>
                        <li className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                            <span className="font-semibold text-cyan-200">2.</span> Revisa el conteo abajo
                        </li>
                        <li className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                            <span className="font-semibold text-cyan-200">3.</span> Pulsa “Ver en la gráfica”
                        </li>
                    </ol>
                    <div
                        className="inline-flex w-full flex-wrap gap-1 rounded-xl border border-white/10 bg-black/30 p-1"
                        role="group"
                        aria-label="Atajos de selección"
                    >
                        <button
                            type="button"
                            onClick={() => {
                                const mine = orderedInstitutions.find((n) => institutionsMatch(n, myName));
                                const ranked = orderedInstitutions
                                    .map((name) => ({
                                        name,
                                        avg:
                                            Number(
                                                snapshotLookup.get(name.toUpperCase())?.get(focusSim)?.avg,
                                            ) || 0,
                                    }))
                                    .sort((a, b) => b.avg - a.avg);
                                const pick: string[] = [];
                                if (mine) pick.push(mine);
                                for (const row of ranked) {
                                    if (pick.length >= 6) break;
                                    if (!pick.some((p) => institutionsMatch(p, row.name))) pick.push(row.name);
                                }
                                setPickerDraft(pick);
                            }}
                            className="min-h-10 flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                        >
                            Top 6 (recomendado)
                        </button>
                        <button
                            type="button"
                            onClick={clearDraft}
                            className="min-h-10 flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold text-white/70 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                        >
                            Solo mi colegio
                        </button>
                        <button
                            type="button"
                            onClick={selectAllDraft}
                            className="min-h-10 flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold text-white/70 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                        >
                            Todas ({orderedInstitutions.length})
                        </button>
                    </div>
                    <div className="relative">
                        <Search
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45"
                            aria-hidden
                        />
                        <input
                            type="search"
                            value={pickerQuery}
                            onChange={(e) => setPickerQuery(e.target.value)}
                            placeholder="Escribe el nombre del colegio…"
                            aria-label="Buscar colegio en el modal"
                            className="h-12 w-full rounded-xl border border-white/12 bg-[#050a14] py-2 pl-11 pr-3 text-[13px] text-white placeholder:text-white/35 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/25"
                        />
                    </div>
                    <div
                        className="min-h-[280px] space-y-0.5 rounded-xl border border-white/[0.1] bg-[#050a14]/80 p-1.5"
                        role="listbox"
                        aria-label="Catálogo de colegios"
                        aria-multiselectable="true"
                    >
                        {pickerFiltered.length === 0 ? (
                            <p className="px-2 py-12 text-center text-[13px] text-white/45">Sin coincidencias.</p>
                        ) : (
                            pickerFiltered.map((name) =>
                                renderInstRow(name, pickerDraft, toggleDraftInst),
                            )
                        )}
                    </div>
                </div>
            </PanelModal>

            <PanelModal
                open={!!pointDetail}
                title="Resultado de este simulacro"
                description="Así le fue a este colegio en el simulacro que elegiste."
                onClose={closePointDetail}
                footer={
                    <button
                        type="button"
                        onClick={closePointDetail}
                        className="min-h-11 w-full rounded-xl bg-cyan-400 px-4 py-2 text-[13px] font-bold text-slate-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
                    >
                        Entendido
                    </button>
                }
            >
                {pointDetail ? (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <InstitutionLogoMark
                                name={pointDetail.name}
                                color={pointDetail.color}
                                size={56}
                            />
                            <div className="min-w-0">
                                <p className="text-[15px] font-semibold break-words text-white">
                                    {pointDetail.mine ? 'Tu colegio · ' : ''}
                                    {pointDetail.name}
                                </p>
                                <p className="mt-1 text-[13px] text-white/55">
                                    Simulacro {pointDetail.simId}
                                </p>
                            </div>
                        </div>
                        <dl className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                                <dt className="text-[11px] font-medium text-white/50">Promedio del colegio</dt>
                                <dd className="mt-1 text-2xl font-black tabular-nums text-cyan-100">
                                    {pointDetail.avg.toFixed(0)}
                                    <span className="ml-1 text-sm font-semibold text-white/40">/ 500</span>
                                </dd>
                            </div>
                            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                                <dt className="text-[11px] font-medium text-white/50">Estudiantes que presentaron</dt>
                                <dd className="mt-1 text-2xl font-black tabular-nums text-white">
                                    {pointDetail.count > 0 ? pointDetail.count : '—'}
                                </dd>
                            </div>
                            <div className="col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                                <dt className="text-[11px] font-medium text-white/50">
                                    Frente al promedio nacional ({nat.toFixed(0)} pts)
                                </dt>
                                <dd
                                    className={`mt-1 text-xl font-black tabular-nums ${
                                        pointDetail.avg - nat >= 0 ? 'text-emerald-300' : 'text-rose-300'
                                    }`}
                                >
                                    {pointDetail.avg - nat >= 0
                                        ? `${(pointDetail.avg - nat).toFixed(0)} puntos por encima`
                                        : `${Math.abs(pointDetail.avg - nat).toFixed(0)} puntos por debajo`}
                                </dd>
                            </div>
                        </dl>
                    </div>
                ) : null}
            </PanelModal>

            <PanelModal
                open={helpOpen}
                title="Cómo leer esta gráfica"
                description="Guía rápida para coordinadores. Sin tecnicismos."
                onClose={() => setHelpOpen(false)}
                footer={
                    <button
                        type="button"
                        onClick={() => setHelpOpen(false)}
                        className="min-h-11 w-full rounded-xl bg-cyan-400 px-4 py-2 text-[13px] font-bold text-slate-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
                    >
                        Ya entendí
                    </button>
                }
            >
                <div className="space-y-4 text-[13px] leading-relaxed text-white/70">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="font-semibold text-white">1. Qué muestra</p>
                        <p className="mt-1">
                            El promedio global (de 0 a 500) de cada colegio en varios simulacros. Cada línea de color
                            es un colegio distinto.
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="font-semibold text-white">2. Línea punteada</p>
                        <p className="mt-1">
                            Es el promedio nacional ICFES (~{nat.toFixed(0)}). Si tu línea está arriba, vas mejor que
                            el país; si está abajo, hay que reforzar.
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="font-semibold text-white">3. Botones de arriba (SG11-…)</p>
                        <p className="mt-1">
                            Eligen qué simulacros entran en el eje horizontal. “Últimos 6” suele ser lo más útil.
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="font-semibold text-white">4. Lista de colegios</p>
                        <p className="mt-1">
                            Marca o desmarca colegios. El número a la derecha es el promedio en el simulacro
                            resaltado (banda cyan). Usa <strong className="text-white">Top 6</strong> si la gráfica
                            se ve saturada.
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="font-semibold text-white">5. Clic en un punto</p>
                        <p className="mt-1">
                            Abre el detalle: promedio, cuántos estudiantes presentaron y si estánaron o no el
                            nacional.
                        </p>
                    </div>
                </div>
            </PanelModal>
        </div>
    );
}
