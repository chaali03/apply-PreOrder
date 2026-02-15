#!/bin/bash

echo "🌐 Setup Cloudflare Tunnel Config"
echo "=================================="
echo ""

# Create directory
mkdir -p ~/.cloudflared

# Copy config
cp cloudflared-config.yml ~/.cloudflared/config.yml

echo "✅ Config file copied to ~/.cloudflared/config.yml"
echo ""

# Setup DNS route
echo "🌐 Setting up DNS route..."
cloudflared tunnel route dns scafffood-backend api.scafffood.my.id

echo ""
echo "✅ DNS configured!"
echo ""

# Check if backend is running
echo "🔍 Checking backend..."
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend not running. Starting Docker..."
    docker-compose up -d
    sleep 5
fi

echo ""
echo "🚀 Starting tunnel..."
echo ""
echo "Choose how to run tunnel:"
echo "  1) Run in foreground (for testing - press Ctrl+C to stop)"
echo "  2) Install as system service (auto-start on boot)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "2" ]; then
    echo ""
    echo "📦 Installing as system service..."
    sudo cloudflared service install
    sudo systemctl start cloudflared
    sudo systemctl enable cloudflared
    
    sleep 3
    
    if sudo systemctl is-active --quiet cloudflared; then
        echo "✅ Tunnel service is running!"
    else
        echo "❌ Service failed to start"
        echo "Check logs: sudo journalctl -u cloudflared -n 50"
        exit 1
    fi
else
    echo ""
    echo "🚀 Starting tunnel in foreground..."
    echo "Press Ctrl+C to stop"
    echo ""
    cloudflared tunnel run scafffood-backend
fi

echo ""
echo "=================================="
echo "✅ Tunnel is running!"
echo ""
echo "🌐 Your backend URL:"
echo "   https://api.scafffood.my.id"
echo ""
echo "🧪 Test it:"
echo "   curl https://api.scafffood.my.id/api/health"
echo ""
echo "📝 Next steps:"
echo "   1. Test: curl https://api.scafffood.my.id/api/health"
echo "   2. Set in Vercel: BACKEND_API_URL=https://api.scafffood.my.id"
echo "   3. Push code: git push"
echo "   4. Test production: https://scafffood.my.id/login"
echo ""
