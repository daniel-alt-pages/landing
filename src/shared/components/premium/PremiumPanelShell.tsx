'use client';

import type { ReactNode } from 'react';

type PremiumPanelShellProps = {
  children: ReactNode;
  className?: string;
  /** Centered full-screen layout (login, maintenance, readiness). */
  centered?: boolean;
  /** Light student background for Inicio. */
  variant?: 'dark' | 'student-light';
};

export default function PremiumPanelShell({
  children,
  className = '',
  centered = false,
  variant = 'dark',
}: PremiumPanelShellProps) {
  const bg = variant === 'student-light' ? 'bg-[#f8fafc]' : 'bg-[#07080d]';

  return (
    <div
      data-coordinator-theme
      className={`relative min-h-screen overflow-x-hidden ${centered ? 'overflow-y-auto' : ''} ${bg} ${centered ? 'flex items-center justify-center px-5 py-12' : ''} ${className}`}
      style={{ fontFamily: 'var(--coord-font-sans, Inter, sans-serif)' }}
    >
      {variant === 'dark' ? (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="coord-dashboard-ambient">
            <div className="coord-orb coord-orb-a" />
            <div className="coord-orb coord-orb-b" />
            <div className="coord-orb coord-orb-c" />
            <div className="coord-grid-overlay" />
          </div>
        </div>
      ) : null}
      <div className={`relative z-10 ${centered ? 'w-full' : 'min-h-screen'}`}>{children}</div>
    </div>
  );
}
