# مرجع سريع لجميع API Endpoints

## جدول المحتويات
1. [Users - الموظفون](#users)
2. [Roles - الأدوار](#roles)
3. [Desks - الأقسام](#desks)
4. [Teams - الفرق](#teams)
5. [Team Users - موظفو الفرق](#team-users)
6. [Programs - البرامج](#programs)
7. [Episodes - الحلقات](#episodes)
8. [Guests - الضيوف](#guests)
9. [Episode Guests - ضيوف الحلقات](#episode-guests)
10. [Program Roles - أدوار البرامج](#program-roles)
11. [Media Units - الوحدات الإعلامية](#media-units)

---

## <a name="users"></a>1. Users - الموظفون

### GET /api/portal/users
جلب جميع الموظفين

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "string",
      "email": "string",
      "role_id": "string",
      "role_name": "string",
      "work_days": "string",
      "start_time": "string",
      "end_time": "string",
      "created_at": "string"
    }
  ],
  "count": 0
}
```

---

### GET /api/portal/users/:id
جلب موظف محدد

**Parameters**:
- `id` (path) - معرف الموظف

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "string",
    "email": "string",
    "role_id": "string",
    "work_days": "string",
    "start_time": "string",
    "end_time": "string",
    "created_at": "string"
  }
}
```

---

### GET /api/portal/users/:id/with-role
جلب موظف مع تفاصيل دوره

**Parameters**:
- `id` (path) - معرف الموظف

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "string",
    "email": "string",
    "role_id": "string",
    "role_name": "string",
    "role_description": "string",
    "work_days": "string",
    "start_time": "string",
    "end_time": "string",
    "created_at": "string"
  }
}
```

---

### POST /api/portal/users
إنشاء موظف جديد

**Request Body**:
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "role_id": "number (optional)",
  "work_days": "string (optional)",
  "start_time": "string (optional)",
  "end_time": "string (optional)"
}
```

**Response**: نفس GET /users/:id

---

### PUT /api/portal/users/:id
تحديث موظف

**Parameters**:
- `id` (path) - معرف الموظف

**Request Body**: نفس POST (جميع الحقول اختيارية)

**Response**: نفس GET /users/:id

---

### DELETE /api/portal/users/:id
حذف موظف

**Parameters**:
- `id` (path) - معرف الموظف

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## <a name="roles"></a>2. Roles - الأدوار

### GET /api/portal/roles
جلب جميع الأدوار

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "string",
      "description": "string"
    }
  ],
  "count": 0
}
```

---

### GET /api/portal/roles/:id
جلب دور محدد

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "string",
    "description": "string"
  }
}
```

---

### POST /api/portal/roles
إنشاء دور جديد

**Request Body**:
```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

---

### PUT /api/portal/roles/:id
تحديث دور

**Request Body**:
```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```

---

### DELETE /api/portal/roles/:id
حذف دور

---

## <a name="desks"></a>3. Desks - الأقسام

### GET /api/portal/desks
جلب جميع الأقسام

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "string",
      "description": "string",
      "manager_id": "string",
      "manager_name": "string",
      "created_at": "string"
    }
  ],
  "count": 0
}
```

---

### GET /api/portal/desks/:id
جلب قسم محدد

---

### GET /api/portal/desks/:id/with-teams
جلب قسم مع فرقه

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "string",
    "description": "string",
    "manager_id": "string",
    "manager_name": "string",
    "teams": [
      {
        "id": "1",
        "desk_id": "1",
        "name": "string",
        "manager_id": "string",
        "created_at": "string"
      }
    ]
  }
}
```

---

### POST /api/portal/desks
إنشاء قسم جديد

**Request Body**:
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "manager_id": "number (optional)"
}
```

---

### PUT /api/portal/desks/:id
تحديث قسم

---

### DELETE /api/portal/desks/:id
حذف قسم

---

## <a name="teams"></a>4. Teams - الفرق

### GET /api/portal/teams
جلب جميع الفرق

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "desk_id": "1",
      "name": "string",
      "manager_id": "string",
      "manager_name": "string",
      "created_at": "string"
    }
  ],
  "count": 0
}
```

---

### GET /api/portal/teams?desk_id={deskId}
جلب فرق قسم معين

**Query Parameters**:
- `desk_id` - معرف القسم

---

### GET /api/portal/teams/:id
جلب فريق محدد

---

### POST /api/portal/teams
إنشاء فريق جديد

**Request Body**:
```json
{
  "desk_id": "string (required)",
  "name": "string (required)",
  "manager_id": "number (optional)"
}
```

---

### PUT /api/portal/teams/:id
تحديث فريق

**Request Body**:
```json
{
  "name": "string (optional)",
  "manager_id": "number (optional)"
}
```

---

### DELETE /api/portal/teams/:id
حذف فريق

---

## <a name="team-users"></a>5. Team Users - موظفو الفرق

### GET /api/portal/team-users?team_id={teamId}
جلب موظفي فريق معين

**Query Parameters**:
- `team_id` - معرف الفريق

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "string",
      "email": "string",
      "role_id": "string",
      "role_name": "string"
    }
  ]
}
```

