/**
 * News Admin Dashboard — لوحة إدارة الأخبار
 * متاحة فقط للمدير + رغد (permission: news.dashboard)
 * تعرض إحصائيات شاملة عن الموظفين وأدائهم
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Users, Newspaper, Sparkles, TrendingUp,
  CheckCircle2, XCircle, Clock, Activity, RefreshCw,
  ChevronDown, ChevronUp, User, Shield, Save, Search
} from 'lucide-react';
import { api } from '../../services/api';
import { StatCard } from '../shared/StatCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface OverviewStats {
  period: string;
  published: { total: number; recent: number; uniqueApprovers: number };
  queue: Record<string, number>;
  aiUsage: { total: number; recent: number; uniqueUsers: number; successful: number; successRate: number };
  aiByFeature: { feature: string; usage: number; successful: number; successRate: number }[];
  topUsers: { id: number; name: string; email: string; approvedCount: number; aiUsageCount: number; totalActivity: number }[];
}

interface UserStats {
  userId: number;
  period: string;
  approvals: { total: number; recent: number };
  rejections: { total: number; recent: number };
  contentUpdates: { total: number; recent: number };
  aiUsage: { feature: string; totalUsage: number; successfulUsage: number; recentUsage: number; successRate: number }[];
  totalAiUsage: number;
  recentAiUsage: number;
}

export function NewsAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'stats' | 'permissions'>('stats');
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  // Permissions management state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [permLoading, setPermLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editedPerms, setEditedPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getNewsAdminOverview(days);
      setOverview(res.data || null);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const loadUserStats = useCallback(async (userId: number) => {
    setUserStatsLoading(true);
    setSelectedUser(userId);
    try {
      const res = await api.getNewsAdminUserStats(userId, days);
      setUserStats(res.data || null);
    } catch (err) {
      console.error('Failed to load user stats:', err);
      setUserStats(null);
    } finally {
      setUserStatsLoading(false);
    }
  }, [days]);

  // Load permissions management data
  const loadPermissionsData = useCallback(async () => {
    setPermLoading(true);
    try {
      const [usersRes, permsRes] = await Promise.all([
        api.getAllUsers(),
        api.getAllPermissions(),
      ]);
      setAllUsers(usersRes.data || []);
      setAllPermissions(permsRes.data || []);
    } catch (err) {
      console.error('Failed to load permissions data:', err);
    } finally {
      setPermLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'permissions' && allUsers.length === 0) {
      loadPermissionsData();
    }
  }, [activeTab, loadPermissionsData, allUsers.length]);

  const startEditingUser = (user: any) => {
    setEditingUser(user);
    setEditedPerms(user.permissions || []);
    setSaveMsg('');
  };

  const togglePermission = (permName: string) => {
    setEditedPerms(prev =>
      prev.includes(permName)
        ? prev.filter(p => p !== permName)
        : [...prev, permName]
    );
  };

  const saveUserPermissions = async () => {
    if (!editingUser) return;
    setSaving(true);
    setSaveMsg('');
    try {
      // We save only the EXTRA permissions (not from role)
      // The backend replaces user_permissions completely
      // So we need to figure out which are role-based and which are manual
      // For simplicity: save all currently checked permissions as user_permissions overrides
      // The backend query unions them anyway
      const res = await api.updateUserPermissions(editingUser.id, editedPerms);
      setSaveMsg('✅ تم الحفظ بنجاح');
      // Update local state
      setAllUsers(prev => prev.map(u =>
        u.id === editingUser.id ? { ...u, permissions: res.data?.permissions || editedPerms } : u
      ));
      setEditingUser((prev: any) => prev ? { ...prev, permissions: res.data?.permissions || editedPerms } : null);
    } catch (err: any) {
      setSaveMsg(`❌ ${err.message || 'فشل الحفظ'}`);
    } finally {
      setSaving(false);
    }
  };

  const featureLabels: Record<string, string> = {
    chat: 'المحادثة',
    tts: 'نص → صوت',
    stt: 'صوت → نص',
    ideas: 'توليد أفكار',
    text_tools: 'أدوات النصوص',
    audio_extraction: 'استخراج صوت',
    video_to_text: 'فيديو → نص',
    smart_transcription: 'التفريغ الذكي',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-16 text-[#64748b]">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>لا توجد بيانات متاحة حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1e293b]">لوحة إدارة الأخبار</h2>
          <p className="text-sm text-[#64748b] mt-1">إحصائيات وإدارة صلاحيات الموظفين</p>
        </div>
        <div className="flex items-center gap-2 bg-[#f1f5f9] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'stats' ? 'bg-white text-[#1e293b] shadow-sm' : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <BarChart3 size={14} className="inline-block ml-1" />
            الإحصائيات
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'permissions' ? 'bg-white text-[#1e293b] shadow-sm' : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <Shield size={14} className="inline-block ml-1" />
            الصلاحيات
          </button>
        </div>
      </div>

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          {permLoading ? (
            <div className="flex items-center justify-center h-40"><LoadingSpinner /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Users List */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 lg:col-span-1">
                <div className="mb-3">
                  <div className="relative">
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      type="text"
                      placeholder="ابحث عن موظف..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pr-9 pl-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9F4A]/30"
                    />
                  </div>
                </div>
                <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {allUsers
                    .filter(u => u.name.includes(searchQuery) || u.email.includes(searchQuery))
                    .map(user => (
                      <button
                        key={user.id}
                        onClick={() => startEditingUser(user)}
                        className={`w-full text-right p-3 rounded-xl transition-all ${
                          editingUser?.id === user.id
                            ? 'bg-[#FF9F4A]/10 border border-[#FF9F4A]/30'
                            : 'hover:bg-[#f8fafc]'
                        }`}
                      >
                        <p className="text-sm font-medium text-[#1e293b]">{user.name}</p>
                        <p className="text-[10px] text-[#94a3b8]">{user.role_name || 'بدون دور'}</p>
                      </button>
                    ))}
                </div>
              </div>

              {/* Permission Editor */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 lg:col-span-2">
                {editingUser ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-[#1e293b]">{editingUser.name}</h3>
                        <p className="text-xs text-[#64748b]">{editingUser.email} — {editingUser.role_name}</p>
                      </div>
                      <button
                        onClick={saveUserPermissions}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF9F4A] text-white rounded-xl text-sm font-medium hover:bg-[#FF8C2E] transition-colors disabled:opacity-50"
                      >
                        <Save size={14} />
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                      </button>
                    </div>
                    {saveMsg && (
                      <p className={`text-sm mb-3 ${saveMsg.startsWith('✅') ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {saveMsg}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[450px] overflow-y-auto custom-scrollbar">
                      {allPermissions.map((perm: any) => {
                        const isChecked = editedPerms.includes(perm.name);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                              isChecked ? 'bg-[#FF9F4A]/5 border border-[#FF9F4A]/20' : 'hover:bg-[#f8fafc] border border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(perm.name)}
                              className="w-4 h-4 rounded border-[#d1d5db] text-[#FF9F4A] focus:ring-[#FF9F4A]/30"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1e293b] truncate">{perm.name}</p>
                              {perm.description && (
                                <p className="text-[10px] text-[#94a3b8] truncate">{perm.description}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-[#94a3b8]">
                    <div className="text-center">
                      <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">اختر موظف لتعديل صلاحياته</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Stats Filter */}
          <div className="flex items-center gap-3 justify-end">
            <select
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9F4A]/30"
            >
              <option value={7}>آخر 7 أيام</option>
              <option value={14}>آخر 14 يوم</option>
              <option value={30}>آخر 30 يوم</option>
              <option value={90}>آخر 90 يوم</option>
            </select>
            <button
              onClick={loadOverview}
              className="p-2 bg-white border border-[#e2e8f0] rounded-xl hover:bg-[#f8fafc] transition-colors"
              title="تحديث"
            >
              <RefreshCw size={16} className="text-[#64748b]" />
            </button>
          </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="الأخبار المنشورة"
          value={overview.published.recent}
          icon={Newspaper}
          variant="success"
          subtitle={`الإجمالي: ${overview.published.total}`}
        />
        <StatCard
          label="استخدام AI"
          value={overview.aiUsage.recent}
          icon={Sparkles}
          variant="info"
          subtitle={`${overview.aiUsage.uniqueUsers} مستخدم نشط`}
        />
        <StatCard
          label="في الانتظار"
          value={overview.queue?.pending || 0}
          icon={Clock}
          variant="warning"
          subtitle={`مرفوض: ${overview.queue?.rejected || 0}`}
        />
        <StatCard
          label="نسبة نجاح AI"
          value={`${overview.aiUsage.successRate}%`}
          icon={CheckCircle2}
          variant="default"
          subtitle={`${overview.aiUsage.successful} ناجح`}
        />
      </div>

      {/* Two columns: AI by Feature + Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Usage by Feature */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="font-bold text-[#1e293b] mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-[#FF9F4A]" />
            استخدام AI حسب الأداة
          </h3>
          <div className="space-y-3">
            {overview.aiByFeature.map((item) => (
              <div key={item.feature} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm text-[#475569] truncate">
                    {featureLabels[item.feature] || item.feature}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF9F4A] to-[#FF8C2E] rounded-full"
                      style={{ width: `${Math.min((item.usage / (overview.aiByFeature[0]?.usage || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#1e293b] w-10 text-left">{item.usage}</span>
                </div>
              </div>
            ))}
            {overview.aiByFeature.length === 0 && (
              <p className="text-sm text-[#94a3b8] text-center py-4">لا يوجد استخدام مسجل</p>
            )}
          </div>
        </div>

        {/* Top Active Users */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="font-bold text-[#1e293b] mb-4 flex items-center gap-2">
            <Users size={18} className="text-[#FF9F4A]" />
            أكثر الموظفين نشاطاً
          </h3>
          <div className="space-y-2">
            {overview.topUsers.map((user, idx) => (
              <div key={user.id}>
                <button
                  onClick={() => {
                    if (expandedUser === user.id) {
                      setExpandedUser(null);
                      setUserStats(null);
                    } else {
                      setExpandedUser(user.id);
                      loadUserStats(user.id);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#f8fafc] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-[#FF9F4A]/10 text-[#FF9F4A]' :
                      idx === 1 ? 'bg-sky-100 text-sky-600' :
                      'bg-[#f1f5f9] text-[#64748b]'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#1e293b]">{user.name}</p>
                      <p className="text-[10px] text-[#94a3b8]">
                        {user.approvedCount} نشر · {user.aiUsageCount} AI
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#FF9F4A] bg-[#FF9F4A]/10 px-2 py-1 rounded-lg">
                      {user.totalActivity}
                    </span>
                    {expandedUser === user.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {/* Expanded User Details */}
                {expandedUser === user.id && (
                  <div className="mx-3 mb-2 p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                    {userStatsLoading ? (
                      <div className="flex justify-center py-3"><LoadingSpinner /></div>
                    ) : userStats ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white p-2 rounded-lg">
                            <p className="text-lg font-bold text-emerald-600">{userStats.approvals.recent}</p>
                            <p className="text-[10px] text-[#64748b]">نشر حديث</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg">
                            <p className="text-lg font-bold text-sky-600">{userStats.recentAiUsage}</p>
                            <p className="text-[10px] text-[#64748b]">استخدام AI</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg">
                            <p className="text-lg font-bold text-rose-500">{userStats.rejections.recent}</p>
                            <p className="text-[10px] text-[#64748b]">مرفوض</p>
                          </div>
                        </div>
                        {userStats.aiUsage.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-[#94a3b8] uppercase mb-1">أدوات AI المستخدمة</p>
                            <div className="flex flex-wrap gap-1">
                              {userStats.aiUsage.map(ai => (
                                <span key={ai.feature} className="text-[10px] bg-white border border-[#e2e8f0] px-2 py-0.5 rounded-md">
                                  {featureLabels[ai.feature] || ai.feature} ({ai.recentUsage})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-[#94a3b8] text-center">لا تتوفر تفاصيل</p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {overview.topUsers.length === 0 && (
              <p className="text-sm text-[#94a3b8] text-center py-4">لا يوجد نشاط مسجل</p>
            )}
          </div>
        </div>
      </div>

      {/* Queue Breakdown */}
      {Object.keys(overview.queue).length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="font-bold text-[#1e293b] mb-4 flex items-center gap-2">
            <Activity size={18} className="text-[#FF9F4A]" />
            حالة قائمة التحرير
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(overview.queue).map(([status, count]) => (
              <div key={status} className="text-center p-3 bg-[#f8fafc] rounded-xl">
                <p className="text-2xl font-bold text-[#1e293b]">{count}</p>
                <p className="text-xs text-[#64748b] mt-1">
                  {status === 'pending' ? 'بانتظار المراجعة' :
                   status === 'approved' ? 'تمت الموافقة' :
                   status === 'rejected' ? 'مرفوض' :
                   status === 'in_review' ? 'قيد المراجعة' :
                   status}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
