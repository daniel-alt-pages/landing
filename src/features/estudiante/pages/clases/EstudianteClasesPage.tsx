'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';
import { useEstudianteSession } from '@features/estudiante/hooks/useEstudianteSession';
import RecordingsPageView from '@features/recordings/pages/RecordingsPageView';
import { isPaidRecordingsContext } from '@features/recordings/lib/recordingsAccess';

export default function EstudianteClasesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { simulacroSelected, basePath, studentId } = useEstudianteSession();

  useEffect(() => {
    if (!isPaidRecordingsContext(pathname)) {
      router.replace(`${basePath}/dashboard`);
    }
  }, [basePath, pathname, router]);

  if (!isPaidRecordingsContext(pathname)) return null;

  return (
    <RecordingsPageView
      simulationId={simulacroSelected}
      variant="light"
      audience="estudiante"
      documentId={studentId}
    />
  );
}
