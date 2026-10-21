import {
  formatRecordingDate,
  isIcFesRecordingAreaKey,
  recordingAreaLabel,
  recordingCourseClassType,
} from '@features/recordings/lib/recordingsCatalog';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';
import { extractVacacionalClaseNumber } from './courseVacacionalClaseTitle';
import {
  academicWeekForDate,
  formatWeekHeading,
  listVacacionalAcademicWeekRanges,
} from './courseVacacionalWeek';

export type CourseRecordingSort = 'clase' | 'newest' | 'oldest' | 'area';

export type CourseRecordingFilterState = {
  classType: string;
  dateKey: string;
  weekKey: string;
  areaKey: string;
  query: string;
  favoritesOnly: boolean;
  sort: CourseRecordingSort;
};

export const EMPTY_COURSE_RECORDING_FILTERS: CourseRecordingFilterState = {
  classType: 'all',
  dateKey: 'all',
  weekKey: 'all',
  areaKey: 'all',
  query: '',
  favoritesOnly: false,
  sort: 'clase',
};

function claseSortKey(rec: SimRecording): number {
  return extractVacacionalClaseNumber(rec.title) ?? 9999;
}

type FilterOpts = {
  isFavorite?: (id: string) => boolean;
  courseId?: string;
};

export function filterCourseSimRecordings(
  recordings: SimRecording[],
  filters: CourseRecordingFilterState,
  opts?: FilterOpts,
): SimRecording[] {
  const q = filters.query.trim().toLowerCase();
  const filtered = recordings.filter((rec) => {
    if (filters.areaKey !== 'all' && rec.area !== filters.areaKey) return false;
    if (filters.classType !== 'all') {
      if (recordingCourseClassType(rec) !== filters.classType) return false;
    }
    if (filters.dateKey !== 'all') {
      if ((rec.recordedAt ?? '') !== filters.dateKey) return false;
    }
    if (filters.weekKey !== 'all' && opts?.courseId) {
      const weekNum = Number(filters.weekKey);
      const date = rec.recordedAt ?? '';
      if (!date) return false;
      const week = academicWeekForDate(opts.courseId, date);
      if (!week || week.weekNumber !== weekNum) return false;
    }
    if (filters.favoritesOnly && !opts?.isFavorite?.(rec.id)) return false;
    if (q) {
      const haystack =
        `${rec.title} ${recordingCourseClassType(rec)} ${recordingAreaLabel(rec.area)}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  return sortCourseSimRecordings(filtered, filters.sort);
}

export function sortCourseSimRecordings(
  recordings: SimRecording[],
  sort: CourseRecordingSort,
): SimRecording[] {
  const list = [...recordings];
  if (sort === 'clase') {
    return list.sort((a, b) => {
      const na = claseSortKey(a);
      const nb = claseSortKey(b);
      if (na !== nb) return na - nb;
      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
    });
  }
  if (sort === 'area') {
    return list.sort((a, b) => {
      const area = recordingAreaLabel(a.area).localeCompare(recordingAreaLabel(b.area), 'es');
      if (area !== 0) return area;
      return claseSortKey(a) - claseSortKey(b);
    });
  }
  if (sort === 'oldest') {
    return list.sort((a, b) => (a.recordedAt ?? '').localeCompare(b.recordedAt ?? ''));
  }
  if (sort === 'newest') {
    return list.sort((a, b) => (b.recordedAt ?? '').localeCompare(a.recordedAt ?? ''));
  }
  return list.sort((a, b) => claseSortKey(a) - claseSortKey(b));
}

export function buildCourseRecordingAreaOptions(
  recordings: SimRecording[],
): Array<{ value: string; label: string }> {
  const keys = [...new Set(recordings.map((r) => r.area).filter(isIcFesRecordingAreaKey))].sort(
    (a, b) => recordingAreaLabel(a).localeCompare(recordingAreaLabel(b), 'es'),
  );
  return [
    { value: 'all', label: 'Todas las áreas' },
    ...keys.map((value) => ({ value, label: recordingAreaLabel(value) })),
  ];
}

export function buildCourseRecordingClassTypeOptions(
  recordings: SimRecording[],
): Array<{ value: string; label: string }> {
  const types = [
    ...new Set(recordings.map((r) => recordingCourseClassType(r)).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, 'es'));
  return [{ value: 'all', label: 'Todos los tipos' }, ...types.map((t) => ({ value: t, label: t }))];
}

export function buildCourseRecordingWeekOptions(
  recordings: SimRecording[],
  courseId: string,
): Array<{ value: string; label: string }> {
  const weeks = listVacacionalAcademicWeekRanges(courseId);
  const withRecordings = weeks.filter((week) =>
    recordings.some(
      (rec) => rec.recordedAt && rec.recordedAt >= week.start && rec.recordedAt <= week.end,
    ),
  );
  return [
    { value: 'all', label: 'Todas las semanas' },
    ...withRecordings.map((week) => ({
      value: String(week.weekNumber),
      label: `${week.label} (${formatWeekHeading(week.start, week.end)})`,
    })),
  ];
}

export function buildCourseRecordingDateOptions(
  recordings: SimRecording[],
): Array<{ value: string; label: string }> {
  const keys = [...new Set(recordings.map((r) => r.recordedAt).filter(Boolean) as string[])].sort(
    (a, b) => b.localeCompare(a),
  );
  return [
    { value: 'all', label: 'Todas las fechas' },
    ...keys.map((value) => ({ value, label: formatRecordingDate(value) || value })),
  ];
}

export function countActiveCourseRecordingFilters(filters: CourseRecordingFilterState): number {
  let n = 0;
  if (filters.classType !== 'all') n += 1;
  if (filters.dateKey !== 'all') n += 1;
  if (filters.weekKey !== 'all') n += 1;
  if (filters.areaKey !== 'all') n += 1;
  if (filters.query.trim()) n += 1;
  if (filters.favoritesOnly) n += 1;
  return n;
}
