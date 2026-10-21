'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    coordinatorSpeechEngine,
    speechEngineEmptySnapshot,
    type SpeechEngineSnapshot,
} from '@shared/lib/speech';

export function useCoordinatorVoiceGuide() {
    const [snap, setSnap] = useState<SpeechEngineSnapshot>(() =>
        typeof window !== 'undefined'
            ? coordinatorSpeechEngine.getSnapshot()
            : speechEngineEmptySnapshot({
                  os: 'unknown',
                  browser: 'unknown',
                  isMobile: false,
                  isIOS: false,
                  isWebKit: false,
                  isChromium: false,
                  supportsPause: true,
                  needsLongSpeechWorkaround: false,
              }),
    );

    useEffect(() => coordinatorSpeechEngine.subscribe(setSnap), []);

    const warmUp = useCallback(() => {
        coordinatorSpeechEngine.warmUp();
    }, []);

    const startSpeaking = useCallback((script: string) => {
        coordinatorSpeechEngine.warmUp();
        coordinatorSpeechEngine.speak(script);
    }, []);

    const stopSpeaking = useCallback(() => {
        coordinatorSpeechEngine.stop();
    }, []);

    const togglePause = useCallback(() => {
        if (snap.isPaused) coordinatorSpeechEngine.resume();
        else coordinatorSpeechEngine.pause();
    }, [snap.isPaused]);

    return {
        isSupported: snap.isSupported,
        isPlaying: snap.isSpeaking,
        isPaused: snap.isPaused,
        progress: snap.progress,
        canPause: snap.canPause,
        platform: snap.platform,
        displayScript: snap.displayScript,
        currentLine: snap.currentLine,
        spokenInLine: snap.spokenInLine,
        lineIndex: snap.lineIndex,
        lineCount: snap.lineCount,
        warmUp,
        startSpeaking,
        stopSpeaking,
        togglePause,
    };
}
