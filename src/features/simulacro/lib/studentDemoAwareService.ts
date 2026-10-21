/**
 * Fachada estudiante: en `/demo/estudiante/*` usa mock local aislado;
 * en producción delega a `firestoreService`.
 */
'use client';

import { isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';

export const DEMO_STUDENT_STORAGE_KEYS = {
  studentId: 'demo_student_id',
  studentName: 'demo_student_name',
  selectedSimulation: 'demo_selected_simulation',
} as const;

export function isDemoStudentContext(pathname?: string | null): boolean {
  if (typeof window === 'undefined') return false;
  const path = pathname ?? window.location.pathname;
  return isDemoEstudianteRoute(path);
}

type StudentDataModule = typeof import('@features/simulacro/lib/firestoreService');

let cachedDemoModule: Promise<StudentDataModule> | null = null;
let cachedProdModule: Promise<StudentDataModule> | null = null;

export async function loadStudentDataModule(pathname?: string | null): Promise<StudentDataModule> {
  if (isDemoStudentContext(pathname)) {
    if (!cachedDemoModule) {
      cachedDemoModule = import(
        '@/app/landing-profesional/preview-paneles/_data/firestoreMock'
      ).then((mod) => mod as unknown as StudentDataModule);
    }
    return cachedDemoModule;
  }
  if (!cachedProdModule) {
    cachedProdModule = import('@features/simulacro/lib/firestoreService');
  }
  return cachedProdModule;
}

/** Inicializa storage demo aislado (no contamina keys productivas). */
export function bootstrapDemoStudentSession(defaultStudentId: string, defaultName: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('demo_mode', '1');
    localStorage.setItem('student_id', defaultStudentId);
    localStorage.setItem('student_name', defaultName);
    localStorage.setItem(DEMO_STUDENT_STORAGE_KEYS.studentId, defaultStudentId);
    localStorage.setItem(DEMO_STUDENT_STORAGE_KEYS.studentName, defaultName);
  } catch {
    /* private mode */
  }
}

export function clearDemoStudentSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('demo_mode');
    localStorage.removeItem(DEMO_STUDENT_STORAGE_KEYS.studentId);
    localStorage.removeItem(DEMO_STUDENT_STORAGE_KEYS.studentName);
    localStorage.removeItem(DEMO_STUDENT_STORAGE_KEYS.selectedSimulation);
  } catch {
    /* ignore */
  }
}
