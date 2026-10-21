import { describe, expect, it } from 'vitest';
import {
  isEnrollmentEmailMismatch,
  maskEnrollmentEmail,
} from './courseEnrollmentEmailHint';

describe('maskEnrollmentEmail', () => {
  it('enmascara correo largo', () => {
    expect(maskEnrollmentEmail('vargas.salojeda@gmail.com')).toBe('varg***@gmail.com');
  });

  it('enmascara correo corto', () => {
    expect(maskEnrollmentEmail('ab@gmail.com')).toBe('a***@gmail.com');
  });
});

describe('isEnrollmentEmailMismatch', () => {
  it('detecta correos distintos', () => {
    expect(
      isEnrollmentEmailMismatch('otro@gmail.com', 'vargas.salojeda@gmail.com'),
    ).toBe(true);
  });

  it('ignora si falta alguno', () => {
    expect(isEnrollmentEmailMismatch(undefined, 'test@gmail.com')).toBe(false);
  });
});
