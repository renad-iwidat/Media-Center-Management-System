# 🚀 النشر السريع على Render

## الخطوات السريعة (5 دقائق)

### 1️⃣ رفع الكود على Git

```bash
git add .
git commit -m "Add Render deployment files"
git push origin main
```

### 2️⃣ إنشاء حساب على Render

- اذهب إلى [render.com](https://render.com)
- سجل دخول باستخدام GitHub/GitLab

### 3️⃣ إنشاء قاعدة البيانات (اختياري)

**إذا لم يكن لديك قاعدة بيانات:**

1. في Render Dashboard → "New" → "PostgreSQL"
2. اختر:
   - Name: `media-center-db`
   - Plan: **Free** (256 MB)
   - Region: Frankfurt
3. انتظر حتى تكتمل → انسخ **Internal Database URL**

### 4️⃣ نشر Backend

1. Dashboard → "New" → "Web Service"
2. اختر repository الخاص بك
3. الإعدادات:
   ```
   Name: media-center-backend
   Environment: Docker
   Dockerfile Path: ./Dockerfile.backend
   Region: Frankfurt
   Branch: main
   ```

4. **Environment Variables** (اضغط "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=<الصق Internal Database URL هنا>
   AI_MODEL=http://your-ai-service-url
   ARTICLES_PER_SOURCE=20
   SCHEDULER_INTERVAL=10
   ```

5. Advanced → Health Check Path: `/health`
6. اضغط **"Create Web Service"**
7. انتظر 5-10 دقائق حتى يكتمل البناء
8. **انسخ URL الخاص بالـ Backend** (مثل: `https://media-center-backend.onrender.com`)

### 5️⃣ نشر Frontend

1. Dashboard → "New" → "Web Service"
2. اختر نفس repository
3. الإعدادات:
   ```
   Name: media-center-frontend
   Environment: Docker
   Dockerfile Path: ./Dockerfile.frontend
   Region: Frankfurt
   Branch: main
   ```

4. **Build Environment Variables**:
   ```
   VITE_API_URL=<الصق Backend URL هنا>
   VITE_APP_URL=https://media-center-frontend.onrender.com
   ```

5. Advanced → Health Check Path: `/health`
6. اضغط **"Create Web Service"**
7. انتظر 5-10 دقائق

### 6️⃣ تحديث Frontend URL

بعد إنشاء Frontend، ستحصل على URL نهائي:
1. ارجع إلى Frontend Service → Settings → Environment
2. عدّل `VITE_APP_URL` إلى URL الحقيقي
3. احفظ التغييرات (سيعيد البناء تلقائياً)

---

## ✅ التحقق من النشر

### Backend:
افتح: `https://your-backend-url.onrender.com/health`

يجب أن ترى:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

### Frontend:
افتح: `https://your-frontend-url.onrender.com`

يجب أن يظهر التطبيق بشكل طبيعي.

---

## 🔧 إعدادات إضافية

### تفعيل Auto-Deploy:

في كل Service:
- Settings → Build & Deploy
- فعّل **"Auto-Deploy"**

الآن عند كل `git push`، سيتم النشر تلقائياً!

### إضافة Custom Domain:

1. Service → Settings → Custom Domains
2. اضغط "Add Custom Domain"
3. أدخل domain الخاص بك (مثل: `app.yourdomain.com`)
4. أضف DNS records في مزود الـ domain:
   ```
   Type: CNAME
   Name: app
   Value: <render-url>
   ```

---

## 💰 التكاليف

### Free Tier:
- ✅ 1 Web Service مجاني
- ✅ PostgreSQL 256 MB مجاني
- ⚠️ يتوقف بعد 15 دقيقة من عدم النشاط
- ⚠️ يستغرق 30 ثانية للتشغيل بعد التوقف

### Starter Plan ($7/شهر):
- ✅ لا يتوقف أبداً
- ✅ 512 MB RAM
- ✅ استجابة فورية

**للحصول على خدمتين (Backend + Frontend):**
- Free: $0 (خدمة واحدة فقط)
- Starter: $14/شهر (خدمتين)
- مع Database: $21/شهر

---

## 🐛 حل المشاكل الشائعة

### ❌ Backend Build Failed

**السبب:** مشكلة في dependencies

**الحل:**
```bash
# محلياً، جرب:
npm install
npm run build

# إذا نجح، ارفع التغييرات:
git add package-lock.json
git commit -m "Fix dependencies"
git push
```

### ❌ Frontend لا يتصل بـ Backend

**السبب:** `VITE_API_URL` خاطئ

**الحل:**
1. تأكد من Backend URL صحيح
2. تأكد من عدم وجود `/` في النهاية
3. Frontend → Settings → Environment → عدّل `VITE_API_URL`

### ❌ Database Connection Error

**السبب:** `DATABASE_URL` خاطئ

**الحل:**
1. تحقق من format:
   ```
   postgresql://user:password@host:5432/database
   ```
2. استخدم **Internal Database URL** (ليس External)
3. Backend → Settings → Environment → عدّل `DATABASE_URL`

### ❌ Health Check Failed

**السبب:** التطبيق لا يستجيب على `/health`

**الحل:**
1. تحقق من Logs: Service → Logs
2. تأكد من أن PORT = 4000 (Backend) أو 80 (Frontend)
3. تحقق من أن التطبيق يعمل محلياً

---

## 📊 مراقبة التطبيق

### Logs:
```
Service → Logs → Real-time logs
```

### Metrics:
```
Service → Metrics
- CPU Usage
- Memory Usage
- Request Count
```

### Alerts:
```
Service → Settings → Notifications
- أضف email للتنبيهات
```

---

## 🔄 التحديثات

لتحديث التطبيق:

```bash
# عدّل الكود
git add .
git commit -m "Update feature X"
git push origin main
```

Render سيقوم بـ:
1. ✅ سحب التغييرات
2. ✅ بناء Docker image جديد
3. ✅ نشر النسخة الجديدة
4. ✅ Zero-downtime deployment

---

## 📞 الدعم

- 📖 [Render Docs](https://render.com/docs)
- 💬 [Community Forum](https://community.render.com)
- 📧 [Support](https://render.com/support)

---

## ✨ نصائح للأداء

1. **استخدم CDN للملفات الثابتة**
   - Cloudflare (مجاني)
   - Cloudinary للصور

2. **فعّل Caching**
   - Redis على Render ($7/شهر)

3. **راقب الأداء**
   - استخدم Render Metrics
   - أضف Sentry للأخطاء

4. **Optimize Docker Images**
   - استخدم multi-stage builds (موجود بالفعل)
   - قلل حجم dependencies

---

**🎉 مبروك! تطبيقك الآن على الإنترنت!**
