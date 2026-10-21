'use client';

import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { ChevronRight, LayoutGrid, List, MousePointer2, Search } from 'lucide-react';
import { MethodShowcase3DActiveContext } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/carrusel-3d/MethodShowcase3DCarousel';
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/** Nombre limpio de grabación (estilo Drive, sin sufijo Meet) */
export const DRIVE_RECORDING_FILENAME =
  'RETROALIMENTACIÓN SESIÓN 2 (SG11-16) - LECTURA CRÍTICA - PREINTENSIVO SEAMOSGENIOS - CAL A - 2026';

const DRIVE_FONT = "'Google Sans', Roboto, Arial, sans-serif";
const BROWSE_DURATION_MS = 15_000;
const PLAYBACK_HOLD_MS = 22_000;

type BrowseRow = { id: string; kind: 'folder' | 'file'; name: string; modified: string };

type BrowseStep = {
  at: number;
  path: string[];
  rows: BrowseRow[];
  targetId: string | null;
  clickAt: number | null;
};

const STEPS: BrowseStep[] = [
  {
    at: 0,
    path: ['Mi unidad', 'Grabaciones institucionales'],
    rows: [
      { id: 'f1', kind: 'folder', name: 'PREINTENSIVO SEAMOSGENIOS · SG11-16 · Cal A · 2026', modified: '—' },
      { id: 'f2', kind: 'folder', name: 'PREINTENSIVO SEAMOSGENIOS · SG10 · Cal B · 2026', modified: '—' },
      { id: 'f3', kind: 'folder', name: 'Coordinación · Plantillas · 2026', modified: '—' },
    ],
    targetId: 'f1',
    clickAt: 2_500,
  },
  {
    at: 2_900,
    path: ['Mi unidad', 'Grabaciones institucionales', 'SG11-16 · Cal A · 2026'],
    rows: [
      { id: 's1', kind: 'folder', name: 'Sesión 02 · Lectura crítica', modified: '2 may 2026' },
      { id: 's2', kind: 'folder', name: 'Sesión 01 · Matemáticas', modified: '28 abr 2026' },
      { id: 's3', kind: 'folder', name: 'Sesión 03 · Ciencias naturales', modified: '—' },
    ],
    targetId: 's1',
    clickAt: 5_400,
  },
  {
    at: 5_800,
    path: ['Mi unidad', 'Grabaciones institucionales', 'SG11-16', 'Sesión 02'],
    rows: [
      { id: 'p1', kind: 'file', name: 'Guía sesión 2 · Lectura crítica.pdf', modified: '1 may 2026' },
      { id: 'rec', kind: 'file', name: DRIVE_RECORDING_FILENAME, modified: '2 may 2026, 15:59' },
      { id: 'p2', kind: 'file', name: 'Notas docente · Cal A.docx', modified: '2 may 2026' },
    ],
    targetId: 'rec',
    clickAt: 8_200,
  },
  {
    at: 8_600,
    path: ['Mi unidad', 'Grabaciones institucionales', 'SG11-16', 'Sesión 02'],
    rows: [
      { id: 'p1', kind: 'file', name: 'Guía sesión 2 · Lectura crítica.pdf', modified: '1 may 2026' },
      { id: 'rec', kind: 'file', name: DRIVE_RECORDING_FILENAME, modified: '2 may 2026, 15:59' },
      { id: 'p2', kind: 'file', name: 'Notas docente · Cal A.docx', modified: '2 may 2026' },
    ],
    targetId: 'rec',
    clickAt: 11_000,
  },
];

type CursorPos = { top: number; left: number };

const DEFAULT_CURSOR: CursorPos = { top: 52, left: 96 };

