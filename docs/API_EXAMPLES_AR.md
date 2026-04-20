# أمثلة عملية مفصلة للـ API

## 1. سيناريو كامل: إنشاء برنامج مع حلقاته وضيوفه

### الخطوة 1: إنشاء برنامج جديد

**في الفرونت إند** (Programs.tsx):
```typescript
const handleCreateProgram = async () => {
  const programData = {
    title: "برنامج الصباح الجديد",
    description: "برنامج صباحي يومي يناقش أخبار اليوم",
    media_unit_id: 1, // التلفزيون
    air_time: "08:00"
  };
  
  const response = await programAPI.create(programData);
  const newProgramId = response.data.id; // "15"
};
```

**Request HTTP**:
```http
POST /api/portal/programs
Content-Type: application/json

{
  "title": "برنامج الصباح الجديد",
  "description": "برنامج صباحي يومي يناقش أخبار اليوم",
  "media_unit_id": 1,
  "air_time": "08:00"
}
```

**في الباك إند** (ProgramController.ts → ProgramService.ts):
```typescript
// Controller يتحقق من البيانات
if (!title) {
  return res.status(400).json({ error: 'Program title is required' });
}

// Service ينفذ الـ INSERT
const result = await pool.query(`
  INSERT INTO programs (title, description, media_unit_id, air_time)
  VALUES ($1, $2, $3, $4)
  RETURNING *
`, [title, description, media_unit_id, air_time]);

// يجلب اسم الوحدة الإعلامية
const muResult = await pool.query(`
  SELECT name FROM media_units WHERE id = $1
`, [media_unit_id]);

return {
  ...result.rows[0],
  media_unit_name: muResult.rows[0].name
};
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "15",
    "title": "برنامج الصباح الجديد",
    "description": "برنامج صباحي يومي يناقش أخبار اليوم",
    "media_unit_id": "1",
    "media_unit_name": "التلفزيون",
    "air_time": "08:00",
    "created_at": "2024-01-20T10:30:00.000Z"
  },
  "message": "Program created successfully"
}
```

---

### الخطوة 2: إضافة حلقة للبرنامج

**في الفرونت إند**:
```typescript
const handleCreateEpisode = async () => {
  const episodeData = {
    program_id: "15", // البرنامج الذي أنشأناه
    title: "الحلقة الأولى - افتتاحية البرنامج",
    episode_number: 1,
    air_date: "2024-01-21"
  };
  
  const response = await episodeAPI.create(episodeData);
  const newEpisodeId = response.data.id; // "42"
};
```

**Request HTTP**:
```http
POST /api/portal/episodes
Content-Type: application/json

{
  "program_id": "15",
  "title": "الحلقة الأولى - افتتاحية البرنامج",
  "episode_number": 1,
  "air_date": "2024-01-21"
}
```

**في الباك إند**:
```typescript
// EpisodeController يتحقق
if (!program_id || !title) {
  return res.status(400).json({ error: 'Required fields missing' });
}

// EpisodeService ينفذ INSERT
const result = await pool.query(`
  INSERT INTO episodes (program_id, title, episode_number, air_date)
  VALUES ($1, $2, $3, $4)
  RETURNING *
`, [program_id, title, episode_number, air_date]);
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "42",
    "program_id": "15",
    "title": "الحلقة الأولى - افتتاحية البرنامج",
    "episode_number": 1,
    "air_date": "2024-01-21",
    "created_at": "2024-01-20T10:35:00.000Z"
  },
  "message": "Episode created successfully"
}
```

---

### الخطوة 3: إضافة ضيف للحلقة

**أولاً: التأكد من وجود الضيف أو إنشاؤه**:
```typescript
// جلب جميع الضيوف
const guestsResponse = await guestAPI.getAll();
const existingGuest = guestsResponse.data.find(g => g.name === "د. محمد علي");

let guestId;
if (!existingGuest) {
  // إنشاء ضيف جديد
  const newGuest = await guestAPI.create({
    name: "د. محمد علي",
    title: "أستاذ الاقتصاد",
    bio: "أستاذ الاقتصاد في جامعة الملك سعود",
    phone: "+966501234567"
  });
  guestId = newGuest.data.id;
} else {
  guestId = existingGuest.id;
}
```

