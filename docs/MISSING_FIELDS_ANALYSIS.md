# Missing Fields Analysis - Final Report

## 📊 ملخص الفحص الشامل للداتابيس

تم فحص جميع الجداول الـ 40 في الداتابيس والتحقق من المتطلبات.

---

## ✅ الجداول الكاملة (لا تحتاج تعديلات)

### 1. **DESKS** ✅
- ✅ name (اسم الديسك)
- ✅ description (وصف الديسك)
- ✅ manager_id (مسؤول الديسك)
- **الحالة**: جاهز للاستخدام

### 2. **TEAMS** ✅
- ✅ name (اسم الفريق)
- ✅ desk_id (الديسك التابع له)
- ✅ manager_id (مسؤول الفريق)
- ✅ team_users (جدول وسيط لربط الموظفين)
- **الحالة**: جاهز للاستخدام

### 3. **EDITORIAL_POLICIES** ✅
- ✅ name (اسم السياسة)
- ✅ media_unit_id (الوحدة الإعلامية)
- ✅ description (وصف السياسة)
- ✅ rules (قواعد السياسة)
- ✅ is_active (هل السياسة نشطة)
- **الحالة**: جاهز للاستخدام

---

## ❌ الجداول الناقصة (تحتاج تعديلات)

### 1. **PROGRAMS** ❌
**الناقص**:
- ❌ `air_time` (TIME) - وقت البث
- ❌ `notes` (TEXT) - ملاحظات إضافية

**ملاحظة**: 
- `episode_count` يمكن حسابها من جدول episodes بدل تخزينها
- المذيع والمعد سيتم ربطهم عبر جدول `program_roles` الجديد

**الحل**: إضافة عمودين للجدول

---

### 2. **EPISODES** ❌
**الناقص**:
- ❌ `topic` (TEXT) - موضوع الحلقة
- ❌ `script_url` (TEXT) - رابط السكريبت
- ❌ `notes` (TEXT) - ملاحظات إضافية

**ملاحظة**: الضيوف موجودة عبر جدول `episode_guests` (جاهز)

**الحل**: إضافة 3 أعمدة للجدول

---

### 3. **GUESTS** ❌
**الناقص**:
- ❌ `phone` (TEXT) - رقم الهاتف

**الحل**: إضافة عمود واحد للجدول

---

### 4. **USERS** ❌
**الناقص**:
- ❌ `work_days` (TEXT) - أيام الدوام (مثل: "Saturday,Sunday,Monday")
- ❌ `start_time` (TIME) - وقت بداية الدوام
- ❌ `end_time` (TIME) - وقت نهاية الدوام

**الحل**: إضافة 3 أعمدة للجدول

---

## 🔗 الجداول الوسيطة الموجودة (لا تحتاج تعديلات)

### ✅ `team_users`
- يربط الفرق بالموظفين
- جاهز للاستخدام

### ✅ `episode_guests`
- يربط الحلقات بالضيوف
- جاهز للاستخدام

---

## 🆕 الجداول الجديدة المطلوبة

### 1. **program_roles** (جديد)
**الغرض**: ربط الموظفين بالبرامج مع تحديد دورهم

**الأعمدة**:
- `id` (BIGSERIAL) - معرف فريد
- `program_id` (BIGINT) - معرف البرنامج (FK → programs.id)
- `user_id` (BIGINT) - معرف الموظف (FK → users.id)
- `role` (TEXT) - الدور (مثل: "presenter", "producer", "assistant")
- `created_at` (TIMESTAMP) - تاريخ الإنشاء

**مثال البيانات**:
```
program_id | user_id | role
-----------|---------|----------
1          | 5       | presenter
1          | 7       | producer
2          | 5       | producer
2          | 9       | presenter
```

---

## 📋 ملخص التعديلات المطلوبة (الحقول الموجودة فقط)

| الجدول | النوع | التعديلات |
|--------|-------|----------|
| PROGRAMS | تعديل | `air_time` (TIME) |
| EPISODES | تعديل | `topic` (TEXT) |
| GUESTS | تعديل | `phone` (TEXT) |
| USERS | تعديل | `work_days`, `start_time`, `end_time` (TEXT, TIME, TIME) |
| program_roles | **جديد** | جدول كامل لربط الموظفين بالبرامج |

### ✅ `team_users`
- يربط الفرق بالموظفين
- جاهز للاستخدام

### ✅ `episode_guests`
- يربط الحلقات بالضيوف
- جاهز للاستخدام

---

## 🆕 الجداول الجديدة المطلوبة

### 1. **program_roles** (جديد)
**الغرض**: ربط الموظفين بالبرامج مع تحديد دورهم

**الأعمدة**:
- `id` (BIGSERIAL) - معرف فريد
- `program_id` (BIGINT) - معرف البرنامج (FK → programs.id)
- `user_id` (BIGINT) - معرف الموظف (FK → users.id)
- `role` (TEXT) - الدور (مثل: "presenter", "producer", "assistant")
- `created_at` (TIMESTAMP) - تاريخ الإنشاء

**مثال البيانات**:
```
program_id | user_id | role
-----------|---------|----------
1          | 5       | presenter
1          | 7       | producer
2          | 5       | producer
2          | 9       | presenter
```

---

## 📋 ملخص التعديلات المطلوبة

| الجدول | عدد الأعمدة الناقصة | الأعمدة |
|--------|------------------|--------|
| PROGRAMS | 4 | presenter_id, producer_id, air_time, notes |
| EPISODES | 3 | topic, script_url, notes |
| GUESTS | 1 | phone |
| USERS | 3 | work_days, start_time, end_time |
| **المجموع** | **11** | - |

---

## 🎯 الخطة النهائية

### المرحلة 1: تعديل الجداول الموجودة
```sql
-- 1. إضافة عمود لـ PROGRAMS
ALTER TABLE programs ADD COLUMN air_time TIME;

-- 2. إضافة عمود لـ EPISODES
ALTER TABLE episodes ADD COLUMN topic TEXT;

-- 3. إضافة عمود لـ GUESTS
ALTER TABLE guests ADD COLUMN phone TEXT;

-- 4. إضافة أعمدة لـ USERS
ALTER TABLE users ADD COLUMN work_days TEXT;
ALTER TABLE users ADD COLUMN start_time TIME;
ALTER TABLE users ADD COLUMN end_time TIME;
```

### المرحلة 2: إنشاء جدول جديد
```sql
-- 5. إنشاء جدول program_roles
CREATE TABLE program_roles (
  id BIGSERIAL PRIMARY KEY,
  program_id BIGINT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### المرحلة 3: استخدام الجداول الموجودة
- استخدام `team_users` لربط الموظفين بالفرق
- استخدام `episode_guests` لربط الضيوف بالحلقات
- استخدام `program_roles` لربط الموظفين بالبرامج مع تحديد أدوارهم

---

## ✨ الفوائد

1. **لا تكرار**: كل معلومة في مكان واحد فقط
2. **بساطة**: لا نحتاج جداول منفصلة
3. **كفاءة**: أقل عدد من الجداول والعلاقات
4. **مرونة**: يمكن التوسع لاحقاً بسهولة

---

## 📝 ملاحظات مهمة

1. جميع الأعمدة الجديدة اختيارية (NULLABLE)
2. الأعمدة التي تشير لـ users تستخدم FOREIGN KEY
3. لا توجد أي تكرار للبيانات
4. الجداول الموجودة كافية لتغطية جميع المتطلبات

---

## ✅ الموافقة

هذا التحليل يوضح بالضبط ما الناقص وما الموجود، وجاهز للمراجعة مع الفريق.
