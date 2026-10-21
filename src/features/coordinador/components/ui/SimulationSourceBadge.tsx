import { formatSimulationLabel } from '@shared/lib/studentDisplay';
import classNames from 'classnames';

export default function SimulationSourceBadge({
    simId,
    className,
    compact = false,
}: {
    simId?: string;
    className?: string;
    compact?: boolean;
}) {
    if (!simId) return null;

    return (
        <span
            className={classNames(
                'inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide',
                compact
                    ? 'px-2 py-0.5 text-[9px] border-indigo-400/25 bg-indigo-500/10 text-indigo-200/90'
                    : 'px-2.5 py-1 text-[10px] border-indigo-400/30 bg-indigo-500/12 text-indigo-200',
                className,
            )}
            title={`Los puntajes y respuestas provienen exclusivamente de ${simId}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" aria-hidden />
            {compact ? formatSimulationLabel(simId) : `Datos del ${formatSimulationLabel(simId)}`}
        </span>
    );
}
