'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import DriveVideoEmbed from '@features/recordings/components/DriveVideoEmbed';
import RecordingPlaybackError from '@features/recordings/components/RecordingPlaybackError';
import { recordingPlaybackSources } from '@features/recordings/lib/recordingPlaybackSources';
import { recordingPlayerClasses } from '@features/recordings/lib/recordingPlayerClasses';
import { resolveDriveDirectUrl } from '@features/recordings/lib/resolveDriveDirectUrl';
import { registerRecordingMediaUrl } from '@features/recordings/lib/recordingsPrecache/registerUrl';

export type RecordingVideoPlayerHandle = {
  play: () => Promise<void>;
  pause: () => void;
};

type RecordingVideoPlayerProps = {
  fileId: string;
  videoUrl?: string;
  title: string;
  variant?: 'light' | 'dark';
  accentHex?: string;
  /** false = portada visible; pausar y no reproducir. */
  playing: boolean;
  onUserPause: () => void;
  onShield: () => void;
  initialTimeSeconds?: number | null;
  onPersistTime?: (seconds: number) => void;
  /** Habilita PiP nativo + reanudar al ocultar pestaña (curso). */
  autoPictureInPicture?: boolean;
  /** Sección Grabaciones no visible (otra pestaña del curso); intentar PiP. */
  sectionInactive?: boolean;
};

type PictureInPictureVideo = HTMLVideoElement & {
  autoPictureInPicture?: boolean;
  requestPictureInPicture?: () => Promise<unknown>;
};

type PictureInPictureDocument = Document & {
  pictureInPictureEnabled?: boolean;
  pictureInPictureElement?: Element | null;
};

