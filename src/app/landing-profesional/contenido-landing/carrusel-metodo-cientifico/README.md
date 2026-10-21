# Carrusel método científico (`#metodo-cientifico`)

Bloque «Pensado para equipos académicos»: carrusel 3D con demos (Drive, panel estudiante embebido, etc.).

## Estructura

```
carrusel-metodo-cientifico/
├── TrustedMarksCarousel.tsx      # Contenedor (título + carrusel)
├── carrusel-3d/                  # MethodShowcase3DCarousel
├── diapositivas/                 # MethodShowcaseSlide + buildMethodShowcaseSlides
├── demo-drive/                   # Grabaciones Google Drive
└── demo-panel-estudiante/        # Panel estudiante (NO /estudiante/dashboard)
    ├── ShowcaseStudentDashboard.tsx
    ├── StudentPanelBrowseDemo.tsx
    ├── useShowcaseDashboardStats.ts
    ├── ui-materias/
    ├── datos-embebidos/
    ├── utilidades-panel/         # escala, auto-scroll, constantes UI
    └── secciones-dashboard/      # fragmentos del dashboard showcase
```

## Flujo

1. `contenido-landing/content.tsx` → `methodShowcaseItems`
2. `diapositivas/buildMethodShowcaseSlides.tsx` → slides 3D
3. `secciones/ScientificMethodSection.tsx` importa `TrustedMarksCarousel`

## Estilos

Clases `showcase-embed-*` en `landing-profesional/landing-profesional.css`.

## Import

```ts
import { TrustedMarksCarousel } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico';
```

Barrel: `index.ts`.
