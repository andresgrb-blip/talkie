@echo off
echo ========================================
echo Zone4Love - Production Build Script
echo ========================================

REM Create build directory
if not exist "dist" mkdir dist

echo [1/5] Copying HTML files...
copy "*.html" "dist\"

echo [2/5] Copying assets...
xcopy "styles" "dist\styles\" /E /I /Y
xcopy "js" "dist\js\" /E /I /Y
xcopy "gsap" "dist\gsap\" /E /I /Y

echo [3/5] Optimizing for production...
REM Replace development API URL with production URL
powershell -Command "(Get-Content 'dist\js\auth.js') -replace 'http://127.0.0.1:8080/api', 'https://api.zone4love.com/api' | Set-Content 'dist\js\auth.js'"
powershell -Command "(Get-Content 'dist\js\dashboard.js') -replace 'http://127.0.0.1:8080/api', 'https://api.zone4love.com/api' | Set-Content 'dist\js\dashboard.js'"

echo [4/5] Creating production config...
echo // Production Configuration > dist\js\config.js
echo const PRODUCTION_CONFIG = { >> dist\js\config.js
echo   API_BASE_URL: 'https://api.zone4love.com/api', >> dist\js\config.js
echo   ENVIRONMENT: 'production', >> dist\js\config.js
echo   VERSION: '1.0.0' >> dist\js\config.js
echo }; >> dist\js\config.js

echo [5/5] Creating deployment files...
echo # Zone4Love - Production Deployment > dist\README.md
echo. >> dist\README.md
echo ## Quick Deploy >> dist\README.md
echo. >> dist\README.md
echo 1. Upload all files to your web server >> dist\README.md
echo 2. Configure your backend API at https://api.zone4love.com >> dist\README.md
echo 3. Update DNS to point to your server >> dist\README.md
echo 4. Enable HTTPS with SSL certificate >> dist\README.md

echo.
echo ========================================
echo ✅ Build completed successfully!
echo ========================================
echo.
echo 📁 Production files are in: dist\
echo 🌐 Ready for deployment to web server
echo 🚀 Don't forget to configure your backend API!
echo.
pause
