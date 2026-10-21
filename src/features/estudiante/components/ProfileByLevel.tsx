'use client';

import { useMemo } from 'react';
import { Estudiante } from '@shared/types';

interface ProfileByLevelProps {
    estudiantes: Estudiante[];
}

// Configuración de áreas
const AREAS_CONFIG = [
    { key: 'matematicas', name: 'Matemáticas' },
    { key: 'lectura_critica', name: 'Lectura Crítica' },
    { key: 'sociales_ciudadanas', name: 'Sociales' },
    { key: 'ciencias_naturales', name: 'Ciencias' },
    { key: 'ingles', name: 'Inglés' }
];

// Configuración de niveles
const NIVELES_CONFIG = {
    'Superior': { emoji: '🏆', color: 'emerald', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/30', textClass: 'text-emerald-400', rango: '> 400', minScore: 401 },
    'Alto': { emoji: '⭐', color: 'blue', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/30', textClass: 'text-blue-400', rango: '301-400', minScore: 301, maxScore: 400 },
    'Básico': { emoji: '📚', color: 'amber', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/30', textClass: 'text-amber-400', rango: '201-300', minScore: 201, maxScore: 300 },
    'Bajo': { emoji: '🚨', color: 'rose', bgClass: 'bg-rose-500/10', borderClass: 'border-rose-500/30', textClass: 'text-rose-400', rango: '≤ 200', maxScore: 200 }
};

type NivelKey = keyof typeof NIVELES_CONFIG;

export default function ProfileByLevel({ estudiantes }: ProfileByLevelProps) {
    const perfiles = useMemo(() => {
        // Agrupar estudiantes por nivel
        const grupos: Record<NivelKey, Estudiante[]> = {
            'Superior': [],
            'Alto': [],
            'Básico': [],
            'Bajo': []
        };

        estudiantes.forEach(est => {
            const global = Number(est.puntaje_global) || 0;
            if (global > 400) grupos['Superior'].push(est);
            else if (global > 300) grupos['Alto'].push(est);
            else if (global > 200) grupos['Básico'].push(est);
            else if (global > 0) grupos['Bajo'].push(est);
        });

        // Calcular estadísticas por nivel
        return Object.entries(grupos).map(([nivel, ests]) => {
            if (ests.length === 0) return null;

            const config = NIVELES_CONFIG[nivel as NivelKey];

            // Helper para obtener puntaje con múltiples keys posibles
            const getScore = (est: Estudiante, key: string): number => {
                if (!est.puntajes) return 0;
                if (est.puntajes[key]?.puntaje) return Number(est.puntajes[key].puntaje);
                // Nombres exactos del JSON primero
                const variations: Record<string, string[]> = {
                    'matematicas': ['matemáticas', 'matematicas', 'Matemáticas', 'MATEMATICAS'],
                    'lectura_critica': ['lectura crítica', 'lectura_critica', 'Lectura Crítica', 'LECTURA_CRITICA'],
                    'sociales_ciudadanas': ['sociales y ciudadanas', 'sociales_ciudadanas', 'Sociales y Ciudadanas', 'SOCIALES_CIUDADANAS'],
                    'ciencias_naturales': ['ciencias naturales', 'ciencias_naturales', 'Ciencias Naturales', 'CIENCIAS_NATURALES'],
                    'ingles': ['inglés', 'ingles', 'Inglés', 'INGLES']
                };
                for (const variant of (variations[key] || [])) {
                    if (est.puntajes[variant]?.puntaje) return Number(est.puntajes[variant].puntaje);
                }
                return 0;
            };

            // Promedio global
            const globalScores = ests.map(e => Number(e.puntaje_global) || 0);
            const promedioGlobal = globalScores.reduce((a, b) => a + b, 0) / globalScores.length;

            // Estadísticas por área
            const areasStats = AREAS_CONFIG.map(area => {
                const scores = ests.map(e => getScore(e, area.key)).filter(s => s > 0);
                return {
                    area: area.name,
                    key: area.key,
                    promedio: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
                };
            });

            // Encontrar fortaleza y debilidad
            const sorted = [...areasStats].sort((a, b) => b.promedio - a.promedio);
            const fortaleza = sorted[0];
            const debilidad = sorted[sorted.length - 1];
            const brecha = fortaleza.promedio - debilidad.promedio;

            // Recomendación
            let recomendacion = '';
            if (nivel === 'Superior') recomendacion = 'Programas de enriquecimiento y mentoría';
            else if (nivel === 'Alto') recomendacion = `Reforzar ${debilidad.area} para alcanzar nivel Superior`;
            else if (nivel === 'Básico') recomendacion = `Intervención focalizada en ${debilidad.area}`;
            else recomendacion = '¡ATENCIÓN URGENTE! Plan de intervención integral';

            return {
                nivel: nivel as NivelKey,
                config,
                count: ests.length,
                promedioGlobal,
                fortaleza,
                debilidad,
                brecha,
                recomendacion,
                areasStats
            };
        }).filter(Boolean);
    }, [estudiantes]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Premium */}
            <div className="relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/5 p-8 backdrop-blur-md">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="relative">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60 tracking-tight flex items-center gap-3">
                        <span className="text-3xl">👤</span> Perfil del Estudiante por Nivel
                    </h2>
                    <p className="text-sm font-medium text-white/50 mt-2">
                        Caracterización del estudiante promedio en cada nivel de desempeño
                    </p>
                </div>
            </div>

            {/* Cards de perfil por nivel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {perfiles.map((perfil) => perfil && (
                    <div
                        key={perfil.nivel}
                        className={`group relative overflow-hidden bg-[#0a0b10]/60 hover:bg-[#0a0b10]/80 backdrop-blur-2xl border ${perfil.config.borderClass} rounded-3xl p-8 space-y-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)]`}
                    >
                        {/* Glow effect */}
                        <div className={`absolute -top-32 -right-32 w-64 h-64 ${perfil.config.bgClass} opacity-0 blur-[80px] rounded-full pointer-events-none group-hover:opacity-100 transition-opacity duration-700`} />

                        {/* Header del nivel */}
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <div className={`${perfil.config.textClass} font-black text-2xl uppercase tracking-wider mb-1 flex items-center gap-2`}>
                                    {perfil.config.emoji} NIVEL {perfil.nivel}
                                </div>
                                <div className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">{perfil.config.rango} pts</div>
                            </div>
                            <div className="text-right">
                                <div className={`${perfil.config.textClass} text-5xl font-black tracking-tighter`}>
                                    {perfil.count}
                                </div>
                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">estudiantes</div>
                            </div>
                        </div>

                        {/* Estadísticas principales */}
                        <div className="space-y-4 text-sm relative z-10">
                            <div className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                                <span className="text-white/50 font-medium text-xs uppercase tracking-wider">Promedio Global</span>
                                <span className="font-black text-2xl text-white">{perfil.promedioGlobal.toFixed(0)}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <span>💪</span> Área Fuerte
                                    </div>
                                    <div className="font-semibold text-white/90 truncate">{perfil.fortaleza.area}</div>
                                    <div className="font-black text-emerald-400 mt-1">{perfil.fortaleza.promedio.toFixed(1)}</div>
                                </div>
                                
                                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <span>📉</span> Área Débil
                                    </div>
                                    <div className="font-semibold text-white/90 truncate">{perfil.debilidad.area}</div>
                                    <div className="font-black text-rose-400 mt-1">{perfil.debilidad.promedio.toFixed(1)}</div>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-black/20 border border-white/5">
                                <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Brecha</span>
                                <span className={`font-black text-lg ${perfil.brecha > 15 ? 'text-amber-400' : 'text-white/80'}`}>
                                    {perfil.brecha.toFixed(1)} <span className="text-xs font-medium opacity-50">pts</span>
                                </span>
                            </div>
                        </div>

                        {/* Recomendación */}
                        <div className="pt-4 mt-2 border-t border-white/10 relative z-10">
                            <div className="text-white/30 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                <span>💡</span> Recomendación Estratégica
                            </div>
                            <div className="text-white/80 text-sm font-medium leading-relaxed bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                {perfil.recomendacion}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabla detallada de promedios */}
            <div className="bg-[#0a0b10]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                    <span className="text-xl">📊</span> Detalle de Promedios por Área y Nivel
                </h3>

                <div className="overflow-x-auto relative z-10">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-4 text-left text-white/50 font-bold text-xs uppercase tracking-wider">Nivel</th>
                                {AREAS_CONFIG.map(area => (
                                    <th key={area.key} className="p-4 text-center text-white/50 font-bold text-xs uppercase tracking-wider">
                                        {area.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {perfiles.map((perfil) => perfil && (
                                <tr key={perfil.nivel} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className={`p-4 font-black ${perfil.config.textClass} tracking-wide`}>
                                        {perfil.config.emoji} {perfil.nivel.toUpperCase()}
                                    </td>
                                    {perfil.areasStats.map(stat => {
                                        let bgClass = '';
                                        let textClass = 'text-white';
                                        if (stat.promedio >= 80) { bgClass = 'bg-emerald-500/10 border-emerald-500/20'; textClass = 'text-emerald-400'; }
                                        else if (stat.promedio >= 60) { bgClass = 'bg-blue-500/10 border-blue-500/20'; textClass = 'text-blue-400'; }
                                        else if (stat.promedio >= 40) { bgClass = 'bg-amber-500/10 border-amber-500/20'; textClass = 'text-amber-400'; }
                                        else if (stat.promedio > 0) { bgClass = 'bg-rose-500/10 border-rose-500/20'; textClass = 'text-rose-400'; }

                                        return (
                                            <td key={stat.key} className="p-2">
                                                <div className={`mx-auto w-16 text-center py-2 rounded-xl border ${bgClass} transition-colors`}>
                                                    <span className={`font-mono font-bold ${textClass}`}>
                                                        {stat.promedio.toFixed(1)}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Guía de interpretación */}
            <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-32 h-32 bg-teal-500/20 blur-[50px] rounded-full pointer-events-none" />
                <h4 className="text-teal-400 font-black text-lg mb-6 flex items-center gap-2">
                    <span>📖</span> ¿Cómo usar este análisis?
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-white/70 relative z-10">
                    <div className="space-y-4">
                        <p className="font-bold text-white/90 text-xs uppercase tracking-wider">¿Qué significan los niveles?</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> <span className="text-emerald-400 font-bold w-20">SUPERIOR</span> <span>Excelencia académica (&gt;400)</span></div>
                            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-blue-400"></span> <span className="text-blue-400 font-bold w-20">ALTO</span> <span>Buen desempeño (301-400)</span></div>
                            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-amber-400"></span> <span className="text-amber-400 font-bold w-20">BÁSICO</span> <span>Requiere refuerzo (201-300)</span></div>
                            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-rose-400"></span> <span className="text-rose-400 font-bold w-20">BAJO</span> <span>Intervención urgente (≤200)</span></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="font-bold text-white/90 text-xs uppercase tracking-wider">¿Qué es la brecha entre áreas?</p>
                        <p className="text-white/60 leading-relaxed">Representa la diferencia de puntaje entre el área de mejor desempeño y el área más crítica del estudiante.</p>
                        <div className="flex gap-4 mt-2">
                            <div className="bg-black/20 rounded-xl p-3 border border-white/5 flex-1">
                                <div className="text-amber-400 font-black mb-1">&gt; 15 pts</div>
                                <div className="text-xs text-white/50">Perfil desigual, requiere balancear el estudio</div>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 border border-white/5 flex-1">
                                <div className="text-white/80 font-black mb-1">&lt; 10 pts</div>
                                <div className="text-xs text-white/50">Perfil homogéneo, desarrollo balanceado</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
