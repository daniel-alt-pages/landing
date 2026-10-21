'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { replaceQueryParams } from '@shared/lib/urlQueryState';

type Options = {
    /** Si false, no escribe en la URL (solo lectura inicial). */
    persist?: boolean;
    /** Valores vacíos se eliminan del query string. */
    omitEmpty?: boolean;
};

/**
 * Estado sincronizado con un query param. Al refrescar la página se restaura.
 */
export function useUrlQueryState(
    key: string,
    defaultValue = '',
    options: Options = {},
): [string, (value: string) => void] {
    const { persist = true, omitEmpty = true } = options;
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const hydrated = useRef(false);

    const read = useCallback(() => {
        const fromUrl = searchParams.get(key)?.trim();
        if (fromUrl) return fromUrl;
        return defaultValue;
    }, [searchParams, key, defaultValue]);

    const [value, setValue] = useState(read);

    // Reaccionar a navegación externa (atrás/adelante)
    useEffect(() => {
        const next = read();
        setValue((prev) => (prev === next ? prev : next));
    }, [read]);

    // Primera hidratación desde URL
    useEffect(() => {
        if (hydrated.current) return;
        hydrated.current = true;
        const next = read();
        if (next !== defaultValue) setValue(next);
    }, [read, defaultValue]);

    const setQueryValue = useCallback(
        (next: string) => {
            setValue(next);
            if (!persist || !pathname) return;
            const trimmed = next.trim();
            replaceQueryParams(pathname, {
                [key]: omitEmpty && !trimmed ? null : trimmed,
            });
        },
        [key, omitEmpty, pathname, persist],
    );

    return [value, setQueryValue];
}

/**
 * Actualiza varios query params en una sola operación (sin re-render intermedio).
 */
export function useUrlQueryBatch() {
    const pathname = usePathname();

    return useCallback(
        (patch: Record<string, string | null | undefined>) => {
            if (!pathname) return;
            replaceQueryParams(pathname, patch);
        },
        [pathname],
    );
}
