@echo off
start "EduSetu Server" cmd /k "cd /d %~dp0server && npm run dev"
start "EduSetu Client" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 5 /nobreak >nul
start http://localhost:5173