**ثانياً: ربط الضيف بالحلقة**:
```typescript
await episodeGuestAPI.create({
  episode_id: "42",
  guest_id: guestId
});
```

**Request HTTP**:
```http
POST /api/portal/episode-guests
Content-Type: application/json

{
  "episode_id": "42",
  "guest_id": "8"
}
```

**في الباك إند** (EpisodeGuestController.ts):
```typescript
// يتحقق من البيانات
if (!episode_id || !guest_id) {
  return res.status(400).json({ error: 'Required fields missing' });
}

// ينفذ INSERT في جدول episode_guests
const result = await pool.query(`
  INSERT INTO episode_guests (episode_id, guest_id)
  VALUES ($1, $2)
  RETURNING *
`, [episode_id, guest_id]);
```

---

## 2. سيناريو: إدارة فريق عمل

### الخطوة 1: إنشاء قسم

```typescript
const deskData = {
  name: "قسم الإنتاج",
  description: "مسؤول عن إنتاج جميع البرامج",
  manager_id: 5 // معرف المدير
};

const deskResponse = await deskAPI.create(deskData);
const deskId = deskResponse.data.id; // "3"
```

---

### الخطوة 2: إنشاء فريق داخل القسم

```typescript
const teamData = {
  desk_id: deskId,
  name: "فريق الإنتاج الصباحي",
  manager_id: 7
};

const teamResponse = await teamAPI.create(teamData);
const teamId = teamResponse.data.id; // "12"
```

---

### الخطوة 3: إضافة موظفين للفريق

```typescript
// إضافة موظف 1
await teamUserAPI.create({
  team_id: teamId,
  user_id: "10"
});

// إضافة موظف 2
await teamUserAPI.create({
  team_id: teamId,
  user_id: "11"
});

// إضافة موظف 3
await teamUserAPI.create({
  team_id: teamId,
  user_id: "12"
});
```

**Request HTTP لكل موظف**:
```http
POST /api/portal/team-users
Content-Type: application/json

{
  "team_id": "12",
  "user_id": "10"
}
```

---

### الخطوة 4: جلب معلومات الفريق الكاملة

```typescript
// جلب معلومات الفريق
const teamInfo = await teamAPI.getById(teamId);

// جلب أعضاء الفريق
const teamMembers = await teamUserAPI.getByTeam(teamId);

console.log('معلومات الفريق:', teamInfo.data);
console.log('عدد الأعضاء:', teamMembers.data.length);
```

**Response لأعضاء الفريق**:
```json
{
  "success": true,
  "data": [
    {
      "id": "10",
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "role_id": "3",
      "role_name": "مصور"
    },
    {
      "id": "11",
      "name": "فاطمة علي",
      "email": "fatima@example.com",
      "role_id": "4",
      "role_name": "مونتير"
    },
    {
      "id": "12",
      "name": "خالد حسن",
      "email": "khaled@example.com",
      "role_id": "5",
      "role_name": "مخرج"
    }
  ]
}
```

---

## 3. سيناريو: تعيين فريق عمل لبرنامج

### إضافة موظفين لبرنامج بأدوار محددة

```typescript
// إضافة مقدم البرنامج
await programRoleAPI.create({
  program_id: "15",
  user_id: "20",
  role_id: "2" // مقدم برامج
});

// إضافة المخرج
await programRoleAPI.create({
  program_id: "15",
  user_id: "21",
  role_id: "5" // مخرج
});

// إضافة المصور
await programRoleAPI.create({
  program_id: "15",
  user_id: "22",
  role_id: "3" // مصور
});
```

---

### جلب فريق عمل البرنامج

