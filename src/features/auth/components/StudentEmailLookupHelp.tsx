'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { Search, Mail, Info } from 'lucide-react';
import { lookupStudentEmailHelp } from '@features/auth/lib/loadStudentLookup';
import { isValidStudentId, sanitizeInput } from '@/lib/security';

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; nombre: string; emailMasked: string; simCount: number }
  | { status: 'not-found' }
  | { status: 'invalid' }
  | { status: 'error' };

export default function StudentEmailLookupHelp() {
  const [documentId, setDocumentId] = useState('');
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });

  const handleLookup = useCallback(async () => {
    const normalized = sanitizeInput(documentId.trim());
    if (!normalized) {
      setLookup({ status: 'invalid' });
      return;
    }
    if (!isValidStudentId(normalized)) {
      setLookup({ status: 'invalid' });
      return;
    }

    setLookup({ status: 'loading' });
    try {
      const result = await lookupStudentEmailHelp(normalized);
      if (!result?.found || !result.emailMasked) {
        setLookup({ status: 'not-found' });
        return;
      }
      setLookup({
        status: 'found',
        nombre: result.nombre.trim() || 'Estudiante',
        emailMasked: result.emailMasked,
        simCount: result.simulacros?.length ?? 0,
      });
    } catch {
      setLookup({ status: 'error' });
    }
  }, [documentId]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void handleLookup();
  };

  return (
    <div
      className="mb-6 rounded-2xl border px-4 py-4 sm:px-5"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.08)',
        background: 'rgba(255, 255, 255, 0.03)',
      }}
    >
      <div className="login-form-heading mb-3">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em] mb-1"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          Consulta tu correo
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Ingresa tu documento para ver el correo enmascarado registrado. Luego continúa con Google — esto no
          inicia sesión.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
        <label className="sr-only" htmlFor="login-lookup-document">
          Número de documento
        </label>
        <input
          id="login-lookup-document"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Documento de identidad"
          value={documentId}
          onChange={(event) => {
            setDocumentId(event.target.value);
            if (lookup.status !== 'idle' && lookup.status !== 'loading') {
              setLookup({ status: 'idle' });
            }
          }}
          className="login-field-input login-lookup-input h-11 flex-1 rounded-xl px-3.5 text-sm text-white placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={lookup.status === 'loading'}
          className="login-lookup-btn inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition disabled:opacity-50"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          {lookup.status === 'loading' ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {lookup.status === 'found' ? (
        <div
          className="mt-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(34, 211, 238, 0.08)',
            border: '1px solid rgba(34, 211, 238, 0.22)',
          }}
          role="status"
        >
          <p className="text-sm font-semibold text-cyan-100">{lookup.nombre}</p>
          <p className="mt-1 flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <Mail className="h-4 w-4 shrink-0 text-cyan-300/90" aria-hidden />
            <span>
              Correo registrado: <strong className="font-semibold">{lookup.emailMasked}</strong>
            </span>
          </p>
          {lookup.simCount > 0 ? (
            <p className="mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {lookup.simCount === 1
                ? '1 simulacro vinculado a este documento.'
                : `${lookup.simCount} simulacros vinculados a este documento.`}
            </p>
          ) : null}
          <p className="mt-2 text-xs leading-relaxed" style={{ color: 'rgba(165, 243, 252, 0.85)' }}>
            Usa ese correo (cuenta Google) en el botón de arriba para entrar.
          </p>
        </div>
      ) : null}

      {lookup.status === 'not-found' ? (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: 'rgba(251, 191, 36, 0.9)' }} role="status">
          No encontramos un perfil con ese documento. Verifica el número o contacta a un asesor.
        </p>
      ) : null}

      {lookup.status === 'invalid' ? (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: 'rgba(251, 191, 36, 0.9)' }} role="status">
          Ingresa un documento válido (solo números, formato colombiano).
        </p>
      ) : null}

      {lookup.status === 'error' ? (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: 'rgba(239, 68, 68, 0.9)' }} role="status">
          No pudimos consultar en este momento. Intenta de nuevo o contacta a un asesor.
        </p>
      ) : null}

      <p
        className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.38)' }}
      >
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Solo muestra parte del correo por privacidad. El acceso al panel siempre es con Google.
      </p>
    </div>
  );
}
