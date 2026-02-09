#!/bin/bash

# SCAFF*FOOD Backend Startup Script
# This script starts the Fiber backend with SMTP configuration

echo "🚀 Starting SCAFF*FOOD Backend..."
echo ""

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Error: Go is not installed"
    echo "Please install Go from https://go.dev/dl/"
    exit 1
fi

# Navigate to api directory
cd "$(dirname "$0")"

# Load environment variables from .env file
if [ -f .env ]; then
    echo "✅ Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .env file not found"
    echo "Using default SMTP configuration"
fi

# Install dependencies
echo "📦 Installing dependencies..."
go mod download

# Start the server
echo ""
echo "🌟 Starting Fiber server on port ${PORT:-8080}..."
echo "📧 SMTP: ${SMTP_HOST:-smtp.gmail.com}:${SMTP_PORT:-587}"
echo "📨 From: ${SMTP_FROM:-noreply@scafffood.com}"
echo ""
echo "Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run the server
go run main.go
