# دليل النشر على Render

## 📋 المتطلبات الأساسية

1. حساب على [Render](https://render.com)
2. Repository على GitHub/GitLab/Bitbucket
3. قاعدة بيانات PostgreSQL (يمكن استخدام Render PostgreSQL)

## 🚀 خطوات النشر

### الطريقة 1: استخدام Blueprint (موصى بها)

1. **رفع الكود إلى Git Repository**
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **إنشاء Blueprint على Render**
   - اذهب إلى [Render Dashboard](https://dashboard.render.com)
   - اضغط على "New" → "Blueprint"
   - اختر repository الخاص بك
   - Render سيكتشف ملف `render.yaml` تلقائياً

3. **إعداد المتغيرات البيئية السرية**
   
   في Backend Service:
   - `DATABASE_URL`: رابط قاعدة البيانات PostgreSQL
   - `AI_MODEL`: رابط خدمة AI Classifier
   في Frontend Service:
   - `VITE_API_URL`: رابط Backend API

4. **Deploy**
   - اضغط "Apply" وانتظر حتى يكتمل النشر

### الطريقة 2: النشر اليدوي

#### Backend:

1. **إنشاء Web Service جديد**
   - اذهب إلى Render Dashboard
   - اضغط "New" → "Web Service"
   - اختر repository الخاص بك

2. **إعدادات Service**
   - Name: `media-center-backend`
   - Environment: `Docker`
   - Dockerfile Path: `./Dockerfile.backend`
   - Region: اختر الأقرب لك
   - Branch: `main`

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=postgresql://user:password@host:5432/database
   AI_MODEL=http://your-ai-service-url
   ARTICLES_PER_SOURCE=20
   SCHEDULER_INTERVAL=10
   ```

4. **Health Check Path**: `/health`

#### Frontend:

1. **إنشاء Web Service جديد**
   - Name: `media-center-frontend`
   - Environment: `Docker`
   - Dockerfile Path: `./Dockerfile.frontend`

2. **Environment Variables**
   ```
   VITE_API_URL=https://media-center-backend.onrender.com
   VITE_APP_URL=https://media-center-frontend.onrender.com
   ```

3. **Health Check Path**: `/health`

## 🗄️ إعداد قاعدة البيانات

### استخدام Render PostgreSQL:

1. اذهب إلى Dashboard → "New" → "PostgreSQL"
2. اختر الخطة (Free tier متاح)
3. بعد الإنشاء، انسخ `Internal Database URL`
4. استخدمه في `DATABASE_URL` للـ Backend

### استخدام قاعدة بيانات خارجية:

يمكنك استخدام:
- [Supabase](https://supabase.com) (مجاني)
- [Neon](https://neon.tech) (مجاني)
- [ElephantSQL](https://www.elephantsql.com) (مجاني)

## 🔧 إعدادات إضافية

### تفعيل Auto-Deploy:

في إعدادات كل Service:
- اذهب إلى "Settings" → "Build & Deploy"
- فعّل "Auto-Deploy"

### إعداد Custom Domain:

1. اذهب إلى Service Settings
2. اضغط "Add Custom Domain"
3. اتبع التعليمات لإضافة DNS records

### Scaling:

- Free tier: خدمة واحدة مجانية
- Starter: $7/شهر لكل service
- Standard: $25/شهر مع auto-scaling

## 📊 Monitoring

### Logs:
- اذهب إلى Service → "Logs"
- شاهد real-time logs

### Metrics:
- CPU Usage
- Memory Usage
- Request Count
- Response Time

## 🔍 استكشاف الأخطاء

### Backend لا يعمل:

1. تحقق من Logs
2. تأكد من `DATABASE_URL` صحيح
3. تحقق من Health Check endpoint

### Frontend لا يتصل بـ Backend:

1. تحقق من `VITE_API_URL` في Frontend
2. تأكد من CORS مفعّل في Backend
3. تحقق من أن Backend يعمل

### Database Connection Issues:

1. تحقق من `DATABASE_URL` format:
   ```
   postgresql://username:password@host:port/database
   ```
2. تأكد من أن Database accessible من Render
3. تحقق من SSL settings

## 💰 التكاليف المتوقعة

### Free Tier:
- 1 Web Service مجاني
- 750 ساعات/شهر
- يتوقف بعد 15 دقيقة من عدم النشاط

### Starter Plan ($7/شهر لكل service):
- لا يتوقف
- 512 MB RAM
- 0.5 CPU

### مع Database:
- PostgreSQL Free: 256 MB RAM
- PostgreSQL Starter: $7/شهر (1 GB RAM)

**التكلفة الإجمالية المتوقعة:**
- Free: $0 (service واحد فقط)
- Basic: $14/شهر (Backend + Frontend)
- مع Database: $21/شهر

## 🔐 الأمان

1. **لا تضع Secrets في الكود**
   - استخدم Environment Variables في Render

2. **استخدم HTTPS**
   - Render يوفر SSL مجاناً

3. **قيّد CORS**
   - حدد domains المسموحة في Backend

## 📝 ملاحظات مهمة

1. **Build Time**: أول build قد يأخذ 5-10 دقائق
2. **Cold Start**: Free tier يتوقف بعد 15 دقيقة، أول request بعدها قد يأخذ 30 ثانية
3. **Disk Storage**: Render يوفر ephemeral disk، استخدم S3 أو Cloudinary للملفات الدائمة
4. **Database Backups**: فعّل automatic backups في PostgreSQL settings

## 🆘 الدعم

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Render Status](https://status.render.com)

## 🔄 التحديثات

لتحديث التطبيق:
```bash
git add .
git commit -m "Update application"
git push origin main
```

Render سيقوم بـ auto-deploy تلقائياً إذا كان مفعّلاً.
