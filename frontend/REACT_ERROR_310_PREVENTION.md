# منع خطأ React #310 - دليل المطور

## ما هو خطأ React #310؟

خطأ React #310 يحدث عندما يقوم مكون React بإعادة التصيير بشكل لانهائي. الرسالة الكاملة:
```
"Too many re-renders. React limits the number of renders to prevent an infinite loop."
```

## الأسباب الشائعة:

### 1. **useEffect بدون dependencies صحيحة**
```javascript
// ❌ خطأ - يسبب إعادة تصيير لانهائية
useEffect(() => {
  setState(someValue);
}); // بدون dependency array

// ✅ صحيح
useEffect(() => {
  setState(someValue);
}, [dependency]);
```

### 2. **تحديث الحالة في render**
```javascript
// ❌ خطأ
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // يسبب إعادة تصيير لانهائية
  return <div>{count}</div>;
}

// ✅ صحيح
function Component() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(count + 1);
  }, []); // أو في event handler
  
  return <div>{count}</div>;
}
```

### 3. **دوال جديدة في كل render**
```javascript
// ❌ خطأ
function Component() {
  const handleClick = () => { /* ... */ }; // دالة جديدة في كل render
  
  useEffect(() => {
    // ...
  }, [handleClick]); // يسبب إعادة تشغيل useEffect
}

// ✅ صحيح
function Component() {
  const handleClick = useCallback(() => {
    // ...
  }, [dependencies]);
  
  useEffect(() => {
    // ...
  }, [handleClick]);
}
```

## الإصلاحات المطبقة في هذا المشروع:

### 1. **تحسين App.tsx**
- إضافة `isMounted` flag لمنع تحديث الحالة بعد unmount
- استخدام `useCallback` للدوال
- إضافة dependencies صحيحة لـ useEffect

### 2. **تحسين useMediaUnits Hook**
- إضافة cleanup function مع `isMounted` flag
- منع تحديث الحالة بعد unmount المكون

### 3. **تحسين ErrorBoundary**
- تسجيل أفضل للأخطاء
- معالجة أكثر ذكاءً لـ localStorage

### 4. **أدوات المراقبة**
- `useRenderTracker` لمراقبة إعادة التصيير
- `useDebounce` لتحسين الأداء

## أفضل الممارسات:

### 1. **استخدم useCallback للدوال**
```javascript
const handleSubmit = useCallback((data) => {
  // معالجة البيانات
}, [dependencies]);
```

### 2. **استخدم useMemo للقيم المحسوبة**
```javascript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(props);
}, [props]);
```

### 3. **تحقق من dependencies في useEffect**
```javascript
useEffect(() => {
  // تأكد من أن جميع المتغيرات المستخدمة موجودة في dependency array
  fetchData(userId, filters);
}, [userId, filters]); // ✅ جميع المتغيرات موجودة
```

### 4. **استخدم React.memo للمكونات**
```javascript
const MyComponent = React.memo(({ prop1, prop2 }) => {
  return <div>{prop1} {prop2}</div>;
});
```

### 5. **تجنب تحديث الحالة في render**
```javascript
// ❌ لا تفعل هذا
function Component({ data }) {
  const [processedData, setProcessedData] = useState([]);
  
  if (data !== processedData) {
    setProcessedData(processData(data)); // خطأ!
  }
}

// ✅ افعل هذا بدلاً من ذلك
function Component({ data }) {
  const [processedData, setProcessedData] = useState([]);
  
  useEffect(() => {
    setProcessedData(processData(data));
  }, [data]);
}
```

## أدوات التشخيص:

### 1. **React DevTools Profiler**
- استخدم React DevTools لمراقبة الأداء
- ابحث عن المكونات التي تعيد التصيير كثيراً

### 2. **useRenderTracker Hook**
```javascript
import { useRenderTracker } from './lib/useRenderTracker';

function MyComponent(props) {
  useRenderTracker('MyComponent', props); // في وضع التطوير فقط
  // ...
}
```

### 3. **Console Logging**
```javascript
useEffect(() => {
  console.log('Effect ran with:', dependencies);
}, dependencies);
```

## التحقق من الإصلاحات:

1. **بناء المشروع بنجاح**: `npm run build`
2. **لا توجد تحذيرات في Console**
3. **الأداء مستقر في React DevTools**
4. **لا توجد رسائل خطأ في ErrorBoundary**

## في حالة حدوث المشكلة مرة أخرى:

1. **تحقق من Console** للرسائل من `useRenderTracker`
2. **استخدم React DevTools Profiler** لتحديد المكون المسبب
3. **راجع useEffect hooks** في المكون المشكوك فيه
4. **تأكد من dependencies arrays** صحيحة
5. **ابحث عن تحديث الحالة في render logic**

## موارد إضافية:

- [React Error #310 Documentation](https://react.dev/errors/310)
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)