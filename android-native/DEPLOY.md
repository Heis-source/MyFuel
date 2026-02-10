# MyFuel Android - Guía Rápida de Deploy

## 🚀 Deploy Rápido (APK Debug)

### 1. Abrir en Android Studio

```
File > Open > c:\MyFuel\android-native
```

### 2. Configurar Backend URL

Editar `app/src/main/java/com/myfuel/mobile/network/RetrofitClient.kt`:

- Emulador: `http://10.0.2.2:3000/`
- Dispositivo físico: `http://TU_IP:3000/`

### 3. Generar APK

```bash
cd c:\MyFuel\android-native
.\gradlew assembleDebug
```

APK en: `app/build/outputs/apk/debug/app-debug.apk`

## 📦 Deploy Producción (APK Release)

### 1. Crear Keystore (solo primera vez)

```bash
keytool -genkey -v -keystore myfuel-release.keystore -alias myfuel -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Crear keystore.properties

```properties
storePassword=TU_PASSWORD
keyPassword=TU_PASSWORD
keyAlias=myfuel
storeFile=myfuel-release.keystore
```

### 3. Actualizar app/build.gradle

Añadir ANTES del bloque `android`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Añadir DENTRO del bloque `android`:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}
```

Modificar `buildTypes`:

```gradle
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 4. Generar APK Release

```bash
.\gradlew assembleRelease
```

APK en: `app/build/outputs/apk/release/app-release.apk`

## 🏪 Google Play Store (AAB)

### 1. Configurar signing (igual que APK Release)

### 2. Generar Bundle

```bash
.\gradlew bundleRelease
```

AAB en: `app/build/outputs/bundle/release/app-release.aab`

### 3. Subir a Play Console

- https://play.google.com/console
- Crear app > Subir AAB > Publicar

## ⚠️ Checklist Pre-Deploy

- [ ] Backend URL configurada correctamente
- [ ] Google Maps API Key válida
- [ ] Version code incrementado en build.gradle
- [ ] Keystore guardado de forma segura
- [ ] ProGuard rules verificadas
- [ ] App probada en dispositivo físico
- [ ] Permisos de ubicación funcionando

## 🔑 Seguridad

**IMPORTANTE**:

- NO subir `keystore.properties` a Git
- NO subir `*.keystore` a Git
- Guardar keystore y passwords de forma segura
- Usar variables de entorno en CI/CD
