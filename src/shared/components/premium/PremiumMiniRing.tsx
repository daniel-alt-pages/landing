'use client';

type PremiumMiniRingProps = {
  value: number;
  color: string;
  size?: 'sm' | 'md';
  className?: string;
};

export default function PremiumMiniRing({
  value,
  color,
  size = 'md',
  className = '',
}: PremiumMiniRingProps) {
  const pct = Math.max(0, Math.min(100, value));
  const outer = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12';
  const inner = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';

  return (
    <div
      className={`grid place-items-center rounded-full ${outer} ${className}`}
      style={{ background: `conic-gradient(${color} ${pct}%, rgba(255,255,255,0.08) 0)` }}
      aria-hidden
    >
      <div
        className={`rounded-full bg-[#11131b] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${inner}`}
      />
    </div>
  );
}
