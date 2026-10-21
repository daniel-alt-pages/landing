'use client';
import { useMemo, useState } from 'react';
import { Estudiante } from '@shared/types';
import ExportMenu from '@features/admin/components/ExportMenu';

interface DeptoData {
    estudiantes: Estudiante[];
    promedio: number;
    niveles: Record<string, number>;
}

interface Props {
    porDepartamento: [string, DeptoData][];
    totalEstudiantes: number;
    simulacroId: string;
    onOpenPreview: (estudiantes: Estudiante[]) => void;
}

function clasificarNivel(puntaje: number) {
    if (puntaje >= 400) return { nivel: 'Superior', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' };
    if (puntaje >= 325) return { nivel: 'Alto', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' };
    if (puntaje >= 250) return { nivel: 'Medio', color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)' };
    return { nivel: 'Bajo', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' };
}

// Mini bar chart inline (SVG)
function MiniBarChart({ niveles, total }: { niveles: Record<string, number>; total: number }) {
    const bars = [
        { key: 'superior', color: '#22c55e', label: 'Sup' },
        { key: 'alto', color: '#3b82f6', label: 'Alto' },
        { key: 'medio', color: '#eab308', label: 'Med' },
        { key: 'bajo', color: '#ef4444', label: 'Bajo' },
    ];
    const max = Math.max(...bars.map(b => niveles[b.key] || 0), 1);
    return (
        <div className="flex items-end gap-1.5 h-14">
            {bars.map(b => {
                const val = niveles[b.key] || 0;
                const pct = (val / max) * 100;
                const pctTotal = total > 0 ? ((val / total) * 100).toFixed(0) : '0';
                return (
                    <div key={b.key} className="flex-1 flex flex-col items-center gap-1" title={`${b.label}: ${val} (${pctTotal}%)`}>
                        <span className="text-[9px] text-white/40 font-mono">{val}</span>
                        <div className="w-full rounded-t-sm transition-all duration-700" style={{ height: `${Math.max(pct * 0.4, 4)}px`, backgroundColor: b.color, opacity: 0.8 }} />
                        <span className="text-[9px] text-white/30">{b.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

// Donut chart SVG
function DonutChart({ niveles, total }: { niveles: Record<string, number>; total: number }) {
    const segments = [
        { key: 'superior', color: '#22c55e' },
        { key: 'alto', color: '#3b82f6' },
        { key: 'medio', color: '#eab308' },
        { key: 'bajo', color: '#ef4444' },
    ];
    const r = 28, cx = 36, cy = 36, stroke = 10;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const arcs = segments.map(s => {
        const val = niveles[s.key] || 0;
        const pct = total > 0 ? val / total : 0;
        const dash = circ * pct;
        const arc = { ...s, dash, offset, val };
        offset += dash;
        return arc;
    });
    return (
        <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
            {arcs.map(a => a.val > 0 && (
                <circle key={a.key} cx={cx} cy={cy} r={r} fill="none"
                    stroke={a.color} strokeWidth={stroke}
                    strokeDasharray={`${a.dash} ${circ - a.dash}`}
                    strokeDashoffset={circ / 4 - a.offset}
                    strokeLinecap="butt" style={{ transition: 'all 0.7s ease' }} />
            ))}
            <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{total}</text>
        </svg>
    );
}

// Tarjeta individual de departamento (expandible)
function DeptoCard({
    nombre, data, rank, totalGlobal, promedioGlobal, onOpenPreview
}: {
    nombre: string; data: DeptoData; rank: number;
    totalGlobal: number; promedioGlobal: number; onOpenPreview: (e: Estudiante[]) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const { nivel, color, bg, border } = clasificarNivel(data.promedio);
    const pct = (data.promedio / 500) * 100;
    const participacion = totalGlobal > 0 ? ((data.estudiantes.length / totalGlobal) * 100).toFixed(1) : '0';
    const delta = data.promedio - promedioGlobal;
    const completados = data.estudiantes.filter(e => {
        const s = e.sesiones || e.secciones_completadas || [];
        return s.includes('S1') && s.includes('S2');
    }).length;
    const tasaCompletados = data.estudiantes.length > 0 ? ((completados / data.estudiantes.length) * 100).toFixed(0) : '0';

    // Materia más fuerte del departamento
    const materiaStats: Record<string, { sum: number; count: number }> = {};
    data.estudiantes.forEach(e => {
        if (e.puntajes) Object.entries(e.puntajes).forEach(([m, d]) => {
            if (d.puntaje > 0) {
                if (!materiaStats[m]) materiaStats[m] = { sum: 0, count: 0 };
                materiaStats[m].sum += d.puntaje;
                materiaStats[m].count++;
            }
        });
    });
    const materias = Object.entries(materiaStats)
        .map(([m, s]) => ({ nombre: m, avg: s.count > 0 ? Math.round(s.sum / s.count) : 0 }))
        .sort((a, b) => b.avg - a.avg);
    const top3 = data.estudiantes.filter(e => (e.puntaje_global || 0) > 0)
        .sort((a, b) => (b.puntaje_global || 0) - (a.puntaje_global || 0)).slice(0, 3);

    const rankColors = ['#f59e0b', '#94a3b8', '#cd7c32'];

    return (
        <div className="rounded-2xl border backdrop-blur-lg overflow-hidden transition-all duration-300"
            style={{ background: 'rgba(15,17,26,0.8)', borderColor: expanded ? border : 'rgba(255,255,255,0.08)' }}>

            {/* Header */}
            <div className="p-5 cursor-pointer" onClick={() => setExpanded(v => !v)}>
                <div className="flex items-start justify-between gap-3 mb-3">
                    {/* Rank + nombre */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                            style={{ background: rank <= 3 ? `${rankColors[rank - 1]}22` : 'rgba(255,255,255,0.05)', color: rank <= 3 ? rankColors[rank - 1] : 'rgba(255,255,255,0.4)' }}>
                            {rank}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-white font-bold text-sm leading-tight truncate" title={nombre}>{nombre}</h3>
                            <p className="text-white/40 text-xs mt-0.5">{data.estudiantes.length} estudiantes · {participacion}% del total</p>
                        </div>
                    </div>
                    {/* Puntaje + nivel */}
                    <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-black text-white tabular-nums">{data.promedio}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color, background: bg }}>{nivel}</span>
                    </div>
                </div>

                {/* Barra de promedio */}
                <div className="w-full bg-white/5 rounded-full h-2 mb-3 overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
                </div>

                {/* KPIs rápidos */}
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/5 rounded-xl p-2">
                        <p className="text-white font-bold text-sm">{tasaCompletados}%</p>
                        <p className="text-white/40 text-[10px]">Completados</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2">
                        <p className={`font-bold text-sm ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {delta >= 0 ? '+' : ''}{delta}
                        </p>
                        <p className="text-white/40 text-[10px]">vs. promedio</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2">
                        <p className="text-white font-bold text-sm">{data.niveles.superior || 0}</p>
                        <p className="text-white/40 text-[10px]">⭐ Superior</p>
                    </div>
                </div>

                {/* Expand hint */}
                <div className="flex items-center justify-center mt-3 gap-1 text-white/20 text-xs">
                    <span>{expanded ? '▲ Ocultar detalle' : '▼ Ver detalle'}</span>
                </div>
            </div>

            {/* Panel expandido */}
            {expanded && (
                <div className="border-t px-5 pb-5 space-y-4" style={{ borderColor: border }}>
                    {/* Donut + Barras */}
                    <div className="flex gap-4 items-center pt-4">
                        <DonutChart niveles={data.niveles} total={data.estudiantes.length} />
                        <div className="flex-1">
                            <MiniBarChart niveles={data.niveles} total={data.estudiantes.length} />
                        </div>
                    </div>

                    {/* Distribución de niveles detallada */}
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { key: 'superior', label: 'Superior', color: '#22c55e', icon: '⭐' },
                            { key: 'alto', label: 'Alto', color: '#3b82f6', icon: '🔵' },
                            { key: 'medio', label: 'Medio', color: '#eab308', icon: '🟡' },
                            { key: 'bajo', label: 'Bajo', color: '#ef4444', icon: '🔴' },
                        ].map(n => {
                            const val = data.niveles[n.key] || 0;
                            const p = data.estudiantes.length > 0 ? ((val / data.estudiantes.length) * 100).toFixed(0) : '0';
                            return (
                                <div key={n.key} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                                    <span className="text-xs text-white/70">{n.icon} {n.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold text-sm">{val}</span>
                                        <span className="text-[10px] font-mono" style={{ color: n.color }}>{p}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Materias */}
                    {materias.length > 0 && (
                        <div>
                            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">📚 Promedio por Área</p>
                            <div className="space-y-1.5">
                                {materias.slice(0, 5).map((m, i) => (
                                    <div key={m.nombre} className="flex items-center gap-2">
                                        <span className="text-[10px] text-white/30 w-3">{i + 1}</span>
                                        <span className="text-xs text-white/60 flex-1 truncate capitalize">{m.nombre}</span>
                                        <div className="w-16 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                            <div className="h-1.5 rounded-full" style={{ width: `${(m.avg / 100) * 100}%`, background: i === 0 ? '#22c55e' : i === materias.length - 1 ? '#ef4444' : '#3b82f6' }} />
                                        </div>
                                        <span className="text-xs text-white font-mono w-8 text-right">{m.avg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top 3 estudiantes */}
                    {top3.length > 0 && (
                        <div>
                            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">🏆 Top Estudiantes</p>
                            <div className="space-y-1.5">
                                {top3.map((e, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                                        <span className="text-sm" style={{ color: rankColors[i] }}>{['🥇', '🥈', '🥉'][i]}</span>
                                        <span className="text-xs text-white/80 flex-1 truncate">
                                            {e.informacion_personal.nombres} {e.informacion_personal.apellidos}
                                        </span>
                                        <span className="text-sm font-black text-white tabular-nums">{e.puntaje_global}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Exportar */}
                    <div className="pt-1">
                        <ExportMenu
                            estudiantes={data.estudiantes}
                            onOpenPreview={() => onOpenPreview(data.estudiantes)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DepartamentosPanel({ porDepartamento, totalEstudiantes, simulacroId, onOpenPreview }: Props) {
    const [sortBy, setSortBy] = useState<'promedio' | 'estudiantes' | 'superior'>('promedio');
    const [viewMode, setViewMode] = useState<'grid' | 'ranking'>('grid');
    const [search, setSearch] = useState('');

    const promedioGlobal = useMemo(() => {
        const deptos = porDepartamento.filter(([, d]) => d.promedio > 0);
        if (deptos.length === 0) return 0;
        return Math.round(deptos.reduce((sum, [, d]) => sum + d.promedio, 0) / deptos.length);
    }, [porDepartamento]);

    const mejorDepto = porDepartamento[0];
    const totalSuperior = porDepartamento.reduce((s, [, d]) => s + (d.niveles.superior || 0), 0);
    const deptoConMasSuperior = [...porDepartamento].sort((a, b) => (b[1].niveles.superior || 0) - (a[1].niveles.superior || 0))[0];

    const sorted = useMemo(() => {
        let list = [...porDepartamento];
        if (search) list = list.filter(([n]) => n.toLowerCase().includes(search.toLowerCase()));
        if (sortBy === 'promedio') list.sort((a, b) => b[1].promedio - a[1].promedio);
        else if (sortBy === 'estudiantes') list.sort((a, b) => b[1].estudiantes.length - a[1].estudiantes.length);
        else list.sort((a, b) => (b[1].niveles.superior || 0) - (a[1].niveles.superior || 0));
        return list;
    }, [porDepartamento, sortBy, search]);

    return (
        <div className="space-y-6">
            {/* Header con métricas globales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Departamentos', value: porDepartamento.length, icon: '🗺️', color: '#8b5cf6' },
                    { label: 'Promedio Global', value: promedioGlobal, icon: '📊', color: '#3b82f6' },
                    { label: '⭐ Nivel Superior', value: totalSuperior, icon: '', color: '#22c55e' },
                    { label: 'Mejor Dpto.', value: mejorDepto ? mejorDepto[1].promedio : 0, icon: '🏆', color: '#f59e0b', sub: mejorDepto?.[0] },
                ].map((m, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 text-center">
                        <p className="text-2xl font-black" style={{ color: m.color }}>{m.icon} {m.value}</p>
                        <p className="text-white/50 text-xs mt-1">{m.label}</p>
                        {m.sub && <p className="text-white/30 text-[10px] truncate mt-0.5" title={m.sub}>{m.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Barra de herramientas */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Búsqueda */}
                <div className="relative flex-1 min-w-[180px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
                    <input
                        type="text" placeholder="Buscar departamento..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                </div>

                {/* Ordenar */}
                <select
                    value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                    <option value="promedio">📊 Por Promedio</option>
                    <option value="estudiantes">👥 Por Estudiantes</option>
                    <option value="superior">⭐ Por Superior</option>
                </select>

                {/* Vista */}
                <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    {(['grid', 'ranking'] as const).map(v => (
                        <button key={v} onClick={() => setViewMode(v)}
                            className={`px-3 py-2 text-sm transition-all ${viewMode === v ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white'}`}>
                            {v === 'grid' ? '⊞ Grid' : '≡ Ranking'}
                        </button>
                    ))}
                </div>

                <span className="text-white/30 text-xs ml-auto">{sorted.length} departamentos</span>
            </div>

            {/* Ranking bar (vista de lista) */}
            {viewMode === 'ranking' && (
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                    <div className="grid grid-cols-[40px_1fr_90px_90px_90px_90px_120px] text-[11px] text-white/40 font-semibold uppercase tracking-wider px-4 py-2 border-b border-white/10">
                        <span>#</span><span>Departamento</span><span className="text-center">Estudiantes</span>
                        <span className="text-center">Promedio</span><span className="text-center">Nivel</span>
                        <span className="text-center">Completados</span><span className="text-center">Distribución</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {sorted.map(([nombre, data], idx) => {
                            const { nivel, color } = clasificarNivel(data.promedio);
                            const comp = data.estudiantes.filter(e => {
                                const s = e.sesiones || e.secciones_completadas || [];
                                return s.includes('S1') && s.includes('S2');
                            }).length;
                            const compPct = data.estudiantes.length > 0 ? ((comp / data.estudiantes.length) * 100).toFixed(0) : '0';
                            const totalN = data.estudiantes.length || 1;
                            return (
                                <div key={nombre} className="grid grid-cols-[40px_1fr_90px_90px_90px_90px_120px] items-center px-4 py-3 hover:bg-white/5 transition-colors">
                                    <span className="text-white/40 font-mono text-sm">{idx + 1}</span>
                                    <div>
                                        <span className="text-white text-sm font-semibold">{nombre}</span>
                                    </div>
                                    <span className="text-center text-white/70 text-sm">{data.estudiantes.length}</span>
                                    <span className="text-center font-black text-white">{data.promedio}</span>
                                    <span className="text-center text-xs font-bold" style={{ color }}>{nivel}</span>
                                    <span className="text-center text-sm" style={{ color: Number(compPct) >= 80 ? '#22c55e' : Number(compPct) >= 50 ? '#eab308' : '#ef4444' }}>{compPct}%</span>
                                    <div className="flex gap-0.5 justify-center">
                                        {[
                                            { key: 'superior', color: '#22c55e' },
                                            { key: 'alto', color: '#3b82f6' },
                                            { key: 'medio', color: '#eab308' },
                                            { key: 'bajo', color: '#ef4444' },
                                        ].map(n => (
                                            <div key={n.key} title={`${n.key}: ${data.niveles[n.key] || 0}`}
                                                className="h-4 rounded-sm" style={{ width: `${Math.max(((data.niveles[n.key] || 0) / totalN) * 60, 2)}px`, background: n.color, opacity: 0.7 }} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Grid de tarjetas */}
            {viewMode === 'grid' && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sorted.map(([nombre, data], idx) => (
                        <DeptoCard
                            key={nombre}
                            nombre={nombre}
                            data={data}
                            rank={idx + 1}
                            totalGlobal={totalEstudiantes}
                            promedioGlobal={promedioGlobal}
                            onOpenPreview={onOpenPreview}
                        />
                    ))}
                </div>
            )}

            {sorted.length === 0 && (
                <div className="text-center py-16 text-white/30">
                    <p className="text-4xl mb-3">🗺️</p>
                    <p>No se encontraron departamentos</p>
                </div>
            )}
        </div>
    );
}
