# دليل الفرونت — نظام إدارة مركز الإعلام الداخلي

**آخر تحديث:** أبريل 2026

---

## معلومات عامة

- **رابط السيرفر (إنتاج):** `https://media-center-management-system.onrender.com`
- **صيغة البيانات:** JSON
- **المصادقة:** كل الطلبات (ما عدا تسجيل الدخول) لازم يكون معها توكن بالهيدر: `Authorization: Bearer TOKEN`
- **الإشعارات اللحظية:** عبر WebSocket باستخدام Socket.IO على نفس الرابط
- **شكل الرد الموحد:** `{ success: true/false, data: ..., timestamp: "..." }`
- **الصفحات:** كل نقاط الوصول اللي بترجع قوائم بتدعم `?limit=10&offset=0`

---

## نظرة عامة على النظام

النظام مصمم لإدارة مركز إعلام متكامل. الفلو الأساسي:

```
تسجيل دخول → إنشاء أوردر → تعيين مهام → تنفيذ (تصوير/تحرير/مونتاج)
→ رفع محتوى → أرشفة تلقائية → مؤشرات أداء → إشعارات لحظية
```

النظام مرتبط بنظام أخبار وذكاء اصطناعي منفصل. المهام المتعلقة بالأخبار بتنفذ هناك والمخرجات بترجع هون كمحتوى.

---

## 1. المصادقة وإدارة الحسابات

### تسجيل الدخول (مفتوح للجميع)
- `POST /api/auth/login`
- الجسم: `{ "email": "user@najah.edu", "password": "pass123" }`
- الرد: `{ "token": "jwt...", "user": { "id": 74, "name": "غازي مرتجى", "email": "gmortaja@najah.edu", "roles": [{ "id": 22, "name": "مدير المركز" }] } }`
- التوكن صالح لمدة 24 ساعة

### بياناتي (محمي بالتوكن)
- `GET /api/auth/me`
- الرد: بيانات المستخدم الكاملة + كل أدواره + كل صلاحياته
- مفيد لتحديد شو يظهر للمستخدم بالواجهة حسب صلاحياته

### تغيير كلمة السر (محمي بالتوكن)
- `POST /api/auth/change-password`
- الجسم: `{ "old_password": "...", "new_password": "..." }`
- كلمة السر الجديدة لازم 6 حروف على الأقل

### تسجيل مستخدم جديد (صلاحية: users.manage)
- `POST /api/auth/register`
- الجسم: `{ "name": "...", "email": "...", "password": "...", "role_id": 11, "work_days": "الأحد,الاثنين", "start_time": "09:00", "end_time": "17:00" }`

### تعيين كلمة سر لمستخدم (صلاحية: users.manage)
- `POST /api/auth/set-password/:userId`
- الجسم: `{ "new_password": "..." }`

---

## 2. الأوردرات (طلبات العمل)

### الحالات وتسلسلها
```
Created → Pending → In Progress → Review → Done
أي حالة ممكن تروح لـ Cancelled
```
- لما كل المهام تخلص — حالة الأوردر بتتحدث تلقائي
- ما بينحذف أوردر إذا فيه مهام نشطة
- ما بينقفل أوردر إذا ما في محتوى مرتبط فيه

### نقاط الوصول

