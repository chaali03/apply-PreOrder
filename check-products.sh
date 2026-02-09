#!/bin/bash

echo "🔍 Checking Products in Database..."
echo ""

# Check if database is running
if ! docker ps | grep -q scafffood-postgres; then
    echo "❌ Database is not running"
    exit 1
fi

echo "📊 Products in Database:"
echo ""
docker exec scafffood-postgres psql -U postgres -d management_preorder -c "SELECT name, category, tag, tag_color, price FROM products ORDER BY name;"

echo ""
echo "🌐 Testing API Endpoint:"
echo ""
curl -s http://localhost:8080/api/products | python3 -m json.tool 2>/dev/null || echo "❌ Backend not responding or invalid JSON"

echo ""
echo "💡 If category is still 'Cookies', you need to:"
echo "   1. Run: ./reset-database.sh"
echo "   2. Restart backend: cd api && ./start.sh"
echo "   3. Refresh browser (Ctrl+Shift+R for hard refresh)"
