@echo off
echo.
echo ========================================
echo  Telugu Trader Mindset - Launcher
echo  Professional Trading Journal v2.0
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please download and install Node.js from: https://nodejs.org/
    echo (Download the LTS version)
    echo.
    echo After installation, run this file again.
    pause
    exit /b 1
)

REM Display Node version
echo Node.js found:
node --version
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies (this may take a few minutes)...
    echo.
    call npm install
    echo.
)

REM Start the application
echo Starting Trading Journal Pro...
echo.
echo The app will launch in development mode.
echo React dev server: http://localhost:3000
echo.
call npm run dev

pause
