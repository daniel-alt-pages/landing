'use client';
import { ReactNode } from 'react';

/** Fondo ambiental del dashboard (orbs + grid). Mismos tokens Stitch, sin cambiar paleta. */
export default function CoordinadorDashboardAmbient({ children }: { children: ReactNode }) {
    return (
        <div className="coord-dashboard-pro relative">
            <div className="coord-dashboard-ambient pointer-events-none" aria-hidden>
                <div className="coord-orb coord-orb-a" />
                <div className="coord-orb coord-orb-b" />
                <div className="coord-orb coord-orb-c" />
                <div className="coord-grid-overlay" />
            </div>
            <div className="relative z-[1]">{children}</div>
        </div>
    );
}
