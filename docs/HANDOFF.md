# HANDOFF DETALLADO: SEAMOSGENIOS landing (estado 23-oct-2026, 03:55 hora de Bogotá, UTC-5)

> Documento base: `/workspace/handoff/HANDOFF-2026-10-23.md` (este archivo lo reemplaza con el mismo contenido).
> Todo lo que aparece aquí se verificó contra el repo (git log, git show --stat, archivos en `c9cd9da`) o contra las URLs públicas el 23-oct-2026. Lo que no se pudo verificar está marcado como tal (sección 11).
> No contiene tokens, teléfonos ni correos personales.

---

## 0. Reglas que el modelo que retome DEBE cumplir

1. **Repo:** https://github.com/daniel-alt-pages/landing (Next.js con export estático, publicado en GitHub Pages: https://daniel-alt-pages.github.io/landing/).
2. **main = `c9cd9da`** («Merge dir/cto/site-github-io (a4d0102) — v1.0.44»), en vivo.
3. **Nada va a main** sin: (a) **APTO del COO** sobre el SHA exacto y (b) **OK escrito de Daniel** en el chat de FRONTEND, CONSTRUCTOR o CTO.
4. **El único que hace merge es el CTO**, siempre con `git merge --no-ff`. **Nunca force-push.** **Nunca imprimir `GITHUB_TOKEN`.**
5. **No inventar datos.** Cada dato sobre una persona necesita una URL que lo confirme.
6. **No tocar:** header; mensajes y testimonios 2026A ni su slider; `voces.ts`; `VoiceWall`; páginas legales; la mascota.
7. **Cero precios** fuera de la tienda, el carrusel y el catálogo. **Nada de Lighthouse.** No publicar teléfonos ni correos personales.
8. **El simulacro tiene SIEMPRE 254 preguntas.**
9. Daniel habla en español y se le trata de **«usted»**. Hay que mandarle capturas (1440 y 390) de cada avance. Si cualquier bot necesita algo de él, avisarle de inmediato e insistir.
10. **Radio de 12px** en tarjetas e imágenes; respetar `prefers-reduced-motion`; usar los tokens de marca.

### IDs de agentes
| Rol | ID |
|---|---|
| FRONTEND | 4e057abb-1d6d-43e0-8431-9c2864a3b995 |
| COO | a4e7ab29-5f37-43f1-9397-20f007288eb3 |
| CTO | 8c101678-25ff-4f0c-be49-990ae6409045 |
| COPY | a012cd48-cca5-43ca-995a-877cb2ac18df |
| CONSTRUCTOR | b7cc9d13-8ccc-441e-9a15-5618fd011194 |
| Junta (grupo) | f9230237-9308-4d7d-b003-63e928086061 |

---

## 1. Mapa de ramas y worktrees (verificado con `git worktree list`)

| Rama | Punta | Base | Worktree en el box | ¿En origin? |
|---|---|---|---|---|
| `main` | `c9cd9da` (v1.0.44) | — | `/workspace/merge-main` (HEAD separado; hacer `git fetch`) | Sí |
| `dir/cto/home-quitar-secciones` | `b4acd14` | `0414a06` (v1.0.43) | `/workspace/landing-home-quitar` (clon principal `/workspace/landing`) | No (local, sin push) |
| `dir/cto/primerpaso-radio` | `c9a9c2a` | `0414a06` (v1.0.43) | `/workspace/landing-chips-radio` (clon `/workspace/landing`) | No (local) |
| `dir/constructor/propuesta-a` | `45de20a` | `0414a06` (vía `819bcdd`) | `/workspace/wt-propuesta-a` | No (local) |
| `dir/ceo/handoff` | este documento | `c9cd9da` | clon temporal | Sí (solo docs) |

Nota: las tres ramas de trabajo salieron de `0414a06` (v1.0.43), no de `c9cd9da`. El COO confirmó con `merge-tree` que `b4acd14` mezcla limpio contra v1.0.44. Las otras dos hay que comprobarlas igual antes de su merge.

Hay un respaldo local `backup/primerpaso-radio-1136815` en `/workspace/landing`. No tocarlo.

---

## 2. Commits, uno por uno (diff stat exacto)

