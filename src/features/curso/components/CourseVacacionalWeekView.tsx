'use client';



import { useEffect, useMemo, useState } from 'react';

import { Film, FolderOpen, Loader2, Lock, Video } from 'lucide-react';

import type { CourseCalendarEventDto } from '../lib/courseCalendarTypes';
import type { CourseRecording } from '../types/courseTypes';

import { vacacionalEventCardTheme } from '../lib/courseVacacionalEventArea';
import { useCourseTheme } from '../hooks/useCourseTheme';

import {

  getCountdownToClassStartParts,

  isVacacionalMeetBlockedByPriorSameDayClass,

  isVacacionalMeetJoinable,

  isVacacionalMeetLockedByDay,

  isVacacionalEventEnded,

  vacacionalClassPhase,

  vacacionalEventStartDate,

} from '../lib/courseVacacionalEventTime';
import VacacionalCountdownFlip from './VacacionalCountdownFlip';

import { buildClassMaterialPickerOptions } from '../lib/courseVacacionalClassMaterialAccess';
import { useCourseStudentMaterials } from '../hooks/useCourseStudentMaterials';
import CourseClassMaterialPickerModal from './CourseClassMaterialPickerModal';
import CourseCalendarEventModal from './CourseCalendarEventModal';

import {

  countVacacionalRecordings,

  buildVacacionalClassRecordings,

  mergeCourseRecordingsWithIcs,

  resolveVacacionalRecordingCatalogId,

} from '../lib/courseVacacionalRecordings';

import { bogotaTodayKey } from '../lib/courseVacacionalWeek';
import { isVacacionalPlaceholderEvent } from '../lib/courseVacacionalAttendance';



const BOGOTA = 'America/Bogota';



/** Ancho mínimo por columna (estilo Google Calendar week). */

const DAY_COL_MIN = 'clamp(14rem, 45vw, 19rem)';



type CourseVacacionalWeekViewProps = {

  weekKeys: string[];

  events: CourseCalendarEventDto[];

  loading?: boolean;

  catalogRecordings?: CourseRecording[];

  courseId?: string;

  onOpenGrabacionesTab?: (recordingId?: string) => void;

};



function eventStartDate(event: CourseCalendarEventDto): Date | null {

  const raw = event.start.dateTime || event.start.date;

  if (!raw) return null;

  const d = new Date(raw);

  return Number.isNaN(d.getTime()) ? null : d;

}



function eventDayKey(event: CourseCalendarEventDto): string {

  const d = eventStartDate(event);

  if (!d) return '';

  return d.toLocaleDateString('en-CA', { timeZone: BOGOTA });

}



function formatEventTime(event: CourseCalendarEventDto): string {

  const d = eventStartDate(event);

  if (!d) return '';

  return d.toLocaleTimeString('es-CO', {

    timeZone: BOGOTA,

    hour: '2-digit',

    minute: '2-digit',

  });

}



function dayColumnLabel(dayKey: string): { weekday: string; dayNum: string } {
  const d = new Date(`${dayKey}T12:00:00-05:00`);
  return {
    weekday: d.toLocaleDateString('es-CO', { timeZone: BOGOTA, weekday: 'short' }),
    dayNum: d.toLocaleDateString('es-CO', { timeZone: BOGOTA, day: 'numeric' }),
  };
}

