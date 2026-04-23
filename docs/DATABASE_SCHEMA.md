# Media Center Management System - Database Schema

## Overview
هذا الملف يحتوي على توثيق شامل لكل جداول الداتابيس والعلاقات بينها.

---

## 📊 الجداول الرئيسية

### 1. **Users** (المستخدمون)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم المستخدم
- `email` (text) - البريد الإلكتروني
- `role_id` (bigint) - معرف الدور (علاقة مع جدول roles)
- `created_at` (timestamp) - تاريخ الإنشاء

**الغرض**: تخزين بيانات المستخدمين والموظفين

---

### 2. **Roles** (الأدوار)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم الدور (مثل: Admin, Editor, Manager)
- `description` (text) - وصف الدور

**الغرض**: تحديد الأدوار المختلفة في النظام

---

### 3. **Permissions** (الصلاحيات)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم الصلاحية
- `description` (text) - وصف الصلاحية

**الغرض**: تحديد الصلاحيات المختلفة

**العلاقة**: role_permissions (جدول وسيط يربط الأدوار بالصلاحيات)

---

### 4. **Media Units** (الوحدات الإعلامية)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم الوحدة (مثل: TV, Radio, Online)
- `slug` (text) - معرف نصي فريد
- `description` (text) - وصف الوحدة
- `is_active` (boolean) - هل الوحدة نشطة
- `created_at` (timestamp) - تاريخ الإنشاء

**الغرض**: تنظيم المحتوى حسب الوحدات الإعلامية المختلفة

---

### 5. **Desks** (المكاتب)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم المكتب (مثل: News Desk, Sports Desk)
- `description` (text) - وصف المكتب
- `manager_id` (bigint) - معرف مدير المكتب (علاقة مع users)
- `created_at` (timestamp) - تاريخ الإنشاء

**الغرض**: تنظيم الفرق والعاملين حسب المكاتب

---

### 6. **Teams** (الفرق)
- `id` (bigint) - معرف فريد
- `desk_id` (bigint) - معرف المكتب (علاقة مع desks)
- `name` (text) - اسم الفريق
- `manager_id` (bigint) - معرف مدير الفريق (علاقة مع users)
- `created_at` (timestamp) - تاريخ الإنشاء

**العلاقة**: team_users (جدول وسيط يربط الفرق بالمستخدمين)

**الغرض**: تنظيم المستخدمين في فرق

---

### 7. **Programs** (البرامج)
- `id` (bigint) - معرف فريد
- `title` (text) - عنوان البرنامج
- `description` (text) - وصف البرنامج
- `media_unit_id` (bigint) - معرف الوحدة الإعلامية (علاقة مع media_units)
- `created_at` (timestamp) - تاريخ الإنشاء

**الغرض**: تخزين البرامج الإعلامية

---

### 8. **Episodes** (الحلقات)
- `id` (bigint) - معرف فريد
- `program_id` (bigint) - معرف البرنامج (علاقة مع programs)
- `title` (text) - عنوان الحلقة
- `episode_number` (integer) - رقم الحلقة
- `air_date` (timestamp) - تاريخ البث
- `created_at` (timestamp) - تاريخ الإنشاء

**الغرض**: تخزين حلقات البرامج

---

### 9. **Guests** (الضيوف)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم الضيف
- `title` (text) - اللقب/الوظيفة
- `bio` (text) - السيرة الذاتية
- `created_at` (timestamp) - تاريخ الإنشاء

**العلاقة**: episode_guests (جدول وسيط يربط الحلقات بالضيوف)

**الغرض**: تخزين بيانات الضيوف

---

### 10. **Orders** (الطلبات/الأوامر)
- `id` (bigint) - معرف فريد
- `title` (text) - عنوان الطلب
- `description` (text) - وصف الطلب
- `desk_id` (bigint) - معرف المكتب (علاقة مع desks)
- `media_unit_id` (bigint) - معرف الوحدة الإعلامية (علاقة مع media_units)
- `program_id` (bigint) - معرف البرنامج (علاقة مع programs)
- `episode_id` (bigint) - معرف الحلقة (علاقة مع episodes)
- `status_id` (bigint) - معرف الحالة (علاقة مع order_statuses)
- `priority_id` (bigint) - معرف الأولوية (علاقة مع priority_levels)
- `deadline` (timestamp) - الموعد النهائي
- `created_by` (bigint) - معرف من أنشأ الطلب (علاقة مع users)
- `created_at` (timestamp) - تاريخ الإنشاء

