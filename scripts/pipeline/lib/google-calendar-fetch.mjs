/**
 * Google Calendar API (service account) → CourseCalendarEventDto.
 */
import { readFileSync } from 'node:fs';
import { JWT } from 'google-auth-library';

function mapAttachment(file) {
  const title = file.title || file.fileUrl || 'Adjunto';
  const url = file.fileUrl || file.url || '';
  const mimeType = file.mimeType || '';
  let kind = 'file';
  if (/notas de gemini/i.test(title)) kind = 'gemini';
  else if (mimeType.includes('google-apps.document')) kind = 'doc';
  else if (mimeType.includes('google-apps.presentation')) kind = 'slides';
  else if (mimeType.includes('google-apps.spreadsheet')) kind = 'sheet';
  else if (mimeType.includes('video/mp4')) kind = 'recording';
  else if (mimeType.includes('text/plain')) kind = 'chat';
  else if (url.includes('docs.google.com')) kind = 'doc';
  else if (url.includes('drive.google.com')) kind = 'drive';
  return { title, url, mimeType: mimeType || undefined, kind };
}

export function mapGoogleEvent(item) {
  const attachments = (item.attachments || [])
    .map(mapAttachment)
    .filter((att) => att.url);

  return {
    id: item.id,
    recurringEventId: item.recurringEventId || undefined,
    summary: item.summary || '(Sin título)',
    description: item.description || undefined,
    start: {
      dateTime: item.start?.dateTime || undefined,
      date: item.start?.date || undefined,
      timeZone: item.start?.timeZone || undefined,
    },
    end: {
      dateTime: item.end?.dateTime || undefined,
      date: item.end?.date || undefined,
      timeZone: item.end?.timeZone || undefined,
    },
    hangoutLink: item.hangoutLink || undefined,
    htmlLink: item.htmlLink || undefined,
    location: item.location || undefined,
    status: item.status || 'confirmed',
    isRecurring: Boolean(item.recurringEventId),
    attachments: attachments.length ? attachments : undefined,
  };
}

async function getAccessToken(saPath) {
  const key = JSON.parse(readFileSync(saPath, 'utf8'));
  const client = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('No se pudo obtener access token de Calendar API');
  return token.token;
}

export async function listGoogleCalendarEvents({
  calendarId,
  timeMin,
  timeMax,
  saPath,
  includeCancelled = false,
}) {
  const accessToken = await getAccessToken(saPath);
  const events = [];
  let pageToken;

  do {
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin: new Date(timeMin).toISOString(),
      timeMax: new Date(timeMax).toISOString(),
      maxResults: '2500',
      showDeleted: includeCancelled ? 'true' : 'false',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Calendar API ${res.status}: ${body.slice(0, 400)}`);
    }
    const data = await res.json();
    for (const item of data.items || []) {
      if (!includeCancelled && item.status === 'cancelled') continue;
      events.push(mapGoogleEvent(item));
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  events.sort((a, b) => {
    const aMs = new Date(a.start?.dateTime || a.start?.date || 0).getTime();
    const bMs = new Date(b.start?.dateTime || b.start?.date || 0).getTime();
    return aMs - bMs;
  });

  return events;
}
