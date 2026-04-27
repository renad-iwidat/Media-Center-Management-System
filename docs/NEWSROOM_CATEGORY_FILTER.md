# فلتر التصنيفات في غرفة الأخبار

## نظرة عامة
تم إضافة ميزة فلتر التصنيفات (Categories) في غرفة الأخبار الذكية، مما يسمح للمستخدم باختيار أخبار من تصنيفات مختلفة لإنشاء نشرة متنوعة ومتوازنة.

## الميزة الجديدة

### 1. فلتر التصنيفات

**الوظيفة:**
- عرض قائمة منسدلة بجميع التصنيفات المتاحة
- فلترة الأخبار حسب التصنيف المختار
- خيار "كل التصنيفات" لعرض جميع الأخبار

**الموقع:**
- أسفل شريط البحث مباشرة
- في الجانب الأيسر (قائمة الأخبار)

### 2. عرض التصنيف المختار

**في قائمة الأخبار:**
```tsx
<div className="flex items-center gap-2">
  <span>5 محدد من 20</span>
  {selectedCategory && (
    <span className="badge">الصحة</span>
  )}
</div>
```

### 3. إحصائيات التصنيفات المختارة

**قبل زر التوليد:**
```
┌─────────────────────────────┐
│ التصنيفات المختارة:         │
├─────────────────────────────┤
│ [الصحة: 2] [محلي: 5]       │
│ [رياضة: 1]                 │
└─────────────────────────────┘
```

### 4. تحسين AI Prompt

**النظام يخبر AI عن التصنيفات:**
```typescript
const system = `أنت محرر أخبار محترف. 
الأخبار المختارة تشمل: 2 من الصحة، 5 من محلي، 1 من رياضة.`;
```

## حالات الاستخدام

### مثال 1: نشرة متنوعة

```
المستخدم يريد نشرة تحتوي على:
- 2 أخبار صحية
- 5 أخبار محلية
- 3 أخبار رياضية

الخطوات:
1. اختر "الصحة" من الفلتر
2. حدد خبرين
3. اختر "محلي" من الفلتر
4. حدد 5 أخبار
5. اختر "رياضة" من الفلتر
6. حدد 3 أخبار
7. اضغط "إنشاء النشرة"
```

### مثال 2: نشرة متخصصة

```
المستخدم يريد نشرة صحية فقط:
1. اختر "الصحة" من الفلتر
2. حدد الأخبار المطلوبة
3. اضغط "إنشاء الموجز"
```

### مثال 3: نشرة شاملة

```
المستخدم يريد نشرة من كل التصنيفات:
1. اترك الفلتر على "كل التصنيفات"
2. حدد الأخبار المطلوبة
3. اضغط "إنشاء النشرة"
```

## التنفيذ التقني

### 1. State Management

```typescript
const [selectedCategory, setSelectedCategory] = useState<string>('');

// Save to localStorage
useEffect(() => {
  localStorage.setItem('newsRoom_selectedCategory', JSON.stringify(selectedCategory));
}, [selectedCategory]);
```

### 2. Filtering Logic

```typescript
const filteredItems = newsItems.filter(item =>
  (item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.title.toLowerCase().includes(searchTerm.toLowerCase())) &&
  (selectedCategory === '' || item.category_name === selectedCategory)
);
```

### 3. Category Extraction

```typescript
const categories = [
  ...new Set(
    newsItems
      .map(item => item.category_name)
      .filter(Boolean)
  )
].sort();
```

### 4. Category Breakdown

```typescript
const categoryBreakdown = selectedItems.reduce((acc, item) => {
  const cat = item.category_name || 'غير مصنف';
  acc[cat] = (acc[cat] || 0) + 1;
  return acc;
}, {});

// Result: { "الصحة": 2, "محلي": 5, "رياضة": 1 }
```

### 5. AI Context Enhancement

```typescript
const categoryInfo = Object.entries(categoryBreakdown)
  .map(([cat, count]) => `${count} من ${cat}`)
  .join('، ');

const system = `أنت محرر أخبار محترف. 
الأخبار المختارة تشمل: ${categoryInfo}.`;
```

## UI Components

### 1. Category Filter Dropdown

```tsx
<div className="space-y-1.5">
  <label className="text-[10px] text-gray-500 font-bold">
    فلتر حسب التصنيف
  </label>
  <select
    value={selectedCategory}
    onChange={(e) => setSelectedCategory(e.target.value)}
    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs"
  >
    <option value="">كل التصنيفات</option>
    {categories.map(cat => (
      <option key={cat} value={cat}>{cat}</option>
    ))}
  </select>
</div>
```

### 2. Selected Category Badge

```tsx
{selectedCategory && (
  <span className="text-[10px] bg-[#2563eb]/10 text-[#2563eb] px-2 py-0.5 rounded-full">
    {selectedCategory}
  </span>
)}
```

