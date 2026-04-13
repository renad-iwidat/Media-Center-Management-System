import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, roleAPI } from '../api/services';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

interface User {
  id: string;
  name: string;
  email: string;
  role_id?: string;
  role_name?: string;
  work_days?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
}

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role_id: '',
    role_name: '',
    work_days: [] as string[],
    start_time: '',
    end_time: '',
  });

  const daysOfWeek = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // تحويل الوقت من 24 ساعة إلى 12 ساعة
  const convertTo12Hour = (time: string) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'مسائي' : 'صباحي';
    const displayHour = hour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  useEffect(() => {
    console.log('Users page mounted, fetching users...');
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      setLoading(true);
      const response = await userAPI.getAll();
      console.log('Users Response:', response.data);
      console.log('First user:', response.data?.[0]);
      setUsers(response.data || []);
      setError('');
    } catch (err: any) {
      console.error('Error:', err.message);
      setUsers([]);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      console.log('Roles fetched:', response.data);
      setRoles(response.data || []);
    } catch (err: any) {
      console.error('Error fetching roles:', err);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      const workDaysArray = user.work_days ? user.work_days.split(',').map(d => d.trim()) : [];
      setFormData({
        name: user.name,
        email: user.email,
        role_id: user.role_id || '',
        role_name: user.role_name || '',
        work_days: workDaysArray,
        start_time: user.start_time || '',
        end_time: user.end_time || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        role_id: '',
        role_name: '',
        work_days: [],
        start_time: '',
        end_time: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.email) {
        alert('الاسم والبريد الإلكتروني مطلوبان');
        return;
      }

      console.log('Submitting form:', formData);
      setIsSubmitting(true);
      
      const submitData = {
        name: formData.name,
        email: formData.email,
        role_id: formData.role_id ? parseInt(formData.role_id) : undefined,
        work_days: formData.work_days.length > 0 ? formData.work_days.join(',') : undefined,
        start_time: formData.start_time,
        end_time: formData.end_time,
      };

      if (editingId) {
        console.log('Updating user:', editingId);
        await userAPI.update(editingId, submitData);
      } else {
        console.log('Creating new user');
        await userAPI.create(submitData);
      }
      
      console.log('Success! Closing modal and refreshing');
      setIsModalOpen(false);
      setIsSubmitting(false);
      await fetchUsers();
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'فشل في حفظ الموظف';
      setError(errorMsg);
      setIsSubmitting(false);
      alert(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      try {
        await userAPI.delete(id);
        fetchUsers();
      } catch (err: any) {
        setError(err.response?.data?.message || 'فشل في حذف الموظف');
      }
    }
  };

  // Show content even while loading
  // if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100 rtl" dir="rtl">
      {/* Header */}
      <div className="bg-blue-900 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div className="text-right">
            <h1 className="text-3xl font-bold">إدارة الموظفين</h1>
            <p className="text-blue-200 mt-1">إضافة وتعديل وحذف الموظفين مع جداول العمل</p>
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
          <h2 className="text-2xl font-bold text-gray-800">قائمة الموظفين</h2>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 transition"
          >
            إضافة موظف جديد
          </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 text-right">{error}</div>}

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-4 text-right">الاسم</th>
                <th className="p-4 text-right">البريد الإلكتروني</th>
                <th className="p-4 text-right">الدور</th>
                <th className="p-4 text-right">أيام العمل</th>
                <th className="p-4 text-right">وقت البداية</th>
                <th className="p-4 text-right">وقت النهاية</th>
                <th className="p-4 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-right">{user.name}</td>
                  <td className="p-4 text-right">{user.email}</td>
                  <td className="p-4 text-right">{user.role_name || '-'}</td>
                  <td className="p-4 text-right">{user.work_days || '-'}</td>
                  <td className="p-4 text-right">{convertTo12Hour(user.start_time)}</td>
                  <td className="p-4 text-right">{convertTo12Hour(user.end_time)}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-start">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
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

        {users.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg">
            لا توجد بيانات موظفين
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        title={editingId ? 'تعديل الموظف' : 'إضافة موظف جديد'}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        onSubmit={handleSubmit}
        submitText={isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto rtl" dir="rtl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الاسم *</label>
            <input
              type="text"
              placeholder="أدخل اسم الموظف"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">البريد الإلكتروني *</label>
            <input
              type="email"
              placeholder="أدخل البريد الإلكتروني"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isSubmitting}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الدور</label>
            <select
              value={formData.role_id}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedRole = roles.find(r => r.id === parseInt(selectedId));
                setFormData({ 
                  ...formData, 
                  role_id: selectedId,
                  role_name: selectedRole?.name || ''
                });
              }}
              disabled={isSubmitting}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
            >
              <option value="">-- اختر دوراً --</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {formData.role_name && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-right text-sm text-gray-700">
                الدور المختار: <span className="font-semibold">{formData.role_name}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">أيام العمل</label>
            <div className="space-y-2 bg-gray-50 p-3 rounded">
              {daysOfWeek.map((day) => (
                <label key={day} className="flex items-center text-right cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.work_days.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, work_days: [...formData.work_days, day] });
                      } else {
                        setFormData({ ...formData, work_days: formData.work_days.filter(d => d !== day) });
                      }
                    }}
                    disabled={isSubmitting}
                    className="ml-2 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-gray-700">{day}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">وقت البداية</label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              disabled={isSubmitting}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">وقت النهاية</label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              disabled={isSubmitting}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
