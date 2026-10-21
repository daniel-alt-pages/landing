/** Catálogo curso vacacional: clases en vivo vs inducciones (no mezclar en UI). */
export type CourseRecordingCatalogSegment = 'official' | 'induction';

export type SimRecording = {
  id: string;
  title: string;
  area: string;
  session: number | null;
  partLabel?: string;
  catalogSegment?: CourseRecordingCatalogSegment;
  driveFileId: string;
  /** CDN externo (ImageKit, etc.) — prioridad sobre Drive. */
  videoUrl?: string;
  recordedAt?: string;
  sortOrder?: number;
  visibleToStudents?: boolean;
  coverHideMascot?: boolean;
  coverTitleStyle?: 'default' | 'black-gradient';
};

export type SimRecordingsCatalog = {
  simulationId: string;
  title?: string;
  updatedAt?: string;
  /**
   * Si existe y no está vacío: solo esos documentos ven el panel (estudiante).
   * Coordinador ignora la lista. Ausente = catálogo abierto (p. ej. SG11-18).
   */
  allowedDocumentIds?: string[];
  recordings: SimRecording[];
};

export type RecordingGroup = {
  key: string;
  label: string;
  items: SimRecording[];
};
