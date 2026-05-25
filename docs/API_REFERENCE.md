
# API Reference — Media Center Management System

**Base URL:** `https://automation-and-ai-hub-backend.onrender.com`  
**Content-Type:** `application/json`

---

## 🔐 المصادقة والتوكن (Authentication)

**⚠️ ملاحظة مهمة جداً:**

جميع APIs نظام الأخبار **تتطلب توكن مصادقة (JWT Token)** للوصول إليها. النظام يستخدم نظام تسجيل دخول ومصادقة كامل.

### كيفية الحصول على التوكن:

1. **تسجيل الدخول:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "اسم المستخدم",
    "email": "user@example.com"
  }
}
```

2. **استخدام التوكن في الطلبات:**

يجب إرسال التوكن في header كل طلب:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**مثال باستخدام cURL:**
```bash
curl -X GET http://localhost:3000/api/flow/queue/pending \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**مثال باستخدام Postman:**
- اذهب إلى تبويب **Authorization**
- اختر **Type: Bearer Token**
- الصق التوكن في حقل **Token**

**مثال باستخدام JavaScript (fetch):**
```javascript
fetch('http://localhost:3000/api/flow/queue/pending', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### معلومات إضافية عن المصادقة:

- **التوكن يحتوي على:** `user_id`, `email`, `role_id`, `permissions`
- **صلاحية التوكن:** 24 ساعة (يمكن تجديده)
- **عند انتهاء التوكن:** ستحصل على خطأ `401 Unauthorized`
- **الحقول المستخرجة من التوكن:**
  - `req.user.user_id` — رقم المستخدم
  - `req.user.email` — البريد الإلكتروني
  - `req.user.role_id` — رقم الدور
  - `req.userPermissions` — صلاحيات المستخدم

### APIs لا تتطلب توكن:

فقط endpoint تسجيل الدخول لا يتطلب توكن:
- `POST /api/auth/login`

**جميع APIs الأخرى تتطلب توكن صالح.**

---

## فهرس الـ Endpoints

> **🔒 ملاحظة:** جميع الـ Endpoints التالية تتطلب توكن مصادقة في الـ Header ما عدا `/api/auth/login`

### 0. Authentication — المصادقة
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 0 | POST | `/api/auth/login` | تسجيل الدخول | ❌ لا |
| 0.1 | GET | `/api/auth/me` | معلومات المستخدم الحالي | ✅ نعم |

### 1. Sources & News — المصادر والأخبار
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 1 | GET | `/api/sources` | جميع المصادر | ✅ نعم |
| 2 | GET | `/api/sources/active` | المصادر النشطة | ✅ نعم |
| 3 | GET | `/api/sources/:id` | مصدر بالـ ID | ✅ نعم |
| 4 | POST | `/api/sources` | إنشاء مصدر | ✅ نعم |
| 5 | PUT | `/api/sources/:id` | تحديث مصدر | ✅ نعم |
| 6 | GET | `/api/news` | جميع الأخبار الخام | ✅ نعم |
| 7 | GET | `/api/news/:id` | خبر بالـ ID | ✅ نعم |
| 8 | GET | `/api/news/source/:sourceId` | أخبار مصدر معين | ✅ نعم |
| 9 | POST | `/api/news` | إنشاء خبر | ✅ نعم |
| 10 | GET | `/api/news/classifier/unclassified` | أخبار بدون تصنيف | ✅ نعم |
| 11 | POST | `/api/news/classifier/process` | تشغيل التصنيف الآلي | ✅ نعم |

### 2. Data — البيانات والإحصائيات
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 12 | GET | `/api/data/sources` | جميع المصادر (data) | ✅ نعم |
| 13 | GET | `/api/data/sources/active` | المصادر النشطة (data) | ✅ نعم |
| 14 | GET | `/api/data/articles` | جميع الأخبار مع pagination | ✅ نعم |
| 15 | GET | `/api/data/articles/:id/detail` | خبر واحد بالتفاصيل | ✅ نعم |
| 16 | GET | `/api/data/articles/source/:sourceId` | أخبار مصدر | ✅ نعم |
| 17 | GET | `/api/data/articles/category/:categoryId` | أخبار تصنيف | ✅ نعم |
| 18 | GET | `/api/data/articles/incomplete` | الأخبار الناقصة | ✅ نعم |
| 19 | PUT | `/api/data/articles/:id/content` | تحديث محتوى خبر | ✅ نعم |
| 20 | DELETE | `/api/data/articles/:id` | حذف خبر | ✅ نعم |
| 21 | GET | `/api/data/categories` | جميع التصنيفات | ✅ نعم |
| 22 | GET | `/api/data/media-units` | وحدات الإعلام | ✅ نعم |
| 23 | GET | `/api/data/comprehensive` | بيانات شاملة | ✅ نعم |
| 24 | GET | `/api/data/statistics` | إحصائيات النظام | ✅ نعم |

### 3. Flow — فلو معالجة الأخبار
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 25 | POST | `/api/flow/process` | تشغيل فلو التوجيه | ✅ نعم |
| 25.1 | GET | `/api/flow/editorial` | ستوديو التحرير (يدعم task_id) | ✅ نعم |
| 26 | GET | `/api/flow/queue/pending` | الطابور المعلق | ✅ نعم |
| 27 | GET | `/api/flow/queue/stats` | إحصائيات الطابور | ✅ نعم |
| 28 | GET | `/api/flow/queue/:id` | عنصر من الطابور | ✅ نعم |
| 29 | POST | `/api/flow/queue/:id/approve` | موافقة على خبر | ✅ نعم |
| 30 | POST | `/api/flow/queue/:id/reject` | رفض خبر | ✅ نعم |
| 31 | GET | `/api/flow/published` | المحتوى المنشور | ✅ نعم |
| 32 | GET | `/api/flow/published/stats` | إحصائيات المنشور | ✅ نعم |
| 33 | GET | `/api/flow/published/:id` | منشور واحد | ✅ نعم |
| 34 | GET | `/api/flow/published/category/:category` | منشور حسب الفئة | ✅ نعم |
| 35 | GET | `/api/flow/daily-stats` | إحصائيات يومية | ✅ نعم |

### 4. Editorial Policies — السياسات التحريرية
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 36 | GET | `/api/news/editorial-policies` | جميع السياسات | ✅ نعم |
| 37 | POST | `/api/news/editorial-policies` | إنشاء سياسة | ✅ نعم |
| 38 | GET | `/api/news/editorial-policies/:policyName` | تفاصيل سياسة | ✅ نعم |
| 39 | PUT | `/api/news/editorial-policies/:policyName` | تحديث سياسة | ✅ نعم |
| 40 | DELETE | `/api/news/editorial-policies/:policyName` | حذف سياسة | ✅ نعم |
| 41 | POST | `/api/news/editorial-policies/apply` | تطبيق سياسة واحدة | ✅ نعم |
| 42 | POST | `/api/news/editorial-policies/sequential` | تطبيق متسلسل | ✅ نعم |
| 43 | POST | `/api/news/editorial-policies/pipeline` | pipeline للفرونت | ✅ نعم |
| 44 | POST | `/api/news/editorial-policies/save-edited` | حفظ النص المعدّل | ✅ نعم |

### 5. System Settings — إعدادات النظام
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 45 | GET | `/api/settings` | جميع إعدادات النظام | ✅ نعم |
| 46 | GET | `/api/settings/toggles` | حالة الـ toggles | ✅ نعم |
| 47 | PATCH | `/api/settings/:key` | تحديث إعداد واحد | ✅ نعم |
| 48 | PATCH | `/api/settings/toggles/bulk` | تحديث دفعة | ✅ نعم |

### 6. AI Hub — المساعد الذكي
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 49 | POST | `/api/ai-hub/chat/generate` | توليد رد من المساعد | ✅ نعم |
| 50 | POST | `/api/ai-hub/chat/summarize` | تلخيص نص | ✅ نعم |
| 51 | POST | `/api/ai-hub/chat/rewrite` | إعادة صياغة نص | ✅ نعم |
| 52 | POST | `/api/ai-hub/ideas/generate` | توليد أفكار | ✅ نعم |

### 7. Speech-to-Text — تحويل الصوت إلى نص
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 53 | POST | `/api/ai-hub/stt/transcribe-url` | تفريغ من رابط | ✅ نعم |
| 54 | POST | `/api/ai-hub/stt/transcribe-file` | تفريغ من S3 | ✅ نعم |
| 55 | POST | `/api/ai-hub/stt/transcribe-upload` | تفريغ من ملف مرفوع | ✅ نعم |
| 56 | POST | `/api/ai-hub/stt/transcribe-base64` | تفريغ من base64 | ✅ نعم |
| 56.1 | POST | `/api/ai-hub/stt/transcribe-with-timestamps` | تفريغ مع timestamps | ✅ نعم |
| 57 | GET | `/api/ai-hub/stt/languages` | اللغات المدعومة | ✅ نعم |

### 8. Text-to-Speech — تحويل النص إلى صوت
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 58 | POST | `/api/ai-hub/tts/generate` | تحويل نص لصوت | ✅ نعم |
| 59 | GET | `/api/ai-hub/tts/voices` | الأصوات المتاحة | ✅ نعم |

### 9. Audio Extraction — استخراج الصوت
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 60 | POST | `/api/ai-hub/audio-extraction/extract-from-file` | استخراج من ملف محلي | ✅ نعم |
| 61 | POST | `/api/ai-hub/audio-extraction/extract-from-url` | استخراج من رابط | ✅ نعم |
| 62 | POST | `/api/ai-hub/audio-extraction/extract-from-s3` | استخراج من S3 | ✅ نعم |
| 62.1 | POST | `/api/ai-hub/audio-extraction/extract-and-transcribe` | استخراج + تفريغ متكامل | ✅ نعم |
| 63 | POST | `/api/ai-hub/audio-extraction/video-info` | معلومات الفيديو | ✅ نعم |
| 64 | GET | `/api/ai-hub/audio-extraction/formats` | الصيغ المدعومة | ✅ نعم |

### 10. Video to Text — تحويل الفيديو إلى نص
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 65 | POST | `/api/ai-hub/video-to-text/process` | معالجة فيديو من رابط | ✅ نعم |
| 66 | POST | `/api/ai-hub/video-to-text/process-s3` | معالجة فيديو من S3 | ✅ نعم |

### 11. Programs & Episodes — البرامج والحلقات
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 67 | GET | `/api/programs` | جميع البرامج | ✅ نعم |
| 68 | GET | `/api/programs/:id` | برنامج بالـ ID | ✅ نعم |
| 69 | GET | `/api/programs/:id/episodes` | حلقات برنامج | ✅ نعم |
| 70 | GET | `/api/programs/episodes/:id/details` | حلقة مع ضيوفها | ✅ نعم |
| 71 | GET | `/api/programs/episodes/:id/guests` | ضيوف حلقة | ✅ نعم |

### 12. Guests — الضيوف
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 72 | GET | `/api/guests` | جميع الضيوف / بحث | ✅ نعم |
| 73 | GET | `/api/guests/:id` | ضيف بالـ ID | ✅ نعم |

### 13. Uploaded Files — الملفات المرفوعة
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 74 | GET | `/api/uploaded-files` | جميع الملفات | ✅ نعم |
| 75 | GET | `/api/uploaded-files/audio` | الملفات الصوتية | ✅ نعم |
| 76 | GET | `/api/uploaded-files/video` | ملفات الفيديو | ✅ نعم |
| 77 | GET | `/api/uploaded-files/source-type/:sourceTypeId` | ملفات حسب نوع المصدر | ✅ نعم |
| 78 | GET | `/api/uploaded-files/:id` | ملف بالـ ID | ✅ نعم |

### 14. Smart Transcription — التفريغ الذكي
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 79 | POST | `/api/ai-hub/smart-transcription/process` | تفريغ + توليد مخرجات تحريرية | ✅ نعم |
| 80 | POST | `/api/ai-hub/smart-transcription/generate-outputs` | توليد مخرجات من transcript موجود | ✅ نعم |
| 81 | POST | `/api/ai-hub/smart-transcription/export` | تصدير ملف موحد | ✅ نعم |
| 82 | POST | `/api/ai-hub/smart-transcription/correct` | تصحيح لغوي للتفريغ | ✅ نعم |
| 83 | POST | `/api/ai-hub/smart-transcription/correct-batch` | تصحيح دفعة من التفريغات | ✅ نعم |
| 84 | POST | `/api/ai-hub/smart-transcription/generate-by-outlet` | توليد حزمة تحريرية حسب الجهة | ✅ نعم |

### 15. Streaming Extraction — الاستخراج المتدفق
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 85 | POST | `/api/ai-hub/streaming-extraction/start` | بدء مهمة استخراج غير متزامنة | ✅ نعم |
| 86 | GET | `/api/ai-hub/streaming-extraction/status/:jobId` | حالة المهمة | ✅ نعم |
| 87 | POST | `/api/ai-hub/streaming-extraction/stream` | تدفق صوت مباشر | ✅ نعم |
| 88 | POST | `/api/ai-hub/streaming-extraction/extract-and-transcribe` | استخراج + تفريغ (إنتاج) | ✅ نعم |
| 89 | POST | `/api/ai-hub/streaming-extraction/download-first` | استخراج بطريقة التحميل أولاً | ✅ نعم |
| 90 | POST | `/api/ai-hub/streaming-extraction/video-info` | معلومات الفيديو | ✅ نعم |
| 91 | POST | `/api/ai-hub/streaming-extraction/diagnose` | تشخيص رابط S3 | ✅ نعم |
| 92 | GET | `/api/ai-hub/streaming-extraction/stats` | إحصائيات النظام | ✅ نعم |

### 16. AI Analytics — إحصائيات AI Hub
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 93 | GET | `/api/ai-hub/analytics/overview` | إحصائيات عامة لجميع الميزات | ✅ نعم |
| 94 | GET | `/api/ai-hub/analytics/daily` | إحصائيات يومية | ✅ نعم |
| 95 | GET | `/api/ai-hub/analytics/users` | إحصائيات المستخدمين | ✅ نعم |
| 96 | GET | `/api/ai-hub/analytics/top-users` | أكثر المستخدمين نشاطاً | ✅ نعم |
| 97 | GET | `/api/ai-hub/analytics/my-usage` | استخدامي الشخصي | ✅ نعم |
| 98 | GET | `/api/ai-hub/analytics/feature/:feature` | إحصائيات ميزة معينة | ✅ نعم |

### 17. Transcription Editorial — إدارة الجهات الإعلامية والمخرجات
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 99 | GET | `/api/ai-hub/transcription-editorial/outlets` | جميع الجهات الإعلامية | ✅ نعم |
| 100 | GET | `/api/ai-hub/transcription-editorial/outlets/:slug` | جهة بالـ slug | ✅ نعم |
| 101 | POST | `/api/ai-hub/transcription-editorial/outlets` | إنشاء جهة إعلامية | ✅ نعم |
| 102 | PUT | `/api/ai-hub/transcription-editorial/outlets/:slug` | تحديث جهة | ✅ نعم |
| 103 | DELETE | `/api/ai-hub/transcription-editorial/outlets/:slug` | حذف جهة | ✅ نعم |
| 104 | GET | `/api/ai-hub/transcription-editorial/output-types` | أنواع المخرجات | ✅ نعم |
| 105 | POST | `/api/ai-hub/transcription-editorial/output-types` | إنشاء نوع مخرج | ✅ نعم |
| 106 | PUT | `/api/ai-hub/transcription-editorial/output-types/:id` | تحديث نوع مخرج | ✅ نعم |
| 107 | GET | `/api/ai-hub/transcription-editorial/social-platforms` | منصات السوشال | ✅ نعم |
| 108 | POST | `/api/ai-hub/transcription-editorial/social-platforms` | إنشاء منصة | ✅ نعم |
| 109 | GET | `/api/ai-hub/transcription-editorial/outlet-config/:outletSlug` | تخصيص مخرجات جهة | ✅ نعم |
| 110 | POST | `/api/ai-hub/transcription-editorial/outlet-config` | حفظ تخصيص مخرجات | ✅ نعم |
| 111 | GET | `/api/ai-hub/transcription-editorial/angle-rules` | خريطة القرار | ✅ نعم |
| 112 | POST | `/api/ai-hub/transcription-editorial/angle-rules` | إنشاء قاعدة قرار | ✅ نعم |
| 113 | GET | `/api/ai-hub/transcription-editorial/quality-criteria` | معايير الجودة | ✅ نعم |

### 18. NewsDesk Proxy — الربط مع NewsDesk
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 114 | GET | `/api/newsdesk/health` | فحص صحة الاتصال | ✅ نعم |
| 115 | GET | `/api/newsdesk/sources` | مصادر NewsDesk | ✅ نعم |
| 116 | GET | `/api/newsdesk/sources/:slug` | مصدر بالـ slug | ✅ نعم |
| 117 | POST | `/api/newsdesk/sources` | إنشاء مصدر | ✅ نعم |
| 118 | PATCH | `/api/newsdesk/sources/:slug` | تحديث مصدر | ✅ نعم |
| 119 | DELETE | `/api/newsdesk/sources/:slug` | حذف مصدر | ✅ نعم |
| 120 | POST | `/api/newsdesk/sources/:slug/activate` | تفعيل مصدر | ✅ نعم |
| 121 | POST | `/api/newsdesk/sources/:slug/deactivate` | إيقاف مصدر | ✅ نعم |
| 122 | GET | `/api/newsdesk/articles` | مقالات NewsDesk | ✅ نعم |
| 123 | GET | `/api/newsdesk/articles/:id` | مقال بالـ ID | ✅ نعم |
| 124 | GET | `/api/newsdesk/articles/by-source/:slug` | مقالات حسب المصدر | ✅ نعم |
| 125 | GET | `/api/newsdesk/articles/by-category/:slug` | مقالات حسب التصنيف | ✅ نعم |
| 126 | POST | `/api/newsdesk/scraper/fetch` | تشغيل السحب | ✅ نعم |
| 127 | POST | `/api/newsdesk/scraper/fetch-async` | سحب غير متزامن | ✅ نعم |
| 128 | GET | `/api/newsdesk/scheduler/status` | حالة الجدولة | ✅ نعم |
| 129 | POST | `/api/newsdesk/scheduler/start` | بدء الجدولة | ✅ نعم |
| 130 | POST | `/api/newsdesk/scheduler/stop` | إيقاف الجدولة | ✅ نعم |
| 131 | GET | `/api/newsdesk/categories` | التصنيفات | ✅ نعم |
| 132 | GET | `/api/newsdesk/geographic-scopes` | النطاقات الجغرافية | ✅ نعم |
| 133 | GET | `/api/newsdesk/admin/stats` | إحصائيات الإدارة | ✅ نعم |
| 134 | GET | `/api/newsdesk/admin/settings` | إعدادات الإدارة | ✅ نعم |
| 135 | PATCH | `/api/newsdesk/admin/settings` | تحديث الإعدادات | ✅ نعم |
| 136 | GET | `/api/newsdesk/admin/logs` | سجلات الإدارة | ✅ نعم |
| 137 | POST | `/api/newsdesk/admin/classifier/run` | تشغيل المصنف | ✅ نعم |
| 138 | GET | `/api/newsdesk/admin/classifier/stats` | إحصائيات المصنف | ✅ نعم |

### 19. Auto-Publish — النشر التلقائي
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 139 | GET | `/api/auto-publish/status` | حالة النشر التلقائي + إحصائيات | ✅ نعم |
| 140 | POST | `/api/auto-publish/toggle` | تفعيل/إيقاف النشر التلقائي | ✅ نعم |
| 141 | GET | `/api/auto-publish/targets` | جميع أهداف النشر | ✅ نعم |
| 142 | GET | `/api/auto-publish/targets/:id` | هدف واحد | ✅ نعم |
| 143 | POST | `/api/auto-publish/targets` | إنشاء هدف جديد | ✅ نعم |
| 144 | PATCH | `/api/auto-publish/targets/:id` | تحديث هدف | ✅ نعم |
| 145 | DELETE | `/api/auto-publish/targets/:id` | حذف هدف | ✅ نعم |
| 146 | POST | `/api/auto-publish/targets/:id/toggle` | تفعيل/إيقاف هدف | ✅ نعم |
| 147 | POST | `/api/auto-publish/publish-one` | نشر خبر واحد يدوياً | ✅ نعم |
| 148 | POST | `/api/auto-publish/run` | تشغيل يدوي (كل الأخبار) | ✅ نعم |
| 149 | POST | `/api/auto-publish/retry` | إعادة محاولة الفاشل | ✅ نعم |
| 150 | GET | `/api/auto-publish/log` | سجل النشر | ✅ نعم |
| 151 | GET | `/api/auto-publish/external-links/:rawDataId` | روابط النشر الخارجي لخبر | ✅ نعم |
| 152 | POST | `/api/auto-publish/external-links/batch` | روابط لمجموعة أخبار | ✅ نعم |

### 20. Bulletins — الموجزات والنشرات
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 153 | POST | `/api/bulletins` | إنشاء موجز | ✅ نعم |
| 154 | GET | `/api/bulletins` | جميع الموجزات | ✅ نعم |
| 155 | GET | `/api/bulletins/:id` | موجز بالـ ID | ✅ نعم |
| 156 | PUT | `/api/bulletins/:id` | تحديث موجز | ✅ نعم |
| 157 | DELETE | `/api/bulletins/:id` | حذف موجز | ✅ نعم |
| 158 | PATCH | `/api/bulletins/:id/audio` | تحديث حالة الصوت | ✅ نعم |

### 21. Scheduler — جدولة السحب والتصنيف
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 159 | POST | `/api/scheduler/start` | بدء الـ scheduler | ✅ نعم |
| 160 | POST | `/api/scheduler/stop` | إيقاف الـ scheduler | ✅ نعم |
| 161 | POST | `/api/scheduler/restart` | إعادة تشغيل | ✅ نعم |
| 162 | POST | `/api/scheduler/run-now` | تشغيل دورة فورية | ✅ نعم |
| 163 | GET | `/api/scheduler/status` | حالة الـ scheduler | ✅ نعم |

### 22. Publishing v2 — نظام النشر المتعدد المنصات
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 164 | POST | `/api/publishing/publish` | نشر مقال على منصة | ✅ نعم |
| 165 | POST | `/api/publishing/set-status` | تغيير حالة مقال | ✅ نعم |
| 166 | POST | `/api/publishing/retry` | إعادة محاولة النشر الفاشل | ✅ نعم |
| 167 | GET | `/api/publishing/dead-letter` | الرسائل الميتة | ✅ نعم |
| 168 | POST | `/api/publishing/cleanup` | تنظيف المهام القديمة | ✅ نعم |
| 169 | GET | `/api/publishing/status/:articleId` | حالة نشر مقال | ✅ نعم |
| 170 | GET | `/api/publishing/cooldown/:platformConfigId` | فترة الانتظار | ✅ نعم |
| 171 | GET | `/api/publishing/logs` | سجلات النشر | ✅ نعم |
| 172 | GET | `/api/publishing/logs/:articleId` | سجلات مقال | ✅ نعم |
| 173 | GET | `/api/publishing/platforms` | المنصات المتاحة | ✅ نعم |
| 174 | GET | `/api/publishing/constraints` | قيود المنصات | ✅ نعم |
| 175 | GET | `/api/publishing/configs` | إعدادات المنصات | ✅ نعم |
| 176 | GET | `/api/publishing/configs/:id` | إعداد واحد | ✅ نعم |
| 177 | POST | `/api/publishing/configs` | إنشاء إعداد منصة | ✅ نعم |
| 178 | PATCH | `/api/publishing/configs/:id` | تحديث إعداد | ✅ نعم |
| 179 | DELETE | `/api/publishing/configs/:id` | حذف إعداد | ✅ نعم |
| 180 | POST | `/api/publishing/configs/:id/toggle` | تفعيل/إيقاف إعداد | ✅ نعم |
| 181 | POST | `/api/publishing/configs/:id/validate` | فحص صحة إعداد | ✅ نعم |
| 182 | GET | `/api/publishing/archive` | الأرشيف | ✅ نعم |
| 183 | POST | `/api/publishing/archive/:articleId` | أرشفة مقال | ✅ نعم |
| 184 | GET | `/api/publishing/stats` | إحصائيات النشر | ✅ نعم |

### 23. Management Integration — تكامل نظام الإدارة
| # | Method | Endpoint | الوصف | يتطلب توكن؟ |
|---|--------|----------|-------|-------------|
| 185 | GET | `/api/management/news/stats/user/:userId` | إحصائيات أداء موظف | ✅ نعم |
| 186 | GET | `/api/management/news/stats/overview` | إحصائيات عامة لنظام الأخبار | ✅ نعم |
| 187 | GET | `/api/management/news/tasks/:taskId/items` | منشورات مرتبطة بمهمة | ✅ نعم |

---

## 0. Authentication — المصادقة

### POST `/api/auth/login`
تسجيل الدخول والحصول على التوكن.

**🔓 لا يتطلب توكن**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbGVfaWQiOiIyIiwiaWF0IjoxNzA1MzIwMDAwLCJleHAiOjE3MDU0MDY0MDB9.signature",
  "user": {
    "id": 1,
    "name": "اسم المستخدم",
    "email": "user@example.com",
    "role": "editor"
  }
}
```

