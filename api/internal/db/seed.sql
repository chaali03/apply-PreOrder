-- Insert data seed
INSERT INTO products (name, desc, quantity, price, image_url, created_at, updated_at) 
VALUES 
  ('Dimsum Goreng', 'Dimsum Goreng Renyah', 30, 10000.00, '/uploads/products/dimsum.jpg', NOW(), NOW()),
  ('Matcha Cookies', 'Cookies dengan rasa matcha authentic', 15, 5000.00, '/uploads/products/matcha-cookies.jpg', NOW(), NOW()),
  ('Chocolate Cookies', 'Cookies cokelat premium', 15, 5000.00, '/uploads/products/chocolate-cookies.jpg', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Cek data yang masuk
SELECT COUNT(*) as total_products FROM products;