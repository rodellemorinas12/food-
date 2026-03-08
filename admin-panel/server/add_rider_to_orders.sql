-- Add rider_id to orders table if not exists
-- This links orders to riders for delivery tracking

ALTER TABLE orders ADD COLUMN rider_id INT NULL;
ALTER TABLE orders ADD FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE SET NULL;

-- Create index for faster rider queries
CREATE INDEX idx_orders_rider ON orders(rider_id);
CREATE INDEX idx_orders_status ON orders(status);
