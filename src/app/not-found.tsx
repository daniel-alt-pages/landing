import Link from 'next/link';

export default function NotFound() {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #07080d 0%, #0c0e1a 40%, #0f0a1e 70%, #0a0b10 100%)',
                fontFamily: "'Inter', sans-serif",
            }}
        >
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                <div
                    className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />
                <div
                    className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />
            </div>

            <div className="relative w-full max-w-md text-center" style={{ zIndex: 10 }}>
                {/* Brand */}
                <p
                    className="text-[11px] font-semibold tracking-[4px] uppercase mb-6"
                    style={{ color: 'rgba(139,92,246,0.5)' }}
                >
                    Seamos Genios
                </p>

                {/* 404 Number */}
                <div className="mb-4">
                    <span
                        className="text-[8rem] sm:text-[10rem] font-black leading-none"
                        style={{
                            background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(6,182,212,0.15) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        404
                    </span>
                </div>

                {/* Title */}
                <h1
                    className="text-2xl sm:text-3xl font-black mb-3 tracking-tight"
                    style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Página no encontrada
                </h1>

                <p
                    className="text-sm leading-relaxed mb-8 max-w-sm mx-auto"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                    La página que buscas no existe o fue movida. Verifica la URL o regresa al inicio.
                </p>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200"
                        style={{
                            background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.15))',
                            border: '1px solid rgba(139,92,246,0.3)',
                            color: 'rgba(255,255,255,0.9)',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
                        </svg>
                        Ir al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
