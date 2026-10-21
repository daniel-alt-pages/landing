import type { CourseMaterial } from '../types/courseTypes';

function isCurrentSimulationMaterial(material: CourseMaterial): boolean {
  return material.materialGroup === 'simulacro_actual';
}

/** Legacy: expande carpeta con openNotice.links → carpeta + formularios sueltos. */
export function expandSimulacroMaterials(materials: CourseMaterial[]): CourseMaterial[] {
  const out: CourseMaterial[] = [];
  for (const material of materials) {
    if (!isCurrentSimulationMaterial(material) || !material.openNotice?.links?.length) {
      out.push(material);
      continue;
    }

    out.push({
      ...material,
      id: material.id.includes('-carpeta') ? material.id : `${material.id}-carpeta`,
      label: material.label.includes('Carpeta') ? material.label : `Carpeta · ${material.label}`,
      description:
        material.openNotice?.deadlineLabel?.replace(/^El acceso cierra el /i, 'Acceso hasta el ') ??
        material.description ??
        'PDFs y documentos de tu simulacro',
      openNotice: undefined,
    });

    for (const [index, link] of (material.openNotice.links ?? []).entries()) {
      const url = link.url?.trim();
      if (!url) continue;
      out.push({
        id: `${material.id}-form-${index + 1}`,
        label: link.label?.trim() || `Formulario ${index + 1}`,
        description: 'Envío de respuestas del simulacro',
        url,
        kind: 'link',
        order: (material.order ?? 1000) + index + 1,
        visible: true,
        materialGroup: 'simulacro_actual',
      });
    }
  }

  return out.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** @deprecated usar expandSimulacroMaterials */
export function expandCourseMaterialsForLocalDev(materials: CourseMaterial[]): CourseMaterial[] {
  return expandSimulacroMaterials(materials);
}

export function isCourseSimulacroLocalDirectPreview(): boolean {
  return process.env.NODE_ENV === 'development';
}