---

### GET /api/portal/team-users?user_id={userId}
جلب الفرق التي ينتمي إليها موظف

**Query Parameters**:
- `user_id` - معرف الموظف

---

### POST /api/portal/team-users
إضافة موظف لفريق

**Request Body**:
```json
{
  "team_id": "string (required)",
  "user_id": "string (required)"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User added to team successfully"
}
```

---

### DELETE /api/portal/team-users/:teamId/:userId
حذف موظف من فريق

**Parameters**:
- `teamId` (path) - معرف الفريق
- `userId` (path) - معرف الموظف

---

## <a name="programs"></a>6. Programs - البرامج

### GET /api/portal/programs
جلب جميع البرامج

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "string",
      "description": "string",
      "media_unit_id": "string",
      "media_unit_name": "string",
      "air_time": "string",
      "created_at": "string"
    }
  ],
  "count": 0
}
```

---

### GET /api/portal/programs/:id
جلب برنامج محدد

---

### GET /api/portal/programs/:id/with-episodes
جلب برنامج مع حلقاته

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "string",
    "description": "string",
    "media_unit_id": "string",
    "media_unit_name": "string",
    "air_time": "string",
    "episodes": [
      {
        "id": "1",
        "program_id": "1",
        "title": "string",
        "episode_number": 0,
        "air_date": "string",
        "created_at": "string"
      }
    ]
  }
}
```

---

### GET /api/portal/programs/:id/with-roles
جلب برنامج مع فريق العمل

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "string",
    "team_members": [
      {
        "id": "1",
        "program_id": "1",
        "user_id": "1",
        "role": "string",
        "name": "string",
        "email": "string"
      }
    ]
  }
}
```

---

### POST /api/portal/programs
إنشاء برنامج جديد

**Request Body**:
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "media_unit_id": "number (optional)",
  "air_time": "string (optional)"
}
```

---

### PUT /api/portal/programs/:id
تحديث برنامج

---

### DELETE /api/portal/programs/:id
حذف برنامج

---

## <a name="episodes"></a>7. Episodes - الحلقات

### GET /api/portal/episodes
جلب جميع الحلقات

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "program_id": "1",
      "title": "string",
      "episode_number": 0,
      "air_date": "string",
      "created_at": "string"
    }
  ],
  "count": 0
}
```

---

### GET /api/portal/episodes?program_id={programId}
جلب حلقات برنامج معين

**Query Parameters**:
- `program_id` - معرف البرنامج

---

### GET /api/portal/episodes/:id
جلب حلقة محددة

---

### GET /api/portal/episodes/:id/with-guests
جلب حلقة مع ضيوفها

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "program_id": "1",
    "title": "string",
    "episode_number": 0,
    "air_date": "string",
    "guests": [
      {
        "id": "1",
        "name": "string",
        "title": "string",
        "bio": "string",
        "phone": "string"
      }
    ]
  }
}
```

---

### POST /api/portal/episodes
إنشاء حلقة جديدة

**Request Body**:
```json
{
  "program_id": "string (required)",
  "title": "string (required)",
  "episode_number": "number (optional)",
  "air_date": "string (optional)"
}
```

---

### PUT /api/portal/episodes/:id
تحديث حلقة

**Request Body**:
```json
{
  "title": "string (optional)",
  "episode_number": "number (optional)",
  "air_date": "string (optional)"
}
```

---

### DELETE /api/portal/episodes/:id
حذف حلقة

---

## <a name="guests"></a>8. Guests - الضيوف

