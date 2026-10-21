/**
 * Bump coherente en config/app para invalidación global de caché.
 */

export async function bumpConfigCourseVersion(db, courseId, calendarVersion) {
  const ref = db.collection('config').doc('app');
  const snap = await ref.get();
  const data = snap.data() || {};
  const courseVersions = { ...(data.courseVersions || {}) };
  courseVersions[courseId] = Number(calendarVersion);
  await ref.set(
    {
      courseVersions,
      courseVersionsUpdatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}
