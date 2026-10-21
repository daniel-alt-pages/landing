'use client';

import { GraduationCap } from 'lucide-react';
import { hardNavigate } from '@/shared/lib/hardNavigate';
import type { CourseIdentity } from '../types/courseTypes';
import { useCourseEntitlementsOptional } from '../context/CourseEntitlementsProvider';
import { useCourseEntitlements } from '../hooks/useCourseEntitlements';
import { isCourseEntryVisible } from '../lib/courseEntitlements';
import { coursePathForSession } from '../lib/courseRoutePaths';

type CourseHeaderButtonProps = {
  href?: string;
  identityHint?: Partial<CourseIdentity>;
  className?: string;
};

function CourseHeaderButtonView({
  href,
  className = '',
  entitlements,
  loading,
}: {
  href?: string;
  className?: string;
  entitlements: ReturnType<typeof useCourseEntitlements>['entitlements'];
  loading: boolean;
}) {
  const show = isCourseEntryVisible(loading, entitlements);
  const targetHref = href ?? coursePathForSession();
  if (!show) return null;

  return (
    <a
      href={targetHref}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        hardNavigate(targetHref);
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] ${className}`}
      aria-busy={loading}
    >
      <GraduationCap className="h-4 w-4" aria-hidden />
      Mi Curso
    </a>
  );
}

function CourseHeaderButtonStandalone({
  href,
  identityHint,
  className,
}: CourseHeaderButtonProps) {
  const { entitlements, loading } = useCourseEntitlements(identityHint);
  return (
    <CourseHeaderButtonView
      href={href}
      className={className}
      entitlements={entitlements}
      loading={loading}
    />
  );
}

/** Botón Mi Curso — solo con entitlement activo en Firestore. */
export default function CourseHeaderButton(props: CourseHeaderButtonProps) {
  const ctx = useCourseEntitlementsOptional();
  if (ctx) {
    return (
      <CourseHeaderButtonView
        href={props.href}
        className={props.className}
        entitlements={ctx.entitlements}
        loading={ctx.loading}
      />
    );
  }
  return <CourseHeaderButtonStandalone {...props} />;
}
