/**
 * Comentarios de la ficha de programa.
 *
 * REGLA: solo usuarios con sesión iniciada pueden comentar, con su nombre y foto;
 * no se permiten comentarios anónimos. Activarla cuando exista auth/backend real
 * (NEXT_PUBLIC_COMENTARIOS_REQUIERE_SESION='1').
 * Hoy todo es ejemplo: la regla está APAGADA por defecto y el formulario funciona como demo.
 */
import { platformLoginUrl } from '../_contenido/contacto';

export const COMENTARIOS_REQUIERE_SESION = process.env.NEXT_PUBLIC_COMENTARIOS_REQUIERE_SESION === '1';

export type SesionPlataforma = { id: string; nombre: string; foto?: string };

/**
 * Detección de sesión: la landing no tiene auth propia. Se reutiliza la misma señal que
 * usa la app del estudiante (EstudianteClientShell): localStorage 'student_id'
 * (se ignora el id 'demo'). Nombre/foto: 'student_name' / 'student_photo' si existen.
 */
export function leerSesion(): SesionPlataforma | null {
  if (typeof window === 'undefined') return null;
  try {
    const id = window.localStorage.getItem('student_id');
    if (!id || id === 'demo') return null;
    return {
      id,
      nombre: window.localStorage.getItem('student_name') || 'Estudiante',
      foto: window.localStorage.getItem('student_photo') || undefined,
    };
  } catch {
    return null;
  }
}

export function puedeComentar(sesion: SesionPlataforma | null) {
  if (!COMENTARIOS_REQUIERE_SESION) return true;
  return Boolean(sesion);
}

/** Mismo destino que «Ingresar» del header, con regreso a la ficha. */
export function loginParaComentar(volver: string) {
  const url = platformLoginUrl();
  return `${url}${url.includes('?') ? '&' : '?'}redirect=${encodeURIComponent(volver)}`;
}

export const COMENTARIOS_API_URL = (process.env.NEXT_PUBLIC_COMENTARIOS_API_URL || '').trim();

export type ComentarioNuevo = { programaId: string; estrellas: number; texto: string; autor?: SesionPlataforma | null };

/** TODO: conectar al backend real de comentarios cuando exista. No hay API hoy. */
export async function postComentario(datos: ComentarioNuevo): Promise<boolean> {
  if (!COMENTARIOS_API_URL) return false;
  const res = await fetch(COMENTARIOS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return res.ok;
}
