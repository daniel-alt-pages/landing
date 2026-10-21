'use client';

import { useEffect, useState } from 'react';

export default function MantenimientoPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0d2e 30%, #0d1117 70%, #0a0f1a 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                padding: '24px',
            }}
        >
            {/* ─── Animated Background Blobs ──── */}
            <div
                style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-10%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'blobFloat1 8s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '-15%',
                    right: '-5%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'blobFloat2 10s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: '40%',
                    right: '15%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'blobFloat3 12s ease-in-out infinite',
                    pointerEvents: 'none',
                }}
            />

            {/* ─── Main Content Card ──── */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    maxWidth: '540px',
                    width: '100%',
                    textAlign: 'center',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {/* ─── Gear Icon ──── */}
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.15))',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        marginBottom: '32px',
                        animation: 'gearSpin 6s linear infinite',
                        boxShadow: '0 0 60px rgba(139, 92, 246, 0.2)',
                    }}
                >
                    <svg
                        width="50"
                        height="50"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(168, 132, 252, 0.9)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </div>

                {/* ─── Title ──── */}
                <h1
                    style={{
                        fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #c084fc, #f472b6, #818cf8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        margin: '0 0 16px 0',
                        lineHeight: 1.2,
                        letterSpacing: '-0.02em',
                    }}
                >
                    En Mantenimiento
                </h1>

                {/* ─── Subtitle ──── */}
                <p
                    style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                        lineHeight: 1.7,
                        margin: '0 0 40px 0',
                        maxWidth: '440px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                    }}
                >
                    Estamos realizando mejoras en la plataforma.
                    Volveremos en breve.
                </p>

                {/* ─── Progress Bar ──── */}
                <div
                    style={{
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '100px',
                        height: '6px',
                        width: '100%',
                        maxWidth: '320px',
                        margin: '0 auto 24px auto',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: '40%',
                            background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #8b5cf6)',
                            backgroundSize: '200% 100%',
                            borderRadius: '100px',
                            animation: 'progressShimmer 2s ease-in-out infinite',
                        }}
                    />
                </div>

                {/* ─── Status Message ──── */}
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '100px',
                        padding: '10px 20px',
                        marginBottom: '48px',
                    }}
                >
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#a78bfa',
                            animation: 'statusPulse 2s ease-in-out infinite',
                        }}
                    />
                    <span
                        style={{
                            color: 'rgba(167, 139, 250, 0.9)',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                        }}
                    >
                        Trabajando en mejoras...
                    </span>
                </div>

                {/* ─── Footer Brand ──── */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
                                fill="url(#starGrad)"
                            />
                            <defs>
                                <linearGradient id="starGrad" x1="3" y1="2" x2="21" y2="21">
                                    <stop stopColor="#c084fc" />
                                    <stop offset="1" stopColor="#f472b6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span
                            style={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'rgba(255,255,255,0.8)',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Seamos Genios
                        </span>
                    </div>
                    <span
                        style={{
                            color: 'rgba(255,255,255,0.3)',
                            fontSize: '0.8rem',
                        }}
                    >
                        Volveremos mejor que nunca
                    </span>
                </div>
            </div>

            {/* ─── Keyframes ──── */}
            <style>{`
        @keyframes blobFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes blobFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 20px) scale(1.05); }
          66% { transform: translate(20px, -30px) scale(1.1); }
        }
        @keyframes blobFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -20px) scale(1.08); }
        }
        @keyframes gearSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes progressShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
        </div>
    );
}
