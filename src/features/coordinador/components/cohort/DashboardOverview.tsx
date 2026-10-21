'use client';

import React from 'react';
import { DashboardStats, InstitucionData } from '@shared/types';
import MetricCard from '@features/estudiante/components/MetricCard';
import HistogramaInteractivo from '@features/estudiante/components/HistogramaInteractivo';
import AnimatedGauge from '@features/estudiante/components/AnimatedGauge';
import RadarChart from '@features/estudiante/components/RadarChart';
import { AutoInsights } from '@features/estudiante/components/InsightCard';
import type { LucideIcon } from 'lucide-react';
import {
    CoordIcon,
    CoordIcons,
    LevelCountBadge,
    MateriaIcon,
    SeverityDot,
    type SeverityTone,
} from '@features/coordinador/components/ui/CoordinatorIcons';

interface DashboardOverviewProps {
    stats: DashboardStats;
    rankingInstitucional: [string, InstitucionData][];
}

function SectionTitle({ icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
    return (
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CoordIcon icon={icon} size={18} className="text-white/70" />
            {children}
        </h3>
    );
}

export default function DashboardOverview({ stats, rankingInstitucional }: DashboardOverviewProps) {
    const radarData = stats.promediosPorMateria.map(mat => {
        const labelMap: Record<string, string> = {
            'matemáticas': 'MAT',
            'lectura crítica': 'LEC',
            'sociales y ciudadanas': 'SOC',
            'ciencias naturales': 'CIEN',
            'inglés': 'ING'
        };
        return {
            label: labelMap[mat.nombre.toLowerCase()] || mat.nombre.substring(0, 4).toUpperCase(),
            value: mat.promedio,
            maxValue: 100
        };
    });

    const getMateriaStyle = (nombre: string) => {
        if (nombre.includes('matem')) return {
            stroke: 'stroke-violet-400', text: 'text-violet-300',
            bg: 'from-violet-600/30 to-violet-900/50', border: 'border-violet-400/40',
        };
        if (nombre.includes('lectura')) return {
            stroke: 'stroke-amber-400', text: 'text-amber-300',
            bg: 'from-amber-600/30 to-amber-900/50', border: 'border-amber-400/40',
        };
        if (nombre.includes('sociales')) return {
            stroke: 'stroke-emerald-400', text: 'text-emerald-300',
            bg: 'from-emerald-600/30 to-emerald-900/50', border: 'border-emerald-400/40',
        };
        if (nombre.includes('ciencias')) return {
            stroke: 'stroke-cyan-400', text: 'text-cyan-300',
            bg: 'from-cyan-600/30 to-cyan-900/50', border: 'border-cyan-400/40',
        };
        return {
            stroke: 'stroke-rose-400', text: 'text-rose-300',
            bg: 'from-rose-600/30 to-rose-900/50', border: 'border-rose-400/40',
        };
    };

    const levelRows: Array<{
        nivel: string;
        count: number;
        color: string;
        tone: SeverityTone;
        badgeTone: 'superior' | 'alto' | 'medio' | 'bajo';
    }> = [
        { nivel: 'Superior', count: stats.niveles.superior, color: 'bg-gradient-to-r from-green-500 to-emerald-400', tone: 'success', badgeTone: 'superior' },
        { nivel: 'Alto', count: stats.niveles.alto, color: 'bg-gradient-to-r from-blue-500 to-cyan-400', tone: 'info', badgeTone: 'alto' },
        { nivel: 'Medio', count: stats.niveles.medio, color: 'bg-gradient-to-r from-yellow-500 to-amber-400', tone: 'warning', badgeTone: 'medio' },
        { nivel: 'Bajo', count: stats.niveles.bajo, color: 'bg-gradient-to-r from-red-500 to-rose-400', tone: 'danger', badgeTone: 'bajo' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <MetricCard titulo="Total" valor={stats.total} icono={<CoordIcon icon={CoordIcons.Users} size={24} className="text-white" />} color="from-blue-600 to-blue-800" />
                <MetricCard titulo="Promedio" valor={stats.promedio} subtitulo="/500 pts" icono={<CoordIcon icon={CoordIcons.BarChart3} size={24} className="text-white" />} color="from-purple-600 to-purple-800" />
                <MetricCard titulo="Mediana" valor={stats.mediana} icono={<CoordIcon icon={CoordIcons.TrendingUp} size={24} className="text-white" />} color="from-indigo-600 to-indigo-800" />
                <MetricCard titulo="Máximo" valor={stats.maximo} icono={<CoordIcon icon={CoordIcons.Trophy} size={24} className="text-white" />} color="from-amber-500 to-amber-700" />
                <MetricCard titulo="P90" valor={stats.percentil90} subtitulo="Top 10%" icono={<CoordIcon icon={CoordIcons.Star} size={24} className="text-white" />} color="from-green-600 to-green-800" />
                <MetricCard titulo="D.E." valor={stats.desviacionEstandar} subtitulo={`CV: ${stats.coeficienteVariacion}%`} icono={<CoordIcon icon={CoordIcons.TrendingDown} size={24} className="text-white" />} color="from-cyan-500 to-cyan-700" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    titulo="Tasa Aprobación"
                    valor={`${stats.tasaAprobacion}%`}
                    subtitulo="≥300 pts"
                    icono={<CoordIcon icon={CoordIcons.CheckCircle2} size={24} className="text-white" />}
                    color="from-emerald-600 to-emerald-800"
                    animateValue={false}
                />
                <MetricCard titulo="Superior" valor={stats.niveles.superior} subtitulo={`${((stats.niveles.superior / stats.total) * 100).toFixed(0)}%`} icono={<CoordIcon icon={CoordIcons.Star} size={24} className="text-white" />} color="from-green-600 to-green-800" />
                <MetricCard titulo="P25" valor={stats.percentil25} subtitulo="Cuartil 1" icono={<CoordIcon icon={CoordIcons.BarChart3} size={20} className="text-white" />} color="from-orange-500 to-orange-700" size="sm" />
                <MetricCard titulo="IQR" valor={stats.rangoIntercuartilico} subtitulo="P75-P25" icono={<CoordIcon icon={CoordIcons.ArrowLeftRight} size={20} className="text-white" />} color="from-pink-500 to-pink-700" size="sm" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-premium rounded-2xl p-6 flex flex-col items-center justify-center">
                    <AnimatedGauge
                        value={stats.tasaAprobacion}
                        maxValue={100}
                        label="Tasa de Aprobación"
                        suffix="%"
                        sublabel={`${Math.round(stats.tasaAprobacion * stats.total / 100)} de ${stats.total} ≥300`}
                        size="lg"
                        colorScheme="auto"
                    />
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/50">
                        <span className="inline-flex items-center gap-1.5"><SeverityDot tone="danger" /> &lt;30%</span>
                        <span className="inline-flex items-center gap-1.5"><SeverityDot tone="warning" /> 30-50%</span>
                        <span className="inline-flex items-center gap-1.5"><SeverityDot tone="info" /> 50-70%</span>
                        <span className="inline-flex items-center gap-1.5"><SeverityDot tone="success" /> &gt;70%</span>
                    </div>
                </div>

                <div className="glass-premium rounded-2xl p-6">
                    <RadarChart data={radarData} size={300} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-premium rounded-2xl p-6">
                    <SectionTitle icon={CoordIcons.BarChart3}>Distribución por Nivel</SectionTitle>
                    <div className="space-y-3">
                        {levelRows.map((item, idx) => (
                            <div
                                key={item.nivel}
                                className="flex items-center gap-3 animate-slide-up"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <span className="w-24 text-sm text-white/70 flex items-center gap-1.5">
                                    <SeverityDot tone={item.tone} />
                                    <span>{item.nivel}</span>
                                </span>
                                <div className="flex-1 h-8 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} flex items-center justify-end pr-3 transition-all duration-1000 shadow-lg`}
                                        style={{ width: `${Math.max((item.count / stats.total) * 100, 5)}%` }}
                                    >
                                        <span className="text-white text-xs font-bold drop-shadow">{item.count}</span>
                                    </div>
                                </div>
                                <span className="w-14 text-right text-white/50 text-sm font-medium">
                                    {((item.count / stats.total) * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <HistogramaInteractivo distribucion={stats.distribucion} total={stats.total} />
            </div>

            <div className="glass-premium rounded-2xl p-6">
                <SectionTitle icon={CoordIcons.BookOpen}>Promedio por Materia</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {stats.promediosPorMateria.map((mat, idx) => {
                        const style = getMateriaStyle(mat.nombre.toLowerCase());
                        const porcentaje = mat.promedio;

                        return (
                            <div
                                key={mat.nombre}
                                className={`bg-gradient-to-br ${style.bg} rounded-2xl p-4 text-center border ${style.border} hover-lift animate-slide-up`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="relative w-20 h-20 mx-auto mb-2">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                        <circle cx="40" cy="40" r="32" fill="none" strokeWidth="6" className="stroke-white/10" />
                                        <circle
                                            cx="40" cy="40" r="32" fill="none" strokeWidth="6"
                                            className={`${style.stroke} transition-all duration-1000`}
                                            strokeLinecap="round"
                                            strokeDasharray={`${(porcentaje / 100) * 201} 201`}
                                            style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <MateriaIcon materia={mat.nombre} size={28} className={style.text} />
                                    </div>
                                </div>
                                <div className={`text-3xl font-black ${style.text}`}>{mat.promedio}</div>
                                <h4 className="text-white text-xs font-semibold capitalize mt-1 truncate">{mat.nombre}</h4>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-premium rounded-2xl p-6">
                    <SectionTitle icon={CoordIcons.Trophy}>Top 5 Estudiantes</SectionTitle>
                    <div className="space-y-3">
                        {stats.top5.map((est, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 glass rounded-xl p-3 hover-lift animate-slide-up"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900 shadow-lg shadow-yellow-500/30' :
                                    idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-lg shadow-gray-400/30' :
                                        idx === 2 ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-amber-100 shadow-lg shadow-amber-600/30' : 'bg-white/20 text-white'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium text-sm truncate student-name">
                                        {est.informacion_personal.nombres} {est.informacion_personal.apellidos}
                                    </div>
                                    <div className="text-white/40 text-xs truncate">{est.informacion_personal.institucion}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-gradient">{est.puntaje_global}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-premium rounded-2xl p-6">
                    <SectionTitle icon={CoordIcons.Lightbulb}>Insights del Simulacro</SectionTitle>
                    <AutoInsights stats={stats} />
                </div>
            </div>

            <div className="glass-premium rounded-2xl p-6">
                <SectionTitle icon={CoordIcons.Building2}>Ranking por Institución</SectionTitle>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-white/60 text-sm">
                                <th className="pb-3 px-2">#</th>
                                <th className="pb-3 px-2">Institución</th>
                                <th className="pb-3 px-2 text-center">Estudiantes</th>
                                <th className="pb-3 px-2 text-center">Promedio</th>
                                <th className="pb-3 px-2">Distribución</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankingInstitucional.slice(0, 10).map(([nombre, data], idx) => (
                                <tr
                                    key={nombre}
                                    className="border-t border-white/5 table-row-hover animate-slide-up"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <td className="py-3 px-2 text-white/50 font-bold">{idx + 1}</td>
                                    <td className="py-3 px-2 text-white font-medium">{nombre}</td>
                                    <td className="py-3 px-2 text-center text-white/70">{data.estudiantes.length}</td>
                                    <td className="py-3 px-2 text-center">
                                        <span className={`font-bold px-3 py-1 rounded-full text-sm ${data.promedio >= 400 ? 'bg-green-500/20 text-green-400' : data.promedio >= 325 ? 'bg-blue-500/20 text-blue-400' : data.promedio >= 250 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {data.promedio}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex flex-wrap gap-1 items-center">
                                            <LevelCountBadge label="Sup." count={data.niveles.superior} tone="superior" />
                                            <LevelCountBadge label="Alto" count={data.niveles.alto} tone="alto" />
                                            <LevelCountBadge label="Med." count={data.niveles.medio} tone="medio" />
                                            <LevelCountBadge label="Bajo" count={data.niveles.bajo} tone="bajo" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
