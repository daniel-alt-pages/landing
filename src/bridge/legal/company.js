/** Identidad pública de SEAMOSGENIOS SAS — fuente única para voucher, legal y PQR. */
export const COMPANY = Object.freeze({
  legalName: 'SEAMOSGENIOS SAS',
  shortName: 'SEAMOSGENIOS',
  brand: 'SeamosGenios',
  nit: '902080201',
  city: 'Cali',
  department: 'Valle del Cauca',
  country: 'Colombia',
  municipalityCode: '76001',
  phone: '3052990900',
  phoneDisplay: '+57 305 299 0900',
  email: 'seamosgenios@adpmh.com',
  whatsappUrl: 'https://wa.me/573052990900',
  jurisdiction: 'Cali, Valle del Cauca',
  paymentProcessor: 'Bold',
  consentVersion: 'inscripcion-sg-2026-09',
  docsUpdated: '27 de septiembre de 2026',
});

export const MERCHANT = Object.freeze({
  legalName: COMPANY.legalName,
  city: COMPANY.city,
  phone: COMPANY.phone,
  email: COMPANY.email,
  nit: COMPANY.nit,
});

export function companyLine() {
  return `${COMPANY.legalName} · NIT ${COMPANY.nit} · ${COMPANY.city}`;
}