### main
**`c9cd9da`**: merge `--no-ff` de `dir/cto/site-github-io` (`a4d0102`), **v1.0.44**, 23-oct-2026 03:22. Padres: `0414a06` y `a4d0102`.
```
 public/robots.txt                          |  4 ++--
 public/sitemap.xml                         | 14 +++++++-------
 scripts/pages-assemble.mjs                 |  2 ++
 src/app/landing/_contenido/b2b/contacto.ts |  2 +-
 src/app/landing/_contenido/contacto.ts     |  2 +-
 src/app/landing/instituciones/page.tsx     | 14 +++++++-------
 src/app/landing/layout.tsx                 | 15 ++++++++-------
 7 files changed, 28 insertions(+), 25 deletions(-)
```
Qué cambió: SITE, canonical, og, robots, sitemap y contacto ahora apuntan a github.io (`afa8133`). Además, robots.txt y sitemap.xml entran al artefacto de Pages (`a4d0102`).
Por qué: seamosgenios.org/landing da 404 (ese dominio sigue sirviendo el sitio viejo de otro repo).

### dir/cto/home-quitar-secciones (limpieza de /resultados)
**`f68a090`** (02:46): quita «Resultados que su colegio puede mostrar» y «Estudiantes de todo el país en lo más alto» de /resultados, y limpia una referencia comentada en la home.
```
 src/app/landing/page.tsx            |  3 ---
 src/app/landing/resultados/page.tsx | 13 +------------
 2 files changed, 1 insertion(+), 15 deletions(-)
```
Por qué: el primer bloque tenía una imagen de relleno (nube y colinas) y 3 botones; el segundo (`ResultadosB2026`) repetía los álbumes.

**`fe912cb`** (02:49): une «Puntajes que cambian trayectorias» con los álbumes completos en una sola sección (`ResultsGallery id="resultados" titleAs="h1" estilo="alianzas"`).
```
 src/app/landing/_componentes/secciones/ResultsGallery.tsx | 5 +++--
 src/app/landing/page.tsx                                  | 3 +++
 src/app/landing/resultados/page.tsx                       | 9 ++-------
 3 files changed, 8 insertions(+), 9 deletions(-)
```
Por qué: así queda un solo h1 y el ancla `#resultados`, de modo que el menú «Puntajes destacados» funciona sin tocar `menu.ts`. La home queda idéntica byte a byte.

**`fa7b8f4`** (02:56): el cierre de /resultados muestra solo la tarjeta de WhatsApp (nueva prop opcional `tarjetas` en FinalCta).
```
 src/app/landing/_componentes/secciones/FinalCta.tsx | 10 +++++++---
 src/app/landing/landing.css                         |  3 +++
 src/app/landing/resultados/page.tsx                 |  2 +-
 3 files changed, 11 insertions(+), 4 deletions(-)
```
Por qué: según la DIRECTIVA, las tarjetas «Reunión de 30 minutos» y «Simulacro gratis» repetían casi palabra por palabra las opciones del `LeadForm` de al lado (unos 730 px de repetición en 390). Daniel aprobó quitarlas aunque llevan la mascota. Las demás páginas quedan igual (por defecto se muestran todas las tarjetas). La clase `ag-close-cards--single` está en landing.css.

**`b4acd14`** (03:43): vuelven a aparecer las 6 fotos destacadas B2026 en el carrusel de álbumes.
```
 src/app/landing/resultados/page.tsx | 3 +--
 1 file changed, 1 insertion(+), 2 deletions(-)
```
Por qué: al quitar `ResultadosB2026`, el `excluirFotos` dejaba fuera los 6 mejores puntajes. **El COO lo dio APTO**, con merge-tree limpio contra v1.0.44.

### dir/cto/primerpaso-radio
**`22a4d92`** (02:10): radio de 12px en tarjetas e imágenes de «Cómo funciona el primer paso».
```
 src/app/landing/landing.css | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)
```
**`c0f88eb`** (02:31): por debajo de 1024px y con movimiento reducido, el muro de voces crece con sus tarjetas y ya no se monta sobre «Cómo funciona el primer paso».
```
 src/app/landing/landing.css | 7 +++++++
 1 file changed, 7 insertions(+)
```
**`c9a9c2a`** (02:35): el mismo arreglo aplicado a todos los anchos.
```
 src/app/landing/landing.css | 8 ++++----
 1 file changed, 4 insertions(+), 4 deletions(-)
```
Por qué: la regla del radio de 12px y un solape real con reduced-motion. Solo se toca CSS; no se toca la estructura de VoiceWall ni `voces.ts`.