| الطريقة | المسار | الوصف | الصلاحية |
|---------|--------|-------|----------|
| POST | /api/orders | إنشاء أوردر | orders.create |
| GET | /api/orders | كل الأوردرات | orders.view |
| GET | /api/orders/:id | أوردر واحد | orders.view |
| PUT | /api/orders/:id | تعديل أوردر | orders.edit |
| DELETE | /api/orders/:id | حذف أوردر | orders.delete |
| PATCH | /api/orders/:id/status | تغيير الحالة | orders.edit |
| PATCH | /api/orders/:id/cancel | إلغاء أوردر | orders.edit |
| PATCH | /api/orders/:id/auto-status | تحديث الحالة تلقائي من المهام | orders.edit |
| GET | /api/orders/:id/history | تاريخ تغييرات الحالة | orders.view |
| GET | /api/orders/:id/progress | نسبة التقدم (عدد المهام المكتملة/الكل) | orders.view |
| GET | /api/orders/:id/deadline | فحص الموعد النهائي | orders.view |
| GET | /api/orders/:id/can-delete | هل ممكن يتحذف | orders.view |
| GET | /api/orders/:id/can-close | هل ممكن يتقفل | orders.view |
| GET | /api/orders/:id/details | تفاصيل كاملة (مهام + تقدم + تاريخ) | orders.view |
| GET | /api/orders/:id/full-details | تفاصيل كاملة مع مؤشرات الأداء والمحتوى | orders.view |
| GET | /api/orders/:id/kpi | مؤشرات أداء الأوردر | kpi.view |
| GET | /api/orders/:id/statistics | إحصائيات الأوردر | kpi.view |
| POST | /api/orders/:id/archive | أرشفة الأوردر ومحتواه | orders.edit |
| GET | /api/orders/statuses | كل الحالات المتاحة | orders.view |
| GET | /api/orders/all-with-kpi | كل الأوردرات مع مؤشرات الأداء | kpi.view |
| GET | /api/orders/desk/:deskId | أوردرات حسب القسم | orders.view |
| GET | /api/orders/status/:statusId | أوردرات حسب الحالة | orders.view |
| GET | /api/orders/program/:programId | أوردرات حسب البرنامج | orders.view |

### إنشاء أوردر
```json
{
  "title": "نشرة أخبار الساعة 8",
  "description": "إنتاج نشرة أخبار مسائية",
  "desk_id": 1,
  "status_id": 1,
  "priority_id": 1,
  "media_unit_id": 1,
  "created_by": 74,
  "deadline": "2026-05-01",
  "program_id": 48,
  "notes": "ملاحظات"
}
```
ملاحظة مهمة: إذا أرسلت `program_id` بدون `episode_id` — بيتنشأ حلقة جديدة تلقائي للبرنامج.

### تغيير الحالة
```json
{ "status_id": 2, "changed_by": 74 }
```


---

## 3. المهام

### الحالات وتسلسلها
```
Pending → In Progress → Review → Done
```
- لما مهمة تتحول لـ In Progress — وقت البداية بيتسجل تلقائي
- لما مهمة تخلص (Done) — وقت الإنجاز ومدته بيتحسبوا تلقائي + مؤشرات الأداء بتتحدث
- لما كل مهام الأوردر تخلص — حالة الأوردر بتتحدث تلقائي
- المهمة ما بتبدأ إذا عندها تبعيات غير مكتملة
- إشعار بيوصل للموظف لما تتعينله مهمة أو تتغير حالتها

### نقاط الوصول

