# ميزات LocalStorage و Pagination

## نظرة عامة
تم إضافة ميزتين مهمتين لتحسين تجربة المستخدم في مكونات AI Hub:
1. **حفظ البيانات في LocalStorage** - البيانات تبقى محفوظة عند refresh
2. **Pagination للقوائم الطويلة** - عرض البيانات بشكل منظم مع صفحات

## 1. حفظ البيانات في LocalStorage

### المكونات المحدثة

#### أ. وحدة الابتكار الإعلامي (IdeaGeneration.tsx)

**البيانات المحفوظة:**
- ✅ `activeTool` - الأداة النشطة (IDEAS/QUESTIONS/TITLES)
- ✅ `selectedProgram` - البرنامج المختار
- ✅ `selectedEpisode` - الحلقة المختارة
- ✅ `selectedGuest` - الضيف المختار
- ✅ `additionalContext` - السياق الإضافي
- ✅ `result` - النتيجة المولدة من AI

**مفتاح التخزين:** `ideaGen_*`

#### ب. غرفة الأخبار الذكية (NewsRoom.tsx)

**البيانات المحفوظة:**
- ✅ `activeMode` - الوضع النشط (SUMMARY/BULLETIN)
- ✅ `timeOfDay` - وقت النشرة (MORNING/EVENING)
- ✅ `result` - النشرة المولدة
- ✅ `countPreset` - عدد الأخبار المحدد
- ✅ `customCount` - العدد المخصص

**مفتاح التخزين:** `newsRoom_*`

#### ج. المختبر الصوتي (AudioProcessing.tsx)

**البيانات المحفوظة:**
- ✅ `activeMode` - الوضع النشط (STT/TTS)
- ✅ `selectedFileId` - الملف المختار
- ✅ `result` - نتيجة التفريغ الصوتي
- ✅ `voice` - الصوت المختار للـ TTS
- ✅ `fileTypeFilter` - فلتر نوع الملف
- ✅ `ttsSource` - مصدر النص (paste/published)
- ✅ `pastedText` - النص الملصق
- ✅ `selectedArticleId` - المقالة المختارة

**مفتاح التخزين:** `audioProc_*`

### كيفية العمل

```typescript
// دالة تحميل البيانات من localStorage
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(`prefix_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// استخدام في useState
const [activeMode, setActiveMode] = useState<Mode>(() => 
  loadFromStorage('activeMode', 'DEFAULT')
);

// حفظ عند التغيير
useEffect(() => {
  localStorage.setItem('prefix_activeMode', JSON.stringify(activeMode));
}, [activeMode]);
```

### الميزات

1. **استمرارية البيانات**: البيانات تبقى محفوظة حتى بعد:
   - Refresh الصفحة
   - إغلاق وإعادة فتح المتصفح
   - التنقل بين الصفحات

2. **أمان البيانات**: استخدام try-catch لتجنب الأخطاء عند:
   - فشل parsing JSON
   - عدم توفر localStorage
   - بيانات تالفة

3. **Performance**: 
   - تحميل البيانات مرة واحدة عند mount
   - حفظ تلقائي عند كل تغيير

## 2. Pagination للقوائم الطويلة

### المكونات المحدثة

#### أ. وحدة الابتكار الإعلامي (IdeaGeneration.tsx)

**القوائم مع Pagination/Scroll:**

##### 1. قائمة البرامج (Pagination)
```typescript
const itemsPerPage = 10;
const [programPage, setProgramPage] = useState(1);

const totalProgramPages = Math.ceil(filteredPrograms.length / itemsPerPage);
const paginatedPrograms = filteredPrograms.slice(
  (programPage - 1) * itemsPerPage,
  programPage * itemsPerPage
);
```

**UI:**
```tsx
{totalProgramPages > 1 && (
  <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/5">
    <button onClick={() => setProgramPage(p => Math.max(1, p - 1))} disabled={programPage === 1}>
      السابق
    </button>
    <span>صفحة {programPage} من {totalProgramPages}</span>
    <button onClick={() => setProgramPage(p => Math.min(totalProgramPages, p + 1))} disabled={programPage === totalProgramPages}>
      التالي
    </button>
  </div>
)}
```

##### 2. قائمة الضيوف (Scroll)
```typescript
// عرض آخر 5 ضيوف افتراضياً
async function fetchGuests(search?: string): Promise<Guest[]> {
  const url = search && search.trim()
    ? `${API_URL}/guests?search=${encodeURIComponent(search.trim())}`
    : `${API_URL}/guests?recent=5`;
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
}
```

**UI:**
```tsx
<div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
  {filteredGuests.map(guest => (
    <div key={guest.id}>{guest.name}</div>
  ))}
