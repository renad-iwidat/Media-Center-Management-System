# 🐳 دليل نشر Docker للـ Frontend

## 📋 نظرة عامة

تم إصلاح وتحسين إعداد Docker للـ frontend ليدعم:
- ✅ المتغيرات البيئية في وقت التشغيل (Runtime Environment Variables)
- ✅ Multi-stage build لتقليل حجم الصورة
- ✅ Nginx مع إعدادات محسّنة
- ✅ Health checks
- ✅ دعم SPA routing

---

## 🔧 المتغيرات البيئية المطلوبة

### Build Time (أثناء البناء)
```bash
VITE_API_URL=https://your-backend-url.onrender.com
VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com
```

### Runtime (أثناء التشغيل)
نفس المتغيرات يمكن تغييرها في وقت التشغيل دون إعادة البناء:
```bash
VITE_API_URL=https://your-backend-url.onrender.com
VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com
```

---

## 🚀 طرق النشر

### 1️⃣ البناء المحلي (Local Build)

```bash
# بناء الصورة
docker build \
  --build-arg VITE_API_URL=https://your-backend-url.onrender.com \
  --build-arg VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com \
  -f Dockerfile.frontend \
  -t media-center-frontend \
  .

# تشغيل الحاوية
docker run -d \
  -p 80:80 \
  -e VITE_API_URL=https://your-backend-url.onrender.com \
  -e VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com \
  --name frontend \
  media-center-frontend
```

### 2️⃣ استخدام Docker Compose

```bash
# تحديث ملف .env في الجذر
echo "VITE_API_URL=https://your-backend-url.onrender.com" >> .env
echo "VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com" >> .env

# بناء وتشغيل
docker-compose -f docker-compose.render.yml up --build frontend
```

### 3️⃣ النشر على Render.com

#### الخطوة 1: إنشاء Web Service جديد
1. اذهب إلى [Render Dashboard](https://dashboard.render.com/)
2. اضغط على **New +** → **Web Service**
3. اربط مستودع GitHub الخاص بك

#### الخطوة 2: إعدادات الخدمة
```yaml
Name: media-center-frontend
Environment: Docker
Region: Frankfurt (EU Central)
Branch: main
Dockerfile Path: Dockerfile.frontend
```

#### الخطوة 3: المتغيرات البيئية
أضف في قسم **Environment Variables**:
```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com
```

#### الخطوة 4: إعدادات إضافية
```yaml
Instance Type: Free (أو حسب الحاجة)
Auto-Deploy: Yes
Health Check Path: /health
```

---

## 🔍 التحقق من النشر

### 1. فحص الصحة (Health Check)
```bash
curl http://localhost/health
# يجب أن يرجع: healthy
```

### 2. فحص المتغيرات البيئية
افتح المتصفح وافحص Console:
```javascript
// يجب أن ترى:
🔗 Management API Base URL: https://mcms-backend-iw71.onrender.com/api
🔗 News API Base URL: https://your-backend-url.onrender.com/api
```

### 3. فحص ملف env-config.js
```bash
curl http://localhost/env-config.js
# يجب أن يرجع:
# window.ENV = {
#   VITE_API_URL: "https://your-backend-url.onrender.com",
#   VITE_MANAGEMENT_API_URL: "https://mcms-backend-iw71.onrender.com"
# };
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: API calls تفشل
**الحل:**
```bash
# تحقق من المتغيرات البيئية داخل الحاوية
docker exec -it frontend sh
cat /usr/share/nginx/html/env-config.js
```

### المشكلة: 404 على المسارات
**الحل:** تأكد من أن nginx.frontend.conf يحتوي على:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### المشكلة: CORS errors
**الحل:** تأكد من أن الـ backend يسمح بـ origin الخاص بالـ frontend:
```javascript
// في الـ backend
app.use(cors({
  origin: 'https://your-frontend-url.onrender.com'
}));
```

---

## 📊 معلومات إضافية

### حجم الصورة
- **Builder stage:** ~500MB (Node.js + dependencies)
- **Final image:** ~25MB (Nginx Alpine + static files)

### الأداء
- ✅ Gzip compression مفعّل
- ✅ Static assets caching (1 year)
- ✅ Security headers
- ✅ Health check endpoint

### الأمان
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Non-root user في Nginx

---

## 📝 ملاحظات مهمة

1. **المتغيرات البيئية في Runtime:**
   - يتم حقن المتغيرات في ملف `/usr/share/nginx/html/env-config.js`
   - يتم تحميل الملف قبل `main.tsx` في `index.html`
   - يمكن تغيير المتغيرات دون إعادة البناء

2. **التوافق مع TypeScript:**
   - تم إضافة `env.d.ts` لتعريف `window.ENV`
   - تم تحديث `api.ts` لاستخدام `window.ENV` أولاً ثم `import.meta.env`

3. **الاختبار المحلي:**
   - استخدم `docker-compose.render.yml` للاختبار المحلي
   - تأكد من تحديث ملف `.env` بالقيم الصحيحة

---

## 🎯 الخطوات التالية

1. ✅ تحديث المتغيرات البيئية في Render
2. ✅ إعادة نشر الخدمة
3. ✅ التحقق من `/health` endpoint
4. ✅ اختبار تسجيل الدخول والـ API calls
5. ✅ مراقبة الـ logs في Render Dashboard

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من logs في Render Dashboard
2. افحص Console في المتصفح
3. تأكد من صحة المتغيرات البيئية
4. تحقق من أن الـ backend يعمل بشكل صحيح

---

**تم التحديث:** 2 مايو 2026
**الإصدار:** 2.0
