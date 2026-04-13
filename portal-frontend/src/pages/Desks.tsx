import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deskAPI, teamAPI, userAPI, teamUserAPI } from '../api/services';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

interface Desk {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  manager_name?: string;
  created_at: string;
}

interface Team {
  id: string;
  desk_id: string;
  name: string;
  manager_id?: string;
  manager_name?: string;
  created_at: string;
}

export default function Desks() {
  const navigate = useNavigate();
  const [desks, setDesks] = useState<Desk[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDesk, setSelectedDesk] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'desk' | 'team'>('desk');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserForTeam, setSelectedUserForTeam] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager_id: '',
  });

  useEffect(() => {
    const init = async () => {
      await fetchDesks();
      await fetchUsers();
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedDesk) {
      fetchTeams(selectedDesk);
    } else {
      setTeams([]);
    }
  }, [selectedDesk]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamUsers(selectedTeam);
    } else {
      setTeamUsers([]);
    }
  }, [selectedTeam]);

  const fetchDesks = async () => {
    try {
      setLoading(true);
      const response = await deskAPI.getAll();
      console.log('Desks response:', response.data);
      console.log('First desk:', response.data?.[0]);
      setDesks(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في جلب الأقسام');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users for dropdown...');
      const response = await userAPI.getAll();
      console.log('Users fetched:', response.data);
      setUsers(response.data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  };

  const fetchTeams = async (deskId: string) => {
    try {
      const response = await teamAPI.getByDesk(deskId);
      setTeams(response.data);
      setSelectedTeam(null);
      setTeamUsers([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في جلب الفرق');
    }
  };

  const fetchTeamUsers = async (teamId: string) => {
    try {
      const response = await teamUserAPI.getByTeam(teamId);
      setTeamUsers(response.data || []);
    } catch (err: any) {
      console.error('Error fetching team users:', err);
      setTeamUsers([]);
    }
  };

  const handleOpenModal = (type: 'desk' | 'team', item?: any) => {
    setModalType(type);
    if (item) {
      setEditingId(item.id);
      setFormData({
        name: item.name,
        description: item.description || '',
        manager_id: item.manager_id || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        manager_id: '',
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

      setIsSubmitting(true);
      
      if (modalType === 'desk') {
        if (editingId) {
          await deskAPI.update(editingId, {
            name: formData.name,
            description: formData.description,
            manager_id: formData.manager_id ? parseInt(formData.manager_id) : undefined,
          });
        } else {
          await deskAPI.create({
            name: formData.name,
            description: formData.description,
            manager_id: formData.manager_id ? parseInt(formData.manager_id) : undefined,
          });
        }
        fetchDesks();
      } else {
        if (editingId) {
          await teamAPI.update(editingId, {
            name: formData.name,
            manager_id: formData.manager_id ? parseInt(formData.manager_id) : undefined,
          });
        } else {
          await teamAPI.create({
            desk_id: selectedDesk,
            name: formData.name,
            manager_id: formData.manager_id ? parseInt(formData.manager_id) : undefined,
          });
        }
        if (selectedDesk) fetchTeams(selectedDesk);
      }
      setIsModalOpen(false);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'فشل في الحفظ';
      setError(errorMsg);
      setIsSubmitting(false);
      alert(errorMsg);
    }
  };

  const handleDelete = async (id: string, type: 'desk' | 'team') => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      try {
        if (type === 'desk') {
          await deskAPI.delete(id);
          fetchDesks();
        } else {
          await teamAPI.delete(id);
          if (selectedDesk) fetchTeams(selectedDesk);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'فشل في الحذف');
      }
    }
  };

  const handleAddUserToTeam = async () => {
    if (!selectedUserForTeam || !selectedTeam) {
      alert('اختر موظفاً');
      return;
    }

    try {
      await teamUserAPI.create({
        team_id: selectedTeam,
        user_id: selectedUserForTeam,
      });
      setSelectedUserForTeam('');
      await fetchTeamUsers(selectedTeam);
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل في إضافة الموظف');
    }
  };

  const handleRemoveUserFromTeam = async (userId: string) => {
    if (confirm('هل أنت متأكد من حذف الموظف من الفريق؟')) {
      try {
        await teamUserAPI.delete(selectedTeam!, userId);
        await fetchTeamUsers(selectedTeam!);
      } catch (err: any) {
        alert(err.response?.data?.message || 'فشل في حذف الموظف');
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
            <h1 className="text-3xl font-bold">إدارة الأقسام والفرق</h1>
            <p className="text-blue-200 mt-1">تنظيم الأقسام والفرق والهيكل التنظيمي</p>
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
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 text-right">{error}</div>}

        <div className="space-y-6">
          {/* جدول الأقسام */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-blue-900 text-white p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">الأقسام</h2>
                <button
                  onClick={() => {
                    setSelectedDesk(null);
                    handleOpenModal('desk');
                  }}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                >
                  + إضافة قسم جديد
                </button>
              </div>
            </div>

            {desks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">لا توجد أقسام</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="p-4 text-right text-gray-700 font-semibold">اسم القسم</th>
                      <th className="p-4 text-right text-gray-700 font-semibold">الوصف</th>
                      <th className="p-4 text-right text-gray-700 font-semibold">المدير</th>
                      <th className="p-4 text-right text-gray-700 font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {desks.map((desk, idx) => (
                      <tr
                        key={desk.id}
                        className={`border-b cursor-pointer transition ${
                          selectedDesk === desk.id
                            ? 'bg-blue-50'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedDesk(desk.id)}
                      >
                        <td className="p-4 text-right font-semibold text-gray-800">{desk.name}</td>
                        <td className="p-4 text-right text-gray-600 text-sm">{desk.description || '-'}</td>
                        <td className="p-4 text-right text-blue-600 text-sm">
                          {desk.manager_id
                            ? users.find(u => String(u.id) === String(desk.manager_id))?.name || 'غير معروف'
                            : '-'}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-start">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal('desk', desk);
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(desk.id, 'desk');
                              }}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
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
            )}
          </div>

          {/* جدول الفرق */}
          {selectedDesk && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-green-700 text-white p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">الفرق في القسم</h2>
                  <button
                    onClick={() => handleOpenModal('team')}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition"
                  >
                    + إضافة فريق جديد
                  </button>
                </div>
              </div>

              {teams.filter(t => t.desk_id === selectedDesk).length === 0 ? (
                <div className="p-8 text-center text-gray-500">لا توجد فرق في هذا القسم</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="p-4 text-right text-gray-700 font-semibold">اسم الفريق</th>
                        <th className="p-4 text-right text-gray-700 font-semibold">المدير</th>
                        <th className="p-4 text-right text-gray-700 font-semibold">عدد الموظفين</th>
                        <th className="p-4 text-right text-gray-700 font-semibold">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams
                        .filter(t => t.desk_id === selectedDesk)
                        .map((team, idx) => (
                          <tr
                            key={team.id}
                            className={`border-b cursor-pointer transition ${
                              selectedTeam === team.id
                                ? 'bg-green-50'
                                : idx % 2 === 0
                                ? 'bg-white hover:bg-gray-50'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
                          >
                            <td className="p-4 text-right font-semibold text-gray-800">{team.name}</td>
                            <td className="p-4 text-right text-blue-600 text-sm">
                              {team.manager_id
                                ? users.find(u => String(u.id) === String(team.manager_id))?.name || 'غير معروف'
                                : '-'}
                            </td>
                            <td className="p-4 text-right text-gray-600 text-sm">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                                {teamUsers.filter(tu => {
                                  // Find team users for this team
                                  return teams.find(t => t.id === team.id);
                                }).length}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2 justify-start">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenModal('team', team);
                                  }}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                                >
                                  تعديل
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(team.id, 'team');
                                  }}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
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
              )}
            </div>
          )}

          {/* جدول الموظفين في الفريق */}
          {selectedTeam && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-purple-700 text-white p-6 flex justify-between items-center">
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold text-right flex-1">الموظفين في الفريق</h2>
              </div>

              {/* إضافة موظف */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-3 items-end justify-between">
                  <button
                    onClick={handleAddUserToTeam}
                    disabled={!selectedUserForTeam}
                    className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    إضافة موظف
                  </button>
                  <select
                    value={selectedUserForTeam}
                    onChange={(e) => setSelectedUserForTeam(e.target.value)}
                    className="flex-1 border-2 border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600 text-right"
                  >
                    <option value="">-- اختر موظفاً --</option>
                    {users
                      .filter(u => !teamUsers.find(tu => String(tu.id) === String(u.id)))
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* جدول الموظفين */}
              {teamUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">لا يوجد موظفين في هذا الفريق</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="p-4 text-right text-gray-700 font-semibold">اسم الموظف</th>
                        <th className="p-4 text-right text-gray-700 font-semibold">البريد الإلكتروني</th>
                        <th className="p-4 text-right text-gray-700 font-semibold">الدور</th>
                        <th className="p-4 text-right text-gray-700 font-semibold">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamUsers.map((user, idx) => (
                        <tr
                          key={user.id}
                          className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                        >
                          <td className="p-4 text-right font-semibold text-gray-800">{user.name}</td>
                          <td className="p-4 text-right text-gray-600 text-sm">{user.email}</td>
                          <td className="p-4 text-right text-purple-600 text-sm">
                            {user.role_id ? 'موظف' : '-'}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRemoveUserFromTeam(user.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
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
              )}
            </div>
          )}
        </div>

        <Modal
          isOpen={isModalOpen}
          title={
            modalType === 'desk'
              ? editingId ? 'تعديل القسم' : 'إضافة قسم جديد'
              : editingId ? 'تعديل الفريق' : 'إضافة فريق جديد'
          }
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          onSubmit={handleSubmit}
          submitText={isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
        >
          <div className="space-y-4 max-h-96 overflow-y-auto rtl" dir="rtl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الاسم *</label>
              <input
                type="text"
                placeholder="أدخل الاسم"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الوصف</label>
              <textarea
                placeholder="أدخل الوصف"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-right">المدير</label>
              <select
                value={formData.manager_id}
                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                disabled={isSubmitting}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
              >
                <option value="">-- اختر مديراً --</option>
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
              {(!users || users.length === 0) && (
                <div className="mt-2 text-sm text-red-600">لم يتم تحميل الموظفين</div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
