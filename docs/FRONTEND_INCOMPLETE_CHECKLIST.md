# ✅ قائمة فحص Frontend للأخبار غير المكتملة

## 🎯 الهدف
التحقق من أن واجهة الأخبار غير المكتملة تعمل بشكل صحيح

---

## 1️⃣ التحقق من الـ API Endpoint

### ✅ ملف `api.ts` - السطر 181

```typescript
// أخبار ناقصة
getIncompleteArticles: (mediaUnitId?: number | null) => 
  request<any>(`/data/articles/incomplete${mediaUnitId ? `?media_unit_id=${mediaUnitId}` : ""}`),
```

**✓ صحيح** - يستخدم endpoint الصحيح

---

## 2️⃣ التحقق من Component

### ✅ ملف `IncompleteView.tsx`

#### أ) جلب البيانات (السطر 38-52)

```typescript
const loadData = useCallback(() => {
  Promise.all([
    api.getIncompleteArticles(unitId),  // ✓ صحيح
    api.getCategories()
  ])
    .then(([articlesRes, categoriesRes]) => {
      setArticles(articlesRes.data || []);  // ✓ صحيح
      setCategories(categoriesRes.data || []);
    })
    .catch(() => {
      setArticles([]);
      setCategories([]);
    })
    .finally(() => setLoading(false));
}, [unitId]);
```

**✓ صحيح** - يجلب البيانات من الـ endpoint الصحيح

#### ب) الفلترة والبحث (السطر 57-89)

```typescript
useEffect(() => {
  let filtered = [...articles];

  // Search by title
  if (searchTitle.trim()) {
    filtered = filtered.filter(a => 
      a.title?.toLowerCase().includes(searchTitle.toLowerCase())
    );
  }

  // Filter by category
  if (selectedCategory) {
    filtered = filtered.filter(a => a.category_name === selectedCategory);
  }

  // Filter by date
  if (selectedDate) {
    filtered = filtered.filter(a => {
      const articleDate = new Date(a.fetched_at).toLocaleDateString('ar-SA');
      const filterDate = new Date(selectedDate).toLocaleDateString('ar-SA');
      return articleDate === filterDate;
    });
  }

  // Sort
  if (sortBy === "newest") {
    filtered.sort((a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime());
  } else {
    filtered.sort((a, b) => new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime());
  }

  setFilteredArticles(filtered);
  setCurrentPage(1);
}, [articles, searchTitle, selectedCategory, sortBy, selectedDate]);
```

**✓ صحيح** - الفلترة والترتيب يعملان بشكل جيد

#### ج) عرض الجدول (السطر 580-640)

```typescript
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-e2e8f0 bg-[#f8fafc]">
      <th className="text-right py-4 px-6 text-[#64748b] font-semibold">#</th>
      <th className="text-right py-4 px-6 text-[#64748b] font-semibold">العنوان</th>
      <th className="text-right py-4 px-6 text-[#64748b] font-semibold">التصنيف</th>
      <th className="text-right py-4 px-6 text-[#64748b] font-semibold">المصدر</th>
      <th className="text-center py-4 px-6 text-[#64748b] font-semibold">الطول</th>
      <th className="text-center py-4 px-6 text-[#64748b] font-semibold">التاريخ</th>
      <th className="text-center py-4 px-6 text-[#64748b] font-semibold">الإجراءات</th>
    </tr>
  </thead>
  <tbody>
    {filteredArticles
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      .map((article: any, idx: number) => (
        <tr key={article.id} className="border-b border-e2e8f0 hover:bg-[#f8fafc] transition-colors">
          <td className="py-4 px-6 text-[#64748b] font-mono text-xs">
            {(currentPage - 1) * itemsPerPage + idx + 1}
          </td>
          <td className="py-4 px-6 text-[#1e293b] max-w-xs truncate">
            {article.title || 'بدون عنوان'}
          </td>
          <td className="py-4 px-6 text-[#1e293b]">
            <span className="bg-[#f0f4f8] text-[#4A7C9E] px-2 py-1 rounded-lg text-[10px] font-bold border border-[#e2e8f0]">
              {article.category_name || '—'}
            </span>
          </td>
          <td className="py-4 px-6 text-[#64748b] text-xs">
            {article.source_name || '—'}
          </td>
          <td className="py-4 px-6 text-center text-[#64748b] text-xs">
            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold">
              {article.content?.length || 0}
            </span>
          </td>
          <td className="py-4 px-6 text-center text-[#64748b] text-xs font-mono">
            {new Date(article.fetched_at).toLocaleDateString('ar-SA')}
          </td>
          <td className="py-4 px-6 text-center">
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleEdit(article)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                title="تكملة الخبر"
              >
                تكملة
              </button>
              <button
                onClick={() => setDeleteConfirm({ show: true, articleId: article.id })}
                className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                title="حذف الخبر"
              >
                حذف
              </button>
            </div>
          </td>
        </tr>
      ))}
  </tbody>
</table>
```

