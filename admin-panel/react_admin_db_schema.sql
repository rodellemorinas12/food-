-- React Admin Dashboard Database Schema
-- For MySQL/XAMPP Import
-- Database: react_admin_db

-- Create Database (if not exists)
CREATE DATABASE IF NOT EXISTS react_admin_db;
USE react_admin_db;

-- ==================== DROPPING EXISTING TABLES ====================
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS riders;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS dashboard_stats;
DROP TABLE IF EXISTS geography_data;
DROP TABLE IF EXISTS chart_data;
DROP TABLE IF EXISTS calendar_events;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS menu_items;

-- ==================== CORE TABLES ====================

-- Create teams table
CREATE TABLE teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    age INT,
    phone VARCHAR(20),
    access VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contacts table
CREATE TABLE contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    age INT,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address1 VARCHAR(255),
    address2 VARCHAR(255),
    city VARCHAR(100),
    zip_code VARCHAR(20),
    registrarId INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    cost INT,
    date VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create calendar_events table
CREATE TABLE calendar_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    start VARCHAR(100),
    end VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chart_data table
CREATE TABLE chart_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50) NOT NULL,
    month VARCHAR(20),
    revenue INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create geography_data table
CREATE TABLE geography_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    value INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dashboard_stats table
CREATE TABLE dashboard_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    emails_sent INT DEFAULT 0,
    sales_obtained INT DEFAULT 0,
    new_clients INT DEFAULT 0,
    traffic_received INT DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    emails_increase VARCHAR(10) DEFAULT '+0%',
    sales_increase VARCHAR(10) DEFAULT '+0%',
    clients_increase VARCHAR(10) DEFAULT '+0%',
    traffic_increase VARCHAR(10) DEFAULT '+0%',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== FOOD DELIVERY TABLES ====================

-- Create customers table
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create riders table
CREATE TABLE riders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    vehicle_type VARCHAR(50),
    status ENUM('available', 'busy', 'offline') DEFAULT 'offline',
    rating DECIMAL(3,2) DEFAULT 0,
    total_deliveries INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    rider_id INT,
    food_items JSON NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    delivery_address VARCHAR(255) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (rider_id) REFERENCES riders(id)
);

-- Create transactions table
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    txId VARCHAR(100) UNIQUE NOT NULL,
    user VARCHAR(100) NOT NULL,
    date VARCHAR(100),
    cost INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== NEW FOOD DELIVERY SCHEMA TABLES ====================

-- Create users table (new food delivery schema)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create restaurants table
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

-- Create menu_items table
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

-- Create order_items table
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    food_item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_food
        FOREIGN KEY (food_item_id)
        REFERENCES menu_items(id)
) ENGINE=InnoDB;


-- ==================== SAMPLE DATA ====================

-- Insert sample teams
INSERT INTO teams (name, email, age, phone, access) VALUES
('John Doe', 'john@example.com', 28, '+1234567890', 'admin'),
('Jane Smith', 'jane@example.com', 32, '+1234567891', 'user'),
('Bob Wilson', 'bob@example.com', 45, '+1234567892', 'manager'),
('Alice Brown', 'alice@example.com', 26, '+1234567893', 'user'),
('Charlie Davis', 'charlie@example.com', 38, '+1234567894', 'admin');

-- Insert sample contacts
INSERT INTO contacts (name, age, email, phone, address1, address2, city, zip_code) VALUES
('Mike Johnson', 35, 'mike@email.com', '+1234567895', '123 Main St', 'Apt 4B', 'New York', '10001'),
('Sarah Williams', 29, 'sarah@email.com', '+1234567896', '456 Oak Ave', NULL, 'Los Angeles', '90001'),
('Tom Brown', 42, 'tom@email.com', '+1234567897', '789 Pine Rd', 'Suite 100', 'Chicago', '60601');

-- Insert sample invoices
INSERT INTO invoices (name, email, phone, cost, date) VALUES
('Website Design', 'client1@email.com', '+1234567898', 5000, '2024-01-15'),
('SEO Services', 'client2@email.com', '+1234567899', 2500, '2024-01-20'),
('Consulting', 'client3@email.com', '+1234567900', 7500, '2024-02-01');

