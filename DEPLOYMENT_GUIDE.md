# دليل النشر (Deployment Guide)

## نظرة عامة

هذا الدليل يشرح كيفية نشر نظام إدارة المركز الإعلامي باستخدام Docker و Docker Compose.

## المتطلبات الأساسية

- Docker (الإصدار 20.10 أو أحدث)
- Docker Compose (الإصدار 2.0 أو أحدث)
- قاعدة بيانات PostgreSQL (يمكن استخدام Render أو أي خدمة أخرى)
- خادم AI Classifier (اختياري)

## البنية التحتية

النظام يتكون من:
- **Backend**: Node.js + TypeScript API (Port 4000)
- **Frontend**: React + Vite + Nginx (Port 80)
- **Database**: PostgreSQL (خارجي)

---

## 1. الإعداد الأولي

### 1.1 نسخ المشروع

```bash
git clone <repository-url>
cd media-center-management-system
```

### 1.2 إعداد ملف البيئة

انسخ ملف `.env.example` إلى `.env`:

```bash
cp .env.example .env
```

قم بتعديل ملف `.env` بالمعلومات الصحيحة:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Server Configuration
PORT=4000
NODE_ENV=production

# AI Classifier Configuration (اختياري)
AI_MODEL=http://your-ai-classifier-url:8080

# Articles Configuration
ARTICLES_PER_SOURCE=20

# Scheduler Configuration (بالدقائق)
SCHEDULER_INTERVAL=10
```

---

## 2. البناء والنشر باستخدام Docker Compose

### 2.1 بناء الصور (Build Images)

```bash
docker-compose build
```

هذا الأمر سيقوم ببناء:
- صورة Backend من `Dockerfile.backend`
- صورة Frontend من `Dockerfile.frontend`

### 2.2 تشغيل الخدمات

```bash
docker-compose up -d
```

الخيار `-d` يعني التشغيل في الخلفية (detached mode).

### 2.3 التحقق من حالة الخدمات

```bash
docker-compose ps
```

يجب أن ترى:
```
NAME              STATUS          PORTS
media-backend     Up (healthy)    0.0.0.0:4000->4000/tcp
media-frontend    Up              0.0.0.0:80->80/tcp
```

### 2.4 عرض السجلات (Logs)

```bash
# جميع الخدمات
docker-compose logs -f

# Backend فقط
docker-compose logs -f backend

# Frontend فقط
docker-compose logs -f frontend
```

---

## 3. الوصول إلى التطبيق

بعد التشغيل الناجح:

- **Frontend**: http://localhost أو http://localhost/dashboard/
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health
- **API Documentation**: http://localhost:4000/api-docs (إذا كان Swagger مفعل)

---

## 4. إدارة الخدمات

### إيقاف الخدمات

```bash
docker-compose stop
```

### إعادة تشغيل الخدمات

```bash
docker-compose restart
```

### إيقاف وحذف الحاويات

```bash
docker-compose down
```

### إيقاف وحذف الحاويات مع الشبكات والأحجام

```bash
docker-compose down -v
```

### إعادة البناء والتشغيل

```bash
docker-compose up -d --build
```

---

## 5. التحديثات والصيانة

### 5.1 تحديث الكود

```bash
# سحب آخر التحديثات
git pull origin main

# إعادة البناء والتشغيل
docker-compose up -d --build
```

### 5.2 تحديث خدمة واحدة فقط

```bash
# تحديث Backend فقط
docker-compose up -d --build backend

# تحديث Frontend فقط
docker-compose up -d --build frontend
```

### 5.3 الدخول إلى حاوية للتصحيح

```bash
# الدخول إلى Backend
docker exec -it media-backend sh

# الدخول إلى Frontend
docker exec -it media-frontend sh
```

---

## 6. إعداد قاعدة البيانات

### 6.1 تشغيل SQL Scripts

إذا كنت بحاجة لتشغيل SQL scripts من مجلد `sql/`:

```bash
# مثال: إنشاء جدول system_settings
psql $DATABASE_URL -f sql/create_system_settings.sql

# أو باستخدام Docker إذا كانت قاعدة البيانات في حاوية
docker exec -i postgres-container psql -U username -d database < sql/create_system_settings.sql
```

### 6.2 Scripts المهمة

- `sql/create_system_settings.sql` - إنشاء جدول إعدادات النظام
- `sql/add_incomplete_status_to_queue.sql` - إضافة حالة incomplete للمقالات
- `sql/cleanup_all_news_data.sql` - تنظيف بيانات الأخبار
- `sql/cleanup_duplicate_articles.sql` - حذف المقالات المكررة

---

## 7. النشر على الإنتاج (Production)

### 7.1 اعتبارات الأمان

1. **تغيير المنافذ الافتراضية** (اختياري):
   ```yaml
   # في docker-compose.yml
   ports:
     - "8080:4000"  # بدلاً من 4000:4000
     - "8081:80"    # بدلاً من 80:80
   ```

2. **استخدام HTTPS**:
   - استخدم Nginx Proxy Manager أو Traefik
   - أو استخدم Let's Encrypt مع Certbot

3. **تأمين ملف .env**:
   ```bash
   chmod 600 .env
   ```

4. **استخدام Docker Secrets** (للبيانات الحساسة):
   ```yaml
   secrets:
     db_password:
       file: ./secrets/db_password.txt
   ```

### 7.2 استخدام Docker Swarm (اختياري)

```bash
# تهيئة Swarm
docker swarm init

# نشر Stack
docker stack deploy -c docker-compose.yml media-stack

