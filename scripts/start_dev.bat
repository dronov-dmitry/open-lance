@echo off
setlocal enabledelayedexpansion
echo ===========================================
echo Starting Open-Lance Development Servers...
echo ===========================================

echo.
echo [1/2] Starting Frontend Server (Port 8080)...
start "Open-Lance Frontend" cmd /k "cd /d "%~dp0..\docs" && python -m http.server 8080"

:: Read .env file to check if we are in local or cloud mode
set "IS_LOCAL_BACKEND=1"
set "BACKEND_URL=http://127.0.0.1:8787"
set "ENV_FILE=%~dp0..\.env"

if exist "%ENV_FILE%" (
    for /f "usebackq tokens=1,* delims==" %%G in ("%ENV_FILE%") do (
        if "%%G"=="Environment" (
            set "ENV_VAL=%%H"
            set "ENV_VAL=!ENV_VAL:"=!"
            if /i "!ENV_VAL!"=="dev" set "IS_LOCAL_BACKEND=0"
        )
        if "%%G"=="API_URL" (
            set "URL_VAL=%%H"
            set "BACKEND_URL=!URL_VAL:"=!"
            echo !BACKEND_URL! | findstr /i "127.0.0.1" >nul
            if errorlevel 1 set "IS_LOCAL_BACKEND=0"
        )
    )
)

if "%IS_LOCAL_BACKEND%"=="1" (
    echo [2/2] Starting Backend Server (Wrangler / Port 8787)...
    start "Open-Lance Backend" cmd /k "cd /d "%~dp0..\backend" && npm run dev"
    
    echo.
    echo Development servers started in separate windows!
    echo.
    echo Frontend URL: http://localhost:8080
    echo Backend URL:  http://127.0.0.1:8787
    echo.
    echo Note: To stop the servers, just close their respective command windows.
) else (
    echo [2/2] Skipping Local Backend ^(Deploy configured for Cloudflare Workers^)
    
    echo.
    echo Development server started!
    echo.
    echo Frontend URL: http://localhost:8080
    echo Backend URL:  %BACKEND_URL% ^(Cloud^)
    echo.
    echo Note: To stop the frontend server, just close its command window.
)

endlocal
