'use client';

import { bootstrapDemoStudentSession } from '@/app/demo/_shared/bootstrapDemoStudentSession';

let didBootstrap = false;

/** Corre antes que efectos del dashboard (evita leer simulacro_selected viejo). */
export default function DemoStudentSessionInit() {
  if (!didBootstrap) {
    bootstrapDemoStudentSession();
    didBootstrap = true;
  }
  return null;
}
