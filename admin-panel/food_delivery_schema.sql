-- Food Delivery App MySQL Database Schema
-- For XAMPP/WAMP Local Development

-- Create Database
CREATE DATABASE IF NOT EXISTS food_delivery_db;
USE food_delivery_db;

-- Drop existing tables (in reverse order)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;
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
    opening_hours VARCHAR(100),
    min_order_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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

-- Insert Sample Users
INSERT INTO users (name, email, phone_number) VALUES
('Juan Dela Cruz', 'juan@email.com', '+639123456789'),
('Maria Santos', 'maria@email.com', '+639234567890'),
('Pedro Garcia', 'pedro@email.com', '+639345678901');

-- Insert Sample Restaurants
INSERT INTO restaurants (name, description, cuisine_type, rating, review_count, delivery_time, delivery_fee, address, latitude, longitude, is_open, opening_hours, min_order_amount) VALUES
('Tapsilugan ni Juan', 'Pinoy-style grilled meats and Filipino favorites. Sarap!', 'Filipino', 4.70, 156, '20-30 min', 0.00, '123 Mabini St., Barangay Poblacion', 14.5995, 120.9842, TRUE, '10:00 AM - 9:00 PM', 100),
('Lolas Karinderya', 'Home-cooked Filipino dishes. Tulad ng sa bahay!', 'Filipino', 4.50, 89, '25-35 min', 20.00, '456 San Miguel Ave.', 14.6011, 120.9810, TRUE, '7:00 AM - 7:00 PM', 150),
('Bayanihan Grill', 'Authentic Philippine barbecue and grilled specialties', 'Filipino BBQ', 4.60, 124, '30-40 min', 25.00, '789 Quezon Blvd.', 14.6038, 120.9798, TRUE, '11:00 AM - 10:00 PM', 200);

-- Insert Menu Items for Tapsilugan ni Juan (restaurant_id = 1)
INSERT INTO menu_items (restaurant_id, name, description, price, category, preparation_time, rating, review_count) VALUES
(1, 'Classic Tapsilog', 'Beef tapa with garlic rice and fried egg. Our bestseller!', 99.00, 'Tapsilog', 10, 4.90, 89),
(1, 'Special Tapsilog', 'Premium beef tapa with extra garlic rice', 129.00, 'Tapsilog', 12, 4.80, 45),
(1, 'Porksilog', 'Crispy fried pork with garlic rice and egg', 89.00, 'Porksilog', 10, 4.60, 67),
(1, 'Sisig Plate', 'Sizzling pork sisig with rice. Perfect ulam!', 119.00, 'Sisig', 8, 4.80, 112),
(1, 'Chickensilog', 'Grilled chicken breast with garlic rice', 79.00, 'Tapsilog', 10, 4.50, 34),
(1, 'Coke 1.5L', 'Coca-Cola 1.5 Liter Bottle', 50.00, 'Drinks', 1, 4.90, 200),
(1, 'Java Rice', 'Flavorful brown rice with shrimp paste flavor', 30.00, 'Extras', 3, 4.40, 78);

-- Insert Menu Items for Lola's Karinderya (restaurant_id = 2)
INSERT INTO menu_items (restaurant_id, name, description, price, category, preparation_time, rating, review_count) VALUES
(2, 'Adobo Chicken', 'Classic Filipino adobo with chicken and rice', 110.00, 'Viands', 15, 4.70, 56),
(2, 'Sinigang na Baboy', 'Sour pork soup with vegetables', 130.00, 'Soup', 20, 4.80, 42),
(2, 'Pinakbet', 'Mixed vegetables with shrimp paste', 95.00, 'Viands', 12, 4.40, 28),
(2, 'Leche Flan', 'Classic Filipino caramel custard', 45.00, 'Desserts', 5, 4.90, 89);

-- Insert Menu Items for Bayanihan Grill (restaurant_id = 3)
INSERT INTO menu_items (restaurant_id, name, description, price, category, preparation_time, rating, review_count) VALUES
(3, 'BBQ Chicken (4 pcs)', '4 skewers of marinated grilled chicken', 150.00, 'BBQ', 15, 4.70, 67),
(3, 'BBQ Pork (3 pcs)', '3 skewers of sweet pork barbecue', 140.00, 'BBQ', 15, 4.60, 54),
(3, 'Family Platter', 'Assorted BBQ for 4-5 persons with rice', 450.00, 'Platters', 25, 4.90, 23);

-- Insert Sample Orders
INSERT INTO orders (id, user_id, restaurant_id, subtotal, delivery_fee, tax, total, status, payment_method, delivery_address) VALUES
('ORD-001', 1, 1, 228.00, 0.00, 20.00, 248.00, 'delivered', 'cash', '123 Main St., Manila'),
('ORD-002', 2, 2, 245.00, 20.00, 25.00, 290.00, 'pending', 'gcash', '456 Oak Ave., Quezon City'),
('ORD-003', 3, 3, 450.00, 25.00, 40.00, 515.00, 'preparing', 'credit_card', '789 Pine Rd., Makati'),
('ORD-004', 1, 1, 168.00, 0.00, 15.00, 183.00, 'out_for_delivery', 'cash', '123 Main St., Manila'),
('ORD-005', 2, 2, 175.00, 20.00, 18.00, 213.00, 'confirmed', 'gcash', '456 Oak Ave., Quezon City');

-- Insert Sample Order Items
INSERT INTO order_items (order_id, food_item_id, quantity, price, special_instructions) VALUES
('ORD-001', 1, 1, 99.00, ''),
('ORD-001', 7, 2, 30.00, 'Extra rice'),
('ORD-002', 9, 1, 110.00, ''),
('ORD-002', 10, 1, 130.00, 'Less sour'),
('ORD-003', 14, 2, 150.00, ''),
('ORD-004', 2, 1, 129.00, ''),
('ORD-004', 6, 1, 50.00, 'Cold'),
('ORD-005', 9, 1, 110.00, ''),
('ORD-005', 12, 1, 45.00, '');

-- Create Indexes for Performance
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX idx_restaurants_rating ON restaurants(rating DESC);
CREATE INDEX idx_restaurants_open ON restaurants(is_open);
CREATE INDEX idx_menu_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_category ON menu_items(category);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_food ON order_items(food_item_id);

-- Update order_items to reference orders by id (VARCHAR)
ALTER TABLE order_items MODIFY order_id VARCHAR(50);
