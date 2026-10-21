'use client';

import { useEffect } from 'react';
import { isStagingFirebase } from '@/lib/deploy-env';

/**
 * DevToolsGuard — Disuade a los estudiantes de usar las herramientas de
 * desarrollador del navegador. No es 100% infalible (el cliente siempre
 * puede desbloquearlas), pero eleva significativamente la barrera.
 *
 * Medidas implementadas:
 *  1. Bloqueo de atajos de teclado (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 *  2. Bloqueo de clic derecho (menú contextual)
 *  3. Debugger-loop: si se abre la consola, un debugger; infinito la
 *     detiene continuamente haciéndola inusable.
 */
export default function DevToolsGuard() {
    useEffect(() => {
        const isLocal =
            process.env.NODE_ENV === 'development' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '[::1]';
        const isStagingHost =
            window.location.hostname === 'pruebas-sg-aa586.web.app' ||
            window.location.hostname === 'pruebas-sg-aa586.firebaseapp.com';

        if (isLocal || isStagingFirebase || isStagingHost) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Ctrl+Shift+I  (Inspector)
            // Ctrl+Shift+J  (Console)
            // Ctrl+Shift+C  (Element picker)
            if (
                e.ctrlKey &&
                e.shiftKey &&
                ['I', 'J', 'C'].includes(e.key.toUpperCase())
            ) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Ctrl+U (View source)
            if (e.ctrlKey && e.key.toUpperCase() === 'U') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        };

        // ─── 2. Bloquear clic derecho ─────────────────────────────
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('contextmenu', handleContextMenu, true);

        // ─── 3. Debugger loop ─────────────────────────────────────
        // Ejecuta un constructor de Function que contiene `debugger`
        // en un intervalo corto. Si DevTools NO está abierto el
        // debugger; se omite sin impacto. Si SÍ está abierto, el
        // navegador se pausa continuamente en esa línea.
        const debuggerInterval = setInterval(() => {
            const start = performance.now();
            (function () { debugger; })();
            const delta = performance.now() - start;
            // Si el debugger hizo pausa >100ms, DevTools está abierto
            if (delta > 100) {
                document.body.innerHTML = '';
                document.title = '⚠️ Acceso restringido';
                clearInterval(debuggerInterval);
            }
        }, 1000);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('contextmenu', handleContextMenu, true);
            clearInterval(debuggerInterval);
        };
    }, []);

    return null;
}
