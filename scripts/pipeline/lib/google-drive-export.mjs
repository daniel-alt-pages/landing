/**
 * Export Google Docs vía Drive API (service account).
 */
import { readFileSync } from 'node:fs';
import { JWT } from 'google-auth-library';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

export function extractGoogleDocId(url) {
  const docMatch = String(url).match(/\/document\/d\/([^/?#]+)/i);
  if (docMatch?.[1]) return docMatch[1];
  const fileMatch = String(url).match(/\/file\/d\/([^/?#]+)/i);
  if (fileMatch?.[1]) return fileMatch[1];
  const idMatch = String(url).match(/[?&]id=([^&]+)/i);
  return idMatch?.[1] ?? null;
}

async function getDriveAccessToken(saPath) {
  const key = JSON.parse(readFileSync(saPath, 'utf8'));
  const client = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: [DRIVE_SCOPE],
  });
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('No se pudo obtener access token de Drive API');
  return { accessToken: token.token, clientEmail: key.client_email };
}

function normalizeExportedText(raw) {
  return String(raw || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Exporta un Google Doc como texto plano.
 */
export async function exportGoogleDocAsText({ fileId, saPath }) {
  const { accessToken } = await getDriveAccessToken(saPath);
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive export ${res.status} (${fileId}): ${body.slice(0, 280)}`);
  }
  return normalizeExportedText(await res.text());
}

export async function probeDriveAccess(saPath) {
  return getDriveAccessToken(saPath);
}