**Response 401 — بيانات خاطئة:**
```json
{
  "success": false,
  "message": "البريد الإلكتروني أو كلمة المرور غير صحيحة"
}
```

---

### GET `/api/auth/me`
الحصول على معلومات المستخدم الحالي من التوكن.

**🔒 يتطلب توكن**

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response 200:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "اسم المستخدم",
    "email": "user@example.com",
    "role": "editor",
    "permissions": ["read_news", "edit_news", "publish_news"]
  }
}
```

**Response 401 — توكن غير صالح:**
```json
{
  "success": false,
  "message": "التوكن غير صالح أو منتهي الصلاحية"
}
```

---

## 1. Sources — المصادر

### GET `/api/sources`
جلب جميع مصادر الأخبار.

**🔒 يتطلب توكن**

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Request:** لا يوجد body

**Response 200:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "name": "وكالة وفا",
      "url": "https://wafa.ps/ar/rss",
      "source_type_id": 1,
      "is_active": true,
      "default_category_id": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/sources/active`
جلب المصادر النشطة فقط (`is_active = true`).

**Request:** لا يوجد body

**Response 200:** نفس شكل `/api/sources` لكن فلترة للنشطة فقط.

---

### GET `/api/sources/:id`
جلب مصدر واحد بالـ ID.

**Params:** `id` — رقم المصدر

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "وكالة وفا",
    "url": "https://wafa.ps/ar/rss",
    "source_type_id": 1,
    "is_active": true,
    "default_category_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response 404:**
```json
{ "success": false, "error": "Source not found" }
```

---

### POST `/api/sources`
إنشاء مصدر جديد.

**Request Body:**
```json
{
  "source_type_id": 1,
  "url": "https://example.com/rss",
  "name": "اسم المصدر",
  "is_active": true
}
```
> `source_type_id`, `url`, `name` — مطلوبة. `is_active` — اختياري (افتراضي: `true`).

