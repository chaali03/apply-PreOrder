#!/bin/bash

# Automated Railway Deployment Script
# This will deploy your backend to Railway and update Vercel automatically

set -e

echo "🚂 Railway Deployment Script"
echo "============================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Railway CLI not found. Installing..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
    echo ""
fi

# Check if logged in
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
    echo ""
fi

echo "✅ Authenticated with Railway"
echo ""

# Check if project is linked
if [ ! -f "railway.json" ] && [ ! -d ".railway" ]; then
    echo "🆕 Initializing new Railway project..."
    railway init
    echo ""
fi

# Deploy
echo "🚀 Deploying to Railway..."
echo "This may take 2-3 minutes..."
echo ""

railway up --detach

echo ""
echo "⏳ Waiting for deployment to complete..."
sleep 30

# Get the URL
echo ""
echo "🔍 Getting your Railway URL..."

RAILWAY_URL=$(railway domain 2>&1 | grep -o 'https://[^ ]*' | head -1)

if [ -z "$RAILWAY_URL" ]; then
    echo "⚠️  No domain found. Generating one..."
    railway domain --generate
    sleep 5
    RAILWAY_URL=$(railway domain 2>&1 | grep -o 'https://[^ ]*' | head -1)
fi

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ Could not get Railway URL"
    echo ""
    echo "Please run manually:"
    echo "  railway domain"
    echo ""
    echo "Then update Vercel with:"
    echo "  ./update-vercel-with-railway.sh <YOUR_RAILWAY_URL>"
    exit 1
fi

echo "✅ Railway URL: $RAILWAY_URL"
echo ""

# Update .env.production
echo "📝 Updating .env.production..."
if [ -f .env.production ]; then
    sed -i.bak "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$RAILWAY_URL|g" .env.production
    rm -f .env.production.bak
else
    echo "NEXT_PUBLIC_API_URL=$RAILWAY_URL" > .env.production
fi
echo "✅ Updated .env.production"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI not found. Installing..."
    npm install -g vercel
    echo ""
fi

# Update Vercel
echo "🔄 Updating Vercel environment variable..."
vercel env rm NEXT_PUBLIC_API_URL production --yes 2>/dev/null || true
echo "$RAILWAY_URL" | vercel env add NEXT_PUBLIC_API_URL production

echo ""
echo "🚀 Redeploying Vercel with new Railway URL..."
vercel --prod --yes

echo ""
echo "============================"
echo "✅ Deployment Complete!"
echo ""
echo "🎉 Your backend is now on Railway:"
echo "   $RAILWAY_URL"
echo ""
echo "🌐 Frontend will be live in ~1-2 minutes:"
echo "   https://scaff-food.vercel.app"
echo ""
echo "📊 Monitor your deployment:"
echo "   railway logs"
echo "   railway open"
echo ""
echo "💡 This URL is PERMANENT and will never change!"
echo ""
