# MyFuel iOS - Guía Completa de Deploy

## 🚀 Deploy Rápido (Debug)

### 1. Abrir en Xcode

```bash
open MyFuel.xcodeproj
```

### 2. Configurar Backend URL

Editar `MyFuel/Network/NetworkService.swift`:

- Simulador: `http://localhost:3000` (por defecto)
- Dispositivo físico: `http://TU_IP:3000/`

### 3. Ejecutar

- Seleccionar dispositivo/simulador
- `Cmd + R` o botón "Run"

---

## 📦 Deploy Producción (Archive)

### 1. Configurar Code Signing

En Xcode > Target > Signing & Capabilities:

- **Team**: Tu cuenta Apple Developer ($99/año)
- **Bundle Identifier**: `com.myfuel.mobile`
- **Signing**: Automatic

### 2. Cambiar a Release

```
Product > Scheme > Edit Scheme > Run > Build Configuration > Release
```

### 3. Crear Archive

```
Product > Archive (solo con dispositivo real o "Any iOS Device" seleccionado)
```

O desde la terminal:

```bash
xcodebuild archive \
  -scheme MyFuel \
  -archivePath build/MyFuel.xcarchive \
  -destination 'generic/platform=iOS'
```

### 4. Exportar IPA

```bash
xcodebuild -exportArchive \
  -archivePath build/MyFuel.xcarchive \
  -exportPath build/ \
  -exportOptionsPlist ExportOptions.plist
```

El IPA se generará en: `build/MyFuel.ipa`

---

## ✈️ TestFlight (Beta Testing)

### Opción A: Desde Xcode

1. **Archive** la app (`Product > Archive`)
2. En el Organizer, click en **Distribute App**
3. Seleccionar **TestFlight & App Store**
4. Subir y esperar procesamiento
5. Ir a [App Store Connect](https://appstoreconnect.apple.com) para gestionar testers

### Opción B: Con Fastlane

```bash
# Instalar Fastlane (solo primera vez)
bundle install

# Subir a TestFlight
bundle exec fastlane beta
```

---

## 🏪 App Store

### 1. Requisitos previos

- [ ] Apple Developer Program activo ($99/año)
- [ ] App registrada en App Store Connect
- [ ] Certificado de distribución configurado
- [ ] Screenshots para todos los tamaños requeridos
- [ ] Icono de la app (1024x1024)
- [ ] Política de privacidad URL

### 2. Configurar App Store Connect

1. Ir a [App Store Connect](https://appstoreconnect.apple.com)
2. Click en "+" > "New App"
3. Rellenar:
   - **Nombre**: MyFuel
   - **Bundle ID**: com.myfuel.mobile
   - **SKU**: myfuel-ios
   - **Idioma primario**: Español

### 3. Subir el Build

```bash
# Con Fastlane
bundle exec fastlane release

# O manualmente con Xcode Organizer
# Window > Organizer > Distribute App > App Store Connect
```

### 4. Completar la Información

En App Store Connect completar:

- Descripción de la app
- Screenshots
- Categoría: Navegación
- Clasificación por edad
- Información de contacto

### 5. Enviar para Revisión

Click en "Submit for Review" y esperar aprobación de Apple (1-3 días).

---

## 🔄 CI/CD con Fastlane

### Instalación

```bash
# Instalar Ruby (si no lo tienes)
brew install ruby

# Instalar dependencias
cd ios-native
bundle install
```

### Lanes Disponibles

```bash
# Subir a TestFlight
bundle exec fastlane beta

# Publicar en App Store
bundle exec fastlane release

# Ejecutar tests
bundle exec fastlane test

# Generar screenshots
bundle exec fastlane screenshots

# Sincronizar certificados
bundle exec fastlane sync_certs
```

### Configurar Match (Code Signing)

```bash
# Inicializar Match (solo primera vez)
bundle exec fastlane match init

# Generar certificados
bundle exec fastlane match appstore
bundle exec fastlane match development
```

---

## ⚠️ Checklist Pre-Deploy

- [ ] Backend URL configurada correctamente (producción)
- [ ] NSAppTransportSecurity configurado (NSAllowsArbitraryLoads=false en producción)
- [ ] Version y Build incrementados
- [ ] Code signing configurado con certificado de distribución
- [ ] Info.plist con descripción de permiso de ubicación
- [ ] App probada en dispositivo físico
- [ ] Permisos de ubicación funcionando
- [ ] Icono de app configurado (1024x1024)
- [ ] Screenshots generados para App Store
- [ ] Política de privacidad publicada

---

## 🔑 Seguridad

**IMPORTANTE**:

- NO subir certificados `.p12` o `.cer` a Git
- NO subir provisioning profiles `.mobileprovision` a Git
- Usar **Match** de Fastlane para gestión de certificados
- Usar variables de entorno para datos sensibles
- Desactivar `NSAllowsArbitraryLoads` en producción (usar HTTPS)

---

## 🔧 Comandos Útiles

```bash
# Limpiar build
xcodebuild clean -scheme MyFuel

# Build solo (sin ejecutar)
xcodebuild build -scheme MyFuel -destination 'platform=iOS Simulator,name=iPhone 15'

# Ejecutar tests
xcodebuild test -scheme MyFuel -destination 'platform=iOS Simulator,name=iPhone 15'

# Generar Archive
xcodebuild archive -scheme MyFuel -archivePath build/MyFuel.xcarchive

# Listar simuladores disponibles
xcrun simctl list devices
```

---

## 🐛 Troubleshooting

### Error: "No signing certificate"

1. Xcode > Preferences > Accounts
2. Añadir tu Apple ID
3. Download Manual Profiles
4. Seleccionar el Team correcto en el target

### Error: Mapa no se muestra

- MapKit usa Apple Maps, no necesita API Key
- Verificar que el simulador tiene ubicación configurada:
  - Features > Location > Custom Location

### Error de conexión al backend

- Verificar que el backend esté corriendo (`npm start`)
- Para simulador, `localhost` funciona directamente
- Para dispositivo físico, usar IP local del PC
- Verificar que `NSAllowsArbitraryLoads` está en `false` y usar HTTPS en producción
- En desarrollo local HTTP, usar solo excepciones de `localhost/127.0.0.1` o túnel HTTPS

### Error: "Location permission denied"

- Simulador: Features > Location > Custom Location
- Dispositivo: Ajustes > MyFuel > Ubicación > "While Using"
