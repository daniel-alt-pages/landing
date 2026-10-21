'use client';

type SlowLoadHintProps = {
  visible: boolean;
  onRetry?: () => void;
  className?: string;
};

/** Mensaje + reintentar cuando la carga supera el umbral. */
export default function SlowLoadHint({ visible, onRetry, className = '' }: SlowLoadHintProps) {
  if (!visible) return null;

  return (
    <div className={`mt-4 flex flex-col items-center gap-2 text-center ${className}`.trim()}>
      <p className="text-xs opacity-70">Tarda más de lo usual. Puede ser la red o Firebase.</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15"
        >
          Reintentar
        </button>
      ) : (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15"
        >
          Recargar página
        </button>
      )}
    </div>
  );
}
