/**
 * Ubicación oficial por institución (fuente: coordinación SG).
 * Claves = nombre exacto en Firestore / campo `institucion` (mayúsculas, sin tildes en match).
 * Ampliar cuando lleguen más IE.
 */

export type InstitutionTerritoryEntry = {
    /** Nombres canónicos y alias (normalizados en lookup). */
    institutionKeys: string[];
    department: string;
    municipality: string;
};

/** Registro parcial — faltan IE; las no listadas usan fichas de estudiantes. */
export const INSTITUTION_TERRITORY_REGISTRY: InstitutionTerritoryEntry[] = [
    {
        institutionKeys: ['IETAC'],
        department: 'Cordoba',
        municipality: 'Tierra Adentro',
    },
    {
        institutionKeys: ['PREICFES SEAMOSGENIOS', 'SEAMOSGENIOS'],
        department: 'Valle del Cauca',
        municipality: 'Cali',
    },
    {
        institutionKeys: ['IESA'],
        department: 'Casanare',
        municipality: 'Aguazul',
    },
    {
        institutionKeys: ['IED RURAL DE PALERMO'],
        department: 'Atlantico',
        municipality: 'Palermo',
    },
    {
        institutionKeys: ['IED MARIA MEDINA DE FOSCA'],
        department: 'Cundinamarca',
        municipality: 'Fosca',
    },
    {
        institutionKeys: ['IED LUIS HERNANDEZ VARGAS'],
        department: 'Casanare',
        municipality: 'Hato Corozal',
    },
    {
        institutionKeys: ['IED PEDRO DE HEREDIA'],
        department: 'Magdalena',
        municipality: 'Heredia',
    },
];

export function normalizeInstitutionKey(value: string) {
    return value
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

const REGISTRY_INDEX = (() => {
    const map = new Map<string, Omit<InstitutionTerritoryEntry, 'institutionKeys'>>();
    for (const entry of INSTITUTION_TERRITORY_REGISTRY) {
        const payload = { department: entry.department, municipality: entry.municipality };
        for (const key of entry.institutionKeys) {
            map.set(normalizeInstitutionKey(key), payload);
        }
    }
    return map;
})();

export function lookupInstitutionTerritory(institutionName: string) {
    const key = normalizeInstitutionKey(institutionName);
    if (!key) return null;
    return REGISTRY_INDEX.get(key) ?? null;
}

export function listRegisteredInstitutionKeys() {
    return INSTITUTION_TERRITORY_REGISTRY.flatMap((e) => e.institutionKeys);
}