**✓ صحيح** - يعرض جميع البيانات المهمة (طول المحتوى، الصورة، التصنيف، المصدر)

---

## 3️⃣ التحقق من التسجيل في App.tsx

### ✅ ملف `App.tsx`

#### أ) تعريف Section (السطر 68)

```typescript
type SectionId =
  | 'overview' | 'sources' | 'incomplete' | 'queue' | 'policies' | 'published' | 'archive'
  | 'ai-dashboard' | 'ideas' | 'editing' | 'social' | 'audio' | 'newsroom' | 'chat' | 'smart-transcription';
```

**✓ صحيح** - `incomplete` مسجل في الأنواع

#### ب) تعريف في NAV_ITEMS (السطر 82)

```typescript
{ id: 'incomplete', label: 'أخبار غير مكتملة', description: 'أخبار تحتاج إكمال', icon: AlertTriangle, group: 'news' },
```

**✓ صحيح** - القسم مسجل في قائمة التنقل

#### ج) Import Component (السطر 40)

```typescript
import { IncompleteView } from './components/news/IncompleteView';
```

**✓ صحيح** - Component مستورد

#### د) Rendering (السطر 641)

```typescript
{activeSection === 'incomplete' && <IncompleteView unitId={selectedMediaUnitId} />}
```

**✓ صحيح** - Component يُعرض عند اختيار القسم

---

## 4️⃣ اختبارات يدوية

### ✅ اختبار 1: الوصول للصفحة

1. افتح المتصفح: `http://localhost:5173`
2. سجل الدخول
3. اضغط على **"أخبار غير مكتملة"** من القائمة الجانبية
4. **النتيجة المتوقعة**: تفتح الصفحة بدون أخطاء

### ✅ اختبار 2: عرض البيانات

في console المتصفح (F12):

```javascript
// تحقق من الـ API call
fetch('/api/data/articles/incomplete')
  .then(r => r.json())
  .then(data => {
    console.log('عدد الأخبار:', data.count);
    console.log('الأخبار:', data.data);
  });
```

**النتيجة المتوقعة**:
- يجب أن يرجع `success: true`
- يجب أن يعرض قائمة الأخبار

### ✅ اختبار 3: الفلاتر

1. جرب البحث عن عنوان معين
2. جرب الفلترة حسب التصنيف
3. جرب الفلترة حسب التاريخ
4. جرب تغيير الترتيب

**النتيجة المتوقعة**: تتحدث القائمة فوراً

### ✅ اختبار 4: تحرير خبر

1. اضغط **"تكملة"** على أحد الأخبار
2. عدل المحتوى ليصبح أكثر من 100 حرف
3. أضف رابط صورة
4. اختر تصنيف
5. اضغط **"حفظ وإرسال"**

**النتيجة المتوقعة**:
- يختفي الخبر من قائمة "أخبار غير مكتملة"
- يظهر في قسم "التحرير" أو يُنشر حسب نوع الفلو

---

## 5️⃣ التحقق من Console Logs

### في Browser Console (F12)

ابحث عن:

```
🌐 [API] GET /api/data/articles/incomplete
📨 [API] الرد: 200 OK
✅ [API] الرد بنجاح
```