-- Insert sample calendar events
INSERT INTO calendar_events (title, start, end) VALUES
('Team Meeting', '2024-03-01 09:00:00', '2024-03-01 10:00:00'),
('Client Call', '2024-03-01 14:00:00', '2024-03-01 15:00:00'),
('Project Review', '2024-03-02 11:00:00', '2024-03-02 12:00:00');

-- Insert sample chart data
INSERT INTO chart_data (type, month, revenue) VALUES
('bar', 'January', 15000),
('bar', 'February', 18000),
('bar', 'March', 22000),
('line', 'January', 12000),
('line', 'February', 15000),
('line', 'March', 19000),
('pie', 'January', 8000),
('pie', 'February', 6000),
('pie', 'March', 10000);

-- Insert sample geography data
INSERT INTO geography_data (name, value) VALUES
('New York', 85000),
('Los Angeles', 72000),
('Chicago', 58000),
('Houston', 45000),
('Phoenix', 32000);

-- Insert dashboard stats
INSERT INTO dashboard_stats (emails_sent, sales_obtained, new_clients, traffic_received, revenue_generated, emails_increase, sales_increase, clients_increase, traffic_increase) VALUES
(1250, 45, 128, 15200, 45600.00, '+12%', '+8%', '+15%', '+5%');

-- Insert sample customers
INSERT INTO customers (name, email, phone, address, city) VALUES
('Juan Dela Cruz', 'juan@email.com', '+639123456789', '123 Main St', 'Manila'),
('Maria Santos', 'maria@email.com', '+639234567890', '456 Oak Ave', 'Quezon City'),
('Pedro Garcia', 'pedro@email.com', '+639345678901', '789 Pine Rd', 'Makati');

-- Insert sample riders
INSERT INTO riders (name, email, phone, vehicle_type, status, rating, total_deliveries) VALUES
('Mark Delivery', 'mark@email.com', '+639456789012', 'Motorcycle', 'available', 4.85, 150),
('Lisa Rider', 'lisa@email.com', '+639567890123', 'Bicycle', 'available', 4.72, 89),
('Paul Courier', 'paul@email.com', '+639678901234', 'Motorcycle', 'busy', 4.90, 220);

-- Insert sample orders
INSERT INTO orders (order_number, customer_id, rider_id, food_items, total_cost, delivery_address, status) VALUES
('ORD-001', 1, 1, '[{"name": "Classic Tapsilog", "quantity": 1, "price": 99}, {"name": "Coke 1.5L", "quantity": 1, "price": 50}]', 149.00, '123 Main St, Manila', 'delivered'),
('ORD-002', 2, 2, '[{"name": "Adobo Chicken", "quantity": 1, "price": 110}, {"name": "Sinigang na Baboy", "quantity": 1, "price": 130}]', 240.00, '456 Oak Ave, Quezon City', 'pending'),
('ORD-003', 3, NULL, '[{"name": "BBQ Chicken (4 pcs)", "quantity": 2, "price": 150}]', 300.00, '789 Pine Rd, Makati', 'preparing');

-- Insert sample transactions
INSERT INTO transactions (txId, user, date, cost) VALUES
('TXN-001', 'John Doe', '2024-03-01', 150),
('TXN-002', 'Jane Smith', '2024-03-02', 250),
('TXN-003', 'Bob Wilson', '2024-03-03', 350),
('TXN-004', 'Alice Brown', '2024-03-04', 450),
('TXN-005', 'Charlie Davis', '2024-03-05', 550);

-- Insert sample users (new food delivery schema)
INSERT INTO users (name, email, phone_number) VALUES
('Juan Dela Cruz', 'juan@email.com', '+639123456789'),
('Maria Santos', 'maria@email.com', '+639234567890'),
('Pedro Garcia', 'pedro@email.com', '+639345678901');