### 3. Category Breakdown Display

```tsx
<div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
  <p className="text-[10px] text-gray-500 mb-1.5 font-bold">
    التصنيفات المختارة:
  </p>
  <div className="flex flex-wrap gap-1.5">
    {Object.entries(categoryBreakdown).map(([cat, count]) => (
      <span key={cat} className="text-[10px] bg-[#2563eb]/10 text-[#2563eb] px-2 py-1 rounded-lg font-bold">
        {cat}: {count}
      </span>
    ))}
  </div>
</div>
```

## الميزات

### 1. تجربة مستخدم محسّنة
- ✅ سهولة اختيار أخبار من تصنيفات مختلفة
- ✅ عرض واضح للتصنيفات المختارة
- ✅ إحصائيات فورية للتوزيع

### 2. نشرات متوازنة
- ✅ إمكانية إنشاء نشرة متنوعة
- ✅ تحكم دقيق في عدد الأخبار من كل تصنيف
- ✅ AI يفهم التوزيع ويحسّن الصياغة

### 3. حفظ تلقائي
- ✅ التصنيف المختار يُحفظ في localStorage
- ✅ يبقى محفوظاً بعد refresh
- ✅ تجربة متواصلة

### 4. Performance
- ✅ فلترة سريعة في الـ frontend
- ✅ لا حاجة لطلبات API إضافية
- ✅ تحديث فوري للقائمة

## أمثلة عملية

### مثال 1: نشرة صباحية متنوعة

```
الهدف: نشرة صباحية تحتوي على:
- 3 أخبار محلية
- 2 أخبار صحية
- 2 أخبار اقتصادية

الخطوات:
1. اختر "محلي" → حدد 3 أخبار
2. اختر "الصحة" → حدد خبرين
3. اختر "اقتصاد" → حدد خبرين
4. اختر "صباحي" من وقت النشرة
5. اختر "نشرة" من النوع
6. اضغط "إنشاء النشرة"

النتيجة:
"أهلاً بكم في نشرة الأخبار الصباحية...
نبدأ بالأخبار المحلية... [3 أخبار]
وفي الشأن الصحي... [2 أخبار]
وعلى الصعيد الاقتصادي... [2 أخبار]"
```

### مثال 2: موجز رياضي

```
الهدف: موجز رياضي سريع

الخطوات:
1. اختر "رياضة" من الفلتر
2. حدد 5 أخبار رياضية
3. اختر "موجز" من النوع
4. اضغط "إنشاء الموجز"

النتيجة:
"موجز الأخبار الرياضية:
1. [خبر رياضي 1]
2. [خبر رياضي 2]
..."
```

## الملفات المعدلة

1. `frontend/src/components/ai/NewsRoom.tsx`
   - إضافة state للتصنيف المختار
   - إضافة فلتر UI
   - إضافة عرض إحصائيات التصنيفات
   - تحسين AI prompt

## ملاحظات مهمة

### 1. التصنيفات الديناميكية
- التصنيفات تُستخرج تلقائياً من الأخبار المتاحة
- لا حاجة لتعريف التصنيفات مسبقاً
- تتحدث تلقائياً عند تحديث الأخبار

### 2. الفلترة المتعددة
- يمكن الجمع بين البحث والفلتر
- البحث يعمل على الأخبار المفلترة
- الفلتر يعمل على نتائج البحث

### 3. الإحصائيات
- تُحسب تلقائياً من الأخبار المحددة
- تُعرض قبل التوليد
- تُرسل للـ AI لتحسين الصياغة

## التوصيات المستقبلية

### 1. فلتر متعدد
- السماح باختيار أكثر من تصنيف في نفس الوقت
- استخدام checkboxes بدلاً من dropdown

### 2. حفظ القوالب
- حفظ توزيعات التصنيفات المفضلة
- مثال: "نشرة صباحية قياسية" = 3 محلي + 2 صحة + 2 اقتصاد

### 3. توصيات ذكية
- اقتراح توزيع متوازن للتصنيفات
- تحذير عند اختيار تصنيف واحد فقط

### 4. إحصائيات متقدمة
- عرض نسبة كل تصنيف
- رسم بياني للتوزيع
- مقارنة مع النشرات السابقة

## استكشاف الأخطاء

### مشكلة: لا تظهر التصنيفات

```typescript
// تحقق من:
1. هل الأخبار تحتوي على category_name؟
   console.log(newsItems.map(i => i.category_name));

2. هل الفلتر يعمل؟
   console.log(categories);
```

### مشكلة: الفلتر لا يعمل

```typescript
// تحقق من:
1. هل selectedCategory محفوظ؟
   console.log(selectedCategory);

2. هل filteredItems صحيح؟
   console.log(filteredItems.length);
```
