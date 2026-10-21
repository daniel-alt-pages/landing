# Paso a paso — clics del cursor (panel estudiante)

Contenedor: `section#metodo-cientifico` → `.showcase-embed-stage--fluid`.

**Regla:** el tour solo hace `fireTourTargetClick(domId)`. Cada `domId` está en [`constants/dom-ids.ts`](constants/dom-ids.ts). La lista canónica vive en [`navigation/showcase-navigation.ts`](navigation/showcase-navigation.ts) → `SHOWCASE_TOUR_CLICK_STEPS`.

## Secuencia (24 pasos)

| # | DOM id | Qué hace el usuario | Resultado |
|---|--------|---------------------|-----------|
| 1 | `showcase-section-score` | Mira puntaje global | Sin cambio de tab |
| 2–5 | `showcase-tab-SG11-08` … `SG11-19` | Cambia simulacro | Recarga datos del sim |
| 6 | `showcase-section-materias` | Scroll a materias | Orientación |
| 7 | `showcase-materia-tab-matemáticas` | Clic Matemáticas | `/estudiante/analisis?materia=matemáticas` |
| 8 | `showcase-section-respuestas-kpi` | KPIs del área | Orientación |
| 9 | `showcase-section-heatmap` | Mapa de respuestas | Orientación |
| 10 | `showcase-question-box-3` | Clic pregunta 3 | Modal pregunta |
| 11 | `showcase-nav-dashboard` | Inicio | `/estudiante/dashboard` |
| 12 | `showcase-nav-ranking` | Ranking | `/estudiante/ranking` |
| 13 | `showcase-section-ranking-kpi` | KPIs ranking | Orientación |
| 14 | `showcase-section-ranking-top` | Fila del top | Modal perfil ranking |
| 15 | `showcase-nav-perfil` | Perfil | `/estudiante/perfil` |
| 16 | `showcase-section-perfil-evolucion` | Evolución | Orientación |
| 17 | `showcase-section-perfil-social` | Social | Orientación |
| 18 | `showcase-nav-metricas` | Métricas | `/estudiante/estadisticas` |
| 19 | `showcase-section-metricas-hero` | Hero métricas | Modal ranking |
| 20 | `showcase-section-metricas-grupo` | Tu rendimiento | Modal grupo |
| 21 | `showcase-materia-area-matemáticas` | Card área | Modal Matemáticas |
| 22 | `showcase-metricas-area-analizar` | Analizar respuestas | Análisis + `returnTo` estadísticas |
| 23 | `showcase-nav-back` | Volver (flecha Análisis) | Vuelve a Métricas |
| 24 | `showcase-nav-dashboard` | Cierre ciclo | Inicio |

## Ritmo visual (por paso)

1. Cursor se mueve al `domId` (highlight).
2. Hover ~560 ms antes del clic.
3. Un solo `click` sintético (misma burbuja que el usuario).
4. Pausa de asentamiento (`TOUR_POST_NAV_SETTLE_MS`) tras cambiar de tab.
5. Scroll completo del panel antes de clics inferiores.

## Archivos del tour

- Timeline: [`tour/tour-timeline.ts`](tour/tour-timeline.ts)
- Frames + targets: [`tour/compute-tour-frame.ts`](tour/compute-tour-frame.ts)
- Clic DOM: [`tour/tour-interaction.ts`](tour/tour-interaction.ts)
- Captions: [`tour/tour-config.ts`](tour/tour-config.ts)

Duración del ciclo: `SHOWCASE_TOUR_CYCLE_MS` en `tour-timeline.ts` (~78 s).
