# preview-paneles — Previews aislados de estudiante y coordinador

Copia autocontenida de las páginas reales de `/app/estudiante/*` y `/app/coordinador/*` para que la landing pueda mostrar el producto sin exponer auth ni rutas reales.

## Reglas de aislamiento

- **NO** importar `@features/simulacro/lib/firestoreService` ni `@features/coordinador/hooks/useCoordinadorData`. Usar `./_data/firestoreMock` y `./_data/coordinadorMock`.
- **NO** importar `@/app/estudiante/*` ni `@/app/coordinador/*`. Esos son páginas reales con auth.
- **NO** importar `@/app/demo/*` (no existe).
- **SÍ** se permite importar componentes "tontos" sin Firestore: `@features/coordinador/components/*`, `@features/coordinador/lib/*`, `@shared/components/animations/*`, `@/components/SkeletonLoader`, `@/lib/performanceLevels`. Esos solo reciben datos y renderizan.

## Estructura

```
preview-paneles/
├── _data/
│   ├── firestoreMock.ts        # Misma API que firestoreService, datos canned
│   ├── coordinadorMock.ts      # useCoordinadorData mock
│   └── seeds/                  # Datos sintéticos del simulacro SG11-19
├── estudiante/
│   ├── dashboard.tsx           # Copias 1-a-1 de /app/estudiante/*
│   ├── analisis.tsx
│   ├── estadisticas.tsx
│   ├── ranking.tsx
│   ├── perfil.tsx
│   └── selector.tsx
└── coordinador/
    ├── dashboard.tsx           # Copia de /app/coordinador/page.tsx (renombrado para evitar routing)
    ├── resumen.tsx
    ├── pensum.tsx
    ├── desempeno.tsx
    ├── estudiantes.tsx
    ├── analisis.tsx
    ├── comparativa.tsx
    └── historico.tsx
```

> **Importante:** NO usar `page.tsx` como nombre de archivo dentro de `preview-paneles/`. Next.js convertiría cualquier `page.tsx` en una ruta accesible públicamente. Todos los archivos aquí son componentes nombrados que se importan desde los shells del showcase.

## Sincronización

Estos archivos son **copias congeladas**. Cuando se actualice el panel real, hay que mirror manualmente el cambio aquí (o aceptar divergencia visual hasta que se actualice).

## Cómo se montan

Los demos autoclic (`carrusel-metodo-cientifico/demo-panel-estudiante/` y `carrusel-metodo-cientifico/demo-panel-coordinador/`) renderizan estas copias dentro de un chrome `showcase-embed-stage--fluid` con autoscroll y cursor virtual.
