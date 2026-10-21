/**
 * Clases PIFA que bloquean resultados de CUALQUIER simulacro (SG11-XX)
 * hasta terminar (America/Bogota). No filtra por id de simulacro.
 */

export const PIFA_RESULTS_TZ = 'America/Bogota';
export const PIFA_HARD_LOCK_LEAD_MS = 15 * 60 * 1000;

/** Marca de agua ADPMH / PIFA (baja opacidad en modales). */
export const PIFA_WATERMARK_URL =
  'https://ik.imagekit.io/danydc/ICONS%20-%20SIMULACROS%20%20SG/FONDOS%20PIFA.png';

/** Acento de barra/badge de la portada ADPMH (diseño estático por clase). */
export type PifaCoverAccent = 'blue' | 'purple' | 'green' | 'red' | 'salmon';

export type PifaCoverTheme = {
  accent: PifaCoverAccent;
  /** Barra superior / CTA primario */
  main: string;
  /** Gradiente profundo CTA */
  deep: string;
  /** Fondo suave (chips light) */
  soft: string;
  /** Texto sobre soft */
  ink: string;
  /** Borde suave */
  border: string;
  /** Fondo modal oscuro (base) */
  panel: string;
  /** Fondo modal oscuro (abajo / degradado) */
  panelDeep: string;
  /** Acento claro sobre panel (pills / countdown) */
  glow: string;
};

/** Paletas alineadas a portadas PIFA (verde / rojo / azul / salmón / morado). */
export const PIFA_COVER_THEMES: Record<PifaCoverAccent, Omit<PifaCoverTheme, 'accent'>> = {
  blue: {
    main: '#1565C0',
    deep: '#0D47A1',
    soft: '#E3F2FD',
    ink: '#0D47A1',
    border: '#90CAF9',
    panel: '#0B1F3A',
    panelDeep: '#061224',
    glow: '#64B5F6',
  },
  purple: {
    main: '#7B1FA2',
    deep: '#4A148C',
    soft: '#F3E5F5',
    ink: '#4A148C',
    border: '#CE93D8',
    panel: '#1E1333',
    panelDeep: '#120A22',
    glow: '#CE93D8',
  },
  green: {
    main: '#00A651',
    deep: '#007A3D',
    soft: '#E8F5E9',
    ink: '#1B5E20',
    border: '#A5D6A7',
    panel: '#0B2418',
    panelDeep: '#06140D',
    glow: '#69F0AE',
  },
  red: {
    main: '#E53935',
    deep: '#B71C1C',
    soft: '#FFEBEE',
    ink: '#B71C1C',
    border: '#EF9A9A',
    panel: '#2A1214',
    panelDeep: '#16080A',
    glow: '#EF9A9A',
  },
  salmon: {
    main: '#FF7043',
    deep: '#E64A19',
    soft: '#FBE9E7',
    ink: '#BF360C',
    border: '#FFAB91',
    panel: '#2A1610',
    panelDeep: '#160C08',
    glow: '#FFAB91',
  },
};

export function resolvePifaCoverTheme(accent: PifaCoverAccent = 'blue'): PifaCoverTheme {
  return { accent, ...PIFA_COVER_THEMES[accent] };
}

export type PifaResultsClass = {
  id: string;
  number: number;
  title: string;
  tutor: string;
  badge: string;
  coverUrl: string;
  meetUrl: string;
  /** Color de barra/badge de la portada. */
  accent: PifaCoverAccent;
  /** ISO local Bogotá sin offset → se interpreta como America/Bogota. */
  startBogota: string;
  endBogota: string;
  dial?: string;
  pin?: string;
};

/**
 * Horarios fijos Bogotá. `bogotaWallToUtcMs` convierte YYYY-MM-DDTHH:mm a UTC.
 * ponytail: lista hardcodeada para evento puntual; upgrade = calendario Firestore.
 */
