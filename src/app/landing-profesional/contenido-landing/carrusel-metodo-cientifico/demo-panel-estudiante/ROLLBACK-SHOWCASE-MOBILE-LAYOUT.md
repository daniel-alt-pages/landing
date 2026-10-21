# Rollback — layout compacto showcase en móvil

## Activar rollback (volver al comportamiento anterior)

1. Abrir `constants/showcase-feature-flags.ts`.
2. Cambiar:

   ```ts
   export const SHOWCASE_MOBILE_COMPACT_LAYOUT_ENABLED = false;
   ```

   Opcional (solo quitar ancho nativo pero dejar nav compacta):

   ```ts
   export const SHOWCASE_COMPACT_NATIVE_RESPONSIVE = false;
   ```

3. Guardar y recargar `/landing-profesional#metodo-cientifico`.

Con `SHOWCASE_MOBILE_COMPACT_LAYOUT_ENABLED = false`:

- No se monta `ShowcaseStudentNav`.
- Vuelve escala CSS 1280px en slot 16:9 (miniatura, puede recortar).

Con `SHOWCASE_COMPACT_NATIVE_RESPONSIVE = false` (y compact `true`):

- Sigue la nav compacta, pero el panel vuelve a `transform: scale` 1280px.

## Qué hace el layout compacto actual (`true` + `true`)

- Viewport &lt; 1024px: barra `ShowcaseStudentNav` con IDs del tour.
- Panel a **100% del ancho del slot**, **sin** `transform: scale` → Tailwind del preview usa el viewport real; columnas y textos se adaptan.
- Slot con altura automática (scroll interno del tour, sin recorte por “zoom”).
- Nav duplicada del dashboard oculta vía CSS.

## Responsividad del slot

El modo compacto usa **ancho real del contenedor** (`ResizeObserver` + `@container showcase-student`), no solo `matchMedia` del viewport. Si el split es estrecho en desktop ancho, el panel igual entra en layout compacto.

## Ajustes finos (sin rollback total)

Zoom solo ancho slot ≤639px (`SHOWCASE_COMPACT_MOBILE_ZOOM`). Tablet/split (~971px) = 16:9 sin zoom:

```ts
export const SHOWCASE_COMPACT_MOBILE_ZOOM = 1.12;
export const SHOWCASE_COMPACT_MOBILE_ZOOM = 1; // sin zoom
```

Scroll del tour: desktop `SHOWCASE_TOUR_SCROLL_PACE`; vertical/móvil también × `SHOWCASE_COMPACT_TOUR_SCROLL_PACE` × `SHOWCASE_VERTICAL_TOUR_SCROLL_PACE` (solo con `compactNative`):

```ts
export const SHOWCASE_TOUR_SCROLL_PACE = 1.35;
export const SHOWCASE_COMPACT_TOUR_SCROLL_PACE = 1.95;
export const SHOWCASE_VERTICAL_TOUR_SCROLL_PACE = 1.12; // un poco más lento en vertical
```

Suavizado scroll: `utilidades/showcaseTourScroll.ts` → `SHOWCASE_SCROLL_SMOOTH_TAU_MS` (más alto = más lento al seguir el target).

Solo desactivar ancho nativo (volver a miniatura escalada):

```ts
export const SHOWCASE_COMPACT_NATIVE_RESPONSIVE = false;
```

## Si algo falla en producción

- Rollback inmediato: flags en `showcase-feature-flags.ts`.
- Rollback git: revertir commits en `ShowcaseEmbedScaler`, `ShowcaseStudentShell`, `StudentPanelBrowseDemo`, `measure-embed-layout.ts`, `useShowcaseAutoScroll.ts`, `landing-profesional.css`, `showcase-feature-flags.ts`.
