import {
  DEMO_MASK,
  DEMO_STUDENT_ID,
  DEMO_STUDENT_DEFAULT_SIM,
  DEMO_STUDENT_SIMS,
} from '@/app/demo/_shared/demoPrivacy';
import { clearDevRuntimeCaches } from '@features/simulacro/lib/firestoreService';

/** Limpia cachés de simulacros/resultados y fija sesión demo estudiante local. */
export function bootstrapDemoStudentSession(): void {
  if (typeof window === 'undefined') return;

  const studentId = DEMO_STUDENT_ID;
  const bootstrappedKey = 'demo_student_bootstrapped';
  const alreadyBootstrapped = sessionStorage.getItem(bootstrappedKey) === studentId;
  if (!alreadyBootstrapped) {
    clearDevRuntimeCaches();
  }

  try {
    sessionStorage.setItem('demo_mode', '1');
    sessionStorage.setItem(bootstrappedKey, studentId);
    localStorage.setItem('student_id', studentId);
    localStorage.setItem('student_name', `${DEMO_MASK} ${DEMO_MASK}`);

    const selected = String(localStorage.getItem('simulacro_selected') || '').trim();
    const allowed = new Set(DEMO_STUDENT_SIMS as readonly string[]);
    if (!selected || !allowed.has(selected) || selected.startsWith('SG11')) {
      localStorage.setItem('simulacro_selected', DEMO_STUDENT_DEFAULT_SIM);
    }

    if (!alreadyBootstrapped) {
      localStorage.removeItem('student_data');
    }

    const keysToRemove: string[] = [];
    if (!alreadyBootstrapped) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (
          key.startsWith(`results_${studentId}_SG11`) ||
          key.startsWith('allStudents_SG11') ||
          key.startsWith(`studentSims_${studentId}`) ||
          key.startsWith('ranking_SG11') ||
          key.includes('1043658548') ||
          key.includes('1043146435')
        ) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* private mode */
  }
}

export function isAllowedDemoStudentSim(simId: string): boolean {
  return (DEMO_STUDENT_SIMS as readonly string[]).includes(simId);
}
