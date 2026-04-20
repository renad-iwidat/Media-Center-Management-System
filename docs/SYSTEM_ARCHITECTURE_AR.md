# معمارية النظام والعلاقات بين المكونات

## نظرة عامة على المعمارية

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│                  portal-frontend/src/                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │   API    │  │  Types   │   │
│  │          │  │          │  │  Client  │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            │ (axios)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (Node.js + Express)                     │
│                     src/                                     │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Routes  │→ │Controllers│→│ Services │→│  Models  │   │
│  │          │  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            │ (pg pool)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  users   │  │  desks   │  │ programs │  │  guests  │   │
│  │  roles   │  │  teams   │  │ episodes │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. طبقة الفرونت إند (Frontend Layer)

### 1.1 هيكل المجلدات

```
portal-frontend/
├── src/
│   ├── pages/           # صفحات التطبيق
│   │   ├── Users.tsx
│   │   ├── Programs.tsx
│   │   ├── Guests.tsx
│   │   ├── Desks.tsx
│   │   ├── Roles.tsx
│   │   └── Home.tsx
│   │
│   ├── components/      # مكونات قابلة لإعادة الاستخدام
│   │   ├── Navbar.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingSpinner.tsx
│   │
│   ├── api/            # طبقة الاتصال بالـ API
│   │   ├── client.ts   # إعداد axios
│   │   └── services.ts # دوال الـ API
│   │
│   ├── App.tsx         # المكون الرئيسي
│   └── main.tsx        # نقطة الدخول
│
├── .env                # متغيرات البيئة
└── vite.config.ts      # إعدادات Vite
```

### 1.2 تدفق البيانات في الفرونت إند

```
User Action (Click/Submit)
    ↓
Component State Update (useState)
    ↓
API Call (services.ts)
    ↓
HTTP Request (client.ts)
    ↓
Backend API
    ↓
Response
    ↓
State Update
    ↓
UI Re-render
```

### 1.3 مثال: صفحة Users.tsx

```typescript
// 1. State Management
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);
const [formData, setFormData] = useState({...});

// 2. Data Fetching
useEffect(() => {
  fetchUsers();
}, []);

const fetchUsers = async () => {
  const response = await userAPI.getAll();
  setUsers(response.data);
};

// 3. User Actions
const handleSubmit = async () => {
  await userAPI.create(formData);
  await fetchUsers(); // Refresh
};

// 4. Rendering
return (
  <div>
    <table>
      {users.map(user => <tr>...</tr>)}
    </table>
  </div>
);
```

---

## 2. طبقة الباك إند (Backend Layer)

### 2.1 هيكل المجلدات

```
src/
├── routes/              # تعريف المسارات
│   └── portal-r/
│       ├── index.ts     # Router رئيسي
│       ├── users.ts
│       ├── programs.ts
│       ├── desks.ts
│       └── ...
│
├── controllers/         # معالجة الطلبات
│   └── portal-r/
│       ├── UserController.ts
│       ├── ProgramController.ts
│       └── ...
│
├── services/           # منطق الأعمال
│   └── portal-r/
│       ├── UserService.ts
│       ├── ProgramService.ts
│       └── ...
│
├── models/             # تعريف أنواع البيانات
│   └── portal-r/
│       ├── User.ts
│       ├── Program.ts
│       └── ...
│
├── config/             # الإعدادات
│   ├── database.ts
│   └── environment.ts
│
└── index.ts            # نقطة الدخول
```

### 2.2 تدفق الطلب في الباك إند

```
HTTP Request
    ↓
Express Middleware (CORS, JSON Parser)
    ↓
Router (routes/portal-r/users.ts)
    ↓
Controller (UserController.createUser)
    ↓
Validation (Check required fields)
    ↓
Service (UserService.createUser)
    ↓
Database Query (PostgreSQL)
    ↓
Response Formatting
    ↓
HTTP Response
```

### 2.3 مثال: إنشاء موظف

