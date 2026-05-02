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
- [ ] `VITE_API_URL` - محدد في Render
- [ ] `VITE_MANAGEMENT_API_URL` - محدد في Render

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
