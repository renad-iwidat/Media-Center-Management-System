/**
 * Status Translations
 * ترجمة حالات الأخبار من الإنجليزية إلى العربية
 */

export type NewsStatus = 'pending' | 'incomplete' | 'in_review' | 'approved' | 'rejected' | 'published';

interface StatusInfo {
  label: string;
  color: string;
  bgColor: string;
  icon?: string;
}

/**
 * ترجمة حالة الخبر من الإنجليزية إلى العربية
 */
export const statusTranslations: Record<NewsStatus, StatusInfo> = {
  pending: {
    label: 'في الانتظار',
    color: '#f59e0b', // amber-500
    bgColor: '#fef3c7', // amber-100
    icon: '⏳',
  },
  incomplete: {
    label: 'غير مكتمل',
    color: '#ef4444', // red-500
    bgColor: '#fee2e2', // red-100
    icon: '⚠️',
  },
  in_review: {
    label: 'قيد المراجعة',
    color: '#3b82f6', // blue-500
    bgColor: '#dbeafe', // blue-100
    icon: '👁️',
  },
  approved: {
    label: 'موافق عليه',
    color: '#10b981', // green-500
    bgColor: '#d1fae5', // green-100
    icon: '✅',
  },
  rejected: {
    label: 'مرفوض',
    color: '#dc2626', // red-600
    bgColor: '#fecaca', // red-200
    icon: '❌',
  },
  published: {
    label: 'منشور',
    color: '#059669', // emerald-600
    bgColor: '#a7f3d0', // emerald-200
    icon: '📰',
  },
};

/**
 * الحصول على ترجمة الحالة
 */
export function getStatusLabel(status: string): string {
  return statusTranslations[status as NewsStatus]?.label || status;
}

/**
 * الحصول على لون الحالة
 */
export function getStatusColor(status: string): string {
  return statusTranslations[status as NewsStatus]?.color || '#6b7280';
}

/**
 * الحصول على لون الخلفية للحالة
 */
export function getStatusBgColor(status: string): string {
  return statusTranslations[status as NewsStatus]?.bgColor || '#f3f4f6';
}

/**
 * الحصول على أيقونة الحالة
 */
export function getStatusIcon(status: string): string {
  return statusTranslations[status as NewsStatus]?.icon || '📄';
}

/**
 * الحصول على معلومات الحالة الكاملة
 */
export function getStatusInfo(status: string): StatusInfo {
  return statusTranslations[status as NewsStatus] || {
    label: status,
    color: '#6b7280',
    bgColor: '#f3f4f6',
    icon: '📄',
  };
}
