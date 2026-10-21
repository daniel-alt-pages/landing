export const RUTAS = {
  inicio: '/landing',
  plataforma: '/landing/plataforma',
  instituciones: '/landing/instituciones',
  resultados: '/landing/resultados',
  nosotros: '/landing/nosotros',
  politica: '/landing/politica-de-datos',
  gracias: '/landing/gracias',
} as const;

export type Interes = 'reunion' | 'simulacro';

/** Ancla del formulario. Cada pantalla de contenido termina con el cierre que la contiene. */
export function contactoHref(interes: Interes = 'reunion') {
  return `#solicitar-${interes}`;
}

export function interesFromHash(hash: string): Interes | null {
  if (hash === '#solicitar-simulacro') return 'simulacro';
  if (hash === '#solicitar-reunion') return 'reunion';
  return null;
}
