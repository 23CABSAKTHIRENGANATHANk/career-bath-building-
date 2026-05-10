@echo off
echo ============================================
echo Starting AI Career Intelligence Backend
echo ============================================
echo.

cd backend

echo Installing dependencies...
pip install -r requirements.txt
echo.

echo Starting Flask server...
set PYTHONIOENCODING=utf-8
python app.py

pause
