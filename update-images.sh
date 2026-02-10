#!/bin/bash

echo "================================"
echo "UPDATE PRODUCT IMAGES"
echo "================================"
echo ""

# Check if database is running
if ! docker ps | grep -q scafffood-postgres; then
    echo "❌ Database is not running"
    echo "Start database with: docker-compose up -d postgres"
    exit 1
fi

echo "📸 Updating product images..."
echo ""

# Copy SQL file to container
docker cp update-product-images.sql scafffood-postgres:/tmp/update-product-images.sql

# Execute SQL
docker exec scafffood-postgres psql -U postgres -d management_preorder -f /tmp/update-product-images.sql

echo ""
echo "✅ Product images updated successfully!"
echo ""
echo "Images added:"
echo "  - Cookies: /produk/Cookies1.jpeg, Cookies2.jpeg, Cookies3.jpeg"
echo "  - Udang Keju: /produk/UdangKeju1.jpeg, UdangKeju2, UdangKeju3.jpeg"
echo ""
echo "You can now see the images in:"
echo "  - Customer menu: http://localhost:3000/menu"
echo "  - Admin dashboard: http://localhost:3000/dashboard/menu"
echo ""
