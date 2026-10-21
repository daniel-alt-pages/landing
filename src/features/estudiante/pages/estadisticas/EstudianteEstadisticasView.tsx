'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { resolveEstudianteDataModule } from '@features/estudiante/hooks/estudianteDataOptions';
import { useEstudiantePanelCache } from '@features/estudiante/context/EstudiantePanelCacheProvider';
import EstudianteLoadingState from '@features/estudiante/components/EstudianteLoadingState';
import { ensureEstudianteSessionBootstrap } from '@features/estudiante/hooks/ensureEstudianteSessionBootstrap';
import { isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';
import RadarChart from '@features/estudiante/components/RadarChart';
import AnimateIn from '@shared/components/animations/AnimateIn';
import { EstadisticasSkeleton } from '@/components/SkeletonLoader';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { SG_AREA_ORDER, SG_AREA_COLORS, sgAreaCoordAccent } from '@shared/lib/sgAreaColors';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ============== TYPES ==============
interface Puntaje {
    puntaje: number;
    correctas: number;
    total_preguntas: number;
}

interface Estudiante {
    informacion_personal: {
        nombres: string;
        apellidos: string;
        numero_identificacion: string;
    };
    puntaje_global: number;
    puntajes: Record<string, Puntaje>;
}

// ============== CONFIG ==============
const materiasConfig = SG_AREA_ORDER.map((key) => {
    const c = SG_AREA_COLORS[key];
    return {
        key: c.key,
        label: c.label,
        short: c.short,
        color: c.hex,
        gradient: c.gradient,
    };
});

// ============== ANIMATED NUMBER ==============
function AnimatedNumber({ value, duration = 1500, suffix = '' }: { value: number; duration?: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value, duration]);
    return <>{display}{suffix}</>;
}

