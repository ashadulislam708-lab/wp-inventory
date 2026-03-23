# Docker Setup Guide

This guide explains how to run the NestJS application using Docker.

## Prerequisites

- Docker Desktop installed
- Docker Compose installed (comes with Docker Desktop)

## Quick Start

### 1. Development Mode

```bash
# Copy environment file
cp .env.docker .env

# Start all services in development mode
docker-compose --profile dev up

# Or run in detached mode
docker-compose --profile dev up -d

# View logs
docker-compose logs -f app-dev
```

The application will be available at `http://localhost:3000` with hot reload enabled.

### 2. Production Mode

```bash
# Build and start production containers
docker-compose --profile prod up -d

# View logs
docker-compose logs -f app-prod
```

## Available Commands

### Start Services

```bash
# Development mode with hot reload
docker-compose --profile dev up

# Production mode
docker-compose --profile prod up

# Start only database and redis
docker-compose up postgres redis
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

### Rebuild Images

```bash
# Rebuild development image
docker-compose build app-dev

# Rebuild production image
docker-compose build app-prod

# Force rebuild without cache
docker-compose build --no-cache app-prod
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app-dev
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Execute Commands in Container

```bash
# Access container shell
docker-compose exec app-dev sh

# Run migrations
docker-compose exec app-dev npm run migration:run

# Run seeds
docker-compose exec app-dev npm run seed:run

# Run linting
docker-compose exec app-dev npm run lint

# Run tests
docker-compose exec app-dev npm test
```

## Database Management

### Run Migrations

```bash
# Inside container
docker-compose exec app-dev npm run migration:run

# Revert migration
docker-compose exec app-dev npm run migration:revert

# Generate migration
docker-compose exec app-dev npm run migration:generate -- --name=MigrationName
```

### Access PostgreSQL

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d nestjs_db

# Backup database
docker-compose exec postgres pg_dump -U postgres nestjs_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres -d nestjs_db < backup.sql
```

### Access Redis

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli -a redis

# Check Redis keys
docker-compose exec redis redis-cli -a redis KEYS '*'
```

## Environment Variables

Create a `.env` file based on `.env.docker`:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=nestjs_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
```

## Docker Files Explained

### `Dockerfile`

- Multi-stage build for production
- Optimized image size
- Only includes production dependencies

### `Dockerfile.dev`

- Development image with hot reload
- Includes all dev dependencies
- Mounts source code for live updates

### `docker-compose.yml`

- Orchestrates all services
- PostgreSQL, Redis, and NestJS app
- Separate profiles for dev and prod

### `.dockerignore`

- Excludes unnecessary files from Docker build
- Reduces image size and build time

## Troubleshooting

### Port Already in Use

```bash
# Change ports in .env file
PORT=3001
DB_PORT=5433
REDIS_PORT=6380
```

### Database Connection Issues

```bash
# Check if PostgreSQL is healthy
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart services
docker-compose restart postgres app-dev
```

### Clear Everything and Start Fresh

```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose --profile dev up --build
```

### Permission Issues (Linux/Mac)

```bash
# Fix logs directory permissions
sudo chown -R $USER:$USER logs

# Or create logs directory with proper permissions
mkdir -p logs && chmod 755 logs
```

## Production Deployment

For production deployment:

1. Use `docker-compose.prod.yml`
2. Set strong passwords in `.env`
3. Use environment variables from your CI/CD
4. Enable HTTPS with Nginx reverse proxy
5. Set up proper backup strategies

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# With Nginx
docker-compose -f docker-compose.prod.yml --profile nginx up -d
```

## Best Practices

1. **Never commit `.env` files** - Use `.env.example` instead
2. **Use secrets management** in production (AWS Secrets Manager, HashiCorp Vault)
3. **Regular backups** of PostgreSQL database
4. **Monitor logs** and set up alerting
5. **Use health checks** to ensure services are running
6. **Keep images updated** regularly for security patches

## Health Checks

The application includes health checks:

```bash
# Check application health
curl http://localhost:3000/health

# Check in Docker
docker-compose ps
# Should show "healthy" status
```

## Scaling

```bash
# Scale application instances
docker-compose --profile prod up -d --scale app-prod=3

# Use a load balancer (Nginx) to distribute traffic
```

## Performance Tips

1. Use `.dockerignore` to exclude unnecessary files
2. Multi-stage builds reduce image size
3. Use alpine base images when possible
4. Cache npm dependencies in separate layer
5. Use volumes for node_modules in development
