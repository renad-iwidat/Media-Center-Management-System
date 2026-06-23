# 📋 API Reference - Media Center Management System

> **Base URL:** `http://localhost:7845/api`  
> **Production URL:** `https://automation-and-ai-hub-backend.onrender.com/api`  
> **Authentication:** Bearer Token (من نظام الإدارة)  
> **Content-Type:** `application/json`

---

## 🔐 المصادقة (Authentication)

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/auth/login-info` | معلومات تسجيل الدخول | ❌ |
| GET | `/api/auth/me` | بيانات المستخدم الحالي | ✅ |

> ⚠️ تسجيل الدخول يتم من نظام الإدارة فقط:  
> `POST https://mcms-backend-iw71.onrender.com/api/auth/login`

---

## 🔗 المصادر (Sources) — `/api/sources`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/sources` | جميع المصادر | ✅ |
| GET | `/api/sources/active` | المصادر النشطة | ✅ |
| GET | `/api/sources/fetch-info/all` | معلومات المصادر مع آخر وقت سحب | ✅ |
| GET | `/api/sources/:id` | مصدر بالـ ID | ✅ |
| POST | `/api/sources` | إنشاء مصدر جديد | ✅ |
| PUT | `/api/sources/:id` | تحديث مصدر | ✅ |

---

## 📺 البرامج (Programs) — `/api/programs`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/programs` | جميع البرامج | ✅ |
| GET | `/api/programs/:id` | برنامج بالـ ID | ✅ |
| GET | `/api/programs/:id/episodes` | حلقات برنامج معين | ✅ |
| GET | `/api/programs/episodes/:id/details` | حلقة بالـ ID مع ضيوفها | ✅ |
| GET | `/api/programs/episodes/:id/guests` | ضيوف حلقة معينة | ✅ |

---

## 👥 الضيوف (Guests) — `/api/guests`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/guests` | جميع الضيوف (يدعم `?search=`) | ✅ |
| GET | `/api/guests/:id` | ضيف بالـ ID | ✅ |

---

## 📰 الأخبار (News) — `/api/news`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/news` | جميع الأخبار | ✅ |
| GET | `/api/news/:id` | خبر بالـ ID | ✅ |
| GET | `/api/news/source/:sourceId` | أخبار مصدر معين | ✅ |
| POST | `/api/news` | إضافة خبر جديد | ✅ |
| GET | `/api/news/classifier/unclassified` | الأخبار بدون تصنيف | ✅ |
| POST | `/api/news/classifier/process` | تصنيف الأخبار بدون تصنيف | ✅ |

---

## 📝 السياسات التحريرية (Editorial Policies) — `/api/news/editorial-policies`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/news/editorial-policies` | جميع السياسات المفعّلة | ✅ |
| POST | `/api/news/editorial-policies` | إنشاء سياسة جديدة | ✅ |
| POST | `/api/news/editorial-policies/apply` | تطبيق سياسة واحدة على نص | ✅ |
| POST | `/api/news/editorial-policies/pipeline` | تطبيق سلسلة سياسات | ✅ |
| POST | `/api/news/editorial-policies/sequential` | تطبيق سياسات متسلسلة | ✅ |
| POST | `/api/news/editorial-policies/save-edited` | حفظ النص المعدّل يدوياً | ✅ |
| GET | `/api/news/editorial-policies/:policyName` | تفاصيل سياسة واحدة | ✅ |
| PUT | `/api/news/editorial-policies/:policyName` | تحديث سياسة | ✅ |
| DELETE | `/api/news/editorial-policies/:policyName` | حذف سياسة | ✅ |

---