**الغرض**: تخزين الطلبات والأوامر

---

### 11. **Tasks** (المهام)
- `id` (bigint) - معرف فريد
- `order_id` (bigint) - معرف الطلب (علاقة مع orders)
- `title` (text) - عنوان المهمة
- `description` (text) - وصف المهمة
- `assigned_to` (bigint) - معرف المستخدم المسؤول (علاقة مع users)
- `status_id` (bigint) - معرف الحالة (علاقة مع task_statuses)
- `priority_id` (bigint) - معرف الأولوية (علاقة مع priority_levels)
- `deadline` (timestamp) - الموعد النهائي
- `sequence_order` (integer) - ترتيب المهمة
- `created_at` (timestamp) - تاريخ الإنشاء

**الغرض**: تخزين المهام المرتبطة بالطلبات

---

### 12. **Content** (المحتوى)
- `id` (bigint) - معرف فريد
- `title` (text) - عنوان المحتوى
- `content_type_id` (bigint) - معرف نوع المحتوى (علاقة مع content_types)
- `owner_type` (text) - نوع المالك (مثل: user, team, desk)
- `owner_id` (bigint) - معرف المالك
- `status_id` (bigint) - معرف الحالة (علاقة مع content_statuses)
- `is_final` (boolean) - هل المحتوى نهائي
- `sequence_order` (integer) - ترتيب المحتوى
- `media_unit_id` (bigint) - معرف الوحدة الإعلامية (علاقة مع media_units)
- `created_by` (bigint) - معرف من أنشأ المحتوى (علاقة مع users)
- `created_at` (timestamp) - تاريخ الإنشاء
- `tags` (ARRAY) - الوسوم

**الغرض**: تخزين المحتوى المختلف

---

### 13. **Raw Data** (البيانات الخام)
- `id` (bigint) - معرف فريد
- `source_id` (bigint) - معرف المصدر (علاقة مع sources)
- `source_type_id` (bigint) - معرف نوع المصدر (علاقة مع source_types)
- `category_id` (bigint) - معرف الفئة (علاقة مع categories)
- `url` (text) - الرابط
- `title` (text) - العنوان
- `content` (text) - المحتوى
- `image_url` (text) - رابط الصورة
- `tags` (ARRAY) - الوسوم
- `fetch_status` (text) - حالة الجلب
- `fetched_at` (timestamp) - تاريخ الجلب

**الغرض**: تخزين البيانات الخام المجلوبة من المصادر

---

### 14. **Published Items** (العناصر المنشورة)
- `id` (bigint) - معرف فريد
- `media_unit_id` (bigint) - معرف الوحدة الإعلامية (علاقة مع media_units)
- `raw_data_id` (bigint) - معرف البيانات الخام (علاقة مع raw_data)
- `queue_id` (bigint) - معرف الطابور (علاقة مع editorial_queue)
- `content_type_id` (bigint) - معرف نوع المحتوى (علاقة مع content_types)
- `title` (text) - العنوان
- `content` (text) - المحتوى
- `tags` (ARRAY) - الوسوم
- `is_active` (boolean) - هل نشط
- `published_at` (timestamp) - تاريخ النشر

**الغرض**: تخزين العناصر المنشورة

---

### 15. **Editorial Queue** (طابور التحرير)
- `id` (bigint) - معرف فريد
- `media_unit_id` (bigint) - معرف الوحدة الإعلامية (علاقة مع media_units)
- `raw_data_id` (bigint) - معرف البيانات الخام (علاقة مع raw_data)
- `policy_id` (bigint) - معرف السياسة (علاقة مع editorial_policies)
- `status` (text) - الحالة
- `editor_notes` (text) - ملاحظات المحرر
- `created_at` (timestamp) - تاريخ الإنشاء
- `updated_at` (timestamp) - تاريخ التحديث

