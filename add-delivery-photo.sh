#!/bin/bash

echo "🔄 Running migration: Add delivery_photo column..."

cat api/migrations/005_add_delivery_photo.sql | docker exec -i scafffood-postgres psql -U postgres -d management_preorder

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi
