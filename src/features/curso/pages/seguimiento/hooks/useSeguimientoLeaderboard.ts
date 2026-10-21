'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CourseCalendarEventDto } from '../../../lib/courseCalendarTypes';
import { buildCoursePersonKey, listCoursePersonKeyCandidates } from '../../../lib/courseAccessKeys';
import { buildIdentityFromSessionAsync } from '../../../lib/courseEntitlements';
import {
  buildAllDimensionRankings,
  ranksByPerson,
  type AttendanceRankingSort,
} from '../../../lib/courseAttendanceRanking';
import { peekCachedLeaderboardReport } from '../../../lib/courseAttendanceReportCache';
import {
  fetchCourseAttendanceReport,
  type CourseAttendanceReport,
} from '../../../lib/courseAttendanceReport';

type UseSeguimientoLeaderboardOptions = {
  calendarEvents?: CourseCalendarEventDto[];
  attendanceVersion?: number;
};

export function useSeguimientoLeaderboard(
  courseId: string,
  enabled: boolean,
  options?: UseSeguimientoLeaderboardOptions,
) {
  const cachedPeek = useMemo(
    () =>
      enabled && courseId
        ? peekCachedLeaderboardReport(courseId, options?.attendanceVersion)
        : null,
    [courseId, enabled, options?.attendanceVersion],
  );

  const [report, setReport] = useState<CourseAttendanceReport | null>(
    () => cachedPeek,
  );
  const [loading, setLoading] = useState(enabled && !cachedPeek);
  const [error, setError] = useState<string | null>(null);
  const [currentPersonKey, setCurrentPersonKey] = useState<string | null>(null);
  const [personKeyCandidates, setPersonKeyCandidates] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled || !courseId) {
      setLoading(false);
      return;
    }

    if (cachedPeek) {
      setReport(cachedPeek);
      setLoading(false);
    }

    let cancelled = false;

    void (async () => {
      if (!cachedPeek) {
        setLoading(true);
      }
      setError(null);
      try {
        const identity = await buildIdentityFromSessionAsync();
        const personKey = buildCoursePersonKey(identity);
        const candidates = listCoursePersonKeyCandidates(identity);
        if (!cancelled) {
          setCurrentPersonKey(personKey);
          setPersonKeyCandidates(candidates);
        }

        // ponytail: roster completo para calcular puesto real del estudiante (barra "Tú" al final).
        const data = await fetchCourseAttendanceReport(courseId, {
          calendarEvents: options?.calendarEvents,
          attendanceVersion: options?.attendanceVersion,
        });
        if (cancelled) return;

        if (!data.rows.length) {
          setReport(data);
          setError('Ranking disponible cuando haya datos de asistencia.');
          return;
        }

        setReport(data);
        setError(null);
      } catch {
        if (!cancelled && !cachedPeek) {
          setReport(null);
          setError('No pudimos cargar el ranking.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    courseId,
    enabled,
    cachedPeek,
    options?.calendarEvents,
    options?.attendanceVersion,
  ]);

  const rankings = useMemo(() => {
    if (!report?.rows.length) return null;
    return buildAllDimensionRankings(report.rows, report.weekSchedules, report.excusas);
  }, [report]);

  const ranksMap = useMemo(() => {
    if (!rankings) return new Map();
    return ranksByPerson(rankings);
  }, [rankings]);

  const rankingForSort = (sort: AttendanceRankingSort) => {
    if (!rankings) return [];
    const list = rankings[sort];
    if (!currentPersonKey) return list;
    return list.map((e) => ({ ...e, isCurrentUser: e.personKey === currentPersonKey }));
  };

  return {
    report,
    rankings,
    ranksMap,
    rankingForSort,
    loading,
    error,
    currentPersonKey,
    personKeyCandidates,
  };
}
