/**
 * Interfaz social del visor Reels («Resultados en video»). Contrato acordado con BACKEND.
 *
 * Reglas para quien implemente el adaptador:
 * - La UI nunca envía un uid: la identidad (sesión, cookie, dispositivo) la resuelve el adaptador.
 * - `getCounts` devuelve null si no hay datos; la UI entonces NO muestra números. Nunca se inventan cifras.
 * - `toggleLike` es optimista en la UI y se reconcilia con lo que devuelva; si falla, la UI revierte y oculta el contador.
 * - `listComments` devuelve solo comentarios aprobados (moderación previa).
 * - `submitComment` recibe nombre (2–40), texto (3–500) y el honeypot `website` (debe llegar vacío; si no, es bot).
 *   Responde `{ status: 'pending' }` (queda para revisión) o `{ error: 'rate_limited' | 'invalid' }`.
 * - Si cualquier llamada falla o devuelve null, la UI oculta los contadores.
 *
 * Para conectar el backend: implementar `ReelsSocialAdapter` y pasarlo con `setReelsSocialAdapter(...)`
 * antes de montar la página (p. ej. en un módulo cliente de arranque). Mientras tanto se usa `noopReelsSocial`.
 */
/**
 * Interruptor de «me gusta» y comentarios (botones y panel). En false solo se muestra «Compartir».
 * Para BACKEND: cuando exista Firebase, implementar el adaptador, registrarlo con setReelsSocialAdapter(...)
 * y cambiar este valor a true. Con el adaptador no-op la UI igual oculta los números.
 */
export const REELS_SOCIAL_ENABLED = false;

export type ReelsComment = { id: string; name: string; text: string; createdAt: number };

export type ReelsSocialAdapter = {
  getCounts(slug: string): Promise<{ likes: number; comments: number; likedByMe: boolean } | null>;
  toggleLike(slug: string): Promise<{ likes: number; liked: boolean }>;
  openComments(slug: string): void;
  /** Solo comentarios aprobados. */
  listComments(slug: string): Promise<ReelsComment[]>;
  submitComment(
    slug: string,
    input: { name: string; text: string; website?: string },
  ): Promise<{ status: 'pending' } | { error: 'rate_limited' | 'invalid' }>;
};

/** Adaptador por defecto: no hay backend. Sin números en la UI y sin envíos. */
export const noopReelsSocial: ReelsSocialAdapter & { readonly isNoop: true } = {
  isNoop: true,
  getCounts: async () => null,
  toggleLike: async () => { throw new Error('reels-social: sin backend'); },
  openComments: () => { /* sin backend */ },
  listComments: async () => [],
  submitComment: async () => ({ error: 'invalid' }),
};

let current: ReelsSocialAdapter = noopReelsSocial;

export function setReelsSocialAdapter(adapter: ReelsSocialAdapter) {
  current = adapter;
}
export function getReelsSocialAdapter(): ReelsSocialAdapter {
  return current;
}
export function isNoopAdapter(a: ReelsSocialAdapter): boolean {
  return (a as { isNoop?: boolean }).isNoop === true;
}

export const COMMENT_LIMITS = { nameMin: 2, nameMax: 40, textMin: 3, textMax: 500 } as const;

/** Validación local previa al envío (el backend valida de nuevo). */
export function validateComment(name: string, text: string): 'ok' | 'name' | 'text' {
  const n = name.trim().length;
  const t = text.trim().length;
  if (n < COMMENT_LIMITS.nameMin || n > COMMENT_LIMITS.nameMax) return 'name';
  if (t < COMMENT_LIMITS.textMin || t > COMMENT_LIMITS.textMax) return 'text';
  return 'ok';
}
