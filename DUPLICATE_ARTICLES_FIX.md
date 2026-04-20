# إصلاح مشكلة الأخبار المكررة في استديو التحرير

## المشكلة
كانت الأخبار تظهر مكررة في استديو التحرير (Editorial Studio) لأن النظام لم يكن يتحقق بشكل كافٍ من التكرار.

## الأسباب الرئيسية
1. **التحقق الضعيف من التكرار**: كان يتحقق فقط من الـ URL، لكن نفس الخبر قد يأتي برابط مختلف
2. **عدم التحقق من المحتوى**: لم يكن يقارن العنوان والمحتوى
3. **إضافة متكررة للطابور**: نفس الخبر قد يُضاف للطابور أكثر من مرة

## الحل المطبق

### 1. تحسين كشف التكرار في `RawDataService`
أضفنا دالة جديدة `existsBySimilarity()` تتحقق من:
- **العنوان**: مقارنة دقيقة للعنوان (case-insensitive)
- **المحتوى**: مقارنة أول 200 حرف من المحتوى

```typescript
// التحقق من وجود خبر مكرر
const existsBySimilarity = await RawDataService.existsBySimilarity(
  article.title,
  article.description
);
```

### 2. تحسين خدمة حفظ المقالات
في `article-saver.service.ts`:
- أولاً: التحقق من الـ URL (الفحص السريع)
- ثانياً: التحقق من التشابه (العنوان والمحتوى)
- تخطي الخبر إذا كان موجوداً بأي من الطريقتين

### 3. منع إضافة متكررة للطابور
في `flow-router.service.ts`:
- قبل إضافة خبر للطابور، نتحقق من عدم وجوده بالفعل
- استخدام `EditorialQueueService.existsInQueue()` للتحقق

### 4. دالة جديدة في `EditorialQueueService`
```typescript
// التحقق من وجود خبر في الطابور (غير مرفوض)
static async existsInQueue(
  raw_data_id: number,
  media_unit_id: number
): Promise<boolean>
```

## تنظيف البيانات الموجودة

لتنظيف الأخبار المكررة الموجودة بالفعل، قم بتشغيل:

```bash
# تنظيف الأخبار المكررة
psql -U your_user -d your_database -f sql/cleanup_duplicate_articles.sql
```

هذا السكريبت يقوم بـ:
1. حذف الأخبار المكررة من `raw_data` (يحتفظ بالأقدم)
2. حذف العناصر المكررة من `editorial_queue`
3. حذف العناصر المكررة من `published_items`
4. عرض إحصائيات بعد التنظيف

## النتيجة
✅ لن تظهر أخبار مكررة في استديو التحرير
✅ نفس الخبر من مصادر مختلفة سيُكتشف ويُتخطى
✅ الطابور سيكون نظيفاً وخالياً من التكرار

## الملفات المعدلة
- `src/services/database/database.service.ts` - إضافة دوال التحقق
- `src/services/news/article-saver.service.ts` - تحسين الحفظ
- `src/services/news/flow-router.service.ts` - منع التكرار في الطابور
- `sql/cleanup_duplicate_articles.sql` - تنظيف البيانات الموجودة