#### Routes (users.ts)
```typescript
router.post('/', UserController.createUser);
```

#### Controller (UserController.ts)
```typescript
static async createUser(req: Request, res: Response) {
  // 1. استخراج البيانات
  const { name, email, role_id, work_days, start_time, end_time } = req.body;
  
  // 2. التحقق من البيانات
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Name and email are required'
    });
  }
  
  // 3. استدعاء Service
  const user = await userService.createUser({
    name,
    email,
    role_id: role_id ? BigInt(role_id) : undefined,
    work_days,
    start_time,
    end_time
  });
  
  // 4. إرجاع الاستجابة
  res.status(201).json({
    success: true,
    data: user,
    message: 'User created successfully'
  });
}
```

#### Service (UserService.ts)
```typescript
async createUser(data: CreateUserDTO): Promise<User> {
  // 1. تنفيذ INSERT
  const result = await pool.query(`
    INSERT INTO users (name, email, role_id, work_days, start_time, end_time)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [data.name, data.email, data.role_id, data.work_days, data.start_time, data.end_time]);
  
  const user = result.rows[0];
  
  // 2. جلب اسم الدور إذا كان موجوداً
  if (user.role_id) {
    const roleResult = await pool.query(`
      SELECT name as role_name FROM roles WHERE id = $1
    `, [user.role_id]);
    
    if (roleResult.rows[0]) {
      user.role_name = roleResult.rows[0].role_name;
    }
  }
  
  return user;
}
```

---

## 3. طبقة قاعدة البيانات (Database Layer)

### 3.1 العلاقات بين الجداول

```
┌─────────────┐
│    roles    │
│  id, name   │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────────────────────┐
│           users                 │
│  id, name, email, role_id       │
│  work_days, start_time, end_time│
└──────┬──────────────────────────┘
       │
       ├─────────────────┐
       │                 │
       │ 1:N             │ N:M (via team_users)
       │                 │
┌──────▼──────┐   ┌──────▼──────┐
│    desks    │   │    teams    │
│ id, name    │   │ id, name    │
│ manager_id  │   │ desk_id     │
└─────────────┘   │ manager_id  │
                  └──────┬──────┘
                         │
                         │ N:M (via team_users)
                         │
                  ┌──────▼──────────┐
                  │   team_users    │
                  │ team_id, user_id│
                  └─────────────────┘

┌─────────────────┐
│  media_units    │
│  id, name       │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────────────┐
│      programs           │
│  id, title              │
│  media_unit_id, air_time│
└────────┬────────────────┘
         │
         ├─────────────────┐
         │                 │
         │ 1:N             │ N:M (via program_roles)
         │                 │
┌────────▼────────┐ ┌──────▼──────────┐
│    episodes     │ │  program_roles  │
│ id, title       │ │ program_id      │
│ program_id      │ │ user_id         │
│ episode_number  │ │ role_id         │
└────────┬────────┘ └─────────────────┘
         │
         │ N:M (via episode_guests)
         │
┌────────▼────────────┐
│   episode_guests    │
│ episode_id, guest_id│
└────────┬────────────┘
         │
         │ N:1
         │
┌────────▼────────┐
│     guests      │
│  id, name       │
│  title, bio     │
│  phone          │
└─────────────────┘
```

### 3.2 أنواع العلاقات

#### One-to-Many (1:N)
- **roles → users**: دور واحد يمكن أن يكون لعدة موظفين
- **desks → teams**: قسم واحد يحتوي على عدة فرق
- **programs → episodes**: برنامج واحد له عدة حلقات
- **media_units → programs**: وحدة إعلامية واحدة لها عدة برامج

#### Many-to-Many (N:M)
- **teams ↔ users** (via team_users): فريق يحتوي على عدة موظفين، والموظف يمكن أن يكون في عدة فرق
- **episodes ↔ guests** (via episode_guests): حلقة تحتوي على عدة ضيوف، والضيف يمكن أن يظهر في عدة حلقات
- **programs ↔ users** (via program_roles): برنامج له عدة موظفين، والموظف يمكن أن يعمل في عدة برامج

---

## 4. الربط بين الفرونت والباك

### 4.1 مثال كامل: صفحة البرامج

#### Frontend Component (Programs.tsx)

```typescript
// 1. State للبرامج والحلقات والضيوف
const [programs, setPrograms] = useState<Program[]>([]);
const [episodes, setEpisodes] = useState<Episode[]>([]);
const [episodeGuests, setEpisodeGuests] = useState<EpisodeGuest[]>([]);
const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);

