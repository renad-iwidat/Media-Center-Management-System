import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roleAPI } from '../api/services';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

interface Role {
  id: string;
  name: string;
  description?: string;
}

export default function Roles() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleAPI.getAll();
      setRoles(response.data || []);
      setError('');
    } catch (err: any) {
      console.error('Error:', err.message);
      setRoles([]);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingId(role.id);
      setFormData({
        name: role.name,
        description: role.description || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name) {
        alert('اسم الدور مطلوب');
        return;
      }

      setIsSubmitting(true);

      if (editingId) {
        await roleAPI.update(editingId, formData);
      } else {
        await roleAPI.create(formData);
      }

      setIsModalOpen(false);
      setIsSubmitting(false);
      await fetchRoles();
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'فشل في حفظ الدور';
      setError(errorMsg);
      setIsSubmitting(false);
      alert(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      try {
        await roleAPI.delete(id);
        fetchRoles();
      } catch (err: any) {
        setError(err.response?.data?.message || 'فشل في حذف الدور');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 rtl" dir="rtl">
      {/* Header */}
      <div className="bg-blue-900 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div className="text-right">
            <h1 className="text-3xl font-bold">إدارة الأدوار</h1>
            <p className="text-blue-200 mt-1">إضافة وتعديل وحذف أدوار الموظفين</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-800 hover:bg-blue-700 px-6 py-2 rounded transition"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">قائمة الأدوار</h2>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 transition"
          >
            إضافة دور جديد
          </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 text-right">{error}</div>}

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-4 text-right">اسم الدور</th>
                <th className="p-4 text-right">الوصف</th>
                <th className="p-4 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-right">{role.name}</td>
                  <td className="p-4 text-right">{role.description || '-'}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-start">
                      <button
                        onClick={() => handleOpenModal(role)}
                        className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {roles.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg">
            لا توجد أدوار
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        title={editingId ? 'تعديل الدور' : 'إضافة دور جديد'}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        onSubmit={handleSubmit}
        submitText={isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto rtl" dir="rtl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">اسم الدور *</label>
            <input
              type="text"
              placeholder="أدخل اسم الدور"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الوصف</label>
            <textarea
              placeholder="أدخل وصف الدور"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
