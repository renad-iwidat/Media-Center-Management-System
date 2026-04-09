# 🎯 Best Practices - Database Usage

## أفضل الممارسات عند استخدام قاعدة البيانات

---

## 1️⃣ الاتصال والأداء

### ✅ استخدم Connection Pool
```typescript
// ✅ صحيح - استخدام Pool
import { query } from './config/database';
const result = await query('SELECT * FROM sources');

// ❌ خطأ - إنشاء اتصال جديد في كل مرة
const client = new Client();
await client.connect();
```

### ✅ أغلق الاتصالات بشكل صحيح
```typescript
// ✅ صحيح
import { getClient } from './config/database';
const client = await getClient();
try {
  // استخدم الـ client
} finally {
  client.release();
}

// ❌ خطأ - عدم إغلاق الاتصال
const client = await getClient();
// استخدم الـ client بدون release
```

---

## 2️⃣ الاستعلامات والأمان

### ✅ استخدم Parameterized Queries
```typescript
// ✅ صحيح - آمن من SQL Injection
const result = await query(
  'SELECT * FROM sources WHERE id = $1',
  [1]
);

// ❌ خطأ - عرضة للـ SQL Injection
const result = await query(
  `SELECT * FROM sources WHERE id = ${id}`
);
```

### ✅ تحقق من المدخلات
```typescript
// ✅ صحيح
import Joi from 'joi';

const schema = Joi.object({
  name: Joi.string().required(),
  url: Joi.string().uri().required(),
});

const { error, value } = schema.validate(data);
if (error) throw error;

// ❌ خطأ - بدون تحقق
const source = await SourceService.create(name, url);
```

---

## 3️⃣ معالجة الأخطاء

### ✅ معالجة الأخطاء بشكل صحيح
```typescript
// ✅ صحيح
try {
  const source = await SourceService.create(
    source_type_id,
    url,
    name,
    true
  );
  console.log('✅ تم إنشاء المصدر:', source);
} catch (error) {
  if (error.code === '23505') {
    console.error('❌ المصدر موجود بالفعل');
  } else {
    console.error('❌ خطأ:', error.message);
  }
}

// ❌ خطأ - بدون معالجة
const source = await SourceService.create(source_type_id, url, name, true);
```

### ✅ استخدم ON CONFLICT
```typescript
// ✅ صحيح - التعامل مع التكرارات
const result = await query(`
  INSERT INTO source_types (name) 
  VALUES ($1) 
  ON CONFLICT (name) DO NOTHING 
  RETURNING *
`, ['RSS']);

// ❌ خطأ - قد يفشل إذا كانت البيانات موجودة
const result = await query(
  'INSERT INTO source_types (name) VALUES ($1)',
  ['RSS']
);
```

---

## 4️⃣ الأداء والاستعلامات

### ✅ استخدم Indexes
```sql
-- ✅ صحيح - استعلام سريع
SELECT * FROM sources WHERE id = 1;

-- ❌ بطيء - بدون index
SELECT * FROM raw_data WHERE content LIKE '%search%';
```

### ✅ استخدم LIMIT و OFFSET
```typescript
// ✅ صحيح - استعلام محدود
const result = await query(
  'SELECT * FROM raw_data LIMIT 10 OFFSET 0'
);

// ❌ بطيء - جلب جميع البيانات
const result = await query('SELECT * FROM raw_data');
```

### ✅ استخدم SELECT محدد
```typescript
// ✅ صحيح - جلب الأعمدة المطلوبة فقط
const result = await query(
  'SELECT id, title, url FROM raw_data'
);

// ❌ بطيء - جلب جميع الأعمدة
const result = await query('SELECT * FROM raw_data');
```

---

## 5️⃣ العمليات الدفعية

### ✅ استخدم Batch Operations
```typescript
// ✅ صحيح - عملية دفعية واحدة
const result = await query(`
  INSERT INTO sources (source_type_id, url, name, is_active, created_at)
  VALUES 
    ($1, $2, $3, $4, NOW()),
    ($5, $6, $7, $8, NOW()),
    ($9, $10, $11, $12, NOW())
  RETURNING *
`, [1, 'url1', 'name1', true, 1, 'url2', 'name2', true, 1, 'url3', 'name3', true]);

// ❌ بطيء - عمليات منفصلة
for (let i = 0; i < 3; i++) {
  await SourceService.create(1, `url${i}`, `name${i}`, true);
}
```

