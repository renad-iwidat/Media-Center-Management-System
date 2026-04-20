# توثيق API الكامل - نظام إدارة المركز الإعلامي

## نظرة عامة

هذا المستند يوثق بالتفصيل جميع الـ API endpoints في نظام إدارة المركز الإعلامي، مع شرح كامل للبيانات المرسلة والمستقبلة والربط بين الفرونت إند والباك إند.

### معلومات أساسية

- **Base URL للباك إند**: `http://localhost:3000/api/portal`
- **قاعدة البيانات**: PostgreSQL
- **الفرونت إند**: React + TypeScript + Vite
- **الباك إند**: Node.js + Express + TypeScript

---

## 1. إدارة الموظفين (Users)

### 1.1 جلب جميع الموظفين

**Endpoint**: `GET /api/portal/users`

**الاستخدام في الفرونت إند**:
```typescript
// في portal-frontend/src/pages/Users.tsx
const response = await userAPI.getAll();
```

**Request**: لا يوجد body

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "role_id": "2",
      "role_name": "مقدم برامج",
      "work_days": "السبت,الأحد,الاثنين,الثلاثاء,الأربعاء",
      "start_time": "09:00",
      "end_time": "17:00",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

**الربط مع الفرونت إند**:
- يتم عرض البيانات في جدول في صفحة `/users`
- يتم تحويل الوقت من 24 ساعة إلى 12 ساعة باستخدام `convertTo12Hour()`
- يتم عرض `role_name` بدلاً من `role_id`

---

### 1.2 إنشاء موظف جديد

**Endpoint**: `POST /api/portal/users`

**الاستخدام في الفرونت إند**:
```typescript
// في portal-frontend/src/pages/Users.tsx - handleSubmit()
await userAPI.create({
  name: formData.name,
  email: formData.email,
  role_id: formData.role_id ? parseInt(formData.role_id) : undefined,
  work_days: formData.work_days.join(','),
  start_time: formData.start_time,
  end_time: formData.end_time
});
```

**Request Body**:
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "role_id": 2,
  "work_days": "السبت,الأحد,الاثنين",
  "start_time": "09:00",
  "end_time": "17:00"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "5",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "role_id": "2",
    "role_name": "مقدم برامج",
    "work_days": "السبت,الأحد,الاثنين",
    "start_time": "09:00",
    "end_time": "17:00",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "User created successfully"
}
```

**معالجة البيانات في الباك إند**:
1. `UserController.createUser()` يستقبل الطلب
2. يتحقق من وجود `name` و `email` (مطلوبان)
3. يحول `role_id` إلى `BigInt` إذا كان موجوداً
4. `UserService.createUser()` ينفذ الـ INSERT في قاعدة البيانات
5. يجلب `role_name` من جدول `roles` ويضيفه للنتيجة

---

### 1.3 تحديث موظف

**Endpoint**: `PUT /api/portal/users/:id`

**الاستخدام في الفرونت إند**:
```typescript
await userAPI.update(editingId, {
  name: formData.name,
  email: formData.email,
  role_id: formData.role_id ? parseInt(formData.role_id) : undefined,
  work_days: formData.work_days.join(','),
  start_time: formData.start_time,
  end_time: formData.end_time
});
```

**Request Body**: نفس بيانات الإنشاء (جميع الحقول اختيارية)

**Response**: نفس استجابة الإنشاء

---

### 1.4 حذف موظف

**Endpoint**: `DELETE /api/portal/users/:id`

**الاستخدام في الفرونت إند**:
```typescript
await userAPI.delete(id);
```

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 2. إدارة البرامج (Programs)

### 2.1 جلب جميع البرامج

**Endpoint**: `GET /api/portal/programs`

**الاستخدام في الفرونت إند**:
```typescript
// في portal-frontend/src/pages/Programs.tsx
const response = await programAPI.getAll();
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "برنامج الصباح",
      "description": "برنامج صباحي يومي",
      "media_unit_id": "1",
      "media_unit_name": "التلفزيون",
      "air_time": "08:00",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

**الربط مع الفرونت إند**:
- يتم عرض البرامج في جدول رئيسي
- عند الضغط على برنامج، يتم تحديد `selectedProgram` وجلب حلقاته
- يتم تحويل `air_time` إلى صيغة 12 ساعة

