'use client';

import type { ReactNode } from 'react';

type PremiumCoordinatorMainProps = {
  children: ReactNode;
  className?: string;
};

/** Área principal coordinador con ambiente Stitch (orbs + grid). */
export default function PremiumCoordinatorMain({ children, className = '' }: PremiumCoordinatorMainProps) {
  return (
    <div className={`relative min-h-full ${className}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="coord-dashboard-ambient">
          <div className="coord-orb coord-orb-a" />
          <div className="coord-orb coord-orb-b" />
          <div className="coord-orb coord-orb-c" />
          <div className="coord-grid-overlay" />
        </div>
      </div>
      <div className="relative z-[1] coord-stagger-in">{children}</div>
    </div>
  );
}
