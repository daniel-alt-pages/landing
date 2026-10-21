import { describe, expect, it } from 'vitest';
import { platformLoginUrl, programasUrl, tiendaLandingUrl } from './contacto';

describe('platformLoginUrl', () => {
  it('abre la app EduGenios en la máquina local', () => {
    expect(platformLoginUrl('127.0.0.1')).toBe('http://127.0.0.1:8081/login');
    expect(platformLoginUrl('localhost')).toBe('http://localhost:8081/login');
  });

  it('en el sitio público de la alianza abre la app pública', () => {
    expect(platformLoginUrl('alianza.seamosgenios.org')).toBe('https://app.seamosgenios.org/login');
    expect(platformLoginUrl('alianza-sg.vercel.app')).toBe('https://app.seamosgenios.org/login');
  });

  it('en la red local abre el login en esa misma IP', () => {
    expect(platformLoginUrl('192.168.1.36')).toBe('http://192.168.1.36:8081/login');
    expect(platformLoginUrl('10.0.0.8')).toBe('http://10.0.0.8:8081/login');
  });

  it('en otro servidor conserva el host de la página', () => {
    expect(platformLoginUrl('colegio.example.com')).toBe('https://colegio.example.com/login');
  });

  it('en un túnel abre el login de ese origen', () => {
    expect(platformLoginUrl('demo.trycloudflare.com')).toBe('https://demo.trycloudflare.com/login');
  });

  it('desde la landing en una IP de red abre el login en esa IP', () => {
    const previous = global.window;
    global.window = {
      location: { hostname: '192.168.1.36', port: '3010', protocol: 'http:', origin: 'http://192.168.1.36:3010' },
    } as unknown as typeof global.window;
    expect(platformLoginUrl('192.168.1.36')).toBe('http://192.168.1.36:8081/login');
    global.window = previous;
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