**الغرض**: إدارة طابور المحتوى قيد التحرير

---

### 16. **Editorial Policies** (سياسات التحرير)
- `id` (bigint) - معرف فريد
- `media_unit_id` (bigint) - معرف الوحدة الإعلامية (علاقة مع media_units)
- `name` (text) - اسم السياسة
- `description` (text) - وصف السياسة
- `rules` (text) - القواعد
- `is_active` (boolean) - هل السياسة نشطة
- `created_at` (timestamp) - تاريخ الإنشاء

**الغرض**: تحديد سياسات التحرير لكل وحدة إعلامية

---

### 17. **Shootings** (جلسات التصوير)
- `id` (bigint) - معرف فريد
- `order_id` (bigint) - معرف الطلب (علاقة مع orders)
- `task_id` (bigint) - معرف المهمة (علاقة مع tasks)
- `location` (text) - موقع التصوير
- `start_time` (timestamp) - وقت البداية
- `end_time` (timestamp) - وقت النهاية
- `equipment` (ARRAY) - المعدات
- `crew` (ARRAY) - فريق العمل
- `notes` (text) - ملاحظات
- `created_by` (bigint) - معرف من أنشأ (علاقة مع users)
- `created_at` (timestamp) - تاريخ الإنشاء

**الغرض**: تخزين بيانات جلسات التصوير

---

### 18. **AI Prompts** (نماذج الذكاء الاصطناعي)
- `id` (bigint) - معرف فريد
- `prompt_type` (text) - نوع النموذج
- `prompt_text` (text) - نص النموذج
- `description` (text) - وصف النموذج
- `created_by` (bigint) - معرف من أنشأ (علاقة مع users)
- `created_at` (timestamp) - تاريخ الإنشاء

**الغرض**: تخزين نماذج الذكاء الاصطناعي

---

### 19. **AI Logs** (سجلات الذكاء الاصطناعي)
- `id` (bigint) - معرف فريد
- `prompt_id` (bigint) - معرف النموذج (علاقة مع ai_prompts)
- `input` (jsonb) - المدخلات
- `output` (jsonb) - المخرجات
- `executed_at` (timestamp) - تاريخ التنفيذ

**الغرض**: تسجيل عمليات الذكاء الاصطناعي

---

## 📋 جداول الحالات والأولويات

### 20. **Order Statuses** (حالات الطلبات)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم الحالة
- `description` (text) - وصف الحالة

---

### 21. **Task Statuses** (حالات المهام)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم الحالة
- `description` (text) - وصف الحالة

---

### 22. **Content Statuses** (حالات المحتوى)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم الحالة
- `description` (text) - وصف الحالة

---

### 23. **Priority Levels** (مستويات الأولوية)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم الأولوية

---

## 🏷️ جداول التصنيفات والوسوم

### 24. **Categories** (الفئات)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم الفئة
- `slug` (text) - معرف نصي فريد
- `flow` (text) - تدفق العمل
- `is_active` (boolean) - هل الفئة نشطة

---

### 25. **Tags** (الوسوم)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم الوسم

**العلاقات**:
- content_tags (جدول وسيط يربط المحتوى بالوسوم)

---

## 📚 جداول المصادر

### 26. **Sources** (المصادر)
- `id` (bigint) - معرف فريد
- `source_type_id` (bigint) - معرف نوع المصدر (علاقة مع source_types)
- `url` (text) - الرابط
- `name` (text) - اسم المصدر
- `is_active` (boolean) - هل المصدر نشط
- `created_at` (timestamp) - تاريخ الإنشاء
- `default_category_id` (integer) - معرف الفئة الافتراضية

---

### 27. **Source Types** (أنواع المصادر)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم النوع (مثل: RSS, API, Manual)

---

## 🔗 جداول المحتوى والعلاقات

### 28. **Content Types** (أنواع المحتوى)
- `id` (bigint) - معرف فريد
- `name` (text) - اسم النوع

---

