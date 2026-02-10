#!/bin/bash

echo "🔄 Adding min_order column to products table..."

# Run migration
cat api/migrations/003_add_min_order.sql | docker exec -i scafffood-postgres psql -U postgres -d management_preorder

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "📦 min_order column added to products table"
else
    echo "❌ Migration failed!"
    echo "Make sure Docker and database container are running"
    exit 1
fi
