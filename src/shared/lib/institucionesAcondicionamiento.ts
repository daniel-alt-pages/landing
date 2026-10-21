/**
 * Alias ↔ canónico de instituciones (panel + match histórico).
 * Fuente: shared/config/instituciones_acondicionamiento.json
 * (espejo de data/config/instituciones_acondicionamiento.json del pipeline).
 *
 * Display: nombre completo canónico.
 * Match: IESA y canónico (y demás aliases) son la misma institución.
 */
import catalog from '@shared/config/instituciones_acondicionamiento.json';

type CatalogRow = {
    id?: number;
    aliases?: string[];
    canonical: string;
    municipio?: string;
    departamento?: string;
};

type CatalogEntry = {
    id: string;
    canonical: string;
    municipio: string;
    departamento: string;
};

export function normalizeInstitutionText(value: string): string {
    return String(value || '')
        .toUpperCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s\-.,/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildIndex(): Map<string, CatalogEntry> {
    const index = new Map<string, CatalogEntry>();
    const rows = (catalog as { instituciones?: CatalogRow[] }).instituciones || [];
    for (const row of rows) {
        const canonical = String(row.canonical || '').trim();
        if (!canonical) continue;
        const entry: CatalogEntry = {
            id: String(row.id ?? normalizeInstitutionText(canonical)),
            canonical,
            municipio: String(row.municipio || '').trim(),
            departamento: String(row.departamento || '').trim(),
        };
        const keys = [canonical, ...(row.aliases || [])];
        for (const key of keys) {
            const nk = normalizeInstitutionText(key);
            if (nk) index.set(nk, entry);
        }
    }
    return index;
}

const INDEX = buildIndex();

export function resolveInstitutionCatalog(raw: string): CatalogEntry | null {
    const key = normalizeInstitutionText(raw);
    if (!key) return null;
    return INDEX.get(key) ?? null;
}

/** Nombre profesional para UI (canónico del catálogo si existe). */
export function canonicalInstitutionName(raw: string): string {
    const hit = resolveInstitutionCatalog(raw);
    if (hit) return hit.canonical.toUpperCase().trim();
    return String(raw || '')
        .toUpperCase()
        .trim();
}

/** Clave estable para agrupar aliases (id de catálogo o texto normalizado). */
export function institutionEquivalenceKey(raw: string): string {
    const hit = resolveInstitutionCatalog(raw);
    if (hit) return `cat:${hit.id}`;
    return `raw:${normalizeInstitutionText(raw)}`;
}

/** True si a y b son la misma IE (alias o canónico del catálogo, o fuzzy legado). */
export function institutionsMatch(a: string, b: string): boolean {
    const na = normalizeInstitutionText(a);
    const nb = normalizeInstitutionText(b);
    if (!na || !nb) return false;
    if (na === nb) return true;

    const ea = resolveInstitutionCatalog(a);
    const eb = resolveInstitutionCatalog(b);
    if (ea && eb && ea.id === eb.id) return true;
    if (ea && normalizeInstitutionText(ea.canonical) === nb) return true;
    if (eb && normalizeInstitutionText(eb.canonical) === na) return true;

    // Fuzzy solo fuera de catálogo (nombres largos/cortos no listados).
    if (!ea && !eb) {
        return na.includes(nb) || nb.includes(na);
    }
    return false;
}

/** Deduplica lista de instituciones mostrando siempre el canónico. */
export function dedupeInstitutionKeysPreferCanonical(keys: readonly string[]): string[] {
    const byEq = new Map<string, string>();
    for (const raw of keys) {
        const key = String(raw || '').trim();
        if (!key) continue;
        const eq = institutionEquivalenceKey(key);
        const display = canonicalInstitutionName(key);
        if (!byEq.has(eq)) {
            byEq.set(eq, display);
            continue;
        }
        // Preferir canónico del catálogo sobre alias corto ya guardado.
        const prev = byEq.get(eq)!;
        const prevHit = resolveInstitutionCatalog(prev);
        const nextHit = resolveInstitutionCatalog(key);
        if (nextHit && (!prevHit || normalizeInstitutionText(prev) !== normalizeInstitutionText(nextHit.canonical))) {
            byEq.set(eq, display);
        }
    }
    return Array.from(byEq.values()).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

// ponytail: smoke — falla si IESA no equivale al canónico
export function selfCheckInstitucionesAcondicionamiento(): void {
    const canon = 'INSTITUCIÓN EDUCATIVA SAN AGUSTIN - AGUAZUL, CASANARE';
    if (!institutionsMatch('IESA', canon)) {
        throw new Error('IESA debe equivaler al canónico San Agustín');
    }
    if (canonicalInstitutionName('IESA') !== canon.toUpperCase()) {
        throw new Error('Display IESA debe ser canónico');
    }
    const deduped = dedupeInstitutionKeysPreferCanonical(['IESA', canon, 'iesa']);
    if (deduped.length !== 1 || !institutionsMatch(deduped[0]!, canon)) {
        throw new Error('Deduplicación IESA falló');
    }
}
