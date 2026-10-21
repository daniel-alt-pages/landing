// Roles admin/coordinador — mantener alineado con scripts/admin/roles_registry.json (Fase 2 claims)

// Lista de correos administradores (producción)
export const ADMIN_EMAILS = [
    "scopegenius.icfes@gmail.com",
    "seamosgenios@adpmh.com",
    "danielff999gf@gmail.com",
];

export const isAdmin = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
};

// ========================================
// Coordinadores de Institución
// ========================================

/** Separador en localStorage / JWT cuando un coord tiene varias instituciones. */
export const MULTI_INSTITUTION_SEP = '|';

/** `"*"` = global; `string` = una institución; `string[]` = varias (sin global). */
export type CoordinatorScope = string | readonly string[];

/**
 * Mapeo de correo electrónico → alcance institucional.
 * El nombre debe coincidir exactamente con el campo `institucion`
 * en la data de los estudiantes (case-sensitive).
 *
 * Instituciones disponibles:
 *   - "IETAC"
 *   - "PREICFES SEAMOSGENIOS"
 *   - "INDIVIDUAL (PROYECTO SECUNDARIO)"
 */
/** Clave corta para asesores departamentales (JWT ≤1000 chars). */
export const CASANARE_SCOPE_KEY = 'CASANARE';

/** IE de Casanare en simulacros — nombres exactos en Firestore. */
export const CASANARE_INSTITUTIONS = [
    'CC PRESENTACION BUENAHORA - PORE, CASANARE',
    'ESCUELA NORMAL SUPERIOR - MONTERREY, CASANARE',
    'IE ANTONIO MARTINEZ DELGADO - HATO COROZAL, CASANARE',
    'IE BONIFACIO GUTIERREZ - HATO COROZAL, CASANARE',
    'IE CUPIAGUA - AGUAZUL, CASANARE',
    'IE EL CUSIANA - TAURAMENA, CASANARE',
    'IE GAVIOTA - MANI, CASANARE',
    'IE JORGE ELIECER GAITAN - AGUAZUL, CASANARE',
    'IE LA INMACULADA - OROCUE, CASANARE',
    'IE LUIS MARIA JIMENEZ - AGUAZUL, CASANARE',
    'IE RAFAEL URIBE URIBE - PORE, CASANARE',
    'IE SALVADOR CAMACHO ROLDAN - NUNCHIA, CASANARE',
    'IE SIGLO XXI - TAURAMENA, CASANARE',
    'IE VICTOR GOMEZ CORREDOR - EL TABLON, CASANARE',
    'IED LUIS HERNANDEZ VARGAS - HATO COROZAL',
    'IEI ALEGAXU - HATO COROZAL, CASANARE',
    'IET INTEGRADO - TRINIDAD, CASANARE',
    'IETA ANTONIO NARINO - PORE, CASANARE',
    'IESA',
    'IESC',
] as const;

function normalizeScopeKey(value: string): string {
    return value.trim().toUpperCase();
}

export function isCasanareCoordinatorScope(stored: string): boolean {
    return normalizeScopeKey(stored) === CASANARE_SCOPE_KEY;
}

export function expandCoordinatorScopeParts(parts: readonly string[]): string[] {
    const out: string[] = [];
    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        if (isCasanareCoordinatorScope(trimmed)) {
            out.push(...CASANARE_INSTITUTIONS);
            continue;
        }
        out.push(trimmed);
    }
    return out;
}

