#!/bin/bash

echo "🚀 Starting SCAFF*FOOD Application..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker first"
    exit 1
fi

# Start database
echo "1️⃣ Starting Database..."
./start-db.sh

if [ $? -ne 0 ]; then
    echo "❌ Failed to start database"
    exit 1
fi

echo ""
echo "2️⃣ Starting API Server..."
echo "Opening new terminal for API server..."
echo "Run: cd api && go run main.go"
echo ""

# Check if API is already running
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  API server already running on port 8080"
else
    echo "💡 Please run in a new terminal: cd api && go run main.go"
fi

echo ""
echo "3️⃣ Starting Frontend..."
echo "Opening new terminal for Frontend..."
echo "Run: npm run dev"
echo ""

# Check if Frontend is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Frontend already running on port 3000"
else
    echo "💡 Please run in a new terminal: npm run dev"
fi

echo ""
echo "✅ Database is ready!"
echo ""
echo "📋 Next Steps:"
echo "   1. Open new terminal and run: cd api && go run main.go"
echo "   2. Open another terminal and run: npm run dev"
echo "   3. Access application at: http://localhost:3000"
echo ""
echo "📚 For more info, see START_APP.md"
