/**
 * useLocalStorageBatch - Hook لحفظ عدة قيم في localStorage بشكل مجمع
 * يمنع إعادة التصيير اللانهائية الناتجة عن useEffect متعددة
 */
import { useEffect, useRef } from 'react';

interface LocalStorageItem {
  key: string;
  value: any;
}

export function useLocalStorageBatch(items: LocalStorageItem[], delay: number = 100) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousValuesRef = useRef<Record<string, any>>({});

  useEffect(() => {
    // تحقق من وجود تغييرات فعلية
    const hasChanges = items.some(item => {
      const prevValue = previousValuesRef.current[item.key];
      const currentValue = JSON.stringify(item.value);
      const prevValueStr = JSON.stringify(prevValue);
      return currentValue !== prevValueStr;
    });

    if (!hasChanges) return;

    // إلغاء المؤقت السابق
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // تأخير الحفظ لتجميع التحديثات
    timeoutRef.current = setTimeout(() => {
      items.forEach(item => {
        try {
          if (item.value === null || item.value === undefined) {
            localStorage.removeItem(item.key);
          } else {
            localStorage.setItem(item.key, JSON.stringify(item.value));
          }
          previousValuesRef.current[item.key] = item.value;
        } catch (error) {
          console.warn(`Failed to save ${item.key} to localStorage:`, error);
        }
      });
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [items.map(item => JSON.stringify(item.value)).join('|'), delay]);
}

/**
 * Hook مبسط لحفظ قيمة واحدة مع debounce
 */
export function useLocalStorageDebounced(key: string, value: any, delay: number = 100) {
  useLocalStorageBatch([{ key, value }], delay);
}

/**
 * Hook لقراءة قيمة من localStorage مع fallback
 */
export function useLocalStorageValue<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}