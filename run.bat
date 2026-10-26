@echo off
setlocal

cd /d "%~dp0"

echo Starting EduSetu backend (port 5000)...
start "EduSetu Backend" cmd /k "cd /d "%~dp0server" && npm run dev"

echo Starting EduSetu frontend (port 5173)...
start "EduSetu Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"

echo Waiting for servers to start...
timeout /t 12 /nobreak >nul

echo Opening browser...
start "" "http://localhost:5173"

echo Done. Close the two opened windows to stop the servers.
pause
