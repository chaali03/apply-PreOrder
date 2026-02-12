#!/bin/bash

# Watch for Cloudflare Tunnel URL changes and auto-update Vercel
# This script continuously monitors the tunnel and updates Vercel when URL changes

set -e

LAST_URL=""
CHECK_INTERVAL=30  # Check every 30 seconds

echo "👀 Starting Cloudflare Tunnel URL monitor..."
echo "This will automatically update Vercel when the tunnel URL changes."
echo "Press Ctrl+C to stop."
echo ""

while true; do
    # Get current tunnel URL from multiple sources
    CURRENT_URL=""
    
    # Try tunnel.log
    if [ -f tunnel.log ]; then
        CURRENT_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunnel.log | tail -1)
    fi
    
    # Try Docker containers
    if [ -z "$CURRENT_URL" ]; then
        CURRENT_URL=$(docker logs scafffood-cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1 2>/dev/null)
    fi
    
    if [ -z "$CURRENT_URL" ]; then
        CURRENT_URL=$(docker logs cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1 2>/dev/null)
    fi
    
    if [ -z "$CURRENT_URL" ]; then
        echo "⚠️  $(date '+%Y-%m-%d %H:%M:%S') - Tunnel not detected, waiting..."
        sleep $CHECK_INTERVAL
        continue
    fi
    
    # Check if URL has changed
    if [ "$CURRENT_URL" != "$LAST_URL" ]; then
        if [ -n "$LAST_URL" ]; then
            echo ""
            echo "🔄 $(date '+%Y-%m-%d %H:%M:%S') - Tunnel URL changed!"
            echo "   Old: $LAST_URL"
            echo "   New: $CURRENT_URL"
            echo ""
            echo "🚀 Auto-updating Vercel..."
            ./auto-update-vercel.sh
        else
            echo "✅ $(date '+%Y-%m-%d %H:%M:%S') - Initial tunnel URL: $CURRENT_URL"
        fi
        LAST_URL="$CURRENT_URL"
    else
        echo "✓ $(date '+%Y-%m-%d %H:%M:%S') - Tunnel stable: $CURRENT_URL"
    fi
    
    sleep $CHECK_INTERVAL
done
