-- Add status, phone, email, and city columns to restaurants table for application management
ALTER TABLE restaurants ADD COLUMN status VARCHAR(20) DEFAULT 'pending' AFTER is_open;
ALTER TABLE restaurants ADD COLUMN phone VARCHAR(50) AFTER status;
ALTER TABLE restaurants ADD COLUMN email VARCHAR(255) AFTER phone;
ALTER TABLE restaurants ADD COLUMN city VARCHAR(100) AFTER email;

-- Update existing records to have 'active' status by default
UPDATE restaurants SET status = 'active' WHERE status IS NULL OR status = '';
