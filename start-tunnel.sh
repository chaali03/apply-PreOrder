#!/bin/bash

echo "🌐 Starting Cloudflare Tunnel"
echo "============================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "⚠️  Backend is not running on localhost:8080"
    echo "Start it first with: cd api && go run main.go"
    echo ""
    read -p "Do you want to start backend now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd api
        go run main.go &
        BACKEND_PID=$!
        echo $BACKEND_PID > ../backend.pid
        cd ..
        sleep 3
        echo "✅ Backend started (PID: $BACKEND_PID)"
    else
        exit 1
    fi
fi

echo "Starting Cloudflare Tunnel..."
docker-compose up -d cloudflared

echo ""
echo "Waiting for tunnel to establish..."
sleep 5

echo ""
echo "🔍 Getting tunnel URL..."
TUNNEL_URL=$(docker logs scafffood-cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1)

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Could not get tunnel URL"
    echo ""
    echo "Try manually:"
    echo "  docker logs scafffood-cloudflared | grep trycloudflare"
    exit 1
fi

echo "✅ Tunnel URL: $TUNNEL_URL"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Copy this URL: $TUNNEL_URL"
echo ""
echo "2. Go to Vercel Dashboard:"
echo "   https://vercel.com/dashboard"
echo ""
echo "3. Select your project → Settings → Environment Variables"
echo ""
echo "4. Add or update:"
echo "   Name:  BACKEND_API_URL"
echo "   Value: $TUNNEL_URL"
echo ""
echo "5. Redeploy your frontend:"
echo "   - Go to Deployments tab"
echo "   - Click ... on latest deployment"
echo "   - Click 'Redeploy'"
echo ""
echo "6. Or push code to trigger auto-deploy:"
echo "   git add ."
echo "   git commit -m 'Add API proxy'"
echo "   git push"
echo ""
echo "🧪 Test tunnel:"
echo "   curl $TUNNEL_URL/api/health"
echo ""

# Test the tunnel
echo "Testing tunnel..."
sleep 2
HEALTH_CHECK=$(curl -s $TUNNEL_URL/api/health 2>&1)
if echo "$HEALTH_CHECK" | grep -q "ok"; then
    echo "✅ Tunnel is working!"
else
    echo "⚠️  Tunnel test failed. Check backend logs."
fi

echo ""
echo "💡 Keep this terminal open to keep tunnel running!"
echo "   Press Ctrl+C to stop tunnel"
echo ""