### dir/constructor/propuesta-a
**`819bcdd`**: Propuesta A «Del simulacro a la decisión» en `#como-empieza`, con una línea de tiempo de 4 hitos, sellos y CTA.
```
 .../landing/_componentes/secciones/PrimerPaso.tsx  | 41 ++++++++++++++--------
 src/app/landing/landing.css                        | 30 ++++++++++++++++
 2 files changed, 56 insertions(+), 15 deletions(-)
```
**`45de20a`** (02:41): quita el sello sin confirmar «Sin costo de implementación».
```
 src/app/landing/_componentes/secciones/PrimerPaso.tsx | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```
Por qué: ese dato no tiene fuente (regla de no inventar). Quedan 2 sellos.

---

## 3. Decisiones tomadas y su porqué

| # | Decisión | Por qué | Quién | Fuente |
|---|---|---|---|---|
| D1 | SITE, canonical y sitemap apuntan a github.io (v1.0.44) | seamosgenios.org/landing da 404 | CTO, ya en main | `afa8133`, `c9cd9da` |
| D2 | Quitar «Resultados que su colegio puede mostrar» | Imagen de relleno, sin contenido real | Daniel y CEO | DIRECTIVA, `f68a090` |
| D3 | Quitar «Estudiantes de todo el país» | Repetía los álbumes | Daniel y CEO | DIRECTIVA, `f68a090` |
| D4 | Unir Puntajes y álbumes con un h1 único `#resultados` | Un solo título; el ancla del menú sigue funcionando | CEO y FRONTEND | `fe912cb` |
| D5 | En /resultados, FinalCta solo con WhatsApp | Repetía el LeadForm; Daniel aprobó ocultar la mascota en esas 2 tarjetas | Daniel | DIRECTIVA, `fa7b8f4` |
| D6 | Restaurar las 6 fotos B2026 | Regresión de `excluirFotos` | COO detectó, FRONTEND arregló | `b4acd14` |
| D7 | Tarjeta «David Cardona 477/500, Medicina ICESI» se queda como está | Daniel no ha pedido cambiarla | CEO | handoff base |
| D8 | Puntaje de partida de Ángel = 308 (no 408) | Lo dice la fuente oficial de Uniandes; 408 sale del sitio viejo | CEO | RESULTADO.md |
| D9 | No publicar UNAL ni la línea Mazda de Ángel | Solo lo dicen fuentes propias, o no consta | CEO | RESULTADO.md |
| D10 | No usar a los Pacheco Casadiegos homónimos | No hay relación probada | CEO | RESULTADO.md |
| D11 | Quitar el sello «Sin costo de implementación» | Dato sin confirmar | CONSTRUCTOR | `45de20a` |
| D12 | La tarjeta de Daniel en equipo.ts no se cambia | Orden de Daniel | Daniel | handoff base |
| D13 | Nada de push de ramas de trabajo; solo el CTO hace merge | Regla de gobierno | Daniel | handoff base |

---

## 4. Investigación: Ángel David Pacheco Casadiego
**Qué es:** investigación pública sobre el cofundador y jefe académico.
**Para qué sirve:** dar pruebas verificables en su tarjeta, para que los rectores confíen.
**Informe completo:** `/workspace/investigacion-angel-david/RESULTADO.md`

### Confirmado
- **Beca Fundación Mazda–Uniandes** para estudiar Matemáticas. Anunciada el 05/12/2025, cohorte 2026, uno de 5 becarios. Cubre el 95 % de la matrícula durante 8 semestres (+2 de extensión posibles) y un curso de verano al año; no cubre intercambios ni doble titulación.
- Es de Soacha. Subió su ICFES de 308 a 475 estudiando solo y hoy enseña.
- No se sabe en cuál línea Mazda quedó (Quiero Estudiar o Empresarial). No ponerlo.

