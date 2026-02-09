#!/bin/bash

# Check Status of All Services

echo "🔍 Checking SCAFF*FOOD Services Status..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
echo "🐳 Docker Status:"
if sudo systemctl is-active --quiet docker; then
    echo -e "${GREEN}✅ Docker daemon is running${NC}"
else
    echo -e "${RED}❌ Docker daemon is NOT running${NC}"
    echo "   Start with: sudo systemctl start docker"
fi
echo ""

# Check Database
echo "🐘 Database Status:"
if docker ps | grep -q scafffood-postgres; then
    echo -e "${GREEN}✅ PostgreSQL container is running${NC}"
    
    # Check if database is accessible
    if docker exec scafffood-postgres psql -U postgres -d management_preorder -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✅ Database is accessible${NC}"
        
        # Check if email exists
        echo ""
        echo "📧 Checking admin email in database:"
        docker exec scafffood-postgres psql -U postgres -d management_preorder -c "SELECT email, name, role FROM users WHERE email = 'scafffood@gmail.com';"
        
        if docker exec scafffood-postgres psql -U postgres -d management_preorder -c "SELECT email FROM users WHERE email = 'scafffood@gmail.com';" | grep -q scafffood; then
            echo -e "${GREEN}✅ Admin email found in database${NC}"
        else
            echo -e "${RED}❌ Admin email NOT found in database${NC}"
            echo "   Fix: docker-compose down -v && ./start-db.sh"
        fi
    else
        echo -e "${RED}❌ Database is not accessible${NC}"
    fi
else
    echo -e "${RED}❌ PostgreSQL container is NOT running${NC}"
    echo "   Start with: ./start-db.sh"
fi
echo ""

# Check Backend
echo "📡 Backend Status:"
if curl -s http://localhost:8080/api/health &> /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    curl -s http://localhost:8080/api/health | jq . 2>/dev/null || curl -s http://localhost:8080/api/health
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo "   Start with: cd api && ./start.sh"
fi
echo ""

# Check Frontend
echo "🎨 Frontend Status:"
if curl -s http://localhost:3000 &> /dev/null; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is NOT running${NC}"
    echo "   Start with: npm run dev"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
echo "📝 Summary:"
echo ""

ALL_OK=true

if ! sudo systemctl is-active --quiet docker; then
    echo -e "${RED}❌ Docker not running${NC}"
    ALL_OK=false
fi

if ! docker ps | grep -q scafffood-postgres; then
    echo -e "${RED}❌ Database not running${NC}"
    ALL_OK=false
fi

if ! curl -s http://localhost:8080/api/health &> /dev/null; then
    echo -e "${RED}❌ Backend not running${NC}"
    ALL_OK=false
fi

if ! curl -s http://localhost:3000 &> /dev/null; then
    echo -e "${RED}❌ Frontend not running${NC}"
    ALL_OK=false
fi

if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✅ All services are running!${NC}"
    echo ""
    echo "🎉 Ready to test login at: http://localhost:3000/login"
else
    echo ""
    echo "⚠️  Some services are not running. Follow the instructions above."
fi

echo ""
