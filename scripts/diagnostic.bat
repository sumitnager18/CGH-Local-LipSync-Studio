@echo off
title CGH Local LipSync Studio - Hardware Diagnostic
color 0E

echo =====================================================================
echo           CGH Local LipSync Studio - System Diagnostic
echo =====================================================================
echo.

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

python scripts\diagnostic.py
pause
