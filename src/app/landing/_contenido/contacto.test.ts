import { describe, expect, it } from 'vitest';
import { platformLoginUrl, programasUrl, tiendaLandingUrl } from './contacto';

describe('platformLoginUrl', () => {
  it('siempre abre el login de la app pública', () => {
    for (const host of ['seamosgenios.org', 'localhost', '127.0.0.1', '192.168.1.36', 'alianza-sg.vercel.app', '']) {
      expect(platformLoginUrl(host)).toBe('https://app.seamosgenios.org/login');
    }
  });
});

describe('programasUrl', () => {
  const api = 'http://127.0.0.1:5000';

  it('no llama al loopback desde un túnel público', () => {
    expect(programasUrl('hearing-offline-goes-frequencies.trycloudflare.com', api)).toBe('');
  });

  it('sigue pidiendo el catálogo en la máquina local', () => {
    expect(programasUrl('127.0.0.1', api)).toBe('http://127.0.0.1:5000/api/programas');
    expect(programasUrl('localhost', api)).toBe('http://127.0.0.1:5000/api/programas');
    expect(tiendaLandingUrl('localhost', api)).toBe('http://127.0.0.1:5000/api/tienda/landing');
    expect(tiendaLandingUrl('demo.trycloudflare.com', api)).toBe('');
  });
});
