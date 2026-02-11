#!/bin/bash

# Script untuk restore frontend files setelah backend deployed

echo "🔄 Restoring frontend files..."

if [ -f "pnpm-lock.yaml.bak" ]; then
    mv pnpm-lock.yaml.bak pnpm-lock.yaml
    echo "✅ Restored pnpm-lock.yaml"
fi

if [ -f "package.json.bak" ]; then
    mv package.json.bak package.json
    echo "✅ Restored package.json"
fi

if [ -f "package-lock.json.bak" ]; then
    mv package-lock.json.bak package-lock.json
    echo "✅ Restored package-lock.json"
fi

echo ""
echo "✅ Frontend files restored!"
echo "Now you can work on frontend locally."