-- Insert sample restaurants
INSERT INTO restaurants (name, description, cuisine_type, rating, review_count, delivery_time, delivery_fee, address, latitude, longitude, is_open, opening_hours, min_order_amount) VALUES
('Tapsilugan ni Juan', 'Pinoy-style grilled meats and Filipino favorites. Sarap!', 'Filipino', 4.70, 156, '20-30 min', 0.00, '123 Mabini St., Barangay Poblacion', 14.5995, 120.9842, TRUE, '10:00 AM - 9:00 PM', 100),
('Lolas Karinderya', 'Home-cooked Filipino dishes. Tulad ng sa bahay!', 'Filipino', 4.50, 89, '25-35 min', 20.00, '456 San Miguel Ave.', 14.6011, 120.9810, TRUE, '7:00 AM - 7:00 PM', 150),
('Bayanihan Grill', 'Authentic Philippine barbecue and grilled specialties', 'Filipino BBQ', 4.60, 124, '30-40 min', 25.00, '789 Quezon Blvd.', 14.6038, 120.9798, TRUE, '11:00 AM - 10:00 PM', 200);

-- Insert sample menu items
INSERT INTO menu_items (restaurant_id, name, description, price, category, preparation_time, rating, review_count) VALUES
(1, 'Classic Tapsilog', 'Beef tapa with garlic rice and fried egg. Our bestseller!', 99.00, 'Tapsilog', 10, 4.90, 89),
(1, 'Special Tapsilog', 'Premium beef tapa with extra garlic rice', 129.00, 'Tapsilog', 12, 4.80, 45),
(1, 'Porksilog', 'Crispy fried pork with garlic rice and egg', 89.00, 'Porksilog', 10, 4.60, 67),
(1, 'Sisig Plate', 'Sizzling pork sisig with rice. Perfect ulam!', 119.00, 'Sisig', 8, 4.80, 112),
(1, 'Chickensilog', 'Grilled chicken breast with garlic rice', 79.00, 'Tapsilog', 10, 4.50, 34),
(1, 'Coke 1.5L', 'Coca-Cola 1.5 Liter Bottle', 50.00, 'Drinks', 1, 4.90, 200),
(1, 'Java Rice', 'Flavorful brown rice with shrimp paste flavor', 30.00, 'Extras', 3, 4.40, 78),
(2, 'Adobo Chicken', 'Classic Filipino adobo with chicken and rice', 110.00, 'Viands', 15, 4.70, 56),
(2, 'Sinigang na Baboy', 'Sour pork soup with vegetables', 130.00, 'Soup', 20, 4.80, 42),
(2, 'Pinakbet', 'Mixed vegetables with shrimp paste', 95.00, 'Viands', 12, 4.40, 28),
(2, 'Leche Flan', 'Classic Filipino caramel custard', 45.00, 'Desserts', 5, 4.90, 89),
(3, 'BBQ Chicken (4 pcs)', '4 skewers of marinated grilled chicken', 150.00, 'BBQ', 15, 4.70, 67),
(3, 'BBQ Pork (3 pcs)', '3 skewers of sweet pork barbecue', 140.00, 'BBQ', 15, 4.60, 54),
(3, 'Family Platter', 'Assorted BBQ for 4-5 persons with rice', 450.00, 'Platters', 25, 4.90, 23);

-- Insert sample order items
INSERT INTO order_items (order_id, food_item_id, quantity, price, special_instructions) VALUES
(1, 1, 1, 99.00, ''),
(1, 6, 1, 50.00, 'Extra rice'),
(2, 8, 1, 110.00, ''),
(2, 9, 1, 130.00, 'Less sour'),
(3, 12, 2, 150.00, '');

-- ==================== INDEXES ====================
CREATE INDEX idx_teams_email ON teams(email);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_riders_status ON riders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_menu_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_category ON menu_items(category);
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX idx_restaurants_rating ON restaurants(rating DESC);

-- ==================== VERIFICATION ====================
SELECT 'Database schema imported successfully!' AS status;
SELECT COUNT(*) AS team_count FROM teams;
SELECT COUNT(*) AS contact_count FROM contacts;
SELECT COUNT(*) AS customer_count FROM customers;
SELECT COUNT(*) AS rider_count FROM riders;
SELECT COUNT(*) AS order_count FROM orders;
SELECT COUNT(*) AS restaurant_count FROM restaurants;
SELECT COUNT(*) AS menu_item_count FROM menu_items;
