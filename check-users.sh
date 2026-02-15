#!/bin/bash

echo "👥 Checking Users in Database"
echo "=============================="
echo ""

# Check if database container is running
if ! docker ps | grep -q scafffood-postgres; then
    echo "❌ Database is not running!"
    echo "Start it with: ./start-everything.sh"
    exit 1
fi

echo "📋 Registered Users:"
echo ""

docker exec scafffood-postgres psql -U postgres -d management_preorder -c "
SELECT 
    email,
    name,
    role,
    created_at
FROM users
ORDER BY created_at DESC;
" 2>&1

echo ""
echo "=============================="
echo ""
echo "💡 To add a new user:"
echo ""
echo "docker exec scafffood-postgres psql -U postgres -d management_preorder -c \\"
echo "  \"INSERT INTO users (email, name, role) VALUES ('your-email@example.com', 'Your Name', 'admin');\""
echo ""
