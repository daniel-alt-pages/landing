/** Nombre en MAYÚSCULAS: letras, espacios, tildes, guiones. */

export function toUpperCaseFullName(raw: string): string {
    return String(raw || '')
        .normalize('NFC')
        .replace(/[^\p{L}\s'-]/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLocaleUpperCase('es-CO');
}