const RecordingVideoPlayer = forwardRef<RecordingVideoPlayerHandle, RecordingVideoPlayerProps>(
  function RecordingVideoPlayer(
    {
      fileId,
      videoUrl,
      title,
      variant = 'dark',
      accentHex = '#2563EB',
      playing,
      onUserPause,
      onShield,
      initialTimeSeconds = null,
      onPersistTime,
      autoPictureInPicture = false,
      sectionInactive = false,
    },
    ref,
  ) {
    const shellRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const suppressPauseRef = useRef(false);
    const restoredTimeRef = useRef(false);
    const lastPersistRef = useRef(0);
    const [sourceIndex, setSourceIndex] = useState(0);
    const [playbackFailed, setPlaybackFailed] = useState(false);
    const [useDrivePreview, setUseDrivePreview] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [resolvedDirectUrl, setResolvedDirectUrl] = useState<string | null>(null);
    const [resolving, setResolving] = useState(true);
    const isDark = variant === 'dark';

    const baseSources = useMemo(
      () =>
        recordingPlaybackSources({
          id: fileId,
          title,
          area: '',
          session: null,
          driveFileId: fileId,
          videoUrl,
        }),
      [fileId, title, videoUrl],
    );

    const sources = useMemo(() => {
      if (resolvedDirectUrl) {
        return [resolvedDirectUrl, ...baseSources.filter((url) => url !== resolvedDirectUrl)];
      }
      return baseSources;
    }, [baseSources, resolvedDirectUrl]);
    const src = sources[sourceIndex] ?? sources[0];

    const resetPlayback = useCallback(() => {
      setSourceIndex(0);
      setPlaybackFailed(false);
      setUseDrivePreview(false);
      setResolvedDirectUrl(null);
      setResolving(true);
    }, []);

    useEffect(() => {
      resetPlayback();
      restoredTimeRef.current = false;
    }, [fileId, resetPlayback]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || restoredTimeRef.current) return;
      if (initialTimeSeconds == null || initialTimeSeconds < 1) return;

      const apply = () => {
        if (restoredTimeRef.current) return;
        if (video.duration && initialTimeSeconds >= video.duration - 2) return;
        video.currentTime = initialTimeSeconds;
        restoredTimeRef.current = true;
      };

      if (video.readyState >= 1) apply();
      else video.addEventListener('loadedmetadata', apply, { once: true });

      return () => video.removeEventListener('loadedmetadata', apply);
    }, [initialTimeSeconds, src, fileId]);

    useEffect(() => {
      if (!playing || !onPersistTime || !('mediaSession' in navigator)) return;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title });
        navigator.mediaSession.setActionHandler('pause', () => onUserPause());
      } catch {
        /* unsupported */
      }
    }, [playing, title, onUserPause, onPersistTime]);

    useEffect(() => {
      let cancelled = false;
      void resolveDriveDirectUrl(fileId)
        .then((direct) => {
          if (cancelled || !direct) return;
          setResolvedDirectUrl(direct);
          registerRecordingMediaUrl(direct);
        })
        .finally(() => {
          if (!cancelled) setResolving(false);
        });
      return () => {
        cancelled = true;
      };
    }, [fileId]);

    useEffect(() => {
      for (const url of sources) {
        registerRecordingMediaUrl(url);
      }
    }, [sources]);

    const syncFullscreen = useCallback(() => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    }, []);

    useEffect(() => {
      document.addEventListener('fullscreenchange', syncFullscreen);
      return () => document.removeEventListener('fullscreenchange', syncFullscreen);
    }, [syncFullscreen]);

    useEffect(() => {
      if (playbackFailed) return;
      const video = videoRef.current;
      if (!video) return;
      if (!playing) {
        suppressPauseRef.current = true;
        video.pause();
        suppressPauseRef.current = false;
        return;
      }
      void video.play().catch(() => {
        /* autoplay policy */
      });
    }, [playing, playbackFailed, src]);

    const enterPictureInPicture = useCallback(async () => {
      const video = videoRef.current as PictureInPictureVideo | null;
      const doc = document as PictureInPictureDocument;
      if (
        !playing ||
        playbackFailed ||
        !video ||
        video.readyState < 1 ||
        !doc.pictureInPictureEnabled ||
        !video.requestPictureInPicture ||
        doc.pictureInPictureElement === video
      ) {
        return;
      }

      if (video.paused) {
        try {
          await video.play();
        } catch {
          return;
        }
      }

      try {
        await video.requestPictureInPicture();
      } catch {
        /* unsupported, blocked, or missing user activation */
      }
    }, [playing, playbackFailed]);

    useEffect(() => {
      const video = videoRef.current as PictureInPictureVideo | null;
      if (!video) return;
      video.autoPictureInPicture = Boolean(autoPictureInPicture);
      return () => {
        video.autoPictureInPicture = false;
      };
    }, [autoPictureInPicture, src]);

    useEffect(() => {
      if (!autoPictureInPicture || !sectionInactive) return;
      void enterPictureInPicture();
    }, [sectionInactive, autoPictureInPicture, enterPictureInPicture]);

    useEffect(() => {
      if (!autoPictureInPicture) return;

      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          void enterPictureInPicture();
          return;
        }
        const video = videoRef.current;
        if (video && playing && video.paused) {
          suppressPauseRef.current = true;
          void video.play().finally(() => {
            suppressPauseRef.current = false;
          });
        }
      };

      document.addEventListener('visibilitychange', onVisibilityChange);
      return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [autoPictureInPicture, enterPictureInPicture, playing]);

    useImperativeHandle(ref, () => ({
      play: async () => {
        const video = videoRef.current;
        if (!video || playbackFailed) return;
        await video.play();
      },
      pause: () => {
        const video = videoRef.current;
        if (!video || playbackFailed) return;
        suppressPauseRef.current = true;
        video.pause();
        suppressPauseRef.current = false;
      },
    }));

    const toggleFullscreen = useCallback(async () => {
      const shell = shellRef.current;
      if (!shell) return;
      try {
        if (document.fullscreenElement === shell) {
          await document.exitFullscreen();
        } else {
          await shell.requestFullscreen();
        }
      } catch {
        /* unsupported */
      }
    }, []);

    const handleVideoPause = useCallback(() => {
      if (suppressPauseRef.current) return;
      if (document.hidden && autoPictureInPicture) {
        void enterPictureInPicture();
        return;
      }
      onUserPause();
    }, [onUserPause, autoPictureInPicture, enterPictureInPicture]);

    const handleTimeUpdate = useCallback(() => {
      if (!onPersistTime) return;
      const video = videoRef.current;
      if (!video) return;
      const now = Date.now();
      if (now - lastPersistRef.current < 4000) return;
      lastPersistRef.current = now;
      onPersistTime(video.currentTime);
    }, [onPersistTime]);

    const handleVideoError = useCallback(() => {
      setSourceIndex((current) => {
        const next = current + 1;
        if (next < sources.length) return next;
        if (!videoUrl?.trim()) {
          setUseDrivePreview(true);
          return current;
        }
        setPlaybackFailed(true);
        return current;
      });
    }, [sources.length, videoUrl]);

    if (useDrivePreview && !videoUrl?.trim()) {
      return (
        <DriveVideoEmbed
          fileId={fileId}
          title={title}
          variant={variant}
          accentHex={accentHex}
          isActive={playing}
          mountIframe={playing}
          onShield={onShield}
        />
      );
    }

    if (playbackFailed) {
      return (
        <RecordingPlaybackError
          fileId={fileId}
          title={title}
          variant={variant}
          accentHex={accentHex}
          onRetry={resetPlayback}
        />
      );
    }

    if (resolving && !videoUrl?.trim()) {
      return (
        <div
          className={`flex h-full min-h-[200px] w-full items-center justify-center rounded-2xl bg-[#202124] text-sm ${
            isDark ? 'text-white/55' : 'text-slate-500'
          }`}
        >
          Preparando video…
        </div>
      );
    }

    return (
      <div
        ref={shellRef}
        className={`${recordingPlayerClasses.shell} group relative flex h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl bg-[#202124] ring-1 transition-shadow duration-300 ${
          isFullscreen
            ? 'flex h-full w-full items-center justify-center rounded-none ring-0'
            : isDark
              ? 'ring-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.45)]'
              : 'ring-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.12)]'
        }`}
        style={
          !isFullscreen && !isDark
            ? { boxShadow: `0 12px 40px ${accentHex}12` }
            : undefined
        }
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-1 opacity-80"
          style={{ background: `linear-gradient(90deg, ${accentHex}, transparent)` }}
          aria-hidden
        />
        <video
          key={src}
          ref={videoRef}
          src={src}
          title={title}
          controls
          controlsList="nodownload noplaybackrate"
          playsInline
          autoPlay={playing}
          preload="metadata"
          className={`min-h-0 w-full flex-1 border-0 bg-black object-contain ${
            isFullscreen ? 'h-full max-h-full max-w-full' : 'h-full'
          }`}
          onPause={handleVideoPause}
          onTimeUpdate={handleTimeUpdate}
          onError={handleVideoError}
          onContextMenu={(e) => {
            e.preventDefault();
            onShield();
          }}
        />
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className={`${recordingPlayerClasses.fullscreenBtn} absolute right-3 top-3 z-20 min-h-10 min-w-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 ${
            isDark
              ? 'border-white/15 bg-black/75 text-white hover:bg-black/90 focus-visible:ring-cyan-400/50'
              : 'border-slate-200 bg-white/95 text-slate-800 hover:bg-white focus-visible:ring-indigo-300'
          } ${isFullscreen ? 'top-4 right-4' : ''}`}
          style={
            !isDark
              ? { boxShadow: `0 8px 24px ${accentHex}22` }
              : { boxShadow: `0 8px 28px ${accentHex}33` }
          }
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-4 w-4 shrink-0" aria-hidden />
              <span>Salir</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4 shrink-0" aria-hidden />
              <span className="max-[380px]:sr-only">Pantalla completa</span>
            </>
          )}
        </button>
      </div>
    );
  },
);

export default RecordingVideoPlayer;
