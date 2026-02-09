#!/bin/bash

# Reset Database and Load New Schema

echo "🔄 Resetting Database..."
echo ""

# Check if database is running
if ! docker ps | grep -q scafffood-postgres; then
    echo "❌ Database is not running"
    echo "Start with: ./start-db.sh"
    exit 1
fi

echo "⚠️  This will delete ALL data in the database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🗑️  Dropping all tables..."
docker exec scafffood-postgres psql -U postgres -d management_preorder -c "
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
"

echo ""
echo "📦 Loading new schema..."
docker exec -i scafffood-postgres psql -U postgres -d management_preorder < api/migrations/001_init_schema.sql

echo ""
echo "✅ Database reset complete!"
echo ""
echo "📊 Checking data:"
echo ""
echo "Users:"
docker exec scafffood-postgres psql -U postgres -d management_preorder -c "SELECT email, name, role FROM users;"

echo ""
echo "Products:"
docker exec scafffood-postgres psql -U postgres -d management_preorder -c "SELECT name, price, category, tag FROM products;"

echo ""
echo "🎉 Done! Database is ready with new schema."
