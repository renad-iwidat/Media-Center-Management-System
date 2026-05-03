import React from 'react';
import { ClipboardList, CheckSquare, Eye, Share2 } from 'lucide-react';

export const Dashboard = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="الطلبات الكلية" 
        value="128" 
        change="+12%" 
        icon={<ClipboardList size={24} />} 
        color="blue"
      />
      <StatCard 
        title="المهام النشطة" 
        value="34" 
        change="قيد التنفيذ" 
        icon={<CheckSquare size={24} />} 
        color="orange"
      />
      <StatCard 
        title="مشاهدات الأرشيف" 
        value="8,294" 
        change="هذا الأسبوع" 
        icon={<Eye size={24} />} 
        color="purple"
      />
      <StatCard 
        title="المحتوى المنشور" 
        value="512" 
        change="مكتمل" 
        icon={<Share2 size={24} />} 
        color="green"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-[#0b1224] rounded-2xl border border-white/5 flex flex-col">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold">آخر الإشعارات</h3>
          <button className="text-xs text-[#2563eb] hover:underline">قراءة الكل</button>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <NotificationItem title="تم تعيين مهمة جديدة" time="منذ دقيقتين" msg="تم تعيينك لتصوير فعالية التخرج في قاعة الأمير تركي." active />
          <NotificationItem title="تحديث حالة الطلب #402" time="منذ ساعة" msg={`تم تغيير حالة "إنتاج فيديو تعريفي" إلى مرحلة المونتاج.`} />
          <NotificationItem title="تم رفع محتوى جديد" time="منذ ٤ ساعات" msg="قام الموظف أحمد مقادي برفع صور فعالية يوم البحث العلمي." />
        </div>
      </div>

      <div className="bg-[#0b1224] rounded-2xl border border-white/5 flex flex-col p-6 space-y-6">
        <h3 className="font-bold">حالة النظام</h3>
        <div className="space-y-4">
          <StatusProgress label="سيرفر البيانات" status="نشط" color="green" percent={94} />
          <StatusProgress label="مساحة التخزين" status="82%" color="orange" percent={82} />
          <StatusProgress label="جلسات المستخدمين" status="14 متصل" color="blue" percent={45} />
        </div>
        <div className="pt-4 mt-auto border-t border-white/5">
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-2">
            <p className="text-xs font-bold text-blue-400">تحديث جديد متوفر v2.4.0</p>
            <p className="text-[10px] text-[#9ca3af]">يحتوي هذا التحديث على تحسينات في سرعة رفع الملفات الكبيرة.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, change, icon, color }: any) => {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
    green: 'text-green-500 bg-green-500/10',
  };
  return (
    <div className="bg-[#0b1224] p-5 rounded-2xl border border-white/5 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
        <span className={`text-[10px] font-bold ${colors[color]} px-2 py-1 rounded-full`}>{change}</span>
      </div>
      <div className="text-2xl font-mono font-bold text-white">{value}</div>
      <div className="text-sm text-[#9ca3af]">{title}</div>
    </div>
  );
};

const NotificationItem = ({ title, time, msg, active }: any) => (
  <div className={`flex gap-4 p-4 rounded-xl items-start transition-colors ${active ? 'bg-white/5' : 'hover:bg-white/5'}`}>
    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${active ? 'bg-blue-500' : 'bg-transparent'}`}></div>
    <div className="flex-1 space-y-1 text-right">
      <div className="flex justify-between flex-row-reverse">
        <p className="text-sm font-bold text-white">{title}</p>
        <span className="text-[10px] text-[#9ca3af]">{time}</span>
      </div>
      <p className="text-xs text-[#9ca3af]">{msg}</p>
    </div>
  </div>
);

const StatusProgress = ({ label, status, color, percent }: any) => {
  const colors: any = {
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
  };
  const textColors: any = {
    green: 'text-green-500',
    orange: 'text-orange-500',
    blue: 'text-blue-500',
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-[#9ca3af]">{label}</span>
        <span className={`${textColors[color]} font-medium`}>{status}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
};
export const Orders = () => <Placeholder title="الطلبات" />;
export const Tasks = () => <Placeholder title="المهام" />;
export const Shootings = () => <Placeholder title="التصوير" />;
export const Content = () => <Placeholder title="المحتوى والأرشيف" />;
export const Programs = () => <Placeholder title="البرامج والحلقات" />;
export const Departments = () => <Placeholder title="الأقسام والفرق" />;
export const Users = () => <Placeholder title="إدارة المستخدمين" />;
export const Permissions = () => <Placeholder title="الصلاحيات" />;
export const NotificationsPage = () => <Placeholder title="الإشعارات" />;

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
      <span className="text-3xl">🏗️</span>
    </div>
    <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
    <p className="text-gray-500 max-w-md">هذه الصفحة ستكون متاحة في المراحل القادمة من المشروع.</p>
  </div>
);
