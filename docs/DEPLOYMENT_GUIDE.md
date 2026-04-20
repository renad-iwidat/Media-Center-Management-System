# دليل النشر (Deployment Guide)

## نظرة عامة

هذا الدليل يشرح كيفية نشر نظام الإدخال اليدوي باستخدام Docker و Docker Compose على Render أو أي خدمة استضافة أخرى.

---

## البنية (Architecture)

النظام مقسم إلى خدمتين منفصلتين:

1. **Backend Service** (Node.js + Express + TypeScript)
   - Port: 3000
   - API endpoints
   - Database connection
   - S3 integration

2. **Frontend Service** (React + Vite + Nginx)
   - Port: 80
   - Static files
   - Proxy to backend

---

## المتطلبات (Prerequisites)

### 1. قاعدة بيانات PostgreSQL
- يجب أن يكون لديك قاعدة بيانات PostgreSQL جاهزة
- يفضل استخدام خدمة مُدارة مثل:
  - Render PostgreSQL
  - AWS RDS
  - Supabase
  - ElephantSQL

### 2. AWS S3 Bucket
- Bucket جاهز لتخزين ملفات الصوت والفيديو
- Access Key و Secret Key

### 3. Docker و Docker Compose
- مثبتين على جهازك المحلي للاختبار
- Render يدعم Docker مباشرة

---

## خطوات النشر على Render

### الخطوة 1: إعداد قاعدة البيانات

1. أنشئ PostgreSQL database على Render:
   - اذهب إلى Dashboard → New → PostgreSQL
   - اختر الخطة المناسبة
   - احفظ الـ Connection String

2. قم بتشغيل الـ migrations:
```bash
# من جهازك المحلي
npm run migrate
```

3. قم بإعداد الجداول المطلوبة:
```bash
# تشغيل سكريبتات الإعداد
ts-node src/utils/manual-input/create-uploaded-files-table.ts
ts-node src/utils/manual-input/setup-manual-input-sources.ts
ts-node src/utils/manual-input/move-media-unit-to-raw-data.ts
```

---

### الخطوة 2: نشر Backend

1. **إنشاء Web Service جديد على Render:**
   - اذهب إلى Dashboard → New → Web Service
   - اربط GitHub repository
   - اختر branch: `manual-reporter-input`

2. **إعدادات الـ Service:**
   ```
   Name: manual-input-backend
   Region: اختر الأقرب لك
   Branch: manual-reporter-input
   Root Directory: . (leave empty)
   Environment: Docker
   Dockerfile Path: ./Dockerfile
   ```

3. **إضافة Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=<your-db-host>
   DB_PORT=5432
   DB_NAME=<your-db-name>
   DB_USER=<your-db-user>
   DB_PASSWORD=<your-db-password>
   DB_SSL=true
   AWS_REGION=eu-north-1
   AWS_ACCESS_KEY_ID=<your-aws-key>
   AWS_SECRET_ACCESS_KEY=<your-aws-secret>
   AWS_S3_BUCKET=<your-bucket-name>
   ```

4. **اضغط Create Web Service**

5. **انتظر حتى يكتمل الـ deployment**
   - سيظهر لك URL مثل: `https://manual-input-backend.onrender.com`
   - احفظ هذا الـ URL

---

### الخطوة 3: نشر Frontend

1. **إنشاء Web Service جديد:**
   - Dashboard → New → Web Service
   - نفس الـ repository
   - نفس الـ branch

2. **إعدادات الـ Service:**
   ```
   Name: manual-input-frontend
   Region: نفس region الـ backend
   Branch: manual-reporter-input
   Root Directory: manual-input-frontend
   Environment: Docker
   Dockerfile Path: ./manual-input-frontend/Dockerfile
   ```

3. **تعديل nginx.conf قبل الـ deployment:**
   - افتح `manual-input-frontend/nginx.conf`
   - غير `proxy_pass http://backend:3000;`
   - إلى: `proxy_pass https://manual-input-backend.onrender.com;`
   - (استخدم الـ URL من الخطوة السابقة)

4. **اضغط Create Web Service**

5. **انتظر حتى يكتمل الـ deployment**
   - سيظهر لك URL مثل: `https://manual-input-frontend.onrender.com`

---

## الاختبار بعد النشر

### 1. اختبار Backend
```bash
# Health check
curl https://manual-input-backend.onrender.com/api/health

# Get users
curl https://manual-input-backend.onrender.com/api/manual-input/users

# Get media units
curl https://manual-input-backend.onrender.com/api/manual-input/media-units
```

