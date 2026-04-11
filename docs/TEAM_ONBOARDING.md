# 👥 Team Onboarding Guide - Media Center Management System

**الإصدار:** 1.0.0  
**آخر تحديث:** April 11, 2026  
**الحالة:** ✅ جاهز للعمل الجماعي

---

## 🎯 مرحباً بك في الفريق!

هذا الملف يحتوي على كل ما تحتاجه للبدء في العمل على المشروع. اتبع الخطوات بالترتيب.

---

## 📋 جدول المحتويات

1. [المتطلبات](#المتطلبات)
2. [الإعداد الأولي](#الإعداد-الأولي)
3. [بنية المشروع](#بنية-المشروع)
4. [البدء السريع](#البدء-السريع)
5. [معايير العمل](#معايير-العمل)
6. [الأوامر المهمة](#الأوامر-المهمة)
7. [الموارد والمراجع](#الموارس-والمراجع)

---

## 💻 المتطلبات

### البرامج المطلوبة

```bash
# تحقق من الإصدارات
node --version      # يجب أن يكون 16+ أو أحدث
npm --version       # يجب أن يكون 8+ أو أحدث
git --version       # للتحكم بالإصدارات
```

### التثبيت

**على Windows:**
1. حمل [Node.js](https://nodejs.org/) (LTS)
2. حمل [Git](https://git-scm.com/)
3. حمل محرر نصوص مثل [VS Code](https://code.visualstudio.com/)

**على macOS:**
```bash
# استخدم Homebrew
brew install node git
```

**على Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install nodejs npm git

# Fedora
sudo dnf install nodejs npm git
```

---

## 🚀 الإعداد الأولي

### 1. استنساخ المشروع

```bash
# استنساخ المشروع من GitHub
git clone <repository-url>

# الانتقال إلى مجلد المشروع
cd media-center-management-system
```

### 2. تثبيت المكتبات

```bash
# تثبيت مكتبات Backend
npm install

# تثبيت مكتبات Frontend (اختياري في البداية)
cd frontend
npm install
cd ..
```

### 3. إعداد متغيرات البيئة

```bash
# نسخ ملف المثال
cp .env.example .env

# تحرير الملف وتأكد من البيانات
# DATABASE_URL يجب أن يكون موجوداً بالفعل
```

### 4. اختبار الاتصال

```bash
# اختبر الاتصال بقاعدة البيانات
npm run db:test

# يجب أن ترى رسالة نجاح
# ✅ تم الاتصال بقاعدة البيانات بنجاح
```

### 5. تشغيل الخادم

```bash
# شغل الخادم في وضع التطوير
npm run dev

# يجب أن ترى:
# ✅ Server running on port 3000
# 📝 Environment: development
```

### 6. التحقق من الـ API

افتح المتصفح وزر:
```
http://localhost:3000/api
```

يجب أن ترى JSON يحتوي على معلومات الـ API.

---

## 📁 بنية المشروع

### Backend (الخادم)

```
src/
├── config/              # إعدادات (database, environment)
├── controllers/         # معالجات الطلبات
├── models/              # نماذج البيانات
├── routes/              # مسارات API
├── services/            # منطق الأعمال
├── types/               # تعريفات TypeScript
├── utils/               # دوال مساعدة
└── index.ts             # نقطة البداية
```

**الملفات المهمة:**
- `src/index.ts` - نقطة البداية الرئيسية
- `src/config/database.ts` - إعدادات قاعدة البيانات
- `src/config/environment.ts` - متغيرات البيئة
- `.env` - بيانات الاتصال (حساس - لا تشاركه)

### Frontend (الواجهة)

```
frontend/
├── public/              # ملفات ثابتة
├── src/
│   ├── components/      # مكونات React
│   ├── pages/           # الصفحات
│   ├── services/        # خدمات API
│   ├── types/           # تعريفات TypeScript
│   ├── styles/          # ملفات CSS
│   └── App.tsx          # المكون الرئيسي
└── package.json         # المكتبات
```

---

## 🎯 البدء السريع

### الخطوة 1: فهم البنية

اقرأ هذه الملفات بالترتيب:
1. `README.md` - نظرة عامة على المشروع
2. `PROJECT_STRUCTURE_AND_SETUP.md` - بنية المشروع التفصيلية
3. `DATABASE_SCHEMA.md` - معلومات قاعدة البيانات
4. `CODING_STANDARDS.md` - معايير الكود

### الخطوة 2: استكشاف الكود

```bash
# افتح المشروع في VS Code
code .

# استكشف الملفات:
# - src/index.ts (نقطة البداية)
# - src/config/database.ts (الاتصال بقاعدة البيانات)
# - src/services/database/database.service.ts (الخدمات)
# - src/controllers/news/data.controller.ts (معالجات الطلبات)
```

### الخطوة 3: تشغيل الأوامر

```bash
# اختبر الأوامر المختلفة
npm run dev              # تشغيل الخادم
npm run db:test         # اختبار قاعدة البيانات
npm run build           # بناء المشروع
npm run lint            # فحص الكود
```

### الخطوة 4: اختبر الـ API

استخدم Postman أو curl:

```bash
# الحصول على جميع المصادر
curl http://localhost:3000/api/data/sources

# الحصول على جميع الأخبار
curl http://localhost:3000/api/data/articles

# الحصول على الإحصائيات
curl http://localhost:3000/api/data/statistics
```

---

## 📐 معايير العمل

### قواعس التسمية

**الملفات:**
```
✅ صحيح:
- user.service.ts
- auth.controller.ts
- user.types.ts

❌ خطأ:
- UserService.ts
- authController.ts
- userTypes.ts
```

**المتغيرات:**
```typescript
✅ صحيح:
const userName = 'Ahmed';
const MAX_RETRIES = 3;

❌ خطأ:
const user_name = 'Ahmed';
const max_retries = 3;
```

**الـ Classes:**
```typescript
✅ صحيح:
class UserService {}
interface IUser {}

❌ خطأ:
class userService {}
interface user {}
```

### معالجة الأخطاء

```typescript
// ✅ صحيح
try {
  const result = await query('SELECT * FROM users');
  res.json({ success: true, data: result.rows });
} catch (error) {
  console.error('❌ خطأ:', error);
  res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : 'خطأ غير معروف'
  });
}
```

### التعليقات

```typescript
/**
 * وصف الدالة بالعربية
 * 
 * @param id - معرف المستخدم
 * @returns بيانات المستخدم
 */
async function getUser(id: number): Promise<User> {
  // تعليق توضيحي
}
```

---

## 🛠️ الأوامر المهمة

### تطوير

```bash
# تشغيل الخادم في وضع التطوير
npm run dev

# بناء المشروع
npm run build

# تشغيل المشروع المبني
npm start
```

### قاعدة البيانات

```bash
# اختبار الاتصال
npm run db:test

# سحب أخبار RSS
npm run rss:fetch

# تصنيف الأخبار
npm run classify

# بدء جدولة المهام
npm run scheduler
```

### الجودة

```bash
# فحص الكود
npm run lint

# تشغيل الاختبارات
npm run test

# تشغيل الاختبارات مع المراقبة
npm run test:watch
```

---

## 📚 الموارد والمراجع

### الملفات المهمة في المشروع

| الملف | الوصف |
|------|-------|
| `PROJECT_STRUCTURE_AND_SETUP.md` | بنية المشروع والإعداد |
| `DATABASE_SCHEMA.md` | معلومات قاعدة البيانات |
| `CODING_STANDARDS.md` | معايير الكود |
| `API_DOCUMENTATION.md` | توثيق الـ API |
| `frontend/README.md` | معلومات الفرونت |

### الموارد الخارجية

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Documentation](https://react.dev)

---

## 🔐 نصائح الأمان

### ✅ افعل

- استخدم متغيرات البيئة للبيانات الحساسة
- تحقق من صحة المدخلات دائماً
- استخدم parameterized queries
- أضف معالجة أخطاء شاملة
- استخدم HTTPS في الإنتاج

### ❌ لا تفعل

- لا تضع كلمات المرور في الكود
- لا تشارك ملف `.env`
- لا تستخدم `eval()` أو `exec()`
- لا تثق بالمدخلات من المستخدم
- لا تسجل بيانات حساسة

---

## 🤝 سير العمل الجماعي

### قبل البدء في العمل

```bash
# تحديث الكود من الـ repository
git pull origin main

# إنشاء فرع جديد للميزة
git checkout -b feature/your-feature-name
```

### أثناء العمل

```bash
# تأكد من أن الكود يتبع المعايير
npm run lint

# اختبر التغييرات
npm run test

# بناء المشروع
npm run build
```

### قبل الـ Commit

```bash
# أضف الملفات المتغيرة
git add .

# اكتب رسالة واضحة
git commit -m "feat: إضافة ميزة جديدة"

# ادفع التغييرات
git push origin feature/your-feature-name
```

### رسائل الـ Commit

```
✅ صحيح:
- feat: إضافة ميزة جديدة
- fix: إصلاح خطأ في المصادقة
- docs: تحديث التوثيق
- refactor: إعادة هيكلة الكود
- test: إضافة اختبارات

❌ خطأ:
- updated code
- fixed stuff
- changes
```

---

## 🆘 استكشاف الأخطاء الشائعة

### خطأ: "Cannot find module"

```bash
# الحل:
npm install
npm run build
```

### خطأ: "Database connection failed"

```bash
# تحقق من:
1. DATABASE_URL في .env
2. الاتصال بالإنترنت
3. أن قاعدة البيانات نشطة

# اختبر:
npm run db:test
```

### خطأ: "Port already in use"

```bash
# الحل:
# غير المنفذ في .env
PORT=3001

# أو أغلق العملية:
# Windows: taskkill /PID <pid> /F
# macOS/Linux: kill -9 <pid>
```

### خطأ: "TypeScript compilation error"

```bash
# الحل:
npm run build

# تحقق من الأخطاء وأصلحها
# اتبع معايير الكود
```

---

## 📞 التواصل والدعم

### عند وجود مشكلة

1. **ابحث في الملفات:**
   - `PROJECT_STRUCTURE_AND_SETUP.md`
   - `CODING_STANDARDS.md`
   - `DATABASE_SCHEMA.md`

2. **اختبر الأوامر:**
   ```bash
   npm run db:test
   npm run build
   npm run lint
   ```

3. **اطلب المساعدة من الفريق:**
   - اشرح المشكلة بوضوح
   - أرسل رسالة الخطأ
   - شارك الكود ذي الصلة

---

## ✅ قائمة التحقق للبدء

- [ ] تثبيت Node.js و npm
- [ ] استنساخ المشروع
- [ ] تشغيل `npm install`
- [ ] نسخ `.env.example` إلى `.env`
- [ ] تشغيل `npm run db:test`
- [ ] تشغيل `npm run dev`
- [ ] زيارة `http://localhost:3000/api`
- [ ] قراءة `PROJECT_STRUCTURE_AND_SETUP.md`
- [ ] قراءة `CODING_STANDARDS.md`
- [ ] فهم بنية المشروع

---

## 🎓 الخطوات التالية

بعد الإعداد الأولي:

1. **استكشف الكود:**
   - اقرأ `src/index.ts`
   - افهم كيفية عمل الـ services
   - استكشف الـ controllers

2. **جرب الـ API:**
   - استخدم Postman أو curl
   - اختبر جميع الـ endpoints
   - افهم البيانات المرجعة

3. **ابدأ بمهمة صغيرة:**
   - أضف ميزة صغيرة
   - أصلح خطأ بسيط
   - اكتب اختبار

4. **تعاون مع الفريق:**
   - اطرح الأسئلة
   - شارك الأفكار
   - ساعد الآخرين

---

## 📝 ملاحظات مهمة

### البيانات الحساسة

```
⚠️ لا تشارك:
- ملف .env
- كلمات المرور
- مفاتيح API
- بيانات المستخدمين
```

### الأداء

```
💡 نصائح:
- استخدم pagination للبيانات الكبيرة
- أضف indexes لقاعدة البيانات
- استخدم caching عند الحاجة
- راقب استهلاك الذاكرة
```

### الأمان

```
🔒 تذكر:
- تحقق من المدخلات دائماً
- استخدم parameterized queries
- أضف معالجة أخطاء شاملة
- استخدم HTTPS في الإنتاج
```

---

## 🎉 مرحباً بك مجدداً!

أنت الآن جاهز للبدء في العمل على المشروع. إذا كان لديك أي أسئلة، لا تتردد في طلب المساعدة من الفريق.

**حظاً موفقاً! 🚀**

---

**تم إعداد هذا الملف بواسطة:** Kiro  
**آخر تحديث:** April 11, 2026
