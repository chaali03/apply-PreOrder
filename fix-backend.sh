#!/bin/bash

echo "🔧 Fixing Backend and Tunnel Connection..."
echo ""

# Check if backend is running
echo "1️⃣ Checking backend status..."
if lsof -i:8080 > /dev/null 2>&1; then
    echo "✅ Backend is running on port 8080"
else
    echo "❌ Backend is NOT running on port 8080"
    echo ""
    echo "Please start backend manually:"
    echo "   cd api"
    echo "   go run main.go"
    echo ""
fi

# Check tunnel
echo ""
echo "2️⃣ Checking Cloudflare Tunnel..."
if docker ps | grep scafffood-cloudflared > /dev/null; then
    echo "✅ Tunnel container is running"
    TUNNEL_URL=$(docker logs scafffood-cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1)
    echo "📋 Current URL: $TUNNEL_URL"
else
    echo "❌ Tunnel container is NOT running"
    echo ""
    echo "Restarting tunnel..."
    docker stop scafffood-cloudflared 2>/dev/null
    docker rm scafffood-cloudflared 2>/dev/null
    docker run -d \
      --name scafffood-cloudflared \
      --restart unless-stopped \
      cloudflare/cloudflared:latest \
      tunnel --url http://172.17.0.1:8080
    
    sleep 5
    TUNNEL_URL=$(docker logs scafffood-cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1)
    echo "✅ Tunnel restarted"
    echo "📋 New URL: $TUNNEL_URL"
fi

# Test connection
echo ""
echo "3️⃣ Testing connections..."
echo -n "   Local backend (localhost:8080): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health | grep -q "200"; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

if [ ! -z "$TUNNEL_URL" ]; then
    echo -n "   Tunnel ($TUNNEL_URL): "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TUNNEL_URL/api/health" 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ OK"
    else
        echo "❌ FAILED (HTTP $HTTP_CODE)"
    fi
fi

echo ""
echo "📝 Summary:"
echo "   Backend URL: http://localhost:8080"
echo "   Tunnel URL: $TUNNEL_URL"
echo ""
echo "Next steps:"
echo "1. Make sure backend is running (cd api && go run main.go)"
echo "2. Update Vercel env with: $TUNNEL_URL"
echo "3. Redeploy: vercel --prod"
