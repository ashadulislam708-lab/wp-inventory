# 🚀 Production Mode (MODE=PROD) Configuration Guide

## Overview

This guide documents all changes required when running the application in **PROD** mode (`MODE=PROD` in `.env`).

---

## 📋 Environment Configuration

### Required Environment Variables

```env
# Application Mode
MODE=PROD                                    # Set to PROD for production
NODE_ENV=production                          # Optional but recommended

# Database (Required)
POSTGRES_HOST=your-production-host
POSTGRES_PORT=5432
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-strong-password
POSTGRES_DATABASE=your-database-name

# App Configuration (Required)
PORT=4000
ALLOW_ORIGINS=https://your-production-domain.com
FRONTEND_URL=https://your-frontend-domain.com

# JWT Configuration (Required - Use Strong Secrets!)
AUTH_JWT_SECRET="your-very-strong-production-secret-here"
AUTH_TOKEN_COOKIE_NAME="YourAppToken"
AUTH_TOKEN_EXPIRED_TIME=86400
AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME=2592000
AUTH_REFRESH_TOKEN_COOKIE_NAME="YourRefreshToken"
AUTH_REFRESH_TOKEN_EXPIRED_TIME=604800

# AWS S3 (Required)
AWS_ACCESS_KEY_ID=your-production-key
AWS_SECRET_ACCESS_KEY=your-production-secret
AWS_REGION=your-region
AWS_S3_BUCKET=your-production-bucket

# Mail Configuration
MAIL_PORT=587
MAIL_HOST=smtp.gmail.com
MAIL_FROM=your-production-email@domain.com
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_CLIENT_REFRESH_TOKEN=your-production-refresh-token
GOOGLE_CLIENT_ACCESS_TOKEN=your-production-access-token

# Apple Authentication
APPLE_TEAM_ID=your-production-team-id
APPLE_CLIENT_ID=your-production-client-id
APPLE_KEY_ID=your-production-key-id
APPLE_PRIVATE_KEY=your-production-private-key

# Push Notifications
PROJECT_ID=your-production-project-id
PRIVATE_KEY_ID=your-production-private-key-id
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CLIENT_EMAIL=your-production-service-account@project.iam.gserviceaccount.com

# Payment Gateway (Toss Payments)
TOSS_CLIENT_ID=live_ck_XXXXXXXXXX           # Use LIVE credentials
TOSS_SECRET_KEY=live_sk_XXXXXXXXXX          # Use LIVE credentials
TOSS_BASE_URL="https://api.tosspayments.com"
TOSS_WEBHOOK_SECRET=your-production-webhook-secret
```

---

## 🔐 Security Changes in Production

### 1. **Logging Behavior** (`logging.interceptor.ts`)

**Development Mode:**
```typescript
// Logs full request body including sensitive data
Incoming Request: POST /auth/login - Body: {"email":"user@example.com","password":"secret123"}
```

**Production Mode:**
```typescript
// Sanitizes sensitive fields (passwords, tokens, OTPs, etc.)
Incoming Request: POST /auth/login - Body: {"email":"user@example.com","password":"***REDACTED***"}
```

**Sanitized Fields:**
- `password`, `currentPassword`, `newPassword`, `confirmPassword`
- `token`, `accessToken`, `refreshToken`
- `secret`, `apiKey`, `privateKey`
- `creditCard`, `ssn`, `otp`

### 2. **OTP Logging** (`otp.service.ts`)

**Development Mode:**
```typescript
console.log(`OTP for user@example.com: 123456`);  // ✅ Logged to console
```

**Production Mode:**
```typescript
// ❌ OTP is NOT logged to console (security risk)
// OTP is only sent via email
```

### 3. **Debug Logs Disabled**

**Files Updated:**
- `feature.controller.ts` - User email logging only in DEV
- `token.service.ts` - JWT configuration logging only in DEV
- `mail.service.ts` - Uses Winston logger instead of console.log

### 4. **Error Stack Traces** (`http-exception.filter.ts`)

**Development Mode (MODE=DEV):**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "An unexpected error occurred",
  "error": [{
    "reason": "Database connection failed",
    "code": "InternalServerError",
    "constraints": {
      "stack": "Error: Something went wrong\n    at DatabaseService.connect ...",
      "originalMessage": "Database connection failed"
    }
  }]
}
```

**Production Mode (MODE=PROD):**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "An unexpected error occurred. Please try again later.",
  "error": [{
    "reason": "InternalServerError",
    "code": "InternalServerError"
  }]
}
```

**Note:** Stack traces are **HIDDEN** in production to prevent exposing internal application structure.

---

## 📝 Logging System

### Winston Logger Configuration

**Development Mode (MODE=DEV):**
- Logs to: **Console**
- Format: **Human-readable** with colors
- Level: **All levels** (debug, info, warn, error)

```
2024-11-06T10:30:00.000Z - [INFO   ] - Application started successfully
2024-11-06T10:30:01.000Z - [DEBUG  ] - Database connection established
```

**Production Mode (MODE=PROD):**
- Logs to: **Files**
  - `logs/error.log` - Error level only
  - `logs/combine.log` - All levels (info, warn, error)
- Format: **JSON** for log aggregation tools
- Level: **Info and above** (no debug logs)

```json
{
  "level": "info",
  "message": "Application started successfully",
  "timestamp": "2024-11-06T10:30:00.000Z"
}
```

---

## 🚫 Swagger Documentation

