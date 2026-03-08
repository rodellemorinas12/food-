-- ============================================
-- MERCHANT FULL SYSTEM SCHEMA
-- Complete Database Design for Merchant Flow
-- ============================================

USE food_delivery_db;

-- ============================================
-- PHASE 1: USER ACCOUNTS WITH ROLES
-- ============================================

-- Add role column to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('customer', 'merchant', 'admin', 'rider') DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('active', 'pending', 'suspended', 'deactivated') DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============================================
-- PHASE 2: MERCHANT DOCUMENTS
-- Enhanced merchant_documents table with status tracking
-- ============================================

DROP TABLE IF EXISTS merchant_documents;

CREATE TABLE merchant_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    notes TEXT,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_merchant_docs_merchant (merchant_id),
    INDEX idx_merchant_docs_status (status)
);

-- ============================================
-- PHASE 3: MENU ISOLATION
-- Ensure each merchant only sees their own menu
-- ============================================

-- Menu items are already linked to restaurant_id
-- The API must filter by restaurant_id to ensure isolation
-- See routes.js for proper menu item queries

-- ============================================
-- PHASE 4: ORDER TO PAYOUT SYSTEM
-- ============================================

-- Create commissions table for tracking earnings
DROP TABLE IF EXISTS commissions;

CREATE TABLE commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    restaurant_id INT NOT NULL,
    rider_id INT,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    commission_amount DECIMAL(10,2) NOT NULL,
    merchant_earnings DECIMAL(10,2) NOT NULL,
    rider_earnings DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('pending', 'calculated', 'paid', 'disputed') DEFAULT 'calculated',
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE SET NULL,
    INDEX idx_commissions_restaurant (restaurant_id),
    INDEX idx_commissions_status (status),
    INDEX idx_commissions_order (order_id)
);

-- Create payouts table for merchant payments
DROP TABLE IF EXISTS merchant_payouts;

CREATE TABLE merchant_payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'PHP',
    payment_method VARCHAR(50),
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_account_name VARCHAR(100),
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    reference_number VARCHAR(100),
    processed_by INT,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payouts_restaurant (restaurant_id),
    INDEX idx_payouts_status (status)
);

-- Create payout_items table to link payouts with commissions
DROP TABLE IF EXISTS payout_items;

CREATE TABLE payout_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payout_id INT NOT NULL,
    commission_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payout_id) REFERENCES merchant_payouts(id) ON DELETE CASCADE,
    FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE CASCADE,
    INDEX idx_payout_items_payout (payout_id)
);

-- ============================================
-- PHASE 5: RESTAURANT WALLET (Optional)
-- For tracking merchant balance
-- ============================================

DROP TABLE IF EXISTS restaurant_wallets;

CREATE TABLE restaurant_wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    pending_balance DECIMAL(10,2) DEFAULT 0.00,
    total_earned DECIMAL(10,2) DEFAULT 0.00,
    total_paid_out DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_wallet_restaurant (restaurant_id)
);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Update existing restaurants with proper status
UPDATE restaurants SET status = 'active' WHERE status IS NULL OR status = '';

-- Create wallet for each restaurant
INSERT INTO restaurant_wallets (restaurant_id, balance, pending_balance) 
SELECT id, 0.00, 0.00 FROM restaurants
ON DUPLICATE KEY UPDATE balance = balance;

-- Sample merchant documents (for testing)
INSERT INTO merchant_documents (merchant_id, document_type, file_name, file_url, status) VALUES
(1, 'business_permit', 'Business Permit 2024', '/uploads/doc-1-permit.jpg', 'approved'),
(1, 'dti_registration', 'DTI Registration', '/uploads/doc-1-dti.jpg', 'approved'),
(1, 'valid_id', 'Owner Valid ID', '/uploads/doc-1-id.jpg', 'approved'),
(1, 'bir_certificate', 'BIR Certificate', '/uploads/doc-1-bir.jpg', 'approved'),
(1, 'bank_proof', 'Bank Account Proof', '/uploads/doc-1-bank.jpg', 'pending'),
(2, 'business_permit', 'Business Permit 2024', '/uploads/doc-2-permit.jpg', 'approved'),
(2, 'dti_registration', 'DTI Registration', '/uploads/doc-2-dti.jpg', 'pending'),
(2, 'valid_id', 'Owner Valid ID', '/uploads/doc-2-id.jpg', 'approved'),
(3, 'business_permit', 'Business Permit 2024', '/uploads/doc-3-permit.jpg', 'pending'),
(3, 'dti_registration', 'DTI Registration', '/uploads/doc-3-dti.jpg', 'pending');

-- Update users to have roles
UPDATE users SET role = 'merchant' WHERE email LIKE '%restaurant%' OR email LIKE '%merchant%';
UPDATE users SET role = 'admin' WHERE email = 'admin@admin.com';
