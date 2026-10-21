'use client';

import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { hardNavigate } from '@/shared/lib/hardNavigate';
import type { CourseIdentity } from '../types/courseTypes';
import { useCourseEntitlements } from '../hooks/useCourseEntitlements';
import { isCourseEntryVisible } from '../lib/courseEntitlements';
import { coursePathForSession } from '../lib/courseRoutePaths';

type CoursePromoCardProps = {
  href?: string;
  variant?: 'light' | 'dark';
  /** default: banner horizontal; embedded: columna estrecha bajo puntaje global */
  layout?: 'default' | 'embedded';
  className?: string;
  identityHint?: Partial<CourseIdentity>;
};

export default function CoursePromoCard({
  href,
  variant = 'light',
  layout = 'default',
  className = '',
  identityHint,
}: CoursePromoCardProps) {
  const { entitlements, loading } = useCourseEntitlements(identityHint);
  const show = isCourseEntryVisible(loading, entitlements);
  const targetHref = href ?? coursePathForSession();
  const courseLabel =
    entitlements?.courses.length === 1
      ? 'Tu curso académico'
      : `${entitlements?.courses.length ?? 0} cursos activos`;

  if (!show) return null;

  const isDark = variant === 'dark';
  const isEmbedded = layout === 'embedded';

  return (
    <div
      className={`group relative overflow-hidden rounded-[1.25rem] border transition-all duration-500 ${
        isDark
          ? 'border-violet-400/25 shadow-[0_12px_40px_rgba(0,0,0,0.35)]'
          : 'border-violet-200/80 shadow-md shadow-violet-100/50 hover:border-violet-300 hover:shadow-[0_20px_48px_rgba(124,58,237,0.14)]'
      } ${isEmbedded ? 'flex h-full min-h-0 flex-col' : ''} ${className}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? 'bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950'
            : 'bg-gradient-to-br from-violet-50 via-white to-cyan-50/60'
        }`}
        aria-hidden
      />
      <div
        className={`relative z-[1] flex flex-col gap-3 p-4 ${
          isEmbedded
            ? 'h-full flex-1 justify-between sm:p-4'
            : 'gap-4 sm:flex-row sm:items-center sm:justify-between sm:p-5'
        }`}
      >
        <div className="min-w-0">
          <div className={`mb-2 flex items-center gap-2 ${isEmbedded ? 'mb-1.5' : ''}`}>
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                isDark
                  ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/25'
                  : 'bg-violet-100 text-violet-700 ring-1 ring-violet-200/80'
              }`}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
                isDark ? 'text-violet-200' : 'text-violet-700'
              }`}
            >
              Mi Curso
            </p>
          </div>
          <h3
            className={`font-black leading-tight ${
              isEmbedded ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
            } ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            Materiales, grabaciones y clases
          </h3>
          <p
            className={`mt-1 ${isEmbedded ? 'text-[11px] leading-snug line-clamp-2' : 'text-xs sm:text-sm'} ${
              isDark ? 'text-white/55' : 'text-slate-600'
            }`}
          >
            {courseLabel}. Entra a tu espacio académico sin buscar en el menú inferior.
          </p>
        </div>
        <a
          href={targetHref}
          onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            hardNavigate(targetHref);
          }}
          className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition hover:scale-[1.02] active:scale-[0.98] ${
            isEmbedded ? 'w-full' : ''
          } ${
            isDark
              ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-slate-950'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
          }`}
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          Abrir mi curso
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}
