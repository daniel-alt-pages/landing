'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  exitDemoCoordinadorSession,
  exitDemoEstudianteSession,
} from '@/app/demo/_shared/demoExit';

type DemoExitControlProps = {
  mode: 'estudiante' | 'coordinador';
};

export default function DemoExitControl({ mode }: DemoExitControlProps) {
  const router = useRouter();

  const onExit = () => {
    if (mode === 'estudiante') {
      exitDemoEstudianteSession(router);
      return;
    }
    exitDemoCoordinadorSession(router);
  };

  if (mode === 'coordinador') {
    return (
      <button
        type="button"
        onClick={onExit}
        className="fixed top-3 right-3 z-[120] inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-lg transition-colors cursor-pointer"
        style={{
          background: 'rgba(239,68,68,0.12)',
          borderColor: 'rgba(239,68,68,0.28)',
          color: 'rgba(252,165,165,0.95)',
        }}
        aria-label="Salir de demo"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        Salir de demo
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onExit}
      className="fixed top-3 right-3 z-[120] inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm transition-colors hover:border-slate-300 hover:text-slate-900 cursor-pointer"
      aria-label="Salir de demo"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden />
      Salir de demo
    </button>
  );
}