## 📊 البيانات (Data) — `/api/data`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/data/media-units` | الوحدات الإعلامية | ✅ |
| GET | `/api/data/sources` | جميع المصادر | ✅ |
| GET | `/api/data/sources/active` | المصادر النشطة | ✅ |
| GET | `/api/data/articles` | جميع الأخبار (`?limit=100&offset=0`) | ✅ |
| GET | `/api/data/articles/incomplete` | الأخبار ناقصة المحتوى | ✅ |
| GET | `/api/data/articles/:id/detail` | تفاصيل خبر بالـ ID | ✅ |
| GET | `/api/data/articles/source/:sourceId` | أخبار مصدر معين | ✅ |
| GET | `/api/data/articles/category/:categoryId` | أخبار تصنيف معين | ✅ |
| GET | `/api/data/articles/geo-scope/:slug` | أخبار نطاق جغرافي | ✅ |
| GET | `/api/data/categories` | جميع التصنيفات | ✅ |
| GET | `/api/data/geo-scopes` | النطاقات الجغرافية | ✅ |
| GET | `/api/data/comprehensive` | بيانات شاملة | ✅ |
| GET | `/api/data/statistics` | إحصائيات النظام | ✅ |
| PUT | `/api/data/articles/:id/content` | تحديث محتوى خبر | ✅ |
| PATCH | `/api/data/articles/:id/category` | تحديث تصنيف خبر | ✅ |
| DELETE | `/api/data/articles/:id` | حذف خبر | ✅ |
| DELETE | `/api/data/articles/incomplete` | حذف جميع الأخبار الناقصة | ✅ |
| DELETE | `/api/data/articles` | حذف جميع الأخبار | ✅ |

---

## 🔄 فلو معالجة الأخبار (Flow) — `/api/flow`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| POST | `/api/flow/process` | معالجة الأخبار الجديدة | ✅ |
| GET | `/api/flow/editorial` | ستوديو التحرير (يدعم `?task_id=`) | ✅ |
| GET | `/api/flow/queue/pending` | طابور التحرير المعلّق | ✅ |
| GET | `/api/flow/queue/stats` | إحصائيات الطابور | ✅ |
| GET | `/api/flow/queue/:id` | عنصر من الطابور بالـ ID | ✅ |
| POST | `/api/flow/queue/:id/approve` | الموافقة على عنصر | ✅ |
| POST | `/api/flow/queue/:id/reject` | رفض عنصر | ✅ |
| GET | `/api/flow/published` | المحتوى المنشور | ✅ |
| GET | `/api/flow/published/stats` | إحصائيات المنشور | ✅ |
| GET | `/api/flow/published/:id` | عنصر منشور بالـ ID | ✅ |
| GET | `/api/flow/published/category/:category` | منشورات حسب التصنيف | ✅ |
| GET | `/api/flow/daily-stats` | إحصائيات يومية | ✅ |

---

## ⚙️ إعدادات النظام (System Settings) — `/api/settings`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/settings` | جميع الإعدادات | ✅ |
| GET | `/api/settings/toggles` | حالة الـ toggles | ✅ |
| PATCH | `/api/settings/toggles/bulk` | تحديث عدة toggles دفعة واحدة | ✅ |
| PATCH | `/api/settings/:key` | تحديث إعداد واحد | ✅ |

---

## ⏰ الجدولة (Scheduler) — `/api/scheduler`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| POST | `/api/scheduler/start` | بدء الـ scheduler | ✅ |
| POST | `/api/scheduler/stop` | إيقاف الـ scheduler | ✅ |
| POST | `/api/scheduler/restart` | إعادة تشغيل الـ scheduler | ✅ |
| POST | `/api/scheduler/run-now` | تشغيل دورة واحدة فوراً | ✅ |
| GET | `/api/scheduler/status` | حالة الـ scheduler | ✅ |

---

## 📁 الملفات المرفوعة (Uploaded Files) — `/api/uploaded-files`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/uploaded-files` | جميع الملفات | ✅ |
| GET | `/api/uploaded-files/audio` | ملفات صوتية فقط | ✅ |
| GET | `/api/uploaded-files/video` | ملفات فيديو فقط | ✅ |
| GET | `/api/uploaded-files/source-type/:sourceTypeId` | ملفات حسب نوع المصدر | ✅ |
| GET | `/api/uploaded-files/:id` | ملف بالـ ID | ✅ |

---

