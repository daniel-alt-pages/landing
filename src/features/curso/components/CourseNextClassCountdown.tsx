'use client';

import { useMemo } from 'react';
import type { CourseRecentSession } from '../types/courseTypes';
import { CURSO_SEGUIMIENTO_ICONS } from '../lib/courseSeguimientoIcons';
import CourseSvgIcon from './CourseSvgIcon';
import {
  CourseLiveCountdownRow,
  pickUpcomingCountdownTargets,
  type CountdownTarget,
} from './CourseLiveCountdown';

type CourseNextClassCountdownProps = {
  sessions: CourseRecentSession[];
};

const CALENDAR_GRID_COLS = 3;

function formatDayGroupLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Bogota',
  });
}

function splitCalendarGridRows<T>(items: T[]): { main: T[]; tail: T[] } {
  const remainder = items.length % CALENDAR_GRID_COLS;
  if (remainder === 0) return { main: items, tail: [] };
  return {
    main: items.slice(0, items.length - remainder),
    tail: items.slice(items.length - remainder),
  };
}

/** Grid 3 columnas tipo calendario; fila incompleta se reparte (2 mitades o 1 ancho completo). */
function ScheduledClassCalendarGrid({ targets }: { targets: CountdownTarget[] }) {
  const { main, tail } = splitCalendarGridRows(targets);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {main.map((target) => (
        <CourseLiveCountdownRow key={target.id} target={target} />
      ))}

      {tail.length === 1 ? (
        <div className="col-span-1 sm:col-span-3">
          <CourseLiveCountdownRow target={tail[0]!} />
        </div>
      ) : null}

      {tail.length === 2 ? (
        <div className="col-span-1 grid grid-cols-1 gap-3 sm:col-span-3 sm:grid-cols-2">
          {tail.map((target) => (
            <CourseLiveCountdownRow key={target.id} target={target} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CourseNextClassCountdown({ sessions }: CourseNextClassCountdownProps) {
  const targets = useMemo(() => pickUpcomingCountdownTargets(sessions), [sessions]);

  const grouped = useMemo(() => {
    const map = new Map<string, CountdownTarget[]>();
    for (const t of targets) {
      const dayKey = new Date(t.startsAtIso).toLocaleDateString('en-CA', {
        timeZone: 'America/Bogota',
      });
      const list = map.get(dayKey) ?? [];
      list.push(t);
      map.set(dayKey, list);
    }
    return [...map.entries()];
  }, [targets]);

  if (!targets.length) return null;

  const multipleSameDay = grouped.some(([, list]) => list.length > 1);

  return (
    <section
      aria-labelledby="course-next-class-heading"
      className="rounded-[var(--course-radius-lg)] border border-[var(--course-border)] bg-[var(--course-surface-muted)]/30 p-3 sm:p-4"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--course-surface-muted)]">
          <CourseSvgIcon
            src={CURSO_SEGUIMIENTO_ICONS.proximasClases}
            size={26}
            className="h-[26px] w-[26px]"
          />
        </span>
        <div className="min-w-0">
          <h3
            id="course-next-class-heading"
            className="text-sm font-bold text-[var(--course-text)]"
          >
            Próxima{targets.length > 1 ? 's' : ''} clase{targets.length > 1 ? 's' : ''}
          </h3>
          <p className="text-xs text-[var(--course-text-muted)]">
            {multipleSameDay
              ? `${targets.length} programadas`
              : 'Contador en vivo'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {grouped.map(([dayKey, dayTargets]) => (
          <div key={dayKey}>
            {dayTargets.length > 1 || grouped.length > 1 ? (
              <p className="mb-2 text-[11px] font-semibold capitalize text-[var(--course-accent)]">
                {formatDayGroupLabel(dayTargets[0]!.startsAtIso)}
              </p>
            ) : null}
            <ScheduledClassCalendarGrid targets={dayTargets} />
          </div>
        ))}
      </div>
    </section>
  );
}
