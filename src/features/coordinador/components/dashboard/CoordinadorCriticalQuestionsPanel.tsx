'use client';

import React, { useMemo } from 'react';
import { Activity, AlertTriangle, ChevronDown, Filter, Flame, Gauge, Layers3, Shield, Users } from 'lucide-react';
import type { QuestionStat } from '@features/coordinador/hooks/useCoordinadorData';
import type { Estudiante } from '@shared/types';
import { useUrlQueryState } from '@shared/hooks/useUrlQueryState';
import { questionLabel } from '@/lib/questionLabel';
import { icfesAreaStyle } from '@features/coordinador/lib/icfesAreaColors';
import HorizontalScrollPanel from '@features/coordinador/components/ui/HorizontalScrollPanel';
import CoordStitchSelect, { type CoordStitchSelectOption } from '@features/coordinador/components/ui/CoordStitchSelect';
import { formatAreaDisplayName } from '@features/coordinador/lib/analisis/materias';
import { resolveQuestionLetters } from '@features/coordinador/lib/answerOptions';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { PremiumMetricTile } from '@shared/components/premium';

const DEFAULT_LETTERS = ['A', 'B', 'C', 'D'] as const;

/** Separadores verticales entre columnas */
const COL_SEP = 'border-l border-white/[0.12]';
const COL_SEP_GROUP = 'border-l-2 border-white/[0.20]';

const AREA_STYLE: Record<string, ReturnType<typeof icfesAreaStyle>> = {
    'matemáticas': icfesAreaStyle('matemáticas'),
    'matematicas': icfesAreaStyle('matemáticas'),
    'lectura crítica': icfesAreaStyle('lectura crítica'),
    'lectura critica': icfesAreaStyle('lectura crítica'),
    'sociales y ciudadanas': icfesAreaStyle('sociales y ciudadanas'),
    'ciencias naturales': icfesAreaStyle('ciencias naturales'),
    'inglés': icfesAreaStyle('inglés'),
    'ingles': icfesAreaStyle('inglés'),
};

function areaStyle(materia: string) {
    const key = materia.toLowerCase();
    return AREA_STYLE[key] ?? {
        color: '#818cf8',
        textOnDark: '#c4b5fd',
        bg: 'rgba(99,102,241,0.12)',
        border: 'rgba(99,102,241,0.25)',
    };
}

function getQuestionSession(materia: string, num: number) {
    const m = materia.toLowerCase();
    if (m.includes('matemáticas') || m.includes('matematicas')) return num <= 25 ? 1 : 2;
    if (m.includes('lectura')) return 1;
    if (m.includes('sociales') || m.includes('ciudadanas')) return num <= 25 ? 2 : 1;
    if (m.includes('naturales') || m.includes('ciencias')) return num >= 92 ? 1 : 2;
    if (m.includes('inglés') || m.includes('ingles')) return 2;
    return 1;
}

function severityMeta(rate: number) {
    if (rate > 0.7) {
        return { label: 'Urgente', badge: 'bg-red-500/20 text-red-200 ring-red-400/35', bar: '#f87171', row: 'rgba(239,68,68,0.08)' };
    }
    if (rate > 0.55) {
        return { label: 'Elevada', badge: 'bg-orange-500/20 text-orange-200 ring-orange-400/35', bar: '#fb923c', row: 'rgba(249,115,22,0.07)' };
    }
    return { label: 'Moderada', badge: 'bg-amber-500/20 text-amber-100 ring-amber-400/35', bar: '#fcd34d', row: 'rgba(251,191,36,0.06)' };
}

type CriticalQ = QuestionStat & { materia: string };

type Props = {
    questionAnalysis: Record<string, QuestionStat[]>;
    students: Estudiante[];
    onStudentClick: (e: Estudiante) => void;
    /** Persistir filtros en URL (?area, ?sev, …). */
    urlMemory?: boolean;
};

type SeverityFilter = 'todas' | 'urgente' | 'elevada' | 'moderada';
type SessionFilter = 'todas' | '1' | '2';
type SortBy = 'fail-desc' | 'fail-asc' | 'num';

function matchesSeverity(rate: number, filter: SeverityFilter) {
    if (filter === 'todas') return true;
    if (filter === 'urgente') return rate > 0.7;
    if (filter === 'elevada') return rate > 0.55 && rate <= 0.7;
    return rate > 0.4 && rate <= 0.55;
}