export const COORDINATOR_MAP: Record<string, CoordinatorScope> = {
    // "*" = acceso a TODAS las instituciones (supercoordinador)
    "seamosgenios@adpmh.com": "*",
    "adm.seamosgenios@gmail.com": "*",
    "leandrocardona.edu.seamosgenios@gmail.com": "*",
    "andrearamirez.edu.seamosgenios@gmail.com": ["IETAC", "PREICFES SEAMOSGENIOS"],
    "danielcuspoca.edu.seamosgenio@gmail.com": ["IETAC", "PREICFES SEAMOSGENIOS"],
    "scopegenius.ultra@gmail.com": "*",
    "jesus.sg26.ietaccoo@gmail.com": "IETAC",
    "isasdaniel64@gmail.com": "IETAC",
    "psicologaetac@gmail.com": "IETAC",
    "hrzandres009@gmail.com": "*",
    "mendietar763@gmail.com": "*",
    "aprenderparae@gmail.com": "IESA",
    "educateconlina236@gmail.com": "COLEGIO INTEGRAL DEL NORTE",
    "leidy.macea79@gmail.com": "INSECAP",
    "coordinacionalegrejuventud@gmail.com": "IE LICEO ALEGRE JUVENTUD - MALAMBO",
    "rafaelcoordinador4@gmail.com": "IED RURAL DE PALERMO",
    "pripoll22@gmail.com": "IED RURAL DE PALERMO",
    "guettericoalvaro@gmail.com": "IED PEDRO DE HEREDIA",
    "gelca1123@gmail.com": "I.E. SIMÓN BOLÍVAR - LA CUMBRE",
    "jessicaortizleal@gmail.com": "I.E. LUIS GABRIEL CASTRO - NORTE DE SANTANDER",
    "lleidyperez1203@gmail.com": "IET INTEGRADO - TRINIDAD, CASANARE",
    "ieantonionarinopore@gmail.com": "IETA ANTONIO NARINO - PORE, CASANARE",
    "ovargasnavas@gmail.com": "IE LA INMACULADA - OROCUE, CASANARE",
    "alexcoy2019@gmail.com": "IE CUPIAGUA - AGUAZUL, CASANARE",
    "chzury@iesigloxxi.org": "IE SIGLO XXI - TAURAMENA, CASANARE",
    "jesusbuen@yahoo.es": "IE VICTOR GOMEZ CORREDOR - EL TABLON, CASANARE",
    "jesusobg1@gmail.com": "IE VICTOR GOMEZ CORREDOR - EL TABLON, CASANARE",
    "fayamabo1980@gmail.com": "IE BONIFACIO GUTIERREZ - HATO COROZAL, CASANARE",
    "iejeg_coord.academica@iejorgeliecergaitan-aguazul-casanare.edu.co": "IE JORGE ELIECER GAITAN - AGUAZUL, CASANARE",
    "marinvalen768@gmail.com": "IED LUIS HERNANDEZ VARGAS - HATO COROZAL",
    "alexandercepeda2387@gmail.com": "IE RAFAEL URIBE URIBE - PORE, CASANARE",
    "geiderherrera2019@gmail.com": "IEI ALEGAXU - HATO COROZAL, CASANARE",
    "edwin.mbaez009@gmail.com": "IE GAVIOTA - MANI, CASANARE",
    "coordinacionamd@gmail.com": "IE ANTONIO MARTINEZ DELGADO - HATO COROZAL, CASANARE",
    "cienciassocialeslmj@gmail.com": "IE LUIS MARIA JIMENEZ - AGUAZUL, CASANARE",
    "proyecto.pienc@gmail.com": "IE EL CUSIANA - TAURAMENA, CASANARE",
    "celopezcar@gmail.com": CASANARE_SCOPE_KEY,
    "ing.edwval@gmail.com": CASANARE_SCOPE_KEY,
    "virtualprofesoranamaria@gmail.com": "COLEGIO PRADO VERANIEGO - SUBA, BOGOTÁ",
    "alejoherba119@gmail.com": "COLEGIO PRADO VERANIEGO - SUBA, BOGOTÁ",
    "saraluna2276@gmail.com": "IE LA INMACULADA - OROCUE, CASANARE",
    "loscurosinstitucioneducativa@gmail.com": "IE LOS CUROS - PIEDECUESTA, SANTANDER",
    "iedeguatacasur@sedbolivar.gov.co": "IE GUATACA SUR - MARGARITA, BOLÍVAR",
    "instecnalcom@semcucuta.edu.co": "IT NACIONAL DE COMERCIO - CÚCUTA, NORTE DE SANTANDER",
    "administrador@ied-desarrollorural-sed-cun.ie.edu.co": "IED DE DESARROLLO RURAL - FOSCA, CUNDINAMARCA",
    "janr13@gmail.com": "IED DE DESARROLLO RURAL - FOSCA, CUNDINAMARCA",
    "pinto.da28@gmail.com": "ESCUELA NORMAL SUPERIOR DE PIEDECUESTA - PIEDECUESTA, SANTANDER",
    "carisa2122@gmail.com": "INSTITUCIÓN EDUCATIVA DEPARTAMENTAL CAÑO DE AGUAS - CAÑO DE AGUAS, MAGDALENA",
    "trillizosd3@hotmail.com": "INSTITUCIÓN EDUCATIVA DEPARTAMENTAL CAÑO DE AGUAS - CAÑO DE AGUAS, MAGDALENA",
    "instedutablon@hotmail.com": "IE VICTOR GOMEZ CORREDOR - EL TABLON, CASANARE",
    "ievictorgomezcorredor@sedcasanare.gov.co": "IE VICTOR GOMEZ CORREDOR - EL TABLON, CASANARE",
    "iesantairene@sedcasanare.gov.co": "INSTITUCIÓN EDUCATIVA SANTA IRENE - TRINIDAD, CASANARE",
    "colegionazarethpurificacion@gmail.com": "COLEGIO NUESTRA SEÑORA DE NAZARETH - PURIFICACIÓN, TOLIMA",
    "samuel.montoya229@educacionbogota.edu.co": "IED REINO DE HOLANDA - TUENJELITO, BOGOTÁ",
    "jmtorresh@educacionbogota.edu.co": "IED REINO DE HOLANDA - TUENJELITO, BOGOTÁ",
    "wrico@educacionbogota.edu.co": "IED REINO DE HOLANDA - TUENJELITO, BOGOTÁ",
    "cedreinodeholanda18@educacionbogota.edu.co": "IED REINO DE HOLANDA - TUENJELITO, BOGOTÁ",
    "c.academica@corsaje.edu.co": "INSTITUCIÓN EDUCATIVA SAGRADO CORAZÓN DE JESÚS - CÚCUTA, N. DE SANTANDER",
    "ludyangelicamanrique@gmail.com": "COLEGIO INTEGRADO MONSEÑOR EVARISTO BLANCO - SAN MIGUEL, SANTANDER",
    "ingpalacios90@gmail.com": "IED LOMA DEL BALSAMO",
    "iehoracioperdomo@sedcasanare.gov.co": "INSTITUCIÓN EDUCATIVA HORACIO PERDOMO - HATO COROZAL, CASANARE",
    "iealcarpe2007@gmail.com": "INSTITUCIÓN EDUCATIVA ALONSO CARVAJAL PERALTA - CHITAGÁ, N. DE SANTANDER",
    "ing.bohorquezk@gmail.com": "INSTITUCIÓN EDUCATIVA JÉSUS BERNAL PINZÓN - MANÍ, CASANARE",
    "ngiraldoieeoh@tic.edu.co": "INSTITUCIÓN EDUCATIVA ENRIQUE OLAYA HERRERA - ARMENIA, QUINDÍO",
    "ieenriqueolayaherrera@tic.edu.co": "INSTITUCIÓN EDUCATIVA ENRIQUE OLAYA HERRERA - ARMENIA, QUINDÍO",
    "iecupiagua@sedcasanre.gov.co": "IE CUPIAGUA - AGUAZUL, CASANARE",
    "johacifu.29@gmail.com": "IED MARIA MEDINA FOSCA",
    "naadtohe@gmail.com": "INSTITUCIÓN EDUCATIVA CUSTODIO GARCIA ROVIRA - INÍRIDA, GUAINÍA",
    "ilusanport@gmail.com": "INSTITUCIÓN EDUCATIVA LUIS SÁNCHEZ PORTO - SOLEDAD, ATLÁNTICO",
    "yusethcastroortega@gmail.com": "INSTITUCIÓN EDUCATIVA LUIS SÁNCHEZ PORTO - SOLEDAD, ATLÁNTICO",
    "comixcoordinadora@gmail.com": "CORPORACION EDUCATIVA COLEGIO COMUNAL MIXTO - BARRANQUILLA, ATLÁNTICO",
    "divinaestrada17@gmail.com": "IED RURAL DE PALERMO",
    "milenebolivar01@hotmail.com": "IED RURAL DE PALERMO",
    "lmiguelurbina@hotmail.com": "COLEGIO INTEGRADO SIMÓN BOLÍVAR - CÚCUTA, N. DE SANTANDER",
    "naislytovar@gmail.com": "INSTITUCIÓN EDUCATIVA CUSTODIO GARCIA ROVIRA - INÍRIDA, GUAINÍA",
    "karenstmoreno@gmail.com": "COLEGIO VILLEMAR DEL CARMEN - FONTIBÓN, BOGOTÁ",
    "samuelestebanm@gmail.com": "IED REINO DE HOLANDA - TUENJELITO, BOGOTÁ",
    "allopezg38@gmail.com": "INSTITUCIÓN EDUCATIVA ENRIQUE OLAYA HERRERA - ARMENIA, QUINDÍO",
    "g3m34ux@gmail.com": "COLEGIO INTEGRADO SIMÓN BOLÍVAR - CÚCUTA, N. DE SANTANDER",
    "chirleysanchez1@gmail.com": "INSTITUCIÓN EDUCATIVA JAIME GARZÓN - CÚCUTA, N. DE SANTANDER",
    "j.herreraandres84@gmail.com": "IESC",
};

