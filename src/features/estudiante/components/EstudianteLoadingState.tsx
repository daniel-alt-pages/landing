'use client';

import { useSlowLoadHint } from '@shared/hooks/useSlowLoadHint';
import SlowLoadHint from '@shared/components/SlowLoadHint';
import SgBrandedLoadingExperience from '@/components/SgBrandedLoadingExperience';

export default function EstudianteLoadingState({
  message = 'Cargando…',
  fullScreen = false,
  slowAfterMs = 12_000,
  onRetry,
}: {
  message?: string;
  fullScreen?: boolean;
  slowAfterMs?: number;
  onRetry?: () => void;
}) {
  const slow = useSlowLoadHint(true, slowAfterMs);

  const loading = (
    <SgBrandedLoadingExperience
      message={message}
      personalize={false}
      variant={fullScreen ? 'fullscreen' : 'embedded'}
      showPercent={fullScreen}
    />
  );

  return (
    <div
      className={
        fullScreen
          ? 'relative min-h-screen bg-[#07080d]'
          : 'relative min-h-[40vh] rounded-3xl bg-[#07080d]'
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {loading}
      <div className="absolute left-1/2 top-[calc(50%+7.5rem)] -translate-x-1/2">
        <SlowLoadHint visible={slow} onRetry={onRetry} className="text-white" />
      </div>
    </div>
  );
}
