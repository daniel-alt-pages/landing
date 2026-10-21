/** Textos naturales para clips de Mi resumen. */

export function formatYmdShort(ymd: string): string {
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}`;
}

export function formatWeekRangeLabel(start: string, end: string): string {
  if (start === end) return formatYmdShort(start);
  return `${formatYmdShort(start)} al ${formatYmdShort(end)}`;
}

export function pluralClases(n: number): string {
  return n === 1 ? '1 clase' : `${n} clases`;
}

export function pluralDias(n: number): string {
  return n === 1 ? '1 día' : `${n} días`;
}

export function rachaClasesSpec(best: number): string {
  if (best <= 0) return 'Si faltas a una clase, la racha se reinicia';
  return `Tu mejor racha: ${pluralClases(best)}`;
}

export function horasEnVivoSpec(
  totalHoursLabel: string,
  dayStreak: number,
  bestDayStreak: number,
): string {
  const meta = `Meta del curso: ${totalHoursLabel}`;
  if (dayStreak > 0) {
    return `${meta} · ${pluralDias(dayStreak)} seguidos con buena asistencia`;
  }
  if (bestDayStreak > 0) {
    return `${meta} · Tu mejor racha diaria: ${pluralDias(bestDayStreak)}`;
  }
  return meta;
}

export function clasesAsistidasSpec(
  present: number,
  partial: number,
  absent: number,
  upcoming: number,
  completed: number,
): string {
  if (completed <= 0) {
    return upcoming > 0
      ? `${pluralClases(upcoming)} por venir en el calendario`
      : 'Aún no hay clases cerradas';
  }
  const partes: string[] = [];
  if (present > 0) partes.push(`${present} completa${present === 1 ? '' : 's'}`);
  if (partial > 0) partes.push(`${partial} con conexión corta`);
  if (absent > 0) partes.push(`${absent} sin asistir`);
  if (upcoming > 0) partes.push(`${upcoming} por venir`);
  return partes.join(', ');
}

export function asistenciaPctSpec(
  weekLabel: string,
  weekHoursLabel: string,
  hasWeekClasses: boolean,
): string {
  if (!hasWeekClasses) return `Semana del ${weekLabel.replace('–', ' al ')}`;
  return `Semana del ${weekLabel.replace('–', ' al ')} · ${weekHoursLabel} en vivo`;
}
