@echo off
title CGH Local LipSync Studio - Stopping...
color 0C

echo Stopping CGH Local LipSync Studio servers...
taskkill /f /im uvicorn.exe >nul 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq CGH LipSync Backend*" >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq CGH LipSync Frontend*" >nul 2>&1

echo [OK] All local studio processes have been stopped safely.
timeout /t 2 /nobreak >nul
exit /b 0
