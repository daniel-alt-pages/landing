'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { readSelectedSimulationFromStorage, COORDINATOR_SIMULATION_EVENT } from '@features/coordinador/lib/coordinatorNavPolicy';
import RecordingsPageView from '@features/recordings/pages/RecordingsPageView';
import { isPaidRecordingsContext } from '@features/recordings/lib/recordingsAccess';

export default function CoordinadorClasesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [simulationId, setSimulationId] = useState('');

  useEffect(() => {
    if (!isPaidRecordingsContext(pathname)) {
      router.replace('/coordinador');
      return;
    }
    const read = () => setSimulationId(readSelectedSimulationFromStorage());
    read();
    const onSim = (e: Event) => {
      const detail = (e as CustomEvent<{ simulationId?: string }>).detail;
      if (detail?.simulationId) setSimulationId(detail.simulationId);
      else read();
    };
    window.addEventListener(COORDINATOR_SIMULATION_EVENT, onSim);
    return () => window.removeEventListener(COORDINATOR_SIMULATION_EVENT, onSim);
  }, [pathname, router]);

  if (!isPaidRecordingsContext(pathname)) return null;

  return (
    <RecordingsPageView
      simulationId={simulationId}
      variant="dark"
      audience="coordinador"
    />
  );
}
