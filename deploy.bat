@echo off
echo ========================================
echo Zone4Love - Production Deployment
echo ========================================

echo [1/6] Building frontend...
call build.bat

echo [2/6] Building backend Docker image...
docker build -t zone4love-backend ./backend

echo [3/6] Stopping existing containers...
docker-compose down

echo [4/6] Starting production environment...
docker-compose up -d

echo [5/6] Waiting for services to start...
timeout /t 30 /nobreak

echo [6/6] Checking service health...
docker-compose ps

echo.
echo ========================================
echo 🚀 Deployment Status
echo ========================================

REM Check if containers are running
docker ps --filter "name=zone4love" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 📋 Next Steps:
echo 1. Configure your domain DNS to point to this server
echo 2. Set up SSL certificates in ./ssl/ directory
echo 3. Update JWT_SECRET in docker-compose.yml
echo 4. Configure backup for database volume
echo.
echo 🌐 Frontend: https://your-domain.com
echo 🔧 Backend API: https://your-domain.com/api
echo 📊 Health Check: https://your-domain.com/health
echo.
echo ⚠️  Remember to:
echo - Update FRONTEND_URL in docker-compose.yml
echo - Add SSL certificates to ./ssl/
echo - Configure firewall rules
echo - Set up monitoring and backups
echo.
pause
