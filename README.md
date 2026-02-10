# MyFuel 🚗⚡

Plataforma para encontrar gasolineras y cargadores eléctricos cercanos con precios en tiempo real.

## 🧩 Componentes

| Componente       | Tecnología            | Descripción                                          |
| ---------------- | --------------------- | ---------------------------------------------------- |
| **Backend API**  | Node.js + Express     | API REST que sirve datos de gasolineras y cargadores |
| **Bot Telegram** | node-telegram-bot-api | Bot que envía precios al compartir ubicación         |
| **App Android**  | Kotlin + MVVM         | App nativa con Google Maps                           |
| **App iOS**      | Swift + SwiftUI       | App nativa con Apple Maps                            |

## 📁 Estructura del Proyecto

```
MyFuel/
├── index.js                 # Entry point (Bot + API server)
├── app.js                   # Express app configuration
├── package.json             # Dependencias Node.js
├── ecosystem.config.js      # Configuración PM2
├── .env                     # Variables de entorno
├── lib/
│   ├── botHandlers.js       # Handlers del bot Telegram
│   ├── chargerService.js    # Servicio de cargadores EV (DGT XML)
│   ├── fuelService.js       # Servicio de gasolineras (Ministerio)
│   ├── supabaseClient.js    # Cliente Supabase
│   └── utils.js             # Utilidades compartidas
├── router/apiv1/
│   ├── nearby.js            # GET /apiv1/nearby?lat=&lon=
│   └── chargers.js          # GET /apiv1/chargers
├── android-native/          # App Android nativa (ver README propio)
└── ios-native/              # App iOS nativa (ver README propio)
```

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd MyFuel

# Instalar dependencias
npm install
```

## ⚙️ Configuración

Crea un archivo `.env` en la raíz:

```env
TELEGRAM_API_TOKEN=<token del bot de Telegram>
SUPABASE_URL=<URL de tu proyecto Supabase>
SUPABASE_KEY=<API key anon de Supabase>
```

## ▶️ Ejecución

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start

# Con PM2 (recomendado para producción)
npx pm2 start ecosystem.config.js
```

## 📡 API Endpoints

| Método | Ruta              | Parámetros   | Descripción                       |
| ------ | ----------------- | ------------ | --------------------------------- |
| GET    | `/apiv1/nearby`   | `lat`, `lon` | Gasolineras y cargadores cercanos |
| GET    | `/apiv1/chargers` | —            | Todos los cargadores EV de España |

### Ejemplo

```bash
curl "http://localhost:3000/apiv1/nearby?lat=43.2627&lon=-2.9253"
```

## 🤖 Bot Telegram

1. Busca el bot en Telegram
2. Envía `/start`
3. Comparte tu ubicación
4. Recibirás los precios de las 3 gasolineras más cercanas

## 📱 Apps Nativas

- **Android**: Abre `android-native/` en Android Studio → [README](android-native/README.md)
- **iOS**: Abre `ios-native/MyFuel.xcodeproj` en Xcode → [README](ios-native/README.md)

## 🔧 Tecnologías

- **Backend**: Node.js, Express 5, Supabase
- **Datos**: API del Ministerio (gasolineras) + DGT/MITERD (cargadores EV)
- **Bot**: node-telegram-bot-api
- **Android**: Kotlin, Google Maps SDK, Retrofit, MVVM
- **iOS**: Swift 5.9, SwiftUI, MapKit, URLSession, MVVM

## 📄 Licencia

Proyecto privado.
