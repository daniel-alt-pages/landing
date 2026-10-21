'use client';

import { useEffect, useId, useState, useSyncExternalStore, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CONTACTO } from '../../_contenido/contacto';
import { CIERRE } from '../../_contenido/paginas';
import { track } from '../../_lib/analytics';
import {
  CARGOS,
  DEPARTAMENTOS,
  PENDING_LEAD_KEY,
  RANGOS_ESTUDIANTES,
  isSpam,
  leadPayload,
  leadWhatsappBody,
  validateLead,
  type LeadInput,
} from '../../_lib/lead';
import { interesFromHash, type Interes } from '../../_lib/links';
import { captureCampaign } from '../../_lib/cookies';
import { buildWaUrl } from '../../_lib/whatsapp';
import { SearchChoice } from './SearchChoice';

type Fields = Omit<LeadInput, 'interes' | 't0' | 'now'>;

const EMPTY: Fields = {
  nombre: '',
  cargo: '',
  institucion: '',
  departamento: '',
  municipio: '',
  estudiantes11: '',
  mensaje: '',
  whatsapp: '',
  correo: '',
  consentimiento: false,
  sitio_web: '',
};

function subscribeHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function LeadForm() {
  const router = useRouter();
  const formId = useId();
  const [t0] = useState(() => Date.now());
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => '');
  const [manual, setManual] = useState<{ value: Interes; hash: string } | null>(null);
  const interes: Interes = manual && manual.hash === hash ? manual.value : interesFromHash(hash) ?? 'reunion';
  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [fallback, setFallback] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(PENDING_LEAD_KEY);
    if (!raw || !CONTACTO.leadsUrl) return;
    void fetch(CONTACTO.leadsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: raw,
    })
      .then((response) => {
        if (response.ok) localStorage.removeItem(PENDING_LEAD_KEY);
      })
      .catch(() => undefined);
  }, []);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const utm = captureCampaign(window.location.search, document.referrer);
    const input: LeadInput = {
      ...values,
      interes,
      t0,
      now: Date.now(),
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      utm_term: utm.utm_term,
      referrer: utm.referrer,
    };
    if (isSpam(input)) return;
    const found = validateLead(input);
    if (found.length) {
      const map: Record<string, string> = {};
      found.forEach((item) => {
        map[item.field] = item.message;
      });
      setErrors(map);
      event.currentTarget.querySelector<HTMLElement>(`[name="${found[0].field}"]`)?.focus();
      return;
    }
    setErrors({});
    const payload = JSON.stringify(leadPayload(input));
    if (!CONTACTO.leadsUrl) {
      setStatus('error');
      setFallback(leadWhatsappBody(input));
      track('lead_error', { reason: 'sin_url' });
      return;
    }
    setStatus('submitting');
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(CONTACTO.leadsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('status');
      track('submit_lead', { interes: input.interes, cargo: input.cargo, estudiantes11: input.estudiantes11 });
      router.push(`/landing/gracias?tipo=${input.interes}`);
    } catch {
      localStorage.setItem(PENDING_LEAD_KEY, payload);
      setFallback(leadWhatsappBody(input));
      setStatus('error');
      track('lead_error', { reason: 'red' });
    } finally {
      window.clearTimeout(timer);
    }
  }

  const err = (field: string) => errors[field];

  return (
    <form className="ag-form" onSubmit={onSubmit} noValidate aria-describedby={`${formId}-live`}>
      <h3 className="ag-h3">{CIERRE.formTitulo}</h3>
      <p className="ag-form-lead">{CIERRE.formLead}</p>
      <p id={`${formId}-live`} aria-live="polite" className="ag-form-alert">
        {status === 'error' ? 'No pudimos registrar su solicitud en este momento. Envíela por WhatsApp y le respondemos igual de rápido.' : ''}
      </p>
      <fieldset className="ag-field ag-segment">
        <legend>¿Qué desea solicitar?</legend>
        {(['reunion', 'simulacro'] as const).map((option) => (
          <label key={option} data-checked={interes === option}>
            <input
              type="radio"
              name="interes"
              value={option}
              checked={interes === option}
              onChange={() => setManual({ value: option, hash })}
            />
            {option === 'reunion' ? 'Reunión de 30 min' : 'Simulacro gratis'}
          </label>
        ))}
      </fieldset>
      <div className="ag-form-grid">
        <Field label="Nombre completo" name="nombre" value={values.nombre} error={err('nombre')} onChange={(value) => set('nombre', value)} autoComplete="name" />
        <SearchChoice label="Cargo" name="cargo" value={values.cargo} options={CARGOS} placeholder="Seleccione su cargo" error={err('cargo')} onChange={(value) => set('cargo', value)} />
        <Field label="Institución" name="institucion" value={values.institucion} error={err('institucion')} onChange={(value) => set('institucion', value)} autoComplete="organization" />
        <SearchChoice label="Departamento" name="departamento" value={values.departamento} options={DEPARTAMENTOS} placeholder="Elija uno" error={err('departamento')} onChange={(value) => set('departamento', value)} />
        <Field label="Municipio" name="municipio" value={values.municipio} error={err('municipio')} onChange={(value) => set('municipio', value)} />
        <SearchChoice label="Estudiantes de grado 11" name="estudiantes11" value={values.estudiantes11} options={RANGOS_ESTUDIANTES} placeholder="Seleccione un rango" error={err('estudiantes11')} onChange={(value) => set('estudiantes11', value)} />
        <Field label="WhatsApp" name="whatsapp" value={values.whatsapp} error={err('whatsapp')} onChange={(value) => set('whatsapp', value)} inputMode="tel" autoComplete="tel" />
        <Field label="Correo (opcional)" name="correo" value={values.correo} error={err('correo')} onChange={(value) => set('correo', value)} type="email" autoComplete="email" />
      </div>
      <label className="ag-field ag-field-grow">
        <span>Qué quiere lograr (opcional)</span>
        <textarea
          name="mensaje"
          rows={4}
          value={values.mensaje}
          aria-invalid={Boolean(err('mensaje'))}
          aria-describedby={err('mensaje') ? 'mensaje-error' : undefined}
          placeholder="Grados, calendario o la duda que quiere resolver"
          onChange={(event) => set('mensaje', event.target.value)}
        />
        {err('mensaje') ? (
          <p className="ag-error" id="mensaje-error">
            {err('mensaje')}
          </p>
        ) : null}
      </label>
      <label className="ag-consent-check">
        <input type="checkbox" name="consentimiento" checked={values.consentimiento} onChange={(event) => set('consentimiento', event.target.checked)} />
        <span>
          Autorizo el tratamiento de mis datos según la <a href="/landing/politica-de-datos">Política de datos</a>.
        </span>
      </label>
      {err('consentimiento') ? <p className="ag-error">{err('consentimiento')}</p> : null}
      <div className="ag-hp" aria-hidden>
        <label>
          Sitio web
          <input name="sitio_web" tabIndex={-1} autoComplete="off" value={values.sitio_web} onChange={(event) => set('sitio_web', event.target.value)} />
        </label>
      </div>
      <button className="ag-btn ag-btn-block" type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Enviando' : interes === 'simulacro' ? 'Solicitar simulacro gratis' : 'Solicitar reunión'}
      </button>
      <p className="ag-form-note">Sin costo y sin compromiso. Respondemos en un día hábil.</p>
      {status === 'error' && fallback ? (
        <a className="ag-btn-ghost ag-btn-block" href={buildWaUrl(CONTACTO.whatsappB2B, fallback)}>
          Enviar por WhatsApp
        </a>
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  value,
  error,
  onChange,
  type = 'text',
  inputMode,
  autoComplete,
}: {
  label: string;
  name: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: 'tel' | 'email';
  autoComplete?: string;
}) {
  const described = error ? `${name}-error` : undefined;
  return (
    <label className="ag-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={described}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p className="ag-error" id={described}>
          {error}
        </p>
      ) : null}
    </label>
  );
}
