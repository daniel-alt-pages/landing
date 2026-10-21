import type { Timestamp } from 'firebase/firestore';

export type CourseType = 'curso_intensivo' | 'compilado' | 'refuerzo' | 'vacacional';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseMaterialKind = 'drive_folder' | 'pdf' | 'doc' | 'link';
export type CourseMaterialGroup = 'compilado' | 'simulacro_actual';
export type CourseAccessRole = 'student' | 'viewer' | 'guardian';
export type CourseAccessSource = 'manual_csv' | 'pipeline' | 'purchase' | 'migration' | 'grant';
export type ParentRelationship = 'madre' | 'padre' | 'acudiente';

export type CourseMaterialNoticeLink = {
  label: string;
  url: string;
};

export type CourseMaterialOpenNotice = {
  title: string;
  message: string;
  deadlineLabel?: string;
  /** ISO 8601 (Bogotá) para contador regresivo hasta cierre de formularios. */
  closesAt?: string;
  primaryLabel?: string;
  links?: CourseMaterialNoticeLink[];
};

export type CourseMaterial = {
  id: string;
  label: string;
  description?: string;
  url: string;
  kind: CourseMaterialKind;
  order: number;
  visible: boolean;
  materialGroup?: CourseMaterialGroup;
  openNotice?: CourseMaterialOpenNotice;
};

export type CourseRecording = {
  id: string;
  title: string;
  /** Clave ICFES (`lectura crítica`, `inglés`, …). Si falta, se infiere del título. */
  area?: string;
  /** Tipo de clase (`Inducción específica`, `Clase oficial`, …). Si falta, se infiere del título. */
  classType?: string;
  /** Segmento del catálogo Grabaciones — separa inducciones de clases oficiales. */
  catalogSegment?: 'official' | 'induction';
  module?: string;
  /** Solo retrocompatibilidad pipeline; la UI de curso no usa sesión simulacro. */
  session?: number | null;
  partLabel?: string;
  driveFileId?: string;
  videoUrl?: string;
  recordedAt?: string;
  sortOrder: number;
  visibleToStudents: boolean;
  /** Portada grabaciones: oculta mascota SG. */
  coverHideMascot?: boolean;
  /** Portada grabaciones: estilo del titular del poster. */
  coverTitleStyle?: 'default' | 'black-gradient';
};

export type CourseClassLink = {
  id: string;
  label: string;
  topic?: string;
  url: string;
  startsAt?: Timestamp | string;
  order: number;
  visible: boolean;
};

export type CourseHero = {
  title: string;
  subtitle?: string;
  badge?: string;
  coverImageUrl?: string;
};

export type CourseCalendarProgram = 'vacacional';

export type CourseDoc = {
  id: string;
  name: string;
  slug: string;
  type: CourseType;
  status: CourseStatus;
  active: boolean;
  order: number;
  version: number;
  audienceLabel?: string;
  hero: CourseHero;
  materials: CourseMaterial[];
  recordings: CourseRecording[];
  classLinks: CourseClassLink[];
  /** Google Calendar embed (pestaña Clases). */
  calendarEmbedUrl?: string;
  /** Filtra fuente del calendario (p. ej. solo vacacional). */
  calendarProgram?: CourseCalendarProgram;
  /** Inicio del curso en vivo (YYYY-MM-DD, Bogotá). */
  courseStartDate?: string;
  /** Fin del curso en vivo (YYYY-MM-DD, Bogotá). */
  courseEndDate?: string;
  associatedSimulations?: string[];
  updatedAt?: Timestamp | string;
};

export type CourseAccessDoc = {
  id?: string;
  courseId: string;
  active: boolean;
  role: CourseAccessRole;
  emailLower?: string;
  documento?: string;
  studentId?: string;
  /** Código público opaco para URLs. No es identidad ni permiso. */
  publicStudentCode?: string;
  source: CourseAccessSource;
  grantedAt?: Timestamp | string;
  expiresAt?: Timestamp | string;
};

export type CourseAttendanceSummary = {
  totalHours: number;
  attendedHours: number;
  attendanceRate: number;
  /** Asistidas (presente + parcial) en clases ya dictadas. */
  sessionsAttended: number;
  /** Total clases vacacional en calendario (dictadas + programadas). */
  sessionsTotal: number;
  /** Clases ya finalizadas según ICS. */
  sessionsCompleted?: number;
  /** Clases futuras o en curso según ICS. */
  sessionsUpcoming?: number;
  sessionsPresent?: number;
  sessionsPartial?: number;
  sessionsAbsent?: number;
  lastUpdatedAt?: Timestamp | string;
};

