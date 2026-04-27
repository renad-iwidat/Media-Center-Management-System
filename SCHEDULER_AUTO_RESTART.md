# 🔄 Scheduler Auto-Restart عند تغيير الـ Interval

## المشكلة السابقة ❌

الـ Scheduler كان يفحص `scheduler_interval_minutes` من الداتابيس **قبل كل دورة فقط**:

```
الدورة 1 (بعد 15 دقيقة) → يفحص → يجد 15 → ينتظر 15 دقيقة
↓ (المستخدم يغيّر الـ interval إلى 5 دقائق)
الدورة 2 (بعد 15 دقيقة) → يفحص → يجد 5 → ينتظر 5 دقائق ✅
```

**يعني:** التغيير لا يطبّق إلا بعد انتهاء الدورة الحالية (قد يأخذ 15 دقيقة).

---

## الحل الجديد ✅

### 1. Auto-Restart عند التحديث

عند تحديث `scheduler_interval_minutes` عبر API، الـ Scheduler **يعيد تشغيل نفسه تلقائياً**:

```typescript
// في system-settings.controller.ts
if (key === 'scheduler_interval_minutes' && schedulerService.getStatus().isRunning) {
  console.log('🔄 إعادة تشغيل الـ Scheduler لتطبيق الـ interval الجديد...');
  await schedulerService.restart();
  console.log('✅ تم إعادة تشغيل الـ Scheduler بنجاح');
}
```

### 2. Restart Method جديد

تم إضافة method جديد في `SchedulerService`:

```typescript
async restart(): Promise<void> {
  console.log('🔄 إعادة تشغيل الـ scheduler...');
  this.stop();
  await this.start();
  console.log('✅ تم إعادة تشغيل الـ scheduler بنجاح');
}
```

### 3. Restart Endpoint جديد

```
POST /api/scheduler/restart
```

يمكن استخدامه لإعادة تشغيل الـ Scheduler يدوياً.

---

## 🎯 كيف يعمل الآن

### السيناريو 1: تحديث الـ Interval عبر API

```bash
# تحديث الـ interval من 15 إلى 5 دقائق
curl -X PATCH https://your-backend.onrender.com/api/settings/scheduler_interval_minutes \
  -H "Content-Type: application/json" \
  -d '{"value": "5"}'
```

**النتيجة:**
```
⚙️  تم تحديث الإعداد: scheduler_interval_minutes = 5
🔄 إعادة تشغيل الـ Scheduler لتطبيق الـ interval الجديد...
⏹️  تم إيقاف الـ scheduler
🚀 بدء الـ scheduler - كل 5 دقيقة (من الداتابيس)
✅ تم إعادة تشغيل الـ Scheduler بنجاح
```

**الـ Scheduler يبدأ السحب فوراً ثم كل 5 دقائق!** ⚡

---

### السيناريو 2: Bulk Update

```bash
# تحديث عدة إعدادات دفعة واحدة
curl -X PATCH https://your-backend.onrender.com/api/settings/toggles/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "scheduler_enabled": true,
    "scheduler_interval_minutes": 10,
    "articles_per_source": 30
  }'
```

**النتيجة:**
```
⚙️  تم تحديث 3 إعداد دفعة واحدة
🔄 إعادة تشغيل الـ Scheduler لتطبيق الـ interval الجديد...
✅ تم إعادة تشغيل الـ Scheduler بنجاح
```

---

### السيناريو 3: Restart يدوي

```bash
# إعادة تشغيل الـ Scheduler يدوياً
curl -X POST https://your-backend.onrender.com/api/scheduler/restart
```

**النتيجة:**
```json
{
  "success": true,
  "message": "✅ تم إعادة تشغيل الـ scheduler — التغييرات طُبّقت فوراً",
  "data": {
    "isRunning": true,
    "lastRun": "2024-01-15T10:30:00.000Z",
    "nextRun": "2024-01-15T10:35:00.000Z",
    "totalRuns": 5,
    "errors": 0
  }
}
```

---

## 📊 المقارنة

### قبل التحديث ❌
```
المستخدم يغيّر الـ interval من 15 إلى 5 دقائق
↓
ينتظر حتى تنتهي الدورة الحالية (قد يأخذ 15 دقيقة)
↓
الـ Scheduler يفحص الداتابيس
↓
يطبّق الـ interval الجديد (5 دقائق)
```

**الوقت:** قد يأخذ حتى 15 دقيقة لتطبيق التغيير

---

### بعد التحديث ✅
```
المستخدم يغيّر الـ interval من 15 إلى 5 دقائق
↓
الـ Scheduler يعيد تشغيل نفسه تلقائياً (فوراً)
↓
يبدأ السحب فوراً ثم كل 5 دقائق
```

**الوقت:** فوري! ⚡

---

## 🔧 API Endpoints الجديدة

### 1. Restart Scheduler
```
POST /api/scheduler/restart
```

**Response:**
```json
{
  "success": true,
  "message": "✅ تم إعادة تشغيل الـ scheduler — التغييرات طُبّقت فوراً",
  "data": {
    "isRunning": true,
    "lastRun": "...",
    "nextRun": "...",
    "totalRuns": 5,
    "errors": 0
  }
}
```

### 2. Update Interval (محدّث)
```
PATCH /api/settings/scheduler_interval_minutes
Body: { "value": "5" }
```

**الآن يعيد تشغيل الـ Scheduler تلقائياً!**

### 3. Bulk Update (محدّث)
```
PATCH /api/settings/toggles/bulk
Body: {
  "scheduler_interval_minutes": 10,
  "articles_per_source": 30
}
```

**الآن يعيد تشغيل الـ Scheduler تلقائياً إذا تغيّر الـ interval!**

---

## ✅ الملفات المحدّثة

1. ✅ `src/services/news/scheduler.service.ts` - أضيف `restart()` method
2. ✅ `src/controllers/news/scheduler.controller.ts` - أضيف `restart()` controller
3. ✅ `src/routes/news/scheduler.routes.ts` - أضيف `/restart` endpoint
4. ✅ `src/controllers/news/system-settings.controller.ts` - auto-restart عند تغيير الـ interval

---

## 🧪 اختبار

### 1. تحديث الـ Interval:
```bash
curl -X PATCH http://localhost:7845/api/settings/scheduler_interval_minutes \
  -H "Content-Type: application/json" \
  -d '{"value": "5"}'
```

### 2. فحص الـ Status:
```bash
curl http://localhost:7845/api/scheduler/status
```

### 3. Restart يدوي:
```bash
curl -X POST http://localhost:7845/api/scheduler/restart
```

---

## 🎉 الخلاصة

- ✅ **Auto-Restart:** الـ Scheduler يعيد تشغيل نفسه تلقائياً عند تغيير الـ interval
- ✅ **فوري:** التغيير يطبّق فوراً بدون انتظار
- ✅ **Manual Restart:** يمكن إعادة التشغيل يدوياً عبر API
- ✅ **Bulk Update:** يعمل مع التحديثات الجماعية أيضاً

**الآن:** لما تغيّر الـ interval، السحب يبدأ فوراً! ⚡🎉
