export const PROGRAM_KINDS = Object.freeze([
  { id: 'programa', label: 'Programa' },
  { id: 'simulacro', label: 'Simulacro' },
  { id: 'curso', label: 'Curso' },
]);

export const PROGRAM_NEEDS = Object.freeze([
  { id: 'saber11', label: 'Presento el Saber 11 este año' },
  { id: 'puntaje', label: 'Quiero subir mi puntaje' },
  { id: 'simulacros', label: 'Solo quiero practicar con simulacros' },
  { id: 'ingles', label: 'Necesito Inglés' },
  { id: 'egresado', label: 'Ya me gradué' },
]);

/** Filtro compartido del catálogo de Programas. */

export function filterProgramas(items, { need = '', kind = '' } = {}) {
  return (items || []).filter((item) => {
    const catalog = item?.catalog || {};
    if (kind && catalog.kind !== kind) return false;
    if (need && !(catalog.needs || []).includes(need)) return false;
    return true;
  });
}

export function formatCop(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}
