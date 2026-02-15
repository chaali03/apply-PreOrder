#!/bin/bash

echo "🛑 Stopping SCAFF*FOOD Backend"
echo "=============================="
echo ""

# Stop Go backend
if [ -f backend.pid ]; then
    PID=$(cat backend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Stopping backend (PID: $PID)..."
        kill $PID
        rm backend.pid
        echo "✅ Backend stopped"
    else
        echo "Backend not running"
        rm backend.pid
    fi
else
    # Try to find and kill go process
    GO_PID=$(pgrep -f "go run main.go")
    if [ ! -z "$GO_PID" ]; then
        echo "Found backend process: $GO_PID"
        kill $GO_PID
        echo "✅ Backend stopped"
    else
        echo "Backend not running"
    fi
fi

# Stop Docker services
echo ""
echo "Stopping Docker services..."
docker-compose down

echo ""
echo "✅ All services stopped"
