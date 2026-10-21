import { buildCourseCalendarEventsUrl } from './courseCalendarConfig';
import type { CourseCalendarEventsResponse } from './courseCalendarTypes';

export async function fetchCourseCalendarEvents(params?: {
  start?: string;
  end?: string;
  weeks?: number;
  includeCancelled?: boolean;
  signal?: AbortSignal;
}): Promise<CourseCalendarEventsResponse> {
  const url = buildCourseCalendarEventsUrl(params);
  if (!url) {
    return {
      success: false,
      error:
        'Lista vacacional solo en dev local. Ejecuta npm run dev (calendar-api :3099).',
    };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: params?.signal,
      cache: 'no-store',
    });
  } catch {
    return {
      success: false,
      error:
        'No se pudo conectar al servidor de calendario. ¿Está corriendo npm run dev:calendar-api?',
    };
  }

  let data: CourseCalendarEventsResponse;
  try {
    data = (await res.json()) as CourseCalendarEventsResponse;
  } catch {
    return {
      success: false,
      error: res.ok ? 'Respuesta inválida del servidor de calendario.' : `Error ${res.status}`,
    };
  }

  if (!res.ok && data.success === false) {
    return data;
  }

  if (!res.ok) {
    return {
      success: false,
      error: `Error ${res.status}`,
    };
  }

  return data;
}
