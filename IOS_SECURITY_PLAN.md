# Plan de Seguridad iOS (MyFuel)

Fecha: 2026-02-14  
Scope: `ios-native/MyFuel/*`

Restricciones del producto (confirmadas):

- La localización debe ser constante mientras la app está abierta/activa.
- Precisión máxima (no redondear coordenadas).

## Objetivos

1. Mantener tracking continuo en foreground sin filtraciones ni persistencia innecesaria.
2. Evitar abuso involuntario del backend (throttle/cancelación).
3. Endurecer red (sin cookies/caché persistente) y mensajes de error “seguros”.

## Cambios recomendados/implementados

### 1) Tracking de ubicación (foreground)

- `LocationManager` usa `startUpdatingLocation` con:
  - `kCLLocationAccuracyBest`
  - `distanceFilter` moderado
  - `allowsBackgroundLocationUpdates=false`
- Se arranca/para en función de `scenePhase` (active/background).

Archivos:

- `ios-native/MyFuel/Services/LocationManager.swift`
- `ios-native/MyFuel/Views/ContentView.swift`

Riesgos mitigados:

- Evita tracking en background.
- Reduce riesgo de “over-collection” fuera de uso.

### 2) Red: sesión sin persistencia

- `URLSessionConfiguration.ephemeral` para evitar caché/cookies persistentes.

Archivo:

- `ios-native/MyFuel/Network/NetworkService.swift`

### 3) Control de frecuencia y cancelación de requests

- En UI: throttle de refresh con reglas:
  - refrescar si pasaron >= 20s o movido >= 150m
- En ViewModel: cancelar requests previas si llega una nueva (evita backlog).

Archivos:

- `ios-native/MyFuel/Views/ContentView.swift`
- `ios-native/MyFuel/ViewModel/FuelViewModel.swift`

### 4) Errores “seguros”

- No exponer `localizedDescription` directamente al usuario.

Archivo:

- `ios-native/MyFuel/ViewModel/FuelViewModel.swift`

## Checklist de validación

1. Con permisos concedidos:
  - El `UserAnnotation` y `userLocation` se actualizan continuamente en foreground.
  - Al ir a background, se para el tracking.
2. Moviéndote (o simulando en Xcode):
  - Se actualizan resultados sin spamear (throttle aplicado).
3. Sin conectividad:
  - Mensaje de error user-friendly sin detalles técnicos.
4. Red:
  - No hay persistencia de cookies/caché para requests al backend.

## Pendientes opcionales (si se eleva el listón)

1. Pinning TLS (release-only) para `myfuel-app.onrender.com`.
2. Separar configuración de backend por build config sin editar código.
3. Añadir tests unitarios (URL building, throttle, cancelación de tasks).
