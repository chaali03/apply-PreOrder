#!/bin/bash

echo "🚂 Railway Setup Guide"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    echo ""
    echo "Run this command:"
    echo "  bash <(curl -fsSL https://railway.app/install.sh)"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Railway CLI installed"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway:"
    echo ""
    echo "Run: railway login"
    echo ""
    echo "This will open browser for authentication."
    echo "After login, run this script again."
    exit 1
fi

echo "✅ Logged in to Railway"
echo ""

# Create railway.toml for configuration
echo "📝 Creating Railway configuration..."
cat > railway.toml << 'EOF'
[build]
builder = "NIXPACKS"
buildCommand = "cd api && go build -o main ."

[deploy]
startCommand = "cd api && ./main"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
EOF

echo "✅ Created railway.toml"
echo ""

# Create Procfile as alternative
echo "📝 Creating Procfile..."
cat > Procfile << 'EOF'
web: cd api && ./main
EOF

echo "✅ Created Procfile"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next Steps:"
echo ""
echo "1. Initialize Railway project:"
echo "   railway init"
echo ""
echo "2. Add PostgreSQL database:"
echo "   railway add --database postgres"
echo ""
echo "3. Set environment variables:"
echo "   railway variables set PORT=8080"
echo "   railway variables set JWT_SECRET=your-secret-key"
echo ""
echo "4. Link database variables (Railway will auto-set these):"
echo "   - DATABASE_URL"
echo "   - PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE"
echo ""
echo "5. Deploy:"
echo "   railway up"
echo ""
echo "6. Get your URL:"
echo "   railway domain"
echo ""
echo "7. Open in browser:"
echo "   railway open"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tips:"
echo "- Railway will auto-detect Go project"
echo "- Database credentials are auto-injected"
echo "- URL is permanent and won't change"
echo "- Free tier: $5 credit/month"
echo ""
