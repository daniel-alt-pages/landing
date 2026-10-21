'use client';

type SgSkeletonProps = {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
};

export default function SgSkeleton({ className = '', variant = 'rect' }: SgSkeletonProps) {
  const shape =
    variant === 'circle'
      ? 'rounded-full'
      : variant === 'text'
        ? 'h-4 rounded-md'
        : 'rounded-[var(--course-radius)]';

  return (
    <div
      className={`animate-pulse bg-[var(--course-border)] motion-reduce:animate-none ${shape} ${className}`}
      aria-hidden
    />
  );
}

export function SgSkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div
      className="space-y-3 rounded-[var(--course-radius-lg)] border border-[var(--course-border)] bg-[var(--course-surface)] p-5"
      aria-busy="true"
      aria-label="Cargando"
    >
      <SgSkeleton className="h-6 w-2/5" />
      {Array.from({ length: lines }).map((_, i) => (
        <SgSkeleton key={i} variant="text" className={i === lines - 1 ? 'w-3/5' : 'w-full'} />
      ))}
    </div>
  );
}