export default function CourseVacacionalWeekView({

  weekKeys,

  events,

  loading = false,

  catalogRecordings = [],

  courseId,

  onOpenGrabacionesTab,

}: CourseVacacionalWeekViewProps) {

  const { dark } = useCourseTheme();
  const { materials: studentMaterials, loading: studentMaterialsLoading } =
    useCourseStudentMaterials(courseId);
  const [materialPickerEvent, setMaterialPickerEvent] = useState<CourseCalendarEventDto | null>(
    null,
  );
  const [detailModalEvent, setDetailModalEvent] = useState<CourseCalendarEventDto | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const mergedCatalog = useMemo(() => {
    const fromIcs = buildVacacionalClassRecordings(events);
    return mergeCourseRecordingsWithIcs(catalogRecordings, fromIcs);
  }, [catalogRecordings, events]);

  const todayKey = useMemo(() => bogotaTodayKey(new Date(now)), [now]);



  const byDay = useMemo(() => {

    const map = new Map<string, CourseCalendarEventDto[]>();

    for (const key of weekKeys) map.set(key, []);

    for (const event of events) {

      const key = eventDayKey(event);

      if (!key || !map.has(key)) continue;

      map.get(key)!.push(event);

    }

    for (const list of map.values()) {

      list.sort((a, b) => (eventStartDate(a)?.getTime() ?? 0) - (eventStartDate(b)?.getTime() ?? 0));

    }

    return map;

  }, [events, weekKeys]);



  if (loading && !events.length) {

    return (

      <p className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--course-border)] bg-[var(--course-surface)] px-5 py-10 text-sm text-[var(--course-text-muted)]">

        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />

        Cargando semana…

      </p>

    );

  }



  return (

    <div className="relative overflow-hidden rounded-2xl border border-[var(--course-border)] bg-[var(--course-surface)] shadow-[var(--course-shadow)] ring-1 ring-[var(--course-border)]">
      <div className="border-b border-[var(--course-border)] bg-[var(--course-surface-muted)] px-3 py-2 sm:px-4">
        <p className="text-[11px] font-medium text-[var(--course-text-muted)] sm:text-xs">
          Lunes a domingo · usa las flechas de arriba para cambiar de semana
        </p>
      </div>

      <div
        className="vacacional-week-scroll overflow-x-auto overscroll-x-contain px-1 pb-1 pt-1 sm:px-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
        aria-label="Vista semanal del vacacional"
      >

        <div

          className="flex min-w-full gap-2"

          style={{

            width: `max(100%, calc(${DAY_COL_MIN} * 7 + 1.5rem))`,

          }}

        >

          {weekKeys.map((dayKey) => {

            const isToday = dayKey === todayKey;

            const { weekday, dayNum } = dayColumnLabel(dayKey);

            const dayEvents = byDay.get(dayKey) ?? [];



            return (

              <div

                key={dayKey}

                data-day={dayKey}

                style={{

                  flex: `1 0 ${DAY_COL_MIN}`,

                  minWidth: DAY_COL_MIN,

                  scrollSnapAlign: 'center',

                }}

                className={`flex shrink-0 flex-col rounded-xl border ${

                  isToday

                    ? 'border-[var(--course-accent)] bg-[var(--course-accent-soft)] ring-2 ring-[var(--course-accent)]/35'

                    : 'border-[var(--course-border)] bg-[var(--course-surface-muted)]/80'

                }`}

              >

                <div

                  className={`sticky top-0 z-10 rounded-t-xl border-b px-2 py-2 text-center sm:px-3 ${

                    isToday

                      ? 'border-[var(--course-accent)]/40 bg-[var(--course-accent)] text-white'

                      : 'border-[var(--course-border)] bg-[var(--course-surface)] text-[var(--course-text)]'

                  }`}

                >

                  <p className="text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">

                    {weekday}

                  </p>

                  <p className="text-base font-bold leading-tight sm:text-lg">{dayNum}</p>

                  {isToday ? (

                    <span className="mt-0.5 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase">

                      Hoy

                    </span>

                  ) : null}

                </div>



                <ul className="flex min-h-[8rem] flex-1 flex-col gap-2 p-2">

                  {dayEvents.length === 0 ? (

                    <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[var(--course-border)] bg-[var(--course-surface)]/70 px-2 py-8 text-center text-[11px] text-[var(--course-text-muted)]">

                      Sin clases

                    </li>

                  ) : (

                    dayEvents.map((event) => {

                      const isPlaceholder = isVacacionalPlaceholderEvent(event);
                      const theme = vacacionalEventCardTheme(event.summary, dark);

                      const materialPickerOptions = buildClassMaterialPickerOptions(
                        event,
                        studentMaterials,
                      );
                      const materialChoiceCount =
                        (materialPickerOptions.gemini ? 1 : 0) +
                        (materialPickerOptions.compilado ? 1 : 0) +
                        materialPickerOptions.extraAttachments.length;
                      const showClassMaterialsButton =
                        Boolean(courseId) &&
                        (materialChoiceCount > 0 || Boolean(materialPickerOptions.areaKey));

                      const recordingCount = countVacacionalRecordings(event);

                      const recordingId = resolveVacacionalRecordingCatalogId(event, mergedCatalog);

                      const meetBlockedPrior = isVacacionalMeetBlockedByPriorSameDayClass(
                        event,
                        events,
                        now,
                      );

                      const meetJoinable = isVacacionalMeetJoinable(event, now, events);

                      const meetLocked = isVacacionalMeetLockedByDay(event, now);

                      const meetEnded = Boolean(event.hangoutLink) && isVacacionalEventEnded(event, now);

                      const startDate = vacacionalEventStartDate(event);

                      const phase = vacacionalClassPhase(event, now);

                      const countdownParts =
                        startDate && phase === 'upcoming'
                          ? getCountdownToClassStartParts(startDate, now)
                          : null;

                      const showFlipCountdown = Boolean(countdownParts);

                      return (

                        <li

                          key={event.id}

                          className={`flex min-w-0 flex-col gap-2 overflow-hidden rounded-xl border p-2.5 sm:p-3 ${
                            isPlaceholder ? 'border-dashed opacity-90' : 'cursor-pointer transition hover:brightness-105'
                          }`}

                          style={
                            isPlaceholder
                              ? {
                                  background: 'var(--course-surface-muted)',
                                  borderColor: 'var(--course-border)',
                                }
                              : theme.cardStyle
                          }

                          onClick={() => setDetailModalEvent(event)}

                          role="button"

                          tabIndex={0}

                          onKeyDown={(e) => e.key === 'Enter' && setDetailModalEvent(event)}

                          aria-label={`Ver detalle: ${event.summary || 'Clase'}`}

                        >

                          <p

                            className="text-xs font-bold leading-snug sm:text-sm"

                            style={{ color: isPlaceholder ? 'var(--course-text-muted)' : theme.titleColor }}

                          >

                            {isPlaceholder ? 'Clase por definir' : event.summary}

                          </p>

                          <p className="text-[10px] font-medium text-[var(--course-text)]/85 sm:text-[11px]">

                            {formatEventTime(event)}

                          </p>

                          {phase === 'live' ? (
                            <p className="text-[10px] font-bold text-[var(--course-accent)] sm:text-[11px]">
                              En vivo ahora
                            </p>
                          ) : phase === 'starting-soon' ? (
                            <p className="text-[10px] font-bold text-[var(--course-accent)] sm:text-[11px]">
                              Empieza en minutos
                            </p>
                          ) : showFlipCountdown && countdownParts ? (
                            <VacacionalCountdownFlip parts={countdownParts} compact />
                          ) : null}

                          {meetJoinable ? (

                            <a

                              href={event.hangoutLink}

                              target="_blank"

                              rel="noopener noreferrer"

                              onClick={(e) => e.stopPropagation()}

                              className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold text-white transition hover:brightness-110"

                              style={theme.meetStyle}

                            >

                              <Video className="h-3.5 w-3.5 shrink-0" aria-hidden />

                              Meet

                            </a>

                          ) : meetEnded ? (

                            <p

                              className={`rounded-lg border px-2 py-1.5 text-center text-[10px] font-semibold ${
                                dark
                                  ? 'border-white/25 bg-black/30 text-[var(--course-text)]'
                                  : 'border-[var(--course-border)]/60 bg-[var(--course-surface)]/75 text-[var(--course-text-muted)]'
                              }`}

                              role="status"

                            >

                              Reunión finalizada · Meet no disponible

                            </p>

                          ) : meetBlockedPrior ? (

                            <div className="flex flex-col gap-1.5" role="status">

                              <span

                                className={`inline-flex min-h-8 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold ${
                                  dark
                                    ? 'border border-white/20 bg-black/35 text-white/55'
                                    : 'border border-[var(--course-border)]/70 bg-[var(--course-surface)]/80 text-[var(--course-text-muted)]'
                                }`}

                                aria-disabled="true"

                              >

                                <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />

                                Meet bloqueado

                              </span>

                              <p className="text-center text-[9px] font-medium text-[var(--course-text-muted)] sm:text-[10px]">

                                Disponible cuando culmine la clase anterior

                              </p>

                            </div>

                          ) : meetLocked ? (

                            <div className="flex flex-col gap-1.5" role="status">

                              <span

                                className={`inline-flex min-h-8 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold ${
                                  dark
                                    ? 'border border-white/20 bg-black/35 text-white/55'
                                    : 'border border-[var(--course-border)]/70 bg-[var(--course-surface)]/80 text-[var(--course-text-muted)]'
                                }`}

                                aria-disabled="true"

                              >

                                <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />

                                Meet bloqueado

                              </span>

                              <p className="text-center text-[9px] font-medium text-[var(--course-text-muted)] sm:text-[10px]">

                                Disponible el día de la clase

                              </p>

                            </div>

                          ) : null}

                          {recordingCount > 0 && onOpenGrabacionesTab ? (

                            <button

                              type="button"

                              onClick={(e) => { e.stopPropagation(); onOpenGrabacionesTab(recordingId); }}

                              className="inline-flex min-h-7 w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--course-border)]/70 bg-[var(--course-surface)]/85 px-2 py-1 text-[10px] font-semibold text-[var(--course-text)] transition hover:bg-[var(--course-surface-muted)]"

                            >

                              <Film className="h-3 w-3 shrink-0" aria-hidden />

                              {recordingCount === 1 ? 'Ver grabación' : `${recordingCount} grabaciones`}

                            </button>

                          ) : null}

                          {showClassMaterialsButton ? (

                            <button

                              type="button"

                              onClick={(e) => { e.stopPropagation(); setMaterialPickerEvent(event); }}

                              className="inline-flex min-h-7 w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--course-border)]/70 bg-[var(--course-surface)]/85 px-2 py-1 text-[10px] font-semibold text-[var(--course-text)] transition hover:bg-[var(--course-surface-muted)]"

                            >

                              <FolderOpen className="h-3 w-3 shrink-0" aria-hidden />

                              {materialChoiceCount === 1
                                ? '1 material'
                                : materialChoiceCount > 1
                                  ? `${materialChoiceCount} materiales`
                                  : 'Materiales'}

                            </button>

                          ) : null}

                        </li>

                      );

                    })

                  )}

                </ul>

              </div>

            );

          })}

        </div>

      </div>



      <div

        className="pointer-events-none absolute inset-y-8 left-0 w-6 bg-gradient-to-r from-[var(--course-surface)] to-transparent sm:w-8"

        aria-hidden

      />

      <div

        className="pointer-events-none absolute inset-y-8 right-0 w-6 bg-gradient-to-l from-[var(--course-surface)] to-transparent sm:w-8"

        aria-hidden

      />

      <CourseClassMaterialPickerModal
        open={Boolean(materialPickerEvent)}
        options={
          materialPickerEvent
            ? buildClassMaterialPickerOptions(materialPickerEvent, studentMaterials)
            : null
        }
        materialsLoading={studentMaterialsLoading}
        onClose={() => setMaterialPickerEvent(null)}
      />

      <CourseCalendarEventModal
        open={Boolean(detailModalEvent)}
        event={detailModalEvent}
        now={now}
        allEvents={events}
        mergedCatalog={mergedCatalog}
        onClose={() => setDetailModalEvent(null)}
        onOpenGrabaciones={onOpenGrabacionesTab}
      />

    </div>

  );

}

