# ✅ Deployment Checklist

## قبل النشر (Pre-Deployment)

### قاعدة البيانات
- [ ] إنشاء PostgreSQL database
- [ ] حفظ connection string
- [ ] تشغيل migrations
- [ ] تشغيل setup scripts:
  - [ ] `create-uploaded-files-table.ts`
  - [ ] `setup-manual-input-sources.ts`
  - [ ] `move-media-unit-to-raw-data.ts`
- [ ] التحقق من الجداول المطلوبة:
  - [ ] `users`
  - [ ] `media_units`
  - [ ] `categories`
  - [ ] `sources`
  - [ ] `source_types`
  - [ ] `raw_data` (مع `media_unit_id`)
  - [ ] `uploaded_files` (مع `media_unit_id`)

### AWS S3
- [ ] إنشاء S3 bucket
- [ ] إنشاء IAM user
- [ ] إعطاء صلاحيات S3
- [ ] حفظ Access Key و Secret Key
- [ ] إنشاء المجلدات:
  - [ ] `manual-input-audio/`
  - [ ] `manual-input-video/`
- [ ] تفعيل encryption
- [ ] ضبط bucket policy

### الكود
- [ ] Push آخر التعديلات إلى GitHub
- [ ] التأكد من branch: `manual-reporter-input`
- [ ] التحقق من الملفات:
  - [ ] `Dockerfile` (backend)
  - [ ] `manual-input-frontend/Dockerfile` (frontend)
  - [ ] `docker-compose.yml`
  - [ ] `.dockerignore`
  - [ ] `manual-input-frontend/.dockerignore`
  - [ ] `manual-input-frontend/nginx.conf`

---

## نشر Backend على Render

- [ ] إنشاء Web Service جديد
- [ ] ربط GitHub repository
- [ ] اختيار branch: `manual-reporter-input`
- [ ] ضبط الإعدادات:
  - [ ] Environment: Docker
  - [ ] Dockerfile Path: `./Dockerfile`
  - [ ] Region: اختيار الأقرب
- [ ] إضافة Environment Variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3000`
  - [ ] `DB_HOST`
  - [ ] `DB_PORT=5432`
  - [ ] `DB_NAME`
  - [ ] `DB_USER`
  - [ ] `DB_PASSWORD`
  - [ ] `DB_SSL=true`
  - [ ] `AWS_REGION`
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `AWS_S3_BUCKET`
- [ ] Deploy
- [ ] انتظار اكتمال الـ deployment
- [ ] حفظ الـ URL: `https://______.onrender.com`
- [ ] اختبار health check: `/api/health`

---

## نشر Frontend على Render

- [ ] تحديث `manual-input-frontend/nginx.conf`:
  - [ ] تغيير `proxy_pass http://backend:3000;`
  - [ ] إلى: `proxy_pass https://your-backend-url.onrender.com;`
  - [ ] Commit و Push التغيير
- [ ] إنشاء Web Service جديد
- [ ] ربط نفس الـ repository
- [ ] اختيار نفس الـ branch
- [ ] ضبط الإعدادات:
  - [ ] Environment: Docker
  - [ ] Dockerfile Path: `./manual-input-frontend/Dockerfile`
  - [ ] Root Directory: `manual-input-frontend`
  - [ ] Region: نفس region الـ backend
- [ ] Deploy
- [ ] انتظار اكتمال الـ deployment
- [ ] حفظ الـ URL: `https://______.onrender.com`

---

## الاختبار بعد النشر

### Backend Tests
- [ ] Health check: `GET /api/health`
- [ ] Get categories: `GET /api/manual-input/categories`
- [ ] Get users: `GET /api/manual-input/users`
- [ ] Get media units: `GET /api/manual-input/media-units`
- [ ] Get sources: `GET /api/manual-input/sources`

### Frontend Tests
- [ ] فتح الصفحة الرئيسية
- [ ] التحقق من تحميل القوائم المنسدلة
- [ ] اختبار صفحة النص:
  - [ ] تحميل التصنيفات
  - [ ] تحميل المستخدمين
  - [ ] تحميل الوحدات الإعلامية
  - [ ] إرسال خبر نصي
  - [ ] التحقق من حفظ البيانات في قاعدة البيانات
