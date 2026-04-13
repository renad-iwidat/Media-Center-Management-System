import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { guestAPI } from '../api/services';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

interface Guest {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  phone?: string;
  created_at: string;
}

export default function Guests() {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    phone: '',
  });

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      console.log('Fetching guests...');
      setLoading(true);
      const response = await guestAPI.getAll();
      console.log('Response:', response.data);
      setGuests(response.data || []);
      setError('');
    } catch (err: any) {
      console.error('Error:', err.message);
      setGuests([]);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (guest?: Guest) => {
    if (guest) {
      setEditingId(guest.id);
      setFormData({
        name: guest.name,
        title: guest.title || '',
        bio: guest.bio || '',
        phone: guest.phone || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        title: '',
        bio: '',
        phone: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name) {
        alert('الاسم مطلوب');
        return;
      }

      console.log('Submitting form:', formData);
      setIsSubmitting(true);

      if (editingId) {
        console.log('Updating guest:', editingId);
        await guestAPI.update(editingId, formData);
      } else {
        console.log('Creating new guest');
        await guestAPI.create(formData);
      }

      console.log('Success! Closing modal and refreshing');
      setIsModalOpen(false);
      setIsSubmitting(false);
      await fetchGuests();
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'فشل في حفظ الضيف';
      setError(errorMsg);
      setIsSubmitting(false);
      alert(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      try {
        await guestAPI.delete(id);
        fetchGuests();
      } catch (err: any) {
        setError(err.response?.data?.message || 'فشل في حذف الضيف');
      }
    }
  };

  // Show content even while loading
  // if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100 rtl" dir="rtl">
      <div className="bg-blue-900 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div className="text-right">
            <h1 className="text-3xl font-bold">إدارة الضيوف</h1>
            <p className="text-blue-200 mt-1">إضافة وتعديل بيانات الضيوف والاتصال بهم</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-800 hover:bg-blue-700 px-6 py-2 rounded transition"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">قائمة الضيوف</h2>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 transition"
          >
            إضافة ضيف جديد
          </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 text-right">{error}</div>}

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-4 text-right">الاسم</th>
                <th className="p-4 text-right">الوظيفة</th>
                <th className="p-4 text-right">السيرة الذاتية</th>
                <th className="p-4 text-right">رقم الهاتف</th>
                <th className="p-4 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-right">{guest.name}</td>
                  <td className="p-4 text-right">{guest.title || '-'}</td>
                  <td className="p-4 text-right">{guest.bio || '-'}</td>
                  <td className="p-4 text-right">{guest.phone || '-'}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-start">
                      <button
                        onClick={() => handleOpenModal(guest)}
                        className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(guest.id)}
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

        {guests.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            لا توجد بيانات ضيوف
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        title={editingId ? 'تعديل الضيف' : 'إضافة ضيف جديد'}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        onSubmit={handleSubmit}
        submitText={isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto rtl" dir="rtl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الاسم *</label>
            <input
              type="text"
              placeholder="أدخل اسم الضيف"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الوظيفة/المسمى</label>
            <input
              type="text"
              placeholder="أدخل الوظيفة أو المسمى الوظيفي"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isSubmitting}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">السيرة الذاتية</label>
            <textarea
              placeholder="أدخل السيرة الذاتية"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={isSubmitting}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">رقم الهاتف</label>
            <input
              type="tel"
              placeholder="أدخل رقم الهاتف"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isSubmitting}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