| الطريقة | المسار | الوصف | الصلاحية |
|---------|--------|-------|----------|
| POST | /api/tasks | إنشاء مهمة | tasks.create |
| GET | /api/tasks | كل المهام | tasks.view |
| GET | /api/tasks/:id | مهمة واحدة | tasks.view |
| PUT | /api/tasks/:id | تعديل مهمة | tasks.edit |
| DELETE | /api/tasks/:id | حذف مهمة | tasks.delete |
| PATCH | /api/tasks/:id/status | تغيير الحالة | tasks.edit |
| GET | /api/tasks/:id/history | تاريخ تغييرات الحالة | tasks.view |
| POST | /api/tasks/:id/assign | تعيين لموظف | tasks.assign |
| POST | /api/tasks/:id/reassign | إعادة تعيين | tasks.assign |
| GET | /api/tasks/:id/assignments | تاريخ التعيينات | tasks.view |
| POST | /api/tasks/:id/comments | إضافة تعليق | tasks.view |
| GET | /api/tasks/:id/comments | التعليقات | tasks.view |
| POST | /api/tasks/:id/attachments | إضافة مرفق | tasks.view |
| GET | /api/tasks/:id/attachments | المرفقات | tasks.view |
| POST | /api/tasks/:id/relations | إضافة علاقة/تبعية بين مهمتين | tasks.edit |
| GET | /api/tasks/:id/relations | العلاقات والتبعيات | tasks.view |
| GET | /api/tasks/:id/dependency | فحص هل المهمة ممكن تبدأ (تبعياتها مكتملة؟) | tasks.view |
| GET | /api/tasks/:id/progress | نسبة التقدم | tasks.view |
| GET | /api/tasks/:id/can-delete | هل ممكن تتحذف | tasks.view |
| GET | /api/tasks/:id/details | تفاصيل كاملة (تعليقات + مرفقات + علاقات + تاريخ) | tasks.view |
| GET | /api/tasks/:id/kpi | مؤشرات الأداء | kpi.view |
| GET | /api/tasks/statuses | كل الحالات المتاحة | tasks.view |
| GET | /api/tasks/overdue | المهام المتأخرة | tasks.view |
| GET | /api/tasks/order/:orderId | مهام أوردر معين | tasks.view |
| GET | /api/tasks/assignee/:userId | مهام موظف معين | tasks.view |
| GET | /api/tasks/status/:statusId | مهام حسب الحالة | tasks.view |
| POST | /api/tasks/bulk-assign | تعيين عدة مهام لموظف دفعة واحدة | tasks.assign |
| POST | /api/tasks/bulk-status | تغيير حالة عدة مهام دفعة واحدة | tasks.edit |

### إنشاء مهمة
```json
{
  "title": "تصوير مقابلة",
  "description": "تصوير مقابلة مع الضيف في الاستوديو",
  "order_id": 1,
  "assigned_to": 52,
  "status_id": 1,
  "priority_id": 2,
  "deadline": "2026-05-01",
  "task_type_id": 1
}
```
ملاحظة: الموعد النهائي للمهمة ما بيتجاوز الموعد النهائي للأوردر.

### تعيين مهمة
```json
{ "assigned_to": 52, "assigned_by": 74 }
```

### إضافة تعليق
```json
{ "user_id": 52, "comment": "خلصت التصوير" }
```

### إضافة مرفق
```json
{ "user_id": 52, "file_url": "https://...", "file_type": "image/jpeg" }
```

### إضافة علاقة/تبعية
```json
{ "related_task_id": 10, "relation_type": "depends_on" }
```
أنواع العلاقات: `depends_on`, `blocks`, `related_to`, `subtask_of`, `parent_of`

---

## 4. التصوير

### ملاحظات
- التصوير هو حدث ميداني — مش محتوى. المحتوى بيطلع من التصوير عبر خط الأنابيب
- كل تصوير لازم يكون مرتبط بأوردر
- حالة التصوير مشتقة من حالة المهمة المرتبطة فيه (مش مخزنة)

### نقاط الوصول

| الطريقة | المسار | الوصف | الصلاحية |
|---------|--------|-------|----------|
| POST | /api/shootings | إنشاء تصوير | shootings.create |
| GET | /api/shootings | كل التصويرات | shootings.view |
| GET | /api/shootings/:id | تصوير واحد | shootings.view |
| PUT | /api/shootings/:id | تعديل | shootings.edit |
| DELETE | /api/shootings/:id | حذف | shootings.edit |
| GET | /api/shootings/enriched | كل التصويرات مع (اسم الأوردر + حالة المهمة + عدد المحتوى + اسم المنشئ) | shootings.view |
| GET | /api/shootings/:id/enriched | تصوير واحد مخصب | shootings.view |
| GET | /api/shootings/:id/full | تصوير مع كل المحتوى المنتج منه | shootings.view |
| GET | /api/shootings/order/:orderId | تصويرات أوردر | shootings.view |
| GET | /api/shootings/task/:taskId | تصويرات مهمة | shootings.view |
| GET | /api/shootings/creator/:userId | تصويرات موظف | shootings.view |

