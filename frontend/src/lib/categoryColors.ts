/**
 * Category color mapping system
 * Provides consistent, high-contrast colors for news categories
 * Optimized for dark backgrounds with proper contrast
 */

export const categoryColorMap: Record<string, { bg: string; text: string; border: string; darkBg?: string }> = {
  // Arabic category names - High contrast for dark backgrounds
  'محلي': { bg: 'bg-red-600/25', text: 'text-red-300', border: 'border-red-400/50', darkBg: 'bg-red-900/40' },
  'دولي': { bg: 'bg-blue-600/25', text: 'text-blue-300', border: 'border-blue-400/50', darkBg: 'bg-blue-900/40' },
  'سياسة': { bg: 'bg-purple-600/25', text: 'text-purple-300', border: 'border-purple-400/50', darkBg: 'bg-purple-900/40' },
  'اقتصاد': { bg: 'bg-emerald-600/25', text: 'text-emerald-300', border: 'border-emerald-400/50', darkBg: 'bg-emerald-900/40' },
  'رياضة': { bg: 'bg-amber-600/25', text: 'text-amber-300', border: 'border-amber-400/50', darkBg: 'bg-amber-900/40' },
  'صحة': { bg: 'bg-pink-600/25', text: 'text-pink-300', border: 'border-pink-400/50', darkBg: 'bg-pink-900/40' },
  'تكنولوجيا': { bg: 'bg-cyan-600/25', text: 'text-cyan-300', border: 'border-cyan-400/50', darkBg: 'bg-cyan-900/40' },
  'ثقافة': { bg: 'bg-orange-600/25', text: 'text-orange-300', border: 'border-orange-400/50', darkBg: 'bg-orange-900/40' },
  'علوم': { bg: 'bg-indigo-600/25', text: 'text-indigo-300', border: 'border-indigo-400/50', darkBg: 'bg-indigo-900/40' },
  'أخرى': { bg: 'bg-slate-600/25', text: 'text-slate-300', border: 'border-slate-400/50', darkBg: 'bg-slate-900/40' },
  
  // English category names (fallback)
  'domestic': { bg: 'bg-red-600/25', text: 'text-red-300', border: 'border-red-400/50', darkBg: 'bg-red-900/40' },
  'international': { bg: 'bg-blue-600/25', text: 'text-blue-300', border: 'border-blue-400/50', darkBg: 'bg-blue-900/40' },
  'politics': { bg: 'bg-purple-600/25', text: 'text-purple-300', border: 'border-purple-400/50', darkBg: 'bg-purple-900/40' },
  'economy': { bg: 'bg-emerald-600/25', text: 'text-emerald-300', border: 'border-emerald-400/50', darkBg: 'bg-emerald-900/40' },
  'sports': { bg: 'bg-amber-600/25', text: 'text-amber-300', border: 'border-amber-400/50', darkBg: 'bg-amber-900/40' },
  'health': { bg: 'bg-pink-600/25', text: 'text-pink-300', border: 'border-pink-400/50', darkBg: 'bg-pink-900/40' },
  'technology': { bg: 'bg-cyan-600/25', text: 'text-cyan-300', border: 'border-cyan-400/50', darkBg: 'bg-cyan-900/40' },
  'culture': { bg: 'bg-orange-600/25', text: 'text-orange-300', border: 'border-orange-400/50', darkBg: 'bg-orange-900/40' },
  'science': { bg: 'bg-indigo-600/25', text: 'text-indigo-300', border: 'border-indigo-400/50', darkBg: 'bg-indigo-900/40' },
  'other': { bg: 'bg-slate-600/25', text: 'text-slate-300', border: 'border-slate-400/50', darkBg: 'bg-slate-900/40' },
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
