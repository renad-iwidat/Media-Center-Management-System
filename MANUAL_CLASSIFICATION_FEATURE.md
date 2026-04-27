# 🏷️ ميزة التصنيف اليدوي (Manual Classification)

## الميزة الجديدة ✨

الآن المحرر يستطيع **تصنيف الأخبار يدوياً** في:
- ✅ **استوديو التحرير** (Incomplete View)
- ✅ **الطابور** (Queue View) - قريباً

## 🎯 كيف تعمل

### 1. في استوديو التحرير (Incomplete Articles)

عند تحرير خبر غير مكتمل:
1. يظهر dropdown بجميع التصنيفات المتاحة
2. المحرر يختار التصنيف المناسب
3. عند الحفظ، يتم تحديث التصنيف في الداتابيس

### 2. الـ UI

```
┌─────────────────────────────────────┐
│ العنوان                             │
│ [عنوان الخبر...]                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ التصنيف                             │
│ [-- اختر التصنيف --        ▼]      │
│   - سياسة                           │
│   - اقتصاد                          │
│   - رياضة                           │
│   - ...                             │
└─────────────────────────────────────┘
✓ تم اختيار: سياسة
```

---

## 🔧 التغييرات التقنية

### Backend

#### 1. Controller Method جديد
```typescript
// src/controllers/news/data.controller.ts
export async function updateArticleCategory(req: Request, res: Response)
```

**Endpoint:**
```
PATCH /api/data/articles/:id/category
Body: { category_id: number }
```

**Response:**
```json
{
  "success": true,
  "message": "تم تحديث التصنيف إلى \"سياسة\"",
  "data": {
    "article_id": 123,
    "category_id": 1,
    "category_name": "سياسة"
  }
}
```

#### 2. Route جديد
```typescript
// src/routes/news/data.routes.ts
router.patch('/articles/:id/category', updateArticleCategory);
```

---

### Frontend

#### 1. API Method جديد
```typescript
// frontend/src/services/api.ts
updateArticleCategory: (id: number, category_id: number) =>
  request<any>(`/data/articles/${id}/category`, {
    method: "PATCH",
    body: JSON.stringify({ category_id }),
  })
```

#### 2. UI Updates في IncompleteView

**State جديد:**
```typescript
const [editedCategoryId, setEditedCategoryId] = useState<number | null>(null);
const [categories, setCategories] = useState<any[]>([]);
```

**Dropdown:**
```tsx
<select
  value={editedCategoryId || ""}
  onChange={(e) => setEditedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
  className="..."
>
  <option value="">-- اختر التصنيف --</option>
  {categories.map((cat) => (
    <option key={cat.id} value={cat.id}>{cat.name}</option>
  ))}
</select>
```

**Save Logic:**
```typescript
// تحديث التصنيف إذا تغيّر
if (editedCategoryId && editedCategoryId !== editingArticle.category_id) {
  await api.updateArticleCategory(editingArticle.id, editedCategoryId);
}
```

---

## 📊 السيناريوهات

### السيناريو 1: خبر بدون تصنيف

```
1. المحرر يفتح خبر غير مكتمل
2. يرى "⚠️ لم يتم تحديد تصنيف"
3. يختار "سياسة" من القائمة
4. يحفظ التغييرات
5. ✅ يتم تحديث التصنيف في الداتابيس
```

### السيناريو 2: تغيير تصنيف موجود

```
1. المحرر يفتح خبر مصنف كـ "اقتصاد"
2. يرى "✓ تم اختيار: اقتصاد"
3. يغيّر إلى "سياسة"
4. يحفظ التغييرات
5. ✅ يتم تحديث التصنيف من "اقتصاد" إلى "سياسة"
```

### السيناريو 3: حفظ بدون تغيير التصنيف

```
1. المحرر يعدّل المحتوى فقط
2. لا يغيّر التصنيف
3. يحفظ التغييرات
4. ✅ يتم حفظ المحتوى فقط، التصنيف يبقى كما هو
```

---

## 🎨 الـ UI Features

### 1. Visual Feedback
- ✅ **تم اختيار:** نص أخضر يظهر التصنيف المختار
- ⚠️ **لم يتم تحديد:** نص أصفر يحذر من عدم وجود تصنيف

### 2. Validation
- التحقق من وجود الخبر
- التحقق من وجود التصنيف
- رسائل خطأ واضحة

### 3. User Experience
- Dropdown سهل الاستخدام
- يظهر جميع التصنيفات المتاحة
- يحفظ التصنيف تلقائياً عند الحفظ

---

## 🧪 اختبار

### 1. Backend API Test
```bash
# تحديث تصنيف خبر
curl -X PATCH http://localhost:7845/api/data/articles/123/category \
  -H "Content-Type: application/json" \
  -d '{"category_id": 1}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "تم تحديث التصنيف إلى \"سياسة\"",
  "data": {
    "article_id": 123,
    "category_id": 1,
    "category_name": "سياسة"
  }
}
```

### 2. Frontend Test
1. افتح استوديو التحرير
2. اختر خبر غير مكتمل
3. اختر تصنيف من القائمة
4. احفظ التغييرات
5. تحقق من أن التصنيف تم تحديثه

---

## 📝 الملفات المحدّثة

### Backend (3 ملفات):
1. ✅ `src/controllers/news/data.controller.ts` - أضيف `updateArticleCategory`
2. ✅ `src/routes/news/data.routes.ts` - أضيف route جديد
3. ✅ `frontend/src/services/api.ts` - أضيف API method

### Frontend (1 ملف):
1. ✅ `frontend/src/components/news/IncompleteView.tsx` - أضيف dropdown للتصنيف

---

## 🚀 الخطوات التالية (Optional)

### 1. إضافة نفس الميزة في QueueView
للسماح بتغيير التصنيف في الطابور أيضاً.

### 2. Bulk Classification
السماح بتصنيف عدة أخبار دفعة واحدة.

### 3. Auto-Suggest
اقتراح تصنيف بناءً على المحتوى باستخدام AI.

---

## ✅ الخلاصة

- ✅ **Backend:** endpoint جديد لتحديث التصنيف
- ✅ **Frontend:** dropdown للتصنيف في استوديو التحرير
- ✅ **UX:** visual feedback واضح
- ✅ **Validation:** فحص الأخطاء
- ✅ **Testing:** جاهز للاختبار

**الآن:** المحرر يستطيع تصنيف الأخبار يدوياً! 🎉