```typescript
const programTeam = await programRoleAPI.getByProgram("15");
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "program_id": "15",
      "user_id": "20",
      "role_id": "2",
      "user_name": "سارة أحمد",
      "role_name": "مقدم برامج",
      "created_at": "2024-01-20T11:00:00.000Z"
    },
    {
      "id": "2",
      "program_id": "15",
      "user_id": "21",
      "role_id": "5",
      "user_name": "محمد خالد",
      "role_name": "مخرج",
      "created_at": "2024-01-20T11:01:00.000Z"
    },
    {
      "id": "3",
      "program_id": "15",
      "user_id": "22",
      "role_id": "3",
      "user_name": "علي حسن",
      "role_name": "مصور",
      "created_at": "2024-01-20T11:02:00.000Z"
    }
  ]
}
```

---

## 4. سيناريو: تحديث بيانات موظف

### تحديث جدول عمل موظف

```typescript
const userId = "10";

// جلب البيانات الحالية
const currentUser = await userAPI.getById(userId);

// تحديث أيام العمل ووقت الدوام
await userAPI.update(userId, {
  work_days: "السبت,الأحد,الاثنين,الثلاثاء,الأربعاء",
  start_time: "08:00",
  end_time: "16:00"
});
```

**Request HTTP**:
```http
PUT /api/portal/users/10
Content-Type: application/json

{
  "work_days": "السبت,الأحد,الاثنين,الثلاثاء,الأربعاء",
  "start_time": "08:00",
  "end_time": "16:00"
}
```

**في الباك إند**:
```typescript
// UserService.updateUser()
const updates = [];
const values = [];
let paramCount = 1;

if (data.work_days !== undefined) {
  updates.push(`work_days = $${paramCount++}`);
  values.push(data.work_days);
}
if (data.start_time !== undefined) {
  updates.push(`start_time = $${paramCount++}`);
  values.push(data.start_time);
}
if (data.end_time !== undefined) {
  updates.push(`end_time = $${paramCount++}`);
  values.push(data.end_time);
}

values.push(id);
const result = await pool.query(`
  UPDATE users
  SET ${updates.join(', ')}
  WHERE id = $${paramCount}
  RETURNING *
`, values);
```

---

## 5. سيناريو: البحث والتصفية

### البحث عن ضيف بالاسم

```typescript
const searchTerm = "محمد";
const results = await guestAPI.search(searchTerm);
```

**Request HTTP**:
```http
GET /api/portal/guests/search?name=محمد
```

**في الباك إند**:
```typescript
// GuestService.searchGuestsByName()
const result = await pool.query(`
  SELECT id, name, title, bio, phone, created_at
  FROM guests
  WHERE name ILIKE $1
  ORDER BY name
`, [`%${name}%`]);
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "8",
      "name": "د. محمد علي",
      "title": "أستاذ الاقتصاد",
      "bio": "أستاذ الاقتصاد في جامعة الملك سعود",
      "phone": "+966501234567"
    },
    {
      "id": "15",
      "name": "محمد خالد",
      "title": "مخرج",
      "bio": "مخرج تلفزيوني",
      "phone": "+966507654321"
    }
  ],
  "count": 2
}
```

---

## 6. سيناريو: حذف بيانات مع التحقق

### حذف برنامج (يحذف تلقائياً جميع حلقاته)

```typescript
const programId = "15";

// عرض تأكيد للمستخدم
if (confirm('هل أنت متأكد من حذف البرنامج؟ سيتم حذف جميع الحلقات المرتبطة به.')) {
  try {
    await programAPI.delete(programId);
    alert('تم حذف البرنامج بنجاح');
    // تحديث القائمة
    await fetchPrograms();
  } catch (error) {
    alert('فشل في حذف البرنامج');
  }
}
```

**Request HTTP**:
```http
DELETE /api/portal/programs/15
```

**في الباك إند**:
```typescript
// ProgramService.deleteProgram()
const result = await pool.query(`
  DELETE FROM programs
  WHERE id = $1
`, [id]);

return (result.rowCount ?? 0) > 0;
```

**ملاحظة**: قاعدة البيانات تحتوي على `ON DELETE CASCADE` للحلقات، لذلك يتم حذفها تلقائياً.

---

## 7. سيناريو: جلب بيانات متداخلة

