# 📊 AI Usage Tracking - دليل التنفيذ السريع

## نظام تتبع استخدام AI Hub

تم إنشاء نظام كامل لتتبع استخدام جميع ميزات AI Hub مع إحصائيات مفصلة.

---

## ✅ ما تم إنشاؤه

### 1. Database
- ✅ `sql/create_ai_usage_logs.sql` - جدول التتبع + Views للإحصائيات

### 2. Backend Services
- ✅ `src/services/ai-hub/ai-usage-logger.service.ts` - خدمة التسجيل والإحصائيات
- ✅ `src/middleware/ai-usage-logger.middleware.ts` - Middleware للتسجيل التلقائي

### 3. API Controllers & Routes
- ✅ `src/controllers/ai-hub/analytics.controller.ts` - Controllers للإحصائيات
- ✅ `src/routes/ai-hub/analytics.routes.ts` - Routes للإحصائيات

### 4. Integration
- ✅ تم إضافة Middleware لجميع AI Hub routes:
  - Chat (generate, summarize, rewrite)
  - TTS (generate)
  - STT (transcribe-url, transcribe-file, transcribe-upload, transcribe-base64)
  - Ideas (generate)

### 5. Documentation
- ✅ `docs/AI_USAGE_ANALYTICS_API.md` - توثيق كامل للـ API

---

## 🚀 خطوات التنفيذ

### الخطوة 1: إنشاء الجدول في قاعدة البيانات

```bash
# إذا كنت تستخدم PostgreSQL محلياً
psql -U your_username -d your_database -f sql/create_ai_usage_logs.sql

# أو إذا كنت تستخدم Docker
docker exec -i your_postgres_container psql -U your_username -d your_database < sql/create_ai_usage_logs.sql

# أو من داخل psql
\i sql/create_ai_usage_logs.sql
```

### الخطوة 2: إعادة تشغيل السيرفر

```bash
npm run dev
# أو
npm start
```

### الخطوة 3: اختبار النظام

```bash
# 1. استخدم أي ميزة من AI Hub (مثلاً Chat)
curl -X POST http://localhost:7845/api/ai-hub/chat/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "مرحبا"}'

# 2. تحقق من الإحصائيات
curl http://localhost:7845/api/ai-hub/analytics/my-usage

# 3. شاهد الإحصائيات العامة
curl http://localhost:7845/api/ai-hub/analytics/overview
```

---

## 📊 API Endpoints الجديدة

### إحصائيات عامة
```
GET /api/ai-hub/analytics/overview
GET /api/ai-hub/analytics/daily
GET /api/ai-hub/analytics/users
GET /api/ai-hub/analytics/top-users
```

### إحصائيات شخصية
```
GET /api/ai-hub/analytics/my-usage
```

### إحصائيات ميزة معينة
```
GET /api/ai-hub/analytics/feature/:feature
```

**الميزات المدعومة:**
- `chat` - المحادثة
- `tts` - تحويل النص لصوت
- `stt` - تحويل الصوت لنص
- `ideas` - توليد الأفكار (غرفة الأخبار)
- `text_tools` - أدوات النصوص

---

## 🔍 أمثلة الاستخدام

### 1. معرفة من استخدم غرفة الأخبار (Ideas)
```bash
curl http://localhost:7845/api/ai-hub/analytics/feature/ideas
```

**النتيجة:**
```json
{
  "success": true,
  "data": {
    "feature": "ideas",
    "totals": {
      "totalRequests": 45,
      "uniqueUsers": 8,
      "successfulRequests": 43
    },
    "topUsers": [
      {
        "user_identifier": "192.168.1.100",
        "total_requests": 15
      }
    ]
  }
}
```

### 2. معرفة استهلاك مستخدم معين
```bash
curl "http://localhost:7845/api/ai-hub/analytics/users?userIdentifier=192.168.1.100"
```

### 3. معرفة استهلاكي الشخصي
```bash
curl http://localhost:7845/api/ai-hub/analytics/my-usage
```

### 4. أكثر المستخدمين نشاطاً
```bash
curl http://localhost:7845/api/ai-hub/analytics/top-users?limit=10
```

### 5. إحصائيات يومية
```bash
curl "http://localhost:7845/api/ai-hub/analytics/daily?startDate=2024-01-01&endDate=2024-01-31"
```

