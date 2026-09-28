@echo off
title CGH Local LipSync Studio - Starting...
color 0A

echo =====================================================================
echo                Starting CGH Local LipSync Studio
echo                    Brand: ComputerGuruHub
echo =====================================================================
echo.

if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found!
    echo Please run setup_windows.bat first.
    pause
    exit /b 1
)

call venv\Scripts\activate.bat

echo Starting local FastAPI backend server on http://127.0.0.1:8000 ...
start "CGH LipSync Backend" /min cmd /c "uvicorn backend.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo Starting local web user interface on http://localhost:3000 ...
if exist "dist\index.html" (
    start "" http://localhost:3000
    npx serve dist -l 3000
) else (
    start "" http://127.0.0.1:8000
)

echo CGH Local LipSync Studio is running!
echo Keep this window open while using the application.
echo To close, run stop_app.bat or close this terminal.
pause
