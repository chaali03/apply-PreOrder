#!/bin/bash

echo "🔄 Adding cancellation fields to orders table..."

# Run migration
cat api/migrations/004_add_cancellation_fields.sql | docker exec -i scafffood-postgres psql -U postgres -d postgres psql -U postgres -d management_preorder

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "📦 cancellation_reason and cancelled_at columns added to orders table"
else
    echo "❌ Migration failed!"
    echo "Make sure Docker and database container are running"
    exit 1
fi