export const PIFA_RESULTS_CLASSES: PifaResultsClass[] = [
  {
    id: 'pifa-14',
    number: 14,
    title: 'Ecuaciones y funciones I',
    tutor: 'Noelia Montezuma',
    badge: 'Estudiante de la UNAL',
    coverUrl:
      'https://i.ibb.co/dwP11Hsc/CLASE-PIFA-14-ECUACIONES-Y-FUNCIONES-I-NOELIA-MONTEZUMA-ESTUDIANTE-DE-LA-UNAL.jpg',
    meetUrl: 'https://meet.google.com/mdz-sgbx-epu',
    accent: 'blue',
    startBogota: '2026-07-20T18:00',
    endBogota: '2026-07-20T20:00',
    dial: '(CO) +57 601 8957359',
    pin: '501 022 054',
  },
  {
    id: 'pifa-15',
    number: 15,
    title: 'Retroalimentación SG-24',
    tutor: 'Gabriel Sutachan',
    badge: '496/500',
    coverUrl:
      'https://i.ibb.co/MxZpPBpS/CLASE-PIFA-15-RETROALIMENTACION-DEL-SG11-24-GABRIEL-SUTACHAN-496500.jpg',
    meetUrl: 'https://meet.google.com/dds-cprc-xrz',
    accent: 'purple',
    startBogota: '2026-07-20T20:00',
    endBogota: '2026-07-20T22:00',
    dial: '(CO) +57 602 3896637',
    pin: '674 218 112',
  },
];

export type PifaClassPhase = 'upcoming' | 'soft' | 'hard' | 'ended';

export type PifaGateMode = 'idle' | 'soft' | 'hard';

export type PifaGateSnapshot = {
  mode: PifaGateMode;
  /** Clase que manda el UI (próxima soft o hard activa). */
  focus: PifaResultsClass | null;
  /** Todas las clases aún no terminadas (para listar en soft). */
  upcoming: PifaResultsClass[];
  allEnded: boolean;
  resultsUnlocked: boolean;
};

/** Convierte pared Bogotá `YYYY-MM-DDTHH:mm` → epoch ms. COT = UTC-5, sin DST. */
export function bogotaWallToUtcMs(wall: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(wall.trim());
  if (!m) return Number.NaN;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  return Date.UTC(y, mo - 1, d, h + 5, mi, 0);
}

export function pifaClassStartMs(cls: PifaResultsClass): number {
  return bogotaWallToUtcMs(cls.startBogota);
}

export function pifaClassEndMs(cls: PifaResultsClass): number {
  return bogotaWallToUtcMs(cls.endBogota);
}

export function pifaClassPhase(cls: PifaResultsClass, now = Date.now()): PifaClassPhase {
  const start = pifaClassStartMs(cls);
  const end = pifaClassEndMs(cls);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'ended';
  if (now >= end) return 'ended';
  if (now >= start - PIFA_HARD_LOCK_LEAD_MS) return 'hard';
  // Soft desde el inicio del día Bogotá de la clase.
  const dayStart = bogotaWallToUtcMs(`${cls.startBogota.slice(0, 10)}T00:00`);
  if (now >= dayStart) return 'soft';
  return 'upcoming';
}

