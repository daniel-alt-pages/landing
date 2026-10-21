'use client';

import { useEffect } from 'react';

/**
 * DevToolsBlocker — Bloquea atajos y silencia consola en producción.
 * NO usa eval/Function para evitar problemas de CSP.
 */
export default function DevToolsBlocker() {
    useEffect(() => {
        const isLocal =
            window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (isLocal) return;

        // 1. Deshabilitar click derecho
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();

        // 2. Bloquear atajos de DevTools
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && /^[IiCcJj]$/.test(e.key)) ||
                (e.ctrlKey && /^[uU]$/.test(e.key))
            ) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        // 3. Silenciar consola
        const noop = () => { };
        const _clear = console.clear.bind(console);
        const _log = console.log.bind(console);

        const methods = [
            'log', 'warn', 'error', 'info', 'debug',
            'table', 'dir', 'trace', 'assert',
        ];
        methods.forEach(m => {
            try { (window.console as any)[m] = noop; } catch { }
        });

        // 4. Mensaje de advertencia (solo una vez)
        try {
            _clear();
            _log(
                '%c⛔ Acceso restringido',
                'color: red; font-size: 30px; font-weight: bold;'
            );
            _log(
                '%cEsta consola está deshabilitada.',
                'font-size: 14px; color: #888;'
            );
        } catch { }

        // 5. Limpiar periódicamente (cada 2s — no agresivo)
        const interval = setInterval(() => {
            try {
                _clear();
                _log('%c⛔ Acceso restringido', 'color: red; font-size: 30px; font-weight: bold;');
            } catch { }
        }, 2000);

        document.addEventListener('contextmenu', handleContextMenu, true);
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu, true);
            document.removeEventListener('keydown', handleKeyDown, true);
            clearInterval(interval);
        };
    }, []);

    return null;
}
