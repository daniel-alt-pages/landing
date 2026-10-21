'use client';

import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import { Expand, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_PREVIEW_PAGES = 10;
const ZOOM_STEP = 1.12;
const ZOOM_MIN = 0.55;
const ZOOM_MAX = 2.5;
const ABS_MIN_RENDER_SCALE = 0.32;
const ABS_MAX_RENDER_SCALE = 3.4;

function clampZoom(mul: number): number {
  const r = Math.round(mul * 100) / 100;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, r));
}

function getPreviewPageNumbers(pdfPages: number, requestedPages?: readonly number[]): number[] {
  const pages = requestedPages?.length
    ? requestedPages
    : Array.from({ length: Math.min(MAX_PREVIEW_PAGES, pdfPages) }, (_, index) => index + 1);

  const seen = new Set<number>();
  return pages.filter((page) => {
    if (!Number.isInteger(page) || page < 1 || page > pdfPages || seen.has(page)) return false;
    seen.add(page);
    return true;
  });
}

function formatPageList(pages: readonly number[]): string {
  return pages.length ? pages.join(', ') : '—';
}

export type CotizacionSimulacroPdfLimitedPreviewProps = {
  pdfUrl: string;
  variant: 'light' | 'dark';
  pageNumbers?: readonly number[];
};

async function renderPdfPages(
  pdf: PDFDocumentProxy,
  container: HTMLElement,
  gen: number,
  currentGen: () => number,
  AnnotationMode: typeof import('pdfjs-dist').AnnotationMode,
  scaleMultiplier: number,
  requestedPages?: readonly number[],
) {
  if (currentGen() !== gen) return;
  const pages = getPreviewPageNumbers(pdf.numPages, requestedPages);
  const pad = 12;
  const cw = Math.max(200, container.clientWidth - pad * 2);

  container.innerHTML = '';

  for (const p of pages) {
    if (currentGen() !== gen) return;
    const page = await pdf.getPage(p);
    if (currentGen() !== gen) return;

    const base = page.getViewport({ scale: 1 });
    const fitScale = Math.min(2.8, Math.max(0.85, cw / base.width));
    const scale = Math.min(
      ABS_MAX_RENDER_SCALE,
      Math.max(ABS_MIN_RENDER_SCALE, fitScale * scaleMultiplier),
    );
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      page.cleanup();
      continue;
    }

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    canvas.className =
      'mx-auto mb-4 block max-w-full rounded-lg shadow-md ring-1 ring-black/[0.08] dark:ring-white/[0.08]';
    container.appendChild(canvas);

    const task = page.render({
      canvasContext: ctx,
      viewport,
      intent: 'display',
      annotationMode: AnnotationMode.DISABLE,
    });
    await task.promise;
    page.cleanup();
    if (currentGen() !== gen) return;
  }
}

