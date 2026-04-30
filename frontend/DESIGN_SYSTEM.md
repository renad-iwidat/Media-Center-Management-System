# 🎨 نظام التصميم - Media Center Management System

## 📋 جدول المحتويات

1. [الألوان الأساسية](#الألوان-الأساسية)
2. [الألوان الثانوية](#الألوان-الثانوية)
3. [الأزرار](#الأزرار)
4. [الجداول](#الجداول)
5. [السايد بار](#السايد-بار)
6. [الـ Shadows](#الـ-shadows)
7. [الـ Borders](#الـ-borders)
8. [الـ Typography](#الـ-typography)
9. [استخدام Tailwind CSS](#استخدام-tailwind-css)

---

## 🎯 الألوان الأساسية

### الأزرق الرئيسي (Primary Blue)

```
الأزرق الفاتح جداً: #f0f4f8
الأزرق الفاتح: #7BA5C1
الأزرق المتوسط: #6B95B1
الأزرق الداكن: #4A7C9E
الأزرق الأغمق: #3d6a8a
الأزرق الأغمق جداً: #2d5570
الأزرق الداكن جداً: #1f3a4f
الأزرق الأسود: #0f1f2e
```

**الاستخدام:**
- الأزرار الرئيسية
- الـ Topbar
- الـ Sidebar
- الـ Links
- الـ Hover states

### البرتقالي (Accent Orange)

```
البرتقالي الخفيف جداً: #FFF5E6
البرتقالي الفاتح: #FFB366
البرتقالي الرئيسي: #FF9F4A
البرتقالي الداكن: #FF8C2E
```

**الاستخدام:**
- الأيقونات النشطة
- الـ Active indicators
- الـ Highlights
- الـ Accent elements

---

## 🎨 الألوان الثانوية

### الرمادي (Gray Scale)

```
الأبيض: #ffffff
الرمادي الفاتح جداً: #f8fafc
الرمادي الفاتح: #f1f5f9
الرمادي الفاتح المتوسط: #e2e8f0
الرمادي المتوسط: #cbd5e1
الرمادي الداكن: #64748b
الرمادي الداكن جداً: #1e293b
الأسود: #0b1224
```

### الأخضر (Success)

```
الأخضر الفاتح: #dcfce7
الأخضر المتوسط: #86efac
الأخضر الداكن: #22c55e
الأخضر الداكن جداً: #16a34a
```

**الاستخدام:**
- حالة "مكتمل" / "نجح"
- الـ Success messages
- الـ Active status

### الأحمر (Error/Danger)

```
الأحمر الفاتح: #fee2e2
الأحمر المتوسط: #fca5a5
الأحمر الداكن: #ef4444
الأحمر الداكن جداً: #dc2626
```

**الاستخدام:**
- حالة "متأخر" / "خطأ"
- الـ Error messages
- الـ Delete actions
- الـ Danger states

### الأصفر (Warning)

```
الأصفر الفاتح: #fef3c7
الأصفر المتوسط: #fcd34d
الأصفر الداكن: #f59e0b
الأصفر الداكن جداً: #d97706
```

**الاستخدام:**
- حالة "معلق" / "تحذير"
- الـ Warning messages
- الـ Pending status

### الأزرق الفاتح (Info)

```
الأزرق الفاتح: #dbeafe
الأزرق المتوسط: #93c5fd
الأزرق الداكن: #3b82f6
الأزرق الداكن جداً: #1d4ed8
```

**الاستخدام:**
- الـ Info messages
- الـ In progress status
- الـ Notifications

### البنفسجي (Secondary)

```
البنفسجي الفاتح: #ede9fe
البنفسجي المتوسط: #d8b4fe
البنفسجي الداكن: #a855f7
البنفسجي الداكن جداً: #7e22ce
```

**الاستخدام:**
- الـ Review status
- الـ Secondary actions

---

## 🔘 الأزرار

### الأزرار الرئيسية (Primary Buttons)

```jsx
<button className="btn-primary">إضافة جديد</button>
```

**الخصائص:**
- Background: `linear-gradient(to right, #3d6a8a, #2d5570)`
- Color: `#ffffff`
- Padding: `12px 24px`
- Border Radius: `12px`
- Font Weight: `600`
- Box Shadow: `0 4px 12px rgba(61, 106, 138, 0.3)`

**الـ Hover:**
- Background: `linear-gradient(to right, #2d5570, #1f3a4f)`
- Box Shadow: `0 8px 20px rgba(61, 106, 138, 0.4)`
- Transform: `translateY(-2px)`

### الأزرار الثانوية (Secondary Buttons)

```jsx
<button className="btn-secondary">إلغاء</button>
```

**الخصائص:**
- Background: `#f1f5f9`
- Color: `#1e293b`
- Border: `1px solid #e2e8f0`
- Padding: `12px 24px`
- Border Radius: `12px`

### الأزرار الخطرة (Danger Buttons)

```jsx
<button className="btn-danger">حذف</button>
```

**الخصائص:**
- Background: `#ef4444`
- Color: `#ffffff`
- Padding: `12px 24px`
- Border Radius: `12px`
- Box Shadow: `0 4px 12px rgba(239, 68, 68, 0.3)`

### الأزرار الصغيرة (Small Buttons)

```jsx
<button className="btn-primary btn-sm">صغير</button>
```

- Padding: `8px 16px`
- Font Size: `14px`
- Border Radius: `8px`

### الأزرار الكبيرة (Large Buttons)

```jsx
<button className="btn-primary btn-lg">كبير</button>
```

- Padding: `16px 32px`
- Font Size: `16px`
- Border Radius: `14px`

---

## 📊 الجداول

### رأس الجدول (Table Header)

```jsx
<thead className="table-header">
  <tr>
    <th>العمود</th>
  </tr>
</thead>
```

**الخصائص:**
- Background: `linear-gradient(to bottom, #f8fafc, #f1f5f9)`
- Border Bottom: `1px solid #e2e8f0`
- Color: `#64748b`
- Font Size: `12px`
- Font Weight: `700`
- Text Transform: `uppercase`
- Letter Spacing: `0.5px`
- Padding: `16px 24px`

### صفوف الجدول (Table Rows)

```jsx
<tbody>
  <tr className="table-row">
    <td className="table-cell">البيانات</td>
  </tr>
</tbody>
```

**الخصائص:**
- Background: `#ffffff`
- Border Bottom: `1px solid #e2e8f0`
- Color: `#1e293b`
- Padding: `16px 24px`
- Transition: `background-color 0.2s ease`

**الـ Hover:**
- Background: `#f8fafc`

**الصف المختار:**
```jsx
<tr className="table-row selected">
```
- Background: `#f0f4f8`
- Border Left: `3px solid #3d6a8a`

### الجداول الكاملة

```jsx
<div className="table-container">
  <table>
    {/* Table content */}
  </table>
</div>
```

**الخصائص:**
- Background: `#ffffff`
- Border Radius: `24px`
- Border: `1px solid #e2e8f0`
- Box Shadow: `0 4px 20px rgba(0, 0, 0, 0.05)`
- Overflow: `hidden`

---

## 🎭 السايد بار (Sidebar)

### الخلفية

```
Background: linear-gradient(to bottom, #2d5570, #1f3a4f)
Border Left: 1px solid rgba(255, 255, 255, 0.1)
```

### عناصر القائمة (Menu Items)

**الحالة العادية:**
- Color: `rgba(255, 255, 255, 0.8)`
- Padding: `16px`
- Border Radius: `12px`
- Transition: `all 0.2s ease`

**الـ Hover:**
- Background: `rgba(255, 255, 255, 0.1)`
- Color: `#ffffff`

**النشط (Active):**
```jsx
<li className="nav-item-active">العنصر</li>
```
- Background: `rgba(255, 159, 74, 0.15)`
- Border Right: `6px solid #FF9F4A`
- Color: `#FF9F4A`

### الأيقونة النشطة (Active Icon)

- Color: `#FF9F4A`
- Filter: `drop-shadow(0 0 4px rgba(255, 159, 74, 0.5))`

---

## 🌑 الـ Shadows

### Shadow الخفيف (Light Shadow)

```css
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
```

### Shadow المتوسط (Medium Shadow)

```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

### Shadow الثقيل (Heavy Shadow)

```css
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
```

### Shadow الـ Hover

```css
box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
```

### Shadow الـ Elevation

```css
box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
```

### Shadow الـ Inset

```css
box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
```

### Shadow الـ Colored (Orange)

```css
box-shadow: 0 4px 12px rgba(255, 159, 74, 0.3);
```

### Shadow الـ Colored (Blue)

```css
box-shadow: 0 4px 12px rgba(61, 106, 138, 0.3);
```

---

## 🎯 الـ Borders

### Border الخفيف

```css
border: 1px solid #e2e8f0;
```

### Border المتوسط

```css
border: 1px solid #cbd5e1;
```

### Border الثقيل

```css
border: 2px solid #94a3b8;
```

### Border الـ Rounded

```css
border-radius: 12px;  /* الأزرار والـ Cards */
border-radius: 16px;  /* الـ Modals */
border-radius: 24px;  /* الجداول والـ Large Cards */
border-radius: 50%;   /* الـ Circles */
```

---

## 📝 الـ Typography

### الخطوط المستخدمة

```
الخط الرئيسي: Inter, Almarai
الخط الأحادي: JetBrains Mono
الاتجاه: RTL (Right to Left)
```

### أحجام الخطوط

#### الـ Headings

```jsx
<h1>العنوان الرئيسي</h1>  /* 32px, 700, 1.2 */
<h2>العنوان الثانوي</h2>  /* 28px, 700, 1.3 */
<h3>العنوان الثالث</h3>    /* 24px, 700, 1.4 */
<h4>العنوان الرابع</h4>    /* 20px, 600, 1.4 */
```

#### الـ Body Text

```jsx
<p>النص العادي</p>           /* 16px, 400, 1.6 */
<p className="text-sm">نص صغير</p>   /* 14px, 400, 1.5 */
<p className="text-xs">نص صغير جداً</p> /* 12px, 400, 1.4 */
```

#### الـ Labels

```jsx
<label>التسمية</label>  /* 14px, 600 */
```

---

## 🎨 الـ Gradients

### الـ Gradient الأزرق (Sidebar)

```css
background: linear-gradient(to bottom, #2d5570, #1f3a4f);
```

### الـ Gradient الأزرق (Buttons)

```css
background: linear-gradient(to right, #3d6a8a, #2d5570);
```

### الـ Gradient الأزرق (Topbar)

```css
background: linear-gradient(to left, #3d6a8a, #4d7a9a);
```

### الـ Gradient البرتقالي (Accent)

```css
background: linear-gradient(to right, #FF9F4A, #FFB366);
```

---

## 🔄 الـ Transitions & Animations

### الـ Transition الأساسي

```css
transition: all 0.2s ease;
```

### الـ Transition السريع

```css
transition: all 0.15s ease;
```

### الـ Transition البطيء

```css
transition: all 0.3s ease;
```

### الـ Hover Effects

```css
/* للأزرار */
transform: translateY(-2px);
box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);

/* للـ Cards */
transform: translateY(-4px);
box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
```

---

## 📱 الـ Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  /* Styles for mobile */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Styles for tablet */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Styles for desktop */
}
```

---

## 🎯 استخدام Tailwind CSS

### الألوان في Tailwind

```jsx
/* Primary Colors */
<div className="bg-primary-darker text-white">...</div>
<div className="bg-primary-darkest">...</div>

/* Accent Colors */
<div className="bg-accent-main">...</div>
<div className="text-accent-dark">...</div>

/* Status Colors */
<div className="bg-success-dark">نجح</div>
<div className="bg-error-dark">خطأ</div>
<div className="bg-warning-dark">تحذير</div>
<div className="bg-info-dark">معلومة</div>
```

### الـ Shadows في Tailwind

```jsx
<div className="shadow-light">...</div>
<div className="shadow-medium">...</div>
<div className="shadow-heavy">...</div>
<div className="shadow-hover">...</div>
```

### الـ Border Radius في Tailwind

```jsx
<div className="rounded-xs">...</div>  /* 8px */
<div className="rounded-sm">...</div>  /* 12px */
<div className="rounded-md">...</div>  /* 16px */
<div className="rounded-lg">...</div>  /* 24px */
<div className="rounded-full">...</div> /* 50% */
```

### الـ Gradients في Tailwind

```jsx
<div className="bg-gradient-blue-sidebar">...</div>
<div className="bg-gradient-blue-button">...</div>
<div className="bg-gradient-orange">...</div>
```

---

## 📌 ملاحظات مهمة

1. **الاتجاه**: جميع الصفحات تستخدم `direction: rtl` للعربية
2. **الألوان**: استخدم الألوان المحددة أعلاه للحفاظ على التناسق
3. **الـ Shadows**: استخدم الـ shadows المحددة لإضافة عمق
4. **الـ Borders**: استخدم `border-radius` المناسب حسب نوع العنصر
5. **الـ Transitions**: أضف transitions لجميع الـ hover states
6. **الـ Responsive**: تأكد من أن التصميم يعمل على جميع الأجهزة

---

**آخر تحديث:** 2026-04-30  
**الإصدار:** 1.0.0
