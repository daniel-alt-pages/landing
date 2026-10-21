'use client';

import { BadgeDollarSign, GraduationCap, PanelsTopLeft, Users } from 'lucide-react';
import { displaySerif } from '../content';
import { landingChrome } from '../utilidades/landingChrome';

const CARDS = [
  {
    chip: 'Panel estudiante',
    title: 'Resultados y ruta',
    text: 'Puntaje, áreas, ranking y grabaciones para entender dónde reforzar.',
    icon: GraduationCap,
  },
  {
    chip: 'Coordinación',
    title: 'Lectura por curso',
    text: 'Comparativas, histórico y alertas para priorizar refuerzos con evidencia.',
    icon: Users,
  },
  {
    chip: 'Plataforma',
    title: 'Misma experiencia',
    text: 'Simulacro tipo ICFES, retro en vivo y archivo — individual o institución.',
    icon: PanelsTopLeft,
  },
  {
    chip: 'Cotización',
    title: 'COP transparente',
    text: 'Calcula por grados y estudiantes; coordina por WhatsApp sin planes opacos.',
    icon: BadgeDollarSign,
  },
] as const;

export function CapabilityCards({ isLightLanding }: { isLightLanding: boolean }) {
  const chrome = landingChrome(isLightLanding);

  return (
    <div className="mx-auto mb-12 w-full max-w-[min(80rem,100%)]">
      <p className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>Plataforma</p>
      <h2 className={`${displaySerif} mt-3 max-w-xl text-[clamp(1.6rem,3vw,2.25rem)] font-bold tracking-[-0.03em] ${chrome.title}`}>
        Cuatro capas, un solo flujo.
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <article key={card.title} className={`eg-card p-5 ${chrome.card}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>{card.chip}</p>
            <div className="mt-4 flex items-start gap-3">
              <card.icon className={`mt-0.5 h-5 w-5 shrink-0 ${chrome.title}`} aria-hidden />
              <div>
                <h3 className={`text-[17px] font-semibold tracking-[-0.02em] ${chrome.title}`}>{card.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${chrome.muted}`}>{card.text}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
