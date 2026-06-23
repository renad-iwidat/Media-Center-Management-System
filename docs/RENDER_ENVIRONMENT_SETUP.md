# 🌍 Render Environment Variables Setup

## 🎯 **إعداد المتغيرات البيئية في Render**

### **للـ Backend Service:**

#### **1. الإعدادات الأساسية (موجودة مسبقاً):**
```bash
NODE_ENV=production
PORT=4000
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=your-database-url-here
```

#### **2. إعدادات Production Streaming الجديدة:**

##### **إدارة العمليات:**
```bash
MAX_FFMPEG_PROCESSES=3
FFMPEG_TIMEOUT_MS=300000
MAX_AUDIO_SIZE_MB=100
```

##### **الأمان:**
```bash
ALLOWED_DOMAINS=s3.amazonaws.com,s3.eu-north-1.amazonaws.com,media-center-management-system.s3.eu-north-1.amazonaws.com
ENABLE_DOMAIN_WHITELIST=true
MAX_URL_LENGTH=2048
```

##### **Rate Limiting:**
```bash
EXTRACTION_RATE_LIMIT_WINDOW_MS=900000
EXTRACTION_RATE_LIMIT_MAX=10
STREAMING_RATE_LIMIT_WINDOW_MS=300000
STREAMING_RATE_LIMIT_MAX=3
```

##### **الأداء:**
```bash
MAX_CONCURRENT_CHUNKS=3
DEFAULT_AUDIO_BITRATE=128k
MAX_CHUNK_DURATION_SECONDS=300
```

##### **إدارة المهام:**
```bash
JOB_CLEANUP_INTERVAL_MS=3600000
JOB_MAX_AGE_MS=86400000
```

##### **السجلات:**
```bash
LOG_LEVEL=info
ENABLE_STRUCTURED_LOGGING=true
LOG_FFMPEG_COMMANDS=false
```

##### **المراقبة:**
```bash
ENABLE_METRICS=true
METRICS_INTERVAL_MS=60000
```

### **للـ Frontend Service:**

#### **المتغيرات المطلوبة:**
```bash
VITE_API_URL=https://your-backend-service.onrender.com
VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com
```

## 🔧 **خطوات الإعداد في Render:**

### **الخطوة 1: الذهاب إلى Dashboard**
1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اختر الـ Backend Service
3. اضغط على **Environment**

### **الخطوة 2: إضافة المتغيرات الجديدة**
```
اضغط "Add Environment Variable" لكل متغير:

Key: MAX_FFMPEG_PROCESSES
Value: 3

Key: FFMPEG_TIMEOUT_MS  
Value: 300000

Key: MAX_AUDIO_SIZE_MB
Value: 100

Key: ALLOWED_DOMAINS
Value: s3.amazonaws.com,s3.eu-north-1.amazonaws.com,media-center-management-system.s3.eu-north-1.amazonaws.com

Key: ENABLE_DOMAIN_WHITELIST
Value: true

Key: EXTRACTION_RATE_LIMIT_MAX
Value: 10

Key: STREAMING_RATE_LIMIT_MAX
Value: 3

Key: MAX_CONCURRENT_CHUNKS
Value: 3

Key: DEFAULT_AUDIO_BITRATE
Value: 128k

Key: LOG_LEVEL
Value: info
```

### **الخطوة 3: حفظ وإعادة التشغيل**
1. اضغط **Save Changes**
2. Render سيعيد تشغيل الخدمة تلقائياً
3. انتظر اكتمال إعادة التشغيل (~2-3 دقائق)

## ✅ **التحقق من الإعدادات:**

### **1. فحص المتغيرات:**
```bash
# في Render Shell أو Logs
curl https://your-backend.onrender.com/api/ai-hub/streaming-extraction/stats
```

### **2. النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "activeProcesses": 0,
    "sessionId": "uuid-123",
    "totalJobs": 0,
    "uptime": 123,
    "memory": {...},
    "nodeVersion": "v20.x.x"
  }
}
```

## 🎯 **إعدادات مُحسنة حسب حجم السيرفر:**

### **للـ Starter Plan (512MB RAM):**
```bash
MAX_FFMPEG_PROCESSES=1
MAX_CONCURRENT_CHUNKS=2
MAX_AUDIO_SIZE_MB=50
FFMPEG_TIMEOUT_MS=180000
```

### **للـ Standard Plan (2GB RAM):**
```bash
MAX_FFMPEG_PROCESSES=3
MAX_CONCURRENT_CHUNKS=3
MAX_AUDIO_SIZE_MB=100
FFMPEG_TIMEOUT_MS=300000
```

### **للـ Pro Plan (4GB+ RAM):**
```bash
MAX_FFMPEG_PROCESSES=5
MAX_CONCURRENT_CHUNKS=4
MAX_AUDIO_SIZE_MB=200
FFMPEG_TIMEOUT_MS=600000
```

## 🔒 **إعدادات الأمان للإنتاج:**

### **مشددة (Strict):**
```bash
ENABLE_DOMAIN_WHITELIST=true
EXTRACTION_RATE_LIMIT_MAX=5
STREAMING_RATE_LIMIT_MAX=2
MAX_AUDIO_SIZE_MB=50
```

### **متوسطة (Moderate):**
```bash
ENABLE_DOMAIN_WHITELIST=true
EXTRACTION_RATE_LIMIT_MAX=10
STREAMING_RATE_LIMIT_MAX=3
MAX_AUDIO_SIZE_MB=100
```

### **مرنة (Flexible) - للتطوير:**
```bash
ENABLE_DOMAIN_WHITELIST=false
EXTRACTION_RATE_LIMIT_MAX=20
STREAMING_RATE_LIMIT_MAX=5
MAX_AUDIO_SIZE_MB=200
```

## 📊 **مراقبة الأداء:**

### **المؤشرات المهمة:**
- **Memory Usage**: يجب ألا يتجاوز 80% من RAM المتاح
- **Active Processes**: يجب ألا يتجاوز `MAX_FFMPEG_PROCESSES`
- **Response Time**: يجب أن يكون أقل من 30 ثانية للبدء
- **Error Rate**: يجب أن يكون أقل من 5%

### **تحسين الأداء:**
```bash
# إذا كان الاستهلاك عالي:
MAX_FFMPEG_PROCESSES=2
MAX_CONCURRENT_CHUNKS=2

# إذا كانت العمليات بطيئة:
FFMPEG_TIMEOUT_MS=600000
DEFAULT_AUDIO_BITRATE=64k

# إذا كانت الأخطاء كثيرة:
ENABLE_DOMAIN_WHITELIST=true
LOG_LEVEL=debug
```

## 🚨 **تنبيهات مهمة:**

### **⚠️ لا تنس:**
1. **إعادة التشغيل مطلوبة** بعد تغيير المتغيرات
2. **النسخ الاحتياطي** للإعدادات القديمة قبل التغيير
3. **الاختبار** بعد كل تغيير
4. **المراقبة** لأول 24 ساعة بعد التحديث

### **🔥 في حالة الطوارئ:**
إذا توقف السيرفر بعد التحديث:
1. ارجع للإعدادات القديمة
2. احذف المتغيرات الجديدة مؤقتاً
3. أعد التشغيل
4. أضف المتغيرات واحداً تلو الآخر

---

**آخر تحديث:** 5 مايو 2026  
**الحالة:** ✅ جاهز للتطبيق