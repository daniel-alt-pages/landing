'use client';

import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useCourseEntitlements } from '../hooks/useCourseEntitlements';
import { isCourseEntryVisible } from '../lib/courseEntitlements';
import { coursePathForSession } from '../lib/courseRoutePaths';

type CourseProfileShortcutProps = {
  href?: string;
};

/** Acceso a Mi Curso desde Perfil — visible y fuera del nav inferior. */
export default function CourseProfileShortcut({
  href,
}: CourseProfileShortcutProps) {
  const { entitlements, loading } = useCourseEntitlements();
  const show = isCourseEntryVisible(loading, entitlements);
  const targetHref = href ?? coursePathForSession();

  if (!show) return null;

  return (
    <div className="prf-card" style={{ marginTop: 0 }}>
      <div className="prf-card-header">
        <span className="prf-card-label">
          <GraduationCap size={14} aria-hidden />
          Curso académico
        </span>
      </div>
      <div className="prf-card-body">
        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.55, margin: '0 0 12px' }}>
          Compilados, grabaciones y enlaces de clase en un solo lugar.
        </p>
        <Link
          href={targetHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            justifyContent: 'center',
            padding: '12px 16px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
          }}
        >
          Ir a Mi Curso
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
