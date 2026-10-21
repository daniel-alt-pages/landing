'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Estudiante } from '@shared/types';
import type { RankingEntry } from '@features/simulacro/lib/firestoreService';
import { resolveEstudianteDataModule } from '@features/estudiante/hooks/estudianteDataOptions';
import { useEstudiantePanelCache } from '@features/estudiante/context/EstudiantePanelCacheProvider';
import { readStudentSelectedSimulacro } from '@features/estudiante/lib/studentNavPolicy';
import EstudianteLoadingState from '@features/estudiante/components/EstudianteLoadingState';
import { ensureEstudianteSessionBootstrap } from '@features/estudiante/hooks/ensureEstudianteSessionBootstrap';
import { getAllProfilePhotos } from '@/lib/profileService';
import AnimateIn from '@shared/components/animations/AnimateIn';
import ProfilePreviewModal from '@/components/ProfilePreviewModal';
import { rankingStudentContextFromInformacionPersonal } from '@features/curso/pages/seguimiento/lib/rankingStudentContext';
import { RankingSkeleton } from '@/components/SkeletonLoader';
import { SG_AREA_COLORS, sgAreaHexPair } from '@shared/lib/sgAreaColors';
import {
    matchesStudentSearch,
    studentDocumentId,
    studentFullName,
    studentInstitucion,
    getStudentPerformanceLevel,
} from '@shared/lib/studentDisplay';
import { StudentLevelFilterPills } from '@features/coordinador/components/CoordinatorStudentListTable';



// ============== SVG ICONS (No emojis as per UUPM guidelines) ==============
const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
    </svg>
);

const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
        <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
    </svg>
);

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm4.5 7.5a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-2.25a.75.75 0 0 1 .75-.75Zm3.75-1.5a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0V12Zm2.25-3a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0V9.75A.75.75 0 0 1 13.5 9Zm3.75-1.5a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Z" clipRule="evenodd" />
    </svg>
);

const BuildingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M4.5 2.25a.75.75 0 0 0 0 1.5v16.5h-.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5h-.75V3.75a.75.75 0 0 0 0-1.5h-15ZM9 6a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5H9Zm-.75 3.75A.75.75 0 0 1 9 9h1.5a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75ZM9 12a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5H9Zm3.75-5.25A.75.75 0 0 1 13.5 6H15a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM13.5 9a.75.75 0 0 0 0 1.5H15a.75.75 0 0 0 0-1.5h-1.5Zm-.75 3.75a.75.75 0 0 1 .75-.75H15a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM9 19.5v-2.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 9 19.5Z" clipRule="evenodd" />
    </svg>
);

const StarIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
    </svg>
);

const ArrowUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06l-6.22-6.22V21a.75.75 0 0 1-1.5 0V4.81l-6.22 6.22a.75.75 0 1 1-1.06-1.06l7.5-7.5Z" clipRule="evenodd" />
    </svg>
);

const ArrowDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v16.19l6.22-6.22a.75.75 0 1 1 1.06 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 1 1 1.06-1.06l6.22 6.22V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
);

// Design System Variables (from UUPM)
const COLORS = {
    primary: '#1E40AF',
    secondary: '#3B82F6',
    cta: '#F59E0B',
    background: '#F8FAFC',
    text: '#1E3A8A',
    rank1: '#FFD700', // Gold
    rank2: '#C0C0C0', // Silver
    rank3: '#CD7F32', // Bronze
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
};

// Helper para obtener iniciales
const getInitials = (nombre: string, apellido: string) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
};

// Helper para color del avatar basado en nombre
const getAvatarGradient = (nombre: string): string => {
    const gradients = [
        'from-blue-500 to-indigo-600',
        'from-violet-500 to-purple-600',
        'from-cyan-500 to-blue-600',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
    ];
    const hash = nombre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
};

