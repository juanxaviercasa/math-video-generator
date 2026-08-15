@echo off
REM 🎯 Script de prueba - Generar primer video (Windows)

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  Math Video Generator - Test Script                   ║
echo ║  Genera un video de prueba automáticamente             ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Verificar que curl existe
where curl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: curl no está instalado
    exit /b 1
)

echo [1/3] Verificando servidor...
curl -s http://localhost:3001/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Backend no está corriendo
    echo Inicia con: cd backend ^&^& npm run dev
    exit /b 1
)
echo ✓ Backend está activo
echo.

echo [2/3] Enviando request...
for /f "tokens=*" %%A in ('powershell -Command "Get-Date -UFormat %%s"') do set TIMESTAMP=%%A

curl -s -X POST http://localhost:3001/api/generate-video ^
  -H "Content-Type: application/json" ^
  -d "{\"id\": \"test_%TIMESTAMP%\", \"title\": \"Ecuación Cuadrática\", \"content\": \"x² - 5x + 6 = 0\nFactorizar: (x-2)(x-3)=0\nSoluciones: x=2, x=3\", \"quality\": \"medium\"}"
  
echo.
echo [3/3] Video iniciado!
echo.
echo Los videos se guardarán en: %TEMP%\mvg-*
pause