### إنشاء تصوير
```json
{
  "order_id": 1,
  "task_id": 5,
  "location": "رام الله - الاستوديو",
  "start_time": "2026-05-01T10:00:00",
  "end_time": "2026-05-01T14:00:00",
  "equipment": ["كاميرا سوني", "ميكروفون لاسلكي", "إضاءة"],
  "crew": ["عمير", "محمد"],
  "notes": "تصوير خارجي — تأكد من البطاريات",
  "source_type": "internal",
  "created_by": 52
}
```
`source_type`: `"internal"` (طلب داخلي) أو `"external"` (طلب خارجي)

---

## 5. المحتوى والأرشيف

### دورة الحياة
```
المحتوى ينشأ (مسودة) → يتعدل → يصير نهائي (is_final = true) → يتأرشف تلقائي
```
- لما محتوى يترفع مرتبط بمهمة — مؤشرات الأداء بتتحدث تلقائي + إشعار بيوصل لصاحب الأوردر
- المحتوى المؤرشف قابل لإعادة الاستخدام بمهام جديدة

### خط الأنابيب: تصوير ← محتوى
من تصوير واحد ممكن يطلع عدة محتويات (تقرير + فيديو سوشال + فيديو كامل). كل محتوى بيرتبط تلقائي بالمهمة والأوردر.

### نقاط الوصول

| الطريقة | المسار | الوصف | الصلاحية |
|---------|--------|-------|----------|
| POST | /api/content | إنشاء محتوى | content.create |
| GET | /api/content | بحث وفلترة موحدة (شوف تحت) | content.view |
| GET | /api/content/:id | محتوى واحد | content.view |
| PUT | /api/content/:id | تعديل (لما يصير نهائي بيتأرشف تلقائي) | content.edit |
| DELETE | /api/content/:id | حذف | content.delete |
| POST | /api/content/from-shooting | إنشاء محتوى من تصوير (فردي) | content.create |
| POST | /api/content/from-shooting/batch | إنشاء عدة محتويات من تصوير واحد | content.create |
| GET | /api/content/types | أنواع المحتوى (فيديو/صورة/صوت/نص) | content.view |
| GET | /api/content/statuses | حالات المحتوى | content.view |
| GET | /api/content/analytics/most-reused | أكثر المحتويات إعادة استخدام (إدارة فقط) | kpi.view |
| POST | /api/content/:id/tags | إضافة وسم | content.edit |
| DELETE | /api/content/:id/tags/:tagId | حذف وسم | content.edit |
| POST | /api/content/:id/reuse | إعادة استخدام محتوى مؤرشف بمهمة جديدة | content.view |
| GET | /api/content/:id/reuse-count | كم مرة انعاد استخدام هاد المحتوى | content.view |
| GET | /api/content/:id/reuse-history | تاريخ إعادة الاستخدام (مين، متى، لأي مهمة) | content.view |
| POST | /api/content/:id/link-task | ربط محتوى بمهمة | content.edit |
| DELETE | /api/content/:id/unlink-task/:taskId | فك ربط | content.edit |
| POST | /api/content/:id/archive | أرشفة يدوية | content.archive |

### البحث والفلترة الموحدة
```
GET /api/content?keyword=مقابلة&type=1&status=2&creator=52&media_unit=1&from=2026-04-01&to=2026-04-30&archived=true&limit=10&offset=0
```
كل المعاملات اختيارية. بدون معاملات بيرجع كل المحتوى. هاد نفسه صفحة الأرشيف — بس مع `archived=true`.

