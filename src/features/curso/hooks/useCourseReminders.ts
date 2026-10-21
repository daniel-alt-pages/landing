'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CourseClassLink } from '../types/courseTypes';

function parseStartsAt(value: CourseClassLink['startsAt']): Date | null {
  if (!value) return null;
  const date =
    typeof value === 'object' && value !== null && 'toDate' in value
      ? (value as { toDate: () => Date }).toDate()
      : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export type UpcomingClass = {
  link: CourseClassLink;
  startsAt: Date;
};

export function useCourseReminders(classLinks: CourseClassLink[]) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const upcoming = useMemo((): UpcomingClass | null => {
    const visible = classLinks.filter((l) => l.visible !== false);
    const future: UpcomingClass[] = [];
    for (const link of visible) {
      const startsAt = parseStartsAt(link.startsAt);
      if (!startsAt) continue;
      if (startsAt.getTime() >= now - 60 * 60 * 1000) {
        future.push({ link, startsAt });
      }
    }
    future.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    return future[0] ?? null;
  }, [classLinks, now]);

  const countdown = useMemo(() => {
    if (!upcoming) return null;
    const diff = upcoming.startsAt.getTime() - now;
    if (diff <= 0) return { label: 'En curso o recién iniciada', ms: 0 };
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    if (days > 0) return { label: `${days}d ${hours}h`, ms: diff };
    if (hours > 0) return { label: `${hours}h ${minutes}m`, ms: diff };
    return { label: `${minutes} min`, ms: diff };
  }, [upcoming, now]);

  const formatWhen = (date: Date) =>
    date.toLocaleString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return { upcoming, countdown, formatWhen, now };
}

export function buildClassIcs(link: CourseClassLink, startsAt: Date): string {
  const end = new Date(startsAt.getTime() + 90 * 60 * 1000);
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Seamos Genios//Curso//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${link.id}@seamosgenios.co`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(startsAt)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${link.label.replace(/[,;\\]/g, ' ')}`,
    link.topic ? `DESCRIPTION:${link.topic.replace(/[,;\\]/g, ' ')}` : '',
    link.url ? `URL:${link.url}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function downloadClassIcs(link: CourseClassLink, startsAt: Date): void {
  const ics = buildClassIcs(link, startsAt);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${link.label.replace(/\s+/g, '-').slice(0, 40)}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
