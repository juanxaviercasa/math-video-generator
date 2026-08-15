@echo off
REM 🚀 Math Video Generator - Quick Start Script (Windows)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║      Math Video Generator - Installation Script            ║
echo ║              v0.1.0 - Project Bootstrap                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Node.js not found. Please install from https://nodejs.org
    exit /b 1
) else (
    echo ✓ Node.js installed
    node -v
)

REM Install pnpm
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing pnpm...
    npm install -g pnpm
)
echo ✓ pnpm installed
pnpm -v
echo.

REM Install dependencies
echo [2/4] Installing dependencies...
call pnpm install --frozen-lockfile
echo.

REM Setup backend
echo [3/4] Setting up backend...
if not exist "backend\.env" (
    echo Creating backend\.env...
    copy .env.example backend\.env
    echo ⚠️  Update backend\.env with your configuration
)
echo.

REM Instructions
echo [4/4] Next steps...
echo.
echo Frontend development:
echo   cd frontend
echo   pnpm dev
echo   ^> Open http://localhost:5173
echo.
echo Backend development:
echo   cd backend
echo   pnpm dev
echo   ^> Server at http://localhost:3001
echo.
echo Database setup:
echo   cd backend
echo   pnpm prisma migrate dev
echo.
echo 📚 Documentation:
echo   - Setup: docs/SETUP.md
echo   - API: docs/API.md
echo   - Architecture: docs/ARCHITECTURE.md
echo   - Monetization: docs/MONETIZATION.md
echo.
echo Happy coding! 🚀
pause
