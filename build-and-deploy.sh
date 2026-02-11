#!/bin/bash

# Build and Deploy to Netlify Helper Script

echo "🚀 SCAFF*FOOD - Build & Deploy to Netlify"
echo "=========================================="
echo ""

# Check if netlify CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found! Please install Node.js"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi

echo ""
echo "🔨 Step 2: Building Next.js application..."
echo "This may take 2-3 minutes..."
echo ""

npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "Common issues:"
    echo "- TypeScript errors"
    echo "- Missing dependencies"
    echo "- Environment variables"
    echo ""
    echo "Try:"
    echo "  rm -rf .next node_modules"
    echo "  npm install"
    echo "  npm run build"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "📝 Build output is in: .next/"
echo ""

# Check if Netlify is initialized
if [ ! -f ".netlify/state.json" ]; then
    echo "⚠️  Netlify not initialized yet!"
    echo ""
    echo "Please run first:"
    echo "  npx netlify init"
    echo ""
    echo "Then run this script again, or deploy manually:"
    echo "  npx netlify deploy --prod"
    echo ""
    exit 0
fi

echo "🚀 Step 3: Ready to deploy!"
echo ""
echo "Choose deployment type:"
echo "1) Draft deployment (for testing)"
echo "2) Production deployment"
echo "3) Skip deployment (just build)"
read -p "Enter choice (1, 2, or 3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying draft..."
        npx netlify deploy
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Draft deployed!"
            echo "Test the draft URL above before deploying to production."
        fi
        ;;
    2)
        echo ""
        echo "⚠️  WARNING: This will deploy to PRODUCTION!"
        read -p "Are you sure? (yes/no): " confirm
        
        if [ "$confirm" = "yes" ]; then
            echo ""
            echo "🚀 Deploying to production..."
            npx netlify deploy --prod
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "✅ Production deployment successful!"
                echo ""
                echo "📝 Next steps:"
                echo "1. Set API URL: npx netlify env:set NEXT_PUBLIC_API_URL 'https://your-api.railway.app'"
                echo "2. Redeploy: npx netlify deploy --prod"
                echo "3. Test your site"
            fi
        else
            echo "❌ Deployment cancelled."
        fi
        ;;
    3)
        echo ""
        echo "ℹ️  Build complete. Deployment skipped."
        echo ""
        echo "To deploy later:"
        echo "  npx netlify deploy          # Draft"
        echo "  npx netlify deploy --prod   # Production"
        ;;
    *)
        echo "❌ Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo "📚 Useful commands:"
echo "  npx netlify logs              # View logs"
echo "  npx netlify open              # Open dashboard"
echo "  npx netlify env:list          # List env vars"
echo "  npx netlify status            # Check status"
echo ""
