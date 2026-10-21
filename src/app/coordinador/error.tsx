'use client';

import { useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { isStagingFirebase } from '@/lib/deploy-env';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function CoordinadorError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('[Coordinador] Page Error:', error);
    }, [error]);

    const getErrorMessage = () => {
        const msg = error.message || '';

        if (
            msg.includes('missing initial state') ||
            msg.includes('sessionStorage is inaccessible') ||
            msg.includes('storage-partitioned') ||
            msg.includes('IndexedDB')
        ) {
            return {
                title: 'Error de Navegador',
                description: 'Tu navegador está bloqueando almacenamiento local (cookies o IndexedDB).',
                solutions: [
                    'Sal de modo incógnito',
                    'Permite cookies para este sitio',
                    'Desactiva bloqueadores de rastreo en pruebas-sg-aa586.web.app',
                    'Prueba Chrome o Edge estándar',
                ],
            };
        }

        if (msg.includes('Loading chunk') || msg.includes('ChunkLoadError')) {
            return {
                title: 'Actualización pendiente',
                description: 'Hay una versión nueva del panel. La caché local quedó desfasada.',
                solutions: [
                    'Ctrl+Shift+R (recarga forzada)',
                    'Cierra pestañas viejas del panel',
                    'Borra datos del sitio y vuelve a entrar',
                ],
            };
        }

        return {
            title: 'Error en el Panel Coordinador',
            description: 'No se pudo cargar esta sección del panel.',
            solutions: [
                'Recarga la página',
                'Verifica tu conexión',
                'Vuelve a entrar con el enlace de acceso o Google',
            ],
        };
    };

    const errorInfo = getErrorMessage();
    const showTechnical =
        isStagingFirebase ||
        (typeof window !== 'undefined' && /pruebas-sg-aa586/i.test(window.location.hostname));

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-[#111827] rounded-xl shadow-lg border border-white/[0.08] p-8">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">{errorInfo.title}</h1>
                        <p className="text-white/60 text-sm">{errorInfo.description}</p>
                        {showTechnical && error.message ? (
                            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-left font-mono text-xs text-red-300 break-all">
                                {error.message}
                                {error.digest ? `\ndigest: ${error.digest}` : ''}
                            </p>
                        ) : null}
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-lg p-4 mb-6">
                        <p className="text-indigo-200 font-medium text-sm mb-2 inline-flex items-center gap-1.5">
                            <Lightbulb className="h-4 w-4 shrink-0" aria-hidden />
                            Soluciones sugeridas:
                        </p>
                        <ul className="text-indigo-100/80 text-sm space-y-1">
                            {errorInfo.solutions.map((solution, index) => (
                                <li key={index}>• {solution}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={reset}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all"
                        >
                            Intentar de nuevo
                        </button>
                        <button
                            type="button"
                            onClick={() => { window.location.href = '/coordinador'; }}
                            className="w-full py-3 bg-white/[0.06] hover:bg-white/[0.1] text-white/80 font-medium rounded-lg transition-all"
                        >
                            Volver al dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
