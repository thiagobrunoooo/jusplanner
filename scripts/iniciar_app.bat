@echo off
title Legal Study App
echo ==========================================
echo      Iniciando Legal Study App
echo ==========================================
echo.
cd /d "%~dp0"
echo Iniciando servidor de desenvolvimento...
echo Quando aparecer "Local: http://localhost:5173/", o app esta pronto.
echo.
call npm run dev
pause