---

## 📈 ما يتم تسجيله

لكل طلب AI يتم تسجيل:

| البيان | الوصف |
|--------|-------|
| **user_identifier** | IP address المستخدم |
| **feature** | الميزة المستخدمة (chat, tts, stt, ideas) |
| **action** | الإجراء المحدد (generate, transcribe, etc.) |
| **endpoint** | المسار الكامل للـ API |
| **request_data** | البيانات المرسلة (مع حذف البيانات الحساسة) |
| **response_status** | success / error / rate_limited |
| **duration_ms** | مدة تنفيذ الطلب |
| **tokens_used** | عدد الـ tokens المستهلكة |
| **created_at** | وقت الطلب |

---

## 🎯 حالات الاستخدام

### للإدارة:
- ✅ معرفة أكثر الميزات استخداماً
- ✅ تحديد المستخدمين الأكثر نشاطاً
- ✅ حساب التكاليف بناءً على الاستهلاك
- ✅ مراقبة الأداء والأخطاء
- ✅ تخطيط الموارد

### للمستخدمين:
- ✅ معرفة استهلاكهم الشخصي
- ✅ تتبع استخدامهم لكل ميزة
- ✅ معرفة متى استخدموا النظام

### للتطوير:
- ✅ تحليل الأداء
- ✅ اكتشاف الأخطاء
- ✅ تحسين الميزات الأكثر استخداماً

---

## 🔐 الأمان والخصوصية

- ✅ البيانات الحساسة (passwords, tokens) يتم حذفها تلقائياً
- ✅ النصوص الطويلة يتم اختصارها (أول 500 حرف فقط)
- ✅ التسجيل لا يؤثر على أداء الـ API (async)
- ✅ يمكن إضافة authentication للـ analytics endpoints

---

## 🧹 الصيانة

### حذف السجلات القديمة

يمكنك إضافة Cron Job في `src/index.ts`:

```typescript
import { cleanupOldLogs } from './services/ai-hub/ai-usage-logger.service';

// تنظيف السجلات الأقدم من 90 يوم - كل أسبوع
setInterval(async () => {
  try {
    const deleted = await cleanupOldLogs(90);
    console.log(`🧹 Cleaned up ${deleted} old AI usage logs`);
  } catch (error) {
    console.error('❌ Failed to cleanup logs:', error);
  }
}, 7 * 24 * 60 * 60 * 1000); // كل 7 أيام
```

---

## 📝 ملاحظات مهمة

1. **التسجيل تلقائي**: كل طلب لـ AI Hub يتم تسجيله تلقائياً
2. **لا يؤثر على الأداء**: التسجيل يتم بشكل async
3. **يدعم جميع الميزات**: Chat, TTS, STT, Ideas, Text Tools
4. **قابل للتوسع**: يمكن إضافة metrics إضافية بسهولة

---

## 🐛 Troubleshooting

### المشكلة: الجدول غير موجود
```bash
# تأكد من تنفيذ SQL script
psql -U your_username -d your_database -f sql/create_ai_usage_logs.sql
```

### المشكلة: لا يتم التسجيل
```bash
# تحقق من الـ logs
# يجب أن ترى: "📊 [AI Logger] Logged chat/generate for user ..."
```

### المشكلة: الإحصائيات فارغة
```bash
# استخدم أي ميزة AI أولاً، ثم تحقق من الإحصائيات
curl -X POST http://localhost:7845/api/ai-hub/chat/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'

curl http://localhost:7845/api/ai-hub/analytics/my-usage
```

---

## 📚 المزيد من المعلومات

راجع التوثيق الكامل في:
- `docs/AI_USAGE_ANALYTICS_API.md`

---

## ✨ الخطوات التالية (اختياري)

1. **Dashboard**: إنشاء واجهة رسومية للإحصائيات
2. **Reports**: تصدير التقارير (CSV, PDF)
3. **Alerts**: تنبيهات عند تجاوز حدود معينة
4. **User Authentication**: ربط بنظام المستخدمين بدلاً من IP
5. **Cost Tracking**: حساب التكلفة بناءً على الاستهلاك

---

**تم! 🎉 النظام جاهز للاستخدام**
