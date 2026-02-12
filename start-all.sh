#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SCAFF*FOOD - Start All Services${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ Ngrok not installed!${NC}"
    echo ""
    echo "Install ngrok:"
    echo "  wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz"
    echo "  tar -xvzf ngrok-v3-stable-linux-amd64.tgz"
    echo "  sudo mv ngrok /usr/local/bin/"
    echo ""
    exit 1
fi

echo -e "${YELLOW}📋 Instructions:${NC}"
echo ""
echo "This script will guide you through starting all services."
echo "You need to run commands in SEPARATE terminals."
echo ""
echo -e "${GREEN}Terminal 1 - Database:${NC}"
echo "  ./start-db.sh"
echo ""
echo -e "${GREEN}Terminal 2 - Backend:${NC}"
echo "  cd api && go run cmd/main.go"
echo ""
echo -e "${GREEN}Terminal 3 - Ngrok:${NC}"
echo "  ngrok http 8080"
echo ""
echo -e "${YELLOW}After ngrok starts:${NC}"
echo "  1. Copy the HTTPS URL from ngrok (https://xxxx.ngrok-free.app)"
echo "  2. Run: npx netlify env:set NEXT_PUBLIC_API_URL \"https://your-url\" --force"
echo "  3. Run: npx netlify deploy --prod"
echo ""
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Read NGROK-SETUP.md for detailed instructions!"
echo ""
