-- SQL Script to Update contacts table with new fields
-- Run this in MySQL Workbench or command line

USE react_admin_db;

-- Add new columns to contacts table (if they don't exist)
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS age INT AFTER name,
ADD COLUMN IF NOT EXISTS city VARCHAR(100) AFTER address2,
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20) AFTER city;

-- Verify the table structure
DESCRIBE contacts;

-- Sample data with new fields
INSERT INTO contacts (name, age, email, phone, address1, address2, city, zip_code, registrarId)
VALUES ('John Doe', 30, 'john@example.com', '555-1234', '123 Main St', 'Apt 4B', 'New York', '10001', 1);

SELECT * FROM contacts;
