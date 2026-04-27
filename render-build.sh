#!/bin/bash
# Render Build Script for Backend

set -e  # Exit on error

echo "🔧 Installing dependencies..."
npm ci

echo "🏗️ Building TypeScript..."
npm run build

echo "✅ Verifying build output..."
if [ ! -d "dist" ]; then
  echo "❌ Error: dist directory not found!"
  exit 1
fi

if [ ! -f "dist/index.js" ]; then
  echo "❌ Error: dist/index.js not found!"
  exit 1
fi

echo "📦 Build completed successfully!"
ls -la dist/
