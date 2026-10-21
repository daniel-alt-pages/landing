import { COMPANY } from './company';
import { LEGAL_SLUGS } from './legalRoutes';

const UPDATED = COMPANY.docsUpdated;
const VERSION = COMPANY.consentVersion;

function p(...paragraphs) {
  return paragraphs;
}

export const LEGAL_DOCS = Object.freeze([
  Object.freeze({
    id: 'terminos',
    title: 'Términos y condiciones',
    footerLabel: 'Términos del servicio',
    summary: 'Contrato de uso, cupo, conducta y material.',
    icon: 'file-text',
    requiredForConsent: true,
    updated: UPDATED,
    sections: Object.freeze([
      {
        heading: 'Aceptación',
        paragraphs: p(
          'Estos términos son el contrato de uso de la plataforma y del programa Pre-ICFES. Al crear una cuenta o pagar, declara que los leyó y los acepta. Si no está de acuerdo, no use el servicio.',
          'Si el estudiante tiene entre 14 y 17 años, el acudiente presta consentimiento y responde de forma solidaria por las obligaciones económicas y de conducta.',
        ),
      },
      {
        heading: 'Qué incluye (y qué no)',
        paragraphs: p(
          'SEAMOSGENIOS presta acompañamiento pedagógico, material y tutorías. Es una obligación de medio: el puntaje ICFES y el ingreso a una universidad dependen del estudiante. La inscripción no garantiza un cupo universitario.',
        ),
      },
      {
        heading: 'Material y propiedad intelectual',
        paragraphs: p(
          'La plataforma, las marcas, los simulacros y el material son de SEAMOSGENIOS o están licenciados. Se entregan solo para uso personal del inscrito. El valor de matrícula cubre el acceso, no el banco de desafíos.',
        ),
        bullets: [
          'Prohibido copiar, publicar, vender, extraer (incluido scraping) o capturar el material.',
          'Filtrar el contenido (WhatsApp, redes, venta) es infracción. Las partes tasan esos perjuicios en cinco (5) SMMLV, sin perjuicio de la expulsión y de las acciones penales.',
        ],
      },
      {
        heading: 'Cuenta y convivencia',
        paragraphs: p(
          'La cuenta es personal. Quien la usa responde por lo que ocurra en ella. El uso simultáneo desde varias IP puede suspender el acceso, con aviso.',
        ),
        bullets: [
          'Leve: impuntualidad o interrumpir la clase (amonestación).',
          'Media: reincidencia, irrespeto o abandono reiterado (aviso al acudiente y suspensión).',
          'Grave: fraude con IA, que un tercero presente la evaluación, extracción de material o ataque a la plataforma (expulsión y pérdida de lo pagado).',
          'Antes de expulsar: informe, 24 horas para descargos y decisión de Dirección.',
        ],
      },
      {
        heading: 'Precio',
        paragraphs: p(
          `El valor vigente es el de la pasarela. El cobro lo procesa ${COMPANY.paymentProcessor}; no guardamos tarjetas. Retracto y devoluciones están solo en la Política de reembolsos.`,
        ),
      },
      {
        heading: 'Responsabilidad y ley',
        paragraphs: p(
          'En lo permitido por la Ley 1480 de 2011, no respondemos por lucro cesante, puntaje, internet del estudiante ni contenidos de terceros. El inscrito y el acudiente mantienen indemne a SEAMOSGENIOS frente a usos indebidos o filtración de material.',
          `Rige la ley colombiana. Si no hay acuerdo en quince (15) días hábiles, conocen los jueces de ${COMPANY.jurisdiction}. Datos personales: Política de privacidad.`,
        ),
      },
    ]),
  }),
  Object.freeze({
    id: 'privacidad',
    title: 'Política de privacidad',
    footerLabel: 'Política de privacidad',
    summary: 'Qué datos pedimos, para qué y cómo ejercer habeas data.',
    icon: 'shield-check',
    requiredForConsent: true,
    updated: UPDATED,
    sections: Object.freeze([
      {
        heading: 'Alcance',
        paragraphs: p(
          'SEAMOSGENIOS SAS es el responsable del tratamiento (Ley 1581 de 2012). Canales y plazos de PQR están en Información de contacto. No vendemos bases de datos.',
        ),
      },
      {
        heading: 'Qué recopilamos',
        bullets: [
          'Identidad y contacto: nombre, documento, fecha de nacimiento, correo, celular, usuario.',
          'Ubicación académica: país, municipio, colegio, grado, jornada.',
          'Perfil de preparación: objetivo, áreas, vocación, dispositivo y conexión.',
          'Acudiente, si el estudiante es menor.',
          `Pago: datos del pagador y confirmación. Las tarjetas las procesa ${COMPANY.paymentProcessor}.`,
          'Uso técnico: IP, dispositivo, progreso, asistencia y señales de seguridad.',
          'Opcional, solo si usted lo escribe: calidad de la conexión, lugar de estudio y cómo conoció el programa. No hacen falta para crear la cuenta.',
        ],
      },
      {
        heading: 'Para qué',
        bullets: [
          'Crear la cuenta, activar el aula y cumplir el contrato.',
          'Cobrar, emitir comprobante y, si aplica, factura.',
          'Avisos de clase, soporte y códigos.',
          'Prevenir fraude y proteger el material.',
          'Mejorar el servicio.',
          'Marketing e imagen solo si marca esas casillas opcionales.',
          'Atender PQR y deberes legales.',
        ],
      },
      {
        heading: 'Menores',
        paragraphs: p(
          'El programa incluye adolescentes de educación media. El acudiente autoriza el tratamiento. Privilegiamos el interés superior del menor. No pedimos datos de salud; si alguien los escribe en un campo libre, quedan en reserva.',
        ),
      },
      {
        heading: 'Encargados, cookies y transferencias',
        paragraphs: p(
          `Compartimos con encargados (Google Firebase para la cuenta y la base de datos, correo, ${COMPANY.paymentProcessor} y factura si aplica), el acudiente o la institución del convenio, el asesor que eligió y autoridades cuando la ley lo exija. No publicamos notas en redes sin autorización de imagen.`,
          'El detalle del almacenamiento del navegador está en la Política de cookies. Analítica, personalización y publicidad solo se activan si usted las acepta en el aviso. Si un encargado aloja datos fuera de Colombia, hace falta su autorización o un nivel de protección adecuado (art. 26, Ley 1581 de 2012).',
        ),
      },
      {
        heading: 'Sus derechos',
        paragraphs: p(
          'Puede conocer, actualizar, rectificar, pedir prueba de la autorización, revocar, solicitar supresión cuando no haya deber legal de conservar, y quejarse ante la Superintendencia de Industria y Comercio.',
          'WhatsApp o correo promocional solo con la casilla opcional (Ley 2300 de 2023). Puede retirarla y seguiremos enviando avisos del servicio.',
        ),
      },
    ]),
  }),
  Object.freeze({
    id: 'cookies',
    title: 'Política de cookies',
    footerLabel: 'Política de cookies',
    summary: 'Qué guarda el navegador, para qué finalidad y durante cuánto tiempo.',
    icon: 'shield-check',
    requiredForConsent: false,
    updated: UPDATED,
    sections: Object.freeze([
      {
        heading: 'Qué guardamos',
        paragraphs: p(
          'Las cookies son textos que este sitio guarda en su navegador. Las clasificamos con los mismos fines que describe Google: funcionalidad, seguridad, analítica, publicidad y personalización (https://policies.google.com/technologies/cookies?hl=es). Las nuestras son de primera parte, con SameSite=Lax y ruta /. En https también llevan Secure.',
        ),
        bullets: [
          'Funcionalidad, siempre: sg_consent guarda su elección durante 13 meses (395 días). sg_cart guarda el carrito de programas durante 6 meses (180 días).',
          'Seguridad: eg_session y eg_tools son HttpOnly, SameSite=Lax y duran 12 horas. Solo las crea la plataforma al iniciar sesión. La página pública no puede leerlas ni apagarlas.',
          'Analítica, solo si usted acepta: sg_aid identifica este navegador y sg_meter cuenta eventos de la página, ambas 13 meses. Google Analytics (_ga, 2 años, solo esta propiedad) se carga únicamente si hay un identificador configurado y usted aceptó analítica.',
          'Personalización, solo si usted acepta: sg_vista recuerda el filtro y el último programa del catálogo durante 6 meses (180 días).',
          'Publicidad, solo si usted acepta: no guardamos una cookie propia de anuncios. Meta Pixel se carga únicamente si hay un identificador configurado y usted aceptó publicidad.',
          'Campaña: sg_utm recuerda el origen de la visita durante 90 días, solo si aceptó analítica o publicidad. Hasta entonces esa referencia vive solo en la pestaña.',
          'Sesión de Firebase Auth en el almacenamiento del navegador, para mantener el inicio de sesión de la plataforma.',
          'Borrador de inscripción: en esta pestaña (sessionStorage) y, si hay correo, una copia sin contraseña en localStorage para retomar el formulario.',
          'Preferencia de apariencia y versión de la aplicación, en localStorage. Caché de la base de datos en IndexedDB, para que el aula no repita descargas.',
          'reCAPTCHA de Google, solo si elige iniciar sesión con celular. En ese momento Google puede guardar cookies propias.',
          `Pago con ${COMPANY.paymentProcessor}: al salir hacia la pasarela, ese sitio puede usar cookies propias. No guardamos el número de la tarjeta.`,
          'En la página de cotización, un video de YouTube en modo privacidad (youtube-nocookie) solo se carga si usted lo reproduce. El logo de la inscripción se pide a ibb.co y algunas imágenes comerciales a ImageKit. Esa petición lleva la IP y datos técnicos del navegador a esos servidores.',
        ],
      },
      {
        heading: 'Cómo decidir',
        paragraphs: p(
          'En Colombia el tratamiento de datos personales, incluidas las cookies que identifican a una persona, se rige por la Ley 1581 de 2012 y el Decreto 1377 de 2013. No hay una ley que copie el banner europeo para toda cookie.',
          'Antes de guardarlas pedimos autorización para analítica, personalización y publicidad. Puede aceptar todo, dejar solo las necesarias o elegir cada finalidad. Las de funcionalidad y la sesión no se apagan desde el aviso porque el carrito y la cuenta las necesitan.',
          'Puede cambiar la elección en el pie de la página de alianza, en Cookies. Rechazar borra las cookies opcionales de este sitio, incluidas _ga y las de Meta si se hubieran creado.',
        ),
      },
      {
        heading: 'Cómo limitarlas',
        paragraphs: p(
          'Puede borrar el almacenamiento de este sitio en el navegador. Sin la sesión no permanecerá autenticado, el carrito de la página se vacía y puede perder el borrador. Eso no borra la cuenta en nuestros servidores: para conocer, actualizar o suprimir datos use los canales de habeas data de Información de contacto.',
        ),
      },
    ]),
  }),
  Object.freeze({
    id: 'reembolsos',
    title: 'Política de reembolsos',
    footerLabel: 'Política de reembolso',
    summary: 'Retracto de 5 días hábiles, cesión de cupo y qué no se devuelve.',
    icon: 'file-text',
    requiredForConsent: false,
    updated: UPDATED,
    sections: Object.freeze([
      {
        heading: 'Retracto (5 días hábiles)',
        paragraphs: p(
          `Puede retractarse dentro de los cinco (5) días hábiles siguientes al pago, sin dar razones. Escríbanos por los canales oficiales con nombre, documento, referencia ${COMPANY.paymentProcessor} y la frase “Solicito retracto”.`,
          'Devolvemos en máximo treinta (30) días calendario, por el mismo medio cuando el banco lo permita. El acceso se anula.',
        ),
      },
      {
        heading: 'Después del retracto',
        paragraphs: p(
          'No hay devolución por retiro voluntario: el cupo se reservó, el material digital quedó disponible y los costos de tutores y plataforma ya se causaron.',
        ),
      },
      {
        heading: 'Cesión del cupo',
        paragraphs: p(
          'Si aún no usó el aula de forma sustancial, puede ceder el cupo a otra persona, sin costo, avisando con 24 horas de anticipación. Envíe nombre, documento, correo y celular de quien recibe. No hay cesión para evadir una sanción.',
        ),
      },
      {
        heading: 'Errores, reversión y expulsión',
        bullets: [
          'Pago duplicado o cobro equivocado: se devuelve el excedente o queda como saldo, según usted elija.',
          'Reversión (art. 51, Ley 1480): fraude, operación no pedida o servicio no prestado. No aplica por puntaje ICFES ni por retiro voluntario.',
          'Expulsión por falta grave: no hay reembolso.',
        ],
      },
    ]),
  }),
  Object.freeze({
    id: 'acceso',
    title: 'Acceso digital',
    footerLabel: 'Política de envío',
    summary: 'El aula se activa con el pago o el código. No hay domicilio.',
    icon: 'globe',
    requiredForConsent: false,
    updated: UPDATED,
    sections: Object.freeze([
      {
        heading: 'Servicio virtual',
        paragraphs: p(
          `No despachamos paquetes ni material impreso. Con el pago aprobado por ${COMPANY.paymentProcessor} o un código válido (SGA / SGP / SGV), el acceso queda el mismo día hábil y a más tardar en 24 horas. El aviso sale al correo de inscripción.`,
          'Si no ve el aula en ese plazo, escriba por los canales oficiales con la referencia del pago. Necesita internet estable y un dispositivo actualizado. Mantenimientos programados: aviso con al menos 12 horas. No respondemos por su red ni por caídas de terceros.',
        ),
      },
    ]),
  }),
  Object.freeze({
    id: 'contacto',
    title: 'Información de contacto',
    footerLabel: 'Información de contacto',
    summary: 'Canales oficiales y plazos de PQR.',
    icon: 'phone',
    requiredForConsent: false,
    updated: UPDATED,
    sections: Object.freeze([
      {
        heading: 'Canales oficiales',
        bullets: [
          `Razón social: ${COMPANY.legalName}`,
          `NIT: ${COMPANY.nit}`,
          `Domicilio: ${COMPANY.city}, ${COMPANY.department}, ${COMPANY.country}. Las notificaciones se reciben en el correo y el celular de esta página.`,
          `Correo: ${COMPANY.email}`,
          `Celular / WhatsApp: ${COMPANY.phoneDisplay}`,
        ],
      },
      {
        heading: 'Qué canal usar',
        bullets: [
          'Inscripción y códigos: WhatsApp o correo, con nombre y documento.',
          `Pagos ${COMPANY.paymentProcessor}, retracto o factura: correo, con la referencia.`,
          'Datos personales: correo, asunto “Habeas data”.',
          'Soporte de la plataforma: canales de la cuenta o el mismo correo.',
        ],
        paragraphs: p(
          'Atendemos en días hábiles. Consultas de habeas data: hasta 10 días hábiles. PQR: hasta 15 días hábiles. El ICFES oficial no es nuestro soporte.',
        ),
      },
    ]),
  }),
]);

export function getLegalDoc(slug) {
  const id = String(slug || '');
  return LEGAL_DOCS.find((doc) => doc.id === id) || null;
}

export function listLegalDocs() {
  return LEGAL_DOCS;
}

export const LEGAL_FOOTER_LINKS = LEGAL_DOCS.map((doc) => ({
  slug: doc.id,
  label: doc.footerLabel,
  path: `/legal/${doc.id}`,
}));

export const LEGAL_BODY = Object.freeze([
  `Al crear tu cuenta aceptas las condiciones de uso de ${COMPANY.legalName} (NIT ${COMPANY.nit}), Cali.`,
  'Los datos se usan para el aula, la inscripción y los avisos del programa. Si eres menor, el acudiente autoriza.',
  `Retracto: 5 días hábiles desde el pago. Analítica, personalización y publicidad solo si las acepta en el aviso de cookies. Versión ${VERSION}.`,
]);

export function assertLegalCatalog() {
  const ids = LEGAL_DOCS.map((doc) => doc.id);
  if (ids.length !== LEGAL_SLUGS.length || LEGAL_SLUGS.some((slug) => !ids.includes(slug))) {
    throw new Error('legal: catálogo incompleto');
  }
}
