import React from 'react';
import { Estudiante, InstitucionData } from '@shared/types';
import ExportMenu from './ExportMenu';
import { Building2, Users, Trophy, ChevronRight, BarChart3, Activity } from 'lucide-react';

interface InstitucionesPanelProps {
    porInstitucion: [string, InstitucionData][];
    onOpenPreview: (estudiantes: Estudiante[]) => void;
}

export default function InstitucionesPanel({ porInstitucion, onOpenPreview }: InstitucionesPanelProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Encabezado Premium */}
            <div className="relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/5 p-8 backdrop-blur-md">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="relative flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-400 rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60 tracking-tight">
                            Análisis por Institución
                        </h2>
                        <p className="text-sm font-medium text-white/50 mt-1 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Rendimiento comparativo avanzado
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid de Instituciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {porInstitucion.map(([nombre, data], idx) => {
                    const isTop = idx === 0;
                    const performanceScore = (data.promedio / 500) * 100;
                    
                    let gradientTheme = 'from-rose-500 to-red-400';
                    let textTheme = 'text-rose-400';
                    let borderTheme = 'group-hover:border-rose-500/50';
                    let shadowTheme = 'hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)]';
                    
                    if (data.promedio >= 325) {
                        gradientTheme = 'from-emerald-500 to-teal-400';
                        textTheme = 'text-emerald-400';
                        borderTheme = 'group-hover:border-emerald-500/50';
                        shadowTheme = 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]';
                    } else if (data.promedio >= 250) {
                        gradientTheme = 'from-amber-500 to-yellow-400';
                        textTheme = 'text-amber-400';
                        borderTheme = 'group-hover:border-amber-500/50';
                        shadowTheme = 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]';
                    }

                    return (
                        <div key={nombre} className={`group relative bg-[#0a0b10]/60 hover:bg-[#0a0b10]/80 backdrop-blur-2xl rounded-3xl border border-white/5 ${borderTheme} p-6 flex flex-col transition-all duration-500 hover:-translate-y-2 ${shadowTheme} overflow-hidden`}>
                            {/* Decorative Glow */}
                            <div className={`absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br ${gradientTheme} opacity-0 blur-[80px] rounded-full pointer-events-none group-hover:opacity-10 transition-opacity duration-700`} />
                            
                            {isTop && (
                                <div className="absolute top-0 right-0">
                                    <div className="bg-gradient-to-r from-amber-400 to-yellow-600 text-black text-[10px] font-black px-4 py-1.5 rounded-bl-2xl shadow-lg flex items-center gap-1.5 tracking-wider uppercase">
                                        <Trophy className="w-3.5 h-3.5" />
                                        Top Rendimiento
                                    </div>
                                </div>
                            )}

                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex-1 pr-6">
                                        <h3 className="text-white font-bold text-xl leading-tight line-clamp-2" title={nombre}>
                                            {nombre}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-3 text-white/50 bg-white/5 w-fit px-3 py-1 rounded-full border border-white/5">
                                            <Users className="w-3.5 h-3.5" />
                                            <span className="text-xs font-semibold">{data.estudiantes.length} estudiantes</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 relative z-10">
                                        <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 tracking-tighter">
                                            {data.promedio.toFixed(0)}
                                        </p>
                                        <p className="text-white/40 text-[9px] uppercase font-bold tracking-[0.2em] mt-1">Global</p>
                                    </div>
                                </div>

                                {/* Barra de progreso animada */}
                                <div className="space-y-3 mb-8">
                                    <div className="flex justify-between text-xs font-bold text-white/50 uppercase tracking-wider">
                                        <span>Rendimiento</span>
                                        <span className={textTheme}>
                                            {performanceScore.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-3 border border-white/5 overflow-hidden p-0.5">
                                        <div
                                            className={`h-full rounded-full relative transition-all duration-1000 ease-out bg-gradient-to-r ${gradientTheme}`}
                                            style={{ width: `${performanceScore}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
                                        </div>
                                    </div>
                                </div>

                                {/* Distribución niveles */}
                                <div className="grid grid-cols-4 gap-3 mb-8">
                                    {[
                                        { label: 'SUP', val: data.niveles.superior, color: 'emerald' },
                                        { label: 'ALT', val: data.niveles.alto, color: 'blue' },
                                        { label: 'MED', val: data.niveles.medio, color: 'amber' },
                                        { label: 'BAJ', val: data.niveles.bajo, color: 'rose' }
                                    ].map(nivel => (
                                        <div key={nivel.label} className={`bg-${nivel.color}-500/5 border border-${nivel.color}-500/20 rounded-2xl p-3 text-center flex flex-col justify-center items-center group-hover:bg-${nivel.color}-500/10 transition-colors`}>
                                            <div className={`text-${nivel.color}-400 text-[10px] font-black uppercase tracking-wider mb-1`}>{nivel.label}</div>
                                            <div className="text-white font-bold text-lg">{nivel.val || 0}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Acciones Inferiores */}
                            <div className="pt-5 border-t border-white/10 flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2">
                                    <ExportMenu
                                        estudiantes={data.estudiantes}
                                        onOpenPreview={() => onOpenPreview(data.estudiantes)}
                                    />
                                </div>
                                <button 
                                    onClick={() => onOpenPreview(data.estudiantes)} 
                                    className="group/btn flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/5 hover:border-white/20"
                                >
                                    <span className="text-xs font-semibold">Detalles</span>
                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
