#!/bin/bash

echo "🌐 Setup Cloudflare Tunnel Permanent"
echo "====================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "📥 Installing cloudflared..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb
        rm cloudflared-linux-amd64.deb
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cloudflared
    else
        echo "❌ Unsupported OS. Please install manually:"
        echo "   https://github.com/cloudflare/cloudflared/releases"
        exit 1
    fi
fi

echo "✅ cloudflared installed"
echo ""

# Login
echo "🔐 Login to Cloudflare..."
echo "Browser will open. Login and select domain: scafffood.my.id"
echo ""
read -p "Press Enter to continue..."

cloudflared tunnel login

if [ $? -ne 0 ]; then
    echo "❌ Login failed"
    exit 1
fi

echo "✅ Logged in"
echo ""

# Create tunnel
echo "🚇 Creating tunnel..."
TUNNEL_OUTPUT=$(cloudflared tunnel create scafffood-backend 2>&1)

if echo "$TUNNEL_OUTPUT" | grep -q "already exists"; then
    echo "⚠️  Tunnel already exists, using existing tunnel"
    TUNNEL_ID=$(cloudflared tunnel list | grep scafffood-backend | awk '{print $1}')
else
    TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -o '[a-f0-9-]\{36\}' | head -1)
fi

echo "✅ Tunnel ID: $TUNNEL_ID"
echo ""

# Create config
echo "📝 Creating config file..."
mkdir -p ~/.cloudflared

cat > ~/.cloudflared/config.yml <<EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: api.scafffood.my.id
    service: http://localhost:8080
  - service: http_status:404
EOF

echo "✅ Config created"
echo ""

# Route DNS
echo "🌐 Setting up DNS..."
cloudflared tunnel route dns scafffood-backend api.scafffood.my.id 2>&1 | grep -v "already exists"

echo "✅ DNS configured"
echo ""

# Start backend
echo "🐳 Starting backend..."
docker-compose up -d

sleep 5

# Test backend
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend not responding, check Docker logs"
fi

echo ""

# Install as service
echo "🔧 Installing tunnel as system service..."
sudo cloudflared service install

echo "✅ Service installed"
echo ""

# Start service
echo "🚀 Starting tunnel service..."
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

sleep 3

# Check status
if sudo systemctl is-active --quiet cloudflared; then
    echo "✅ Tunnel service is running"
else
    echo "⚠️  Tunnel service failed to start"
    echo "Check logs: sudo journalctl -u cloudflared -n 50"
fi

echo ""
echo "====================================="
echo "✅ Setup Complete!"
echo ""
echo "🌐 Your Backend URL:"
echo "   https://api.scafffood.my.id"
echo ""
echo "🧪 Test it:"
echo "   curl https://api.scafffood.my.id/api/health"
echo ""
echo "📝 Next Steps:"
echo "   1. Test backend: curl https://api.scafffood.my.id/api/health"
echo "   2. Set in Vercel: BACKEND_API_URL=https://api.scafffood.my.id"
echo "   3. Push code: git push"
echo "   4. Test production: https://scafffood.my.id/login"
echo ""
echo "📊 Useful Commands:"
echo "   sudo systemctl status cloudflared  - Check status"
echo "   sudo systemctl restart cloudflared - Restart tunnel"
echo "   sudo journalctl -u cloudflared -f  - View logs"
echo "   cloudflared tunnel info scafffood-backend - Tunnel info"
echo ""
