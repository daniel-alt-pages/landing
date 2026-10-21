import type { InformacionPersonal } from '@shared/types';
import type { CourseAttendanceReportRow } from '../../../lib/courseAttendanceReport';
import { RANKING_VACACIONAL_COURSE_NAME } from './seguimientoLabels';

export type RankingStudentContextMeta = {
  municipio: string;
  departamento: string;
  curso: string;
  grado: string;
};

export function rankingStudentContextFromRow(
  row: CourseAttendanceReportRow | undefined,
): RankingStudentContextMeta {
  if (!row) {
    return { municipio: '', departamento: '', curso: RANKING_VACACIONAL_COURSE_NAME, grado: '' };
  }

  const municipio = (row.enrollmentMunicipio || '').trim();
  const departamento = (row.enrollmentDepartamento || '').trim();

  return {
    municipio,
    departamento,
    curso: RANKING_VACACIONAL_COURSE_NAME,
    grado: '',
  };
}

export function hasRankingStudentContext(meta: RankingStudentContextMeta): boolean {
  return Boolean(meta.municipio || meta.departamento || meta.curso || meta.grado);
}

export type RankingStudentContextItem = {
  key: keyof RankingStudentContextMeta;
  label: string;
  value: string;
};

/** Contexto desde perfil de estudiante (ranking simulacro / nacional). */
export function rankingStudentContextFromInformacionPersonal(
  personal: InformacionPersonal | undefined,
): RankingStudentContextMeta {
  if (!personal) {
    return { municipio: '', departamento: '', curso: '', grado: '' };
  }
  const municipio = (personal.municipio || '').trim();
  const departamento = (personal.departamento || '').trim();
  return { municipio, departamento, curso: '', grado: '' };
}

export function rankingStudentContextItems(
  meta: RankingStudentContextMeta,
): RankingStudentContextItem[] {
  const defs: Array<{ key: keyof RankingStudentContextMeta; label: string }> = [
    { key: 'municipio', label: 'Municipio' },
    { key: 'departamento', label: 'Departamento' },
    { key: 'curso', label: 'Curso' },
    { key: 'grado', label: 'Grado' },
  ];

  return defs
    .map(({ key, label }) => ({
      key,
      label,
      value: meta[key]?.trim() || '',
    }))
    .filter((item) => item.value.length > 0);
}
