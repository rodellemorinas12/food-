-- =====================================================
-- FIX RESTAURANT IMAGES - Run this in MySQL
-- Database: food_delivery
-- =====================================================

USE food_delivery;

-- =====================================================
-- STEP 1: Add status column if needed
-- The Flutter app queries for status=active
-- =====================================================
-- Add status column (MySQL syntax - run manually if needed)
-- ALTER TABLE restaurants ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- Set all existing restaurants to active status
UPDATE restaurants SET status = 'active' WHERE status IS NULL OR status = '';

-- =====================================================
-- STEP 2: Update restaurant images with working URLs
-- Using Unsplash placeholder images that work reliably
-- =====================================================
UPDATE restaurants 
SET image_url = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' 
WHERE id = 1;

UPDATE restaurants 
SET image_url = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400' 
WHERE id = 2;

UPDATE restaurants 
SET image_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' 
WHERE id = 3;

-- =====================================================
-- STEP 3: Also update menu items with images
-- =====================================================
-- Update menu items for restaurant 1
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400' WHERE restaurant_id = 1 AND name = 'Tapa';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1548943487-a2e4e43b485c?w=400' WHERE restaurant_id = 1 AND name = 'Longganisa';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' WHERE restaurant_id = 1 AND name = 'Tilsimilog';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400' WHERE restaurant_id = 1 AND name = 'Grilled Chicken';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400' WHERE restaurant_id = 1 AND name = 'Coke';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400' WHERE restaurant_id = 1 AND name = 'Halo-Halo';

-- =====================================================
-- STEP 4: Verify the updates
-- =====================================================
SELECT id, name, image_url, status, is_open FROM restaurants;
SELECT id, name, image_url FROM menu_items WHERE restaurant_id IN (1,2,3);
