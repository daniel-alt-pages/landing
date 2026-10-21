'use client';

import { useMemo, useState } from 'react';
import LoginBirthDateField from '@features/auth/components/LoginBirthDateField';
import { buildDirectLoginSupportUrl } from '@/lib/supportWhatsApp';
import { toUpperCaseFullName } from '@/lib/textTransforms';

export type DirectLoginWhatsAppModalProps = {
    isOpen: boolean;
    onClose: () => void;
    documentId?: string;
    locked?: boolean;
    attempts?: number;
    defaultBirthDisplay?: string;
    defaultBirthIso?: string | null;
};

export default function DirectLoginWhatsAppModal({
    isOpen,
    onClose,
    documentId = '',
    locked,
    attempts = 0,
    defaultBirthDisplay = '',
    defaultBirthIso = null,
}: DirectLoginWhatsAppModalProps) {
    const [fullName, setFullName] = useState('');
    const [birthDisplay, setBirthDisplay] = useState(defaultBirthDisplay);
    const [birthIso, setBirthIso] = useState<string | null>(defaultBirthIso);
    const [error, setError] = useState('');

    const canSubmit = fullName.trim().length >= 3 && !!birthIso;

    const previewMessage = useMemo(
        () =>
            buildDirectLoginSupportUrl({
                documentId: documentId.trim() || undefined,
                fullName: fullName.trim() || undefined,
                birthDateIso: birthIso,
                locked,
                attempts,
            }),
        [attempts, birthIso, documentId, fullName, locked]
    );

    if (!isOpen) return null;

    const handleOpenWhatsApp = () => {
        setError('');
        if (!canSubmit || !previewMessage) {
            setError('Completa nombre y fecha de nacimiento.');
            return;
        }
        window.open(previewMessage, '_blank', 'noopener,noreferrer');
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            style={{ fontFamily: "'Inter', sans-serif" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="whatsapp-intake-title"
        >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div
                className="relative w-full max-w-md rounded-3xl overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(10,20,15,0.98), rgba(15,25,20,0.98))',
                    border: '1px solid rgba(37,211,102,0.25)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.65)',
                }}
            >
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #25D366, #128C7E)' }} />
                <div className="px-6 pt-7 pb-6">
                    <h2 id="whatsapp-intake-title" className="mb-1 text-center text-lg font-black text-white">
                        Datos para el asesor
                    </h2>
                    <p className="mb-5 text-center text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        Confirmamos tu identidad antes de abrir WhatsApp. El mensaje irá estructurado para el equipo.
                    </p>

                    <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Nombre completo (MAYÚSCULAS)
                    </label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(toUpperCaseFullName(e.target.value))}
                        placeholder="EJ: MARIA FERNANDA LOPEZ"
                        className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold tracking-wide text-white placeholder:font-normal placeholder:text-slate-500"
                        autoComplete="name"
                    />

                    <label className="mb-1.5 block text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Fecha de nacimiento
                    </label>
                    <div className="mb-4">
                        <LoginBirthDateField
                            value={birthDisplay}
                            onChange={(display, iso) => {
                                setBirthDisplay(display);
                                setBirthIso(iso);
                            }}
                        />
                    </div>

                    {documentId.trim() && (
                        <p className="mb-4 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            Documento: <span className="font-mono text-white/70">{documentId.trim()}</span>
                        </p>
                    )}

                    {error && <p className="mb-3 text-sm text-red-300">{error}</p>}

                    <button
                        type="button"
                        disabled={!canSubmit}
                        onClick={handleOpenWhatsApp}
                        className="mb-3 flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                            background: 'linear-gradient(135deg, #25D366, #128C7E)',
                            boxShadow: '0 4px 20px rgba(37,211,102,0.25)',
                        }}
                    >
                        Abrir WhatsApp con mensaje
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2 text-center text-xs font-medium"
                        style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
