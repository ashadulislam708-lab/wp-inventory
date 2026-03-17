# ========================================
# NestJS Starter Kit - Production Readiness Checker
# ========================================
# Run this script before deploying to production
# Usage: .\production-check.ps1
# ========================================

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Production Readiness Check" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$errors = 0
$warnings = 0

# ========================================
# 1. Check if .env file exists
# ========================================
Write-Host "📄 Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ .env file not found!" -ForegroundColor Red
    Write-Host "      Create a .env file with production configuration" -ForegroundColor Red
    $errors++
}

# ========================================
# 2. Check MODE is set to PROD
# ========================================
Write-Host "`n🔧 Checking MODE configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "MODE=PROD") {
        Write-Host "   ✅ MODE is set to PROD" -ForegroundColor Green
    } else {
        Write-Host "   ❌ MODE is not set to PROD" -ForegroundColor Red
        Write-Host "      Set MODE=PROD in your .env file" -ForegroundColor Red
        $errors++
    }
}

# ========================================
# 3. Check required environment variables
# ========================================
Write-Host "`n🔑 Checking required environment variables..." -ForegroundColor Yellow

$requiredVars = @(
    "MODE",
    "PORT",
    "POSTGRES_HOST",
    "POSTGRES_PORT",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DATABASE",
    "ALLOW_ORIGINS",
    "FRONTEND_URL",
    "AUTH_JWT_SECRET",
    "AUTH_TOKEN_COOKIE_NAME",
    "AUTH_TOKEN_EXPIRED_TIME",
    "AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME",
    "AUTH_REFRESH_TOKEN_COOKIE_NAME",
    "AUTH_REFRESH_TOKEN_EXPIRED_TIME",
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET",
    "APPLE_TEAM_ID",
    "APPLE_CLIENT_ID",
    "APPLE_KEY_ID",
    "APPLE_PRIVATE_KEY",
    "PROJECT_ID",
    "PRIVATE_KEY_ID",
    "PRIVATE_KEY",
    "CLIENT_EMAIL"
)

if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    $missingVars = @()
    $emptyVars = @()
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=") {
            # Check if variable is empty
            if ($envContent -match "$var=\s*`n" -or $envContent -match "$var=\s*$") {
                $emptyVars += $var
            }
        } else {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -eq 0 -and $emptyVars.Count -eq 0) {
        Write-Host "   ✅ All required environment variables are set" -ForegroundColor Green
    } else {
        if ($missingVars.Count -gt 0) {
            Write-Host "   ❌ Missing variables:" -ForegroundColor Red
            foreach ($var in $missingVars) {
                Write-Host "      - $var" -ForegroundColor Red
            }
            $errors++
        }
        if ($emptyVars.Count -gt 0) {
            Write-Host "   ⚠️  Empty variables:" -ForegroundColor Yellow
            foreach ($var in $emptyVars) {
                Write-Host "      - $var" -ForegroundColor Yellow
            }
            $warnings++
        }
    }
}

# ========================================
# 4. Check JWT secret strength
# ========================================
Write-Host "`n🔐 Checking JWT secret strength..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match 'AUTH_JWT_SECRET="([^"]+)"') {
        $jwtSecret = $matches[1]
        if ($jwtSecret.Length -lt 32) {
            Write-Host "   ⚠️  JWT secret is too short (less than 32 characters)" -ForegroundColor Yellow
            Write-Host "      Recommendation: Use a longer, more complex secret" -ForegroundColor Yellow
            $warnings++
        } elseif ($jwtSecret -match "^(secret|password|12345|test)") {
            Write-Host "   ❌ JWT secret is too weak!" -ForegroundColor Red
            Write-Host "      Use a strong, random secret for production" -ForegroundColor Red
            $errors++
        } else {
            Write-Host "   ✅ JWT secret appears strong" -ForegroundColor Green
        }
    }
}

# ========================================
# 5. Check if node_modules exists
# ========================================
Write-Host "`n📦 Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules directory exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ node_modules not found!" -ForegroundColor Red
    Write-Host "      Run: npm install" -ForegroundColor Red
    $errors++
}

# ========================================
# 6. Check if dist folder exists (build check)
# ========================================
Write-Host "`n🏗️  Checking build status..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Write-Host "   ✅ dist folder exists (app is built)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  dist folder not found" -ForegroundColor Yellow
    Write-Host "      Run: npm run build" -ForegroundColor Yellow
    $warnings++
}

# ========================================
# 7. Check if logs directory exists
# ========================================
Write-Host "`n📋 Checking logs directory..." -ForegroundColor Yellow
if (Test-Path "logs") {
    Write-Host "   ✅ logs directory exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  logs directory not found" -ForegroundColor Yellow
    Write-Host "      It will be created automatically on first run" -ForegroundColor Yellow
    $warnings++
}

