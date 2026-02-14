# Migración completa del bot: `node-telegram-bot-api` -> `Telegraf`

Fecha: 2026-02-14  
Entorno objetivo: desarrollo / preproducción (no producción)

## Resumen rápido

Se migró el bot de Telegram a **Telegraf** manteniendo el comportamiento funcional actual:

- `/start` sigue mostrando bienvenida + botón para compartir ubicación.
- Mensajes de ubicación siguen devolviendo gasolineras/cargadores cercanos.
- Mensajes de texto normales siguen devolviendo ayuda para enviar ubicación.

Además, se actualizó el árbol de dependencias y quedó en:

- `0` vulnerabilidades (`npm audit --omit=dev`).

## Cambios realizados

## 1) Librería del bot

- Antes: `node-telegram-bot-api`
- Ahora: `telegraf`

Archivos:

- `package.json`
- `package-lock.json`

Impacto:

- Se elimina la dependencia previa y su cadena de paquetes legacy.
- Se reduce superficie de riesgo en dependencias.

## 2) Inicialización del bot (arranque)

Archivo: `api/index.js`

Qué se cambió:

- Se reemplazó:
  - `new TelegramBot(token, { polling: true })`
  - por `new Telegraf(token)` + `bot.launch({ dropPendingUpdates: true })`.
- Registro de handlers:
  - `bot.start(...)`
  - `bot.on('location', ...)`
  - `bot.on('text', ...)`
- Manejo de errores global del bot con `bot.catch(...)`.
- Cierre limpio del bot con:
  - `process.once('SIGINT', ...)`
  - `process.once('SIGTERM', ...)`
- Si falta `TELEGRAM_API_TOKEN`, el bot no arranca y se registra aviso (la API web puede seguir arrancando).

Impacto:

- Mejor control de ciclo de vida y errores del bot.
- Menos riesgo de acumulación de updates viejos al usar `dropPendingUpdates`.

## 3) Handlers migrados a contexto `ctx` de Telegraf

Archivo: `api/lib/botHandlers.js`

Qué se cambió:

- Firma de handlers:
  - Antes: `handleX(bot, msg)`
  - Ahora: `handleX(ctx)`
- Envío de mensajes:
  - Antes: `bot.sendMessage(...)`
  - Ahora: `ctx.reply(...)`
- El resto de la lógica de negocio se mantiene:
  - consulta de datos,
  - composición del mensaje,
  - guardado histórico en Supabase.

Impacto:

- Código más idiomático en Telegraf y más fácil de extender con middlewares en siguientes iteraciones.
- No cambia la experiencia funcional del usuario final del bot.

## 4) Dependencias y seguridad

Acciones ejecutadas:

1. `npm install`
2. `npm audit fix --omit=dev`
3. `npm audit --omit=dev --json`

Resultado:

- Dependencias productivas auditadas sin vulnerabilidades reportadas.

## Cómo afecta al equipo (desarrollo)

## Cambios para devs

- Si alguien usaba APIs directas de `node-telegram-bot-api`, ya no aplican.
- Nuevo patrón para handlers: trabajar con `ctx`.

## Qué NO cambió

- Flujo de negocio del bot (start/location/text).
- Uso de Supabase para histórico.
- Formato de respuesta al usuario final.

## Riesgos / notas conocidas

- `api/lib/botHandlers.js` sigue importando `supabaseClient` al cargar módulo.
  - Si faltan `SUPABASE_URL` o `SUPABASE_KEY`, el proceso puede fallar al arrancar.
  - Esto es comportamiento heredado (no introducido por Telegraf).
- Esta migración se hizo pensando en entorno no productivo; antes de producción conviene:
  - añadir métricas del bot,
  - añadir límites por chat/usuario,
  - separar totalmente bot y API en procesos independientes.

## Checklist de validación post-migración

1. Definir `TELEGRAM_API_TOKEN` y arrancar con `npm start`.
2. En Telegram:
   - enviar `/start` y verificar teclado de ubicación.
3. Compartir ubicación:
   - verificar respuesta con estaciones/cargadores.
4. Enviar texto normal:
   - verificar mensaje guía.
5. Verificar dependencias:
   - `npm audit --omit=dev` devuelve `0 vulnerabilities`.
