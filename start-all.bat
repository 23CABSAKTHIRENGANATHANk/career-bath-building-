@echo off
echo ========================================
echo AI Career Intelligence System - Quick Start
echo ========================================
echo.
echo Starting both Backend and Frontend servers...
echo.

start "Backend Server" cmd /k "set PYTHONIOENCODING=utf-8 && cd backend && python app.py"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting in separate windows.
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul
