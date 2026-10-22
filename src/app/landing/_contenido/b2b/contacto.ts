/** Contacto del portafolio B2B. */
export const B2B_CONTACTO = {
  eyebrow: 'Contacto',
  title: ['Queremos', 'trabajar juntos'] as const,
  lead: 'Hablemos de cómo mejorar los resultados Saber 11 de su colegio en 2027.',
  email: 'seamosgenios@adpmh.com',
  telefonoVisible: '+57 305 299 0900',
  telefonoWa: '573052990900',
  mensaje: 'Hola, SEAMOSGENIOS. Hablemos de cómo mejorar los resultados Saber 11 de nuestro colegio en 2027.',
  web: 'https://seamosgenios.org',
  webVisible: 'seamosgenios.org',
  legal: 'SEAMOSGENIOS SAS · NIT 902080201-8',
};

export function b2bWhatsappUrl() {
  return `https://wa.me/${B2B_CONTACTO.telefonoWa}?text=${encodeURIComponent(B2B_CONTACTO.mensaje)}`;
}
