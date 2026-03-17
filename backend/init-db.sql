-- Initialize database for NestJS application
-- This file runs automatically when PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- You can add initial database setup here
-- Tables will be created automatically by TypeORM migrations

-- Example: Create a test user (optional)
-- INSERT INTO users (id, email, password) VALUES (uuid_generate_v4(), 'test@example.com', 'hashed_password');
