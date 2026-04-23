# دليل اختبار الـ API

## المحتويات
1. [أدوات الاختبار](#tools)
2. [اختبار باستخدام cURL](#curl)
3. [اختبار باستخدام Postman](#postman)
4. [اختبار باستخدام Thunder Client](#thunder)
5. [اختبار باستخدام JavaScript](#javascript)
6. [سيناريوهات اختبار كاملة](#scenarios)

---

## <a name="tools"></a>1. أدوات الاختبار

### الأدوات المتاحة:
- **cURL**: أداة سطر أوامر
- **Postman**: تطبيق مستقل
- **Thunder Client**: إضافة VS Code
- **Insomnia**: تطبيق مستقل
- **JavaScript/Node.js**: برمجياً

---

## <a name="curl"></a>2. اختبار باستخدام cURL

### 2.1 جلب جميع الموظفين

```bash
curl -X GET http://localhost:3000/api/portal/users
```

**Response**:
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

---

### 2.2 إنشاء موظف جديد

```bash
curl -X POST http://localhost:3000/api/portal/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "role_id": 2,
    "work_days": "السبت,الأحد,الاثنين",
    "start_time": "09:00",
    "end_time": "17:00"
  }'
```

---

### 2.3 تحديث موظف

```bash
curl -X PUT http://localhost:3000/api/portal/users/5 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد المحدث",
    "work_days": "السبت,الأحد,الاثنين,الثلاثاء,الأربعاء"
  }'
```

---

### 2.4 حذف موظف

```bash
curl -X DELETE http://localhost:3000/api/portal/users/5
```

---

### 2.5 جلب موظف محدد

```bash
curl -X GET http://localhost:3000/api/portal/users/1
```

---

### 2.6 البحث عن ضيف

```bash
curl -X GET "http://localhost:3000/api/portal/guests/search?name=محمد"
```

---

### 2.7 جلب حلقات برنامج معين

```bash
curl -X GET "http://localhost:3000/api/portal/episodes?program_id=1"
```

---

## <a name="postman"></a>3. اختبار باستخدام Postman

### 3.1 إعداد Collection

1. افتح Postman
2. أنشئ Collection جديد باسم "Media Center API"
3. أضف متغير `baseUrl` = `http://localhost:3000/api/portal`

### 3.2 مثال: إنشاء موظف

**Request**:
- Method: `POST`
- URL: `{{baseUrl}}/users`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
  ```json
  {
    "name": "سارة أحمد",
    "email": "sara@example.com",
    "role_id": 3,
    "work_days": "السبت,الأحد,الاثنين,الثلاثاء",
    "start_time": "08:00",
    "end_time": "16:00"
  }
  ```

### 3.3 Tests في Postman

```javascript
// التحقق من نجاح الطلب
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

// التحقق من وجود البيانات
pm.test("Response has data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.data).to.have.property('id');
});

// حفظ الـ ID للاستخدام لاحقاً
var jsonData = pm.response.json();
pm.environment.set("userId", jsonData.data.id);
```

---

## <a name="thunder"></a>4. اختبار باستخدام Thunder Client

### 4.1 إعداد Thunder Client في VS Code

1. ثبت إضافة "Thunder Client"
2. افتح Thunder Client من الشريط الجانبي
3. أنشئ Collection جديد

### 4.2 مثال: جلب جميع البرامج

**Request**:
```
GET http://localhost:3000/api/portal/programs
```

**Tests**:
```javascript
json.success === true
json.data.length > 0
```

### 4.3 مثال: إنشاء برنامج

**Request**:
```
POST http://localhost:3000/api/portal/programs
Content-Type: application/json

{
  "title": "برنامج الصباح",
  "description": "برنامج صباحي يومي",
  "media_unit_id": 1,
  "air_time": "08:00"
}
```

---

## <a name="javascript"></a>5. اختبار باستخدام JavaScript

### 5.1 باستخدام fetch

```javascript
// جلب جميع الموظفين
async function getAllUsers() {
  const response = await fetch('http://localhost:3000/api/portal/users');
  const data = await response.json();
  console.log(data);
}

// إنشاء موظف جديد
async function createUser() {
  const response = await fetch('http://localhost:3000/api/portal/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'خالد حسن',
      email: 'khaled@example.com',
      role_id: 4
    })
  });
  
  const data = await response.json();
  console.log(data);
}

// تحديث موظف
async function updateUser(userId) {
  const response = await fetch(`http://localhost:3000/api/portal/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      work_days: 'السبت,الأحد,الاثنين,الثلاثاء,الأربعاء'
    })
  });
  
  const data = await response.json();
  console.log(data);
}

// حذف موظف
async function deleteUser(userId) {
  const response = await fetch(`http://localhost:3000/api/portal/users/${userId}`, {
    method: 'DELETE'
  });
  
  const data = await response.json();
  console.log(data);
}
```

---

### 5.2 باستخدام axios

```javascript
const axios = require('axios');

const baseURL = 'http://localhost:3000/api/portal';

// جلب جميع الموظفين
async function getAllUsers() {
  try {
    const response = await axios.get(`${baseURL}/users`);
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// إنشاء موظف جديد
async function createUser() {
  try {
    const response = await axios.post(`${baseURL}/users`, {
      name: 'فاطمة علي',
      email: 'fatima@example.com',
      role_id: 5,
      work_days: 'السبت,الأحد,الاثنين',
      start_time: '09:00',
      end_time: '17:00'
    });
    
    console.log('User created:', response.data);
    return response.data.data.id;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// تحديث موظف
async function updateUser(userId) {
  try {
    const response = await axios.put(`${baseURL}/users/${userId}`, {
      name: 'فاطمة علي المحدثة',
      work_days: 'السبت,الأحد,الاثنين,الثلاثاء,الأربعاء'
    });
    
    console.log('User updated:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// حذف موظف
async function deleteUser(userId) {
  try {
    const response = await axios.delete(`${baseURL}/users/${userId}`);
    console.log('User deleted:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

---

## <a name="scenarios"></a>6. سيناريوهات اختبار كاملة

### 6.1 سيناريو: إنشاء برنامج كامل مع حلقاته وضيوفه

```javascript
const axios = require('axios');
const baseURL = 'http://localhost:3000/api/portal';

async function createCompleteProgram() {
  try {
    // 1. إنشاء برنامج
    console.log('1. Creating program...');
    const programResponse = await axios.post(`${baseURL}/programs`, {
      title: 'برنامج الصباح الجديد',
      description: 'برنامج صباحي يومي',
      media_unit_id: 1,
      air_time: '08:00'
    });
    const programId = programResponse.data.data.id;
    console.log(`✓ Program created with ID: ${programId}`);
    
    // 2. إنشاء حلقة
    console.log('\n2. Creating episode...');
    const episodeResponse = await axios.post(`${baseURL}/episodes`, {
      program_id: programId,
      title: 'الحلقة الأولى',
      episode_number: 1,
      air_date: '2024-01-21'
    });
    const episodeId = episodeResponse.data.data.id;
    console.log(`✓ Episode created with ID: ${episodeId}`);
    
    // 3. إنشاء ضيف
    console.log('\n3. Creating guest...');
    const guestResponse = await axios.post(`${baseURL}/guests`, {
      name: 'د. محمد علي',
      title: 'أستاذ الاقتصاد',
      bio: 'أستاذ الاقتصاد في جامعة الملك سعود',
      phone: '+966501234567'
    });
    const guestId = guestResponse.data.data.id;
    console.log(`✓ Guest created with ID: ${guestId}`);
    
    // 4. إضافة الضيف للحلقة
    console.log('\n4. Adding guest to episode...');
    await axios.post(`${baseURL}/episode-guests`, {
      episode_id: episodeId,
      guest_id: guestId
    });
    console.log('✓ Guest added to episode');
    
    // 5. التحقق من البيانات
    console.log('\n5. Verifying data...');
    const programCheck = await axios.get(`${baseURL}/programs/${programId}`);
    const episodesCheck = await axios.get(`${baseURL}/episodes?program_id=${programId}`);
    const guestsCheck = await axios.get(`${baseURL}/episode-guests?episode_id=${episodeId}`);
    
    console.log('\n=== Final Result ===');
    console.log('Program:', programCheck.data.data.title);
    console.log('Episodes:', episodesCheck.data.count);
    console.log('Guests:', guestsCheck.data.data.length);
    
    return {
      programId,
      episodeId,
      guestId
    };
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// تشغيل السيناريو
createCompleteProgram();
```

**Output المتوقع**:
```
1. Creating program...
✓ Program created with ID: 15

2. Creating episode...
✓ Episode created with ID: 42

3. Creating guest...
✓ Guest created with ID: 8

4. Adding guest to episode...
✓ Guest added to episode

5. Verifying data...

=== Final Result ===
Program: برنامج الصباح الجديد
Episodes: 1
Guests: 1
```

---

### 6.2 سيناريو: إنشاء فريق عمل كامل

```javascript
async function createCompleteTeam() {
  try {
    // 1. إنشاء قسم
    console.log('1. Creating desk...');
    const deskResponse = await axios.post(`${baseURL}/desks`, {
      name: 'قسم الإنتاج',
      description: 'مسؤول عن إنتاج البرامج',
      manager_id: 5
    });
    const deskId = deskResponse.data.data.id;
    console.log(`✓ Desk created with ID: ${deskId}`);
    
    // 2. إنشاء فريق
    console.log('\n2. Creating team...');
    const teamResponse = await axios.post(`${baseURL}/teams`, {
      desk_id: deskId,
      name: 'فريق الإنتاج الصباحي',
      manager_id: 7
    });
    const teamId = teamResponse.data.data.id;
    console.log(`✓ Team created with ID: ${teamId}`);
    
    // 3. إضافة موظفين للفريق
    console.log('\n3. Adding team members...');
    const userIds = [10, 11, 12, 13];
    
    for (const userId of userIds) {
      await axios.post(`${baseURL}/team-users`, {
        team_id: teamId,
        user_id: userId
      });
      console.log(`✓ Added user ${userId} to team`);
    }
    
    // 4. التحقق من الفريق
    console.log('\n4. Verifying team...');
    const teamMembers = await axios.get(`${baseURL}/team-users?team_id=${teamId}`);
    
    console.log('\n=== Final Result ===');
    console.log('Desk ID:', deskId);
    console.log('Team ID:', teamId);
    console.log('Team Members:', teamMembers.data.data.length);
    
    return {
      deskId,
      teamId,
      memberCount: teamMembers.data.data.length
    };
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createCompleteTeam();
```

---

### 6.3 سيناريو: اختبار معالجة الأخطاء

```javascript
async function testErrorHandling() {
  console.log('=== Testing Error Handling ===\n');
  
  // 1. محاولة إنشاء موظف بدون بيانات مطلوبة
  console.log('1. Testing missing required fields...');
  try {
    await axios.post(`${baseURL}/users`, {
      name: 'أحمد'
      // email مفقود
    });
  } catch (error) {
    console.log('✓ Error caught:', error.response.data.error);
  }
  
  // 2. محاولة الوصول لمورد غير موجود
  console.log('\n2. Testing non-existent resource...');
  try {
    await axios.get(`${baseURL}/users/999999`);
  } catch (error) {
    console.log('✓ Error caught:', error.response.data.error);
  }
  
  // 3. محاولة إرسال بيانات غير صحيحة
  console.log('\n3. Testing invalid data...');
  try {
    await axios.post(`${baseURL}/programs`, {
      title: '', // عنوان فارغ
      media_unit_id: 'invalid' // نوع خاطئ
    });
  } catch (error) {
    console.log('✓ Error caught:', error.response?.data?.error || error.message);
  }
  
  // 4. محاولة حذف مورد غير موجود
  console.log('\n4. Testing delete non-existent...');
  try {
    await axios.delete(`${baseURL}/users/999999`);
  } catch (error) {
    console.log('✓ Error caught:', error.response.data.error);
  }
}

testErrorHandling();
```

---

### 6.4 سيناريو: اختبار الأداء

```javascript
async function performanceTest() {
  console.log('=== Performance Test ===\n');
  
  // 1. اختبار سرعة جلب البيانات
  console.log('1. Testing fetch speed...');
  const startFetch = Date.now();
  await axios.get(`${baseURL}/users`);
  const fetchTime = Date.now() - startFetch;
  console.log(`✓ Fetch time: ${fetchTime}ms`);
  
  // 2. اختبار سرعة الإنشاء
  console.log('\n2. Testing create speed...');
  const startCreate = Date.now();
  const response = await axios.post(`${baseURL}/users`, {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    role_id: 2
  });
  const createTime = Date.now() - startCreate;
  console.log(`✓ Create time: ${createTime}ms`);
  
  const userId = response.data.data.id;
  
  // 3. اختبار سرعة التحديث
  console.log('\n3. Testing update speed...');
  const startUpdate = Date.now();
  await axios.put(`${baseURL}/users/${userId}`, {
    name: 'Updated Test User'
  });
  const updateTime = Date.now() - startUpdate;
  console.log(`✓ Update time: ${updateTime}ms`);
  
  // 4. اختبار سرعة الحذف
  console.log('\n4. Testing delete speed...');
  const startDelete = Date.now();
  await axios.delete(`${baseURL}/users/${userId}`);
  const deleteTime = Date.now() - startDelete;
  console.log(`✓ Delete time: ${deleteTime}ms`);
  
  // 5. النتيجة النهائية
  console.log('\n=== Performance Summary ===');
  console.log(`Fetch: ${fetchTime}ms`);
  console.log(`Create: ${createTime}ms`);
  console.log(`Update: ${updateTime}ms`);
  console.log(`Delete: ${deleteTime}ms`);
  console.log(`Total: ${fetchTime + createTime + updateTime + deleteTime}ms`);
}

performanceTest();
```

---

### 6.5 سيناريو: اختبار Batch Operations

```javascript
async function testBatchOperations() {
  console.log('=== Testing Batch Operations ===\n');
  
  // 1. إنشاء عدة موظفين
  console.log('1. Creating multiple users...');
  const users = [
    { name: 'User 1', email: 'user1@example.com', role_id: 2 },
    { name: 'User 2', email: 'user2@example.com', role_id: 3 },
    { name: 'User 3', email: 'user3@example.com', role_id: 4 },
    { name: 'User 4', email: 'user4@example.com', role_id: 5 },
    { name: 'User 5', email: 'user5@example.com', role_id: 2 }
  ];
  
  const startBatch = Date.now();
  const createdUsers = await Promise.all(
    users.map(user => axios.post(`${baseURL}/users`, user))
  );
  const batchTime = Date.now() - startBatch;
  
  console.log(`✓ Created ${createdUsers.length} users in ${batchTime}ms`);
  console.log(`✓ Average time per user: ${(batchTime / createdUsers.length).toFixed(2)}ms`);
  
  // 2. حذف جميع الموظفين المنشأين
  console.log('\n2. Deleting created users...');
  const userIds = createdUsers.map(r => r.data.data.id);
  
  await Promise.all(
    userIds.map(id => axios.delete(`${baseURL}/users/${id}`))
  );
  
  console.log(`✓ Deleted ${userIds.length} users`);
}

testBatchOperations();
```

---

## 7. Postman Collection (JSON)

يمكنك استيراد هذا الملف في Postman:

```json
{
  "info": {
    "name": "Media Center API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api/portal"
    }
  ],
  "item": [
    {
      "name": "Users",
      "item": [
        {
          "name": "Get All Users",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/users"
          }
        },
        {
          "name": "Create User",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/users",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"أحمد محمد\",\n  \"email\": \"ahmed@example.com\",\n  \"role_id\": 2\n}"
            }
          }
        }
      ]
    }
  ]
}
```

---

## 8. نصائح للاختبار

### 8.1 استخدم Environment Variables

في Postman أو Thunder Client:
```
baseUrl = http://localhost:3000/api/portal
userId = {{lastCreatedUserId}}
```

### 8.2 احفظ الـ IDs للاستخدام لاحقاً

```javascript
// في Postman Tests
var jsonData = pm.response.json();
pm.environment.set("userId", jsonData.data.id);
```

### 8.3 اختبر جميع الحالات

- ✅ حالة النجاح
- ❌ حالة الفشل (بيانات ناقصة)
- ❌ حالة الفشل (مورد غير موجود)
- ❌ حالة الفشل (بيانات غير صحيحة)

### 8.4 تحقق من Response Status

```javascript
// 200 - OK
// 201 - Created
// 400 - Bad Request
// 404 - Not Found
// 500 - Server Error
```

---

## الخلاصة

هذا الدليل يوفر طرق متعددة لاختبار الـ API:
- cURL للاختبار السريع من Terminal
- Postman/Thunder Client للاختبار التفاعلي
- JavaScript للاختبار البرمجي والأتمتة
- سيناريوهات كاملة لاختبار التدفقات المعقدة