# ========================================
# 8. Check database connection
# ========================================
Write-Host "`n🗄️  Checking database connection..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    
    # Try to extract DB credentials
    if ($envContent -match "POSTGRES_HOST=([^\r\n]+)") { $dbHost = $matches[1].Trim() }
    if ($envContent -match "POSTGRES_PORT=([^\r\n]+)") { $dbPort = $matches[1].Trim() }
    if ($envContent -match "POSTGRES_USER=([^\r\n]+)") { $dbUser = $matches[1].Trim() }
    if ($envContent -match "POSTGRES_DATABASE=([^\r\n]+)") { $dbName = $matches[1].Trim() }
    
    # Check if psql is available
    $psqlExists = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlExists) {
        Write-Host "   🔄 Testing database connection..." -ForegroundColor Cyan
        $env:PGPASSWORD = (Get-Content ".env" | Select-String "POSTGRES_PASSWORD=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
        $result = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT 1" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Database connection successful" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Cannot connect to database" -ForegroundColor Red
            Write-Host "      Error: $result" -ForegroundColor Red
            $errors++
        }
    } else {
        Write-Host "   ⚠️  psql not found - skipping database connection test" -ForegroundColor Yellow
        Write-Host "      Install PostgreSQL client to test database connection" -ForegroundColor Yellow
        $warnings++
    }
}

# ========================================
# 9. Check for test/demo credentials
# ========================================
Write-Host "`n🔍 Checking for test/demo credentials..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    $testPatterns = @(
        "test_",
        "demo-",
        "example.com",
        "12345",
        "localhost:3000",
        "fallback-secret"
    )
    
    $foundTestValues = @()
    foreach ($pattern in $testPatterns) {
        if ($envContent -match $pattern) {
            $foundTestValues += $pattern
        }
    }
    
    if ($foundTestValues.Count -gt 0) {
        Write-Host "   ⚠️  Found potential test/demo values:" -ForegroundColor Yellow
        foreach ($val in $foundTestValues) {
            Write-Host "      - '$val' detected" -ForegroundColor Yellow
        }
        Write-Host "      Review .env file and replace with production values" -ForegroundColor Yellow
        $warnings++
    } else {
        Write-Host "   ✅ No obvious test credentials found" -ForegroundColor Green
    }
}

# ========================================
# 10. Check TypeScript compilation
# ========================================
Write-Host "`n📝 Checking TypeScript compilation..." -ForegroundColor Yellow
if (Test-Path "tsconfig.json") {
    Write-Host "   🔄 Running TypeScript check..." -ForegroundColor Cyan
    $tscOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ TypeScript compilation successful" -ForegroundColor Green
    } else {
        Write-Host "   ❌ TypeScript compilation failed" -ForegroundColor Red
        Write-Host "      Fix compilation errors before deploying" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "   ⚠️  tsconfig.json not found" -ForegroundColor Yellow
    $warnings++
}

# ========================================
# 11. Security checks
# ========================================
Write-Host "`n🔒 Security checks..." -ForegroundColor Yellow

# Check if .env is in .gitignore
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "\.env") {
        Write-Host "   ✅ .env is in .gitignore" -ForegroundColor Green
    } else {
        Write-Host "   ❌ .env is NOT in .gitignore!" -ForegroundColor Red
        Write-Host "      Add .env to .gitignore to prevent committing secrets" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "   ⚠️  .gitignore not found" -ForegroundColor Yellow
    $warnings++
}

# Check npm audit
Write-Host "   🔄 Running npm audit..." -ForegroundColor Cyan
$auditOutput = npm audit --json 2>&1 | ConvertFrom-Json
if ($auditOutput.metadata.vulnerabilities.total -gt 0) {
    $critical = $auditOutput.metadata.vulnerabilities.critical
    $high = $auditOutput.metadata.vulnerabilities.high
    $moderate = $auditOutput.metadata.vulnerabilities.moderate
    
    Write-Host "   ⚠️  Found vulnerabilities:" -ForegroundColor Yellow
    if ($critical -gt 0) { Write-Host "      - Critical: $critical" -ForegroundColor Red }
    if ($high -gt 0) { Write-Host "      - High: $high" -ForegroundColor Red }
    if ($moderate -gt 0) { Write-Host "      - Moderate: $moderate" -ForegroundColor Yellow }
    Write-Host "      Run: npm audit fix" -ForegroundColor Yellow
    $warnings++
} else {
    Write-Host "   ✅ No known vulnerabilities" -ForegroundColor Green
}

# ========================================
# 12. Check CORS configuration
# ========================================
Write-Host "`n🌐 Checking CORS configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "ALLOW_ORIGINS=([^\r\n]+)") {
        $origins = $matches[1].Trim()
        if ($origins -match "localhost") {
            Write-Host "   ⚠️  ALLOW_ORIGINS contains 'localhost'" -ForegroundColor Yellow
            Write-Host "      Update to production domain(s)" -ForegroundColor Yellow
            $warnings++
        } else {
            Write-Host "   ✅ CORS origins configured" -ForegroundColor Green
        }
    }
}

# ========================================
# Final Summary
# ========================================
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "`n🎉 All checks passed!" -ForegroundColor Green
    Write-Host "✅ Your application is ready for production deployment`n" -ForegroundColor Green
    exit 0
} elseif ($errors -eq 0) {
    Write-Host "`n⚠️  $warnings warning(s) found" -ForegroundColor Yellow
    Write-Host "   Review warnings above before deploying`n" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`n❌ $errors error(s) and $warnings warning(s) found" -ForegroundColor Red
    Write-Host "   Fix all errors before deploying to production`n" -ForegroundColor Red
    exit 1
}
