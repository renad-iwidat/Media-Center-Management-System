# AI Usage Analytics API Documentation

## نظام تتبع استخدام AI Hub

هذا النظام يسجل جميع استخدامات AI Hub ويوفر إحصائيات مفصلة عن:
- من استخدم الـ AI (تتبع المستخدمين)
- أي ميزة استخدمت (Chat, TTS, STT, Ideas, etc.)
- كم مرة استخدمت كل ميزة
- إجمالي الاستهلاك لكل مستخدم
- معدلات النجاح والفشل
- أوقات الاستجابة

---

## 📊 Database Schema

### جدول `ai_usage_logs`

```sql
CREATE TABLE ai_usage_logs (
  id SERIAL PRIMARY KEY,
  user_identifier VARCHAR(255) NOT NULL,  -- IP address or user ID
  user_agent TEXT,                        -- Browser/client info
  feature VARCHAR(50) NOT NULL,           -- 'chat', 'tts', 'stt', 'ideas', etc.
  action VARCHAR(100) NOT NULL,           -- 'generate', 'transcribe', etc.
  endpoint VARCHAR(255) NOT NULL,         -- Full API endpoint path
  request_data JSONB,                     -- Input parameters
  response_status VARCHAR(20) NOT NULL,   -- 'success', 'error', 'rate_limited'
  response_data JSONB,                    -- Response details
  duration_ms INTEGER,                    -- Request duration
  tokens_used INTEGER,                    -- AI tokens consumed
  audio_duration_sec DECIMAL(10,2),      -- Audio length
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Views

#### `ai_usage_daily_stats` - إحصائيات يومية
```sql
SELECT 
  DATE(created_at) as date,
  feature,
  COUNT(*) as total_requests,
  COUNT(DISTINCT user_identifier) as unique_users,
  COUNT(CASE WHEN response_status = 'success' THEN 1 END) as successful_requests,
  AVG(duration_ms) as avg_duration_ms,
  SUM(tokens_used) as total_tokens_used
FROM ai_usage_logs
GROUP BY DATE(created_at), feature;
```

#### `ai_usage_user_stats` - إحصائيات المستخدمين
```sql
SELECT 
  user_identifier,
  feature,
  COUNT(*) as total_requests,
  SUM(tokens_used) as total_tokens_used,
  MIN(created_at) as first_used,
  MAX(created_at) as last_used
FROM ai_usage_logs
GROUP BY user_identifier, feature;
```

---

## 🔌 API Endpoints

### Base URL
```
/api/ai-hub/analytics
```

---

## 1️⃣ إحصائيات عامة

### `GET /api/ai-hub/analytics/overview`

**الوصف:** إحصائيات عامة لجميع الميزات

**Query Parameters:**
- `startDate` (optional): تاريخ البداية (ISO 8601)
- `endDate` (optional): تاريخ النهاية (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 1250,
    "uniqueUsers": 45,
    "byFeature": {
      "chat": 500,
      "tts": 300,
      "stt": 200,
      "ideas": 150,
      "text_tools": 100
    },
    "byStatus": {
      "success": 1100,
      "error": 100,
      "rate_limited": 50
    }
  }
}
```

**مثال:**
```bash
curl "http://localhost:7845/api/ai-hub/analytics/overview?startDate=2024-01-01&endDate=2024-12-31"
```

---

## 2️⃣ إحصائيات يومية

### `GET /api/ai-hub/analytics/daily`

**الوصف:** إحصائيات يومية مفصلة

**Query Parameters:**
- `startDate` (optional): تاريخ البداية
- `endDate` (optional): تاريخ النهاية
- `feature` (optional): ميزة معينة (chat, tts, stt, ideas, text_tools)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "feature": "chat",
      "total_requests": 150,
      "unique_users": 12,
      "successful_requests": 140,
      "failed_requests": 8,
      "rate_limited_requests": 2,
      "avg_duration_ms": 1250,
      "total_tokens_used": 45000
    },
    {
      "date": "2024-01-15",
      "feature": "tts",
      "total_requests": 80,
      "unique_users": 8,
      "successful_requests": 78,
      "failed_requests": 2,
      "rate_limited_requests": 0,
      "avg_duration_ms": 850,
      "total_tokens_used": 0
    }
  ]
}
```

**مثال:**
```bash
# جميع الميزات
curl "http://localhost:7845/api/ai-hub/analytics/daily"