---

### 2.2 إنشاء برنامج جديد

**Endpoint**: `POST /api/portal/programs`

**Request Body**:
```json
{
  "title": "برنامج المساء",
  "description": "برنامج مسائي",
  "media_unit_id": 1,
  "air_time": "20:00"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "3",
    "title": "برنامج المساء",
    "description": "برنامج مسائي",
    "media_unit_id": "1",
    "media_unit_name": "التلفزيون",
    "air_time": "20:00",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Program created successfully"
}
```

---

### 2.3 تحديث برنامج

**Endpoint**: `PUT /api/portal/programs/:id`

**Request Body**: نفس بيانات الإنشاء (جميع الحقول اختيارية)

---

### 2.4 حذف برنامج

**Endpoint**: `DELETE /api/portal/programs/:id`

---

## 3. إدارة الحلقات (Episodes)

### 3.1 جلب حلقات برنامج معين

**Endpoint**: `GET /api/portal/episodes?program_id={programId}`

**الاستخدام في الفرونت إند**:
```typescript
// في portal-frontend/src/pages/Programs.tsx
const response = await episodeAPI.getByProgram(programId);
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "program_id": "1",
      "title": "الحلقة الأولى",
      "episode_number": 1,
      "air_date": "2024-01-20",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

**الربط مع الفرونت إند**:
- يتم جلب الحلقات تلقائياً عند اختيار برنامج
- يتم عرضها في جدول منفصل بجانب جدول البرامج
- عند الضغط على حلقة، يتم جلب ضيوفها

---

### 3.2 إنشاء حلقة جديدة

**Endpoint**: `POST /api/portal/episodes`

**Request Body**:
```json
{
  "program_id": "1",
  "title": "الحلقة الثانية",
  "episode_number": 2,
  "air_date": "2024-01-21"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "2",
    "program_id": "1",
    "title": "الحلقة الثانية",
    "episode_number": 2,
    "air_date": "2024-01-21",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Episode created successfully"
}
```

---

## 4. إدارة الضيوف (Guests)

### 4.1 جلب جميع الضيوف

**Endpoint**: `GET /api/portal/guests`

**الاستخدام في الفرونت إند**:
```typescript
// في portal-frontend/src/pages/Guests.tsx
const response = await guestAPI.getAll();
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "د. محمد علي",
      "title": "أستاذ جامعي",
      "bio": "متخصص في الاقتصاد",
      "phone": "+966501234567",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 4.2 إنشاء ضيف جديد

**Endpoint**: `POST /api/portal/guests`

**Request Body**:
```json
{
  "name": "د. فاطمة أحمد",
  "title": "طبيبة",
  "bio": "استشارية في طب الأطفال",
  "phone": "+966507654321"
}
```

---

### 4.3 البحث عن ضيف

**Endpoint**: `GET /api/portal/guests/search?name={searchTerm}`

**Response**: نفس استجابة جلب جميع الضيوف

---

## 5. إدارة ضيوف الحلقات (Episode Guests)

### 5.1 جلب ضيوف حلقة معينة

**Endpoint**: `GET /api/portal/episode-guests?episode_id={episodeId}`

**الاستخدام في الفرونت إند**:
```typescript
// في portal-frontend/src/pages/Programs.tsx
const response = await episodeGuestAPI.getByEpisode(episodeId);
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "episode_id": "1",
      "guest_id": "1",
      "name": "د. محمد علي",
      "title": "أستاذ جامعي",
      "bio": "متخصص في الاقتصاد",
      "phone": "+966501234567"
    }
  ]
}
```

**ملاحظة**: البيانات تأتي من JOIN بين `episode_guests` و `guests`

---

### 5.2 إضافة ضيف لحلقة

**Endpoint**: `POST /api/portal/episode-guests`

**Request Body**:
```json
{
  "episode_id": "1",
  "guest_id": "2"
}
```

**الاستخدام في الفرونت إند**:
```typescript
await episodeGuestAPI.create({
  episode_id: selectedEpisode,
  guest_id: formData.guest_id
});
```

---

### 5.3 حذف ضيف من حلقة

