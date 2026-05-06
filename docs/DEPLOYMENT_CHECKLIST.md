# ✅ قائمة التحقق من النشر (Deployment Checklist)

## 📋 قبل النشر (Pre-Deployment)

### 1. التحقق من الملفات
- [x] `Dockerfile.frontend` - تم تحديثه ✅
- [x] `nginx.frontend.conf` - موجود ✅
- [x] `docker-compose.render.yml` - تم تحديثه ✅
- [x] `frontend/index.html` - يحمل `env-config.js` ✅
- [x] `frontend/src/env.d.ts` - تعريفات TypeScript ✅
- [x] `frontend/src/services/api.ts` - يدعم `window.ENV` ✅

### 2. المتغيرات البيئية

#### **Frontend Environment Variables:**
- [ ] `VITE_API_URL` - محدد في Render
- [ ] `VITE_MANAGEMENT_API_URL` - محدد في Render

#### **Backend Environment Variables (الجديدة - Production Streaming):**
- [ ] `MAX_FFMPEG_PROCESSES=3` - عدد عمليات FFmpeg المتوازية
- [ ] `FFMPEG_TIMEOUT_MS=300000` - مهلة انتظار FFmpeg (5 دقائق)
- [ ] `MAX_AUDIO_SIZE_MB=100` - حد أقصى لحجم الصوت
- [ ] `ALLOWED_DOMAINS=s3.amazonaws.com,s3.eu-north-1.amazonaws.com,media-center-management-system.s3.eu-north-1.amazonaws.com` - الدومينات المسموحة
- [ ] `ENABLE_DOMAIN_WHITELIST=true` - تفعيل قائمة الدومينات البيضاء
- [ ] `EXTRACTION_RATE_LIMIT_MAX=10` - حد الطلبات (10 كل 15 دقيقة)
- [ ] `STREAMING_RATE_LIMIT_MAX=3` - حد طلبات الـ Streaming (3 كل 5 دقائق)
- [ ] `MAX_CONCURRENT_CHUNKS=3` - عدد الأجزاء المتوازية
- [ ] `DEFAULT_AUDIO_BITRATE=128k` - جودة الصوت الافتراضية
- [ ] `LOG_LEVEL=info` - مستوى السجلات

### 3. إعدادات Render
- [ ] Web Service تم إنشاؤه
- [ ] Dockerfile Path: `Dockerfile.frontend`
- [ ] Health Check Path: `/health`
- [ ] Auto-Deploy: مفعّل

---

## 🚀 أثناء النشر (During Deployment)

### 1. مراقبة البناء
```bash
# في Render Dashboard → Logs
✅ Building Docker image...
✅ Step 1/15 : FROM node:20-alpine AS builder
✅ Step 15/15 : CMD ["nginx", "-g", "daemon off;"]
✅ Successfully built
✅ Successfully tagged
```

### 2. التحقق من الصحة
```bash
# بعد اكتمال النشر
curl https://your-frontend-url.onrender.com/health
# Expected: healthy
```

---

## 🔍 بعد النشر (Post-Deployment)

### 1. فحص الواجهة
- [ ] الصفحة الرئيسية تفتح بدون أخطاء
- [ ] صفحة تسجيل الدخول تعمل
- [ ] Console خالي من أخطاء CORS
- [ ] الصور والأيقونات تظهر

### 2. فحص API
- [ ] تسجيل الدخول يعمل
- [ ] جلب البيانات من Backend يعمل
- [ ] الـ Authentication token يُحفظ
- [ ] Logout يعمل بشكل صحيح

#### **فحص Production Streaming APIs الجديدة:**
- [ ] `GET /api/ai-hub/streaming-extraction/stats` - إحصائيات النظام
- [ ] `POST /api/ai-hub/streaming-extraction/extract-and-transcribe` - الاستخراج والتفريغ
- [ ] Rate limiting يعمل (يرفض الطلبات الزائدة)
- [ ] استخراج الصوت من فيديوهات S3 يعمل
- [ ] التفريغ الصوتي للأجزاء المقسمة يعمل

### 3. فحص المتغيرات البيئية
افتح Console في المتصفح:
```javascript
// يجب أن ترى:
console.log(window.ENV);
// {
//   VITE_API_URL: "https://your-backend-url.onrender.com",
//   VITE_MANAGEMENT_API_URL: "https://media-center-management-system.onrender.com"
// }
```

### 4. فحص الأداء
- [ ] الصفحة تحمل في أقل من 3 ثواني
- [ ] Static assets تُحمّل من cache
- [ ] Gzip compression مفعّل
- [ ] Health check يستجيب بسرعة

