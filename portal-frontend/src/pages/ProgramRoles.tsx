import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { programAPI, userAPI, programRoleAPI, roleAPI } from '../api/services';
import Modal from '../components/Modal';

interface Program {
  id: string;
  title: string;
  description?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface ProgramRole {
  id: string;
  program_id: string;
  user_id: string;
  role_id: string;
  role_name?: string;
  user_name?: string;
  email?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

export default function ProgramRoles() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [programRoles, setProgramRoles] = useState<ProgramRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    role_id: '',
  });

  useEffect(() => {
    const init = async () => {
      await fetchPrograms();
      await fetchUsers();
      await fetchRoles();
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchProgramRoles(selectedProgram);
    } else {
      setProgramRoles([]);
    }
  }, [selectedProgram]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await programAPI.getAll();
      setPrograms(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في جلب البرامج');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      setRoles(response.data || []);
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setRoles([]);
    }
  };

  const fetchProgramRoles = async (programId: string) => {
    try {
      const response = await programRoleAPI.getByProgram(programId);
      setProgramRoles(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في جلب أدوار البرنامج');
    }
  };

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({
      user_id: '',
      role_id: '',
    });
    setIsModalOpen(true);
  };

  const handleEditModal = (pr: ProgramRole) => {
    setEditingId(pr.id);
    setFormData({
      user_id: pr.user_id,
      role_id: pr.role_id,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.user_id || !formData.role_id) {
        alert('اختر موظفاً ودوراً');
        return;
      }

      setIsSubmitting(true);

      if (editingId) {
        // Update existing role
        await programRoleAPI.update(editingId, {
          role_id: formData.role_id,
        });
      } else {
        // Create new role
        await programRoleAPI.create({
          program_id: selectedProgram,
          user_id: formData.user_id,
          role_id: formData.role_id,
        });
      }

      if (selectedProgram) fetchProgramRoles(selectedProgram);
      setIsModalOpen(false);
      setEditingId(null);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'فشل في الحفظ';
      setError(errorMsg);
      setIsSubmitting(false);
      alert(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      try {
        await programRoleAPI.delete(id);
        if (selectedProgram) fetchProgramRoles(selectedProgram);
      } catch (err: any) {
        setError(err.response?.data?.message || 'فشل في الحذف');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 rtl" dir="rtl">
      {/* Header */}
      <div className="bg-blue-900 text-white p-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div className="text-right">
            <h1 className="text-4xl font-bold mb-2">أدوار البرامج</h1>
            <p className="text-blue-200 text-lg">ربط الموظفين بالبرامج وتحديد أدوارهم في الإنتاج</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-800 hover:bg-blue-700 px-6 py-3 rounded-lg transition transform hover:scale-105 font-semibold"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {error && (
          <div className="bg-red-100 border-r-4 border-red-600 text-red-700 p-4 rounded-lg mb-6 text-right shadow">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* قائمة البرامج */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-blue-900 text-white p-4">
                <h2 className="text-xl font-bold">البرامج</h2>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {programs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">لا توجد برامج</div>
                ) : (
                  programs.map((program) => (
                    <button
                      key={program.id}
                      onClick={() => setSelectedProgram(program.id)}
                      className={`w-full text-right p-3 rounded-lg border-2 transition transform hover:scale-105 ${
                        selectedProgram === program.id
                          ? 'bg-blue-50 border-blue-600 shadow-md'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-gray-800">{program.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{program.description || '-'}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* أدوار البرنامج */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-blue-900 text-white p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {selectedProgram 
                      ? programs.find(p => p.id === selectedProgram)?.title || 'أدوار البرنامج'
                      : 'أدوار البرنامج'
                    }
                  </h2>
                  {selectedProgram && (
                    <button
                      onClick={handleOpenModal}
                      className="bg-blue-800 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition transform hover:scale-105 font-semibold"
                    >
                      + إضافة دور جديد
                    </button>
                  )}
                </div>
              </div>

              {!selectedProgram ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500 text-lg">اختر برنامجاً من القائمة لعرض أدواره</p>
                </div>
              ) : programRoles.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500 text-lg">لا توجد أدوار في هذا البرنامج</p>
                  <button
                    onClick={handleOpenModal}
                    className="mt-4 bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg transition"
                  >
                    أضف الدور الأول
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="p-4 text-right text-gray-700 font-bold">اسم الموظف</th>
                        <th className="p-4 text-right text-gray-700 font-bold">البريد الإلكتروني</th>
                        <th className="p-4 text-right text-gray-700 font-bold">الدور</th>
                        <th className="p-4 text-right text-gray-700 font-bold">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programRoles.map((pr, idx) => (
                        <tr
                          key={pr.id}
                          className={`border-b transition hover:bg-blue-50 ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="p-4 text-right font-semibold text-gray-800">{pr.user_name}</td>
                          <td className="p-4 text-right text-gray-600 text-sm">{pr.email}</td>
                          <td className="p-4 text-right">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {pr.role_name || '-'}
                            </span>
                          </td>
                          <td className="p-4 flex gap-2 justify-start">
                            <button
                              onClick={() => handleEditModal(pr)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition transform hover:scale-105"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDelete(pr.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition transform hover:scale-105"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          title={editingId ? "تعديل الدور" : "إضافة دور جديد"}
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          onSubmit={handleSubmit}
          submitText={isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
        >
          <div className="space-y-5 rtl" dir="rtl">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 text-right">الموظف *</label>
              <select
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                disabled={isSubmitting || editingId !== null}
                className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100 text-right font-medium"
              >
                <option value="">-- اختر موظفاً --</option>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <option key={user.id} value={String(user.id)}>
                      {user.name}
                    </option>
                  ))
                ) : (
                  <option disabled>جاري التحميل...</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 text-right">الدور *</label>
              <select
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                disabled={isSubmitting}
                className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100 text-right font-medium"
              >
                <option value="">-- اختر دوراً --</option>
                {roles && roles.length > 0 ? (
                  roles.map((role) => (
                    <option key={role.id} value={String(role.id)}>
                      {role.name}
                    </option>
                  ))
                ) : (
                  <option disabled>جاري التحميل...</option>
                )}
              </select>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
