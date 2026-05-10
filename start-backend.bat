@echo off
echo ========================================
echo Starting Backend Server (Flask)
echo ========================================
echo.
echo Backend will run on http://localhost:5000
echo.

cd backend
set PYTHONIOENCODING=utf-8
python app.py
