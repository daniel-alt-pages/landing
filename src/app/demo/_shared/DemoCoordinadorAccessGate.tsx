'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { isDemoCoordinadorAccessGranted } from './demoCoordinadorAccess';

type DemoCoordinadorAccessGateProps = {
  children: React.ReactNode;
  /** Espera validación de ?token= en el padre antes de mostrar "Acceso restringido". */
  deferUntilTokenChecked?: boolean;
};

/**
 * Solo deja pasar si `sessionStorage` fue desbloqueado vía
 * `/acceso-demo/coordinador?token=…` (o `?token=` en esta ruta, manejado arriba).
 */
export function DemoCoordinadorAccessGate({
  children,
  deferUntilTokenChecked = false,
}: DemoCoordinadorAccessGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (deferUntilTokenChecked) {
      const timer = window.setTimeout(() => {
        setUnlocked(isDemoCoordinadorAccessGranted());
        setHydrated(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    setUnlocked(isDemoCoordinadorAccessGranted());
    setHydrated(true);
  }, [deferUntilTokenChecked]);

  if (!hydrated) {
    return (
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0a0b10]"
        style={{ fontFamily: "'Inter', sans-serif" }}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" aria-hidden />
          <p className="text-sm text-white/45">Verificando acceso…</p>
        </div>
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  return (
    <div
      className="fixed inset-0 z-[130] flex min-h-dvh flex-col items-center justify-center bg-[#0a0b10] px-4 py-10"
      style={{ fontFamily: "'Inter', sans-serif" }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="demo-coord-denied-title"
      aria-describedby="demo-coord-denied-desc"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
          <ShieldAlert className="h-6 w-6 text-amber-300" aria-hidden />
        </div>
        <h1 id="demo-coord-denied-title" className="text-lg font-bold text-white">
          Acceso restringido
        </h1>
        <p id="demo-coord-denied-desc" className="mt-3 text-sm leading-relaxed text-white/55">
          Esta vista requiere un enlace de demostración válido. Si necesitas acceso, solicítalo al
          equipo de Seamos Genios.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-white/45 transition-colors hover:text-indigo-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
