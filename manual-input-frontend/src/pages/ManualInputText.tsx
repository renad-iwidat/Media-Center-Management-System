import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Category {
  id: number;
  name: string;
  slug: string;
  flow: 'automated' | 'editorial';
  is_active: boolean;
}

interface Source {
  id: number;
  name: string;
  source_type_id: number;
  is_active: boolean;
}

export default function ManualInputText() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [source, setSource] = useState<Source | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [mediaUnits, setMediaUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    image_url: '',
    created_by: '',
    media_unit_id: ''
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [categoriesRes, sourceRes, usersRes, mediaUnitsRes] = await Promise.all([
        apiClient.get('/manual-input/categories'),
        apiClient.get('/manual-input/source/text'),
        apiClient.get('/manual-input/users'),
        apiClient.get('/manual-input/media-units')
      ]);

      setCategories(categoriesRes.data.data);
      setSource(sourceRes.data.data);
      setUsers(usersRes.data.data);
      setMediaUnits(mediaUnitsRes.data.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل البيانات');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('نوع الصورة غير مدعوم. الأنواع المسموحة: JPG, PNG, GIF, WebP');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('حجم الصورة كبير جداً. الحد الأقصى: 10 MB');
        return;
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const uploadImage = async (): Promise<{ url: string; fileId: number } | null> => {
    if (!selectedImage) return null;

    setUploadingImage(true);
    try {
      const imageFormData = new FormData();
      imageFormData.append('file', selectedImage);
      imageFormData.append('uploaded_by', formData.created_by);
      imageFormData.append('media_unit_id', formData.media_unit_id);
      imageFormData.append('title', formData.title);

      const response = await apiClient.post('/manual-input/upload-image', imageFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadingImage(false);
      return {
        url: response.data.data.file_url,
        fileId: response.data.data.id
      };
    } catch (err: any) {
      setUploadingImage(false);
      throw new Error(err.response?.data?.message || 'فشل في رفع الصورة');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!source) {
      setError('مصدر الإدخال النصي غير متوفر');
      return;
    }

    try {
      setLoading(true);

      // رفع الصورة أولاً إذا كانت موجودة
      let imageUrl = formData.image_url;
      let uploadedFileId: number | undefined = undefined;
      
      if (selectedImage) {
        const uploadResult = await uploadImage();
        if (uploadResult) {
          imageUrl = uploadResult.url;
          uploadedFileId = uploadResult.fileId;
        }
      }

      const payload = {
        source_id: source.id,
        source_type_id: source.source_type_id,
        category_id: parseInt(formData.category_id),
        url: null,
        title: formData.title,
        content: formData.content,
        image_url: imageUrl,
        tags: [],
        fetch_status: 'fetched' as const,
        created_by: parseInt(formData.created_by),
        media_unit_id: parseInt(formData.media_unit_id),
        uploaded_file_id: uploadedFileId
      };
      
      await apiClient.post('/manual-input/submit', payload);
      
      setSuccess('تم إضافة الخبر بنجاح! ✅');
      
      setFormData({
        title: '',
        content: '',
        category_id: '',
        image_url: '',
        created_by: '',
        media_unit_id: ''
      });

      setSelectedImage(null);
      setImagePreview(null);

      setLoading(false);
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في إضافة الخبر');
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(', '));
      }
      setLoading(false);
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
          <h1 className="text-3xl font-bold">📝 إدخال خبر نصي</h1>
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

      {/* Form */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* القسم الأيسر: العنوان والتصنيف */}
          <div className="space-y-6">
            {/* اسم المراسل */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="created_by">
                اسم المراسل <span className="text-red-500">*</span>
              </label>
              <select
                id="created_by"
                name="created_by"
                value={formData.created_by}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
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
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="media_unit_id">
                الوحدة الإعلامية <span className="text-red-500">*</span>
              </label>
              <select
                id="media_unit_id"
                name="media_unit_id"
                value={formData.media_unit_id}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">اختر الوحدة</option>
                {mediaUnits.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                عنوان الخبر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل عنوان الخبر"
                required
                minLength={20}
              />
              <p className={`text-sm mt-1 ${formData.title.length < 20 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}`}>
                عدد الأحرف: {formData.title.length} / 20 حرف كحد أدنى
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category_id">
                التصنيف <span className="text-red-500">*</span>
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">اختر التصنيف</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                صورة الخبر (اختياري)
              </label>
              
              {!selectedImage && !imagePreview && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                  <input
                    type="file"
                    id="image-file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <label htmlFor="image-file" className="cursor-pointer block">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p className="text-gray-700">اضغط لاختيار صورة</p>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG, GIF, WebP (حتى 10 MB)</p>
                  </label>
                </div>
              )}

              {imagePreview && (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="معاينة الصورة" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
                  >
                    ❌ حذف
                  </button>
                  {selectedImage && (
                    <p className="text-sm text-gray-600 mt-2">
                      الحجم: {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* القسم الأيمن: المحتوى */}
          <div>
            {/* Content */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
                محتوى الخبر <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="أدخل محتوى الخبر"
                rows={16}
                required
                minLength={100}
              />
              <p className={`text-sm mt-1 ${formData.content.length < 100 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}`}>
                عدد الأحرف: {formData.content.length} / 100 حرف كحد أدنى
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className={`px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition ${
              (loading || uploadingImage) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploadingImage ? '🔄 جاري رفع الصورة...' : loading ? '🔄 جاري الإرسال...' : 'إرسال الخبر'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
