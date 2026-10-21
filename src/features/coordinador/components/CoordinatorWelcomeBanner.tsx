'use client';

const BANNER_SRC =
    'https://images.prismic.io/seamosgenios2026/ai5e-Y1P9HI4UdPv_preicfes-gratuito-b%C3%B3gota.jpg?auto=format,compress';

/**
 * Banner de bienvenida Preicfes — respeta la proporción original 3000x500.
 */
export default function CoordinatorWelcomeBanner() {
    return (
        <div
            className="relative w-full overflow-hidden sm:rounded-t-2xl"
            style={{
                aspectRatio: '6 / 1',
                background: 'var(--coord-surface, #111827)',
            }}
            role="img"
            aria-label="Bienvenido al panel de coordinador — Preicfes Gratuito Bogotá"
        >
            <img
                src={BANNER_SRC}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover object-center"
                decoding="async"
                fetchPriority="high"
            />
        </div>
    );
}
