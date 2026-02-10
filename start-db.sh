#!/bin/bash

# SCAFF*FOOD - Start Database
# This script starts PostgreSQL database using Docker Compose

echo "🐘 Starting PostgreSQL Database..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker first"
    exit 1
fi

# Check if container already exists and is running
if docker ps | grep -q scafffood-postgres; then
    echo -e "${GREEN}✅ Database is already running${NC}"
    echo ""
    echo "Database: postgresql://postgres:change_me@localhost:5432/management_preorder"
    echo "Adminer: http://localhost:8081"
    exit 0
fi

# Check if container exists but is stopped
if docker ps -a | grep -q scafffood-postgres; then
    echo -e "${YELLOW}⚠️  Database container exists but is stopped${NC}"
    echo "Starting existing container..."
    docker-compose start postgres adminer
else
    echo "Creating and starting database container..."
    docker-compose up -d postgres adminer
fi

# Wait for database to be ready
echo ""
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"

# Wait up to 30 seconds for database to be healthy
COUNTER=0
MAX_TRIES=30

while [ $COUNTER -lt $MAX_TRIES ]; do
    if docker exec scafffood-postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✅ Database is ready!${NC}"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Database Connection:"
        echo "  Host: localhost"
        echo "  Port: 5432"
        echo "  User: postgres"
        echo "  Password: change_me"
        echo "  Database: management_preorder"
        echo ""
        echo "Adminer (Database UI):"
        echo "  URL: http://localhost:8081"
        echo "  System: PostgreSQL"
        echo "  Server: postgres"
        echo "  Username: postgres"
        echo "  Password: change_me"
        echo "  Database: management_preorder"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        exit 0
    fi
    
    echo -n "."
    sleep 1
    COUNTER=$((COUNTER + 1))
done

echo ""
echo -e "${RED}❌ Database failed to start within 30 seconds${NC}"
echo ""
echo "Check logs with: docker-compose logs postgres"
exit 1
