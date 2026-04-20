import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export default function ManualInputAudio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [, setAudioChunks] = useState<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [mediaUnits, setMediaUnits] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [mediaUnitId, setMediaUnitId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, mediaUnitsRes] = await Promise.all([
        apiClient.get('/manual-input/users'),
        apiClient.get('/manual-input/media-units')
      ]);
      setUsers(usersRes.data.data);
      setMediaUnits(mediaUnitsRes.data.data);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  // معالجة اختيار الملف
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg'];
      if (!allowedTypes.includes(file.type)) {
        setError('نوع الملف غير مدعوم');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError('حجم الملف كبير جداً. الحد الأقصى: 50 MB');
        return;
      }

      setSelectedFile(file);
      setAudioUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  // بدء التسجيل
  const startRecording = async () => {
    try {
      // التحقق من دعم المتصفح
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('المتصفح لا يدعم تسجيل الصوت. استخدم متصفح حديث مثل Chrome أو Firefox');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        setSelectedFile(audioFile);
        setAudioUrl(URL.createObjectURL(audioBlob));
        setAudioChunks([]);
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      
      // رسائل خطأ مفصلة حسب نوع المشكلة
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('تم رفض الوصول للميكروفون. الرجاء السماح بالوصول للميكروفون من إعدادات المتصفح');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('لم يتم العثور على ميكروفون. تأكد من توصيل الميكروفون بالجهاز');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('الميكروفون مستخدم من تطبيق آخر. أغلق التطبيقات الأخرى وحاول مرة أخرى');
      } else if (err.name === 'OverconstrainedError') {
        setError('إعدادات الميكروفون غير مدعومة');
      } else if (err.name === 'TypeError') {
        setError('خطأ في إعدادات الميكروفون');
      } else {
        setError('فشل الوصول إلى الميكروفون. تأكد من السماح بالوصول للميكروفون في إعدادات المتصفح');
      }
    }
  };

  // إيقاف التسجيل
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // رفع الملف
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('الرجاء اختيار ملف صوتي أو تسجيل صوت');
      return;
    }

    if (!title.trim()) {
      setError('الرجاء إدخال عنوان للملف الصوتي');
      return;
    }

    if (!userId) {
      setError('الرجاء اختيار اسم المراسل');
      return;
    }

    if (!mediaUnitId) {
      setError('الرجاء اختيار الوحدة الإعلامية');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('uploaded_by', userId);
      formData.append('media_unit_id', mediaUnitId);
      formData.append('title', title.trim());

      await apiClient.post('/manual-input/upload-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`تم رفع الملف بنجاح`);
      setSelectedFile(null);
      setAudioUrl(null);
      setTitle('');
      setUserId('');
      setMediaUnitId('');
      
      const fileInput = document.getElementById('audio-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في رفع الملف الصوتي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
          <h1 className="text-3xl font-bold">🎤 إدخال ملف صوتي</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition font-semibold"
          >
            العودة
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(error || success) && (
        <>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-500 text-red-700 p-6 rounded-lg shadow-2xl">
                <div className="text-center">
                  <span className="text-3xl">⚠️</span>
                  <p className="text-lg font-bold mt-2">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded transition"
                >
                  حسناً
                </button>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-2 border-green-500 text-green-700 p-6 rounded-lg shadow-2xl">
                <div className="text-center">
                  <span className="text-3xl">✅</span>
                  <p className="text-lg font-bold mt-2">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess(null)}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition"
                >
                  حسناً
                </button>
              </div>
            )}
          </div>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setError(null);
              setSuccess(null);
            }}
          />
        </>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* القسم الأيسر: التسجيل والرفع */}
          <div className="space-y-6">
            {/* تسجيل صوتي */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">تسجيل صوتي مباشر</h2>
              <div className="text-center">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50"
                  >
                    🔴 ابدأ التسجيل
                  </button>
                ) : (
                  <div>
                    <div className="mb-4">
                      <div className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-full animate-pulse">
                        <span className="text-xl font-bold">جاري التسجيل...</span>
                      </div>
                    </div>
                    <button
                      onClick={stopRecording}
                      className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-bold transition"
                    >
                      ⏹ إيقاف
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* رفع ملف */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">رفع ملف صوتي</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition">
                <input
                  type="file"
                  id="audio-file"
                  accept="audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="audio-file" className="cursor-pointer block">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-gray-700">اضغط لاختيار ملف</p>
                  <p className="text-sm text-gray-500 mt-1">MP3, WAV, M4A (حتى 50 MB)</p>
                </label>
              </div>
            </div>

            {/* ملاحظات */}
            <div className="bg-blue-50 border-r-4 border-blue-700 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>ملاحظة:</strong> الحد الأقصى 50 MB
              </p>
            </div>
          </div>

          {/* القسم الأيمن: المعاينة والعنوان */}
          <div className="space-y-6">
            {/* مشغل الصوت */}
            {audioUrl && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">استماع للتسجيل</h2>
                <audio 
                  controls 
                  src={audioUrl} 
                  className="w-full"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    الحجم: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            )}

            {/* حقل العنوان */}
            {selectedFile && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">معلومات الملف</h2>
                <div className="space-y-4">
                  {/* اسم المراسل */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">
                      اسم المراسل <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">اختر اسمك</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* الوحدة الإعلامية */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">
                      الوحدة الإعلامية <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mediaUnitId}
                      onChange={(e) => setMediaUnitId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">اختر الوحدة</option>
                      {mediaUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-2">
                      عنوان التسجيل <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="مثال: تقرير من الميدان"
                      maxLength={100}
                    />
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={!title.trim() || !userId || !mediaUnitId || loading}
                    className={`w-full px-6 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition ${
                      (!title.trim() || !userId || !mediaUnitId || loading) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? '🔄 جاري الرفع...' : '⬆️ رفع الملف'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
