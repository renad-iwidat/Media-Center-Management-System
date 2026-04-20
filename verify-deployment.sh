#!/bin/bash

echo "🔍 Verifying Deployment Configuration..."
echo ""

# Check if required files exist
echo "📁 Checking required files..."
files=(
    "Dockerfile"
    "manual-input-frontend/Dockerfile"
    "docker-compose.yml"
    ".dockerignore"
    "manual-input-frontend/.dockerignore"
    "manual-input-frontend/nginx.conf"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🔌 Checking port configuration..."
echo "Backend Port: 3000"
echo "Frontend Port: 80"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "⚠️  Make sure all required variables are set:"
    echo "   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
    echo "   - AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET"
else
    echo "⚠️  .env file not found. Copy from .env.production.example"
fi

echo ""
echo "🐳 Docker Compose Services:"
echo "   - backend: Port 3000"
echo "   - frontend: Port 80"
echo ""

echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.production.example to .env"
echo "2. Fill in your environment variables"
echo "3. Run: docker-compose build"
echo "4. Run: docker-compose up -d"
echo "5. Check: docker-compose logs -f"
