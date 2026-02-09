#!/bin/bash

# SCAFF*FOOD - Start All Services
# This script starts database, backend, and frontend

echo "🚀 Starting SCAFF*FOOD - All Services"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker first"
    exit 1
fi

# Step 1: Start Database
echo -e "${YELLOW}📊 Step 1/3: Starting Database...${NC}"
echo ""
./start-db.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start database${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait a bit for database to be fully ready
echo -e "${YELLOW}⏳ Waiting for database to be fully ready...${NC}"
sleep 3

# Step 2: Instructions for Backend
echo ""
echo -e "${YELLOW}📡 Step 2/3: Backend${NC}"
echo ""
echo "Backend harus dijalankan di terminal terpisah."
echo ""
echo -e "${GREEN}Buka terminal baru dan jalankan:${NC}"
echo ""
echo "  cd api"
echo "  ./start.sh"
echo ""
echo "Tunggu sampai muncul:"
echo "  ✅ Connected to PostgreSQL database!"
echo "  ✅ Login system is ready!"
echo "  🚀 Server starting on http://localhost:8080"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 3: Instructions for Frontend
echo -e "${YELLOW}🎨 Step 3/3: Frontend${NC}"
echo ""
echo "Frontend harus dijalankan di terminal terpisah."
echo ""
echo -e "${GREEN}Buka terminal baru dan jalankan:${NC}"
echo ""
echo "  npm run dev"
echo ""
echo "Tunggu sampai muncul:"
echo "  Ready on http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
echo -e "${GREEN}✅ Database is running!${NC}"
echo ""
echo "Next steps:"
echo "1. Start backend in new terminal: cd api && ./start.sh"
echo "2. Start frontend in new terminal: npm run dev"
echo "3. Open browser: http://localhost:3000/login"
echo "4. Login with: scafffood@gmail.com"
echo ""
echo "📚 Full guide: START-ALL.md"
echo ""
echo "🎉 Happy coding!"
