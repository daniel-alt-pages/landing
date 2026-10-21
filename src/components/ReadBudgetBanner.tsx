'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * Banner no intrusivo con countdown para informar a los usuarios
 * cuando el sistema de protección (Read Budget) entra en cooldown.
 * Se auto-oculta cuando el cooldown termina.
 */
export default function ReadBudgetBanner() {
    const [alert, setAlert] = useState<{
        type: string;
        role: string;
        limit: number;
        cooldownSecs?: number;
    } | null>(null);
    const [visible, setVisible] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const handleAlert = (e: any) => {
            const detail = e.detail;
            if (!detail) return;

            setAlert({
                type: detail.type,
                role: detail.role,
                limit: detail.limit,
                cooldownSecs: detail.cooldownSecs,
            });
            setVisible(true);

            // Limpiar timer previo
            if (timerRef.current) clearInterval(timerRef.current);

            if (detail.type === 'session_exhausted' && detail.cooldownSecs) {
                // Iniciar countdown visual
                setCountdown(detail.cooldownSecs);
                timerRef.current = setInterval(() => {
                    setCountdown(prev => {
                        if (prev <= 1) {
                            // Cooldown terminado → ocultar banner
                            if (timerRef.current) clearInterval(timerRef.current);
                            setTimeout(() => setVisible(false), 800);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else if (detail.type === 'minute_limit_reached') {
                // Auto-ocultar después de 5s
                setCountdown(0);
                setTimeout(() => setVisible(false), 5000);
            }
        };

        window.addEventListener('sg-read-budget-alert', handleAlert);
        return () => {
            window.removeEventListener('sg-read-budget-alert', handleAlert);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    if (!visible || !alert) return null;

    const isExhausted = alert.type === 'session_exhausted';

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 99999,
                background: isExhausted
                    ? 'linear-gradient(135deg, #1e1b4b, #312e81)'
                    : 'linear-gradient(135deg, #422006, #713f12)',
                color: '#fff',
                padding: '16px 20px',
                borderRadius: '16px',
                boxShadow: isExhausted
                    ? '0 10px 40px -5px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.2)'
                    : '0 10px 40px -5px rgba(234,179,8,0.3), 0 0 0 1px rgba(234,179,8,0.2)',
                maxWidth: '340px',
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                animation: 'sgSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(12px)',
            }}
        >
            <style>{`
                @keyframes sgSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes sgPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>

            {/* Icono con countdown */}
            <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: isExhausted
                    ? 'rgba(99,102,241,0.2)'
                    : 'rgba(234,179,8,0.2)',
                border: `1px solid ${isExhausted ? 'rgba(129,140,248,0.3)' : 'rgba(250,204,21,0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: countdown > 0 ? '16px' : '20px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                animation: countdown > 0 ? 'sgPulse 1s ease-in-out infinite' : 'none',
            }}>
                {countdown > 0 ? `${countdown}` : (isExhausted ? '⛔' : '⏱️')}
            </div>

            <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700 }}>
                    {isExhausted ? 'Procesando datos...' : 'Carga frecuente'}
                </h4>
                <p style={{
                    margin: 0,
                    fontSize: '13px',
                    opacity: 0.75,
                    lineHeight: 1.5,
                }}>
                    {isExhausted
                        ? countdown > 0
                            ? `El sistema se reiniciará automáticamente en ${countdown}s. No necesitas hacer nada.`
                            : '¡Listo! El sistema se ha reiniciado. Puedes continuar navegando.'
                        : 'Velocidad de carga regulada momentáneamente. Se restablecerá en unos segundos.'
                    }
                </p>
            </div>

            <button
                onClick={() => setVisible(false)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    opacity: 0.4,
                    cursor: 'pointer',
                    padding: '2px',
                    fontSize: '16px',
                    lineHeight: 1,
                }}
            >
                ✕
            </button>
        </div>
    );
}
