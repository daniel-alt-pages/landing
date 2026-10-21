/** Normaliza fecha a ISO YYYY-MM-DD (login doc+fecha y backfill). */

function isValidCalendarDate(year: number, month: number, day: number): boolean {
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
        return false;
    }
    const date = new Date(year, month - 1, day);
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

function slashDateToIso(first: string, second: string, year: string): string | null {
    const a = Number(first);
    const b = Number(second);
    const y = Number(year);
    const candidates: Array<[number, number, number]> = [
        [y, b, a], // DD/MM/YYYY (login / formularios Colombia)
        [y, a, b], // MM/DD/YYYY (protegidos / Excel US)
    ];
    for (const [yy, mm, dd] of candidates) {
        if (isValidCalendarDate(yy, mm, dd)) {
            return `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
        }
    }
    return null;
}

export function normalizeBirthDateInput(raw: string): string | null {
    const value = String(raw || '').trim();
    if (!value) return null;

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const [, y, m, d] = isoMatch;
        const year = Number(y);
        const month = Number(m);
        const day = Number(d);
        if (!isValidCalendarDate(year, month, day)) return null;
        return `${y}-${m}-${d}`;
    }

    const slashMatch = value.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (slashMatch) {
        const [, first, second, year] = slashMatch;
        return slashDateToIso(first, second, year);
    }

    return null;
}

export function formatBirthDateDisplay(iso: string): string {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso;
    return `${m[3]}/${m[2]}/${m[1]}`;
}

export async function computeBirthDateHash(studentId: string, birthDateIso: string): Promise<string> {
    const id = String(studentId || '').replace(/\D/g, '').trim();
    const bytes = new TextEncoder().encode(`${id}:${birthDateIso}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
