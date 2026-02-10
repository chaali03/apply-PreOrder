#!/bin/bash

echo "================================"
echo "VERIFY PRODUCT IMAGES"
echo "================================"
echo ""

echo "🔍 Checking API response..."
echo ""

# Test API endpoint
response=$(curl -s http://localhost:8080/api/products)

# Check if response contains image URLs
if echo "$response" | grep -q "/produk/Cookies1.jpeg"; then
    echo "✅ Cookies images found in API response"
else
    echo "❌ Cookies images NOT found in API response"
fi

if echo "$response" | grep -q "/produk/UdangKeju1.jpeg"; then
    echo "✅ Udang Keju images found in API response"
else
    echo "❌ Udang Keju images NOT found in API response"
fi

echo ""
echo "📸 Image URLs from API:"
echo "$response" | grep -o '"image_url_[0-9]":"[^"]*"' | head -6

echo ""
echo "================================"
echo "Next steps:"
echo "1. Open http://localhost:3000/menu in your browser"
echo "2. Hard refresh with Ctrl+Shift+R"
echo "3. Images should now be visible"
echo "================================"
