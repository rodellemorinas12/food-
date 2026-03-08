-- Food Riders Local Database Schema
-- Compatible with both Flutter App and React Admin Dashboard

CREATE DATABASE IF NOT EXISTS food_delivery_db;
USE food_delivery_db;

-- Drop existing tables (in reverse order)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS merchant_documents;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS users;

-- Create Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Restaurants Table
CREATE TABLE restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    banner_url VARCHAR(500),
    cuisine_type VARCHAR(100),
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    delivery_time VARCHAR(50),
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_open BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'pending',
    phone VARCHAR(50),
    email VARCHAR(255),
    city VARCHAR(100),
    opening_hours VARCHAR(100),
    min_order_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Merchant Documents Table
CREATE TABLE merchant_documents (
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

-- Create Menu Items Table
CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(100),
    is_available BOOLEAN DEFAULT TRUE,
    preparation_time INT DEFAULT 20,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create Orders Table
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT,
    restaurant_id INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    tax DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    delivery_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

-- Create Order Items Table
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    food_item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (food_item_id) REFERENCES menu_items(id)
);

-- Create Riders Table (for admin dashboard)
CREATE TABLE riders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    vehicle_type VARCHAR(50),
    status ENUM('available', 'busy', 'offline') DEFAULT 'offline',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_deliveries INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Transactions Table (for admin dashboard)
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    txId VARCHAR(100) UNIQUE NOT NULL,
    user VARCHAR(255),
    cost DECIMAL(10,2),
    order_id VARCHAR(50),
    order_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Data

-- Sample Users
INSERT INTO users (name, email, phone_number) VALUES
('John Doe', 'john@example.com', '09123456789'),
('Jane Smith', 'jane@example.com', '09123456790'),
('Roberto Cruz', 'roberto@example.com', '09123456791');

-- Sample Restaurants
INSERT INTO restaurants (name, description, cuisine_type, rating, delivery_time, delivery_fee, address, is_open) VALUES
('Tapsilugan Grill House', 'Best Filipino breakfast and grill in Teresa', 'Filipino', 4.8, '20-30 min', 30.00, 'Brgy. Poblacion, Teresa, Rizal', TRUE, 'active', '09123456701', 'tapsilog@example.com', 'Rizal'),
('Local Bites', 'Authentic local cuisine', 'Filipino', 4.7, '25-35 min', 25.00, 'Brgy. San Jose, Teresa, Rizal', TRUE, 'active', '09123456702', 'localbites@example.com', 'Rizal'),
('Teresa Food Center', 'Various local dishes', 'Mixed', 4.9, '15-25 min', 20.00, 'Brgy. Capitol, Teresa, Rizal', TRUE, 'pending', '09123456703', 'teresafood@example.com', 'Rizal');

-- Sample Menu Items
INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
(1, 'Tapa', 'Marinated beef tapa with garlic rice', 150.00, 'Breakfast'),
(1, 'Longganisa', 'Sweet Filipino sausage with garlic rice', 120.00, 'Breakfast'),
(1, 'Tilsimilog', 'Tapa, longganisa, and egg combo', 180.00, 'Breakfast'),
(1, 'Grilled Chicken', 'Chicken inasal with rice', 140.00, 'Lunch'),
(2, 'Adobo', 'Chicken adobo with rice', 130.00, 'Lunch'),
(2, 'Sinigang', 'Sour soup with pork', 160.00, 'Lunch'),
(3, 'Kare-Kare', 'Oxtail peanut stew', 200.00, 'Dinner'),
(3, 'Lechon Kawali', 'Crispy pork belly', 180.00, 'Dinner');

-- Sample Orders
INSERT INTO orders (id, user_id, restaurant_id, subtotal, delivery_fee, tax, total, status, payment_method, delivery_address) VALUES
('ORD-001-001', 1, 1, 180, 30, 15, 225, 'delivered', 'cash', 'Brgy. Poblacion, Teresa, Rizal'),
('ORD-001-002', 2, 2, 130, 25, 10, 165, 'pending', 'gcash', 'Brgy. San Jose, Teresa, Rizal'),
('ORD-001-003', 3, 1, 320, 30, 25, 375, 'preparing', 'cash', 'Brgy. Capitol, Teresa, Rizal');

-- Sample Merchant Documents
INSERT INTO merchant_documents (merchant_id, document_type, document_name, document_url) VALUES
(1, 'business_permit', 'Business Permit 2024', '/uploads/document-1-permit.jpg'),
(1, 'id', 'Owner Government ID', '/uploads/document-1-id.jpg'),
(1, 'photo', 'Restaurant Photo', '/uploads/document-1-photo.jpg'),
(2, 'business_permit', 'Business Permit 2024', '/uploads/document-2-permit.jpg'),
(2, 'id', 'Owner Government ID', '/uploads/document-2-id.jpg'),
(3, 'business_permit', 'Business Permit Application', '/uploads/document-3-permit.jpg');

-- Sample Order Items
INSERT INTO order_items (order_id, food_item_id, quantity, price) VALUES
('ORD-001-001', 3, 1, 180),
('ORD-001-002', 5, 1, 130),
('ORD-001-003', 2, 2, 240),
('ORD-001-003', 4, 1, 140);
