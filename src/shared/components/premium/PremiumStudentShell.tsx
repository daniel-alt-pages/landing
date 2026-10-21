'use client';

import type { ReactNode } from 'react';

type PremiumStudentShellProps = {
  children: ReactNode;
  className?: string;
};

/** Shell claro para rutas estudiante (Inicio y paneles mobile). */
export default function PremiumStudentShell({ children, className = '' }: PremiumStudentShellProps) {
  return (
    <div
      data-student-theme
      data-premium-remake="student-shell"
      className={`relative min-h-screen bg-[#f8fafc] text-slate-900 ${className}`}
      style={{ fontFamily: 'var(--coord-font-sans, Inter, sans-serif)' }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-20 right-[-5%] h-72 w-72 rounded-full bg-indigo-400/18 blur-3xl" />
        <div className="absolute bottom-[20%] -left-12 h-56 w-56 rounded-full bg-violet-400/14 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