</div>
```

##### 2. قائمة الضيوف
- عرض آخر 5 ضيوف افتراضياً (بدلاً من 2)
- استخدام scroll بدلاً من pagination
- `max-h-[280px]` مع `overflow-y-auto`
- البحث يعرض جميع النتائج مع scroll

##### 3. قائمة الحلقات
- نفس المنطق مع `episodePage` و `paginatedEpisodes`
- 10 حلقات لكل صفحة

### الميزات

#### 1. تحسين الأداء
- ✅ البرامج: عرض 10 عناصر فقط في كل صفحة (pagination)
- ✅ الضيوف: عرض آخر 5 ضيوف مع scroll
- ✅ الحلقات: عرض 10 حلقات في كل صفحة (pagination)
- ✅ تقليل DOM nodes
- ✅ تحسين سرعة الـ rendering

#### 2. تجربة مستخدم أفضل
- ✅ البرامج: pagination للتنقل السهل
- ✅ الضيوف: scroll سلس لعرض آخر 5 ضيوف
- ✅ الحلقات: pagination داخل dropdown
- ✅ عرض منظم للبيانات
- ✅ عدم تطويل الصفحة

#### 3. Responsive Design
- ✅ أزرار pagination واضحة
- ✅ عرض رقم الصفحة الحالية
- ✅ تعطيل الأزرار عند الحاجة

## أمثلة الاستخدام

### مثال 1: إضافة localStorage لمكون جديد

```typescript
// 1. دالة التحميل
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(`myComponent_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// 2. State مع قيمة محفوظة
const [myValue, setMyValue] = useState(() => loadFromStorage('myValue', 'default'));

// 3. حفظ عند التغيير
useEffect(() => {
  localStorage.setItem('myComponent_myValue', JSON.stringify(myValue));
}, [myValue]);
```

### مثال 2: إضافة pagination لقائمة

```typescript
// 1. State للصفحة
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

// 2. حساب الصفحات
const totalPages = Math.ceil(items.length / itemsPerPage);
const paginatedItems = items.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

// 3. UI
{totalPages > 1 && (
  <div className="pagination">
    <button 
      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
      disabled={currentPage === 1}
    >
      السابق
    </button>
    <span>صفحة {currentPage} من {totalPages}</span>
    <button 
      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
      disabled={currentPage === totalPages}
    >
      التالي
    </button>
  </div>
)}
```

## الملفات المعدلة

1. `frontend/src/components/ai/IdeaGeneration.tsx`
   - إضافة localStorage
   - إضافة pagination للبرامج والضيوف والحلقات

2. `frontend/src/components/ai/NewsRoom.tsx`
   - إضافة localStorage

3. `frontend/src/components/ai/AudioProcessing.tsx`
   - إضافة localStorage

## ملاحظات مهمة

### LocalStorage

1. **حجم التخزين**: 
   - localStorage محدود بـ 5-10 MB
   - لا تخزن ملفات كبيرة أو صور

2. **الأمان**:
   - لا تخزن معلومات حساسة (passwords, tokens)
   - البيانات يمكن الوصول إليها من JavaScript

3. **التوافق**:
   - مدعوم في جميع المتصفحات الحديثة
   - استخدم try-catch للتعامل مع الأخطاء

### Pagination

1. **عدد العناصر**:
   - 10 عناصر لكل صفحة (قابل للتعديل)
   - يمكن جعله قابل للتخصيص من المستخدم

2. **Performance**:
   - استخدم `useMemo` للقوائم الكبيرة جداً
   - فكر في Virtual Scrolling للقوائم الضخمة (1000+ عنصر)

3. **UX**:
   - أضف keyboard navigation (Arrow keys)
   - أضف "Jump to page" للقوائم الطويلة جداً

## التوصيات المستقبلية

### LocalStorage

1. **Expiration**: إضافة تاريخ انتهاء للبيانات المحفوظة
2. **Compression**: ضغط البيانات الكبيرة قبل التخزين
3. **Sync**: مزامنة البيانات مع الـ backend (optional)
4. **Clear**: زر لمسح جميع البيانات المحفوظة

### Pagination

1. **Server-side Pagination**: للبيانات الكبيرة جداً
2. **Infinite Scroll**: كبديل للـ pagination
3. **Page Size Selector**: السماح للمستخدم باختيار عدد العناصر
4. **URL Parameters**: حفظ رقم الصفحة في URL للمشاركة

## استكشاف الأخطاء

### مشكلة: البيانات لا تُحفظ

```typescript
// تحقق من:
1. هل localStorage متاح؟
   console.log(typeof localStorage !== 'undefined');

2. هل هناك أخطاء في console؟
   افتح DevTools > Console

3. هل البيانات موجودة؟
   console.log(localStorage.getItem('key'));
```

### مشكلة: Pagination لا يعمل

```typescript
// تحقق من:
1. هل totalPages محسوب بشكل صحيح؟
   console.log('Total:', totalPages, 'Current:', currentPage);

2. هل paginatedItems يحتوي على بيانات؟
   console.log('Items:', paginatedItems.length);

3. هل الأزرار تعمل؟
   أضف console.log في onClick
```
