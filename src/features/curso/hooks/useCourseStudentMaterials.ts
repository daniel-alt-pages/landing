'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@features/auth/lib/firebase';
import type { CourseMaterial } from '../types/courseTypes';
import { fetchCourseStudentMaterials } from '../lib/courseStudentMaterials';

export function useCourseStudentMaterials(courseId: string | undefined) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(Boolean(courseId));
  const [authTick, setAuthTick] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => setAuthTick((t) => t + 1));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!courseId) {
      setMaterials([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchCourseStudentMaterials(courseId)
      .then((rows) => {
        if (!cancelled) setMaterials(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, authTick]);

  return { materials, loading };
}
