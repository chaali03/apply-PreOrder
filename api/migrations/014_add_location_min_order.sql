-- Add min_order_tb and min_order_luar_tb columns to products table
ALTER TABLE products 
ADD COLUMN min_order_tb INTEGER DEFAULT 1,
ADD COLUMN min_order_luar_tb INTEGER DEFAULT 1,
ADD COLUMN available_days_tb TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
ADD COLUMN available_days_luar_tb TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

-- Update existing products to use current min_order value for both
UPDATE products SET min_order_tb = min_order, min_order_luar_tb = min_order;
