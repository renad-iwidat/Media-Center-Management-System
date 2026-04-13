import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { programAPI, episodeAPI, mediaUnitAPI, guestAPI, episodeGuestAPI } from '../api/services';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

interface Program {
  id: string;
  title: string;
  description?: string;
  media_unit_id?: string;
  media_unit_name?: string;
  air_time?: string;
  created_at: string;
}

interface Episode {
  id: string;
  program_id: string;
  title: string;
  episode_number?: number;
  air_date?: string;
  topic?: string;
  created_at: string;
}

interface MediaUnit {
  id: string;
  name: string;
  description?: string;
}

interface Guest {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  phone?: string;
}

interface EpisodeGuest {
  id: string;
  episode_id: string;
  guest_id: string;
  name?: string;
  title?: string;
  bio?: string;
  phone?: string;
}

const convertTo12Hour = (time: string) => {
  if (!time) return '-';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'مسائي' : 'صباحي';
  const displayHour = hour % 12 || 12;
  return `${displayHour.toString().padStart(2, '0')}:${minutes} ${period}`;
};

export default function Programs() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [mediaUnits, setMediaUnits] = useState<MediaUnit[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [episodeGuests, setEpisodeGuests] = useState<EpisodeGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'program' | 'episode' | 'guest'>('program');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_unit_id: '',
    air_time: '',
    episode_number: '',
    air_date: '',
    guest_id: '',
  });

  useEffect(() => {
    const init = async () => {
      console.log('🚀 تحميل البيانات الأولية...');
      await fetchMediaUnits();
      await fetchGuests();
      await fetchPrograms();
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchEpisodes(selectedProgram);
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedEpisode) {
      fetchEpisodeGuests(selectedEpisode);
    } else {
      setEpisodeGuests([]);
    }
  }, [selectedEpisode]);

  const fetchMediaUnits = async () => {
    try {
      console.log('جاري تحميل الوحدات الإعلامية...');
      const response = await mediaUnitAPI.getAll();
      console.log('الوحدات الإعلامية المحملة:', response.data);
      setMediaUnits(response.data || []);
    } catch (err: any) {
      console.error('خطأ في تحميل الوحدات الإعلامية:', err);
      setMediaUnits([]);
    }
  };

  const fetchGuests = async () => {
    try {
      const response = await guestAPI.getAll();
      setGuests(response.data || []);
    } catch (err: any) {
      console.error('خطأ في تحميل الضيوف:', err);
      setGuests([]);
    }
  };

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

  const fetchEpisodes = async (programId: string) => {
    try {
      const response = await episodeAPI.getByProgram(programId);
      setEpisodes(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في جلب الحلقات');
    }
  };

  const fetchEpisodeGuests = async (episodeId: string) => {
    try {
      const response = await episodeGuestAPI.getByEpisode(episodeId);
      setEpisodeGuests(response.data || []);
    } catch (err: any) {
      console.error('خطأ في تحميل ضيوف الحلقة:', err);
      setEpisodeGuests([]);
    }
  };

  const handleOpenModal = (type: 'program' | 'episode' | 'guest', item?: any) => {
    setModalType(type);
    if (item) {
      setEditingId(item.id);
      if (type === 'program') {
        setFormData({
          title: item.title,
          description: item.description || '',
          media_unit_id: item.media_unit_id || '',
          air_time: item.air_time || '',
          episode_number: '',
          air_date: '',
          guest_id: '',
        });
      } else if (type === 'episode') {
        setFormData({
          title: item.title,
          description: '',
          media_unit_id: '',
          air_time: '',
          episode_number: item.episode_number || '',
          air_date: item.air_date || '',
          guest_id: '',
        });
      }
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        media_unit_id: '',
        air_time: '',
        episode_number: '',
        air_date: '',
        guest_id: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'guest') {
        if (!formData.guest_id) {
          alert('اختر ضيفاً');
          return;
        }
      } else if (!formData.title) {
        alert('العنوان مطلوب');
        return;
      }

      setIsSubmitting(true);

      if (modalType === 'program') {
        if (editingId) {
          await programAPI.update(editingId, {
            title: formData.title,
            description: formData.description,
            media_unit_id: formData.media_unit_id ? parseInt(formData.media_unit_id) : undefined,
            air_time: formData.air_time,
          });
        } else {
          await programAPI.create({
            title: formData.title,
            description: formData.description,
            media_unit_id: formData.media_unit_id ? parseInt(formData.media_unit_id) : undefined,
            air_time: formData.air_time,
          });
        }
        fetchPrograms();
      } else if (modalType === 'episode') {
        if (editingId) {
          await episodeAPI.update(editingId, {
            title: formData.title,
            episode_number: formData.episode_number ? parseInt(formData.episode_number) : undefined,
            air_date: formData.air_date,
          });
        } else {
          await episodeAPI.create({
            program_id: selectedProgram,
            title: formData.title,
            episode_number: formData.episode_number ? parseInt(formData.episode_number) : undefined,
            air_date: formData.air_date,
          });
        }
        if (selectedProgram) fetchEpisodes(selectedProgram);
      } else if (modalType === 'guest') {
        await episodeGuestAPI.create({
          episode_id: selectedEpisode,
          guest_id: formData.guest_id,
        });
        if (selectedEpisode) fetchEpisodeGuests(selectedEpisode);
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

  const handleDelete = async (id: string, type: 'program' | 'episode' | 'guest') => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      try {
        if (type === 'program') {
          await programAPI.delete(id);
          fetchPrograms();
        } else if (type === 'episode') {
          await episodeAPI.delete(id);
          if (selectedProgram) fetchEpisodes(selectedProgram);
        } else if (type === 'guest') {
          // id is actually episodeId:guestId
          const [episodeId, guestId] = id.split(':');
          await episodeGuestAPI.delete(episodeId, guestId);
          if (selectedEpisode) fetchEpisodeGuests(selectedEpisode);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'فشل في الحذف');
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
            <h1 className="text-3xl font-bold">إدارة البرامج والحلقات</h1>
            <p className="text-blue-200 mt-1">إضافة وتعديل البرامج والحلقات وجداول البث</p>
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
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 text-right">{error}</div>}

        <div className="space-y-6">
          {/* جدول البرامج */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-blue-900 text-white p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">البرامج</h2>
                <button
                  onClick={() => {
                    setSelectedProgram(null);
                    handleOpenModal('program');
                  }}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                >
                  + إضافة برنامج جديد
                </button>
              </div>
            </div>

            {programs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">لا توجد برامج</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="p-4 text-right text-gray-700 font-semibold">اسم البرنامج</th>
                      <th className="p-4 text-right text-gray-700 font-semibold">الوصف</th>
                      <th className="p-4 text-right text-gray-700 font-semibold">الوحدة الإعلامية</th>
                      <th className="p-4 text-right text-gray-700 font-semibold">وقت البث</th>
                      <th className="p-4 text-right text-gray-700 font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programs.map((program, idx) => (
                      <tr
                        key={program.id}
                        className={`border-b cursor-pointer transition ${
                          selectedProgram === program.id
                            ? 'bg-blue-50'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedProgram(program.id)}
                      >
                        <td className="p-4 text-right font-semibold text-gray-800">{program.title}</td>
                        <td className="p-4 text-right text-gray-600 text-sm">{program.description || '-'}</td>
                        <td className="p-4 text-right text-blue-600 text-sm">{program.media_unit_name || '-'}</td>
                        <td className="p-4 text-right text-gray-600 text-sm">{convertTo12Hour(program.air_time || '')}</td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-start">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal('program', program);
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(program.id, 'program');
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

          {/* جدول الحلقات وضيوف الحلقة */}
          {selectedProgram && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* جدول الحلقات */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-green-700 text-white p-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">حلقات البرنامج</h2>
                    <button
                      onClick={() => handleOpenModal('episode')}
                      className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition"
                    >
                      + إضافة حلقة جديدة
                    </button>
                  </div>
                </div>

                {episodes.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">لا توجد حلقات في هذا البرنامج</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b-2 border-gray-300">
                        <tr>
                          <th className="p-4 text-right text-gray-700 font-semibold">رقم الحلقة</th>
                          <th className="p-4 text-right text-gray-700 font-semibold">عنوان الحلقة</th>
                          <th className="p-4 text-right text-gray-700 font-semibold">تاريخ البث</th>
                          <th className="p-4 text-right text-gray-700 font-semibold">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {episodes.map((episode, idx) => (
                          <tr
                            key={episode.id}
                            className={`border-b cursor-pointer transition ${
                              selectedEpisode === episode.id
                                ? 'bg-green-50'
                                : idx % 2 === 0
                                ? 'bg-white hover:bg-gray-50'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedEpisode(episode.id)}
                          >
                            <td className="p-4 text-right font-semibold text-gray-800">{episode.episode_number || '-'}</td>
                            <td className="p-4 text-right text-gray-600 text-sm">{episode.title}</td>
                            <td className="p-4 text-right text-gray-600 text-sm">{episode.air_date ? new Date(episode.air_date).toLocaleDateString('ar-SA') : '-'}</td>
                            <td className="p-4">
                              <div className="flex gap-2 justify-start">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenModal('episode', episode);
                                  }}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                                >
                                  تعديل
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(episode.id, 'episode');
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

              {/* جدول ضيوف الحلقة */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-purple-700 text-white p-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">ضيوف الحلقة</h2>
                    {selectedEpisode && (
                      <button
                        onClick={() => handleOpenModal('guest')}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded transition"
                      >
                        + إضافة ضيف جديد
                      </button>
                    )}
                  </div>
                </div>

              {!selectedEpisode ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-lg mb-2">اختر حلقة لعرض ضيوفها</p>
                    <p className="text-gray-400 text-sm">اضغط على الحلقة التي تريدها من الجدول على اليسار لإضافة الضيوف</p>
                  </div>
                ) : episodeGuests.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">لا توجد ضيوف في هذه الحلقة</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b-2 border-gray-300">
                        <tr>
                          <th className="p-4 text-right text-gray-700 font-semibold">اسم الضيف</th>
                          <th className="p-4 text-right text-gray-700 font-semibold">الوظيفة</th>
                          <th className="p-4 text-right text-gray-700 font-semibold">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {episodeGuests.map((eg, idx) => (
                          <tr
                            key={`${eg.episode_id}-${eg.guest_id}`}
                            className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                          >
                            <td className="p-4 text-right font-semibold text-gray-800">{eg.name}</td>
                            <td className="p-4 text-right text-gray-600 text-sm">{eg.title || '-'}</td>
                            <td className="p-4">
                              <button
                                onClick={() => handleDelete(`${eg.episode_id}:${eg.guest_id}`, 'guest')}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
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
          )}
        </div>

        <Modal
          isOpen={isModalOpen}
          title={
            modalType === 'program'
              ? editingId ? 'تعديل البرنامج' : 'إضافة برنامج جديد'
              : modalType === 'episode'
              ? editingId ? 'تعديل الحلقة' : 'إضافة حلقة جديدة'
              : 'إضافة ضيف للحلقة'
          }
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          onSubmit={handleSubmit}
          submitText={isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
        >
          <div className="space-y-4 max-h-96 overflow-y-auto rtl" dir="rtl">
            {modalType === 'guest' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الضيف *</label>
                <select
                  value={formData.guest_id}
                  onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
                >
                  <option value="">-- اختر ضيفاً --</option>
                  {guests && guests.length > 0 ? (
                    guests.map((guest) => (
                      <option key={guest.id} value={String(guest.id)}>
                        {guest.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>لا توجد ضيوف</option>
                  )}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-right">العنوان *</label>
                  <input
                    type="text"
                    placeholder="أدخل العنوان"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
                  />
                </div>
                {modalType === 'program' ? (
                  <>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الوحدة الإعلامية</label>
                      <select
                        value={formData.media_unit_id}
                        onChange={(e) => setFormData({ ...formData, media_unit_id: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
                      >
                        <option value="">-- اختر وحدة إعلامية --</option>
                        {mediaUnits && mediaUnits.length > 0 ? (
                          mediaUnits.map((unit) => (
                            <option key={unit.id} value={String(unit.id)}>
                              {unit.name}
                            </option>
                          ))
                        ) : (
                          <option disabled>لا توجد وحدات إعلامية</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-right">وقت البث</label>
                      <input
                        type="time"
                        value={formData.air_time}
                        onChange={(e) => setFormData({ ...formData, air_time: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-right">رقم الحلقة</label>
                      <input
                        type="number"
                        placeholder="أدخل رقم الحلقة"
                        value={formData.episode_number}
                        onChange={(e) => setFormData({ ...formData, episode_number: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-right">تاريخ البث</label>
                      <input
                        type="date"
                        value={formData.air_date}
                        onChange={(e) => setFormData({ ...formData, air_date: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 text-right"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
