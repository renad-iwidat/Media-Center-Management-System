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
  published: {
    total: number;
    recent: number;
    activeUnits: number;
    byUnit: { unit: string; count: number; recentCount: number; lastPublished: string }[];
    external: { total: number; success: number; failed: number; recent: number };
  };
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

          {loading ? (
            <div className="flex items-center justify-center h-40"><LoadingSpinner /></div>
          ) : !overview ? (
            <div className="text-center py-16 text-[#64748b]">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>لا توجد بيانات متاحة</p>
            </div>
          ) : (
            <>
              {/* Row 1: Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="إجمالي المنشور"
                  value={overview.published.total}
                  icon={Newspaper}
                  variant="success"
                  subtitle={`${overview.published.recent} في آخر ${days} يوم`}
                />
                <StatCard
                  label="النشر الخارجي"
                  value={overview.published.external?.success || 0}
                  icon={TrendingUp}
                  variant="info"
                  subtitle={`فشل: ${overview.published.external?.failed || 0}`}
                />
                <StatCard
                  label="استخدام AI"
                  value={overview.aiUsage.recent}
                  icon={Sparkles}
                  variant="default"
                  subtitle={`${overview.aiUsage.uniqueUsers} مستخدم نشط`}
                />
                <StatCard
                  label="قيد الانتظار"
                  value={(overview.queue?.pending || 0) + (overview.queue?.incomplete || 0)}
                  icon={Clock}
                  variant="warning"
                  subtitle={`موافق عليه: ${overview.queue?.approved || 0}`}
                />
              </div>

              {/* Row 2: Published by Unit + Queue Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Published by Media Unit */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
                  <h3 className="font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                    <Newspaper size={18} className="text-[#FF9F4A]" />
                    الأخبار المنشورة حسب الوحدة
                  </h3>
                  <div className="space-y-3">
                    {overview.published.byUnit.map((unit) => {
                      const pct = overview.published.total > 0
                        ? Math.round((unit.count / overview.published.total) * 100)
                        : 0;
                      const lastPub = unit.lastPublished
                        ? new Date(unit.lastPublished).toLocaleDateString('ar', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—';
                      return (
                        <div key={unit.unit}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#1e293b]">{unit.unit || 'غير محدد'}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-[#94a3b8]">آخر نشر: {lastPub}</span>
                              <span className="text-sm font-bold text-[#1e293b]">{unit.count}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-[#94a3b8] w-8 text-left">{pct}%</span>
                          </div>
                          {unit.recentCount > 0 && (
                            <p className="text-[10px] text-emerald-600 mt-0.5">
                              +{unit.recentCount} في آخر {days} يوم
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {overview.published.byUnit.length === 0 && (
                      <p className="text-sm text-[#94a3b8] text-center py-4">لا يوجد نشر بعد</p>
                    )}
                  </div>

                  {/* External Publishing */}
                  {overview.published.external?.total > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#f1f5f9]">
                      <p className="text-xs font-bold text-[#94a3b8] uppercase mb-2">النشر الخارجي (المواقع)</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-700">{overview.published.external.success} ناجح</span>
                        </div>
                        {overview.published.external.failed > 0 && (
                          <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-lg">
                            <XCircle size={12} className="text-rose-600" />
                            <span className="text-xs font-bold text-rose-700">{overview.published.external.failed} فشل</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Queue Status + AI Feature Breakdown */}
                <div className="space-y-4">
                  {/* Queue */}
                  <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
                    <h3 className="font-bold text-[#1e293b] mb-3 flex items-center gap-2">
                      <Activity size={18} className="text-[#FF9F4A]" />
                      حالة قائمة التحرير
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'pending',    label: 'انتظار',   color: 'text-amber-600 bg-amber-50 border-amber-200' },
                        { key: 'approved',   label: 'موافق',    color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                        { key: 'incomplete', label: 'ناقص',     color: 'text-rose-600 bg-rose-50 border-rose-200' },
                      ].map(({ key, label, color }) => (
                        <div key={key} className={`text-center p-2.5 rounded-xl border ${color}`}>
                          <p className="text-xl font-black">{overview.queue?.[key] || 0}</p>
                          <p className="text-[10px] font-medium mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI by Feature */}
                  <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
                    <h3 className="font-bold text-[#1e293b] mb-3 flex items-center gap-2">
                      <Sparkles size={18} className="text-[#FF9F4A]" />
                      استخدام AI حسب الأداة
                    </h3>
                    <div className="space-y-2">
                      {overview.aiByFeature.map((item) => (
                        <div key={item.feature} className="flex items-center justify-between">
                          <span className="text-xs text-[#475569]">
                            {featureLabels[item.feature] || item.feature}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#FF9F4A] to-[#FF8C2E] rounded-full"
                                style={{ width: `${Math.min((item.usage / (overview.aiByFeature[0]?.usage || 1)) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-[#1e293b] w-8 text-left">{item.usage}</span>
                          </div>
                        </div>
                      ))}
                      {overview.aiByFeature.length === 0 && (
                        <p className="text-xs text-[#94a3b8] text-center py-2">لا يوجد استخدام مسجل</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Top Active Users */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
                <h3 className="font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                  <Users size={18} className="text-[#FF9F4A]" />
                  أكثر الموظفين نشاطاً
                  <span className="text-xs font-normal text-[#94a3b8] mr-auto">انقر على موظف لعرض تفاصيله</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                          expandedUser === user.id
                            ? 'bg-[#FF9F4A]/5 border-[#FF9F4A]/30'
                            : 'border-transparent hover:bg-[#f8fafc] hover:border-[#e2e8f0]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            idx === 0 ? 'bg-[#FF9F4A]/15 text-[#FF9F4A]' :
                            idx === 1 ? 'bg-sky-100 text-sky-600' :
                            idx === 2 ? 'bg-emerald-100 text-emerald-600' :
                            'bg-[#f1f5f9] text-[#64748b]'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#1e293b]">{user.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-emerald-600 font-medium">
                                📰 {user.approvedCount} نشر
                              </span>
                              <span className="text-[10px] text-[#94a3b8]">·</span>
                              <span className="text-[10px] text-[#FF9F4A] font-medium">
                                🤖 {user.aiUsageCount} AI
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#FF9F4A]">{user.totalActivity}</span>
                          {expandedUser === user.id ? <ChevronUp size={14} className="text-[#94a3b8]" /> : <ChevronDown size={14} className="text-[#94a3b8]" />}
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {expandedUser === user.id && (
                        <div className="mx-2 mb-2 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                          {userStatsLoading ? (
                            <div className="flex justify-center py-2"><LoadingSpinner /></div>
                          ) : userStats ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="bg-white p-2 rounded-lg border border-[#e2e8f0]">
                                  <p className="text-base font-black text-emerald-600">{userStats.approvals.recent}</p>
                                  <p className="text-[9px] text-[#94a3b8]">نشر حديث</p>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-[#e2e8f0]">
                                  <p className="text-base font-black text-sky-600">{userStats.recentAiUsage}</p>
                                  <p className="text-[9px] text-[#94a3b8]">AI حديث</p>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-[#e2e8f0]">
                                  <p className="text-base font-black text-purple-600">{userStats.contentUpdates.recent}</p>
                                  <p className="text-[9px] text-[#94a3b8]">تحريرات</p>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-[#e2e8f0]">
                                  <p className="text-base font-black text-rose-500">{userStats.rejections.recent}</p>
                                  <p className="text-[9px] text-[#94a3b8]">مرفوض</p>
                                </div>
                              </div>
                              {userStats.aiUsage.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {userStats.aiUsage.map(ai => (
                                    <span key={ai.feature} className="text-[10px] bg-white border border-[#e2e8f0] px-2 py-0.5 rounded-md text-[#64748b]">
                                      {featureLabels[ai.feature] || ai.feature} <span className="font-bold text-[#FF9F4A]">×{ai.recentUsage}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-[#94a3b8] text-center py-1">لا توجد تفاصيل</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {overview.topUsers.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-[#94a3b8]">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">لا يوجد نشاط مسجل للموظفين</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