## 🌐 NewsDesk Proxy — `/api/newsdesk`

> **External API:** `https://newsdesk-api.liminal.ps:9999`  
> **Docs:** https://newsdesk-api.liminal.ps:9999/docs  
> ⚠️ **ملاحظة مهمة:** عند سحب الأخبار بالتفاصيل الكاملة، استخدم `/articles/raw` بدلاً من `/articles` — لأنه يعطيك كل التفاصيل (النص الكامل، التصنيفات، النطاق الجغرافي، إلخ)

### Health
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/newsdesk/health` | فحص صحة الاتصال | ✅ |

### Sources CRUD
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/newsdesk/sources` | قائمة المصادر | ✅ |
| GET | `/api/newsdesk/sources/:slug` | مصدر بالـ slug | ✅ |
| POST | `/api/newsdesk/sources` | إنشاء مصدر | ✅ |
| PATCH | `/api/newsdesk/sources/:slug` | تحديث مصدر | ✅ |
| DELETE | `/api/newsdesk/sources/:slug` | حذف مصدر | ✅ |
| POST | `/api/newsdesk/sources/:slug/activate` | تفعيل مصدر | ✅ |
| POST | `/api/newsdesk/sources/:slug/deactivate` | تعطيل مصدر | ✅ |

### Articles (Processed)
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/newsdesk/articles` | قائمة الأخبار المعالجة | ✅ |
| GET | `/api/newsdesk/articles/:id` | خبر بالـ ID | ✅ |
| GET | `/api/newsdesk/articles/by-source/:slug` | أخبار حسب المصدر | ✅ |
| GET | `/api/newsdesk/articles/by-category/:slug` | أخبار حسب التصنيف | ✅ |
| GET | `/api/newsdesk/articles/by-media-unit/:slug` | أخبار حسب الوحدة الإعلامية | ✅ |

### Articles Raw (البيانات الخام الكاملة) ⭐
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/newsdesk/articles/raw` | قائمة الأخبار الخام بكل التفاصيل | ✅ |
| GET | `/api/newsdesk/articles/raw/:article_id` | خبر خام بالـ ID مع كل التفاصيل | ✅ |

> 💡 **`/articles/raw`** يرجع البيانات الكاملة بما فيها: النص الكامل، التصنيفات المتعددة، النطاق الجغرافي، الوحدات الإعلامية، معلومات المصدر، وتفاصيل التصنيف بالـ AI.

### Media Units
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/newsdesk/media-units` | قائمة الوحدات الإعلامية | ✅ |
| POST | `/api/newsdesk/media-units` | إنشاء وحدة إعلامية | ✅ |
| GET | `/api/newsdesk/media-units/:slug` | وحدة إعلامية بالـ slug | ✅ |
| PATCH | `/api/newsdesk/media-units/:slug` | تحديث وحدة إعلامية | ✅ |
| DELETE | `/api/newsdesk/media-units/:slug` | حذف وحدة إعلامية | ✅ |
| POST | `/api/newsdesk/media-units/:slug/sources` | ربط مصدر بوحدة إعلامية | ✅ |
| DELETE | `/api/newsdesk/media-units/:slug/sources/:source_id` | فك ربط مصدر من وحدة | ✅ |

### Scraper Control
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| POST | `/api/newsdesk/scraper/fetch` | تشغيل السحب (متزامن) | ✅ |
| POST | `/api/newsdesk/scraper/fetch-async` | تشغيل السحب (غير متزامن) | ✅ |
| POST | `/api/newsdesk/scraper/trigger` | تشغيل Actor Run | ✅ |

### Remote Scheduler
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/newsdesk/scheduler/status` | حالة الـ scheduler البعيد | ✅ |
| POST | `/api/newsdesk/scheduler/start` | بدء الـ scheduler البعيد | ✅ |
| POST | `/api/newsdesk/scheduler/stop` | إيقاف الـ scheduler البعيد | ✅ |

