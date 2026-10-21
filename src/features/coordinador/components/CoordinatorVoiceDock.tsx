'use client';

import { createPortal } from 'react-dom';
import { Pause, Play, Square } from 'lucide-react';
import { useCoordinadorGuidedTourOptional } from '@features/coordinador/context/CoordinadorGuidedTourContext';
import { useCoordinatorVoiceGuide } from '@features/coordinador/hooks/useCoordinatorVoiceGuide';

const BAR_COUNT = 12;

function VoiceVisualizer({ active, paused }: { active: boolean; paused: boolean }) {
    return (
        <div
            className={`coord-voice-viz${active ? ' coord-voice-viz--active' : ''}${paused ? ' coord-voice-viz--paused' : ''}`}
            aria-hidden
        >
            {Array.from({ length: BAR_COUNT }, (_, i) => (
                <span key={i} className="coord-voice-viz__bar" style={{ ['--vi' as string]: i }} />
            ))}
        </div>
    );
}

/** Dock inferior compacto: subtítulos + visualizador de voz. */
export default function CoordinatorVoiceDock() {
    const tour = useCoordinadorGuidedTourOptional();
    const {
        isPlaying,
        isPaused,
        canPause,
        currentLine,
        spokenInLine,
        lineIndex,
        lineCount,
        stopSpeaking,
        togglePause,
    } = useCoordinatorVoiceGuide();

    if (tour?.active || !isPlaying || !currentLine || typeof document === 'undefined') return null;

    const spoken = currentLine.slice(0, spokenInLine);
    const pending = currentLine.slice(spokenInLine);
    const lineKey = `${lineIndex}-${currentLine.slice(0, 24)}`;

    return createPortal(
        <div className="coord-voice-dock" role="status" aria-live="polite" aria-atomic="false">
            <div className="coord-voice-dock__panel">
                <VoiceVisualizer active={isPlaying && !isPaused} paused={isPaused} />

                <div className="coord-voice-dock__content">
                    <div className="coord-voice-dock__meta">
                        <span className="coord-voice-dock__dot" />
                        <span>{isPaused ? 'Pausado' : 'Narrando'}</span>
                        {lineCount > 1 ? (
                            <span className="coord-voice-dock__counter">
                                {lineIndex + 1}/{lineCount}
                            </span>
                        ) : null}
                    </div>
                    <p key={lineKey} className="coord-voice-dock__subtitle">
                        <span className="coord-voice-dock__spoken">{spoken}</span>
                        <span className="coord-voice-dock__pending">{pending}</span>
                    </p>
                </div>

                <div className="coord-voice-dock__actions">
                    {canPause ? (
                        <button
                            type="button"
                            className="coord-voice-dock__pause"
                            onClick={togglePause}
                            title={isPaused ? 'Reanudar' : 'Pausar'}
                            aria-label={isPaused ? 'Reanudar narración' : 'Pausar narración'}
                        >
                            {isPaused ? (
                                <Play className="w-3 h-3" fill="currentColor" />
                            ) : (
                                <Pause className="w-3 h-3" fill="currentColor" />
                            )}
                        </button>
                    ) : null}
                    <button
                        type="button"
                        className="coord-voice-dock__stop"
                        onClick={stopSpeaking}
                        title="Detener narración"
                        aria-label="Detener narración"
                    >
                        <Square className="w-3 h-3" fill="currentColor" />
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