export function serializeCoordinatorScope(scope: CoordinatorScope): string {
    if (typeof scope === 'string') return scope;
    return scope.join(MULTI_INSTITUTION_SEP);
}

/** Alcance persistido (localStorage / claim `institution`). */
export function parseCoordinatorScope(stored: string): string[] {
    const trimmed = (stored || '').trim();
    if (!trimmed || trimmed === '*' || trimmed.toUpperCase() === 'TODAS') return [];
    if (isCasanareCoordinatorScope(trimmed)) return [...CASANARE_INSTITUTIONS];
    if (trimmed.includes(MULTI_INSTITUTION_SEP)) {
        return expandCoordinatorScopeParts(
            trimmed.split(MULTI_INSTITUTION_SEP).map((part) => part.trim()).filter(Boolean),
        );
    }
    return [trimmed];
}

export function getCoordinatorScopeDisplayLabel(stored: string): string {
    const trimmed = (stored || '').trim();
    if (!trimmed || trimmed === '*' || trimmed.toUpperCase() === 'TODAS') return 'TODAS';
    if (isCasanareCoordinatorScope(trimmed)) return 'Casanare — todas las IE';
    const parts = parseCoordinatorScope(trimmed);
    if (parts.length > 3) return `${parts.length} instituciones`;
    return parts.join(' · ') || trimmed;
}