### Categories & Geo Scopes
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/newsdesk/categories` | التصنيفات | ✅ |
| GET | `/api/newsdesk/geographic-scopes` | النطاقات الجغرافية | ✅ |

### Classifier
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| POST | `/api/newsdesk/classifier/run` | تشغيل المصنّف | ✅ |
| GET | `/api/newsdesk/classifier/stats` | إحصائيات المصنّف | ✅ |

### Admin
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/newsdesk/admin/stats` | إحصائيات الإدارة | ✅ |
| GET | `/api/newsdesk/admin/settings` | إعدادات الإدارة | ✅ |
| PATCH | `/api/newsdesk/admin/settings` | تحديث إعدادات الإدارة | ✅ |
| GET | `/api/newsdesk/admin/settings-logs` | سجل تغييرات الإعدادات | ✅ |
| GET | `/api/newsdesk/admin/logs` | سجلات Apify | ✅ |
| GET | `/api/newsdesk/admin/logs/:log_id` | سجل Apify بالـ ID | ✅ |
| POST | `/api/newsdesk/admin/logs/cleanup` | تنظيف السجلات القديمة | ✅ |
| POST | `/api/newsdesk/admin/sources/:slug/toggle` | تبديل حالة مصدر | ✅ |
| GET | `/api/newsdesk/admin/sources` | قائمة المصادر (admin) | ✅ |
| GET | `/api/newsdesk/admin/sources/:slug` | مصدر بالـ slug (admin) | ✅ |
| PATCH | `/api/newsdesk/admin/sources/:slug` | تحديث مصدر (admin) | ✅ |
| POST | `/api/newsdesk/admin/scheduler/pause` | إيقاف مؤقت للـ scheduler | ✅ |
| POST | `/api/newsdesk/admin/scheduler/resume` | استئناف الـ scheduler | ✅ |
| GET | `/api/newsdesk/admin/scheduler/status` | حالة الـ scheduler (admin) | ✅ |
| POST | `/api/newsdesk/admin/classifier/run` | تشغيل المصنّف (admin) | ✅ |
| GET | `/api/newsdesk/admin/classifier/stats` | إحصائيات المصنّف (admin) | ✅ |

---

## 🤖 AI Hub — الدردشة (Chat) — `/api/ai-hub/chat`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| POST | `/api/ai-hub/chat/generate` | توليد رد من المساعد الذكي | ✅ |
| POST | `/api/ai-hub/chat/summarize` | تلخيص نص | ✅ |
| POST | `/api/ai-hub/chat/rewrite` | إعادة صياغة نص | ✅ |

### Body — `/generate`
```json
{
  "prompt": "string (required)",
  "think": "boolean (optional)",
  "max_tokens": "number (optional)",
  "temperature": "number (optional)"
}
```

### Body — `/summarize`
```json
{
  "text": "string (required)",
  "style": "bullet_points | short_paragraph | headlines"
}
```

### Body — `/rewrite`
```json
{
  "text": "string (required)",
  "style": "radio_broadcast | investigative | social_media | formal | casual"
}
```

---

## 🔊 AI Hub — تحويل النص إلى صوت (TTS) — `/api/ai-hub/tts`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| POST | `/api/ai-hub/tts/generate` | تحويل النص إلى صوت | ✅ |
| GET | `/api/ai-hub/tts/voices` | قائمة الأصوات المتاحة | ✅ |

### Body — `/generate`
```json
{
  "text": "string (required)",
  "voice": "alloy | echo | fable | onyx | nova | shimmer (default: nova)"
}
```

---

## 🎤 AI Hub — تحويل الصوت إلى نص (STT) — `/api/ai-hub/stt`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| POST | `/api/ai-hub/stt/transcribe-url` | تفريغ صوتي من رابط | ✅ |
| POST | `/api/ai-hub/stt/transcribe-file` | تفريغ صوتي من ملف S3 | ✅ |
| POST | `/api/ai-hub/stt/transcribe-upload` | تفريغ صوتي من ملف مرفوع (multipart) | ✅ |
| POST | `/api/ai-hub/stt/transcribe-base64` | تفريغ صوتي من بيانات base64 | ✅ |
| POST | `/api/ai-hub/stt/transcribe-with-timestamps` | تفريغ صوتي مع timestamps | ✅ |
| GET | `/api/ai-hub/stt/languages` | اللغات المدعومة | ✅ |