export function formatPifaClockBogota(wallOrMs: string | number): string {
  const ms = typeof wallOrMs === 'number' ? wallOrMs : bogotaWallToUtcMs(wallOrMs);
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleTimeString('es-CO', {
    timeZone: PIFA_RESULTS_TZ,
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatPifaRangeBogota(cls: PifaResultsClass): string {
  return `${formatPifaClockBogota(cls.startBogota)} – ${formatPifaClockBogota(cls.endBogota)}`;
}

/** Countdown compacto HH:MM:SS o MM:SS hasta targetMs. */
export function formatPifaCountdown(targetMs: number, now = Date.now()): string {
  const diff = Math.max(0, targetMs - now);
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

/** Próximo hito: inicio de clase, o fin si ya está en vivo. */
export function pifaCountdownTargetMs(cls: PifaResultsClass, now = Date.now()): number {
  const start = pifaClassStartMs(cls);
  const end = pifaClassEndMs(cls);
  if (now < start) return start;
  return end;
}

/** Meet se desbloquea en T−15 (misma ventana hard). */
export function pifaMeetUnlockMs(cls: PifaResultsClass): number {
  return pifaClassStartMs(cls) - PIFA_HARD_LOCK_LEAD_MS;
}

export function pifaMeetUnlocked(cls: PifaResultsClass, now = Date.now()): boolean {
  const unlock = pifaMeetUnlockMs(cls);
  const end = pifaClassEndMs(cls);
  if (!Number.isFinite(unlock) || !Number.isFinite(end)) return false;
  return now >= unlock && now < end;
}

/** Countdown hasta desbloqueo Meet (T−15). */
export function pifaMeetUnlockCountdown(cls: PifaResultsClass, now = Date.now()): string {
  return formatPifaCountdown(pifaMeetUnlockMs(cls), now);
}

export function pifaIsLive(cls: PifaResultsClass, now = Date.now()): boolean {
  return now >= pifaClassStartMs(cls) && now < pifaClassEndMs(cls);
}

export function resolvePifaResultsGate(
  classes: PifaResultsClass[] = PIFA_RESULTS_CLASSES,
  now = Date.now(),
): PifaGateSnapshot {
  const sorted = [...classes].sort((a, b) => pifaClassStartMs(a) - pifaClassStartMs(b));
  const phases = sorted.map((c) => ({ c, phase: pifaClassPhase(c, now) }));
  const allEnded = phases.every((p) => p.phase === 'ended');
  if (allEnded) {
    return {
      mode: 'idle',
      focus: null,
      upcoming: [],
      allEnded: true,
      resultsUnlocked: true,
    };
  }

  const active = phases.filter((p) => p.phase === 'soft' || p.phase === 'hard').map((p) => p.c);
  const hard = phases.find((p) => p.phase === 'hard')?.c;
  if (hard) {
    return {
      mode: 'hard',
      focus: hard,
      upcoming: active,
      allEnded: false,
      resultsUnlocked: false,
    };
  }

  const softFocus = phases.find((p) => p.phase === 'soft')?.c ?? null;
  if (softFocus) {
    return {
      mode: 'soft',
      focus: softFocus,
      upcoming: active,
      allEnded: false,
      resultsUnlocked: false,
    };
  }

  // Antes del día del evento (upcoming) → sin modal.
  return {
    mode: 'idle',
    focus: null,
    upcoming: [],
    allEnded: false,
    resultsUnlocked: true,
  };
}

/** Self-check runnable: `npx tsx -e "import { selfCheckPifaResultsClassGate } from './src/features/estudiante/lib/pifaResultsClassGate.ts'; selfCheckPifaResultsClassGate()"` */
export function selfCheckPifaResultsClassGate(): void {
  const sample = PIFA_RESULTS_CLASSES[0]!;
  const start = pifaClassStartMs(sample);
  const end = pifaClassEndMs(sample);
  if (!(end > start)) throw new Error('end must be after start');

  const beforeSoft = bogotaWallToUtcMs('2026-07-19T12:00');
  const soft = bogotaWallToUtcMs('2026-07-20T14:00');
  const hard = start - 10 * 60_000;
  const live = start + 30 * 60_000;

  if (resolvePifaResultsGate(PIFA_RESULTS_CLASSES, beforeSoft).mode !== 'idle') {
    throw new Error('expected idle before event day');
  }
  const softSnap = resolvePifaResultsGate(PIFA_RESULTS_CLASSES, soft);
  if (softSnap.mode !== 'soft' || softSnap.resultsUnlocked) {
    throw new Error('expected soft + locked results at 14:00');
  }
  const hardSnap = resolvePifaResultsGate(PIFA_RESULTS_CLASSES, hard);
  if (hardSnap.mode !== 'hard' || hardSnap.focus?.id !== 'pifa-14') {
    throw new Error('expected hard lock on pifa-14 at T-10');
  }
  const liveSnap = resolvePifaResultsGate(PIFA_RESULTS_CLASSES, live);
  if (liveSnap.mode !== 'hard') throw new Error('expected hard during live');
  if (pifaMeetUnlocked(sample, soft)) throw new Error('Meet must stay locked in soft');
  if (!pifaMeetUnlocked(sample, hard)) throw new Error('Meet must unlock at hard T-15');
  if (!pifaMeetUnlocked(sample, live)) throw new Error('Meet must stay open while live');
  // #15 empieza al cerrar #14 → pasa directo a hard.
  const after14 = resolvePifaResultsGate(PIFA_RESULTS_CLASSES, end + 60_000);
  if (after14.mode !== 'hard' || after14.focus?.id !== 'pifa-15') {
    throw new Error('expected hard for pifa-15 right after #14 ends');
  }
  const afterAll = resolvePifaResultsGate(
    PIFA_RESULTS_CLASSES,
    pifaClassEndMs(PIFA_RESULTS_CLASSES[1]!) + 60_000,
  );
  if (!afterAll.resultsUnlocked || afterAll.mode !== 'idle') {
    throw new Error('expected unlock after both classes');
  }
}
