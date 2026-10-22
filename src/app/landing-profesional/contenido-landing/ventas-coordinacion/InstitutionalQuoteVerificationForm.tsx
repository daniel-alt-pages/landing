'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  buildWhatsAppSalesLeadUrl,
  getInstitutionQuote,
} from '@/lib/cotizacionSimulacro';
import { Pill } from '@/app/landing-profesional/contenido-landing/ui-componentes/LandingPrimitives';
import { displaySerif } from '@/app/landing-profesional/contenido-landing/content';
import type { ColombiaCatalogItem } from '@/app/landing-profesional/contenido-landing/tipos';
import { useColombiaSalesCatalog } from '@/app/landing-profesional/contenido-landing/utilidades/useColombiaSalesCatalog';
import { useInViewOnce } from '@/app/landing-profesional/contenido-landing/utilidades/useInViewOnce';
import { normalizeCatalogValue, saveSalesLeadLocally } from './SalesCoordinationModal';

type InstitutionalQuoteVerificationFormProps = {
  isLightLanding: boolean;
  onOpenFallback: () => void;
};

type VerificationState = 'pass' | 'warn' | 'missing';

type VerificationItem = {
  label: string;
  detail: string;
  state: VerificationState;
};

const TRUSTED_ROLE_KEYWORDS = [
  'rector',
  'coordinador',
  'director',
  'docente',
  'orientador',
  'secretario',
  'administrador',
  'propietario',
] as const;

const FIELD_LIMITS = {
  contactName: 70,
  customRole: 60,
  phone: 20,
  email: 100,
  department: 60,
  municipality: 40,
  institutionName: 100,
  numeric: 4,
  notes: 280,
  website: 60,
} as const;

const ROLE_OPTIONS = [
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

function sanitizeIntegerInput(value: string) {
  return value.replace(/\D/g, '');
}

function limitText(value: string, maxLength: number) {
  return value
    .replace(/[\u0000-\u001F\u007F<>]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);
}

function limitEmail(value: string) {
  return limitText(value, FIELD_LIMITS.email).replace(/\s/g, '').toLowerCase();
}

function parsePositiveInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '');
}

function normalizeColombianMobile(value: string) {
  const digits = normalizePhone(value);
  if (digits.startsWith('57') && digits.length === 12) return digits.slice(2);
  return digits;
}