### Body — `/transcribe-url`
```json
{
  "audioUrl": "string (required)",
  "language": "string (optional, default: 'ar')"
}
```

### Body — `/transcribe-file`
```json
{
  "fileId": "number (optional)",
  "s3Url": "string (required)",
  "language": "string (optional, default: 'ar')"
}
```

### Body — `/transcribe-upload`
- **Content-Type:** `multipart/form-data`
- **Fields:** `file` (audio file), `language` (optional)

### Body — `/transcribe-base64`
```json
{
  "audioBase64": "string (required)",
  "language": "string (optional, default: 'ar')"
}
```

### Body — `/transcribe-with-timestamps`
```json
{
  "audioUrl": "string (required)",
  "language": "string (optional, default: 'ar')",
  "format": "json | srt (optional, default: 'json')"
}
```

---

## 🎬 AI Hub — استخراج الصوت (Audio Extraction) — `/api/ai-hub/audio-extraction`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| POST | `/api/ai-hub/audio-extraction/extract-from-file` | استخراج صوت من ملف محلي | ✅ |
| POST | `/api/ai-hub/audio-extraction/extract-from-url` | استخراج صوت من رابط | ✅ |
| POST | `/api/ai-hub/audio-extraction/extract-from-s3` | استخراج صوت من S3 (بدون تفريغ) | ✅ |
| POST | `/api/ai-hub/audio-extraction/extract-and-transcribe` | استخراج صوت + تفريغ | ✅ |
| POST | `/api/ai-hub/audio-extraction/video-info` | معلومات الفيديو | ✅ |
| GET | `/api/ai-hub/audio-extraction/formats` | الصيغ المدعومة | ✅ |

### Body — `/extract-from-url`
```json
{
  "videoUrl": "string (required)",
  "outputFormat": "mp3 | wav | aac (default: mp3)",
  "bitrate": "string (default: '128k')"
}
```

### Body — `/extract-and-transcribe`
```json
{
  "fileId": "number (optional)",
  "s3Url": "string (required)",
  "outputFormat": "mp3 | wav | aac (default: mp3)",
  "bitrate": "string (default: '128k')",
  "language": "string (default: 'ar')",
  "enableChunking": "boolean (default: true)",
  "chunkDurationSeconds": "number (default: 180)",
  "maxConcurrentChunks": "number (default: 3)"
}
```

---

## 🌊 AI Hub — الاستخراج المتدفق (Streaming Extraction) — `/api/ai-hub/streaming-extraction`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| POST | `/api/ai-hub/streaming-extraction/start` | بدء مهمة استخراج (async) | ❌* |
| GET | `/api/ai-hub/streaming-extraction/status/:jobId` | حالة المهمة | ❌* |
| POST | `/api/ai-hub/streaming-extraction/stream` | تدفق الصوت مباشرة (sync) | ❌* |
| POST | `/api/ai-hub/streaming-extraction/extract-and-transcribe` | استخراج + تفريغ | ❌* |
| POST | `/api/ai-hub/streaming-extraction/download-first` | استخراج بطريقة التحميل أولاً | ❌* |
| POST | `/api/ai-hub/streaming-extraction/video-info` | معلومات الفيديو | ❌* |
| POST | `/api/ai-hub/streaming-extraction/diagnose` | تشخيص رابط S3 | ❌* |
| GET | `/api/ai-hub/streaming-extraction/stats` | إحصائيات النظام | ❌* |

> *❌ المصادقة معطّلة مؤقتاً للاختبار — Rate limiting مفعّل بدلاً منها

### Body — `/start`
```json
{
  "videoUrl": "string (required)",
  "outputFormat": "mp3 | wav | aac (default: mp3)",
  "bitrate": "string (default: '128k')",
  "timeout": "number (default: 300000)",
  "maxSize": "number (default: 100MB)"
}
```

