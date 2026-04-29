# MCMS Frontend - دليل التشغيل السريع

## 🚀 البدء السريع

### 1. تثبيت المكتبات
```bash
npm install
```

### 2. إعداد Environment Variables
```bash
# نسخ ملف المثال
cp .env.example .env

# تعديل .env حسب الحاجة
# للتطوير المحلي:
VITE_API_URL=http://localhost:3000

# للإنتاج (افتراضي):
VITE_API_URL=https://media-center-management-system.onrender.com
```

### 3. تشغيل التطبيق
```bash
npm run dev
```

سيعمل التطبيق على: `http://localhost:5173`

---

## 📁 هيكل المشروع

```
MCMS-FRONT/
├── src/
│   ├── components/          # مكونات React
│   │   ├── ui/             # مكونات UI أساسية
│   │   ├── LoginPage.tsx   # صفحة تسجيل الدخول
│   │   ├── DashboardPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── TasksPage.tsx
│   │   └── ...
│   ├── contexts/           # React Contexts
│   │   └── AuthContext.tsx # إدارة المصادقة
│   ├── services/           # خدمات API
│   │   ├── api.ts         # HTTP client
│   │   └── socket.ts      # Socket.IO client
│   ├── types.ts           # TypeScript types
│   ├── App.tsx            # المكون الرئيسي
│   └── main.tsx           # نقطة الدخول
├── .env                   # متغيرات البيئة (لا تُرفع لـ git)
├── .env.example          # مثال لمتغيرات البيئة
└── package.json
```

---

## 🔑 تسجيل الدخول

### حسابات الاختبار
```
Admin:
Email: admin@media.com
Password: admin123

User:
Email: user@media.com
Password: user123
```

---

## 🔌 API Integration

### Base URL
```typescript
// src/services/api.ts
const BASE_URL = import.meta.env.VITE_API_URL;
```

### Authentication
```typescript
// تسجيل الدخول
const response = await api.post('/api/auth/login', {
  email: 'admin@media.com',
  password: 'admin123'
});

// Token يُحفظ تلقائياً في localStorage
// ويُضاف تلقائياً لكل الطلبات
```

### API Calls
```typescript
// GET
const orders = await api.get('/api/orders');

// POST
const newOrder = await api.post('/api/orders', { title: '...' });

// PATCH
const updated = await api.patch('/api/orders/1', { status_id: 2 });

// DELETE
await api.delete('/api/orders/1');
```

---

## 🔔 Real-time Notifications

```typescript
// Socket.IO يتصل تلقائياً عند تسجيل الدخول
// في AuthContext.tsx

// للاستماع للإشعارات:
socketService.onNotification((notification) => {
  console.log('New notification:', notification);
});
```

---

## 🎨 UI Components

### Button
```tsx
import { Button } from './ui/Inputs';

<Button onClick={handleClick}>
  اضغط هنا
</Button>
```

### Input
```tsx
import { Input } from './ui/Inputs';

<Input 
  placeholder="ابحث..." 
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
```

### Select
```tsx
import { Select } from './ui/Inputs';

<Select 
  options={[
    { value: '1', label: 'خيار 1' },
    { value: '2', label: 'خيار 2' }
  ]}
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
/>
```

### Badge
```tsx
import { Badge } from './ui/Badge';

<Badge variant="green">مكتمل</Badge>
<Badge variant="blue">جاري</Badge>
<Badge variant="red">ملغي</Badge>
```

### Modal
```tsx
import { Modal } from './ui/Modal';

<Modal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)}
  title="عنوان النافذة"
>
  <div>محتوى النافذة</div>
</Modal>
```

---

## 📊 الصفحات المتاحة

| الصفحة | المسار | الوصف |
|--------|--------|-------|
| تسجيل الدخول | `/login` | صفحة تسجيل الدخول |
| لوحة التحكم | `/` | Dashboard مع KPIs |
| الأوردرات | `/orders` | قائمة الأوردرات |
| تفاصيل أوردر | `/orders/:id` | تفاصيل أوردر محدد |
| المهام | `/tasks` | قائمة المهام |
| تفاصيل مهمة | `/tasks/:id` | تفاصيل مهمة محددة |
| المحتوى | `/content` | إدارة المحتوى |
| التصوير | `/shootings` | جدول التصوير |
| البرامج | `/programs` | إدارة البرامج |
| المستخدمين | `/users` | إدارة المستخدمين |
| الصلاحيات | `/permissions` | إدارة الصلاحيات |
| الملف الشخصي | `/profile` | ملف المستخدم |

---

## 🛠️ Development

### Build للإنتاج
```bash
npm run build
```

### Preview البناء
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

---

## 🐛 Troubleshooting

### المشكلة: API لا يستجيب
**الحل:**
1. تأكد من تشغيل Backend
2. تحقق من `VITE_API_URL` في `.env`
3. تحقق من CORS في Backend

### المشكلة: Socket.IO لا يتصل
**الحل:**
1. تحقق من console للأخطاء
2. تأكد من صحة Token
3. تحقق من Backend Socket.IO configuration

### المشكلة: Environment variables لا تعمل
**الحل:**
1. تأكد من استخدام `VITE_` prefix
2. أعد تشغيل dev server بعد تغيير `.env`
3. استخدم `import.meta.env.VITE_*` وليس `process.env.*`

---

## 📦 المكتبات المستخدمة

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router DOM 7** - Routing
- **TailwindCSS 4** - Styling
- **Framer Motion** - Animations
- **Recharts** - Charts
- **Socket.IO Client** - Real-time
- **date-fns** - Date formatting
- **Lucide React** - Icons

---

## 🎯 الخطوات التالية

1. ✅ تسجيل الدخول
2. ✅ استكشاف Dashboard
3. ✅ إنشاء أوردر جديد
4. ✅ إنشاء مهمة
5. ✅ اختبار الإشعارات
6. ✅ اختبار الصلاحيات

---

## 📞 الدعم

للمساعدة أو الإبلاغ عن مشاكل، راجع:
- `API_INTEGRATION_GUIDE.md` - دليل التكامل الكامل
- `INTEGRATION_ANALYSIS.md` - تحليل التكامل

---

**النظام جاهز للاستخدام! 🚀**
