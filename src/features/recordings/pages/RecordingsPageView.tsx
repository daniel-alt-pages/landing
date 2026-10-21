'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { isDemoCoordinadorRoute, isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';
import RecordingsCatalogView from '@features/recordings/components/RecordingsCatalogView';
import RecordingsPrecacheBootstrap from '@features/recordings/components/RecordingsPrecacheBootstrap';
import { clearRecordingsAreaNavLift } from '@features/recordings/lib/recordingsAreaNavLift';
import { canAccessSimRecordingsCatalog } from '@features/recordings/lib/recordingsAccess';
import { useSimRecordings } from '@features/recordings/hooks/useSimRecordings';

type RecordingsPageViewProps = {
  simulationId: string;
  variant?: 'light' | 'dark';
  audience: 'estudiante' | 'coordinador';
  /** Documento del estudiante — requerido para catálogos con allowlist. */
  documentId?: string | null;
};

function resolveBackHref(pathname: string | null, audience: 'estudiante' | 'coordinador'): string {
  if (audience === 'estudiante') {
    return isDemoEstudianteRoute(pathname) ? '/demo/estudiante/dashboard' : '/estudiante/dashboard';
  }
  if (isDemoCoordinadorRoute(pathname)) {
    return '/d/c';
  }
  return '/coordinador';
}

async function exitPlaybackFullscreen(): Promise<void> {
  if (typeof document === 'undefined' || !document.fullscreenElement) return;
  try {
    await document.exitFullscreen();
  } catch {
    /* ignore */
  }
}

export default function RecordingsPageView({
  simulationId,
  variant = 'light',
  audience,
  documentId = null,
}: RecordingsPageViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const backHref = resolveBackHref(pathname, audience);
  const simFromStorage =
    typeof window !== 'undefined' ? localStorage.getItem('simulacro_selected') || '' : '';
  const effectiveSimId = simulationId || simFromStorage;
  const waitingSim = !effectiveSimId;
  const { catalog, recordings, loading, error, hasRecordings } = useSimRecordings(effectiveSimId);
  const catalogLoading = waitingSim || loading;
  const allowed = useMemo(
    () =>
      canAccessSimRecordingsCatalog(catalog, {
        documentId,
        audience,
      }),
    [audience, catalog, documentId],
  );
  const showCatalog = hasRecordings && allowed;
  const lockedByAllowlist = Boolean(catalog?.recordings?.length) && !allowed;

  const handleNavigateHome = useCallback(() => {
    void (async () => {
      clearRecordingsAreaNavLift();
      await exitPlaybackFullscreen();
      try {
        router.push(backHref);
      } catch {
        window.location.assign(backHref);
        return;
      }
      window.setTimeout(() => {
        const current = window.location.pathname.replace(/\/+$/, '');
        if (current.endsWith('/clases') || current.includes('/clases/')) {
          window.location.assign(backHref);
        }
      }, 1200);
    })();
  }, [backHref, router]);

  useEffect(() => {
    return () => {
      clearRecordingsAreaNavLift();
      void exitPlaybackFullscreen();
    };
  }, []);

  useEffect(() => {
    if (!showCatalog) return;
    const specs = [
      { rel: 'preconnect', href: 'https://drive.google.com' },
      { rel: 'dns-prefetch', href: 'https://drive.google.com' },
    ];
    const nodes = specs.map(({ rel, href }) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => {
      nodes.forEach((node) => node.remove());
    };
  }, [showCatalog]);

  const isDark = variant === 'dark';

  return (
    <div
      className={`relative min-h-[60vh] overflow-hidden pb-[calc(var(--recordings-area-nav-lift,0px)+env(safe-area-inset-bottom,0px))] xl:pb-8 ${
        isDark ? 'bg-[#0b0d14] text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <RecordingsPrecacheBootstrap simulationId={effectiveSimId} />

      {/* Top bar compacta (Stitch → estilo Mi Curso) */}
      <div
        className={`sticky top-0 z-20 border-b ${
          isDark ? 'border-white/10 bg-[#0b0d14]/95' : 'border-slate-200 bg-white/95'
        } backdrop-blur-sm`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link
            href={backHref}
            prefetch={false}
            onClick={(e) => {
              e.preventDefault();
              handleNavigateHome();
            }}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-sm font-semibold transition ${
              isDark
                ? 'border-white/12 bg-white/[0.04] text-white/85 hover:bg-white/[0.07]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Volver</span>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold tracking-tight sm:text-base">Grabaciones</h1>
          </div>
          {effectiveSimId ? (
            <span
              className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold tabular-nums ${
                isDark
                  ? 'border-white/12 bg-white/[0.04] text-white/70'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {effectiveSimId}
            </span>
          ) : null}
          {showCatalog ? (
            <span
              className={`hidden shrink-0 text-xs font-semibold tabular-nums sm:inline ${
                isDark ? 'text-white/45' : 'text-slate-500'
              }`}
            >
              {recordings.length} clase{recordings.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative z-[1] mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-6">
        {catalogLoading ? (
          <div
            data-sg-panel-stuck="true"
            className={`rounded-lg border px-4 py-10 text-center text-sm ${
              isDark
                ? 'border-white/10 bg-white/[0.03] text-white/50'
                : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            {waitingSim ? 'Preparando simulacro…' : 'Cargando grabaciones…'}
          </div>
        ) : null}

        {!catalogLoading && lockedByAllowlist ? (
          <div
            className={`rounded-lg border px-4 py-10 text-center text-sm ${
              isDark
                ? 'border-white/10 bg-white/[0.03] text-white/55'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            Las grabaciones de {effectiveSimId || 'este simulacro'} aún no están habilitadas para tu
            documento. Si compraste la retro, escribe a soporte.
          </div>
        ) : null}

        {!catalogLoading && error && !hasRecordings ? (
          <div
            className={`rounded-lg border px-4 py-10 text-center text-sm ${
              isDark
                ? 'border-white/10 bg-white/[0.03] text-white/50'
                : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            {error}
          </div>
        ) : null}

        {!catalogLoading && showCatalog ? (
          <Suspense
            fallback={
              <div
                className={`rounded-lg border px-4 py-10 text-center text-sm ${
                  isDark
                    ? 'border-white/10 bg-white/[0.03] text-white/50'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                Cargando catálogo…
              </div>
            }
          >
            <RecordingsCatalogView
              simulationId={effectiveSimId}
              recordings={recordings}
              homeHref={backHref}
              onNavigateHome={handleNavigateHome}
              variant={variant}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}