### إنشاء محتوى من تصوير
```json
{
  "shooting_id": 5,
  "title": "تقرير ميداني — رام الله",
  "content_type_id": 1,
  "created_by": 52,
  "cloud_url": "https://storage.example.com/video.mp4",
  "file_size": 1024000,
  "duration": 120,
  "tags": ["ميداني", "رام الله"],
  "output_type": "report"
}
```
`output_type`: `"report"` | `"social"` | `"video"` | `"archive"`

### إنشاء عدة محتويات من تصوير واحد
```json
{
  "shooting_id": 5,
  "created_by": 52,
  "items": [
    { "title": "تقرير ميداني", "content_type_id": 1, "output_type": "report" },
    { "title": "مقطع سوشال ميديا", "content_type_id": 2, "output_type": "social" },
    { "title": "الفيديو الكامل", "content_type_id": 3, "output_type": "video" }
  ]
}
```

### إعادة استخدام محتوى مؤرشف
```json
{ "task_id": 15, "reused_by": 52 }
```


---

## 6. لوحة التحكم ومؤشرات الأداء (إدارة فقط — صلاحية: kpi.view)

### نقاط الوصول

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/kpi/dashboard | ملخص شامل |
| GET | /api/kpi/dashboard?from=2026-04-01&to=2026-04-30 | ملخص مفلتر بفترة زمنية |
| GET | /api/kpi/trends?months=6 | مقارنات شهرية (أوردرات + مهام + محتوى لكل شهر) |
| GET | /api/kpi/users | مؤشرات أداء كل الموظفين (ترتيب حسب الالتزام) |
| GET | /api/kpi/users/:userId | مؤشرات أداء موظف واحد |
| POST | /api/kpi/users/:userId/recalculate | إعادة حساب لموظف |
| GET | /api/kpi/orders/:orderId | مؤشرات أداء أوردر |
| POST | /api/kpi/orders/:orderId/recalculate | إعادة حساب لأوردر |
| GET | /api/kpi/tasks/:taskId | مؤشرات أداء مهمة |
| POST | /api/kpi/tasks/:taskId/recalculate | إعادة حساب لمهمة |
| POST | /api/kpi/recalculate-all | إعادة حساب كل المؤشرات |

### شكل رد لوحة التحكم
```json
{
  "orders": {
    "total": 50, "completed": 30, "in_progress": 15,
    "pending": 3, "overdue": 2, "completion_rate": 60
  },
  "tasks": {
    "total": 200, "completed": 150, "in_progress": 30,
    "pending": 15, "overdue": 5, "completion_rate": 75
  },
  "content": {
    "total": 100, "total_size_mb": 500, "archived": 80
  },
  "users": { "total": 37 },
  "performance": {
    "avg_task_duration_minutes": 120,
    "on_time_percentage": 85
  },
  "top_performers": [
    { "user_id": 43, "name": "أيمن عاشور", "completed_tasks": 25, "on_time_percentage": 95 }
  ],
  "reuse": {
    "total_reuses": 25,
    "top_reused": [
      { "id": 5, "title": "تقرير ميداني", "reuse_count": 8 }
    ]
  }
}
```

### مؤشرات أداء الموظف
```json
{
  "user_id": 52,
  "total_tasks_assigned": 30,
  "completed_tasks": 25,
  "pending_tasks": 3,
  "overdue_tasks": 2,
  "average_completion_time": 90,
  "on_time_percentage": 85,
  "content_produced_count": 15,
  "ai_usage_count": 10
}
```

---

## 7. الإشعارات

### نقاط الوصول (محمية بالتوكن)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/notifications | إشعاراتي (مع صفحات) |
| GET | /api/notifications/unread-count | عدد غير المقروءة (للفقاعة) |
| PATCH | /api/notifications/:id/read | تعليم إشعار كمقروء |
| PATCH | /api/notifications/read-all | تعليم الكل كمقروء |
| POST | /api/notifications/check-deadlines | فحص المواعيد القريبة (إدارة فقط) |

