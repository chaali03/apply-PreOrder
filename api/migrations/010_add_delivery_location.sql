-- Add delivery_location field to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_location VARCHAR(50) DEFAULT 'TB';

-- Add comment
COMMENT ON COLUMN orders.delivery_location IS 'Delivery location: TB (Dalam TB) or Luar TB (Di luar TB)';
