@echo off
title AI Career Intelligence - Complete Startup
color 0A

echo.
echo ============================================
echo   AI Career Intelligence System
echo   Complete Startup Script
echo ============================================
echo.

echo [1/4] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo Please install Python 3.7+ from python.org
    pause
    exit /b 1
)
echo ✓ Python found
echo.

echo [2/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from nodejs.org
    pause
    exit /b 1
)
echo ✓ Node.js found
echo.

echo [3/4] Installing backend dependencies...
cd backend
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
cd ..
echo.

echo [4/4] Installing frontend dependencies...
call npm install --silent
if errorlevel 1 (
    echo ERROR: Failed to install Node dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Now starting servers...
echo.
echo IMPORTANT: Two terminal windows will open:
echo   1. Backend Server (Python/Flask)
echo   2. Frontend Server (React/Vite)
echo.
echo Keep BOTH windows open while using the app!
echo.
pause

echo Starting backend server...
start "Backend Server" cmd /k "set PYTHONIOENCODING=utf-8 && cd backend && python app.py"

timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ============================================
echo   Servers Starting...
echo ============================================
echo.
echo Wait for both servers to start, then:
echo   1. Open browser to http://localhost:5173
echo   2. Upload your resume
echo   3. Enjoy!
echo.
echo Press any key to exit this window...
pause >nul
