@echo off
echo ============================================
echo   DEPLOY SEAMOS GENIOS
echo ============================================
echo.

set PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm

echo [1/2] Autenticando en Firebase...
call npx firebase login
if errorlevel 1 (
    echo ERROR: No se pudo autenticar. Intentando de nuevo...
    call npx firebase login
)

echo.
echo [2/2] Desplegando a Firebase Hosting...
call npx firebase deploy --only hosting

echo.
echo ============================================
echo   DEPLOY COMPLETADO!
echo ============================================
pause