**Response 201:**
```json
{
  "success": true,
  "message": "Source created successfully",
  "data": {
    "id": 10,
    "name": "اسم المصدر",
    "url": "https://example.com/rss",
    "source_type_id": 1,
    "is_active": true,
    "default_category_id": null,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

**Response 400:**
```json
{ "success": false, "error": "Missing required fields" }
```

---

### PUT `/api/sources/:id`
تحديث بيانات مصدر.

**Params:** `id` — رقم المصدر

**Request Body** (كل الحقول اختيارية):
```json
{
  "name": "اسم جديد",
  "url": "https://new-url.com/rss",
  "is_active": false
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Source updated successfully",
  "data": { "id": 1, "name": "اسم جديد", "is_active": false }
}
```

---

## 2. News — الأخبار الخام

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### GET `/api/news`
جلب جميع الأخبار الخام من `raw_data`.

**Request:** لا يوجد

**Response 200:**
```json
{
  "success": true,
  "count": 150,
  "data": [
    {
      "id": 1,
      "source_id": 2,
      "source_type_id": 1,
      "category_id": 3,
      "url": "https://example.com/article/1",
      "title": "عنوان الخبر",
      "content": "محتوى الخبر...",
      "image_url": "https://example.com/img.jpg",
      "tags": ["سياسة", "فلسطين"],
      "fetch_status": "fetched",
      "fetched_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/news/:id`
جلب خبر واحد بالـ ID.

**Params:** `id`

**Response 200:**
```json
{
  "success": true,
  "data": { "id": 1, "title": "...", "content": "..." }
}
```

**Response 404:**
```json
{ "success": false, "error": "News not found" }
```

---

### GET `/api/news/source/:sourceId`
جلب جميع أخبار مصدر معين.

**Params:** `sourceId`

**Response 200:**
```json
{
  "success": true,
  "count": 20,
  "data": [ ... ]
}
```

---

### POST `/api/news`
إضافة خبر يدوياً.

**Request Body:**
```json
{
  "source_id": 1,
  "source_type_id": 1,
  "category_id": 3,
  "url": "https://example.com/article",
  "title": "عنوان الخبر",
  "content": "محتوى الخبر",
  "image_url": "https://example.com/img.jpg",
  "tags": ["tag1"],
  "fetch_status": "fetched"
}
```
> `source_id`, `title`, `content` — مطلوبة.

**Response 201:**
```json
{
  "success": true,
  "message": "News created successfully",
  "data": { "id": 55, "title": "عنوان الخبر", ... }
}
```

---

### GET `/api/news/classifier/unclassified`
جلب الأخبار التي لا تملك `category_id`.

**Response 200:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    { "id": 5, "title": "خبر بدون تصنيف", "content": "..." }
  ]
}
```

---

### POST `/api/news/classifier/process`
تشغيل التصنيف الآلي بالـ AI على الأخبار بدون تصنيف.

**Request:** لا يوجد body

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalUnclassified": 12,
    "processedCount": 10,
    "failedCount": 2,
    "details": [
      {
        "id": 5,
        "title": "عنوان الخبر",
        "category": "محلي",
        "categoryId": 1,
        "success": true
      },
      {
        "id": 8,
        "title": "خبر فشل",
        "category": "محلي",
        "categoryId": 1,
        "success": false,
        "error": "timeout"
      }
    ]
  }
}
```

---

## 3. Data — البيانات والإحصائيات

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### GET `/api/data/sources`
نفس `/api/sources` — جلب جميع المصادر.

### GET `/api/data/sources/active`
نفس `/api/sources/active` — المصادر النشطة.

---

### GET `/api/data/articles`
جلب الأخبار مع دعم الـ pagination.

**Query Params:**
| Param | Type | Default | الوصف |
|-------|------|---------|-------|
| `limit` | number | 100 | عدد النتائج |
| `offset` | number | 0 | نقطة البداية |

**Response 200:**
```json
{
  "success": true,
  "total": 500,
  "count": 100,
  "limit": 100,
  "offset": 0,
  "data": [ ... ]
}
```

---

### GET `/api/data/articles/:id/detail`
جلب خبر واحد مع اسم المصدر والفئة.

**Params:** `id`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "عنوان",
    "content": "محتوى",
    "url": "https://...",
    "image_url": "https://...",
    "fetch_status": "fetched",
    "fetched_at": "2024-01-15T10:00:00.000Z",
    "category_id": 3,
    "category_name": "محلي",
    "source_name": "وكالة وفا"
  }
}
```

---

### GET `/api/data/articles/source/:sourceId`
أخبار مصدر معين.

**Params:** `sourceId`

**Response 200:**
```json
{ "success": true, "count": 30, "data": [ ... ] }
```

---

### GET `/api/data/articles/category/:categoryId`
أخبار تصنيف معين.

**Params:** `categoryId`

**Response 200:**
```json
{ "success": true, "count": 45, "data": [ ... ] }
```

---

### GET `/api/data/articles/incomplete`
الأخبار ذات المحتوى الناقص (أقل من 300 حرف).

**ملاحظة مهمة:**
- الأخبار الناقصة تبقى في `raw_data` فقط ولا تدخل الفلو
- لا تنتقل لـ `editorial_queue` إلا عندما يوافق المحرر عليها ويكملها
- يتم تتبعها عبر flag `is_incomplete = true`

**Query Params:**
| Param | Type | Default | الوصف |
|-------|------|---------|-------|
| `max_length` | number | 150 الحد الأقصى لطول المحتوى (للمرجعية فقط) |
| `media_unit_id` | number | — | فلترة حسب وحدة الإعلام |

**Response 200:**
```json
{
  "success": true,
  "count": 8,
  "maxLength": 150;
  "data": [
    {
      "id": 12,
      "title": "خبر ناقص",
      "content": "نص قصير جداً",
      "url": "https://...",
      "fetch_status": "fetched",
      "is_incomplete": true,
      "category_name": "محلي",
      "source_name": "وفا",
      "media_unit_name": null
    }
  ]
}
```

---

### PUT `/api/data/articles/:id/content`
تحديث محتوى خبر ناقص وإرساله لطابور التحرير.

**Params:** `id`

**Request Body:**
```json
{
  "content": "المحتوى الجديد الكامل",
  "title": "عنوان محدّث (اختياري)",
  "imageUrl": "https://example.com/img.jpg (اختياري)",
  "sendToQueue": true
}
```
> `content` — مطلوب. `sendToQueue` — افتراضي `true` (يرسل للطابور). لو `false` يحفظ فقط.

**Response 200:**
```json
{
  "success": true,
  "message": "تم تحديث الخبر وإرساله لستوديو التحرير",
  "data": {
    "id": 12,
    "title": "عنوان محدّث",
    "content": "المحتوى الجديد",
    "fetch_status": "processed"
  }
}
```

---

### DELETE `/api/data/articles/:id`
حذف خبر من `raw_data` (يحذف من `editorial_queue` أيضاً إن وجد).

**Params:** `id`

**Response 200:**
```json
{
  "success": true,
  "message": "تم حذف الخبر بنجاح",
  "data": { "id": 12 }
}
```

**Response 404:**
```json
{ "success": false, "message": "الخبر غير موجود" }
```

---

### GET `/api/data/categories`
جلب جميع التصنيفات النشطة.

**Response 200:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    { "id": 1, "name": "محلي", "slug": "local", "flow": "editorial", "is_active": true },
    { "id": 2, "name": "دولي", "slug": "international", "flow": "automated", "is_active": true }
  ]
}
```

---

### GET `/api/data/media-units`
جلب وحدات الإعلام النشطة.

**Response 200:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    { "id": 1, "name": "القناة الرئيسية", "is_active": true },
    { "id": 2, "name": "الموقع الإلكتروني", "is_active": true }
  ]
}
```

---

### GET `/api/data/comprehensive`
جلب كل البيانات دفعة واحدة (مصادر + أخبار + تصنيفات).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "sources": { "count": 5, "items": [ ... ] },
    "articles": { "count": 500, "items": [ ... ] },
    "categories": { "count": 10, "items": [ ... ] }
  }
}
```

---

### GET `/api/data/statistics`
إحصائيات عامة عن النظام.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalSources": 5,
    "activeSources": 4,
    "totalArticles": 500,
    "totalCategories": 10,
    "articlesByCategory": { "1": 120, "2": 80, "3": 50 },
    "articlesBySource": { "1": 200, "2": 150 }
  }
}
```

---

## 4. Flow — فلو معالجة الأخبار

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### POST `/api/flow/process`
تشغيل فلو التوجيه — يأخذ الأخبار بحالة `fetched` ويوجّهها لـ `published_items` أو `editorial_queue`.

**Request:** لا يوجد body

**Response 200:**
```json
{
  "success": true,
  "message": "تمت معالجة 15 خبر بنجاح | تم تخطي 3 خبر ناقص",
  "data": {
    "processedCount": 15,
    "automatedCount": 8,
    "editorialCount": 7,
    "errors": []
  }
}
```

---

### GET `/api/flow/editorial`
**جلب جميع الأخبار في ستوديو التحرير** — يدعم الربط مع نظام الإدارة عبر `task_id`.

**🔒 يتطلب توكن**

**الاستخدام:**
- **بدون task_id:** جلب جميع الأخبار في ستوديو التحرير (pending + in_review + incomplete)
- **مع task_id:** جلب الأخبار المرتبطة بمهمة معينة فقط
- **مع task_id=null:** جلب الأخبار غير المرتبطة بأي مهمة

**Query Parameters:**
| Param | Type | Required | الوصف |
|-------|------|----------|-------|
| `task_id` | number | ❌ | رقم المهمة من نظام الإدارة (اختياري) |
| `media_unit_id` | number | ❌ | فلترة حسب وحدة الإعلام (اختياري) |
| `status` | string | ❌ | الحالة: `pending` \| `in_review` \| `incomplete` (اختياري) |

**أمثلة الاستخدام:**

**1. جلب جميع الأخبار في ستوديو التحرير:**
```
GET /api/flow/editorial
```

**2. جلب الأخبار المرتبطة بمهمة رقم 45:**
```
GET /api/flow/editorial?task_id=45
```

**3. جلب الأخبار غير المرتبطة بأي مهمة:**
```
GET /api/flow/editorial?task_id=null
```

**4. جلب الأخبار المعلقة فقط لوحدة إعلام معينة:**
```
GET /api/flow/editorial?media_unit_id=1&status=pending
```

**5. جلب الأخبار قيد المراجعة لمهمة معينة:**
```
GET /api/flow/editorial?task_id=45&status=in_review
```

**Response 200:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "id": 10,
      "media_unit_id": 1,
      "raw_data_id": 55,
      "policy_id": null,
      "status": "pending",
      "editor_notes": null,
      "user_id": null,
      "task_id": 45,
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z",
      "title": "عنوان الخبر",
      "content": "محتوى الخبر...",
      "image_url": "https://...",
      "url": "https://...",
      "category_name": "محلي",
      "category_flow": "editorial",
      "media_unit_name": "القناة الرئيسية",
      "source_name": "وكالة وفا"
    }
  ],
  "filters": {
    "mediaUnitId": 1,
    "taskId": 45,
    "status": "all"
  }
}
```

**ملاحظات مهمة:**
- ✅ **user_id يُحفظ دائماً** عند أي عملية تحرير (موافقة/رفض/تطبيق سياسة)
- ✅ **task_id اختياري** — يمكن أن يكون `null` إذا فتح المحرر ستوديو التحرير مباشرة
- ✅ **الربط مع نظام الإدارة:** عند فتح ستوديو التحرير من مهمة، يتم تمرير `task_id` في الرابط
- ✅ **التتبع:** كل عملية تحرير تُسجل مع `user_id` و `task_id` (إن وجد)

---

### GET `/api/flow/queue/pending`
جلب الأخبار المعلقة في طابور التحرير.

**Query Params:**
| Param | Type | الوصف |
|-------|------|-------|
| `media_unit_id` | number | فلترة حسب وحدة الإعلام (اختياري) |

**Response 200:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 10,
      "media_unit_id": 1,
      "raw_data_id": 55,
      "policy_id": null,
      "status": "pending",
      "editor_notes": null,
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z",
      "title": "عنوان الخبر",
      "content": "محتوى الخبر...",
      "image_url": "https://...",
      "url": "https://...",
      "category_name": "محلي",
      "media_unit_name": "القناة الرئيسية",
      "source_name": "وكالة وفا"
    }
  ]
}
```

---

### GET `/api/flow/queue/stats`
إحصائيات الطابور لكل وحدة إعلام.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "القناة الرئيسية",
      "pending_count": 5,
      "in_review_count": 2,
      "approved_count": 10,
      "rejected_count": 3
    }
  ]
}
```

---

### GET `/api/flow/queue/:id`
جلب عنصر واحد من الطابور بالتفاصيل.

