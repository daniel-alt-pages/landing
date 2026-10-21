'use client';
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallPromptProps = {
    /** login = dentro del card oscuro; panel = barra flotante post-login */
    variant?: 'login' | 'panel';
};

export default function InstallPrompt({ variant = 'panel' }: InstallPromptProps) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [show, setShow] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
        setIsStandalone(standalone);
        if (standalone) return;

        const dismissed = localStorage.getItem('pwa_install_dismissed');
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
        }

        const ua = navigator.userAgent;
        const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(isiOS);

        const delayMs = variant === 'panel' ? 4000 : 3000;

        if (isiOS) {
            const timer = setTimeout(() => setShow(true), delayMs);
            return () => clearTimeout(timer);
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setTimeout(() => setShow(true), variant === 'panel' ? 2500 : 2000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [variant]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShow(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem('pwa_install_dismissed', String(Date.now()));
    };

    if (isStandalone || !show) return null;

    if (variant === 'panel') {
        return (
            <div
                className="pointer-events-none fixed inset-x-0 z-[85] flex justify-center px-4"
                style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))' }}
            >
                <div
                    className="pointer-events-auto w-full max-w-md rounded-2xl border border-indigo-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-indigo-500/30 dark:bg-slate-900/95"
                    style={{ animation: 'sgInstallSlideUp 0.35s ease-out' }}
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-500/15 text-violet-600 dark:text-violet-300">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                            </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Instalar app</p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {isIOS
                                    ? 'Compartir → Agregar a inicio para pantalla completa'
                                    : 'Acceso rápido desde tu pantalla de inicio'}
                            </p>
                        </div>
                        {!isIOS ? (
                            <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleDismiss}
                                    className="cursor-pointer rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-500"
                                >
                                    No
                                </button>
                                <button
                                    type="button"
                                    onClick={handleInstall}
                                    className="cursor-pointer rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-[11px] font-bold text-violet-700 dark:border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-200"
                                >
                                    Instalar
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 dark:bg-white/10"
                                aria-label="Cerrar"
                            >
                                <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
                <style jsx global>{`
                    @keyframes sgInstallSlideUp {
                        from { opacity: 0; transform: translateY(12px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="login-install-prompt mt-4 w-full" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="rounded-2xl overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.06) 100%)',
                    border: '1px solid rgba(124,58,237,0.2)',
                }}>

                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.15))', border: '1px solid rgba(124,58,237,0.25)' }}>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="url(#install-grad)" strokeWidth={1.5}>
                                <defs>
                                    <linearGradient id="install-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#7c3aed" />
                                        <stop offset="100%" stopColor="#06b6d4" />
                                    </linearGradient>
                                </defs>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                            </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-bold text-white">Instalar App</h3>
                            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                {isIOS
                                    ? 'Toca Compartir → Agregar a inicio'
                                    : 'Acceso rápido desde tu pantalla'
                                }
                            </p>
                        </div>

                        {!isIOS ? (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button onClick={handleDismiss}
                                    className="text-[10px] font-medium px-2 py-1.5 rounded-lg cursor-pointer"
                                    style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    No
                                </button>
                                <button onClick={handleInstall}
                                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                                    style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.3)' }}>
                                    Instalar
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleDismiss}
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
                                style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
