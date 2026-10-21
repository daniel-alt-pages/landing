'use client';

import { Clock, Wrench } from 'lucide-react';
import { useCountdown } from '@shared/hooks/useCountdown';
import PremiumGlassCard from './PremiumGlassCard';
import PremiumPanelShell from './PremiumPanelShell';

type PremiumMaintenanceScreenProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  /** Show countdown to target date. */
  showCountdown?: boolean;
  targetDate?: Date;
  footerNote?: string;
  supportHint?: string;
};

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:h-[4.5rem] sm:w-[4.5rem]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent" />
        <span className="relative font-mono text-2xl font-black tabular-nums tracking-tight text-white sm:text-[1.75rem]">
          {value}
        </span>
      </div>
      <span className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
        {label}
      </span>
    </div>
  );
}

export default function PremiumMaintenanceScreen({
  title = 'Sistema en Mantenimiento',
  subtitle = 'Estamos optimizando la plataforma para brindarte una mejor experiencia. El acceso estará deshabilitado temporalmente.',
  eyebrow = 'Seamos Genios',
  showCountdown = false,
  targetDate,
  footerNote,
  supportHint,
}: PremiumMaintenanceScreenProps) {
  const countdown = useCountdown(showCountdown && targetDate ? targetDate : null);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <PremiumPanelShell centered>
      <div className="mx-auto w-full max-w-[480px] text-center">
        <PremiumGlassCard padding="lg" className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-indigo-400/25 bg-indigo-500/10 shadow-[0_0_60px_rgba(99,102,241,0.18)]">
            <Wrench className="h-11 w-11 text-indigo-300/90" strokeWidth={1.5} aria-hidden />
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-indigo-300/75">
            {eyebrow}
          </p>

          <h1 className="mt-3 text-[1.65rem] font-black leading-tight tracking-tight text-white sm:text-[1.85rem]">
            {title}
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-white/55">{subtitle}</p>

          {showCountdown && targetDate ? (
            <div className="mt-8">
              <p className="mb-4 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                Tiempo estimado de restauración
              </p>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <CountdownUnit value={pad(countdown.hours)} label="Horas" />
                <span className="mb-6 text-2xl font-black text-indigo-400/50">:</span>
                <CountdownUnit value={pad(countdown.minutes)} label="Min" />
                <span className="mb-6 text-2xl font-black text-indigo-400/50">:</span>
                <CountdownUnit value={pad(countdown.seconds)} label="Seg" />
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-8 max-w-xs">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full w-[45%] rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 animate-pulse"
                />
              </div>
            </div>
          )}

          {supportHint ? (
            <p className="mt-6 text-xs text-white/40">{supportHint}</p>
          ) : null}

          <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <p className="mt-5 text-[11px] leading-relaxed text-white/30">
            {footerNote ?? 'Volveremos mejor que nunca.'}
          </p>
        </PremiumGlassCard>
      </div>
    </PremiumPanelShell>
  );
}