export function isGlobalCoordinatorScope(stored: string): boolean {
    const trimmed = (stored || '').trim();
    return !trimmed || trimmed === '*' || trimmed.toUpperCase() === 'TODAS';
}

/** Vista agregada por defecto: global, alias CASANARE o varias IE en alcance. */
export function shouldDefaultCoordinatorSelectionToTodas(stored: string): boolean {
    const trimmed = (stored || '').trim();
    if (isGlobalCoordinatorScope(trimmed)) return true;
    if (isCasanareCoordinatorScope(trimmed)) return true;
    return parseCoordinatorScope(trimmed).length > 1;
}

/** Selector de IE efectivo (claim base ≠ filtro activo). */
export function resolveCoordinatorSelectedInstitution(
    baseInstitution: string,
    savedSelected = '',
): string {
    const base = (baseInstitution || '').trim();
    const saved = (savedSelected || '').trim();
    if (isGlobalCoordinatorScope(base)) {
        return saved || 'TODAS';
    }
    if (shouldDefaultCoordinatorSelectionToTodas(base)) {
        const savedKey = normalizeScopeKey(saved);
        const baseKey = normalizeScopeKey(base);
        if (!saved || savedKey === baseKey || isCasanareCoordinatorScope(saved)) {
            return 'TODAS';
        }
        return saved;
    }
    return saved || base;
}

/** ¿Mostrar cohorte agregada (TODAS) en lugar de una IE concreta? */
export function isCoordinatorSelectionAggregated(
    baseInstitution: string,
    selectedInstitution: string,
): boolean {
    const selected = (selectedInstitution || '').trim();
    if (!selected || selected === '*' || selected.toUpperCase() === 'TODAS') return true;
    if (isCasanareCoordinatorScope(selected)) return true;
    const base = (baseInstitution || '').trim();
    if (
        shouldDefaultCoordinatorSelectionToTodas(base) &&
        normalizeScopeKey(selected) === normalizeScopeKey(base)
    ) {
        return true;
    }
    return false;
}

export const isCoordinator = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return email.toLowerCase() in COORDINATOR_MAP;
};

/** Valor para localStorage / claim principal (una inst o `A|B`). */
export function getCoordinatorInstitution(email: string): string | null {
    const scope = COORDINATOR_MAP[email.toLowerCase()];
    if (scope == null) return null;
    return serializeCoordinatorScope(scope);
}

export function getCoordinatorInstitutions(email: string): string[] {
    const scope = COORDINATOR_MAP[email.toLowerCase()];
    if (scope == null || scope === '*') return [];
    if (typeof scope === 'string') {
        if (isCasanareCoordinatorScope(scope)) return [...CASANARE_INSTITUTIONS];
        return [scope];
    }
    return expandCoordinatorScopeParts(scope);
}

/** Returns true if coordinator has access to ALL institutions */
export const isGlobalCoordinator = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return COORDINATOR_MAP[email.toLowerCase()] === '*';
};
