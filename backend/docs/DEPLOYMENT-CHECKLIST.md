# 🚀 Production Deployment Checklist

## Pre-Deployment Checklist

Use this checklist before deploying your NestJS application to production.

---

## 🔧 Automated Check

Run the production readiness script:

### Windows (PowerShell):
```powershell
.\production-check.ps1
```

### Linux/Mac (Bash):
```bash
chmod +x production-check.sh
./production-check.sh
```

---

## ✅ Manual Checklist

### 1. Environment Configuration

- [ ] `.env` file exists and is configured for production
- [ ] `MODE=PROD` is set
- [ ] All required environment variables are set (see list below)
- [ ] No test/demo credentials remain (no `test_`, `demo-`, `example.com`)
- [ ] JWT secret is strong (32+ characters, random)
- [ ] Database credentials are correct for production
- [ ] AWS credentials are production keys (not test keys)
- [ ] CORS origins are set to production domains (no `localhost`)
- [ ] Frontend URL is set to production domain

### Required Environment Variables:
```
MODE=PROD
PORT=4000
POSTGRES_HOST=
POSTGRES_PORT=5432
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
ALLOW_ORIGINS=
FRONTEND_URL=
AUTH_JWT_SECRET=
AUTH_TOKEN_COOKIE_NAME=
AUTH_TOKEN_EXPIRED_TIME=
AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME=
AUTH_REFRESH_TOKEN_COOKIE_NAME=
AUTH_REFRESH_TOKEN_EXPIRED_TIME=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
APPLE_TEAM_ID=
APPLE_CLIENT_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
PROJECT_ID=
PRIVATE_KEY_ID=
PRIVATE_KEY=
CLIENT_EMAIL=
MAIL_HOST=
MAIL_PORT=
MAIL_FROM=
TOSS_CLIENT_ID=
TOSS_SECRET_KEY=
```

---

### 2. Security

- [ ] `.env` file is in `.gitignore`
- [ ] No secrets are hardcoded in the codebase
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] HTTPS is configured (SSL/TLS certificates installed)
- [ ] Firewall rules are configured
- [ ] Rate limiting is enabled (already configured with `@nestjs/throttler`)
- [ ] Strong passwords for all service accounts
- [ ] Database user has minimal required permissions

---

### 3. Database

- [ ] Production database is created
- [ ] Database is accessible from production server
- [ ] Migrations have been run: `npm run migration:run`
- [ ] Database backup strategy is in place
- [ ] Database connection pooling is configured
- [ ] Database credentials are secure

**Test Database Connection:**
```bash
psql -h <host> -p <port> -U <user> -d <database> -c "SELECT 1"
```

---

### 4. Build and Dependencies

- [ ] `npm install` has been run
- [ ] `npm run build` completes without errors
- [ ] TypeScript compilation succeeds
- [ ] All dependencies are installed
- [ ] `dist/` folder exists and contains compiled code
- [ ] No TypeScript errors: `npm run build`

---

### 5. Application Setup

- [ ] `logs/` directory exists (or will be auto-created)
- [ ] Application starts successfully: `npm run start:prod`
- [ ] Health check endpoint responds: `GET /`
- [ ] All critical endpoints are accessible
- [ ] Swagger is disabled (check: `/docs` returns 404)

---

### 6. Infrastructure

- [ ] Server/VM is provisioned
- [ ] Node.js is installed (correct version)
- [ ] PostgreSQL is installed and running
- [ ] Reverse proxy (nginx/Apache) is configured
- [ ] Process manager is set up (PM2 recommended)
- [ ] Log rotation is configured
- [ ] Monitoring is set up (optional: New Relic, Datadog)
- [ ] Backup strategy is in place

---

### 7. Network & DNS

- [ ] Domain name is registered
- [ ] DNS records are configured (A record, CNAME)
- [ ] SSL certificate is installed and valid
- [ ] Load balancer is configured (if using multiple servers)
- [ ] CDN is configured for static assets (optional)

