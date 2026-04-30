/**
 * useMediaUnits — shared hook
 * يجلب قائمة وحدات الإعلام مرة واحدة ويخزنها
 */
import { useState, useEffect, useCallback } from 'react';
import { api, getAuthToken, getCurrentUser } from '../services/api';

export interface MediaUnit {
  id: number;
  name: string;
  is_active?: boolean;
}

// Simple module-level cache so we don't re-fetch on every mount
let _cache: MediaUnit[] | null = null;

// دالة لمسح الـ cache عند تسجيل الخروج
export function clearMediaUnitsCache() {
  _cache = null;
  console.log('🧹 [MEDIA-UNITS] تم مسح cache وحدات الإعلام');
}

export function useMediaUnits() {
  const [mediaUnits, setMediaUnits] = useState<MediaUnit[]>(_cache ?? []);
  const [loading, setLoading] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // ✅ استخدام useCallback لمنع إعادة إنشاء الدالة في كل render
  const fetchMediaUnits = useCallback(() => {
    // لا نجلب البيانات إذا كانت محفوظة بالفعل (إلا إذا تم مسح الـ cache)
    if (_cache && _cache.length > 0 && refetchTrigger === 0) {
      console.log('📋 [MEDIA-UNITS] استخدام البيانات المحفوظة من الـ cache');
      setMediaUnits(_cache);
      return;
    }

    // لا نجلب البيانات إذا لم يكن هناك توكن أو مستخدم
    const token = getAuthToken();
    const user = getCurrentUser();
    
    if (!token || !user) {
      console.log('⏭️ [MEDIA-UNITS] لا يوجد توكن أو مستخدم - تخطي جلب البيانات');
      setMediaUnits([]);
      return;
    }

    setLoading(true);
    console.log('🌐 [MEDIA-UNITS] جاري جلب وحدات الإعلام من سيرفر الأخبار');
    console.log('🔗 [MEDIA-UNITS] التوكن:', token ? token.substring(0, 20) + '...' : 'غير موجود');

    api.getMediaUnits()
      .then((response) => {
        console.log('✅ [MEDIA-UNITS] البيانات المستلمة:', response);
        
        if (response.success && Array.isArray(response.data)) {
          const units: MediaUnit[] = response.data;
          console.log('📋 [MEDIA-UNITS] وحدات الإعلام الحقيقية:', units.map(u => `${u.id}: ${u.name}`));
          _cache = units;
          setMediaUnits(units);
        } else {
          console.warn('⚠️ [MEDIA-UNITS] البيانات المستلمة غير صحيحة:', response);
          _cache = [];
          setMediaUnits([]);
        }
      })
      .catch((err) => {
        console.error('❌ [MEDIA-UNITS] خطأ في جلب وحدات الإعلام:', err);
        console.error('🔍 [MEDIA-UNITS] تفاصيل الخطأ:', err.message);
        
        // لا نستخدم بيانات وهمية - نترك القائمة فارغة
        console.log('📭 [MEDIA-UNITS] ترك القائمة فارغة بسبب الخطأ');
        _cache = [];
        setMediaUnits([]);
      })
      .finally(() => setLoading(false));
  }, [refetchTrigger]); // ✅ dependencies صحيحة

  useEffect(() => {
    let isMounted = true;
    
    // Only fetch if component is still mounted
    if (isMounted) {
      fetchMediaUnits();
    }
    
    return () => {
      isMounted = false;
    };
  }, [fetchMediaUnits]); // ✅ الآن fetchMediaUnits مستقرة بفضل useCallback

  // ✅ لف refetch بـ useCallback لمنع إعادة إنشائها في كل render
  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []); // dependency array فاضي = مستقرة دائماً

  return { mediaUnits, loading, refetch };
}