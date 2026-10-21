'use client';

import { ExternalLink, RefreshCw, VideoOff } from 'lucide-react';
import { driveViewUrl } from '@features/recordings/lib/recordingsCatalog';

type RecordingPlaybackErrorProps = {
  fileId: string;
  title: string;
  variant?: 'light' | 'dark';
  accentHex?: string;
  onRetry?: () => void;
};

export default function RecordingPlaybackError({
  fileId,
  title,
  variant = 'dark',
  accentHex = '#2563EB',
  onRetry,
}: RecordingPlaybackErrorProps) {
  const isDark = variant === 'dark';
  const externalHref = driveViewUrl(fileId);

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl px-6 py-8 text-center ring-1 ${
        isDark
          ? 'bg-[#202124] ring-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.45)]'
          : 'bg-slate-100 ring-slate-200/80'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-1 opacity-80"
        style={{ background: `linear-gradient(90deg, ${accentHex}, transparent)` }}
        aria-hidden
      />
      <div
        className={`relative z-[2] flex h-14 w-14 items-center justify-center rounded-2xl ${
          isDark ? 'bg-white/8 text-white/70' : 'bg-white text-slate-500 shadow-sm'
        }`}
      >
        <VideoOff className="h-7 w-7" aria-hidden />
      </div>
      <div className="relative z-[2] max-w-md space-y-2">
        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          No pudimos reproducir aquí la clase
        </p>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-white/55' : 'text-slate-600'}`}>
          Drive no permite reproducir este archivo aquí (descarga bloqueada para visitantes o enlace sin
          permiso de lectura). Revisa que el video esté en «Cualquier persona con el enlace» y abre la
          grabación en Drive si sigue fallando.
        </p>
        <p className={`truncate text-[11px] ${isDark ? 'text-white/35' : 'text-slate-400'}`}>{title}</p>
      </div>
      <div className="relative z-[2] flex flex-wrap items-center justify-center gap-2">
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg, ${accentHex}, ${accentHex}cc)` }}
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          Abrir en Google Drive
        </a>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition hover:scale-[1.02] active:scale-[0.98] ${
              isDark
                ? 'border-white/15 bg-white/5 text-white/85 hover:bg-white/10'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}
