'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { HelpCircle, RotateCcw, Route, X } from 'lucide-react';
import { useCoordinadorGuidedTour } from '@features/coordinador/context/CoordinadorGuidedTourContext';
import { COORD_TOUR_MODULE_LABELS } from '@features/coordinador/lib/coordinatorGuidedTourStorage';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { useCoordinatorVoiceGuide } from '@features/coordinador/hooks/useCoordinatorVoiceGuide';

/**
 * Burbuja flotante unificada: tour interactivo + tour completo + reset.
 * La narración con subtítulos vive en el tour (botón «Voz») y en CoordinatorVoiceDock.
 */
export default function CoordinadorHelpBubble() {
    const { startFullPanelTour, resetAllTours, active: tourActive, routeKey } =
        useCoordinadorGuidedTour();
    const [menuOpen, setMenuOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const moduleLabel = COORD_TOUR_MODULE_LABELS[routeKey] ?? 'Panel coordinador';

    const { warmUp, stopSpeaking } = useCoordinatorVoiceGuide();

    useEffect(() => {
        if (!menuOpen) return;
        const onPointer = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [menuOpen]);

    const closeAndStopVoice = useCallback(() => {
        setMenuOpen(false);
        stopSpeaking();
    }, [stopSpeaking]);

    const handleCompleteTour = useCallback(() => {
        warmUp();
        closeAndStopVoice();
        startFullPanelTour();
    }, [closeAndStopVoice, startFullPanelTour, warmUp]);

    const handleResetTours = useCallback(() => {
        stopSpeaking();
        resetAllTours();
        setMenuOpen(false);
    }, [resetAllTours, stopSpeaking]);

    return (
        <div
            ref={rootRef}
            className="fixed z-40 flex flex-col items-end gap-2 right-4 bottom-[calc(var(--recordings-area-nav-lift,0px)+4.75rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 lg:right-6"
            data-coord-help-bubble
        >
            {menuOpen && (
                <div
                    className="w-72 rounded-2xl border border-white/[0.1] bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2"
                    role="menu"
                    aria-label="Ayuda del panel coordinador"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                        <div>
                            <p className="text-xs font-bold text-white/90">Ayuda</p>
                            <p className="text-[10px] text-white/45">{moduleLabel}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setMenuOpen(false)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06]"
                            aria-label="Cerrar menú de ayuda"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-2 space-y-1">
                        <button
                            type="button"
                            role="menuitem"
                            onClick={handleCompleteTour}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-fuchsia-500/10 border border-transparent hover:border-fuchsia-500/20"
                        >
                            <span className="w-8 h-8 rounded-lg bg-fuchsia-500/15 flex items-center justify-center text-fuchsia-300">
                                <Route className="w-4 h-4" />
                            </span>
                            <span>
                                <span className="block text-[13px] font-semibold text-white/90">
                                    Tutorial completo
                                </span>
                                <span className="block text-[10px] text-white/45">
                                    Recorre todas las pantallas sin tapar la vista
                                </span>
                            </span>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={handleResetTours}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-white/5 border border-transparent hover:border-white/10"
                        >
                            <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                                <RotateCcw className="w-4 h-4" />
                            </span>
                            <span>
                                <span className="block text-[13px] font-semibold text-white/70">
                                    Resetear tutoriales
                                </span>
                                <span className="block text-[10px] text-white/35">
                                    Vuelve a mostrar tours automáticos
                                </span>
                            </span>
                        </button>
                    </div>
                </div>
            )}

            <button
                type="button"
                data-coord-tour={TourAnchors.helpBubble}
                onClick={() => {
                    warmUp();
                    setMenuOpen((v) => !v);
                }}
                className={`group flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-[1.04] active:scale-[0.96] ${
                    menuOpen || tourActive
                        ? 'bg-gradient-to-br from-violet-600 to-indigo-600 border border-violet-400/40 shadow-violet-500/30'
                        : 'bg-slate-900/90 backdrop-blur-xl border border-white/[0.1] hover:border-violet-500/35'
                }`}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                title="Ayuda: tours del panel"
            >
                <HelpCircle
                    className={`w-5 h-5 transition-colors ${
                        menuOpen || tourActive ? 'text-white' : 'text-violet-300 group-hover:text-violet-200'
                    }`}
                    strokeWidth={2.2}
                />
            </button>
        </div>
    );
}
