# البدء السريع (Quick Start)

دليل سريع لتشغيل المشروع في أقل من 5 دقائق! ⚡

## المتطلبات

- ✅ Docker
- ✅ Docker Compose
- ✅ قاعدة بيانات PostgreSQL

## الخطوات

### 1️⃣ إعداد ملف البيئة

```bash
cp .env.example .env
```

عدل ملف `.env` وضع معلومات قاعدة البيانات:

```env
DATABASE_URL=postgresql://username:password@host:port/database
```

### 2️⃣ بناء وتشغيل

```bash
docker-compose up -d --build
```

أو باستخدام Makefile:

```bash
make rebuild
```

### 3️⃣ التحقق

```bash
# فحص حالة الخدمات
docker-compose ps

# فحص السجلات
docker-compose logs -f
```

### 4️⃣ الوصول للتطبيق

- 🌐 **Frontend**: http://localhost/dashboard/
- 🔌 **Backend API**: http://localhost:4000
- 💚 **Health Check**: http://localhost:4000/health

---

## الأوامر المفيدة

```bash
# إيقاف
docker-compose down

# إعادة تشغيل
docker-compose restart

# عرض السجلات
docker-compose logs -f backend
docker-compose logs -f frontend

# الدخول للحاوية
docker exec -it media-backend sh
```

---

## استخدام Makefile (أسهل!)

```bash
make help           # عرض جميع الأوامر
make up             # تشغيل
make down           # إيقاف
make logs           # عرض السجلات
make status         # حالة الخدمات
make health         # فحص الصحة
make rebuild        # إعادة بناء كاملة
```

---

## استكشاف الأخطاء السريع

### Backend لا يعمل؟

```bash
docker-compose logs backend
```

تحقق من:
- ✅ `DATABASE_URL` صحيح في `.env`
- ✅ قاعدة البيانات تعمل ويمكن الوصول إليها
- ✅ Port 4000 غير مستخدم

### Frontend لا يعمل؟

```bash
docker-compose logs frontend
```

تحقق من:
- ✅ Backend يعمل بشكل صحيح
- ✅ Port 80 غير مستخدم

### تغيير المنافذ

عدل ملف `.env`:

```env
BACKEND_PORT=8080
FRONTEND_PORT=8081
```

ثم:

```bash
docker-compose down
docker-compose up -d
```

---

## الخطوات التالية

بعد التشغيل الناجح:

1. 📖 اقرأ [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) للتفاصيل الكاملة
2. 🔧 راجع [docs/](./docs/) للوثائق التقنية
3. 🗄️ شغل SQL scripts من مجلد `sql/` إذا لزم الأمر

---

## الدعم

إذا واجهت مشاكل:

1. تحقق من السجلات: `docker-compose logs -f`
2. راجع [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) قسم Troubleshooting
3. تأكد من صحة متغيرات البيئة في `.env`

---

✅ **مبروك! النظام يعمل الآن** 🎉