### الإشعارات التلقائية (بتنشأ لحالها)
- `task_assigned` — لما تتعينلك مهمة جديدة
- `task_status_changed` — لما تتغير حالة مهمتك (إلا إذا إنت اللي غيرتها)
- `content_uploaded` — لما يترفع محتوى على أوردرك
- `deadline_approaching` — لما موعد مهمتك أقل من 24 ساعة

### الإشعارات اللحظية عبر WebSocket
بعد تسجيل الدخول — الفرونت يفتح اتصال ويب سوكت:
```javascript
import { io } from 'socket.io-client';

const socket = io('https://media-center-management-system.onrender.com');

// المصادقة
socket.emit('authenticate', token);

// الاستماع
socket.on('authenticated', () => { console.log('متصل'); });
socket.on('notification', (data) => {
  // data = { id, type, title, message, entity_type, entity_id, created_at }
  // اعرض الإشعار للمستخدم
});
socket.on('auth_error', () => { console.log('التوكن غلط'); });
```

### شكل الإشعار
```json
{
  "id": 1,
  "user_id": 52,
  "type": "task_assigned",
  "title": "تم تعيين مهمة جديدة لك",
  "message": "المهمة: تصوير مقابلة — بواسطة: غازي مرتجى",
  "entity_type": "task",
  "entity_id": 15,
  "is_read": false,
  "created_at": "2026-04-28T10:00:00.000Z"
}
```

---

## 8. الصلاحيات وإدارة الأدوار (إدارة فقط)

### نقاط الوصول

| الطريقة | المسار | الوصف | الصلاحية |
|---------|--------|-------|----------|
| GET | /api/permissions | كل الصلاحيات المتاحة بالنظام | roles.manage |
| GET | /api/permissions/roles/:roleId | صلاحيات دور معين | roles.manage |
| GET | /api/permissions/users/:userId/roles | أدوار مستخدم | users.manage |
| GET | /api/permissions/users/:userId/permissions | صلاحيات مستخدم (مجمعة من كل أدواره) | users.manage |
| POST | /api/permissions/users/:userId/roles | إضافة دور لمستخدم | roles.manage |
| DELETE | /api/permissions/users/:userId/roles/:roleId | حذف دور من مستخدم | roles.manage |

### الصلاحيات المتاحة
```
orders.view, orders.create, orders.edit, orders.delete
tasks.view, tasks.create, tasks.assign, tasks.edit, tasks.delete
shootings.view, shootings.create, shootings.edit
content.view, content.create, content.edit, content.delete, content.archive
programs.view, programs.edit
users.view, users.manage
roles.manage
kpi.view
settings.manage
```

### ملاحظات مهمة
- كل مستخدم ممكن يكون عنده أكثر من دور
- الصلاحيات بتتجمع من كل الأدوار
- لوحة التحكم ومؤشرات الأداء وإدارة المستخدمين — فقط للإدارة
- باقي الصلاحيات — لكل الموظفين
- الفرونت لازم يستخدم `GET /api/auth/me` بعد تسجيل الدخول عشان يعرف صلاحيات المستخدم ويعرض/يخفي الأقسام حسبها

---

## 9. البورتال — الأقسام والفرق والمستخدمين والأدوار

### الأقسام (Desks)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/portal/desks | كل الأقسام (مع اسم المدير) |
| GET | /api/portal/desks/:id | قسم واحد |
| GET | /api/portal/desks/:id/with-teams | قسم مع كل فرقه |
| POST | /api/portal/desks | إنشاء قسم |
| PUT | /api/portal/desks/:id | تعديل قسم |
| DELETE | /api/portal/desks/:id | حذف قسم |

### الفرق (Teams)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/portal/teams | كل الفرق |
| GET | /api/portal/teams/:id | فريق واحد |
| GET | /api/portal/teams/desk/:deskId | فرق قسم معين |
| POST | /api/portal/teams | إنشاء فريق |
| PUT | /api/portal/teams/:id | تعديل فريق |
| DELETE | /api/portal/teams/:id | حذف فريق |
| POST | /api/portal/teams/:id/members | إضافة عضو للفريق |
| DELETE | /api/portal/teams/:id/members/:userId | حذف عضو |
| GET | /api/portal/teams/:id/members | أعضاء الفريق |