// 2. جلب البرامج عند تحميل الصفحة
useEffect(() => {
  fetchPrograms();
}, []);

// 3. جلب الحلقات عند اختيار برنامج
useEffect(() => {
  if (selectedProgram) {
    fetchEpisodes(selectedProgram);
  }
}, [selectedProgram]);

// 4. جلب الضيوف عند اختيار حلقة
useEffect(() => {
  if (selectedEpisode) {
    fetchEpisodeGuests(selectedEpisode);
  }
}, [selectedEpisode]);

// 5. دوال جلب البيانات
const fetchPrograms = async () => {
  const response = await programAPI.getAll();
  setPrograms(response.data);
};

const fetchEpisodes = async (programId: string) => {
  const response = await episodeAPI.getByProgram(programId);
  setEpisodes(response.data);
};

const fetchEpisodeGuests = async (episodeId: string) => {
  const response = await episodeGuestAPI.getByEpisode(episodeId);
  setEpisodeGuests(response.data);
};
```

#### API Client (services.ts)

```typescript
export const programAPI = {
  getAll: () => client.get('/programs'),
  // ...
};

export const episodeAPI = {
  getByProgram: (programId: string) => 
    client.get(`/episodes?program_id=${programId}`),
  // ...
};

export const episodeGuestAPI = {
  getByEpisode: (episodeId: string) => 
    client.get(`/episode-guests?episode_id=${episodeId}`),
  // ...
};
```

#### Backend Routes

```typescript
// programs.ts
router.get('/', ProgramController.getAllPrograms);

// episodes.ts
router.get('/', EpisodeController.getEpisodesByProgram);

// episode-guests.ts
router.get('/', EpisodeGuestController.getByEpisode);
```

#### Backend Controllers

```typescript
// ProgramController
static async getAllPrograms(req: Request, res: Response) {
  const programs = await programService.getAllPrograms();
  res.json({ success: true, data: programs });
}

// EpisodeController
static async getEpisodesByProgram(req: Request, res: Response) {
  const { program_id } = req.query;
  const episodes = await episodeService.getEpisodesByProgramId(BigInt(program_id));
  res.json({ success: true, data: episodes });
}

// EpisodeGuestController
static async getByEpisode(req: Request, res: Response) {
  const { episode_id } = req.query;
  const guests = await episodeGuestService.getByEpisode(BigInt(episode_id));
  res.json({ success: true, data: guests });
}
```

#### Backend Services

```typescript
// ProgramService
async getAllPrograms(): Promise<Program[]> {
  const result = await pool.query(`
    SELECT p.*, m.name as media_unit_name
    FROM programs p
    LEFT JOIN media_units m ON p.media_unit_id = m.id
    ORDER BY p.created_at DESC
  `);
  return result.rows;
}

// EpisodeService
async getEpisodesByProgramId(programId: bigint): Promise<Episode[]> {
  const result = await pool.query(`
    SELECT * FROM episodes
    WHERE program_id = $1
    ORDER BY episode_number DESC
  `, [programId]);
  return result.rows;
}

