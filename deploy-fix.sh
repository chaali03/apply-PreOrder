#!/bin/bash

# Deploy Fix for 405 Error
# This script helps you deploy the authentication fix to Vercel

echo "🚀 Deploying Authentication Fix to Vercel"
echo "=========================================="
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository"
    echo "Please run this script from the project root"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "📝 You have uncommitted changes. Committing them now..."
    git add .
    git commit -m "Fix: Add Next.js API proxy routes for authentication (405 error fix)"
    echo "✅ Changes committed"
else
    echo "✅ No uncommitted changes"
fi

echo ""
echo "📦 Pushing to repository..."
git push

echo ""
echo "🔧 Next Steps:"
echo "=============="
echo ""
echo "1. Go to your Vercel dashboard: https://vercel.com/dashboard"
echo ""
echo "2. Find your project (scafffood)"
echo ""
echo "3. Go to Settings → Environment Variables"
echo ""
echo "4. Add a new environment variable:"
echo "   Name: BACKEND_API_URL"
echo "   Value: [Your Go backend URL]"
echo "   Example: https://your-backend.railway.app"
echo ""
echo "5. Vercel will automatically redeploy after you push to git"
echo "   Or manually trigger a redeploy from the Deployments tab"
echo ""
echo "⚠️  IMPORTANT: You need to deploy your Go backend first!"
echo "   The backend (api/ folder) needs to be running somewhere"
echo "   Options: Railway, Render, Fly.io, or your own server"
echo ""
echo "📚 See DEPLOYMENT.md for detailed instructions"
echo ""

read -p "Have you deployed your Go backend? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "⚠️  Please deploy your Go backend first before continuing"
    echo "   See DEPLOYMENT.md for instructions"
    exit 0
fi

echo ""
read -p "Have you set BACKEND_API_URL in Vercel? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "⚠️  Please set BACKEND_API_URL in Vercel before the deployment completes"
    echo "   Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
    exit 0
fi

echo ""
echo "✅ All set! Your changes are being deployed to Vercel"
echo "🔍 Check deployment status at: https://vercel.com/dashboard"
echo ""
