#!/bin/bash

# Kill existing tunnel
pkill -f cloudflared

# Start tunnel in background
nohup cloudflared tunnel --url http://localhost:8080 > tunnel.log 2>&1 &

# Wait for tunnel to start
sleep 5

# Get URL
echo "🚀 Cloudflare Tunnel started!"
echo "📋 URL:"
grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunnel.log | tail -1
