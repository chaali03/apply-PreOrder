#!/bin/bash

# Add custom domain scafffood.my.id to Vercel project via CLI

set -e

echo "🌐 Add Domain to Vercel"
echo "======================="
echo ""

DOMAIN="scafffood.my.id"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo ""
fi

# Check if logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
    echo ""
fi

echo "✅ Authenticated with Vercel"
echo ""

# Check if project is linked
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking Vercel project..."
    vercel link
    echo ""
fi

# Add domain
echo "🌐 Adding domain: $DOMAIN"
echo ""

vercel domains add $DOMAIN

echo ""
echo "=========================================="
echo "✅ Domain Added to Vercel!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Go to IDCloudHost DNS settings"
echo "2. Add these DNS records:"
echo ""
echo "   For root domain (@):"
echo "   Type: CNAME"
echo "   Value: cname.vercel-dns.com"
echo ""
echo "   OR use Nameservers:"
echo "   ns1.vercel-dns.com"
echo "   ns2.vercel-dns.com"
echo ""
echo "3. Wait 5-10 minutes for DNS propagate"
echo ""
echo "4. Verify domain:"
echo "   vercel domains verify $DOMAIN"
echo ""
echo "5. Check status:"
echo "   vercel domains list"
echo ""
echo "🌐 Your domain: https://$DOMAIN"
echo ""
