'use client';

import { useEffect, useMemo, useState } from 'react';
import SgBrandLogo, { SG_LOGO_URL } from '@/components/brand/SgBrandLogo';
import './sg-branded-loading.css';

export { SG_LOGO_URL };

export function readStudentFirstName(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('student_data');
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      informacion_personal?: { nombres?: string; nombre?: string };
    };
    const nombres =
      data?.informacion_personal?.nombres ||
      data?.informacion_personal?.nombre ||
      '';
    const first = nombres.trim().split(' ')[0] || '';
    if (!first) return null;
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  } catch {
    return null;
  }
}

export function buildPersonalizedLoadingMessage(firstName?: string | null): string {
  if (firstName) {
    return `Cargando experiencia personalizada para ti, ${firstName}`;
  }
  return 'Cargando experiencia personalizada';
}

function useSimulatedProgress(target = 92, intervalMs = 180) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    const interval = window.setInterval(() => {
      const remaining = target - current;
      const step = Math.max(1, Math.floor(remaining * 0.12));
      current = Math.min(target, current + step);
      setProgress(current);
      if (current >= target) window.clearInterval(interval);
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [intervalMs, target]);

  return progress;
}

export type SgBrandedLoadingLogoTone = 'hero' | 'clean';

export type SgBrandedLoadingExperienceProps = {
  message?: string;
  personalize?: boolean;
  variant?: 'fullscreen' | 'embedded' | 'compact';
  showPercent?: boolean;
  /** `hero`: brillo completo en pantallas fullscreen. `clean`: logo simple sin halo duplicado. */
  logoTone?: SgBrandedLoadingLogoTone;
  className?: string;
};

const LOGO_BY_VARIANT = {
  fullscreen: 'hero',
  embedded: 'xl',
  compact: 'lg',
} as const;

const GAP_BY_VARIANT = {
  fullscreen: 'gap-10 sm:gap-12',
  embedded: 'gap-8 sm:gap-9',
  compact: 'gap-6',
} as const;

const BAR_MAX_BY_VARIANT = {
  fullscreen: 'max-w-sm sm:max-w-md',
  embedded: 'max-w-xs sm:max-w-sm',
  compact: 'max-w-[220px] sm:max-w-xs',
} as const;

export default function SgBrandedLoadingExperience({
  message,
  personalize = true,
  variant = 'fullscreen',
  showPercent = variant === 'fullscreen',
  logoTone,
  className = '',
}: SgBrandedLoadingExperienceProps) {
  const [firstName, setFirstName] = useState<string | null>(null);
  const progress = useSimulatedProgress();

  useEffect(() => {
    if (!personalize || message) return;
    setFirstName(readStudentFirstName());
  }, [message, personalize]);

  const resolvedMessage = useMemo(
    () => message ?? buildPersonalizedLoadingMessage(personalize ? firstName : null),
    [firstName, message, personalize],
  );

  const logoSize = LOGO_BY_VARIANT[variant];
  const gap = GAP_BY_VARIANT[variant];
  const barMax = BAR_MAX_BY_VARIANT[variant];
  const resolvedLogoTone: SgBrandedLoadingLogoTone =
    logoTone ?? (variant === 'fullscreen' ? 'hero' : 'clean');
  const isHeroLogo = resolvedLogoTone === 'hero';

  const body = (
    <div className={`sg-branded-loading__content ${gap} flex flex-col items-center`}>
      <div
        className={`sg-branded-loading__logo-stage${
          isHeroLogo ? '' : ' sg-branded-loading__logo-stage--clean'
        }`}
      >
        {isHeroLogo ? <span aria-hidden className="sg-branded-loading__logo-glow" /> : null}
        <SgBrandLogo
          size={logoSize}
          ambientGlow={isHeroLogo}
          prominentShine={isHeroLogo}
          relaxed={isHeroLogo}
        />
      </div>

      <div className={`w-full ${barMax} space-y-3`}>
        <div
          className="sg-branded-loading__progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="sg-branded-loading__progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-end justify-between gap-3">
          <p
            className={`sg-branded-loading__message text-left leading-snug ${
              variant === 'compact' ? 'text-[10px]' : 'text-[11px] sm:text-xs'
            }`}
          >
            {resolvedMessage}
            <span aria-hidden className="inline-flex ml-0.5">
              <span className="sg-branded-loading__dot">.</span>
              <span className="sg-branded-loading__dot">.</span>
              <span className="sg-branded-loading__dot">.</span>
            </span>
          </p>
          {showPercent ? (
            <p className="shrink-0 text-[11px] tabular-nums" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {progress}%
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  const shellClass = [
    'sg-branded-loading',
    variant === 'fullscreen' ? 'sg-branded-loading--fullscreen' : '',
    variant === 'fullscreen'
      ? 'flex flex-col items-center justify-center px-6 py-10'
      : 'flex flex-col items-center justify-center px-4 py-8',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={shellClass}
      role="status"
      aria-live="polite"
      aria-label={resolvedMessage}
    >
      {variant !== 'compact' ? (
        <>
          <span aria-hidden className="sg-branded-loading__ambient" />
          <span aria-hidden className="sg-branded-loading__grid" />
        </>
      ) : null}
      {body}
    </div>
  );
}
