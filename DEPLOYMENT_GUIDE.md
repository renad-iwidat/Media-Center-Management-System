# دليل النشر على Render

## 📋 المتطلبات الأساسية

1. حساب على [Render](https://render.com)
2. Repository على GitHub/GitLab/Bitbucket
3. قاعدة بيانات PostgreSQL (يمكن استخدام Render PostgreSQL)
4. حساب على Management System API (للـ Authentication) - مُنشر مسبقاً على: `https://media-center-management-system.onrender.com`

## 🏗️ معلومات النظام

النظام يتكون من **ثلاثة أجزاء**:

1. **Management API** (مُنشر مسبقاً على Render):
   - مسؤول عن: Authentication (تسجيل الدخول/الخروج)
   - الرابط: `https://media-center-management-system.onrender.com`
   - لا يحتاج إعادة نشر

2. **News API (Backend)**:
   - مسؤول عن: الأخبار، الوحدات الإعلامية، AI Hub، إلخ
   - يحتاج نشر على Render

3. **Frontend**:
   - واجهة المستخدم
   - يتصل بـ Management API للـ Authentication
   - يتصل بـ News API لباقي العمليات

## 🚀 خطوات النشر

### ✅ قبل البدء - Checklist:

- [ ] تأكد من أن `JWT_SECRET` في ملف `.env` مطابق للقيمة في Management API
- [ ] حدّث `frontend/.env` ليحتوي على:
  ```
  VITE_MANAGEMENT_API_URL=https://media-center-management-system.onrender.com
  VITE_API_URL=http://localhost:7845  # سيتم تغييره بعد النشر
  ```
- [ ] تأكد من أن جميع المتغيرات البيئية المطلوبة موجودة
- [ ] اختبر النظام محلياً قبل النشر
- [ ] تأكد من أن قاعدة البيانات جاهزة ومتصلة

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
   
   في Backend Service (News API):
   - `DATABASE_URL`: رابط قاعدة البيانات PostgreSQL
   - `AI_MODEL`: رابط خدمة AI Classifier
   - `OPENAI_API_KEY`: مفتاح OpenAI API
   - `JWT_SECRET`: مفتاح سري لتوقيع JWT tokens (يجب أن يكون نفسه في Management API)
   - `JWT_EXPIRES_IN`: مدة صلاحية التوكن (مثال: `24h`)
   
   في Frontend Service:
   - `VITE_MANAGEMENT_API_URL`: رابط Management API (للـ Authentication)
   - `VITE_API_URL`: رابط News API (Backend)

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
   PORT=7845
   DATABASE_URL=postgresql://user:password@host:5432/database
   AI_MODEL=http://your-ai-service-url
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
   JWT_SECRET=your-secret-key-here-must-match-management-api
   JWT_EXPIRES_IN=24h
   ARTICLES_PER_SOURCE=20
   SCHEDULER_INTERVAL=10
   ```
   
   ⚠️ **مهم جداً**: `JWT_SECRET` يجب أن يكون **نفس القيمة** المستخدمة في Management API

4. **Health Check Path**: `/health`

#### Frontend:

1. **إنشاء Web Service جديد**
   - Name: `media-center-frontend`
   - Environment: `Docker`
   - Dockerfile Path: `./Dockerfile.frontend`

2. **Environment Variables**
   ```
   VITE_MANAGEMENT_API_URL=https://media-center-management-system.onrender.com
   VITE_API_URL=https://media-center-backend.onrender.com
   ```
   
   📝 **ملاحظة**: 
   - `VITE_MANAGEMENT_API_URL`: للـ Authentication فقط (تسجيل دخول/خروج)
   - `VITE_API_URL`: لباقي العمليات (أخبار، وحدات إعلامية، AI Hub)

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

## 🔑 المتغيرات البيئية المطلوبة

### Backend (News API):

| المتغير | الوصف | مثال | إلزامي |
|---------|-------|------|--------|
| `NODE_ENV` | بيئة التشغيل | `production` | ✅ |
| `PORT` | رقم البورت | `7845` | ✅ |
| `DATABASE_URL` | رابط قاعدة البيانات PostgreSQL | `postgresql://user:pass@host:5432/db` | ✅ |
| `AI_MODEL` | رابط خدمة AI Classifier | `http://93.127.132.59:8080` | ✅ |
| `OPENAI_API_KEY` | مفتاح OpenAI API | `sk-proj-xxxxx` | ✅ |
| `JWT_SECRET` | مفتاح سري لتوقيع JWT (يجب أن يطابق Management API) | `e42d385d0a0a1a96449b5f9192bb4894` | ✅ |
| `JWT_EXPIRES_IN` | مدة صلاحية التوكن | `24h` | ✅ |
| `ARTICLES_PER_SOURCE` | عدد الأخبار لكل مصدر | `20` | ⚪ |
| `SCHEDULER_INTERVAL` | فترة تشغيل الـ Scheduler (بالدقائق) | `10` | ⚪ |

### Frontend:

| المتغير | الوصف | مثال | إلزامي |
|---------|-------|------|--------|
| `VITE_MANAGEMENT_API_URL` | رابط Management API (للـ Authentication) | `https://media-center-management-system.onrender.com` | ✅ |
| `VITE_API_URL` | رابط News API (Backend) | `https://your-backend.onrender.com` | ✅ |

⚠️ **تحذير مهم**: 
- `JWT_SECRET` في News API يجب أن يكون **نفس القيمة** المستخدمة في Management API
- إذا كانت القيم مختلفة، سيفشل التحقق من التوكن وسيتم رفض جميع الطلبات

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
3. تحقق من Health Check endpoint (`/health`)
4. تأكد من `JWT_SECRET` موجود ومطابق للـ Management API

### Frontend لا يتصل بـ Backend:

1. تحقق من `VITE_API_URL` في Frontend
2. تأكد من CORS مفعّل في Backend
3. تحقق من أن Backend يعمل
4. تأكد من `VITE_MANAGEMENT_API_URL` صحيح

### مشاكل تسجيل الدخول (Authentication):

1. **خطأ "Invalid or expired token"**:
   - تأكد من أن `JWT_SECRET` في News API **مطابق تماماً** للقيمة في Management API
   - تحقق من أن التوكن لم تنتهي صلاحيته (`JWT_EXPIRES_IN`)

2. **خطأ "Unauthorized"**:
   - تأكد من أن التوكن يُرسل في الـ Header بشكل صحيح
   - تحقق من أن middleware الـ authentication يعمل

3. **لا تظهر الوحدات الإعلامية**:
   - تأكد من أن Frontend يستدعي `/api/data/media-units` من News API وليس Management API
   - تحقق من أن جدول `media_units` موجود في قاعدة البيانات

### Database Connection Issues:

1. تحقق من `DATABASE_URL` format:
   ```
   postgresql://username:password@host:port/database?sslmode=require
   ```
2. تأكد من أن Database accessible من Render
3. تحقق من SSL settings (أضف `?sslmode=require` في النهاية)

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
