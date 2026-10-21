'use client';

import LoginBirthDateField from '@features/auth/components/LoginBirthDateField';
import type { StudentLookupResult } from '@features/simulacro/lib/firestoreService';
import { formatLockRemaining } from '@/lib/directLoginLockout';
import { isDirectLoginEnabled } from '@/lib/directLoginFeature';

const LOGO_URL =
  'https://ik.imagekit.io/danydc/ICONS%20-%20SIMULACROS%20%20SG/logo%20%20SG%20con%20letras%20y%20contorno%20blanco.svg?updatedAt=1783621852886';
/** Same-origin: mask-image CSS rompe con ImageKit/Prismic cross-origin. */
const LOGO_MASK_URL = '/brand/sg-logo-letras-contorno.png';

const SECURE_INPUT_PROPS = {
  'data-sg-secure-input': '1',
  autoComplete: 'off' as const,
  autoCorrect: 'off' as const,
  autoCapitalize: 'off' as const,
  spellCheck: false,
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-bwignore': 'true',
  'data-form-type': 'other',
};

const STUDENT_ID_MAX_LENGTH = 20;

function normalizeStudentIdInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, STUDENT_ID_MAX_LENGTH);
}

export type EstudianteLoginShellProps = {
  mounted: boolean;
  error: string;
  isBrowserError: boolean;
  loading: boolean;
  isInitialized: boolean;
  showGoogleLogin: boolean;
  onToggleGoogle: () => void;
  onGoogleLogin: () => void;
  onShowBrowserHelp: () => void;
  directLoginId: string;
  onDirectLoginIdChange: (value: string) => void;
  directBirthDisplay: string;
  onDirectBirthChange: (display: string, iso: string | null) => void;
  directBirthIso: string | null;
  onDirectLogin: () => void;
  directLoading: boolean;
  directError: string;
  directLoginLocked: boolean;
  directLockRemainingMs: number;
  directLoginAttempts: number;
  showDirectLoginWhatsApp: boolean;
  supportWhatsAppUrl: string | null;
  onDirectLoginWhatsApp: () => void;
  lookupId: string;
  onLookupIdChange: (value: string) => void;
  onLookup: () => void;
  lookupLoading: boolean;
  lookupResult: StudentLookupResult | null;
  lookupError: string;
};

function LoginPanelCard({
  accent,
  children,
  className = '',
  innerClassName = '',
}: {
  accent: string;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={`login-panel-card rounded-2xl p-[1px] ${className}`}
      style={{ ['--panel-accent' as string]: accent }}
    >
      <div className={`login-panel-inner rounded-[15px] relative overflow-x-clip ${innerClassName}`}>
        <span aria-hidden className="login-panel-shine" />
        <div className="relative z-[2] w-full min-w-0 max-w-full">{children}</div>
      </div>
    </div>
  );
}

function WhatsAppAdvisorButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-bold text-white transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, #25D366, #128C7E)',
        boxShadow: '0 4px 20px rgba(37,211,102,0.25)',
      }}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      Hablar con un asesor por WhatsApp
    </button>
  );
}

