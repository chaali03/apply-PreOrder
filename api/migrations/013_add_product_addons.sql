-- Add addons column to products table
-- Addons are optional extras like cheese, sauce, etc with additional price

ALTER TABLE products ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '[]';

-- Example addons structure:
-- [
--   {"name": "Extra Keju", "price": 5000},
--   {"name": "Saos Pedas", "price": 2000},
--   {"name": "Mayones", "price": 3000}
-- ]

COMMENT ON COLUMN products.addons IS 'Optional add-ons with additional price (JSONB array)';
