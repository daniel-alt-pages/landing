/** Precios del portafolio B2B. Valores por estudiante, IVA del 19% incluido. */

const BANDAS = ['Hasta 50 est.', '51 a 80 est.', '81 a 120 est.', 'Más de 120 est.'] as const;

export const B2B_PRECIOS = {
  eyebrow: 'Precios',
  title: ['Tabla maestra de precios', 'del portafolio'] as const,
  lead: 'Se calcula según el producto, la población y el alcance. Valores por estudiante, con IVA del 19% incluido.',
  bandas: BANDAS,
  tabs: [
    {
      id: 'precio-1',
      label: 'Nivel 1',
      caption: 'Simulacro de pago público y B2B Nivel 1',
      rows: [
        ['Simulacro pago público', '$27.537', '$17.897', '$12.796', '$9.930'],
        ['B2B Nivel 1', '$41.717', '$26.238', '$18.048', '$13.446'],
      ],
      extraTitle: 'Adicionales cotizables',
      extra: [
        'Simulacros adicionales.',
        'Cuadernillos exclusivos personalizados.',
        'Informe extraordinario.',
        'Socialización adicional.',
        'Análisis histórico especial.',
        'Comparación con otras fuentes.',
        'Personalizaciones de aplicación.',
      ],
    },
    {
      id: 'precio-2',
      label: 'Nivel 2',
      caption: 'B2B Nivel 2',
      rows: [
        ['B2B Nivel 2 · 20 h', '$75.751', '$46.258', '$30.654', '$21.884'],
        ['B2B Nivel 2 · 30 h', '$92.768', '$56.268', '$36.956', '$26.103'],
        ['B2B Nivel 2 · 50 h', '$126.802', '$76.288', '$49.561', '$34.541'],
      ],
      extraTitle: 'Adicionales cotizables',
      extra: [
        'Simulacros adicionales.',
        'Cuadernillos exclusivos personalizados.',
        'Sesiones adicionales.',
        'Informe especial.',
        'Formación en una competencia específica.',
        'Cohortes o grupos separados.',
      ],
    },
    {
      id: 'precio-3',
      label: 'Nivel 3',
      caption: 'B2B Nivel 3',
      rows: [
        ['B2B Nivel 3 semestral', '$415.844', '$351.386', '$317.281', '$298.114'],
        ['B2B Nivel 3 anual', '$879.203', '$728.295', '$648.449', '$603.577'],
      ],
      extraTitle: 'Qué no incluye por defecto',
      extra: [
        'Cohorte completamente exclusiva para el colegio.',
        'Horarios exclusivos para los estudiantes.',
        'Simulacros adicionales a los contratados.',
        'Cuadernillos exclusivos personalizados.',
        'Actividades presenciales.',
        'Traslados.',
        'Impresión de simulacros.',
        'Desarrollo tecnológico a la medida.',
        'Reuniones extraordinarias ilimitadas.',
      ],
    },
    {
      id: 'estudiantes',
      label: 'PreICFES',
      caption: 'PreICFES intensivo y vacacional, precio por estudiante',
      headers: ['Producto', 'Precio por estudiante, IVA incluido'],
      rows: [
        ['PreICFES intensivo', '$457.049'],
        ['PreICFES vacacional', '$351.615'],
      ],
      extraTitle: '',
      extra: [] as string[],
    },
  ],
};

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