export default function CotizacionSimulacroPdfLimitedPreview({
  pdfUrl,
  variant,
  pageNumbers,
}: CotizacionSimulacroPdfLimitedPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const renderGen = useRef(0);

  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [docPages, setDocPages] = useState<number | null>(null);
  const [renderedPages, setRenderedPages] = useState<number[]>([]);
  const [errText, setErrText] = useState<string | null>(null);
  const [zoomMul, setZoomMul] = useState(1);

  const paint = useCallback(async () => {
    const pdf = pdfRef.current;
    const el = pagesRef.current;
    if (!pdf || !el) return;
    const pdfjs = await import('pdfjs-dist');
    const gen = ++renderGen.current;
    const pages = getPreviewPageNumbers(pdf.numPages, pageNumbers);
    setRenderedPages(pages);
    await renderPdfPages(pdf, el, gen, () => renderGen.current, pdfjs.AnnotationMode, zoomMul, pages);
  }, [pageNumbers, zoomMul]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    setErrText(null);
    setDocPages(null);
    setRenderedPages([]);
    setZoomMul(1);
    renderGen.current += 1;
    const pagesEl = pagesRef.current;

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;

        const task = pdfjs.getDocument({
          url: pdfUrl,
          withCredentials: false,
        });
        loadingTaskRef.current = task;

        const pdf = await task.promise;
        loadingTaskRef.current = null;

        if (cancelled) {
          await pdf.destroy().catch(() => undefined);
          return;
        }

        pdfRef.current = pdf;
        setDocPages(pdf.numPages);
        if (!cancelled) setPhase('ready');
      } catch (e) {
        if (!cancelled) {
          setPhase('error');
          setErrText(e instanceof Error ? e.message : 'No se pudo cargar el PDF');
        }
      }
    })();

    return () => {
      cancelled = true;
      renderGen.current += 1;
      void loadingTaskRef.current?.destroy().catch(() => undefined);
      loadingTaskRef.current = null;
      void pdfRef.current?.destroy().catch(() => undefined);
      pdfRef.current = null;
      if (pagesEl) pagesEl.innerHTML = '';
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (phase !== 'ready') return;
    void paint();
  }, [phase, zoomMul, paint]);

  useEffect(() => {
    if (phase !== 'ready') return;
    const host = hostRef.current;
    if (!host) return;

    let tid: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(tid);
      tid = setTimeout(() => {
        void paint();
      }, 160);
    });
    ro.observe(host);
    return () => {
      ro.disconnect();
      clearTimeout(tid);
    };
  }, [phase, paint]);

  const footMuted = variant === 'light' ? 'text-slate-500' : 'text-white/45';
  const boxMuted =
    variant === 'light'
      ? 'mt-3 border-slate-200 bg-white text-slate-700 lg:mt-4 lg:mx-1 lg:px-4 lg:py-2.5'
      : 'mt-3 border-white/10 bg-white/[0.04] text-white/75 lg:mt-4 lg:mx-1 lg:px-4 lg:py-2.5';

  const bar =
    variant === 'light'
      ? 'border-slate-200/90 bg-white/95 text-slate-800 shadow-sm'
      : 'border-white/[0.08] bg-[#0b0d14]/90 text-white shadow-black/20';

  const toolBtn =
    variant === 'light'
      ? 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40'
      : 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35';

  const toolBtnGhost =
    variant === 'light'
      ? 'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-transparent px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40'
      : 'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-transparent px-3 text-sm font-semibold text-white/85 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35';

  const ready = phase === 'ready';
  const busy = phase === 'loading';
  const zoomPct = Math.round(zoomMul * 100);
  const canZoomIn = ready && zoomMul < ZOOM_MAX - 0.001;
  const canZoomOut = ready && zoomMul > ZOOM_MIN + 0.001;
  const hasCustomPages = !!pageNumbers?.length;

  return (
    <div className="flex min-w-0 flex-col">
      <div
        className={`flex h-[clamp(24rem,72dvh,51rem)] w-full min-w-0 flex-col overflow-hidden ${
          variant === 'light' ? 'bg-slate-100' : 'bg-black/50'
        }`}
      >
        <div
          className={`flex shrink-0 flex-col gap-2 border-b px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-3 sm:py-2.5 lg:gap-4 lg:px-[clamp(1rem,4vw,3.5rem)] lg:py-3 ${bar}`}
          role="toolbar"
          aria-label="Herramientas del visor PDF"
        >
          <p
            className={`text-center text-[11px] font-medium sm:min-w-0 sm:flex-1 sm:text-left lg:text-xs ${
              variant === 'light' ? 'text-slate-500' : 'text-white/45'
            }`}
          >
            {ready && docPages != null ? (
              <>
                Págs. {formatPageList(renderedPages)}
                {docPages > 0 ? ` de ${docPages}` : ''}
              </>
            ) : busy ? (
              'Cargando…'
            ) : (
              '—'
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <button
              type="button"
              className={toolBtn}
              aria-label="Alejar"
              disabled={!canZoomOut}
              onClick={() => setZoomMul((z) => clampZoom(z / ZOOM_STEP))}
            >
              <ZoomOut className="h-4 w-4" aria-hidden />
            </button>
            <span
              className={`min-w-[3.25rem] rounded-lg px-2 py-1.5 text-center text-xs font-bold tabular-nums sm:text-sm ${
                variant === 'light' ? 'bg-slate-100 text-slate-800' : 'bg-white/[0.08] text-white'
              }`}
              aria-live="polite"
            >
              {ready ? `${zoomPct}%` : '—'}
            </span>
            <button
              type="button"
              className={toolBtn}
              aria-label="Acercar"
              disabled={!canZoomIn}
              onClick={() => setZoomMul((z) => clampZoom(z * ZOOM_STEP))}
            >
              <ZoomIn className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              className={toolBtnGhost}
              aria-label="Ajustar al ancho (100 %)"
              disabled={!ready}
              onClick={() => {
                setZoomMul(1);
                requestAnimationFrame(() => {
                  hostRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                });
              }}
            >
              <Expand className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <span className="hidden sm:inline">Ancho</span>
            </button>
          </div>
        </div>

        <div
          ref={hostRef}
          className={`relative min-h-0 flex-1 overflow-auto overscroll-contain ${
            variant === 'light' ? 'bg-slate-100' : 'bg-black/40'
          }`}
        >
          {phase === 'loading' && (
            <div
              className={`pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 ${
                variant === 'light' ? 'bg-slate-100/90' : 'bg-black/60'
              }`}
              aria-busy="true"
              aria-live="polite"
            >
              <div
                className={`h-9 w-9 animate-spin rounded-full border-2 border-transparent ${
                  variant === 'light' ? 'border-t-indigo-600 border-l-indigo-300' : 'border-t-cyan-400 border-l-white/20'
                }`}
              />
              <p className={`text-sm font-medium ${variant === 'light' ? 'text-slate-600' : 'text-white/70'}`}>
                Cargando vista previa ({hasCustomPages ? `${pageNumbers.length} páginas seleccionadas` : `máx. ${MAX_PREVIEW_PAGES} páginas`})…
              </p>
            </div>
          )}

          {phase === 'error' && (
            <div className={`flex min-h-[280px] flex-col items-center justify-center gap-2 px-4 text-center ${footMuted}`}>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">No se pudo mostrar el PDF</p>
              <p className="max-w-md text-xs leading-relaxed">{errText}</p>
            </div>
          )}

          <div
            ref={pagesRef}
            className="flex min-w-0 flex-col px-2 py-4 sm:px-3 sm:py-5 lg:px-[clamp(1rem,4vw,4rem)] lg:py-8"
          />
        </div>
      </div>

      <div className={`rounded-xl border px-3 py-2 text-[11px] leading-relaxed sm:text-xs ${boxMuted}`}>
        <p>
          <strong className="font-semibold">Solo lectura:</strong>{' '}
          {hasCustomPages
            ? `aquí se renderizan solo las páginas seleccionadas (${formatPageList(renderedPages.length ? renderedPages : pageNumbers)}).`
            : `aquí se muestran como máximo las primeras ${MAX_PREVIEW_PAGES} páginas del documento.`}
          {docPages != null && !hasCustomPages && docPages > MAX_PREVIEW_PAGES ? (
            <>
              {' '}
              Este PDF tiene <strong className="font-semibold">{docPages}</strong> páginas; el resto no se renderiza
              en esta página.
            </>
          ) : null}{' '}
          El formato PDF puede seguir descargándose en segundo plano según el navegador; no sustituye a un PDF
          recortado en servidor.
        </p>
      </div>
    </div>
  );
}
