# MyFuel 🚗⛽⚡

API REST + Bot de Telegram para consultar **gasolineras** y **cargadores eléctricos** cercanos en tiempo real en España.

## 🌐 Producción

| Servicio         | URL                                              |
| :--------------- | :----------------------------------------------- |
| **API**          | `https://my-fuel-three.vercel.app`               |
| **Bot Telegram** | [@MiGasolineraBot](https://t.me/MiGasolineraBot) |

## 📡 Endpoints API

### `GET /`

Información de la API (health check).

### `GET /apiv1/nearby?lat=<lat>&lon=<lon>`

Devuelve las **20 gasolineras** y **20 cargadores EV** más cercanos a las coordenadas dadas.

**Ejemplo:**

```
GET https://my-fuel-three.vercel.app/apiv1/nearby?lat=43.263&lon=-2.935
```

### `GET /apiv1/chargers`

Devuelve la lista completa de cargadores eléctricos en España (datos DGT).

## 🤖 Bot de Telegram

El bot [@MiGasolineraBot](https://t.me/MiGasolineraBot) responde a:

- `/start` — Muestra mensaje de bienvenida con botón de ubicación
- **Ubicación** — Envía las 3 gasolineras y 3 cargadores más cercanos con precios, distancia y enlace a Google Maps

## 🏗️ Arquitectura

```
MyFuel/
├── api/
│   ├── index.js                # Punto de entrada: Bot + servidor Express
│   ├── app.js                  # Configuración Express (API pura JSON)
│   ├── lib/
│   │   ├── botHandlers.js      # Handlers del bot de Telegram
│   │   ├── fuelService.js      # Servicio gasolineras MINETUR (con caché 30min)
│   │   ├── chargerService.js   # Servicio cargadores DGT (con caché 1h)
│   │   ├── supabaseClient.js   # Cliente Supabase para historial
│   │   └── utils.js            # Utilidades (Haversine, formateo)
│   └── router/apiv1/
│       ├── nearby.js           # Endpoint /apiv1/nearby
│       └── chargers.js         # Endpoint /apiv1/chargers
├── android-native/             # App Android nativa
├── ios-native/                 # App iOS nativa
└── package.json
```

## 📱 Apps Nativas

Las apps móviles consumen la API desplegada en Render:

- **Android**: `android-native/` — Kotlin/Jetpack Compose
- **iOS**: `ios-native/` — Swift/SwiftUI

**URL base para las apps:** `https://my-fuel-three.vercel.app`

## 🔧 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Crear archivo .env con las variables necesarias
cp .env.example .env

# Ejecutar en modo desarrollo
npm run dev
```

### Variables de Entorno

| Variable             | Descripción                         |
| :------------------- | :---------------------------------- |
| `TELEGRAM_API_TOKEN` | Token del bot de Telegram           |
| `SUPABASE_URL`       | URL del proyecto Supabase           |
| `SUPABASE_KEY`       | Key anónima de Supabase             |
| `PORT`               | Puerto del servidor (default: 3000) |
| `ALLOWED_ORIGINS`    | Lista CORS permitida separada por comas |
| `CORS_ALLOW_ALL`     | Permite CORS global (`true` solo en local) |
| `RATE_LIMIT_WINDOW_MS` | Ventana de rate limit en ms       |
| `RATE_LIMIT_NEARBY_MAX` | Máx. peticiones por IP a `/apiv1/nearby` |
| `RATE_LIMIT_CHARGERS_MAX` | Máx. peticiones por IP a `/apiv1/chargers` |

> ⚠️ **No ejecutes el bot localmente y en Render al mismo tiempo.** Telegram solo permite una conexión de polling por token. Si necesitas desarrollo local, para el servicio en Render primero.

## 🚀 Despliegue

El proyecto está desplegado en **Render** (plan Free):

- **Repositorio:** [github.com/Heis-source/MyFuel](https://github.com/Heis-source/MyFuel)
- **Rama de despliegue:** `deploy/iOS`
- **Auto-deploy:** Sí (cada push a `deploy/iOS` despliega automáticamente)
- **Build command:** `npm install`
- **Start command:** `node api/index.js`

## 📊 Fuentes de Datos

| Fuente                                                                                                              | Tipo       | Datos                                 |
| :------------------------------------------------------------------------------------------------------------------ | :--------- | :------------------------------------ |
| [MINETUR](https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres) | REST JSON  | Precios de combustible en tiempo real |
| [DGT DATEX II](https://infocar.dgt.es/datex2/v3/miterd/EnergyInfrastructureTablePublication/electrolineras.xml)     | XML        | Infraestructura de carga eléctrica    |
| [Supabase](https://supabase.com)                                                                                    | PostgreSQL | Historial de consultas                |
