import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseIcsFeed } from '../lib/vacacional-ics.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const envPath = join(root, '.env.local');

function loadIcsUrl() {
  if (!existsSync(envPath)) return '';
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('CALENDAR_VACACIONAL_ICS_URL=')) continue;
    let val = trimmed.slice('CALENDAR_VACACIONAL_ICS_URL='.length).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    return val;
  }
  return '';
}

const icsUrl = loadIcsUrl();
if (!icsUrl) {
  console.log(JSON.stringify({ ok: false, error: 'missing CALENDAR_VACACIONAL_ICS_URL' }));
  process.exit(1);
}

const res = await fetch(icsUrl, { headers: { Accept: 'text/calendar' }, cache: 'no-store' });
if (!res.ok) {
  console.log(JSON.stringify({ ok: false, error: `ICS HTTP ${res.status}` }));
  process.exit(1);
}

const text = await res.text();
const attachLines = (text.match(/^ATTACH/gm) || []).length;
const events = parseIcsFeed(text);
const withAtt = events.filter((e) => e.attachments?.length);

console.log(
  JSON.stringify({
    ok: true,
    icsAttachLines: attachLines,
    parsedEvents: events.length,
    eventsWithAttachments: withAtt.length,
    sample:
      withAtt[0]?.attachments?.[0] != null
        ? {
            kind: withAtt[0].attachments[0].kind,
            title: withAtt[0].attachments[0].title,
          }
        : null,
  }),
);