### URLs (con su contexto completo)
| # | URL | Contexto | Estado | ¿Va en la tarjeta? |
|---|---|---|---|---|
| 1 | https://ingenieria.uniandes.edu.co/es/Beneficiarios-Beca-Fundacion-Mazda | Anuncio oficial de Uniandes de los becarios Mazda: Matemáticas, Soacha, ICFES 308 → 475 | verificada | Sí |
| 2 | https://es.linkedin.com/posts/ingenieria-uniandes_beca-fundaci%C3%B3n-mazda-activity-7402463950535151616-5Uci | Publicación de Ingeniería Uniandes, 04-dic-2025 (16:48 hora de Bogotá). El HTML público (sin login) contiene «Ángel David Pacheco Casadiego – Matemáticas (Soacha)» y «Deportista destacado y mejor ICFES de su institución» | **verificada** (23-oct-2026, HTTP 200; la página pide iniciar sesión, pero el texto se lee sin login) | Sí |
| 3 | https://sites.google.com/view/msmaths/inicio | Su sitio personal MATHS: Soacha, Ing. Agrícola y Matemáticas, más de 3 años enseñando ICFES, 475 | verificada | Sí (solo con la opción A o B) |
| 4 | https://seamosgenios.org/ | Sitio VIEJO de SEAMOSGENIOS: «Vicepresidente», dice «de 408 a 475» (ERRÓNEO), UNAL, WhatsApp de relleno | verificada (contenido erróneo) | NO |
| 5 | https://seamosgenios.vercel.app/ | Versión anterior propia: «de 308 a 475», 477 puntos | verificada | NO (es un sitio propio) |

### Contradicciones
- Puntaje de partida: Uniandes dice 308 y el sitio viejo dice 408. Vale el **308**.
- Carrera: la UNAL solo aparece en fuentes propias. NO publicarla sin el OK de Daniel.

### No encontrado (no seguir buscando salvo que Daniel dé una pista)
Google Scholar, ORCID, ResearchGate, CvLAC, LinkedIn personal, YouTube, prensa, olimpiadas.

---

## 5. Carrusel de cofundadores (BLOQUEADO)

**Qué es:** un carrusel con scroll horizontal y dos tarjetas, Daniel de la Cruz y Ángel David Pacheco.
**Rama sugerida:** `dir/ceo/carrusel-cofundadores` sobre `c9cd9da`, local y sin push. **No hay código escrito.**