export type CourseRecentSession = {
  date: string;
  topic?: string;
  attended: boolean;
  minutes?: number;
  /** Hora de entrada (Meet → UI). */
  joinedAt?: string;
  /** Hora de salida (Meet → UI). */
  leftAt?: string;
  /** Tiempo en clase formateado para el estudiante. */
  durationLabel?: string;
  /** present | partial | absent | upcoming | live-soon */
  status?: 'present' | 'partial' | 'absent' | 'upcoming' | 'live-soon';
  sessionId?: string;
  /** ISO inicio ICS — contadores en vivo. */
  startsAtIso?: string;
  endsAtIso?: string;
  /** Default true. false = excusa sintética (racha sí, horas/puntos no). */
  countTowardPoints?: boolean;
};

/** Configuración de asistencia Meet cargada desde `/data/attendance/{courseId}/`. */
export type CourseAttendanceManifest = {
  courseId: string;
  totalHours: number;
  /** Bump al ingestar CSV Meet — invalida caché de métricas en dev. */
  attendanceVersion?: number;
  /** Inducciones — asistencia automática para todos. */
  inductionSessions?: CourseInductionSession[];
  sessions: CourseAttendanceManifestSession[];
};

export type CourseInductionSession = {
  id: string;
  title: string;
  date: string;
  durationLabel?: string;
};

export type CourseAttendanceManifestSession = {
  id: string;
  file: string;
  title: string;
  subtitle?: string;
  date: string;
  scheduledMinutes?: number;
  /** Default true. false = historial sin sumar a meta 170 h. */
  countsTowardHours?: boolean;
};

export type MeetAttendanceRow = {
  firstName: string;
  lastName: string;
  durationMinutes: number;
  durationLabel: string;
  joinedAt: string;
  leftAt: string;
};

export const COURSE_DEFAULT_TOTAL_HOURS = 170;

/** Bonus de simulacro sumado al ranking de seguimiento. */
export type CourseSimulacroBonus = {
  simId: string;
  /** Puntos = puntaje global ICFES (0 si no presentó). */
  points: number;
  puntajeGlobal: number;
  justification: string;
};

export type CourseStudentMetrics = {
  courseId: string;
  personKey: string;
  studentId?: string;
  emailLower?: string;
  documento?: string;
  displayName?: string;
  attendance: CourseAttendanceSummary;
  recentSessions?: CourseRecentSession[];
  /** Puntos extra por simulacros del vacacional (p. ej. SG11-20). */
  simulacroBonuses?: CourseSimulacroBonus[];
  /** Versión del documento de métricas. */
  version: number;
  /** Alineado con courseRuntime.attendanceVersion tras sync local. */
  attendanceVersion?: number;
};

export type ParentAccessDoc = {
  id?: string;
  parentEmailLower: string;
  courseId: string;
  personKey: string;
  active: boolean;
  relationship?: ParentRelationship;
  grantedAt?: Timestamp | string;
};

export type CourseIdentity = {
  emailLower?: string;
  documento?: string;
  studentId?: string;
  publicStudentCode?: string;
};

export type CourseEntitlement = {
  courseId: string;
  role: CourseAccessRole;
  active: boolean;
  publicStudentCode?: string;
};

export type StudentPanelMode = 'results_only' | 'course_only' | 'unified';

export type CourseEntitlementsResult = {
  courses: CourseEntitlement[];
  mode: StudentPanelMode;
  hasSimulacros: boolean;
  features: {
    miCurso: boolean;
    seguimiento: boolean;
    /** Hub de atajos (simulacro + curso). */
    herramientas: boolean;
    /** Panel de resultados del simulacro. */
    panelSimulacro: boolean;
  };
};

export type CourseSectionTab =
  | 'resumen'
  | 'herramientas'
  | 'grabaciones'
  | 'materiales'
  | 'clases'
  | 'seguimiento';

export const COURSE_SESSION_STORAGE_KEYS = {
  selectedCourseId: 'course_selected',
  panelMode: 'student_panel_mode',
  courseOnly: 'course_only',
  studentDocumento: 'student_documento',
  /** '1' = panel simulacro visible; '0' = solo curso (estudiante sin resultados). */
  simulacroPanel: 'sg_simulacro_panel',
} as const;
