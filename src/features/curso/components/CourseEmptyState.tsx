'use client';

import { GraduationCap } from 'lucide-react';
import SgEmptyState from '@shared/components/SgEmptyState';

type CourseEmptyStateProps = {
  title?: string;
  message?: string;
};

export default function CourseEmptyState({
  title = 'Sin contenido por ahora',
  message = 'Vuelve pronto; el equipo está preparando materiales para ti.',
}: CourseEmptyStateProps) {
  return <SgEmptyState icon={GraduationCap} title={title} message={message} />;
}