### Dónde vive hoy (verificado en c9cd9da)
- Datos: `src/app/landing/_contenido/equipo.ts` → `EQUIPO: TeamMember[]` (16 personas) y `FUNDADOR_ID = 'daniel'`.
- Tipo: `src/app/landing/_contenido/tipos.ts` → `TeamMember = Confirmable & { id, name, role, years, bio, featured? }`. **No tiene campo de enlaces.** `confirmar?` marca un dato que todavía no está listo para producción (`verify-landing-content.mjs` falla con `ALIANZA_STRICT=1`).
- Componente: `src/app/landing/_componentes/secciones/TeamSection.tsx` → `TeamSection` (sección `#equipo`, «Un equipo de élite»; `PersonCard` pinta la imagen `/landing/equipo/{id}.svg`) y `FounderSection` (sección `#fundador`).
- Página: `src/app/landing/nosotros/page.tsx` pinta `<FounderSection />` y luego `<TeamSection />` → **/landing/nosotros**.
- **Los enlaces de Daniel NO salen de equipo.ts.** Están en `FounderSection`: el texto viene de `FUNDADOR_HISTORIA` (`_contenido/quienes.ts`), hay un enlace fijo «Tomado y adaptado de Samsung Newsroom, "Breaking barriers with tech"» (https://csr.samsung.com/en/story/inspiring-journeys/breaking-barriers-with-tech) y el bloque «En los medios» sale de `MEDIA_MENTIONS` (`@/lib/mediaMentions`), filtrado por `PRENSA` (Samsung Newsroom, Universidad del Rosario, Forbes Colombia). Las fotos son `/landing/fundador/daniel-de-la-cruz-{1,2,3}.svg`. Su tarjeta en `TeamSection` no tiene enlaces.

### Mapeo campo por campo
| Campo | Valor actual de Daniel | Valor actual de Ángel | Valor propuesto (Ángel) | URL fuente | Estado |
|---|---|---|---|---|---|
| id | `daniel` | `angel` | `angel` (sin cambio) | — | sin cambio |
| name | Daniel Eduardo De La Cruz Vega | Ángel David Pacheco | Ángel David Pacheco Casadiego | URL 1 y URL 2 | falta que Daniel confirme |
| role | Presidente y fundador | Jefe académico | Jefe académico | — (dato interno) | sin cambio |
| years | +5 años | +3 años | +3 años | URL 3 («más de 3 años») | sin cambio |
| bio | Hackathon; dos reconocimientos en Samsung Innovation Campus, U. del Rosario; programa de IA desde 2022 | «Estudiante de Matemáticas en la Universidad de los Andes, con beca de la Fundación Mazda. Pasó de 308 a 475 puntos en el ICFES.» | La actual; opción A: + Soacha, + «más de 3 años enseñando ICFES» | URL 1 y URL 3 | la actual ya coincide con la fuente oficial |
| featured | true | true | true | — | sin cambio |
| confirmar | «Permiso de imagen pendiente…» | igual | igual (sin foto hasta que haya permiso) | — | pendiente del permiso |
| links (campo NUEVO; obliga a cambiar tipos.ts) | No existe; los suyos salen de FounderSection | No existe | URL 1, URL 2 y URL 3 | URL 1, 2 y 3 | depende de la opción que elija Daniel |
| datos de contacto | — | — | NUNCA (teléfono o correo del sitio msmaths) | — | prohibido |
| UNAL / línea Mazda | — | — | No publicar | solo fuentes propias | bloqueado |

### Por qué está BLOQUEADO
Daniel pidió usar todos los campos del «borrador del 22-oct» sobre Ángel. **Ese borrador no existe:** no está en el computador y ni COPY ni MEMORIA LANDING lo tienen. Se le preguntó a Daniel y falta su respuesta:
- **A)** usar su sitio msmaths (Soacha, más de 3 años enseñando, fútbol; nunca el contacto),
- **B)** dejar la tarjeta actual y sumar solo los enlaces verificados (1, 2 y 3),
- **C)** que Daniel mande el borrador.

### Al construirlo
Scroll-snap horizontal, accesible por teclado, radio de 12px, respeta reduced-motion, tokens de marca. Pasar `npx tsc --noEmit` y `npm run build:pages`. Capturas a 1440 y 390 en `/workspace/shots/carrusel-cofundadores/`. Después, el APTO del COO y el OK de Daniel.

---

