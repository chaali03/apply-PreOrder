-- Add conditions field to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN products.conditions IS 'Array of condition options for the product, e.g., [{"name": "Pedas", "price_adjustment": 0}, {"name": "Tidak Pedas", "price_adjustment": 0}]';