# عرض الخدمات
docker service ls

# عرض السجلات
docker service logs media-stack_backend
```

### 7.3 استخدام Kubernetes (اختياري)

يمكنك تحويل `docker-compose.yml` إلى Kubernetes manifests باستخدام Kompose:

```bash
# تثبيت Kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.31.2/kompose-linux-amd64 -o kompose
chmod +x kompose
sudo mv kompose /usr/local/bin/

# تحويل إلى Kubernetes
kompose convert

# تطبيق على Kubernetes
kubectl apply -f .
```

---

## 8. المراقبة والصحة (Monitoring & Health)

### 8.1 Health Checks

Backend يحتوي على health check endpoint:

```bash
curl http://localhost:4000/health
```

Docker Compose يقوم بفحص صحة Backend تلقائياً كل 30 ثانية.

### 8.2 مراقبة الموارد

```bash
# عرض استخدام الموارد
docker stats

# عرض استخدام موارد خدمة معينة
docker stats media-backend
```

### 8.3 إعداد Logging

لحفظ السجلات في ملفات:

```yaml
# إضافة إلى docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 9. النسخ الاحتياطي (Backup)

### 9.1 نسخ احتياطي لقاعدة البيانات

```bash
# نسخ احتياطي
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# استعادة
psql $DATABASE_URL < backup_20240421_120000.sql
```

### 9.2 نسخ احتياطي للبيانات المحلية

```bash
# نسخ ملف .env
cp .env .env.backup

# نسخ احتياطي للمشروع كامل
tar -czf media-center-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=frontend/node_modules \
  --exclude=.git \
  .
```

---

## 10. استكشاف الأخطاء (Troubleshooting)

### 10.1 Backend لا يعمل

```bash
# فحص السجلات
docker-compose logs backend

# فحص الاتصال بقاعدة البيانات
docker exec -it media-backend sh
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()').then(r => console.log(r.rows)).catch(e => console.error(e));"
```

### 10.2 Frontend لا يعمل

```bash
# فحص السجلات
docker-compose logs frontend

# فحص ملفات Nginx
docker exec -it media-frontend sh
ls -la /usr/share/nginx/html
cat /etc/nginx/conf.d/default.conf
```

### 10.3 مشاكل الشبكة بين الخدمات

```bash
# فحص الشبكة
docker network ls
docker network inspect media-network

# اختبار الاتصال من Frontend إلى Backend
docker exec -it media-frontend sh
wget -qO- http://backend:4000/health
```

### 10.4 مشاكل البناء (Build Issues)

```bash
# حذف الصور القديمة وإعادة البناء
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

---

## 11. الأوامر المفيدة

```bash
# عرض جميع الحاويات (حتى المتوقفة)
docker ps -a

# حذف جميع الحاويات المتوقفة
docker container prune

# حذف جميع الصور غير المستخدمة
docker image prune -a

# حذف جميع الأحجام غير المستخدمة
docker volume prune

# تنظيف شامل للنظام
docker system prune -a --volumes

# عرض حجم الصور
docker images

# عرض معلومات مفصلة عن حاوية
docker inspect media-backend

# نسخ ملفات من/إلى حاوية
docker cp media-backend:/app/logs ./logs
docker cp ./config.json media-backend:/app/config.json
```

---

## 12. متغيرات البيئة الكاملة

```env
# ===== Database =====
DATABASE_URL=postgresql://user:password@host:5432/database

# ===== Server =====
PORT=4000
NODE_ENV=production

# ===== AI Classifier =====
AI_MODEL=http://ai-classifier:8080

# ===== Articles =====
ARTICLES_PER_SOURCE=20

# ===== Scheduler =====
SCHEDULER_INTERVAL=10

# ===== Security (اختياري) =====
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# ===== CORS (اختياري) =====
CORS_ORIGIN=http://localhost

# ===== Logging (اختياري) =====
LOG_LEVEL=info
```

---

## 13. الأداء والتحسين

### 13.1 تحسين حجم الصور

الصور الحالية تستخدم multi-stage builds لتقليل الحجم:
- Backend: ~150MB (Node Alpine + production dependencies)
- Frontend: ~25MB (Nginx Alpine + static files)

### 13.2 Caching

Docker Compose يستخدم build cache تلقائياً. للاستفادة القصوى:
- لا تغير ترتيب الأوامر في Dockerfile
- انسخ `package.json` قبل نسخ الكود الكامل

### 13.3 Resource Limits

يمكنك تحديد موارد لكل خدمة:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## 14. الدعم والمساعدة

### السجلات المهمة

- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`
- Nginx access logs: `docker exec media-frontend cat /var/log/nginx/access.log`
- Nginx error logs: `docker exec media-frontend cat /var/log/nginx/error.log`

### الاتصال بالدعم

إذا واجهت مشاكل:
1. تحقق من السجلات أولاً
2. تأكد من صحة متغيرات البيئة
3. تحقق من الاتصال بقاعدة البيانات
4. راجع قسم استكشاف الأخطاء

---

## 15. الخلاصة

هذا الدليل يغطي جميع جوانب نشر النظام باستخدام Docker. للبدء السريع:

```bash
# 1. إعداد البيئة
cp .env.example .env
# عدل .env بالمعلومات الصحيحة

# 2. البناء والتشغيل
docker-compose up -d --build

# 3. التحقق
docker-compose ps
curl http://localhost:4000/health
curl http://localhost/dashboard/

# 4. عرض السجلات
docker-compose logs -f
```

✅ **النظام جاهز للعمل!**
