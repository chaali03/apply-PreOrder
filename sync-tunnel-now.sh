#!/bin/bash

# Quick sync script - detects current tunnel URL and updates Vercel immediately
# Use this when you notice the tunnel URL has changed

set -e

echo "🔄 Quick Sync: Cloudflare Tunnel → Vercel"
echo "=========================================="
echo ""

# Get the current tunnel URL
echo "🔍 Detecting current tunnel URL..."

# Try multiple sources
TUNNEL_URL=""

# 1. Try tunnel.log (direct cloudflared)
if [ -f tunnel.log ]; then
    TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunnel.log | tail -1)
fi

# 2. Try Docker container (scafffood-cloudflared)
if [ -z "$TUNNEL_URL" ]; then
    TUNNEL_URL=$(docker logs scafffood-cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1 2>/dev/null)
fi

# 3. Try Docker container (cloudflared)
if [ -z "$TUNNEL_URL" ]; then
    TUNNEL_URL=$(docker logs cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1 2>/dev/null)
fi

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Error: Could not detect Cloudflare Tunnel URL"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if tunnel is running:"
    echo "   docker ps | grep cloudflared"
    echo "   ps aux | grep cloudflared"
    echo ""
    echo "2. Start tunnel:"
    echo "   ./start-tunnel.sh"
    echo "   OR"
    echo "   docker-compose up -d"
    echo ""
    echo "3. Wait 5-10 seconds and try again"
    exit 1
fi

echo "✅ Current Tunnel URL: $TUNNEL_URL"
echo ""

# Check current Vercel env
echo "📋 Checking current Vercel configuration..."
CURRENT_VERCEL_URL=$(vercel env pull .env.vercel.tmp 2>/dev/null && grep NEXT_PUBLIC_API_URL .env.vercel.tmp | cut -d'=' -f2 || echo "not set")
rm -f .env.vercel.tmp

echo "   Vercel currently uses: $CURRENT_VERCEL_URL"
echo ""

if [ "$TUNNEL_URL" = "$CURRENT_VERCEL_URL" ]; then
    echo "✅ URLs match! No update needed."
    exit 0
fi

echo "🔄 URLs don't match. Updating..."
echo ""

# Update .env.production
echo "📝 Updating .env.production..."
if [ -f .env.production ]; then
    sed -i.bak "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$TUNNEL_URL|g" .env.production
    rm -f .env.production.bak
else
    echo "NEXT_PUBLIC_API_URL=$TUNNEL_URL" > .env.production
fi
echo "✅ Updated .env.production"

# Update Vercel
echo ""
echo "🚀 Updating Vercel environment variable..."
vercel env rm NEXT_PUBLIC_API_URL production --yes 2>/dev/null || true
echo "$TUNNEL_URL" | vercel env add NEXT_PUBLIC_API_URL production

echo ""
echo "🔄 Triggering Vercel redeploy..."
vercel --prod --yes

echo ""
echo "=========================================="
echo "✅ Sync Complete!"
echo ""
echo "New URL: $TUNNEL_URL"
echo ""
echo "🌐 Your app will be live in ~1-2 minutes"
echo "   Visit: https://scaff-food.vercel.app"
echo ""
