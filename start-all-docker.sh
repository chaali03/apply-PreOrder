#!/bin/bash

echo "🚀 Starting SCAFF*FOOD Complete Stack (Docker)"
echo "==============================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop first"
    exit 1
fi

echo "🐳 Docker is running"
echo ""

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

echo ""
echo "🏗️  Building backend image..."
docker-compose build api

echo ""
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
echo ""

# Wait for PostgreSQL
echo "📊 Waiting for PostgreSQL..."
until docker exec scafffood-postgres pg_isready -U postgres > /dev/null 2>&1; do
    printf "."
    sleep 2
done
echo " ✅ PostgreSQL ready!"

# Wait for API
echo "🔧 Waiting for API..."
sleep 5
until curl -s http://localhost:8080/api/health > /dev/null 2>&1; do
    printf "."
    sleep 2
done
echo " ✅ API ready!"

# Wait for Cloudflare Tunnel
echo "🌐 Waiting for Cloudflare Tunnel..."
sleep 5

# Get tunnel URL
TUNNEL_URL=$(docker logs scafffood-cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1)

echo ""
echo "==============================================="
echo "✅ All Services Started!"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🌐 URLs:"
echo "   Backend (local):  http://localhost:8080"
echo "   Database Admin:   http://localhost:8081"
echo "   Tunnel (public):  $TUNNEL_URL"
echo ""
echo "🔑 Database Credentials:"
echo "   Host:     localhost"
echo "   Port:     5432"
echo "   User:     postgres"
echo "   Password: change_me"
echo "   Database: management_preorder"
echo ""
echo "🔑 Login Email: scafffood@gmail.com"
echo ""
echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. Copy Tunnel URL:"
echo "   $TUNNEL_URL"
echo ""
echo "2. Set in Vercel:"
echo "   - Go to: https://vercel.com/dashboard"
echo "   - Project → Settings → Environment Variables"
echo "   - Add: BACKEND_API_URL = $TUNNEL_URL"
echo ""
echo "3. Push code to deploy:"
echo "   git add ."
echo "   git commit -m 'Add API proxy and Docker setup'"
echo "   git push"
echo ""
echo "4. Test locally:"
echo "   npm run dev"
echo "   Visit: http://localhost:3000/login"
echo ""
echo "🧪 Test Commands:"
echo "   curl http://localhost:8080/api/health"
echo "   curl $TUNNEL_URL/api/health"
echo ""
echo "📊 View Logs:"
echo "   docker-compose logs -f"
echo "   docker-compose logs -f api"
echo "   docker-compose logs -f cloudflared"
echo ""
echo "🛑 Stop All:"
echo "   docker-compose down"
echo ""
