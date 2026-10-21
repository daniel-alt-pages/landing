'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { recordingPlayerClasses } from '@features/recordings/lib/recordingPlayerClasses';

type DriveVideoEmbedProps = {
  fileId: string;
  title: string;
  className?: string;
  variant?: 'light' | 'dark';
  accentHex?: string;
  /** Visible player vs precarga en stack oculto */
  isActive?: boolean;
  loadPriority?: 'high' | 'low';
  /** Si false, no monta iframe (solo fondo — portada encima). */
  mountIframe?: boolean;
  onShield?: () => void;
};

export default function DriveVideoEmbed({
  fileId,
  title,
  className = '',
  variant = 'dark',
  accentHex = '#2563EB',
  isActive = true,
  loadPriority = 'high',
  mountIframe = true,
  onShield,
}: DriveVideoEmbedProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const wasFullscreenRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const src = `https://drive.google.com/file/d/${fileId}/preview`;
  const isDark = variant === 'dark';

  const syncFullscreen = useCallback(() => {
    const nowFullscreen = document.fullscreenElement === shellRef.current;
    if (wasFullscreenRef.current && !nowFullscreen && mountIframe && onShield) {
      onShield();
    }
    wasFullscreenRef.current = nowFullscreen;
    setIsFullscreen(nowFullscreen);
  }, [mountIframe, onShield]);

  useEffect(() => {
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, [syncFullscreen]);

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
      // Fullscreen API blocked or unsupported
    }
  }, []);

  return (
    <div
      ref={shellRef}
      className={`${recordingPlayerClasses.shell} group relative flex h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl bg-[#202124] ring-1 transition-shadow duration-300 ${className} ${
        isFullscreen
          ? 'flex h-full w-full items-center justify-center rounded-none ring-0'
          : isDark
            ? 'ring-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.45)] group-hover:shadow-[0_20px_56px_rgba(0,0,0,0.55)]'
            : 'ring-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.12)]'
      }`}
      style={
        !isFullscreen
          ? { boxShadow: isDark ? undefined : `0 12px 40px ${accentHex}12` }
          : undefined
      }
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-1 opacity-80"
        style={{ background: `linear-gradient(90deg, ${accentHex}, transparent)` }}
        aria-hidden
      />
      <iframe
        className={`border-0 ${isFullscreen ? 'h-full w-full max-h-full max-w-full' : 'absolute inset-0 h-full w-full'} ${
          mountIframe ? '' : 'hidden'
        }`}
        src={mountIframe ? src : undefined}
        title={title}
        allow="autoplay; encrypted-media"
        loading={loadPriority === 'high' ? 'eager' : 'lazy'}
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div
        className={`${recordingPlayerClasses.driveChromeShield} pointer-events-auto absolute right-0 top-0 z-10 bg-[#202124]`}
        aria-hidden
      />
      {isActive ? (
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className={`${recordingPlayerClasses.fullscreenBtn} absolute right-3 top-3 z-20 min-h-10 min-w-[44px] cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 ${
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
      ) : null}
    </div>
  );
}
