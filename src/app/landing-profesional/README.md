# Landing profesional (`/landing-profesional`)

Marketing y demos para prospectos. No es el producto operativo (`/estudiante/*`, `/coordinador/*`).

## Rutas Next.js (raíz)

| Archivo | Función |
|---------|---------|
| `page.tsx` / `layout.tsx` | Entrada App Router + metadata |
| `landing-profesional.css` | Estilos globales de la landing |

## `contenido-landing/` — implementación

| Carpeta | Qué guarda |
|---------|------------|
| `CotizacionLanding.tsx` | Shell principal (client) |
| `content.tsx` | Copy, nav links, datos editoriales |
| `ui-componentes/` | Componentes UI reutilizables (nav, cards, calculadora, …) |
| `secciones/` | Bloques grandes de página (#impacto, #metodo-cientifico, #faq, …) |
| `mapa-impacto/` | Mapa Colombia, métricas territoriales, GeoJSON embebido en `datos-geo/` |
| `carrusel-metodo-cientifico/` | Carrusel 3D «método científico» (ver README interno) |
| `ventas-coordinacion/` | Modal y formularios comerciales |
| `datos-marketing/` | Evidencias y galería estática de presentación |
| `utilidades/` | Hooks Firestore/local, tema documento, catálogo colegios |
| `tipos/` | Tipos TS (`index.ts`) + `landingReference.ts` |

Import base:

```ts
import { X } from '@/app/landing-profesional/contenido-landing/...';
```

## Ruta legada

`/cotizacion-simulacro` → redirect a `/landing-profesional` (ver `app/cotizacion-simulacro/page.tsx` + `firebase.json`).

## Scripts que escriben datos

- `pnpm run landing:impact` → `contenido-landing/mapa-impacto/datos-geo/landingImpactSummary.json`
- Ver README histórico en docs del repo para Firestore `landing_reference`.

## Demos de paneles reales

Previews en `carrusel-metodo-cientifico/` (coordinador + estudiante embebidos). PDF institucional: `contenido-landing/ui-componentes/CotizacionSimulacroPdfLimitedPreview.tsx`.
