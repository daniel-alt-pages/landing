'use client';

import { useCallback, useEffect } from 'react';
import SgBrandLogo from '@/components/brand/SgBrandLogo';
import {
    markWhatsAppChannelGateSeen,
    SG_WHATSAPP_CHANNEL_NAME,
    SG_WHATSAPP_CHANNEL_URL,
} from '@features/estudiante/lib/whatsappChannelGate';

type Props = {
    open: boolean;
    onClose: () => void;
};

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

/** Modal obligatorio al inicio de sesión — seguir canal WhatsApp SEAMOSGENIOS COLOMBIA. */
export default function StudentWhatsAppChannelGate({ open, onClose }: Props) {
    useEffect(() => {
        if (!open) return;
        markWhatsAppChannelGateSeen();
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const handleFollow = useCallback(() => {
        window.open(SG_WHATSAPP_CHANNEL_URL, '_blank', 'noopener,noreferrer');
        markWhatsAppChannelGateSeen();
        onClose();
    }, [onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sg-wa-channel-gate-title"
        >
            <div
                className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md"
                aria-hidden
            />

            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] sm:rounded-[2.25rem] border border-white/10 shadow-[0_32px_120px_rgba(0,0,0,0.65)] animate-in fade-in zoom-in-95 duration-300">
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(circle at 20% 0%, rgba(99, 102, 241, 0.35), transparent 42%), radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.22), transparent 38%), linear-gradient(160deg, #0f172a 0%, #1e1b4b 52%, #0f172a 100%)',
                    }}
                />
                <div
                    className="pointer-events-none absolute top-0 left-0 right-0 h-px"
                    style={{
                        background:
                            'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.65), rgba(139, 92, 246, 0.55), transparent)',
                    }}
                />

                <div className="relative px-6 pt-8 pb-7 sm:px-8 sm:pt-10 sm:pb-8 text-center">
                    <div className="flex justify-center mb-5 sm:mb-6">
                        <SgBrandLogo
                            size="lg"
                            prominentShine
                            ambientGlow
                            float={false}
                            relaxed
                        />
                    </div>

                    <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-emerald-400/90 mb-2">
                        Canal oficial · WhatsApp
                    </p>

                    <h2
                        id="sg-wa-channel-gate-title"
                        className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight mb-3"
                    >
                        {SG_WHATSAPP_CHANNEL_NAME}
                    </h2>

                    <p className="text-sm sm:text-[15px] leading-relaxed text-white/65 font-medium mb-6 max-w-sm mx-auto">
                        Para usar tu panel necesitas seguir nuestro canal. Ahí encontrarás el método, tips y
                        novedades para lograr los resultados que buscas en el ICFES.
                    </p>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 mb-6 text-left">
                        <ul className="space-y-2 text-xs sm:text-[13px] text-white/75">
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                Estrategias y contenido exclusivo de Seamos Genios
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                                Avisos importantes sobre simulacros y reportes
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                                Comunidad de más de 11 mil estudiantes
                            </li>
                        </ul>
                    </div>

                    <button
                        type="button"
                        onClick={handleFollow}
                        className="group w-full inline-flex items-center justify-center gap-2.5 rounded-2xl px-5 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
                        style={{
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 48%, #059669 100%)',
                        }}
                    >
                        <WhatsAppIcon className="h-6 w-6 shrink-0" />
                        Seguir canal en WhatsApp
                    </button>

                    <p className="mt-4 text-[11px] sm:text-xs text-white/40 leading-snug">
                        Al tocar el botón se abrirá WhatsApp. Este aviso solo aparecerá la primera vez.
                    </p>
                </div>
            </div>
        </div>
    );
}
