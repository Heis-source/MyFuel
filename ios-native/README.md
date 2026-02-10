# MyFuel - iOS Native App

Aplicación nativa iOS para encontrar gasolineras y cargadores eléctricos cercanos usando Apple Maps (MapKit).

## 📋 Requisitos

- **Xcode**: 15.0 o superior
- **macOS**: Sonoma 14.0 o superior
- **iOS Target**: 16.0+
- **Swift**: 5.9+
- **Backend**: Servidor MyFuel corriendo en `http://localhost:3000`

## 🚀 Configuración Inicial

### 1. Abrir el Proyecto

```bash
# Abrir directamente en Xcode:
open ios-native/MyFuel.xcodeproj

# O desde Xcode:
# File > Open > Navegar a: c:\MyFuel\ios-native
```

### 2. Configurar Backend URL

Edita `MyFuel/Network/NetworkService.swift`:

```swift
// Para simulador iOS (usa localhost directamente)
static let baseURL = "http://localhost:3000"

// Para dispositivo físico (usa la IP de tu PC)
static let baseURL = "http://192.168.0.56:3000"
```

> **Nota**: El proyecto ya incluye compilación condicional (`#if targetEnvironment(simulator)`) que selecciona automáticamente la URL correcta.

### 3. Configurar Code Signing

1. Abre el proyecto en Xcode
2. Selecciona el target "MyFuel"
3. En "Signing & Capabilities":
   - Marca "Automatically manage signing"
   - Selecciona tu Team (Apple Developer Account)
4. Cambia el Bundle Identifier si es necesario

## 🏃 Ejecutar en Modo Debug

### Opción 1: Simulador iOS

1. **Iniciar Backend**:

   ```bash
   cd c:\MyFuel
   npm start
   ```

2. **Ejecutar App**:
   - Selecciona un simulador (ej: iPhone 15)
   - Click en "Run" (▶️) o `Cmd + R`
   - La app se instalará y ejecutará automáticamente

### Opción 2: Dispositivo Físico

1. **Conectar iPhone** vía USB o Wi-Fi
2. **Confiar en el ordenador** desde el iPhone
3. **Cambiar BASE_URL** a la IP de tu PC (o dejar la compilación condicional)
4. **Ejecutar App** desde Xcode con el dispositivo seleccionado

## 📄 Estructura del Proyecto

```
ios-native/
├── MyFuel.xcodeproj/           # Proyecto Xcode
├── MyFuel/
│   ├── MyFuelApp.swift         # Entry point de la app
│   ├── Info.plist              # Configuración (permisos, ATS)
│   ├── Assets.xcassets/        # Iconos y colores
│   ├── Models/
│   │   └── Models.swift        # Modelos de datos (Codable)
│   ├── Network/
│   │   └── NetworkService.swift # Cliente HTTP (URLSession)
│   ├── ViewModel/
│   │   └── FuelViewModel.swift  # ViewModel principal (MVVM)
│   ├── Services/
│   │   └── LocationManager.swift # Gestor de ubicación
│   └── Views/
│       └── ContentView.swift    # Vista principal con mapa
├── fastlane/                    # CI/CD con Fastlane
│   ├── Fastfile                 # Lanes de deploy
│   └── Appfile                  # Configuración del app
├── Gemfile                      # Dependencias Ruby
├── ExportOptions.plist          # Opciones de exportación
├── DEPLOY.md                    # Guía de despliegue
└── .gitignore                   # Archivos ignorados por Git
```

## 🏗️ Arquitectura

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│ ContentView │────▶│ FuelViewModel│────▶│ NetworkService │
│  (SwiftUI)  │     │ (@Published) │     │  (URLSession)  │
└──────┬──────┘     └──────────────┘     └───────┬────────┘
       │                                          │
       ▼                                          ▼
┌──────────────┐                         ┌────────────────┐
│LocationManager│                        │  Backend API   │
│(CLLocation)   │                        │  /apiv1/nearby │
└──────────────┘                         └────────────────┘
```

**Patrón MVVM**:

- **Model**: `FuelStation`, `Charger`, `Connector`, `ApiResponse`
- **View**: `ContentView` con MapKit, marcadores custom, panel de control
- **ViewModel**: `FuelViewModel` con `@Published` properties y `UiState`

## 🎨 Funcionalidades

- ✅ Mapa de Apple Maps con ubicación actual
- ✅ Marcadores custom de gasolineras (naranja) con precio
- ✅ Marcadores custom de cargadores eléctricos (verde) con potencia
- ✅ Toggle segmentado entre vista gasolina y eléctrico
- ✅ Botón de actualizar zona con gradiente
- ✅ Panel de control con efecto glassmorphism (.ultraThinMaterial)
- ✅ Indicador de carga
- ✅ Manejo de permisos de ubicación
- ✅ Banner de error de ubicación
- ✅ Diálogos de error con opción de reintentar
- ✅ Compilación condicional para simulador/dispositivo
- ✅ Sin dependencias externas (100% APIs nativas de Apple)
- ✅ Integración con backend MyFuel

## 📱 Compatibilidad

| Plataforma | Versión Mínima |
| ---------- | -------------- |
| iPhone     | iOS 16.0+      |
| iPad       | iPadOS 16.0+   |
| Xcode      | 15.0+          |
| Swift      | 5.9+           |

## 📞 Soporte

Para problemas o preguntas, consulta la documentación del proyecto principal MyFuel.
