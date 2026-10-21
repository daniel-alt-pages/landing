# Demo panel estudiante (landing showcase)

Embed del dashboard estudiante para `#metodo-cientifico`.

## Montaje actual (split)

```
landing-showcase-student-slot     ← 16:9, container query
  └── showcase-embed-stage--fluid
        └── showcase-embed-pan--fluid   ← translateY (tour)
              └── showcase-embed-scaler--fluid   ← width 1280px, scale CSS
                    ├── ShowcaseStudentDashboard
                    └── ShowcaseVirtualCursor
```

**No montar** `ShowcaseEmbedLayoutProvider` en este flujo; la escala es solo CSS.

## Archivos clave

| Archivo | Rol |
|---------|-----|
| `components/StudentPanelBrowseDemo.tsx` | Shell del slot + tour hooks |
| `components/ShowcaseEmbedScaler.tsx` | Marco 1280px, clase `--fluid` |
| `hooks/useShowcaseAutoScroll.ts` | RAF tour, pan, cursor, fases caption |
| `viewport/showcaseViewport.ts` | Constantes 1280 / alto lógico pan |
| `viewport/measure-embed-layout.ts` | `measureShowcaseMaxPan`, `measureShowcasePanToTarget` |
| `context/ShowcaseEmbedProvider.tsx` | Estado UI (tab, sim, pregunta) |
| `context/ShowcaseEmbedLayoutContext.tsx` | **Legacy** — layout JS; no usado en split |

## Export público

Ver `index.ts`: `StudentPanelBrowseDemo`, `SHOWCASE_PANEL_DEMO_MS`, providers de tour, etc.

**Clics del cursor (paso a paso):** [`TOUR_CLICKS.md`](TOUR_CLICKS.md) y `navigation/showcase-navigation.ts` (`SHOWCASE_TOUR_CLICK_STEPS`).
