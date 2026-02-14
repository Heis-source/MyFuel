# MyFuel - Android Native App

Aplicación nativa Android para encontrar gasolineras y cargadores eléctricos cercanos usando Google Maps.

## 📋 Requisitos

- **Android Studio**: Hedgehog (2023.1.1) o superior
- **JDK**: 17 o superior
- **Android SDK**: API 34 (Android 14)
- **Gradle**: 8.2.0 (incluido en el proyecto)
- **Backend**: Servidor MyFuel corriendo en `http://localhost:3000`

## 🚀 Configuración Inicial

### 1. Abrir el Proyecto

```bash
# Abrir Android Studio y seleccionar:
# File > Open > Navegar a: c:\MyFuel\android-native
```

### 2. Configurar Backend URL

Edita `app/src/main/java/com/myfuel/mobile/network/RetrofitClient.kt`:

```kotlin
// Para emulador Android (usa 10.0.2.2 en lugar de localhost)
private const val BASE_URL = "http://10.0.2.2:3000/"

// Para dispositivo físico (usa la IP de tu PC)
private const val BASE_URL = "http://192.168.0.56:3000/"
```

### 3. Configurar Google Maps API Key (local)

1. Crea `secrets.properties` en `android-native/` a partir de la plantilla:

```bash
cp android-native/secrets.properties.example android-native/secrets.properties
```

2. Edita `secrets.properties` y añade tu clave real:

```properties
MAPS_API_KEY=TU_API_KEY_REAL
```

3. El proyecto inyecta la clave en `AndroidManifest.xml` con `${MAPS_API_KEY}`.

> `secrets.properties` está ignorado por Git y no debe subirse al repositorio.

## 🏃 Ejecutar en Modo Debug

### Opción 1: Emulador Android

1. **Crear AVD (Android Virtual Device)**:
   - Tools > Device Manager > Create Device
   - Seleccionar: Pixel 6 o similar
   - System Image: Android 14 (API 34)
   - Finish

2. **Iniciar Backend**:

   ```bash
   cd c:\MyFuel
   npm start
   ```

3. **Ejecutar App**:
   - Click en el botón "Run" (▶️) en Android Studio
   - Seleccionar el emulador creado
   - Esperar a que la app se instale y ejecute

### Opción 2: Dispositivo Físico

1. **Habilitar Opciones de Desarrollador** en tu Android:
   - Ajustes > Acerca del teléfono
   - Tocar 7 veces en "Número de compilación"
   - Volver y entrar en "Opciones de desarrollador"
   - Activar "Depuración USB"

2. **Conectar dispositivo** vía USB

3. **Cambiar BASE_URL** a la IP de tu PC (ver paso 2 arriba)

4. **Ejecutar App** desde Android Studio

## 📦 Generar APK para Distribución

### APK Debug (Testing)

```bash
cd c:\MyFuel\android-native
.\gradlew assembleDebug
```

El APK se generará en:

```
app/build/outputs/apk/debug/app-debug.apk
```

### APK Release (Producción)

#### 1. Crear Keystore (Solo primera vez)

```bash
keytool -genkey -v -keystore myfuel-release.keystore -alias myfuel -keyalg RSA -keysize 2048 -validity 10000
```

Guarda el keystore en `c:\MyFuel\android-native\`

#### 2. Configurar Signing

Crea `keystore.properties` en la raíz del proyecto:

```properties
storePassword=TU_PASSWORD
keyPassword=TU_PASSWORD
keyAlias=myfuel
storeFile=myfuel-release.keystore
```

#### 3. Actualizar `app/build.gradle`

Añade antes del bloque `android`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Añade dentro del bloque `android`:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

#### 4. Generar APK Release

```bash
.\gradlew assembleRelease
```

El APK firmado se generará en:

```
app/build/outputs/apk/release/app-release.apk
```

## 📱 Generar AAB para Google Play Store

### 1. Configurar Signing (igual que APK Release)

### 2. Generar Bundle

```bash
.\gradlew bundleRelease
```

El AAB se generará en:

```
app/build/outputs/bundle/release/app-release.aab
```

### 3. Subir a Google Play Console

1. Ir a https://play.google.com/console
2. Crear nueva aplicación
3. Completar información de la app
4. Subir el archivo `app-release.aab`
5. Completar el proceso de revisión

## 🔧 Comandos Útiles

```bash
# Limpiar proyecto
.\gradlew clean

# Ver todas las tareas disponibles
.\gradlew tasks

# Ejecutar tests
.\gradlew test

# Ver dependencias
.\gradlew dependencies

# Generar APK debug
.\gradlew assembleDebug

# Generar APK release
.\gradlew assembleRelease

# Generar AAB release
.\gradlew bundleRelease
```

## 📝 Notas Importantes

### Backend URL

- **Emulador**: Usa `10.0.2.2` en lugar de `localhost`
- **Dispositivo físico**: Usa la IP local de tu PC (ej: `192.168.0.56`)
- **Producción**: Cambia a tu URL de producción (ej: `https://api.myfuel.com`)

### Permisos

La app solicita automáticamente:

- Ubicación precisa (`ACCESS_FINE_LOCATION`)
- Ubicación aproximada (`ACCESS_COARSE_LOCATION`)

### Google Maps API Key

- Configura la API Key en `secrets.properties` (local, fuera de Git)
- Para producción, crea una clave nueva y rota cualquier clave previamente expuesta
- Restringe la clave por **Android app**: package `com.myfuel.mobile` + **SHA-1** del certificado

## 🐛 Troubleshooting

### Error: "Unable to resolve dependency"

```bash
.\gradlew --refresh-dependencies
```

### Error: "SDK location not found"

Crea `local.properties` con:

```properties
sdk.dir=C\:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```

### Error de conexión al backend

- Verifica que el backend esté corriendo
- Verifica la URL en `RetrofitClient.kt`
- Para emulador, usa `10.0.2.2` no `localhost`
- Para dispositivo físico, verifica que estén en la misma red WiFi

### Mapa no se muestra

- Verifica que la API Key sea válida
- Verifica que Maps SDK for Android esté habilitado en Google Cloud Console
- Verifica permisos de ubicación

## 📄 Estructura del Proyecto

```
android-native/
├── app/
│   ├── src/main/
│   │   ├── java/com/myfuel/mobile/
│   │   │   ├── MainActivity.kt          # Actividad principal
│   │   │   ├── models/Models.kt         # Modelos de datos
│   │   │   └── network/
│   │   │       ├── ApiService.kt        # Interface Retrofit
│   │   │       └── RetrofitClient.kt    # Cliente HTTP
│   │   ├── res/                         # Recursos (layouts, strings, etc)
│   │   └── AndroidManifest.xml          # Configuración de la app
│   └── build.gradle                     # Configuración del módulo
├── build.gradle                         # Configuración del proyecto
└── settings.gradle                      # Configuración de Gradle
```

## 🎨 Funcionalidades

- ✅ Mapa de Google Maps con ubicación actual
- ✅ Marcadores de gasolineras (naranja)
- ✅ Marcadores de cargadores eléctricos (verde)
- ✅ Toggle entre vista de gasolina y eléctrico
- ✅ Botón de actualizar zona
- ✅ Indicador de carga
- ✅ Manejo de permisos de ubicación
- ✅ Integración con backend MyFuel

## 📞 Soporte

Para problemas o preguntas, consulta la documentación del proyecto principal MyFuel.
