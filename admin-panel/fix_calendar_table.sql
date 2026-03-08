-- Migration script to fix calendar_events table
-- Run this in your MySQL database

-- Add missing columns to calendar_events table
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'general' AFTER `end`,
ADD COLUMN IF NOT EXISTS description TEXT AFTER event_type,
ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#1976d2' AFTER description,
ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT FALSE AFTER color;

-- Verify the table structure
DESCRIBE calendar_events;
