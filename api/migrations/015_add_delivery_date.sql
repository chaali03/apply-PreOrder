-- Add delivery_date column to orders table
ALTER TABLE orders 
ADD COLUMN delivery_date DATE;

-- Add index for faster queries
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