// ============== CIRCULAR GAUGE ==============
function CircularGauge({ value, size = 160, label, onClick }: { value: number; size?: number; label: string; onClick?: () => void }) {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;
    const getColor = () => {
        if (value >= 80) return { stroke: '#10b981', glow: 'drop-shadow(0 0 10px rgba(16,185,129,0.8))' };
        if (value >= 60) return { stroke: '#3b82f6', glow: 'drop-shadow(0 0 10px rgba(59,130,246,0.8))' };
        if (value >= 40) return { stroke: '#f59e0b', glow: 'drop-shadow(0 0 10px rgba(245,158,11,0.8))' };
        return { stroke: '#ef4444', glow: 'drop-shadow(0 0 10px rgba(239,68,68,0.8))' };
    };
    const colors = getColor();
    return (
        <div
            className={`relative ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
            style={{ width: size, height: size }}
            onClick={onClick}
        >
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.stroke} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ filter: colors.glow, transition: 'stroke-dashoffset 1.5s ease-out' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white"><AnimatedNumber value={value} suffix="%" /></span>
                <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
                {onClick && <span className="text-[9px] text-violet-400 mt-1">Click para ver</span>}
            </div>
        </div>
    );
}

// ============== GLOW PROGRESS BAR ==============
function GlowProgress({ value, max = 100, color = '#8b5cf6' }: { value: number; max?: number; color?: string }) {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, boxShadow: `0 0 20px ${color}80` }} />
        </div>
    );
}

// ============== RANKING MEDAL WITH METALLIC ANIMATIONS ==============
function RankingMedal({ puesto, size = 'md' }: { puesto: number; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-base',
        lg: 'w-16 h-16 text-xl'
    };

    // Determine medal type based on ranking
    const getMedalStyle = () => {
        if (puesto === 1) {
            // GOLD - #1 - Luxurious gold with shimmer
            return {
                background: 'linear-gradient(135deg, #ffd700 0%, #ffec8b 25%, #ffd700 50%, #b8860b 75%, #ffd700 100%)',
                border: '3px solid #b8860b',
                boxShadow: '0 0 30px rgba(255,215,0,0.8), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.2)',
                animation: 'goldShimmer 2s ease-in-out infinite',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2 19h20l-2-8-4 3-4-6-4 6-4-3-2 8zm2-10a2 2 0 100-4 2 2 0 000 4zm16 0a2 2 0 100-4 2 2 0 000 4zm-8-4a2 2 0 100-4 2 2 0 000 4z"/></svg>',
                label: 'ORO',
                glowColor: 'rgba(255,215,0,0.6)'
            };
        } else if (puesto === 2) {
            // SILVER - #2 - Polished silver gleam
            return {
                background: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 25%, #c0c0c0 50%, #808080 75%, #c0c0c0 100%)',
                border: '3px solid #808080',
                boxShadow: '0 0 25px rgba(192,192,192,0.8), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.2)',
                animation: 'silverGleam 2.5s ease-in-out infinite',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="9" r="5" opacity="0.6"/><path d="M9 14l-2.5 7h2l3.5-4.5L15.5 21h2L15 14H9z" opacity="0.4"/></svg>',
                label: 'PLATA',
                glowColor: 'rgba(192,192,192,0.5)'
            };
        } else if (puesto <= 15) {
            // BRONZE - Top 3-15 - Antique bronze with warm glow
            return {
                background: 'linear-gradient(135deg, #cd7f32 0%, #daa520 25%, #cd7f32 50%, #8b4513 75%, #cd7f32 100%)',
                border: '3px solid #8b4513',
                boxShadow: '0 0 20px rgba(205,127,50,0.7), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
                animation: 'bronzeGlow 3s ease-in-out infinite',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="9" r="5" opacity="0.5"/><path d="M9 14l-2.5 7h2l3.5-4.5L15.5 21h2L15 14H9z" opacity="0.35"/></svg>',
                label: 'BRONCE',
                glowColor: 'rgba(205,127,50,0.4)'
            };
        }
        return null;
    };

    const medal = getMedalStyle();

    if (!medal) {
        // No medal for positions > 15
        return (
            <div className={`${sizeClasses[size]} rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center font-black text-slate-400`}>
                #{puesto}
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Outer glow ring */}
            <div
                className={`absolute inset-0 rounded-full blur-md`}
                style={{
                    background: medal.glowColor,
                    animation: medal.animation
                }}
            />

            {/* Medal body */}
            <div
                className={`${sizeClasses[size]} relative rounded-full flex flex-col items-center justify-center font-black text-slate-900 overflow-hidden`}
                style={{
                    background: medal.background,
                    border: medal.border,
                    boxShadow: medal.boxShadow
                }}
            >
                {/* Shimmer overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                        backgroundSize: '200% 200%',
                        animation: 'shimmerMove 2s linear infinite'
                    }}
                />

                {/* Position number */}
                <span className="relative z-10 leading-none" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                    #{puesto}
                </span>
                {size !== 'sm' && (
                    <span className="relative z-10 text-[8px] font-bold opacity-80">{medal.label}</span>
                )}
            </div>

            {/* CSS Animations - injected via style tag once */}
            <style jsx>{`
                @keyframes goldShimmer {
                    0%, 100% { filter: brightness(1) saturate(1); }
                    50% { filter: brightness(1.2) saturate(1.1); }
                }
                @keyframes silverGleam {
                    0%, 100% { filter: brightness(1) contrast(1); }
                    50% { filter: brightness(1.15) contrast(1.05); }
                }
                @keyframes bronzeGlow {
                    0%, 100% { filter: brightness(1) sepia(0); }
                    50% { filter: brightness(1.1) sepia(0.1); }
                }
                @keyframes shimmerMove {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

// ============== CLICKABLE METRIC CARD ==============
function ClickableCard({
    children, onClick, linkTo, router, glowColor = 'violet', className = ''
}: {
    children: React.ReactNode; onClick?: () => void; linkTo?: string; router?: any; glowColor?: string; className?: string
}) {
    const handleClick = () => {
        if (onClick) onClick();
        else if (linkTo && router) {
            sessionStorage.setItem('returnTo', '/estudiante/estadisticas');
            router.push(linkTo);
        }
    };
    const isClickable = onClick || linkTo;
    const glowColors: Record<string, string> = {
        violet: 'hover:shadow-violet-500/20 hover:border-violet-500/30',
        cyan: 'hover:shadow-cyan-500/20 hover:border-cyan-500/30',
        emerald: 'hover:shadow-emerald-500/20 hover:border-emerald-500/30',
        amber: 'hover:shadow-amber-500/20 hover:border-amber-500/30',
    };
    return (
        <div
            onClick={handleClick}
            className={`bg-slate-800/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 transition-all duration-300 ${isClickable ? `cursor-pointer hover:scale-[1.02] hover:shadow-xl ${glowColors[glowColor]}` : ''} ${className}`}
        >
            {children}
            {isClickable && <div className="mt-3 flex items-center gap-1 text-[10px] text-violet-400 font-medium"><span>→</span> Click para más detalles</div>}
        </div>
    );
}

// ============== EXPANDABLE MODAL (PREMIUM) ==============
function ExpandableModal({ isOpen, onClose, title, icon, accentColor = 'violet', children }: { isOpen: boolean; onClose: () => void; title: string; icon?: React.ReactNode; accentColor?: string; children: React.ReactNode }) {
    if (!isOpen) return null;
    const gradients: Record<string, string> = {
        blue: 'from-blue-500 via-blue-600 to-indigo-600',
        red: 'from-red-500 via-red-600 to-rose-600',
        violet: 'from-violet-600 via-purple-600 to-indigo-600',
        cyan: 'from-cyan-500 via-blue-500 to-indigo-600',
        emerald: 'from-emerald-500 via-green-500 to-teal-600',
        amber: 'from-orange-500 via-amber-500 to-orange-600',
        pink: 'from-pink-500 via-rose-500 to-red-500',
    };
    const glows: Record<string, string> = {
        blue: 'rgba(37,99,235,0.3)',
        red: 'rgba(239,68,68,0.3)',
        violet: 'rgba(139,92,246,0.3)',
        cyan: 'rgba(6,182,212,0.3)',
        emerald: 'rgba(34,197,94,0.3)',
        amber: 'rgba(249,115,22,0.3)',
        pink: 'rgba(236,72,153,0.3)',
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes shimmerBar { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
            `}</style>
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose}></div>
            <div
                className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10"
                style={{
                    background: 'linear-gradient(180deg, rgba(30,30,50,0.98) 0%, rgba(15,15,30,0.99) 100%)',
                    boxShadow: `0 25px 60px -12px rgba(0,0,0,0.7), 0 0 40px -8px ${glows[accentColor] || glows.violet}`,
                    animation: 'slideUp 0.3s ease-out',
                }}
            >
                {/* Accent bar */}
                <div className={`h-1 bg-gradient-to-r ${gradients[accentColor] || gradients.violet}`} style={{ backgroundSize: '200% 100%', animation: 'shimmerBar 3s linear infinite' }} />

                {/* Header */}
                <div className="sticky top-0 z-20 px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between border-b border-white/8" style={{ background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(20px)' }}>
                    <div className="flex items-center gap-3">
                        {icon && <span className="text-2xl">{icon}</span>}
                        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">{title}</h2>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 hover:rotate-90 border border-white/5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-7 overflow-y-auto max-h-[calc(90vh-80px)]" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

// ============== BACK BUTTON SMART ==============
function SmartBackButton({ router, navigateTo }: { router: any; navigateTo: (path: string) => void }) {
    const handleBack = () => {
        // Check if we can go back in browser history
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            // Fallback to dashboard
            navigateTo('/estudiante/dashboard');
        }
    };

    return (
        <button onClick={handleBack} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all flex items-center gap-2 hover:border-violet-500/30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Volver
        </button>
    );
}

// ============== MAIN COMPONENT ==============
export default function EstudianteEstadisticasView() {
    const router = useRouter();
    const pathname = usePathname();
    const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
    const [todos, setTodos] = useState<Estudiante[]>([]);
    const [simulacroActual, setSimulacroActual] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('simulacro_selected') || '';
        }
        return '';
    });

    const isDemoMode = isDemoEstudianteRoute(pathname);
    // ✅ NAVIGATION HELPER: Adjust routes based on demo mode
    const navigateTo = useCallback((path: string) => {
        if (isDemoMode) {
            // Replace /estudiante/ with /demo/ for demo mode
            const demoPath = path.replace('/estudiante/', '/demo/');
            router.push(demoPath);
        } else {
            router.push(path);
        }
    }, [isDemoMode, router]);

    // Modal states
    const [showRankingModal, setShowRankingModal] = useState(false);
    const [showAreaModal, setShowAreaModal] = useState<string | null>(null);
    const [showGroupStatsModal, setShowGroupStatsModal] = useState(false);
    const [historicalData, setHistoricalData] = useState<Record<string, any>>({});
    const [simulacrosDelEstudiante, setSimulacrosDelEstudiante] = useState<string[]>([]);

    const { bundle, loading: cacheLoading, error: cacheError, refresh } = useEstudiantePanelCache();

    useEffect(() => {
        if (!bundle) return;
        setEstudiante(bundle.estudiante);
        setTodos(bundle.todos);
        setSimulacroActual(bundle.simId);
    }, [bundle]);

    useEffect(() => {
        ensureEstudianteSessionBootstrap();
        const id = localStorage.getItem('student_id');
        if (!id && !cacheLoading) {
            router.replace('/login');
        }
    }, [cacheLoading, router]);

    const loading = cacheLoading && !bundle;

    // Histórico de evolución — diferido para no competir con la carga principal del panel
    useEffect(() => {
        if (!bundle || !estudiante) return;

        let cancelled = false;
        const loadHistory = async () => {
            const id = localStorage.getItem('student_id');
            if (!id || id === 'demo') return;
            try {
                const { getStudentSimulations, getStudentResults } = await resolveEstudianteDataModule();
                const sims = await getStudentSimulations(id);
                if (cancelled || sims.length < 2) return;
                setSimulacrosDelEstudiante(sims);
                const history: Record<string, any> = {};
                for (const sim of sims) {
                    if (cancelled) return;
                    try {
                        const result = await getStudentResults(id, sim);
                        if (result) history[sim] = result;
                    } catch {
                        /* skip */
                    }
                }
                if (!cancelled) setHistoricalData(history);
            } catch {
                /* skip */
            }
        };

        const timer = window.setTimeout(() => {
            void loadHistory();
        }, 2000);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [bundle, estudiante, simulacroActual]);

    // ============== COMPUTED STATS ==============
    const groupStats = useMemo(() => {
        if (!todos.length) return { promedio: 0, mediana: 0, p10: 0, p25: 0, p75: 0, p90: 0, min: 0, max: 0, desviacion: 0, total: 0, promediosPorMateria: {} as Record<string, number> };
        const puntajes = todos.map(e => e.puntaje_global).sort((a, b) => a - b);
        const n = puntajes.length;
        const calcPercentil = (p: number) => puntajes[Math.min(Math.floor((p / 100) * n), n - 1)];
        const promedio = Math.round(puntajes.reduce((a, b) => a + b, 0) / n);
        const mediana = n % 2 === 0 ? Math.round((puntajes[n / 2 - 1] + puntajes[n / 2]) / 2) : puntajes[Math.floor(n / 2)];
        const varianza = puntajes.reduce((sum, p) => sum + Math.pow(p - promedio, 2), 0) / n;
        const promediosPorMateria: Record<string, number> = {};
        materiasConfig.forEach(m => { promediosPorMateria[m.key] = Math.round(todos.reduce((acc, e) => acc + (e.puntajes[m.key]?.puntaje || 0), 0) / n); });
        return { promedio, mediana, p10: calcPercentil(10), p25: calcPercentil(25), p75: calcPercentil(75), p90: calcPercentil(90), min: puntajes[0], max: puntajes[n - 1], desviacion: Math.round(Math.sqrt(varianza) * 10) / 10, total: n, promediosPorMateria };
    }, [todos]);

    const rankingInfo = useMemo(() => {
        if (!estudiante || !todos.length) return { puesto: 0, total: 0, percentil: 0 };
        const sorted = [...todos].sort((a, b) => b.puntaje_global - a.puntaje_global);
        const puesto = sorted.findIndex(e => e.informacion_personal.numero_identificacion === estudiante.informacion_personal.numero_identificacion) + 1;
        return { puesto, total: todos.length, percentil: Math.round(((todos.length - puesto) / todos.length) * 100) };
    }, [estudiante, todos]);

    const rankingsPorMateria = useMemo(() => {
        if (!estudiante || !todos.length) return {} as Record<string, number>;
        const rankings: Record<string, number> = {};
        materiasConfig.forEach(m => {
            const sorted = [...todos].sort((a, b) => (b.puntajes[m.key]?.puntaje || 0) - (a.puntajes[m.key]?.puntaje || 0));
            rankings[m.key] = sorted.findIndex(e => e.informacion_personal.numero_identificacion === estudiante.informacion_personal.numero_identificacion) + 1;
        });
        return rankings;
    }, [estudiante, todos]);

    // Top 10 ranking
    const top10 = useMemo(() => {
        return [...todos].sort((a, b) => b.puntaje_global - a.puntaje_global).slice(0, 10);
    }, [todos]);

    const metrics = useMemo(() => {
        if (!estudiante) return null;
        const puntajes = Object.values(estudiante.puntajes);
        const totalCorrectas = puntajes.reduce((acc, p) => acc + p.correctas, 0);
        const totalPreguntas = puntajes.reduce((acc, p) => acc + p.total_preguntas, 0);
        const areas = materiasConfig.map(m => ({ ...m, puntaje: estudiante.puntajes[m.key]?.puntaje || 0 })).sort((a, b) => b.puntaje - a.puntaje);
        return { totalCorrectas, totalPreguntas, efectividad: totalPreguntas > 0 ? Math.round((totalCorrectas / totalPreguntas) * 100) : 0, mejorArea: areas[0], peorArea: areas[areas.length - 1], brecha: areas[0].puntaje - areas[areas.length - 1].puntaje };
    }, [estudiante]);

    const radarData = useMemo(() => {
        if (!estudiante) return null;
        return {
            labels: materiasConfig.map(m => m.short),
            datasets: [
                { label: 'Tu Puntaje', data: materiasConfig.map(m => estudiante.puntajes[m.key]?.puntaje || 0), backgroundColor: 'rgba(139, 92, 246, 0.3)', borderColor: '#8b5cf6', borderWidth: 3, pointBackgroundColor: '#8b5cf6', pointBorderColor: '#fff', pointRadius: 5 },
                { label: 'Promedio', data: materiasConfig.map(m => groupStats.promediosPorMateria[m.key] || 0), backgroundColor: 'rgba(148, 163, 184, 0.1)', borderColor: '#64748b', borderWidth: 2, borderDash: [5, 5], pointRadius: 0 }
            ]
        };
    }, [estudiante, groupStats]);

    const radarOptions: any = {
        scales: { r: { angleLines: { color: 'rgba(255,255,255,0.1)' }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { font: { size: 12, weight: 'bold' as const }, color: '#94a3b8' }, ticks: { display: false }, suggestedMin: 0, suggestedMax: 100 } },
        plugins: { legend: { display: true, position: 'bottom' as const, labels: { color: '#94a3b8', usePointStyle: true, padding: 20 } }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: 12, cornerRadius: 8 } },
        maintainAspectRatio: false
    };

    // Trend data for evolution section
    const trendData = useMemo(() => {
        if (Object.keys(historicalData).length < 2) return null;
        const sims = simulacrosDelEstudiante.filter(s => historicalData[s]);
        if (sims.length < 2) return null;
        const prev = sims[sims.length - 2];
        const curr = sims[sims.length - 1];
        const prevData = historicalData[prev];
        const currData = historicalData[curr];
        if (!prevData || !currData) return null;
        const globalPrev = typeof prevData.puntaje_global === 'number' ? prevData.puntaje_global : 0;
        const globalCurr = typeof currData.puntaje_global === 'number' ? currData.puntaje_global : 0;
        const globalDelta = globalCurr - globalPrev;
        const perSubject = materiasConfig.map(m => ({
            ...m,
            prev: prevData.puntajes?.[m.key]?.puntaje || 0,
            curr: currData.puntajes?.[m.key]?.puntaje || 0,
            delta: (currData.puntajes?.[m.key]?.puntaje || 0) - (prevData.puntajes?.[m.key]?.puntaje || 0),
        }));
        return { prev, curr, globalPrev, globalCurr, globalDelta, perSubject };
    }, [historicalData, simulacrosDelEstudiante]);

    if (loading) {
        return <EstadisticasSkeleton message="Cargando estadísticas" />;
    }

    if (cacheError && !estudiante) {
        return (
            <EstudianteLoadingState
                message={cacheError}
                fullScreen
                onRetry={() => void refresh(true)}
            />
        );
    }

    if (!estudiante) {
        return (
            <EstudianteLoadingState
                message="No pudimos cargar tus estadísticas."
                fullScreen
                onRetry={() => void refresh(true)}
            />
        );
    }

    if (!estudiante || !metrics) return null;

    const isLegacyDemoStudent =
        typeof window !== 'undefined' && localStorage.getItem('student_id') === 'demo';

    const isEstadisticasBlocked = isLegacyDemoStudent || isDemoMode;

    // Bloqueo demo: id legacy `demo` o ruta interactiva `/demo/estudiante/*`
    if (isEstadisticasBlocked) {
        return (
            <div className="min-h-screen bg-slate-950 text-white font-sans relative overflow-hidden flex items-center justify-center p-4">
                {/* Ambient glows */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-violet-600/20 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-32 right-[-120px] w-[520px] h-[520px] bg-cyan-600/15 rounded-full blur-[140px]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent" />
                </div>

                {/* Preview (blurred) */}
                <div className="absolute inset-0 opacity-40 blur-[2px] pointer-events-none flex flex-col p-6 gap-4 overflow-hidden">
                    <div className="flex items-center justify-between opacity-60">
                        <div className="h-8 w-40 bg-white/10 rounded-xl" />
                        <div className="h-10 w-10 bg-white/10 rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[{ c: 'bg-violet-500/40' }, { c: 'bg-cyan-500/40' }, { c: 'bg-emerald-500/40' }].map((x, i) => (
                            <div key={i} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 h-28 flex flex-col justify-between">
                                <div className="h-3.5 w-24 bg-white/10 rounded" />
                                <div className={`h-8 w-24 ${x.c} rounded-xl`} />
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 flex-1 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-4.5 w-44 bg-white/10 rounded" />
                            <div className="h-4.5 w-24 bg-white/10 rounded" />
                        </div>
                        <div className="grid grid-cols-5 gap-2 items-end h-40 opacity-60">
                            {[40, 70, 55, 30, 82].map((h, idx) => (
                                <div key={idx} className="w-full rounded-t-xl bg-violet-500/30" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Gate card */}
                <div className="relative z-10 w-full max-w-md">
                    <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
                        <div className="px-6 pt-6 pb-5 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-violet-600/40 blur-2xl opacity-60" />
                                    <div className="relative h-14 w-14 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/15 to-cyan-500/10 flex items-center justify-center">
                                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="url(#lockGradient)" strokeWidth={1.8} aria-hidden="true">
                                            <defs>
                                                <linearGradient id="lockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#7f13ec" />
                                                    <stop offset="100%" stopColor="#06b6d4" />
                                                </linearGradient>
                                            </defs>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Contenido Exclusivo</h2>
                                    <p className="text-sm text-white/55 leading-relaxed">
                                        {isDemoMode ? (
                                            <>
                                                En modo demo puedes explorar el dashboard. Las{' '}
                                                <span className="text-violet-300 font-semibold">Estadísticas Avanzadas</span>{' '}
                                                requieren iniciar sesión con tu cuenta.
                                            </>
                                        ) : (
                                            <>
                                                Las <span className="text-violet-300 font-semibold">Estadísticas Avanzadas</span> son privadas para estudiantes Premium.
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {[
                                    'Ranking y percentiles personalizados',
                                    'Radar de competencias por materia',
                                    'Comparación con el grupo completo',
                                    'Top 10 y análisis estratégico',
                                    'Tendencias y evolución histórica',
                                ].map((t) => (
                                    <div key={t} className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
                                        <div className="mt-0.5 h-6 w-6 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                                            <svg className="h-3.5 w-3.5 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-white/75 leading-snug">{t}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-center">
                                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1">
                                    <svg className="h-4 w-4 text-amber-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                                    <span className="text-[11px] font-black text-amber-300 uppercase tracking-[0.14em]">Plan Premium</span>
                                </div>
                            </div>

                            {isDemoMode ? (
                                <button
                                    type="button"
                                    onClick={() => router.push('/login')}
                                    className="block w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-violet-500/25 transition-transform hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                                >
                                    Iniciar sesión con mi cuenta
                                </button>
                            ) : (
                            <a
                                href="https://chat.whatsapp.com/G3zNDJvYVTX2hooRkIR7Ss"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-4 shadow-lg shadow-emerald-500/20 transition-transform hover:scale-[1.01] active:scale-[0.99] focus:outline-none">
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
                                    <div className="relative flex items-center gap-3">
                                        <svg className="h-6 w-6 text-white fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        <div className="min-w-0">
                                            <div className="text-base font-black text-white leading-tight">Obtener Acceso Premium</div>
                                            <div className="text-[11px] text-emerald-50/80 font-semibold">Respuesta inmediata por WhatsApp</div>
                                        </div>
                                        <svg className="ml-auto h-5 w-5 text-white/80 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </div>
                                    <span className="sr-only"> (se abre en una pestaña nueva)</span>
                                </div>
                            </a>
                            )}

                            <button
                                onClick={() => navigateTo('/estudiante/dashboard')}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm font-semibold text-white/65 hover:text-white hover:bg-white/[0.05] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
                            >
                                {isDemoMode ? '← Volver al demo' : '← Volver al Dashboard'}
                            </button>

                            <div className="flex items-center justify-center gap-3 text-[11px] text-white/35 font-semibold">
                                <span>Acceso inmediato</span>
                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                <span>Soporte 24/7</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white pb-20 font-sans relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[128px]"></div>
            </div>

            {/* ============== MODALS ============== */}

            {/* Ranking Modal */}
            <ExpandableModal isOpen={showRankingModal} onClose={() => setShowRankingModal(false)} title="Ranking Completo" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744z" clipRule="evenodd" /></svg>} accentColor="violet">
                <div className="space-y-5">
                    {/* Hero: Your Position */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/20 via-purple-600/15 to-indigo-600/20 border border-violet-500/20 p-5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-[60px]"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-xs text-violet-300 font-bold uppercase tracking-wider mb-1">Tu posición general</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-white">#{rankingInfo.puesto}</span>
                                    <span className="text-lg text-slate-400">de {rankingInfo.total}</span>
                                </div>
                            </div>
                            <RankingMedal puesto={rankingInfo.puesto} size="lg" />
                        </div>
                    </div>

                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-[#1A1B2E] rounded-xl p-3 text-center border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Percentil</p>
                            <p className="text-2xl font-black text-violet-400">{rankingInfo.percentil}%</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Superaste al {rankingInfo.percentil}%</p>
                        </div>
                        <div className="bg-[#1A1B2E] rounded-xl p-3 text-center border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Distancia al #1</p>
                            <p className="text-2xl font-black text-cyan-400">{top10.length > 0 ? top10[0].puntaje_global - estudiante.puntaje_global : 0}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">puntos de diferencia</p>
                        </div>
                        <div className="bg-[#1A1B2E] rounded-xl p-3 text-center border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Vs Promedio</p>
                            <p className={`text-2xl font-black ${estudiante.puntaje_global >= groupStats.promedio ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {estudiante.puntaje_global >= groupStats.promedio ? '+' : ''}{estudiante.puntaje_global - groupStats.promedio}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">pts {estudiante.puntaje_global >= groupStats.promedio ? 'arriba' : 'abajo'}</p>
                        </div>
                    </div >

                    {/* Strategic Insight */}
                    < div className="bg-gradient-to-r from-indigo-950/80 to-violet-950/80 rounded-xl p-4 border border-violet-500/15" >
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-violet-300">Análisis Estratégico</p>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    {rankingInfo.percentil >= 90
                                        ? `Estás en el Top 10% — nivel élite. Para llegar al #1 necesitas ${top10.length > 0 ? top10[0].puntaje_global - estudiante.puntaje_global : 0} puntos más. Enfócate en tu materia más débil (${metrics?.peorArea.label}) para maximizar tu puntaje.`
                                        : rankingInfo.percentil >= 75
                                            ? `Estás en el Top 25% — excelente rendimiento. Para entrar al Top 10% necesitas aproximadamente ${groupStats.p90 - estudiante.puntaje_global} puntos más. Refuerza ${metrics?.peorArea.label} donde tienes mayor margen de mejora.`
                                            : rankingInfo.percentil >= 50
                                                ? `Estás sobre el promedio. La brecha con el Top 25% es de ${groupStats.p75 - estudiante.puntaje_global} puntos. Prioriza ${metrics?.peorArea.label} y ${materiasConfig.find(m => m.key !== metrics?.peorArea.key && m.key !== metrics?.mejorArea.key)?.label || 'otras áreas'} para escalar posiciones.`
                                                : `Tienes oportunidad de mejorar significativamente. Enfócate en ${metrics?.peorArea.label} (tu área más débil) y establece como meta superar la mediana del grupo (${groupStats.mediana} pts).`
                                    }
                                </p>
                            </div>
                        </div>
                    </div >

                    {/* Ranking by Subject */}
                    < div >
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-cyan-500 rounded-full"></span>
                            Tu ranking por materia
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {materiasConfig.map(m => {
                                const ranking = rankingsPorMateria[m.key];
                                const pctil = Math.round(((todos.length - ranking) / todos.length) * 100);
                                return (
                                    <div key={m.key} className="flex items-center gap-3 p-3 bg-[#1A1B2E] rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer" onClick={() => { setShowRankingModal(false); setShowAreaModal(m.key); }}>
                                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center text-[10px] font-black shadow-lg`}>{m.short}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{m.label}</p>
                                            <p className="text-[10px] text-slate-500">Percentil {pctil}%</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-white">#{ranking}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div >

                    {/* Top 10 Table */}
                    < div >
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                            Top 10 del Simulacro
                        </h4>
                        <div className="space-y-2">
                            {top10.map((e, i) => {
                                const isYou = e.informacion_personal.numero_identificacion === estudiante.informacion_personal.numero_identificacion;
                                return (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isYou ? 'bg-violet-500/15 border-violet-500/30 ring-1 ring-violet-500/20' : 'bg-[#1A1B2E] border-white/5'}`}>
                                        <RankingMedal puesto={i + 1} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-white text-sm truncate">
                                                {e.informacion_personal.nombres.split(' ')[0].toUpperCase()} {e.informacion_personal.apellidos.split(' ')[0].toUpperCase()}
                                                {isYou && <span className="text-violet-400 ml-1.5 text-xs">(Tú)</span>}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xl font-black text-white">{e.puntaje_global}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button onClick={() => { setShowRankingModal(false); sessionStorage.setItem('returnTo', '/estudiante/estadisticas'); navigateTo('/estudiante/ranking'); }} className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 flex items-center justify-center gap-2">
                        Ver ranking completo
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                </div>
            </ExpandableModal>

            {/* Area Detail Modal */}
            <ExpandableModal isOpen={!!showAreaModal} onClose={() => setShowAreaModal(null)} title={showAreaModal ? materiasConfig.find(m => m.key === showAreaModal)?.label || '' : ''} icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} accentColor={showAreaModal ? sgAreaCoordAccent(showAreaModal) : 'violet'}>
                {
                    showAreaModal && (() => {
                        const materia = materiasConfig.find(m => m.key === showAreaModal);
                        const puntaje = estudiante.puntajes[showAreaModal];
                        const ranking = rankingsPorMateria[showAreaModal];
                        const promedio = groupStats.promediosPorMateria[showAreaModal];
                        if (!materia || !puntaje) return null;

                        const efectividad = puntaje.total_preguntas > 0 ? Math.round((puntaje.correctas / puntaje.total_preguntas) * 100) : 0;
                        const incorrectas = puntaje.total_preguntas - puntaje.correctas;
                        const percentilMateria = Math.round(((todos.length - ranking) / todos.length) * 100);
                        const nivel = puntaje.puntaje >= 80 ? { label: 'Experto', color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30', emoji: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg> } : puntaje.puntaje >= 60 ? { label: 'Avanzado', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', emoji: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> } : puntaje.puntaje >= 40 ? { label: 'Intermedio', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', emoji: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> } : { label: 'Básico', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30', emoji: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> };

                        // All students' scores in this subject
                        const allScores = todos.map(e => e.puntajes[showAreaModal]?.puntaje || 0).sort((a, b) => a - b);
                        const subjectMax = allScores[allScores.length - 1] || 100;
                        const subjectMin = allScores[0] || 0;
                        const subjectMedian = allScores.length % 2 === 0 ? Math.round((allScores[allScores.length / 2 - 1] + allScores[allScores.length / 2]) / 2) : allScores[Math.floor(allScores.length / 2)];

                        return (
                            <div className="space-y-5">
                                {/* Hero Score */}
                                <div className="relative overflow-hidden rounded-2xl p-5 border" style={{ background: `linear-gradient(135deg, ${materia.color}15, ${materia.color}08)`, borderColor: `${materia.color}25` }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${nivel.color}`}>
                                                {nivel.emoji} {nivel.label}
                                            </div>
                                            <p className="text-5xl font-black mt-3" style={{ color: materia.color, textShadow: `0 0 30px ${materia.color}60` }}>{puntaje.puntaje}</p>
                                            <p className="text-sm text-slate-400 mt-1">de 100 puntos posibles</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-20 h-20 relative">
                                                <svg width="80" height="80" className="transform -rotate-90">
                                                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                                                    <circle cx="40" cy="40" r="32" fill="none" stroke={materia.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 32}`} strokeDashoffset={`${2 * Math.PI * 32 * (1 - efectividad / 100)}`} style={{ filter: `drop-shadow(0 0 6px ${materia.color}80)`, transition: 'stroke-dashoffset 1s ease-out' }} />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-lg font-black text-white leading-none">{efectividad}<span className="text-[10px] font-bold text-white/60">%</span></span>
                                                    <span className="text-[8px] text-slate-400 mt-0.5">efect.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-[#1A1B2E] rounded-xl p-3 text-center border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Ranking</p>
                                        <p className="text-2xl font-black text-white">#{ranking}</p>
                                        <p className="text-[10px] text-slate-500">de {todos.length}</p>
                                    </div>
                                    <div className="bg-[#1A1B2E] rounded-xl p-3 text-center border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Percentil</p>
                                        <p className="text-2xl font-black text-violet-400">{percentilMateria}%</p>
                                    </div>
                                    <div className="bg-[#1A1B2E] rounded-xl p-3 text-center border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Correctas</p>
                                        <p className="text-2xl font-black text-emerald-400">{puntaje.correctas}</p>
                                        <p className="text-[10px] text-slate-500">de {puntaje.total_preguntas}</p>
                                    </div>
                                    <div className="bg-[#1A1B2E] rounded-xl p-3 text-center border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Incorrectas</p>
                                        <p className="text-2xl font-black text-rose-400">{incorrectas}</p>
                                        <p className="text-[10px] text-slate-500">por mejorar</p>
                                    </div>
                                </div>

                                {/* Aciertos Bar */}
                                <div className="bg-[#1A1B2E] rounded-xl p-4 border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-slate-400 font-medium">Desglose de respuestas</span>
                                        <span className="text-sm font-bold text-white">{puntaje.correctas} / {puntaje.total_preguntas}</span>
                                    </div>
                                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex">
                                        <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${efectividad}%`, background: `linear-gradient(90deg, ${materia.color}90, ${materia.color})`, boxShadow: `0 0 10px ${materia.color}40` }}></div>
                                        <div className="h-full rounded-r-full bg-rose-500/30" style={{ width: `${100 - efectividad}%` }}></div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-[10px]">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: materia.color }}></span><span className="text-slate-400">Correctas ({efectividad}%)</span></span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500/50"></span><span className="text-slate-400">Incorrectas ({100 - efectividad}%)</span></span>
                                    </div>
                                </div>

                                {/* Group Comparison */}
                                <div className="bg-[#1A1B2E] rounded-xl p-4 border border-white/5">
                                    <p className="text-sm text-slate-400 font-medium mb-3 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                        Comparación con el grupo
                                    </p>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Tu puntaje', value: puntaje.puntaje, color: materia.color },
                                            { label: 'Promedio grupo', value: promedio, color: '#64748b' },
                                            { label: 'Mediana grupo', value: subjectMedian, color: '#8b5cf6' },
                                            { label: 'Máximo grupo', value: subjectMax, color: '#06b6d4' },
                                            { label: 'Mínimo grupo', value: subjectMin, color: '#94a3b8' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="text-xs text-slate-400 w-28 flex-shrink-0">{item.label}</span>
                                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.value}%`, background: item.color, boxShadow: i === 0 ? `0 0 8px ${item.color}50` : 'none' }}></div>
                                                </div>
                                                <span className={`text-sm font-bold w-8 text-right ${i === 0 ? 'text-white' : 'text-slate-400'}`}>{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-bold ${puntaje.puntaje >= promedio ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                        {puntaje.puntaje >= promedio ? '↑' : '↓'} {Math.abs(puntaje.puntaje - promedio)} pts {puntaje.puntaje >= promedio ? 'sobre' : 'bajo'} el promedio
                                    </div>
                                </div>

                                {/* Strategic Tip */}
                                <div className="rounded-xl p-4 border" style={{ background: `${materia.color}08`, borderColor: `${materia.color}20` }}>
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></span>
                                        <div>
                                            <p className="text-sm font-bold" style={{ color: materia.color }}>Recomendación</p>
                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                {puntaje.puntaje >= 80
                                                    ? `Excelente dominio en ${materia.label}. Mantén este nivel y enfócate en las materias donde puedes ganar más puntos globales.`
                                                    : puntaje.puntaje >= 60
                                                        ? `Buen nivel en ${materia.label}. Para llegar a nivel Experto necesitas ${80 - puntaje.puntaje} puntos más. Revisa las ${incorrectas} preguntas que fallaste para encontrar patrones.`
                                                        : puntaje.puntaje >= 40
                                                            ? `${materia.label} tiene margen de mejora significativo. Con ${incorrectas} preguntas incorrectas, enfócate en los temas donde la dificultad del grupo es baja (preguntas que la mayoría acertó) pero tú fallaste.`
                                                            : `Prioriza ${materia.label} en tu plan de estudio. Acertaste solo ${puntaje.correctas} de ${puntaje.total_preguntas}. Comienza por los temas fundamentales y revisa tu análisis detallado de respuestas.`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => { setShowAreaModal(null); sessionStorage.setItem('returnTo', '/estudiante/estadisticas'); navigateTo('/estudiante/analisis'); }} className={`w-full py-3.5 bg-gradient-to-r ${materia.gradient} hover:brightness-110 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2`}>
                                    Analizar respuestas de {materia.label}
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </button>
                            </div>
                        );
                    })()
                }
            </ExpandableModal>

            {/* Group Stats Modal */}
            <ExpandableModal isOpen={showGroupStatsModal} onClose={() => setShowGroupStatsModal(false)} title="Estadísticas del Grupo" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} accentColor="cyan">
                <div className="space-y-5">
                    {/* Distribution Overview */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600/15 via-blue-600/10 to-indigo-600/15 border border-cyan-500/20 p-5">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-[80px]"></div>
                        <p className="text-xs text-cyan-300 font-bold uppercase tracking-wider mb-3">Resumen del grupo • {groupStats.total} estudiantes</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="text-center">
                                <p className="text-3xl font-black text-white">{groupStats.promedio}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Promedio</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-black text-violet-400">{groupStats.mediana}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Mediana</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-black text-rose-400">{groupStats.min}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Mínimo</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-black text-cyan-400">{groupStats.max}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Máximo</p>
                            </div>
                        </div>
                    </div>

                    {/* Percentiles */}
                    <div className="bg-[#1A1B2E] rounded-xl p-4 border border-white/5">
                        <p className="text-sm text-slate-400 font-medium mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-violet-500 rounded-full"></span>
                            Distribución por percentiles
                        </p>
                        <div className="space-y-2">
                            {[
                                { label: 'P90 (Élite)', value: groupStats.p90, color: '#06b6d4', desc: 'Solo el 10% supera este puntaje' },
                                { label: 'P75 (Alto)', value: groupStats.p75, color: '#10b981', desc: 'Top 25% del grupo' },
                                { label: 'P50 (Mediana)', value: groupStats.mediana, color: '#8b5cf6', desc: 'Punto medio exacto' },
                                { label: 'P25 (Bajo)', value: groupStats.p25, color: '#f59e0b', desc: 'El 75% supera este puntaje' },
                                { label: 'P10 (Mínimo)', value: groupStats.p10, color: '#ef4444', desc: 'El 90% supera este puntaje' },
                            ].map((p, i) => {
                                const isStudentHere = estudiante.puntaje_global >= p.value && (i === 0 || estudiante.puntaje_global < [groupStats.p90 + 1, groupStats.p90, groupStats.p75, groupStats.mediana, groupStats.p25][i]);
                                return (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isStudentHere ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-slate-900/50'}`}>
                                        <div className="w-24 flex-shrink-0">
                                            <span className="text-xs font-bold" style={{ color: p.color }}>{p.label}</span>
                                        </div>
                                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${(p.value / 500) * 100}%`, background: p.color, boxShadow: `0 0 6px ${p.color}40` }}></div>
                                        </div>
                                        <span className="text-sm font-black text-white w-10 text-right">{p.value}</span>
                                        {isStudentHere && <span className="text-[9px] text-violet-400 font-bold">← Tú</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Advanced Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#1A1B2E] rounded-xl p-4 border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Desviación Estándar</p>
                            <p className="text-2xl font-black text-pink-400">{groupStats.desviacion}</p>
                            <p className="text-[10px] text-slate-500 mt-1">
                                {groupStats.desviacion > 40 ? 'Alta dispersión en el grupo' : groupStats.desviacion > 25 ? 'Dispersión moderada' : 'Grupo homogéneo'}
                            </p>
                        </div>
                        <div className="bg-[#1A1B2E] rounded-xl p-4 border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Rango (Max-Min)</p>
                            <p className="text-2xl font-black text-amber-400">{groupStats.max - groupStats.min}</p>
                            <p className="text-[10px] text-slate-500 mt-1">puntos de brecha</p>
                        </div>
                        <div className="bg-[#1A1B2E] rounded-xl p-4 border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">IQR (P75-P25)</p>
                            <p className="text-2xl font-black text-blue-400">{groupStats.p75 - groupStats.p25}</p>
                            <p className="text-[10px] text-slate-500 mt-1">rango intercuartílico</p>
                        </div>
                        <div className="bg-[#1A1B2E] rounded-xl p-4 border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Tu Z-Score</p>
                            {(() => {
                                const zScore = groupStats.desviacion > 0 ? ((estudiante.puntaje_global - groupStats.promedio) / groupStats.desviacion).toFixed(2) : '0.00';
                                const zNum = parseFloat(zScore);
                                return <>
                                    <p className={`text-2xl font-black ${zNum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{zNum >= 0 ? '+' : ''}{zScore}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{Math.abs(zNum) < 0.5 ? 'Cercano al promedio' : zNum >= 1.5 ? 'Significativamente arriba' : zNum >= 0.5 ? 'Sobre el promedio' : zNum <= -1.5 ? 'Significativamente abajo' : 'Bajo el promedio'}</p>
                                </>;
                            })()}
                        </div>
                    </div>

                    {/* Per-subject Averages */}
                    <div className="bg-[#1A1B2E] rounded-xl p-4 border border-white/5">
                        <p className="text-sm text-slate-400 font-medium mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                            Promedios del grupo por área vs tu puntaje
                        </p>
                        <div className="space-y-3">
                            {materiasConfig.map(m => {
                                const avg = groupStats.promediosPorMateria[m.key] || 0;
                                const myScore = estudiante.puntajes[m.key]?.puntaje || 0;
                                const diff = myScore - avg;
                                return (
                                    <div key={m.key} className="flex items-center gap-3 cursor-pointer hover:bg-white/3 p-1 rounded-lg transition-colors" onClick={() => { setShowGroupStatsModal(false); setShowAreaModal(m.key); }}>
                                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center text-[10px] font-black shadow-lg flex-shrink-0`}>{m.short}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-400">{m.label}</span>
                                                <span className="text-slate-500">Prom: {avg} | Tú: <span className="text-white font-bold">{myScore}</span></span>
                                            </div>
                                            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden relative">
                                                <div className="h-full rounded-full" style={{ width: `${avg}%`, background: 'rgba(100,116,139,0.5)' }}></div>
                                                <div className="absolute top-0 h-full rounded-full" style={{ width: `${myScore}%`, background: `linear-gradient(90deg, ${m.color}80, ${m.color})`, boxShadow: `0 0 8px ${m.color}40` }}></div>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold w-12 text-right ${diff >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{diff >= 0 ? '+' : ''}{diff}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Where You Stand */}
                    <div className="bg-gradient-to-r from-indigo-950/80 to-violet-950/80 rounded-xl p-4 border border-violet-500/15">
                        <div className="flex items-start gap-3">
                            <span className="text-lg"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><circle cx="12" cy="12" r="6" strokeWidth="2" /><circle cx="12" cy="12" r="2" fill="currentColor" /></svg></span>
                            <div>
                                <p className="text-sm font-bold text-violet-300">Tu posición en el grupo</p>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Con {estudiante.puntaje_global} puntos estás en el percentil {rankingInfo.percentil}, lo que significa que superaste al {rankingInfo.percentil}% del grupo.
                                    {estudiante.puntaje_global > groupStats.promedio
                                        ? ` Estás ${estudiante.puntaje_global - groupStats.promedio} puntos sobre el promedio (${groupStats.promedio}) y ${estudiante.puntaje_global - groupStats.mediana} puntos sobre la mediana (${groupStats.mediana}).`
                                        : ` Necesitas ${groupStats.promedio - estudiante.puntaje_global} puntos más para alcanzar el promedio del grupo (${groupStats.promedio}).`
                                    }
                                    {` La materia con mayor promedio del grupo es ${materiasConfig.reduce((best, m) => (groupStats.promediosPorMateria[m.key] || 0) > (groupStats.promediosPorMateria[best.key] || 0) ? m : best, materiasConfig[0]).label}.`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </ExpandableModal >

            {/* ============== NAVBAR ============== */}
            <nav className="relative z-50 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-violet-500/30"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                        <div>
                            <h1 className="font-bold text-lg">Métricas de Desempeño</h1>
                            <span className="text-xs text-slate-400">{simulacroActual} • {(estudiante.informacion_personal?.nombres || '').split(' ')[0].toUpperCase()}</span>
                        </div>
                    </div>
                    <SmartBackButton router={router} navigateTo={navigateTo} />
                </div>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* ============== HERO SECTION ============== */}
                <AnimateIn type="scaleUp" duration={0.8}>
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/20 via-indigo-600/15 to-purple-600/20 backdrop-blur-xl border border-white/10 p-8 cursor-pointer group" onClick={() => setShowRankingModal(true)}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/30 rounded-full blur-[100px] group-hover:bg-violet-500/50 transition-all duration-700"></div>
                            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-[80px] group-hover:bg-indigo-500/30 transition-all duration-700"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 rounded-full text-violet-300 text-xs font-bold uppercase tracking-wider mb-4">
                                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></span>
                                        Tu Puntaje Global
                                    </div>
                                    <div className="text-7xl md:text-8xl font-black tracking-tight" style={{ textShadow: '0 0 60px rgba(139,92,246,0.5)' }}>
                                        <AnimatedNumber value={estudiante.puntaje_global} />
                                    </div>
                                    <p className="text-2xl text-slate-400 font-medium mt-2">/ 500 puntos</p>
                                    {/* Score progress bar */}
                                    <div className="w-full max-w-xs h-2 bg-slate-800/80 rounded-full overflow-hidden mt-3">
                                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-1000" style={{ width: `${(estudiante.puntaje_global / 500) * 100}%`, boxShadow: '0 0 12px rgba(139,92,246,0.5)' }}></div>
                                    </div>
                                    <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${estudiante.puntaje_global >= groupStats.promedio ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {estudiante.puntaje_global >= groupStats.promedio ? '↑' : '↓'} {Math.abs(estudiante.puntaje_global - groupStats.promedio)} pts vs promedio
                                    </div>
                                </div>
                                <CircularGauge value={rankingInfo.percentil} size={180} label="Percentil" onClick={() => setShowRankingModal(true)} />
                            </div>
                            <div className="absolute bottom-4 right-4 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">Click para ver ranking →</div>
                        </div>

                        <div className="space-y-4">
                            <ClickableCard onClick={() => setShowRankingModal(true)} glowColor="violet">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-slate-400 text-sm font-medium">Posición</span>
                                        <div className="text-4xl font-black text-white mt-1">
                                            #<AnimatedNumber value={rankingInfo.puesto} />
                                            <span className="text-xl text-slate-500 font-normal"> / {rankingInfo.total}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                            {rankingInfo.percentil >= 90 ? <><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744z" clipRule="evenodd" /></svg> Top 10%</> : rankingInfo.percentil >= 75 ? <><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg> Top 25%</> : rankingInfo.percentil >= 50 ? <><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Sobre promedio</> : <><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> En progreso</>}
                                        </p>
                                    </div>
                                    {rankingInfo.puesto <= 15 && <RankingMedal puesto={rankingInfo.puesto} size="lg" />}
                                </div>
                            </ClickableCard>

                            <ClickableCard linkTo="/estudiante/analisis" router={router} glowColor="cyan">
                                <span className="text-slate-400 text-sm font-medium">Efectividad</span>
                                <div className="text-4xl font-black text-cyan-400 mt-1"><AnimatedNumber value={metrics.efectividad} suffix="%" /></div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-1000" style={{ width: `${metrics.efectividad}%`, boxShadow: '0 0 8px rgba(6,182,212,0.4)' }}></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{metrics.totalCorrectas} de {metrics.totalPreguntas} correctas</p>
                            </ClickableCard>
                        </div>
                    </section>
                </AnimateIn>

                {/* ============== NEON TIMELINE - TU RENDIMIENTO ============== */}
                <AnimateIn type="fadeUp" delay={0.15} duration={0.7}>
                    <section className="group relative bg-[#131420] border border-white/5 rounded-3xl p-4 sm:p-6 overflow-visible transition-all duration-300 hover:border-violet-500/50 hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.15)]" onClick={() => setShowGroupStatsModal(true)}>

                        {/* Hover glow effect */}
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-600/10 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                        {/* Header */}
                        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 z-10 gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-8 sm:h-10 w-1.5 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-full" style={{ boxShadow: '0 0 15px rgba(168,85,247,0.8)' }}></div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">Tu Rendimiento</h3>
                                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium">Posición relativa al grupo</p>
                                </div>
                            </div>
                            <button className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-violet-300 bg-[#1A1B2E] px-3 sm:px-4 py-2 rounded-full hover:bg-violet-500 hover:text-white transition-all duration-300 border border-violet-500/30 w-fit" style={{ boxShadow: 'group-hover:0 0 15px rgba(139,92,246,0.4)' }}>
                                Ver detalles
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>

                        {/* NEON TIMELINE ZONE */}
                        <div className="relative z-20 mb-6 sm:mb-8 px-1 py-4">

                            {/* Zone Labels - Top */}
                            <div className="flex justify-between text-[9px] sm:text-[10px] font-bold tracking-widest uppercase mb-3 pointer-events-none">
                                <span className={`w-1/4 text-center ${rankingInfo.percentil < 25 ? 'text-rose-400 animate-pulse' : 'text-rose-500/40'}`} style={rankingInfo.percentil < 25 ? { textShadow: '0 0 8px rgba(244,63,94,0.8)' } : {}}>Bajo</span>
                                <span className={`w-1/4 text-center ${rankingInfo.percentil >= 25 && rankingInfo.percentil < 50 ? 'text-amber-400 animate-pulse' : 'text-amber-500/40'}`} style={rankingInfo.percentil >= 25 && rankingInfo.percentil < 50 ? { textShadow: '0 0 8px rgba(251,191,36,0.8)' } : {}}>Medio</span>
                                <span className={`w-1/4 text-center ${rankingInfo.percentil >= 50 && rankingInfo.percentil < 75 ? 'text-emerald-400 animate-pulse' : 'text-emerald-500/40'}`} style={rankingInfo.percentil >= 50 && rankingInfo.percentil < 75 ? { textShadow: '0 0 8px rgba(52,211,153,0.8)' } : {}}>Alto</span>
                                <span className={`w-1/4 text-center ${rankingInfo.percentil >= 75 ? 'text-cyan-400 animate-pulse' : 'text-cyan-500/40'}`} style={rankingInfo.percentil >= 75 ? { textShadow: '0 0 12px rgba(34,211,238,1)' } : {}}>Superior</span>
                            </div>

                            {/* Neon Progress Track */}
                            <div className="relative h-4 w-full rounded-full bg-[#0F1018] ring-1 ring-white/10 flex items-center overflow-visible">
                                <div className="absolute inset-0 rounded-full bg-slate-950/80"></div>

                                {/* Glowing Segments */}
                                <div className="relative w-full h-1.5 mx-1 rounded-full overflow-hidden flex pointer-events-none">
                                    <div className="flex-1 bg-gradient-to-r from-rose-900 to-rose-600" style={{ boxShadow: '0 0 15px rgba(225,29,72,0.6)' }}></div>
                                    <div className="flex-1 bg-gradient-to-r from-amber-700 to-amber-500" style={{ boxShadow: '0 0 15px rgba(245,158,11,0.6)' }}></div>
                                    <div className="flex-1 bg-gradient-to-r from-emerald-700 to-emerald-500" style={{ boxShadow: '0 0 15px rgba(16,185,129,0.6)' }}></div>
                                    <div className="flex-1 bg-gradient-to-r from-cyan-700 to-cyan-500" style={{ boxShadow: '0 0 15px rgba(6,182,212,0.6)' }}></div>
                                </div>

                                {/* Pulsing Nodes */}
                                <div className="absolute left-[25%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-[#0F1018] rounded-full border-2 border-rose-500 z-10 animate-pulse pointer-events-none"></div>
                                <div className="absolute left-[50%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-[#0F1018] rounded-full border-2 border-amber-500 z-10 animate-pulse pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
                                <div className="absolute left-[75%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-[#0F1018] rounded-full border-2 border-emerald-500 z-10 animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
                            </div>

                            {/* Score Axis */}
                            <div className="relative h-6 mt-2 w-full text-[8px] sm:text-[9px] text-slate-500 font-bold font-mono pointer-events-none">
                                <div className="absolute left-0 flex flex-col items-center"><div className="h-2 w-px bg-slate-800 mb-1"></div><span>{groupStats.min}</span></div>
                                <div className="absolute left-[25%] -translate-x-1/2 flex flex-col items-center"><div className="h-2 w-px bg-slate-800 mb-1"></div><span className="text-rose-500/50">{groupStats.p25}</span></div>
                                <div className="absolute left-[50%] -translate-x-1/2 flex flex-col items-center"><div className="h-2 w-px bg-slate-800 mb-1"></div><span className="text-amber-500/50">{groupStats.mediana}</span></div>
                                <div className="absolute left-[75%] -translate-x-1/2 flex flex-col items-center"><div className="h-2 w-px bg-slate-800 mb-1"></div><span className="text-emerald-500/50">{groupStats.p75}</span></div>
                                <div className="absolute right-0 flex flex-col items-center"><div className="h-2 w-px bg-slate-800 mb-1"></div><span>{groupStats.max}</span></div>
                            </div>

                            {/* USER LASER MARKER */}
                            <div
                                className="absolute flex flex-col items-center z-30 transition-all duration-1000 pointer-events-none"
                                style={{
                                    left: `${Math.min(Math.max(((estudiante.puntaje_global - groupStats.min) / (groupStats.max - groupStats.min)) * 100, 3), 97)}%`,
                                    top: '1.75rem'
                                }}
                            >
                                {/* Tooltip Badge */}
                                <div className="relative mb-1.5">
                                    <div className="bg-violet-600 text-white text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-violet-400 whitespace-nowrap z-20 relative" style={{ boxShadow: '0 0 20px rgba(124,58,237,0.8)', animation: 'pulse 2s infinite' }}>
                                        {estudiante.puntaje_global} PTS
                                    </div>
                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-violet-600 rotate-45 border-b border-r border-violet-400 z-10"></div>
                                </div>

                                {/* Laser Line */}
                                <div className="w-[2px] h-8 sm:h-10 bg-gradient-to-b from-violet-400 via-fuchsia-400 to-transparent" style={{ boxShadow: '0 0 10px rgba(232,121,249,1)' }}></div>

                                {/* Impact Point */}
                                <div className="w-3 h-3 bg-white rounded-full ring-2 ring-violet-500" style={{ boxShadow: '0 0 15px rgba(255,255,255,1)' }}></div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="group/card bg-[#1A1B2E] p-3 sm:p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center transition-colors border-l-2 border-l-transparent hover:border-l-violet-500">
                                <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover/card:text-violet-400 transition-colors">Tu Puntaje</p>
                                <p className="text-lg sm:text-xl font-black text-white tracking-tighter">{estudiante.puntaje_global}</p>
                            </div>
                            <div className="relative bg-gradient-to-br from-violet-900/40 to-indigo-900/40 p-3 sm:p-4 rounded-2xl border border-violet-500/30 flex flex-col items-center justify-center overflow-hidden" style={{ boxShadow: 'inset 0 0 20px rgba(139,92,246,0.1)' }}>
                                <div className="absolute inset-0 bg-violet-500/10 mix-blend-overlay"></div>
                                <p className="relative text-[8px] sm:text-[9px] text-violet-300 font-bold uppercase tracking-widest mb-1">Percentil</p>
                                <p className="relative text-xl sm:text-2xl font-black text-white tracking-tighter" style={{ textShadow: '0 0 10px rgba(167,139,250,0.5)' }}>{rankingInfo.percentil}%</p>
                            </div>
                            <div className="group/card bg-[#1A1B2E] p-3 sm:p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center transition-colors border-r-2 border-r-transparent hover:border-r-emerald-500">
                                <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover/card:text-emerald-400 transition-colors">Superaste a</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-lg sm:text-xl font-black text-emerald-400 tracking-tighter" style={{ textShadow: '0 0 8px rgba(52,211,153,0.4)' }}>{rankingInfo.total - rankingInfo.puesto}</p>
                                    <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold">pers.</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </AnimateIn>

                {/* ============== SKILLS & COMPETENCIAS ============== */}
                <AnimateIn type="fadeRight" delay={0.25} duration={0.7}>
                    <section className="bg-[#131420] border border-white/5 rounded-3xl p-4 sm:p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 sm:h-10 w-1.5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" style={{ boxShadow: '0 0 15px rgba(6,182,212,0.8)' }}></div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">Skills & Competencias</h3>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium">Nivel de dominio por área</p>
                            </div>
                        </div>

                        {/* Skills Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {materiasConfig.map((materia, index) => {
                                const puntaje = estudiante.puntajes[materia.key]?.puntaje || 0;
                                const nivel = puntaje >= 75 ? 'Experto' : puntaje >= 60 ? 'Avanzado' : puntaje >= 45 ? 'Intermedio' : 'Básico';
                                const nivelColor = puntaje >= 75 ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' : puntaje >= 60 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : puntaje >= 45 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30';
                                const ranking = rankingsPorMateria[materia.key];

                                return (
                                    <div
                                        key={materia.key}
                                        className="group bg-[#1A1B2E] rounded-2xl p-3 sm:p-4 border border-white/5 hover:border-white/15 hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); setShowAreaModal(materia.key); }}
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${materia.gradient} flex items-center justify-center text-sm sm:text-base font-black shadow-lg`} style={{ boxShadow: `0 0 20px ${materia.color}40` }}>
                                                    {materia.short}
                                                </div>
                                                <div>
                                                    <p className="text-sm sm:text-base font-bold text-white">{materia.label}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${nivelColor}`}>{nivel}</span>
                                                        <span className="text-[9px] sm:text-[10px] text-slate-500">Ranking #{ranking}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl sm:text-3xl font-black" style={{ color: materia.color, textShadow: `0 0 15px ${materia.color}60` }}>{puntaje}</p>
                                                <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">puntos</p>
                                            </div>
                                        </div>

                                        {/* Skill Progress Bar */}
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${puntaje}%`,
                                                    background: `linear-gradient(90deg, ${materia.color}80, ${materia.color})`,
                                                    boxShadow: `0 0 15px ${materia.color}60`
                                                }}
                                            ></div>
                                        </div>

                                        {/* Comparison with group */}
                                        <div className="flex justify-between items-center mt-2 text-[9px] sm:text-[10px]">
                                            <span className="text-slate-500">Promedio grupo: {groupStats.promediosPorMateria[materia.key]}</span>
                                            {puntaje >= (groupStats.promediosPorMateria[materia.key] || 0) ? (
                                                <span className="text-emerald-400 font-bold">↑ +{puntaje - (groupStats.promediosPorMateria[materia.key] || 0)} pts</span>
                                            ) : (
                                                <span className="text-amber-400 font-bold">↓ {puntaje - (groupStats.promediosPorMateria[materia.key] || 0)} pts</span>
                                            )}
                                        </div>

                                        {/* Hover indicator */}
                                        <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[9px] text-slate-500 flex items-center gap-1">Ver detalle <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </AnimateIn>

                {/* ============== STRENGTHS & WEAKNESSES ============== */}
                <AnimateIn type="flipUp" delay={0.35} duration={0.7}>
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 cursor-pointer hover:border-emerald-500/40 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)] transition-all duration-300" onClick={() => setShowAreaModal(metrics.mejorArea.key)}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                                <div><p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Tu Fortaleza</p><p className="text-white font-bold text-lg">{metrics.mejorArea.label}</p></div>
                            </div>
                            <div className="flex items-end justify-between">
                                <div className="text-5xl font-black text-emerald-400" style={{ textShadow: '0 0 20px rgba(16,185,129,0.3)' }}>{metrics.mejorArea.puntaje}</div>
                                <div className="text-right space-y-1">
                                    <div><p className="text-[10px] text-slate-500 uppercase">Ranking</p><p className="text-lg font-bold text-white">#{rankingsPorMateria[metrics.mejorArea.key]}</p></div>
                                    <p className="text-[10px] text-emerald-400/70">Efectiv. {estudiante.puntajes[metrics.mejorArea.key] ? Math.round((estudiante.puntajes[metrics.mejorArea.key].correctas / estudiante.puntajes[metrics.mejorArea.key].total_preguntas) * 100) : 0}%</p>
                                </div>
                            </div>
                            <p className="text-xs text-emerald-400/60 mt-3 group-hover:text-emerald-400 transition-colors">Click para ver detalle →</p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6 cursor-pointer hover:border-amber-500/40 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)] transition-all duration-300" onClick={() => setShowAreaModal(metrics.peorArea.key)}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
                                <div><p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Área de Mejora</p><p className="text-white font-bold text-lg">{metrics.peorArea.label}</p></div>
                            </div>
                            <div className="flex items-end justify-between">
                                <div className="text-5xl font-black text-amber-400" style={{ textShadow: '0 0 20px rgba(245,158,11,0.3)' }}>{metrics.peorArea.puntaje}</div>
                                <div className="text-right space-y-1">
                                    <div><p className="text-[10px] text-slate-500 uppercase">Brecha</p><p className="text-lg font-bold text-white">-{metrics.brecha} pts</p></div>
                                    <p className="text-[10px] text-amber-400/70">vs promedio: {(groupStats.promediosPorMateria[metrics.peorArea.key] || 0) > metrics.peorArea.puntaje ? <span className="text-rose-400">-{(groupStats.promediosPorMateria[metrics.peorArea.key] || 0) - metrics.peorArea.puntaje}</span> : <span className="text-emerald-400">+{metrics.peorArea.puntaje - (groupStats.promediosPorMateria[metrics.peorArea.key] || 0)}</span>}</p>
                                </div>
                            </div>
                            <p className="text-xs text-amber-400/60 mt-3 group-hover:text-amber-400 transition-colors">Click para ver detalle →</p>
                        </div>
                    </section>
                </AnimateIn>

                {/* ============== PERFIL POR ÁREA (RadarChart) + EVOLUCIÓN ============== */}
                <AnimateIn type="blurIn" delay={0.45} duration={0.7}>
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* RadarChart - Perfil por Área */}
                        <div className="bg-gradient-to-br from-slate-900 via-[#131420] to-indigo-950 border border-white/5 rounded-3xl p-4 sm:p-6 md:p-8 relative">
                            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                                <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/15 rounded-full blur-[60px]" />
                            </div>
                            {/* Section Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-8 w-1.5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" style={{ boxShadow: '0 0 15px rgba(139,92,246,0.8)' }} />
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">Perfil por Área</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Tu radar de competencias</p>
                                </div>
                            </div>
                            <RadarChart
                                data={materiasConfig.map((m, i) => ({
                                    label: ['LEC', 'MAT', 'SOC', 'NAT', 'ING'][i],
                                    value: estudiante.puntajes[m.key]?.puntaje || 0,
                                    maxValue: 100,
                                }))}
                            />
                        </div>

                        {/* Evolución entre Simulacros / Comparación */}
                        <div className="bg-[#131420] border border-white/5 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-600/10 rounded-full blur-[50px] pointer-events-none" />
                            {trendData ? (
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-8 w-1.5 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-full" style={{ boxShadow: '0 0 15px rgba(168,85,247,0.8)' }} />
                                        <div>
                                            <h3 className="text-lg font-bold text-white tracking-tight">Evolución entre Simulacros</h3>
                                            <p className="text-[10px] text-slate-400 font-medium">Comparación de rendimiento</p>
                                        </div>
                                    </div>

                                    {/* Global Score Comparison */}
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/80 to-indigo-900/40 rounded-2xl mb-6 border border-white/5">
                                        <div className="text-center">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{trendData.prev}</p>
                                            <p className="text-3xl font-black text-slate-400">{trendData.globalPrev}</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-12 h-px bg-gradient-to-r from-slate-600 to-violet-500" />
                                            <span className={`text-xs font-black px-3 py-1 rounded-full border ${trendData.globalDelta >= 0 ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' : 'text-rose-400 bg-rose-500/15 border-rose-500/30'}`}>
                                                {trendData.globalDelta >= 0 ? '+' : ''}{trendData.globalDelta}
                                            </span>
                                            <div className="w-12 h-px bg-gradient-to-r from-violet-500 to-slate-600" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{trendData.curr}</p>
                                            <p className="text-3xl font-black text-white" style={{ textShadow: '0 0 20px rgba(139,92,246,0.4)' }}>{trendData.globalCurr}</p>
                                        </div>
                                    </div>

                                    {/* Per-subject evolution */}
                                    <div className="space-y-3">
                                        {trendData.perSubject.map((s, i) => (
                                            <div key={s.key} className="group/row flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-default" onClick={() => setShowAreaModal(s.key)}>
                                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center text-[10px] font-black shadow-lg flex-shrink-0`} style={{ boxShadow: `0 0 10px ${s.color}30` }}>
                                                    {s.short}
                                                </div>
                                                <div className="flex-1 relative">
                                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(s.curr, 100)}%`, background: `linear-gradient(90deg, ${s.color}80, ${s.color})`, boxShadow: `0 0 10px ${s.color}40` }} />
                                                    </div>
                                                    {/* Previous score marker */}
                                                    {s.prev > 0 && (
                                                        <div className="absolute top-0 h-2 w-[3px] bg-white/40 rounded-full" style={{ left: `${Math.min(s.prev, 100)}%` }} title={`Anterior: ${s.prev}`} />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 min-w-[70px] justify-end">
                                                    <span className="text-sm font-black text-white">{s.curr}</span>
                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${s.delta > 0 ? 'text-emerald-400 bg-emerald-500/15' : s.delta < 0 ? 'text-rose-400 bg-rose-500/15' : 'text-slate-500 bg-slate-800'}`}>
                                                        {s.delta > 0 ? '↑' : s.delta < 0 ? '↓' : '='}{Math.abs(s.delta)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 text-[9px] text-slate-500">
                                        <div className="w-3 h-[3px] bg-white/40 rounded" /> <span>Puntaje anterior</span>
                                    </div>
                                </div>
                            ) : (
                                /* Fallback: Desglose por Área si no hay trend */
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-8 w-1.5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" style={{ boxShadow: '0 0 15px rgba(6,182,212,0.8)' }} />
                                        <div>
                                            <h3 className="text-lg font-bold text-white tracking-tight">Desglose por Área</h3>
                                            <p className="text-[10px] text-slate-400 font-medium">Puntaje vs promedio del grupo</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {materiasConfig.map(materia => {
                                            const puntaje = estudiante.puntajes[materia.key]?.puntaje || 0;
                                            const diff = puntaje - (groupStats.promediosPorMateria[materia.key] || 0);
                                            return (
                                                <div key={materia.key} className="p-3 rounded-xl bg-slate-900/30 border border-white/5 cursor-pointer hover:border-white/20 transition-colors" onClick={() => setShowAreaModal(materia.key)}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${materia.gradient} flex items-center justify-center text-xs font-bold shadow-lg`}>{materia.short}</div>
                                                            <span className="text-sm font-medium text-slate-300">{materia.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className={`text-xs font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{diff >= 0 ? '+' : ''}{diff}</span>
                                                            <span className="text-xl font-black text-white">{puntaje}</span>
                                                        </div>
                                                    </div>
                                                    <GlowProgress value={puntaje} max={100} color={materia.color} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </AnimateIn>

                {/* ============== GROUP STATS ============== */}
                <AnimateIn type="fadeUp" delay={0.55} duration={0.7}>
                    <section className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 cursor-pointer hover:border-violet-500/20 transition-all duration-300" onClick={() => setShowGroupStatsModal(true)}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-3">
                                <span className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></span>
                                Estadísticas del Grupo
                            </h3>
                            <span className="text-xs text-violet-400">{groupStats.total} estudiantes • Click para más →</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Promedio', value: groupStats.promedio, color: 'text-blue-400' },
                                { label: 'Mediana', value: groupStats.mediana, color: 'text-violet-400' },
                                { label: 'P10', value: groupStats.p10, color: 'text-slate-400' },
                                { label: 'P25', value: groupStats.p25, color: 'text-slate-400' },
                                { label: 'P75', value: groupStats.p75, color: 'text-emerald-400' },
                                { label: 'P90', value: groupStats.p90, color: 'text-amber-400' },
                                { label: 'D.E.', value: groupStats.desviacion, color: 'text-pink-400' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-slate-900/50 rounded-xl p-4 text-center border border-white/5 hover:border-white/10 transition-all duration-200 hover:scale-[1.02]" style={{ borderLeftColor: stat.color.includes('blue') ? '#60a5fa' : stat.color.includes('violet') ? '#a78bfa' : stat.color.includes('emerald') ? '#34d399' : stat.color.includes('amber') ? '#fbbf24' : stat.color.includes('pink') ? '#f472b6' : undefined, borderLeftWidth: '3px' }}>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
                                    <p className={`text-2xl font-black ${stat.color}`}><AnimatedNumber value={typeof stat.value === 'number' ? stat.value : 0} /></p>
                                </div>
                            ))}
                        </div>
                    </section>
                </AnimateIn>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-white/5">
                    <p className="text-slate-500 text-sm">Seamos Genios 2026 • {simulacroActual}</p>
                </div>
            </div>
        </div>
    );
}

