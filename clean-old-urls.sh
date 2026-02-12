#!/bin/bash

echo "🧹 Cleaning old Cloudflare Tunnel URLs from project..."
echo ""

# Get current tunnel URL
CURRENT_URL=$(docker logs scafffood-cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1)

if [ -z "$CURRENT_URL" ]; then
    echo "❌ No active tunnel found!"
    echo "Run: ./new-tunnel.sh first"
    exit 1
fi

echo "📋 Current tunnel URL: $CURRENT_URL"
echo ""

# List of old URLs to remove
OLD_URLS=(
    "https://presentations-prizes-awareness-linda.trycloudflare.com"
    "https://presentations-prizes-awareness-linda.trycloudflare.com"
    "https://presentations-prizes-awareness-linda.trycloudflare.com"
    "https://presentations-prizes-awareness-linda.trycloudflare.com"
    "https://presentations-prizes-awareness-linda.trycloudflare.com"
)

echo "🔍 Searching for old URLs in project files..."
echo ""

# Search and replace in all relevant files
for OLD_URL in "${OLD_URLS[@]}"; do
    echo "Checking for: $OLD_URL"
    
    # Find files containing old URL
    FILES=$(grep -rl "$OLD_URL" . 2>/dev/null | grep -v node_modules | grep -v .next | grep -v .git)
    
    if [ ! -z "$FILES" ]; then
        echo "  Found in:"
        echo "$FILES" | sed 's/^/    /'
        
        # Replace in each file
        for FILE in $FILES; do
            sed -i "s|$OLD_URL|$CURRENT_URL|g" "$FILE"
        done
        echo "  ✅ Replaced with $CURRENT_URL"
    else
        echo "  ✓ Not found"
    fi
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Cleanup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Update Vercel (IMPORTANT - must answer 'no' to sensitive):"
echo "   vercel env rm NEXT_PUBLIC_API_URL production"
echo "   vercel env add NEXT_PUBLIC_API_URL production"
echo "   (Value: $CURRENT_URL)"
echo "   (Sensitive: no)  ← MUST BE 'no'"
echo ""
echo "2. Rebuild and redeploy:"
echo "   npm run build"
echo "   vercel --prod"
echo ""
echo "3. Hard refresh browser:"
echo "   Ctrl + Shift + R (or Cmd + Shift + R on Mac)"
echo "   Or open in incognito/private window"
echo ""
