# 📐 معايير الكود والـ Best Practices

**الإصدار:** 1.0.0  
**آخر تحديث:** April 11, 2026

---

## 📋 جدول المحتويات

1. [معايير التسمية](#معايير-التسمية)
2. [هيكل الملفات](#هيكل-الملفات)
3. [معايير الكود](#معايير-الكود)
4. [معالجة الأخطاء](#معالجة-الأخطاء)
5. [التعليقات والتوثيق](#التعليقات-والتوثيق)
6. [الأداء والتحسينات](#الأداء-والتحسينات)
7. [الأمان](#الأمان)
8. [الاختبارات](#الاختبارات)

---

## 🏷️ معايير التسمية

### ملفات TypeScript

```typescript
// ✅ صحيح
src/services/user.service.ts
src/controllers/auth.controller.ts
src/models/user.models.ts
src/types/user.types.ts
src/routes/user.routes.ts

// ❌ خطأ
src/services/UserService.ts
src/controllers/authController.ts
src/models/UserModels.ts
```

### المتغيرات والثوابت

```typescript
// ✅ صحيح - camelCase
const userName = 'Ahmed';
let userCount = 0;
const MAX_RETRIES = 3;
const API_TIMEOUT = 5000;

// ❌ خطأ
const user_name = 'Ahmed';
const UserCount = 0;
const max_retries = 3;
```

### الـ Classes والـ Interfaces

```typescript
// ✅ صحيح - PascalCase
class UserService {
  async getUser(id: number): Promise<User> {}
}

interface IUser {
  id: number;
  name: string;
}

// ❌ خطأ
class userService {
  async getUser(id: number): Promise<user> {}
}

interface user {
  id: number;
  name: string;
}
```

### الدوال

```typescript
// ✅ صحيح - camelCase + فعل
async function getUserById(id: number): Promise<User> {}
function validateEmail(email: string): boolean {}
function calculateTotal(items: Item[]): number {}

// ❌ خطأ
async function get_user_by_id(id: number): Promise<User> {}
function email_validation(email: string): boolean {}
function total(items: Item[]): number {}
```

### قاعدة البيانات

```sql
-- ✅ صحيح - snake_case
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  user_name VARCHAR(100) NOT NULL,
  email_address VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ❌ خطأ
CREATE TABLE Users (
  userId SERIAL PRIMARY KEY,
  userName VARCHAR(100) NOT NULL,
  emailAddress VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## 📁 هيكل الملفات

### تنظيم المجلدات

```
src/
├── config/              # إعدادات عامة
├── controllers/         # معالجات الطلبات
├── middleware/          # Middleware
├── models/              # نماذج البيانات
├── routes/              # مسارات API
├── services/            # منطق الأعمال
├── types/               # تعريفات TypeScript
├── utils/               # دوال مساعدة
└── index.ts             # نقطة البداية
```

### ملف الـ Service

```typescript
/**
 * User Service
 * خدمة إدارة المستخدمين
 */

import { query } from '../config/database';
import { User } from '../models/user.models';

export class UserService {
  /**
   * الحصول على جميع المستخدمين
   */
  static async getAll(): Promise<User[]> {
    const result = await query('SELECT * FROM users ORDER BY user_id');
    return result.rows;
  }

  /**
   * الحصول على مستخدم بالـ ID
   */
  static async getById(id: number): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE user_id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * إنشاء مستخدم جديد
   */
  static async create(userData: Omit<User, 'id'>): Promise<User> {
    const { name, email } = userData;
    const result = await query(
      'INSERT INTO users (user_name, email_address) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    return result.rows[0];
  }
}
```

### ملف الـ Controller

```typescript
/**
 * User Controller
 * معالج طلبات المستخدمين
 */

import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  /**
   * الحصول على جميع المستخدمين
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserService.getAll();
      res.json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
    }
  }

  /**
   * الحصول على مستخدم بالـ ID
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserService.getById(parseInt(id));

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'المستخدم غير موجود',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
      });
    }
  }
}
```

### ملف الـ Routes

```typescript
/**
 * User Routes
 * مسارات المستخدمين
 */

import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();

/**
 * GET /api/users - الحصول على جميع المستخدمين
 */
router.get('/', UserController.getAllUsers);

/**
 * GET /api/users/:id - الحصول على مستخدم بالـ ID
 */
router.get('/:id', UserController.getUserById);

export default router;
```

---

## 💻 معايير الكود

### الطول والتعقيد

```typescript
// ✅ صحيح - دالة بسيطة وواضحة
async function getUserById(id: number): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE user_id = $1', [id]);
  return result.rows[0] || null;
}

// ❌ خطأ - دالة معقدة جداً
async function getUserById(id: number): Promise<User | null> {
  try {
    const result = await query('SELECT * FROM users WHERE user_id = $1', [id]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (user.is_active) {
        const profile = await query('SELECT * FROM profiles WHERE user_id = $1', [id]);
        if (profile.rows.length > 0) {
          return { ...user, profile: profile.rows[0] };
        }
      }
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
```

### استخدام const و let

```typescript
// ✅ صحيح
const MAX_USERS = 100;  // لا يتغير
let userCount = 0;      // قد يتغير

// ❌ خطأ
var MAX_USERS = 100;    // تجنب var
let MAX_USERS = 100;    // استخدم const للثوابت
```

### الـ Arrow Functions

```typescript
// ✅ صحيح
const users = data.map((item) => item.name);
const filtered = data.filter((item) => item.active);

// ❌ خطأ
const users = data.map(item => item.name);  // أضف أقواس
const filtered = data.filter(item => item.active);
```

### الـ Async/Await

```typescript
// ✅ صحيح
async function fetchData(): Promise<Data[]> {
  try {
    const result = await query('SELECT * FROM data');
    return result.rows;
  } catch (error) {
    console.error('خطأ:', error);
    throw error;
  }
}

// ❌ خطأ
function fetchData(): Promise<Data[]> {
  return query('SELECT * FROM data').then((result) => result.rows);
}
```

---

## ⚠️ معالجة الأخطاء

### في الـ Services

```typescript
// ✅ صحيح
static async getUser(id: number): Promise<User | null> {
  try {
    const result = await query('SELECT * FROM users WHERE user_id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ خطأ في جلب المستخدم:', error);
    throw error;  // رمي الخطأ للـ controller
  }
}

// ❌ خطأ
static async getUser(id: number): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE user_id = $1', [id]);
  return result.rows[0] || null;  // لا تتعامل مع الأخطاء
}
```

### في الـ Controllers

```typescript
// ✅ صحيح
static async getUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = await UserService.getById(parseInt(id));

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('❌ خطأ:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

// ❌ خطأ
static async getUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = await UserService.getById(parseInt(id));
  res.json({ success: true, data: user });  // لا تتعامل مع الأخطاء
}
```

---

## 📝 التعليقات والتوثيق

### JSDoc Comments

```typescript
/**
 * الحصول على مستخدم بالـ ID
 * 
 * @param id - معرف المستخدم
 * @returns المستخدم أو null إذا لم يوجد
 * @throws خطأ في قاعدة البيانات
 * 
 * @example
 * const user = await UserService.getById(1);
 * console.log(user.name);
 */
static async getById(id: number): Promise<User | null> {
  // ...
}
```

### التعليقات الداخلية

```typescript
// ✅ صحيح - تعليقات واضحة
async function processUsers(users: User[]): Promise<void> {
  // تصفية المستخدمين النشطين فقط
  const activeUsers = users.filter((u) => u.is_active);

  // معالجة كل مستخدم
  for (const user of activeUsers) {
    await updateUserProfile(user);
  }
}

// ❌ خطأ - تعليقات غير مفيدة
async function processUsers(users: User[]): Promise<void> {
  // حلقة
  for (const user of users) {
    // تحديث
    await updateUserProfile(user);
  }
}
```

### التعليقات بالعربية

```typescript
// ✅ صحيح - استخدم العربية للوضوح
/**
 * خدمة إدارة المستخدمين
 * تتعامل مع جميع عمليات المستخدمين
 */
export class UserService {
  // الحصول على جميع المستخدمين
  static async getAll(): Promise<User[]> {}
}

// ❌ تجنب الخليط
/**
 * User Management Service
 * يتعامل مع جميع عمليات المستخدمين
 */
```

---

## ⚡ الأداء والتحسينات

### استخدام Connection Pooling

```typescript
// ✅ صحيح - استخدم Pool
import pool from '../config/database';

const result = await pool.query('SELECT * FROM users');

// ❌ خطأ - لا تنشئ اتصال جديد في كل مرة
const client = new Client(connectionString);
await client.connect();
const result = await client.query('SELECT * FROM users');
await client.end();
```

### استخدام Indexes

```sql
-- ✅ صحيح - أضف indexes للأعمدة المستخدمة في البحث
CREATE INDEX idx_users_email ON users(email_address);
CREATE INDEX idx_articles_source ON raw_data(source_id);
CREATE INDEX idx_articles_category ON raw_data(category_id);

-- ❌ خطأ - لا تستخدم indexes
SELECT * FROM users WHERE email_address = 'test@example.com';
```

### استخدام Pagination

```typescript
// ✅ صحيح - استخدم pagination للبيانات الكبيرة
async function getArticles(limit: number = 20, offset: number = 0): Promise<Article[]> {
  const result = await query(
    'SELECT * FROM raw_data ORDER BY fetched_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
}

// ❌ خطأ - جلب جميع البيانات
async function getArticles(): Promise<Article[]> {
  const result = await query('SELECT * FROM raw_data');
  return result.rows;
}
```

### استخدام Caching

```typescript
// ✅ صحيح - استخدم caching للبيانات الثابتة
class CategoryService {
  private static cache: Map<number, Category> = new Map();

  static async getById(id: number): Promise<Category | null> {
    // تحقق من الـ cache أولاً
    if (this.cache.has(id)) {
      return this.cache.get(id) || null;
    }

    // جلب من قاعدة البيانات
    const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
    const category = result.rows[0] || null;

    // احفظ في الـ cache
    if (category) {
      this.cache.set(id, category);
    }

    return category;
  }
}
```

---

## 🔐 الأمان

### Parameterized Queries

```typescript
// ✅ صحيح - استخدم parameterized queries
const result = await query(
  'SELECT * FROM users WHERE email_address = $1',
  [email]
);

// ❌ خطأ - SQL Injection
const result = await query(
  `SELECT * FROM users WHERE email_address = '${email}'`
);
```

### التحقق من المدخلات

```typescript
// ✅ صحيح - تحقق من المدخلات
static async createUser(req: Request, res: Response): Promise<void> {
  const { name, email } = req.body;

  // التحقق من المدخلات
  if (!name || !email) {
    res.status(400).json({
      success: false,
      error: 'الاسم والبريد الإلكتروني مطلوبان',
    });
    return;
  }

  // التحقق من صيغة البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      error: 'صيغة البريد الإلكتروني غير صحيحة',
    });
    return;
  }

  // إنشاء المستخدم
  const user = await UserService.create({ name, email });
  res.status(201).json({ success: true, data: user });
}

// ❌ خطأ - لا تتحقق من المدخلات
static async createUser(req: Request, res: Response): Promise<void> {
  const user = await UserService.create(req.body);
  res.json({ success: true, data: user });
}
```

### استخدام Environment Variables

```typescript
// ✅ صحيح - استخدم environment variables
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;

// ❌ خطأ - لا تضع البيانات الحساسة في الكود
const dbUrl = 'postgresql://user:password@host/db';
const apiKey = 'sk_live_1234567890';
```

---

## 🧪 الاختبارات

### هيكل الاختبار

```typescript
// ✅ صحيح - اختبار منظم
describe('UserService', () => {
  describe('getById', () => {
    it('يجب أن يرجع مستخدم عند وجوده', async () => {
      const user = await UserService.getById(1);
      expect(user).toBeDefined();
      expect(user?.id).toBe(1);
    });

    it('يجب أن يرجع null عند عدم وجود المستخدم', async () => {
      const user = await UserService.getById(999);
      expect(user).toBeNull();
    });
  });
});
```

### اختبار الـ Controllers

```typescript
// ✅ صحيح - اختبار الـ controller
describe('UserController', () => {
  it('يجب أن يرجع جميع المستخدمين', async () => {
    const req = {} as Request;
    const res = {
      json: jest.fn(),
    } as unknown as Response;

    await UserController.getAllUsers(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.any(Array),
      })
    );
  });
});
```

---

## 📋 قائمة التحقق قبل الـ Commit

- [ ] الكود يتبع معايير التسمية
- [ ] لا توجد أخطاء TypeScript
- [ ] معالجة الأخطاء موجودة
- [ ] التعليقات واضحة ومفيدة
- [ ] لا توجد console.log في الكود الإنتاجي
- [ ] الاختبارات تمر بنجاح
- [ ] الكود يتبع معايير الأمان
- [ ] لا توجد بيانات حساسة في الكود

---

## 🔗 المراجع

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**تم إعداد هذا الملف بواسطة:** Kiro  
**آخر تحديث:** April 11, 2026
