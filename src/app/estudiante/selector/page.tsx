'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { prefetchStudentData, type StudentProfile } from '@features/simulacro/lib/firestoreService';
import { broadcastStudentProfileChange } from '@features/curso/lib/courseEntitlements';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@features/auth';
import SgBrandedLoadingExperience from '@/components/SgBrandedLoadingExperience';
import { createClientNavigate } from '@/shared/lib/hardNavigate';

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

export default function StudentSelectorPage() {
    const router = useRouter();
    const navPush = createClientNavigate((href) => router.push(href));
    const navReplace = createClientNavigate((href) => router.replace(href));
    const [profiles, setProfiles] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const validateAndLoadProfiles = async () => {
            try {
                const raw = localStorage.getItem('linked_profiles');
                if (!raw) {
                    navReplace('/login');
                    return;
                }

                const parsed = JSON.parse(raw) as StudentProfile[];
                if (!parsed.length) {
                    navReplace('/login');
                    return;
                }

                // Validar en paralelo cada perfil contra Firestore (1 read por perfil)
                const validationResults = await Promise.all(
                    parsed.map(async (profile) => {
                        try {
                            const snap = await getDoc(doc(db, 'students', profile.id));
                            return snap.exists() ? profile : null;
                        } catch {
                            // Si falla la lectura, mantener el perfil (evitar bloqueos por red)
                            return profile;
                        }
                    })
                );

                const validProfiles = validationResults.filter((p): p is StudentProfile => p !== null);

                // Actualizar el caché con solo los perfiles válidos
                localStorage.setItem('linked_profiles', JSON.stringify(validProfiles));

                if (validProfiles.length === 0) {
                    navReplace('/login');
                    return;
                }

                // Si solo queda 1 perfil válido, seleccionarlo automáticamente
                if (validProfiles.length === 1) {
                    const profile = validProfiles[0];
                    localStorage.setItem('student_id', profile.id);
                    localStorage.setItem('student_name', `${profile.nombre} ${profile.apellidos}`);
                    localStorage.setItem('student_email', profile.email);
                    localStorage.setItem('selected_profile_id', profile.id);
                    localStorage.removeItem('student_data');
                    localStorage.removeItem('simulacro_selected');
                    sessionStorage.removeItem('welcome_shown');
                    broadcastStudentProfileChange(profile.id);
                    prefetchStudentData(profile.id).catch(() => {});
                    navReplace('/estudiante/dashboard');
                    return;
                }

                setProfiles(validProfiles);
            } catch {
                navReplace('/login');
            } finally {
                setLoading(false);
            }
        };

        validateAndLoadProfiles();
    }, [router]);

    const handleSelectStudent = (profile: StudentProfile) => {
        setSelectedId(profile.id);

        // Guardar el perfil seleccionado en localStorage
        localStorage.setItem('student_id', profile.id);
        localStorage.setItem('student_name', `${profile.nombre} ${profile.apellidos}`);
        localStorage.setItem('student_email', profile.email);
        localStorage.setItem('selected_profile_id', profile.id);

        // Limpiar datos del dashboard anterior para forzar recarga limpia
        localStorage.removeItem('student_data');
        localStorage.removeItem('simulacro_selected');
        sessionStorage.removeItem('welcome_shown');
        broadcastStudentProfileChange(profile.id);

        // 🚀 Prefetch: aprovechar los 400ms de animación para precargar datos
        prefetchStudentData(profile.id).catch(() => {});

        // Animación suave antes de redirigir
        setTimeout(() => {
            navPush('/estudiante/dashboard');
        }, 400);
    };

    const handleLogout = () => {
        localStorage.removeItem('student_id');
        localStorage.removeItem('student_name');
        localStorage.removeItem('student_email');
        localStorage.removeItem('student_data');
        localStorage.removeItem('simulacro_selected');
        localStorage.removeItem('linked_profiles');
        localStorage.removeItem('selected_profile_id');
        sessionStorage.removeItem('welcome_shown');
        navReplace('/login');
    };

    const handleChangeProfile = () => {
        // Limpiar selección actual para volver a mostrar este panel
        localStorage.removeItem('student_id');
        localStorage.removeItem('student_name');
        localStorage.removeItem('student_data');
        localStorage.removeItem('simulacro_selected');
        localStorage.removeItem('selected_profile_id');
        sessionStorage.removeItem('welcome_shown');
    };

    if (loading) {
        return <SgBrandedLoadingExperience message="Cargando experiencia personalizada" personalize={false} />;
    }

    const currentEmail = localStorage.getItem('student_email') || '';

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
                                            {(profile.nombre || 'Estudiante').split(' ')[0]} {(profile.apellidos || '').split(' ')[0]}
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
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 -translate-x-2">
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