export default function EstudianteLoginShell(props: EstudianteLoginShellProps) {
  const {
    mounted,
    error,
    isBrowserError,
    loading,
    isInitialized,
    showGoogleLogin,
    onToggleGoogle,
    onGoogleLogin,
    onShowBrowserHelp,
    directLoginId,
    onDirectLoginIdChange,
    directBirthDisplay,
    onDirectBirthChange,
    directBirthIso,
    onDirectLogin,
    directLoading,
    directError,
    directLoginLocked,
    directLockRemainingMs,
    directLoginAttempts,
    showDirectLoginWhatsApp,
    supportWhatsAppUrl,
    onDirectLoginWhatsApp,
    lookupId,
    onLookupIdChange,
    onLookup,
    lookupLoading,
    lookupResult,
    lookupError,
  } = props;

  const directLoginEnabled = isDirectLoginEnabled();
  const showGooglePanel = directLoginEnabled ? showGoogleLogin : true;

  const canDirectLogin =
    directLoginEnabled &&
    directLoginId.trim().length > 0 &&
    !!directBirthIso &&
    !directLoading &&
    !directLoginLocked;

  return (
    <div
      className="relative w-full max-w-2xl min-w-0"
      style={{
        zIndex: 10,
        animation: mounted ? 'fadeInUp 0.7s ease-out forwards' : 'none',
        opacity: mounted ? 1 : 0,
      }}
    >
      <div className="text-center mb-6">
        <p className="text-[11px] font-semibold tracking-[3px] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Seamos Genios
        </p>
      </div>

      <div className="login-content-inner relative overflow-x-clip rounded-3xl sm:rounded-[2.5rem]">
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 z-[1] h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), rgba(6, 182, 212, 0.5), transparent)',
          }}
        />
        <span aria-hidden className="login-content-shine" />

        <div className="relative z-[2] flex w-full min-w-0 max-w-full flex-col items-stretch px-3 pt-5 pb-5 sm:px-8 sm:pt-8 sm:pb-8">
          <div className="mx-auto w-full min-w-0 max-w-lg">
            <div className="flex justify-center mb-5 sm:mb-8">
              <div className="login-logo-wrap" style={{ ['--login-logo-mask' as string]: `url("${LOGO_MASK_URL}")` }}>
                <img src={LOGO_URL} alt="Logo Seamos Genios" className="login-logo-img" />
                <span aria-hidden className="login-logo-shine login-logo-shine--a" />
                <span aria-hidden className="login-logo-shine login-logo-shine--b" />
                <span aria-hidden className="login-logo-shine login-logo-shine--c" />
                <span aria-hidden className="login-logo-shine login-logo-shine--d" />
              </div>
            </div>

            <h1 className="login-page-title text-center font-black mb-2 sm:mb-3 leading-tight text-white">
              Acceso estudiantes
            </h1>
            <p className="text-center text-sm sm:text-base font-medium mb-6 sm:mb-10" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {directLoginEnabled
                ? 'Curso PreICFES y resultados de simulacros · SG 2026'
                : 'Ingresa con Google. Tu documento identifica tu perfil y permisos de curso.'}
            </p>

            {error && (
              <div
                className="rounded-2xl px-5 py-4 mb-6"
                style={{
                  background: isBrowserError ? 'rgba(251, 191, 36, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${isBrowserError ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                }}
              >
                <p className="text-sm leading-relaxed" style={{ color: isBrowserError ? 'rgba(251,191,36,0.9)' : 'rgba(239,68,68,0.9)' }}>
                  {error}
                </p>
                {isBrowserError && (
                  <button
                    type="button"
                    onClick={onShowBrowserHelp}
                    className="mt-3 w-full py-2.5 font-semibold rounded-xl text-xs"
                    style={{
                      background: 'rgba(251, 191, 36, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(251, 191, 36, 0.25)',
                    }}
                  >
                    Ver cómo solucionarlo
                  </button>
                )}
              </div>
            )}

            {!directLoginEnabled && (
              <div className="mb-6">
                <p
                  className="mb-3 text-center text-xs leading-relaxed px-2"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  Usa el mismo correo que registraste en tu formulario de inscripción (simulacro o
                  curso vacacional).
                </p>
                <button
                  type="button"
                  onClick={onGoogleLogin}
                  disabled={loading || !isInitialized}
                  className="flex w-full min-w-0 max-w-full items-center justify-center gap-2 rounded-2xl px-3 py-4 transition-all duration-300 disabled:opacity-50 sm:gap-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(6, 182, 212, 0.25))',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    boxShadow: '0 4px 24px rgba(124, 58, 237, 0.25)',
                  }}
                >
                  <div className="shrink-0 rounded-lg bg-white p-1 shadow-sm">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <span className="min-w-0 text-center text-sm font-semibold text-white sm:text-base">
                    {loading ? 'Autenticando...' : 'Continuar con Google'}
                  </span>
                </button>
              </div>
            )}

            {directLoginEnabled && (
            <LoginPanelCard accent="139, 92, 246" className="mb-6" innerClassName="px-4 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6">
                <div className="login-form-heading mb-5 flex w-full min-w-0 items-start gap-3 text-left">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(139, 92, 246, 0.15)' }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="rgba(167,139,250,1)" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold leading-tight text-white">Acceso Directo</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-pretty" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      Número de identificación y fecha de nacimiento
                    </p>
                  </div>
                </div>

                <div className="mb-3 w-full">
                  <label htmlFor="login-id-input" className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Número de Identificación
                  </label>
                  <div className="relative w-full">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="rgba(167,139,250,0.7)" strokeWidth={2}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
                        />
                      </svg>
                    </div>
                    <input
                      id="login-id-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={STUDENT_ID_MAX_LENGTH}
                      placeholder="Ej: 1002367670"
                      value={directLoginId}
                      disabled={directLoading || directLoginLocked}
                      className="login-field-input w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 transition-all disabled:opacity-50"
                      {...SECURE_INPUT_PROPS}
                      onChange={(e) => onDirectLoginIdChange(normalizeStudentIdInput(e.target.value))}
                      onKeyDown={(e) => e.key === 'Enter' && canDirectLogin && onDirectLogin()}
                    />
                  </div>
                </div>

                <div className="mb-5 w-full">
                  <label htmlFor="login-birth-input" className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Fecha de Nacimiento
                  </label>
                  <LoginBirthDateField
                    value={directBirthDisplay}
                    onChange={onDirectBirthChange}
                    disabled={directLoading || directLoginLocked}
                  />
                </div>

                {directLoginLocked && (
                  <p className="mb-4 text-sm leading-relaxed text-amber-200/90">
                    Acceso con documento bloqueado {formatLockRemaining(directLockRemainingMs)}. Entra con
                    Google o contacta a un asesor.
                  </p>
                )}

                {!directLoginLocked && directLoginAttempts > 0 && directLoginAttempts < 3 && (
                  <p className="mb-4 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Intento {directLoginAttempts} de 3. También puedes entrar con Google usando el correo del
                    formulario.
                  </p>
                )}

                {directError && (
                  <p className="mb-4 text-sm text-red-300/90 leading-relaxed">{directError}</p>
                )}

                {showDirectLoginWhatsApp && supportWhatsAppUrl && (
                  <WhatsAppAdvisorButton onClick={onDirectLoginWhatsApp} />
                )}

                <button
                  id="btn-id-birth-login"
                  type="button"
                  disabled={!canDirectLogin}
                  onClick={onDirectLogin}
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  style={{
                    background: canDirectLogin
                      ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                      : 'rgba(139, 92, 246, 0.25)',
                    cursor: canDirectLogin ? 'pointer' : 'not-allowed',
                    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.35)',
                  }}
                >
                  {directLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Validando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                        />
                      </svg>
                      Ingresar
                    </>
                  )}
                </button>
            </LoginPanelCard>
            )}

            {directLoginEnabled && (
            <div className="mb-4 flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <button
                id="btn-toggle-google"
                type="button"
                onClick={onToggleGoogle}
                className="text-xs font-medium px-3 py-1 rounded-full transition-all"
                style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {showGoogleLogin ? 'Ocultar Google' : '¿Inscribiste con Gmail? → Google'}
              </button>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
            )}

            {showGooglePanel && directLoginEnabled && (
              <div className="mb-6">
                <p
                  className="mb-3 text-center text-xs leading-relaxed px-2"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  Inicia sesión con el mismo correo que registraste en tu formulario de inscripción
                  (simulacro o curso vacacional).
                </p>
                <button
                  type="button"
                  onClick={onGoogleLogin}
                  disabled={loading || !isInitialized}
                  className="w-full rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 py-4 disabled:opacity-50"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="p-1 bg-white rounded-lg shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <span className="text-base font-semibold text-white">
                  {loading ? 'Autenticando...' : 'Continuar con Google'}
                </span>
              </button>
              </div>
            )}

            {/* Consulta documento */}
            <LoginPanelCard accent="6, 182, 212" className="mt-2 mb-8" innerClassName="p-4 sm:p-6">
                <div className="mb-5 flex min-w-0 items-start gap-3 sm:gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25"
                    style={{ background: 'rgba(20, 184, 166, 0.12)' }}
                  >
                    <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 text-base font-bold leading-snug text-pretty text-white">
                      {directLoginEnabled ? 'Consultar Simulacros Asignados' : 'Verifica tu correo registrado'}
                    </h3>
                    <p className="text-sm leading-relaxed text-pretty text-slate-400">
                      {directLoginEnabled
                        ? 'Busca qué simulacros tienes disponibles con tu número de documento'
                        : 'Consulta con qué correo está vinculado tu documento antes de entrar con Google'}
                    </p>
                  </div>
                </div>

                <div className="login-lookup-row flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                  <div className="relative flex-1 min-w-0 w-full">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-teal-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                    <input
                      id="lookup-id-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={STUDENT_ID_MAX_LENGTH}
                      placeholder="Ej: 1002367670"
                      value={lookupId}
                      disabled={lookupLoading}
                      className="login-field-input w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 transition-all disabled:opacity-50"
                      {...SECURE_INPUT_PROPS}
                      onChange={(e) => onLookupIdChange(normalizeStudentIdInput(e.target.value))}
                      onKeyDown={(e) => e.key === 'Enter' && lookupId.trim() && onLookup()}
                    />
                  </div>
                  <button
                    id="btn-id-lookup"
                    type="button"
                    disabled={lookupLoading || !lookupId.trim()}
                    onClick={onLookup}
                    className="login-lookup-btn w-full sm:w-auto shrink-0 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                    style={{
                      background: 'linear-gradient(135deg, #0d9488, #0891b2)',
                      cursor: lookupId.trim() && !lookupLoading ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {lookupLoading ? '...' : 'Buscar'}
                  </button>
                </div>

                {lookupError && <p className="mt-4 text-sm text-red-300/90">{lookupError}</p>}

                {lookupResult && !lookupError && (
                  <div
                    className="mt-4 rounded-xl p-4"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}
                  >
                    <p className="text-emerald-300 font-bold text-sm mb-1">{lookupResult.nombre}</p>
                    <p className="text-slate-300 text-xs font-mono">{lookupResult.emailMasked}</p>
                    {lookupResult.simulacros?.length > 0 && (
                      <p className="text-slate-400 text-xs mt-2">
                        Simulacros: {lookupResult.simulacros.join(', ')}
                      </p>
                    )}
                  </div>
                )}
            </LoginPanelCard>

            <p className="text-center text-xs mt-6 leading-relaxed px-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Ingresa con tu correo institucional para acceder a tus reportes.
            </p>
          </div>
        </div>

        <div className="relative z-[2] px-4 py-4 text-center sm:px-8" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © 2026 Seamos Genios · Colombia
          </p>
        </div>
      </div>

      {/* pb leaves room for Next.js DevTools “N” badge (bottom-left) */}
      <div className="mt-5 mb-14 flex flex-wrap items-center justify-center gap-4 sm:mb-5">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'rgba(255,255,255,0.55)' }}>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
          <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Alineado al ICFES
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'rgba(255,255,255,0.55)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Datos en tiempo real
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'rgba(255,255,255,0.55)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
            100% Gratuito
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'rgba(255,255,255,0.45)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Conexión protegida con Google
        </p>
      </div>
    </div>
  );
}
