# ربط المهام برقم المستخدم — دليل التطبيق

## 📋 المحتويات
1. [نظرة عامة](#نظرة-عامة)
2. [السيناريوهات](#السيناريوهات)
3. [التعديلات المطلوبة](#التعديلات-المطلوبة)
4. [الملفات المتأثرة](#الملفات-المتأثرة)
5. [خطوات التطبيق](#خطوات-التطبيق)

---

## نظرة عامة

عند فتح نظام الأخبار من مهمة بنظام الإدارة، يجب تمرير رقم المهمة (`task_id`) إلى نظام الأخبار. كل عملية يعملها المحرر يجب أن تُحفظ مع رقم المهمة ورقم المستخدم.

### الفائدة
- ✅ ربط الأخبار المنشورة بالمهام الأصلية
- ✅ تتبع العمليات برقم المهمة
- ✅ حساب إحصائيات لكل مهمة
- ✅ إنشاء محتوى مربوط بالمهمة تلقائياً

---

## السيناريوهات

### السيناريو الأول: شغل ضمن مهمة

```
1. المدير ينشئ أوردر "نشرة أخبار الساعة 8"
2. المدير يعمل مهمة "تحرير أخبار" ويعينها للمحرر
3. المحرر يفتح المهمة ويضغط على "افتح نظام الأخبار"
4. الفرونت يفتح رابط:
   https://news-system.onrender.com/editorial?task_id=45
5. نظام الأخبار يأخذ task_id من الرابط
6. المحرر يحرر ويوافق على الأخبار
7. كل عملية تُحفظ مع:
   - task_id = 45
   - user_id = 57 (من التوكن)
8. الخبر ينشر ويروح لجدول published_items مع task_id و approved_by
9. نظام الإدارة يسحب المنشورات الجديدة ويحولها لمحتوى مربوط بالمهمة
10. مؤشرات الأداء تتحدث تلقائي
```

### السيناريو الثاني: شغل بدون مهمة

```
1. المحرر يفتح نظام الأخبار مباشرة (بدون مهمة)
2. لا يوجد task_id في الرابط
3. المحرر يحرر أخبار أو يستخدم أدوات الذكاء الاصطناعي
4. كل عملية تُحفظ مع:
   - task_id = NULL
   - user_id = 57 (من التوكن)
5. العمليات تُسجل باسم الموظف بس مش مربوطة بأوردر معين
6. نظام الإدارة بيقرأ من الجداول وبيحسب شو عمل الموظف
7. بيظهر بمؤشرات أداء الموظف — بس مش مربوط بأوردر معين
```

---

## التعديلات المطلوبة

### 1. Frontend — إضافة معامل task_id إلى الرابط

**الملف**: `frontend/src/App.tsx` (أو ملف جديد للمهام)

**التعديل**:
```typescript
// عند فتح نظام الأخبار من مهمة
const openNewsSystem = (taskId: number) => {
  const newsSystemUrl = `https://news-system.onrender.com/editorial?task_id=${taskId}`;
  window.open(newsSystemUrl, '_blank');
};
```

### 2. Frontend — قراءة task_id من الرابط

**الملف**: `frontend/src/App.tsx`

**التعديل**:
```typescript
import { useSearchParams } from 'react-router-dom';

export default function App() {
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('task_id');
  
  // استخدم taskId في العمليات
  useEffect(() => {
    if (taskId) {
      console.log('Task ID:', taskId);
      // حفظ task_id في state أو context
    }
  }, [taskId]);
}
```

### 3. Frontend — تمرير task_id مع الطلبات

**الملف**: `frontend/src/services/api.ts`

**التعديل**:
```typescript
// إضافة task_id إلى جميع الطلبات
export function setTaskId(taskId: string | null): void {
  if (taskId) {
    localStorage.setItem('taskId', taskId);
  } else {
    localStorage.removeItem('taskId');
  }
}

export function getTaskId(): string | null {
  return localStorage.getItem('taskId');
}

// تعديل الطلبات لإضافة task_id
async function request<T>(url: string, options?: RequestInit, useManagementAPI: boolean = false): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // إضافة task_id إلى الهيدر إذا كان موجوداً
  const taskId = getTaskId();
  if (taskId) {
    headers['X-Task-ID'] = taskId;
  }
  
  // ... باقي الكود
}
```

### 4. Backend — قراءة task_id من الهيدر

**الملف**: `src/middleware/auth.ts` (أو middleware جديد)

**التعديل**:
```typescript
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const taskId = req.headers['x-task-id'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Access denied. No token provided',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = AuthService.verifyToken(token);
    req.user = payload;
    
    // إضافة task_id إلى request
    (req as any).taskId = taskId ? BigInt(taskId) : null;
    
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
}
```

### 5. Backend — حفظ task_id مع العمليات

**الملفات المتأثرة**:
- `src/controllers/news/flow.controller.ts`
- `src/controllers/news/data.controller.ts`
- `src/services/news/editorial-queue.service.ts`
- `src/services/ai-hub/ai-usage-logger.service.ts`

**التعديل**:
```typescript
// في flow.controller.ts
export async function approveQueueItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;
    const taskId = (req as any).taskId;

    // حفظ مع task_id و user_id
    await editorialQueueService.approveItem(
      BigInt(id),
      BigInt(userId),
      taskId
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

### 6. Database — إضافة عمود task_id

**الملف**: `sql/add_user_tracking_columns.sql` (موجود بالفعل)

**التحقق**:
```sql
-- تحقق من وجود الأعمدة
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'editorial_queue' AND column_name = 'task_id';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'published_items' AND column_name = 'task_id';
```

---

## الملفات المتأثرة

### Frontend
```
frontend/src/App.tsx                                  ✏️ معدّل
frontend/src/services/api.ts                         ✏️ معدّل
frontend/src/components/news/QueueView.tsx           ✏️ معدّل (إضافة زر فتح نظام الأخبار)
```

### Backend
```
src/middleware/auth.ts                               ✏️ معدّل
src/controllers/news/flow.controller.ts              ✏️ معدّل
src/controllers/news/data.controller.ts              ✏️ معدّل
src/services/news/editorial-queue.service.ts         ✏️ معدّل
src/services/ai-hub/ai-usage-logger.service.ts       ✏️ معدّل
```

### Database
```
sql/add_user_tracking_columns.sql                    ✅ موجود بالفعل
```

---

## خطوات التطبيق

### المرحلة 1: Frontend — قراءة task_id

1. **تثبيت react-router-dom** (إذا لم يكن مثبتاً)
   ```bash
   npm install react-router-dom
   ```

2. **تعديل App.tsx**
   - إضافة `useSearchParams` hook
   - قراءة `task_id` من الرابط
   - حفظ `task_id` في localStorage

3. **تعديل API Service**
   - إضافة دوال `getTaskId()` و `setTaskId()`
   - إضافة `task_id` إلى جميع الطلبات

### المرحلة 2: Backend — قراءة task_id

1. **تعديل Middleware**
   - قراءة `task_id` من الهيدر
   - إضافة `task_id` إلى request object

2. **تعديل Controllers**
   - استخراج `task_id` من request
   - تمريره إلى services

3. **تعديل Services**
   - حفظ `task_id` مع العمليات
   - تحديث الجداول

### المرحلة 3: اختبار

1. **اختبر مع task_id**
   ```
   https://news-system.onrender.com/editorial?task_id=45
   ```

2. **اختبر بدون task_id**
   ```
   https://news-system.onrender.com/editorial
   ```

3. **تحقق من قاعدة البيانات**
   ```sql
   SELECT * FROM editorial_queue WHERE task_id = 45;
   SELECT * FROM published_items WHERE task_id = 45;
   ```

---

## مثال عملي

### Frontend — فتح نظام الأخبار من مهمة

```typescript
// في QueueView.tsx
const handleOpenNewsSystem = (taskId: number) => {
  const newsSystemUrl = `https://news-system.onrender.com/editorial?task_id=${taskId}`;
  window.open(newsSystemUrl, '_blank');
};

// في الـ JSX
<button onClick={() => handleOpenNewsSystem(task.id)}>
  افتح نظام الأخبار
</button>
```

### Frontend — قراءة task_id

```typescript
// في App.tsx
import { useSearchParams } from 'react-router-dom';

export default function App() {
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('task_id');
  
  useEffect(() => {
    if (taskId) {
      api.setTaskId(taskId);
    }
  }, [taskId]);
}
```

### Backend — حفظ task_id

```typescript
// في flow.controller.ts
export async function approveQueueItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;
    const taskId = (req as any).taskId;

    // حفظ مع task_id
    await editorialQueueService.approveItem(
      BigInt(id),
      BigInt(userId),
      taskId ? BigInt(taskId) : null
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

---

## الخلاصة

ربط المهام برقم المستخدم يتطلب:
1. تمرير `task_id` من نظام الإدارة إلى نظام الأخبار
2. قراءة `task_id` من الرابط بالفرونت
3. إضافة `task_id` إلى جميع الطلبات
4. قراءة `task_id` من الهيدر بالـ Backend
5. حفظ `task_id` مع كل عملية

هذا يسمح بتتبع العمليات وربط الأخبار المنشورة بالمهام الأصلية.

---

**آخر تحديث**: 28 أبريل 2026
**الحالة**: جاهز للتطبيق
