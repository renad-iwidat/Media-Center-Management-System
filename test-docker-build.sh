#!/bin/bash

# ===================================
# سكريبت اختبار بناء Docker للـ Frontend
# ===================================

set -e

echo "🐳 بدء اختبار بناء Docker للـ Frontend..."
echo ""

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# المتغيرات البيئية للاختبار
VITE_API_URL="https://automation-and-ai-hub-backend.onrender.com"
VITE_MANAGEMENT_API_URL="https://media-center-management-system.onrender.com"

echo -e "${BLUE}📦 الخطوة 1: بناء صورة Docker...${NC}"
docker build \
  --build-arg VITE_API_URL="$VITE_API_URL" \
  --build-arg VITE_MANAGEMENT_API_URL="$VITE_MANAGEMENT_API_URL" \
  -f Dockerfile.frontend \
  -t media-center-frontend:test \
  .

echo ""
echo -e "${GREEN}✅ تم بناء الصورة بنجاح!${NC}"
echo ""

echo -e "${BLUE}🚀 الخطوة 2: تشغيل الحاوية...${NC}"
docker run -d \
  -p 8080:80 \
  -e VITE_API_URL="$VITE_API_URL" \
  -e VITE_MANAGEMENT_API_URL="$VITE_MANAGEMENT_API_URL" \
  --name frontend-test \
  media-center-frontend:test

echo ""
echo -e "${GREEN}✅ تم تشغيل الحاوية بنجاح!${NC}"
echo ""

# انتظر قليلاً حتى يبدأ nginx
echo -e "${BLUE}⏳ انتظار بدء Nginx...${NC}"
sleep 3

echo ""
echo -e "${BLUE}🔍 الخطوة 3: اختبار Health Check...${NC}"
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Health check يعمل بنجاح!${NC}"
else
  echo -e "${RED}❌ Health check فشل!${NC}"
  docker logs frontend-test
  docker stop frontend-test
  docker rm frontend-test
  exit 1
fi

echo ""
echo -e "${BLUE}🔍 الخطوة 4: اختبار env-config.js...${NC}"
echo "محتوى env-config.js:"
curl -s http://localhost:8080/env-config.js
echo ""

echo ""
echo -e "${BLUE}🔍 الخطوة 5: اختبار الصفحة الرئيسية...${NC}"
if curl -f http://localhost:8080/ > /dev/null 2>&1; then
  echo -e "${GREEN}✅ الصفحة الرئيسية تعمل بنجاح!${NC}"
else
  echo -e "${RED}❌ الصفحة الرئيسية فشلت!${NC}"
  docker logs frontend-test
  docker stop frontend-test
  docker rm frontend-test
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 جميع الاختبارات نجحت!${NC}"
echo ""
echo -e "${BLUE}📊 معلومات الحاوية:${NC}"
docker ps | grep frontend-test

echo ""
echo -e "${BLUE}📝 للوصول إلى التطبيق:${NC}"
echo "   http://localhost:8080"
echo ""
echo -e "${BLUE}📝 لإيقاف الحاوية:${NC}"
echo "   docker stop frontend-test"
echo "   docker rm frontend-test"
echo ""
echo -e "${BLUE}📝 لعرض logs:${NC}"
echo "   docker logs frontend-test"
echo ""
