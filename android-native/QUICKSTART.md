# 🚀 Guía Rápida - Probar MyFuel Android

## ✅ Errores Solucionados

Los siguientes errores han sido corregidos:

- ✅ Iconos de launcher creados (ic_launcher, ic_launcher_round)
- ✅ Atributo screenOrientation eliminado
- ✅ AndroidManifest configurado correctamente

## 📱 Cómo Probar la App AHORA

### Opción 1: Android Studio (RECOMENDADO)

1. **Sincronizar proyecto**:
   - En Android Studio, click en "Sync Project with Gradle Files" (icono de elefante con flecha)
   - Esperar a que termine la sincronización

2. **Crear emulador** (si no tienes uno):
   - Tools > Device Manager
   - Click "Create Device"
   - Seleccionar "Pixel 6"
   - Seleccionar "Android 14 (API 34)" - descargar si es necesario
   - Click "Finish"

3. **Ejecutar**:
   - Click en el botón verde "Run" (▶️)
   - Seleccionar el emulador
   - ¡La app se instalará y ejecutará!

### Opción 2: Dispositivo Físico

1. **Habilitar depuración USB** en tu Android:
   - Ajustes > Acerca del teléfono
   - Tocar 7 veces "Número de compilación"
   - Volver > Opciones de desarrollador
   - Activar "Depuración USB"

2. **Conectar dispositivo** con cable USB

3. **Cambiar URL del backend**:
   - Abrir: `app/src/main/java/com/myfuel/mobile/network/RetrofitClient.kt`
   - Cambiar línea 12:

     ```kotlin
     // De esto:
     private const val BASE_URL = "http://10.0.2.2:3000/"

     // A esto (usando tu IP):
     private const val BASE_URL = "http://192.168.X.X:3000/"
     ```

   - Para saber tu IP: ejecuta `ipconfig` en terminal y busca "IPv4"

4. **Ejecutar**:
   - Click en Run (▶️)
   - Seleccionar tu dispositivo
   - Aceptar depuración USB en el teléfono

## ⚠️ IMPORTANTE: Backend debe estar corriendo

Antes de ejecutar la app, asegúrate de que el backend esté corriendo:

```bash
# En otra terminal:
cd c:\MyFuel
npm start
```

El backend debe estar en: `http://localhost:3000`

## 🔍 Verificar que Todo Funciona

Una vez que la app esté corriendo:

1. ✅ La app solicita permisos de ubicación - **Aceptar**
2. ✅ El mapa de Google se carga correctamente
3. ✅ Se muestra tu ubicación actual (punto azul)
4. ✅ Aparecen marcadores naranjas (gasolineras) o verdes (cargadores)
5. ✅ Puedes alternar entre "Gasolina" y "Eléctrico"
6. ✅ El botón "Actualizar Zona" funciona

## 🐛 Si Hay Problemas

### El mapa no se carga

- Verifica que la Google Maps API Key esté activa
- Verifica que Maps SDK for Android esté habilitado en Google Cloud Console

### No aparecen marcadores

- Verifica que el backend esté corriendo (`npm start`)
- Verifica la URL en `RetrofitClient.kt`:
  - Emulador: `http://10.0.2.2:3000/`
  - Dispositivo físico: `http://TU_IP:3000/`
- Verifica que estés en la misma red WiFi (si usas dispositivo físico)

### Error de permisos

- Asegúrate de aceptar los permisos de ubicación cuando la app los solicite
- Si los rechazaste, desinstala y vuelve a instalar la app

## 📊 Estructura de la App

```
MainActivity
├── Google Maps (mapa interactivo)
├── Location Services (obtener ubicación)
├── Retrofit API (llamadas al backend)
└── UI Controls
    ├── Toggle (Gasolina/Eléctrico)
    └── Botón Actualizar
```

## 🎯 Próximos Pasos

Una vez que verifiques que la app funciona:

1. Probar en diferentes ubicaciones
2. Verificar que los datos sean correctos
3. Generar APK para distribución (ver DEPLOY.md)
4. Considerar desarrollar la app iOS
