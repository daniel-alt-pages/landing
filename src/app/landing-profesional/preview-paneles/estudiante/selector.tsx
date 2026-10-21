'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { prefetchStudentData, type StudentProfile } from '../_data/firestoreMock';
import {
  PREVIEW_AVAILABLE_SIMS,
  PREVIEW_INSTITUTION_NAME,
  PREVIEW_STUDENT_APELLIDOS,
  PREVIEW_STUDENT_ID,
  PREVIEW_STUDENT_NOMBRES,
} from '../_data/seeds/constants';
import SgBrandedLoadingExperience from '@/components/SgBrandedLoadingExperience';

const PREVIEW_PROFILES: StudentProfile[] = [
  {
    id: PREVIEW_STUDENT_ID,
    email: 'demo@seamosgenios.co',
    nombre: PREVIEW_STUDENT_NOMBRES,
    apellidos: PREVIEW_STUDENT_APELLIDOS,
    institucion: PREVIEW_INSTITUTION_NAME,
    simulacros: [...PREVIEW_AVAILABLE_SIMS],
  },
  {
    id: '1098765432',
    email: 'demo@seamosgenios.co',
    nombre: 'DANIEL',
    apellidos: 'BERMUDEZ',
    institucion: PREVIEW_INSTITUTION_NAME,
    simulacros: [...PREVIEW_AVAILABLE_SIMS],
  },
];

/**
 * Panel de Selección de Estudiante
 * 
 * Se muestra cuando un correo tiene acceso a múltiples perfiles de estudiante.
 * El usuario elige cuál perfil desea consultar.
 * 
 * Optimización de recursos:
 * - Los perfiles ya vienen cacheados de la búsqueda en login (0 reads adicionales)
 * - Al cargar, se valida cada perfil contra Firestore para descartar estudiantes eliminados
 * - La selección se guarda en localStorage para evitar mostrar este panel en cada visita
 * - No se cargan datos del dashboard hasta que el usuario seleccione un estudiante
 */

export default function PreviewEstudianteSelector() {
    const router = useRouter();
    const [profiles, setProfiles] = useState<StudentProfile[]>(PREVIEW_PROFILES);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        void router;
        setProfiles(PREVIEW_PROFILES);
        setLoading(false);
    }, [router]);

    const handleSelectStudent = (profile: StudentProfile) => {
        setSelectedId(profile.id);
        // En preview: selección visible pero sin navegación real.
    };

    const handleLogout = () => {
        // Preview: noop.
    };

    const handleChangeProfile = () => {
        setSelectedId(null);
    };

    if (loading) {
        return <SgBrandedLoadingExperience message="Cargando experiencia personalizada" personalize={false} />;
    }

    const currentEmail = 'demo@seamosgenios.co';

    return (
        <div className="fixed inset-0 z-[200] bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 overflow-y-auto">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl" />
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative z-10 max-w-2xl w-full text-center space-y-6 sm:space-y-8 mx-auto min-h-full flex flex-col items-center justify-center px-4 py-8 sm:py-12">
                {/* Logo */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-2xl sm:text-4xl font-black text-white shadow-2xl shadow-purple-500/30 animate-bounce" style={{ animationDuration: '2s' }}>
                        SG
                    </div>
                </div>

                {/* Title */}
                <div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-2 sm:mb-3">
                        ¿Quién eres?
                    </h1>
                    <p className="text-base sm:text-lg text-purple-200/80">
                        Tu correo tiene acceso a <span className="font-bold text-white">{profiles.length} estudiantes</span>
                    </p>
                    {currentEmail && (
                        <p className="text-xs sm:text-sm text-purple-300/50 mt-1 truncate max-w-xs mx-auto">
                            {currentEmail}
                        </p>
                    )}
                </div>

                {/* Student Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 max-w-xl mx-auto w-full">
                    {profiles.map((profile, index) => {
                        const isSelected = selectedId === profile.id;
                        const initials = `${(profile.nombre || '?')[0]}${(profile.apellidos || '?')[0]}`.toUpperCase();
                        const gradients = [
                            'from-indigo-500 to-blue-600',
                            'from-purple-500 to-pink-600',
                            'from-emerald-500 to-teal-600',
                            'from-amber-500 to-orange-600',
                            'from-rose-500 to-red-600',
                            'from-cyan-500 to-sky-600',
                        ];
                        const gradient = gradients[index % gradients.length];

                        return (
                            <button
                                key={profile.id}
                                id={index === 0 ? 'showcase-selector-profile' : undefined}
                                onClick={() => handleSelectStudent(profile)}
                                disabled={!!selectedId}
                                className={`group relative p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 transform text-left
                                    ${isSelected
                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 shadow-2xl shadow-indigo-500/40 scale-[1.02]'
                                        : selectedId
                                            ? 'bg-white/5 border-white/10 opacity-40 cursor-not-allowed'
                                            : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95 cursor-pointer'
                                    }`}
                            >
                                {/* Loading spinner on selected */}
                                {isSelected && (
                                    <div className="absolute top-3 right-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    </div>
                                )}

                                <div className="flex items-center gap-3 sm:gap-4">
                                    {/* Avatar with initials */}
                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-base sm:text-lg shadow-lg shrink-0`}>
                                        {initials}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base sm:text-lg font-extrabold text-white truncate">
                                            {profile.nombre.split(' ')[0]} {profile.apellidos.split(' ')[0]}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-white/60 truncate">
                                            {profile.institucion || 'Seamos Genios'}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-white/40 font-mono mt-0.5 truncate">
                                            ID: {profile.id}
                                        </p>
                                    </div>
                                </div>

                                {/* Hover arrow indicator */}
                                {!selectedId && (
                                    <div
                                        id={index === 0 ? 'showcase-selector-continue' : undefined}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 -translate-x-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="space-y-3 pt-2">
                    <p className="text-xs sm:text-sm text-purple-300/60">
                        Podrás cambiar de estudiante en cualquier momento desde tu perfil
                    </p>
                    <button
                        onClick={handleLogout}
                        className="text-xs sm:text-sm text-purple-300/50 hover:text-white/80 transition-colors underline underline-offset-4 decoration-purple-400/30 hover:decoration-white/50"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
