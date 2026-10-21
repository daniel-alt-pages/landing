const WHATSAPP_PHONE = '573042359048';

export const SIMULATION_PRICES = {
  individual: 20000,
  institution: 15000,
} as const;

export type QuoteKind = 'individual' | 'institution';

export function getInstitutionUnitPrice(_gradeCount?: number) {
  return SIMULATION_PRICES.institution;
}

export function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getInstitutionQuote(gradeCount: number, studentCount: number) {
  const safeGradeCount = Math.max(1, Math.floor(gradeCount || 1));
  const safeStudentCount = Math.max(1, Math.floor(studentCount || 1));
  const unitPrice = getInstitutionUnitPrice(safeGradeCount);

  return {
    gradeCount: safeGradeCount,
    studentCount: safeStudentCount,
    unitPrice,
    total: unitPrice * safeStudentCount,
  };
}

export type InstitutionQuoteInput = {
  name?: string;
  studentsPerGrade: number[];
};

/** Cotización institucional simplificada: $15.000 por estudiante matriculado (sin escalas por volumen). */
export function getInstitutionQuoteByGradeCounts(studentsPerGrade: readonly number[]) {
  const perGrade = studentsPerGrade.map((n) => Math.max(0, Math.floor(Number(n) || 0)));
  const active = perGrade.filter((n) => n > 0);
  const gradeCount = Math.max(1, active.length);
  const studentCount = active.reduce((sum, n) => sum + n, 0) || 1;
  const unitPrice = SIMULATION_PRICES.institution;

  return {
    gradeCount,
    studentCount,
    unitPrice,
    total: unitPrice * studentCount,
    studentsPerGrade: perGrade,
  };
}

/** Varios colegios en una sola cotización (legacy / compat). */
export function getMultiInstitutionQuote(institutions: readonly InstitutionQuoteInput[]) {
  const rows = institutions.map((inst, index) => {
    const breakdown = getInstitutionQuoteByGradeCounts(inst.studentsPerGrade);
    return {
      index,
      name: inst.name?.trim() || `Institución ${index + 1}`,
      ...breakdown,
    };
  });
  const studentCount = rows.reduce((sum, row) => sum + row.studentCount, 0);
  const unitPrice = SIMULATION_PRICES.institution;

  return {
    institutionCount: Math.max(1, institutions.length),
    studentCount: studentCount || 1,
    unitPrice,
    total: unitPrice * (studentCount || 1),
    institutions: rows,
  };
}

export const DIRECTOR_GRADE_LABELS = ['9°', '10°', '11°'] as const;
export type DirectorGradeIndex = 0 | 1 | 2;

export type DirectorCourseInput = {
  name?: string;
  /** 0 = 9°, 1 = 10°, 2 = 11° */
  gradeIndex: DirectorGradeIndex;
  studentCount: number;
};

/** Directivo: N cursos, cada uno con grado (9/10/11) y cantidad de estudiantes. */
export function getDirectorCoursesQuote(courses: readonly DirectorCourseInput[]) {
  const unitPrice = SIMULATION_PRICES.institution;
  const safeCourses = courses.length > 0 ? courses : [{ gradeIndex: 0 as const, studentCount: 1 }];

  const rows = safeCourses.map((course, index) => {
    const gradeIndex = Math.min(2, Math.max(0, Math.floor(course.gradeIndex || 0))) as DirectorGradeIndex;
    const studentCount = Math.max(1, Math.floor(course.studentCount || 1));
    return {
      index,
      name: course.name?.trim() || `Curso ${index + 1}`,
      gradeIndex,
      gradeLabel: DIRECTOR_GRADE_LABELS[gradeIndex],
      studentCount,
      unitPrice,
      total: unitPrice * studentCount,
    };
  });

  const studentCount = rows.reduce((sum, row) => sum + row.studentCount, 0);
  const gradeCount = new Set(rows.map((row) => row.gradeIndex)).size;

  return {
    courseCount: rows.length,
    studentCount,
    gradeCount,
    unitPrice,
    total: unitPrice * studentCount,
    courses: rows,
  };
}