### ✅ استخدم Transactions
```typescript
// ✅ صحيح - عملية آمنة
const client = await getClient();
try {
  await client.query('BEGIN');
  
  const source = await client.query(
    'INSERT INTO sources (...) VALUES (...) RETURNING *'
  );
  
  const rawData = await client.query(
    'INSERT INTO raw_data (...) VALUES (...) RETURNING *'
  );
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

---

## 6️⃣ التخزين المؤقت (Caching)

### ✅ استخدم Caching
```typescript
// ✅ صحيح - تخزين مؤقت
let cachedCategories: Category[] | null = null;
let cacheTime = 0;

async function getCategories() {
  const now = Date.now();
  
  // استخدم الـ cache إذا كان حديثاً (أقل من 5 دقائق)
  if (cachedCategories && now - cacheTime < 5 * 60 * 1000) {
    return cachedCategories;
  }
  
  // جلب من قاعدة البيانات
  cachedCategories = await CategoryService.getAll();
  cacheTime = now;
  
  return cachedCategories;
}

// ❌ بطيء - بدون caching
async function getCategories() {
  return await CategoryService.getAll();
}
```

---

## 7️⃣ التسجيل والمراقبة

### ✅ سجّل العمليات المهمة
```typescript
// ✅ صحيح
async function createSource(data: any) {
  console.log('📝 إنشاء مصدر جديد:', data);
  
  try {
    const source = await SourceService.create(...);
    console.log('✅ تم إنشاء المصدر:', source.id);
    return source;
  } catch (error) {
    console.error('❌ فشل إنشاء المصدر:', error);
    throw error;
  }
}

// ❌ بدون تسجيل
async function createSource(data: any) {
  return await SourceService.create(...);
}
```

---

## 8️⃣ الأمان والتحقق

### ✅ تحقق من الصلاحيات
```typescript
// ✅ صحيح
async function deleteSource(id: number, userId: number) {
  // تحقق من الصلاحيات
  const user = await getUserById(userId);
  if (!user.isAdmin) {
    throw new Error('ليس لديك صلاحيات');
  }
  
  return await query('DELETE FROM sources WHERE id = $1', [id]);
}

// ❌ خطأ - بدون تحقق من الصلاحيات
async function deleteSource(id: number) {
  return await query('DELETE FROM sources WHERE id = $1', [id]);
}
```

### ✅ استخدم Environment Variables
```typescript
// ✅ صحيح
const DATABASE_URL = process.env.DATABASE_URL;

// ❌ خطأ - كلمة المرور مكشوفة
const DATABASE_URL = 'postgresql://user:password@host/db';
```

---

## 9️⃣ الاختبار

### ✅ اختبر الخدمات
```typescript
// ✅ صحيح
describe('SourceService', () => {
  it('should create a source', async () => {
    const source = await SourceService.create(1, 'https://example.com', 'Test', true);
    expect(source.id).toBeDefined();
    expect(source.name).toBe('Test');
  });
});

// ❌ بدون اختبارات
// لا توجد اختبارات
```

---

## 🔟 التوثيق

### ✅ وثّق الدوال
```typescript
// ✅ صحيح
/**
 * إنشاء مصدر جديد
 * @param source_type_id - معرف نوع المصدر
 * @param url - رابط المصدر
 * @param name - اسم المصدر
 * @param is_active - هل المصدر فعال
 * @returns المصدر المنشأ
 */
async function create(
  source_type_id: number,
  url: string,
  name: string,
  is_active: boolean = true
): Promise<Source> {
  // ...
}

// ❌ بدون توثيق
async function create(source_type_id, url, name, is_active) {
  // ...
}
```

---

## 📋 قائمة التحقق

- [ ] استخدام Connection Pool
- [ ] استخدام Parameterized Queries
- [ ] معالجة الأخطاء بشكل صحيح
- [ ] استخدام ON CONFLICT
- [ ] استخدام Indexes
- [ ] استخدام LIMIT و OFFSET
- [ ] استخدام Batch Operations
- [ ] استخدام Transactions
- [ ] استخدام Caching
- [ ] تسجيل العمليات المهمة
- [ ] التحقق من الصلاحيات
- [ ] استخدام Environment Variables
- [ ] كتابة الاختبارات
- [ ] توثيق الدوال

---

## 🔗 المراجع

- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Node.js pg Documentation](https://node-postgres.com/)
- [SQL Injection Prevention](https://owasp.org/www-community/attacks/SQL_Injection)
