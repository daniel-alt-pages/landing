'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, MessageCircle, X } from 'lucide-react';
import { SIMULATION_PRICES, buildWhatsAppSalesLeadUrl, getInstitutionQuote } from '@/lib/cotizacionSimulacro';
import { displaySerif } from '../content';
import type { ColombiaCatalogItem, SalesLeadKind, SalesLeadStep } from '../tipos';
import { useColombiaSalesCatalog } from '../utilidades/useColombiaSalesCatalog';

export const SALES_LEADS_LOCAL_STORAGE_KEY = 'sg-cotiz-sales-leads';

export function normalizeCatalogValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function saveSalesLeadLocally(lead: Record<string, unknown>) {
  try {
    const raw = window.localStorage.getItem(SALES_LEADS_LOCAL_STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(current) ? current : [];
    next.unshift(lead);
    window.localStorage.setItem(SALES_LEADS_LOCAL_STORAGE_KEY, JSON.stringify(next.slice(0, 80)));
  } catch {
    // El WhatsApp abre igual; el cache local solo ayuda durante pruebas.
  }
}

const FIELD_LIMITS = {
  contactName: 70,
  role: 60,
  phone: 20,
  email: 100,
  department: 60,
  municipality: 40,
  institutionName: 100,
  numeric: 4,
  notes: 280,
} as const;

const INSTITUTION_ROLE_OPTIONS = [
  'Rector(a)',
  'Coordinador(a)',
  'Director(a)',
  'Docente',
  'Orientador(a)',
  'Secretaría académica',
  'Administrativo(a)',
  'Acudiente autorizado',
  'Otro (escribir)',
] as const;

const CALENDAR_OPTIONS = ['A', 'B', 'Flexible / por confirmar'] as const;
const SHIFT_OPTIONS = ['Mañana', 'Tarde', 'Noche', 'Jornada completa', 'Sabatina', 'Flexible / por confirmar'] as const;

function limitText(value: string, maxLength: number) {
  return value
    .replace(/[\u0000-\u001F\u007F<>]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);
}

function limitEmail(value: string) {
  return limitText(value, FIELD_LIMITS.email).replace(/\s/g, '').toLowerCase();
}

function limitPhone(value: string) {
  return limitText(value.replace(/[^\d+\s()-]/g, ''), FIELD_LIMITS.phone);
}

function limitInteger(value: string) {
  return value.replace(/\D/g, '').slice(0, FIELD_LIMITS.numeric);
}

function SearchableCatalogField({
  label,
  value,
  onChange,
  options,
  placeholder,
  autoFocus,
  getMeta,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ColombiaCatalogItem[];
  placeholder: string;
  autoFocus?: boolean;
  getMeta?: (item: ColombiaCatalogItem) => string;
  maxLength: number;
}) {
  const [open, setOpen] = useState(false);
  const visibleOptions = options.slice(0, 14);
  const hasSearch = value.trim().length > 0;

  return (
    <label className="relative block text-sm font-semibold text-white/82">
      {label}
      <input
        value={value}
        onChange={(event) => {
          onChange(limitText(event.target.value, maxLength));
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal text-white outline-none transition placeholder:text-white/28 focus:border-cyan-200/60"
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={maxLength}
      />
      {open ? (
        <div className="absolute z-[110] mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/12 bg-[#0b1020] p-1.5 shadow-2xl shadow-black/50">
          {visibleOptions.length ? (
            visibleOptions.map((item) => {
              const meta = getMeta?.(item);
              return (
                <button
                  key={`${item.department || ''}-${item.municipality || ''}-${item.name}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(item.name);
                    setOpen(false);
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-white/86 transition hover:bg-cyan-200/12 focus:bg-cyan-200/12 focus:outline-none"
                >
                  <span className="block">{item.name}</span>
                  {meta ? <span className="mt-0.5 block text-[11px] font-normal text-white/42">{meta}</span> : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-3 text-xs font-normal leading-relaxed text-white/45">
              {hasSearch ? 'Sin coincidencias. Puedes escribirlo manualmente.' : 'Escribe para buscar.'}
            </div>
          )}
        </div>
      ) : null}
    </label>
  );
}

export function SalesCoordinationModal({
  presetKind,
  presetVolume,
  onClose,
}: {
  /** Si viene de un CTA concreto, salta el paso de tipo y arranca en nombre. */
  presetKind?: SalesLeadKind | null;
  /** Valores desde la calculadora (grados / estudiantes). */
  presetVolume?: { gradeCount: number; studentCount: number } | null;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<SalesLeadKind>(presetKind ?? 'individual');
  const [step, setStep] = useState<SalesLeadStep>(presetKind ? 'name' : 'kind');
  const [contactName, setContactName] = useState('');
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [institution, setInstitution] = useState('');
  const [gradeCountInput, setGradeCountInput] = useState(() =>
    presetVolume?.gradeCount ? String(presetVolume.gradeCount) : '',
  );
  const [studentCountInput, setStudentCountInput] = useState(() =>
    presetVolume?.studentCount ? String(presetVolume.studentCount) : '',
  );
  const [calendar, setCalendar] = useState('');
  const [academicShift, setAcademicShift] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const needsCatalog = kind === 'institution' && (step === 'location' || step === 'institution');
  const { catalog, catalogStatus } = useColombiaSalesCatalog(needsCatalog, department, municipality);
  const finalRole = role === 'Otro (escribir)' ? customRole.trim() : role.trim();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const departmentOptions = useMemo(() => {
    const normalizedDepartment = normalizeCatalogValue(department);
    return (catalog?.departments ?? [])
      .filter((item) =>
        normalizedDepartment ? normalizeCatalogValue(item.name).includes(normalizedDepartment) : true,
      )
      .slice(0, 80);
  }, [catalog, department]);

  const municipalityOptions = useMemo(() => {
    const normalizedDepartment = normalizeCatalogValue(department);
    return (catalog?.municipalities ?? [])
      .filter((item) => {
        const itemDepartment = normalizeCatalogValue(item.department || '');
        const sameDepartment = normalizedDepartment && itemDepartment
          ? itemDepartment === normalizedDepartment
          : true;
        const matchesName = municipality
          ? normalizeCatalogValue(item.name).includes(normalizeCatalogValue(municipality))
          : true;
        return sameDepartment && matchesName;
      })
      .slice(0, 80);
  }, [catalog, department, municipality]);

  const schoolOptions = useMemo(() => {
    const normalizedDepartment = normalizeCatalogValue(department);
    const normalizedMunicipality = normalizeCatalogValue(municipality);
    const normalizedInstitution = normalizeCatalogValue(institution);

    return (catalog?.schools ?? [])
      .filter((item) => {
        const itemDepartment = normalizeCatalogValue(item.department || '');
        const itemMunicipality = normalizeCatalogValue(item.municipality || '');
        const sameDepartment = normalizedDepartment && itemDepartment
          ? itemDepartment === normalizedDepartment
          : true;
        const sameMunicipality = normalizedMunicipality && itemMunicipality
          ? itemMunicipality === normalizedMunicipality
          : true;
        const matchesInstitution =
          normalizedInstitution.length >= 2
            ? normalizeCatalogValue(item.name).includes(normalizedInstitution)
            : sameMunicipality;
        return sameDepartment && sameMunicipality && matchesInstitution;
      })
      .slice(0, 80);
  }, [catalog, department, institution, municipality]);

  const parsedGradeCount = Number.parseInt(gradeCountInput, 10);
  const parsedStudentCount = Number.parseInt(studentCountInput, 10);
  const hasInstitutionVolume =
    Number.isFinite(parsedGradeCount) &&
    parsedGradeCount > 0 &&
    Number.isFinite(parsedStudentCount) &&
    parsedStudentCount > 0;
  const modalInstitutionQuote =
    kind === 'institution' && hasInstitutionVolume
      ? getInstitutionQuote(parsedGradeCount, parsedStudentCount)
      : null;
  const modalFinalPrice = kind === 'individual' ? SIMULATION_PRICES.individual : modalInstitutionQuote?.total;

  const stepFlow: SalesLeadStep[] =
    kind === 'institution'
      ? ['kind', 'name', 'role', 'location', 'institution', 'volume', 'application', 'contact', 'notes']
      : ['kind', 'name', 'contact', 'notes'];
  const currentStepIndex = stepFlow.indexOf(step);
  const currentProgress = Math.max(currentStepIndex + 1, 1);
  const totalProgress = stepFlow.length;

  const goToNextStep = () => {
    setError('');
    const nextStep = stepFlow[currentStepIndex + 1];
    if (nextStep) setStep(nextStep);
  };

  const goToPreviousStep = () => {
    setError('');
    const previousStep = stepFlow[currentStepIndex - 1];
    if (previousStep) setStep(previousStep);
  };

  const continueFromCurrentStep = () => {
    if (step === 'name' && !contactName.trim()) {
      setError('Escribe tu nombre para continuar.');
      return;
    }

    if (step === 'role' && kind === 'institution' && !finalRole) {
      setError('Indica tu cargo o relación con la institución.');
      return;
    }

    if (step === 'institution' && kind === 'institution' && !institution.trim()) {
      setError('Escribe o selecciona la institución.');
      return;
    }

    if (step === 'application' && kind === 'institution' && (!calendar || !academicShift)) {
      setError('Selecciona calendario y jornada académica.');
      return;
    }

    if (step === 'contact' && !phone.trim() && !email.trim()) {
      setError('Deja al menos WhatsApp, telefono o correo.');
      return;
    }

    if (step === 'volume' && kind === 'institution' && !hasInstitutionVolume) {
      setError('Escribe grados y estudiantes para calcular el precio final.');
      return;
    }

    goToNextStep();
  };

  const submitLead = () => {
    const cleanName = contactName.trim();
    const cleanPhone = phone.trim();
    const cleanInstitution = institution.trim();

    if (!cleanName) {
      setError('Escribe tu nombre antes de enviar.');
      setStep('name');
      return;
    }

    if (!cleanPhone && !email.trim()) {
      setError('Deja al menos WhatsApp, telefono o correo.');
      setStep('contact');
      return;
    }

    if (kind === 'institution' && !cleanInstitution) {
      setError('Agrega el nombre de la institución.');
      setStep('institution');
      return;
    }

    if (kind === 'institution' && !hasInstitutionVolume) {
      setError('Escribe grados y estudiantes para calcular el precio final.');
      setStep('volume');
      return;
    }

    const institutionNotes = [
      notes.trim(),
      kind === 'institution' && calendar ? `Calendario: ${calendar}.` : null,
      kind === 'institution' && academicShift ? `Jornada: ${academicShift}.` : null,
    ]
      .filter(Boolean)
      .join(' ');

    const lead = {
      kind,
      contactName: cleanName,
      role: kind === 'institution' ? finalRole : undefined,
      phone: cleanPhone,
      email: email.trim(),
      department: kind === 'institution' ? department.trim() : undefined,
      municipality: kind === 'institution' ? municipality.trim() : undefined,
      institutionName: kind === 'institution' ? cleanInstitution : undefined,
      gradeCount: kind === 'institution' && hasInstitutionVolume ? modalInstitutionQuote?.gradeCount : undefined,
      studentCount: kind === 'institution' && hasInstitutionVolume ? modalInstitutionQuote?.studentCount : undefined,
      notes: institutionNotes || undefined,
      createdAt: new Date().toISOString(),
      source: 'landing-profesional',
    };

    saveSalesLeadLocally(lead);
    window.open(buildWhatsAppSalesLeadUrl(lead), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 px-3 py-4 backdrop-blur-md sm:items-center sm:px-6" role="dialog" aria-modal="true" aria-labelledby="sales-modal-title">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Cerrar formulario" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#070a12] text-white shadow-2xl shadow-black/60 sm:rounded-[2rem]">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_30%_0%,rgba(34,211,238,0.2),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(129,140,248,0.18),transparent_34%)]" aria-hidden />
        <div className="relative p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/70">Coordinar con ventas</p>
              <h2 id="sales-modal-title" className={`${displaySerif} mt-2 text-2xl font-medium tracking-tight sm:text-3xl`}>
                {kind === 'institution' ? 'Cotización para tu colegio' : 'Compra individual'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <X className="h-5 w-5" aria-hidden />
              <span className="sr-only">Cerrar</span>
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-white/42">
              <span>
                Paso {currentProgress} de {totalProgress}
              </span>
              <span>{kind === 'institution' ? 'Institución' : 'Estudiante'}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-200 transition-all duration-300"
                style={{ width: `${(currentProgress / totalProgress) * 100}%` }}
              />
            </div>
          </div>

          {step === 'kind' ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm leading-relaxed text-white/58">
                Elige el tipo de compra. El formulario se adapta: pocos datos para estudiante, datos completos para colegio.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: 'individual' as const,
                    title: 'Estudiante o acudiente',
                    text: 'Compra individual. Solo nombre y contacto.',
                  },
                  {
                    value: 'institution' as const,
                    title: 'Coordinador o rectoría',
                    text: 'Institución: ubicación, colegio, grados y jornada. Solicite una cotización.',
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setKind(option.value);
                      setError('');
                      setStep('name');
                    }}
                    className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-300/45 ${
                      kind === option.value
                        ? 'border-cyan-200 bg-cyan-200/12'
                        : 'border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      {kind === option.value ? <Check className="h-4 w-4 text-cyan-200" aria-hidden /> : null}
                      {option.title}
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-white/50">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {step === 'name' ? (
                <div>
                  <label className="block text-sm font-semibold text-white/82">
                    ¿Cómo te llamas?
                    <input
                      value={contactName}
                      onChange={(event) => setContactName(limitText(event.target.value, FIELD_LIMITS.contactName))}
                      className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal text-white outline-none transition placeholder:text-white/28 focus:border-cyan-200/60"
                      placeholder="Nombre completo"
                      autoFocus
                      maxLength={FIELD_LIMITS.contactName}
                    />
                  </label>
                  {kind === 'individual' ? (
                    <p className="mt-3 text-sm leading-relaxed text-white/50">
                      Compra para una persona: no pedimos colegio ni volumen. Siguiente paso: tu contacto.
                    </p>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-white/50">
                      Luego pediremos cargo, ubicación del colegio y volumen estimado.
                    </p>
                  )}
                </div>
              ) : null}

              {step === 'role' && kind === 'institution' ? (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white/82">
                    ¿Cuál es tu cargo o relación con la institución?
                    <select
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                      className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal text-white outline-none transition focus:border-cyan-200/60"
                      autoFocus
                    >
                      <option value="">Seleccionar</option>
                      {INSTITUTION_ROLE_OPTIONS.map((option) => (
                        <option key={option} value={option} className="bg-[#0b1020] text-white">
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  {role === 'Otro (escribir)' ? (
                    <label className="block text-sm font-semibold text-white/82">
                      Especifica tu cargo
                      <input
                        value={customRole}
                        onChange={(event) => setCustomRole(limitText(event.target.value, FIELD_LIMITS.role))}
                        className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal text-white outline-none transition placeholder:text-white/28 focus:border-cyan-200/60"
                        placeholder="Ej. Psicoorientador, líder académico..."
                        maxLength={FIELD_LIMITS.role}
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}

              {step === 'location' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <SearchableCatalogField
                    label="Departamento"
                    value={department}
                    onChange={(nextDepartment) => {
                      setDepartment(nextDepartment);
                      setMunicipality('');
                    }}
                    options={departmentOptions}
                    placeholder="Busca departamento"
                    autoFocus
                    maxLength={FIELD_LIMITS.department}
                  />
                  <SearchableCatalogField
                    label="Municipio"
                    value={municipality}
                    onChange={setMunicipality}
                    options={municipalityOptions}
                    placeholder="Busca municipio"
                    getMeta={(item) => item.department || ''}
                    maxLength={FIELD_LIMITS.municipality}
                  />
                </div>
              ) : null}

              {step === 'institution' ? (
                <SearchableCatalogField
                  label="Nombre de la institución"
                  value={institution}
                  onChange={setInstitution}
                  options={schoolOptions}
                  placeholder="Busca colegio o institución"
                  autoFocus
                  getMeta={(item) => [item.municipality, item.department].filter(Boolean).join(' · ')}
                  maxLength={FIELD_LIMITS.institutionName}
                />
              ) : null}

              {step === 'application' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-white/82">
                    Calendario académico
                    <select
                      value={calendar}
                      onChange={(event) => setCalendar(event.target.value)}
                      className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal text-white outline-none transition focus:border-cyan-200/60"
                      autoFocus
                    >
                      <option value="">Seleccionar</option>
                      {CALENDAR_OPTIONS.map((option) => (
                        <option key={option} value={option} className="bg-[#0b1020] text-white">
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-white/82">
                    Jornada
                    <select
                      value={academicShift}
                      onChange={(event) => setAcademicShift(event.target.value)}
                      className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal text-white outline-none transition focus:border-cyan-200/60"
                    >
                      <option value="">Seleccionar</option>
                      {SHIFT_OPTIONS.map((option) => (
                        <option key={option} value={option} className="bg-[#0b1020] text-white">
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              {step === 'volume' ? (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-white/58">
                    Necesitamos estos datos para mostrarte el precio final. No prellenamos valores calculados.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-white/82">
                      Grados aproximados
                      <input
                        value={gradeCountInput}
                        onChange={(event) => setGradeCountInput(limitInteger(event.target.value))}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal text-white outline-none transition placeholder:text-white/28 focus:border-cyan-200/60"
                        placeholder="Ej. 3"
                        autoFocus
                        maxLength={FIELD_LIMITS.numeric}
                      />
                    </label>
                    <label className="block text-sm font-semibold text-white/82">
                      Estudiantes aproximados
                      <input
                        value={studentCountInput}
                        onChange={(event) => setStudentCountInput(limitInteger(event.target.value))}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal text-white outline-none transition placeholder:text-white/28 focus:border-cyan-200/60"
                        placeholder="Ej. 120"
                        maxLength={FIELD_LIMITS.numeric}
                      />
                    </label>
                  </div>
                  <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.08] p-4">
                    {modalInstitutionQuote ? (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">Precio final</p>
                        <p className={`${displaySerif} mt-2 text-3xl font-medium tracking-tight text-white`}>
                          Solicite una cotización
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-white/58">
                          {modalInstitutionQuote.studentCount} estudiantes.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm leading-relaxed text-white/58">
                        Escribe grados y estudiantes antes de enviar.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              {step === 'contact' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-white/82">
                  WhatsApp o telefono
                  <input
                    value={phone}
                    onChange={(event) => setPhone(limitPhone(event.target.value))}
                    inputMode="tel"
                    className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal text-white outline-none transition placeholder:text-white/28 focus:border-cyan-200/60"
                    placeholder="300 000 0000"
                    autoFocus
                    maxLength={FIELD_LIMITS.phone}
                  />
                </label>
                <label className="block text-sm font-semibold text-white/82">
                  Correo
                  <input
                    value={email}
                    onChange={(event) => setEmail(limitEmail(event.target.value))}
                    inputMode="email"
                    className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-normal text-white outline-none transition placeholder:text-white/28 focus:border-cyan-200/60"
                    placeholder="correo@institucion.edu.co"
                    maxLength={FIELD_LIMITS.email}
                  />
                </label>
              </div>
              ) : null}

              {step === 'notes' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.08] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">Precio final</p>
                    <p className={`${displaySerif} mt-2 text-3xl font-medium tracking-tight text-white`}>
                      {modalFinalPrice ? 'Solicite una cotización' : 'Pendiente'}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/58">
                      {kind === 'individual'
                        ? 'Simulacro individual con retroalimentación en vivo y grabaciones.'
                        : modalInstitutionQuote
                          ? `${modalInstitutionQuote.studentCount} estudiantes.`
                          : 'Faltan grados y estudiantes para calcular el total institucional.'}
                    </p>
                  </div>
                  <label className="block text-sm font-semibold text-white/82">
                    ¿Algo más que ventas deba saber?
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(limitText(event.target.value, FIELD_LIMITS.notes))}
                      className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-normal text-white outline-none transition placeholder:text-white/28 focus:border-cyan-200/60"
                      placeholder="Fecha tentativa, cantidad real, jornada, dudas..."
                      autoFocus
                      maxLength={FIELD_LIMITS.notes}
                    />
                    <span className="mt-1.5 block text-xs font-normal text-white/42">
                      {notes.length}/{FIELD_LIMITS.notes} caracteres.
                    </span>
                  </label>
                </div>
              ) : null}

              {kind === 'institution' && (step === 'location' || step === 'institution') ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-xs leading-relaxed text-white/45">
                  {catalogStatus === 'loading'
                    ? 'Cargando catálogo local (solo para instituciones)...'
                    : catalogStatus === 'ready'
                      ? `Catálogo: ${catalog?.departments.length ?? 0} departamentos${department.trim() ? `, ${catalog?.municipalities.length ?? 0} municipios en ${department.trim()}` : ''}${municipality.trim().length >= 2 ? `, ${catalog?.schools.length ?? 0} colegios en ${municipality.trim()}` : ''}.`
                      : 'Si el catálogo no carga, puedes escribir la institución manualmente.'}
                </div>
              ) : null}

              {error ? <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  Volver
                </button>
                {step === 'notes' ? (
                  <button
                    type="button"
                    onClick={submitLead}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-cyan-200 px-6 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    Enviar a WhatsApp
                    <MessageCircle className="h-4 w-4" aria-hidden />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={continueFromCurrentStep}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-cyan-200 px-6 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