type WhatsAppQuoteInput =
  | {
      kind: 'individual';
    }
  | {
      kind: 'institution';
      institutionName?: string;
      gradeCount: number;
      studentCount: number;
    };

export type WhatsAppSalesLeadInput = {
  kind: QuoteKind;
  contactName: string;
  role?: string;
  phone?: string;
  email?: string;
  department?: string;
  municipality?: string;
  institutionName?: string;
  gradeCount?: number;
  studentCount?: number;
  notes?: string;
};

export function buildWhatsAppQuoteUrl(input: WhatsAppQuoteInput) {
  const lines =
    input.kind === 'individual'
      ? [
          'Hola, quiero cotizar 1 simulacro individual con Seamos Genios.',
          `Tarifa: ${formatCOP(SIMULATION_PRICES.individual)} por estudiante.`,
          'Incluye: simulacro, retroalimentacion en vivo y acceso a grabaciones.',
          'Me gustaria recibir informacion para aplicar el simulacro.',
        ]
      : (() => {
          const quote = getInstitutionQuote(input.gradeCount, input.studentCount);
          const institutionLabel = input.institutionName?.trim()
            ? `Institucion: ${input.institutionName.trim()}.`
            : 'Institucion: pendiente por confirmar.';

          return [
            'Hola, quiero cotizar simulacros para una institucion con Seamos Genios.',
            institutionLabel,
            `Grados a matricular: ${quote.gradeCount}.`,
            `Estudiantes estimados: ${quote.studentCount}.`,
            `Tarifa aplicada: ${formatCOP(quote.unitPrice)} por estudiante.`,
            `Total estimado: ${formatCOP(quote.total)}.`,
            'Incluye para todos: simulacro, retroalimentacion en vivo y acceso a grabaciones.',
            'Me gustaria coordinar la aplicacion del simulacro.',
          ];
        })();

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildWhatsAppSalesLeadUrl(input: WhatsAppSalesLeadInput) {
  const quote =
    input.kind === 'institution' && input.gradeCount && input.studentCount
      ? getInstitutionQuote(input.gradeCount, input.studentCount)
      : null;
  const lines = [
    input.kind === 'institution'
      ? 'Hola, quiero coordinar simulacros para una institucion con Seamos Genios.'
      : 'Hola, quiero comprar o coordinar un simulacro individual con Seamos Genios.',
    `Nombre: ${input.contactName.trim()}.`,
    input.role?.trim() ? `Perfil/cargo: ${input.role.trim()}.` : null,
    input.phone?.trim() ? `Contacto: ${input.phone.trim()}.` : null,
    input.email?.trim() ? `Correo: ${input.email.trim()}.` : null,
    input.department?.trim() ? `Departamento: ${input.department.trim()}.` : null,
    input.municipality?.trim() ? `Municipio: ${input.municipality.trim()}.` : null,
    input.institutionName?.trim() ? `Institucion: ${input.institutionName.trim()}.` : null,
    input.kind === 'individual'
      ? `Precio final: ${formatCOP(SIMULATION_PRICES.individual)}.`
      : null,
    quote ? `Grados estimados: ${quote.gradeCount}.` : null,
    quote ? `Estudiantes estimados: ${quote.studentCount}.` : null,
    quote ? `Precio final: ${formatCOP(quote.total)} (${formatCOP(quote.unitPrice)} por estudiante).` : null,
    input.notes?.trim() ? `Notas: ${input.notes.trim()}.` : null,
  ].filter(Boolean);

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/** Mensaje prellenado para cotizar una asesoría (paneles avanzados del coordinador). */
export function buildWhatsAppAsesoriaUrl(sectionLabel?: string) {
  const extra = sectionLabel?.trim() ? ` Me interesa en detalle: ${sectionLabel.trim()}.` : '';
  const text = [
    'Hola, vi la vista previa del panel coordinador en la web de Seamos Genios.',
    `Quiero cotizar una asesoría para conocer más sobre el módulo coordinador.${extra}`,
    '¿Me pueden orientar con disponibilidad y valor?',
  ].join(' ');
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}
