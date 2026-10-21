'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import RecordingCoverArt from '@features/recordings/components/RecordingCoverArt';
import RecordingVideoPlayer from '@features/recordings/components/RecordingVideoPlayer';
import { useRecordingCoverShield } from '@features/recordings/hooks/useRecordingCoverShield';
import {
  loadCourseRecordingPlayback,
  readRecordingTime,
  rememberRecordingTime,
  saveCourseRecordingPlayback,
} from '@features/curso/lib/courseRecordingPlaybackSession';
import { recordingDisplayTitle } from '@features/recordings/lib/recordingsCatalog';
import { recordingPlayerClasses } from '@features/recordings/lib/recordingPlayerClasses';
import { areaAccent } from '@features/recordings/lib/recordingsTheme';
import type { RecordingsCatalogMode } from '@features/recordings/lib/recordingsCatalog';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';

type RecordingsPlayerStageProps = {
  recordings: SimRecording[];
  activeId: string;
  simulationId: string;
  variant?: 'light' | 'dark';
  catalogMode?: RecordingsCatalogMode;
  /** Persiste playhead y sesión iniciada (curso). */
  playbackSessionKey?: string;
  /** Curso vacacional: al cambiar clase en la lista, reproducir sin tap en portada. */
  autoPlayOnSelect?: boolean;
  /** PiP + audio en segundo plano al salir de pestaña del navegador. */
  autoPictureInPicture?: boolean;
  /** Otra sección del curso activa; intentar PiP sin pausar. */
  sectionInactive?: boolean;
};

/**
 * Portada diseñada como poster: al pausar o ante captura → vuelve la miniatura.
 */
export default function RecordingsPlayerStage({
  recordings,
  activeId,
  simulationId,
  variant = 'light',
  catalogMode = 'simulation',
  playbackSessionKey,
  autoPlayOnSelect = false,
  autoPictureInPicture = false,
  sectionInactive = false,
}: RecordingsPlayerStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [startedId, setStartedId] = useState<string | null>(null);
  const [coverVisible, setCoverVisible] = useState(true);
  const restoredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!playbackSessionKey) {
      setStartedId(null);
      setCoverVisible(true);
      restoredRef.current = null;
      return;
    }

    if (restoredRef.current === activeId) return;

    if (autoPlayOnSelect) {
      setStartedId(activeId);
      setCoverVisible(false);
      restoredRef.current = activeId;
      return;
    }

    const snap = loadCourseRecordingPlayback(playbackSessionKey);
    const wasStarted = snap.startedIds.includes(activeId);
    if (wasStarted) {
      setStartedId(activeId);
      setCoverVisible(false);
    } else {
      setStartedId(null);
      setCoverVisible(true);
    }
    restoredRef.current = activeId;
  }, [activeId, playbackSessionKey, autoPlayOnSelect]);

  useEffect(() => {
    if (!playbackSessionKey || !startedId) return;
    const snap = loadCourseRecordingPlayback(playbackSessionKey);
    if (!snap.startedIds.includes(startedId)) {
      snap.startedIds = [...snap.startedIds, startedId];
    }
    snap.activeId = activeId;
    saveCourseRecordingPlayback(playbackSessionKey, snap);
  }, [playbackSessionKey, startedId, activeId]);

  const active = recordings.find((r) => r.id === activeId);
  const playing = startedId === activeId && !coverVisible;
  const resumeSeconds =
    playbackSessionKey && active
      ? readRecordingTime(playbackSessionKey, active.id)
      : null;

  const persistTime = useCallback(
    (seconds: number) => {
      if (!playbackSessionKey || !active) return;
      rememberRecordingTime(playbackSessionKey, active.id, seconds);
    },
    [playbackSessionKey, active],
  );

  const showCover = useCallback(() => {
    setCoverVisible(true);
  }, []);

  useRecordingCoverShield({
    enabled: playing,
    onShield: showCover,
    stageRef,
  });

  const handlePlayFromCover = useCallback(() => {
    if (!active) return;
    setStartedId(active.id);
    setCoverVisible(false);
  }, [active]);

  const handleUserPause = useCallback(() => {
    setCoverVisible(true);
  }, []);

  if (!active) return null;

  const accent = areaAccent(active.area);
  const title = recordingDisplayTitle(active);
  const sessionStarted = startedId === activeId;

  return (
    <div
      ref={stageRef}
      className={`${recordingPlayerClasses.stage} relative aspect-video w-full select-none shadow-lg`}
    >
      {sessionStarted ? (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            coverVisible ? 'pointer-events-none z-0 opacity-0' : 'z-10 opacity-100'
          }`}
          aria-hidden={coverVisible}
        >
          <RecordingVideoPlayer
            key={active.id}
            fileId={active.driveFileId}
            videoUrl={active.videoUrl}
            title={title}
            variant={variant}
            accentHex={accent.hex}
            playing={playing}
            onUserPause={handleUserPause}
            onShield={showCover}
            initialTimeSeconds={resumeSeconds}
            onPersistTime={playbackSessionKey ? persistTime : undefined}
            autoPictureInPicture={autoPictureInPicture}
            sectionInactive={sectionInactive}
          />
        </div>
      ) : null}

      {recordings.map((rec) => {
        const isActive = rec.id === activeId;
        const visible = isActive && (coverVisible || !sessionStarted);
        return (
          <div
            key={`cover-${rec.id}`}
            className={`absolute inset-0 transition-opacity duration-300 ${
              visible ? 'z-20 opacity-100' : 'pointer-events-none z-0 opacity-0'
            }`}
            aria-hidden={!visible}
          >
            <button
              type="button"
              onClick={handlePlayFromCover}
              className="group/play relative block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 rounded-2xl"
              aria-label={`Reproducir ${recordingDisplayTitle(rec)}`}
            >
              <RecordingCoverArt
                recording={rec}
                variant="banner"
                simulationId={simulationId}
                catalogMode={catalogMode}
                showPlay
                className="rounded-2xl"
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