**Endpoint**: `DELETE /api/portal/episode-guests/:episodeId/:guestId`

**الاستخدام في الفرونت إند**:
```typescript
await episodeGuestAPI.delete(episodeId, guestId);
```

---

## 6. إدارة الأقسام (Desks)

### 6.1 جلب جميع الأقسام

**Endpoint**: `GET /api/portal/desks`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "قسم الإنتاج",
      "description": "مسؤول عن إنتاج البرامج",
      "manager_id": "3",
      "manager_name": "خالد أحمد",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

**الربط مع الفرونت إند**:
- يتم عرض الأقسام في جدول رئيسي
- عند الضغط على قسم، يتم جلب فرقه
- يتم عرض اسم المدير من خلال JOIN مع جدول `users`

---

### 6.2 إنشاء قسم جديد

**Endpoint**: `POST /api/portal/desks`

**Request Body**:
```json
{
  "name": "قسم المونتاج",
  "description": "مسؤول عن المونتاج والتحرير",
  "manager_id": 5
}
```

---

## 7. إدارة الفرق (Teams)

### 7.1 جلب فرق قسم معين

**Endpoint**: `GET /api/portal/teams?desk_id={deskId}`

**الاستخدام في الفرونت إند**:
```typescript
// في portal-frontend/src/pages/Desks.tsx
const response = await teamAPI.getByDesk(deskId);
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "desk_id": "1",
      "name": "فريق الإنتاج الصباحي",
      "manager_id": "4",
      "manager_name": "سارة محمد",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 7.2 إنشاء فريق جديد

**Endpoint**: `POST /api/portal/teams`

**Request Body**:
```json
{
  "desk_id": "1",
  "name": "فريق الإنتاج المسائي",
  "manager_id": 6
}
```

---

## 8. إدارة موظفي الفرق (Team Users)

### 8.1 جلب موظفي فريق معين

**Endpoint**: `GET /api/portal/team-users?team_id={teamId}`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "2",
      "name": "علي حسن",
      "email": "ali@example.com",
      "role_id": "3",
      "role_name": "مصور"
    }
  ]
}
```

---

### 8.2 إضافة موظف لفريق

**Endpoint**: `POST /api/portal/team-users`

**Request Body**:
```json
{
  "team_id": "1",
  "user_id": "7"
}
```

---

### 8.3 حذف موظف من فريق

**Endpoint**: `DELETE /api/portal/team-users/:teamId/:userId`

---

## 9. إدارة الأدوار (Roles)

### 9.1 جلب جميع الأدوار

**Endpoint**: `GET /api/portal/roles`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "مدير",
      "description": "مدير القسم"
    },
    {
      "id": "2",
      "name": "مقدم برامج",
      "description": "مقدم ومذيع"
    }
  ],
  "count": 2
}
```

---

### 9.2 إنشاء دور جديد

**Endpoint**: `POST /api/portal/roles`

**Request Body**:
```json
{
  "name": "مونتير",
  "description": "مسؤول عن المونتاج"
}
```

---

## 10. إدارة الوحدات الإعلامية (Media Units)

### 10.1 جلب جميع الوحدات الإعلامية

**Endpoint**: `GET /api/portal/media-units`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "التلفزيون",
      "description": "القناة التلفزيونية"
    },
    {
      "id": "2",
      "name": "الراديو",
      "description": "الإذاعة"
    }
  ]
}
```

---

## 11. إدارة أدوار البرامج (Program Roles)

### 11.1 جلب أدوار برنامج معين

**Endpoint**: `GET /api/portal/program-roles?program_id={programId}`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "program_id": "1",
      "user_id": "2",
      "role_id": "2",
      "user_name": "أحمد محمد",
      "role_name": "مقدم برامج",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 11.2 إضافة موظف لبرنامج بدور معين

**Endpoint**: `POST /api/portal/program-roles`

**Request Body**:
```json
{
  "program_id": "1",
  "user_id": "3",
  "role_id": "4"
}
```

---

## تدفق البيانات (Data Flow)

### مثال: إضافة موظف جديد

