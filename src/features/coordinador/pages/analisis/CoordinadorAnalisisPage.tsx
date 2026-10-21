'use client';
import { useCoordinadorData } from '@features/coordinador/hooks/useCoordinadorData';
import { CoordinadorAnalisisView } from '@features/coordinador/pages/analisis/CoordinadorAnalisisView';

export default function CoordinadorAnalisisPage() {
  return <CoordinadorAnalisisView useCoordinadorData={useCoordinadorData} />;
}