**Params:** `id` — رقم العنصر في الطابور

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "status": "pending",
    "title": "عنوان الخبر",
    "content": "محتوى...",
    "category_name": "محلي",
    "media_unit_name": "القناة الرئيسية",
    "source_name": "وفا"
  }
}
```

**Response 404:**
```json
{ "success": false, "message": "العنصر غير موجود" }
```

---

### POST `/api/flow/queue/:id/approve`
موافقة المحرر على خبر ونشره في `published_items`.

**Params:** `id` — رقم العنصر في الطابور

**Request Body:**
```json
{
  "policyId": 3,
  "editorNotes": "تمت المراجعة والموافقة",
  "finalTitle": "عنوان معدّل (اختياري)",
  "finalContent": "محتوى معدّل بعد تطبيق السياسات (اختياري)",
  "finalImageUrl": "https://example.com/img.jpg (اختياري)"
}
```
> كل الحقول اختيارية. لو لم يُرسل `finalContent` يُنشر المحتوى الأصلي.

**Response 200:**
```json
{
  "success": true,
  "message": "تمت الموافقة على الخبر ونشره بنجاح",
  "data": { "queueId": 10 }
}
```

---

### POST `/api/flow/queue/:id/reject`
رفض خبر من الطابور.

**Params:** `id`

**Request Body:**
```json
{
  "editorNotes": "سبب الرفض (اختياري)"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "تم رفض الخبر بنجاح",
  "data": { "queueId": 10 }
}
```

---

### GET `/api/flow/published`
جلب المحتوى المنشور.

**Query Params:**
| Param | Type | Default | الوصف |
|-------|------|---------|-------|
| `limit` | number | 50 | عدد النتائج |
| `media_unit_id` | number | — | فلترة حسب وحدة الإعلام |

**Response 200:**
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "id": 1,
      "media_unit_id": 1,
      "raw_data_id": 55,
      "queue_id": 10,
      "content_type_id": 1,
      "title": "عنوان المنشور",
      "content": "محتوى...",
      "tags": ["tag1"],
      "is_active": true,
      "published_at": "2024-01-15T12:00:00.000Z",
      "flow_type": "editorial",
      "category_name": "محلي",
      "media_unit_name": "القناة الرئيسية",
      "tag_names": ["سياسة"]
    }
  ]
}
```

---

### GET `/api/flow/published/stats`
إحصائيات المحتوى المنشور.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total_published": 150,
    "automated_count": 80,
    "editorial_count": 70,
    "by_category": [
      { "category": "محلي", "count": 60 },
      { "category": "دولي", "count": 40 }
    ],
    "by_media_unit": [
      { "media_unit": "القناة الرئيسية", "count": 100 },
      { "media_unit": "الموقع الإلكتروني", "count": 50 }
    ]
  }
}
```

---

### GET `/api/flow/published/:id`
جلب منشور واحد بالـ ID.

**Params:** `id`

**Response 200:**
```json
{
  "success": true,
  "data": { "id": 1, "title": "...", "content": "...", "published_at": "..." }
}
```

---

### GET `/api/flow/published/category/:category`
جلب المنشورات حسب اسم الفئة.

**Params:** `category` — اسم الفئة (مثال: `محلي`)

**Query Params:** `limit` (افتراضي: 50)

**Response 200:**
```json
{
  "success": true,
  "count": 30,
  "data": [ ... ]
}
```

---

### GET `/api/flow/daily-stats`
إحصائيات النشر اليومية.

**Query Params:**
| Param | Type | Default | الوصف |
|-------|------|---------|-------|
| `media_unit_id` | number | — | فلترة حسب وحدة الإعلام |
| `days` | number | 30 | عدد الأيام الماضية |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "published_count": 12,
      "rejected_count": 3,
      "media_unit_name": "القناة الرئيسية"
    }
  ]
}
```

---

## 5. Editorial Policies — السياسات التحريرية

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### GET `/api/news/editorial-policies`
جلب جميع السياسات المفعّلة.

**Query Params:**
| Param | Type | الوصف |
|-------|------|-------|
| `media_unit_id` | number | فلترة حسب وحدة الإعلام (اختياري) |

**Response 200:**
```json
{
  "status": "success",
  "count": 4,
  "policies": [
    {
      "id": 1,
      "name": "استبدال_الكلمات",
      "description": "استبدال الكلمات المحظورة",
      "task_type": "replace",
      "media_unit_id": 1,
      "is_active": true,
      "is_modifying": true,
      "isModifying": true
    }
  ]
}
```

---

### POST `/api/news/editorial-policies`
إنشاء سياسة تحريرية جديدة.

**Request Body:**
```json
{
  "name": "اسم_السياسة",
  "description": "وصف السياسة (اختياري)",
  "taskType": "replace",
  "editorInstructions": "استبدل الكلمات التالية بمرادفاتها...",
  "injectedVars": {
    "banned_words": ["كلمة1", "كلمة2"],
    "replacement_map": { "قديم": "جديد" }
  },
  "isModifying": true,
  "mediaUnitId": 1
}
```
> `name` و `editorInstructions` — مطلوبان. `injectedVars` لازم يكون JSON object.

**Response 201:**
```json
{
  "status": "success",
  "message": "تم إنشاء السياسة بنجاح",
  "policy": {
    "id": 5,
    "name": "اسم_السياسة",
    "task_type": "replace",
    "is_modifying": true,
    "is_active": true,
    "version": 1
  }
}
```

**Response 400:**
```json
{ "error": "name مطلوب (string غير فارغ)" }
```

---

### GET `/api/news/editorial-policies/:policyName`
جلب تفاصيل سياسة واحدة كاملة.

**Params:** `policyName` — اسم السياسة

**Response 200:**
```json
{
  "status": "success",
  "policy": {
    "id": 1,
    "name": "استبدال_الكلمات",
    "description": "...",
    "task_type": "replace",
    "editor_instructions": "...",
    "prompt_template": "...",
    "injected_vars": { "banned_words": ["..."] },
    "output_schema": { "modified_text": "string", "changes": "array" },
    "is_active": true,
    "is_modifying": true,
    "media_unit_id": 1,
    "version": 2
  }
}
```

---

### PUT `/api/news/editorial-policies/:policyName`
تحديث تعليمات أو متغيرات سياسة.

**Params:** `policyName`

**Request Body** (واحد على الأقل مطلوب):
```json
{
  "editorInstructions": "تعليمات جديدة للـ AI",
  "injectedVars": {
    "banned_words": ["كلمة_جديدة"]
  }
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "تم تحديث السياسة بنجاح",
  "policy": { "id": 1, "name": "...", "version": 3 }
}
```

---

### DELETE `/api/news/editorial-policies/:policyName`
حذف سياسة تحريرية.

**Params:** `policyName`

**Response 200:**
```json
{
  "status": "success",
  "message": "تم حذف السياسة بنجاح",
  "policy": { "id": 1, "name": "استبدال_الكلمات" }
}
```

**Response 404:**
```json
{ "error": "السياسة غير موجودة" }
```

---

### POST `/api/news/editorial-policies/apply`
تطبيق سياسة واحدة على نص أو خبر من الطابور.

**حالة 1 — تطبيق على خبر من الطابور:**
```json
{
  "policyId": 1,
  "queueId": 10,
  "appliedPolicies": []
}
```

**حالة 2 — تطبيق على نص مباشر:**
```json
{
  "policyName": "استبدال_الكلمات",
  "text": "النص المراد معالجته",
  "appliedPolicies": [
    { "name": "سياسة_سابقة", "taskType": "replace", "timestamp": "2024-01-15T10:00:00.000Z" }
  ]
}
```
> `policyId` أو `policyName` — واحد مطلوب. `text` أو `queueId` — واحد مطلوب.

**Response 200 — سياسة تعديل (is_modifying = true):**
```json
{
  "policy": {
    "id": 1,
    "name": "استبدال_الكلمات",
    "taskType": "replace",
    "isModifying": true,
    "isInspection": false
  },
  "source": {
    "queueId": 10,
    "rawDataId": 55,
    "mediaUnitId": 1,
    "title": "عنوان الخبر",
    "category": "محلي",
    "mediaUnit": "القناة الرئيسية",
    "status": "pending"
  },
  "originalText": "النص الأصلي...",
  "originalTitle": "عنوان الخبر",
  "modifiedText": "النص بعد التعديل...",
  "hasChanges": true,
  "changes": {
    "changesMade": ["استبدل كلمة X بـ Y"],
    "totalChanges": 3
  },
  "result": {
    "modified_text": "...",
    "changes": ["..."],
    "total_changes": 3,
    "notes": "..."
  },
  "appliedPolicies": [
    { "name": "استبدال_الكلمات", "taskType": "replace", "timestamp": "2024-01-15T10:00:00.000Z" }
  ],
  "executionTime": 1200
}
```

**Response 200 — سياسة فحص (is_modifying = false):**
```json
{
  "policy": { "id": 2, "name": "فحص_التوازن", "isModifying": false, "isInspection": true },
  "originalText": "النص...",
  "inspection": {
    "status": "issues_found",
    "issues": ["النص يميل لجهة واحدة"],
    "summary": "يحتاج مراجعة",
    "details": {}
  },
  "result": { "status": "issues_found", "issues": [...], "summary": "...", "details": {} },
  "appliedPolicies": [...],
  "executionTime": 900
}
```

---

### POST `/api/news/editorial-policies/sequential`
تطبيق سياسات متعددة بشكل متسلسل — output كل سياسة يصير input للتالية.

**Request Body:**
```json
{
  "queueId": 10,
  "policyIds": [1, 2, 3]
}
```
أو بنص مباشر:
```json
{
  "text": "النص الأصلي",
  "policyIds": [1, 2, 3]
}
```
> يطبّق فقط السياسات التي `is_modifying = true`.

**Response 200:**
```json
{
  "status": "success",
  "originalText": "النص الأصلي...",
  "finalText": "النص بعد كل التعديلات...",
  "hasChanges": true,
  "totalExecutionTime": 3500,
  "policiesApplied": 3,
  "skippedPolicyIds": [],
  "source": {
    "queueId": 10,
    "title": "عنوان الخبر",
    "mediaUnit": "القناة الرئيسية"
  },
  "steps": [
    {
      "policyId": 1,
      "policyName": "استبدال_الكلمات",
      "taskType": "replace",
      "hasChanges": true,
      "executionTime": 1200,
      "status": "success",
      "result": { "modified_text": "...", "changes": [...] }
    },
    {
      "policyId": 2,
      "policyName": "إعادة_الصياغة",
      "taskType": "rewrite",
      "hasChanges": true,
      "executionTime": 1500,
      "status": "success",
      "result": { "modified_text": "...", "changes": [...] }
    }
  ]
}
```

---

### POST `/api/news/editorial-policies/pipeline`
جلب السياسات جاهزة للتطبيق من جهة الفرونت.

**Request Body:**
```json
{
  "text": "النص",
  "policyNames": ["استبدال_الكلمات", "فحص_التوازن"]
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "السياسات جاهزة للتطبيق من جهة الـ Frontend",
  "originalText": "النص",
  "policies": [
    {
      "name": "استبدال_الكلمات",
      "taskType": "replace",
      "endpoint": "generate",
      "description": "تطبيق سياسة استبدال_الكلمات"
    }
  ],
  "instructions": {
    "step1": "طبّق السياسات بالترتيب المطلوب",
    "step2": "استخدم النص المعدّل من السياسة السابقة كـ input للسياسة التالية",
    "step3": "احفظ النص النهائي بعد تطبيق جميع السياسات"
  }
}
```

---

### POST `/api/news/editorial-policies/save-edited`
حفظ النص المعدّل يدوياً من المحرر بعد التطبيق المتسلسل.

**Request Body:**
```json
{
  "queueId": 10,
  "editedText": "النص النهائي بعد تعديل المحرر",
  "appliedPolicies": [
    { "name": "استبدال_الكلمات", "taskType": "replace", "timestamp": "2024-01-15T10:00:00.000Z" }
  ]
}
```
> `queueId` و `editedText` — مطلوبان.

**Response 200:**
```json
{
  "status": "success",
  "message": "تم حفظ النص المعدّل بنجاح",
  "queueId": 10,
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

## 6. System Settings — إعدادات النظام

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### GET `/api/settings`
جلب جميع إعدادات النظام.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "key": "scheduler_enabled",          "value": "true",  "description": "تشغيل/إيقاف السحب التلقائي", "updated_at": "2024-01-15T10:00:00.000Z" },
    { "key": "classifier_enabled",         "value": "true",  "description": "تشغيل/إيقاف التصنيف الآلي", "updated_at": "2024-01-15T10:00:00.000Z" },
    { "key": "flow_enabled",               "value": "true",  "description": "تشغيل/إيقاف فلو التوجيه",   "updated_at": "2024-01-15T10:00:00.000Z" },
    { "key": "scheduler_interval_minutes", "value": "15",    "description": "الفاصل الزمني بالدقائق",     "updated_at": "2024-01-15T10:00:00.000Z" },
    { "key": "articles_per_source",        "value": "20",    "description": "عدد الأخبار لكل مصدر",       "updated_at": "2024-01-15T10:00:00.000Z" }
  ]
}
```

---

