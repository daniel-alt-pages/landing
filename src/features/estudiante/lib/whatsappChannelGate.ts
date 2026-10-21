/** Canal oficial WhatsApp — SEAMOSGENIOS COLOMBIA */
export const SG_WHATSAPP_CHANNEL_URL =
    'https://whatsapp.com/channel/0029Va4PUxRFHWpywWL6Tw3F';

export const SG_WHATSAPP_CHANNEL_NAME = 'SEAMOSGENIOS COLOMBIA';

/** Una vez por sesión de navegador (se reinicia al cerrar pestaña o limpiar caché). */
export const SG_WHATSAPP_CHANNEL_GATE_KEY = 'sg_whatsapp_channel_gate_seen';
const SG_WHATSAPP_CHANNEL_GATE_ONCE_KEY = 'sg_whatsapp_channel_gate_seen_once';

export function isWhatsAppChannelGateSeen(): boolean {
    if (typeof window === 'undefined') return true;
    return (
        sessionStorage.getItem(SG_WHATSAPP_CHANNEL_GATE_KEY) === 'true' ||
        localStorage.getItem(SG_WHATSAPP_CHANNEL_GATE_ONCE_KEY) === 'true'
    );
}

export function markWhatsAppChannelGateSeen(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(SG_WHATSAPP_CHANNEL_GATE_KEY, 'true');
    localStorage.setItem(SG_WHATSAPP_CHANNEL_GATE_ONCE_KEY, 'true');
}

export function clearWhatsAppChannelGateSeen(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(SG_WHATSAPP_CHANNEL_GATE_KEY);
}

const GATE_SKIP_PATHS = new Set(['/estudiante/selector', '/estudiante/ranking/selector']);

export function shouldShowWhatsAppChannelGate(pathname: string | null, isDemoRoute: boolean): boolean {
    if (typeof window === 'undefined') return false;
    if (isDemoRoute) return false;
    if (!pathname || GATE_SKIP_PATHS.has(pathname)) return false;
    return !isWhatsAppChannelGateSeen();
}
