-- Add min_order column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_order INTEGER DEFAULT 1;

-- Update existing products to have min_order = 1
UPDATE products SET min_order = 1 WHERE min_order IS NULL;

-- Add constraint to ensure min_order is at least 1
ALTER TABLE products ADD CONSTRAINT check_min_order_positive CHECK (min_order >= 1);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Added min_order column to products table';
    RAISE NOTICE '📦 Default min_order set to 1 for all products';
END $$;
