@echo off
title CGH Local LipSync Studio - Python FastAPI Backend
color 0B
echo =====================================================================
echo       CGH Local LipSync Studio - Hardware-Accelerated Backend
echo                   Target: AMD Radeon RX 9060 XT
echo                      Brand: ComputerGuruHub
echo =====================================================================
echo.

if not exist "venv\Scripts\activate.bat" (
    echo [NOTICE] Python virtual environment not found.
    echo Running setup_windows.bat first to configure DirectML and dependencies...
    call scripts\setup_windows.bat
)

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo.
echo Starting FastAPI server at http://127.0.0.1:8000 ...
echo [INFO] Swagger API Docs available at: http://127.0.0.1:8000/docs
echo [INFO] Health Check endpoint: http://127.0.0.1:8000/api/health
echo.
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
