import { easePointerMove, getTourClickPoint, lerpPoint } from './coordinates';

export type ShowcaseClickPhase = {
  tStart: number;
  tMoveEnd: number;
  tHoverStart: number;
  tClickStart: number;
  tClickEnd: number;
  originId: string;
  originFallback: { x: number; y: number };
  destId: string;
  destFallback: { x: number; y: number };
};

export type ShowcaseClickPhaseResult = {
  x: number;
  y: number;
  state: 'idle' | 'hover' | 'click';
  fireClick: boolean;
  targetId: string;
};

export function runClickPhase(
  elapsed: number,
  phase: ShowcaseClickPhase,
  scalerEl: HTMLElement | null,
): ShowcaseClickPhaseResult {
  const origin = getTourClickPoint(scalerEl, phase.originId, phase.originFallback, scalerEl);
  const dest = getTourClickPoint(scalerEl, phase.destId, phase.destFallback, scalerEl);

  if (elapsed < phase.tMoveEnd) {
    const p = Math.min(
      1,
      Math.max(0, (elapsed - phase.tStart) / Math.max(1, phase.tMoveEnd - phase.tStart)),
    );
    const pos = lerpPoint(origin, dest, easePointerMove(p));
    return { ...pos, state: 'idle', fireClick: false, targetId: phase.destId };
  }
  if (elapsed < phase.tHoverStart) {
    return { ...dest, state: 'idle', fireClick: false, targetId: phase.destId };
  }
  if (elapsed < phase.tClickStart) {
    return { ...dest, state: 'hover', fireClick: false, targetId: phase.destId };
  }
  if (elapsed < phase.tClickEnd) {
    return {
      ...dest,
      state: 'click',
      fireClick: true,
      targetId: phase.destId,
    };
  }
  return { ...dest, state: 'hover', fireClick: false, targetId: phase.destId };
}
