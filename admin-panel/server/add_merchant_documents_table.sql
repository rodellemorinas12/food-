-- Add documents table to store applicant submitted documents
-- This table stores business permits, IDs, and other verification documents

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

-- Insert sample documents for existing merchants (optional - for testing)
-- This will be populated when merchants upload documents through the application form
