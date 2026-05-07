import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Check,
  ChevronDown,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';

interface EditorialPolicy {
  id?: number;
  name: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EditorialPolicyManagerProps {
  selectedPolicy: string;
  onPolicySelect: (policy: string) => void;
  onPoliciesChange?: (policies: EditorialPolicy[]) => void;
}

export default function EditorialPolicyManager({
  selectedPolicy,
  onPolicySelect,
  onPoliciesChange,
}: EditorialPolicyManagerProps) {
  const [policies, setPolicies] = useState<EditorialPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<EditorialPolicy | null>(null);
  const [formData, setFormData] = useState({ name: '', content: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب السياسات عند التحميل
  useEffect(() => {
    fetchPolicies();
  }, []);

  // جلب السياسات من الـ API
  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const result = await api.getPolicies();
      const policiesList = result.data || [];
      setPolicies(policiesList);
      onPoliciesChange?.(policiesList);
    } catch (error) {
      console.error('خطأ في جلب السياسات:', error);
      setError('فشل جلب السياسات');
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة سياسة جديدة
  const handleAddPolicy = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    setIsSaving(true);
    try {
      await api.createPolicy({
        name: formData.name,
        content: formData.content,
      });

      // إعادة جلب السياسات
      await fetchPolicies();

      // اختيار السياسة الجديدة
      onPolicySelect(formData.content);

      // إعادة تعيين النموذج
      setFormData({ name: '', content: '' });
      setShowForm(false);
      setError(null);
    } catch (error: any) {
      console.error('خطأ في إضافة السياسة:', error);
      setError(error.message || 'فشل إضافة السياسة');
    } finally {
      setIsSaving(false);
    }
  };

  // تحديث سياسة موجودة
  const handleUpdatePolicy = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    if (!editingPolicy) return;

    setIsSaving(true);
    try {
      await api.updatePolicy(editingPolicy.name, {
        name: formData.name,
        content: formData.content,
      });

      // إعادة جلب السياسات
      await fetchPolicies();

      // اختيار السياسة المحدثة
      onPolicySelect(formData.content);

      // إعادة تعيين النموذج
      setFormData({ name: '', content: '' });
      setEditingPolicy(null);
      setShowForm(false);
      setError(null);
    } catch (error: any) {
      console.error('خطأ في تحديث السياسة:', error);
      setError(error.message || 'فشل تحديث السياسة');
    } finally {
      setIsSaving(false);
    }
  };

  // حذف سياسة
  const handleDeletePolicy = async (policyName: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه السياسة؟')) {
      return;
    }

    try {
      await api.deletePolicy(policyName);

      // إعادة جلب السياسات
      await fetchPolicies();

      // إذا كانت السياسة المحذوفة مختارة، امسح الاختيار
      if (selectedPolicy === policies.find(p => p.name === policyName)?.content) {
        onPolicySelect('');
      }

      setError(null);
    } catch (error: any) {
      console.error('خطأ في حذف السياسة:', error);
      setError(error.message || 'فشل حذف السياسة');
    }
  };

  // تحرير سياسة
  const handleEditPolicy = (policy: EditorialPolicy) => {
    setEditingPolicy(policy);
    setFormData({ name: policy.name, content: policy.content });
    setShowForm(true);
    setShowDropdown(false);
  };

  // اختيار سياسة من القائمة
  const handleSelectPolicy = (policy: EditorialPolicy) => {
    onPolicySelect(policy.content);
    setShowDropdown(false);
  };

  // إلغاء التحرير
  const handleCancel = () => {
    setFormData({ name: '', content: '' });
    setEditingPolicy(null);
    setShowForm(false);
    setError(null);
  };

  const selectedPolicyName = policies.find(p => p.content === selectedPolicy)?.name;

  return (
    <div className="space-y-4">
      {/* رسالة الخطأ */}
      {error && (
        <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* اختيار السياسة الموجودة */}
      <div className="relative">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          سياسات التحرير الموجودة
        </label>

        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full bg-slate-900 text-white rounded px-3 py-2 border border-slate-700 hover:border-blue-500 transition flex items-center justify-between"
        >
          <span className="text-sm">
            {selectedPolicyName || 'اختر سياسة...'}
          </span>
          <ChevronDown className={`w-4 h-4 transition ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* القائمة المنسدلة */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded shadow-lg z-10">
            {isLoading ? (
              <div className="p-3 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري التحميل...
              </div>
            ) : policies.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-sm">
                لا توجد سياسات محفوظة
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {policies.map((policy, idx) => (
                  <div
                    key={idx}
                    className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700 transition"
                  >
                    <div className="p-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleSelectPolicy(policy)}
                        className="flex-1 text-left"
                      >
                        <div className="font-medium text-white text-sm">{policy.name}</div>
                        <div className="text-xs text-slate-400 line-clamp-1">
                          {policy.content}
                        </div>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditPolicy(policy)}
                          className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-blue-400 transition"
                          title="تحرير"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePolicy(policy.name)}
                          className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-red-400 transition"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* زر إضافة سياسة جديدة */}
            <button
              onClick={() => {
                setShowForm(true);
                setShowDropdown(false);
                setEditingPolicy(null);
                setFormData({ name: '', content: '' });
              }}
              className="w-full p-3 text-blue-400 hover:bg-slate-700 transition flex items-center justify-center gap-2 border-t border-slate-700"
            >
              <Plus className="w-4 h-4" />
              إضافة سياسة جديدة
            </button>
          </div>
        )}
      </div>

      {/* نموذج إضافة/تحرير السياسة */}
      {showForm && (
        <div className="bg-slate-700 rounded-lg p-4 space-y-3 border border-slate-600">
          <h3 className="font-semibold text-white">
            {editingPolicy ? 'تحرير السياسة' : 'إضافة سياسة جديدة'}
          </h3>

          {/* اسم السياسة */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              اسم السياسة
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: سياسة الأخبار الرئيسية"
              className="w-full bg-slate-900 text-white rounded px-3 py-2 text-sm border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* محتوى السياسة */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              محتوى السياسة
            </label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              placeholder="أدخل نصوص السياسة التحريرية..."
              className="w-full bg-slate-900 text-white rounded px-3 py-2 text-sm border border-slate-600 focus:border-blue-500 focus:outline-none resize-none h-24"
            />
          </div>

          {/* الأزرار */}
          <div className="flex items-center gap-2">
            <button
              onClick={editingPolicy ? handleUpdatePolicy : handleAddPolicy}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-3 rounded text-sm flex items-center justify-center gap-2 transition"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingPolicy ? 'تحديث' : 'إضافة'}
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-3 rounded text-sm flex items-center justify-center gap-2 transition"
            >
              <X className="w-4 h-4" />
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* عرض السياسة المختارة */}
      {selectedPolicy && !showForm && (
        <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
          <h3 className="font-semibold text-white mb-2 text-sm">السياسة المختارة:</h3>
          <div className="bg-slate-900 rounded p-3 text-slate-300 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
            {selectedPolicy}
          </div>
        </div>
      )}
    </div>
  );
}
