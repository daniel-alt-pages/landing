'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCourseEntitlementsContext } from '../context/CourseEntitlementsProvider';
import { buildPublicStudentCode } from '../lib/courseAccessKeys';
import { buildIdentityFromSession } from '../lib/courseEntitlements';
import { watchCourseGoogleAuth } from '../lib/courseAuthReal';
import { readCachedAuthEmail } from '../lib/courseAuthSync';
import {
  courseSectionPath,
  extractCourseStudentCodeFromPath,
  parseCourseSectionFromPath,
} from '../lib/courseRoutePaths';
import CourseAccessNotFound from './CourseAccessNotFound';
import CourseGoogleSecurityPrompt from './CourseGoogleSecurityPrompt';
import SgBrandedLoadingExperience from '@/components/SgBrandedLoadingExperience';

type CourseAccessGateProps = {
  children: React.ReactNode;
  identityHint?: Partial<import('../types/courseTypes').CourseIdentity>;
};

const GATE_SLOW_MS = 12_000;

/** Lee ?recording= sin useSearchParams (static export / Suspense). */
function readRecordingQueryParam(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('recording');
}

export default function CourseAccessGate({ children, identityHint }: CourseAccessGateProps) {
  const { entitlements, loading, refresh } = useCourseEntitlementsContext();
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [googleReady, setGoogleReady] = useState<boolean | null>(null);
  const [slow, setSlow] = useState(false);
  const identityLabel = useMemo(() => buildIdentityFromSession(identityHint), [identityHint]);
  const hasCourses = (entitlements?.courses.length ?? 0) > 0;
  const expectedStudentCode = useMemo(() => {
    const courses = entitlements?.courses ?? [];
    const profileCode = buildPublicStudentCode(identityLabel);
    if (profileCode && courses.some((c) => c.publicStudentCode === profileCode)) {
      return profileCode;
    }
    return courses.find((c) => c.publicStudentCode)?.publicStudentCode;
  }, [entitlements?.courses, identityLabel]);
  const routeStudentCode = useMemo(() => extractCourseStudentCodeFromPath(pathname), [pathname]);

  useEffect(() => {
    return watchCourseGoogleAuth((hasGoogle) => setGoogleReady(hasGoogle));
  }, []);

  useEffect(() => {
    const waiting = googleReady === null || (loading && !entitlements);
    const reset = window.setTimeout(() => setSlow(false), 0);
    if (!waiting) {
      return () => window.clearTimeout(reset);
    }
    const t = window.setTimeout(() => setSlow(true), GATE_SLOW_MS);
    return () => {
      window.clearTimeout(reset);
      window.clearTimeout(t);
    };
  }, [entitlements, googleReady, loading]);

  useEffect(() => {
    if (!googleReady || loading || !hasCourses || !expectedStudentCode) return;
    if (routeStudentCode === expectedStudentCode) return;

    const tab = parseCourseSectionFromPath(pathname);
    const recordingId = readRecordingQueryParam();
    const nextPath = courseSectionPath(tab, recordingId, expectedStudentCode);
    router.replace(nextPath);
  }, [
    expectedStudentCode,
    googleReady,
    hasCourses,
    loading,
    pathname,
    routeStudentCode,
    router,
  ]);

  if (googleReady === null) {
    return (
      <div data-sg-panel-stuck={slow ? 'true' : undefined}>
        <SgBrandedLoadingExperience
          message="Cargando experiencia personalizada"
          personalize={false}
        />
      </div>
    );
  }

  if (!googleReady) {
    return (
      <CourseGoogleSecurityPrompt
        onAuthenticated={() => {
          setGoogleReady(true);
          void refresh();
        }}
      />
    );
  }

  if (loading && !entitlements) {
    return (
      <div className="relative" data-sg-panel-stuck={slow ? 'true' : undefined}>
        <SgBrandedLoadingExperience
          message="Cargando experiencia personalizada"
          personalize={false}
        />
        {slow ? (
          <button
            type="button"
            onClick={() => void refresh()}
            className="absolute left-1/2 top-[calc(50%+7.5rem)] -translate-x-1/2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Reintentar
          </button>
        ) : null}
      </div>
    );
  }

  if (!entitlements?.features.miCurso || !hasCourses) {
    const currentEmail = readCachedAuthEmail() || identityLabel.emailLower;
    return <CourseAccessNotFound email={currentEmail} />;
  }

  return <>{children}</>;
}
