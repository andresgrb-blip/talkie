# Zone4Love - Deployment Guide 🚀

## Quick Deploy (Recommended)

### Prerequisites
- Docker & Docker Compose installed
- Domain name configured
- SSL certificates ready

### 1-Click Deployment
```bash
# Clone repository
git clone https://github.com/your-username/zone4love.git
cd zone4love

# Run deployment script
./deploy.bat  # Windows
# or
./deploy.sh   # Linux/Mac

# Your app is now live! 🎉
```

## Manual Deployment

### Frontend Deployment

1. **Build Frontend**
   ```bash
   # Build production files
   ./build.bat
   
   # Files will be in ./dist/
   ```

2. **Deploy to Web Server**
   - Upload `dist/` contents to your web server
   - Configure web server to serve `index.html` for all routes
   - Enable HTTPS with SSL certificate

### Backend Deployment

1. **Using Docker (Recommended)**
   ```bash
   # Build image
   docker build -t zone4love-backend ./backend
   
   # Run container
   docker run -d \
     --name zone4love-backend \
     -p 8080:8080 \
     -e JWT_SECRET=your-secret-key \
     -e FRONTEND_URL=https://your-domain.com \
     -v zone4love-data:/app/data \
     zone4love-backend
   ```

2. **Manual Rust Build**
   ```bash
   cd backend
   cargo build --release
   
   # Set environment variables
   export DATABASE_URL=sqlite:zone4love.db?mode=rwc
   export JWT_SECRET=your-secret-key
   export FRONTEND_URL=https://your-domain.com
   
   # Run
   ./target/release/zone4love-backend
   ```

## Production Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=sqlite:zone4love.db?mode=rwc

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=86400

# CORS
FRONTEND_URL=https://your-domain.com

# File uploads
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

#### Frontend (js/config.js)
```javascript
const PRODUCTION_CONFIG = {
  API_BASE_URL: 'https://api.your-domain.com/api',
  ENVIRONMENT: 'production',
  VERSION: '1.0.0'
};
```

### SSL Configuration

1. **Get SSL Certificate**
   ```bash
   # Using Let's Encrypt (recommended)
   certbot certonly --webroot -w /var/www/html -d your-domain.com
   ```

2. **Configure Nginx**
   - Update `nginx.conf` with your domain
   - Place certificates in `./ssl/` directory
   - Restart Nginx

### Database Backup

```bash
# Backup SQLite database
docker exec zone4love-backend sqlite3 /app/data/zone4love.db ".backup /app/data/backup-$(date +%Y%m%d).db"

# Restore from backup
docker exec zone4love-backend sqlite3 /app/data/zone4love.db ".restore /app/data/backup-20231109.db"
```

## Monitoring & Maintenance

### Health Checks
- Frontend: `https://your-domain.com`
- Backend API: `https://your-domain.com/api/health`
- Database: Check container logs

### Logs
```bash
# View backend logs
docker logs zone4love-backend -f

# View Nginx logs
docker logs zone4love-nginx -f
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
./deploy.bat
```

## Scaling & Performance

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Deploy multiple backend instances
- Share database volume between instances

### Database Optimization
- Consider PostgreSQL for high traffic
- Implement connection pooling
- Add database indexes for performance

### CDN Integration
- Use CloudFlare or AWS CloudFront
- Cache static assets
- Enable gzip compression

## Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] HTTPS enabled with valid SSL
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Database backups automated
- [ ] Firewall rules configured
- [ ] Regular security updates

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `FRONTEND_URL` environment variable
   - Verify Nginx CORS configuration

2. **Database Connection Failed**
   - Check file permissions on SQLite file
   - Verify `DATABASE_URL` format

3. **JWT Token Invalid**
   - Ensure `JWT_SECRET` matches between deployments
   - Check token expiration time

4. **File Upload Issues**
   - Verify `UPLOAD_DIR` permissions
   - Check `MAX_FILE_SIZE` limit

### Support
- 📧 Email: support@zone4love.com
- 💬 Discord: [Zone4Love Community](https://discord.gg/zone4love)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/zone4love/issues)

---

**🌌 Welcome to the Zone4Love Galaxy! 🚀**