### GET /api/portal/guests
جلب جميع الضيوف

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "string",
      "title": "string",
      "bio": "string",
      "phone": "string",
      "created_at": "string"
    }
  ],
  "count": 0
}
```

---

### GET /api/portal/guests/:id
جلب ضيف محدد

---

### GET /api/portal/guests/search?name={searchTerm}
البحث عن ضيف بالاسم

**Query Parameters**:
- `name` - نص البحث

---

### POST /api/portal/guests
إنشاء ضيف جديد

**Request Body**:
```json
{
  "name": "string (required)",
  "title": "string (optional)",
  "bio": "string (optional)",
  "phone": "string (optional)"
}
```

---

### PUT /api/portal/guests/:id
تحديث ضيف

---

### DELETE /api/portal/guests/:id
حذف ضيف

---

## <a name="episode-guests"></a>9. Episode Guests - ضيوف الحلقات

### GET /api/portal/episode-guests?episode_id={episodeId}
جلب ضيوف حلقة معينة

**Query Parameters**:
- `episode_id` - معرف الحلقة

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "episode_id": "1",
      "guest_id": "1",
      "name": "string",
      "title": "string",
      "bio": "string",
      "phone": "string"
    }
  ]
}
```

---

### GET /api/portal/episode-guests?guest_id={guestId}
جلب الحلقات التي ظهر فيها ضيف

**Query Parameters**:
- `guest_id` - معرف الضيف

---

### POST /api/portal/episode-guests
إضافة ضيف لحلقة

**Request Body**:
```json
{
  "episode_id": "string (required)",
  "guest_id": "string (required)"
}
```

---

### DELETE /api/portal/episode-guests/:episodeId/:guestId
حذف ضيف من حلقة

**Parameters**:
- `episodeId` (path) - معرف الحلقة
- `guestId` (path) - معرف الضيف

---

## <a name="program-roles"></a>10. Program Roles - أدوار البرامج

### GET /api/portal/program-roles?program_id={programId}
جلب فريق عمل برنامج

**Query Parameters**:
- `program_id` - معرف البرنامج

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "program_id": "1",
      "user_id": "1",
      "role_id": "1",
      "user_name": "string",
      "role_name": "string",
      "created_at": "string"
    }
  ]
}
```

---

### GET /api/portal/program-roles?user_id={userId}
جلب البرامج التي يعمل فيها موظف

**Query Parameters**:
- `user_id` - معرف الموظف

---

### POST /api/portal/program-roles
إضافة موظف لبرنامج بدور معين

**Request Body**:
```json
{
  "program_id": "string (required)",
  "user_id": "string (required)",
  "role_id": "string (required)"
}
```

---

### PUT /api/portal/program-roles/:id
تحديث دور موظف في برنامج

**Request Body**:
```json
{
  "role_id": "string (required)"
}
```

---

### DELETE /api/portal/program-roles/:id
حذف موظف من برنامج

---

## <a name="media-units"></a>11. Media Units - الوحدات الإعلامية

### GET /api/portal/media-units
جلب جميع الوحدات الإعلامية

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "string",
      "description": "string",
      "created_at": "string"
    }
  ]
}
```

---

### GET /api/portal/media-units/:id
جلب وحدة إعلامية محددة

---

### POST /api/portal/media-units
إنشاء وحدة إعلامية جديدة

**Request Body**:
```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

---

### PUT /api/portal/media-units/:id
تحديث وحدة إعلامية

---

### DELETE /api/portal/media-units/:id
حذف وحدة إعلامية

---

## ملاحظات عامة

### رموز الحالة (Status Codes)
- `200` - نجاح العملية
- `201` - تم الإنشاء بنجاح
- `400` - خطأ في البيانات المرسلة
- `404` - المورد غير موجود
- `500` - خطأ في الخادم

### تنسيق الاستجابة
جميع الاستجابات تتبع التنسيق التالي:
```json
{
  "success": true/false,
  "data": {},
  "message": "string (optional)",
  "error": "string (optional)",
  "count": 0 (optional)
}
```

### المصادقة
حالياً لا يوجد نظام مصادقة. يمكن إضافة JWT في المستقبل.

### CORS
CORS مفعّل للسماح بالطلبات من أي مصدر.

### معالجة BigInt
جميع الـ IDs يتم تحويلها من BigInt إلى String في الاستجابات.
