'use client';

import { formatLockRemaining } from '@/lib/directLoginLockout';

export type DirectLoginWarningModalProps = {
    isOpen: boolean;
    onClose: () => void;
    message: string;
    locked?: boolean;
    lockRemainingMs?: number;
    attempts?: number;
    onGoogleLogin: () => void;
    googleLoading: boolean;
    googleDisabled: boolean;
    supportWhatsAppUrl?: string | null;
    showWhatsApp?: boolean;
    onWhatsAppClick?: () => void;
};

function GoogleIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

export default function DirectLoginWarningModal({
    isOpen,
    onClose,
    message,
    locked,
    lockRemainingMs = 0,
    attempts = 0,
    onGoogleLogin,
    googleLoading,
    googleDisabled,
    supportWhatsAppUrl,
    showWhatsApp,
    onWhatsAppClick,
}: DirectLoginWarningModalProps) {
    if (!isOpen) return null;

    const title = locked
        ? 'Acceso con documento bloqueado'
        : attempts > 0 && attempts < 3
          ? `No pudimos validar tus datos (${attempts}/3)`
          : 'Revisa tus datos de acceso';

    const subtitle = locked
        ? `Espera ${formatLockRemaining(lockRemainingMs)} o usa otra forma de ingreso.`
        : 'Entra con Google usando el correo con el que llenaste el formulario del simulacro.';

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            style={{ fontFamily: "'Inter', sans-serif" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="direct-login-warning-title"
        >
            <div
                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden
            />
            <div
                className="relative w-full max-w-md rounded-3xl overflow-hidden"
                style={{
                    background:
                        'linear-gradient(135deg, rgba(15,15,25,0.98) 0%, rgba(25,15,35,0.98) 100%)',
                    border: locked
                        ? '1px solid rgba(251, 191, 36, 0.35)'
                        : '1px solid rgba(239, 68, 68, 0.25)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.65)',
                }}
            >
                <div
                    className="h-1"
                    style={{
                        background: locked
                            ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                            : 'linear-gradient(90deg, #ef4444, #8b5cf6)',
                    }}
                />

                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                    aria-label="Cerrar"
                >
                    <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="px-6 pt-8 pb-6">
                    <div className="mb-5 flex justify-center">
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl"
                            style={{
                                background: locked ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)',
                            }}
                        >
                            <svg
                                className="h-7 w-7"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke={locked ? '#fbbf24' : '#f87171'}
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                />
                            </svg>
                        </div>
                    </div>

                    <h2 id="direct-login-warning-title" className="mb-2 text-center text-xl font-black text-white">
                        {title}
                    </h2>
                    <p className="mb-4 text-center text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {subtitle}
                    </p>
                    <p
                        className="mb-6 rounded-xl px-4 py-3 text-sm leading-relaxed"
                        style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: 'rgba(254, 202, 202, 0.95)',
                        }}
                    >
                        {message}
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onGoogleLogin();
                        }}
                        disabled={googleDisabled || googleLoading}
                        className="mb-3 flex w-full items-center justify-center gap-3 rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.18)',
                        }}
                    >
                        <span className="rounded-lg bg-white p-1 shadow-sm">
                            <GoogleIcon />
                        </span>
                        {googleLoading ? 'Autenticando...' : 'Continuar con Google'}
                    </button>

                    {showWhatsApp && (onWhatsAppClick || supportWhatsAppUrl) && (
                        onWhatsAppClick ? (
                            <button
                                type="button"
                                onClick={onWhatsAppClick}
                                className="mb-3 flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold text-white transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                                    boxShadow: '0 4px 20px rgba(37,211,102,0.25)',
                                }}
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white" aria-hidden>
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Hablar con un asesor por WhatsApp
                            </button>
                        ) : (
                        <a
                            href={supportWhatsAppUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-3 flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold text-white transition-all"
                            style={{
                                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                                boxShadow: '0 4px 20px rgba(37,211,102,0.25)',
                            }}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white" aria-hidden>
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Hablar con un asesor por WhatsApp
                        </a>
                        )
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2.5 text-center text-xs font-medium transition-colors"
                        style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                        Volver e intentar de nuevo
                    </button>
                </div>
            </div>
        </div>
    );
}
