'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { auth } from '@features/auth/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Shield, Activity, LogOut, Loader2, CalendarCheck } from 'lucide-react';

// Lazy load tabs for better performance
const AccessMonitor = dynamic(() => import('./components/AccessMonitor'), {
    loading: () => <TabLoader />,
});
const CourseAttendanceMonitor = dynamic(() => import('./components/CourseAttendanceMonitor'), {
    loading: () => <TabLoader />,
});

type Tab = 'access' | 'attendance';

const TABS: { id: Tab; label: string; icon: any; desc: string }[] = [
    { id: 'access', label: 'Monitor de Accesos', icon: Activity, desc: 'Análisis de sesiones en tiempo real' },
    { id: 'attendance', label: 'Seguimiento curso', icon: CalendarCheck, desc: 'Asistencia vacacional preicfes-sg26' },
];

function TabLoader() {
    return (
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="text-white/40 mt-4 text-sm font-medium">Cargando módulo...</p>
        </div>
    );
}

export default function AdminPanelPage() {
    const searchParams = useSearchParams();
    const initialTab: Tab =
        searchParams.get('tab') === 'attendance' || searchParams.get('tab') === 'seguimiento'
            ? 'attendance'
            : 'access';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.replace('/login');
    };

    return (
        <div className="min-h-screen bg-[#030014] text-white selection:bg-purple-500/30">
            {/* Ultra Premium Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.15),transparent_50%)]" />
                <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white/[0.02] border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50 rounded-full" />
                            <div className="relative p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl shadow-purple-500/20 border border-white/20">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">
                                Centro de Comando
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                <p className="text-white/50 text-sm font-medium uppercase tracking-widest">
                                    SeamosGenios · Sistema Core
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-white/90">{auth.currentUser?.email}</p>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-purple-400 mt-0.5">Administrador Global</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-3 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/50 rounded-xl text-white/70 hover:text-rose-400 transition-all duration-300 group"
                            title="Cerrar sesión"
                        >
                            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                    </div>
                </header>

                {/* Tab Navigation */}
                <nav className="flex flex-wrap gap-3 mb-8">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group relative flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 overflow-hidden ${
                                    isActive
                                        ? 'bg-white/10 border-white/20 shadow-lg'
                                        : 'bg-white/[0.02] hover:bg-white/[0.06] border-transparent hover:border-white/10'
                                } border`}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent opacity-50" />
                                )}
                                <div className={`relative p-2.5 rounded-xl transition-colors duration-300 ${
                                    isActive ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/40 group-hover:text-white/70 group-hover:bg-white/10'
                                }`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="relative text-left pr-2">
                                    <span className={`block font-semibold transition-colors duration-300 ${
                                        isActive ? 'text-white' : 'text-white/60 group-hover:text-white/90'
                                    }`}>
                                        {tab.label}
                                    </span>
                                    <span className={`block text-xs mt-0.5 transition-colors duration-300 ${
                                        isActive ? 'text-purple-300/70' : 'text-white/30 group-hover:text-white/50'
                                    }`}>
                                        {tab.desc}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </nav>

                {/* Tab Content */}
                <main className="min-h-[500px]">
                    <div className={`transition-all duration-500 ${activeTab === 'access' ? 'block opacity-100' : 'hidden opacity-0'}`}>
                        {activeTab === 'access' && <AccessMonitor />}
                    </div>
                    <div className={`transition-all duration-500 ${activeTab === 'attendance' ? 'block opacity-100' : 'hidden opacity-0'}`}>
                        {activeTab === 'attendance' && <CourseAttendanceMonitor />}
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t border-white/5 text-center flex flex-col items-center gap-2">
                    <div className="w-8 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent rounded-full" />
                    <p className="text-white/30 text-xs font-medium tracking-wide">
                        Centro de Comando Administrativo · v5.0
                    </p>
                    <p className="text-white/20 text-[10px] uppercase tracking-widest mt-1">
                        Acceso Restringido
                    </p>
                </footer>
            </div>
        </div>
    );
}
