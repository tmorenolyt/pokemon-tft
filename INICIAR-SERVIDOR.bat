@echo off
title Pokemon TFT - Servidor local
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo  No se encontro Node.js. Instala la version LTS desde https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo ============================================================
echo   Pokemon TFT - SERVIDOR LOCAL
echo.
echo   Jugador 1:  http://localhost:8000/
echo   Jugador 2:  http://127.0.0.1:8000/
echo.
echo   Deja esta ventana abierta mientras juegas.
echo   Para parar: cierra la ventana o pulsa Ctrl+C.
echo ============================================================
echo.

node servidor-online.js

echo.
echo El servidor se ha detenido.
pause
