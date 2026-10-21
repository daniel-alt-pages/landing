'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSimRecordings } from '@features/recordings/hooks/useSimRecordings';
import {
  canAccessSimRecordingsCatalog,
  isPaidRecordingsContext,
} from '@features/recordings/lib/recordingsAccess';
import { useEstudianteSession } from '@features/estudiante/hooks/useEstudianteSession';
import {
  readStudentSelectedSimulacro,
  STUDENT_SIMULATION_EVENT,
} from '@features/estudiante/lib/studentNavPolicy';

const SIM_STORAGE_KEY = 'simulacro_selected';

/** Tab «Clases» solo si el simulacro activo publicó catálogo y el doc está en allowlist (si hay). */
export function useStudentClasesNavVisible() {
  const pathname = usePathname();
  const paidContext = isPaidRecordingsContext(pathname);
  const { studentId } = useEstudianteSession();
  const [simId, setSimId] = useState('');

  useEffect(() => {
    if (!paidContext) {
      setSimId('');
      return;
    }
    const read = () => setSimId(readStudentSelectedSimulacro());
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === SIM_STORAGE_KEY || e.key === 'student_id') read();
    };
    const onSim = (e: Event) => {
      const detail = (e as CustomEvent<{ simulationId?: string }>).detail;
      setSimId(detail?.simulationId || readStudentSelectedSimulacro());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', read);
    window.addEventListener(STUDENT_SIMULATION_EVENT, onSim);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', read);
      window.removeEventListener(STUDENT_SIMULATION_EVENT, onSim);
    };
  }, [paidContext, pathname]);

  const { catalog, hasRecordings, loading } = useSimRecordings(paidContext ? simId : '');
  const allowed = useMemo(
    () =>
      canAccessSimRecordingsCatalog(catalog, {
        documentId: studentId,
        audience: 'estudiante',
      }),
    [catalog, studentId],
  );

  return {
    showClasesNav:
      paidContext && Boolean(simId) && !loading && hasRecordings && allowed,
  };
}
