#!/bin/bash

# Auto-update Vercel environment variable when Cloudflare Tunnel URL changes
# This script detects the new tunnel URL and updates Vercel automatically

set -e

echo "🔍 Detecting Cloudflare Tunnel URL..."

# Get the tunnel URL from multiple sources
TUNNEL_URL=""

# Try tunnel.log first
if [ -f tunnel.log ]; then
    TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunnel.log | tail -1)
fi

# Try Docker containers
if [ -z "$TUNNEL_URL" ]; then
    TUNNEL_URL=$(docker logs scafffood-cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1 2>/dev/null)
fi

if [ -z "$TUNNEL_URL" ]; then
    TUNNEL_URL=$(docker logs cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1 2>/dev/null)
fi

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Error: Could not detect Cloudflare Tunnel URL"
    echo "Make sure the tunnel is running: ./start-tunnel.sh or docker-compose up -d"
    exit 1
fi

echo "✅ Detected Tunnel URL: $TUNNEL_URL"

# Update .env.production file
echo "📝 Updating .env.production..."
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$TUNNEL_URL|g" .env.production

echo "✅ Updated .env.production"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "🚀 Updating Vercel environment variable..."

# Update Vercel environment variable for production
vercel env rm NEXT_PUBLIC_API_URL production --yes 2>/dev/null || true
echo "$TUNNEL_URL" | vercel env add NEXT_PUBLIC_API_URL production

echo "✅ Vercel environment variable updated"

echo "🔄 Triggering Vercel redeploy..."
vercel --prod --yes

echo ""
echo "✅ Done! Your app is being redeployed with the new tunnel URL:"
echo "   $TUNNEL_URL"
echo ""
echo "🌐 Check deployment status at: https://vercel.com/dashboard"
