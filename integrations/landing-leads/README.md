# Leads de la alianza

El formulario de `/landing` hace `POST` con `Content-Type: text/plain` a un Web App de Google Apps Script. El script agrega una fila en Google Sheets y manda un correo. Si la URL no está configurada, o el POST falla, la página abre WhatsApp con los mismos datos.

Este repo no puede publicar el Web App: hace falta una cuenta de Google del equipo.

## Pasos

1. Crea una hoja de cálculo con una pestaña llamada `Leads` y estos encabezados, en este orden: Fecha, Interés, Nombre, Cargo, Institución, Departamento, Municipio, Estudiantes grado 11, WhatsApp, Correo, UTM source, UTM campaign, Referrer.
2. En la hoja: Extensiones → Apps Script. Pega el contenido de `Code.gs`.
3. Configuración del proyecto → Propiedades del script: `SHEET_ID` (el id de la URL de la hoja) y `NOTIFY_EMAIL`.
4. Implementar → Nueva implementación → Aplicación web. Ejecutar como tú. Quién tiene acceso: Cualquiera.
5. Copia la URL que termina en `/exec` y ponla en `NEXT_PUBLIC_ALIANZA_LEADS_URL` (Vercel y `.env.local`).
6. Vuelve a construir el sitio. La variable es pública porque el navegador es quien hace el POST.

Si aparece spam, el siguiente paso es Cloudflare Turnstile y `UrlFetchApp` hacia siteverify. No está en esta versión.
