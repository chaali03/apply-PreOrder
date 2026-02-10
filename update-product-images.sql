-- Update product images for existing products

-- Update Cookies product
UPDATE products 
SET 
  image_url_1 = '/produk/Cookies1.jpeg',
  image_url_2 = '/produk/Cookies2.jpeg',
  image_url_3 = '/produk/Cookies3.jpeg'
WHERE name = 'Cookies';

-- Update Udang Keju product
UPDATE products 
SET 
  image_url_1 = '/produk/UdangKeju1.jpeg',
  image_url_2 = '/produk/UdangKeju2.jpeg',
  image_url_3 = '/produk/UdangKeju3.jpeg'
WHERE name LIKE '%Udang Keju%';

-- Verify the updates
SELECT name, image_url_1, image_url_2, image_url_3 FROM products;
