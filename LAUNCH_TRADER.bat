@echo off
title Telugu Trader Mindset - Launcher
color 0A

echo.
echo ========================================
echo   Telugu Trader Mindset v2.1
echo   Starting all services...
echo ========================================
echo.

:: Change to app directory
R:
cd R:\trader_pro_v2.1\trader_app

:: Check Node
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found. Install from nodejs.org
    pause
    exit /b 1
)

:: Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found. Install from python.org
    pause
    exit /b 1
)

:: Kill any previous instances on port 5000
echo Clearing previous sessions...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>nul

:: Start MT5 Bridge in background
echo Starting MT5 Bridge...
start "MT5 Bridge" cmd /k "R: && cd R:\trader_pro_v2.1\trader_app && python mt5_bridge.py"

:: Wait for bridge to initialize
echo Waiting for MT5 bridge to connect...
timeout /t 4 /nobreak >nul

:: Start the Trading App
echo Starting Trading App...
start "Trading App" cmd /k "R: && cd R:\trader_pro_v2.1\trader_app && npm run dev"

echo.
echo ========================================
echo   Both services are starting!
echo   The app window will open shortly.
echo   
echo   MT5 Bridge: http://localhost:5000
echo   App:        http://localhost:3000
echo.
echo   You can minimize this window.
echo   Close it to stop everything.
echo ========================================
echo.

:: Keep this window open and wait
:loop
timeout /t 60 /nobreak >nul
goto loop
