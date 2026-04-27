/**
 * useMediaUnits — shared hook
 * يجلب قائمة وحدات الإعلام مرة واحدة ويخزنها
 */
import { useState, useEffect } from 'react';

// استخدام VITE_API_URL من environment variables
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export interface MediaUnit {
  id: number;
  name: string;
  is_active?: boolean;
}

// Simple module-level cache so we don't re-fetch on every mount
let _cache: MediaUnit[] | null = null;

export function useMediaUnits() {
  const [mediaUnits, setMediaUnits] = useState<MediaUnit[]>(_cache ?? []);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) return;
    setLoading(true);
    fetch(`${API_URL}/data/media-units`)
      .then((r) => r.json())
      .then((json) => {
        const units: MediaUnit[] = json.success ? json.data : [];
        _cache = units;
        setMediaUnits(units);
      })
      .catch((err) => {
        console.error('❌ Error fetching media units:', err);
        setMediaUnits([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { mediaUnits, loading };
}
