/**
 * Category color mapping system
 * Provides consistent, high-contrast colors for news categories
 * Optimized for dark backgrounds with proper contrast
 */

export const categoryColorMap: Record<string, { bg: string; text: string; border: string; darkBg?: string }> = {
  // Arabic category names - Light backgrounds with dark text for light theme
  'محلي': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', darkBg: 'bg-red-900/40' },
  'دولي': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', darkBg: 'bg-blue-900/40' },
  'سياسة': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', darkBg: 'bg-purple-900/40' },
  'اقتصاد': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', darkBg: 'bg-emerald-900/40' },
  'رياضة': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', darkBg: 'bg-amber-900/40' },
  'صحة': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', darkBg: 'bg-pink-900/40' },
  'تكنولوجيا': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', darkBg: 'bg-cyan-900/40' },
  'ثقافة': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', darkBg: 'bg-orange-900/40' },
  'علوم': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', darkBg: 'bg-indigo-900/40' },
  'أخرى': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', darkBg: 'bg-slate-900/40' },
  
  // English category names (fallback)
  'domestic': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', darkBg: 'bg-red-900/40' },
  'international': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', darkBg: 'bg-blue-900/40' },
  'politics': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', darkBg: 'bg-purple-900/40' },
  'economy': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', darkBg: 'bg-emerald-900/40' },
  'sports': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', darkBg: 'bg-amber-900/40' },
  'health': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', darkBg: 'bg-pink-900/40' },
  'technology': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', darkBg: 'bg-cyan-900/40' },
  'culture': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', darkBg: 'bg-orange-900/40' },
  'science': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', darkBg: 'bg-indigo-900/40' },
  'other': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', darkBg: 'bg-slate-900/40' },
};

/**
 * Get color classes for a category
 * Falls back to 'other' if category not found
 */
export function getCategoryColor(category: string | undefined | null) {
  if (!category) return categoryColorMap['أخرى'];
  
  const normalized = category.trim().toLowerCase();
  
  // Try exact match first
  if (categoryColorMap[normalized]) {
    return categoryColorMap[normalized];
  }
  
  // Try case-insensitive match
  const key = Object.keys(categoryColorMap).find(k => k.toLowerCase() === normalized);
  if (key) {
    return categoryColorMap[key];
  }
  
  // Default to 'other'
  return categoryColorMap['أخرى'];
}

/**
 * Get all available categories
 */
export function getAvailableCategories() {
  return Object.keys(categoryColorMap).filter(k => !['other', 'أخرى'].includes(k));
}
