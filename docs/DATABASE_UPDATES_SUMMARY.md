# Database Updates Summary - Media Center Management System

## 📅 التاريخ
April 12, 2026

## 📝 الملخص
تم تحديث قاعدة البيانات لدعم نظام إدارة البوابة الجديد (Media Center Portal). تم إضافة أعمدة جديدة وجدول جديد لتخزين معلومات البرامج والموظفين والضيوف.

---

## ✅ التعديلات المطبقة

### 1. جدول PROGRAMS
**الإضافة**: عمود جديد لتخزين وقت البث

```sql
ALTER TABLE programs ADD COLUMN air_time TIME;
```

**الوصف**:
- `air_time` (TIME) - وقت بث البرنامج (مثل: 20:00)
- يستخدم لتحديد الوقت الثابت لبث البرنامج

---

### 2. جدول GUESTS
**الإضافة**: عمود جديد لتخزين رقم الهاتف

```sql
ALTER TABLE guests ADD COLUMN phone TEXT;
```

**الوصف**:
- `phone` (TEXT) - رقم هاتف الضيف
- يستخدم للتواصل مع الضيوف

---

### 3. جدول USERS
**الإضافة**: ثلاثة أعمدة جديدة لتخزين جدول الدوام

```sql
ALTER TABLE users ADD COLUMN work_days TEXT;
ALTER TABLE users ADD COLUMN start_time TIME;
ALTER TABLE users ADD COLUMN end_time TIME;
```

**الوصف**:
- `work_days` (TEXT) - أيام الدوام (مثل: "Saturday,Sunday,Monday")
- `start_time` (TIME) - وقت بداية الدوام (مثل: 09:00)
- `end_time` (TIME) - وقت نهاية الدوام (مثل: 17:00)
- تستخدم لتحديد ساعات عمل الموظف

---

### 4. جدول جديد: PROGRAM_ROLES
**الإنشاء**: جدول جديد لربط الموظفين بالبرامج مع تحديد أدوارهم

```sql
CREATE TABLE program_roles (
  id BIGSERIAL PRIMARY KEY,
  program_id BIGINT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الوصف**:
- `id` - معرف فريد للسجل
- `program_id` - معرف البرنامج (علاقة مع جدول programs)
- `user_id` - معرف الموظف (علاقة مع جدول users)
- `role` - دور الموظف في البرنامج (مثل: "presenter", "producer", "assistant")
- `created_at` - تاريخ إضافة الموظف للبرنامج

**الفائدة**:
- يسمح لموظف واحد بأدوار مختلفة في برامج مختلفة
- مثال: أحمد يكون "presenter" في برنامج الأخبار و "producer" في برنامج الرياضة

---

## 📊 مثال على البيانات

### PROGRAMS
```
id | title           | description              | media_unit_id | air_time
---|-----------------|--------------------------|---------------|----------
1  | برنامج الأخبار  | برنامج يومي للأخبار    | 1             | 20:00
2  | برنامج الرياضة  | برنامج أسبوعي للرياضة  | 1             | 18:00
```

### USERS
```
id | name      | email           | role_id | work_days                | start_time | end_time
---|-----------|-----------------|---------|--------------------------|------------|----------
1  | أحمد      | ahmed@mail.com  | 2       | Saturday,Sunday,Monday   | 09:00      | 17:00
2  | فاطمة     | fatima@mail.com | 3       | Saturday,Sunday,Monday   | 10:00      | 18:00
```

### GUESTS
```
id | name      | title    | bio              | phone
---|-----------|----------|------------------|---------------
1  | محمود     | دكتور    | خبير اقتصادي    | +966501234567
2  | سارة      | مهندسة   | مهندسة برمجيات  | +966509876543
```

### PROGRAM_ROLES
```
id | program_id | user_id | role       | created_at
---|------------|---------|------------|-------------------
1  | 1          | 1       | presenter  | 2026-04-12 10:00
2  | 1          | 2       | producer   | 2026-04-12 10:00
3  | 2          | 1       | producer   | 2026-04-12 10:00
4  | 2          | 3       | presenter  | 2026-04-12 10:00
```

---

## 🔍 التحقق من التعديلات

تم التحقق من جميع التعديلات وتأكيد وجودها في قاعدة البيانات:

✅ PROGRAMS.air_time - موجود
✅ GUESTS.phone - موجود
✅ USERS.work_days - موجود
✅ USERS.start_time - موجود
✅ USERS.end_time - موجود
✅ program_roles - جدول موجود مع جميع الأعمدة

---

## 📌 ملاحظات مهمة

1. جميع الأعمدة الجديدة اختيارية (NULLABLE) ما عدا الأعمدة في جدول program_roles
2. جدول program_roles يحتوي على علاقات (Foreign Keys) مع جداول programs و users
3. عند حذف برنامج أو موظف، سيتم حذف السجلات المرتبطة تلقائياً (ON DELETE CASCADE)
4. جميع التعديلات متوافقة مع الهيكل الحالي للداتابيس

---

## 🚀 الخطوات التالية

1. تطوير API endpoints للبوابة الجديدة
2. إنشاء Models و Services للتعامل مع البيانات الجديدة
3. تطوير الواجهة الأمامية (Frontend)
4. اختبار شامل للنظام

---

## 📞 للاستفسارات
يرجى التواصل مع فريق التطوير
