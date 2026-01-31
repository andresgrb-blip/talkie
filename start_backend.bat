@echo off
echo ========================================
echo Zone4Love Backend - Starting Server
echo ========================================

cd backend

REM Check if .env exists, if not copy from example
if not exist ".env" (
    echo Creating .env file from example...
    copy env_example .env
    echo.
    echo ⚠️  IMPORTANT: Edit .env file to set your JWT_SECRET!
    echo.
)

echo Starting Rust backend server...
echo Server will be available at: http://127.0.0.1:8080
echo.
echo Press Ctrl+C to stop the server
echo ========================================

cargo run

pause