### جلب برنامج مع جميع حلقاته

```typescript
const programId = "15";
const programWithEpisodes = await programAPI.getById(programId);

// ثم جلب الحلقات
const episodes = await episodeAPI.getByProgram(programId);

// دمج البيانات
const fullProgram = {
  ...programWithEpisodes.data,
  episodes: episodes.data
};
```

**أو استخدام endpoint خاص**:
```typescript
// يجلب البرنامج مع حلقاته في طلب واحد
const response = await axios.get(`/api/portal/programs/${programId}/with-episodes`);
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "15",
    "title": "برنامج الصباح الجديد",
    "description": "برنامج صباحي يومي",
    "media_unit_id": "1",
    "media_unit_name": "التلفزيون",
    "air_time": "08:00",
    "episodes": [
      {
        "id": "42",
        "program_id": "15",
        "title": "الحلقة الأولى",
        "episode_number": 1,
        "air_date": "2024-01-21"
      },
      {
        "id": "43",
        "program_id": "15",
        "title": "الحلقة الثانية",
        "episode_number": 2,
        "air_date": "2024-01-22"
      }
    ]
  }
}
```

---

## 8. معالجة الأخطاء - أمثلة واقعية

### مثال 1: محاولة إنشاء موظف بدون بريد إلكتروني

**Request**:
```http
POST /api/portal/users
Content-Type: application/json

{
  "name": "أحمد محمد"
  // email مفقود
}
```

**Response**:
```json
{
  "success": false,
  "error": "Name and email are required"
}
```

**في الفرونت إند**:
```typescript
try {
  await userAPI.create({ name: "أحمد محمد" });
} catch (err: any) {
  // err.response.status = 400
  // err.response.data.error = "Name and email are required"
  alert(err.response.data.error);
}
```

---

### مثال 2: محاولة الوصول لمورد غير موجود

**Request**:
```http
GET /api/portal/users/999999
```

**Response**:
```json
{
  "success": false,
  "error": "User not found"
}
```

**في الفرونت إند**:
```typescript
try {
  const user = await userAPI.getById("999999");
} catch (err: any) {
  if (err.response.status === 404) {
    alert('الموظف غير موجود');
  }
}
```

---

## 9. تحسين الأداء - Batch Operations

### إضافة عدة ضيوف لحلقة واحدة

```typescript
const episodeId = "42";
const guestIds = ["8", "15", "23", "31"];

// استخدام Promise.all لتنفيذ العمليات بالتوازي
await Promise.all(
  guestIds.map(guestId => 
    episodeGuestAPI.create({
      episode_id: episodeId,
      guest_id: guestId
    })
  )
);

console.log('تم إضافة جميع الضيوف بنجاح');
```

---

## 10. التعامل مع التواريخ والأوقات

### تحويل التواريخ في الفرونت إند

```typescript
// تحويل من ISO string إلى تاريخ عربي
const formatArabicDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// مثال
const episode = {
  air_date: "2024-01-21T00:00:00.000Z"
};

console.log(formatArabicDate(episode.air_date));
// النتيجة: "٢١ يناير ٢٠٢٤"
```

---

### تحويل الوقت من 24 ساعة إلى 12 ساعة

```typescript
const convertTo12Hour = (time: string) => {
  if (!time) return '-';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'مسائي' : 'صباحي';
  const displayHour = hour % 12 || 12;
  return `${displayHour.toString().padStart(2, '0')}:${minutes} ${period}`;
};

// مثال
console.log(convertTo12Hour("08:00")); // "08:00 صباحي"
console.log(convertTo12Hour("20:00")); // "08:00 مسائي"
console.log(convertTo12Hour("12:30")); // "12:30 مسائي"
```

---

## الخلاصة

هذه الأمثلة توضح:
1. كيفية التعامل مع الـ API من الفرونت إند
2. كيفية معالجة البيانات في الباك إند
3. كيفية التعامل مع الأخطاء
4. كيفية تحسين الأداء
5. كيفية التعامل مع البيانات المعقدة والمتداخلة