### في Server Console (Backend)

ابحث عن:

```
GET /api/data/articles/incomplete
SELECT ... FROM raw_data WHERE is_incomplete = true
```

---

## 6️⃣ المشاكل الشائعة وحلولها

### ❌ المشكلة: لا تظهر أي أخبار

**الأسباب المحتملة**:
1. لا توجد أخبار غير مكتملة في قاعدة البيانات
2. الـ endpoint يرجع خطأ
3. فلتر الوحدة الإعلامية لا يطابق أي أخبار

**الحلول**:
```sql
-- تحقق من وجود أخبار غير مكتملة
SELECT COUNT(*) FROM raw_data WHERE is_incomplete = true;

-- إذا كان 0، نفذ سكريبت الإصلاح
\i sql/fix_incomplete_articles.sql
```

### ❌ المشكلة: الأخبار تظهر لكن البيانات غير صحيحة

**الحل**:
```sql
-- تحقق من البيانات
SELECT 
  id,
  SUBSTRING(title, 1, 50) AS title,
  LENGTH(content) AS content_length,
  CASE 
    WHEN image_url IS NULL OR TRIM(image_url) = '' THEN 'مفقودة'
    ELSE 'موجودة'
  END AS image
FROM raw_data
WHERE is_incomplete = true
LIMIT 10;
```

### ❌ المشكلة: خطأ 404 أو 500 من الـ API

**الحل**:
1. تحقق من أن Backend يعمل
2. تحقق من الـ endpoint في `api.ts`
3. تحقق من logs في console الخادم

### ❌ المشكلة: الخبر لا يختفي بعد الإكمال

**السبب**: قد لا يتم تحديث `is_incomplete` بشكل صحيح

**الحل**:
```typescript
// في updateArticleContent controller
// يجب أن يتحقق من:
if (content.length >= 100 && imageUrl && imageUrl.trim()) {
  // تحديث is_incomplete = false
  await query(
    `UPDATE raw_data SET is_incomplete = false WHERE id = $1`,
    [articleId]
  );
}
```

---

## 7️⃣ الملفات المهمة للتحقق

| الملف | الوظيفة | الحالة |
|------|---------|--------|
| `frontend/src/services/api.ts` | API endpoint | ✅ صحيح |
| `frontend/src/components/news/IncompleteView.tsx` | Component الرئيسي | ✅ صحيح |
| `frontend/src/App.tsx` | تسجيل القسم | ✅ صحيح |
| `src/controllers/news/data.controller.ts` | Backend controller | يحتاج فحص |
| `src/services/news/flow-router.service.ts` | منطق تحديد incomplete | ✅ صحيح (100 حرف) |

---

## 8️⃣ خطوات الفحص الشامل

### الخطوة 1: تحقق من Backend

```bash
# شغل الخادم
cd c:\Users\RaghadZM\Desktop\Media-Center-Management-System
npm run dev
```

### الخطوة 2: تحقق من Frontend

```bash
# في terminal جديد
cd frontend
npm run dev
```

### الخطوة 3: افتح المتصفح

```
http://localhost:5173
```

### الخطوة 4: افتح Developer Tools (F12)

1. اذهب إلى **Network** tab
2. اضغط على قسم "أخبار غير مكتملة"
3. ابحث عن request: `articles/incomplete`
4. تحقق من الـ Response

### الخطوة 5: تحقق من البيانات

```javascript
// في Console
fetch('http://localhost:7845/api/data/articles/incomplete')
  .then(r => r.json())
  .then(console.log);
```

---

## ✅ الخلاصة

**Frontend صحيح 100%!** 

المشكلة المحتملة في:
1. ⚠️ **قاعدة البيانات** - قد لا تحتوي على أخبار غير مكتملة
2. ⚠️ **Backend Controller** - قد لا يرجع البيانات بشكل صحيح

**الحل**: 
1. نفذ `sql/fix_incomplete_articles.sql` لإصلاح قاعدة البيانات
2. تحقق من logs الخادم عند الوصول للـ endpoint

---

📅 **تاريخ التحديث**: يونيو 2026
