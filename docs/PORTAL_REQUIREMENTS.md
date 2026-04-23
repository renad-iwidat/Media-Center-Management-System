# Media Center Management Portal - Requirements

## 📋 الفيتشرز المطلوبة

### 1. **قائمة الديسكات (Desks Management)**
**الجدول**: `desks`

**الحقول المطلوبة**:
- `name` (text) - اسم الديسك (مثل: أفكار، إنتاج، نشر وتحرير)
- `description` (text) - وصف الديسك
- `manager_id` (bigint) - مسؤول الديسك (اختياري - علاقة مع users)
- `created_at` (timestamp) - تاريخ الإنشاء

**الوظائف**:
- عرض قائمة الديسكات
- إضافة ديسك جديد
- تعديل ديسك
- حذف ديسك
- تعيين/تغيير مسؤول الديسك

---

### 2. **قائمة الفرق (Teams Management)**
**الجدول**: `teams`

**الحقول المطلوبة**:
- `desk_id` (bigint) - الديسك التابع له الفريق (علاقة مع desks)
- `name` (text) - اسم الفريق
- `manager_id` (bigint) - مسؤول الفريق (اختياري - علاقة مع users)
- `created_at` (timestamp) - تاريخ الإنشاء

**الجدول الوسيط**: `team_users`
- `team_id` (bigint) - معرف الفريق
- `user_id` (bigint) - معرف المستخدم

**الوظائف**:
- عرض الفرق حسب الديسك
- إضافة فريق جديد
- تعديل فريق
- حذف فريق
- إضافة/حذف موظفين من الفريق

---

### 3. **قائمة الموظفين (Employees Management)**
**الجدول**: `users`

**الحقول المطلوبة**:
- `name` (text) - اسم الموظف
- `email` (text) - البريد الإلكتروني
- `role_id` (bigint) - الدور/الوظيفة (علاقة مع roles)
- `created_at` (timestamp) - تاريخ الإنشاء

**جداول إضافية مقترحة** (ناقصة في الداتابيس):
- `employee_schedules` - جدول جديد للجدول الزمني
  - `id` (bigint)
  - `user_id` (bigint) - معرف الموظف
  - `work_days` (text) - أيام الدوام (مثل: Saturday,Sunday,Monday)
  - `start_time` (time) - وقت البداية
  - `end_time` (time) - وقت النهاية
  - `created_at` (timestamp)

**الوظائف**:
- عرض قائمة الموظفين
- عرض الموظفين حسب الفريق/الديسك
- إضافة موظف جديد
- تعديل بيانات الموظف
- تعديل جدول الدوام
- حذف موظف

---

### 4. **قائمة البرامج (Programs Management)**
**الجدول**: `programs`

**الحقول المطلوبة**:
- `title` (text) - اسم البرنامج
- `description` (text) - موضوع/وصف البرنامج
- `media_unit_id` (bigint) - الوحدة الإعلامية (علاقة مع media_units)
- `created_at` (timestamp) - تاريخ الإنشاء

**جداول إضافية مقترحة** (ناقصة في الداتابيس):
- `program_details` - جدول جديد للتفاصيل الإضافية
  - `id` (bigint)
  - `program_id` (bigint) - معرف البرنامج
  - `episode_count` (integer) - عدد الحلقات
  - `presenter_id` (bigint) - معرف المذيع (علاقة مع users)
  - `producer_id` (bigint) - معرف المعد (علاقة مع users)
  - `air_time` (time) - وقت البث
  - `notes` (text) - ملاحظات
  - `created_at` (timestamp)

- `program_team_members` - جدول جديد لأعضاء الفريق الإضافيين
  - `id` (bigint)
  - `program_id` (bigint) - معرف البرنامج
  - `user_id` (bigint) - معرف الموظف (علاقة مع users)
  - `role` (text) - الدور (مثل: مساعد، فني، إلخ)
  - `created_at` (timestamp)

**الوظائف**:
- عرض قائمة البرامج
- إضافة برنامج جديد
- تعديل برنامج
- حذف برنامج
- عرض تفاصيل البرنامج
- إضافة/تعديل أعضاء الفريق للبرنامج

---

### 5. **قائمة الحلقات (Episodes Management)**
**الجدول**: `episodes`

**الحقول المطلوبة**:
- `program_id` (bigint) - معرف البرنامج (علاقة مع programs)
- `title` (text) - عنوان الحلقة
- `episode_number` (integer) - رقم الحلقة
- `air_date` (timestamp) - تاريخ البث
- `created_at` (timestamp) - تاريخ الإنشاء

