# Memory - MyFuel Context

Última actualización: 2026-02-14

## Estado actual

- Proyecto con backend Node/Express + bot Telegram + apps Android/iOS.
- Se descargaron assets de 1 pantalla de Stitch (HTML + screenshots + imágenes) para integración/referencia en móvil (primero iOS; repetir en Android).
- Se aplicó hardening de seguridad base en backend/móvil (CORS, rate limit API, ATS iOS, cleartext Android por build type, etc.).
- Se migró el bot de `node-telegram-bot-api` a `Telegraf`.

## Decisiones recientes

1. API pública sin API key por ahora (con rate limiting y validación).
2. Migración de Telegram a Telegraf completada en entorno no productivo.
3. Dependencias auditadas tras migración:
   - `npm audit --omit=dev` => 0 vulnerabilidades.
4. iOS: ubicación constante mientras la app está activa (foreground) y precisión máxima (sin redondeo).
5. Stitch: se bajó el diseño "Buscador de Gasolineras Minimalista" (proyecto `2411196033334493627`, screen `cc7257f016fb4429bdc3c060bb1b8998`) y se generó variante local y en castellano.

## Archivos clave tocados (contexto reciente)

- `index.js`: arranque bot con Telegraf + manejo errores/shutdown.
- `lib/botHandlers.js`: handlers migrados a `ctx`.
- `package.json` / `package-lock.json`: dependencia `telegraf` activa; removida dependencia anterior.
- `TELEGRAM_MIGRATION.md`: detalle funcional/técnico de la migración.
- `SECURITY_CHANGES.md`: log general de cambios de seguridad del proyecto.
- `API_DATA_CONTRACT.md`: contrato de datos publicado por `/apiv1/nearby` y `/apiv1/chargers`.
- `stitch/2411196033334493627/cc7257f016fb4429bdc3c060bb1b8998/`: HTML + screenshots + assets (incluye `screen.es.local.html` para castellano y `screen.local.html` para asset local).

## Stitch - Workflow (para repetir en Android)

Carpeta estándar:
- `stitch/<PROJECT_ID>/<SCREEN_ID>/`

Descarga (URLs salen de Stitch en `htmlCode.downloadUrl` y `screenshot.downloadUrl`):
- Screenshot a tamaño completo: normalmente conviene añadir `=s0` al final del `downloadUrl` de `lh3.googleusercontent.com` para evitar thumbnails.
- HTML: `contribution.usercontent.google.com/download?...` (guardar como `screen.html`).
- Assets embebidos en HTML (ej. `lh3.googleusercontent.com/aida-public/...`): descargarlos a `assets/` y crear una variante local reemplazando URLs por rutas relativas (ej. `assets/aida-public-hero.png`).
- Localización: Stitch suele venir en inglés; para castellano se creó `screen.es.local.html` (cambia `lang`, `title` y labels como "Nearby Stations" -> "Gasolineras cercanas", etc.).

Integración móvil:
- iOS: WKWebView cargando HTML del bundle (ver snippet en la respuesta del 2026-02-14).
- Android (prod): Google Maps nativo con marcadores (gasolineras/cargadores). Sin navegación dentro de la app; al tocar el recurso se redirige a la app de mapas elegida por el usuario (Intent `ACTION_VIEW` con URI `geo:lat,lon?q=lat,lon(label)`).
- Android (solo preview): WebView cargando HTML desde `android_asset/` puede servir como referencia visual, pero no sustituye un Google Map real si ese es el requisito.

## Riesgos/pendientes conocidos

1. `supabaseClient` sigue haciendo `process.exit(1)` si faltan variables de entorno, lo que puede tumbar bot/API al arrancar.
2. Bot y API siguen en el mismo proceso (`index.js`); en producción convendría separarlos.
3. Faltan tests automáticos del flujo Telegram (start/location/text).
4. El contrato de cargadores ahora normaliza tipos (`latitude/longitude` number, `power` number|null) y descarta cargadores sin coordenadas válidas.
5. iOS: tracking constante puede incrementar consumo de batería y red; se aplica throttle de refresh (>=20s o >=150m) en UI.

## Variables relevantes

- `TELEGRAM_API_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `ALLOWED_ORIGINS`
- `CORS_ALLOW_ALL`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_NEARBY_MAX`
- `RATE_LIMIT_CHARGERS_MAX`

## Comandos útiles recordatorio

- `npm start`
- `npm run dev`
- `npm audit --omit=dev`
- `npm ls telegraf --depth=0`
