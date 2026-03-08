-- Sample merchant documents for testing
-- Run this SQL after the merchant_documents table is created

USE food_delivery_db;

-- Add sample documents for existing merchants (assuming merchant IDs 1, 2, 3 exist)
-- Note: Adjust merchant_id values based on your actual data

-- Documents for merchant 1 (Tapsilugan ni Juan)
INSERT INTO merchant_documents (merchant_id, document_type, document_name, document_url) VALUES
(1, 'business_permit', 'Business Permit 2024', '/uploads/document-1-permit.pdf'),
(1, 'id', 'Owner Government ID', '/uploads/document-1-id.jpg'),
(1, 'photo', 'Restaurant Photo', '/uploads/document-1-photo.jpg');

-- Documents for merchant 2 (Lolas Karinderya)
INSERT INTO merchant_documents (merchant_id, document_type, document_name, document_url) VALUES
(2, 'business_permit', 'Business Permit 2024', '/uploads/document-2-permit.pdf'),
(2, 'id', 'Owner Government ID', '/uploads/document-2-id.jpg');

-- Documents for merchant 3 (Bayanihan Grill)
INSERT INTO merchant_documents (merchant_id, document_type, document_name, document_url) VALUES
(3, 'business_permit', 'Business Permit 2024', '/uploads/document-3-permit.pdf'),
(3, 'id', 'Owner Government ID', '/uploads/document-3-id.jpg'),
(3, 'photo', 'Restaurant Interior Photo', '/uploads/document-3-interior.jpg'),
(3, 'signature', 'Partnership Agreement', '/uploads/document-3-agreement.pdf');
