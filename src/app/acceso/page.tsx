'use client';
import { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from 'firebase/auth';
import { finishGoogleRedirectLogin, startGoogleLogin } from '@features/auth/lib/googleAuthFlow';
import { getCoordinatorByToken, warmupCoordinatorCache } from '@features/simulacro/lib/firestoreService';
import { logAccess } from '@/lib/accessLogService';

// ============================================================
// Coordinator Magic Link Access Page
// ============================================================
// URL: /acceso?t={token}
// Flow:
//  1. Validate token against Firestore
//  2. Show coordinator info → ask to verify with Google sign-in
//  3. Compare Google email with token email
//  4. If match → grant access → redirect to /coordinador
//  5. If mismatch → deny
// ============================================================

interface CoordinatorInfo {
    email: string;
    institution: string;
    name: string;
}

function AccesoContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('t') || '';

    const [status, setStatus] = useState<'loading' | 'token-valid' | 'verifying' | 'success' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [coordinator, setCoordinator] = useState<CoordinatorInfo | null>(null);

    // Step 1: Validate token
    useEffect(() => {
        if (!token) {
            const timeout = window.setTimeout(() => {
                setStatus('error');
                setErrorMsg('No se proporcionó un token de acceso válido.');
            }, 0);
            return () => window.clearTimeout(timeout);
        }

        const validate = async () => {
            try {
                const result = await getCoordinatorByToken(token);

                if (!result) {
                    setStatus('error');
                    setErrorMsg('Este enlace de acceso no es válido o ha sido desactivado.');
                    return;
                }

                setCoordinator(result);
                setStatus('token-valid'); // Show "verify with Google" button
            } catch (err) {
                console.error('Token validation error:', err);
                setStatus('error');
                setErrorMsg('Hubo un error al validar el acceso. Intenta de nuevo.');
            }
        };

        validate();
    }, [token]);

    const completeGoogleVerify = useCallback((user: User) => {
            if (!coordinator) return;
            const userEmail = user.email;

            if (!userEmail) {
                setStatus('error');
                setErrorMsg('No se pudo obtener el correo electrónico de Google.');
                return;
            }

            // Compare emails (case-insensitive)
            if (userEmail.toLowerCase() !== coordinator.email.toLowerCase()) {
                setStatus('error');
                setErrorMsg(
                    `El correo ${userEmail} no coincide con el coordinador registrado. ` +
                    `Inicia sesión con la cuenta correcta.`
                );
                return;
            }

            // ✅ Email matches! Grant access
            setStatus('success');
            localStorage.setItem('coordinator_email', coordinator.email);
            localStorage.setItem('coordinator_institution', coordinator.institution);
            logAccess(coordinator.email, 'coordinador', coordinator.name, coordinator.institution, user.uid);
            // 🚀 Warmup: precarga datos del coordinador durante la animación de éxito
            warmupCoordinatorCache().catch(() => {});

            setTimeout(() => {
                router.replace('/coordinador');
            }, 1500);
    }, [coordinator, router]);

    useEffect(() => {
        if (!coordinator || status !== 'token-valid') return;
        let cancelled = false;
        const finishRedirect = async () => {
            try {
                const result = await finishGoogleRedirectLogin();
                if (!result || cancelled) return;
                setStatus('verifying');
                completeGoogleVerify(result.user);
            } catch (err) {
                console.error('Google redirect sign-in error:', err);
                if (!cancelled) {
                    setStatus('error');
                    setErrorMsg('Error al verificar con Google. Intenta de nuevo.');
                }
            }
        };
        void finishRedirect();
        return () => {
            cancelled = true;
        };
    }, [completeGoogleVerify, coordinator, status]);

    // Step 2: Google sign-in to verify identity
    const handleGoogleVerify = async () => {
        if (!coordinator) return;

        setStatus('verifying');

        try {
            const started = await startGoogleLogin();
            if (started.status === 'redirecting') return;
            completeGoogleVerify(started.result.user);

        } catch (err: unknown) {
            console.error('Google sign-in error:', err);
            const firebaseErr = err as { code?: string; message?: string };
            if (firebaseErr.code === 'auth/popup-closed-by-user') {
                setStatus('token-valid'); // Let them try again
                return;
            }
            setStatus('error');
            setErrorMsg('Error al verificar con Google. Intenta de nuevo.');
        }
    };

    return (
        <div className="px-8 py-12">
            {/* ─── LOADING STATE ─── */}
            {status === 'loading' && (
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full"
                                style={{ border: '3px solid rgba(255,255,255,0.06)', borderTopColor: '#8b5cf6', animation: 'spinRing 1s linear infinite' }} />
                            <div className="absolute inset-2 rounded-full"
                                style={{ background: 'rgba(139,92,246,0.1)' }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-6 h-6" style={{ color: '#8b5cf6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <h2 className="text-lg font-black text-white mb-2">Validando enlace...</h2>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Verificando credenciales del coordinador
                    </p>
                    <div className="mt-6 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', height: '3px' }}>
                        <div className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)', width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    </div>
                </div>
            )}

            {/* ─── TOKEN VALID — VERIFY WITH GOOGLE ─── */}
            {status === 'token-valid' && coordinator && (
                <div className="text-center" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                    {/* Coordinator info */}
                    <div className="flex justify-center mb-5">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(139,92,246,0.12)', border: '2px solid rgba(139,92,246,0.2)' }}>
                            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-lg font-black text-white mb-1">
                        Hola, {coordinator.name}
                    </h2>
                    <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Panel de coordinador
                    </p>

                    {/* Institution badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-6"
                        style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                        </svg>
                        <span className="text-xs font-bold text-violet-300">
                            {coordinator.institution === '*' ? 'Todas las instituciones' : coordinator.institution}
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="h-px mb-6 mx-4"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

                    {/* Email verification info */}
                    <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Verifica tu identidad con tu correo de Google
                    </p>

                    {/* Google sign-in button */}
                    <button
                        onClick={handleGoogleVerify}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#ffffff',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                        }}
                    >
                        {/* Google icon */}
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        Verificar con Google
                    </button>

                    <p className="mt-4 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Usa el correo registrado como coordinador
                    </p>
                </div>
            )}

            {/* ─── VERIFYING STATE ─── */}
            {status === 'verifying' && (
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full"
                                style={{ border: '3px solid rgba(255,255,255,0.06)', borderTopColor: '#06b6d4', animation: 'spinRing 1s linear infinite' }} />
                        </div>
                    </div>
                    <h2 className="text-lg font-black text-white mb-2">Verificando identidad...</h2>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Comprobando correo electrónico
                    </p>
                </div>
            )}

            {/* ─── SUCCESS STATE ─── */}
            {status === 'success' && coordinator && (
                <div className="text-center" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(52,211,153,0.12)', boxShadow: '0 0 40px rgba(52,211,153,0.15)' }}>
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-lg font-black text-white mb-1">¡Bienvenido, {coordinator.name}!</h2>
                    <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Identidad verificada correctamente
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Redirigiendo al panel...
                        </span>
                    </div>
                </div>
            )}

            {/* ─── ERROR STATE ─── */}
            {status === 'error' && (
                <div className="text-center" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(239,68,68,0.12)', boxShadow: '0 0 40px rgba(239,68,68,0.1)' }}>
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-lg font-black text-white mb-2">Acceso Denegado</h2>
                    <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {errorMsg}
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
                        style={{
                            background: 'rgba(255,255,255,0.07)',
                            color: 'rgba(255,255,255,0.8)',
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}
                    >
                        Ir al inicio de sesión
                    </button>
                </div>
            )}
        </div>
    );
}

export default function AccesoCoordinador() {
    return (
        <>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
                @keyframes spinRing { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes bgPulse { 0% { opacity: 0.6; } 100% { opacity: 1; } }
                .access-bg::before {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background:
                        radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.12) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 30%, rgba(6,182,212,0.1) 0%, transparent 50%);
                    animation: bgPulse 6s ease-in-out infinite alternate;
                    z-index: 0;
                }
            `}</style>

            <div className="access-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
                style={{ background: '#0a0b10', fontFamily: "'Inter', sans-serif" }}>

                <div className="relative w-full max-w-sm" style={{ zIndex: 10, animation: 'fadeInUp 0.5s ease-out' }}>

                    {/* Brand */}
                    <div className="text-center mb-6">
                        <p className="text-[11px] font-semibold tracking-[3px] uppercase"
                            style={{ color: 'rgba(255,255,255,0.3)' }}>
                            Seamos Genios
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="rounded-3xl overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(139,92,246,0.04) 100%)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(40px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                        }}>

                        {/* Accent bar */}
                        <div className="h-px"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), rgba(6,182,212,0.5), transparent)' }} />

                        <Suspense fallback={
                            <div className="px-8 py-12 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 rounded-full"
                                            style={{ border: '3px solid rgba(255,255,255,0.06)', borderTopColor: '#8b5cf6', animation: 'spinRing 1s linear infinite' }} />
                                    </div>
                                </div>
                                <h2 className="text-lg font-black text-white">Cargando...</h2>
                            </div>
                        }>
                            <AccesoContent />
                        </Suspense>
                    </div>

                    {/* Security badge */}
                    <div className="mt-4 flex items-center justify-center gap-1.5">
                        <svg className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Enlace de acceso privado · Verificación por correo requerida
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