### GET `/api/settings/toggles`
جلب حالة جميع الإعدادات دفعة واحدة (الأكثر استخداماً من الفرونت).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "scheduler_enabled": true,
    "classifier_enabled": true,
    "flow_enabled": false,
    "scheduler_interval_minutes": 15,
    "articles_per_source": 20
  }
}
```

---

### PATCH `/api/settings/:key`
تحديث إعداد واحد.

**Params:** `key` — اسم الإعداد

**المفاتيح المتاحة:**
| Key | Type | الوصف |
|-----|------|-------|
| `scheduler_enabled` | `"true"` / `"false"` | تشغيل/إيقاف السحب التلقائي |
| `classifier_enabled` | `"true"` / `"false"` | تشغيل/إيقاف التصنيف الآلي |
| `flow_enabled` | `"true"` / `"false"` | تشغيل/إيقاف فلو التوجيه |
| `scheduler_interval_minutes` | `"10"` / `"15"` / `"30"` | الفاصل الزمني بالدقائق |
| `articles_per_source` | `"10"` / `"20"` / `"50"` | عدد الأخبار لكل مصدر |

**Request Body:**
```json
{ "value": "false" }
```

**Response 200:**
```json
{
  "success": true,
  "message": "تم تحديث scheduler_enabled إلى false",
  "data": {
    "key": "scheduler_enabled",
    "value": "false",
    "description": "تشغيل/إيقاف السحب التلقائي",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

**Response 400 — مفتاح غير مسموح:**
```json
{
  "success": false,
  "message": "المفتاح غير مسموح به. المفاتيح المتاحة: scheduler_enabled, classifier_enabled, ..."
}
```

**Response 404 — الجدول غير موجود:**
```json
{
  "success": false,
  "message": "الإعداد غير موجود في الداتابيس — شغّل SQL الإنشاء أولاً"
}
```

---

### PATCH `/api/settings/toggles/bulk`
تحديث أكثر من إعداد دفعة واحدة.

**Request Body** (كل الحقول اختيارية، واحد على الأقل مطلوب):
```json
{
  "scheduler_enabled": false,
  "classifier_enabled": true,
  "flow_enabled": false,
  "scheduler_interval_minutes": 30,
  "articles_per_source": 50
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "تم تحديث 3 إعداد",
  "data": [
    { "key": "scheduler_enabled",          "value": "false", "updated_at": "..." },
    { "key": "flow_enabled",               "value": "false", "updated_at": "..." },
    { "key": "scheduler_interval_minutes", "value": "30",    "updated_at": "..." }
  ]
}
```

**Response 400 — قيمة غير صحيحة:**
```json
{ "success": false, "message": "scheduler_interval_minutes يجب أن يكون رقم موجب" }
```

---

## 16. Scheduler — جدولة المهام

### معلومات عامة
الـ Scheduler يعمل بشكل تلقائي في الخلفية ويقرأ الإعدادات من الداتابيس في كل دورة:
- **المرحلة 1:** سحب الأخبار من RSS (parallel)
- **المرحلة 2:** تصنيف الأخبار بالـ AI وحفظها
- **المرحلة 3:** توجيه الأخبار عبر الفلو (أوتوماتيكي أو تحريري)

### الإعدادات المؤثرة
| الإعداد | الوصف |
|--------|-------|
| `scheduler_enabled` | تشغيل/إيقاف السحب التلقائي |
| `classifier_enabled` | تشغيل/إيقاف التصنيف الآلي |
| `flow_enabled` | تشغيل/إيقاف فلو التوجيه |
| `scheduler_interval_minutes` | الفاصل الزمني بين الدورات (بالدقائق) |
| `articles_per_source` | عدد الأخبار المسحوبة من كل مصدر |

### ملاحظات مهمة
- الـ Scheduler يقرأ الإعدادات من الداتابيس قبل كل دورة — لا حاجة لإعادة تشغيل السيرفر
- لو دورة سابقة لا تزال تعمل، الدورة الجديدة تُتخطى لتجنب التعارض
- الأخبار الناقصة (أقل من 300 حرف) تُتخطى من الفلو وتُوضع flag `is_incomplete = true`
- الأخبار الناقصة تبقى في `raw_data` فقط ولا تدخل الفلو تلقائياً
- عندما يكمل المحرر المحتوى، يُزال الـ flag ويدخل الخبر الفلو

---

## 17. Incomplete Articles — الأخبار الناقصة

### المنطق:
```
1. خبر جديد يُسحب من RSS
   ↓
2. يُحفظ في raw_data
   ↓
3. الفلو يتحقق من طول المحتوى:
   
   ✅ إذا >= 300 حرف → يدخل الفلو (أوتو أو تحرير)
   ❌ إذا < 300 حرف → يبقى في raw_data فقط + flag is_incomplete = true
   
4. المحرر يشوف الأخبار الناقصة من `/api/data/articles/incomplete`
   ↓
5. يكمل المحتوى عبر `/api/data/articles/:id/content`
   ↓
6. الخبر ينتقل لـ editorial_queue (إذا كان تحريري)
   أو published_items (إذا كان أوتوماتيكي)
```

### الفرق بين الأخبار الناقصة والطابور:
| الحالة | المكان | الحالة | الفلو |
|--------|--------|--------|-------|
| **ناقصة** | `raw_data` فقط | `is_incomplete = true` | لم تدخل الفلو |
| **في الطابور** | `editorial_queue` | `status = pending` | دخلت الفلو وتنتظر المحرر |
| **منشورة** | `published_items` | `is_active = true` | مرت الفلو ونُشرت |

---

## 18. Error Responses — أشكال الأخطاء

كل الـ endpoints بترجع نفس شكل الخطأ:

**500 — خطأ في السيرفر:**
```json
{
  "success": false,
  "message": "وصف الخطأ",
  "error": "رسالة الخطأ التقنية"
}
```

**404 — غير موجود:**
```json
{
  "success": false,
  "message": "العنصر غير موجود"
}
```

**400 — بيانات غير صحيحة:**
```json
{
  "success": false,
  "message": "وصف المشكلة في الـ request"
}
```

> السياسات التحريرية بترجع `error` بدل `message` في بعض الحالات:
```json
{ "error": "policyName أو policyId مطلوب" }
```

---

---

## 7. AI Hub — المساعد الذكي والأدوات

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### POST `/api/ai-hub/chat/generate`
توليد رد من المساعد الذكي.

**Request Body:**
```json
{
  "prompt": "السؤال أو الطلب",
  "think": false,
  "max_tokens": 1000,
  "temperature": 0.7
}
```
> `prompt` — مطلوب. باقي الحقول اختيارية.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "response": "الرد من المساعد الذكي",
    "tokensUsed": 150
  }
}
```

---

### POST `/api/ai-hub/chat/summarize`
تلخيص نص.

**Request Body:**
```json
{
  "text": "النص المراد تلخيصه",
  "style": "bullet_points"
}
```
> `text` — مطلوب. `style` — اختياري (bullet_points | short_paragraph | headlines).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "summary": "النص الملخص"
  }
}
```

---

### POST `/api/ai-hub/chat/rewrite`
إعادة صياغة نص.

**Request Body:**
```json
{
  "text": "النص المراد إعادة صياغته",
  "style": "radio_broadcast"
}
```
> `text` — مطلوب. `style` — اختياري (radio_broadcast | investigative | social_media | formal | casual).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "rewrittenText": "النص المعاد صياغته"
  }
}
```

---

### POST `/api/ai-hub/ideas/generate`
توليد أفكار / أسئلة / عناوين.

**Request Body:**
```json
{
  "topic": "الموضوع",
  "type": "questions",
  "count": 5
}
```
> `topic` — مطلوب. `type` — اختياري (ideas | questions | headlines). `count` — اختياري (افتراضي: 5).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "ideas": [
      "فكرة 1",
      "فكرة 2",
      "فكرة 3"
    ]
  }
}
```

---

## 8. Speech-to-Text (STT) — تحويل الصوت إلى نص

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### POST `/api/ai-hub/stt/transcribe-url`
تفريغ صوتي من رابط.

**Request Body:**
```json
{
  "audioUrl": "https://example.com/audio.mp3",
  "language": "ar"
}
```
> `audioUrl` — مطلوب. `language` — اختياري (افتراضي: ar).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "transcript": "النص المفرغ من الصوت",
    "language": "ar",
    "audioUrl": "https://example.com/audio.mp3"
  }
}
```

---

### POST `/api/ai-hub/stt/transcribe-file`
تفريغ صوتي من ملف مرفوع (S3).

**Request Body:**
```json
{
  "fileId": 123,
  "s3Url": "https://s3.amazonaws.com/bucket/audio.mp3",
  "language": "ar"
}
```
> `s3Url` — مطلوب. `fileId` و `language` — اختياريان.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "fileId": 123,
    "transcript": "النص المفرغ",
    "language": "ar",
    "s3Url": "https://s3.amazonaws.com/bucket/audio.mp3"
  }
}
```

---

### POST `/api/ai-hub/stt/transcribe-upload`
تفريغ صوتي من ملف مرفوع مباشرة.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` — ملف صوتي (mp3, wav, m4a, ogg, flac, webm)
- `language` — اختياري (افتراضي: ar)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "transcript": "النص المفرغ",
    "language": "ar",
    "fileName": "audio.mp3",
    "fileSize": 1024000
  }
}
```

---

### POST `/api/ai-hub/stt/transcribe-base64`
تفريغ صوتي من بيانات base64.

**Request Body:**
```json
{
  "audioBase64": "base64_encoded_audio_data",
  "language": "ar"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "transcript": "النص المفرغ",
    "language": "ar",
    "audioSize": 1024000
  }
}
```

---

### POST `/api/ai-hub/stt/transcribe-with-timestamps`
تفريغ صوتي مع الـ timestamps (يدعم JSON و SRT).

**Request Body:**
```json
{
  "audioUrl": "https://example.com/audio.mp3",
  "language": "ar",
  "format": "json"
}
```
> `audioUrl` — مطلوب. `language` — اختياري (افتراضي: ar). `format` — اختياري (json | srt، افتراضي: json).

**Response 200 — JSON format:**
```json
{
  "success": true,
  "data": {
    "transcript": "النص الكامل المفرغ",
    "segments": [
      {
        "start": 0.0,
        "end": 5.2,
        "text": "مقطع من النص",
        "startFormatted": "00:00",
        "endFormatted": "00:05"
      }
    ],
    "duration": 433.17,
    "language": "ar",
    "segmentCount": 10
  }
}
```

**Response 200 — SRT format:**
```json
{
  "success": true,
  "data": {
    "transcript": "النص الكامل المفرغ",
    "srt": "1\n00:00:00,000 --> 00:00:05,200\nمقطع من النص\n\n2\n...",
    "duration": 433.17,
    "language": "ar",
    "segmentCount": 10
  }
}
```

---

### GET `/api/ai-hub/stt/languages`
الحصول على قائمة اللغات المدعومة.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "ar": "Arabic (العربية)",
    "en": "English",
    "fr": "French",
    "es": "Spanish"
  }
}
```

---

## 9. Text-to-Speech (TTS) — تحويل النص إلى صوت

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### POST `/api/ai-hub/tts/generate`
تحويل النص إلى صوت.

**Request Body:**
```json
{
  "text": "النص المراد تحويله لصوت",
  "voice": "nova"
}
```
> `text` — مطلوب. `voice` — اختياري (alloy | echo | fable | onyx | nova | shimmer).

**Response 200:**
```json
{
  "success": true,
  "audioBase64": "base64_encoded_audio",
  "mimeType": "audio/mpeg",
  "remaining": 100,
  "resetTime": 1234567890
}
```

---

### GET `/api/ai-hub/tts/voices`
الحصول على قائمة الأصوات المتاحة.

**Response 200:**
```json
{
  "success": true,
  "voices": {
    "alloy": { "name": "Alloy", "description": "صوت متوازن" },
    "echo": { "name": "Echo", "description": "صوت واضح" },
    "fable": { "name": "Fable", "description": "صوت قصصي" },
    "onyx": { "name": "Onyx", "description": "صوت عميق" },
    "nova": { "name": "Nova", "description": "صوت نسائي" },
    "shimmer": { "name": "Shimmer", "description": "صوت ناعم" }
  }
}
```

---

## 10. Audio Extraction — استخراج الصوت من الفيديو

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### POST `/api/ai-hub/audio-extraction/extract-from-file`
استخراج الصوت من ملف فيديو محلي.

**Request Body:**
```json
{
  "videoFilePath": "/path/to/video.mp4",
  "outputFormat": "mp3",
  "bitrate": "128k"
}
```
> `videoFilePath` — مطلوب. `outputFormat` و `bitrate` — اختياريان.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "audioBase64": "base64_encoded_audio",
    "audioSize": 1024000,
    "format": "mp3",
    "bitrate": "128k"
  }
}
```

---

### POST `/api/ai-hub/audio-extraction/extract-from-url`
استخراج الصوت من رابط فيديو.

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "outputFormat": "mp3",
  "bitrate": "128k"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "audioBase64": "base64_encoded_audio",
    "audioSize": 1024000,
    "format": "mp3",
    "bitrate": "128k",
    "videoUrl": "https://example.com/video.mp4"
  }
}
```

---

### POST `/api/ai-hub/audio-extraction/extract-from-s3`
استخراج الصوت من ملف فيديو في S3.

**Request Body:**
```json
{
  "fileId": 123,
  "s3Url": "https://s3.amazonaws.com/bucket/video.mp4",
  "outputFormat": "mp3",
  "bitrate": "128k"
}
```
> `s3Url` — مطلوب. `fileId`, `outputFormat`, `bitrate` — اختياريان.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "fileId": 123,
    "audioBase64": "base64_encoded_audio",
    "audioSize": 1024000,
    "format": "mp3",
    "bitrate": "128k",
    "s3Url": "https://s3.amazonaws.com/bucket/video.mp4"
  }
}
```

---

### POST `/api/ai-hub/audio-extraction/extract-and-transcribe`
استخراج الصوت من فيديو S3 مع تفريغ متكامل (يدعم chunking).