- [ ] اختبار صفحة الصوت:
  - [ ] رفع ملف صوتي
  - [ ] التحقق من رفع الملف على S3
  - [ ] التحقق من حفظ البيانات في `uploaded_files`
- [ ] اختبار صفحة الفيديو:
  - [ ] رفع ملف فيديو
  - [ ] التحقق من رفع الملف على S3
  - [ ] التحقق من حفظ البيانات في `uploaded_files`

### Database Verification
```sql
-- التحقق من البيانات المحفوظة
SELECT 
  rd.id,
  rd.title,
  u.name as correspondent_name,
  mu.name as media_unit_name,
  rd.source_type_id
FROM raw_data rd
JOIN users u ON rd.created_by = u.id
JOIN media_units mu ON rd.media_unit_id = mu.id
WHERE rd.source_type_id IN (6, 7, 8)
ORDER BY rd.fetched_at DESC
LIMIT 10;

-- التحقق من الملفات المرفوعة
SELECT 
  uf.id,
  uf.file_type,
  uf.original_filename,
  u.name as uploaded_by_name,
  mu.name as media_unit_name,
  uf.processing_status
FROM uploaded_files uf
JOIN users u ON uf.uploaded_by = u.id
JOIN media_units mu ON uf.media_unit_id = mu.id
ORDER BY uf.uploaded_at DESC
LIMIT 10;
```

---

## المراقبة (Monitoring)

- [ ] إعداد Render alerts
- [ ] مراقبة CPU usage
- [ ] مراقبة Memory usage
- [ ] مراقبة Response times
- [ ] مراقبة Error rates
- [ ] إعداد log aggregation

---

## الأمان (Security)

- [ ] تغيير كل الـ passwords الافتراضية
- [ ] التحقق من CORS settings
- [ ] التحقق من SSL/TLS
- [ ] مراجعة S3 bucket permissions
- [ ] مراجعة database firewall rules
- [ ] تفعيل rate limiting (إن أمكن)

---

## التوثيق (Documentation)

- [ ] تحديث README.md
- [ ] توثيق الـ API endpoints
- [ ] توثيق Environment Variables
- [ ] توثيق خطوات الـ deployment
- [ ] إنشاء runbook للمشاكل الشائعة

---

## النسخ الاحتياطي (Backup)

- [ ] إعداد automatic database backups
- [ ] اختبار restore من backup
- [ ] إعداد S3 versioning
- [ ] توثيق خطة الـ disaster recovery

---

## بعد النشر (Post-Deployment)

- [ ] إعلام الفريق بالـ URLs الجديدة
- [ ] تدريب المستخدمين
- [ ] مراقبة الـ logs لأول 24 ساعة
- [ ] جمع feedback من المستخدمين
- [ ] تحديث الـ documentation بأي ملاحظات

---

## الصيانة الدورية

### يومياً
- [ ] مراجعة الـ logs
- [ ] التحقق من الـ health checks
- [ ] مراقبة الـ error rates

### أسبوعياً
- [ ] مراجعة الـ performance metrics
- [ ] التحقق من الـ disk space
- [ ] مراجعة الـ security alerts

### شهرياً
- [ ] تحديث الـ dependencies
- [ ] مراجعة الـ costs
- [ ] اختبار الـ backups
- [ ] مراجعة الـ access logs

---

## 🎉 Deployment Complete!

عند اكتمال كل النقاط أعلاه، يكون النظام جاهزاً للإنتاج!

**URLs:**
- Frontend: `https://______.onrender.com`
- Backend: `https://______.onrender.com`
- API Docs: `https://______.onrender.com/api`

**Support:**
- راجع `docs/DEPLOYMENT_GUIDE.md` للتفاصيل
- راجع `DEPLOYMENT.md` للمرجع السريع
- تواصل مع فريق التطوير للمساعدة
