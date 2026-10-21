# Landing (web pública)

Repositorio solo de la landing de SEAMOSGENIOS. Next.js en `:3010`. La página pública vive en `src/app/landing/` y se abre en `/landing`.

Los textos legales y el filtro del catálogo que antes vivían en el monorepo están en `src/bridge/`.

## Arranque

```bash
npm install
npm run dev      # http://127.0.0.1:3010/landing
```

## Dónde está cada cosa

| Qué | Dónde |
|-----|-------|
| Páginas de la landing | `src/app/landing/` |
| Textos (copy) | `src/app/landing/_contenido/` |
| Imágenes | `public/landing/` (fuente en `assets-src/landing/`) |
| Formulario de contacto (Apps Script) | `integrations/landing-leads/` |
| Despliegue en Vercel | `vercel.json` |

Las demás rutas de `src/app/` (`estudiante`, `coordinador`, `demo`, `admin`…) son del fork viejo. Están apagadas (`NEXT_PUBLIC_REPORTS_OPERATIONAL=0`) y no son producto.

## Variables

Copia `.env.local.example` como `.env.local`. No uses `NEXT_PUBLIC_FIREBASE_*`: el arranque falla si están.
