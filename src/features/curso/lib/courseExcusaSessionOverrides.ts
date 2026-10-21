import type { CourseRecentSession } from '../types/courseTypes';
import { formatMinutesAsDuration } from './courseMeetAttendance';

export type ExcusaSessionOverride = {
  manifestSessionId: string;
  minutes: number;
  status: 'partial' | 'present';
  countTowardPoints: false;
};

export type ExcusaSessionOverrideEntry = {
  emailLower: string;
  displayName?: string;
  excusaId?: string;
  date: string;
  sessions: ExcusaSessionOverride[];
};

export type ExcusaSessionOverridesManifest = {
  courseId: string;
  version: number;
  targetDate?: string;
  description?: string;
  entries: ExcusaSessionOverrideEntry[];
};

export function excusaSessionOverridesForEmail(
  manifest: ExcusaSessionOverridesManifest | null | undefined,
  emailLower?: string,
): Map<string, ExcusaSessionOverride> {
  const email = (emailLower || '').trim().toLowerCase();
  if (!email || !manifest?.entries?.length) return new Map();
  const entry = manifest.entries.find((e) => e.emailLower === email);
  if (!entry?.sessions?.length) return new Map();
  return new Map(entry.sessions.map((s) => [s.manifestSessionId, s] as const));
}

export function applyExcusaSessionOverrideToRow(
  override: ExcusaSessionOverride,
): Pick<
  CourseRecentSession,
  'attended' | 'minutes' | 'status' | 'joinedAt' | 'leftAt' | 'durationLabel' | 'countTowardPoints'
> {
  return {
    attended: true,
    minutes: override.minutes,
    status: override.status,
    joinedAt: undefined,
    leftAt: undefined,
    durationLabel: formatMinutesAsDuration(override.minutes),
    countTowardPoints: false,
  };
}
