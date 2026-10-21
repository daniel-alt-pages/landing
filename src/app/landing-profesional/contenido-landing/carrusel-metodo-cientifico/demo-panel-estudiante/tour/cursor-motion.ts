/** Micro-movimiento en hover para que el puntero se sienta vivo (sin desalinear clics). */
export function applyShowcaseCursorWobble(
  x: number,
  y: number,
  elapsed: number,
  state: 'idle' | 'hover' | 'click' | 'hidden',
) {
  if (state === 'hidden' || state === 'click') return { x, y };
  if (state !== 'hover') return { x, y };
  const t = elapsed * 0.0012;
  return {
    x: x + Math.sin(t * 2.1) * 1.2,
    y: y + Math.cos(t * 1.7) * 1.2,
  };
}