const SEVERITY_ACCENT: Record<string, string> = {
    todas: '#a5b4fc',
    urgente: '#f87171',
    elevada: '#fb923c',
    moderada: '#fcd34d',
};

function OptionCell({
    letter,
    count,
    pct,
    isCorrect,
    isTopDistractor,
}: {
    letter: string;
    count: number;
    pct: number;
    isCorrect: boolean;
    isTopDistractor: boolean;
}) {
    const bg = isCorrect
        ? 'bg-emerald-500/25 border-emerald-300/45 ring-1 ring-emerald-400/25'
        : isTopDistractor
            ? 'bg-orange-500/22 border-orange-300/40 ring-1 ring-orange-400/22'
            : 'bg-white/[0.06] border-white/[0.14]';

    const pctColor = isCorrect ? 'text-emerald-200' : isTopDistractor ? 'text-orange-200' : 'text-white/90';
    const labelColor = isCorrect ? 'text-emerald-300' : isTopDistractor ? 'text-orange-300' : 'text-white/72';
    const roleHint = isCorrect ? 'Correcta' : isTopDistractor ? 'Distractor' : null;

    return (
        <div
            className={`min-w-[72px] rounded-lg border px-2 py-2 text-center transition-colors ${bg}`}
            title={`Opción ${letter}: ${pct.toFixed(1)}% (${count} respuestas)`}
        >
            <div className="flex items-center justify-center gap-1 mb-1">
                <span className={`text-[10px] font-black uppercase ${labelColor}`}>{letter}</span>
                {roleHint && (
                    <span className={`text-[9px] font-semibold uppercase tracking-wide ${labelColor} opacity-85`}>
                        {roleHint}
                    </span>
                )}
            </div>
            <p className={`text-sm font-bold tabular-nums leading-tight ${pctColor}`}>{pct.toFixed(1)}%</p>
            <p className="text-[10px] text-white/62 tabular-nums mt-1">{count} resp.</p>
        </div>
    );
}