### المستخدمين (Users)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/portal/users | كل المستخدمين (مع اسم الدور) |
| GET | /api/portal/users/:id | مستخدم واحد |
| GET | /api/portal/users/:id/with-role | مستخدم مع تفاصيل دوره |
| GET | /api/portal/users/team/:teamId | مستخدمين فريق معين |
| POST | /api/portal/users | إنشاء مستخدم |
| PUT | /api/portal/users/:id | تعديل مستخدم |
| DELETE | /api/portal/users/:id | حذف مستخدم |

### الأدوار (Roles)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/portal/roles | كل الأدوار |
| GET | /api/portal/roles/:id | دور واحد |
| POST | /api/portal/roles | إنشاء دور |
| PUT | /api/portal/roles/:id | تعديل دور |
| DELETE | /api/portal/roles/:id | حذف دور |

### الوحدات الإعلامية (Media Units)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/portal/media-units | كل الوحدات |
| GET | /api/portal/media-units/:id | وحدة واحدة |
| POST | /api/portal/media-units | إنشاء وحدة |
| PUT | /api/portal/media-units/:id | تعديل وحدة |
| DELETE | /api/portal/media-units/:id | حذف وحدة |

---

## 10. البرامج والحلقات والضيوف

### البرامج (Programs)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/portal/programs | كل البرامج (مع اسم الوحدة الإعلامية) |
| GET | /api/portal/programs/:id | برنامج واحد |
| GET | /api/portal/programs/:id/with-episodes | برنامج مع كل حلقاته |
| GET | /api/portal/programs/:id/with-roles | برنامج مع فريقه (مذيع، معد، منتج...) |
| POST | /api/portal/programs | إنشاء برنامج |
| PUT | /api/portal/programs/:id | تعديل برنامج |
| DELETE | /api/portal/programs/:id | حذف برنامج |

### الحلقات (Episodes)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/portal/episodes | كل الحلقات (فلترة بـ ?program_id=X) |
| GET | /api/portal/episodes/:id | حلقة واحدة |
| GET | /api/portal/episodes/:id/with-guests | حلقة مع ضيوفها |
| GET | /api/portal/episodes/enriched | كل الحلقات مخصبة (الحالة + اسم البرنامج + عدد الضيوف + عدد المحتوى) |
| GET | /api/portal/episodes/:id/enriched | حلقة واحدة مخصبة |
| GET | /api/portal/episodes/:id/full | حلقة مع كل التفاصيل (ضيوف + مهام + محتوى) |
| POST | /api/portal/episodes | إنشاء حلقة |
| PUT | /api/portal/episodes/:id | تعديل حلقة |
| DELETE | /api/portal/episodes/:id | حذف حلقة |
| POST | /api/portal/episodes/:id/guests | إضافة ضيف لحلقة |
| DELETE | /api/portal/episodes/:id/guests/:guestId | حذف ضيف من حلقة |
| GET | /api/portal/episodes/:id/guests | ضيوف حلقة |

**ملاحظة مهمة عن حالة الحلقة:**
الحلقة ما عندها حالة مخزنة بالداتابيس. الحالة محسوبة من الأوردر المرتبط فيها. لما تستخدم نقطة الوصول المخصبة (`/enriched`) بترجع الحالة تلقائي. إذا الحلقة ما إلها أوردر — حالتها "مسودة".

### الضيوف (Guests)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/portal/guests | كل الضيوف |
| GET | /api/portal/guests/:id | ضيف واحد |
| GET | /api/portal/guests/search | بحث بالاسم |
| POST | /api/portal/guests | إنشاء ضيف |
| PUT | /api/portal/guests/:id | تعديل ضيف |
| DELETE | /api/portal/guests/:id | حذف ضيف |

