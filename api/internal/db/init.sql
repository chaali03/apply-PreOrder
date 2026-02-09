CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "desc" TEXT,
    quantity INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0.00,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Create function untuk auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO products (name, "desc", quantity, price, image_url) 
VALUES 
    ('Dimsum Goreng', 'Dimsum Goreng Renyah', 30, 10000.00, '/uploads/products/dimsum.jpg'),
    ('Matcha Cookies', 'Cookies dengan rasa matcha authentic', 15, 5000.00, '/uploads/products/matcha-cookies.jpg'),
    ('Chocolate Cookies', 'Cookies cokelat premium', 15, 5000.00, '/uploads/products/chocolate-cookies.jpg')
ON CONFLICT (id) DO NOTHING;

-- Log success
DO $$ 
BEGIN
    RAISE NOTICE 'Database schema initialized successfully!';
END $$;

-- Verifikasi
SELECT 'Database ready!' as message;
SELECT COUNT(*) as total_products FROM products;