### 29. **Content Source** (مصدر المحتوى)
- `id` (bigint) - معرف فريد
- `content_id` (bigint) - معرف المحتوى (علاقة مع content)
- `published_item_id` (bigint) - معرف العنصر المنشور (علاقة مع published_items)

---

### 30. **Content Tags** (وسوم المحتوى)
- `content_id` (bigint) - معرف المحتوى (علاقة مع content)
- `tag_id` (bigint) - معرف الوسم (علاقة مع tags)

---

### 31. **Content Tasks** (مهام المحتوى)
- `content_id` (bigint) - معرف المحتوى (علاقة مع content)
- `task_id` (bigint) - معرف المهمة (علاقة مع tasks)

---

## 📝 جداول السجلات والتاريخ

### 32. **Order History** (سجل الطلبات)
- `id` (bigint) - معرف فريد
- `order_id` (bigint) - معرف الطلب (علاقة مع orders)
- `old_status_id` (bigint) - معرف الحالة القديمة (علاقة مع order_statuses)
- `new_status_id` (bigint) - معرف الحالة الجديدة (علاقة مع order_statuses)
- `changed_by` (bigint) - معرف من قام بالتغيير (علاقة مع users)
- `changed_at` (timestamp) - تاريخ التغيير

---

### 33. **Task History** (سجل المهام)
- `id` (bigint) - معرف فريد
- `task_id` (bigint) - معرف المهمة (علاقة مع tasks)
- `old_status_id` (bigint) - معرف الحالة القديمة (علاقة مع task_statuses)
- `new_status_id` (bigint) - معرف الحالة الجديدة (علاقة مع task_statuses)
- `changed_by` (bigint) - معرف من قام بالتغيير (علاقة مع users)
- `changed_at` (timestamp) - تاريخ التغيير

---

### 34. **Task Assignments** (تعيينات المهام)
- `id` (bigint) - معرف فريد
- `task_id` (bigint) - معرف المهمة (علاقة مع tasks)
- `assigned_to` (bigint) - معرف المستخدم المسؤول (علاقة مع users)
- `assigned_by` (bigint) - معرف من قام بالتعيين (علاقة مع users)
- `assigned_at` (timestamp) - تاريخ التعيين

---

### 35. **Task Comments** (تعليقات المهام)
- `id` (bigint) - معرف فريد
- `task_id` (bigint) - معرف المهمة (علاقة مع tasks)
- `user_id` (bigint) - معرف المستخدم (علاقة مع users)
- `comment` (text) - التعليق
- `created_at` (timestamp) - تاريخ الإنشاء

---

### 36. **Task Attachments** (مرفقات المهام)
- `id` (bigint) - معرف فريد
- `task_id` (bigint) - معرف المهمة (علاقة مع tasks)
- `file_url` (text) - رابط الملف
- `file_type` (text) - نوع الملف
- `uploaded_by` (bigint) - معرف من قام بالرفع (علاقة مع users)
- `created_at` (timestamp) - تاريخ الإنشاء

---

### 37. **Task Relations** (علاقات المهام)
- `id` (bigint) - معرف فريد
- `task_id` (bigint) - معرف المهمة (علاقة مع tasks)
- `related_to_type` (text) - نوع العلاقة
- `related_to_id` (bigint) - معرف العنصر المرتبط

---

## 🔐 جداول الأدوار والصلاحيات

### 38. **Role Permissions** (صلاحيات الأدوار)
- `role_id` (bigint) - معرف الدور (علاقة مع roles)
- `permission_id` (bigint) - معرف الصلاحية (علاقة مع permissions)

---

### 39. **Team Users** (مستخدمو الفرق)
- `team_id` (bigint) - معرف الفريق (علاقة مع teams)
- `user_id` (bigint) - معرف المستخدم (علاقة مع users)

---

### 40. **Episode Guests** (ضيوف الحلقات)
- `episode_id` (bigint) - معرف الحلقة (علاقة مع episodes)
- `guest_id` (bigint) - معرف الضيف (علاقة مع guests)

---

## 🔄 العلاقات الرئيسية

