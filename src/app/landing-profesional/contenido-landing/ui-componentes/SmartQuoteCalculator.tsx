'use client';

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  GraduationCap,
  Layers,
  MessageCircle,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import {
  DIRECTOR_GRADE_LABELS,
  SIMULATION_PRICES,
  formatCOP,
  getDirectorCoursesQuote,
  type DirectorCourseInput,
  type DirectorGradeIndex,
} from '@/lib/cotizacionSimulacro';
import { Pill } from '@/app/landing-profesional/contenido-landing/ui-componentes/LandingPrimitives';
import { QuoteAccessPreview } from '@/app/landing-profesional/contenido-landing/ui-componentes/QuoteAccessPreview';
import { displaySerif, includedItems } from '@/app/landing-profesional/contenido-landing/content';
import type { SalesLeadKind } from '@/app/landing-profesional/contenido-landing/tipos';

export type SmartQuoteSalesOpen = {
  kind: SalesLeadKind;
  gradeCount?: number;
  studentCount?: number;
  courseCount?: number;
};

type SmartQuoteCalculatorProps = {
  isLightLanding: boolean;
  onCoordinate: (preset: SmartQuoteSalesOpen) => void;
};

type UserRole = 'student' | 'director';
type QuotePhase = 'gate' | 'flow';
type DirectivoStep = 'count' | 'configure';

const MAX_COURSES = 8;
const COURSE_COUNT_OPTIONS = [1, 2, 3, 4, 5] as const;
const DEFAULT_STUDENTS_PER_COURSE = 48;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function emptyCourse(gradeIndex: DirectorGradeIndex = 0): DirectorCourseInput {
  return { name: '', gradeIndex, studentCount: DEFAULT_STUDENTS_PER_COURSE };
}

function resizeCourses(count: number, current: DirectorCourseInput[]): DirectorCourseInput[] {
  const n = clamp(count, 1, MAX_COURSES);
  if (current.length === n) return current;
  if (current.length < n) {
    const seed = current[0] ?? emptyCourse();
    return [
      ...current,
      ...Array.from({ length: n - current.length }, (_, i) =>
        emptyCourse(((seed.gradeIndex + i + 1) % 3) as DirectorGradeIndex),
      ),
    ];
  }
  return current.slice(0, n);
}

