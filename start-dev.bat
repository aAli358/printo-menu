@echo off

title E-Menu - Development

echo ========================================

echo   E-Menu - Starting Development Servers

echo ========================================

echo.



cd /d "%~dp0"



set "PYTHON="

where python >nul 2>&1 && set "PYTHON=python"

if not defined PYTHON where py >nul 2>&1 && set "PYTHON=py -3"



if not defined PYTHON (

    if exist "C:\Users\a\.codegeex\mamba\envs\codegeex-agent\python.exe" (

        set "PYTHON=C:\Users\a\.codegeex\mamba\envs\codegeex-agent\python.exe"

    )

)



if not defined PYTHON (

    echo [ERROR] Python not found. Install Python 3.11+ from python.org

    pause

    exit /b 1

)



where npm >nul 2>&1

if %ERRORLEVEL% NEQ 0 (

    echo [ERROR] npm not found. Install Node.js first.

    pause

    exit /b 1

)



echo Using: %PYTHON%

echo.



echo [1/3] Running migrations...

%PYTHON% manage.py migrate

if %ERRORLEVEL% NEQ 0 (

    echo [ERROR] Migration failed. Try: pip install -r requirements.txt

    pause

    exit /b 1

)



echo [2/3] Starting Backend on http://0.0.0.0:8000 ...

start "E-Menu Backend" cmd /k "cd /d %~dp0 && %PYTHON% manage.py runserver 0.0.0.0:8000"



timeout /t 3 /nobreak >nul



echo [3/3] Starting Frontend (network access enabled) ...

start "E-Menu Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"



timeout /t 2 /nobreak >nul



for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169' } | Select-Object -First 1 -ExpandProperty IPAddress)"`) do set "LOCAL_IP=%%i"



echo.

echo ========================================

echo   Ready!

echo.

echo   Platform Landing:  http://localhost:5173/

echo   Tenant Menu:       http://shams.localhost:5173/

echo.

echo   Legacy ^(?r=^):

echo   http://localhost:5173/?r=shams^&table=1

echo.

echo   Tenant Dashboard: http://localhost:5173/login

echo   Kitchen Display:  http://localhost:5173/kitchen

echo.

if defined LOCAL_IP (

    echo   Mobile ^(same Wi-Fi^):

    echo   http://shams.%LOCAL_IP%.nip.io:5173/  ^(or use ?r=^)

    echo   http://%LOCAL_IP%:5173/?r=shams^&table=1

    echo.

    echo   Your IP: %LOCAL_IP%

) else (

    echo   Mobile: use your PC IP instead of localhost

    echo   Example: http://192.168.x.x:5173/?r=shams^&table=1

)

echo.

echo   Note: Phone and PC must be on the SAME Wi-Fi

echo ========================================

echo.

pause

