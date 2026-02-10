#!/bin/bash

# Check Database Connection and Product Status

echo "🔍 Checking Database Status"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if database container is running
echo -e "${YELLOW}1. Checking if database container is running...${NC}"
if docker ps | grep -q scafffood-postgres; then
    echo -e "${GREEN}✅ Database container is running${NC}"
else
    echo -e "${RED}❌ Database container is NOT running${NC}"
    echo "Start with: docker-compose up -d"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check database connection
echo -e "${YELLOW}2. Testing database connection...${NC}"
if docker exec scafffood-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is accepting connections${NC}"
else
    echo -e "${RED}❌ Database is not accepting connections${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Query products table
echo -e "${YELLOW}3. Querying products table...${NC}"
echo ""

QUERY="SELECT id, name, is_available FROM products ORDER BY created_at DESC;"

docker exec -it scafffood-postgres psql -U postgres -d management_preorder -c "$QUERY"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Count products
echo -e "${YELLOW}4. Product statistics...${NC}"
echo ""

TOTAL=$(docker exec scafffood-postgres psql -U postgres -d management_preorder -t -c "SELECT COUNT(*) FROM products;")
AVAILABLE=$(docker exec scafffood-postgres psql -U postgres -d management_preorder -t -c "SELECT COUNT(*) FROM products WHERE is_available = true;")
UNAVAILABLE=$(docker exec scafffood-postgres psql -U postgres -d management_preorder -t -c "SELECT COUNT(*) FROM products WHERE is_available = false;")

echo -e "${BLUE}Total products: $TOTAL${NC}"
echo -e "${GREEN}Available: $AVAILABLE${NC}"
echo -e "${RED}Unavailable (HABIS): $UNAVAILABLE${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show unavailable products
if [ "$UNAVAILABLE" -gt 0 ]; then
    echo -e "${YELLOW}5. Products marked as HABIS:${NC}"
    echo ""
    docker exec -it scafffood-postgres psql -U postgres -d management_preorder -c "SELECT id, name, price, is_available FROM products WHERE is_available = false;"
else
    echo -e "${YELLOW}5. No products marked as HABIS${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${GREEN}✅ Database check complete!${NC}"
echo ""
echo "Next steps:"
echo "1. If no products are HABIS, mark one in dashboard"
echo "2. Run this script again to verify database update"
echo "3. Check backend logs for toggle messages"
echo ""