## 6. Sección Resultados (/resultados): estado exacto
- URL en vivo: https://daniel-alt-pages.github.io/landing/resultados#resultados
- Archivos: `src/app/landing/resultados/page.tsx`, `ResultsGallery.tsx` (prop `titleAs`), `FinalCta.tsx` (prop `tarjetas`), `landing.css` (`ag-close-cards--single`).
- Orden final: 1) Puntajes que cambian trayectorias (h1, #resultados) · 2) Resultados en video · 3) Mensajes del Calendario A 2026 · 4) 65 instituciones · 5) Cierre con formulario (solo WhatsApp).
- Directiva: `/workspace/shots/resultados-auditoria/DIRECTIVA.md`. Capturas: `/workspace/shots/home-quitar-secciones/` y `/workspace/shots/resultados-auditoria/coo-b4acd14/` (ya se le mandaron a Daniel).

### Lo que falta para publicar (en orden)
1. ✅ El COO dio APTO sobre `b4acd14`.
2. ⏳ **Falta el OK escrito de Daniel en el chat de FRONTEND.** Responsable: Daniel (CEO/FRONTEND le insisten).
3. CTO: `git merge --no-ff b4acd14` en main → **v1.0.45** → push de main (lo hace solo el CTO).
4. CTO: verificar que el workflow de Pages termine y que la URL en vivo muestre los cambios; capturas en vivo a 1440 y 390, enviadas a Daniel.
5. CEO: dejar en el chat las tarjetas de correo **[MERGE A MAIN]** y **[PUSH]** para Daniel (desde el buzón de la Junta, texto plano); Daniel pulsa Enviar.

Abierto: la tarjeta de Superación «David Cardona 477/500, Medicina ICESI» no muestra una mejora. Se deja como está salvo que Daniel diga otra cosa.

---

## 7. Pendientes, con responsable y siguiente acción exacta

| # | Pendiente | Responsable | Siguiente acción exacta |
|---|---|---|---|
| P1 | OK de Resultados (`b4acd14`) | **Daniel** | Escribir «OK» en el chat de FRONTEND |
| P2 | Merge de Resultados (v1.0.45) | **CTO** | Tras P1: `merge --no-ff b4acd14`, push de main, verificar el deploy, capturas 1440/390 |
| P3 | Tarjetas de correo de v1.0.45 | **CEO** | Tras P2: tarjetas [MERGE A MAIN] y [PUSH] en el chat |
| P4 | APTO de primerpaso-radio sobre `c9a9c2a` | **COO** | Auditar `c9a9c2a` (radio de 12px y voces con reduced-motion), merge-tree contra `c9cd9da` y responder APTO o NO APTO |
| P5 | OK de primerpaso-radio | **Daniel** | Tras P4: OK escrito en el chat de FRONTEND; después, merge del CTO |
| P6 | Capturas de Propuesta A con 2 sellos | **CONSTRUCTOR** | Volver a tomar 1440/390 de `45de20a` en `/workspace/shots/propuesta-a/` (las actuales tienen 3 sellos) y mandarlas a Daniel |
| P7 | Opinión sobre Propuesta A | **Daniel** | Aprobar o rechazar «Del simulacro a la decisión» |
| P8 | Carrusel de cofundadores | **Daniel** | Elegir la opción A, B o C (sección 5) |
| P9 | Construir el carrusel | **FRONTEND** | Tras P8: rama `dir/ceo/carrusel-cofundadores` sobre `c9cd9da`, tsc, build:pages, capturas, COO |
| P10 | Datos de Ángel | **Daniel** | Confirmar el nombre completo, la UNAL y la línea Mazda |
| P11 | seamosgenios.org (sitio viejo) | **Daniel** | Decir en qué cuenta está ese repo (¿EduGenios-SG?), si quiere la raíz o /landing, y dar acceso a Cloudflare; luego se encarga el CTO |
| P12 | Decisiones que salieron de la crítica | **Daniel** | CTA principal del hero, una sola frase de tiempo de respuesta, header (Carrito e Ingresar), permiso para nombrar Soacha y Casanare, si hay testimonio real de un rector |
| P13 | Correos que esperan su Enviar | **Daniel** | Enviar v1.0.42, v1.0.43, chips push, v1.0.44 merge y push |
| P14 | Mantener este handoff | **CEO** | Actualizar `docs/HANDOFF.md` en `dir/ceo/handoff` con cada cambio |

---

## 8. Instrucciones para un modelo nuevo (paso a paso, sin preguntar)

1. Leer este documento entero y las reglas de la sección 0.
2. Clonar: `git clone https://github.com/daniel-alt-pages/landing && cd landing` (en el box, las credenciales ya están configuradas en el helper de git; no imprimir el token). O usar el clon existente `/workspace/landing` (`git -C /workspace/landing worktree list`).
3. `git fetch origin && git log --oneline -1 origin/main` → debe salir `c9cd9da` (o una versión posterior si ya se publicó la v1.0.45).
4. Las ramas de trabajo son locales: están en `/workspace/landing` (`dir/cto/home-quitar-secciones`, `dir/cto/primerpaso-radio`) y en `/workspace/wt-propuesta-a` (`dir/constructor/propuesta-a`). Para revisar una: `git worktree add /workspace/rev-<sha> <sha>`.
5. Instalar: `npm ci` (corre el postinstall `copy-pdfjs-worker.js`).
6. Tipos: `npx tsc --noEmit` (debe terminar sin errores).
7. Build de Pages: `npm run build:pages` (= `GITHUB_PAGES=true npm run build && node scripts/pages-assemble.mjs`; el prebuild corre `verify-local-only`, `verify-landing-content` y `verify-landing-env`). Salida: `out-pages/`.
8. Servir: `npm run start:pages` → http://127.0.0.1:3010/landing/
9. Capturas: con Playwright (Chromium), página completa a 1440x900 y 390x844, con y sin `reducedMotion: 'reduce'`; guardarlas en `/workspace/shots/<tema>/`. Ejemplo:
   `npx playwright screenshot --viewport-size=1440,900 --full-page http://127.0.0.1:3010/landing/resultados/ /workspace/shots/<tema>/resultados-1440.png` (y lo mismo con `390,844`).
10. Opcional: `npm run lint` y `npm test` (vitest).
11. Mezcla limpia: `git merge-tree --write-tree origin/main <sha>` (sin conflictos).
12. Pedir el APTO al COO (a4e7ab29-…) con el SHA y las capturas.
13. Pedir a Daniel su OK escrito en el chat de FRONTEND (4e057abb-…), en español y de «usted», con las capturas.
14. Solo el CTO (8c101678-…): `git checkout main && git merge --no-ff <sha> -m "Merge <rama> (<sha>) — v1.0.NN" && git push origin main`. Nunca `--force`.
15. Verificar el deploy en https://daniel-alt-pages.github.io/landing/ , tomar capturas en vivo a 1440/390 y mandárselas a Daniel.
16. Dejar las tarjetas de correo [MERGE A MAIN] y [PUSH] para que Daniel pulse Enviar.
17. Actualizar `docs/HANDOFF.md` en `dir/ceo/handoff` (commit normal y push solo de esa rama).

---

## 9. Glosario
- **APTO:** dictamen del COO de que un SHA concreto cumple las reglas (capturas, tsc, build, merge-tree limpio). Vale solo para ese SHA.
- **COO:** agente auditor (a4e7ab29-…). Revisa y da APTO o NO APTO; no hace merge.
- **CTO:** agente técnico (8c101678-…), **el único que hace merge** a main, siempre `--no-ff`, y verifica el deploy.
- **CEO:** coordina, escribe las directivas y el handoff, y prepara las tarjetas de correo.
- **FRONTEND / CONSTRUCTOR / COPY:** implementación de la UI, propuestas de secciones y textos, respectivamente.
- **Junta:** grupo de chat de todos los agentes con Daniel.
- **OK escrito de Daniel:** su aprobación textual en el chat de FRONTEND, CONSTRUCTOR o CTO. Sin ella no hay merge.
- **Tarjetas de correo:** borradores en texto plano ([MERGE A MAIN], [PUSH]) que se dejan en el chat para que Daniel los envíe con un clic desde el buzón de la Junta. Llevan el registro de cada versión.
- **reduced-motion:** la preferencia `prefers-reduced-motion: reduce`. Con ella las animaciones se apagan y los carruseles no se mueven solos.
- **build:pages:** el build de export estático para GitHub Pages con basePath `/landing`.
- **merge-tree limpio:** `git merge-tree` sin conflictos contra main.
- **Sello:** distintivo corto en la Propuesta A; solo se ponen datos confirmados.
- **Confirmable / `confirmar`:** campo que marca un dato que todavía no está listo para producción.
- **Superación:** tarjetas de mejora de puntaje en ResultsGallery.
- **B2026:** los resultados destacados del calendario B 2026 (6 fotos).

---

## 10. Datos y direcciones
- Sitio en vivo: https://daniel-alt-pages.github.io/landing/
- Sitio viejo: https://seamosgenios.org/ (otro repo; no tocar sin el OK de Daniel)
- Este documento: https://github.com/daniel-alt-pages/landing/blob/dir/ceo/handoff/docs/HANDOFF.md
- Por regla, aquí no se ponen correos ni teléfonos personales.

## 11. Lo que no se pudo verificar
- La respuesta de Daniel sobre las opciones A/B/C, la UNAL y la línea Mazda (pendiente).
- Que el «borrador del 22-oct» exista en algún sitio fuera del box (no se encontró).
- El APTO del COO sobre `c9a9c2a`: no consta en los archivos del box.
- El repo y la cuenta de seamosgenios.org («probablemente EduGenios-SG»): no confirmado.
