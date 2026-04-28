# المرحلة 1 — تسجيل الدخول والهيكل العام

## المطلوب

ابنيلي تطبيق ريأكت كامل وشغال مربوط بسيرفر حقيقي. هاي المرحلة الأولى — فيها صفحة تسجيل الدخول والهيكل العام للموقع (الشريط الجانبي والشريط العلوي والتوجيه بين الصفحات).

**مهم جداً:** مش بدي تصميم بس. بدي كل شي يشتغل فعلياً — تسجيل الدخول يبعث طلب حقيقي للسيرفر ويستقبل توكن ويحفظه ويستخدمه. الإشعارات توصل لحظياً عبر ويب سوكت. التوجيه بين الصفحات يشتغل. الصلاحيات تتحكم بشو يظهر.

---

## معلومات السيرفر

- **الرابط:** `https://media-center-management-system.onrender.com`
- **حساب تجريبي (أدمن):** `gmortaja@najah.edu` / `admin123`
- **حساب تجريبي (موظف):** `a.moqadi@najah.edu` / `a.mo1234`

---

## نظام التصميم

### الألوان
- خلفية رئيسية: `#020617`
- سطح الكروت: `#0b1224`
- اللون المميز: `#2563eb` (أزرق)
- الحدود: `rgba(255, 255, 255, 0.05)`
- نص أساسي: `#ffffff`
- نص ثانوي: `#9ca3af`
- نجاح: `#10b981` (أخضر)
- تحذير: `#f59e0b` (برتقالي)
- خطأ: `#ef4444` (أحمر)

### الخطوط
- عربي: `Almarai` (أوزان: 300, 400, 700, 800)
- إنجليزي: `Inter`
- أرقام: `JetBrains Mono`
- استيراد: `@import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Inter:wght@100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');`

### الاتجاه
- من اليمين لليسار (RTL)
- `direction: rtl` على الـ body

### المكونات
- الأزرار: خلفية `#2563eb`، حدود مدورة `rounded-xl`، ظل `shadow-lg`
- الكروت: خلفية `#0b1224`، حدود `rgba(255, 255, 255, 0.05)`، زوايا `rounded-2xl`
- الحقول: خلفية `rgba(11, 18, 36, 0.6)`، حدود `rgba(255, 255, 255, 0.1)`
- تأثير الزجاج: `backdrop-filter: blur(12px)`

### التقنيات
- React 19 + Vite
- Tailwind CSS 4
- Lucide React (أيقونات)
- Framer Motion (حركات)
- Socket.IO Client (إشعارات لحظية)

---

## صفحة تسجيل الدخول

### التصميم
- صفحة كاملة بخلفية داكنة (`#020617`)
- كرت تسجيل دخول بالمنتصف بتأثير زجاجي
- شعار أو اسم النظام "نظام إدارة مركز الإعلام" بالأعلى
- حقل إيميل + حقل كلمة سر + زر "تسجيل الدخول"
- رسالة خطأ تظهر تحت النموذج إذا فشل الدخول
- حالة تحميل على الزر أثناء الطلب

### الربط بالسيرفر
```
POST https://media-center-management-system.onrender.com/api/auth/login
Content-Type: application/json

{ "email": "...", "password": "..." }
```

