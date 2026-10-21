'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hasBypassActive, checkBypassToken } from '@/lib/coordinatorBypass';

// ============================================================
// 🔧 MANTENIMIENTO GENERAL
// ============================================================
// Para activar/desactivar: cambiar MAINTENANCE_ENABLED
// Staging (pruebas-sg-aa586) + prod (simulacros-sg). No localhost.
// Fecha indefinida — se desactiva manualmente cambiando MAINTENANCE_ENABLED
// 
// BYPASS PARA COORDINADORES:
// - Enlaces con token encriptado bypasean el mantenimiento
// - Generados con generateCoordinatorBypassLink()
// - Formato: /coordinador?bypass=TOKEN_ENCRIPTADO
// ============================================================
const MAINTENANCE_ENABLED = false; // ❌ DESACTIVADO
const MAINTENANCE_END_UTC = new Date('2099-12-31T23:59:59Z'); // Sin fecha límite

const isDeployedBuild =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

const DEPLOYED_HOSTNAMES = new Set([
    'simulacros-sg.web.app',
    'simulacros-sg.firebaseapp.com',
    'pruebas-sg-aa586.web.app',
    'pruebas-sg-aa586.firebaseapp.com',
]);

const isDevServer =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

const isDeployedHost =
    typeof window !== 'undefined' &&
    DEPLOYED_HOSTNAMES.has(window.location.hostname);

const isMaintenanceScope = isDeployedBuild && isDeployedHost && !isDevServer;

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    // ponytail: si mantenimiento off, no bloquear paint (evita pantalla blanca si hydration tarda/falla)
    const [checked, setChecked] = useState(!MAINTENANCE_ENABLED);
    const [hasBypass, setHasBypass] = useState(false);

    useEffect(() => {
        // Verificar si hay token de bypass en URL o localStorage
        checkBypassToken(); // Esto guarda el token si es válido
        const bypass = hasBypassActive();
        setHasBypass(bypass);
        
        const now = new Date();
        // Solo activar mantenimiento si está habilitado Y estamos en producción Y NO hay bypass
        const isMaintenanceActive = MAINTENANCE_ENABLED && isMaintenanceScope && now < MAINTENANCE_END_UTC && !bypass;

        if (isMaintenanceActive && pathname !== '/mantenimiento') {
            router.replace('/mantenimiento');
        } else if (!isMaintenanceActive && pathname === '/mantenimiento') {
            router.replace('/');
        }

        setChecked(true);
    }, [pathname, router]);

    // Mientras se revisa, no mostrar contenido para evitar flash
    if (!checked) return null;

    // Si mantenimiento activo y NO es la ruta de mantenimiento y NO hay bypass, no renderizar
    const now = new Date();
    const isMaintenanceActive = MAINTENANCE_ENABLED && isMaintenanceScope && now < MAINTENANCE_END_UTC && !hasBypass;
    if (isMaintenanceActive && pathname !== '/mantenimiento') {
        return null;
    }

    return <>{children}</>;
}
