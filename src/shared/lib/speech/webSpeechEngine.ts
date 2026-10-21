import { getSpeechPlatform, type SpeechPlatform } from './speechPlatform';
import {
    buildSpeechQueue,
    defaultUtteranceLang,
    preferredSpeechLangs,
    prepareSpeechText,
} from './speechTextPrep';

export type SpeechEngineSnapshot = {
    isSupported: boolean;
    isSpeaking: boolean;
    isPaused: boolean;
    progress: number;
    canPause: boolean;
    platform: SpeechPlatform;
    /** Texto completo preparado (referencia). */
    displayScript: string;
    /** Frase / fragmento que se está narrando ahora. */
    currentLine: string;
    /** Caracteres ya narrados dentro de `currentLine`. */
    spokenInLine: number;
    /** Índice de frase dentro de la cola. */
    lineIndex: number;
    lineCount: number;
};

type Listener = (snapshot: SpeechEngineSnapshot) => void;

const VOICE_HINTS: Record<string, string[]> = {
    ios: ['Paulina', 'Mónica', 'Monica', 'Jorge', 'Juan', 'Diego', 'Shelley'],
    android: ['Google español', 'Google es', 'es-es', 'es-us', 'Español'],
    macos: ['Paulina', 'Mónica', 'Monica', 'Jorge', 'Diego', 'Salvador'],
    windows: ['Helena', 'Sabina', 'Pablo', 'Laura', 'Raul', 'Raúl'],
    default: ['Google', 'Microsoft', 'Natural'],
};

const PAUSE_BETWEEN_LINES_MS: Record<string, number> = {
    ios: 480,
    android: 440,
    default: 560,
};

function normalizeLang(lang: string): string {
    return lang.replace('_', '-').toLowerCase();
}

function langScore(voiceLang: string, preferred: readonly string[]): number {
    const v = normalizeLang(voiceLang);
    for (let i = 0; i < preferred.length; i++) {
        const p = normalizeLang(preferred[i]);
        if (v === p) return 100 - i;
        if (v.startsWith(p.split('-')[0])) return 60 - i;
    }
    if (v.startsWith('es')) return 20;
    return 0;
}

function voiceNameScore(name: string, hints: string[]): number {
    const lower = name.toLowerCase();
    for (let i = 0; i < hints.length; i++) {
        if (lower.includes(hints[i].toLowerCase())) return 30 - i;
    }
    return 0;
}

export function pickBestSpanishVoice(
    voices: SpeechSynthesisVoice[],
    platform: SpeechPlatform,
): SpeechSynthesisVoice | undefined {
    if (!voices.length) return undefined;

    const preferred = preferredSpeechLangs();
    const hints = VOICE_HINTS[platform.os] ?? VOICE_HINTS.default;

    let best: SpeechSynthesisVoice | undefined;
    let bestScore = -1;

    for (const voice of voices) {
        let score = langScore(voice.lang, preferred);
        if (score <= 0) continue;

        score += voiceNameScore(voice.name, hints);
        if (voice.localService) score += 8;
        if (voice.default && score > 0) score += 4;

        if (score > bestScore) {
            bestScore = score;
            best = voice;
        }
    }

    if (best) return best;

    return (
        voices.find((v) => normalizeLang(v.lang).startsWith('es')) ??
        voices.find((v) => v.default) ??
        voices[0]
    );
}

/** Ritmo pausado (~120–140 palabras/min efectivas). */
function platformSpeechRate(platform: SpeechPlatform): number {
    if (platform.isIOS) return 0.72;
    if (platform.os === 'android') return 0.76;
    return 0.78;
}

function platformSpeechPitch(platform: SpeechPlatform): number {
    return platform.isIOS ? 0.98 : 1;
}

function pauseBetweenLines(platform: SpeechPlatform): number {
    if (platform.isIOS) return PAUSE_BETWEEN_LINES_MS.ios;
    if (platform.os === 'android') return PAUSE_BETWEEN_LINES_MS.android;
    return PAUSE_BETWEEN_LINES_MS.default;
}

function isBenignSpeechError(error: SpeechSynthesisErrorEvent): boolean {
    const code = error.error;
    return code === 'interrupted' || code === 'canceled';
}