الرد الناجح:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 74,
      "name": "غازي مرتجى",
      "email": "gmortaja@najah.edu",
      "roles": [{ "id": 22, "name": "مدير المركز" }]
    }
  }
}
```

الرد الفاشل:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

### بعد تسجيل الدخول
1. حفظ التوكن بالـ localStorage
2. استدعاء نقطة "بياناتي" لجلب الصلاحيات:
```
GET https://media-center-management-system.onrender.com/api/auth/me
Authorization: Bearer TOKEN
```

الرد:
```json
{
  "success": true,
  "data": {
    "id": 74,
    "name": "غازي مرتجى",
    "email": "gmortaja@najah.edu",
    "roles": [{ "id": 22, "name": "مدير المركز" }],
    "permissions": [
      "orders.view", "orders.create", "orders.edit", "orders.delete",
      "tasks.view", "tasks.create", "tasks.assign", "tasks.edit", "tasks.delete",
      "shootings.view", "shootings.create", "shootings.edit",
      "content.view", "content.create", "content.edit", "content.delete", "content.archive",
      "programs.view", "programs.edit",
      "users.view", "users.manage",
      "roles.manage",
      "kpi.view",
      "settings.manage"
    ]
  }
}
```

3. حفظ بيانات المستخدم وصلاحياته بالـ state
4. فتح اتصال ويب سوكت:
```javascript
import { io } from 'socket.io-client';
const socket = io('https://media-center-management-system.onrender.com');
socket.emit('authenticate', token);
socket.on('authenticated', () => { /* متصل */ });
socket.on('notification', (data) => { /* إشعار جديد — حدث العداد */ });
```

5. توجيه المستخدم للصفحة الرئيسية

---

## الهيكل العام (بعد تسجيل الدخول)

### الشريط الجانبي (يمين — لأنه RTL)
- اسم النظام بالأعلى
- قائمة الأقسام — كل قسم بأيقونة واسم:
  - لوحة التحكم (تظهر فقط لمن عنده صلاحية `kpi.view`)
  - الأوردرات
  - المهام
  - المحتوى والأرشيف
  - البرامج والحلقات
  - الأقسام والفرق
  - إدارة المستخدمين (تظهر فقط لمن عنده صلاحية `users.manage`)
  - الصلاحيات (تظهر فقط لمن عنده صلاحية `roles.manage`)
- القسم النشط يكون مميز بلون أزرق وخط جانبي
- الشريط قابل للطي على الشاشات الصغيرة

### الشريط العلوي
- اسم الصفحة الحالية (يسار)
- أيقونة الإشعارات مع فقاعة عدد غير المقروءة (يمين)
- اسم المستخدم مع قائمة منسدلة (بياناتي، تغيير كلمة السر، تسجيل خروج)

### أيقونة الإشعارات
- فقاعة حمراء بالعدد — تتحدث لحظياً من الويب سوكت
- بالضغط عليها تفتح قائمة منسدلة بآخر 5 إشعارات
- كل إشعار فيه: العنوان + الرسالة + الوقت + هل مقروء
- زر "عرض الكل" يوصل لصفحة الإشعارات
- زر "قراءة الكل"

نقاط الوصول:
```
GET /api/notifications/unread-count → { "data": { "unread_count": 3 } }
GET /api/notifications?limit=5 → آخر 5 إشعارات
PATCH /api/notifications/:id/read → تعليم كمقروء
PATCH /api/notifications/read-all → تعليم الكل
```

### صفحة الإشعارات الكاملة
- قائمة بكل الإشعارات مع صفحات
- كل إشعار بيوضح النوع (تعيين مهمة / تغيير حالة / رفع محتوى / موعد قريب)
- الضغط على إشعار يعلمه كمقروء ويوديك للعنصر المرتبط

### تسجيل الخروج
- يمسح التوكن من الـ localStorage
- يقطع اتصال الويب سوكت
- يوجه لصفحة تسجيل الدخول

### حماية الصفحات
- إذا المستخدم مش مسجل دخول (ما في توكن) — يتوجه لصفحة تسجيل الدخول
- إذا التوكن منتهي (السيرفر بيرجع 401) — يتوجه لصفحة تسجيل الدخول
- الصفحات اللي بتحتاج صلاحية معينة — إذا المستخدم ما عنده الصلاحية ما تظهر بالقائمة ولا يقدر يوصلها

---

## الصفحات الفارغة (للمراحل القادمة)

اعمل صفحات فارغة بعنوان بس عشان التوجيه يشتغل:
- `/dashboard` — لوحة التحكم
- `/orders` — الأوردرات
- `/tasks` — المهام
- `/content` — المحتوى والأرشيف
- `/programs` — البرامج والحلقات
- `/departments` — الأقسام والفرق
- `/users` — إدارة المستخدمين
- `/permissions` — الصلاحيات
- `/notifications` — الإشعارات
- `/profile` — بياناتي
- `/change-password` — تغيير كلمة السر

---

## صفحة تغيير كلمة السر

### التصميم
- نموذج بسيط: كلمة السر الحالية + كلمة السر الجديدة + تأكيد كلمة السر الجديدة
- زر "تغيير"
- رسالة نجاح أو خطأ

### الربط
```
POST https://media-center-management-system.onrender.com/api/auth/change-password
Authorization: Bearer TOKEN
Content-Type: application/json

{ "old_password": "...", "new_password": "..." }
```

---

## صفحة بياناتي

### التصميم
- كرت ببيانات المستخدم: الاسم، الإيميل، الأدوار، أيام العمل، وقت البداية والنهاية، آخر تسجيل دخول
- قائمة الصلاحيات

### الربط
البيانات موجودة أصلاً من `GET /api/auth/me` اللي استدعيناها بعد تسجيل الدخول.
