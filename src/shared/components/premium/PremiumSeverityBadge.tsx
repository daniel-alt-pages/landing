'use client';

export type PremiumSeverity = 'success' | 'warning' | 'danger' | 'info' | 'moderate' | 'elevated' | 'urgente';

const SEVERITY_CLASS: Record<PremiumSeverity, string> = {
  success: 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/35',
  warning: 'bg-amber-500/20 text-amber-100 ring-amber-400/35',
  danger: 'bg-red-500/20 text-red-200 ring-red-400/35',
  info: 'bg-blue-500/20 text-blue-200 ring-blue-400/35',
  moderate: 'bg-amber-500/20 text-amber-100 ring-amber-400/35',
  elevated: 'bg-orange-500/20 text-orange-200 ring-orange-400/35',
  urgente: 'bg-red-500/20 text-red-200 ring-red-400/35',
};

type PremiumSeverityBadgeProps = {
  severity: PremiumSeverity;
  label: string;
  className?: string;
};

export default function PremiumSeverityBadge({
  severity,
  label,
  className = '',
}: PremiumSeverityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${SEVERITY_CLASS[severity]} ${className}`}
    >
      {label}
    </span>
  );
}
