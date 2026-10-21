'use client';

import { useMemo } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import CourseGoogleAccessHint from '@features/curso/components/CourseGoogleAccessHint';
import { useCourseStudentMaterials } from '@features/curso/hooks/useCourseStudentMaterials';
import type { RecordingGeminiNote } from '@features/curso/lib/courseRecordingGeminiNotes';
import {
  formatVacacionalQuestionRangeLabel,
  parseVacacionalQuestionRange,
  resolvePersonalizedCompiladoForSessionTitle,
} from '@features/curso/lib/courseVacacionalClassMaterialAccess';

type RecordingGeminiNotesSectionProps = {
  note: RecordingGeminiNote | null;
  loading?: boolean;
  courseId?: string;
  sessionTitle?: string | null;
};

export default function RecordingGeminiNotesSection({
  note,
  loading = false,
  courseId,
  sessionTitle = null,
}: RecordingGeminiNotesSectionProps) {
  const { materials: studentMaterials, loading: materialsLoading } = useCourseStudentMaterials(
    courseId,
  );

  const compiladoMeta = useMemo(() => {
    if (!sessionTitle?.trim()) return null;
    return resolvePersonalizedCompiladoForSessionTitle(sessionTitle, studentMaterials);
  }, [sessionTitle, studentMaterials]);

  const questionRangeLabel = useMemo(() => {
    if (!sessionTitle?.trim()) return null;
    const range = parseVacacionalQuestionRange(sessionTitle);
    return range ? formatVacacionalQuestionRangeLabel(range) : null;
  }, [sessionTitle]);

  const showCourseMaterials = Boolean(courseId && sessionTitle?.trim());
  const showSection = Boolean(note?.url) || showCourseMaterials;

  if (!showSection) return null;

  if (loading && !note?.url && !showCourseMaterials) {
    return (
      <p className="text-sm text-[var(--course-text-muted)]" aria-live="polite">
        Cargando notas…
      </p>
    );
  }

  return (
    <section aria-label="Materiales de la clase" className="space-y-2 px-0.5">
      {showCourseMaterials ? (
        <CourseGoogleAccessHint
          compiladoHref={materialsLoading ? null : compiladoMeta?.compilado?.url}
          compiladoTitle={compiladoMeta?.compiladoLabel}
          questionRangeLabel={questionRangeLabel}
        />
      ) : null}

      {note?.url ? (
        <a
          href={note.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-3 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/60 px-4 py-3 transition hover:border-[var(--course-accent)] hover:bg-[var(--course-accent-soft)]"
        >
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--course-surface)] text-[var(--course-accent)] shadow-sm"
            aria-hidden
          >
            <FileText className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[var(--course-text)] group-hover:text-[var(--course-accent)]">
              Ver notas de Gemini de esta clase
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-[var(--course-text-muted)]">
              Resumen, apuntes y detalles de la sesión en Google Docs.
            </span>
          </span>
          <ExternalLink
            className="mt-1 h-4 w-4 shrink-0 text-[var(--course-text-muted)] group-hover:text-[var(--course-accent)]"
            aria-hidden
          />
        </a>
      ) : null}
    </section>
  );
}
