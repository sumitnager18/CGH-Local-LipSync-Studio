@echo off
title CGH Local LipSync Studio - Complete System Launcher
color 0A
echo =====================================================================
echo                CGH Local LipSync Studio - Launcher
echo                   Brand: ComputerGuruHub (CGH)
echo =====================================================================
echo.

if not exist "venv\Scripts\activate.bat" (
    echo [SETUP REQUIRED] Setting up Python dependencies and DirectML on Windows...
    call scripts\setup_windows.bat
)

echo Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "CGH Backend" cmd /c "call run_backend.bat"

echo Waiting for backend initialization...
timeout /t 3 /nobreak >nul

echo Starting Frontend on http://localhost:3000 ...
start "" http://localhost:3000
npm run dev