**Request Body:**
```json
{
  "fileId": 123,
  "s3Url": "https://s3.amazonaws.com/bucket/video.mp4",
  "outputFormat": "mp3",
  "bitrate": "128k",
  "language": "ar",
  "enableChunking": true,
  "chunkDurationSeconds": 180,
  "maxConcurrentChunks": 3
}
```
> `s3Url` — مطلوب. باقي الحقول اختيارية.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "fileId": 123,
    "audioBase64": "base64_encoded_audio",
    "audioSize": 1024000,
    "format": "mp3",
    "bitrate": "128k",
    "s3Url": "https://s3.amazonaws.com/bucket/video.mp4",
    "transcript": "النص المفرغ من الفيديو",
    "language": "ar",
    "processingMethod": "chunked",
    "chunksProcessed": 5
  }
}
```

---

### POST `/api/ai-hub/audio-extraction/video-info`
الحصول على معلومات الفيديو.

**Request Body:**
```json
{
  "videoFilePath": "/path/to/video.mp4"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "format": { "format_name": "mp4", "duration": "120.5" },
    "streams": [ ... ],
    "duration": 120.5,
    "bitrate": 1500000,
    "hasAudio": true,
    "hasVideo": true
  }
}
```

---

### GET `/api/ai-hub/audio-extraction/formats`
الحصول على الصيغ المدعومة.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "videoFormats": ["mp4", "avi", "mov", "mkv", "flv", "wmv"],
    "audioFormats": ["mp3", "wav", "aac", "flac", "ogg", "m4a"]
  }
}
```

---

## 11. Video to Text — تحويل الفيديو إلى نص

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### POST `/api/ai-hub/video-to-text/process`
استخراج الصوت من الفيديو وتحويله لنص.

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "language": "ar",
  "outputFormat": "mp3",
  "bitrate": "128k"
}
```
> `videoUrl` — مطلوب. باقي الحقول اختيارية.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "videoUrl": "https://example.com/video.mp4",
    "transcript": "النص المفرغ من الفيديو",
    "language": "ar",
    "audioSize": 1024000,
    "audioFormat": "mp3",
    "bitrate": "128k",
    "transcriptLength": 500
  }
}
```

---

### POST `/api/ai-hub/video-to-text/process-s3`
استخراج الصوت من فيديو S3 وتحويله لنص.

**Request Body:**
```json
{
  "fileId": 123,
  "s3Url": "https://s3.amazonaws.com/bucket/video.mp4",
  "language": "ar",
  "outputFormat": "mp3",
  "bitrate": "128k"
}
```
> `s3Url` — مطلوب. باقي الحقول اختيارية.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "fileId": 123,
    "s3Url": "https://s3.amazonaws.com/bucket/video.mp4",
    "transcript": "النص المفرغ",
    "language": "ar",
    "audioSize": 1024000,
    "audioFormat": "mp3",
    "bitrate": "128k",
    "transcriptLength": 500
  }
}
```

---

## 12. Programs & Episodes — البرامج والحلقات

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### GET `/api/programs`
جلب جميع البرامج.

**Response 200:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "name": "برنامج الأخبار",
      "description": "برنامج إخباري يومي",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/programs/:id`
جلب برنامج بالـ ID.

**Params:** `id` — رقم البرنامج

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "برنامج الأخبار",
    "description": "برنامج إخباري يومي",
    "is_active": true
  }
}
```

---

### GET `/api/programs/:id/episodes`
جلب حلقات برنامج معين.

**Params:** `id` — رقم البرنامج

**Response 200:**
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "id": 1,
      "program_id": 1,
      "episode_number": 1,
      "title": "الحلقة الأولى",
      "air_date": "2024-01-01",
      "duration_minutes": 30
    }
  ]
}
```

---

### GET `/api/programs/episodes/:id/details`
جلب حلقة بالـ ID مع ضيوفها.

**Params:** `id` — رقم الحلقة

**Response 200:**
```json
{
  "success": true,
  "data": {
    "episode": {
      "id": 1,
      "program_id": 1,
      "episode_number": 1,
      "title": "الحلقة الأولى",
      "air_date": "2024-01-01"
    },
    "guests": [
      {
        "id": 1,
        "name": "أحمد محمد",
        "title": "محلل سياسي",
        "bio": "خبير في الشؤون السياسية"
      }
    ]
  }
}
```

---

### GET `/api/programs/episodes/:id/guests`
جلب ضيوف حلقة معينة.

**Params:** `id` — رقم الحلقة

**Response 200:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "أحمد محمد",
      "title": "محلل سياسي",
      "bio": "خبير في الشؤون السياسية"
    }
  ]
}
```

---

## 13. Guests — الضيوف

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### GET `/api/guests`
جلب جميع الضيوف أو البحث عنهم.

**Query Params:**
| Param | Type | الوصف |
|-------|------|-------|
| `search` | string | البحث في الاسم أو اللقب (اختياري) |

**Response 200:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": 1,
      "name": "أحمد محمد",
      "title": "محلل سياسي",
      "bio": "خبير في الشؤون السياسية",
      "contact_info": "ahmed@example.com"
    }
  ]
}
```

---

### GET `/api/guests/:id`
جلب ضيف بالـ ID.

**Params:** `id` — رقم الضيف

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "أحمد محمد",
    "title": "محلل سياسي",
    "bio": "خبير في الشؤون السياسية",
    "contact_info": "ahmed@example.com"
  }
}
```

---

## 14. Uploaded Files — الملفات المرفوعة

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### GET `/api/uploaded-files`
جلب جميع الملفات المرفوعة.

**Response 200:**
```json
{
  "success": true,
  "count": 100,
  "data": [
    {
      "id": 1,
      "file_name": "audio.mp3",
      "file_type": "audio/mpeg",
      "file_size": 1024000,
      "s3_url": "https://s3.amazonaws.com/bucket/audio.mp3",
      "source_type_id": 1,
      "uploaded_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/uploaded-files/audio`
جلب الملفات الصوتية فقط.

**Response 200:**
```json
{
  "success": true,
  "count": 50,
  "data": [ ... ]
}
```

---

### GET `/api/uploaded-files/video`
جلب ملفات الفيديو فقط.

**Response 200:**
```json
{
  "success": true,
  "count": 30,
  "data": [ ... ]
}
```

---

### GET `/api/uploaded-files/source-type/:sourceTypeId`
جلب الملفات حسب نوع المصدر.

**Params:** `sourceTypeId` — رقم نوع المصدر

**Response 200:**
```json
{
  "success": true,
  "count": 20,
  "data": [ ... ]
}
```

---

### GET `/api/uploaded-files/:id`
جلب ملف بالـ ID.

**Params:** `id` — رقم الملف

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "file_name": "audio.mp3",
    "file_type": "audio/mpeg",
    "file_size": 1024000,
    "s3_url": "https://s3.amazonaws.com/bucket/audio.mp3",
    "source_type_id": 1,
    "uploaded_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 15. ملاحظات مهمة

### 🔒 المصادقة (Authentication)
- **جميع APIs تتطلب توكن JWT** ما عدا `/api/auth/login`
- يجب إرسال التوكن في header: `Authorization: Bearer YOUR_TOKEN`
- التوكن صالح لمدة 24 ساعة
- عند انتهاء التوكن، ستحصل على خطأ `401 Unauthorized`
- التوكن يحتوي على: `user_id`, `email`, `role_id`, `permissions`

### ترتيب الـ Routes في Express
بعض الـ routes لها أولوية — لازم تنتبه:
- `/api/flow/published/stats` لازم يُستدعى قبل `/api/flow/published/:id`
- `/api/news/editorial-policies/apply` لازم يُستدعى قبل `/api/news/editorial-policies/:policyName`
- `/api/programs/episodes/:id/details` لازم يُستدعى قبل `/api/programs/:id`

### fetch_status — حالات الخبر
| القيمة | المعنى |
|--------|--------|
| `fetched` | تم السحب، ينتظر التصنيف والفلو |
| `processed` | تم توجيهه للمسار الصحيح |

### flow — نوع مسار الفئة
| القيمة | المعنى |
|--------|--------|
| `automated` | ينشر مباشرة بدون مراجعة |
| `editorial` | يذهب لطابور التحرير |

### التصنيفات المتاحة
| ID | الاسم |
|----|-------|
| 1 | محلي |
| 2 | دولي |
| 3 | اقتصاد |
| 4 | رياضة |
| 5 | صحة |
| 6 | علوم وتكنولوجيا |
| 7 | فن و ثقافة |
| 9 | بيئة |
| 10 | غذاء |
| 11 | سياسي |


---

## 19. Smart Transcription — التفريغ الذكي

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### POST `/api/ai-hub/smart-transcription/process`
تفريغ ملف صوتي/فيديو وتوليد مخرجات تحريرية.

**Request Body:**
```json
{
  "fileUrl": "https://example.com/audio.mp3",
  "fileType": "audio",
  "language": "ar",
  "outputs": [
    { "type": "executive_summary", "enabled": true },
    { "type": "news_article", "enabled": true },
    { "type": "social_media", "enabled": true, "count": 5 },
    { "type": "video_clips", "enabled": true, "count": 3 }
  ],
  "editorialPolicy": "سياسة تحريرية (اختياري)",
  "customInfo": "معلومات إضافية (اختياري)"
}
```
> `fileUrl` — مطلوب. `fileType` — اختياري (audio | video، افتراضي: audio). أنواع المخرجات: `executive_summary`, `news_article`, `detailed_report`, `social_media`, `video_clips`, `policy_alerts`.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "transcript": "النص المفرغ الكامل",
    "outputs": [
      { "type": "executive_summary", "content": "ملخص تنفيذي...", "metadata": {} },
      { "type": "news_article", "content": "خبر صحفي...", "metadata": {} }
    ],
    "metadata": {
      "processingTime": 15000,
      "language": "ar",
      "fileType": "audio"
    }
  }
}
```

---

### POST `/api/ai-hub/smart-transcription/generate-outputs`
توليد مخرجات تحريرية من transcript موجود (بدون تفريغ جديد).

**Request Body:**
```json
{
  "transcript": "النص المفرغ مسبقاً",
  "outputs": [
    { "type": "executive_summary", "enabled": true },
    { "type": "social_media", "enabled": true, "count": 5 }
  ],
  "editorialPolicy": "سياسة تحريرية (اختياري)",
  "customInfo": "معلومات إضافية (اختياري)"
}
```
> `transcript` و `outputs` — مطلوبان.

**Response 200:** نفس شكل response الـ `/process`.

---

### POST `/api/ai-hub/smart-transcription/export`
تصدير ملف موحد يحتوي جميع المخرجات.

**Request Body:**
```json
{
  "outputs": [
    { "type": "executive_summary", "content": "ملخص تنفيذي..." },
    { "type": "news_article", "content": "خبر صحفي..." }
  ],
  "editorialPolicy": "سياسة تحريرية (اختياري)",
  "customInfo": "معلومات إضافية (اختياري)"
}
```

**Response:** ملف نصي للتحميل (Content-Type: text/plain).

---

### POST `/api/ai-hub/smart-transcription/correct`
تصحيح لغوي للتفريغ (نحو، إملاء، ترقيم).

**Request Body:**
```json
{
  "transcript": "النص المراد تصحيحه",
  "language": "ar",
  "preserveMeaning": true,
  "fixPunctuation": true,
  "fixGrammar": true,
  "fixSpelling": true,
  "improveClarity": true
}
```
> `transcript` — مطلوب. باقي الحقول اختيارية.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "originalTranscript": "النص الأصلي",
    "correctedTranscript": "النص المصحح",
    "corrections": [
      {
        "type": "spelling",
        "original": "كلمة خاطئة",
        "corrected": "كلمة صحيحة",
        "explanation": "تصحيح إملائي"
      }
    ],
    "metadata": {
      "totalCorrections": 5,
      "processingTime": 2000
    }
  }
}
```

---

### POST `/api/ai-hub/smart-transcription/correct-batch`
تصحيح دفعة من التفريغات.

**Request Body:**
```json
{
  "transcripts": ["نص أول", "نص ثاني", "نص ثالث"],
  "language": "ar",
  "preserveMeaning": true,
  "fixPunctuation": true,
  "fixGrammar": true,
  "fixSpelling": true,
  "improveClarity": true
}
```
> `transcripts` — مطلوب (مصفوفة نصوص). باقي الحقول اختيارية.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "results": [
      { "originalTranscript": "...", "correctedTranscript": "...", "corrections": [...] }
    ],
    "stats": {
      "totalTranscripts": 3,
      "totalCorrections": 12,
      "averageCorrectionsPerTranscript": 4,
      "averageProcessingTime": 1500,
      "totalCharactersProcessed": 5000
    }
  }
}
```

---

### POST `/api/ai-hub/smart-transcription/generate-by-outlet`
توليد حزمة تحريرية كاملة حسب هوية الجهة الإعلامية من الداتابيس.

**Request Body:**
```json
{
  "transcript": "النص المفرغ",
  "outletSlug": "annahar",
  "customInfo": "معلومات إضافية (اختياري)",
  "clipCount": 5,
  "socialCount": 6
}
```
> `transcript` و `outletSlug` — مطلوبان. باقي الحقول اختيارية.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "outlet": { "name": "النهار", "slug": "annahar", "identity": "..." },
    "transcript": "النص المفرغ",
    "outputs": [
      { "type": "comprehensive_report", "type_name_ar": "تقرير صحفي شامل", "content": "..." },
      { "type": "short_news", "type_name_ar": "خبر قصير", "content": "..." },
      { "type": "full_transcript", "type_name_ar": "التفريغ الكامل المنقح", "content": "..." },
      { "type": "social_posts", "type_name_ar": "بوستات السوشال ميديا", "content": "..." },
      { "type": "video_clips", "type_name_ar": "أهم المقاطع للتقطيع", "content": "..." }
    ],
    "quality_assessment": "تقييم الجودة",
    "top_ideas": "أهم الأفكار",
    "top_quotes": "أهم الاقتباسات",
    "editorial_alerts": "تنبيهات تحريرية",
    "metadata": { "processingTime": 20000 }
  }
}
```

---

## 20. Streaming Extraction — الاستخراج المتدفق

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**
> **⚠️ Rate Limited:** بعض الـ endpoints محدودة بـ 10 طلبات / 15 دقيقة أو 3 طلبات / 5 دقائق.

