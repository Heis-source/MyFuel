# Memory - MyFuel Context

Última actualización: 2026-02-14

## Estado actual

- Proyecto con backend Node/Express + bot Telegram + apps Android/iOS.
- Se aplicó hardening de seguridad base en backend/móvil (CORS, rate limit API, ATS iOS, cleartext Android por build type, etc.).
- Se migró el bot de `node-telegram-bot-api` a `Telegraf`.

## Decisiones recientes

1. API pública sin API key por ahora (con rate limiting y validación).
2. Migración de Telegram a Telegraf completada en entorno no productivo.
3. Dependencias auditadas tras migración:
   - `npm audit --omit=dev` => 0 vulnerabilidades.

## Archivos clave tocados (contexto reciente)

- `api/index.js`: arranque bot con Telegraf + manejo errores/shutdown.
- `api/lib/botHandlers.js`: handlers migrados a `ctx`.
- `package.json` / `package-lock.json`: dependencia `telegraf` activa; removida dependencia anterior.
- `TELEGRAM_MIGRATION.md`: detalle funcional/técnico de la migración.
- `SECURITY_CHANGES.md`: log general de cambios de seguridad del proyecto.
- `API_DATA_CONTRACT.md`: contrato de datos publicado por `/apiv1/nearby` y `/apiv1/chargers`.

## Riesgos/pendientes conocidos

1. `supabaseClient` sigue haciendo `process.exit(1)` si faltan variables de entorno, lo que puede tumbar bot/API al arrancar.
2. Bot y API siguen en el mismo proceso (`api/index.js`); en producción convendría separarlos.
3. Faltan tests automáticos del flujo Telegram (start/location/text).
4. El contrato de cargadores ahora normaliza tipos (`latitude/longitude` number, `power` number|null) y descarta cargadores sin coordenadas válidas.

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
