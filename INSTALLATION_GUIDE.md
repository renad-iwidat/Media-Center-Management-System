# 📦 Installation Guide للـ Production Streaming

## 🔧 Dependencies المطلوبة

### 1. **تثبيت الـ Rate Limiting:**
```bash
npm install express-rate-limit
```

### 2. **تثبيت الـ Types (إذا كنت تستخدم TypeScript):**
```bash
npm install --save-dev @types/express-rate-limit
```

### 3. **Dependencies موجودة مسبقاً (تأكد منها):**
```bash
# هذه يجب أن تكون موجودة
npm list express fluent-ffmpeg ffmpeg-static
```

## 🚀 **خطوات التطبيق:**

### **الخطوة 1: تثبيت Dependencies**
```bash
npm install express-rate-limit
```

### **الخطوة 2: إنشاء ملف Environment**
```bash
# انسخ الملف وعدّل الإعدادات
cp .env.production.example .env
```

### **الخطوة 3: تحديث الـ Frontend**
الـ Frontend APIs جاهزة في `frontend/src/services/api.ts`

### **الخطوة 4: اختبار النظام**
```bash
# تشغيل السيرفر
npm run dev

# اختبار الـ API الجديد
curl -X POST http://localhost:4000/api/ai-hub/streaming-extraction/stats
```

## 🎯 **الملفات الجديدة المضافة:**

1. `src/services/ai-hub/streaming-audio-extractor.service.ts` ✅
2. `src/controllers/ai-hub/streaming-extraction.controller.ts` ✅  
3. `src/routes/ai-hub/streaming-extraction.routes.ts` ✅
4. `.env.production.example` ✅

## 🔗 **الـ Routes المضافة:**

- `POST /api/ai-hub/streaming-extraction/start`
- `GET /api/ai-hub/streaming-extraction/status/:jobId`
- `POST /api/ai-hub/streaming-extraction/stream`
- `POST /api/ai-hub/streaming-extraction/extract-and-transcribe`
- `GET /api/ai-hub/streaming-extraction/stats`

## ✅ **التحقق من التثبيت:**

### **1. تحقق من الـ Dependencies:**
```bash
npm list express-rate-limit
```

### **2. تحقق من الـ Routes:**
```bash
# يجب أن يظهر الـ routes الجديدة
curl http://localhost:4000/api/ai-hub/streaming-extraction/stats
```

### **3. تحقق من الـ Environment Variables:**
```bash
# في ملف .env
MAX_FFMPEG_PROCESSES=3
FFMPEG_TIMEOUT_MS=300000
```

## 🐛 **حل المشاكل المحتملة:**

### **إذا فشل تثبيت express-rate-limit:**
```bash
# جرب مع --legacy-peer-deps
npm install express-rate-limit --legacy-peer-deps

# أو مع --force
npm install express-rate-limit --force
```

### **إذا ظهرت أخطاء TypeScript:**
```bash
# ثبت الـ types
npm install --save-dev @types/express-rate-limit
```

### **إذا لم تظهر الـ Routes:**
تأكد من إضافة الـ import في `src/index.ts`:
```typescript
import streamingExtractionRoutes from './routes/ai-hub/streaming-extraction.routes';
app.use('/api/ai-hub/streaming-extraction', streamingExtractionRoutes);
```