# ميزة معينة
curl "http://localhost:7845/api/ai-hub/analytics/daily?feature=chat"

# فترة زمنية محددة
curl "http://localhost:7845/api/ai-hub/analytics/daily?startDate=2024-01-01&endDate=2024-01-31"
```

---

## 3️⃣ إحصائيات المستخدمين

### `GET /api/ai-hub/analytics/users`

**الوصف:** إحصائيات استخدام المستخدمين

**Query Parameters:**
- `userIdentifier` (optional): معرف مستخدم معين
- `feature` (optional): ميزة معينة

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_identifier": "192.168.1.100",
      "feature": "chat",
      "total_requests": 45,
      "successful_requests": 42,
      "total_tokens_used": 15000,
      "avg_duration_ms": 1200,
      "first_used": "2024-01-01T10:00:00Z",
      "last_used": "2024-01-15T18:30:00Z"
    }
  ]
}
```

**مثال:**
```bash
# جميع المستخدمين
curl "http://localhost:7845/api/ai-hub/analytics/users"

# مستخدم معين
curl "http://localhost:7845/api/ai-hub/analytics/users?userIdentifier=192.168.1.100"

# ميزة معينة
curl "http://localhost:7845/api/ai-hub/analytics/users?feature=chat"
```

---

## 4️⃣ أكثر المستخدمين نشاطاً

### `GET /api/ai-hub/analytics/top-users`

**الوصف:** قائمة بأكثر المستخدمين استخداماً للـ AI

**Query Parameters:**
- `limit` (optional, default: 10): عدد المستخدمين

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_identifier": "192.168.1.100",
      "total_requests": 250,
      "total_tokens_used": 75000,
      "features": ["chat", "tts", "stt", "ideas"]
    },
    {
      "user_identifier": "192.168.1.101",
      "total_requests": 180,
      "total_tokens_used": 52000,
      "features": ["chat", "tts"]
    }
  ]
}
```

**مثال:**
```bash
# أعلى 10 مستخدمين
curl "http://localhost:7845/api/ai-hub/analytics/top-users"

# أعلى 20 مستخدم
curl "http://localhost:7845/api/ai-hub/analytics/top-users?limit=20"
```

---

## 5️⃣ استخدامي الشخصي

### `GET /api/ai-hub/analytics/my-usage`

**الوصف:** إحصائيات استخدام المستخدم الحالي (بناءً على IP)

**Query Parameters:**
- `feature` (optional): ميزة معينة

**Response:**
```json
{
  "success": true,
  "data": {
    "userIdentifier": "192.168.1.100",
    "totals": {
      "totalRequests": 125,
      "successfulRequests": 118,
      "totalTokensUsed": 42000
    },
    "byFeature": [
      {
        "feature": "chat",
        "total_requests": 50,
        "successful_requests": 48,
        "total_tokens_used": 20000,
        "avg_duration_ms": 1200,
        "first_used": "2024-01-01T10:00:00Z",
        "last_used": "2024-01-15T18:30:00Z"
      },
      {
        "feature": "tts",
        "total_requests": 40,
        "successful_requests": 40,
        "total_tokens_used": 0,
        "avg_duration_ms": 800,
        "first_used": "2024-01-02T11:00:00Z",
        "last_used": "2024-01-15T17:00:00Z"
      }
    ]
  }
}
```

**مثال:**
```bash
# جميع الميزات
curl "http://localhost:7845/api/ai-hub/analytics/my-usage"

# ميزة معينة
curl "http://localhost:7845/api/ai-hub/analytics/my-usage?feature=chat"
```

---

## 6️⃣ إحصائيات ميزة معينة

### `GET /api/ai-hub/analytics/feature/:feature`

**الوصف:** إحصائيات مفصلة لميزة معينة

**Path Parameters:**
- `feature`: اسم الميزة (chat, tts, stt, ideas, text_tools, audio_extraction, video_to_text)

**Query Parameters:**
- `startDate` (optional): تاريخ البداية
- `endDate` (optional): تاريخ النهاية

**Response:**
```json
{
  "success": true,
  "data": {
    "feature": "chat",
    "totals": {
      "totalRequests": 500,
      "uniqueUsers": 25,
      "successfulRequests": 475,
      "failedRequests": 20,
      "totalTokensUsed": 150000
    },
    "dailyStats": [
      {
        "date": "2024-01-15",
        "total_requests": 50,
        "unique_users": 8,
        "successful_requests": 48,
        "avg_duration_ms": 1200
      }
    ],
    "topUsers": [
      {
        "user_identifier": "192.168.1.100",
        "total_requests": 80,
        "total_tokens_used": 25000
      }
    ]
  }
}
```

**مثال:**
```bash
# إحصائيات Chat
curl "http://localhost:7845/api/ai-hub/analytics/feature/chat"

