-- Add decline_reason and declined_at columns to restaurants table for merchant cooldown system
ALTER TABLE restaurants ADD COLUMN decline_reason TEXT AFTER status;
ALTER TABLE restaurants ADD COLUMN declined_at DATETIME AFTER decline_reason;
