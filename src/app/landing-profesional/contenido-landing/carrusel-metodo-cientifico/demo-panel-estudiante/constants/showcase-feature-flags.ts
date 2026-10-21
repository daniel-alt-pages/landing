/**
 * Feature flags del showcase (landing #metodo-cientifico).
 *
 * ROLLBACK: poner `SHOWCASE_MOBILE_COMPACT_LAYOUT_ENABLED = false` y recargar.
 * Ver `demo-panel-estudiante/ROLLBACK-SHOWCASE-MOBILE-LAYOUT.md`.
 */
export const SHOWCASE_MOBILE_COMPACT_LAYOUT_ENABLED = true;

/**
 * En viewport estrecho: panel a ancho real del slot (sin `transform: scale`).
 * Tailwind del preview responde al viewport; el contenido ya no se recorta por zoom.
 * Rollback: `false` → vuelve escala 1280px + recorte 16:9.
 */
export const SHOWCASE_COMPACT_NATIVE_RESPONSIVE = true;

/**
 * Scroll del tour en desktop / escala 1280. 1 = ritmo legacy.
 * Rollback: `1`.
 */
export const SHOWCASE_TOUR_SCROLL_PACE = 1.35;

/**
 * Scroll del tour en layout compacto (más contenido vertical).
 * 1 = solo `SHOWCASE_TOUR_SCROLL_PACE`. Rollback: `1`.
 */
export const SHOWCASE_COMPACT_TOUR_SCROLL_PACE = 1.95;

/**
 * Extra solo móvil / vertical (`compactNative`). No aplica tablet 16:9.
 * Rollback: `1`.
 */
export const SHOWCASE_VERTICAL_TOUR_SCROLL_PACE = 1.12;

/**
 * Zoom solo en móvil / vertical (layout nativo). No aplica al panel 16:9 (`fluid-scale`).
 * Rollback: `1`.
 */
export const SHOWCASE_COMPACT_MOBILE_ZOOM = 1.08;

/** @deprecated Alias de `SHOWCASE_COMPACT_MOBILE_ZOOM`. */
export const SHOWCASE_COMPACT_TABLET_ZOOM = SHOWCASE_COMPACT_MOBILE_ZOOM;
