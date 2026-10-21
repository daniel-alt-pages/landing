'use client';
import { useState, useEffect, useCallback } from 'react';
import { getAccessLogs, computeAccessStats, cleanupOldLogs, type DailyAccessLog, type AccessLogEntry } from '@/lib/accessLogService';
import { Shield, Users, GraduationCap, ClipboardList, Activity, RefreshCw, Trash2, KeyRound, MonitorSmartphone, Clock } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    coordinador: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    estudiante: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const ROLE_ICONS: Record<string, any> = {
    admin: Shield,
    coordinador: ClipboardList,
    estudiante: GraduationCap,
};

export default function AccessMonitor() {
    const [logs, setLogs] = useState<DailyAccessLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);
    const [cleaning, setCleaning] = useState(false);

    const loadLogs = useCallback(async () => {
        setLoading(true);
        const data = await getAccessLogs(days);
        setLogs(data);
        setLoading(false);
    }, [days]);

    useEffect(() => { loadLogs(); }, [loadLogs]);

    const stats = computeAccessStats(logs);

    const handleCleanup = async () => {
        if (!confirm('¿Eliminar logs con más de 30 días? Esta acción es irreversible.')) return;
        setCleaning(true);
        const deleted = await cleanupOldLogs();
        alert(`✅ ${deleted} documentos eliminados`);
        setCleaning(false);
        loadLogs();
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30 text-purple-400">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Monitor de Accesos</h2>
                        <p className="text-white/50 text-sm mt-1">Registro y análisis de sesiones en tiempo real</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <option value={3} className="bg-gray-900">Últimos 3 días</option>
                            <option value={7} className="bg-gray-900">Últimos 7 días</option>
                            <option value={14} className="bg-gray-900">Últimos 14 días</option>
                            <option value={30} className="bg-gray-900">Últimos 30 días</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 group-hover:text-white/80 transition-colors">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <button onClick={loadLogs} disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white text-sm transition-all disabled:opacity-50 group">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                    <button onClick={handleCleanup} disabled={cleaning}
                        className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 text-sm transition-all disabled:opacity-50">
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Limpiar</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <StatCard label="Total Logins" value={stats.totalLogins} icon={KeyRound} color="purple" />
                <StatCard label="Usuarios Únicos" value={stats.uniqueUsers} icon={Users} color="blue" />
                <StatCard label="Estudiantes" value={stats.byRole.estudiante || 0} icon={GraduationCap} color="emerald" />
                <StatCard label="Coordinadores" value={stats.byRole.coordinador || 0} icon={ClipboardList} color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Activity Chart */}
                    {stats.byDay.length > 0 && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
                            <h3 className="text-white/90 text-base font-semibold mb-6 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-purple-400" />
                                Actividad por Día
                            </h3>
                            <div className="flex items-end gap-3 h-48 mt-4">
                                {stats.byDay.map((day, i) => {
                                    const maxCount = Math.max(...stats.byDay.map(d => d.count), 1);
                                    const height = (day.count / maxCount) * 100;
                                    return (
                                        <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                                            {/* Tooltip */}
                                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white pointer-events-none whitespace-nowrap z-10">
                                                {day.count} accesos
                                            </div>
                                            <div className="w-full relative h-full flex items-end">
                                                <div className="w-full rounded-xl bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-1000 opacity-80 group-hover:opacity-100 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                                                    style={{ height: `${Math.max(height, 8)}%`, animationDelay: `${i * 50}ms` }} />
                                            </div>
                                            <span className="text-[10px] text-white/40 truncate w-full text-center group-hover:text-white/80 transition-colors">
                                                {formatDate(day.date)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Top Users */}
                    {stats.topUsers.length > 0 && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                            <h3 className="text-white/90 text-base font-semibold mb-6 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-400" />
                                Usuarios Más Activos
                            </h3>
                            <div className="space-y-3">
                                {stats.topUsers.slice(0, 10).map((user, i) => {
                                    const Icon = ROLE_ICONS[user.role] || Users;
                                    return (
                                        <div key={user.email} className="group flex items-center gap-4 py-3 px-4 bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10 rounded-2xl transition-all duration-300">
                                            <div className="w-6 text-center">
                                                <span className={`text-sm font-bold ${i < 3 ? 'text-amber-400' : 'text-white/30'}`}>#{i + 1}</span>
                                            </div>
                                            <div className={`p-2 rounded-xl border ${ROLE_COLORS[user.role] || 'bg-white/5 border-white/10 text-white/50'}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white/90 text-sm font-medium truncate group-hover:text-white transition-colors">{user.email}</div>
                                                <div className="text-white/40 text-xs mt-0.5 capitalize">{user.role}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white font-bold text-lg leading-none">{user.count}</div>
                                                <div className="text-white/40 text-[10px] uppercase font-semibold tracking-wider mt-1">Accesos</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-1">
                    {/* Recent Logins */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white/90 text-base font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-400" />
                                Últimos Accesos
                            </h3>
                            <div className="px-2.5 py-1 bg-white/5 rounded-full text-xs text-white/50 font-medium">Live</div>
                        </div>

                        {loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                                <p className="text-white/40 text-sm animate-pulse">Sincronizando registros...</p>
                            </div>
                        ) : stats.recentLogins.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                                <MonitorSmartphone className="w-12 h-12 mb-3 text-white/20" />
                                <p className="text-white/60 text-sm">No hay actividad reciente</p>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                {stats.recentLogins.map((entry, i) => {
                                    const Icon = ROLE_ICONS[entry.role] || Users;
                                    return (
                                        <div key={`${entry.email}-${entry.timestamp}-${i}`}
                                            className="group relative flex gap-4 p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300">
                                            <div className="shrink-0 mt-1">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${ROLE_COLORS[entry.role]}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-white/90 text-sm font-medium truncate group-hover:text-white transition-colors">{entry.email}</p>
                                                    <span className="text-white/40 text-[10px] font-mono shrink-0 ml-2">{formatTime(entry.timestamp)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wider ${ROLE_COLORS[entry.role]}`}>
                                                        {entry.role}
                                                    </span>
                                                    <span className="text-white/30 text-xs truncate" title={entry.userAgent}>
                                                        {entry.userAgent.split(' ')[0] || 'Unknown device'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
    const styles: Record<string, { bg: string, text: string, shadow: string }> = {
        purple: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]' },
        blue: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]' },
        emerald: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' },
        amber: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]' },
    };

    const style = styles[color] || styles.purple;

    return (
        <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:${style.shadow}`}>
            {/* Background Glow */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-[40px] opacity-20 ${style.bg.split(' ')[0]}`} />
            
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl border ${style.bg} ${style.text}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            
            <div>
                <p className="text-3xl font-black text-white tracking-tight">{value.toLocaleString()}</p>
                <p className="text-white/50 text-sm mt-1 font-medium">{label}</p>
            </div>
        </div>
    );
}
