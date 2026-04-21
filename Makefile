# Makefile للمشروع - تسهيل أوامر Docker

.PHONY: help build up down restart logs logs-backend logs-frontend clean rebuild status health

# الأمر الافتراضي
help:
	@echo "الأوامر المتاحة:"
	@echo "  make build          - بناء الصور (Build images)"
	@echo "  make up             - تشغيل الخدمات (Start services)"
	@echo "  make down           - إيقاف الخدمات (Stop services)"
	@echo "  make restart        - إعادة تشغيل الخدمات (Restart services)"
	@echo "  make logs           - عرض السجلات (Show logs)"
	@echo "  make logs-backend   - عرض سجلات Backend"
	@echo "  make logs-frontend  - عرض سجلات Frontend"
	@echo "  make clean          - تنظيف كامل (Clean all)"
	@echo "  make rebuild        - إعادة البناء والتشغيل (Rebuild & start)"
	@echo "  make status         - عرض حالة الخدمات (Show status)"
	@echo "  make health         - فحص صحة الخدمات (Health check)"
	@echo "  make shell-backend  - الدخول إلى Backend container"
	@echo "  make shell-frontend - الدخول إلى Frontend container"

# بناء الصور
build:
	@echo "🔨 بناء الصور..."
	docker-compose build

# تشغيل الخدمات
up:
	@echo "🚀 تشغيل الخدمات..."
	docker-compose up -d
	@echo "✅ الخدمات تعمل الآن!"
	@echo "   Frontend: http://localhost"
	@echo "   Backend:  http://localhost:4000"

# إيقاف الخدمات
down:
	@echo "🛑 إيقاف الخدمات..."
	docker-compose down

# إعادة تشغيل الخدمات
restart:
	@echo "🔄 إعادة تشغيل الخدمات..."
	docker-compose restart

# عرض السجلات
logs:
	docker-compose logs -f

# عرض سجلات Backend
logs-backend:
	docker-compose logs -f backend

# عرض سجلات Frontend
logs-frontend:
	docker-compose logs -f frontend

# تنظيف كامل
clean:
	@echo "🧹 تنظيف كامل..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ تم التنظيف!"

# إعادة البناء والتشغيل
rebuild:
	@echo "🔨 إعادة البناء والتشغيل..."
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "✅ تم إعادة البناء والتشغيل!"

# عرض حالة الخدمات
status:
	@echo "📊 حالة الخدمات:"
	docker-compose ps

# فحص صحة الخدمات
health:
	@echo "🏥 فحص صحة الخدمات..."
	@echo "\n📡 Backend Health:"
	@curl -s http://localhost:4000/health || echo "❌ Backend غير متاح"
	@echo "\n\n🌐 Frontend Health:"
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost/dashboard/ || echo "❌ Frontend غير متاح"

# الدخول إلى Backend container
shell-backend:
	docker exec -it media-backend sh

# الدخول إلى Frontend container
shell-frontend:
	docker exec -it media-frontend sh

# تحديث Backend فقط
update-backend:
	@echo "🔄 تحديث Backend..."
	docker-compose up -d --build backend

# تحديث Frontend فقط
update-frontend:
	@echo "🔄 تحديث Frontend..."
	docker-compose up -d --build frontend

# عرض استخدام الموارد
stats:
	docker stats media-backend media-frontend