export default function CoordinadorCriticalQuestionsPanel({
    questionAnalysis,
    students,
    onStudentClick,
    urlMemory = true,
}: Props) {
    const persist = urlMemory;
    const [expandedKey, setExpandedKey] = useUrlQueryState('item', '', { persist });
    const [areaFilter, setAreaFilter] = useUrlQueryState('area', 'todas', { persist });
    const [severityFilterRaw, setSeverityFilterRaw] = useUrlQueryState('sev', 'todas', { persist });
    const [sessionFilterRaw, setSessionFilterRaw] = useUrlQueryState('ses', 'todas', { persist });
    const [sortByRaw, setSortByRaw] = useUrlQueryState('sort', 'fail-desc', { persist });

    const severityFilter = (['todas', 'urgente', 'elevada', 'moderada'].includes(severityFilterRaw)
        ? severityFilterRaw
        : 'todas') as SeverityFilter;
    const sessionFilter = (['todas', '1', '2'].includes(sessionFilterRaw)
        ? sessionFilterRaw
        : 'todas') as SessionFilter;
    const sortBy = (['fail-desc', 'fail-asc', 'num'].includes(sortByRaw)
        ? sortByRaw
        : 'fail-desc') as SortBy;

    const setSeverityFilter = (v: SeverityFilter) => setSeverityFilterRaw(v);
    const setSessionFilter = (v: SessionFilter) => setSessionFilterRaw(v);
    const setSortBy = (v: SortBy) => setSortByRaw(v);

    const studentNameMap = useMemo(() => {
        const map = new Map<string, Estudiante>();
        students.forEach(s => {
            const fullName = `${s.informacion_personal?.nombres || ''} ${s.informacion_personal?.apellidos || ''}`.trim().toUpperCase();
            if (fullName) map.set(fullName, s);
        });
        return map;
    }, [students]);

    const findStudentByName = (name: string): Estudiante | undefined => {
        const upper = name.toUpperCase();
        const exact = studentNameMap.get(upper);
        if (exact) return exact;
        for (const [key, student] of studentNameMap) {
            if (key.includes(upper) || upper.includes(key)) return student;
        }
        return undefined;
    };

    const allCritical = useMemo(() => {
        const list: CriticalQ[] = [];
        Object.entries(questionAnalysis).forEach(([materia, questions]) => {
            questions.filter(q => q.rate > 0.4).forEach(q => list.push({ ...q, materia }));
        });
        list.sort((a, b) => b.rate - a.rate);
        return list;
    }, [questionAnalysis]);

    const areaOptions = useMemo(
        () => Array.from(new Set(allCritical.map(q => q.materia))).sort((a, b) => a.localeCompare(b)),
        [allCritical],
    );

    const filteredCritical = useMemo(() => {
        let list = areaFilter === 'todas'
            ? allCritical
            : allCritical.filter(q => q.materia === areaFilter);

        list = list.filter(q => matchesSeverity(q.rate, severityFilter));

        if (sessionFilter !== 'todas') {
            const ses = Number(sessionFilter);
            list = list.filter(q => getQuestionSession(q.materia, q.num) === ses);
        }

        const sorted = [...list];
        if (sortBy === 'fail-desc') sorted.sort((a, b) => b.rate - a.rate);
        else if (sortBy === 'fail-asc') sorted.sort((a, b) => a.rate - b.rate);
        else sorted.sort((a, b) => a.num - b.num);

        return sorted;
    }, [allCritical, areaFilter, severityFilter, sessionFilter, sortBy]);

    const hasActiveFilters =
        areaFilter !== 'todas' || severityFilter !== 'todas' || sessionFilter !== 'todas' || sortBy !== 'fail-desc';

    const resetFilters = () => {
        setAreaFilter('todas');
        setSeverityFilter('todas');
        setSessionFilter('todas');
        setSortBy('fail-desc');
        setExpandedKey('');
    };

    const urgentCount = filteredCritical.filter(q => q.rate > 0.7).length;
    const avgFail = filteredCritical.length
        ? filteredCritical.reduce((s, q) => s + q.rate, 0) / filteredCritical.length
        : 0;
    const areaSelectOptions = useMemo((): CoordStitchSelectOption[] => [
        { value: 'todas', label: `Todas las áreas`, count: allCritical.length },
        ...areaOptions.map((area) => ({
            value: area,
            label: formatAreaDisplayName(area),
            count: allCritical.filter((q) => q.materia === area).length,
            accentColor: areaStyle(area).color,
        })),
    ], [allCritical, areaOptions]);

    const severitySelectOptions = useMemo((): CoordStitchSelectOption[] => [
        { value: 'todas', label: 'Todas las severidades', accentColor: SEVERITY_ACCENT.todas },
        { value: 'urgente', label: 'Urgente (>70% fallo)', accentColor: SEVERITY_ACCENT.urgente },
        { value: 'elevada', label: 'Elevada (55–70%)', accentColor: SEVERITY_ACCENT.elevada },
        { value: 'moderada', label: 'Moderada (40–55%)', accentColor: SEVERITY_ACCENT.moderada },
    ], []);

    const sessionSelectOptions = useMemo((): CoordStitchSelectOption[] => [
        { value: 'todas', label: 'Todas las sesiones', accentColor: '#a5b4fc' },
        { value: '1', label: 'Sesión 1', accentColor: '#818cf8' },
        { value: '2', label: 'Sesión 2', accentColor: '#c4b5fd' },
    ], []);

    const sortSelectOptions = useMemo((): CoordStitchSelectOption[] => [
        { value: 'fail-desc', label: 'Mayor tasa de fallo', accentColor: '#f87171' },
        { value: 'fail-asc', label: 'Menor tasa de fallo', accentColor: '#86efac' },
        { value: 'num', label: 'Número de pregunta', accentColor: '#c4b5fd' },
    ], []);

    const displayLetters = useMemo(() => {
        const set = new Set<string>();
        filteredCritical.forEach(q => {
            resolveQuestionLetters(q.counts, q.correct, q.studentMap).forEach(l => set.add(l));
        });
        const sorted = Array.from(set).sort();
        return sorted.length > 0 ? sorted : [...DEFAULT_LETTERS];
    }, [filteredCritical]);

    const tableColSpan = 7 + displayLetters.length + 2;
    const selectedAreaAccent = areaFilter !== 'todas' ? areaStyle(areaFilter).color : undefined;
    const selectedSeverityAccent = severityFilter !== 'todas' ? SEVERITY_ACCENT[severityFilter] : undefined;

    const onFilterChange = () => setExpandedKey('');

    const totalQuestions = useMemo(
        () => Object.values(questionAnalysis).reduce((n, rows) => n + rows.length, 0),
        [questionAnalysis],
    );

    if (totalQuestions === 0) {
        return (
            <div className="rounded-xl border border-white/[0.08] bg-[#111827]/90 backdrop-blur-md p-12 text-center animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-amber-500/20">
                    <AlertTriangle className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Estadísticas de ítems no disponibles</h3>
                <p className="text-white/55 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                    Aún no hay agregados por pregunta para este simulacro. Reprocesa el simulacro o sube
                    `institution_question_stats` para ver ítems críticos y distribución por opción.
                </p>
            </div>
        );
    }

    if (allCritical.length === 0) {
        return (
            <div className="rounded-xl border border-white/[0.08] bg-[#111827]/90 backdrop-blur-md p-12 text-center animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-emerald-500/20">
                    <Shield className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Sin ítems críticos</h3>
                <p className="text-white/55 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                    Ninguna pregunta supera el 40% de fallo. El grupo muestra dominio estable en este simulacro.
                </p>
            </div>
        );
    }

    return (
        <div className="coord-critical-panel space-y-5 animate-fade-in" data-coord-dark-surface>
            <div className="relative overflow-hidden rounded-[1.35rem] border border-[var(--coord-border)] bg-[var(--coord-surface)]/92 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md sm:p-6">
                <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/[0.12] blur-3xl" />
                <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-amber-500/[0.07] blur-3xl" />

                <div className="relative mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-400/[0.12] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Matriz de intervención
                        </div>
                        <h3 className="mt-3 flex items-center gap-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                            Preguntas críticas
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/78">
                            Tabla interactiva: clic en una fila para ver distribución completa, distractores y estudiantes por opción.
                        </p>
                    </div>
                    <div className="grid min-w-[220px] gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.05] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                        <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/68">
                            <span>Visibilidad</span>
                            <Filter className="h-3.5 w-3.5 text-indigo-200" />
                        </div>
                        <div className="flex items-end justify-between gap-3">
                            <p className="text-2xl font-black tabular-nums text-white">{filteredCritical.length}</p>
                            <p className="pb-1 text-xs font-bold text-white/68">de {allCritical.length} visibles</p>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-300 to-violet-400"
                                style={{ width: `${allCritical.length ? (filteredCritical.length / allCritical.length) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="relative grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" data-coord-tour={TourAnchors.dashboardAnalisisKpis}>
                    <PremiumMetricTile
                        label="Ítems críticos"
                        value={filteredCritical.length}
                        detail={`${allCritical.length} en el radar total`}
                        icon={Gauge}
                        tone="amber"
                        progress={allCritical.length ? (filteredCritical.length / allCritical.length) * 100 : 0}
                    />
                    <PremiumMetricTile
                        label="Urgentes"
                        value={urgentCount}
                        detail="fallo superior al 70%"
                        icon={Flame}
                        tone="rose"
                        progress={filteredCritical.length ? (urgentCount / filteredCritical.length) * 100 : 0}
                    />
                    <PremiumMetricTile
                        label="Fallo promedio"
                        value={`${(avgFail * 100).toFixed(0)}%`}
                        detail="promedio de ítems visibles"
                        icon={Activity}
                        tone="indigo"
                        progress={avgFail * 100}
                    />
                    <PremiumMetricTile
                        label="Áreas afectadas"
                        value={areaOptions.length}
                        detail="materias con foco activo"
                        icon={Layers3}
                        tone="cyan"
                        progress={(areaOptions.length / 5) * 100}
                    />
                </div>

                {/* Filtros Stitch */}
                <div className="sticky top-3 z-20 mt-5 rounded-2xl border border-[var(--coord-border)] bg-[var(--coord-surface-muted)]/92 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl sm:p-5" data-coord-tour={TourAnchors.dashboardAnalisisFilters}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-100">
                            <Filter className="h-3.5 w-3.5" />
                            Controles de lectura
                        </p>
                        {hasActiveFilters && (
                            <button type="button" onClick={resetFilters} className="rounded-full border border-indigo-300/25 bg-indigo-400/[0.12] px-3 py-1.5 text-[11px] font-black text-indigo-100 transition-colors hover:bg-indigo-400/20 hover:text-white">
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <CoordStitchSelect
                            id="critical-area"
                            label="Área"
                            value={areaFilter}
                            onChange={(v) => { setAreaFilter(v); onFilterChange(); }}
                            options={areaSelectOptions}
                            accentColor={selectedAreaAccent}
                        />
                        <CoordStitchSelect
                            id="critical-severity"
                            label="Severidad"
                            value={severityFilter}
                            onChange={(v) => { setSeverityFilter(v as SeverityFilter); onFilterChange(); }}
                            options={severitySelectOptions}
                            accentColor={selectedSeverityAccent}
                        />
                        <CoordStitchSelect
                            id="critical-session"
                            label="Sesión"
                            value={sessionFilter}
                            onChange={(v) => { setSessionFilter(v as SessionFilter); onFilterChange(); }}
                            options={sessionSelectOptions}
                            accentColor={sessionFilter !== 'todas' ? sessionSelectOptions.find(o => o.value === sessionFilter)?.accentColor : undefined}
                        />
                        <CoordStitchSelect
                            id="critical-sort"
                            label="Ordenar por"
                            value={sortBy}
                            onChange={(v) => { setSortBy(v as SortBy); onFilterChange(); }}
                            options={sortSelectOptions}
                            accentColor={sortSelectOptions.find(o => o.value === sortBy)?.accentColor}
                        />
                    </div>
                </div>

                {/* Leyenda opciones */}
                <div className="flex flex-wrap items-center gap-4 mb-3 px-1 text-[11px] text-white/75">
                    <span className="font-bold text-white/88">Lectura de opciones:</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400/55 ring-1 ring-emerald-300/55" /> Correcta</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-400/50 ring-1 ring-orange-300/50" /> Distractor principal</span>
                    <span className="inline-flex items-center gap-1.5 text-white/72"><Users className="w-3 h-3" /> Clic en fila → estudiantes</span>
                </div>

                {/* Tabla interactiva */}
                {filteredCritical.length === 0 ? (
                    <div className="py-12 text-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                        <p className="text-white/70 font-semibold">Ningún ítem coincide con los filtros actuales.</p>
                        <button type="button" onClick={resetFilters} className="mt-3 text-sm font-bold text-indigo-300 hover:text-white transition-colors">
                            Restablecer filtros
                        </button>
                    </div>
                ) : (
                    <div data-coord-tour={TourAnchors.dashboardAnalisisTable}>
                    <HorizontalScrollPanel
                        label="Desplazar tabla de preguntas críticas"
                        maxHeight="min(72vh, 900px)"
                    >
                        <table className="w-full min-w-[1360px] text-sm border-collapse coord-critical-table">
                            <thead className="sticky top-0 z-10 bg-[var(--coord-surface-muted)]/98 backdrop-blur-sm">
                                <tr className="text-[var(--coord-text-secondary)] border-b border-[var(--coord-border-strong)]">
                                    <th className="py-3 px-3 text-left text-[11px] font-bold uppercase tracking-wide min-w-[132px]">Área</th>
                                    <th className={`py-3 px-2 text-center text-[11px] font-bold uppercase tracking-wide ${COL_SEP}`}>Sesión</th>
                                    <th className={`py-3 px-2 text-center text-[11px] font-bold uppercase tracking-wide min-w-[108px] ${COL_SEP}`}>Pregunta</th>
                                    <th className={`py-3 px-2 text-center text-[11px] font-bold uppercase tracking-wide min-w-[108px] ${COL_SEP}`}>Fallo</th>
                                    <th className={`py-3 px-2 text-center text-[11px] font-bold uppercase tracking-wide ${COL_SEP}`}>Severidad</th>
                                    <th className={`py-3 px-2 text-center text-[11px] font-bold uppercase tracking-wide ${COL_SEP}`}>Correcta</th>
                                    <th className={`py-3 px-2 text-center text-[11px] font-bold uppercase tracking-wide ${COL_SEP}`}>Respuestas</th>
                                    {displayLetters.map((l, i) => (
                                        <th
                                            key={l}
                                            className={`py-3 px-2 text-center text-[11px] font-bold uppercase tracking-wide min-w-[80px] bg-[var(--coord-table-row)] ${i === 0 ? COL_SEP_GROUP : COL_SEP}`}
                                        >
                                            Opción {l}
                                        </th>
                                    ))}
                                    <th className={`py-3 px-2 text-center text-[11px] font-bold uppercase tracking-wide min-w-[72px] ${COL_SEP_GROUP}`}>Sin resp.</th>
                                    <th className={`py-3 px-3 text-left text-[11px] font-bold uppercase tracking-wide min-w-[148px] ${COL_SEP_GROUP}`}>Distractor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCritical.map(q => {
                                    const key = `${q.materia}-${q.num}`;
                                    const isExpanded = expandedKey === key;
                                    const t = Math.max(q.total, 1);
                                    const failPct = q.rate * 100;
                                    const correctKey = q.correct.toUpperCase().trim();
                                    const questionLetters = resolveQuestionLetters(q.counts, q.correct, q.studentMap);
                                    const optionPct = (letter: string) => ((q.counts[letter] || 0) / t) * 100;
                                    const topDist = questionLetters
                                        .filter(l => l !== correctKey)
                                        .reduce((best, l) => ((q.counts[l] || 0) > (q.counts[best] || 0) ? l : best), questionLetters.find(l => l !== correctKey) || 'A');
                                    const sev = severityMeta(q.rate);
                                    const session = getQuestionSession(q.materia, q.num);
                                    const area = areaStyle(q.materia);

                                    return (
                                        <React.Fragment key={key}>
                                            <tr
                                                className={`border-b border-[var(--coord-divider)] cursor-pointer transition-all duration-200 ${
                                                    isExpanded ? 'bg-indigo-500/[0.08] ring-1 ring-inset ring-indigo-400/25' : 'hover:bg-[var(--coord-table-row-hover)]'
                                                }`}
                                                style={{ backgroundColor: !isExpanded ? sev.row : undefined }}
                                                onClick={() => setExpandedKey(isExpanded ? '' : key)}
                                            >
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-2 min-w-[120px]">
                                                        <ChevronDown className={`w-4 h-4 text-white/62 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-indigo-200' : ''}`} />
                                                        <span className="text-[11px] font-bold uppercase leading-tight" style={{ color: area.textOnDark }}>
                                                            {formatAreaDisplayName(q.materia)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={`py-3 px-2 text-center ${COL_SEP}`}>
                                                    <span className="inline-flex rounded-full bg-indigo-500/18 px-2.5 py-0.5 text-[11px] font-bold text-indigo-100 ring-1 ring-indigo-400/30">
                                                        {session}
                                                    </span>
                                                </td>
                                                <td className={`py-3 px-2 text-center font-black text-white ${COL_SEP}`}>{questionLabel(q.num)}</td>
                                                <td className={`py-3 px-2 ${COL_SEP}`}>
                                                    <div className="flex items-center gap-2 min-w-[90px]">
                                                        <div className="flex-1 h-2.5 rounded-full bg-white/[0.10] overflow-hidden">
                                                            <div className="h-full rounded-full transition-all" style={{ width: `${failPct}%`, background: sev.bar }} />
                                                        </div>
                                                        <span className="text-xs font-black text-red-300 tabular-nums w-10 text-right">{failPct.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                                <td className={`py-3 px-2 text-center ${COL_SEP}`}>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${sev.badge}`}>{sev.label}</span>
                                                </td>
                                                <td className={`py-3 px-2 text-center ${COL_SEP}`}>
                                                    <span className="inline-flex min-w-[28px] justify-center rounded-md bg-emerald-500/22 px-2 py-0.5 text-sm font-black text-emerald-200 ring-1 ring-emerald-400/35">
                                                        {q.correct}
                                                    </span>
                                                </td>
                                                <td className={`py-3 px-2 text-center text-white/78 tabular-nums text-xs font-semibold ${COL_SEP}`}>{q.total}</td>
                                                {displayLetters.map((l, i) => {
                                                    const hasOption = questionLetters.includes(l);
                                                    return (
                                                    <td
                                                        key={l}
                                                        className={`py-2.5 px-2 align-top bg-[var(--coord-surface-overlay)] ${i === 0 ? COL_SEP_GROUP : COL_SEP}`}
                                                    >
                                                        {hasOption ? (
                                                            <OptionCell
                                                                letter={l}
                                                                count={q.counts[l] || 0}
                                                                pct={optionPct(l)}
                                                                isCorrect={l === correctKey}
                                                                isTopDistractor={l === topDist && l !== correctKey}
                                                            />
                                                        ) : (
                                                            <span className="block text-center text-xs text-white/20">—</span>
                                                        )}
                                                    </td>
                                                    );
                                                })}
                                                <td className={`py-3 px-2 text-center ${COL_SEP_GROUP}`}>
                                                    <span className="text-xs font-bold text-white/62 tabular-nums">{q.counts['NR'] || 0}</span>
                                                </td>
                                                <td className={`py-3 px-3 ${COL_SEP_GROUP}`}>
                                                    {(q.counts[topDist] || 0) > 0 ? (
                                                        <span className={`text-xs font-semibold ${optionPct(topDist) > 30 ? 'text-orange-200' : 'text-white/75'}`}>
                                                            Opción {topDist} · {optionPct(topDist).toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-white/45">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={tableColSpan} className="p-0 bg-indigo-500/[0.04] border-b border-indigo-500/15">
                                                        <div className="px-5 py-5 animate-fade-in">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                <div>
                                                                    <p className="text-[11px] font-bold text-white/72 uppercase tracking-widest mb-3">Distribución detallada</p>
                                                                    <div className="space-y-2.5">
                                                                        {questionLetters.map(l => {
                                                                            const count = q.counts[l] || 0;
                                                                            const pct = optionPct(l);
                                                                            const isCorrect = l === correctKey;
                                                                            const barColor = isCorrect ? '#10b981' : pct > 25 ? '#f97316' : 'rgba(255,255,255,0.12)';
                                                                            return (
                                                                                <div key={l} className="flex items-center gap-3">
                                                                                    <span className={`text-sm font-black w-6 text-center ${isCorrect ? 'text-emerald-300' : 'text-white/75'}`}>{l}</span>
                                                                                    <div className="flex-1 h-9 rounded-lg overflow-hidden relative bg-white/[0.06] border border-white/[0.10]">
                                                                                        <div className="h-full rounded-lg transition-all duration-500" style={{ width: `${Math.max(pct, 1)}%`, background: barColor }} />
                                                                                        <span className="absolute inset-0 flex items-center justify-between px-3 text-xs font-semibold">
                                                                                            <span className={isCorrect ? 'text-emerald-100' : 'text-white/78'}>
                                                                                                {isCorrect ? 'Respuesta correcta' : `Opción ${l}`}
                                                                                            </span>
                                                                                            <span className="text-white/92 tabular-nums">{count} · {pct.toFixed(1)}%</span>
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                        {(q.counts['NR'] || 0) > 0 && (
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-sm font-black w-6 text-center text-white/62">—</span>
                                                                                <div className="flex-1 h-9 rounded-lg overflow-hidden relative bg-white/[0.06] border border-white/[0.10]">
                                                                                    <div className="h-full rounded-lg" style={{ width: `${((q.counts['NR'] || 0) / t) * 100}%`, background: 'rgba(255,255,255,0.14)' }} />
                                                                                    <span className="absolute inset-0 flex items-center justify-between px-3 text-xs font-semibold text-white/78">
                                                                                        <span>Sin respuesta</span>
                                                                                        <span className="tabular-nums">{q.counts['NR']} · {(((q.counts['NR'] || 0) / t) * 100).toFixed(1)}%</span>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                                                        <div className="rounded-lg border border-white/[0.12] bg-white/[0.05] p-3 text-center">
                                                                            <p className="text-[10px] text-white/68 font-bold uppercase">Correcta</p>
                                                                            <p className="text-lg font-black text-emerald-300">{q.correct}</p>
                                                                        </div>
                                                                        <div className="rounded-lg border border-white/[0.12] bg-white/[0.05] p-3 text-center">
                                                                            <p className="text-[10px] text-white/68 font-bold uppercase">Acierto</p>
                                                                            <p className="text-lg font-black text-emerald-300">{(100 - failPct).toFixed(0)}%</p>
                                                                        </div>
                                                                        <div className="rounded-lg border border-white/[0.12] bg-white/[0.05] p-3 text-center">
                                                                            <p className="text-[10px] text-white/68 font-bold uppercase">Total</p>
                                                                            <p className="text-lg font-black text-white">{q.total}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] font-bold text-white/72 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                        <Users className="w-3.5 h-3.5" />
                                                                        Estudiantes por respuesta
                                                                    </p>
                                                                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                                                                        {questionLetters.map(l => {
                                                                            const names = q.studentMap?.[l] || [];
                                                                            const count = names.length > 0 ? names.length : (q.counts[l] || 0);
                                                                            if (count === 0) return null;
                                                                            const isCorrect = l === correctKey;
                                                                            return (
                                                                                <details key={l} className="group rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.08] open:border-indigo-500/25 open:bg-indigo-500/[0.04]">
                                                                                    <summary className="flex items-center gap-2 p-3 cursor-pointer select-none hover:bg-white/[0.04] transition-colors list-none [&::-webkit-details-marker]:hidden">
                                                                                        <span className={`text-xs font-black ${isCorrect ? 'text-emerald-400' : 'text-white/65'}`}>Opción {l}</span>
                                                                                        <span className="text-xs text-white/50">{count} estudiante{count !== 1 ? 's' : ''}</span>
                                                                                        {isCorrect && <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">Correcta</span>}
                                                                                        <ChevronDown className="w-3.5 h-3.5 ml-auto text-white/40 group-open:rotate-180 transition-transform" />
                                                                                    </summary>
                                                                                    <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                                                                                        {names.length > 0 ? names.map((name, si) => {
                                                                                            const found = findStudentByName(name);
                                                                                            return (
                                                                                                <button
                                                                                                    key={si}
                                                                                                    type="button"
                                                                                                    onClick={ev => { ev.stopPropagation(); if (found) onStudentClick(found); }}
                                                                                                    className={`text-[11px] px-2 py-1 rounded-lg transition-all ${
                                                                                                        found
                                                                                                            ? 'cursor-pointer hover:ring-1 hover:ring-indigo-500/40 hover:bg-indigo-500/10 hover:scale-[1.02] active:scale-[0.98]'
                                                                                                            : 'cursor-default'
                                                                                                    } ${isCorrect ? 'bg-emerald-500/10 text-emerald-300/90' : 'bg-white/[0.04] text-white/60'}`}
                                                                                                >
                                                                                                    {name}
                                                                                                </button>
                                                                                            );
                                                                                        }) : (
                                                                                            <p className="text-[12px] text-white/45">
                                                                                                {count} estudiantes seleccionaron esta opción.
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </details>
                                                                            );
                                                                        })}
                                                                        {(q.studentMap?.['NR'] || []).length > 0 && (
                                                                            <details className="group rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.08]">
                                                                                <summary className="flex items-center gap-2 p-3 cursor-pointer select-none hover:bg-white/[0.04] transition-colors list-none [&::-webkit-details-marker]:hidden">
                                                                                    <span className="text-xs font-black text-white/50">Sin respuesta</span>
                                                                                    <span className="text-xs text-white/50">{q.studentMap!['NR'].length} estudiante{q.studentMap!['NR'].length !== 1 ? 's' : ''}</span>
                                                                                    <ChevronDown className="w-3.5 h-3.5 ml-auto text-white/40 group-open:rotate-180 transition-transform" />
                                                                                </summary>
                                                                                <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                                                                                    {q.studentMap!['NR'].map((name, si) => {
                                                                                        const found = findStudentByName(name);
                                                                                        return (
                                                                                            <button
                                                                                                key={si}
                                                                                                type="button"
                                                                                                onClick={ev => { ev.stopPropagation(); if (found) onStudentClick(found); }}
                                                                                                className={`text-[11px] px-2 py-1 rounded-lg bg-white/[0.04] text-white/60 transition-all ${
                                                                                                    found ? 'cursor-pointer hover:ring-1 hover:ring-indigo-500/40 hover:scale-[1.02]' : 'cursor-default'
                                                                                                }`}
                                                                                            >
                                                                                                {name}
                                                                                            </button>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </details>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </HorizontalScrollPanel>
                    </div>
                )}
            </div>
        </div>
    );
}