### Body — `/extract-and-transcribe`
```json
{
  "videoUrl": "string (required)",
  "language": "string (default: 'ar')",
  "outputFormat": "mp3 | wav | aac (default: mp3)",
  "bitrate": "string (default: '128k')",
  "enableChunking": "boolean (default: true)",
  "chunkDurationSeconds": "number (default: 180)",
  "maxConcurrentChunks": "number (default: 3)"
}
```

### Body — `/download-first`
```json
{
  "videoUrl": "string (required)",
  "language": "string (default: 'ar')",
  "outputFormat": "mp3 | wav | aac (default: mp3)",
  "bitrate": "string (default: '128k')",
  "enableChunking": "boolean (default: true)",
  "chunkDurationSeconds": "number (default: 180)",
  "maxConcurrentChunks": "number (default: 3)",
  "maxFileSize": "number (default: 1GB)"
}
```

---

## 🎥 AI Hub — تحويل الفيديو إلى نص (Video to Text) — `/api/ai-hub/video-to-text`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| POST | `/api/ai-hub/video-to-text/process` | استخراج صوت من فيديو + تفريغ | ✅ |
| POST | `/api/ai-hub/video-to-text/process-s3` | استخراج صوت من فيديو S3 + تفريغ | ✅ |

### Body — `/process`
```json
{
  "videoUrl": "string (required)",
  "language": "string (default: 'ar')",
  "outputFormat": "string (default: 'mp3')",
  "bitrate": "string (default: '128k')"
}
```

### Body — `/process-s3`
```json
{
  "fileId": "number (optional)",
  "s3Url": "string (required)",
  "language": "string (default: 'ar')",
  "outputFormat": "string (default: 'mp3')",
  "bitrate": "string (default: '128k')"
}
```

---

## 💡 AI Hub — توليد الأفكار (Ideas) — `/api/ai-hub/ideas`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| POST | `/api/ai-hub/ideas/generate` | توليد أفكار / أسئلة / عناوين | ✅ |

---

## 📈 AI Hub — الإحصائيات (Analytics) — `/api/ai-hub/analytics`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/api/ai-hub/analytics/overview` | إحصائيات عامة (`?startDate&endDate`) | ✅ |
| GET | `/api/ai-hub/analytics/daily` | إحصائيات يومية (`?startDate&endDate&feature`) | ✅ |
| GET | `/api/ai-hub/analytics/users` | إحصائيات المستخدمين (`?userIdentifier&feature`) | ✅ |
| GET | `/api/ai-hub/analytics/top-users` | أكثر المستخدمين نشاطاً (`?limit=10`) | ✅ |
| GET | `/api/ai-hub/analytics/my-usage` | استخدام المستخدم الحالي (`?feature`) | ✅ |
| GET | `/api/ai-hub/analytics/feature/:feature` | إحصائيات ميزة معينة | ✅ |

---

## 📝 AI Hub — التفريغ الذكي (Smart Transcription) — `/api/ai-hub/smart-transcription`

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| POST | `/api/ai-hub/smart-transcription/process` | تفريغ + توليد مخرجات تحريرية | ❌ |
| POST | `/api/ai-hub/smart-transcription/generate-outputs` | توليد مخرجات من نص موجود | ❌ |
| POST | `/api/ai-hub/smart-transcription/export` | تصدير ملف موحّد | ❌ |
| POST | `/api/ai-hub/smart-transcription/correct` | تصحيح لغوي للنص | ❌ |
| POST | `/api/ai-hub/smart-transcription/correct-batch` | تصحيح لغوي دفعي | ❌ |

### Body — `/process`
```json
{
  "fileUrl": "string (required)",
  "fileType": "audio | video (default: 'audio')",
  "language": "string (default: 'ar')",
  "outputs": [
    {
      "type": "executive_summary | news_article | detailed_report | social_media | video_clips | policy_alerts",
      "enabled": true,
      "count": "number (optional, for social_media/video_clips)"
    }
  ],
  "editorialPolicy": "string (optional)",
  "customInfo": "string (optional)"
}
```

