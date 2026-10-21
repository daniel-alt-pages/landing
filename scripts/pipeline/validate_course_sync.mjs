#!/usr/bin/env node

/**

 * Validación del pipeline sync curso → Firestore.

 *

 * Uso:

 *   $env:SG_FIREBASE_ENV='pruebas'

 *   npm run course:sync-validate -- --course preicfes-sg26

 *   npm run course:sync-validate -- --course preicfes-sg26 --skip-dry-run

 */

import { spawnSync } from 'node:child_process';

import { dirname, join } from 'node:path';

import { fileURLToPath } from 'node:url';

import { initFirestore, parseCliArgs } from './lib/firebase-admin-env.mjs';



const __dirname = dirname(fileURLToPath(import.meta.url));

const reportesRoot = join(__dirname, '../..');

const repoRoot = join(reportesRoot, '..');



function runNode(script, extraArgs = []) {

  const res = spawnSync(process.execPath, [script, ...extraArgs], {

    cwd: reportesRoot,

    stdio: 'inherit',

    env: process.env,

  });

  if (res.status !== 0) process.exit(res.status ?? 1);

}



function runPython(script, extraArgs = []) {

  const py = process.env.PYTHON || 'python';

  const res = spawnSync(py, [script, ...extraArgs], {

    cwd: repoRoot,

    stdio: 'inherit',

    env: process.env,

  });

  if (res.status !== 0) process.exit(res.status ?? 1);

}



function countActiveGrants(accessSnaps) {

  return accessSnaps.filter((s) => {

    const d = s.data() || {};

    return d.active !== false && String(s.id).includes('__grant__');

  }).length;

}



async function assertFirestore(courseId, explicitEnv) {

  const { db } = initFirestore(explicitEnv);

  const runtimeSnap = await db.collection('courseRuntime').doc(courseId).get();

  const snapshotSnap = await db.collection('courseCalendarSnapshots').doc(courseId).get();

  const configSnap = await db.collection('config').doc('app').get();

  const accessSnaps = (

    await db.collection('courseAccess').where('courseId', '==', courseId).get()

  ).docs;

  const authSnap = await db.collection('studentAuth').limit(5).get();



  const errors = [];



  if (!runtimeSnap.exists) {

    errors.push(`courseRuntime/${courseId} no existe`);

    return errors;

  }



  const runtime = runtimeSnap.data() || {};

  const config = configSnap.data() || {};



  console.log('[validate] courseRuntime:', {

    calendarVersion: runtime.calendarVersion,

    attendanceVersion: runtime.attendanceVersion,

    stats: runtime.stats,

  });



  if (snapshotSnap.exists) {

    const snapshot = snapshotSnap.data() || {};

    console.log('[validate] courseCalendarSnapshots:', {

      version: snapshot.version,

      eventCount: snapshot.events?.length ?? 0,

      stats: snapshot.stats,

    });

    if (Number(snapshot.version) !== Number(runtime.calendarVersion)) {

      errors.push(

        `snapshot.version (${snapshot.version}) != runtime.calendarVersion (${runtime.calendarVersion})`,

      );

    }

    const placeholders = (snapshot.events || []).filter((e) =>

      String(e?.title || '').toLowerCase().includes('placeholder'),

    );

    if (placeholders.length) {

      errors.push(`snapshot contiene ${placeholders.length} eventos placeholder`);

    }

  } else {

    errors.push('courseCalendarSnapshots ausente');

  }



  if (runtime.attendanceVersion == null) {

    errors.push('courseRuntime.attendanceVersion ausente');

  }

  if (runtime.materialsVersion == null) {

    errors.push('courseRuntime.materialsVersion ausente');

  } else {

    const materialsSnap = await db

      .collection('courseStudentMaterials')

      .doc(courseId)

      .collection('students')

      .limit(3)

      .get();

    console.log('[validate] courseStudentMaterials:', {

      materialsVersion: runtime.materialsVersion,

      sampleDocs: materialsSnap.size,

    });

    if (materialsSnap.empty) {

      errors.push(`courseStudentMaterials/${courseId}/students vacío`);

    }

  }



  const configCalendar = config.courseVersions?.[courseId];

  if (configCalendar != null && Number(configCalendar) !== Number(runtime.calendarVersion)) {

    errors.push(

      `config.app.courseVersions[${courseId}] (${configCalendar}) != runtime.calendarVersion (${runtime.calendarVersion})`,

    );

  }



  const configMetrics = config.courseMetricsVersions?.[courseId];

  if (

    configMetrics != null &&

    runtime.attendanceVersion != null &&

    Number(configMetrics) !== Number(runtime.attendanceVersion)

  ) {

    errors.push(

      `config.app.courseMetricsVersions[${courseId}] (${configMetrics}) != runtime.attendanceVersion (${runtime.attendanceVersion})`,

    );

  }



  const grantCount = countActiveGrants(accessSnaps);

  console.log('[validate] courseAccess grants activos:', grantCount);



  console.log('[validate] studentAuth muestra:', authSnap.size, 'docs (limit 5)');



  return errors;

}



async function main() {

  const args = parseCliArgs();

  const courseId = args.course || 'preicfes-sg26';

  const envFlag = args.env ? ['--env', args.env] : [];

  const skipDryRun = args.skipDryRun;



  if (!skipDryRun) {

    console.log('\n[validate] 1/3 calendar dry-run');

    runNode(join(__dirname, 'sync_course_calendar_to_firestore.mjs'), [

      ...envFlag,

      '--course',

      courseId,

      '--dry-run',

    ]);



    console.log('\n[validate] 2/3 attendance dry-run');

    runPython(join(repoRoot, 'scripts/pipeline/sync_course_attendance_to_firestore.py'), [

      ...(args.env ? ['--env', args.env] : []),

      '--course',

      courseId,

      '--dry-run',

      '--limit',

      '5',

    ]);

  }



  console.log(`\n[validate] ${skipDryRun ? '1/1' : '3/3'} estado Firestore actual`);

  const errors = await assertFirestore(courseId, args.env);

  if (errors.length) {

    console.error('\n[validate] FALLOS:');

    errors.forEach((e) => console.error(`  - ${e}`));

    process.exit(1);

  }

  console.log('\n[validate] ✓ OK');

}



main().catch((error) => {

  console.error('[validate] ERROR:', error.message || error);

  process.exitCode = 1;

});

