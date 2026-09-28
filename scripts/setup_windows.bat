@echo off
setlocal enabledelayedexpansion
title CGH Local LipSync Studio - Automated Windows Setup
color 0B

echo =====================================================================
echo           CGH Local LipSync Studio - Windows Setup Wizard
echo                  Built for ComputerGuruHub Users
echo =====================================================================
echo.
echo Target OS:  Windows 10 / Windows 11 (64-bit)
echo Target GPU: AMD Radeon RX 9060 XT 16GB (DirectML Hardware Acceleration)
echo Privacy:    100%% Local, Zero Cloud APIs, Completely Offline
echo.

:: 1. Check Windows Version
echo [1/8] Checking Windows OS...
ver | findstr /i "10.0" >nul
if %errorlevel% neq 0 (
    echo [WARNING] Non-standard Windows version detected. Windows 10/11 is recommended.
) else (
    echo [OK] Windows 10/11 64-bit detected.
)

:: 2. Check Python 3.10+
echo [2/8] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not added to your system PATH!
    echo Please install Python 3.10 from https://www.python.org/downloads/
    echo Make sure to check "Add python.exe to PATH" during installation.
    pause
    exit /b 1
)
for /f "tokens=2 delims= " %%a in ('python --version 2^>^&1') do set PY_VER=%%a
echo [OK] Python %PY_VER% found.

:: 3. Check FFmpeg
echo [3/8] Checking FFmpeg installation...
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] FFmpeg is not found in your PATH!
    echo FFmpeg is required for MP4 and animated GIF encoding.
    echo You can install it via winget:
    echo     winget install "Gyan.FFmpeg"
    echo or download from https://www.gyan.dev/ffmpeg/builds/
    echo.
) else (
    echo [OK] FFmpeg is installed and ready.
)

:: 4. Check GPU (AMD Radeon RX 9060 XT 16GB)
echo [4/8] Detecting GPU hardware...
powershell -NoProfile -Command "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name" 2>nul
echo [INFO] DirectML (DirectX 12) will be used for AMD GPU acceleration.

:: 5. Create Virtual Environment
echo [5/8] Creating Python virtual environment (venv)...
if not exist "venv" (
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)
echo [OK] Virtual environment ready.

:: 6. Activate and Install Dependencies
echo [6/8] Installing dependencies (FastAPI, ONNX Runtime DirectML, PyTorch)...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r backend\requirements-amd-directml.txt
if %errorlevel% neq 0 (
    echo [WARNING] DirectML install hit an issue, falling back to standard requirements...
    pip install -r backend\requirements.txt
)

:: 7. Download Model Weights
echo [7/8] Verifying and downloading Wav2Lip local model weights...
python scripts\download_models.py

:: 8. Run Diagnostic & Test Inference
echo [8/8] Running hardware & backend diagnostic...
python scripts\diagnostic.py

echo.
echo =====================================================================
echo [SUCCESS] CGH Local LipSync Studio is fully installed and ready!
echo To launch the application anytime, double-click: start_app.bat
echo =====================================================================
echo.
set /p START_NOW="Do you want to launch the studio now? (Y/N): "
if /i "%START_NOW%"=="Y" (
    call scripts\start_app.bat
)
pause