---

### 8. Testing

- [ ] All API endpoints tested in staging environment
- [ ] Authentication flows work (login, register, logout)
- [ ] File uploads work (S3 integration)
- [ ] Email sending works
- [ ] Payment integration works (if applicable)
- [ ] Error handling works correctly
- [ ] Load testing performed (optional but recommended)

---

### 9. Monitoring & Logging

- [ ] Application logs are being written to `logs/` directory
- [ ] Log aggregation is set up (optional: ELK, CloudWatch)
- [ ] Error alerts are configured
- [ ] Uptime monitoring is configured (optional: UptimeRobot, Pingdom)
- [ ] Performance monitoring is configured (optional: New Relic)

---

### 10. Documentation

- [ ] API documentation is updated
- [ ] Deployment procedures are documented
- [ ] Rollback procedures are documented
- [ ] Emergency contact list is prepared
- [ ] Environment variables are documented (without values!)

---

## 🚀 Deployment Steps

### Step 1: Prepare Server
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL (if not installed)
sudo apt install postgresql postgresql-contrib

# Install PM2 globally
npm install -g pm2
```

### Step 2: Clone Repository
```bash
# Clone your repository
git clone <your-repo-url>
cd nestjs-starter-kit

# Checkout production branch (if applicable)
git checkout main
```

### Step 3: Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with production values
nano .env

# Set MODE=PROD
```

### Step 4: Install and Build
```bash
# Install dependencies
npm install --production

# Build the application
npm run build
```

### Step 5: Run Database Migrations
```bash
# Run migrations
npm run migration:run
```

### Step 6: Start Application
```bash
# Start with PM2
pm2 start dist/main.js --name "nestjs-app"

# Save PM2 configuration
pm2 save

# Setup auto-restart on server reboot
pm2 startup

# Check status
pm2 status
```

### Step 7: Configure Nginx (Reverse Proxy)
```nginx
# /etc/nginx/sites-available/nestjs-app
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/nestjs-app /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Step 8: Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 9: Verify Deployment
```bash
# Check application is running
pm2 status

# View logs
pm2 logs nestjs-app

# Test endpoints
curl https://your-domain.com
curl https://your-domain.com/api/health
```

---

## 🔄 Post-Deployment

### Monitor Application
```bash
# View real-time logs
pm2 logs nestjs-app

# Monitor CPU and memory
pm2 monit

# Check error logs
tail -f logs/error.log
```

### Common PM2 Commands
```bash
# Restart application
pm2 restart nestjs-app

# Stop application
pm2 stop nestjs-app

# View detailed info
pm2 info nestjs-app

# Clear logs
pm2 flush
```

---

## 🐛 Troubleshooting

### Application Won't Start
1. Check environment variables: `cat .env`
2. Check logs: `pm2 logs nestjs-app` or `cat logs/error.log`
3. Test database connection: `psql -h <host> -U <user> -d <database>`
4. Verify build: `ls dist/`

### Database Connection Issues
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify credentials in `.env`
3. Check firewall rules: `sudo ufw status`
4. Test connection manually: `psql -h localhost -U postgres`

### 502 Bad Gateway (Nginx)
1. Check application is running: `pm2 status`
2. Check port in nginx config matches app port
3. Check nginx error log: `sudo tail -f /var/log/nginx/error.log`

---

## 📞 Emergency Contacts

- **DevOps Team:** [email/phone]
- **Database Admin:** [email/phone]
- **Security Team:** [email/phone]
- **On-Call Engineer:** [email/phone]

---

## 🔙 Rollback Procedure

If deployment fails:

```bash
# Stop current version
pm2 stop nestjs-app

# Checkout previous version
git checkout <previous-commit-or-tag>

# Rebuild
npm install
npm run build

# Restart
pm2 restart nestjs-app

# Rollback database (if needed)
npm run migration:revert
```

---

**Last Updated:** November 6, 2025  
**Next Review:** [Set review date]