### Body — `/generate-outputs`
```json
{
  "transcript": "string (required)",
  "outputs": [
    {
      "type": "executive_summary | news_article | detailed_report | social_media | video_clips | policy_alerts",
      "enabled": true,
      "count": "number (optional)"
    }
  ],
  "editorialPolicy": "string (optional)",
  "customInfo": "string (optional)"
}
```

### Body — `/correct`
```json
{
  "transcript": "string (required)",
  "language": "string (default: 'ar')",
  "preserveMeaning": "boolean (default: true)",
  "fixPunctuation": "boolean (default: true)",
  "fixGrammar": "boolean (default: true)",
  "fixSpelling": "boolean (default: true)",
  "improveClarity": "boolean (default: true)"
}
```

### Body — `/correct-batch`
```json
{
  "transcripts": ["string", "string", "..."],
  "language": "string (default: 'ar')",
  "preserveMeaning": "boolean (default: true)",
  "fixPunctuation": "boolean (default: true)",
  "fixGrammar": "boolean (default: true)",
  "fixSpelling": "boolean (default: true)",
  "improveClarity": "boolean (default: true)"
}
```

---

## 🏥 Standalone Endpoints (بدون prefix)

| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/health` | فحص صحة السيرفر | ❌ |
| GET | `/api` | معلومات الـ API | ❌ |
| GET | `/api-docs` | توثيق HTML | ❌ |
| GET | `/db-test` | اختبار اتصال قاعدة البيانات | ❌ |

---

## 📊 ملخص إحصائي

| القسم | عدد الـ Endpoints |
|-------|-------------------|
| Authentication | 2 |
| Sources | 6 |
| Programs | 5 |
| Guests | 2 |
| News | 6 |
| Editorial Policies | 9 |
| Data | 17 |
| Flow | 12 |
| System Settings | 4 |
| Scheduler | 5 |
| Uploaded Files | 5 |
| NewsDesk Proxy - Health | 1 |
| NewsDesk Proxy - Sources | 7 |
| NewsDesk Proxy - Articles | 5 |
| NewsDesk Proxy - Articles Raw ⭐ | 2 |
| NewsDesk Proxy - Media Units | 7 |
| NewsDesk Proxy - Scraper | 3 |
| NewsDesk Proxy - Scheduler | 3 |
| NewsDesk Proxy - Categories & Geo | 2 |
| NewsDesk Proxy - Classifier | 2 |
| NewsDesk Proxy - Admin | 16 |
| AI Hub - Chat | 3 |
| AI Hub - TTS | 2 |
| AI Hub - STT | 6 |
| AI Hub - Audio Extraction | 6 |
| AI Hub - Streaming Extraction | 8 |
| AI Hub - Video to Text | 2 |
| AI Hub - Ideas | 1 |
| AI Hub - Analytics | 6 |
| AI Hub - Smart Transcription | 5 |
| Standalone | 4 |
| **المجموع** | **~165** |

---

## 🔑 ملاحظات عامة

1. **المصادقة:** جميع الـ endpoints تتطلب Bearer Token ما عدا:
   - `/health`, `/api`, `/api-docs`, `/db-test`
   - `/api/auth/login-info`
   - `/api/ai-hub/streaming-extraction/*` (معطّلة مؤقتاً)
   - `/api/ai-hub/smart-transcription/*`

2. **التوكن:** يُرسل في الـ Header:
   ```
   Authorization: Bearer <token>
   ```

3. **Rate Limiting:** مفعّل على streaming-extraction:
   - `/start`, `/extract-and-transcribe`, `/download-first`: 10 طلبات / 15 دقيقة
   - `/stream`: 3 طلبات / 5 دقائق

4. **حجم الـ Payload:** الحد الأقصى 100MB (لدعم base64 audio/video)

5. **الـ Scheduler:** يبدأ تلقائياً عند تشغيل السيرفر (كل 15 دقيقة)
