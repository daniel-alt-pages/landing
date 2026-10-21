import { describe, expect, it } from 'vitest';
import type { CourseMaterial } from '../types/courseTypes';
import { expandSimulacroMaterials } from './courseSimulacroMaterials';

describe('expandSimulacroMaterials', () => {
  it('splits legacy simulacro folder and form links without openNotice on folder', () => {
    const materials: CourseMaterial[] = [
      {
        id: 'sg11-20',
        label: 'Simulacro SG11 - 20',
        url: 'https://drive.google.com/drive/folders/abc',
        kind: 'drive_folder',
        order: 1000,
        visible: true,
        materialGroup: 'simulacro_actual',
        openNotice: {
          title: 'Simulacro',
          message: 'Hola',
          links: [
            { label: 'Formulario Sesion 1', url: 'https://forms.gle/a' },
            { label: 'Formulario Sesion 2', url: 'https://forms.gle/b' },
          ],
        },
      },
    ];

    const expanded = expandSimulacroMaterials(materials);
    expect(expanded).toHaveLength(3);
    expect(expanded[0].openNotice).toBeUndefined();
    expect(expanded[0].url).toContain('drive/folders/abc');
    expect(expanded[1].kind).toBe('link');
    expect(expanded[2].kind).toBe('link');
  });

  it('leaves already-separated simulacro materials unchanged', () => {
    const materials: CourseMaterial[] = [
      {
        id: 'sg11-20-carpeta',
        label: 'Carpeta · Simulacro SG11 - 20',
        url: 'https://drive.google.com/drive/folders/abc',
        kind: 'drive_folder',
        order: 1000,
        visible: true,
        materialGroup: 'simulacro_actual',
      },
      {
        id: 'sg11-20-form-1',
        label: 'Formulario Sesión 1',
        url: 'https://forms.gle/a',
        kind: 'link',
        order: 1001,
        visible: true,
        materialGroup: 'simulacro_actual',
      },
    ];

    expect(expandSimulacroMaterials(materials)).toEqual(materials);
  });
});