// Helper para clasificar nivel con colores del design system
const clasificarNivel = (puntaje: number): { nivel: string; color: string; bg: string; border: string } => {
    if (puntaje >= 400) return { nivel: 'Superior', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (puntaje >= 325) return { nivel: 'Alto', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (puntaje >= 250) return { nivel: 'Medio', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { nivel: 'Bajo', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
};

const RANKING_TARGET_TOP = 20;

const getRankingScore = (entry: RankingEntry | undefined, subjectKey?: string): number => {
    if (!entry) return 0;
    if (!subjectKey) return Number(entry.puntaje_global) || 0;
    const rawScore = entry.puntajes?.[subjectKey];
    return typeof rawScore === 'object' && rawScore !== null
        ? Number(rawScore.puntaje) || 0
        : Number(rawScore) || 0;
};

const formatRankingScore = (score: number): string => {
    if (Number.isInteger(score)) return String(score);
    const rounded = Math.round(score * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

// ============== RANKING MEDAL COMPONENT (SVG-based, no emojis) ==============
function RankingMedal({ puesto, size = 'md' }: { puesto: number; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-14 h-14 text-base'
    };

    const getMedalStyle = (): {
        bg: string;
        border: string;
        shadow: string;
        glow: string;
        glowAnim: string;
        textColor: string;
    } | null => {
        if (puesto === 1) {
            return {
                bg: 'linear-gradient(135deg, rgb(255,215,0) 0%, rgb(255,236,139) 25%, rgb(255,215,0) 50%, rgb(184,134,11) 75%, rgb(255,215,0) 100%)',
                border: '3px solid rgb(184,134,11)',
                shadow: 'rgba(255,215,0,0.8) 0px 0px 30px, rgba(255,255,255,0.6) 0px 2px 4px inset, rgba(0,0,0,0.2) 0px -2px 4px inset',
                glow: 'rgba(255,215,0,0.6)',
                glowAnim: 'goldShimmer 2s ease-in-out infinite',
                textColor: 'text-slate-900',
            };
        } else if (puesto === 2) {
            return {
                bg: 'linear-gradient(135deg, rgb(192,192,192) 0%, rgb(232,232,232) 25%, rgb(192,192,192) 50%, rgb(128,128,128) 75%, rgb(192,192,192) 100%)',
                border: '3px solid rgb(128,128,128)',
                shadow: 'rgba(192,192,192,0.8) 0px 0px 25px, rgba(255,255,255,0.8) 0px 2px 4px inset, rgba(0,0,0,0.2) 0px -2px 4px inset',
                glow: 'rgba(192,192,192,0.5)',
                glowAnim: 'silverGleam 2.5s ease-in-out infinite',
                textColor: 'text-slate-900',
            };
        } else if (puesto <= 5) {
            return {
                bg: 'linear-gradient(135deg, rgb(205,127,50) 0%, rgb(218,165,32) 25%, rgb(205,127,50) 50%, rgb(139,69,19) 75%, rgb(205,127,50) 100%)',
                border: '3px solid rgb(139,69,19)',
                shadow: 'rgba(205,127,50,0.7) 0px 0px 20px, rgba(255,255,255,0.4) 0px 2px 4px inset, rgba(0,0,0,0.3) 0px -2px 4px inset',
                glow: 'rgba(205,127,50,0.4)',
                glowAnim: 'bronzeGlow 3s ease-in-out infinite',
                textColor: 'text-white',
            };
        } else if (puesto <= 10) {
            return {
                bg: 'linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #4f46e5 100%)',
                border: '2px solid rgba(99,102,241,0.6)',
                shadow: 'rgba(99,102,241,0.5) 0px 0px 15px, rgba(255,255,255,0.2) 0px 1px 3px inset',
                glow: 'rgba(99,102,241,0.3)',
                glowAnim: 'none',
                textColor: 'text-white',
            };
        } else if (puesto <= 20) {
            return {
                bg: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #0891b2 100%)',
                border: '2px solid rgba(6,182,212,0.5)',
                shadow: 'rgba(6,182,212,0.4) 0px 0px 12px',
                glow: 'rgba(6,182,212,0.2)',
                glowAnim: 'none',
                textColor: 'text-white',
            };
        }
        return null;
    };

    const medal = getMedalStyle();

    if (!medal) {
        return (
            <div className={`${sizeClasses[size]} rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white/60 transition-all duration-200`}>
                {puesto}
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Glow effect */}
            {puesto <= 5 && (
                <div
                    className="absolute inset-0 rounded-full blur-md"
                    style={{ background: medal.glow, animation: medal.glowAnim }}
                />
            )}
            {/* Medal circle */}
            <div
                className={`${sizeClasses[size]} relative rounded-full flex flex-col items-center justify-center font-black ${medal.textColor} overflow-hidden`}
                style={{
                    background: medal.bg,
                    border: medal.border,
                    boxShadow: medal.shadow,
                }}
            >
                {/* Shimmer overlay */}
                {puesto <= 5 && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                            backgroundSize: '200% 200%',
                            animation: 'shimmerMove 2s linear infinite',
                        }}
                    />
                )}
                <span
                    className="relative z-10 leading-none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                    #{puesto}
                </span>
            </div>
        </div>
    );
}

// ============== KPI CARD COMPONENT ==============
function KPICard({ label, value, subvalue, icon, color = 'blue', trend }: {
    label: string;
    value: string | number;
    subvalue?: string;
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'purple' | 'amber';
    trend?: 'up' | 'down' | 'neutral';
}) {
    const colorClasses = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', accent: 'text-blue-600' },
        green: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', accent: 'text-emerald-600' },
        purple: { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700', accent: 'text-violet-600' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', accent: 'text-amber-600' },
    };
    const c = colorClasses[color];

    return (
        <div className={`${c.bg} ${c.border} border rounded-xl p-4 transition-all duration-200 hover:shadow-md cursor-pointer group`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${c.text} tabular-nums`}>{value}</p>
                    {subvalue && <p className="text-xs text-slate-500 mt-0.5">{subvalue}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                    {icon && <div className={`${c.accent} opacity-70 group-hover:opacity-100 transition-opacity`}>{icon}</div>}
                    {trend && (
                        <div className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                            {trend === 'up' ? <ArrowUpIcon /> : trend === 'down' ? <ArrowDownIcon /> : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============== PODIUM COMPONENT ==============
function Podium({ estudiantes, myId }: { estudiantes: Estudiante[]; myId: string }) {
    const positions = [1, 0, 2]; // Silver, Gold, Bronze order for display

    return (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end">
            {positions.map((podiumIndex) => {
                const est = estudiantes[podiumIndex];
                if (!est) return <div key={podiumIndex}></div>;
                const puesto = podiumIndex + 1;
                const isMe = String(est.informacion_personal.numero_identificacion).trim() === String(myId).trim();
                const nombres = est.informacion_personal.nombres || '';
                const apellidos = est.informacion_personal.apellidos || '';
                const initials = getInitials(nombres, apellidos);
                const gradient = getAvatarGradient(nombres + apellidos);

                const podiumHeight = puesto === 1 ? 'h-28 sm:h-36' : puesto === 2 ? 'h-20 sm:h-28' : 'h-16 sm:h-24';
                const podiumBg = puesto === 1 ? 'from-yellow-400 to-amber-500' : puesto === 2 ? 'from-slate-300 to-slate-400' : 'from-orange-400 to-orange-500';

                return (
                    <div
                        key={podiumIndex}
                        className={`flex flex-col items-center ${puesto === 1 ? 'order-2' : puesto === 2 ? 'order-1' : 'order-3'} group cursor-pointer`}
                    >
                        {/* Avatar */}
                        <div className={`relative mb-2 ${isMe ? 'ring-4 ring-indigo-400 ring-offset-2' : ''} rounded-full transition-transform duration-200 group-hover:scale-105`}>
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg`}>
                                {initials}
                            </div>
                            {isMe && (
                                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md">TÚ</span>
                            )}
                        </div>

                        {/* Name */}
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 text-center truncate max-w-full px-1 mb-1">
                            {nombres.split(' ')[0]} {apellidos.split(' ')[0]?.charAt(0)}.
                        </p>

                        {/* Score */}
                        <p className="text-lg sm:text-2xl font-black text-slate-900 tabular-nums mb-2">{est.puntaje_global}</p>

                        {/* Podium Base */}
                        <div className={`bg-gradient-to-t ${podiumBg} ${podiumHeight} w-full rounded-t-xl shadow-lg flex flex-col items-center justify-start pt-3 transition-all duration-200 group-hover:shadow-xl`}>
                            <RankingMedal puesto={puesto} size="md" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function EstudianteRankingView() {
    const router = useRouter();
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
    const [rawEntries, setRawEntries] = useState<RankingEntry[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('todos');
    const [filtroInstitucion, setFiltroInstitucion] = useState('todas');
    const [simulacro, setSimulacro] = useState<string>('');
    const [myId, setMyId] = useState<string>('');
    const [materiaActiva, setMateriaActiva] = useState<string>('');
    const [selectedProfile, setSelectedProfile] = useState<{
        id: string;
        name: string;
        score?: number;
        institution?: string;
        position?: number;
        studentMunicipio?: string;
        studentDepartamento?: string;
        studentColegio?: string;
        studentGrado?: string;
    } | null>(null);
    const [profilePhotos, setProfilePhotos] = useState<Map<string, string>>(new Map());

    // ✅ DEMO MODE DETECTION: Check if we're in demo mode
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('student_id') === 'demo';
    
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


    const MATERIAS_CONFIG: Record<string, { label: string; shortLabel: string; color: string; icon: string; hex: [string, string]; svgIcon: (active: boolean) => React.ReactNode }> = {
        'matemáticas': {
            label: 'Matemáticas', shortLabel: 'Mat', color: SG_AREA_COLORS.matemáticas.gradient, icon: '<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>', hex: sgAreaHexPair('matemáticas'),
            svgIcon: (active) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-[18px] sm:h-[18px]"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="12" y1="6" x2="12" y2="14" /><circle cx="8" cy="18" r="0.5" /><circle cx="12" cy="18" r="0.5" /><circle cx="16" cy="18" r="0.5" /></svg>,
        },
        'lectura crítica': {
            label: 'Lectura Crítica', shortLabel: 'Lec', color: SG_AREA_COLORS['lectura crítica'].gradient, icon: '<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>', hex: sgAreaHexPair('lectura crítica'),
            svgIcon: (active) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-[18px] sm:h-[18px]"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>,
        },
        'sociales y ciudadanas': {
            label: 'Sociales', shortLabel: 'Soc', color: SG_AREA_COLORS['sociales y ciudadanas'].gradient, icon: '<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>', hex: sgAreaHexPair('sociales y ciudadanas'),
            svgIcon: (active) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-[18px] sm:h-[18px]"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
        },
        'ciencias naturales': {
            label: 'Ciencias', shortLabel: 'Cie', color: SG_AREA_COLORS['ciencias naturales'].gradient, icon: '<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>', hex: sgAreaHexPair('ciencias naturales'),
            svgIcon: (active) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-[18px] sm:h-[18px]"><path d="M9 3h6v7l4 7H5l4-7V3z" /><line x1="9" y1="3" x2="15" y2="3" /><path d="M10 14.5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1" /></svg>,
        },
        'inglés': {
            label: 'Inglés', shortLabel: 'Ing', color: SG_AREA_COLORS.inglés.gradient, icon: '<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>', hex: sgAreaHexPair('inglés'),
            svgIcon: (active) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-[18px] sm:h-[18px]"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h2l1 3 1-3h2" /></svg>,
        },
    };

    const { bundle, loading: cacheLoading, error: cacheError, refresh } = useEstudiantePanelCache();

    useEffect(() => {
        const selected = readStudentSelectedSimulacro();
        if (!selected || !bundle || bundle.simId === selected) return;
        void refresh(true);
    }, [bundle?.simId, refresh]);

    const convertEntries = useCallback((entries: RankingEntry[]): Estudiante[] => {
        return entries.map((entry: RankingEntry) => ({
            informacion_personal: {
                nombres: entry.nombre,
                apellidos: entry.apellidos || '',
                numero_identificacion: entry.numero_identificacion,
                institucion: entry.institucion || '',
            },
            puntaje_global: entry.puntaje_global,
            puntajes: {},
        } as unknown as Estudiante));
    }, []);

    useEffect(() => {
        ensureEstudianteSessionBootstrap();
        const id = localStorage.getItem('student_id');
        if (!id) {
            router.push('/login');
            return;
        }
        setMyId(id);
    }, [router]);

    useEffect(() => {
        const selected = readStudentSelectedSimulacro();
        if (!bundle?.rankingEntries?.length) return;
        if (selected && bundle.simId !== selected) return;
        setRawEntries(bundle.rankingEntries);
        setEstudiantes(convertEntries(bundle.rankingEntries));
        setSimulacro(bundle.simId);
        setErrorMsg('');
    }, [bundle, convertEntries]);

    useEffect(() => {
        if (bundle?.rankingEntries?.length || cacheLoading) return;

        const loadFallback = async () => {
            try {
                const { getRanking, getAppConfig } = await resolveEstudianteDataModule();
                const storedSim = localStorage.getItem('simulacro_selected');
                let activeSim = storedSim || '';
                if (!activeSim) {
                    const config = await getAppConfig();
                    activeSim = config.activeSimulation;
                }
                setSimulacro(activeSim || '');

                const entries = await getRanking(activeSim || undefined);
                if (entries.length === 0) {
                    setErrorMsg(`No se encontraron datos de ranking para ${activeSim || 'desconocido'}.`);
                    return;
                }

                setRawEntries(entries);
                setEstudiantes(convertEntries(entries));
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : 'desconocido';
                setErrorMsg(`Error cargando ranking: ${msg}`);
            }
        };

        void loadFallback();
    }, [bundle, cacheLoading, convertEntries]);

    const loading = cacheLoading && !bundle?.rankingEntries?.length;
    const displayError = errorMsg || (cacheError && !bundle?.rankingEntries?.length ? cacheError : '');

    useEffect(() => {
        getAllProfilePhotos().then(setProfilePhotos).catch(() => { });
    }, []);


    // Mi información de ranking
    const myRankingInfo = useMemo(() => {
        if (!myId || !estudiantes.length) return null;
        const myIndex = estudiantes.findIndex(e =>
            String(e.informacion_personal.numero_identificacion).trim() === String(myId).trim()
        );
        if (myIndex === -1) return null;
        const me = estudiantes[myIndex];
        const puntajes = estudiantes.map(e => Number(e.puntaje_global) || 0);
        const promedio = Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length);
        const percentil = Math.round(((estudiantes.length - myIndex - 1) / estudiantes.length) * 100);

        return {
            puesto: myIndex + 1,
            total: estudiantes.length,
            percentil,
            puntaje: Number(me.puntaje_global) || 0,
            promedio,
            diff: (Number(me.puntaje_global) || 0) - promedio,
            nombre: `${me.informacion_personal.nombres} ${me.informacion_personal.apellidos}`
        };
    }, [estudiantes, myId]);

    // Obtener instituciones únicas
    const instituciones = useMemo(() => {
        const set = new Set(estudiantes.map(e => e.informacion_personal.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)'));
        return Array.from(set).filter(Boolean);
    }, [estudiantes]);

    // Pre-computar rankings por materia (posición de cada estudiante por materia)
    const subjectRanks = useMemo(() => {
        if (rawEntries.length === 0) return new Map<string, Map<string, number>>();
        const ranks = new Map<string, Map<string, number>>();
        for (const key of Object.keys(MATERIAS_CONFIG)) {
            const sorted = [...rawEntries]
                .sort((a, b) => {
                    const bv = b.puntajes?.[key];
                    const av = a.puntajes?.[key];
                    const bScore = typeof bv === 'object' && bv !== null ? (bv as any).puntaje || 0 : Number(bv) || 0;
                    const aScore = typeof av === 'object' && av !== null ? (av as any).puntaje || 0 : Number(av) || 0;
                    return bScore - aScore;
                });
            const posMap = new Map<string, number>();
            sorted.forEach((e, i) => posMap.set(String(e.numero_identificacion).trim(), i + 1));
            ranks.set(key, posMap);
        }
        return ranks;
    }, [rawEntries]);

    // Verificar si hay datos de puntajes por materia
    const hasPuntajes = useMemo(() => rawEntries.length > 0 && rawEntries[0]?.puntajes && Object.keys(rawEntries[0].puntajes).length > 0, [rawEntries]);

    // Mapeo rápido de doc -> rawEntry para puntajes
    const entryByDoc = useMemo(() => {
        const map = new Map<string, RankingEntry>();
        rawEntries.forEach(e => map.set(String(e.numero_identificacion).trim(), e));
        return map;
    }, [rawEntries]);

    // Filtrar y ordenar estudiantes
    const estudiantesFiltrados = useMemo(() => {
        let filtered = estudiantes.filter(est => {
            const matchBusqueda = matchesStudentSearch(est, busqueda, { includeDocumentId: false });

            const nivel = clasificarNivel(Number(est.puntaje_global) || 0);
            const matchNivel = filtroNivel === 'todos' || nivel.nivel.toLowerCase() === filtroNivel;

            const institucion = studentInstitucion(est);
            const matchInstitucion = filtroInstitucion === 'todas' || institucion === filtroInstitucion;

            return matchBusqueda && matchNivel && matchInstitucion;
        });

        // Si hay materia activa, reordenar por puntaje de esa materia
        if (materiaActiva && hasPuntajes) {
            filtered = [...filtered].sort((a, b) => {
                const docA = String(a.informacion_personal.numero_identificacion).trim();
                const docB = String(b.informacion_personal.numero_identificacion).trim();
                const scoreA = (() => { const v = entryByDoc.get(docA)?.puntajes?.[materiaActiva]; return typeof v === 'object' && v !== null ? (v as any).puntaje || 0 : Number(v) || 0; })();
                const scoreB = (() => { const v = entryByDoc.get(docB)?.puntajes?.[materiaActiva]; return typeof v === 'object' && v !== null ? (v as any).puntaje || 0 : Number(v) || 0; })();
                return scoreB - scoreA;
            });
        }

        return filtered;
    }, [estudiantes, busqueda, filtroNivel, filtroInstitucion, materiaActiva, hasPuntajes, entryByDoc]);

    const estudiantesVisibles = useMemo(
        () => estudiantesFiltrados.slice(0, RANKING_TARGET_TOP),
        [estudiantesFiltrados],
    );

    const currentRankingInfo = useMemo(() => {
        if (!myId || rawEntries.length === 0) return null;
        const subjectKey = materiaActiva || '';
        const sorted = [...rawEntries].sort(
            (a, b) => getRankingScore(b, subjectKey) - getRankingScore(a, subjectKey)
        );
        const myIndex = sorted.findIndex(
            (entry) => String(entry.numero_identificacion).trim() === String(myId).trim()
        );
        if (myIndex === -1) return null;

        const entry = sorted[myIndex];
        const score = getRankingScore(entry, subjectKey);
        const targetIndex = Math.min(RANKING_TARGET_TOP - 1, sorted.length - 1);
        const targetScore = getRankingScore(sorted[targetIndex], subjectKey);
        const inTop = myIndex <= targetIndex;
        const pointsGapToTop = !inTop ? Math.max(0, targetScore - score) : null;
        const progressPct =
            !inTop && targetScore > 0
                ? Math.round(Math.min(100, Math.max(0, (score / targetScore) * 100)))
                : inTop && score > 0
                    ? 100
                    : null;
        return {
            entry,
            subjectKey,
            rank: myIndex + 1,
            total: sorted.length,
            score,
            inTop,
            pointsGapToTop,
            progressPct,
            name: `${entry.nombre || ''} ${entry.apellidos || ''}`.trim(),
            institution: entry.institucion || '—',
        };
    }, [myId, rawEntries, materiaActiva]);

    const currentRankingSubjectConfig = currentRankingInfo?.subjectKey
        ? MATERIAS_CONFIG[currentRankingInfo.subjectKey]
        : null;
    const currentRankingLabel = currentRankingSubjectConfig?.label ?? 'Global';
    const currentRankingScoreLabel = currentRankingSubjectConfig
        ? `pts ${currentRankingSubjectConfig.shortLabel}`
        : 'pts globales';



    if (loading) {
        return <RankingSkeleton message="Cargando ranking" />;
    }

    if (displayError) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-6 max-w-md text-center">
                    <p className="text-red-400 font-bold text-lg mb-2">Error</p>
                    <p className="text-red-300 text-sm">{displayError}</p>
                    <button
                        type="button"
                        onClick={() => void refresh(true)}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white font-sans relative overflow-x-hidden pb-20">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <AnimateIn type="fadeUp" duration={0.6}>
                    <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <TrophyIcon />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744z" clipRule="evenodd" /></svg> Ranking General
                                </h1>
                                <p className="text-white/50 text-sm font-medium">
                                    Simulacro: <span className="text-cyan-400 font-bold">{simulacro || 'Cargando...'}</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigateTo('/estudiante/dashboard')}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 rounded-xl text-sm font-bold shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer backdrop-blur-sm"
                        >
                            <HomeIcon /> Volver al Dashboard
                        </button>
                    </header>
                </AnimateIn>

                {/* KPI Cards - My Position */}
                <AnimateIn type="scaleUp" delay={0.1} duration={0.6}>
                    {myRankingInfo && (
                        <section className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Tu Posición */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-xl rounded-2xl border border-amber-500/30 p-5 group hover:scale-[1.02] transition-all duration-300">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl"></div>
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Tu Posición</span>
                                <p className="text-4xl font-black text-white mt-1 drop-shadow-lg">#{myRankingInfo.puesto}</p>
                                <p className="text-xs text-white/50 mt-1">de {myRankingInfo.total} estudiantes</p>
                                <div className="absolute right-4 top-4 text-amber-400/50 group-hover:text-amber-400 transition-colors">
                                    <TrophyIcon />
                                </div>
                            </div>

                            {/* Tu Puntaje */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-5 group hover:scale-[1.02] transition-all duration-300">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl"></div>
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tu Puntaje</span>
                                <p className="text-4xl font-black text-white mt-1 drop-shadow-lg">{myRankingInfo.puntaje}</p>
                                <p className="text-xs text-white/50 mt-1">puntos globales</p>
                                <div className="absolute right-4 top-4 text-blue-400/50 group-hover:text-blue-400 transition-colors">
                                    <ChartIcon />
                                </div>
                            </div>

                            {/* vs Promedio */}
                            <div className={`relative overflow-hidden backdrop-blur-xl rounded-2xl border p-5 group hover:scale-[1.02] transition-all duration-300 ${myRankingInfo.diff >= 0
                                ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border-emerald-500/30'
                                : 'bg-gradient-to-br from-rose-500/20 to-red-500/10 border-rose-500/30'
                                }`}>
                                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl ${myRankingInfo.diff >= 0 ? 'bg-emerald-400/20' : 'bg-rose-400/20'}`}></div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${myRankingInfo.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>vs Promedio</span>
                                <p className={`text-4xl font-black mt-1 drop-shadow-lg ${myRankingInfo.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {myRankingInfo.diff >= 0 ? '+' : ''}{myRankingInfo.diff}
                                </p>
                                <p className="text-xs text-white/50 mt-1">Promedio: {myRankingInfo.promedio}</p>
                                <div className={`absolute right-4 top-4 transition-colors ${myRankingInfo.diff >= 0 ? 'text-emerald-400/50 group-hover:text-emerald-400' : 'text-rose-400/50 group-hover:text-rose-400'}`}>
                                    {myRankingInfo.diff >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                                </div>
                            </div>

                            {/* Percentil */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-violet-500/10 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-5 group hover:scale-[1.02] transition-all duration-300">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl"></div>
                                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Percentil</span>
                                <p className="text-4xl font-black text-white mt-1 drop-shadow-lg">{myRankingInfo.percentil}%</p>
                                <p className="text-xs text-white/50 mt-1">mejor que el resto</p>
                                <div className="absolute right-4 top-4 text-purple-400/50 group-hover:text-purple-400 transition-colors">
                                    <StarIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </section>
                    )}
                </AnimateIn>

                {/* Top Estudiantes - Responsive: Top 5 en desktop, Top 3 en móvil */}
                <AnimateIn type="flipUp" delay={0.2} duration={0.7}>
                    <section className="mb-6 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-4 sm:p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-black text-white flex items-center gap-2">
                                <span className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                                    <StarIcon className="w-4 h-4 text-white" />
                                </span>
                                <span className="hidden sm:inline">Top 5 Estudiantes</span>
                                <span className="sm:hidden">Top 3</span>
                            </h2>
                            <div className="text-xs text-white/40 hidden xl:block">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" /></svg> Los mejores puntajes del simulacro
                            </div>
                        </div>

                        {/* Desktop: Top 5 en grid horizontal */}
                        <div className="hidden xl:grid xl:grid-cols-5 gap-3">
                            {estudiantes.slice(0, 5).map((est, idx) => {
                                const puesto = idx + 1;
                                const nombres = est.informacion_personal.nombres || '';
                                const apellidos = est.informacion_personal.apellidos || '';
                                const initials = getInitials(nombres, apellidos);
                                const isMe = String(est.informacion_personal.numero_identificacion).trim() === String(myId).trim();

                                const podiumStyles = {
                                    1: {
                                        bg: 'from-amber-400 to-amber-600', ring: 'ring-amber-400/50', shadow: 'shadow-amber-500/40', badge: 'bg-amber-500',
                                        scoreGrad: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700, #FFEC8B)',
                                        scoreShadow: '0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,165,0,0.3), inset 0 0 10px rgba(255,255,255,0.2)',
                                        textShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.5), 0 0 4px rgba(0,0,0,1)',
                                        hasShimmer: true,
                                    },
                                    2: {
                                        bg: 'from-slate-300 to-slate-500', ring: 'ring-slate-400/40', shadow: 'shadow-slate-400/30', badge: 'bg-slate-400',
                                        scoreGrad: 'linear-gradient(135deg, #C0C0C0, #E8E8E8, #A8A8A8, #D4D4D4)',
                                        scoreShadow: '0 0 16px rgba(192,192,192,0.5), 0 0 30px rgba(168,168,168,0.25), inset 0 0 8px rgba(255,255,255,0.15)',
                                        textShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 15px rgba(192,192,192,0.4), 0 0 4px rgba(0,0,0,1)',
                                        hasShimmer: true,
                                    },
                                    3: {
                                        bg: 'from-orange-400 to-orange-600', ring: 'ring-orange-400/40', shadow: 'shadow-orange-500/30', badge: 'bg-orange-500',
                                        scoreGrad: 'linear-gradient(135deg, #CD7F32, #E8A849, #CD7F32, #DEB887)',
                                        scoreShadow: '0 0 16px rgba(205,127,50,0.5), 0 0 30px rgba(232,168,73,0.25), inset 0 0 8px rgba(255,255,255,0.12)',
                                        textShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 15px rgba(205,127,50,0.4), 0 0 4px rgba(0,0,0,1)',
                                        hasShimmer: true,
                                    },
                                    4: {
                                        bg: 'from-indigo-400 to-indigo-600', ring: 'ring-indigo-400/30', shadow: 'shadow-indigo-500/30', badge: 'bg-indigo-500',
                                        scoreGrad: 'linear-gradient(135deg, #818CF8, #6366F1, #818CF8, #A5B4FC)',
                                        scoreShadow: '0 0 12px rgba(99,102,241,0.4), 0 0 20px rgba(129,140,248,0.2)',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(99,102,241,0.3), 0 0 3px rgba(0,0,0,1)',
                                        hasShimmer: false,
                                    },
                                    5: {
                                        bg: 'from-cyan-400 to-cyan-600', ring: 'ring-cyan-400/30', shadow: 'shadow-cyan-500/30', badge: 'bg-cyan-500',
                                        scoreGrad: 'linear-gradient(135deg, #22D3EE, #06B6D4, #22D3EE, #67E8F9)',
                                        scoreShadow: '0 0 12px rgba(6,182,212,0.4), 0 0 20px rgba(34,211,238,0.2)',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(6,182,212,0.3), 0 0 3px rgba(0,0,0,1)',
                                        hasShimmer: false,
                                    },
                                }[puesto]!;

                                return (
                                    <div
                                        key={`top5-${idx}-${est.informacion_personal.numero_identificacion}`}
                                        className={`relative group p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-center ${isMe ? 'ring-2 ring-cyan-400 bg-cyan-500/10' : ''}`}
                                    >
                                        {/* Crown for #1 */}
                                        {puesto === 1 && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2 19h20l-2-8-4 3-4-6-4 6-4-3-2 8zm2-10a2 2 0 100-4 2 2 0 000 4zm16 0a2 2 0 100-4 2 2 0 000 4zm-8-4a2 2 0 100-4 2 2 0 000 4z" /></svg></div>
                                        )}

                                        {/* Position Badge */}
                                        <div className={`absolute -top-2 -left-2 w-7 h-7 ${podiumStyles.badge} rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg`}>
                                            {puesto}
                                        </div>

                                        {/* Avatar */}
                                        <div className={`w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br ${podiumStyles.bg} flex items-center justify-center text-lg font-black text-white shadow-xl ${podiumStyles.shadow} ring-2 ${podiumStyles.ring} group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
                                            {initials}
                                        </div>

                                        {/* Name */}
                                        <p className="text-white font-bold text-sm truncate student-name">
                                            {nombres.split(' ')[0].toUpperCase()}
                                        </p>
                                        <p className="text-white/40 text-[10px] truncate">
                                            {apellidos.split(' ')[0].toUpperCase()}
                                        </p>

                                        {/* Score — CSS Animated Gradient */}
                                        <div className="relative inline-flex items-center justify-center mt-2 rounded-xl">
                                            {/* Outer glow aura */}
                                            <div
                                                className="absolute pointer-events-none rounded-xl"
                                                style={{
                                                    inset: puesto <= 3 ? '-6px' : '-4px',
                                                    backgroundImage: podiumStyles.scoreGrad,
                                                    backgroundSize: '300% 300%',
                                                    animation: 'liquidShift 3s ease infinite',
                                                    filter: `blur(${puesto <= 3 ? '14px' : '8px'})`,
                                                    opacity: puesto <= 3 ? 0.7 : 0.4,
                                                }}
                                            />
                                            {/* Dark base */}
                                            <div className="absolute inset-0 rounded-xl bg-[#010128] opacity-85" style={{ filter: 'blur(1.5px)' }} />
                                            {/* Inner gradient + score text */}
                                            <div className="relative overflow-hidden rounded-[10px] px-4 py-1.5">
                                                <div
                                                    className="absolute inset-0 rounded-[10px]"
                                                    style={{
                                                        backgroundImage: podiumStyles.scoreGrad,
                                                        backgroundSize: '300% 300%',
                                                        animation: 'liquidShift 3s ease infinite',
                                                    }}
                                                />
                                                {podiumStyles.hasShimmer && (
                                                    <div
                                                        className="absolute inset-0 rounded-[10px]"
                                                        style={{
                                                            backgroundImage: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)',
                                                            backgroundSize: '200% 100%',
                                                            animation: 'shimmerSlide 2s ease-in-out infinite',
                                                        }}
                                                    />
                                                )}
                                                <span
                                                    className="relative z-10 text-2xl font-black tabular-nums text-white"
                                                    style={{ textShadow: podiumStyles.textShadow }}
                                                >
                                                    {est.puntaje_global}
                                                </span>
                                            </div>
                                        </div>

                                        {/* You badge */}
                                        {isMe && (
                                            <span className="absolute top-2 right-2 bg-cyan-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">TÚ</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mobile: Top 3 podio clásico */}
                        <div className="xl:hidden flex justify-center items-end gap-3">
                            {/* 2nd Place */}
                            {estudiantes[1] && (
                                <div className="flex flex-col items-center group">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-lg font-black text-slate-700 shadow-xl ring-2 ring-slate-400/30 group-hover:scale-110 transition-transform overflow-hidden ${String(estudiantes[1].informacion_personal.numero_identificacion).trim() === String(myId).trim() ? 'ring-2 ring-cyan-400' : ''}`}>
                                        {profilePhotos.get(String(estudiantes[1].informacion_personal.numero_identificacion)) ? (
                                            <img src={profilePhotos.get(String(estudiantes[1].informacion_personal.numero_identificacion))} alt="" className="w-full h-full object-cover" />
                                        ) : getInitials(estudiantes[1].informacion_personal.nombres || '', estudiantes[1].informacion_personal.apellidos || '')}
                                    </div>
                                    <span className="text-white font-bold text-xs mt-1 student-name">{estudiantes[1].informacion_personal.nombres?.split(' ')[0]?.toUpperCase()}</span>
                                    <div className="relative inline-flex items-center justify-center rounded-xl">
                                        <div className="absolute pointer-events-none rounded-xl" style={{ inset: '-5px', backgroundImage: 'linear-gradient(135deg, #C0C0C0, #E8E8E8, #A8A8A8, #D4D4D4)', backgroundSize: '300% 300%', animation: 'liquidShift 3s ease infinite', filter: 'blur(12px)', opacity: 0.6 }} />
                                        <div className="absolute inset-0 rounded-xl bg-[#010128] opacity-85" style={{ filter: 'blur(1px)' }} />
                                        <div className="relative overflow-hidden rounded-[9px] px-3 py-0.5">
                                            <div className="absolute inset-0 rounded-[9px]" style={{ backgroundImage: 'linear-gradient(135deg, #C0C0C0, #E8E8E8, #A8A8A8, #D4D4D4)', backgroundSize: '300% 300%', animation: 'liquidShift 3s ease infinite' }} />
                                            <div className="absolute inset-0 rounded-[9px]" style={{ backgroundImage: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)', backgroundSize: '200% 100%', animation: 'shimmerSlide 2s ease-in-out infinite' }} />
                                            <span className="relative z-10 text-xl font-black tabular-nums text-white" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 15px rgba(192,192,192,0.4)' }}>{estudiantes[1].puntaje_global}</span>
                                        </div>
                                    </div>
                                    <div className="w-20 h-20 mt-1 bg-gradient-to-t from-slate-600 to-slate-400 rounded-t-xl flex items-center justify-center">
                                        <span className="text-3xl font-black text-slate-200/20">2</span>
                                    </div>
                                </div>
                            )}

                            {/* 1st Place */}
                            {estudiantes[0] && (
                                <div className="flex flex-col items-center group -mt-4">
                                    <div className="text-2xl mb-1 animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2 19h20l-2-8-4 3-4-6-4 6-4-3-2 8zm2-10a2 2 0 100-4 2 2 0 000 4zm16 0a2 2 0 100-4 2 2 0 000 4zm-8-4a2 2 0 100-4 2 2 0 000 4z" /></svg></div>
                                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 flex items-center justify-center text-xl font-black text-amber-800 shadow-xl ring-2 ring-amber-400/50 group-hover:scale-110 transition-transform overflow-hidden ${String(estudiantes[0].informacion_personal.numero_identificacion).trim() === String(myId).trim() ? 'ring-2 ring-cyan-400' : ''}`}>
                                        {profilePhotos.get(String(estudiantes[0].informacion_personal.numero_identificacion)) ? (
                                            <img src={profilePhotos.get(String(estudiantes[0].informacion_personal.numero_identificacion))} alt="" className="w-full h-full object-cover" />
                                        ) : getInitials(estudiantes[0].informacion_personal.nombres || '', estudiantes[0].informacion_personal.apellidos || '')}
                                    </div>
                                    <span className="text-white font-bold text-sm mt-1 student-name">{estudiantes[0].informacion_personal.nombres?.split(' ')[0]?.toUpperCase()}</span>
                                    <div className="relative inline-flex items-center justify-center rounded-xl">
                                        <div className="absolute pointer-events-none rounded-xl" style={{ inset: '-6px', backgroundImage: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700, #FFEC8B)', backgroundSize: '300% 300%', animation: 'liquidShift 3s ease infinite', filter: 'blur(14px)', opacity: 0.7 }} />
                                        <div className="absolute inset-0 rounded-xl bg-[#010128] opacity-85" style={{ filter: 'blur(1px)' }} />
                                        <div className="relative overflow-hidden rounded-[9px] px-3 py-0.5">
                                            <div className="absolute inset-0 rounded-[9px]" style={{ backgroundImage: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700, #FFEC8B)', backgroundSize: '300% 300%', animation: 'liquidShift 3s ease infinite' }} />
                                            <div className="absolute inset-0 rounded-[9px]" style={{ backgroundImage: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)', backgroundSize: '200% 100%', animation: 'shimmerSlide 2s ease-in-out infinite' }} />
                                            <span className="relative z-10 text-2xl font-black tabular-nums text-white" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 15px rgba(255,215,0,0.4)' }}>{estudiantes[0].puntaje_global}</span>
                                        </div>
                                    </div>
                                    <div className="w-24 h-28 mt-1 bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 rounded-t-xl flex items-center justify-center">
                                        <span className="text-4xl font-black text-amber-300/20">1</span>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {estudiantes[2] && (
                                <div className="flex flex-col items-center group">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-base font-black text-orange-100 shadow-xl ring-2 ring-orange-500/30 group-hover:scale-110 transition-transform overflow-hidden ${String(estudiantes[2].informacion_personal.numero_identificacion).trim() === String(myId).trim() ? 'ring-2 ring-cyan-400' : ''}`}>
                                        {profilePhotos.get(String(estudiantes[2].informacion_personal.numero_identificacion)) ? (
                                            <img src={profilePhotos.get(String(estudiantes[2].informacion_personal.numero_identificacion))} alt="" className="w-full h-full object-cover" />
                                        ) : getInitials(estudiantes[2].informacion_personal.nombres || '', estudiantes[2].informacion_personal.apellidos || '')}
                                    </div>
                                    <span className="text-white font-bold text-xs mt-1 student-name">{estudiantes[2].informacion_personal.nombres?.split(' ')[0]?.toUpperCase()}</span>
                                    <div className="relative inline-flex items-center justify-center rounded-xl">
                                        <div className="absolute pointer-events-none rounded-xl" style={{ inset: '-5px', backgroundImage: 'linear-gradient(135deg, #CD7F32, #E8A849, #CD7F32, #DEB887)', backgroundSize: '300% 300%', animation: 'liquidShift 3s ease infinite', filter: 'blur(12px)', opacity: 0.6 }} />
                                        <div className="absolute inset-0 rounded-xl bg-[#010128] opacity-85" style={{ filter: 'blur(1px)' }} />
                                        <div className="relative overflow-hidden rounded-[9px] px-3 py-0.5">
                                            <div className="absolute inset-0 rounded-[9px]" style={{ backgroundImage: 'linear-gradient(135deg, #CD7F32, #E8A849, #CD7F32, #DEB887)', backgroundSize: '300% 300%', animation: 'liquidShift 3s ease infinite' }} />
                                            <div className="absolute inset-0 rounded-[9px]" style={{ backgroundImage: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)', backgroundSize: '200% 100%', animation: 'shimmerSlide 2s ease-in-out infinite' }} />
                                            <span className="relative z-10 text-lg font-black tabular-nums text-white" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 15px rgba(205,127,50,0.4)' }}>{estudiantes[2].puntaje_global}</span>
                                        </div>
                                    </div>
                                    <div className="w-16 h-16 mt-1 bg-gradient-to-t from-orange-700 to-orange-500 rounded-t-xl flex items-center justify-center">
                                        <span className="text-2xl font-black text-orange-400/20">3</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </AnimateIn>

                {/* Filters & Table */}
                <AnimateIn type="fadeUp" delay={0.1} duration={0.5}>
                    <section className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                        {/* Subject Tabs — Responsive: icons on mobile, icon+label on desktop */}
                        {hasPuntajes && (
                            <div className="px-3 py-3 sm:px-5 sm:py-4 border-b border-white/10 bg-gradient-to-r from-white/[0.02] to-white/[0.04]">
                                <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                                    {/* Global tab */}
                                    <button
                                        onClick={() => setMateriaActiva('')}
                                        title="Global"
                                        className={`group relative flex items-center gap-1.5 rounded-xl transition-all duration-300 flex-shrink-0 ${!materiaActiva
                                            ? 'bg-white/15 text-white shadow-lg shadow-white/10 ring-1 ring-white/25 px-3 py-2 sm:px-4 sm:py-2.5'
                                            : 'bg-white/[0.06] text-white/40 hover:bg-white/10 hover:text-white/70 px-2.5 py-2 sm:px-4 sm:py-2.5'
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-[18px] sm:h-[18px]"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                                        <span className="hidden sm:inline text-sm font-semibold">Global</span>
                                    </button>

                                    {/* Separator */}
                                    <div className="w-px h-6 bg-white/10 mx-0.5 sm:mx-1 flex-shrink-0" />

                                    {/* Subject tabs */}
                                    {Object.entries(MATERIAS_CONFIG).map(([key, conf]) => {
                                        const isActive = materiaActiva === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setMateriaActiva(materiaActiva === key ? '' : key)}
                                                title={conf.label}
                                                className={`group relative flex items-center gap-1.5 rounded-xl transition-all duration-300 flex-shrink-0 ${isActive
                                                    ? `bg-gradient-to-r ${conf.color} text-white shadow-lg scale-[1.03] px-3 py-2 sm:px-4 sm:py-2.5`
                                                    : 'bg-white/[0.06] text-white/40 hover:bg-white/10 hover:text-white/70 px-2.5 py-2 sm:px-4 sm:py-2.5'
                                                    }`}
                                                style={isActive ? { boxShadow: `0 4px 20px ${conf.hex[0]}40, 0 0 0 1px ${conf.hex[0]}30` } : {}}
                                            >
                                                {conf.svgIcon(isActive)}
                                                <span className="hidden sm:inline text-sm font-semibold">{conf.shortLabel}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="p-3 sm:p-4 border-b border-white/10 bg-white/[0.03] space-y-3">
                            <div className="flex flex-wrap gap-2 items-center justify-between">
                                <div className="flex flex-wrap gap-2 items-center flex-1">
                                    <div className="relative flex-1 min-w-[150px] max-w-[320px]">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                                            <SearchIcon />
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Buscar nombre, ID, depto o institución…"
                                            value={busqueda}
                                            maxLength={40}
                                            autoComplete="off"
                                            autoCorrect="off"
                                            spellCheck={false}
                                            name="ranking-search-nofill"
                                            onChange={(e) => setBusqueda(e.target.value.replace(/[<>{}()\[\]]/g, '').slice(0, 40))}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const text = e.clipboardData.getData('text').replace(/[<>{}()\[\]&;$`'"\\]/g, '').slice(0, 40);
                                                setBusqueda(text);
                                            }}
                                            className="w-full bg-white/[0.06] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-sm"
                                        />
                                    </div>
                                    <select
                                        value={filtroInstitucion}
                                        onChange={(e) => setFiltroInstitucion(e.target.value)}
                                        autoComplete="off"
                                        className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-white text-sm cursor-pointer hidden sm:block max-w-[200px]"
                                    >
                                        <option value="todas" className="bg-slate-900">Todas las instituciones</option>
                                        {instituciones.map(inst => (
                                            <option key={inst} value={inst} className="bg-slate-900">{inst.slice(0, 28)}</option>
                                        ))}
                                    </select>
                                </div>
                                <span className="text-white/45 text-xs">
                                    Top {Math.min(RANKING_TARGET_TOP, estudiantesFiltrados.length)}
                                    {estudiantes.length > RANKING_TARGET_TOP && (
                                        <span className="text-white/30"> · {estudiantes.length} en total</span>
                                    )}
                                    {materiaActiva && <span className="text-purple-400 ml-1">• {MATERIAS_CONFIG[materiaActiva]?.label}</span>}
                                </span>
                            </div>
                            <StudentLevelFilterPills
                                value={filtroNivel === 'todos' ? 'all' : filtroNivel}
                                onChange={(v) => setFiltroNivel(v === 'all' ? 'todos' : v)}
                            />
                        </div>

                        {/* Table with Subject Scores */}
                        <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 z-10 border-b border-white/10 text-[10px] uppercase tracking-wider text-white/40 font-bold" style={{ background: 'rgba(8, 10, 24, 0.98)', backdropFilter: 'blur(8px)' }}>
                                    <tr>
                                        <th className="py-3 pl-3 sm:pl-4 w-12 text-center">#</th>
                                        <th className="py-3 pl-2 text-left">Estudiante</th>
                                        <th className="py-3 px-2 text-left hidden md:table-cell min-w-[140px] max-w-[220px]">Institución</th>
                                        <th className="py-3 px-2 text-center">Nivel</th>
                                        <th className="py-3 px-2 text-center min-w-[72px]">Global</th>
                                        {hasPuntajes && Object.entries(MATERIAS_CONFIG).map(([key, conf]) => {
                                            const isActive = materiaActiva === key;
                                            return (
                                                <th
                                                    key={key}
                                                    className="py-3 px-1.5 text-center min-w-[52px] hidden md:table-cell"
                                                    style={{ color: isActive ? conf.hex[0] : `${conf.hex[0]}90` }}
                                                >
                                                    {conf.shortLabel}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {estudiantesVisibles.map((est, index) => {
                                        const perf = getStudentPerformanceLevel(Number(est.puntaje_global) || 0);
                                        const globalPct = Math.min((Number(est.puntaje_global) || 0) / 500 * 100, 100);
                                        const nombres = est.informacion_personal.nombres || '';
                                        const apellidos = est.informacion_personal.apellidos || '';
                                        const initials = getInitials(nombres, apellidos);
                                        const gradient = getAvatarGradient(nombres + apellidos);
                                        const doc = studentDocumentId(est);
                                        const entry = entryByDoc.get(String(doc).trim());
                                        const institucion =
                                            studentInstitucion(est) || entry?.institucion?.trim() || '';
                                        const isMe = String(doc).trim() === String(myId).trim();
                                        const puesto = materiaActiva
                                            ? subjectRanks.get(materiaActiva)?.get(String(doc).trim()) || index + 1
                                            : (estudiantes.findIndex(e => e.informacion_personal.numero_identificacion === doc) + 1);

                                        return (
                                            <tr
                                                key={doc + index}
                                                onClick={() => {
                                                    const ip = est.informacion_personal;
                                                    const ctx = rankingStudentContextFromInformacionPersonal(ip);
                                                    setSelectedProfile({
                                                        id: String(doc).trim(),
                                                        name: `${nombres.split(' ')[0]} ${apellidos.split(' ')[0]}`,
                                                        score: Number(est.puntaje_global) || 0,
                                                        institution: institucion,
                                                        position: puesto,
                                                        studentMunicipio: ctx.municipio || undefined,
                                                        studentDepartamento: ctx.departamento || undefined,
                                                        studentColegio: institucion || undefined,
                                                        studentGrado: ctx.grado || undefined,
                                                    });
                                                }}
                                                style={{ cursor: 'pointer' }}
                                                className={`group transition-all duration-150 ${isMe
                                                    ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-purple-500/5 border-l-2 border-l-cyan-400'
                                                    : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <td className="py-2.5 pl-3 sm:pl-4 text-center">
                                                    <RankingMedal puesto={puesto} size="sm" />
                                                </td>
                                                <td className="py-2.5 pl-2 pr-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`relative w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-[10px] font-bold text-white shadow ring-1 ring-white/10 group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden`}>
                                                            {profilePhotos.get(String(est.informacion_personal.numero_identificacion)) ? (
                                                                <img src={profilePhotos.get(String(est.informacion_personal.numero_identificacion))} alt="" className="w-full h-full object-cover" />
                                                            ) : initials}
                                                            {isMe && (
                                                                <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[6px] font-bold w-3 h-3 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <span className={`block text-sm font-bold truncate student-name ${isMe ? 'text-cyan-400' : 'text-white group-hover:text-cyan-400'} transition-colors`}>
                                                                {studentFullName(est, { uppercase: true, firstOnly: true })}
                                                            </span>
                                                            {institucion ? (
                                                                <span className="block text-[10px] text-white/45 truncate md:hidden" title={institucion}>
                                                                    {institucion}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-2 text-[11px] text-white/55 truncate max-w-[220px] hidden md:table-cell" title={institucion}>
                                                    {institucion || '—'}
                                                </td>
                                                <td className="py-2.5 px-2 text-center">
                                                    <span
                                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block"
                                                        style={{ background: `${perf.color}15`, color: perf.color }}
                                                    >
                                                        {perf.label}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-2">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span
                                                            className="text-sm font-black tabular-nums"
                                                            style={{ color: isMe ? '#22d3ee' : perf.color }}
                                                        >
                                                            {est.puntaje_global}
                                                        </span>
                                                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', maxWidth: '56px' }}>
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${globalPct}%`,
                                                                    background: `linear-gradient(90deg, ${perf.color}80, ${perf.color})`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                {hasPuntajes && Object.entries(MATERIAS_CONFIG).map(([key, conf]) => {
                                                    const rawScore = entry?.puntajes?.[key];
                                                    const score = typeof rawScore === 'object' && rawScore !== null ? (rawScore as { puntaje?: number }).puntaje || 0 : Number(rawScore) || 0;
                                                    const isActive = materiaActiva === key;
                                                    const subjectPos = subjectRanks.get(key)?.get(String(doc).trim()) || 999;
                                                    const isTop3 = subjectPos <= 3;
                                                    const [hex1] = conf.hex;

                                                    return (
                                                        <td key={key} className="py-2 px-1 hidden md:table-cell">
                                                            <div className="flex flex-col items-center gap-0.5">
                                                                <span
                                                                    className={`text-[11px] font-bold tabular-nums ${
                                                                        score > 0
                                                                            ? isTop3
                                                                                ? 'text-white'
                                                                                : isActive
                                                                                    ? (isMe ? 'text-cyan-400' : 'text-white/75')
                                                                                    : 'text-white/45'
                                                                            : 'text-white/15'
                                                                    }`}
                                                                    style={isTop3 && score > 0 ? { textShadow: `0 0 8px ${hex1}55` } : undefined}
                                                                >
                                                                    {score || '—'}
                                                                </span>
                                                                {score > 0 && (
                                                                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', maxWidth: '40px' }}>
                                                                        <div
                                                                            className="h-full rounded-full"
                                                                            style={{
                                                                                width: `${Math.min(score, 100)}%`,
                                                                                background: isTop3 ? hex1 : `${hex1}88`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {estudiantes.length > RANKING_TARGET_TOP && (
                            <p className="border-t border-white/5 px-4 py-2 text-center text-[11px] text-white/35">
                                Tabla limitada al Top {RANKING_TARGET_TOP}. Tu posición completa aparece abajo si no estás en la lista.
                            </p>
                        )}
                    </section>
                </AnimateIn>

                {currentRankingInfo && (
                    <AnimateIn type="fadeUp" delay={0.15} duration={0.5}>
                        <section
                            className="relative z-10 mt-6 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-purple-500/10 p-px shadow-[0_18px_60px_-20px_rgba(34,211,238,0.45)]"
                            aria-label={`Tu posición en el ranking ${currentRankingLabel}`}
                        >
                            <div className="rounded-[1.45rem] bg-slate-950/80 p-4 backdrop-blur-xl sm:p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/25">
                                            <TrophyIcon />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                                                Tu posición en ranking {currentRankingLabel}
                                            </p>
                                            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 tabular-nums">
                                                <span className="text-3xl font-black leading-none text-white">
                                                    #{currentRankingInfo.rank}
                                                </span>
                                                <span className="text-xs font-semibold text-white/45">
                                                    de {currentRankingInfo.total} estudiantes
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {currentRankingInfo.pointsGapToTop != null ? (
                                        <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                                <path fillRule="evenodd" d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
                                            </svg>
                                            <span className="truncate">
                                                Faltan {formatRankingScore(currentRankingInfo.pointsGapToTop)} pts · Top {RANKING_TARGET_TOP}
                                            </span>
                                        </div>
                                    ) : currentRankingInfo.inTop ? (
                                        <span className="inline-flex items-center rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-200">
                                            Top {RANKING_TARGET_TOP}
                                        </span>
                                    ) : null}
                                </div>

                                {currentRankingInfo.progressPct != null && !currentRankingInfo.inTop ? (
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                                            <span className="text-white/45">
                                                Progreso hacia el Top {RANKING_TARGET_TOP}
                                            </span>
                                            <span className="tabular-nums text-cyan-300">
                                                {currentRankingInfo.progressPct}%
                                            </span>
                                        </div>
                                        <div
                                            className="h-2.5 overflow-hidden rounded-full bg-white/[0.08] ring-1 ring-inset ring-white/10"
                                            role="progressbar"
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-valuenow={currentRankingInfo.progressPct}
                                        >
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-[width] duration-500 ease-out"
                                                style={{ width: `${Math.max(8, currentRankingInfo.progressPct)}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                <div className="mt-4 flex w-full items-center gap-2.5 rounded-2xl border border-cyan-300/25 bg-white/[0.04] px-3 py-3 text-left ring-1 ring-cyan-300/10 sm:gap-3 sm:px-4">
                                    <RankingMedal puesto={currentRankingInfo.rank} size="sm" />
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${getAvatarGradient(currentRankingInfo.name)} text-xs font-black text-white ring-1 ring-white/10`}>
                                        {getInitials(currentRankingInfo.entry.nombre || '', currentRankingInfo.entry.apellidos || '')}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-white">
                                            {currentRankingInfo.name}
                                            <span className="ml-1.5 inline-flex rounded-md bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                                Tú
                                            </span>
                                        </p>
                                        <p className="truncate text-[10px] font-medium text-white/45">
                                            {currentRankingInfo.institution}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right tabular-nums">
                                        <p className="text-xl font-black text-white">
                                            {formatRankingScore(currentRankingInfo.score)}
                                        </p>
                                        <p className="text-[10px] font-semibold text-white/45">
                                            {currentRankingScoreLabel}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </AnimateIn>
                )}



                {/* Footer */}
                <footer className="text-center text-white/30 text-xs py-6 mt-4 font-medium flex items-center justify-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744z" clipRule="evenodd" /></svg>
                    <span>Ranking Oficial • Seamos Genios 2026</span>
                </footer>
            </main>

            {/* Profile Preview Modal */}
            {selectedProfile && (
                <ProfilePreviewModal
                    studentId={selectedProfile.id}
                    studentName={selectedProfile.name}
                    studentScore={selectedProfile.score}
                    studentInstitution={selectedProfile.institution}
                    studentPosition={selectedProfile.position}
                    studentMunicipio={selectedProfile.studentMunicipio}
                    studentDepartamento={selectedProfile.studentDepartamento}
                    studentColegio={selectedProfile.studentColegio}
                    studentGrado={selectedProfile.studentGrado}
                    onClose={() => setSelectedProfile(null)}
                />
            )}
        </div>
    );
}
