/**
 * Logos de IE para paneles. Fuente: shared/config/instituciones_logos.json
 * Clave = id de instituciones_acondicionamiento.json.
 * Preferir archivo local en /public/instituciones/logos/.
 */
import logosCatalog from '@shared/config/instituciones_logos.json';
import catalog from '@shared/config/instituciones_acondicionamiento.json';
import {
    normalizeInstitutionText,
    resolveInstitutionCatalog,
} from '@shared/lib/institucionesAcondicionamiento';

type LogoEntry = string | { local?: string; remote?: string };

type CatalogRow = {
    id?: number;
    aliases?: string[];
    canonical?: string;
};

const BY_ID = (logosCatalog as { byId?: Record<string, LogoEntry> }).byId || {};
const CATALOG_ROWS = (catalog as { instituciones?: CatalogRow[] }).instituciones || [];

function urlFromEntry(entry: LogoEntry | undefined): string | null {
    if (!entry) return null;
    if (typeof entry === 'string') return entry.length > 0 ? entry : null;
    if (entry.local) return entry.local;
    if (entry.remote) return entry.remote;
    return null;
}

function logoById(id: string): string | null {
    return urlFromEntry(BY_ID[id]);
}

/** Normaliza abreviaturas frecuentes para match de logos. */
function logoKey(value: string): string {
    return normalizeInstitutionText(value)
        .replace(/\bN\.\s*DE\b/g, 'NORTE DE')
        .replace(/\bINSTITUCION EDUCATIVA TECNICA\b/g, 'INSTITUCION EDUCATIVA TECNICA')
        .replace(/\bI\.?E\.?D\.?\b/g, 'INSTITUCION EDUCATIVA DEPARTAMENTAL')
        .replace(/\bI\.?E\.?\b/g, 'INSTITUCION EDUCATIVA')
        .replace(/\s+/g, ' ')
        .trim();
}

function looseLogoMatch(query: string, candidate: string): boolean {
    const a = logoKey(query);
    const b = logoKey(candidate);
    if (!a || !b) return false;
    if (a === b) return true;
    // Evitar falsos positivos con nombres muy cortos.
    if (a.length >= 18 && b.length >= 18 && (a.includes(b) || b.includes(a))) return true;
    return false;
}

/** Resuelve logo por nombre (canónico, alias o variante Firestore). */
export function getInstitutionLogo(name: string): string | null {
    const hit = resolveInstitutionCatalog(name);
    if (hit) {
        const url = logoById(hit.id);
        if (url) return url;
    }

    for (const row of CATALOG_ROWS) {
        const id = String(row.id ?? '');
        if (!id || !BY_ID[id]) continue;
        const keys = [row.canonical, ...(row.aliases || [])].filter(Boolean) as string[];
        if (keys.some((k) => looseLogoMatch(name, k))) {
            const url = logoById(id);
            if (url) return url;
        }
    }
    return null;
}

// ponytail: smoke mínimo
export function selfCheckInstitucionesLogos(): void {
    const sample = getInstitutionLogo('IESA');
    if (!sample) throw new Error('logo IESA (id 3) missing');
    if (!sample.startsWith('/instituciones/logos/')) {
        throw new Error(`expected local logo path, got ${sample}`);
    }
    const norte = getInstitutionLogo(
        'INSTITUTO TÉCNICO NACIONAL DE COMERCIO - CÚCUTA, NORTE DE SANTANDER',
    );
    if (!norte) throw new Error('logo ITN variante NORTE missing');
}
