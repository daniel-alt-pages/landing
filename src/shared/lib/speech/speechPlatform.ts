/** Detección de SO/navegador para ajustar Web Speech API (Chrome, Safari, Brave, Opera, Edge, Firefox). */

export type SpeechOs = 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'unknown';
export type SpeechBrowser =
    | 'safari'
    | 'chrome'
    | 'firefox'
    | 'edge'
    | 'opera'
    | 'brave'
    | 'unknown';

export type SpeechPlatform = {
    os: SpeechOs;
    browser: SpeechBrowser;
    isMobile: boolean;
    /** iPhone/iPad (incl. iPadOS con touch). */
    isIOS: boolean;
    /** Safari desktop o cualquier navegador en iOS (motor WebKit). */
    isWebKit: boolean;
    isChromium: boolean;
    /** Pausa/resume fiable en speechSynthesis (no en iOS). */
    supportsPause: boolean;
    /** iOS corta ~15s; activar chunking + keep-alive. */
    needsLongSpeechWorkaround: boolean;
};

function detectOs(ua: string, maxTouchPoints: number): SpeechOs {
    const isIOS =
        /iPad|iPhone|iPod/.test(ua) || (typeof navigator !== 'undefined' && maxTouchPoints > 1 && /Mac/.test(ua));
    if (isIOS) return 'ios';
    if (/Android/.test(ua)) return 'android';
    if (/Win/.test(ua)) return 'windows';
    if (/Mac/.test(ua)) return 'macos';
    if (/Linux/.test(ua)) return 'linux';
    return 'unknown';
}

function detectBrowser(ua: string): SpeechBrowser {
    // Orden importa: Edge/Opera/Brave incluyen "Chrome" en UA.
    if (/Edg\//.test(ua)) return 'edge';
    if (/OPR\//.test(ua) || /Opera/.test(ua)) return 'opera';
    if (typeof navigator !== 'undefined' && 'brave' in navigator) return 'brave';
    if (/Firefox\//.test(ua)) return 'firefox';
    if (/Chrome\//.test(ua) || /CriOS\//.test(ua)) return 'chrome';
    if (/Safari\//.test(ua)) return 'safari';
    return 'unknown';
}

let cached: SpeechPlatform | null = null;

export function getSpeechPlatform(): SpeechPlatform {
    if (cached) return cached;
    if (typeof navigator === 'undefined') {
        cached = {
            os: 'unknown',
            browser: 'unknown',
            isMobile: false,
            isIOS: false,
            isWebKit: false,
            isChromium: false,
            supportsPause: true,
            needsLongSpeechWorkaround: false,
        };
        return cached;
    }

    const ua = navigator.userAgent;
    const maxTouch = navigator.maxTouchPoints ?? 0;
    const os = detectOs(ua, maxTouch);
    const browser = detectBrowser(ua);
    const isIOS = os === 'ios';
    const isMobile = isIOS || os === 'android';
    const isWebKit = /AppleWebKit/.test(ua) && !/Chrome\//.test(ua) && !/CriOS\//.test(ua) && !/Edg\//.test(ua)
        ? true
        : isIOS;

    cached = {
        os,
        browser,
        isMobile,
        isIOS,
        isWebKit,
        isChromium: browser === 'chrome' || browser === 'edge' || browser === 'opera' || browser === 'brave',
        supportsPause: !isIOS,
        needsLongSpeechWorkaround: isIOS,
    };
    return cached;
}
