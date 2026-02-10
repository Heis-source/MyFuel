@echo off
echo ========================================
echo MyFuel Android - Build Script
echo ========================================
echo.

:menu
echo Selecciona una opcion:
echo 1. Generar APK Debug
echo 2. Generar APK Release
echo 3. Generar AAB Release (Google Play)
echo 4. Limpiar proyecto
echo 5. Instalar en dispositivo conectado
echo 6. Salir
echo.
set /p option="Opcion: "

if "%option%"=="1" goto debug
if "%option%"=="2" goto release
if "%option%"=="3" goto bundle
if "%option%"=="4" goto clean
if "%option%"=="5" goto install
if "%option%"=="6" goto end

echo Opcion invalida
goto menu

:debug
echo.
echo Generando APK Debug...
call gradlew assembleDebug
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ APK Debug generado exitosamente!
    echo Ubicacion: app\build\outputs\apk\debug\app-debug.apk
) else (
    echo.
    echo ✗ Error al generar APK Debug
)
pause
goto menu

:release
echo.
echo Generando APK Release...
if not exist keystore.properties (
    echo.
    echo ✗ Error: No se encontro keystore.properties
    echo Por favor, crea el archivo keystore.properties primero.
    echo Ver DEPLOY.md para instrucciones.
    pause
    goto menu
)
call gradlew assembleRelease
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ APK Release generado exitosamente!
    echo Ubicacion: app\build\outputs\apk\release\app-release.apk
) else (
    echo.
    echo ✗ Error al generar APK Release
)
pause
goto menu

:bundle
echo.
echo Generando AAB Release...
if not exist keystore.properties (
    echo.
    echo ✗ Error: No se encontro keystore.properties
    echo Por favor, crea el archivo keystore.properties primero.
    echo Ver DEPLOY.md para instrucciones.
    pause
    goto menu
)
call gradlew bundleRelease
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ AAB Release generado exitosamente!
    echo Ubicacion: app\build\outputs\bundle\release\app-release.aab
) else (
    echo.
    echo ✗ Error al generar AAB Release
)
pause
goto menu

:clean
echo.
echo Limpiando proyecto...
call gradlew clean
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Proyecto limpiado exitosamente!
) else (
    echo.
    echo ✗ Error al limpiar proyecto
)
pause
goto menu

:install
echo.
echo Instalando APK Debug en dispositivo...
call gradlew installDebug
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ App instalada exitosamente!
) else (
    echo.
    echo ✗ Error al instalar app
    echo Verifica que el dispositivo este conectado y la depuracion USB habilitada
)
pause
goto menu

:end
echo.
echo Saliendo...
exit /b 0
