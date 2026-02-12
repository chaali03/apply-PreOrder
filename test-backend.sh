#!/bin/bash

# Test Backend API
# This script tests if your backend is working correctly

echo "🧪 Testing Backend API"
echo "====================="
echo ""

# Get backend URL from user
read -p "Enter your backend URL (e.g., https://your-app.railway.app): " BACKEND_URL

# Remove trailing slash if present
BACKEND_URL=${BACKEND_URL%/}

echo ""
echo "Testing: $BACKEND_URL"
echo ""

# Test 1: Health check
echo "1️⃣  Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HEALTH_CODE" = "200" ]; then
    echo "✅ Health check passed"
    echo "   Response: $HEALTH_BODY"
else
    echo "❌ Health check failed (HTTP $HEALTH_CODE)"
    echo "   Response: $HEALTH_BODY"
    exit 1
fi

echo ""

# Test 2: Send code endpoint
echo "2️⃣  Testing send-code endpoint..."
SEND_CODE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/send-code" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}')
SEND_CODE_CODE=$(echo "$SEND_CODE_RESPONSE" | tail -n1)
SEND_CODE_BODY=$(echo "$SEND_CODE_RESPONSE" | head -n-1)

if [ "$SEND_CODE_CODE" = "200" ] || [ "$SEND_CODE_CODE" = "401" ]; then
    echo "✅ Send-code endpoint is accessible"
    echo "   Response: $SEND_CODE_BODY"
    echo "   (401 is expected if email is not in database)"
else
    echo "❌ Send-code endpoint failed (HTTP $SEND_CODE_CODE)"
    echo "   Response: $SEND_CODE_BODY"
fi

echo ""

# Test 3: Products endpoint
echo "3️⃣  Testing products endpoint..."
PRODUCTS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/products")
PRODUCTS_CODE=$(echo "$PRODUCTS_RESPONSE" | tail -n1)
PRODUCTS_BODY=$(echo "$PRODUCTS_RESPONSE" | head -n-1)

if [ "$PRODUCTS_CODE" = "200" ]; then
    echo "✅ Products endpoint passed"
    PRODUCT_COUNT=$(echo "$PRODUCTS_BODY" | grep -o '"id"' | wc -l)
    echo "   Found $PRODUCT_COUNT products"
else
    echo "❌ Products endpoint failed (HTTP $PRODUCTS_CODE)"
    echo "   Response: $PRODUCTS_BODY"
fi

echo ""
echo "====================="
echo "✅ Backend is working!"
echo ""
echo "Next steps:"
echo "1. Copy this URL: $BACKEND_URL"
echo "2. Go to Vercel dashboard"
echo "3. Add environment variable:"
echo "   BACKEND_API_URL=$BACKEND_URL"
echo "4. Redeploy your frontend"
echo ""
