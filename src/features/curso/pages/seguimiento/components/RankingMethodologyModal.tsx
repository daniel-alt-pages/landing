'use client';

import { useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  Flame,
  Globe2,
  Gift,
  Info,
  BookOpen,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import CourseMobileBottomSheet from '../../../components/CourseMobileBottomSheet';
import {
  MAX_DAILY_STREAK_BONUS,
  MIN_MINUTES_PER_CLASS_FOR_STREAK,
  POINTS_PER_MINUTE,
  STREAK_MULTIPLIER_DAY_THRESHOLD,
} from '../../../lib/courseAttendancePoints';

type RankingMethodologyModalProps = {
  onClose: () => void;
};

const POINT_RULES = [
  {
    icon: Clock,
    name: 'Minutos en vivo',
    pts: `+${POINTS_PER_MINUTE} pt/min`,
    detail: 'Un punto por cada minuto dentro del Meet según las actas de asistencia.',
  },
  {
    icon: Zap,
    name: 'Multiplicador 10+ días',
    pts: '2× minutos',
    detail: `Tras ${STREAK_MULTIPLIER_DAY_THRESHOLD} días perfectos consecutivos (sin perder la racha), cada minuto suma el doble mientras mantengas la racha.`,
  },
  {
    icon: CalendarDays,
    name: 'Racha diaria perfecta',
    pts: 'Día 1=1, Día 2=2…',
    detail: `Cada día con todas las clases cumplidas (≥ ${MIN_MINUTES_PER_CLASS_FOR_STREAK} min por clase) suma puntos iguales a tu racha actual (máx. +${MAX_DAILY_STREAK_BONUS} pts/día).`,
  },
  {
    icon: Flame,
    name: 'Pérdida de racha',
    pts: 'Reinicio',
    detail: `Si falta un día o no cumples ${MIN_MINUTES_PER_CLASS_FOR_STREAK} min en cada clase del día, la racha vuelve a cero y el multiplicador se desactiva hasta volver a superar los ${STREAK_MULTIPLIER_DAY_THRESHOLD} días.`,
  },
  {
    icon: BookOpen,
    name: 'Simulacro SG11-20',
    pts: '+ puntaje ICFES',
    detail:
      'Solo estudiantes del vacacional: se suma el puntaje global del simulacro SG11-20 (escala ICFES). Si no presentó el simulacro, suma 0 pts.',
  },
] as const;

export default function RankingMethodologyModal({ onClose }: RankingMethodologyModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const border = 'border-[var(--course-border)]';
  const muted = 'text-[var(--course-text-muted)]';
  const text = 'text-[var(--course-text)]';

  return (
    <CourseMobileBottomSheet
      onClose={onClose}
      ariaLabelledBy="ranking-methodology-title"
      reserveBottomNav
      panelClassName={`border ${border} bg-[var(--course-surface)] min-h-0`}
    >
      <header className={`flex items-start gap-3 border-b ${border} px-4 py-3 shrink-0 sm:px-5`}>
        <div className="min-w-0 flex-1">
          <h3
            id="ranking-methodology-title"
            className={`flex items-center gap-2 text-base font-bold ${text}`}
          >
            <Trophy className="h-4 w-4 text-[var(--course-accent)]" aria-hidden />
            Cómo se calcula tu puesto
          </h3>
          <p className={`mt-0.5 text-xs ${muted}`}>
            Puntos acumulativos · Curso Vacacional
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`shrink-0 rounded-lg p-2 ${muted} hover:bg-[var(--course-surface-muted)]`}
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
        <section>
          <p className={`text-[11px] font-bold uppercase tracking-wide ${muted}`}>
            Tabla de puntos
          </p>
          <ul className="mt-2 space-y-2">
            {POINT_RULES.map((rule) => (
              <li
                key={rule.name}
                className={`flex items-start gap-2.5 rounded-xl border ${border} bg-[var(--course-surface-muted)]/40 px-3 py-2.5`}
              >
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--course-accent)]/10 text-[var(--course-accent)]">
                  <rule.icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${text}`}>
                    {rule.name}
                    <span className="ml-1.5 rounded-full bg-[var(--course-accent)]/10 px-1.5 py-0.5 text-[9px] font-black text-[var(--course-accent)]">
                      {rule.pts}
                    </span>
                  </p>
                  <p className={`mt-0.5 text-[11px] leading-relaxed ${muted}`}>{rule.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={`rounded-xl border ${border} px-3 py-3`}>
          <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${muted}`}>
            <Gift className="h-3.5 w-3.5" aria-hidden />
            Premios y ranking
          </p>
          <p className={`mt-2 text-[11px] leading-relaxed ${muted}`}>
            No hay techo de puntos: todo suma. Al final del curso,{' '}
            <strong className={text}>solo el #1 del ranking global</strong> recibirá el premio según
            puntos acumulados. El ranking semanal muestra quién lidera cada semana con la misma
            lógica.
          </p>
        </section>

        <section className={`rounded-xl border ${border} px-3 py-3`}>
          <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${muted}`}>
            <Globe2 className="h-3.5 w-3.5" aria-hidden />
            Global vs. semanal
          </p>
          <p className={`mt-2 text-[11px] leading-relaxed ${muted}`}>
            El ranking global acumula desde el inicio del vacacional. El semanal solo cuenta las
            clases de la semana elegida. Si empatan en puntos, gana quien tenga más minutos en
            vivo. El simulacro SG11-20 suma su puntaje global ICFES al ranking general.
          </p>
        </section>

        <section className={`rounded-xl border ${border} px-3 py-3`}>
          <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${muted}`}>
            <Info className="h-3.5 w-3.5" aria-hidden />
            Variabilidad de puntos
          </p>
          <p className={`mt-2 text-[11px] leading-relaxed ${muted}`}>
            Tus puntos actuales pueden variar en el futuro debido a ajustes en la lógica del
            sistema. Cualquier cambio se aplicará de forma uniforme para todos los participantes.
          </p>
        </section>
      </div>
    </CourseMobileBottomSheet>
  );
}
