-- Create QRIS table
CREATE TABLE IF NOT EXISTS qris_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add qris_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS qris_id UUID REFERENCES qris_codes(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON TABLE qris_codes IS 'Table for storing multiple QRIS codes';
COMMENT ON COLUMN products.qris_id IS 'Reference to QRIS code to use for this product';

-- Create index
CREATE INDEX IF NOT EXISTS idx_products_qris_id ON products(qris_id);
