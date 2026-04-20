# إعداد AWS S3 للوصول العام

## المشكلة
عند فتح رابط الملف في S3، تظهر رسالة: `Access Denied`

## الحل

### الطريقة 1: تفعيل ACLs (الأسهل)

1. **افتح AWS Console** → S3 → `media-center-management-system`

2. **اذهب إلى تبويب Permissions**

3. **Object Ownership**:
   - اضغط **Edit**
   - اختر **ACLs enabled**
   - اختر **Bucket owner preferred**
   - احفظ التغييرات

4. **Block Public Access**:
   - اضغط **Edit**
   - أزل العلامة من **Block all public access**
   - أو على الأقل أزل العلامة من:
     - ❌ Block public access to buckets and objects granted through new access control lists (ACLs)
     - ❌ Block public access to buckets and objects granted through any access control lists (ACLs)
   - احفظ التغييرات

5. **أعد تشغيل الباك إند** لتطبيق التغييرات

---

### الطريقة 2: Bucket Policy (الأكثر أماناً)

إذا كنت تريد التحكم الكامل، استخدم Bucket Policy:

1. **اذهب إلى Permissions** → **Bucket Policy**

2. **أضف هذه السياسة**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::media-center-management-system/manual-input-audio/*"
    },
    {
      "Sid": "PublicReadGetObjectVideo",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::media-center-management-system/manual-input-video/*"
    }
  ]
}
```

3. **احفظ التغييرات**

هذه السياسة تسمح بالقراءة العامة فقط للملفات في:
- `manual-input-audio/`
- `manual-input-video/`

---

### الطريقة 3: Pre-signed URLs (الأكثر أماناً)

إذا كنت لا تريد جعل الملفات عامة، استخدم روابط مؤقتة:

**سنحتاج تعديل الكود** لتوليد روابط مؤقتة صالحة لمدة محددة (مثلاً 7 أيام).

---

## التحقق من الحل

بعد تطبيق أي من الطرق أعلاه:

1. ارفع ملف صوتي أو فيديو جديد
2. انسخ الرابط من الـ response
3. افتح الرابط في المتصفح
4. ✅ يجب أن يعمل الملف بدون `Access Denied`

---

## أي طريقة أختار؟

| الطريقة | الأمان | السهولة | الاستخدام |
|---------|--------|---------|-----------|
| **ACLs** | متوسط | ⭐⭐⭐ سهل جداً | للتطوير والتجربة |
| **Bucket Policy** | جيد | ⭐⭐ متوسط | للإنتاج (ملفات عامة) |
| **Pre-signed URLs** | ممتاز | ⭐ معقد | للإنتاج (ملفات خاصة) |

**للتجربة الآن**: استخدم **الطريقة 1 (ACLs)** - الأسرع والأسهل!

---

## ملاحظات مهمة

⚠️ **تحذير أمني**: 
- الطريقة 1 و 2 تجعل الملفات عامة للجميع
- أي شخص لديه الرابط يمكنه الوصول للملف
- للإنتاج، استخدم Pre-signed URLs أو CloudFront

✅ **للتطوير**: 
- الطريقة 1 كافية تماماً
- سريعة وسهلة التطبيق