function emptySnapshot(platform: SpeechPlatform): SpeechEngineSnapshot {
    return {
        isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
        isSpeaking: false,
        isPaused: false,
        progress: 0,
        canPause: platform.supportsPause,
        platform,
        displayScript: '',
        currentLine: '',
        spokenInLine: 0,
        lineIndex: 0,
        lineCount: 0,
    };
}

export class WebSpeechEngine {
    private listeners = new Set<Listener>();
    private voices: SpeechSynthesisVoice[] = [];
    private voicesReady = false;
    private platform = getSpeechPlatform();

    private isSpeaking = false;
    private isPaused = false;
    private progress = 0;
    private displayScript = '';
    private currentLine = '';
    private spokenInLine = 0;
    private lineIndex = 0;

    private queue: string[] = [];
    private queueIndex = 0;
    private totalChars = 0;
    private spokenChars = 0;
    private currentRate = 0.78;

    private progressTimer: ReturnType<typeof setInterval> | null = null;
    private lineFallbackTimer: ReturnType<typeof setInterval> | null = null;
    private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
    private utteranceGen = 0;

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.bindVoicesChanged();
            this.refreshVoices();
        }
    }

    getSnapshot(): SpeechEngineSnapshot {
        return {
            isSupported: this.isSupported(),
            isSpeaking: this.isSpeaking,
            isPaused: this.isPaused,
            progress: this.progress,
            canPause: this.platform.supportsPause,
            platform: this.platform,
            displayScript: this.displayScript,
            currentLine: this.currentLine,
            spokenInLine: this.spokenInLine,
            lineIndex: this.lineIndex,
            lineCount: this.queue.length,
        };
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        listener(this.getSnapshot());
        return () => this.listeners.delete(listener);
    }

    private emit() {
        const snap = this.getSnapshot();
        // ponytail: defer listeners — evita setState en otro componente durante render
        queueMicrotask(() => {
            this.listeners.forEach((l) => l(snap));
        });
    }

    isSupported(): boolean {
        return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    }

    warmUp(): void {
        if (!this.isSupported()) return;
        this.refreshVoices();
        window.speechSynthesis.getVoices();
        if (this.platform.isIOS && !this.voicesReady) {
            const u = new SpeechSynthesisUtterance('');
            u.volume = 0;
            window.speechSynthesis.speak(u);
            window.speechSynthesis.cancel();
        }
    }

    private bindVoicesChanged() {
        const synth = window.speechSynthesis;
        const refresh = () => this.refreshVoices();
        synth.addEventListener('voiceschanged', refresh);
        synth.onvoiceschanged = refresh;
    }

    private refreshVoices() {
        if (!this.isSupported()) return;
        const list = window.speechSynthesis.getVoices();
        if (list.length > 0) {
            this.voices = list;
            this.voicesReady = true;
        }
    }

    private clearTimers() {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
        if (this.lineFallbackTimer) {
            clearInterval(this.lineFallbackTimer);
            this.lineFallbackTimer = null;
        }
        this.stopKeepAlive();
    }

    private stopKeepAlive() {
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
        }
    }

    private startKeepAlive() {
        if (!this.platform.needsLongSpeechWorkaround) return;
        this.stopKeepAlive();
        this.keepAliveTimer = setInterval(() => {
            const synth = window.speechSynthesis;
            if (synth.speaking && !synth.paused) {
                synth.pause();
                synth.resume();
            }
        }, 12000);
    }

    private startProgressFallback(totalChars: number) {
        const estimatedDuration = Math.max((totalChars / 9) * 1000, 4000);
        const startTime = Date.now();
        this.progressTimer = setInterval(() => {
            if (!this.isSpeaking) return;
            const elapsed = Date.now() - startTime;
            const estimated = Math.min((elapsed / estimatedDuration) * 100, 99);
            this.progress = Math.max(this.progress, estimated);
            this.emit();
        }, 250);
    }

    private startLineFallback(text: string, gen: number) {
        if (this.lineFallbackTimer) {
            clearInterval(this.lineFallbackTimer);
            this.lineFallbackTimer = null;
        }
        const charsPerSec = 9 * this.currentRate;
        const started = Date.now();
        this.lineFallbackTimer = setInterval(() => {
            if (gen !== this.utteranceGen || this.isPaused) return;
            const elapsed = (Date.now() - started) / 1000;
            const estimated = Math.min(Math.floor(elapsed * charsPerSec), text.length);
            if (estimated > this.spokenInLine) {
                this.spokenInLine = estimated;
                const globalIndex = this.spokenChars + this.spokenInLine;
                if (this.totalChars > 0) {
                    this.progress = Math.min((globalIndex / this.totalChars) * 100, 99);
                }
                this.emit();
            }
        }, 120);
    }

    stop(): void {
        if (!this.isSupported()) return;
        this.utteranceGen += 1;
        this.queue = [];
        this.queueIndex = 0;
        window.speechSynthesis.cancel();
        this.clearTimers();
        this.isSpeaking = false;
        this.isPaused = false;
        this.progress = 0;
        this.spokenChars = 0;
        this.totalChars = 0;
        this.displayScript = '';
        this.currentLine = '';
        this.spokenInLine = 0;
        this.lineIndex = 0;
        this.emit();
    }

    pause(): void {
        if (!this.isSupported() || !this.platform.supportsPause || !this.isSpeaking) return;
        window.speechSynthesis.pause();
        this.isPaused = true;
        this.emit();
    }

    resume(): void {
        if (!this.isSupported() || !this.platform.supportsPause || !this.isPaused) return;
        window.speechSynthesis.resume();
        this.isPaused = false;
        this.emit();
    }

    speak(rawScript: string): void {
        if (!this.isSupported()) return;
        const script = prepareSpeechText(rawScript);
        if (!script) return;

        this.stop();
        this.refreshVoices();

        this.queue = buildSpeechQueue(script, this.platform.needsLongSpeechWorkaround);
        this.queueIndex = 0;
        this.lineIndex = 0;
        this.displayScript = script;
        this.totalChars = script.length;
        this.spokenChars = 0;
        this.progress = 0;
        this.currentRate = platformSpeechRate(this.platform);
        this.isSpeaking = true;
        this.isPaused = false;

        this.startProgressFallback(this.totalChars);
        this.startKeepAlive();
        this.emit();
        this.speakQueueItem(this.utteranceGen);
    }

    private speakQueueItem(gen: number) {
        if (gen !== this.utteranceGen || !this.isSupported()) return;
        if (this.queueIndex >= this.queue.length) {
            this.finishSpeaking();
            return;
        }

        const text = this.queue[this.queueIndex];
        this.currentLine = text;
        this.spokenInLine = 0;
        this.lineIndex = this.queueIndex;
        this.emit();

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = pickBestSpanishVoice(this.voices, this.platform);

        utterance.lang = voice?.lang ?? defaultUtteranceLang();
        utterance.rate = this.currentRate;
        utterance.pitch = platformSpeechPitch(this.platform);
        utterance.volume = 1;
        if (voice) utterance.voice = voice;

        this.startLineFallback(text, gen);

        utterance.onboundary = (event) => {
            if (gen !== this.utteranceGen || this.totalChars <= 0) return;
            if (event.charIndex >= 0) {
                this.spokenInLine = Math.min(event.charIndex, text.length);
            }
            const globalIndex = this.spokenChars + this.spokenInLine;
            this.progress = Math.min((globalIndex / this.totalChars) * 100, 99);
            this.emit();
        };

        utterance.onend = () => {
            if (gen !== this.utteranceGen) return;
            this.spokenInLine = text.length;
            this.spokenChars += text.length;
            this.queueIndex += 1;
            this.emit();

            if (this.queueIndex < this.queue.length) {
                window.setTimeout(
                    () => this.speakQueueItem(gen),
                    pauseBetweenLines(this.platform),
                );
            } else {
                this.finishSpeaking();
            }
        };

        utterance.onerror = (event) => {
            if (gen !== this.utteranceGen) return;
            if (isBenignSpeechError(event)) return;
            this.clearTimers();
            this.isSpeaking = false;
            this.isPaused = false;
            this.emit();
        };

        window.speechSynthesis.speak(utterance);
    }

    private finishSpeaking() {
        this.clearTimers();
        this.isSpeaking = false;
        this.isPaused = false;
        this.spokenInLine = this.currentLine.length;
        this.progress = 100;
        this.emit();
        window.setTimeout(() => {
            if (!this.isSpeaking) {
                this.progress = 0;
                this.currentLine = '';
                this.spokenInLine = 0;
                this.displayScript = '';
                this.emit();
            }
        }, 2200);
    }
}

export const coordinatorSpeechEngine = new WebSpeechEngine();

export { emptySnapshot as speechEngineEmptySnapshot };
