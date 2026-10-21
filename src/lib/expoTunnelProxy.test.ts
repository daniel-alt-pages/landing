import { describe, expect, it } from 'vitest';
import { headersForExpoProxy, isExpoDevProxyPath } from './expoTunnelProxy';

describe('isExpoDevProxyPath', () => {
  it('cubre login, api y el bundle web que Next reescribe a Expo', () => {
    expect(isExpoDevProxyPath('/login', null)).toBe(true);
    expect(isExpoDevProxyPath('/api/auth/login', null)).toBe(true);
    expect(isExpoDevProxyPath('/__katex/katex.min.css', null)).toBe(true);
    expect(isExpoDevProxyPath('/index.bundle', 'web')).toBe(true);
    expect(isExpoDevProxyPath('/landing', null)).toBe(false);
  });
});

describe('headersForExpoProxy', () => {
  it('quita Origin para que Expo no rechace el túnel', () => {
    const headers = headersForExpoProxy(new Headers({
      origin: 'https://divisions-lock-confident-receiver.trycloudflare.com',
      'content-type': 'application/json',
    }));
    expect(headers.get('origin')).toBeNull();
    expect(headers.get('content-type')).toBe('application/json');
  });
});
