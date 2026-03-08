-- Run this SQL to fix the merchant documents issue
-- This creates the merchant_documents table and adds sample data

USE food_delivery_db;

-- Create merchant_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS merchant_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_merchant_documents_merchant_id ON merchant_documents(merchant_id);

-- Check existing restaurants to see their IDs
-- SELECT id, name FROM restaurants;

-- Add sample documents for merchant ID 1 (adjust based on your actual restaurant IDs)
INSERT INTO merchant_documents (merchant_id, document_type, document_name, document_url) VALUES
(1, 'business_permit', 'Business Permit 2024', '/uploads/document-1-permit.jpg'),
(1, 'id', 'Owner Government ID', '/uploads/document-1-id.jpg'),
(1, 'photo', 'Restaurant Photo', '/uploads/document-1-photo.jpg');

-- Add sample documents for merchant ID 2
INSERT INTO merchant_documents (merchant_id, document_type, document_name, document_url) VALUES
(2, 'business_permit', 'Business Permit 2024', '/uploads/document-2-permit.jpg'),
(2, 'id', 'Owner Government ID', '/uploads/document-2-id.jpg');

-- Add sample documents for merchant ID 3
INSERT INTO merchant_documents (merchant_id, document_type, document_name, document_url) VALUES
(3, 'business_permit', 'Business Permit 2024', '/uploads/document-3-permit.jpg'),
(3, 'id', 'Owner Government ID', '/uploads/document-3-id.jpg'),
(3, 'photo', 'Restaurant Interior Photo', '/uploads/document-3-interior.jpg'),
(3, 'signature', 'Partnership Agreement', '/uploads/document-3-agreement.pdf');

-- Verify the data
-- SELECT * FROM merchant_documents;
