import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Notification } from '../types';
import { CheckCircle2, Clock, Trash2, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('/api/notifications?limit=100');
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // وسّم الإشعار كمقروء
    if (!notification.is_read) {
      try {
        await api.patch(`/api/notifications/${notification.id}/read`, {});
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // انتقل للصفحة المناسبة بناءً على نوع الإشعار
    if (notification.entity_type === 'task' && notification.entity_id) {
      navigate(`/tasks/${notification.entity_id}`);
    } else if (notification.entity_type === 'order' && notification.entity_id) {
      navigate(`/orders/${notification.entity_id}`);
    } else if (notification.entity_type === 'admin_task' && notification.entity_id) {
      navigate(`/administrative/tasks/${notification.entity_id}`);
    } else if (notification.entity_type === 'admin_order' && notification.entity_id) {
      navigate(`/administrative/orders/${notification.entity_id}`);
    } else if (notification.entity_type === 'content' && notification.entity_id) {
      navigate(`/content/${notification.entity_id}`);
    } else if (notification.entity_type === 'shooting' && notification.entity_id) {
      navigate(`/shootings/${notification.entity_id}`);
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    if (!notification.is_read) {
      try {
        await api.patch(`/api/notifications/${notification.id}/read`, {});
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // تحديد لون الإشعار حسب النوع
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'task_status_changed':
      case 'content_uploaded':
        return {
          bg: 'bg-green-200',
          border: 'border-green-400',
          icon: '✅',
          color: 'text-green-700',
          title: 'text-gray-900 font-bold',
          message: 'text-gray-800',
          badge: 'bg-green-300 text-green-900'
        };
      case 'deadline_approaching':
      case 'task_assigned':
        return {
          bg: 'bg-orange-200',
          border: 'border-orange-400',
          icon: '⏰',
          color: 'text-orange-700',
          title: 'text-gray-900 font-bold',
          message: 'text-gray-800',
          badge: 'bg-orange-300 text-orange-900'
        };
      case 'order_created':
        return {
          bg: 'bg-red-200',
          border: 'border-red-400',
          icon: '📦',
          color: 'text-red-700',
          title: 'text-gray-900 font-bold',
          message: 'text-gray-800',
          badge: 'bg-red-300 text-red-900'
        };
      default:
        return {
          bg: 'bg-blue-200',
          border: 'border-blue-400',
          icon: '🔔',
          color: 'text-blue-700',
          title: 'text-gray-900 font-bold',
          message: 'text-gray-800',
          badge: 'bg-blue-300 text-blue-900'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الإشعارات</h1>
          <p className="text-gray-700 font-medium">
            {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Check size={18} />
            قراءة الكل
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-gray-300">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-3 font-semibold transition-colors ${
            filter === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          الكل ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-3 font-semibold transition-colors ${
            filter === 'unread'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          غير مقروء ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-600">جاري التحميل...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-700 text-lg">
              {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => {
            const style = getNotificationStyle(notification.type);
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNotificationClick(notification)}
                className={`p-5 rounded-xl border transition-all cursor-pointer group ${style.bg} ${style.border} hover:shadow-lg hover:shadow-white/10`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`text-3xl flex-shrink-0 mt-1 ${style.color}`}>
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-bold text-lg ${style.title}`}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
                              جديد
                            </span>
                          )}
                        </div>
                        <p className={`text-sm line-clamp-2 ${style.message}`}>
                          {notification.message}
                        </p>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-700">
                      <Clock size={14} />
                      {new Date(notification.created_at).toLocaleString('ar-SA')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, notification)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="وسّم كمقروء"
                      >
                        <CheckCircle2 size={20} className="text-green-400" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, notification.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={20} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