#### **فحص أداء Production Streaming:**
- [ ] استخراج الصوت من فيديو 100MB يكتمل في أقل من 3 دقائق
- [ ] معالجة الأجزاء المتوازية تعمل (3 أجزاء بنفس الوقت)
- [ ] استهلاك الذاكرة أقل من 200MB أثناء المعالجة
- [ ] لا توجد ملفات مؤقتة متبقية بعد المعالجة
- [ ] Rate limiting يمنع الإفراط في الطلبات

---

## 🐛 استكشاف الأخطاء الشائعة

### ❌ المشكلة: "Failed to fetch"
**السبب:** CORS أو Backend غير متاح
**الحل:**
1. تحقق من أن Backend يعمل
2. تحقق من CORS settings في Backend
3. تحقق من `VITE_API_URL` في Render

### ❌ المشكلة: "404 Not Found" على المسارات
**السبب:** Nginx لا يعيد توجيه إلى index.html
**الحل:** تحقق من `nginx.frontend.conf`:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### ❌ المشكلة: "window.ENV is undefined"
**السبب:** `env-config.js` لم يتم تحميله
**الحل:**
1. تحقق من `index.html` يحتوي على:
   ```html
   <script src="/env-config.js"></script>
   ```
2. تحقق من المتغيرات البيئية في Render

### ❌ المشكلة: "Unauthorized (401)"
**السبب:** Token منتهي أو غير صحيح
**الحل:**
1. امسح localStorage
2. سجل دخول من جديد
3. تحقق من `JWT_SECRET` في Backend

### ❌ المشكلة: "ffmpeg exited with code 251" (Production Streaming)
**السبب:** مشكلة في استخراج الصوت من S3 URLs
**الحل:**
1. تحقق من `ALLOWED_DOMAINS` يشمل S3 domain
2. تحقق من `MAX_FFMPEG_PROCESSES` لا يتجاوز قدرة السيرفر
3. تحقق من `FFMPEG_TIMEOUT_MS` كافي للملفات الكبيرة
4. النظام الجديد يحل هذه المشكلة تلقائياً بـ fallback mechanisms

### ❌ المشكلة: "Too many requests" (Rate Limiting)
**السبب:** تجاوز حد الطلبات المسموح
**الحل:**
1. انتظر انتهاء النافزة الزمنية (15 دقيقة للاستخراج، 5 دقائق للـ streaming)
2. أو زيد `EXTRACTION_RATE_LIMIT_MAX` و `STREAMING_RATE_LIMIT_MAX` في البيئة

### ❌ المشكلة: "Audio extraction timeout"
**السبب:** الفيديو كبير جداً أو الاتصال بطيء
**الحل:**
1. زيد `FFMPEG_TIMEOUT_MS` (مثلاً 600000 = 10 دقائق)
2. قلل `MAX_CONCURRENT_CHUNKS` لتوفير موارد أكثر لكل عملية
3. استخدم `enableChunking: true` للفيديوهات الطويلة

---

## 📊 مؤشرات النجاح

### ✅ النشر ناجح إذا:
1. Health check يرجع `200 OK`
2. الصفحة الرئيسية تفتح بدون أخطاء
3. تسجيل الدخول يعمل
4. API calls تنجح
5. Console خالي من أخطاء
6. الأداء جيد (< 3s load time)

### 📈 مقاييس الأداء المتوقعة
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Lighthouse Score:** > 90
- **Bundle Size:** < 500KB (gzipped)

---

## 🔄 التحديثات المستقبلية

### عند تحديث الكود:
1. Push إلى GitHub
2. Render سيبني تلقائياً (Auto-Deploy)
3. انتظر اكتمال البناء (~5 دقائق)
4. تحقق من Health check
5. اختبر الوظائف الأساسية

### عند تغيير المتغيرات البيئية:
1. اذهب إلى Render Dashboard
2. Environment → Edit
3. غيّر القيم
4. احفظ (سيعيد تشغيل الخدمة تلقائياً)
5. لا حاجة لإعادة البناء! ✨

---

## 📞 جهات الاتصال

### في حالة الطوارئ:
1. تحقق من Render Status Page
2. راجع Logs في Dashboard
3. تحقق من Backend health
4. راجع هذا الدليل

### الموارد المفيدة:
- [Render Docs](https://render.com/docs)
- [Docker Docs](https://docs.docker.com/)
- [Nginx Docs](https://nginx.org/en/docs/)
- [Vite Docs](https://vitejs.dev/)

---

**آخر تحديث:** 2 مايو 2026
**الحالة:** ✅ جاهز للنشر