function isLikelyRealColombianMobile(value: string) {
  const digits = normalizeColombianMobile(value);
  const allSame = /^(\d)\1+$/.test(digits);
  const fakeSequences = new Set(['3000000000', '3111111111', '3123456789', '3001234567', '3333333333']);
  return /^3\d{9}$/.test(digits) && !allSame && !fakeSequences.has(digits);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isLikelyInstitutionalEmail(value: string) {
  const email = value.trim().toLowerCase();
  return isValidEmail(email) && (email.endsWith('.edu.co') || email.endsWith('.gov.co') || email.includes('colegio'));
}

function findExactCatalogMatch(options: ColombiaCatalogItem[], value: string, filters?: Partial<ColombiaCatalogItem>) {
  const normalizedValue = normalizeCatalogValue(value);
  if (!normalizedValue) return undefined;

  return options.find((item) => {
    const nameMatches = normalizeCatalogValue(item.name) === normalizedValue;
    const departmentMatches = filters?.department
      ? item.department
        ? normalizeCatalogValue(item.department) === normalizeCatalogValue(filters.department)
        : true
      : true;
    const municipalityMatches = filters?.municipality
      ? item.municipality
        ? normalizeCatalogValue(item.municipality) === normalizeCatalogValue(filters.municipality)
        : true
      : true;
    return nameMatches && departmentMatches && municipalityMatches;
  });
}

function CatalogInput({
  label,
  value,
  onChange,
  options,
  placeholder,
  tone,
  helper,
  getMeta,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ColombiaCatalogItem[];
  placeholder: string;
  tone: 'light' | 'dark';
  helper?: string;
  getMeta?: (item: ColombiaCatalogItem) => string;
  maxLength: number;
}) {
  const [open, setOpen] = useState(false);
  const visibleOptions = options.slice(0, 14);
  const inputClass =
    tone === 'light'
      ? 'mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15'
      : 'mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/15';
  const dropdownClass =
    tone === 'light'
      ? 'border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-900/10'
      : 'border-white/12 bg-[#0b1020] text-white shadow-2xl shadow-black/50';

  return (
    <label className="relative block">
      <span className={`text-sm font-semibold ${tone === 'light' ? 'text-slate-950' : 'text-white'}`}>{label}</span>
      <input
        value={value}
        onChange={(event) => {
          onChange(limitText(event.target.value, maxLength));
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className={inputClass}
        placeholder={placeholder}
        autoComplete="off"
        maxLength={maxLength}
      />
      {helper ? (
        <span className={`mt-1.5 block text-xs ${tone === 'light' ? 'text-slate-500' : 'text-white/42'}`}>{helper}</span>
      ) : null}
      {open ? (
        <div className={`absolute z-[20] mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border p-1.5 ${dropdownClass}`}>
          {visibleOptions.length ? (
            visibleOptions.map((item) => (
              <button
                key={`${item.department || ''}-${item.municipality || ''}-${item.name}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(item.name);
                  setOpen(false);
                }}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition focus:outline-none ${
                  tone === 'light'
                    ? 'text-slate-900 hover:bg-slate-100 focus:bg-slate-100'
                    : 'text-white/86 hover:bg-cyan-200/12 focus:bg-cyan-200/12'
                }`}
              >
                <span className="block">{item.name}</span>
                {getMeta?.(item) ? (
                  <span className={`mt-0.5 block text-[11px] font-normal ${tone === 'light' ? 'text-slate-500' : 'text-white/42'}`}>
                    {getMeta(item)}
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <div className={`px-3 py-3 text-xs leading-relaxed ${tone === 'light' ? 'text-slate-500' : 'text-white/45'}`}>
              Sin coincidencias. Ajusta la búsqueda.
            </div>
          )}
        </div>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  tone,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  tone: 'light' | 'dark';
}) {
  const selectClass =
    tone === 'light'
      ? 'mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15'
      : 'mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/15';

  return (
    <label className="block">
      <span className={`text-sm font-semibold ${tone === 'light' ? 'text-slate-950' : 'text-white'}`}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        <option value="">Seleccionar</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function InstitutionalQuoteVerificationForm({
  isLightLanding,
  onOpenFallback,
}: InstitutionalQuoteVerificationFormProps) {
  const tone = isLightLanding ? 'light' : 'dark';
  const { ref: catalogViewRef, inView: catalogInView } = useInViewOnce(0.05);
  const [contactName, setContactName] = useState('');
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [municipality, setMunicipality] = useState('');
  const { catalog, catalogStatus } = useColombiaSalesCatalog(catalogInView, department, municipality);
  const [institutionName, setInstitutionName] = useState('');
  const [gradeCountInput, setGradeCountInput] = useState('3');
  const [studentCountInput, setStudentCountInput] = useState('120');
  const [calendar, setCalendar] = useState('');
  const [academicShift, setAcademicShift] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [truthAccepted, setTruthAccepted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [visitorId, setVisitorId] = useState('');
  const [formStartedAt] = useState(() => Date.now());
  const [website, setWebsite] = useState('');

  useEffect(() => {
    try {
      const key = 'sg-cotiz-visitor-id';
      const existing = window.localStorage.getItem(key);
      if (existing) {
        setVisitorId(existing);
        return;
      }
      const next = crypto.randomUUID();
      window.localStorage.setItem(key, next);
      setVisitorId(next);
    } catch {
      setVisitorId('');
    }
  }, []);

  const departmentOptions = useMemo(() => {
    const query = normalizeCatalogValue(department);
    return (catalog?.departments ?? [])
      .filter((item) => (query ? normalizeCatalogValue(item.name).includes(query) : true))
      .slice(0, 80);
  }, [catalog, department]);

  const municipalityOptions = useMemo(() => {
    const normalizedDepartment = normalizeCatalogValue(department);
    const query = normalizeCatalogValue(municipality);
    return (catalog?.municipalities ?? [])
      .filter((item) => {
        const sameDepartment = normalizedDepartment
          ? item.department
            ? normalizeCatalogValue(item.department) === normalizedDepartment
            : true
          : true;
        const matchesName = query ? normalizeCatalogValue(item.name).includes(query) : true;
        return sameDepartment && matchesName;
      })
      .slice(0, 80);
  }, [catalog, department, municipality]);

  const schoolOptions = useMemo(() => {
    const normalizedDepartment = normalizeCatalogValue(department);
    const normalizedMunicipality = normalizeCatalogValue(municipality);
    const query = normalizeCatalogValue(institutionName);
    return (catalog?.schools ?? [])
      .filter((item) => {
        const sameDepartment = normalizedDepartment
          ? item.department
            ? normalizeCatalogValue(item.department) === normalizedDepartment
            : true
          : true;
        const sameMunicipality = normalizedMunicipality
          ? normalizeCatalogValue(item.municipality || '') === normalizedMunicipality
          : true;
        const matchesName = query.length >= 2 ? normalizeCatalogValue(item.name).includes(query) : sameMunicipality;
        return sameDepartment && sameMunicipality && matchesName;
      })
      .slice(0, 80);
  }, [catalog, department, institutionName, municipality]);

  const gradeCount = parsePositiveInteger(gradeCountInput);
  const studentCount = parsePositiveInteger(studentCountInput);
  const quote = gradeCount && studentCount ? getInstitutionQuote(gradeCount, studentCount) : null;
  const finalRole = role === 'Otro (escribir)' ? customRole.trim() : role.trim();
  const phoneDigits = normalizeColombianMobile(phone);
  const phoneLooksColombian = isLikelyRealColombianMobile(phone);
  const departmentMatch = catalog ? findExactCatalogMatch(catalog.departments, department) : undefined;
  const municipalityMatch = catalog
    ? findExactCatalogMatch(catalog.municipalities, municipality, { department })
    : undefined;
  const schoolMatch = catalog
    ? findExactCatalogMatch(catalog.schools, institutionName, { department, municipality })
    : undefined;
  const roleLooksInstitutional = TRUSTED_ROLE_KEYWORDS.some((keyword) =>
    normalizeCatalogValue(finalRole).includes(keyword),
  );
  const contactLooksValid = phoneLooksColombian || isValidEmail(email);
  const strongContactSignal = phoneLooksColombian && (isLikelyInstitutionalEmail(email) || isValidEmail(email));
  const volumeLooksRealistic = gradeCount >= 1 && gradeCount <= 6 && studentCount >= 5 && studentCount <= 5000;

  const verificationItems: VerificationItem[] = [
    {
      label: 'Departamento',
      detail: departmentMatch ? 'Existe en catálogo Colombia.' : 'Debe coincidir con catálogo.',
      state: departmentMatch ? 'pass' : department ? 'warn' : 'missing',
    },
    {
      label: 'Municipio',
      detail: municipalityMatch ? 'Municipio pertenece al departamento.' : 'Cruce departamento/municipio pendiente.',
      state: municipalityMatch ? 'pass' : municipality ? 'warn' : 'missing',
    },
    {
      label: 'Institución',
      detail: schoolMatch ? 'Coincidencia exacta con colegio del catálogo local.' : 'Sin coincidencia exacta, no se marca verificada.',
      state: schoolMatch ? 'pass' : institutionName ? 'warn' : 'missing',
    },
    {
      label: 'Cargo',
      detail: roleLooksInstitutional ? 'Perfil compatible con decisión institucional.' : 'Indica rector, coordinador, docente o área administrativa.',
      state: roleLooksInstitutional ? 'pass' : role ? 'warn' : 'missing',
    },
    {
      label: 'Contacto',
      detail: strongContactSignal
        ? `WhatsApp colombiano identificado: +57 ${phoneDigits}.`
        : 'Agrega WhatsApp colombiano real y correo para trazabilidad.',
      state: strongContactSignal ? 'pass' : contactLooksValid ? 'warn' : 'missing',
    },
    {
      label: 'Volumen',
      detail: volumeLooksRealistic ? 'Rango de grados y estudiantes razonable.' : 'Revisa grados y estudiantes.',
      state: volumeLooksRealistic ? 'pass' : quote ? 'warn' : 'missing',
    },
    {
      label: 'Aplicación',
      detail: calendar && academicShift ? 'Calendario y jornada seleccionados.' : 'Selecciona calendario y jornada.',
      state: calendar && academicShift ? 'pass' : 'missing',
    },
    {
      label: 'Declaración',
      detail: truthAccepted ? 'El solicitante declara datos reales.' : 'Debe aceptar la declaración de veracidad.',
      state: truthAccepted ? 'pass' : 'missing',
    },
  ];

  const passedChecks = verificationItems.filter((item) => item.state === 'pass').length;
  const verificationReady =
    Boolean(contactName.trim()) &&
    Boolean(schoolMatch) &&
    roleLooksInstitutional &&
    strongContactSignal &&
    volumeLooksRealistic &&
    Boolean(calendar) &&
    Boolean(academicShift) &&
    truthAccepted;
  const inputClass =
    tone === 'light'
      ? 'mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15'
      : 'mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/15';
  const titleClass = tone === 'light' ? 'text-slate-950' : 'text-white';
  const mutedClass = tone === 'light' ? 'text-slate-600' : 'text-white/56';
  const subtleClass = tone === 'light' ? 'text-slate-500' : 'text-white/42';
  const panelClass = tone === 'light'
    ? 'border border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-900/6'
    : 'border border-white/[0.08] bg-white/[0.025] text-white shadow-2xl shadow-black/30';
  const nestedPanelClass = tone === 'light'
    ? 'border border-cyan-200 bg-cyan-50/70'
    : 'border border-cyan-400/18 bg-[#05070e]/85';

  const handleSubmit = async () => {
    setSubmitMessage('');
    setSubmitStatus('idle');
    if (!verificationReady || !quote) {
      setSubmitStatus('error');
      setSubmitMessage('Completa la pre-verificación antes de enviar la cotización institucional.');
      return;
    }

    const verificationSummary = verificationItems
      .map((item) => `${item.label}: ${item.state === 'pass' ? 'OK' : 'REVISAR'}`)
      .join(' | ');
    const lead = {
      kind: 'institution' as const,
      contactName: contactName.trim(),
      role: finalRole,
      phone: `+57${phoneDigits}`,
      email: email.trim(),
      department: department.trim(),
      municipality: municipality.trim(),
      institutionName: institutionName.trim(),
      gradeCount: quote.gradeCount,
      studentCount: quote.studentCount,
      notes: [
        `Pre-verificacion institucional: ${verificationSummary}.`,
        calendar.trim() ? `Calendario: ${calendar.trim()}.` : null,
        academicShift.trim() ? `Jornada: ${academicShift.trim()}.` : null,
        targetDate.trim() ? `Fecha tentativa: ${targetDate.trim()}.` : null,
        notes.trim() ? `Notas adicionales: ${notes.trim()}.` : null,
      ].filter(Boolean).join(' '),
      createdAt: new Date().toISOString(),
      source: 'landing-profesional-verification-form',
      verification: {
        passedChecks,
        totalChecks: verificationItems.length,
        catalogInstitution: schoolMatch,
      },
    };

    try {
      setSubmitStatus('submitting');
      const response = await fetch('/api/landing-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          visitorId,
          elapsedMs: Date.now() - formStartedAt,
          website,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || 'submit_failed');
      }

      saveSalesLeadLocally({ ...lead, serverLeadId: result.id });
      window.open(buildWhatsAppSalesLeadUrl(lead), '_blank', 'noopener,noreferrer');
      setSubmitStatus('success');
      setSubmitMessage('Solicitud guardada en Firebase y abierta en WhatsApp.');
    } catch {
      setSubmitStatus('error');
      setSubmitMessage('No se pudo guardar la solicitud. Revisa los datos o intenta de nuevo.');
    }
  };

  return (
    <div
      ref={catalogViewRef}
      className={`mx-auto grid w-full max-w-[min(80rem,100%)] gap-6 rounded-[1.75rem] p-[clamp(1.25rem,3vw,2rem)] sm:gap-8 sm:rounded-[2.4rem] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] ${panelClass}`}
    >
      <div>
        <label className="sr-only" aria-hidden="true">
          Sitio web
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(limitText(event.target.value, FIELD_LIMITS.website))}
            maxLength={FIELD_LIMITS.website}
          />
        </label>
        <Pill surface={tone}>Pre-verificación institucional</Pill>
        <h2 className={`${displaySerif} mt-5 text-4xl font-medium tracking-tight ${titleClass} sm:text-[2.75rem]`}>
          Formulario detallado para cotizar colegios reales.
        </h2>
        <p className={`mt-4 text-sm leading-relaxed ${mutedClass}`}>
          Antes de abrir WhatsApp, cruzamos departamento, municipio e institución contra el catálogo local. Esto no
          reemplaza validación administrativa, pero evita solicitudes falsas o incompletas.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={`text-sm font-semibold ${titleClass}`}>Nombre completo del solicitante</span>
            <input
              value={contactName}
              onChange={(event) => setContactName(limitText(event.target.value, FIELD_LIMITS.contactName))}
              placeholder="Ej. María Pérez"
              autoComplete="name"
              maxLength={FIELD_LIMITS.contactName}
              className={inputClass}
            />
          </label>
          <div>
            <SelectField
              label="Cargo o relación institucional"
              value={role}
              onChange={(nextRole) => {
                setRole(nextRole);
                if (nextRole !== 'Otro (escribir)') setCustomRole('');
              }}
              options={ROLE_OPTIONS}
              tone={tone}
            />
            {role === 'Otro (escribir)' ? (
              <input
                value={customRole}
                onChange={(event) => setCustomRole(limitText(event.target.value, FIELD_LIMITS.customRole))}
                placeholder="Escribe tu cargo"
                maxLength={FIELD_LIMITS.customRole}
                className={inputClass}
              />
            ) : null}
          </div>
          <label className="block">
            <span className={`text-sm font-semibold ${titleClass}`}>WhatsApp verificable</span>
            <input
              value={phone}
              onChange={(event) => setPhone(limitText(event.target.value.replace(/[^\d+\s()-]/g, ''), FIELD_LIMITS.phone))}
              placeholder="+57 300 000 0000"
              inputMode="tel"
              autoComplete="tel"
              maxLength={FIELD_LIMITS.phone}
              className={inputClass}
            />
            <span className={`mt-1.5 block text-xs ${phone ? phoneLooksColombian ? 'text-emerald-500' : 'text-amber-500' : subtleClass}`}>
              {phone ? phoneLooksColombian ? `Identificado como móvil colombiano +57 ${phoneDigits}.` : 'Debe ser móvil colombiano real: 10 dígitos y empezar por 3.' : 'Validamos formato móvil colombiano.'}
            </span>
          </label>
          <label className="block">
            <span className={`text-sm font-semibold ${titleClass}`}>Correo</span>
            <input
              value={email}
              onChange={(event) => setEmail(limitEmail(event.target.value))}
              placeholder="correo@institucion.edu.co"
              inputMode="email"
              autoComplete="email"
              maxLength={FIELD_LIMITS.email}
              className={inputClass}
            />
            <span className={`mt-1.5 block text-xs ${subtleClass}`}>Mejor si es dominio institucional.</span>
          </label>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <CatalogInput
            label="Departamento"
            value={department}
            onChange={(nextDepartment) => {
              setDepartment(nextDepartment);
              setMunicipality('');
              setInstitutionName('');
            }}
            options={departmentOptions}
            placeholder="Busca departamento"
            tone={tone}
            helper={catalogStatus === 'loading' ? 'Cargando catálogo...' : undefined}
            maxLength={FIELD_LIMITS.department}
          />
          <CatalogInput
            label="Municipio"
            value={municipality}
            onChange={(nextMunicipality) => {
              setMunicipality(nextMunicipality);
              setInstitutionName('');
            }}
            options={municipalityOptions}
            placeholder="Busca municipio"
            tone={tone}
            getMeta={(item) => item.department || ''}
            maxLength={FIELD_LIMITS.municipality}
          />
          <div className="sm:col-span-2">
            <CatalogInput
              label="Institución educativa"
              value={institutionName}
              onChange={setInstitutionName}
              options={schoolOptions}
              placeholder="Busca el nombre oficial del colegio"
              tone={tone}
              helper="Para envío verificado debe coincidir con departamento y municipio."
              getMeta={(item) => [item.municipality, item.department].filter(Boolean).join(' · ')}
              maxLength={FIELD_LIMITS.institutionName}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className={`text-sm font-semibold ${titleClass}`}>Grados</span>
            <input
              value={gradeCountInput}
              onChange={(event) => setGradeCountInput(sanitizeIntegerInput(event.target.value).slice(0, FIELD_LIMITS.numeric))}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={FIELD_LIMITS.numeric}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={`text-sm font-semibold ${titleClass}`}>Estudiantes</span>
            <input
              value={studentCountInput}
              onChange={(event) => setStudentCountInput(sanitizeIntegerInput(event.target.value).slice(0, FIELD_LIMITS.numeric))}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={FIELD_LIMITS.numeric}
              className={inputClass}
            />
          </label>
          <SelectField label="Calendario" value={calendar} onChange={setCalendar} options={CALENDAR_OPTIONS} tone={tone} />
          <SelectField label="Jornada" value={academicShift} onChange={setAcademicShift} options={SHIFT_OPTIONS} tone={tone} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <label className="block">
            <span className={`text-sm font-semibold ${titleClass}`}>Fecha tentativa</span>
            <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={`text-sm font-semibold ${titleClass}`}>Observaciones</span>
            <input
              value={notes}
              onChange={(event) => setNotes(limitText(event.target.value, FIELD_LIMITS.notes))}
              placeholder="Sedes, convenio, restricciones de horario..."
              maxLength={FIELD_LIMITS.notes}
              className={inputClass}
            />
            <span className={`mt-1.5 block text-xs ${subtleClass}`}>{notes.length}/{FIELD_LIMITS.notes} caracteres.</span>
          </label>
        </div>

        <label className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 ${tone === 'light' ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/20'}`}>
          <input
            type="checkbox"
            checked={truthAccepted}
            onChange={(event) => setTruthAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-400"
          />
          <span className={`text-sm leading-relaxed ${mutedClass}`}>
            Declaro que los datos corresponden a una institución real, que puedo solicitar esta cotización y que autorizo a SEAMOSGENIOS SAS a usarlos solo para responderla.
          </span>
        </label>
        <p className={`mt-3 text-sm leading-relaxed ${mutedClass}`}>
          <a className="underline" href="/legal/privacidad">Política de privacidad</a>
          {' · '}
          <a className="underline" href="/legal/terminos">Términos</a>
          {' · '}
          <a className="underline" href="/legal/cookies">Cookies</a>
        </p>
      </div>

      <aside className={`rounded-[2rem] p-5 backdrop-blur-sm ${nestedPanelClass}`} aria-label="Resultado de verificación">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`font-mono text-[11px] uppercase tracking-[0.22em] ${tone === 'light' ? 'text-cyan-700' : 'text-cyan-200/85'}`}>
              Cotización verificada
            </p>
            <p className={`${displaySerif} mt-3 text-[clamp(2rem,8vw,3.25rem)] font-medium tracking-tight ${titleClass} sm:text-5xl`}>
              {quote ? 'Solicite una cotización' : 'Pendiente'}
            </p>
            <p className={`mt-2 text-sm ${mutedClass}`}>
              {quote ? `${quote.studentCount} estudiantes.` : 'Completa grados y estudiantes.'}
            </p>
          </div>
          <Building2 className={`h-9 w-9 ${tone === 'light' ? 'text-slate-300' : 'text-white/35'}`} aria-hidden />
        </div>

        <div className={`mt-6 rounded-2xl border p-4 ${tone === 'light' ? 'border-slate-200 bg-white' : 'border-white/[0.07] bg-white/[0.03]'}`}>
          <div className="flex items-center justify-between gap-3">
            <span className={`text-sm font-bold ${titleClass}`}>Nivel de verificación</span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${verificationReady ? 'bg-emerald-500/14 text-emerald-300' : 'bg-amber-500/14 text-amber-300'}`}>
              {passedChecks}/{verificationItems.length}
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${verificationReady ? 'bg-emerald-400' : 'bg-amber-300'}`}
              style={{ width: `${(passedChecks / verificationItems.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {verificationItems.map((item) => {
            const Icon = item.state === 'pass' ? CheckCircle2 : item.state === 'warn' ? AlertTriangle : ShieldCheck;
            const iconClass =
              item.state === 'pass'
                ? 'text-emerald-300'
                : item.state === 'warn'
                  ? 'text-amber-300'
                  : tone === 'light'
                    ? 'text-slate-400'
                    : 'text-white/35';
            return (
              <div key={item.label} className={`flex gap-3 rounded-2xl border p-3 ${tone === 'light' ? 'border-slate-200 bg-white' : 'border-white/[0.07] bg-black/20'}`}>
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} aria-hidden />
                <div>
                  <p className={`text-sm font-bold ${titleClass}`}>{item.label}</p>
                  <p className={`mt-1 text-xs leading-relaxed ${subtleClass}`}>{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!verificationReady || submitStatus === 'submitting'}
          className={`mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 ${
            verificationReady && submitStatus !== 'submitting'
              ? 'bg-cyan-200 text-slate-950 hover:bg-white focus:ring-cyan-300'
              : tone === 'light'
                ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                : 'cursor-not-allowed bg-white/10 text-white/35'
          }`}
        >
          {submitStatus === 'submitting' ? 'Validando límites y guardando...' : 'Enviar solicitud verificada'}
          <MessageCircle className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onOpenFallback}
          className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
            tone === 'light'
              ? 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 focus:ring-slate-400/30'
              : 'border-white/20 text-white/75 hover:border-white/35 hover:bg-white/[0.05] focus:ring-white/25'
          }`}
        >
          Usar formulario rápido
          <BadgeCheck className="h-4 w-4" aria-hidden />
        </button>
        {submitMessage ? (
          <p
            role="status"
            className={`mt-3 rounded-2xl border p-3 text-xs leading-relaxed ${
              submitStatus === 'success'
                ? 'border-emerald-300/25 bg-emerald-500/10 text-emerald-200'
                : 'border-amber-300/25 bg-amber-500/10 text-amber-200'
            }`}
          >
            {submitMessage}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
