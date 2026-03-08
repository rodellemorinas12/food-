-- Migration: Add security columns for enhanced password reset and rider authentication
-- Run this file to add necessary columns for the security fixes

-- Add reset_code_expires column to users table (for password reset expiration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires DATETIME NULL;

-- Add password column to riders table (for proper authentication)
ALTER TABLE riders ADD COLUMN IF NOT EXISTS password VARCHAR(255) NULL;

-- Note: After running this migration, existing riders will need their passwords set
-- For testing, you can update a rider's password with a hashed value:
-- UPDATE riders SET password = '$2a$10$YourHashedPasswordHere' WHERE id = 1;
