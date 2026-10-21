'use client';

import type { VacacionalCountdownParts } from '../lib/courseVacacionalEventTime';
import VacacionalFlipDigit from './VacacionalFlipDigit';
import styles from './VacacionalCountdownFlip.module.css';

type VacacionalCountdownFlipProps = {
  parts: VacacionalCountdownParts;
  className?: string;
  /** Prefijo antes del timer (ej. «Faltan»). */
  prefix?: string;
  /** Tarjetas estrechas del calendario semanal. */
  compact?: boolean;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function FlipPair({ value, label }: { value: string; label: string }) {
  const digits = value.padStart(2, '0').split('');

  return (
    <div className={styles.unit}>
      <div className={styles.pair}>
        {digits.map((d, i) => (
          <VacacionalFlipDigit key={`${label}-${i}`} digit={d} />
        ))}
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export default function VacacionalCountdownFlip({
  parts,
  className = '',
  prefix = 'Faltan',
  compact = false,
}: VacacionalCountdownFlipProps) {
  const minLabel = 'MIN';
  const secLabel = 'SEG';
  const units: Array<{ value: string; label: string }> = parts.showDays
    ? [
        { value: String(parts.days), label: 'DÍAS' },
        { value: pad2(parts.hours), label: 'H' },
        { value: pad2(parts.minutes), label: minLabel },
        { value: pad2(parts.seconds), label: secLabel },
      ]
    : parts.showHours
    ? [
        { value: pad2(parts.hours), label: 'H' },
        { value: pad2(parts.minutes), label: minLabel },
        { value: pad2(parts.seconds), label: secLabel },
      ]
    : [
        { value: pad2(parts.minutes), label: minLabel },
        { value: pad2(parts.seconds), label: secLabel },
      ];

  const ariaValue = units.map((u) => u.value).join(':');

  return (
    <div
      className={`${styles.shell} rounded-xl border border-[var(--course-border)]/55 bg-[var(--course-surface-muted)]/70 ${
        compact ? styles.compactShell : 'px-2.5 py-2 sm:px-3'
      } ${className}`}
      role="timer"
      aria-live="polite"
      aria-label={prefix ? `${prefix} ${ariaValue}` : ariaValue}
    >
      {prefix ? (
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--course-text-muted)] sm:text-[11px]">
          {prefix}
        </p>
      ) : null}
      <div className={`${styles.clock} ${styles.row}`}>
        {units.map((unit, idx) => (
          <span key={unit.label} className="flex items-end gap-1 sm:gap-1.5">
            {idx > 0 ? <span className={styles.sep}>:</span> : null}
            <FlipPair value={unit.value} label={unit.label} />
          </span>
        ))}
      </div>
    </div>
  );
}