export function SmartQuoteCalculator({ isLightLanding, onCoordinate }: SmartQuoteCalculatorProps) {
  const [phase, setPhase] = useState<QuotePhase>('gate');
  const [role, setRole] = useState<UserRole | null>(null);
  const [directivoStep, setDirectivoStep] = useState<DirectivoStep>('count');
  const [courseCount, setCourseCount] = useState(1);
  const [courses, setCourses] = useState<DirectorCourseInput[]>([emptyCourse()]);
  const [activeCourse, setActiveCourse] = useState(0);
  const [customCourseCount, setCustomCourseCount] = useState('');

  const quote = useMemo(() => getDirectorCoursesQuote(courses), [courses]);

  const titleClass = isLightLanding ? 'text-slate-950' : 'text-white';
  const mutedClass = isLightLanding ? 'text-slate-600' : 'text-white/55';
  const subtleClass = isLightLanding ? 'text-slate-500' : 'text-white/42';
  const panelClass = isLightLanding
    ? 'border border-slate-200/90 bg-white text-slate-950 shadow-xl shadow-slate-900/6'
    : 'border border-white/[0.08] bg-white/[0.025] text-white shadow-2xl shadow-black/30';
  const nestedClass = isLightLanding
    ? 'border border-cyan-200/80 bg-cyan-50/60'
    : 'border border-cyan-400/20 bg-cyan-300/[0.06]';
  const chipIdle = isLightLanding
    ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
    : 'border-white/12 bg-white/[0.04] text-white/75 hover:border-white/20';
  const chipActive = isLightLanding
    ? 'border-cyan-600 bg-cyan-50 text-cyan-950 ring-1 ring-cyan-500/25'
    : 'border-cyan-300/50 bg-cyan-300/12 text-cyan-50 ring-1 ring-cyan-200/30';
  const numberInputClass = isLightLanding
    ? 'w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20'
    : 'w-full min-h-11 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/25';

  const resetToGate = () => {
    setPhase('gate');
    setRole(null);
    setDirectivoStep('count');
    setCourseCount(1);
    setCourses([emptyCourse()]);
    setActiveCourse(0);
    setCustomCourseCount('');
  };

  const pickRole = (next: UserRole) => {
    setRole(next);
    setPhase('flow');
    if (next === 'director') setDirectivoStep('count');
  };

  const setCountAndAdvance = (count: number) => {
    const n = clamp(count, 1, MAX_COURSES);
    setCourseCount(n);
    setCourses((prev) => resizeCourses(n, prev));
    setActiveCourse(0);
    setDirectivoStep('configure');
  };

  const patchCourse = (index: number, patch: Partial<DirectorCourseInput>) => {
    setCourses((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const copyFirstCourseToAll = () => {
    const seed = courses[0];
    if (!seed) return;
    setCourses((prev) =>
      prev.map((c, i) =>
        i === 0
          ? c
          : {
              ...c,
              gradeIndex: seed.gradeIndex,
              studentCount: seed.studentCount,
            },
      ),
    );
  };

  const active = courses[activeCourse] ?? emptyCourse();
  const stepDots = role === 'student' ? 1 : directivoStep === 'count' ? 1 : 2;

  return (
    <section
      id="calculadora"
      className={`cotiz-landing-chapter cotiz-quote-wizard scroll-mt-[var(--cotiz-mhdr-offset,4.5rem)] border-t px-[clamp(1rem,3vw,2.5rem)] py-[clamp(2.5rem,6vw,4rem)] sm:scroll-mt-28 ${
        isLightLanding ? 'border-slate-200' : 'border-white/[0.06]'
      }`}
    >
      <motion.div className="mx-auto w-full max-w-[min(80rem,100%)]" layout>
        <div className="cotiz-quote-wizard__glow" aria-hidden />

        <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start">
          <motion.div className="min-w-0" layout>
            <Pill surface={isLightLanding ? 'light' : 'dark'}>Calculadora inteligente</Pill>

            {phase === 'gate' ? (
              <>
                <h2
                  className={`${displaySerif} mt-5 text-[clamp(1.75rem,4.5vw,2.65rem)] font-medium tracking-tight ${titleClass}`}
                >
                  ¿Quién cotiza hoy?
                </h2>
                <p className={`mt-4 max-w-xl text-sm leading-relaxed ${mutedClass}`}>
                  Estudiante: compra individual. Directivo: define cuántos cursos matriculas y el grado de cada uno.
                </p>

                <motion.div
                  className="mt-10 grid gap-4 sm:grid-cols-2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <button
                    type="button"
                    onClick={() => pickRole('student')}
                    className={`cotiz-quote-role-card group text-left ${isLightLanding ? 'cotiz-quote-role-card--light' : 'cotiz-quote-role-card--dark'}`}
                  >
                    <span className="cotiz-quote-role-card__icon" aria-hidden>
                      <GraduationCap className="h-6 w-6" />
                    </span>
                    <span className="cotiz-quote-role-card__title">Soy estudiante</span>
                    <span className={`cotiz-quote-role-card__desc ${mutedClass}`}>
                      {formatCOP(SIMULATION_PRICES.individual)} · 1 estudiante
                    </span>
                    <ChevronRight className="cotiz-quote-role-card__arrow h-5 w-5 opacity-60 transition group-hover:translate-x-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => pickRole('director')}
                    className={`cotiz-quote-role-card group text-left ${isLightLanding ? 'cotiz-quote-role-card--light' : 'cotiz-quote-role-card--dark'}`}
                  >
                    <span className="cotiz-quote-role-card__icon" aria-hidden>
                      <BookOpen className="h-6 w-6" />
                    </span>
                    <span className="cotiz-quote-role-card__title">Soy directivo</span>
                    <span className={`cotiz-quote-role-card__desc ${mutedClass}`}>
                      {formatCOP(SIMULATION_PRICES.institution)} / estudiante · por curso y grado
                    </span>
                    <ChevronRight className="cotiz-quote-role-card__arrow h-5 w-5 opacity-60 transition group-hover:translate-x-0.5" />
                  </button>
                </motion.div>
              </>
            ) : (
              <>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={resetToGate}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition focus:outline-none focus:ring-2 ${
                      isLightLanding
                        ? 'border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-300/40'
                        : 'border-white/12 text-white/70 hover:bg-white/[0.06] focus:ring-white/25'
                    }`}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                    Cambiar perfil
                  </button>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                      isLightLanding ? 'bg-cyan-50 text-cyan-900' : 'bg-cyan-300/12 text-cyan-100'
                    }`}
                  >
                    {role === 'student' ? (
                      <>
                        <User className="h-3.5 w-3.5" /> Estudiante
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-3.5 w-3.5" /> Directivo
                      </>
                    )}
                  </span>
                  {role === 'director' ? (
                    <span className={`text-xs ${subtleClass}`}>
                      Paso {directivoStep === 'count' ? 1 : 2} de 2
                    </span>
                  ) : null}
                </div>

                <div className="cotiz-quote-step-dots mt-4" aria-hidden>
                  {Array.from({ length: stepDots }, (_, i) => (
                    <span
                      key={i}
                      className={`cotiz-quote-step-dots__dot ${
                        i < (role === 'director' && directivoStep === 'configure' ? 2 : 1)
                          ? 'cotiz-quote-step-dots__dot--active'
                          : ''
                      }`}
                    />
                  ))}
                </div>

                {role === 'student' ? (
                  <div className="mt-8 space-y-6">
                    <h2
                      className={`${displaySerif} text-[clamp(1.5rem,3.5vw,2.1rem)] font-medium tracking-tight ${titleClass}`}
                    >
                      Tu simulacro, enfoque individual
                    </h2>
                    <p className={`max-w-xl text-sm leading-relaxed ${mutedClass}`}>
                      Precio único <strong className={titleClass}>{formatCOP(SIMULATION_PRICES.individual)}</strong>.
                      Sin configurar cursos ni grados.
                    </p>
                    <motion.div
                      className={`rounded-2xl p-5 ${nestedClass}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <ul className={`space-y-2 text-sm ${mutedClass}`}>
                        {includedItems.slice(0, 4).map((item) => (
                          <li key={item} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                ) : directivoStep === 'count' ? (
                  <motion.div className="mt-8 space-y-6" layout>
                    <h2
                      className={`${displaySerif} text-[clamp(1.5rem,3.5vw,2.1rem)] font-medium tracking-tight ${titleClass}`}
                    >
                      ¿Cuántos cursos matriculas?
                    </h2>
                    <p className={`max-w-xl text-sm leading-relaxed ${mutedClass}`}>
                      Elige la cantidad (901, 902, 10-A…). Después defines{' '}
                      <strong className={titleClass}>grado</strong> (9°, 10° u 11°) y{' '}
                      <strong className={titleClass}>cuántos estudiantes</strong> tiene cada curso.
                    </p>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {COURSE_COUNT_OPTIONS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCountAndAdvance(n)}
                          className={`cotiz-quote-count-tile ${
                            isLightLanding ? 'cotiz-quote-count-tile--light' : 'cotiz-quote-count-tile--dark'
                          }`}
                        >
                          <Layers className="mx-auto h-5 w-5 opacity-70" aria-hidden />
                          <span className="mt-2 block text-2xl font-bold tabular-nums">{n}</span>
                          <span className={`text-[11px] ${subtleClass}`}>
                            {n === 1 ? 'curso' : 'cursos'}
                          </span>
                        </button>
                      ))}
                    </div>

                    <motion.div className="flex flex-wrap items-center gap-3">
                      <label className={`text-sm font-semibold ${titleClass}`}>Más de 5:</label>
                      <input
                        type="number"
                        min={6}
                        max={MAX_COURSES}
                        value={customCourseCount}
                        onChange={(e) => setCustomCourseCount(e.target.value)}
                        className={`${numberInputClass} max-w-[6rem]`}
                        placeholder="6–8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const v = Number(customCourseCount);
                            if (v >= 6 && v <= MAX_COURSES) setCountAndAdvance(v);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const v = Number(customCourseCount);
                          if (v >= 6 && v <= MAX_COURSES) setCountAndAdvance(v);
                        }}
                        className={`rounded-full px-4 py-2 text-xs font-bold ${
                          isLightLanding ? 'bg-slate-950 text-white' : 'bg-cyan-200 text-slate-950'
                        }`}
                      >
                        Continuar
                      </button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div className="mt-8 space-y-6" layout>
                    <h2
                      className={`${displaySerif} text-[clamp(1.5rem,3.5vw,2.1rem)] font-medium tracking-tight ${titleClass}`}
                    >
                      Personaliza cada curso
                    </h2>
                    <p className={`max-w-xl text-sm leading-relaxed ${mutedClass}`}>
                      <strong className={titleClass}>{quote.courseCount}</strong>{' '}
                      {quote.courseCount === 1 ? 'curso' : 'cursos'} ·{' '}
                      {formatCOP(SIMULATION_PRICES.institution)} / estudiante
                    </p>

                    {courseCount > 1 ? (
                      <motion.div
                        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        role="tablist"
                        aria-label="Cursos"
                      >
                        {courses.map((course, index) => {
                          const row = quote.courses[index];
                          return (
                            <button
                              key={`course-tab-${index}`}
                              type="button"
                              role="tab"
                              aria-selected={activeCourse === index}
                              onClick={() => setActiveCourse(index)}
                              className={`shrink-0 rounded-2xl border px-4 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${
                                activeCourse === index ? chipActive : chipIdle
                              }`}
                            >
                              <span className="block text-sm font-bold">
                                {course.name?.trim() || `Curso ${index + 1}`}
                              </span>
                              <span className={`mt-0.5 block text-[11px] ${subtleClass}`}>
                                {row?.gradeLabel ?? DIRECTOR_GRADE_LABELS[course.gradeIndex]} ·{' '}
                                {row?.studentCount ?? course.studentCount} alumnos
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    ) : null}

                    <label
                      className={`block rounded-xl border p-3 ${isLightLanding ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.03]'}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-[0.14em] ${subtleClass}`}>
                        Nombre del curso (opcional)
                      </span>
                      <input
                        type="text"
                        value={active.name ?? ''}
                        onChange={(e) => patchCourse(activeCourse, { name: e.target.value })}
                        placeholder={`Ej. 901, 10-A, Curso ${activeCourse + 1}`}
                        className={`${numberInputClass} mt-2 border-0 bg-transparent px-0 shadow-none focus:ring-0`}
                      />
                    </label>

                    <motion.div>
                      <p className={`text-sm font-semibold ${titleClass}`}>Grado del curso</p>
                      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Grado">
                        {DIRECTOR_GRADE_LABELS.map((label, gradeIndex) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() =>
                              patchCourse(activeCourse, { gradeIndex: gradeIndex as DirectorGradeIndex })
                            }
                            className={`min-h-11 rounded-full border px-5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${
                              active.gradeIndex === gradeIndex ? chipActive : chipIdle
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    <label
                      className={`block rounded-xl border p-3 ${isLightLanding ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.03]'}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-[0.14em] ${subtleClass}`}>
                        Estudiantes en este curso
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={active.studentCount}
                        onChange={(e) =>
                          patchCourse(activeCourse, {
                            studentCount: clamp(Number(e.target.value), 1, 999),
                          })
                        }
                        className={`${numberInputClass} mt-2`}
                        aria-label="Cantidad de estudiantes"
                      />
                    </label>

                    {courseCount > 1 ? (
                      <button
                        type="button"
                        onClick={copyFirstCourseToAll}
                        className={`rounded-full border px-3.5 py-2 text-sm font-bold ${chipIdle}`}
                      >
                        Copiar grado y cantidad del 1.º curso a todos
                      </button>
                    ) : null}

                    <ul className={`space-y-1.5 border-t pt-4 text-sm ${isLightLanding ? 'border-slate-200' : 'border-white/10'} ${mutedClass}`}>
                      {quote.courses.map((row) => (
                        <li key={row.index} className="flex justify-between gap-3">
                          <span>
                            {row.name} · {row.gradeLabel}
                          </span>
                          <span className={`font-mono font-semibold tabular-nums ${titleClass}`}>
                            {row.studentCount} × {formatCOP(row.unitPrice)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {courseCount > 1 && activeCourse < courseCount - 1 ? (
                      <button
                        type="button"
                        onClick={() => setActiveCourse((i) => i + 1)}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold ${
                          isLightLanding ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white'
                        }`}
                      >
                        Siguiente curso
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : null}
                  </motion.div>
                )}
              </>
            )}
          </motion.div>

          <motion.aside
            className={`cotiz-quote-result flex min-w-0 flex-col rounded-[1.5rem] p-5 sm:sticky sm:top-28 sm:p-7 ${panelClass}`}
            layout
          >
            {phase === 'gate' ? (
              <QuoteAccessPreview isLightLanding={isLightLanding} embedded />
            ) : (
              <>
            <div className="flex items-center gap-2">
              <Sparkles className={`h-4 w-4 ${isLightLanding ? 'text-cyan-700' : 'text-cyan-300'}`} aria-hidden />
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${subtleClass}`}>Proyección</p>
            </div>

            {role === 'student' ? (
              <>
                <p className={`${displaySerif} mt-4 text-[clamp(2rem,5vw,3rem)] font-medium tracking-tight ${titleClass}`}>
                  {formatCOP(SIMULATION_PRICES.individual)}
                </p>
                <p className={`mt-2 text-sm ${mutedClass}`}>Precio final · 1 estudiante</p>
              </>
            ) : directivoStep === 'count' ? (
              <p className={`mt-6 text-sm leading-relaxed ${mutedClass}`}>
                Indica cuántos cursos para configurar grado y matrícula de cada uno.
              </p>
            ) : (
              <>
                <p className={`${displaySerif} mt-4 text-[clamp(2rem,5vw,3rem)] font-medium tracking-tight ${titleClass}`}>
                  {formatCOP(quote.total)}
                </p>
                <p className={`mt-2 text-sm ${mutedClass}`}>
                  {formatCOP(quote.unitPrice)} × {quote.studentCount} estudiantes
                </p>

                <div className={`mt-6 space-y-2 rounded-2xl p-4 text-sm ${nestedClass}`}>
                  <div className="flex justify-between gap-3">
                    <span className={mutedClass}>Cursos</span>
                    <span className={`font-semibold ${titleClass}`}>{quote.courseCount}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className={mutedClass}>Estudiantes total</span>
                    <span className={`font-semibold ${titleClass}`}>{quote.studentCount}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className={mutedClass}>Grados distintos</span>
                    <span className={`font-semibold ${titleClass}`}>{quote.gradeCount}</span>
                  </div>
                </div>

                {quote.courseCount > 1 ? (
                  <ul className={`mt-4 max-h-36 space-y-2 overflow-y-auto text-xs ${mutedClass}`}>
                    {quote.courses.map((row) => (
                      <li
                        key={row.index}
                        className="flex justify-between gap-2 border-b border-dashed border-current/15 pb-2"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Users className="h-3 w-3 shrink-0 opacity-60" />
                          {row.name} · {row.gradeLabel}
                        </span>
                        <span className={`shrink-0 font-mono tabular-nums ${titleClass}`}>
                          {formatCOP(row.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <p className={`mt-4 flex items-start gap-2 text-xs leading-relaxed ${subtleClass}`}>
                  <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  Estimación. Ventas confirma matrícula final.
                </p>
              </>
            )}

            {phase === 'flow' ? (
              <>
                <ul
                  className={`mt-6 space-y-2 border-t pt-5 text-sm ${isLightLanding ? 'border-slate-200' : 'border-white/10'}`}
                >
                  {includedItems.map((item) => (
                    <li key={item} className={`flex gap-2 ${mutedClass}`}>
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/90" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-col gap-3 pt-8">
                  <button
                    type="button"
                    disabled={role === 'director' && directivoStep === 'count'}
                    onClick={() => {
                      if (role === 'student') {
                        onCoordinate({ kind: 'individual' });
                        return;
                      }
                      onCoordinate({
                        kind: 'institution',
                        gradeCount: quote.gradeCount,
                        studentCount: quote.studentCount,
                        courseCount: quote.courseCount,
                      });
                    }}
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${
                      isLightLanding
                        ? 'bg-slate-950 text-white hover:bg-black focus:ring-slate-400/40'
                        : 'bg-cyan-200 text-slate-950 hover:bg-white focus:ring-cyan-300/50'
                    }`}
                  >
                    Coordinar con ventas
                    <MessageCircle className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </>
            ) : null}
              </>
            )}
          </motion.aside>
        </div>
      </motion.div>
    </section>
  );
}
