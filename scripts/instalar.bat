@echo off
title Instalando Sync UPAO...
echo.
echo =============================================
echo   Instalando dependencias de Sync UPAO
echo =============================================
echo.

cd /d "%~dp0"
echo Instalando playwright...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo instalar. Verifica que tienes Node.js instalado.
    pause
    exit /b 1
)

echo.
echo Descargando navegador Chromium para Playwright...
call npx playwright install chromium
if errorlevel 1 (
    echo.
    echo ERROR al descargar Chromium.
    pause
    exit /b 1
)

echo.
echo Creando acceso directo en el escritorio...
set "SCRIPT_DIR=%~dp0"
set "DESKTOP=%USERPROFILE%\Desktop"

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$s = $ws.CreateShortcut('%DESKTOP%\Sync UPAO.lnk'); " ^
  "$s.TargetPath = 'cmd.exe'; " ^
  "$s.Arguments = '/k node \"%SCRIPT_DIR%sync-upao.js\"'; " ^
  "$s.WorkingDirectory = '%SCRIPT_DIR%'; " ^
  "$s.IconLocation = 'shell32.dll,13'; " ^
  "$s.Description = 'Sincronizar notas UPAO al VPS'; " ^
  "$s.Save()"

echo.
echo =============================================
echo   Listo!
echo   Acceso directo creado en tu escritorio:
echo   "Sync UPAO"
echo =============================================
echo.
pause
