import {
  PREVIEW_ACTIVE_SIM,
  PREVIEW_STUDENT_APELLIDOS,
  PREVIEW_STUDENT_ID,
  PREVIEW_STUDENT_NOMBRES,
} from '../_data/seeds/constants';

/** Sesión mock para showcase landing (sin auth ni Firestore). */
export function bootstrapPreviewStudentSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('student_id', PREVIEW_STUDENT_ID);
    localStorage.setItem('student_name', `${PREVIEW_STUDENT_NOMBRES} ${PREVIEW_STUDENT_APELLIDOS}`);
    if (!localStorage.getItem('simulacro_selected')) {
      localStorage.setItem('simulacro_selected', PREVIEW_ACTIVE_SIM);
    }
  } catch {
    /* private mode */
  }
}