**Development Mode (MODE=DEV):**
```typescript
✅ Swagger UI is enabled at: http://localhost:4000/docs
```

**Production Mode (MODE=PROD):**
```typescript
❌ Swagger UI is DISABLED (security best practice)
```

**Reason:** API documentation should not be publicly accessible in production.

---

## 🎯 Startup Messages

**Development Mode:**
```bash
Application is running on: http://localhost:4000
Swagger documentation available at: http://localhost:4000/docs
```

**Production Mode:**
```bash
# Logged to logs/combine.log (not console)
Application is running on: http://localhost:4000
Swagger documentation is disabled in production mode
```

---

## 📊 Complete Feature Comparison

| Feature | DEV Mode | PROD Mode |
|---------|----------|-----------|
| **Swagger UI** | ✅ Enabled at `/docs` | ❌ Disabled |
| **Request Body Logging** | ✅ Full logging | ⚠️ Sanitized (passwords hidden) |
| **OTP Console Logging** | ✅ Logged to console | ❌ Not logged |
| **Debug Console Logs** | ✅ Enabled | ❌ Disabled |
| **Error Stack Traces** | ✅ Included in API responses | ❌ Hidden |
| **Log Output** | 📺 Console | 📁 Files (`logs/*.log`) |
| **Log Format** | 🎨 Human-readable | 📋 JSON |
| **Startup Messages** | 📺 Console | 📁 Log files |
| **Sensitive Data** | ⚠️ May be logged | 🔒 Redacted |

---

## ✅ Pre-Production Checklist

Before deploying to production with `MODE=PROD`:

### 1. Environment Variables
- [ ] Set `MODE=PROD` in `.env`
- [ ] Set `NODE_ENV=production` (recommended)
- [ ] Update all credentials to production values
- [ ] Use strong `AUTH_JWT_SECRET`
- [ ] Configure production database
- [ ] Set correct `ALLOW_ORIGINS` and `FRONTEND_URL`

### 2. Security
- [ ] Review all environment variables for test/dev values
- [ ] Ensure no hardcoded secrets in code
- [ ] Verify SSL/TLS certificates are configured
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules

### 3. Database
- [ ] Run migrations: `npm run migration:run`
- [ ] Create production database backup strategy
- [ ] Verify database connection limits

### 4. Logging
- [ ] Ensure `logs/` directory exists or will be created
- [ ] Set up log rotation (e.g., using `logrotate`)
- [ ] Configure log aggregation (e.g., ELK stack, CloudWatch)
- [ ] Set up alerts for critical errors

### 5. Infrastructure
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up load balancing (if needed)
- [ ] Configure CDN for static assets
- [ ] Set up monitoring (e.g., New Relic, Datadog)
- [ ] Configure health check endpoints

### 6. Testing
- [ ] Test all API endpoints in staging
- [ ] Verify authentication flows work correctly
- [ ] Test error handling and logging
- [ ] Verify email sending works
- [ ] Test file uploads to S3

---

## 🚀 Deployment Commands

### Build the Application
```bash
npm run build
```

### Run Database Migrations
```bash
npm run migration:run
```

### Start in Production Mode
```bash
npm run start:prod
```

### Using PM2 (Recommended for Production)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/main.js --name "nestjs-app"

# Save PM2 configuration
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

---

## 🔍 Monitoring in Production

### View Log Files
```bash
# View all logs
tail -f logs/combine.log

# View only errors
tail -f logs/error.log

# Search for specific errors
grep "ERROR" logs/combine.log
```

### Check Application Status (with PM2)
```bash
# View running processes
pm2 list

# View logs
pm2 logs nestjs-app

# Monitor CPU and memory
pm2 monit
```

---

## 🐛 Troubleshooting

### Issue: Application won't start in PROD mode

**Check:**
1. Verify all required environment variables are set
2. Check logs in `logs/error.log`
3. Ensure database is accessible
4. Verify JWT secrets are configured

### Issue: Cannot see detailed errors

**This is expected in production!**
- Error details are hidden for security
- Check `logs/error.log` for full error details
- Stack traces are logged but not sent to clients

### Issue: Swagger not accessible

**This is expected!**
- Swagger is intentionally disabled in `MODE=PROD`
- Use Postman or API testing tools instead
- Review API documentation in development mode

---

## 📚 Related Documentation

- [ERROR-HANDLING-GUIDE.md](./ERROR-HANDLING-GUIDE.md) - Error handling patterns
- [AUTHENTICATION-GUIDE.md](./AUTHENTICATION-GUIDE.md) - Authentication setup
- [FEATURES-DEMO-GUIDE.md](./FEATURES-DEMO-GUIDE.md) - Complete feature guide
- [RESPONSE-SYSTEM-SUMMARY.md](./RESPONSE-SYSTEM-SUMMARY.md) - Response structure

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use strong secrets** for JWT and other credentials
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Monitor logs** for suspicious activity
5. **Keep dependencies updated** (`npm audit` regularly)
6. **Use HTTPS only** in production
7. **Implement rate limiting** (already configured with Throttler)
8. **Regular security audits** of the codebase
9. **Database backups** configured and tested
10. **Disaster recovery plan** documented

---

## 📞 Support

If you encounter issues in production:

1. Check `logs/error.log` for detailed error messages
2. Review this guide for configuration issues
3. Verify environment variables are correctly set
4. Check database connectivity
5. Review nginx/reverse proxy logs (if applicable)

---

**Last Updated:** November 6, 2025
**Version:** 1.0.0
