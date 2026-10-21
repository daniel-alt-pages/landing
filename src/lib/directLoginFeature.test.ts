import { describe, expect, it } from 'vitest';
import { isDirectLoginEnabled } from './directLoginFeature';

describe('isDirectLoginEnabled', () => {
  it('stays disabled unless the explicit public flag is true', () => {
    const previous = process.env.NEXT_PUBLIC_DIRECT_LOGIN_ENABLED;
    delete process.env.NEXT_PUBLIC_DIRECT_LOGIN_ENABLED;
    expect(isDirectLoginEnabled()).toBe(false);

    process.env.NEXT_PUBLIC_DIRECT_LOGIN_ENABLED = 'true';
    expect(isDirectLoginEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_DIRECT_LOGIN_ENABLED = 'false';
    expect(isDirectLoginEnabled()).toBe(false);

    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_DIRECT_LOGIN_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_DIRECT_LOGIN_ENABLED = previous;
    }
  });
});