function stepAtTime(elapsed: number): BrowseStep {
  let current = STEPS[0];
  for (const s of STEPS) {
    if (elapsed >= s.at) current = s;
  }
  return current;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function measureRowPositions(
  container: HTMLElement,
  rowIds: string[],
  rowRefs: Record<string, HTMLLIElement | null>,
): Record<string, CursorPos> {
  const cRect = container.getBoundingClientRect();
  const next: Record<string, CursorPos> = {};

  for (const id of rowIds) {
    const el = rowRefs[id];
    if (!el) continue;
    const r = el.getBoundingClientRect();
    next[id] = {
      top: r.top - cRect.top + r.height / 2 - 1,
      left: r.left - cRect.left + 56,
    };
  }

  return next;
}

function computeCursor(
  elapsed: number,
  step: BrowseStep,
  positions: Record<string, CursorPos>,
  entry: CursorPos,
): { top: number; left: number; clicking: boolean } {
  const clicking =
    step.clickAt !== null && elapsed >= step.clickAt && elapsed < step.clickAt + 380;

  const target = step.targetId ? positions[step.targetId] : null;
  if (!target) {
    return { ...entry, clicking };
  }

  const stepStart = step.at;
  const clickAt = step.clickAt ?? stepStart + 900;
  const approachMs = Math.max(clickAt - stepStart - 180, 520);
  const since = Math.max(0, elapsed - stepStart);
  const approach = Math.min(1, since / approachMs);

  const targetIndex = step.rows.findIndex((r) => r.id === step.targetId);
  const wanderId =
    targetIndex > 0 && since < approachMs * 0.55 ? step.rows[targetIndex - 1]?.id : null;
  const wanderPos = wanderId ? positions[wanderId] : null;

  let top = lerp(entry.top, target.top, approach);
  let left = lerp(entry.left, target.left, approach);

  if (wanderPos && since < approachMs * 0.65) {
    const blend = Math.sin(Math.min(1, since / (approachMs * 0.65)) * Math.PI) * 0.28;
    top = top * (1 - blend) + wanderPos.top * blend;
    left = left * (1 - blend) + wanderPos.left * blend;
  }

  const wobbleX = Math.sin(elapsed / 280) * 2.5;
  const wobbleY = Math.cos(elapsed / 340) * 1.5;

  return {
    top: top + wobbleY + (clicking ? 1 : 0),
    left: left + wobbleX + (clicking ? 2 : 0),
    clicking,
  };
}

function DriveLogoMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden>
      <path fill="#0066DA" d="M7.92 16.5 1.5 5.25A1.12 1.12 0 0 1 2.48 3.75h6.2l6.24 10.75z" />
      <path fill="#00AC47" d="M16.08 16.5 9.66 5.25h6.2c.43 0 .83.22 1.05.6l6.59 11.4c.22.38.22.84 0 1.22z" />
      <path fill="#EA4335" d="M7.92 16.5h8.16l-3.08 5.33a1.12 1.12 0 0 1-1.98 0z" />
      <path fill="#00832D" d="M2.48 3.75 9.66 16.5 6.58 21.83a1.12 1.12 0 0 1-1.98 0z" />
      <path fill="#FFC107" d="M16.08 16.5 22.5 5.25c.22-.38.22-.84 0-1.22L15.91 3.75h-6.25z" />
    </svg>
  );
}

function DriveFolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden>
      <path
        fill="#FFC107"
        d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
      />
    </svg>
  );
}