### POST `/api/ai-hub/streaming-extraction/start`
بدء مهمة استخراج صوت غير متزامنة.

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "outputFormat": "mp3",
  "bitrate": "128k",
  "timeout": 300000,
  "maxSize": 104857600
}
```
> `videoUrl` — مطلوب. باقي الحقول اختيارية.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "status": "pending",
    "message": "Extraction job started"
  }
}
```

---

### GET `/api/ai-hub/streaming-extraction/status/:jobId`
الحصول على حالة مهمة الاستخراج.

**Params:** `jobId` — معرف المهمة

**Response 200:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "status": "completed",
    "progress": 100,
    "result": {
      "audioUrl": "https://...",
      "transcript": "النص المفرغ",
      "size": 1024000,
      "duration": 120.5
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:02:00.000Z"
  }
}
```
> `status` يكون: `pending` | `processing` | `completed` | `failed`.

---

### POST `/api/ai-hub/streaming-extraction/stream`
تدفق الصوت مباشرة (متزامن) — يرجع ملف صوتي.

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "outputFormat": "mp3",
  "bitrate": "128k",
  "timeout": 300000
}
```

**Response:** Audio stream (binary)
- Content-Type: `audio/mpeg`
- Content-Disposition: `attachment; filename="extracted-audio.mp3"`

---

### POST `/api/ai-hub/streaming-extraction/extract-and-transcribe`
استخراج الصوت والتفريغ (طريقة الإنتاج مع chunking).

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "language": "ar",
  "outputFormat": "mp3",
  "bitrate": "128k",
  "enableChunking": true,
  "chunkDurationSeconds": 180,
  "maxConcurrentChunks": 3
}
```
> `videoUrl` — مطلوب. باقي الحقول اختيارية.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "transcript": "النص المفرغ",
    "audioSize": 1024000,
    "language": "ar",
    "processingMethod": "chunked"
  }
}
```

---

### POST `/api/ai-hub/streaming-extraction/download-first`
استخراج بطريقة التحميل أولاً (للروابط المشكلة).

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "language": "ar",
  "outputFormat": "mp3",
  "bitrate": "128k",
  "enableChunking": true,
  "chunkDurationSeconds": 180,
  "maxConcurrentChunks": 3,
  "maxFileSize": 1073741824
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "transcript": "النص المفرغ",
    "audioSize": 1024000,
    "videoSize": 50000000,
    "processingTime": 45000,
    "language": "ar",
    "processingMethod": "download-first",
    "chunksProcessed": 5,
    "enabledChunking": true
  }
}
```

---

### POST `/api/ai-hub/streaming-extraction/video-info`
الحصول على معلومات الفيديو باستخدام طريقة التحميل أولاً.

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "videoInfo": {
      "format": {},
      "streams": [],
      "duration": 120.5,
      "bitrate": 1500000,
      "hasAudio": true,
      "hasVideo": true,
      "estimatedSize": 50000000
    },
    "url": "https://example.com/video.mp4",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### POST `/api/ai-hub/streaming-extraction/diagnose`
تشخيص رابط S3 للمشاكل المحتملة.

**Request Body:**
```json
{
  "videoUrl": "https://s3.amazonaws.com/bucket/video.mp4"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "diagnostic": {
      "accessible": true,
      "contentType": "video/mp4",
      "contentLength": 50000000,
      "isValidVideo": true,
      "issues": [],
      "recommendations": []
    },
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### GET `/api/ai-hub/streaming-extraction/stats`
إحصائيات النظام.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "activeProcesses": 2,
    "sessionId": "uuid-string",
    "totalJobs": 150,
    "uptime": 86400,
    "memory": { "rss": 100000000, "heapUsed": 50000000 },
    "nodeVersion": "v18.17.0"
  }
}
```

---

## 21. AI Analytics — إحصائيات AI Hub

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### GET `/api/ai-hub/analytics/overview`
إحصائيات عامة لجميع ميزات AI Hub.

**Query Params:**
| Param | Type | الوصف |
|-------|------|-------|
| `startDate` | string | تاريخ البداية (اختياري) |
| `endDate` | string | تاريخ النهاية (اختياري) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 1500,
    "totalTokensUsed": 500000,
    "byFeature": {
      "chat": { "requests": 500, "tokens": 200000 },
      "stt": { "requests": 300, "tokens": 0 },
      "tts": { "requests": 200, "tokens": 0 },
      "ideas": { "requests": 100, "tokens": 50000 }
    }
  }
}
```

---

### GET `/api/ai-hub/analytics/daily`
إحصائيات يومية.

**Query Params:**
| Param | Type | الوصف |
|-------|------|-------|
| `startDate` | string | تاريخ البداية (اختياري) |
| `endDate` | string | تاريخ النهاية (اختياري) |
| `feature` | string | فلترة حسب الميزة (اختياري) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "date": "2024-01-15", "requests": 50, "tokens": 20000, "feature": "chat" },
    { "date": "2024-01-14", "requests": 45, "tokens": 18000, "feature": "chat" }
  ]
}
```

---

### GET `/api/ai-hub/analytics/users`
إحصائيات المستخدمين.

**Query Params:**
| Param | Type | الوصف |
|-------|------|-------|
| `userIdentifier` | string | معرف المستخدم (اختياري) |
| `feature` | string | فلترة حسب الميزة (اختياري) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "userId": "user@example.com",
    "totalRequests": 200,
    "totalTokens": 80000,
    "byFeature": { "chat": 100, "stt": 50, "tts": 50 }
  }
}
```

---

### GET `/api/ai-hub/analytics/top-users`
أكثر المستخدمين نشاطاً.

**Query Params:**
| Param | Type | Default | الوصف |
|-------|------|---------|-------|
| `limit` | number | 10 | عدد النتائج |

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "userId": "user1@example.com", "totalRequests": 500, "totalTokens": 200000 },
    { "userId": "user2@example.com", "totalRequests": 300, "totalTokens": 120000 }
  ]
}
```

---

### GET `/api/ai-hub/analytics/my-usage`
استخدام المستخدم الحالي (من التوكن).

**Query Params:**
| Param | Type | الوصف |
|-------|------|-------|
| `feature` | string | فلترة حسب الميزة (اختياري) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 150,
    "totalTokens": 60000,
    "byFeature": { "chat": 80, "stt": 40, "ideas": 30 }
  }
}
```

---

### GET `/api/ai-hub/analytics/feature/:feature`
إحصائيات ميزة معينة.

**Params:** `feature` — اسم الميزة (chat, tts, stt, ideas, smart-transcription, etc.)

**Query Params:**
| Param | Type | الوصف |
|-------|------|-------|
| `startDate` | string | تاريخ البداية (اختياري) |
| `endDate` | string | تاريخ النهاية (اختياري) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "feature": "chat",
    "totalRequests": 500,
    "totalTokens": 200000,
    "averageTokensPerRequest": 400,
    "daily": [
      { "date": "2024-01-15", "requests": 50, "tokens": 20000 }
    ]
  }
}
```

---

## 22. Transcription Editorial — إدارة الجهات الإعلامية والمخرجات

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### GET `/api/ai-hub/transcription-editorial/outlets`
جلب جميع الجهات الإعلامية (Outlet Editorial Profiles).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "النهار",
      "slug": "annahar",
      "identity": "وصف الهوية التحريرية",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/ai-hub/transcription-editorial/outlets/:slug`
جلب جهة إعلامية بالـ slug.

**Params:** `slug` — معرف الجهة (مثال: `annahar`)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "النهار",
    "slug": "annahar",
    "identity": "وصف الهوية التحريرية الكامل",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### POST `/api/ai-hub/transcription-editorial/outlets`
إنشاء جهة إعلامية جديدة.

**Request Body:**
```json
{
  "name": "اسم الجهة",
  "slug": "outlet-slug",
  "identity": "وصف الهوية التحريرية"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 5, "name": "اسم الجهة", "slug": "outlet-slug" }
}
```

---

### PUT `/api/ai-hub/transcription-editorial/outlets/:slug`
تحديث جهة إعلامية.

**Params:** `slug`

**Request Body:**
```json
{
  "name": "اسم جديد",
  "identity": "هوية تحريرية محدثة"
}
```

**Response 200:**
```json
{ "success": true, "message": "تم التحديث بنجاح" }
```

---

### DELETE `/api/ai-hub/transcription-editorial/outlets/:slug`
حذف جهة إعلامية.

**Params:** `slug`

**Response 200:**
```json
{ "success": true, "message": "تم الحذف بنجاح" }
```

---

### GET `/api/ai-hub/transcription-editorial/output-types`
جلب أنواع المخرجات المتاحة.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "slug": "comprehensive_report", "name_ar": "تقرير صحفي شامل", "is_active": true },
    { "id": 2, "slug": "short_news", "name_ar": "خبر قصير", "is_active": true },
    { "id": 3, "slug": "social_posts", "name_ar": "بوستات السوشال ميديا", "is_active": true }
  ]
}
```

---

### POST `/api/ai-hub/transcription-editorial/output-types`
إنشاء نوع مخرج جديد.

**Request Body:**
```json
{
  "slug": "new_output_type",
  "name_ar": "اسم النوع بالعربي",
  "description": "وصف النوع"
}
```

**Response 201:**
```json
{ "success": true, "data": { "id": 10, "slug": "new_output_type" } }
```

---

### PUT `/api/ai-hub/transcription-editorial/output-types/:id`
تحديث نوع مخرج.

**Params:** `id` — رقم النوع

**Request Body:**
```json
{
  "name_ar": "اسم محدث",
  "description": "وصف محدث"
}
```

**Response 200:**
```json
{ "success": true, "message": "تم التحديث بنجاح" }
```

---

### GET `/api/ai-hub/transcription-editorial/social-platforms`
جلب منصات السوشال ميديا المتاحة.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Facebook", "slug": "facebook", "max_chars": 63206 },
    { "id": 2, "name": "Twitter/X", "slug": "twitter", "max_chars": 280 },
    { "id": 3, "name": "Instagram", "slug": "instagram", "max_chars": 2200 }
  ]
}
```

---

### POST `/api/ai-hub/transcription-editorial/social-platforms`
إنشاء منصة سوشال جديدة.

**Request Body:**
```json
{
  "name": "TikTok",
  "slug": "tiktok",
  "max_chars": 2200
}
```

**Response 201:**
```json
{ "success": true, "data": { "id": 5, "name": "TikTok", "slug": "tiktok" } }
```

---

### GET `/api/ai-hub/transcription-editorial/outlet-config/:outletSlug`
جلب تخصيص المخرجات لجهة إعلامية معينة.

**Params:** `outletSlug` — slug الجهة

**Response 200:**
```json
{
  "success": true,
  "data": {
    "outletSlug": "annahar",
    "configs": [
      { "outputTypeId": 1, "enabled": true, "priority": 1, "customPrompt": "..." },
      { "outputTypeId": 2, "enabled": true, "priority": 2, "customPrompt": null }
    ]
  }
}
```

---

### POST `/api/ai-hub/transcription-editorial/outlet-config`
حفظ/تحديث تخصيص مخرجات جهة.

**Request Body:**
```json
{
  "outletSlug": "annahar",
  "outputTypeId": 1,
  "enabled": true,
  "priority": 1,
  "customPrompt": "تعليمات مخصصة (اختياري)"
}
```

**Response 200:**
```json
{ "success": true, "message": "تم حفظ التخصيص بنجاح" }
```

---

### GET `/api/ai-hub/transcription-editorial/angle-rules`
جلب قواعد خريطة القرار (Angle Decision Rules).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "condition": "شرط القاعدة",
      "action": "الإجراء المطلوب",
      "priority": 1,
      "is_active": true
    }
  ]
}
```

---

### POST `/api/ai-hub/transcription-editorial/angle-rules`
إنشاء قاعدة قرار جديدة.

**Request Body:**
```json
{
  "condition": "شرط القاعدة",
  "action": "الإجراء المطلوب",
  "priority": 1
}
```

**Response 201:**
```json
{ "success": true, "data": { "id": 5 } }
```

---

### GET `/api/ai-hub/transcription-editorial/quality-criteria`
جلب معايير الجودة.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "الدقة", "description": "...", "weight": 0.3 },
    { "id": 2, "name": "الوضوح", "description": "...", "weight": 0.25 }
  ]
}
```

---

## 23. NewsDesk Proxy — الربط مع NewsDesk

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**
> هذه الـ APIs تعمل كـ proxy لنظام NewsDesk الخارجي.

### GET `/api/newsdesk/health`
فحص صحة الاتصال مع NewsDesk.

**Response 200:**
```json
{ "success": true, "data": { "status": "healthy", "responseTime": 150 } }
```

---

