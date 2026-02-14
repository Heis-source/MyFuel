# Security Hardening Log - MyFuel

Fecha: 2026-02-14  
Objetivo: reducir superficie de ataque real en API, bot y apps móviles sin romper funcionalidad actual.

## 1) Backend API (Node/Express)

### Cambio: cabeceras de seguridad, CORS controlado y límites de payload
- Archivo: `api/app.js`
- Qué se hizo:
  - Se desactivó `x-powered-by`.
  - Se añadieron cabeceras defensivas (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` en producción HTTPS).
  - CORS ahora permite:
    - `*` solo si `CORS_ALLOW_ALL=true` o entorno no productivo sin allowlist.
    - allowlist explícita por `ALLOWED_ORIGINS` en producción.
    - rechazo de orígenes no permitidos con `403`.
  - `express.json` y `urlencoded` ahora limitan tamaño de body (`10kb`) para reducir abuso/DoS por payload gigante.
- Por qué:
  - Reducir exposición de metadatos y ataques básicos de navegador/API.
  - Evitar CORS abierto permanente en producción.
  - Mitigar payload-based DoS.
- Para qué sirve:
  - Mejor baseline de seguridad sin cambiar el contrato principal de endpoints.

Referencias:
- https://expressjs.com/en/advanced/best-practice-security.html
- https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- https://owasp.org/API-Security/

### Cambio: rate limiting por IP
- Archivos: `api/lib/rateLimiter.js`, `api/router/apiv1/nearby.js`, `api/router/apiv1/chargers.js`
- Qué se hizo:
  - Middleware propio en memoria con ventana configurable (`RATE_LIMIT_WINDOW_MS`).
  - Límites separados:
    - `/apiv1/nearby` -> `RATE_LIMIT_NEARBY_MAX` (default 60/min)
    - `/apiv1/chargers` -> `RATE_LIMIT_CHARGERS_MAX` (default 30/min)
  - Respuesta `429` con `Retry-After` y cabeceras de rate limit.
- Por qué:
  - Los endpoints consumen fuentes externas y son susceptibles a abuso por scraping o ráfagas.
- Para qué sirve:
  - Reducir riesgo de degradación del servicio y coste operativo por abuso.

Referencias:
- https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/

### Cambio: validación estricta de coordenadas
- Archivo: `api/router/apiv1/nearby.js`
- Qué se hizo:
  - Validación explícita de `lat`/`lon`:
    - Deben existir.
    - Deben ser numéricos finitos.
    - Rango válido: lat [-90, 90], lon [-180, 180].
  - Respuesta `400` en entradas inválidas.
  - Filtrado de cargadores con coordenadas inválidas antes de calcular distancia.
- Por qué:
  - Antes se usaba `parseFloat` sin validar `NaN` ni rango.
- Para qué sirve:
  - Evita cálculos inválidos y reduce riesgos de consumo innecesario por inputs maliciosos.

## 2) Bot de Telegram

### Cambio: sanitización HTML y enlaces seguros
- Archivos: `api/lib/utils.js`, `api/lib/botHandlers.js`
- Qué se hizo:
  - Se añadió `escapeHtml()` para neutralizar caracteres peligrosos en modo `parse_mode: "HTML"`.
  - Se escaparon valores externos (marca, dirección, conectores, precios) antes de interpolar en mensajes.
  - Se cambió Google Maps de `http://` a `https://`.
  - Se robusteció `handleText` para ignorar mensajes sin `msg.text` string.
- Por qué:
  - El bot renderiza HTML y consume texto de fuentes externas; esto abre la puerta a inyección de formato/enlaces.
- Para qué sirve:
  - Mantiene presentación y evita manipulación del mensaje final.

Referencias:
- https://core.telegram.org/bots/api#formatting-options
- https://owasp.org/www-community/attacks/xss/

### Cambio: filtrado de coordenadas inválidas en feed de combustible
- Archivo: `api/lib/fuelService.js`
- Qué se hizo:
  - Parseo defensivo de lat/lon y descarte de estaciones con coordenadas inválidas.
- Por qué:
  - Datos externos pueden venir incompletos/rotos y causar distancias `NaN`.
- Para qué sirve:
  - Mayor estabilidad y resultados más limpios.

## 3) Android

### Cambio: cleartext bloqueado en release
- Archivos: `android-native/app/build.gradle`, `android-native/app/src/main/AndroidManifest.xml`
- Qué se hizo:
  - `usesCleartextTraffic` ahora es placeholder por build type:
    - `release` -> `false`
    - `debug` -> `true`
  - Manifest usa `${usesCleartextTraffic}`.
- Por qué:
  - Antes estaba `true` global, permitiendo HTTP también en producción.
- Para qué sirve:
  - Asegura TLS en release y mantiene flexibilidad local en debug.

Referencias:
- https://developer.android.com/privacy-and-security/security-config

### Cambio: reducción de fuga por logs de red
- Archivo: `android-native/app/src/main/java/com/myfuel/mobile/network/RetrofitClient.kt`
- Qué se hizo:
  - Interceptor HTTP:
    - `DEBUG` -> `BASIC`
    - `RELEASE` -> `NONE`
- Por qué:
  - `BODY` en producción puede exponer coordenadas y payloads en logs.
- Para qué sirve:
  - Minimiza exposición de datos sensibles en dispositivos release.

### Cambio: backup de preferencias endurecido
- Archivos:
  - `android-native/app/src/main/AndroidManifest.xml`
  - `android-native/app/src/main/res/xml/backup_rules.xml`
  - `android-native/app/src/main/res/xml/data_extraction_rules.xml`
- Qué se hizo:
  - `allowBackup=false`.
  - Exclusión explícita de `sharedpref` en reglas de backup/extracción.
- Por qué:
  - Evitar que datos locales se copien/restauren fuera de control.
- Para qué sirve:
  - Menor exposición de datos de usuario en transferencias/backup.

Referencias:
- https://developer.android.com/guide/topics/data/autobackup

## 4) iOS

### Cambio: ATS estricto por defecto
- Archivo: `ios-native/MyFuel/Info.plist`
- Qué se hizo:
  - `NSAllowsArbitraryLoads` pasó a `false`.
  - Se dejó excepción local para `localhost` y `127.0.0.1` (desarrollo).
  - Se habilitó `NSAllowsLocalNetworking=true`.
- Por qué:
  - Antes ATS estaba abierto globalmente.
- Para qué sirve:
  - En producción fuerza conexiones seguras; en local mantiene capacidad de debug.

Referencias:
- https://developer.apple.com/documentation/bundleresources/information_property_list/nsapptransportsecurity

## 5) Configuración operativa

### Cambio: plantilla de entorno y documentación
- Archivos: `.env.example`, `README.md`
- Qué se hizo:
  - Se creó `.env.example` con variables nuevas de seguridad/CORS/rate-limit.
  - README actualizado con esas variables.
- Por qué:
  - Controles de seguridad sin variables explícitas suelen quedar sin activar correctamente.
- Para qué sirve:
  - Facilita despliegue reproducible y evita configuraciones débiles por omisión.

## 6) Hallazgos de dependencias (actualizado tras migración Telegram)

Inicialmente, `npm audit` reportaba vulnerabilidades en árbol productivo, especialmente en cadena de `request` heredada por `node-telegram-bot-api`/dependencias antiguas del lockfile.

Advisories relevantes:
- https://github.com/advisories/GHSA-fjxv-7rqg-78g4
- https://github.com/advisories/GHSA-p8p7-x288-28g6
- https://github.com/advisories/GHSA-72xf-g2v4-qvf3
- https://github.com/advisories/GHSA-6rw7-vpxm-498p

Estado:
- Mitigado en esta iteración: vectores de abuso directo (CORS, rate limit, input validation, transporte, logging).
- Estado posterior a la migración del bot a Telegraf:
  - `node-telegram-bot-api` eliminado.
  - árbol de dependencias actualizado.
  - `npm audit --omit=dev` sin vulnerabilidades reportadas.

## 7) Cómo validar rápido

1. API:
   - Probar `GET /apiv1/nearby` con lat/lon inválidos -> debe responder `400`.
   - Enviar ráfaga de requests -> debe responder `429` al superar límite.
2. Bot:
   - Verificar que enlaces enviados son `https://www.google.com/maps/...`.
3. Android release:
   - Confirmar que no hay logs HTTP body y que HTTP plano no está permitido.
4. iOS:
   - Confirmar que ATS no acepta dominios externos en HTTP.

## 8) Nota de continuidad (Telegram)

Se realizó una migración completa del bot a Telegraf en una iteración posterior.
Detalle técnico y de impacto:

- `TELEGRAM_MIGRATION.md`
