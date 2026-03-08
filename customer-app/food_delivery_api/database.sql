-- Food Delivery Database Schema
-- Create this database in MySQL for the Riders Local Food Delivery App

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS food_delivery;
USE food_delivery;

-- Admin table (from react-admin-dashboard)
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO admins (username, password) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE username=username;

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cuisine_type VARCHAR(50),
  image_url VARCHAR(255),
  delivery_fee DECIMAL(10, 2) DEFAULT 30.00,
  address VARCHAR(255),
  is_open BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active',  -- Added: for filtering active restaurants
  rating DECIMAL(3, 2) DEFAULT 0.00,
  review_count INT DEFAULT 0,
  delivery_time VARCHAR(50),
  opening_hours VARCHAR(100),
  min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(255),
  category VARCHAR(50),
  is_available BOOLEAN DEFAULT TRUE,
  preparation_time INT DEFAULT 15,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  customer_address TEXT,
  restaurant_id INT,
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) DEFAULT 50.00,
  status ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Insert sample restaurants
INSERT INTO restaurants (name, description, cuisine_type, image_url, delivery_fee, address, is_open, status, rating, delivery_time) VALUES
('Tapsilugan Grill House', ' authentic Filipino breakfast and grill house', 'Filipino', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', 30.00, 'Brgy. Poblacion, Teresa Rizal', TRUE, 'active', 4.5, '20-30 min'),
('Local Bites', 'Traditional Filipino comfort food', 'Filipino', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', 30.00, 'Brgy. San Jose, Teresa Rizal', TRUE, 'active', 4.3, '25-35 min'),
('Teresa Food Center', 'Mixed cuisine for everyone', 'Mixed', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 25.00, 'Brgy. Capitol, Teresa Rizal', TRUE, 'active', 4.7, '15-25 min');

-- Insert sample menu items for Restaurant 1 (Tapsilugan Grill House)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category, is_available) VALUES
(1, 'Tapa', 'Marinated beef tapa with garlic rice', 150.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', 'Breakfast', TRUE),
(1, 'Longganisa', 'Sweet Filipino sausage with garlic rice', 120.00, 'https://images.unsplash.com/photo-1548943487-a2e4e43b485c?w=400', 'Breakfast', TRUE),
(1, 'Tilsimilog', 'Tapa, longganisa, and egg combo', 180.00, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 'Breakfast', TRUE),
(1, 'Grilled Chicken', 'Chicken inasal with rice', 140.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', 'Lunch', TRUE),
(1, 'Coke', '500ml bottle', 50.00, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400', 'Drinks', TRUE),
(1, 'Halo-Halo', 'Mixed Filipino dessert', 80.00, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400', 'Desserts', TRUE);

-- Insert sample menu items for Restaurant 2 (Local Bites)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category, is_available) VALUES
(2, 'Adobo', 'Chicken adobo with rice', 130.00, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', 'Lunch', TRUE),
(2, 'Sinigang', 'Sour soup with pork', 160.00, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', 'Lunch', TRUE),
(2, ' Kare-Kare', 'Oxtail peanut stew', 200.00, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400', 'Dinner', TRUE),
(2, 'Lechon Kawali', 'Crispy pork belly', 180.00, 'https://images.unsplash.com/photo-1603360946369-dc9bb6f54262?w=400', 'Dinner', TRUE);

-- Insert sample menu items for Restaurant 3 (Teresa Food Center)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category, is_available) VALUES
(3, 'Mixed Sizzling Plate', 'Sizzling beef and pork with rice', 220.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', 'Meals', TRUE),
(3, 'Seafood Pakbet', 'Mixed seafood with vegetables', 250.00, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', 'Meals', TRUE),
(3, 'Fresh Lumpia', 'Fresh vegetable spring rolls', 80.00, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400', 'Snacks', TRUE);