### GET `/api/newsdesk/sources`
جلب مصادر NewsDesk.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "slug": "wafa", "name": "وكالة وفا", "url": "...", "is_active": true }
  ]
}
```

---

### GET `/api/newsdesk/sources/:slug`
جلب مصدر بالـ slug.

### POST `/api/newsdesk/sources`
إنشاء مصدر جديد في NewsDesk.

### PATCH `/api/newsdesk/sources/:slug`
تحديث مصدر.

### DELETE `/api/newsdesk/sources/:slug`
حذف مصدر.

### POST `/api/newsdesk/sources/:slug/activate`
تفعيل مصدر.

### POST `/api/newsdesk/sources/:slug/deactivate`
إيقاف مصدر.

---

### GET `/api/newsdesk/articles`
جلب مقالات NewsDesk.

**Query Params:** `limit`, `offset`, `source`, `category`

### GET `/api/newsdesk/articles/:id`
جلب مقال بالـ ID.

### GET `/api/newsdesk/articles/by-source/:slug`
مقالات حسب المصدر.

### GET `/api/newsdesk/articles/by-category/:slug`
مقالات حسب التصنيف.

---

### POST `/api/newsdesk/scraper/fetch`
تشغيل السحب (متزامن).

### POST `/api/newsdesk/scraper/fetch-async`
تشغيل السحب (غير متزامن).

---

### GET `/api/newsdesk/scheduler/status`
حالة جدولة NewsDesk.

### POST `/api/newsdesk/scheduler/start`
بدء جدولة NewsDesk.

### POST `/api/newsdesk/scheduler/stop`
إيقاف جدولة NewsDesk.

---

### GET `/api/newsdesk/categories`
جلب التصنيفات من NewsDesk.

### GET `/api/newsdesk/geographic-scopes`
جلب النطاقات الجغرافية.

---

### GET `/api/newsdesk/admin/stats`
إحصائيات إدارة NewsDesk.

### GET `/api/newsdesk/admin/settings`
إعدادات إدارة NewsDesk.

### PATCH `/api/newsdesk/admin/settings`
تحديث إعدادات NewsDesk.

### GET `/api/newsdesk/admin/logs`
سجلات إدارة NewsDesk.

### POST `/api/newsdesk/admin/classifier/run`
تشغيل المصنف في NewsDesk.

### GET `/api/newsdesk/admin/classifier/stats`
إحصائيات المصنف في NewsDesk.

---

## 24. Auto-Publish — النشر التلقائي

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### GET `/api/auto-publish/status`
حالة النشر التلقائي + إحصائيات.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "lastRun": "2024-01-15T10:00:00.000Z",
    "totalPublished": 500,
    "totalFailed": 10,
    "targets": 3
  }
}
```

---

### POST `/api/auto-publish/toggle`
تفعيل/إيقاف النشر التلقائي (master switch).

**Request Body:**
```json
{ "enabled": false }
```

**Response 200:**
```json
{ "success": true, "message": "تم إيقاف النشر التلقائي" }
```

---

### GET `/api/auto-publish/targets`
جلب جميع أهداف النشر.

**Query Params:**
| Param | Type | الوصف |
|-------|------|-------|
| `media_unit_id` | number | فلترة حسب وحدة الإعلام (اختياري) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "الموقع الرئيسي",
      "url": "https://example.com/api/publish",
      "media_unit_id": 1,
      "is_active": true,
      "auth_type": "bearer",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/auto-publish/targets/:id`
جلب هدف واحد.

### POST `/api/auto-publish/targets`
إنشاء هدف نشر جديد.

**Request Body:**
```json
{
  "name": "اسم الهدف",
  "url": "https://example.com/api/publish",
  "media_unit_id": 1,
  "auth_type": "bearer",
  "auth_token": "token_value"
}
```

### PATCH `/api/auto-publish/targets/:id`
تحديث هدف.

### DELETE `/api/auto-publish/targets/:id`
حذف هدف.

### POST `/api/auto-publish/targets/:id/toggle`
تفعيل/إيقاف هدف معين.

---

### POST `/api/auto-publish/publish-one`
نشر خبر واحد يدوياً (المحرر يكبس زر).

**Request Body:**
```json
{
  "rawDataId": 55,
  "targetId": 1
}
```

**Response 200:**
```json
{ "success": true, "message": "تم النشر بنجاح", "data": { "externalUrl": "https://..." } }
```

---

### POST `/api/auto-publish/run`
تشغيل يدوي — نشر كل الأخبار الأوتوماتيكية المعلقة.

**Response 200:**
```json
{ "success": true, "data": { "published": 10, "failed": 2 } }
```

---

### POST `/api/auto-publish/retry`
إعادة محاولة النشر الفاشل.

**Response 200:**
```json
{ "success": true, "data": { "retried": 5, "succeeded": 3, "failed": 2 } }
```

---

### GET `/api/auto-publish/log`
سجل النشر.

**Query Params:**
| Param | Type | الوصف |
|-------|------|-------|
| `target_id` | number | فلترة حسب الهدف (اختياري) |
| `limit` | number | عدد النتائج (افتراضي: 50) |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "raw_data_id": 55,
      "target_id": 1,
      "status": "success",
      "external_url": "https://...",
      "published_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/auto-publish/external-links/:rawDataId`
جلب روابط النشر الخارجي لخبر معين.

**Params:** `rawDataId` — رقم الخبر في raw_data

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "targetName": "الموقع الرئيسي", "externalUrl": "https://...", "publishedAt": "..." }
  ]
}
```

---

### POST `/api/auto-publish/external-links/batch`
جلب روابط النشر الخارجي لمجموعة أخبار.

**Request Body:**
```json
{
  "rawDataIds": [55, 56, 57]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "55": [{ "targetName": "...", "externalUrl": "..." }],
    "56": [],
    "57": [{ "targetName": "...", "externalUrl": "..." }]
  }
}
```

---

## 25. Bulletins — الموجزات والنشرات

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### POST `/api/bulletins`
إنشاء موجز/نشرة جديدة.

**Request Body:**
```json
{
  "title": "نشرة الأخبار المسائية",
  "content": "محتوى النشرة...",
  "type": "news_bulletin",
  "media_unit_id": 1
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 1, "title": "نشرة الأخبار المسائية", "created_at": "..." }
}
```

---

### GET `/api/bulletins`
جلب جميع الموجزات.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "نشرة الأخبار المسائية",
      "content": "...",
      "type": "news_bulletin",
      "audio_generated": false,
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/bulletins/:id`
جلب موجز بالـ ID.

### PUT `/api/bulletins/:id`
تحديث موجز.

### DELETE `/api/bulletins/:id`
حذف موجز.

### PATCH `/api/bulletins/:id/audio`
تحديث حالة الصوت (بعد توليد الصوت بالـ TTS).

**Request Body:**
```json
{
  "audio_generated": true,
  "audio_url": "https://..."
}
```

---

## 26. Scheduler — جدولة السحب والتصنيف

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### POST `/api/scheduler/start`
بدء الـ scheduler.

**Request Body (اختياري):**
```json
{ "intervalMinutes": 15 }
```

**Response 200:**
```json
{ "success": true, "message": "تم بدء الـ scheduler — كل 15 دقيقة" }
```

---

### POST `/api/scheduler/stop`
إيقاف الـ scheduler.

**Response 200:**
```json
{ "success": true, "message": "تم إيقاف الـ scheduler" }
```

---

### POST `/api/scheduler/restart`
إعادة تشغيل الـ scheduler (لتطبيق التغييرات فوراً).

**Response 200:**
```json
{ "success": true, "message": "تم إعادة تشغيل الـ scheduler" }
```

---

### POST `/api/scheduler/run-now`
تشغيل دورة واحدة فوراً (سحب + تصنيف + فلو).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "fetched": 50,
    "classified": 45,
    "processed": 40,
    "errors": 2
  }
}
```

---

### GET `/api/scheduler/status`
جلب حالة الـ scheduler.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "intervalMinutes": 15,
    "lastRun": "2024-01-15T10:00:00.000Z",
    "nextRun": "2024-01-15T10:15:00.000Z",
    "totalCycles": 100,
    "settings": {
      "scheduler_enabled": true,
      "classifier_enabled": true,
      "flow_enabled": true
    }
  }
}
```

---

## 27. Publishing v2 — نظام النشر المتعدد المنصات

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة في الـ Header**

### POST `/api/publishing/publish`
نشر مقال على منصة معينة.

**Request Body:**
```json
{
  "articleId": 55,
  "platformConfigId": 1,
  "content": "المحتوى المراد نشره (اختياري — يستخدم المحتوى الأصلي إذا لم يُحدد)"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "publishId": "uuid",
    "status": "published",
    "externalUrl": "https://...",
    "platform": "wordpress"
  }
}
```

---

### POST `/api/publishing/set-status`
تغيير حالة مقال في نظام النشر.

**Request Body:**
```json
{
  "articleId": 55,
  "status": "draft"
}
```

---

### POST `/api/publishing/retry`
إعادة محاولة النشر الفاشل.

**Request Body:**
```json
{ "publishId": "uuid" }
```

---

### GET `/api/publishing/dead-letter`
جلب الرسائل الميتة (المحاولات الفاشلة نهائياً).

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "articleId": 55, "platform": "wordpress", "error": "...", "attempts": 3 }
  ]
}
```

---

### POST `/api/publishing/cleanup`
تنظيف المهام القديمة/المعلقة.

---

### GET `/api/publishing/status/:articleId`
حالة نشر مقال على جميع المنصات.

**Params:** `articleId`

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "platform": "wordpress", "status": "published", "externalUrl": "https://..." },
    { "platform": "telegram", "status": "failed", "error": "timeout" }
  ]
}
```

---

### GET `/api/publishing/cooldown/:platformConfigId`
فترة الانتظار قبل النشر التالي على منصة.

**Params:** `platformConfigId`

**Response 200:**
```json
{
  "success": true,
  "data": { "canPublish": true, "remainingSeconds": 0 }
}
```

---

### GET `/api/publishing/logs`
سجلات النشر.

**Query Params:** `limit`, `offset`, `platform`, `status`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "articleId": 55,
      "platform": "wordpress",
      "status": "published",
      "externalUrl": "https://...",
      "publishedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/publishing/logs/:articleId`
سجلات نشر مقال معين.

---

### GET `/api/publishing/platforms`
المنصات المتاحة للنشر.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "slug": "wordpress", "name": "WordPress", "description": "..." },
    { "slug": "telegram", "name": "Telegram", "description": "..." }
  ]
}
```

---

### GET `/api/publishing/constraints`
قيود المنصات (حدود الأحرف، الصور، إلخ).

---

### GET `/api/publishing/configs`
جلب جميع إعدادات المنصات.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "platform": "wordpress",
      "name": "الموقع الرئيسي",
      "base_url": "https://example.com",
      "is_active": true,
      "cooldown_seconds": 60
    }
  ]
}
```

---

### GET `/api/publishing/configs/:id`
جلب إعداد منصة واحد.

### POST `/api/publishing/configs`
إنشاء إعداد منصة جديد.

**Request Body:**
```json
{
  "platform": "wordpress",
  "name": "الموقع الرئيسي",
  "base_url": "https://example.com",
  "auth_type": "bearer",
  "auth_token": "token_value",
  "cooldown_seconds": 60
}
```

### PATCH `/api/publishing/configs/:id`
تحديث إعداد منصة.

### DELETE `/api/publishing/configs/:id`
حذف إعداد منصة.

### POST `/api/publishing/configs/:id/toggle`
تفعيل/إيقاف إعداد منصة.

### POST `/api/publishing/configs/:id/validate`
فحص صحة إعداد منصة (اختبار الاتصال).

**Response 200:**
```json
{ "success": true, "data": { "valid": true, "message": "الاتصال ناجح" } }
```

---

### GET `/api/publishing/archive`
جلب المقالات المؤرشفة.

### POST `/api/publishing/archive/:articleId`
أرشفة مقال.

---

### GET `/api/publishing/stats`
إحصائيات نظام النشر.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalPublished": 500,
    "totalFailed": 20,
    "totalPending": 5,
    "byPlatform": {
      "wordpress": { "published": 300, "failed": 10 },
      "telegram": { "published": 200, "failed": 10 }
    }
  }
}
```

---

## 28. Management Integration — تكامل نظام الإدارة

> **🔒 جميع endpoints هذا القسم تتطلب توكن مصادقة + صلاحيات محددة**

### GET `/api/management/news/stats/user/:userId`
جلب إحصائيات أداء موظف في نظام الأخبار.

**Params:** `userId` — رقم المستخدم

**يتطلب صلاحية:** `view_employee_stats`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "userId": 5,
    "totalApproved": 50,
    "totalRejected": 10,
    "totalEdited": 45,
    "averageProcessingTime": 120,
    "byCategory": { "محلي": 20, "دولي": 15, "رياضة": 15 }
  }
}
```

---

### GET `/api/management/news/stats/overview`
جلب إحصائيات عامة لنظام الأخبار (للإدارة).

**يتطلب صلاحية:** `view_news_stats`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalArticles": 5000,
    "totalPublished": 3000,
    "totalPending": 200,
    "totalRejected": 500,
    "activeEditors": 10,
    "averageApprovalTime": 180
  }
}
```

---

### GET `/api/management/news/tasks/:taskId/items`
جلب جميع المنشورات المرتبطة بمهمة معينة.

**Params:** `taskId` — رقم المهمة

**يتطلب صلاحية:** `view_task_details`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "عنوان الخبر",
      "status": "published",
      "published_at": "2024-01-15T10:00:00.000Z",
      "editor_name": "أحمد"
    }
  ]
}
```

---

## ملخص إجمالي

| القسم | عدد الـ Endpoints |
|--------|-------------------|
| Authentication | 2 |
| Sources & News | 11 |
| Data | 13 |
| Flow | 11 |
| Editorial Policies | 9 |
| System Settings | 4 |
| AI Hub Chat & Ideas | 4 |
| STT | 6 |
| TTS | 2 |
| Audio Extraction | 6 |
| Video to Text | 2 |
| Programs & Episodes | 5 |
| Guests | 2 |
| Uploaded Files | 5 |
| Smart Transcription | 6 |
| Streaming Extraction | 8 |
| AI Analytics | 6 |
| Transcription Editorial | 15 |
| NewsDesk Proxy | 25 |
| Auto-Publish | 14 |
| Bulletins | 6 |
| Scheduler | 5 |
| Publishing v2 | 21 |
| Management Integration | 3 |
| **المجموع** | **~191** |
