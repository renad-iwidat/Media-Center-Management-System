# 📊 AI Usage Analytics API

## 🔐 المصادقة

**جميع الطلبات تحتاج توكن:**

```bash
# 1. سجّل دخول من نظام الإدارة
curl -X POST "https://media-center-management-system.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "your_email@example.com", "password": "your_password"}'

# 2. احصل على التوكن من الرد
# "token": "eyJhbGciOiJIUzI1NiIs..."

# 3. استخدم التوكن في جميع الطلبات
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## � Base URL

```
https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics
```

---

## 🔌 الـ Endpoints

### 1️⃣ إحصائيات عامة

```bash
GET /overview
```

**مثال:**
```bash
curl -X GET "https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics/overview" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

**الرد:**
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

---

### 2️⃣ إحصائيات يومية

```bash
GET /daily?feature=chat&startDate=2024-01-01&endDate=2024-01-31
```

**مثال:**
```bash
curl -X GET "https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics/daily?feature=chat" \
  -H "Authorization: Bearer TOKEN"
```

**الرد:**
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
      "avg_duration_ms": 1250,
      "total_tokens_used": 45000
    }
  ]
}
```

---

### 3️⃣ إحصائيات المستخدمين

```bash
GET /users?userIdentifier=192.168.1.100&feature=chat
```

**مثال:**
```bash
curl -X GET "https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics/users" \
  -H "Authorization: Bearer TOKEN"
```

**الرد:**
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

---

### 4️⃣ أكثر المستخدمين نشاطاً

```bash
GET /top-users?limit=10
```

**مثال:**
```bash
curl -X GET "https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics/top-users?limit=5" \
  -H "Authorization: Bearer TOKEN"
```

**الرد:**
```json
{
  "success": true,
  "data": [
    {
      "user_identifier": "192.168.1.100",
      "total_requests": 250,
      "total_tokens_used": 75000,
      "features": ["chat", "tts", "stt", "ideas"]
    }
  ]
}
```

---

### 5️⃣ استخدامي الشخصي

```bash
GET /my-usage?feature=chat
```

**مثال:**
```bash
curl -X GET "https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics/my-usage" \
  -H "Authorization: Bearer TOKEN"
```

**الرد:**
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
        "avg_duration_ms": 1200
      }
    ]
  }
}
```

---

### 6️⃣ إحصائيات ميزة معينة

```bash
GET /feature/chat?startDate=2024-01-01&endDate=2024-01-31
```

**مثال:**
```bash
curl -X GET "https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics/feature/chat" \
  -H "Authorization: Bearer TOKEN"
```

**الرد:**
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

---

## 🎯 الميزات المدعومة

| الكود | الوصف |
|------|-------|
| `chat` | المحادثة |
| `tts` | تحويل النص لصوت |
| `stt` | تحويل الصوت لنص |
| `ideas` | توليد الأفكار |
| `text_tools` | أدوات النصوص |
| `audio_extraction` | استخراج الصوت |
| `video_to_text` | تحويل الفيديو لنص |

---

## 📝 Query Parameters

| المعامل | النوع | الوصف |
|--------|------|-------|
| `startDate` | string | تاريخ البداية (ISO 8601) |
| `endDate` | string | تاريخ النهاية (ISO 8601) |
| `feature` | string | اسم الميزة |
| `userIdentifier` | string | معرف المستخدم |
| `limit` | number | عدد النتائج |

---

## ❌ الأخطاء الشائعة

### خطأ 1: بدون توكن
```bash
# ❌ خطأ
curl "https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics/overview"

# ✅ صحيح
curl -H "Authorization: Bearer TOKEN" \
  "https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics/overview"
```

### خطأ 2: توكن غير صحيح
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

**الحل:** احصل على توكن جديد من نظام الإدارة

### خطأ 3: صيغة التوكن خاطئة
```bash
# ❌ خطأ - بدون Bearer
curl -H "Authorization: TOKEN" ...

# ✅ صحيح - مع Bearer
curl -H "Authorization: Bearer TOKEN" ...
```

---

## 💻 أمثلة في لغات مختلفة

### JavaScript/Fetch
```javascript
const token = localStorage.getItem('token');

fetch('https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics/overview', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

### Axios
```javascript
const token = localStorage.getItem('token');

axios.get('https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics/overview', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => console.log(res.data));
```

### Python
```python
import requests

token = "YOUR_TOKEN"
headers = {'Authorization': f'Bearer {token}'}

response = requests.get(
  'https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics/overview',
  headers=headers
)
print(response.json())
```

---

## 📞 الدعم

- للمصادقة: اقرأ `QUICK_START_AUTHENTICATION.md`
- للتفاصيل: اقرأ `AUTHENTICATION_AND_INTEGRATION.md`
- للمقارنة: اقرأ `SYSTEMS_COMPARISON.md`

---

**آخر تحديث:** 2026-04-28
