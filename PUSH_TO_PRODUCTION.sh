#!/bin/bash

# Script to push all changes to production

echo "📦 Adding all changes to git..."
git add .

echo "💾 Committing changes..."
git commit -m "Fix: Add API proxy route, remove config.json, fix image paths for production

- Created app/api/[...path]/route.ts to proxy API requests to backend
- Updated lib/fetch-api.ts to use Next.js API proxy
- Fixed image paths in menu pages to use public folder
- Removed public/config.json (no longer needed)
- Fixed Next.js 15 async params issue
- Backend accessible via Cloudflare Tunnel at api.scafffood.my.id"

echo "🚀 Pushing to GitHub..."
git push

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "⏳ Vercel will auto-deploy in 2-3 minutes"
echo ""
echo "🔧 IMPORTANT: Set environment variable in Vercel Dashboard:"
echo "   Variable: BACKEND_API_URL"
echo "   Value: https://api.scafffood.my.id"
echo "   Apply to: Production, Preview, Development"
echo ""
echo "🐳 Make sure Docker backend is running:"
echo "   docker-compose up -d"
echo ""
echo "🌐 Test after deployment:"
echo "   https://scafffood.my.id/menu"
