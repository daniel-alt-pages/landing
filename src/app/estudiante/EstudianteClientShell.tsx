'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DevToolsGuard from '@/components/DevToolsGuard';
import dynamic from 'next/dynamic';
import { getStudentSimulations, prefetchStudentData } from '@features/simulacro/lib/firestoreService';
import { shouldDemoRouteUseFirebase } from '@/lib/demoDataSource';
import { clearCachesIfFirebaseProjectChanged, touchFirebaseProjectCache } from '@/lib/firebaseProjectCache';
import { clearCachesIfBuildIdChanged } from '@/lib/buildIdCache';
import { bootstrapDemoStudentSession } from '@/app/demo/_shared/bootstrapDemoStudentSession';
import { DEMO_ESTUDIANTE_HOME } from '@/app/demo/_shared/demoExit';
import DemoExitControl from '@/app/demo/_shared/DemoExitControl';
import { useDemoBackGuard } from '@/app/demo/_shared/useDemoBackGuard';
import { isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';
import InstallPrompt from '@/components/InstallPrompt';
import StudentWhatsAppChannelGate from '@features/estudiante/components/StudentWhatsAppChannelGate';
import StudentPifaResultsClassGate from '@features/estudiante/components/StudentPifaResultsClassGate';
import EstudianteRouteRecovery from '@features/estudiante/components/EstudianteRouteRecovery';
import { shouldShowWhatsAppChannelGate } from '@features/estudiante/lib/whatsappChannelGate';
import { EstudiantePanelCacheProvider } from '@features/estudiante/context/EstudiantePanelCacheProvider';
import {
    isAutoPresentationFocusPanelRoute,
    requestPanelPresentationFocus,
} from '@/lib/presentationFocusMode';
import PanelDataReadinessGate from '@shared/components/PanelDataReadinessGate';
import { PremiumStudentShell } from '@shared/components/premium';
import { CourseEntitlementsProvider } from '@features/curso/context/CourseEntitlementsProvider';

const StudentMobileNav = dynamic(() => import('@/components/StudentMobileNav'), { ssr: false });

function resolveAuthStateSync(pathname: string | null): 'checking' | 'authenticated' | 'unauthenticated' {
    if (typeof window === 'undefined') return 'checking';
    if (pathname === '/estudiante/selector') return 'authenticated';
    if (isDemoEstudianteRoute(pathname)) return 'authenticated';

    const studentId = localStorage.getItem('student_id');
    if (!studentId || studentId.trim() === '' || studentId.trim() === 'demo') {
        return 'unauthenticated';
    }
    return 'authenticated';
}

function useAuthGuard() {
    const router = useRouter();
    const pathname = usePathname();
    const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>(() =>
        resolveAuthStateSync(pathname),
    );
    const [authSlow, setAuthSlow] = useState(false);

    useEffect(() => {
        if (authState !== 'checking') {
            setAuthSlow(false);
            return;
        }
        const t = window.setTimeout(() => setAuthSlow(true), 8000);
        return () => window.clearTimeout(t);
    }, [authState]);

    useEffect(() => {
        clearCachesIfFirebaseProjectChanged();
        clearCachesIfBuildIdChanged();
        touchFirebaseProjectCache();

        if (pathname === '/estudiante/selector') {
            setAuthState('authenticated');
            return;
        }

        const studentId = localStorage.getItem('student_id');

        if (isDemoEstudianteRoute(pathname)) {
            bootstrapDemoStudentSession();
            setAuthState('authenticated');
            return;
        }

        if (!studentId || studentId.trim() === '' || studentId.trim() === 'demo') {
            if (studentId === 'demo') localStorage.removeItem('student_id');
            router.replace('/login');
            setAuthState('unauthenticated');
            return;
        }

        setAuthState('authenticated');

        const isStudentDashboard =
            pathname === '/estudiante/dashboard' || pathname === '/demo/estudiante';
        const skipPrefetch = isDemoEstudianteRoute(pathname) && !shouldDemoRouteUseFirebase();
        const runPrefetch = () => {
            if (skipPrefetch) return;
            getStudentSimulations(studentId)
                .then((sims) => prefetchStudentData(studentId, sims))
                .catch(() => {});
        };
        if (isStudentDashboard) {
            window.setTimeout(runPrefetch, 300);
        } else {
            runPrefetch();
        }
    }, [router, pathname]);

    return { authState, authSlow };
}

function usePanelPresentationFocus(
    authState: 'checking' | 'authenticated' | 'unauthenticated',
    pathname: string | null,
) {
    useEffect(() => {
        if (authState === 'unauthenticated') return;
        if (!isAutoPresentationFocusPanelRoute(pathname)) return;
        requestPanelPresentationFocus();
    }, [authState, pathname]);
}

export default function EstudianteClientShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDemoStudent = isDemoEstudianteRoute(pathname);

    return (
        <PanelDataReadinessGate skip={isDemoStudent}>
            <EstudianteClientShellInner>{children}</EstudianteClientShellInner>
        </PanelDataReadinessGate>
    );
}

function EstudianteClientShellInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDemoStudent = isDemoEstudianteRoute(pathname);
    const [whatsappGateOpen, setWhatsappGateOpen] = useState(false);

    useDemoBackGuard(isDemoStudent, DEMO_ESTUDIANTE_HOME, isDemoEstudianteRoute);

    const { authState, authSlow } = useAuthGuard();
    usePanelPresentationFocus(authState, pathname);

    useEffect(() => {
        if (authState !== 'authenticated') {
            setWhatsappGateOpen(false);
            return;
        }
        setWhatsappGateOpen(shouldShowWhatsAppChannelGate(pathname, isDemoStudent));
    }, [authState, pathname, isDemoStudent]);

    if (authState === 'checking' || authState === 'unauthenticated') {
        return (
            <EstudianteRouteRecovery>
                <div
                    style={{
                        minHeight: '100vh',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                border: '4px solid #e2e8f0',
                                borderTopColor: '#6366f1',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                margin: '0 auto 16px',
                            }}
                        />
                        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
                            Verificando sesión...
                        </p>
                        {authSlow ? (
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                style={{
                                    marginTop: 12,
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    border: '1px solid #e2e8f0',
                                    background: '#fff',
                                    color: '#475569',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Recargar
                            </button>
                        ) : null}
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                </div>
            </EstudianteRouteRecovery>
        );
    }

    return (
            <EstudianteRouteRecovery>
                <EstudiantePanelCacheProvider>
                    <CourseEntitlementsProvider>
                        <PremiumStudentShell>
                            <DevToolsGuard />
                            {isDemoStudent ? <DemoExitControl mode="estudiante" /> : null}
                            {!isDemoStudent ? (
                                <StudentWhatsAppChannelGate
                                    open={whatsappGateOpen}
                                    onClose={() => setWhatsappGateOpen(false)}
                                />
                            ) : null}
                            {/* PIFA: soft/hard para CUALQUIER simulacro; shell cubre todo /estudiante/* */}
                            <StudentPifaResultsClassGate disabled={isDemoStudent} />
                            {children}
                            <StudentMobileNav />
                            {!isDemoStudent ? <InstallPrompt variant="panel" /> : null}
                        </PremiumStudentShell>
                    </CourseEntitlementsProvider>
                </EstudiantePanelCacheProvider>
            </EstudianteRouteRecovery>
    );
}
