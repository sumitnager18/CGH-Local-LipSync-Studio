@echo off
title CGH Local LipSync Studio - Test Inference Benchmark
color 0A

echo =====================================================================
echo       CGH Local LipSync Studio - Hardware Benchmark & Test
echo =====================================================================
echo.

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

python scripts\test_inference.py
pause