function DriveVideoIcon() {
  return (
    <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded bg-[#f44336]">
      <span className="ml-0.5 h-0 w-0 border-y-[3px] border-l-[5px] border-y-transparent border-l-white" />
    </span>
  );
}

function DrivePdfIcon() {
  return (
    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded bg-[#e53935] text-[8px] font-bold text-white">
      PDF
    </span>
  );
}

function DriveDocIcon() {
  return (
    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded bg-[#4285f4] text-[8px] font-bold text-white">
      D
    </span>
  );
}

function RowIcon({ kind, id }: { kind: BrowseRow['kind']; id: string }) {
  if (kind === 'folder') return <DriveFolderIcon />;
  if (id === 'rec') return <DriveVideoIcon />;
  if (id === 'p1') return <DrivePdfIcon />;
  return <DriveDocIcon />;
}

type DriveRecordingBrowseDemoProps = {
  driveFileId: string;
  recordingLabel?: string;
  className?: string;
};

export function DriveRecordingBrowseDemo({
  driveFileId,
  recordingLabel = DRIVE_RECORDING_FILENAME,
  className = '',
}: DriveRecordingBrowseDemoProps) {
  const isActive = useContext(MethodShowcase3DActiveContext);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [cycle, setCycle] = useState(0);
  const elapsedRef = useRef(0);
  const playingRef = useRef(false);
  const cursorX = useMotionValue(DEFAULT_CURSOR.left);
  const cursorY = useMotionValue(DEFAULT_CURSOR.top);
  const cursorScale = useMotionValue(1);
  const step = stepAtTime(playing ? STEPS[STEPS.length - 1].at : elapsed);
  const showClick = step.clickAt !== null && elapsed >= step.clickAt && elapsed < step.clickAt + 420;

  const listAreaRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [rowPositions, setRowPositions] = useState<Record<string, CursorPos>>({});
  const entryCursorRef = useRef<CursorPos>(DEFAULT_CURSOR);
  const lastClickRef = useRef<CursorPos>(DEFAULT_CURSOR);
  const prevStepAtRef = useRef(-1);

  const measureRows = useCallback(() => {
    const container = listAreaRef.current;
    if (!container) return;
    const ids = step.rows.map((r) => r.id);
    setRowPositions(measureRowPositions(container, ids, rowRefs.current));
  }, [step.rows]);

  useLayoutEffect(() => {
    measureRows();
  }, [measureRows, step.at, cycle]);

  useEffect(() => {
    if (playing || !isActive) return undefined;
    let frames = 0;
    let raf = 0;
    const retry = () => {
      measureRows();
      frames += 1;
      if (frames < 16) raf = requestAnimationFrame(retry);
    };
    raf = requestAnimationFrame(retry);
    return () => cancelAnimationFrame(raf);
  }, [playing, isActive, step.at, measureRows]);

  useEffect(() => {
    const container = listAreaRef.current;
    if (!container) return undefined;
    const ro = new ResizeObserver(measureRows);
    ro.observe(container);
    return () => ro.disconnect();
  }, [measureRows]);

  useEffect(() => {
    if (step.at !== prevStepAtRef.current) {
      if (prevStepAtRef.current >= 0) {
        entryCursorRef.current = lastClickRef.current;
      }
      prevStepAtRef.current = step.at;
    }
  }, [step.at]);

  useEffect(() => {
    if (showClick && step.targetId && rowPositions[step.targetId]) {
      lastClickRef.current = rowPositions[step.targetId];
    }
  }, [showClick, step.targetId, rowPositions]);

  const rowPositionsRef = useRef(rowPositions);
  rowPositionsRef.current = rowPositions;

  const embedSrc = useMemo(() => {
    const params = new URLSearchParams({ autoplay: '1' });
    return `https://drive.google.com/file/d/${driveFileId}/preview?${params.toString()}`;
  }, [driveFileId]);

  const reset = useCallback(() => {
    elapsedRef.current = 0;
    playingRef.current = false;
    setElapsed(0);
    setPlaying(false);
    setCycle((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!isActive) {
      elapsedRef.current = 0;
      playingRef.current = false;
      setElapsed(0);
      setPlaying(false);
      return undefined;
    }

    const start = performance.now();
    let raf = 0;
    let lastUiSync = 0;

    const tick = (now: number) => {
      const next = now - start;
      elapsedRef.current = next;

      const nextPlaying = next >= BROWSE_DURATION_MS;
      if (nextPlaying !== playingRef.current) {
        playingRef.current = nextPlaying;
        setPlaying(nextPlaying);
      }

      if (!nextPlaying) {
        const liveStep = stepAtTime(next);
        const liveCursor = computeCursor(next, liveStep, rowPositionsRef.current, entryCursorRef.current);
        cursorX.set(liveCursor.left);
        cursorY.set(liveCursor.top);
        cursorScale.set(liveCursor.clicking ? 0.88 : 1);
      }

      if (now - lastUiSync >= 48) {
        lastUiSync = now;
        setElapsed(next);
      }

      if (next < BROWSE_DURATION_MS + PLAYBACK_HOLD_MS) {
        raf = requestAnimationFrame(tick);
      } else {
        setElapsed(next);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cycle, isActive, cursorX, cursorY, cursorScale]);

  useEffect(() => {
    if (!isActive || elapsed < BROWSE_DURATION_MS + PLAYBACK_HOLD_MS) return undefined;
    const t = window.setTimeout(reset, 400);
    return () => clearTimeout(t);
  }, [elapsed, isActive, reset]);

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#dadce0] bg-white ${className}`}
      style={{ fontFamily: DRIVE_FONT }}
    >
      <AnimatePresence mode="wait">
        {playing ? (
            <motion.div
              key={`player-${cycle}`}
              className="cotiz-drive-embed-shell relative min-h-0 flex-1 bg-[#202124]"
              data-no-carousel-drag
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <iframe
                key={`iframe-${cycle}`}
                className="absolute inset-0 z-0 h-full w-full border-0"
                src={embedSrc}
                title={recordingLabel}
                allow="autoplay; encrypted-media; fullscreen"
                loading="eager"
              />
              <motion.div
                className="cotiz-drive-embed-chrome-mask pointer-events-none absolute right-0 top-0 z-10 h-12 w-14 bg-[#202124]"
                aria-hidden
              />
            <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-7 text-center text-[10px] font-normal leading-snug text-white/95">
              <span className="line-clamp-2">{recordingLabel}</span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`browse-${cycle}`}
            className="flex min-h-0 flex-1 flex-col bg-white text-[#202124]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Barra superior Drive */}
            <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[#e0e0e0] bg-white px-3">
              <DriveLogoMark />
              <span className="hidden text-[22px] font-normal text-[#5f6368] sm:inline">Drive</span>
              <div className="ml-1 flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-[#f1f3f4] px-3 py-1.5">
                <Search className="h-4 w-4 shrink-0 text-[#5f6368]" strokeWidth={2} aria-hidden />
                <span className="truncate text-[13px] text-[#5f6368]">Buscar en Drive</span>
              </div>
              <div className="hidden items-center gap-0.5 sm:flex">
                <span className="rounded-full bg-[#e8f0fe] p-1.5 text-[#1a73e8]">
                  <List className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <span className="rounded-full p-1.5 text-[#5f6368]">
                  <LayoutGrid className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
              </div>
            </div>

            {/* Migas de pan + acciones */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#e0e0e0] bg-white px-3 py-2">
              <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden text-[13px] text-[#5f6368]">
                {step.path.map((crumb, i) => (
                  <span key={`${crumb}-${i}`} className="flex min-w-0 items-center">
                    {i > 0 ? <ChevronRight className="mx-0.5 h-4 w-4 shrink-0 text-[#80868b]" aria-hidden /> : null}
                    <span
                      className={
                        i === step.path.length - 1
                          ? 'truncate font-medium text-[#202124]'
                          : 'truncate hover:underline'
                      }
                    >
                      {crumb}
                    </span>
                  </span>
                ))}
              </nav>
            </div>

            {/* Lista tipo Drive */}
            <div ref={listAreaRef} className="relative min-h-0 flex-1 overflow-hidden">
              <div className="grid grid-cols-[28px_1fr_72px] gap-2 border-b border-[#e0e0e0] bg-[#f8f9fa] px-3 py-1.5 text-[11px] font-medium text-[#5f6368] sm:grid-cols-[28px_1fr_96px]">
                <span aria-hidden />
                <span>Nombre</span>
                <span className="hidden sm:inline">Modificado</span>
              </div>

              <ul className="relative" role="list">
                {step.rows.map((row) => {
                  const active = row.id === step.targetId;
                  const isRecording = row.id === 'rec';
                  return (
                    <li
                      key={row.id}
                      ref={(node) => {
                        rowRefs.current[row.id] = node;
                      }}
                    >
                      <motion.div
                        className={`grid grid-cols-[28px_1fr_72px] items-center gap-2 border-b border-[#f1f3f4] px-3 py-2 sm:grid-cols-[28px_1fr_96px] ${
                          active ? 'bg-[#c2e7ff]' : 'bg-white hover:bg-[#f1f3f4]'
                        }`}
                        animate={active && showClick ? { scale: 0.995 } : { scale: 1 }}
                        transition={{ duration: 0.08 }}
                      >
                        <span
                          className={`mx-auto h-3.5 w-3.5 rounded border ${
                            active ? 'border-[#1a73e8] bg-[#1a73e8]' : 'border-[#dadce0] bg-white'
                          }`}
                          aria-hidden
                        />
                        <span className="flex min-w-0 items-center gap-2.5">
                          <RowIcon kind={row.kind} id={row.id} />
                          <span
                            className={`min-w-0 leading-snug ${
                              isRecording ? 'text-[11px] sm:text-[12px]' : 'truncate text-[13px]'
                            } ${active ? 'text-[#202124]' : 'text-[#202124]'}`}
                          >
                            {row.name}
                          </span>
                        </span>
                        <span className="hidden truncate text-[12px] text-[#5f6368] sm:inline">{row.modified}</span>
                        {active && showClick ? (
                          <motion.span
                            className="pointer-events-none absolute inset-0 bg-[#1a73e8]/10"
                            initial={{ opacity: 0.6 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.35 }}
                          />
                        ) : null}
                      </motion.div>
                    </li>
                  );
                })}
              </ul>

              <motion.div
                className="pointer-events-none absolute left-0 top-0 z-20 will-change-transform"
                style={{ x: cursorX, y: cursorY, scale: cursorScale }}
              >
                <MousePointer2
                  className="-mt-px -ml-px h-[18px] w-[18px] fill-white text-[#3c4043] drop-shadow-md"
                  aria-hidden
                />
                {showClick ? (
                  <motion.span
                    className="absolute -left-1 top-3 h-2 w-2 rounded-full bg-[#1a73e8]/45"
                    initial={{ scale: 0.4, opacity: 0.9 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  />
                ) : null}
              </motion.div>

              {elapsed >= 12_200 && elapsed < BROWSE_DURATION_MS ? (
                <motion.div
                  className="absolute inset-0 z-30 flex items-center justify-center bg-white/80"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center gap-2 rounded-lg border border-[#dadce0] bg-white px-4 py-2 shadow-sm">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#dadce0] border-t-[#1a73e8]" />
                    <p className="text-[13px] text-[#5f6368]">Abriendo archivo…</p>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
