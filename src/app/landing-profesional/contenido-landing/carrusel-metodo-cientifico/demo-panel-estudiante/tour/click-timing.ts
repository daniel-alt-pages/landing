/** Clic demo — más lento para seguir el recorrido en landing. */
export function showcaseClickPhaseTimes(tStart: number) {
  const moveMs = 720;
  const settleMs = 80;
  const hoverMs = 220;
  const clickMs = 120;
  const gapMs = 120;

  const tMoveEnd = tStart + moveMs;
  const tHoverStart = tMoveEnd + settleMs;
  const tClickStart = tHoverStart + hoverMs;
  const tClickEnd = tClickStart + clickMs;

  return { tStart, tMoveEnd, tHoverStart, tClickStart, tClickEnd, tEnd: tClickEnd + gapMs };
}
