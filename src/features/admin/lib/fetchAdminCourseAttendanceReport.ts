/**
 * Re-export del reporte de asistencia — fuente canónica en `@features/curso/lib/courseAttendanceReport`.
 */
export {
  fetchCourseAttendanceReport as fetchAdminCourseAttendanceReport,
  fetchCourseRosterCsv,
  exportAttendanceReportCsv,
  exportAttendanceSessionsDetailCsv,
  formatAttendedMinutesLabel,
  type CourseAttendanceReport as AdminAttendanceReport,
  type CourseAttendanceReportRow as AdminAttendanceReportRow,
  type CourseAttendanceRosterRow as AdminAttendanceRosterRow,
  type CourseAttendanceWeekMeta as AdminAttendanceWeekMeta,
} from '@features/curso/lib/courseAttendanceReport';
