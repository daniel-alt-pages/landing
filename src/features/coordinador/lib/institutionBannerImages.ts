import { normalizeText } from '@features/coordinador/lib/coordinadorDataHelpers';

const PRISMIC = 'https://images.prismic.io/seamosgenios';

/** Orden: tokens más específicos primero. */
const INSTITUTION_BANNERS: { tokens: string[]; url: string }[] = [
    {
        tokens: ['PREICFES GRATUITO JOVENES BOGOTA', 'JOVENES BOGOTA'],
        url: `${PRISMIC}/ajqm1lbRV8_Qfxm-_PREICFESGRATUITOJOVENESBOGOT%C3%81-SEAMOSGENIOS.png?auto=format,compress`,
    },
    {
        tokens: ['PREICFES INTENSIVO'],
        url: `${PRISMIC}/ajqm11bRV8_Qfxm__PREICFESINTENSIVOSG-SIMULACROS.png?auto=format,compress`,
    },
    {
        tokens: ['PREICFES SEAMOSGENIOS', 'PREICFES VACACIONAL', 'PREICFES GRATIS', 'PREICFES GRUPO'],
        url: `${PRISMIC}/ajqm2FbRV8_QfxnA_PREICFESVACACIONALSG-SIMULACROS.png?auto=format,compress`,
    },
    {
        tokens: ['INDIVIDUAL PROYECTO SECUNDARIO', 'INDIVIDUAL PAGO UNICO', 'INDIVIDUAL SG', 'INDIVIDUAL'],
        url: `${PRISMIC}/ajqm1VbRV8_Qfxm9_INDIVIDUALSG-SIMULACROS.png?auto=format,compress`,
    },
    { tokens: ['IETAC'], url: `${PRISMIC}/ajqm1FbRV8_Qfxm8_IETAC-SIMULACROS.png?auto=format,compress` },
    {
        tokens: ['IETA ANTONIO NARINO VARGAS', 'ANTONIO NARINO VARGAS'],
        url: `${PRISMIC}/ajqm01bRV8_Qfxm7_IETAANTONIONARI%C3%91OVARGAS-SIMULACROS.png?auto=format,compress`,
    },
    { tokens: ['IET INTEGRADO'], url: `${PRISMIC}/ajqm0lbRV8_Qfxm6_IETINTEGRADO-SIMULACROS.png?auto=format,compress` },
    {
        tokens: ['LA FUENTE', 'IERD LA FUENTE'],
        url: `${PRISMIC}/ajqm0VbRV8_Qfxm5_IERDLAFUENTE-SIMULACROS.png?auto=format,compress`,
    },
    {
        tokens: ['IED RURAL DE PALERMO', 'IED RURAL PALERMO', 'RURAL DE PALERMO'],
        url: `${PRISMIC}/ajqm0FbRV8_Qfxm4_IEDRURALPALERMO-SIMULACROS.png?auto=format,compress`,
    },
    {
        tokens: ['MARIA MEDINA FOSCA', 'MARIA MEDINA', 'IED MARIA MEDINA'],
        url: `${PRISMIC}/ajqmz1bRV8_Qfxm3_IEDMAR%C3%8DAMEDINA-SIMULACROS.png?auto=format,compress`,
    },
    {
        tokens: ['LOMA DEL BALSAMO', 'IED LOMA DEL BALSAMO'],
        url: `${PRISMIC}/ajqmzlbRV8_Qfxm2_IEDLOMADELBALSAMO-SIMULACROS.png?auto=format,compress`,
    },
    {
        tokens: ['VICTOR GOMEZ CORREDOR', 'VICTOR GOMEZ'],
        url: `${PRISMIC}/ajqmzVbRV8_Qfxm1_IEVICTORG%C3%92MEZCORREDOR-SIMULACROS.png?auto=format,compress`,
    },
    {
        tokens: ['SIMON BOLIVAR', 'IE SIMON BOLIVAR'],
        url: `${PRISMIC}/ajqmzFbRV8_Qfxm0_IESIM%C3%93NBOL%C3%8DVAR-SIMULACROS.png?auto=format,compress`,
    },
    { tokens: ['SIGLO XXI'], url: `${PRISMIC}/ajqmy1bRV8_Qfxmz_IESIGLOXXI-SIMULACROS.png?auto=format,compress` },
    {
        tokens: ['SAN GERARDO', 'INSTITUCION EDUCATIVA SAN GERARDO'],
        url: `${PRISMIC}/ajqmylbRV8_Qfxmy_IESANGERARDO-SIMULACROS.png?auto=format,compress`,
    },
    {
        tokens: ['SAN AGUSTIN', 'IE SAN AGUSTIN', 'IESA'],
        url: `${PRISMIC}/ajqmyFbRV8_Qfxmx_IESANAGUSTI%C3%8DN-SIMULACROS.png?auto=format,compress`,
    },
    { tokens: ['SALVADOR CAMACHO'], url: `${PRISMIC}/ajqmx1bRV8_Qfxmw_IESALVADORCAMACHO-SIMULACROS.png?auto=format,compress` },
    {
        tokens: ['SAGRADO CORAZON', 'COL SAGRADO CORAZON'],
        url: `${PRISMIC}/ajqmxlbRV8_Qfxmu_IESAGRADOCORAZ%C3%93N-SIMULACROS.png?auto=format,compress`,
    },
    { tokens: ['REMEDIOS SOLANO'], url: `${PRISMIC}/ajqmxVbRV8_Qfxms_IEREMEDIOSSOLANO-SIMULACROS.png?auto=format,compress` },
    { tokens: ['RAFAEL URIBE URIBE', 'RAFAEL URIBE'], url: `${PRISMIC}/ajqmxFbRV8_Qfxmp_IERAFAELURIBEURIBE-SIMULACROS.png?auto=format,compress` },
    {
        tokens: ['PEDRO DE HEREDIA', 'IED PEDRO DE HEREDIA'],
        url: `${PRISMIC}/ajqmw1bRV8_Qfxmn_IEPEDRODEHEREDIA-SIMULACROS.png?auto=format,compress`,
    },
    { tokens: ['LUIS MARIA JIMENEZ'], url: `${PRISMIC}/ajqmwlbRV8_Qfxml_IELUISMARIAJIMENEZ-SIMULACROS.png?auto=format,compress` },
    {
        tokens: ['LUIS HERNANDEZ VARGAS', 'IED LUIS HERNANDEZ VARGAS', 'HATO COROZAL'],
        url: `${PRISMIC}/ajqmwVbRV8_Qfxmj_IELUISHERNANDEZVARGAS-SIMULACROS.png?auto=format,compress`,
    },
    {
        tokens: ['LUIS GABRIEL CASTRO', 'INSTITUCION EDUCATIVA LUIS GABRIEL CASTRO', 'IE LUIS GABRIEL'],
        url: `${PRISMIC}/ajqmwFbRV8_Qfxmh_IElUISGABRIELCARLOS-SIMULACROS.png?auto=format,compress`,
    },
    { tokens: ['LUIS CARLOS GALAN'], url: `${PRISMIC}/ajqmv1bRV8_Qfxmf_IELUISCARLOSGAL%C3%81N-SIMULACROS.png?auto=format,compress` },
    {
        tokens: ['LICEO ALEGRE JUVENTUD', 'IE LICEO ALEGRE'],
        url: `${PRISMIC}/ajqmvlbRV8_Qfxmc_IELICEOALEGREJUVENTUD-SIMULACROS.png?auto=format,compress`,
    },
    { tokens: ['LAS VILLAS'], url: `${PRISMIC}/ajqmvVbRV8_QfxmZ_IELASVILLAS-SIMULACROS.png?auto=format,compress` },
    { tokens: ['LA INMACULADA'], url: `${PRISMIC}/ajqmvFbRV8_QfxmX_IELAINMACULADA-SIMULACROS.png?auto=format,compress` },
    { tokens: ['LA DESPENSA'], url: `${PRISMIC}/ajqmu1bRV8_QfxmV_IELADESPENSA-SIMULACROS.png?auto=format,compress` },
    { tokens: ['JORGE GAITAN'], url: `${PRISMIC}/ajqmulbRV8_QfxmT_IEJORGEGAITAN-SIMULACROS.png?auto=format,compress` },
    { tokens: ['GAVIOTAS'], url: `${PRISMIC}/ajqmuVbRV8_QfxmR_IEGAVIOTAS-SIMULACROS.png?auto=format,compress` },
    { tokens: ['GABRIEL GARCIA MARQUEZ'], url: `${PRISMIC}/ajqmuFbRV8_QfxmP_IEGABRIELGARCIAMARQUEZ-SIMULACROS.png?auto=format,compress` },
    { tokens: ['EL CUSIANA'], url: `${PRISMIC}/ajqmt1bRV8_QfxmN_IEELCUSIANA-SIMULACROS.png?auto=format,compress` },
    { tokens: ['CUPIAGUA'], url: `${PRISMIC}/ajqmtlbRV8_QfxmL_IECUPIAGUA-SIMULACROS.png?auto=format,compress` },
    { tokens: ['CIUDADELA SUCRE'], url: `${PRISMIC}/ajqmtVbRV8_QfxmI_IECIUDADELASUCRE-SIMULACROS.png?auto=format,compress` },
    { tokens: ['CIUDAD LATINA'], url: `${PRISMIC}/ajqmtFbRV8_QfxmH_IECIUDADLATINA-SIMULACROS.png?auto=format,compress` },
    { tokens: ['CAZUCA'], url: `${PRISMIC}/ajqms1bRV8_QfxmF_IECAZUC%C3%81-SIMULACROS.png?auto=format,compress` },
    { tokens: ['BUENOS AIRES'], url: `${PRISMIC}/ajqms1bRV8_QfxmD_IEBUENOSAIRES-SIMULACROS.png?auto=format,compress` },
    { tokens: ['BONIFACIO GUTIERREZ'], url: `${PRISMIC}/ajqmsVbRV8_QfxmC_IEBONIFACIOGUTIERREZ-SIMULACROS.png?auto=format,compress` },
    { tokens: ['ANTONIO MARTINEZ DELGADO'], url: `${PRISMIC}/ajqmsFbRV8_QfxmB_IEANTONIOMARTINEZDELGADO-SIMULACROS.png?auto=format,compress` },
    {
        tokens: ['ALFONSO LOPEZ', 'IED ALFONSO LOPEZ', 'I.E.D. ALFONSO LOPEZ'],
        url: `${PRISMIC}/ajqmr1bRV8_Qfxl__IEALFONSOL%C3%93PEZ-SIMULACROS.png?auto=format,compress`,
    },
    { tokens: ['ALEGAXU'], url: `${PRISMIC}/ajqmrlbRV8_Qfxl-_IEALEGAXU-SIMULACROS.png?auto=format,compress` },
    {
        tokens: ['ESCUELA SUPERIOR MONTERREY', 'SUPERIOR MONTERREY'],
        url: `${PRISMIC}/ajqmrVbRV8_Qfxl9_ESCUELASUPERIORMONTERREY-SIMULACROS.png?auto=format,compress`,
    },
    {
        tokens: ['PRESENTACION BUENAHORA', 'CC PRESENTACION BUENAHORA'],
        url: `${PRISMIC}/ajqmrVbRV8_Qfxl8_CCPRESENTACI%C3%93NBUENAHORA-SIMULACROS.png?auto=format,compress`,
    },
];

export function resolveInstitutionBannerUrl(institutionName: string | undefined | null): string | null {
    const norm = normalizeText(institutionName || '');
    if (!norm || norm === 'TODAS' || norm === 'TODAS LAS INSTITUCIONES') return null;

    for (const entry of INSTITUTION_BANNERS) {
        for (const token of entry.tokens) {
            const t = normalizeText(token);
            if (!t) continue;
            if (norm.includes(t) || t.includes(norm)) return entry.url;
        }
    }
    return null;
}
