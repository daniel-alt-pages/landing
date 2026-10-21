import { describe, expect, it } from 'vitest';
import { courseAccessMatchesIdentity } from './courseAccessIdentityMatch';
import type { CourseAccessDoc } from '../types/courseTypes';

function grant(partial: Partial<CourseAccessDoc>): CourseAccessDoc {
  return {
    id: 'preicfes-sg26__grant__test@example.com',
    courseId: 'preicfes-sg26',
    active: true,
    role: 'student',
    source: 'grant',
    emailLower: 'test@example.com',
    documento: '1097912847',
    studentId: '1097912847',
    ...partial,
  };
}

describe('courseAccessMatchesIdentity', () => {
  it('requiere email Google + documento', () => {
    const access = grant({});
    expect(
      courseAccessMatchesIdentity(access, {
        emailLower: 'test@example.com',
        documento: '1097912847',
        studentId: '1097912847',
      }),
    ).toBe(true);
  });

  it('acepta email exacto sin perfil local seleccionado', () => {
    const access = grant({});
    expect(
      courseAccessMatchesIdentity(access, {
        emailLower: 'test@example.com',
      }),
    ).toBe(true);
  });

  it('rechaza email distinto', () => {
    const access = grant({});
    expect(
      courseAccessMatchesIdentity(access, {
        emailLower: 'otro@example.com',
        documento: '1097912847',
        studentId: '1097912847',
      }),
    ).toBe(false);
  });

  it('rechaza documento distinto con email correcto', () => {
    const access = grant({});
    expect(
      courseAccessMatchesIdentity(access, {
        emailLower: 'test@example.com',
        documento: '9999999999',
        studentId: '9999999999',
      }),
    ).toBe(false);
  });

  it('multi-perfil: grant email propio abre curso aunque el doc del grant sea otro perfil', () => {
    const access = grant({
      emailLower: 'agenteno11sg@gmail.com',
      documento: '1005650933',
      studentId: '1005650933',
    });
    expect(
      courseAccessMatchesIdentity(access, {
        emailLower: 'agenteno11sg@gmail.com',
        documento: '1097912847',
        studentId: '1097912847',
      }),
    ).toBe(true);
  });

  it('acepta match solo por studentId si documento vacío en identidad', () => {
    const access = grant({ documento: '' });
    expect(
      courseAccessMatchesIdentity(access, {
        emailLower: 'test@example.com',
        studentId: '1097912847',
      }),
    ).toBe(true);
  });
});
