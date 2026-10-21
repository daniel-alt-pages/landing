/** Altura publicada por RecordingsAreaNav para elevar el nav principal del panel. */
export const RECORDINGS_AREA_NAV_LIFT_VAR = '--recordings-area-nav-lift';

export function setRecordingsAreaNavLift(px: number) {
  document.documentElement.style.setProperty(RECORDINGS_AREA_NAV_LIFT_VAR, `${Math.max(0, Math.round(px))}px`);
}

export function clearRecordingsAreaNavLift() {
  document.documentElement.style.removeProperty(RECORDINGS_AREA_NAV_LIFT_VAR);
}
