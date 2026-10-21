import { getNivelDesempeno, NIVELES_DESEMPENO } from '@/lib/performanceLevels';

export function showcaseGetNivel(puntaje: number) {
  if (puntaje >= 400) {
    return { text: 'SUPERIOR', color: 'text-emerald-400', icon: '⭐' };
  }
  if (puntaje >= 325) return { text: 'ALTO', color: 'text-blue-400', icon: '✓' };
  if (puntaje >= 250) return { text: 'MEDIO', color: 'text-amber-400', icon: '◆' };
  return { text: 'EN DESARROLLO', color: 'text-red-400', icon: '!' };
}

export function showcaseGetNivelMateriaMeta(puntaje: number) {
  if (puntaje >= 80)
    return {
      label: 'Nivel Sobresaliente',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
  if (puntaje >= 68)
    return { label: 'Nivel Avanzado', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  if (puntaje >= 55)
    return { label: 'Nivel Competente', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  if (puntaje >= 40)
    return { label: 'Nivel Básico', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
  return { label: 'Nivel Inicial', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
}

export function showcaseGetInsight(puntaje: number) {
  if (puntaje >= 75) {
    return {
      text: 'Desempeño sobresaliente. Enfócate en los detalles avanzados para llegar al máximo.',
      bg: 'bg-emerald-500/10',
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
    };
  }
  if (puntaje >= 60) {
    return {
      text: 'Buen nivel. Refuerza los temas donde tienes dudas para seguir subiendo.',
      bg: 'bg-blue-500/10',
      color: 'text-blue-400',
      border: 'border-blue-500/20',
    };
  }
  if (puntaje >= 45) {
    return {
      text: 'Avance moderado. Practica más los fundamentos para mejorar tu puntaje.',
      bg: 'bg-amber-500/10',
      color: 'text-amber-400',
      border: 'border-amber-500/20',
    };
  }
  return {
    text: 'Necesita refuerzo. Dedica tiempo extra a estudiar esta área desde los conceptos básicos.',
    bg: 'bg-rose-500/10',
    color: 'text-rose-400',
    border: 'border-rose-500/20',
  };
}

export function showcaseGetScaleForMateria(materiaKey: string) {
  const cfg = NIVELES_DESEMPENO[materiaKey.toLowerCase()];
  return cfg?.niveles ?? null;
}

export { getNivelDesempeno };
