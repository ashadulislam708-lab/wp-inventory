#!/bin/bash

# ========================================
# NestJS Starter Kit - Production Readiness Checker
# ========================================
# Run this script before deploying to production
# Usage: ./production-check.sh
# ========================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "\n${CYAN}============================================${NC}"
echo -e "${CYAN}  Production Readiness Check${NC}"
echo -e "${CYAN}============================================${NC}\n"

errors=0
warnings=0

# ========================================
# 1. Check if .env file exists
# ========================================
echo -e "${YELLOW}📄 Checking .env file...${NC}"
if [ -f ".env" ]; then
    echo -e "   ${GREEN}✅ .env file exists${NC}"
else
    echo -e "   ${RED}❌ .env file not found!${NC}"
    echo -e "      ${RED}Create a .env file with production configuration${NC}"
    ((errors++))
fi

# ========================================
# 2. Check MODE is set to PROD
# ========================================
echo -e "\n${YELLOW}🔧 Checking MODE configuration...${NC}"
if [ -f ".env" ]; then
    if grep -q "MODE=PROD" .env; then
        echo -e "   ${GREEN}✅ MODE is set to PROD${NC}"
    else
        echo -e "   ${RED}❌ MODE is not set to PROD${NC}"
        echo -e "      ${RED}Set MODE=PROD in your .env file${NC}"
        ((errors++))
    fi
fi

# ========================================
# 3. Check required environment variables
# ========================================
echo -e "\n${YELLOW}🔑 Checking required environment variables...${NC}"

required_vars=(
    "MODE"
    "PORT"
    "POSTGRES_HOST"
    "POSTGRES_PORT"
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "POSTGRES_DATABASE"
    "ALLOW_ORIGINS"
    "FRONTEND_URL"
    "AUTH_JWT_SECRET"
    "AUTH_TOKEN_COOKIE_NAME"
    "AUTH_TOKEN_EXPIRED_TIME"
    "AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME"
    "AUTH_REFRESH_TOKEN_COOKIE_NAME"
    "AUTH_REFRESH_TOKEN_EXPIRED_TIME"
    "AWS_REGION"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_S3_BUCKET"
    "APPLE_TEAM_ID"
    "APPLE_CLIENT_ID"
    "APPLE_KEY_ID"
    "APPLE_PRIVATE_KEY"
    "PROJECT_ID"
    "PRIVATE_KEY_ID"
    "PRIVATE_KEY"
    "CLIENT_EMAIL"
)

