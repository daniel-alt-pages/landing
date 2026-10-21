'use client';

import { icfesAreaStyle } from '@features/coordinador/lib/icfesAreaColors';

type PremiumSubjectChipProps = {
  area: string;
  className?: string;
};

export default function PremiumSubjectChip({ area, className = '' }: PremiumSubjectChipProps) {
  const style = icfesAreaStyle(area);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
      style={{
        color: style.textOnDark,
        borderColor: style.border,
        backgroundColor: style.bg,
      }}
    >
      {area}
    </span>
  );
}