### أدوار البرامج — ربط الموظفين بالبرامج (Program Roles)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/portal/program-roles | كل الأدوار بالبرامج |
| GET | /api/portal/program-roles/:id | دور واحد |
| GET | /api/portal/program-roles/program/:programId | فريق برنامج معين |
| GET | /api/portal/program-roles/user/:userId | برامج موظف معين |
| GET | /api/portal/program-roles/program/:programId/presenters | مذيعين برنامج |
| GET | /api/portal/program-roles/program/:programId/producers | منتجين برنامج |
| POST | /api/portal/program-roles | إضافة موظف لبرنامج بدور معين |
| PUT | /api/portal/program-roles/:id | تعديل الدور |
| DELETE | /api/portal/program-roles/:id | حذف |

### ربط المستخدمين بالفرق (Team Users)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/portal/team-users | أعضاء الفرق (فلترة بـ ?team_id=X أو ?user_id=X) |
| POST | /api/portal/team-users | إضافة مستخدم لفريق |
| DELETE | /api/portal/team-users/:teamId/:userId | حذف مستخدم من فريق |

### ربط الضيوف بالحلقات (Episode Guests)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | /api/portal/episode-guests | كل الربط (فلترة بـ ?episode_id=X أو ?guest_id=X) |
| POST | /api/portal/episode-guests | إضافة ضيف لحلقة |
| DELETE | /api/portal/episode-guests/:episodeId/:guestId | حذف ضيف من حلقة |

---

## 11. الربط مع نظام الأخبار والذكاء الاصطناعي

النظام مرتبط بنظام أخبار وذكاء اصطناعي منفصل على نفس الداتابيس. المهام المتعلقة بالأخبار (تحرير، موجز، نشرة) بتنفذ هناك والمخرجات بترجع هون كمحتوى.

### كيف بيشتغل
1. المدير ينشئ أوردر ومهمة متعلقة بالأخبار
2. الموظف يفتح المهمة — يشوف زر يوديه لنظام الأخبار
3. الموظف يشتغل هناك (يحرر أخبار، يستخدم أدوات الذكاء الاصطناعي)
4. المخرجات (الأخبار المنشورة) بترجع هون كمحتوى مربوط بالمهمة
5. مؤشرات الأداء بتتحدث — إشعار بيوصل للمدير

### أدوات الذكاء الاصطناعي المتاحة (بنظام الأخبار)
- محادثة ذكية
- تلخيص نصوص
- إعادة صياغة
- توليد أفكار وأسئلة وعناوين
- تحويل صوت لنص (مع دعم العربية)
- تحويل نص لصوت (6 أصوات مختلفة)
- استخراج صوت من فيديو
- تحويل فيديو لنص

---

## 12. الفلو الكامل للنظام

```
1. تسجيل الدخول → POST /api/auth/login → توكن
2. فتح اتصال ويب سوكت → إشعارات لحظية
3. إنشاء أوردر → POST /api/orders (مرتبط ببرنامج/حلقة)
4. إنشاء مهام → POST /api/tasks (مرتبطة بالأوردر)
5. تعيين المهام → POST /api/tasks/:id/assign (إشعار للموظف)
6. تنفيذ المهمة:
   - تصوير → POST /api/shootings
   - أو تحرير أخبار → نظام الأخبار
   - أو مونتاج/جرافيك → رفع محتوى مباشرة
7. إنشاء محتوى:
   - من تصوير → POST /api/content/from-shooting
   - أو مباشرة → POST /api/content
   - أو من نظام الأخبار → استيراد تلقائي
8. المحتوى يصير نهائي → يتأرشف تلقائي
9. مؤشرات الأداء تتحدث تلقائي (مهمة + أوردر + موظف)
10. إشعار يوصل لصاحب الأوردر
11. لوحة التحكم تعرض كلشي للإدارة
```
