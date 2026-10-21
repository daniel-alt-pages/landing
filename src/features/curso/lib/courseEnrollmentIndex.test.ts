import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCourseEnrollmentIndex } from './courseEnrollmentIndex';

describe('fetchCourseEnrollmentIndex', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('ignores SPA HTML fallback responses instead of throwing', async () => {
    Object.defineProperty(globalThis, 'window', { value: {}, configurable: true });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<!doctype html>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })),
    );

    await expect(fetchCourseEnrollmentIndex('preicfes-sg26')).resolves.toBeNull();
  });
});