if [ -f ".env" ]; then
    missing_vars=()
    empty_vars=()
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env; then
            # Check if variable is empty
            if grep -q "^${var}=\s*$" .env; then
                empty_vars+=("$var")
            fi
        else
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ] && [ ${#empty_vars[@]} -eq 0 ]; then
        echo -e "   ${GREEN}✅ All required environment variables are set${NC}"
    else
        if [ ${#missing_vars[@]} -gt 0 ]; then
            echo -e "   ${RED}❌ Missing variables:${NC}"
            for var in "${missing_vars[@]}"; do
                echo -e "      ${RED}- $var${NC}"
            done
            ((errors++))
        fi
        if [ ${#empty_vars[@]} -gt 0 ]; then
            echo -e "   ${YELLOW}⚠️  Empty variables:${NC}"
            for var in "${empty_vars[@]}"; do
                echo -e "      ${YELLOW}- $var${NC}"
            done
            ((warnings++))
        fi
    fi
fi

# ========================================
# 4. Check JWT secret strength
# ========================================
echo -e "\n${YELLOW}🔐 Checking JWT secret strength...${NC}"
if [ -f ".env" ]; then
    jwt_secret=$(grep "AUTH_JWT_SECRET=" .env | cut -d '=' -f2 | tr -d '"')
    if [ ${#jwt_secret} -lt 32 ]; then
        echo -e "   ${YELLOW}⚠️  JWT secret is too short (less than 32 characters)${NC}"
        echo -e "      ${YELLOW}Recommendation: Use a longer, more complex secret${NC}"
        ((warnings++))
    elif [[ "$jwt_secret" =~ ^(secret|password|12345|test) ]]; then
        echo -e "   ${RED}❌ JWT secret is too weak!${NC}"
        echo -e "      ${RED}Use a strong, random secret for production${NC}"
        ((errors++))
    else
        echo -e "   ${GREEN}✅ JWT secret appears strong${NC}"
    fi
fi

# ========================================
# 5. Check if node_modules exists
# ========================================
echo -e "\n${YELLOW}📦 Checking dependencies...${NC}"
if [ -d "node_modules" ]; then
    echo -e "   ${GREEN}✅ node_modules directory exists${NC}"
else
    echo -e "   ${RED}❌ node_modules not found!${NC}"
    echo -e "      ${RED}Run: npm install${NC}"
    ((errors++))
fi

# ========================================
# 6. Check if dist folder exists (build check)
# ========================================
echo -e "\n${YELLOW}🏗️  Checking build status...${NC}"
if [ -d "dist" ]; then
    echo -e "   ${GREEN}✅ dist folder exists (app is built)${NC}"
else
    echo -e "   ${YELLOW}⚠️  dist folder not found${NC}"
    echo -e "      ${YELLOW}Run: npm run build${NC}"
    ((warnings++))
fi

# ========================================
# 7. Check if logs directory exists
# ========================================
echo -e "\n${YELLOW}📋 Checking logs directory...${NC}"
if [ -d "logs" ]; then
    echo -e "   ${GREEN}✅ logs directory exists${NC}"
else
    echo -e "   ${YELLOW}⚠️  logs directory not found${NC}"
    echo -e "      ${YELLOW}It will be created automatically on first run${NC}"
    ((warnings++))
fi

# ========================================
# 8. Check database connection
# ========================================
echo -e "\n${YELLOW}🗄️  Checking database connection...${NC}"
if [ -f ".env" ]; then
    # Extract DB credentials
    db_host=$(grep "POSTGRES_HOST=" .env | cut -d '=' -f2)
    db_port=$(grep "POSTGRES_PORT=" .env | cut -d '=' -f2)
    db_user=$(grep "POSTGRES_USER=" .env | cut -d '=' -f2)
    db_name=$(grep "POSTGRES_DATABASE=" .env | cut -d '=' -f2)
    db_pass=$(grep "POSTGRES_PASSWORD=" .env | cut -d '=' -f2)
    
    # Check if psql is available
    if command -v psql &> /dev/null; then
        echo -e "   ${CYAN}🔄 Testing database connection...${NC}"
        export PGPASSWORD="$db_pass"
        if psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -c "SELECT 1" &> /dev/null; then
            echo -e "   ${GREEN}✅ Database connection successful${NC}"
        else
            echo -e "   ${RED}❌ Cannot connect to database${NC}"
            ((errors++))
        fi
        unset PGPASSWORD
    else
        echo -e "   ${YELLOW}⚠️  psql not found - skipping database connection test${NC}"
        echo -e "      ${YELLOW}Install PostgreSQL client to test database connection${NC}"
        ((warnings++))
    fi
fi

# ========================================
# 9. Check for test/demo credentials
# ========================================
echo -e "\n${YELLOW}🔍 Checking for test/demo credentials...${NC}"
if [ -f ".env" ]; then
    test_patterns=("test_" "demo-" "example.com" "12345" "localhost:3000" "fallback-secret")
    found_test_values=()
    
    for pattern in "${test_patterns[@]}"; do
        if grep -q "$pattern" .env; then
            found_test_values+=("$pattern")
        fi
    done
    
    if [ ${#found_test_values[@]} -gt 0 ]; then
        echo -e "   ${YELLOW}⚠️  Found potential test/demo values:${NC}"
        for val in "${found_test_values[@]}"; do
            echo -e "      ${YELLOW}- '$val' detected${NC}"
        done
        echo -e "      ${YELLOW}Review .env file and replace with production values${NC}"
        ((warnings++))
    else
        echo -e "   ${GREEN}✅ No obvious test credentials found${NC}"
    fi
fi

# ========================================
# 10. Check TypeScript compilation
# ========================================
echo -e "\n${YELLOW}📝 Checking TypeScript compilation...${NC}"
if [ -f "tsconfig.json" ]; then
    echo -e "   ${CYAN}🔄 Running TypeScript check...${NC}"
    if npm run build &> /dev/null; then
        echo -e "   ${GREEN}✅ TypeScript compilation successful${NC}"
    else
        echo -e "   ${RED}❌ TypeScript compilation failed${NC}"
        echo -e "      ${RED}Fix compilation errors before deploying${NC}"
        ((errors++))
    fi
else
    echo -e "   ${YELLOW}⚠️  tsconfig.json not found${NC}"
    ((warnings++))
fi

# ========================================
# 11. Security checks
# ========================================
echo -e "\n${YELLOW}🔒 Security checks...${NC}"

# Check if .env is in .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        echo -e "   ${GREEN}✅ .env is in .gitignore${NC}"
    else
        echo -e "   ${RED}❌ .env is NOT in .gitignore!${NC}"
        echo -e "      ${RED}Add .env to .gitignore to prevent committing secrets${NC}"
        ((errors++))
    fi
else
    echo -e "   ${YELLOW}⚠️  .gitignore not found${NC}"
    ((warnings++))
fi

# Check npm audit
echo -e "   ${CYAN}🔄 Running npm audit...${NC}"
audit_output=$(npm audit --json 2>/dev/null)
if [ $? -eq 0 ]; then
    vulnerabilities=$(echo "$audit_output" | grep -o '"total":[0-9]*' | head -1 | grep -o '[0-9]*')
    if [ "$vulnerabilities" -gt 0 ]; then
        echo -e "   ${YELLOW}⚠️  Found $vulnerabilities vulnerabilities${NC}"
        echo -e "      ${YELLOW}Run: npm audit fix${NC}"
        ((warnings++))
    else
        echo -e "   ${GREEN}✅ No known vulnerabilities${NC}"
    fi
else
    echo -e "   ${GREEN}✅ No known vulnerabilities${NC}"
fi

# ========================================
# 12. Check CORS configuration
# ========================================
echo -e "\n${YELLOW}🌐 Checking CORS configuration...${NC}"
if [ -f ".env" ]; then
    origins=$(grep "ALLOW_ORIGINS=" .env | cut -d '=' -f2)
    if [[ "$origins" == *"localhost"* ]]; then
        echo -e "   ${YELLOW}⚠️  ALLOW_ORIGINS contains 'localhost'${NC}"
        echo -e "      ${YELLOW}Update to production domain(s)${NC}"
        ((warnings++))
    else
        echo -e "   ${GREEN}✅ CORS origins configured${NC}"
    fi
fi

# ========================================
# Final Summary
# ========================================
echo -e "\n${CYAN}============================================${NC}"
echo -e "${CYAN}  Summary${NC}"
echo -e "${CYAN}============================================${NC}"

if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All checks passed!${NC}"
    echo -e "${GREEN}✅ Your application is ready for production deployment${NC}\n"
    exit 0
elif [ $errors -eq 0 ]; then
    echo -e "\n${YELLOW}⚠️  $warnings warning(s) found${NC}"
    echo -e "   ${YELLOW}Review warnings above before deploying${NC}\n"
    exit 0
else
    echo -e "\n${RED}❌ $errors error(s) and $warnings warning(s) found${NC}"
    echo -e "   ${RED}Fix all errors before deploying to production${NC}\n"
    exit 1
fi
