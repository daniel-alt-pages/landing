/** Normaliza texto para TTS en español (Colombia). */

const LANG_TAGS = ['es-CO', 'es-MX', 'es-ES', 'es-US', 'es-419', 'es'];

/** Prioridad de locale para utterance.lang y selección de voz. */
export function preferredSpeechLangs(): readonly string[] {
    return LANG_TAGS;
}

export function defaultUtteranceLang(): string {
    return 'es-CO';
}

/**
 * Limpia y adapta el script para mejor pronunciación cross-browser.
 * Reglas conservadoras: no convierte números a palabras (los motores lo manejan bien).
 */
export function prepareSpeechText(raw: string): string {
    let text = raw
        .replace(/\r\n/g, '\n')
        .replace(/\n+/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();

    // Simulacros tipo SG11-18 → deletreo pausado
    text = text.replace(/\bSG(\d{1,2})-(\d{1,2})\b/gi, 'simulacro S G $1 guion $2');

    // Siglas comunes
    text = text.replace(/\bICFES\b/g, 'I C F E S');

    // Porcentajes
    text = text.replace(/(\d+)\s*%/g, '$1 por ciento');

    // Fracciones tipo 5/500
    text = text.replace(/(\d+)\s*\/\s*(\d+)/g, '$1 de $2');

    return text.replace(/\s+/g, ' ').trim();
}

/** Frases cortas para TTS pausado (una utterance por frase). */
export function splitSpeechSentences(text: string): string[] {
    const prepared = prepareSpeechText(text);
    if (!prepared) return [];

    const sentences = prepared.split(/(?<=[.!?…])\s+/).filter(Boolean);
    const queue: string[] = [];

    for (const sentence of sentences) {
        if (sentence.length <= 110) {
            queue.push(sentence);
            continue;
        }
        // Frases largas: trocear por comas para ritmo más natural
        const parts = sentence.split(/,\s+/);
        let buf = '';
        for (const part of parts) {
            const piece = buf ? `${buf}, ${part}` : part;
            if (piece.length <= 110) {
                buf = piece;
            } else {
                if (buf) queue.push(`${buf}.`);
                buf = part.length <= 110 ? part : part.slice(0, 110);
            }
        }
        if (buf) queue.push(buf.endsWith('.') || buf.endsWith('!') || buf.endsWith('?') ? buf : `${buf}.`);
    }

    return queue.length ? queue : [prepared];
}

/** Parte texto largo en fragmentos (límite iOS ~15s por utterance). */
export function chunkSpeechText(text: string, maxChars = 160): string[] {
    const prepared = prepareSpeechText(text);
    if (prepared.length <= maxChars) return prepared ? [prepared] : [];

    const sentences = splitSpeechSentences(prepared);
    const chunks: string[] = [];
    let buf = '';

    for (const sentence of sentences) {
        const next = buf ? `${buf} ${sentence}` : sentence;
        if (next.length <= maxChars) {
            buf = next;
            continue;
        }
        if (buf) chunks.push(buf);
        if (sentence.length <= maxChars) {
            buf = sentence;
        } else {
            let rest = sentence;
            while (rest.length > maxChars) {
                const sliceAt = rest.lastIndexOf(', ', maxChars);
                const cut = sliceAt > maxChars * 0.4 ? sliceAt + 1 : maxChars;
                chunks.push(rest.slice(0, cut).trim());
                rest = rest.slice(cut).trim();
            }
            buf = rest;
        }
    }
    if (buf) chunks.push(buf);
    return chunks;
}

/** Cola final: frases cómodas; en iOS también respeta límite por chunk. */
export function buildSpeechQueue(text: string, needsLongSpeechWorkaround: boolean): string[] {
    const sentences = splitSpeechSentences(text);
    if (!needsLongSpeechWorkaround) return sentences;

    return sentences.flatMap((sentence) =>
        sentence.length > 160 ? chunkSpeechText(sentence, 150) : [sentence],
    );
}
