import {
  isVacacionalIcsRecurringGarbageSummary,
  isVacacionalDisplayPlaceholderSummary,
  normalizeVacacionalEventSummary,
  normalizeVacacionalCalendarEvents,
} from './course-calendar-summary-normalize.mjs';

function unfoldIcs(content) {
  return content.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}

const TZ_UTC_OFFSET = {
  'America/Bogota': '-05:00',
};

function parseIcsDateValue(raw, tzid) {
  const value = raw.trim();
  if (/^\d{8}$/.test(value)) {
    return {
      date: `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`,
      timeZone: tzid || undefined,
    };
  }
  const zMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (zMatch) {
    const [, y, mo, d, h, mi, s] = zMatch;
    return { dateTime: `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z` };
  }
  const localMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (localMatch) {
    const [, y, mo, d, h, mi, s] = localMatch;
    const isoLocal = `${y}-${mo}-${d}T${h}:${mi}:${s}`;
    const offset = TZ_UTC_OFFSET[tzid] || TZ_UTC_OFFSET['America/Bogota'];
    return {
      dateTime: `${isoLocal}${offset}`,
      timeZone: tzid || 'America/Bogota',
    };
  }
  if (value.includes('T')) return { dateTime: value, timeZone: tzid || undefined };
  return { date: value, timeZone: tzid || undefined };
}

function extractMeetLink(fields) {
  if (fields['X-GOOGLE-CONFERENCE']) return fields['X-GOOGLE-CONFERENCE'].trim();
  const desc = fields.DESCRIPTION?.replace(/\\n/g, '\n') ?? '';
  return desc.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i)?.[0];
}

function parseAttachLine(line) {
  const httpsIdx = line.indexOf(':https://');
  const httpIdx = line.indexOf(':http://');
  const urlStart =
    httpsIdx >= 0 ? httpsIdx + 1 : httpIdx >= 0 ? httpIdx + 1 : -1;
  if (urlStart < 0) return null;

  const url = line.slice(urlStart).trim();
  const header = line.slice(0, urlStart - 1);
  const params = {};
  for (const part of header.split(';').slice(1)) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const name = part.slice(0, eq).trim().toUpperCase();
    let val = part.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    params[name] = val;
  }

  const fmt = params.FMTTYPE || '';
  const filename = (params.FILENAME || '').trim();
  let kind = 'file';
  if (/notas de gemini/i.test(filename)) kind = 'gemini';
  else if (fmt.includes('google-apps.document')) kind = 'doc';
  else if (fmt.includes('google-apps.presentation')) kind = 'slides';
  else if (fmt.includes('google-apps.spreadsheet')) kind = 'sheet';
  else if (fmt.includes('video/mp4')) kind = 'recording';
  else if (fmt.includes('text/plain')) kind = 'chat';
  else if (url.includes('docs.google.com')) kind = 'doc';
  else if (url.includes('drive.google.com')) kind = 'drive';

  return {
    title: (params.FILENAME || 'Adjunto').trim(),
    url,
    mimeType: fmt || undefined,
    kind,
  };
}

function parseVeventChunk(body) {
  const fields = {};
  const attachments = [];
  for (const line of body.split('\n')) {
    if (!line.trim()) continue;
    const sep = line.indexOf(':');
    if (sep <= 0) continue;
    const rawKey = line.slice(0, sep);
    const key = rawKey.split(';')[0]?.trim();
    const value = line.slice(sep + 1);
    if (!key) continue;
    if (key === 'ATTACH') {
      const att = parseAttachLine(line);
      if (att) attachments.push(att);
      continue;
    }
    if (key === 'DTSTART' || key === 'DTEND') {
      const tzMatch = rawKey.match(/TZID=([^:;]+)/i);
      if (tzMatch?.[1]) fields[`${key}_TZID`] = tzMatch[1].trim();
    }
    fields[key] = value;
  }
  return { fields, attachments };
}

