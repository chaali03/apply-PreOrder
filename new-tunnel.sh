#!/bin/bash

echo "🔄 Creating New Cloudflare Tunnel..."
echo ""

# 1. Stop and remove old tunnel
echo "1️⃣ Stopping old tunnel..."
docker stop scafffood-cloudflared 2>/dev/null
docker rm scafffood-cloudflared 2>/dev/null
echo "✅ Old tunnel removed"
echo ""

# 2. Start new tunnel
echo "2️⃣ Starting new tunnel..."
docker run -d \
  --name scafffood-cloudflared \
  --restart unless-stopped \
  --network host \
  cloudflare/cloudflared:latest \
  tunnel --url http://localhost:8080

# Wait for tunnel to initialize
echo "⏳ Waiting for tunnel to initialize..."
sleep 8

# 3. Get new URL
echo ""
echo "3️⃣ Getting new tunnel URL..."
NEW_URL=$(docker logs scafffood-cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1)

if [ -z "$NEW_URL" ]; then
    echo "❌ Failed to get tunnel URL!"
    echo "Check docker logs: docker logs scafffood-cloudflared"
    exit 1
fi

echo "✅ New URL: $NEW_URL"
echo ""

# 4. Update .env.production
echo "4️⃣ Updating .env.production..."
sed -i "s|NEXT_PUBLIC_API_URL=https://.*\.trycloudflare\.com|NEXT_PUBLIC_API_URL=$NEW_URL|g" .env.production
echo "✅ Updated .env.production"
echo ""

# 5. Test connection
echo "5️⃣ Testing connection..."
echo -n "   Local backend (localhost:8080): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health 2>/dev/null | grep -q "200"; then
    echo "✅ OK"
else
    echo "❌ FAILED - Backend not running!"
    echo "   Start backend: cd api && go run main.go"
fi

echo -n "   Tunnel ($NEW_URL): "
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$NEW_URL/api/health" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK"
else
    echo "⚠️  HTTP $HTTP_CODE (might need a moment to propagate)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 NEW TUNNEL URL:"
echo "   $NEW_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Update Vercel Environment Variable:"
echo "   vercel env rm NEXT_PUBLIC_API_URL production"
echo "   vercel env add NEXT_PUBLIC_API_URL production"
echo "   (Enter: $NEW_URL)"
echo "   (Sensitive: no)"
echo ""
echo "2. Redeploy to Vercel:"
echo "   vercel --prod"
echo ""
echo "Or use Vercel Dashboard:"
echo "   https://vercel.com/dashboard"
echo "   → Settings → Environment Variables"
echo "   → Edit NEXT_PUBLIC_API_URL → $NEW_URL"
echo "   → Redeploy"
echo ""
