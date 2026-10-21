export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  totalMs: number;
};

export function getCountdownParts(targetMs: number, now = Date.now()): CountdownParts {
  const totalMs = targetMs - now;
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, totalMs: 0 };
  }
  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, expired: false, totalMs };
}

export function padCountdownUnit(value: number, digits = 2): string {
  return String(value).padStart(digits, '0');
}

export function formatCountdownCompact(parts: CountdownParts): string {
  if (parts.expired) return 'En curso';
  if (parts.days > 0) {
    return `${parts.days}d ${padCountdownUnit(parts.hours)}h ${padCountdownUnit(parts.minutes)}m ${padCountdownUnit(parts.seconds)}s`;
  }
  if (parts.hours > 0) {
    return `${parts.hours}h ${padCountdownUnit(parts.minutes)}m ${padCountdownUnit(parts.seconds)}s`;
  }
  if (parts.minutes > 0) {
    return `${parts.minutes}m ${padCountdownUnit(parts.seconds)}s`;
  }
  return `${parts.seconds}s`;
}
