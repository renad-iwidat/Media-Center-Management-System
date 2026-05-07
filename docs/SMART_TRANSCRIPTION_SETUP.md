# إعداد نظام التفريغ الذكي

## المتطلبات

### Backend
- Node.js 18+
- Express.js
- OpenAI API Key
- FFmpeg (لاستخراج الصوت من الفيديو)

### Frontend
- React 18+
- TypeScript
- Tailwind CSS

## خطوات الإعداد

### 1. تثبيت المكتبات المطلوبة

```bash
# في المشروع الرئيسي
npm install

# في مجلد Frontend
cd frontend
npm install
```

### 2. إضافة متغيرات البيئة

في ملف `.env`:
```env
# OpenAI API
OPENAI_API_KEY=sk-...

# AI Model (للتوليد)
AI_MODEL=https://your-ai-model-url

# Frontend URLs
VITE_API_URL=http://localhost:3000
VITE_MANAGEMENT_API_URL=http://localhost:3001
```

### 3. تثبيت FFmpeg

#### على Windows
```bash
# باستخدام Chocolatey
choco install ffmpeg

# أو باستخدام scoop
scoop install ffmpeg
```

#### على macOS
```bash
brew install ffmpeg
```

#### على Linux
```bash
sudo apt-get install ffmpeg
```

### 4. بدء الخادم

```bash
# بدء Backend
npm run dev

# في نافذة أخرى، بدء Frontend
cd frontend
npm run dev
```

## التحقق من التثبيت

### 1. التحقق من الـ Backend
```bash
curl http://localhost:3000/api/ai-hub/smart-transcription/process \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"fileUrl": "test"}'
```

### 2. التحقق من الـ Frontend
- افتح المتصفح على `http://localhost:5173`
- انتقل إلى "التفريغ الذكي"
- يجب أن ترى الواجهة

## الملفات المضافة

### Frontend
```
frontend/src/components/ai/SmartTranscription.tsx
```

### Backend
```
src/controllers/ai-hub/smart-transcription.controller.ts
src/services/ai-hub/smart-transcription.service.ts
src/routes/ai-hub/smart-transcription.routes.ts
```

### التعديلات
```
frontend/src/App.tsx (إضافة التاب الجديد)
frontend/src/services/api.ts (إضافة API methods)
src/routes/ai-hub/index.ts (تصدير الـ routes)
src/index.ts (تسجيل الـ routes)
```

## اختبار النظام

### 1. اختبار بسيط
```bash
# رفع ملف صوت واختبار التفريغ
curl -X POST http://localhost:3000/api/ai-hub/smart-transcription/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileUrl": "https://example.com/audio.mp3",
    "fileType": "audio",
    "language": "ar",
    "outputs": [
      {"type": "executive_summary", "enabled": true}
    ]
  }'
```

### 2. اختبار من الواجهة
1. انتقل إلى "التفريغ الذكي"
2. رفع ملف صوت
3. اختر "ملخص تنفيذي" فقط
4. اضغط "توليد المخرجات"
5. تحقق من النتيجة

## استكشاف الأخطاء

### خطأ: "Cannot find module"
```
الحل: تأكد من أن جميع الملفات موجودة في المسارات الصحيحة
```

### خطأ: "OpenAI API key not found"
```
الحل: تأكد من إضافة OPENAI_API_KEY في .env
```

### خطأ: "FFmpeg not found"
```
الحل: تأكد من تثبيت FFmpeg وإضافته إلى PATH
```

### خطأ: "CORS error"
```
الحل: تأكد من أن الـ Frontend و Backend يعملان على نفس الـ origin
```

## الأداء والتحسينات

### تحسينات مقترحة
1. **Caching**: تخزين النتائج المتكررة
2. **Queuing**: معالجة الملفات بالتسلسل
3. **Compression**: ضغط الملفات الكبيرة
4. **Parallel Processing**: معالجة متعددة الخيوط

### حدود الأداء الحالية
- **الحد الأقصى لحجم الملف**: 1 GB
- **الحد الأقصى لمدة الملف**: 60 دقيقة
- **الحد الأقصى للمخرجات**: 50 منشور/مقطع
- **وقت المعالجة**: 2-5 دقائق

## الأمان

### نقاط الأمان المهمة
1. **المصادقة**: جميع الـ endpoints تتطلب توكن
2. **التحقق من الملفات**: التحقق من نوع الملف وحجمه
3. **تشفير البيانات**: جميع البيانات مشفرة
4. **تسجيل الاستخدام**: تسجيل كل عملية

### التوصيات الأمنية
- استخدم HTTPS في الإنتاج
- قم بتحديث المكتبات بانتظام
- راقب استخدام API
- قم بعمل نسخ احتياطية منتظمة

## التطوير المستقبلي

### المميزات المخطط إضافتها
- [ ] دعم لغات أخرى
- [ ] تحسين Speaker Diarization
- [ ] تحرير يدوي للمخرجات
- [ ] قوالب مخصصة
- [ ] تصدير بصيغ مختلفة
- [ ] جدولة المعالجة
- [ ] معاينة الفيديو

### التحسينات المخطط إجراؤها
- [ ] تحسين الأداء
- [ ] تقليل استهلاك الذاكرة
- [ ] دعم ملفات أكبر
- [ ] معالجة أسرع

## الدعم والمساعدة

للمزيد من المعلومات:
- [الدليل الشامل](./SMART_TRANSCRIPTION_GUIDE.md)
- [البدء السريع](./SMART_TRANSCRIPTION_QUICK_START.md)
- [API Reference](./API_REFERENCE.md)
