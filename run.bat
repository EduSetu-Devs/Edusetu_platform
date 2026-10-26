@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"
echo ====================================================
echo   EduSetu 1-Click Launch ^& Auto-Configuration
echo ====================================================
echo.

:: 1. Auto-configure server/.env if missing
if not exist "server\.env" (
    echo [Setup] server\.env not found. Auto-generating from .env.example...
    copy "server\.env.example" "server\.env" >nul
    echo [Setup] Created server\.env with default development settings.
)

:: 2. Auto-configure client/.env if missing
if not exist "client\.env" (
    echo [Setup] client\.env not found. Auto-generating from .env.example...
    copy "client\.env.example" "client\.env" >nul
    echo [Setup] Created client\.env with default development settings.
)

:: 3. Auto-install server dependencies if missing
if not exist "server\node_modules" (
    echo [Setup] Installing backend dependencies (npm install)...
    cd server && call npm install && cd ..
)

:: 4. Auto-install client dependencies if missing
if not exist "client\node_modules" (
    echo [Setup] Installing frontend dependencies (npm install)...
    cd client && call npm install && cd ..
)

echo.
echo Starting EduSetu Backend (Port 5000)...
start "EduSetu Backend" cmd /k "cd /d "%~dp0server" && npm run dev"

echo Starting EduSetu Frontend (Port 5173)...
start "EduSetu Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"

echo Waiting for servers to start...
timeout /t 8 /nobreak >nul

echo Opening EduSetu in your browser...
start "" "http://localhost:5173"

echo.
echo ====================================================
echo   EduSetu is running!
echo   Close the two terminal windows to stop the servers.
echo ====================================================
pause