```
Users
├── role_id → Roles
├── manager_id (Desks) → Users
├── manager_id (Teams) → Users
├── created_by (Orders) → Users
├── assigned_to (Tasks) → Users
├── created_by (Content) → Users
└── created_by (Shootings) → Users

Roles
└── role_permissions → Permissions

Media Units
├── programs → Programs
├── orders → Orders
├── content → Content
├── published_items → Published Items
├── editorial_queue → Editorial Queue
└── editorial_policies → Editorial Policies

Desks
├── manager_id → Users
├── teams → Teams
└── orders → Orders

Teams
├── desk_id → Desks
├── manager_id → Users
└── team_users → Users

Programs
├── media_unit_id → Media Units
└── episodes → Episodes

Episodes
├── program_id → Programs
└── episode_guests → Guests

Orders
├── desk_id → Desks
├── media_unit_id → Media Units
├── program_id → Programs
├── episode_id → Episodes
├── status_id → Order Statuses
├── priority_id → Priority Levels
├── created_by → Users
└── tasks → Tasks

Tasks
├── order_id → Orders
├── assigned_to → Users
├── status_id → Task Statuses
├── priority_id → Priority Levels
├── task_assignments → Task Assignments
├── task_comments → Task Comments
├── task_attachments → Task Attachments
├── task_history → Task History
├── task_relations → Task Relations
└── content_tasks → Content

Content
├── content_type_id → Content Types
├── status_id → Content Statuses
├── media_unit_id → Media Units
├── created_by → Users
├── content_tags → Tags
├── content_source → Published Items
└── content_tasks → Tasks

Raw Data
├── source_id → Sources
├── source_type_id → Source Types
├── category_id → Categories
└── published_items → Published Items

Published Items
├── media_unit_id → Media Units
├── raw_data_id → Raw Data
├── queue_id → Editorial Queue
├── content_type_id → Content Types
└── content_source → Content

Editorial Queue
├── media_unit_id → Media Units
├── raw_data_id → Raw Data
└── policy_id → Editorial Policies

Shootings
├── order_id → Orders
├── task_id → Tasks
└── created_by → Users
```

---

## 📌 ملاحظات مهمة

1. **الجداول الوسيطة (Junction Tables)**:
   - `role_permissions`: تربط الأدوار بالصلاحيات
   - `team_users`: تربط الفرق بالمستخدمين
   - `episode_guests`: تربط الحلقات بالضيوف
   - `content_tags`: تربط المحتوى بالوسوم
   - `content_tasks`: تربط المحتوى بالمهام

2. **الحقول من نوع ARRAY**:
   - `content.tags`: مصفوفة من الوسوم
   - `raw_data.tags`: مصفوفة من الوسوم
   - `published_items.tags`: مصفوفة من الوسوم
   - `shootings.equipment`: مصفوفة من المعدات
   - `shootings.crew`: مصفوفة من فريق العمل

3. **الحقول من نوع JSONB**:
   - `ai_logs.input`: بيانات المدخلات بصيغة JSON
   - `ai_logs.output`: بيانات المخرجات بصيغة JSON

4. **الحقول الزمنية**:
   - معظم الجداول تحتوي على `created_at` و `updated_at`
   - بعض الجداول تحتوي على `deadline` و `air_date`

5. **الحقول البوليانية**:
   - `is_active`: للتحكم في تفعيل/تعطيل العناصر
   - `is_final`: للتحكم في حالة المحتوى النهائية

---

## 🎯 الاستخدامات الرئيسية

- **إدارة المستخدمين والفرق**: Users, Roles, Teams, Desks
- **إدارة المحتوى**: Content, Content Types, Content Statuses, Tags
- **إدارة الطلبات والمهام**: Orders, Tasks, Task Statuses, Priority Levels
- **إدارة البرامج والحلقات**: Programs, Episodes, Guests
- **إدارة المصادر والبيانات الخام**: Sources, Raw Data, Editorial Queue
- **إدارة النشر**: Published Items, Editorial Policies
- **إدارة التصوير**: Shootings
- **إدارة الذكاء الاصطناعي**: AI Prompts, AI Logs
- **تتبع التغييرات**: Order History, Task History, Task Assignments
