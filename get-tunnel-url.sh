#!/bin/bash

# Get Cloudflare Tunnel URL from Docker logs
echo "🔍 Getting Cloudflare Tunnel URL..."
docker logs scafffood-cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1
