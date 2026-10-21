/** Síntesis corta desde export de Notas de Gemini (bloque "Resumen"). */

function clamp(text: string, max: number): string {
  const t = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t || t.length <= max) return t;
  const slice = t.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}

function firstSentence(text: string): string {
  const t = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return '';
  const match = t.match(/^(.+?[.!?])(?:\s|$)/);
  if (match?.[1] && match[1].length >= 24) return match[1].trim();
  return clamp(t, 200);
}

/** Docx local suele pegar títulos de sección sin espacio/salto de línea. */
export function normalizeGeminiExportText(text: string): string {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/([.!?])([A-ZÁÉÍÓÚÑ])/g, '$1\n$2')
    .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ][a-záéíóúñ])/g, '$1\n$2');
}

function stripGeminiFooters(text: string): string {
  return normalizeGeminiExportText(text)
    .replace(/Revisa las notas de Gemini[\s\S]*$/i, '')
    .replace(/📖\s*Transcripción[\s\S]*$/i, '')
    .replace(/Cómo es la calidad de estas notas[\s\S]*$/i, '')
    .trim();
}

function extractResumenBlock(text: string): string | null {
  const cleaned = stripGeminiFooters(text);
  const match = cleaned.match(
    /\bResumen\s*\n([\s\S]*?)(?=\n(?:Próximos pasos|Detalles|Califica este resumen)|$)/i,
  );
  return match?.[1]?.trim() || null;
}

function lineLooksLikeSummarySentence(line: string): boolean {
  return /[.!?]\s*$/.test(line) || line.length > 90;
}

function parseResumenSections(block: string) {
  const chunks = block.split(/\n\n+/).map((c) => c.trim()).filter(Boolean);
  const sections: { title: string | null; body: string }[] = [];
  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (lines.length === 1 || lineLooksLikeSummarySentence(lines[0])) {
      sections.push({ title: null, body: lines.join(' ') });
      continue;
    }
    sections.push({ title: lines[0], body: lines.slice(1).join(' ') });
  }
  return sections;
}

function fallbackSummary(text: string, maxShort = 220) {
  const cleaned = stripGeminiFooters(text).replace(/\n+/g, ' ');
  const sent = firstSentence(cleaned);
  return {
    short: clamp(sent || cleaned, maxShort),
    extended: clamp(sent || cleaned, 480),
  };
}

export type GeminiClassSynthesis = {
  short: string;
  extended: string;
};

export function synthesizeGeminiClassDescription(
  fullText: string,
  options?: { maxShort?: number; maxExtended?: number },
): GeminiClassSynthesis {
  const maxShort = options?.maxShort ?? 240;
  const maxExtended = options?.maxExtended ?? 480;

  const block = extractResumenBlock(fullText);
  if (!block) return fallbackSummary(fullText, maxShort);

  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return fallbackSummary(fullText, maxShort);

  const summaryLine =
    lines.find((l) => lineLooksLikeSummarySentence(l)) || lines[0] || '';
  const short = clamp(firstSentence(summaryLine) || summaryLine, maxShort);

  const extraSentences: string[] = [];
  for (const line of lines) {
    if (line === summaryLine) continue;
    const sent = firstSentence(line);
    if (sent && sent.length > 20 && sent !== short && !extraSentences.includes(sent)) {
      extraSentences.push(sent);
    }
    if (extraSentences.length >= 2) break;
  }

  let extended = short;
  if (extraSentences.length) {
    extended = clamp(`${short} ${extraSentences.join(' ')}`, maxExtended);
  }

  return { short, extended };
}