// EpisodeGuestService
async getByEpisode(episodeId: bigint): Promise<any[]> {
  const result = await pool.query(`
    SELECT eg.*, g.name, g.title, g.bio, g.phone
    FROM episode_guests eg
    INNER JOIN guests g ON eg.guest_id = g.id
    WHERE eg.episode_id = $1
  `, [episodeId]);
  return result.rows;
}
```

---

## 5. أنماط التصميم المستخدمة

### 5.1 MVC Pattern (في الباك إند)

```
Model (models/)
  ↓
View (JSON Response)
  ↑
Controller (controllers/)
  ↓
Service (services/)
```

### 5.2 Repository Pattern (في Services)

```typescript
class UserService {
  // جميع عمليات قاعدة البيانات للموظفين
  async getAllUsers() { ... }
  async getUserById(id) { ... }
  async createUser(data) { ... }
  async updateUser(id, data) { ... }
  async deleteUser(id) { ... }
}
```

### 5.3 Component-Based Architecture (في الفرونت إند)

```
App
├── Navbar
├── Home
├── Users
│   ├── Modal
│   └── LoadingSpinner
├── Programs
│   └── Modal
└── ...
```

---

## 6. معالجة الحالات الخاصة

### 6.1 Cascade Delete

عند حذف برنامج، يتم حذف جميع حلقاته تلقائياً:

```sql
-- في قاعدة البيانات
ALTER TABLE episodes
ADD CONSTRAINT fk_program
FOREIGN KEY (program_id) 
REFERENCES programs(id)
ON DELETE CASCADE;
```

### 6.2 Soft Delete (غير مطبق حالياً)

يمكن إضافة حقل `deleted_at` للحذف الناعم:

```typescript
async softDeleteUser(id: bigint) {
  await pool.query(`
    UPDATE users
    SET deleted_at = NOW()
    WHERE id = $1
  `, [id]);
}
```

### 6.3 Optimistic Updates

في الفرونت إند، يمكن تحديث الواجهة قبل استجابة الخادم:

```typescript
const handleDelete = async (id: string) => {
  // تحديث فوري
  setUsers(users.filter(u => u.id !== id));
  
  try {
    await userAPI.delete(id);
  } catch (error) {
    // إعادة البيانات في حالة الفشل
    await fetchUsers();
  }
};
```

---

## 7. الأمان والأداء

### 7.1 SQL Injection Prevention

استخدام Parameterized Queries:

```typescript
// ✅ آمن
await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

// ❌ غير آمن
await pool.query(`SELECT * FROM users WHERE id = ${userId}`);
```

### 7.2 Connection Pooling

```typescript
const pool = new Pool({
  connectionString: environment.databaseUrl,
  max: 20, // عدد الاتصالات القصوى
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 7.3 Response Caching (يمكن إضافته)

```typescript
// في الفرونت إند
const cache = new Map();

const fetchWithCache = async (key: string, fetcher: Function) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetcher();
  cache.set(key, data);
  return data;
};
```

---

## 8. التوسع المستقبلي

### 8.1 إضافة Authentication

```typescript
// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  // التحقق من JWT
  next();
};

router.get('/users', authenticate, UserController.getAllUsers);
```

### 8.2 إضافة Pagination

```typescript
// Backend
async getAllUsers(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const result = await pool.query(`
    SELECT * FROM users
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
  return result.rows;
}

// Frontend
const [page, setPage] = useState(1);
const response = await userAPI.getAll(page, 20);
```

### 8.3 إضافة WebSocket للتحديثات الفورية

```typescript
// Backend
io.on('connection', (socket) => {
  socket.on('user:created', (user) => {
    io.emit('user:created', user);
  });
});

// Frontend
socket.on('user:created', (user) => {
  setUsers([...users, user]);
});
```

---

## الخلاصة

النظام يتبع معمارية واضحة ومنظمة:
- **Frontend**: React components → API client → HTTP requests
- **Backend**: Routes → Controllers → Services → Database
- **Database**: Relational tables with proper foreign keys

كل طبقة لها مسؤولية محددة، مما يجعل النظام سهل الصيانة والتوسع.