# إحصائيات TTS لفترة معينة
curl "http://localhost:7845/api/ai-hub/analytics/feature/tts?startDate=2024-01-01&endDate=2024-01-31"
```

---

## 🎯 الميزات المدعومة (Features)

| Feature | الوصف |
|---------|-------|
| `chat` | المحادثة والمساعد الذكي |
| `tts` | تحويل النص إلى صوت |
| `stt` | تحويل الصوت إلى نص |
| `ideas` | توليد الأفكار والأسئلة |
| `text_tools` | أدوات النصوص (تلخيص، إعادة صياغة) |
| `audio_extraction` | استخراج الصوت من الفيديو |
| `video_to_text` | تحويل الفيديو إلى نص |

---

## 🔄 حالات الاستجابة (Response Status)

| Status | الوصف |
|--------|-------|
| `success` | نجح الطلب |
| `error` | فشل الطلب |
| `rate_limited` | تم تجاوز الحد المسموح |

---

## 🛠️ Setup Instructions

### 1. إنشاء الجدول

```bash
psql -U your_user -d your_database -f sql/create_ai_usage_logs.sql
```

### 2. التحقق من الجدول

```sql
SELECT * FROM ai_usage_logs LIMIT 10;
SELECT * FROM ai_usage_daily_stats;
SELECT * FROM ai_usage_user_stats;
```

### 3. اختبار الـ API

```bash
# إحصائيات عامة
curl http://localhost:7845/api/ai-hub/analytics/overview

# استخدامي الشخصي
curl http://localhost:7845/api/ai-hub/analytics/my-usage

# أكثر المستخدمين نشاطاً
curl http://localhost:7845/api/ai-hub/analytics/top-users
```

---

## 🧹 الصيانة

### حذف السجلات القديمة

يمكنك حذف السجلات الأقدم من 90 يوم باستخدام:

```typescript
import { cleanupOldLogs } from './services/ai-hub/ai-usage-logger.service';

// حذف السجلات الأقدم من 90 يوم
await cleanupOldLogs(90);
```

أو يمكنك إضافة Cron Job:

```typescript
// في index.ts
import { cleanupOldLogs } from './services/ai-hub/ai-usage-logger.service';

// تنظيف كل أسبوع
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

## 📈 Use Cases

### 1. معرفة أكثر الميزات استخداماً
```bash
curl http://localhost:7845/api/ai-hub/analytics/overview
```

### 2. تتبع استخدام مستخدم معين
```bash
curl "http://localhost:7845/api/ai-hub/analytics/users?userIdentifier=192.168.1.100"
```

### 3. مراقبة الأداء اليومي
```bash
curl "http://localhost:7845/api/ai-hub/analytics/daily?startDate=2024-01-01&endDate=2024-01-31"
```

### 4. معرفة من يستخدم غرفة الأخبار (Ideas)
```bash
curl "http://localhost:7845/api/ai-hub/analytics/feature/ideas"
```

### 5. حساب التكلفة (بناءً على الـ tokens)
```bash
curl http://localhost:7845/api/ai-hub/analytics/overview
# ثم احسب: total_tokens_used * cost_per_token
```

---

## 🔐 Security Notes

- الـ `user_identifier` حالياً هو IP address
- يمكنك تعديله ليكون User ID من نظام المصادقة
- يمكنك إضافة middleware للمصادقة على endpoints الإحصائيات
- البيانات الحساسة (passwords, tokens) يتم حذفها تلقائياً من الـ logs

---

## 📝 Notes

- التسجيل يتم تلقائياً عبر Middleware
- لا يؤثر على أداء الـ API (async logging)
- يدعم جميع ميزات AI Hub
- يمكن توسيعه لإضافة metrics إضافية

---

## 🚀 Future Enhancements

- [ ] Dashboard للإحصائيات
- [ ] تصدير التقارير (CSV, PDF)
- [ ] تنبيهات عند تجاوز حدود معينة
- [ ] تكامل مع أنظمة المراقبة (Grafana, Prometheus)
- [ ] تحليل الأنماط والتوجهات
- [ ] توصيات بناءً على الاستخدام
