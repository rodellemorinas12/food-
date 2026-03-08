-- Commission and Subscription Tracking Schema
-- For Philippine Food Delivery Platform

-- Add to existing react_admin_db database
USE react_admin_db;

-- ==================== COMMISSION TABLES ====================

-- Create commissions table to track restaurant commissions
CREATE TABLE IF NOT EXISTS restaurant_commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    order_id INT NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL COMMENT 'Commission rate percentage (10-20%)',
    order_total DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    platform_cut DECIMAL(10,2) DEFAULT 0.00,
    restaurant_earnings DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'disputed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Create delivery_fees table to track per-delivery earnings
CREATE TABLE IF NOT EXISTS delivery_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rider_id INT NOT NULL,
    order_id INT NOT NULL,
    base_fee DECIMAL(10,2) NOT NULL DEFAULT 20.00 COMMENT 'Base delivery fee',
    distance_surcharge DECIMAL(10,2) DEFAULT 0.00,
    total_fee DECIMAL(10,2) NOT NULL,
    platform_cut DECIMAL(10,2) DEFAULT 0.00,
    rider_earnings DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'disputed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    FOREIGN KEY (rider_id) REFERENCES riders(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ==================== RIDER SUBSCRIPTION TABLES ====================

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    plan_type ENUM('weekly', 'monthly') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    features JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create rider_subscriptions table
CREATE TABLE IF NOT EXISTS rider_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rider_id INT NOT NULL UNIQUE,
    plan_id INT NOT NULL,
    subscription_start DATE NOT NULL,
    subscription_end DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled', 'pending') DEFAULT 'pending',
    payment_status ENUM('paid', 'unpaid', 'refunded') DEFAULT 'unpaid',
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(100),
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rider_id) REFERENCES riders(id),
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rider_subscription_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(100) UNIQUE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('success', 'failed', 'refunded') DEFAULT 'success',
    notes TEXT,
    FOREIGN KEY (rider_subscription_id) REFERENCES rider_subscriptions(id)
);

-- ==================== EARNINGS SUMMARY TABLES ====================

-- Create platform_earnings table for daily/monthly summaries
CREATE TABLE IF NOT EXISTS platform_earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    period_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    total_orders INT DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    restaurant_commissions DECIMAL(10,2) DEFAULT 0.00,
    delivery_fees_collected DECIMAL(10,2) DEFAULT 0.00,
    rider_subscriptions DECIMAL(10,2) DEFAULT 0.00,
    gross_earnings DECIMAL(12,2) DEFAULT 0.00,
    net_earnings DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_period (date, period_type)
);

-- ==================== INSERT DEFAULT SUBSCRIPTION PLANS ====================

INSERT INTO subscription_plans (name, plan_type, price, description, features) VALUES
('Weekly Access', 'weekly', 99.00, '7-day access to delivery jobs', '{"features": ["Unlimited job access", "Priority dispatch", "24/7 support"]}'),
('Monthly Access', 'monthly', 299.00, '30-day access to delivery jobs', '{"features": ["Unlimited job access", "Priority dispatch", "24/7 support", "5% earnings bonus"]}'),
('Daily Pass', 'daily', 29.00, '24-hour access to delivery jobs', '{"features": ["Unlimited job access", "Standard dispatch"]}');

-- ==================== INDEXES ====================

CREATE INDEX idx_commissions_restaurant ON restaurant_commissions(restaurant_id);
CREATE INDEX idx_commissions_order ON restaurant_commissions(order_id);
CREATE INDEX idx_commissions_status ON restaurant_commissions(status);
CREATE INDEX idx_delivery_fees_rider ON delivery_fees(rider_id);
CREATE INDEX idx_delivery_fees_order ON delivery_fees(order_id);
CREATE INDEX idx_rider_subs_rider ON rider_subscriptions(rider_id);
CREATE INDEX idx_rider_subs_status ON rider_subscriptions(status);
CREATE INDEX idx_subscription_payments_sub ON subscription_payments(rider_subscription_id);
CREATE INDEX idx_platform_earnings_date ON platform_earnings(date);

-- ==================== VIEWS FOR REPORTING ====================

