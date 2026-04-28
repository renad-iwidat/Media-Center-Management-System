# المرحلة 5 — البرامج والحلقات والأقسام والفرق

## المطلوب

ابنيلي صفحات البرامج والحلقات والضيوف والأقسام والفرق كاملة وشغالة. كل نموذج يبعث بيانات حقيقية للسيرفر. لا تستخدم خطوط عربية مائلة.

**السيرفر:** `https://media-center-management-system.onrender.com`
**كل الطلبات لازم يكون معها:** `Authorization: Bearer TOKEN`

---

## صفحة البرامج والحلقات `/programs`

### تبويبين: "البرامج" و "الحلقات"

---

### تبويب البرامج

#### جلب البرامج
```
GET /api/portal/programs
```
الرد فيه: اسم البرنامج + الوصف + الوحدة الإعلامية + وقت البث

#### التصميم
- كروت أو جدول: اسم البرنامج + الوحدة الإعلامية + وقت البث + عدد الحلقات
- زر "برنامج جديد"
- الضغط على برنامج يفتح تفاصيله

#### إنشاء برنامج
```
POST /api/portal/programs
{ "title": "...", "description": "...", "media_unit_id": 1, "air_time": "20:00" }
```
الوحدات الإعلامية من: `GET /api/portal/media-units`

#### تفاصيل البرنامج
```
GET /api/portal/programs/:id/with-episodes
GET /api/portal/programs/:id/with-roles
```

التصميم — 3 أقسام:

**معلومات البرنامج:** الاسم + الوصف + الوحدة الإعلامية + وقت البث + أزرار تعديل وحذف

**الحلقات:** جدول بحلقات البرنامج (العنوان + رقم الحلقة + تاريخ البث + الحالة). زر "حلقة جديدة".

**فريق العمل:** جدول بأعضاء الفريق (الاسم + الدور: مذيع/معد/منتج...). زر "إضافة عضو".

إضافة عضو للفريق:
```
POST /api/portal/program-roles
{ "program_id": 48, "user_id": 46, "role_id": 11 }
```
المستخدمين من: `GET /api/portal/users`
الأدوار من: `GET /api/portal/roles`

---

### تبويب الحلقات

#### جلب الحلقات المخصبة
```
GET /api/portal/episodes/enriched?limit=20&offset=0
```
الرد فيه: اسم الحلقة + اسم البرنامج + الحالة (من الأوردر) + عدد الضيوف + عدد المحتوى

#### التصميم
- جدول: اسم الحلقة + البرنامج + رقم الحلقة + تاريخ البث + الحالة (بلون) + عدد الضيوف + عدد المحتوى
- فلترة حسب البرنامج: `GET /api/portal/episodes?program_id=48`
- الضغط على حلقة يفتح تفاصيلها

#### تفاصيل الحلقة
```
GET /api/portal/episodes/:id/full
```
الرد فيه: بيانات الحلقة + الضيوف + المهام + المحتوى

التصميم — 4 أقسام:

**معلومات الحلقة:** العنوان + البرنامج + رقم الحلقة + تاريخ البث + الحالة (محسوبة من الأوردر). أزرار تعديل وحذف.

**الضيوف:** جدول (الاسم + اللقب + الهاتف). زر "إضافة ضيف".
```
POST /api/portal/episodes/:id/guests
{ "guest_id": 5 }
```
```
DELETE /api/portal/episodes/:id/guests/:guestId
```
البحث عن ضيف: `GET /api/portal/guests/search?query=أحمد`

**المهام المرتبطة:** إذا الحلقة مرتبطة بأوردر — اعرض المهام (من الرد).

**المحتوى المنتج:** إذا في محتوى مرتبط — اعرضه (من الرد).

#### إنشاء حلقة
```
POST /api/portal/episodes
{ "program_id": 48, "title": "...", "episode_number": 5, "air_date": "2026-05-01" }
```

---

## إدارة الضيوف

### من داخل صفحة الحلقة
- البحث عن ضيف موجود وإضافته
- أو إنشاء ضيف جديد:
```
POST /api/portal/guests
{ "name": "...", "title": "محلل سياسي", "bio": "...", "phone": "..." }
```

### جلب كل الضيوف
```
GET /api/portal/guests
```

### بحث
```
GET /api/portal/guests/search?query=أحمد
```

---

## صفحة الأقسام والفرق `/departments`

### تبويبين: "الأقسام" و "الفرق"

---

### تبويب الأقسام

#### جلب الأقسام
```
GET /api/portal/desks
```
الرد فيه: اسم القسم + الوصف + اسم المدير

#### التصميم
- كروت أو جدول: اسم القسم + المدير + عدد الفرق
- زر "قسم جديد"
- الضغط على قسم يفتح تفاصيله

#### إنشاء قسم
```
POST /api/portal/desks
{ "name": "...", "description": "...", "manager_id": 74 }
```
المدراء من: `GET /api/portal/users`

#### تفاصيل القسم
```
GET /api/portal/desks/:id/with-teams
```
التصميم: معلومات القسم + قائمة الفرق. زر "فريق جديد".

---

### تبويب الفرق

#### جلب الفرق
```
GET /api/portal/teams
```

#### فلترة حسب القسم
```
GET /api/portal/teams/desk/:deskId
```

#### التصميم
- جدول: اسم الفريق + القسم + المدير + عدد الأعضاء
- الضغط على فريق يفتح تفاصيله

#### إنشاء فريق
```
POST /api/portal/teams
{ "desk_id": 1, "name": "...", "manager_id": 38 }
```

#### تفاصيل الفريق
- معلومات الفريق + أزرار تعديل وحذف
- قائمة الأعضاء:
```
GET /api/portal/teams/:id/members
```
- إضافة عضو:
```
POST /api/portal/teams/:id/members
{ "userId": 52 }
```
- حذف عضو:
```
DELETE /api/portal/teams/:id/members/:userId
```

---

## الوحدات الإعلامية

### من داخل صفحة الأقسام أو كقسم فرعي

```
GET /api/portal/media-units
POST /api/portal/media-units — { "name": "...", "description": "..." }
PUT /api/portal/media-units/:id
DELETE /api/portal/media-units/:id
```

---

## الأدوار

### من داخل صفحة الأقسام أو كقسم فرعي

```
GET /api/portal/roles
POST /api/portal/roles — { "name": "...", "description": "..." }
PUT /api/portal/roles/:id
DELETE /api/portal/roles/:id
```
