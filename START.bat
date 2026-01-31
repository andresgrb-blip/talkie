@echo off
color 0A
title Zone4Love - Launcher
cls

echo.
echo  ███████╗ ██████╗ ███╗   ██╗███████╗██╗  ██╗██╗      ██████╗ ██╗   ██╗███████╗
echo  ╚══███╔╝██╔═══██╗████╗  ██║██╔════╝██║  ██║██║     ██╔═══██╗██║   ██║██╔════╝
echo    ███╔╝ ██║   ██║██╔██╗ ██║█████╗  ███████║██║     ██║   ██║██║   ██║█████╗  
echo   ███╔╝  ██║   ██║██║╚██╗██║██╔══╝  ╚════██║██║     ██║   ██║╚██╗ ██╔╝██╔══╝  
echo  ███████╗╚██████╔╝██║ ╚████║███████╗     ██║███████╗╚██████╔╝ ╚████╔╝ ███████╗
echo  ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝     ╚═╝╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝
echo.
echo                        Social Galaxy Platform
echo                        =====================
echo.
echo  [INFO] Zone4Love Quick Launcher
echo  [INFO] This will start both Backend and Frontend
echo.

REM Check if Rust is installed
echo  [CHECK] Verifying Rust installation...
where cargo >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Rust not found!
    echo  [INFO] Please install Rust from: https://rustup.rs/
    echo.
    pause
    exit /b 1
)
echo  [OK] Rust found!
echo.

REM Check if backend .env exists
if not exist backend\.env (
    echo  [WARN] Backend .env file not found!
    echo  [INFO] Creating .env from .env.example...
    copy backend\.env.example backend\.env >nul
    echo  [WARN] Please edit backend\.env with your configuration!
    echo  [INFO] Opening .env file...
    start notepad backend\.env
    echo.
    echo  [INFO] After editing .env, press any key to continue...
    pause >nul
)

REM Check Python
echo  [CHECK] Verifying Python installation...
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [WARN] Python not found (optional)
    echo  [INFO] Frontend will open in browser without server
    echo.
    set USE_PYTHON=0
) else (
    echo  [OK] Python found!
    set USE_PYTHON=1
)
echo.

echo  [INFO] Starting Zone4Love...
echo  ========================================
echo.

REM Start backend in new window
echo  [1/2] Starting Backend Server...
start "Zone4Love Backend" cmd /k "cd backend && echo Backend starting on http://127.0.0.1:8080 && cargo run"
echo  [OK] Backend starting in separate window
echo.

REM Wait for backend to start
echo  [WAIT] Waiting for backend to initialize (15 seconds)...
timeout /t 15 /nobreak >nul

REM Start frontend
if %USE_PYTHON%==1 (
    echo  [2/2] Starting Frontend Server...
    start "Zone4Love Frontend" cmd /k "echo Frontend running on http://127.0.0.1:5500 && python -m http.server 5500"
    echo  [OK] Frontend starting in separate window
    echo.
    
    echo  [WAIT] Waiting for frontend to start (3 seconds)...
    timeout /t 3 /nobreak >nul
    
    echo  [LAUNCH] Opening browser...
    start http://127.0.0.1:5500
) else (
    echo  [2/2] Opening Frontend (no server)...
    start index.html
)

echo.
echo  ========================================
echo  [SUCCESS] Zone4Love is running!
echo  ========================================
echo.
echo  Backend API: http://127.0.0.1:8080
if %USE_PYTHON%==1 (
    echo  Frontend:    http://127.0.0.1:5500
) else (
    echo  Frontend:    file:// (direct)
)
echo.
echo  [INFO] Close this window when you're done
echo  [INFO] Or press Ctrl+C to stop everything
echo.
echo  Happy coding! 🚀🌌
echo.
pause
