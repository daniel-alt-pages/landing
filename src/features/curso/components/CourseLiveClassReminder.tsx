'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, Video } from 'lucide-react';
import { useCourseVacacionalCalendar } from '../context/CourseVacacionalCalendarContext';
import {
  formatCountdownToClassStart,
  isVacacionalLiveClassReminderActive,
  vacacionalClassPhase,
  vacacionalEventStartDate,
} from '../lib/courseVacacionalEventTime';

function formatEventClock(eventStart: Date): string {
  return eventStart.toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CourseLiveClassReminder() {
  const { enabled, events } = useCourseVacacionalCalendar();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tickMs = 5_000;
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, []);

  const activeEvent = useMemo(() => {
    if (!enabled) return null;
    return events.find((event) => isVacacionalLiveClassReminderActive(event, now)) ?? null;
  }, [enabled, events, now]);

  if (!enabled || !activeEvent?.hangoutLink) return null;

  const start = vacacionalEventStartDate(activeEvent);
  const phase = vacacionalClassPhase(activeEvent, now);
  const isLive = phase === 'live';
  const title = activeEvent.summary || 'Clase en vivo';
  const countdown = start ? formatCountdownToClassStart(start, now) : '';

  return (
    <>
      <style>{`
        @keyframes live-class-urgent-ring {
          0%, 100% {
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--course-accent) 55%, transparent);
          }
          50% {
            box-shadow: 0 0 0 14px color-mix(in srgb, var(--course-accent) 0%, transparent);
          }
        }
        @keyframes live-class-urgent-nudge {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.01); }
        }
        @keyframes live-class-urgent-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.12); }
        }
        @keyframes live-class-cta-bounce {
          0%, 100% { transform: scale(1); }
          40% { transform: scale(1.04); }
          60% { transform: scale(0.98); }
        }
        .live-class-urgent-backdrop {
          animation: live-class-urgent-glow 1.8s ease-in-out infinite;
        }
        .live-class-urgent-card {
          animation: live-class-urgent-nudge 1.4s ease-in-out infinite;
        }
        .live-class-urgent-card.is-live {
          animation: live-class-urgent-ring 1.6s ease-out infinite, live-class-urgent-nudge 1.4s ease-in-out infinite;
        }
        .live-class-urgent-cta.is-live {
          animation: live-class-cta-bounce 1.2s ease-in-out infinite;
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-4 sm:items-center live-class-urgent-backdrop ${
          isLive ? 'bg-black/65' : ''
        }`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="live-class-reminder-title"
        aria-describedby="live-class-reminder-desc"
      >
        <div
          className={`live-class-urgent-card w-full max-w-md overflow-hidden rounded-2xl border-2 border-[var(--course-accent)] bg-[var(--course-surface)] shadow-2xl ring-4 ring-[var(--course-accent)]/25 ${
            isLive ? 'is-live' : ''
          }`}
        >
          <div
            className={`border-b border-[var(--course-border)] px-4 py-3 sm:px-5 ${
              isLive
                ? 'bg-[var(--course-accent)] text-white'
                : 'bg-[var(--course-accent-soft)]'
            }`}
          >
            <p
              className={`text-xs font-bold uppercase tracking-wide ${
                isLive ? 'text-white/95' : 'text-[var(--course-accent)]'
              }`}
            >
              {isLive ? '⚡ Clase en curso — debes asistir ahora' : 'Tu clase empieza en 5 minutos'}
            </p>
            <h2
              id="live-class-reminder-title"
              className={`mt-1 text-lg font-black leading-snug ${
                isLive ? 'text-white' : 'text-[var(--course-text)]'
              }`}
            >
              {title}
            </h2>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
            <p id="live-class-reminder-desc" className="text-sm text-[var(--course-text-muted)]">
              {isLive
                ? 'Entra a Meet ya. El aviso no se cierra hasta que termine la clase.'
                : 'Entra ya a la reunión. Este aviso se mantiene hasta que inicie la clase.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--course-text)]">
              {start ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--course-surface-muted)] px-3 py-1">
                  <Clock className="h-4 w-4 text-[var(--course-accent)]" aria-hidden />
                  {formatEventClock(start)}
                </span>
              ) : null}
              {!isLive && countdown ? (
                <span className="font-bold text-[var(--course-accent)]">{countdown}</span>
              ) : null}
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-300">
                  En vivo
                </span>
              ) : null}
            </div>

            <a
              href={activeEvent.hangoutLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`live-class-urgent-cta inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--course-accent)] px-4 py-3 text-base font-black text-white shadow-lg shadow-[var(--course-accent)]/35 transition hover:brightness-110 ${
                isLive ? 'is-live' : ''
              }`}
            >
              <Video className="h-5 w-5" aria-hidden />
              {isLive ? 'Unirme a Meet ahora' : 'Entrar a Meet'}
            </a>

            <p className="text-center text-xs font-semibold text-[var(--course-accent)]">
              {isLive
                ? 'No puedes cerrar este aviso mientras la clase esté en curso.'
                : 'Aviso obligatorio 5 minutos antes del inicio.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
