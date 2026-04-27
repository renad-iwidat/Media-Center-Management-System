# Backend Features — ميزات الباك اند

**المشروع:** Media Center Management System  
**آخر تحديث:** April 27, 2026

---

## 📰 1. News Management — إدارة الأخبار

### RSS Feed Integration
- سحب تلقائي من مصادر RSS
- دعم مصادر متعددة
- جدولة تلقائية للسحب
- تتبع آخر تحديث لكل مصدر

### AI Classification
- تصنيف تلقائي للأخبار بالذكاء الاصطناعي
- دعم 11 فئة (محلي، دولي، اقتصاد، رياضة، صحة، إلخ)
- معالجة دفعات كبيرة
- تقارير نجاح/فشل التصنيف

### Content Flow
- مسار أوتوماتيكي (نشر مباشر)
- مسار تحريري (مراجعة يدوية)
- كشف المحتوى الناقص تلقائياً
- طابور انتظار للمحررين

---

## 🤖 2. AI Hub — المساعد الذكي

### Chat Assistant
- محادثة ذكية مع AI
- دعم التفكير العميق (thinking mode)
- تحكم في الـ tokens والـ temperature

### Text Tools
- تلخيص نصوص (3 أنماط)
- إعادة صياغة (5 أنماط)
- توليد أفكار وأسئلة
- توليد عناوين

---

## 🎙️ 3. Speech-to-Text — تفريغ صوتي

### Multiple Input Methods
- من رابط URL
- من ملف S3
- رفع ملف مباشر
- من بيانات Base64

### Features
- دعم لغات متعددة
- صيغ صوتية متنوعة (mp3, wav, m4a, ogg, flac, webm)
- حد أقصى 50MB للملف
- تفريغ دقيق بالـ AI

---

## 🔊 4. Text-to-Speech — تحويل نص لصوت

### Voice Options
- 6 أصوات مختلفة (alloy, echo, fable, onyx, nova, shimmer)
- جودة عالية
- صيغة MP3

### Rate Limiting
- تتبع الاستخدام
- حماية من الإفراط

---

## 🎬 5. Audio/Video Processing

### Audio Extraction
- استخراج صوت من فيديو
- دعم ملفات محلية، روابط، S3
- تحكم في الصيغة والجودة
- معلومات تفصيلية عن الفيديو

### Video to Text
- تحويل فيديو لنص مباشرة
- معالجة من URL أو S3
- دمج استخراج الصوت + التفريغ

---

## 📝 6. Editorial Policies — السياسات التحريرية

### Policy Management
- إنشاء وتعديل وحذف سياسات
- سياسات تعديل (modifying)
- سياسات فحص (inspection)
- ربط بوحدات الإعلام

### Policy Application
- تطبيق سياسة واحدة
- تطبيق متسلسل (sequential)
- تتبع التغييرات
- حفظ النصوص المعدلة

### AI Integration
- معالجة نصوص بالـ AI
- استبدال كلمات
- إعادة صياغة
- فحص التوازن والموضوعية

---

## 📊 7. Data & Statistics — البيانات والإحصائيات

### Comprehensive Data
- جلب بيانات شاملة دفعة واحدة
- Pagination للأخبار
- فلترة متقدمة

### Statistics
- إحصائيات عامة للنظام
- إحصائيات يومية
- تقارير حسب الفئة
- تقارير حسب المصدر
- تقارير حسب وحدة الإعلام

---

## 🎯 8. Editorial Queue — طابور التحرير

### Queue Management
- عرض الأخبار المعلقة
- فلترة حسب وحدة الإعلام
- إحصائيات الطابور

### Editor Actions
- موافقة على الأخبار
- رفض الأخبار
- إضافة ملاحظات
- تطبيق سياسات تحريرية

---

## 📺 9. Programs & Episodes — البرامج والحلقات

### Program Management
- إدارة البرامج
- إدارة الحلقات
- ربط الحلقات بالبرامج

### Guest Management
- قاعدة بيانات الضيوف
- ربط الضيوف بالحلقات
- بحث في الضيوف

---

## 📁 10. File Management — إدارة الملفات

### Uploaded Files
- تتبع الملفات المرفوعة
- فلترة حسب النوع (صوت/فيديو)
- فلترة حسب نوع المصدر
- روابط S3

---

## ⚙️ 11. System Settings — إعدادات النظام

### Toggles
- تشغيل/إيقاف السحب التلقائي
- تشغيل/إيقاف التصنيف الآلي
- تشغيل/إيقاف الفلو

### Configuration
- الفاصل الزمني للسحب
- عدد الأخبار لكل مصدر
- تحديث دفعة واحدة

---

## 🔄 12. Scheduler — الجدولة التلقائية

### Automated Tasks
- سحب أخبار من RSS
- تصنيف تلقائي
- توجيه للمسار المناسب
- تشغيل دوري قابل للتخصيص

### Smart Processing
- تخطي الأخبار الناقصة
- معالجة متوازية
- تجنب التعارضات

---

## 🛡️ 13. Error Handling & Validation

### Robust Error Handling
- رسائل خطأ واضحة
- تتبع الأخطاء
- Logging شامل

### Data Validation
- التحقق من المدخلات
- حماية من SQL Injection
- تنظيف البيانات

---

## 🔌 14. API Features

### RESTful API
- 78 endpoint
- JSON responses
- CORS support
- Consistent structure

### Documentation
- توثيق شامل
- أمثلة Request/Response
- رموز الأخطاء

---

## 💾 15. Database

### PostgreSQL
- علاقات معقدة
- Indexes محسّنة
- Transactions
- Foreign Keys

### Tables
- raw_data (الأخبار الخام)
- editorial_queue (طابور التحرير)
- published_items (المنشور)
- editorial_policies (السياسات)
- system_settings (الإعدادات)
- programs, episodes, guests
- uploaded_files

---

## 🚀 16. Performance

### Optimization
- Pagination
- Parallel processing
- Caching strategies
- Rate limiting

---

## 📦 17. Integration

### External Services
- OpenAI API (GPT, Whisper, TTS)
- Google Gemini
- AWS S3
- RSS Feeds

---

## 🔐 18. Security

### Best Practices
- Environment variables
- Input validation
- SQL parameterization
- Error sanitization
