import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Calendar, User, Clock, ArrowLeft, Home } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { api } from '../../services/api';
import { AdminProcTask, AdminProcListResponse } from '../../types/administrative';

export default function MyAdminTasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<AdminProcTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.get<AdminProcListResponse<AdminProcTask>>(
        '/api/administrative/my-tasks?limit=100'
      );
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back to Home */}
      <button
        onClick={() => navigate('/welcome')}
        className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>الصفحة الرئيسية</span>
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/30">
          <ClipboardList className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">مهامي الإدارية</h1>
          <p className="text-gray-500 mt-1">المهام الإدارية المعينة عليك أو المذكور فيها اسمك</p>
        </div>
      </motion.div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
        >
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-500 mb-2">لا توجد مهام إدارية</h3>
          <p className="text-gray-400">لم يتم تعيين أي مهام إدارية لك حتى الآن</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id.toString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/administrative/tasks/${task.id}`)}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-5 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2">
                    {task.status_name && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {task.status_name}
                      </span>
                    )}
                    {task.category_name && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                        {task.category_name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg group-hover:text-purple-700 transition-colors">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                  )}
                  {task.order_title && (
                    <p className="text-xs text-gray-400 mt-2">
                      <strong>الطلب:</strong> {task.order_title}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
                    {task.created_by_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.created_by_name}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="flex items-center gap-1 text-orange-500">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.deadline), 'dd MMM yyyy', { locale: ar })}
                      </span>
                    )}
                    {task.created_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(task.created_at), 'dd MMM', { locale: ar })}
                      </span>
                    )}
                  </div>
                </div>

                <ArrowLeft className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
