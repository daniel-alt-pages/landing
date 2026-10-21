'use client';

import type { ReactNode } from 'react';
import type { Estudiante } from '@shared/types';
import { NATIONAL_STATS, AREA_MAP } from '@features/benchmark/lib/nationalData';
import { MATERIAS as MATERIAS_BASE } from '@features/coordinador/lib/analisis/materias';
import { displayDocumentId } from '@features/coordinador/lib/demoPrivacy';
import {
    getStudentPerformanceLevel,
    getStudentSubjectScore,
    studentDepartamento,
    studentDocumentId,
    studentFullName,
    studentInstitucion,
    STUDENT_LEVEL_FILTERS,
} from '@shared/lib/studentDisplay';

const TABLE_MATERIAS = MATERIAS_BASE.map((m) => ({
    key: m.key,
    short:
        m.key === 'lectura crítica' ? 'Lect'
        : m.key === 'matemáticas' ? 'Mat'
        : m.key === 'sociales y ciudadanas' ? 'Soc'
        : m.key === 'ciencias naturales' ? 'Cien'
        : 'Ing',
    color: m.color,
}));

function RankCell({ rank, highlightTop }: { rank: number; highlightTop?: boolean }) {
    if (!highlightTop || rank > 3) {
        return <span className="text-white/20 font-mono text-xs tabular-nums">{rank}</span>;
    }

    const palette = [
        { bg: 'linear-gradient(135deg, #fcd34d, #f59e0b)', shadow: '0 2px 10px rgba(245,158,11,0.35)', text: 'text-amber-950' },
        { bg: 'linear-gradient(135deg, #e2e8f0, #94a3b8)', shadow: '0 2px 8px rgba(148,163,184,0.3)', text: 'text-slate-800' },
        { bg: 'linear-gradient(135deg, #fdba74, #ea580c)', shadow: '0 2px 8px rgba(234,88,12,0.3)', text: 'text-white' },
    ][rank - 1];

    return (
        <span
            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-[11px] font-black tabular-nums ${palette.text}`}
            style={{ background: palette.bg, boxShadow: palette.shadow }}
        >
            {rank}
        </span>
    );
}

function SortIndicator({ active, asc }: { active: boolean; asc: boolean }) {
    if (!active) return <span className="text-white/15 ml-1">↕</span>;
    return <span className="text-purple-400 ml-1">{asc ? '↑' : '↓'}</span>;
}

export function StudentLevelFilterPills({
    value,
    onChange,
    className = '',
}: {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <div className={`flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1 ${className}`.trim()}>
            {STUDENT_LEVEL_FILTERS.map((f) => (
                <button
                    key={f.value}
                    type="button"
                    onClick={() => onChange(f.value)}
                    className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{
                        background: value === f.value ? `${f.color}20` : 'rgba(255,255,255,0.03)',
                        color: value === f.value ? f.color : 'rgba(255,255,255,0.4)',
                        border: value === f.value ? `1px solid ${f.color}30` : '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
}

export function CoordinatorStudentListTable({
    students,
    onRowClick,
    maskDocumentIds = false,
    sortKey,
    sortAsc,
    onSort,
    showAnalyzeHint = false,
    highlightTopRanks = false,
    maxHeight = '70vh',
    emptyMessage = 'No se encontraron estudiantes',
    tourAnchor,
}: {
    students: Estudiante[];
    onRowClick: (student: Estudiante) => void;
    maskDocumentIds?: boolean;
    sortKey?: string;
    sortAsc?: boolean;
    onSort?: (key: string) => void;
    showAnalyzeHint?: boolean;
    highlightTopRanks?: boolean;
    maxHeight?: string;
    emptyMessage?: string;
    tourAnchor?: string;
}) {
    const sortable = Boolean(onSort);

    const thSort = (key: string, label: ReactNode, extraClass = '') => (
        <th
            className={`text-left py-3 px-3 text-white/30 font-semibold ${sortable ? 'cursor-pointer select-none' : ''} ${extraClass}`.trim()}
            onClick={sortable ? () => onSort!(key) : undefined}
        >
            {label}
            {sortable && sortKey != null && sortAsc != null ? (
                <SortIndicator active={sortKey === key} asc={sortAsc} />
            ) : null}
        </th>
    );

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--coord-border, rgba(255,255,255,0.08))' }}
            data-coord-tour={tourAnchor}
        >
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight }}>
                <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10" style={{ background: 'rgba(12, 14, 26, 0.98)', backdropFilter: 'blur(8px)' }}>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th className="text-left py-3 px-3 text-white/30 font-semibold w-10">#</th>
                            {thSort('name', 'Nombre')}
                            <th className="text-left py-3 px-3 text-white/30 font-semibold">ID</th>
                            <th className="text-left py-3 px-3 text-white/30 font-semibold hidden lg:table-cell">Depto</th>
                            <th className="text-left py-3 px-3 text-white/30 font-semibold hidden xl:table-cell">Institución</th>
                            <th className="py-3 px-2 text-white/30 font-semibold text-center">Nivel</th>
                            {thSort('global', 'Global', 'text-center min-w-[88px]')}
                            {TABLE_MATERIAS.map((m) => (
                                <th
                                    key={m.key}
                                    className={`text-center py-3 px-1.5 font-semibold min-w-[58px] ${sortable ? 'cursor-pointer select-none' : ''}`}
                                    style={{ color: `${m.color}90` }}
                                    onClick={sortable ? () => onSort!(m.key) : undefined}
                                >
                                    {m.short}
                                    {sortable && sortKey != null && sortAsc != null ? (
                                        <SortIndicator active={sortKey === m.key} asc={sortAsc} />
                                    ) : null}
                                </th>
                            ))}
                            {showAnalyzeHint ? (
                                <th className="py-3 px-2 text-white/20 font-semibold text-center w-20" aria-hidden />
                            ) : null}
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s, idx) => {
                            const global = s.puntaje_global || 0;
                            const nivel = getStudentPerformanceLevel(global);
                            const isAtRisk = global > 0 && global < 250;
                            const globalPct = Math.min((global / 500) * 100, 100);
                            const rank = idx + 1;

                            return (
                                <tr
                                    key={`${studentDocumentId(s) || 'x'}-${idx}`}
                                    className="group cursor-pointer transition-all duration-150"
                                    style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        contentVisibility: 'auto',
                                        containIntrinsicSize: '0 52px',
                                        background: highlightTopRanks && rank <= 3 ? 'rgba(139,92,246,0.04)' : undefined,
                                    }}
                                    onClick={() => onRowClick(s)}
                                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = highlightTopRanks && rank <= 3
                                            ? 'rgba(139,92,246,0.04)'
                                            : 'transparent';
                                    }}
                                >
                                    <td className="py-3 px-3 text-center">
                                        <RankCell rank={rank} highlightTop={highlightTopRanks} />
                                    </td>
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2 min-w-[120px] max-w-[220px]">
                                            {isAtRisk && (
                                                <span className="text-[10px] shrink-0 text-amber-400/80" title="Estudiante en riesgo">!</span>
                                            )}
                                            <p className="font-bold text-white/85 uppercase text-[11px] truncate">
                                                {studentFullName(s, { uppercase: true })}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-[11px] text-white/35 font-mono whitespace-nowrap">
                                        {displayDocumentId(studentDocumentId(s), maskDocumentIds)}
                                    </td>
                                    <td
                                        className="py-3 px-3 text-[11px] text-white/35 truncate max-w-[120px] hidden lg:table-cell"
                                        title={studentDepartamento(s)}
                                    >
                                        {studentDepartamento(s) || '—'}
                                    </td>
                                    <td
                                        className="py-3 px-3 text-[11px] text-white/35 truncate max-w-[160px] hidden xl:table-cell"
                                        title={studentInstitucion(s)}
                                    >
                                        {studentInstitucion(s) || '—'}
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        <span
                                            className="text-[11px] font-bold px-2 py-0.5 rounded-md inline-block"
                                            style={{ background: `${nivel.color}15`, color: nivel.color }}
                                        >
                                            {nivel.label}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-sm font-black tabular-nums" style={{ color: nivel.color }}>
                                                {global || '—'}
                                            </span>
                                            {global > 0 && (
                                                <div
                                                    className="w-full h-1.5 rounded-full overflow-hidden"
                                                    style={{ background: 'rgba(255,255,255,0.04)', maxWidth: '72px' }}
                                                >
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${globalPct}%`,
                                                            background: `linear-gradient(90deg, ${nivel.color}80, ${nivel.color})`,
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    {TABLE_MATERIAS.map((m) => {
                                        const score = getStudentSubjectScore(s, m.key);
                                        const natAvg = NATIONAL_STATS.areas[AREA_MAP[m.key] as keyof typeof NATIONAL_STATS.areas]?.mean || 50;
                                        const aboveNat = score >= natAvg;
                                        return (
                                            <td key={m.key} className="py-3 px-1.5">
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span
                                                        className={`text-[11px] font-bold tabular-nums ${
                                                            score > 0 ? (aboveNat ? 'text-white/75' : 'text-white/45') : 'text-white/15'
                                                        }`}
                                                    >
                                                        {score || '—'}
                                                    </span>
                                                    {score > 0 && (
                                                        <div
                                                            className="w-full h-1 rounded-full overflow-hidden"
                                                            style={{ background: 'rgba(255,255,255,0.04)', maxWidth: '42px' }}
                                                        >
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${Math.min(score, 100)}%`,
                                                                    background: aboveNat ? m.color : `${m.color}55`,
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    {showAnalyzeHint ? (
                                        <td className="py-3 px-2 text-center">
                                            <span
                                                className="text-[11px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1"
                                                style={{
                                                    background: 'rgba(139,92,246,0.15)',
                                                    color: '#c4b5fd',
                                                    border: '1px solid rgba(139,92,246,0.25)',
                                                }}
                                            >
                                                Analizar →
                                            </span>
                                        </td>
                                    ) : null}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {students.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-sm text-white/30">{emptyMessage}</p>
                </div>
            )}
        </div>
    );
}
