@echo off
echo ========================================
echo   STARTING BACKEND SERVER
echo ========================================
echo.

cd /d "%~dp0backend"

echo Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
pip install -q flask flask-cors PyPDF2 python-docx numpy

echo.
echo ========================================
echo   BACKEND SERVER STARTING...
echo ========================================
echo.
echo Keep this window OPEN!
echo.

set PYTHONIOENCODING=utf-8
python app.py

pause