**جداول إضافية مقترحة** (ناقصة في الداتابيس):
- `episode_details` - جدول جديد للتفاصيل الإضافية
  - `id` (bigint)
  - `episode_id` (bigint) - معرف الحلقة
  - `topic` (text) - موضوع الحلقة
  - `script_url` (text) - رابط السكريبت
  - `notes` (text) - ملاحظات
  - `created_at` (timestamp)

**الجدول الوسيط**: `episode_guests`
- `episode_id` (bigint) - معرف الحلقة
- `guest_id` (bigint) - معرف الضيف

**الجدول**: `guests`
- `id` (bigint)
- `name` (text) - اسم الضيف
- `title` (text) - الوظيفة/اللقب
- `bio` (text) - السيرة الذاتية
- `phone` (text) - رقم الهاتف (ناقص - يجب إضافته)
- `created_at` (timestamp)

**الوظائف**:
- عرض حلقات البرنامج
- إضافة حلقة جديدة
- تعديل حلقة
- حذف حلقة
- إضافة/حذف ضيوف للحلقة
- رفع السكريبت
- إضافة ملاحظات

---

### 6. **بورتال السياسات التحريرية (Editorial Policies Portal)**
**الجدول**: `editorial_policies`

**الحقول المطلوبة**:
- `media_unit_id` (bigint) - الوحدة الإعلامية (علاقة مع media_units)
- `name` (text) - اسم السياسة
- `description` (text) - وصف السياسة
- `rules` (text) - القواعد
- `is_active` (boolean) - هل السياسة نشطة
- `created_at` (timestamp) - تاريخ الإنشاء

**الوظائف**:
- عرض قائمة السياسات
- إضافة سياسة جديدة
- تعديل سياسة
- حذف سياسة
- تفعيل/تعطيل سياسة

---

## 🔄 الجداول الناقصة المقترحة

### 1. **employee_schedules** (جدول جديد)
```sql
CREATE TABLE employee_schedules (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  work_days TEXT, -- "Saturday,Sunday,Monday"
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **program_details** (جدول جديد)
```sql
CREATE TABLE program_details (
  id BIGSERIAL PRIMARY KEY,
  program_id BIGINT NOT NULL REFERENCES programs(id),
  episode_count INTEGER,
  presenter_id BIGINT REFERENCES users(id),
  producer_id BIGINT REFERENCES users(id),
  air_time TIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **program_team_members** (جدول جديد)
```sql
CREATE TABLE program_team_members (
  id BIGSERIAL PRIMARY KEY,
  program_id BIGINT NOT NULL REFERENCES programs(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  role TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. **episode_details** (جدول جديد)
```sql
CREATE TABLE episode_details (
  id BIGSERIAL PRIMARY KEY,
  episode_id BIGINT NOT NULL REFERENCES episodes(id),
  topic TEXT,
  script_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. **إضافة حقل phone للجدول guests**
```sql
ALTER TABLE guests ADD COLUMN phone TEXT;
```

---

## 📊 ملخص الجداول المستخدمة

| الفيتشر | الجداول الرئيسية | الجداول الوسيطة | الجداول الإضافية |
|--------|-----------------|-----------------|-----------------|
| الديسكات | desks | - | - |
| الفرق | teams | team_users | - |
| الموظفين | users | - | employee_schedules |
| البرامج | programs | - | program_details, program_team_members |
| الحلقات | episodes | episode_guests | episode_details |
| الضيوف | guests | episode_guests | - |
| السياسات | editorial_policies | - | - |

---

## 🎯 الخطوات التالية

1. ✅ فهم المتطلبات (تم)
2. ⏳ إنشاء الجداول الناقصة في الداتابيس
3. ⏳ إنشاء Models للبيانات
4. ⏳ إنشاء Services للعمليات الأساسية
5. ⏳ إنشاء Controllers للـ API endpoints
6. ⏳ إنشاء Routes للـ API
7. ⏳ إنشاء Middleware للتحقق والأمان
8. ⏳ إنشاء الـ Frontend (لاحقاً)

---

## 📝 ملاحظات مهمة

- جميع الحقول الزمنية تستخدم `timestamp with time zone`
- جميع المعرفات تستخدم `bigint` مع `BIGSERIAL`
- الحقول الاختيارية تستخدم `nullable`
- الحقول الافتراضية تستخدم `DEFAULT`
- جميع الجداول الجديدة تحتوي على `created_at` و `updated_at`
- الجداول الوسيطة لا تحتوي على معرف فريد (composite key)