1. **الفرونت إند** (Users.tsx):
   ```typescript
   // المستخدم يملأ النموذج
   const formData = {
     name: "أحمد محمد",
     email: "ahmed@example.com",
     role_id: "2",
     work_days: ["السبت", "الأحد"],
     start_time: "09:00",
     end_time: "17:00"
   };
   
   // عند الضغط على حفظ
   await userAPI.create({
     ...formData,
     role_id: parseInt(formData.role_id),
     work_days: formData.work_days.join(',')
   });
   ```

2. **API Client** (client.ts):
   ```typescript
   // يرسل POST request
   axios.post('/api/portal/users', data)
   ```

3. **Routes** (users.ts):
   ```typescript
   router.post('/', UserController.createUser)
   ```

4. **Controller** (UserController.ts):
   ```typescript
   // يتحقق من البيانات
   if (!name || !email) {
     return res.status(400).json({ error: 'Required fields missing' });
   }
   
   // يستدعي Service
   const user = await userService.createUser(data);
   ```

5. **Service** (UserService.ts):
   ```typescript
   // ينفذ INSERT في قاعدة البيانات
   const result = await pool.query(`
     INSERT INTO users (name, email, role_id, work_days, start_time, end_time)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *
   `, [name, email, role_id, work_days, start_time, end_time]);
   
   // يجلب اسم الدور
   const roleResult = await pool.query(`
     SELECT name FROM roles WHERE id = $1
   `, [role_id]);
   
   return { ...user, role_name: roleResult.rows[0].name };
   ```

6. **Response يرجع للفرونت إند**:
   ```json
   {
     "success": true,
     "data": {
       "id": "5",
       "name": "أحمد محمد",
       "email": "ahmed@example.com",
       "role_id": "2",
       "role_name": "مقدم برامج",
       "work_days": "السبت,الأحد",
       "start_time": "09:00",
       "end_time": "17:00"
     }
   }
   ```

7. **الفرونت إند يحدث الواجهة**:
   ```typescript
   // يغلق النموذج
   setIsModalOpen(false);
   
   // يعيد جلب القائمة
   await fetchUsers();
   ```

---

## هيكل قاعدة البيانات

### الجداول الرئيسية:

1. **users** - الموظفون
   - id, name, email, role_id, work_days, start_time, end_time

2. **roles** - الأدوار الوظيفية
   - id, name, description

3. **desks** - الأقسام
   - id, name, description, manager_id

4. **teams** - الفرق
   - id, desk_id, name, manager_id

5. **team_users** - ربط الموظفين بالفرق
   - team_id, user_id

6. **programs** - البرامج
   - id, title, description, media_unit_id, air_time

7. **episodes** - الحلقات
   - id, program_id, title, episode_number, air_date

8. **guests** - الضيوف
   - id, name, title, bio, phone

9. **episode_guests** - ربط الضيوف بالحلقات
   - episode_id, guest_id

10. **program_roles** - ربط الموظفين بالبرامج
    - id, program_id, user_id, role_id

11. **media_units** - الوحدات الإعلامية
    - id, name, description

---

## معالجة الأخطاء

### في الباك إند:
```typescript
try {
  // العملية
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Failed to ...',
    message: error.message
  });
}
```

### في الفرونت إند:
```typescript
try {
  await userAPI.create(data);
} catch (err: any) {
  const errorMsg = err.response?.data?.message || 'فشل في الحفظ';
  alert(errorMsg);
}
```

---

## ملاحظات مهمة

1. **BigInt Handling**: جميع الـ IDs يتم تحويلها من BigInt إلى String في الباك إند
2. **CORS**: مفعّل للسماح بالاتصال من الفرونت إند
3. **Response Interceptor**: في الفرونت إند يستخرج `data` من الاستجابة تلقائياً
4. **التحقق من البيانات**: يتم في الـ Controller قبل إرسالها للـ Service
5. **JOIN Queries**: تستخدم لجلب البيانات المرتبطة (مثل role_name, manager_name)

---

## الخلاصة

النظام يتبع معمارية ثلاثية الطبقات:
- **Frontend (React)**: واجهة المستخدم
- **Backend (Express)**: API Layer
- **Database (PostgreSQL)**: طبقة البيانات

كل endpoint له مسار واضح من الفرونت إند → API Client → Routes → Controller → Service → Database والعكس.
