'use client';

import { ExternalLink, Folder, Link2, Star } from 'lucide-react';

export type MaterialBrowserPreview =
  | 'folder'
  | 'pdf'
  | 'doc'
  | 'link'
  | 'gemini'
  | 'presentation'
  | 'sheet'
  | 'other';

type CourseMaterialBrowserCardProps = {
  title: string;
  url: string;
  preview: MaterialBrowserPreview;
  subtitle?: string;
  badgeLabel?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onOpen?: () => void;
  dark?: boolean;
};

function previewLabel(preview: MaterialBrowserPreview): string {
  switch (preview) {
    case 'pdf':
      return 'PDF';
    case 'doc':
      return 'DOC';
    case 'gemini':
      return 'AI';
    case 'presentation':
      return 'PPT';
    case 'sheet':
      return 'XLS';
    case 'link':
      return 'LINK';
    default:
      return 'FILE';
  }
}

function previewPanelClass(preview: MaterialBrowserPreview, dark: boolean): string {
  switch (preview) {
    case 'pdf':
      return 'bg-[#f4a896] text-[#1a1a1a]';
    case 'doc':
      return 'bg-sky-400/90 text-[#0f172a]';
    case 'gemini':
      return 'bg-violet-500/85 text-white';
    case 'presentation':
      return 'bg-amber-400/90 text-[#1a1a1a]';
    case 'sheet':
      return 'bg-emerald-400/90 text-[#0f172a]';
    case 'link':
      return 'bg-[var(--course-accent)]/75 text-white';
    case 'folder':
      return dark ? 'bg-black/25' : 'bg-[var(--course-surface-muted)]';
    default:
      return dark ? 'bg-black/20' : 'bg-[var(--course-surface-muted)]';
  }
}

function headerBadge(preview: MaterialBrowserPreview, label?: string) {
  if (preview === 'folder') {
    return (
      <span
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--course-surface-muted)] text-[var(--course-text-muted)]"
        aria-hidden
      >
        <Folder className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (preview === 'pdf') {
    return (
      <span
        className="inline-flex shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide bg-rose-500 text-white"
      >
        PDF
      </span>
    );
  }
  if (label) {
    return (
      <span
        className="inline-flex shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-[var(--course-accent-soft)] text-[var(--course-accent)]"
      >
        {label}
      </span>
    );
  }
  return null;
}

export default function CourseMaterialBrowserCard({
  title,
  url,
  preview,
  subtitle,
  badgeLabel,
  isFavorite = false,
  onToggleFavorite,
  onOpen,
  dark = false,
}: CourseMaterialBrowserCardProps) {
  const panelClass = previewPanelClass(preview, dark);
  const panelClassName = `relative flex aspect-[5/4] min-h-[120px] w-full items-center justify-center p-4 transition hover:brightness-[1.03] ${panelClass}`;
  const panelContent = (
    <>
      {preview === 'folder' ? (
        <Folder
          className={`h-16 w-16 sm:h-20 sm:w-20 ${dark ? 'text-white/25' : 'text-[var(--course-text-muted)]/35'}`}
          strokeWidth={1.25}
          aria-hidden
        />
      ) : preview === 'link' ? (
        <Link2 className="h-14 w-14 opacity-90" strokeWidth={1.5} aria-hidden />
      ) : (
        <span className="text-4xl font-black tracking-tight sm:text-5xl" aria-hidden>
          {previewLabel(preview)}
        </span>
      )}
      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/35 px-2 py-1 text-[10px] font-semibold text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
        Abrir
        <ExternalLink className="h-3 w-3" aria-hidden />
      </span>
    </>
  );

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--course-border)] bg-[var(--course-surface)] shadow-sm transition hover:border-[var(--course-accent)]/35 hover:shadow-md"
    >
      <div className="flex items-center gap-2 border-b border-[var(--course-border)] px-3 py-2.5">
        {headerBadge(preview, badgeLabel)}
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--course-text)]">
          {title}
        </h3>
        {onToggleFavorite ? (
          <button
            type="button"
            onClick={onToggleFavorite}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-[var(--course-text-muted)] transition hover:border-[var(--course-border)] hover:bg-[var(--course-surface-muted)]"
            aria-label={isFavorite ? 'Quitar favorito' : 'Marcar favorito'}
            aria-pressed={isFavorite}
          >
            <Star
              className={`h-4 w-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
              aria-hidden
            />
          </button>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              if (!onOpen) return;
              event.preventDefault();
              onOpen();
            }}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--course-text-muted)] opacity-0 transition group-hover:opacity-100 hover:bg-[var(--course-surface-muted)]"
            aria-label="Abrir en nueva pestaña"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>

      {onOpen ? (
        <button type="button" onClick={onOpen} className={panelClassName} aria-label={`Abrir ${title}`}>
          {panelContent}
        </button>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className={panelClassName}>
          {panelContent}
        </a>
      )}

      {subtitle ? (
        <p className="truncate px-3 py-2 text-[11px] text-[var(--course-text-muted)]">{subtitle}</p>
      ) : null}
    </article>
  );
}

export function materialKindToPreview(kind: string): MaterialBrowserPreview {
  switch (kind) {
    case 'drive_folder':
      return 'folder';
    case 'pdf':
      return 'pdf';
    case 'doc':
      return 'doc';
    case 'link':
      return 'link';
    default:
      return 'other';
  }
}