-- View: Daily earnings summary
CREATE OR REPLACE VIEW v_daily_earnings AS
SELECT 
    DATE(created_at) as earnings_date,
    COUNT(*) as total_orders,
    SUM(total_cost) as total_revenue,
    SUM(commission_amount) as total_commissions,
    SUM(delivery_fee) as total_delivery_fees
FROM restaurant_commissions rc
JOIN orders o ON rc.order_id = o.id
WHERE rc.status = 'paid'
GROUP BY DATE(created_at);

-- View: Rider subscription summary
CREATE OR REPLACE VIEW v_rider_subscriptions AS
SELECT 
    r.id as rider_id,
    r.name as rider_name,
    r.email,
    r.status as rider_status,
    sp.name as plan_name,
    sp.plan_type,
    sp.price,
    rs.subscription_start,
    rs.subscription_end,
    rs.status as subscription_status,
    rs.payment_status
FROM riders r
LEFT JOIN rider_subscriptions rs ON r.id = rs.rider_id
LEFT JOIN subscription_plans sp ON rs.plan_id = sp.id;

-- View: Restaurant commission summary
CREATE OR REPLACE VIEW v_restaurant_commissions AS
SELECT 
    rest.id as restaurant_id,
    rest.name as restaurant_name,
    COUNT(rc.id) as total_orders,
    AVG(rc.commission_rate) as avg_commission_rate,
    SUM(rc.commission_amount) as total_commissions,
    SUM(rc.restaurant_earnings) as restaurant_earnings
FROM restaurants rest
LEFT JOIN restaurant_commissions rc ON rest.id = rc.restaurant_id
GROUP BY rest.id;

-- ==================== STORED PROCEDURES ====================

-- Procedure: Calculate and record daily earnings
DELIMITER //
CREATE PROCEDURE sp_calculate_daily_earnings(IN p_date DATE)
BEGIN
    DECLARE v_total_orders INT;
    DECLARE v_total_revenue DECIMAL(12,2);
    DECLARE v_commissions DECIMAL(10,2);
    DECLARE v_delivery_fees DECIMAL(10,2);
    DECLARE v_subscriptions DECIMAL(10,2);
    DECLARE v_gross_earnings DECIMAL(12,2);
    DECLARE v_net_earnings DECIMAL(12,2);

    -- Calculate restaurant commissions
    SELECT 
        COUNT(*),
        COALESCE(SUM(rc.commission_amount), 0)
    INTO v_total_orders, v_commissions
    FROM restaurant_commissions rc
    WHERE DATE(rc.created_at) = p_date;

    -- Calculate delivery fees
    SELECT COALESCE(SUM(df.platform_cut), 0)
    INTO v_delivery_fees
    FROM delivery_fees df
    WHERE DATE(df.created_at) = p_date;

    -- Calculate subscription revenue
    SELECT COALESCE(SUM(sp.amount), 0)
    INTO v_subscriptions
    FROM subscription_payments sp
    WHERE DATE(sp.payment_date) = p_date;

    -- Calculate totals
    SELECT COALESCE(SUM(o.total_cost), 0)
    INTO v_total_revenue
    FROM orders o
    WHERE DATE(o.created_at) = p_date;

    SET v_gross_earnings = v_commissions + v_delivery_fees + v_subscriptions;
    SET v_net_earnings = v_gross_earnings * 0.85; -- 15% platform fee

    -- Insert or update daily earnings
    INSERT INTO platform_earnings (date, period_type, total_orders, total_revenue, restaurant_commissions, delivery_fees_collected, rider_subscriptions, gross_earnings, net_earnings)
    VALUES (p_date, 'daily', v_total_orders, v_total_revenue, v_commissions, v_delivery_fees, v_subscriptions, v_gross_earnings, v_net_earnings)
    ON DUPLICATE KEY UPDATE
        total_orders = v_total_orders,
        total_revenue = v_total_revenue,
        restaurant_commissions = v_commissions,
        delivery_fees_collected = v_delivery_fees,
        rider_subscriptions = v_subscriptions,
        gross_earnings = v_gross_earnings,
        net_earnings = v_net_earnings,
        updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- ==================== VERIFICATION ====================
SELECT 'Commission and subscription schema imported!' AS status;
SELECT COUNT(*) as commission_plans FROM subscription_plans;