function eventInstant(event) {
  const raw = event.start?.dateTime || event.start?.date || '';
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Alias pipeline — solo placeholders reales de display (no basura `# A #`). */
export function isPlaceholderVacacionalSummary(summary) {
  return isVacacionalDisplayPlaceholderSummary(summary);
}

export { isVacacionalIcsRecurringGarbageSummary, isVacacionalDisplayPlaceholderSummary };

function eventSlotKey(event) {
  return event.start?.dateTime || event.start?.date || '';
}

function dedupeVacacionalEvents(events) {
  const bySlot = new Map();
  for (const event of events) {
    if (isVacacionalIcsRecurringGarbageSummary(event.summary)) continue;
    const slot = eventSlotKey(event);
    if (!slot) continue;
    const prev = bySlot.get(slot);
    if (!prev || (event.summary?.length || 0) > (prev.summary?.length || 0)) {
      bySlot.set(slot, event);
    }
  }
  return [...bySlot.values()].sort((a, b) => eventInstant(a) - eventInstant(b));
}

export function parseIcsFeed(icsText) {
  const events = [];
  for (const chunk of unfoldIcs(icsText).split('BEGIN:VEVENT').slice(1)) {
    const body = chunk.split('END:VEVENT')[0] ?? chunk;
    const { fields, attachments } = parseVeventChunk(body);
    if (!fields.DTSTART) continue;
    const status = fields.STATUS?.toLowerCase();
    const uniqueAttachments = [];
    const seen = new Set();
    for (const att of attachments) {
      if (!att.url || seen.has(att.url)) continue;
      seen.add(att.url);
      uniqueAttachments.push(att);
    }
    const uid = fields.UID?.trim();
    const recurrenceId = fields['RECURRENCE-ID']?.trim();
    const dtStart = fields.DTSTART?.trim();
    let eventId;
    if (uid && recurrenceId) eventId = `${uid}__${recurrenceId}`;
    else if (uid && dtStart) eventId = `${uid}__${dtStart}`;
    else if (uid) eventId = uid;
    else eventId = `${dtStart || 'event'}-${fields.SUMMARY || 'event'}`;

    events.push({
      id: eventId,
      summary: normalizeVacacionalEventSummary((fields.SUMMARY || '(Sin título)').trim()),
      description: fields.DESCRIPTION?.replace(/\\n/g, '\n').replace(/\\,/g, ',').trim(),
      start: parseIcsDateValue(fields.DTSTART, fields.DTSTART_TZID),
      end: fields.DTEND
        ? parseIcsDateValue(fields.DTEND, fields.DTEND_TZID)
        : {},
      hangoutLink: extractMeetLink(fields),
      attachments: uniqueAttachments.length ? uniqueAttachments : undefined,
      status: status === 'cancelled' ? 'cancelled' : status || 'confirmed',
      isRecurring: Boolean(fields['RECURRENCE-ID'] || fields.RRULE),
    });
  }
  return normalizeVacacionalCalendarEvents(dedupeVacacionalEvents(events));
}

export function filterEventsByRange(events, timeMin, timeMax, includeCancelled) {
  const min = timeMin.getTime();
  const max = timeMax.getTime();
  return events.filter((event) => {
    if (!includeCancelled && event.status === 'cancelled') return false;
    const t = eventInstant(event);
    return t >= min && t <= max;
  });
}

export async function fetchAndParseVacacionalIcs(icsUrl) {
  const res = await fetch(icsUrl, {
    headers: { Accept: 'text/calendar' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`ICS HTTP ${res.status}`);
  const text = await res.text();
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('ICS inválido');
  return parseIcsFeed(text);
}

const ICS_CACHE_TTL_MS = 10 * 60 * 1000;
/** @type {{ url: string; events: ReturnType<typeof parseIcsFeed>; at: number } | null} */
let icsCache = null;

async function getCachedIcsEvents(icsUrl) {
  const now = Date.now();
  if (icsCache && icsCache.url === icsUrl && now - icsCache.at < ICS_CACHE_TTL_MS) {
    return icsCache.events;
  }
  const events = await fetchAndParseVacacionalIcs(icsUrl);
  icsCache = { url: icsUrl, events, at: now };
  return events;
}

export function resolveRange(searchParams) {
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');
  const weeksParam = searchParams.get('weeks');
  const weeks = weeksParam ? parseInt(weeksParam, 10) : 1;
  if (startParam && endParam) {
    return { timeMin: new Date(startParam), timeMax: new Date(endParam), weeks };
  }
  const now = new Date();
  const timeMin = new Date();
  timeMin.setDate(now.getDate() - 14);
  timeMin.setHours(0, 0, 0, 0);
  const timeMax = new Date();
  timeMax.setDate(now.getDate() + weeks * 7);
  timeMax.setHours(23, 59, 59, 999);
  return { timeMin, timeMax, weeks };
}

export async function listVacacionalFromEnv(searchParams) {
  const icsUrl = process.env.CALENDAR_VACACIONAL_ICS_URL?.trim();
  if (!icsUrl) {
    throw new Error('Falta CALENDAR_VACACIONAL_ICS_URL en .env.local');
  }
  const includeCancelled = searchParams.get('includeCancelled') === '1';
  const { timeMin, timeMax, weeks } = resolveRange(searchParams);
  const all = await getCachedIcsEvents(icsUrl);
  const events = filterEventsByRange(all, timeMin, timeMax, includeCancelled);
  return {
    success: true,
    program: 'vacacional',
    label: 'PREICFES Vacacional 2026',
    calendarId: process.env.CALENDAR_ID_VACACIONAL?.trim() || 'vacacional',
    source: 'ics',
    weeks,
    count: events.length,
    events,
  };
}