### 2. اختبار Frontend
- افتح: `https://manual-input-frontend.onrender.com`
- جرب الصفحة الرئيسية
- جرب إدخال نص
- جرب رفع صوت
- جرب رفع فيديو

---

## النشر المحلي باستخدام Docker Compose

### 1. إعداد Environment Variables
```bash
# انسخ الملف
cp .env.production.example .env

# عدل القيم
nano .env
```

### 2. بناء وتشغيل الـ Containers
```bash
# بناء الـ images
docker-compose build

# تشغيل الـ services
docker-compose up -d

# مشاهدة الـ logs
docker-compose logs -f
```

### 3. الوصول للتطبيق
- Frontend: http://localhost
- Backend: http://localhost:3000
- API: http://localhost:3000/api

### 4. إيقاف الـ Services
```bash
docker-compose down
```

---

## استكشاف الأخطاء (Troubleshooting)

### مشكلة: Backend لا يتصل بقاعدة البيانات
**الحل:**
- تأكد من صحة الـ connection string
- تأكد من تفعيل `DB_SSL=true`
- تحقق من الـ firewall rules

### مشكلة: Frontend لا يتصل بـ Backend
**الحل:**
- تأكد من تحديث `nginx.conf` بالـ URL الصحيح
- تأكد من أن Backend يعمل
- تحقق من الـ CORS settings

### مشكلة: رفع الملفات لا يعمل
**الحل:**
- تأكد من صحة AWS credentials
- تأكد من permissions الـ S3 bucket
- تحقق من الـ bucket policy

### مشكلة: الكاميرا لا تعمل
**الحل:**
- تأكد من استخدام HTTPS (Render يوفره تلقائياً)
- تأكد من صلاحيات المتصفح
- جرب متصفح مختلف (Chrome أو Edge)

---

## الأمان (Security)

### 1. Environment Variables
- لا تضع الـ secrets في الكود
- استخدم Render Environment Variables
- غير الـ passwords بشكل دوري

### 2. Database
- استخدم SSL connection
- استخدم strong passwords
- قيد الوصول بـ IP whitelist إن أمكن

### 3. S3 Bucket
- استخدم IAM user محدد الصلاحيات
- فعّل encryption
- استخدم bucket policy محكم

### 4. CORS
- قيد الـ origins المسموحة
- لا تستخدم `*` في production

---

## المراقبة (Monitoring)

### Render Dashboard
- راقب الـ CPU و Memory usage
- راقب الـ logs
- فعّل الـ alerts

### Health Checks
- Backend: `/api/health`
- Frontend: `/`

### Logs
```bash
# عرض logs الـ backend
docker-compose logs backend

# عرض logs الـ frontend
docker-compose logs frontend

# متابعة الـ logs
docker-compose logs -f
```

---

## التحديثات (Updates)

### تحديث Backend
1. Push التغييرات إلى GitHub
2. Render سيعمل auto-deploy
3. أو اضغط "Manual Deploy" من Dashboard

### تحديث Frontend
1. Push التغييرات إلى GitHub
2. Render سيعمل auto-deploy
3. أو اضغط "Manual Deploy" من Dashboard

---

## النسخ الاحتياطي (Backup)

### Database
- استخدم Render automatic backups
- أو اعمل manual backup:
```bash
pg_dump -h <host> -U <user> -d <database> > backup.sql
```

### S3 Files
- فعّل S3 versioning
- استخدم S3 lifecycle policies
- اعمل backup لـ bucket مهم

---

## التكاليف (Costs)

### Render Free Tier
- Web Services: تنام بعد 15 دقيقة من عدم النشاط
- PostgreSQL: 90 يوم مجاناً ثم $7/شهر
- Bandwidth: 100 GB/شهر

### Render Paid Plans
- Starter: $7/شهر لكل service
- Standard: $25/شهر لكل service
- Pro: $85/شهر لكل service

### AWS S3
- Storage: ~$0.023/GB/شهر
- Requests: ~$0.005/1000 requests
- Transfer: أول 100 GB مجاناً

---

## الدعم (Support)

للمساعدة أو الأسئلة:
1. راجع الـ logs أولاً
2. تحقق من الـ documentation
3. تواصل مع فريق التطوير

---

## الخلاصة

✅ Backend و Frontend منفصلين
✅ Docker containers محسّنة
✅ Health checks مفعّلة
✅ Auto-restart مفعّل
✅ Logs متاحة
✅ Scalable architecture

النظام جاهز للإنتاج! 🚀
